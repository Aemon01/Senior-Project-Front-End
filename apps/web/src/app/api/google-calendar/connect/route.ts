import { NextResponse } from "next/server";
import { decodeJwt } from "jose";
import path from "path";
import { Pool } from "pg";
import { existsSync, readFileSync } from "fs";
import crypto from "crypto";

export const runtime = "nodejs";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "vcep_session";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const APP_BASE_URL =
  process.env.APP_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_BASE_URL ||
  "http://localhost:3000";
const GOOGLE_REDIRECT_URI = `${APP_BASE_URL.replace(/\/+$/, "")}/api/google-calendar/callback`;
const GOOGLE_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

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

async function findCurrentUser(cognitoUserId: string) {
  const q = await pool.query(
    `select user_id, email from public.users where cognito_user_id = $1 limit 1`,
    [cognitoUserId]
  );
  return q.rows[0] ?? null;
}

export async function GET(req: Request) {
  try {
    if (!GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        { ok: false, message: "Missing GOOGLE_CLIENT_ID" },
        { status: 500 }
      );
    }

    const sess = getSessionTokens(req);
    const idToken = sess?.idToken;
    if (!idToken) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const jwt = decodeJwt(idToken);
    const cognitoUserId = jwt.sub;
    if (!cognitoUserId) {
      return NextResponse.json({ ok: false, message: "Invalid token" }, { status: 401 });
    }

    const user = await findCurrentUser(cognitoUserId);
    if (!user?.user_id) {
      return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
    }

    const state = crypto.randomBytes(24).toString("hex");

    const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    googleUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
    googleUrl.searchParams.set("response_type", "code");
    googleUrl.searchParams.set("scope", GOOGLE_SCOPE);
    googleUrl.searchParams.set("access_type", "offline");
    googleUrl.searchParams.set("prompt", "consent");
    googleUrl.searchParams.set("include_granted_scopes", "true");
    if (user.email) googleUrl.searchParams.set("login_hint", String(user.email));
    googleUrl.searchParams.set("state", state);

    const res = NextResponse.redirect(googleUrl.toString());
    res.cookies.set("google_calendar_oauth_state", state, {
      httpOnly: true,
      secure: APP_BASE_URL.startsWith("https://"),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });
    return res;
  } catch (e: any) {
  console.error("[google-calendar/connect]", e);
  return NextResponse.json(
    { ok: false, message: e?.message || "Unexpected error" },
    { status: 500 }
  );
  }
}
