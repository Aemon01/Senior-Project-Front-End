import { NextResponse } from "next/server";
import { decodeJwt } from "jose";
import { Pool } from "pg";
import fs from "fs";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "vcep_session";
const DATABASE_URL = process.env.DATABASE_URL!;
const PGSSL_CA_PATH = process.env.PGSSL_CA_PATH; // เช่น ./certs/ca.pem

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  const found = parts.find((p) => p.startsWith(name + "="));
  if (!found) return null;
  const v = found.slice(name.length + 1);
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

function getSessionTokens(req: Request) {
  const raw = readCookie(req.headers.get("cookie"), COOKIE_NAME);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as {
      idToken?: string;
      accessToken?: string;
      refreshToken?: string;
    };
  } catch {
    return null;
  }
}

// ✅ Pool ทำเป็น singleton กันเปิด connection ซ้ำตอน dev
declare global {
  // eslint-disable-next-line no-var
  var __vcepPool: Pool | undefined;
}

function getPool() {
  if (global.__vcepPool) return global.__vcepPool;

  const ssl =
    PGSSL_CA_PATH && fs.existsSync(PGSSL_CA_PATH)
      ? { ca: fs.readFileSync(PGSSL_CA_PATH).toString() }
      : { rejectUnauthorized: false }; // fallback สำหรับบาง env

  global.__vcepPool = new Pool({
    connectionString: DATABASE_URL,
    ssl,
  });

  return global.__vcepPool;
}

export async function GET(req: Request) {
  try {
    const sess = getSessionTokens(req);
    const idToken = sess?.idToken;

    if (!idToken) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = decodeJwt(idToken);
    const user_id = payload.sub as string | undefined;
    const role = (payload["custom:role"] as string) || "student";

    if (!user_id) {
      return NextResponse.json({ ok: false, message: "Invalid token" }, { status: 401 });
    }

    // ✅ ถ้าเป็น employee คุณค่อยไป query ตาราง employees/org เพิ่มภายหลังได้
    if (role !== "student") {
      return NextResponse.json({
        ok: true,
        role,
        user_id,
        is_profile_complete: false,
      });
    }

    const pool = getPool();

    const q = `
      SELECT is_profile_complete
      FROM students
      WHERE user_id = $1
      LIMIT 1
    `;

    const result = await pool.query(q, [user_id]);
    const row = result.rows?.[0];

    return NextResponse.json({
      ok: true,
      role,
      user_id,
      is_profile_complete: row?.is_profile_complete === true,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || "Server error" },
      { status: 500 }
    );
  }
}