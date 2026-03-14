import { NextResponse } from "next/server";
import { decodeJwt } from "jose";

const BACKEND = process.env.BACKEND_URL!;

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

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ อ่าน token จาก cookie ที่แยกแล้ว
    const cookieHeader = req.headers.get("cookie");
    const idToken = readCookie(cookieHeader, "vcep_id");
    const accessToken = readCookie(cookieHeader, "vcep_access");

    if (!idToken || !accessToken) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized (missing token cookie)" },
        { status: 401 }
      );
    }

    const payload = decodeJwt(idToken);
    const userId = payload.sub;
    if (!userId) {
      return NextResponse.json({ ok: false, message: "Invalid token" }, { status: 401 });
    }

    const toBackend = { ...body, user_id: userId };

    const r = await fetch(`${BACKEND}/student`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`, // ✅ ใช้ accessToken เป็นหลัก
      },
      body: JSON.stringify(toBackend),
    });

    const text = await r.text();
    if (!r.ok) {
      return NextResponse.json(
        { ok: false, message: "Backend error", detail: text },
        { status: r.status }
      );
    }

    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || "Server error" },
      { status: 500 }
    );
  }
}