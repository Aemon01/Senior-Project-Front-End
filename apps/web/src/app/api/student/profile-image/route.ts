import { NextResponse } from "next/server";
import { decodeJwt } from "jose";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "vcep_session";
const S3_BUCKET = process.env.S3_BUCKET!;
const S3_REGION =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  "ap-southeast-2";

const S3_PUBLIC_BASE_URL =
  process.env.S3_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL ||
  `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

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
  const cookieHeader = req.headers.get("cookie");

  const raw = readCookie(cookieHeader, COOKIE_NAME);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as {
        idToken?: string;
        accessToken?: string;
      };
      if (parsed?.idToken) return parsed;
    } catch {}
  }

  const idToken = readCookie(cookieHeader, "vcep_id");
  if (!idToken) return null;

  return { idToken };
}

const s3 = new S3Client({
  region: S3_REGION,
});

export async function POST(req: Request) {
  try {
    const sess = getSessionTokens(req);
    const idToken = sess?.idToken;

    if (!idToken) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const jwt = decodeJwt(idToken);
    const cognitoUserId = jwt.sub;

    if (!cognitoUserId) {
      return NextResponse.json(
        { ok: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, message: "File is required" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { ok: false, message: "Only image files are allowed" },
        { status: 400 }
      );
    }

    const key = `student-profiles/${cognitoUserId}/profile.png`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: "image/png",
        CacheControl: "no-cache, no-store, must-revalidate",
      })
    );

    const version = Date.now();
    const url = `${S3_PUBLIC_BASE_URL.replace(/\/+$/, "")}/${key}?v=${version}`;

    return NextResponse.json({
      ok: true,
      key,
      url,
      version,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || "Upload failed" },
      { status: 500 }
    );
  }
}