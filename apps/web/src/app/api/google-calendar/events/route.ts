import { NextResponse } from "next/server";
import { decodeJwt } from "jose";
import path from "path";
import { Pool } from "pg";
import { existsSync, readFileSync } from "fs";

export const runtime = "nodejs";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "vcep_session";
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
      const parsed = JSON.parse(raw) as { idToken?: string };
      if (parsed?.idToken) return parsed;
    } catch {}
  }
  const idToken = readCookie(cookieHeader, "vcep_id");
  if (!idToken) return null;
  return { idToken };
}

async function findCurrentUser(cognitoUserId: string) {
  const q = await pool.query(
    `select user_id, email, email_calendar_refresh_token
       from public.users
      where cognito_user_id = $1
      limit 1`,
    [cognitoUserId]
  );
  return q.rows[0] ?? null;
}

async function getGoogleAccessToken(refreshToken: string) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET");
  }

  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const json = await r.json();
  if (!r.ok || !json?.access_token) {
    throw new Error(json?.error_description || json?.error || "Failed to refresh Google access token");
  }
  return String(json.access_token);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const timeMin = url.searchParams.get("timeMin");
    const timeMax = url.searchParams.get("timeMax");

    if (!timeMin || !timeMax) {
      return NextResponse.json({ ok: false, message: "timeMin and timeMax are required" }, { status: 400 });
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

    const refreshToken = String(user.email_calendar_refresh_token ?? "").trim();
    if (!refreshToken) {
      return NextResponse.json(
        { ok: false, message: "Google Calendar not connected" },
        { status: 401 }
      );
    }

    const accessToken = await getGoogleAccessToken(refreshToken);
    const calendarId = String(user.email ?? "primary").trim() || "primary";

    const googleUrl = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
    );
    googleUrl.searchParams.set("singleEvents", "true");
    googleUrl.searchParams.set("orderBy", "startTime");
    googleUrl.searchParams.set("timeMin", timeMin);
    googleUrl.searchParams.set("timeMax", timeMax);

    const googleRes = await fetch(googleUrl.toString(), {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    const googleJson = await googleRes.json();
    if (!googleRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: googleJson?.error?.message || "Failed to fetch Google Calendar",
          detail: googleJson,
          calendarId,
        },
        { status: googleRes.status }
      );
    }

    const items = Array.isArray(googleJson?.items)
      ? googleJson.items.map((item: any) => ({
          id: String(item?.id ?? ""),
          title: String(item?.summary ?? "Google event"),
          startAt: item?.start?.dateTime ?? item?.start?.date ?? "",
          endAt: item?.end?.dateTime ?? item?.end?.date ?? "",
        }))
      : [];

    return NextResponse.json({ ok: true, calendarId, items });
  } catch (e: any) {
  console.error("[google-calendar/events]", e);
  return NextResponse.json(
    { ok: false, message: e?.message || "Unexpected error" },
    { status: 500 }
  );
  }
}
