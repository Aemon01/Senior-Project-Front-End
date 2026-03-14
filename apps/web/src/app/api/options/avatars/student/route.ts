import { NextResponse } from "next/server";

const ALLOWED_MODELS = new Set([
  "student-avatars/avatar0.glb",
  "student-avatars/avatar2.glb",
  "student-avatars/avatar4.glb",
  "student-avatars/avatar6.glb",
]);

function normalizeModel(model: string) {
  return (model || "").trim().replace(/^\/+/, "");
}

export async function GET() {
  try {
    const baseUrl = process.env.BACKEND_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { ok: false, message: "BACKEND_URL is not set" },
        { status: 500 }
      );
    }

    const r = await fetch(`${baseUrl}/auth/avatar/all`, { cache: "no-store" });
    if (!r.ok) {
      const t = await r.text();
      return new NextResponse(t, { status: r.status });
    }

    const rows = await r.json();
    const assetsBase = process.env.ASSETS_PUBLIC_BASE || "";

    const items = (Array.isArray(rows) ? rows : [])
      .map((x: any) => {
        const id = String(x.avatar_id ?? x.id ?? "");
        const raw = String(x.avatar_model ?? x.model ?? "");
        const model = normalizeModel(raw);
        const unlockLevel = Number(x.unlock_level ?? 0);
        return { id, model, unlockLevel };
      })
      .filter((it: any) => it.id && it.model && ALLOWED_MODELS.has(it.model))
      .map((it: any) => ({
        id: it.id,
        modelUrl: `${assetsBase}/${it.model}`,
        unlockLevel: it.unlockLevel,
      }));

    return NextResponse.json(items);
  } catch (e: any) {
    console.error("GET /api/options/avatars/student ERROR:", e);
    return NextResponse.json({ ok: false, message: "failed" }, { status: 500 });
  }
}