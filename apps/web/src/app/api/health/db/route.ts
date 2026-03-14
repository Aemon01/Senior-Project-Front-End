import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  const r = await pool.query("select now() as now");
  return NextResponse.json({ ok: true, now: r.rows[0].now });
}