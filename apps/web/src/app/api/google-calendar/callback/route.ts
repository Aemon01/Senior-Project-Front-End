import { NextResponse } from "next/server";
import { decodeJwt } from "jose";

import path from "path";
import { Pool } from "pg";
import { existsSync, readFileSync } from "fs";

export const runtime = "nodejs";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "vcep_session";
const APP_BASE_URL =
  process.env.APP_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_BASE_URL ||
  "http://localhost:3000";
const GOOGLE_REDIRECT_URI = `${APP_BASE_URL.replace(/\/+$/, "")}/api/google-calendar/callback`;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;


function makePool() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("Missing DATABASE_URL");

  const url = new URL(raw);
  const useSsl = Boolean(url.searchParams.get("sslmode"));

  return new Pool({
    host: url.hostname,
    port: Number(url.port || 5432),
    database: url.pathname.replace(/^\/+/, ""),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });
}

declare global {
  var __vcepGoogleCalendarPool: Pool | undefined;
}

const pool = global.__vcepGoogleCalendarPool || makePool();
if (!global.__vcepGoogleCalendarPool) global.__vcepGoogleCalendarPool = pool;

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  const found = parts.find((p) => p.startsWith(`${name}=`));
  if (!found) return null;
  const raw = found.slice(name.length + 1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function getSessionTokens(req: Request) {
  const cookieHeader = req.headers.get("cookie");

  const raw = readCookie(cookieHeader, COOKIE_NAME);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { idToken?: string; accessToken?: string };
      if (parsed?.idToken) return parsed;
    } catch {}
  }

  const idToken = readCookie(cookieHeader, "vcep_id");
  if (!idToken) return null;
  return { idToken };
}

async function updateRefreshToken(cognitoUserId: string, refreshToken: string) {
  const q = await pool.query(
    `update public.users
        set email_calendar_refresh_token = $2,
            updated_at = now()
      where cognito_user_id = $1
      returning user_id`,
    [cognitoUserId, refreshToken]
  );
  return q.rows[0] ?? null;
}

async function exchangeCodeForTokens(code: string) {
  const body = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_REDIRECT_URI,
    grant_type: "authorization_code",
  });

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const json = await r.json();
  if (!r.ok) {
    throw new Error(json?.error_description || json?.error || "Failed to exchange authorization code");
  }
  return json;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dashboardUrl = new URL("/student/dashboard", APP_BASE_URL);

  try {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const cookieState = readCookie(req.headers.get("cookie"), "google_calendar_oauth_state");

    if (error) {
      dashboardUrl.searchParams.set("google_calendar", "error");
      dashboardUrl.searchParams.set("message", error);
      return NextResponse.redirect(dashboardUrl);
    }

    if (!code) {
      dashboardUrl.searchParams.set("google_calendar", "error");
      dashboardUrl.searchParams.set("message", "Missing authorization code");
      return NextResponse.redirect(dashboardUrl);
    }

    if (!state || !cookieState || state !== cookieState) {
      dashboardUrl.searchParams.set("google_calendar", "error");
      dashboardUrl.searchParams.set("message", "Invalid OAuth state");
      return NextResponse.redirect(dashboardUrl);
    }

    const sess = getSessionTokens(req);
    const idToken = sess?.idToken;
    if (!idToken) {
      dashboardUrl.searchParams.set("google_calendar", "error");
      dashboardUrl.searchParams.set("message", "Unauthorized");
      return NextResponse.redirect(dashboardUrl);
    }

    const jwt = decodeJwt(idToken);
    const cognitoUserId = jwt.sub;
    if (!cognitoUserId) {
      dashboardUrl.searchParams.set("google_calendar", "error");
      dashboardUrl.searchParams.set("message", "Invalid token");
      return NextResponse.redirect(dashboardUrl);
    }

    const tokenJson = await exchangeCodeForTokens(code);
    const refreshToken = String(tokenJson?.refresh_token ?? "").trim();

    if (!refreshToken) {
      dashboardUrl.searchParams.set("google_calendar", "error");
      dashboardUrl.searchParams.set(
        "message",
        "Google did not return a refresh token. Reconnect with consent again."
      );
      return NextResponse.redirect(dashboardUrl);
    }

    const updated = await updateRefreshToken(cognitoUserId, refreshToken);
    if (!updated?.user_id) {
      dashboardUrl.searchParams.set("google_calendar", "error");
      dashboardUrl.searchParams.set("message", "Failed to save Google Calendar token");
      return NextResponse.redirect(dashboardUrl);
    }

    dashboardUrl.searchParams.set("google_calendar", "connected");
    const res = NextResponse.redirect(dashboardUrl);
    res.cookies.set("google_calendar_oauth_state", "", {
      httpOnly: true,
      secure: APP_BASE_URL.startsWith("https://"),
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (e: any) {
  console.error("[google-calendar/callback]", e);
  dashboardUrl.searchParams.set("google_calendar", "error");
  dashboardUrl.searchParams.set("message", e?.message || "Unexpected error");
  return NextResponse.redirect(dashboardUrl);
  }
}
