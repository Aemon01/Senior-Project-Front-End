import { NextResponse } from "next/server";
import { ForgotPasswordCommand } from "@aws-sdk/client-cognito-identity-provider";
import { cognito, secretHash } from "@/lib/auth/cognito";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const em = (email || "").trim().toLowerCase();
    if (!em) return NextResponse.json({ ok: false, code: "MISSING_EMAIL" }, { status: 400 });

    await cognito.send(
      new ForgotPasswordCommand({
        ClientId: process.env.COGNITO_CLIENT_ID!,
        Username: em,
        SecretHash: secretHash(em),
      })
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const name = e?.name || e?.__type;
    const message = e?.message || "Forgot password failed";

    // กัน user enumeration (ถ้าเปิด prevent user existence errors)
    // ให้ UX เหมือนส่งสำเร็จ แม้ user ไม่มีอยู่จริง
    if (name === "UserNotFoundException") {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, name, message }, { status: 500 });
  }
}