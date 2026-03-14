import { NextResponse } from "next/server";
import { ResendConfirmationCodeCommand } from "@aws-sdk/client-cognito-identity-provider";
import { cognito, secretHash } from "@/lib/auth/cognito";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const em = (email || "").trim().toLowerCase();
    if (!em) return NextResponse.json({ ok: false, code: "MISSING_EMAIL" }, { status: 400 });

    await cognito.send(
      new ResendConfirmationCodeCommand({
        ClientId: process.env.COGNITO_CLIENT_ID!,
        Username: em,
        SecretHash: secretHash(em),
      })
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const name = e?.name || e?.__type;
    const message = e?.message || "Resend failed";

    //  ถ้าผู้ใช้ยืนยันแล้ว ให้ถือว่า ok (กัน UX พัง)
    if (name === "NotAuthorizedException" && /CONFIRMED/i.test(message)) {
      return NextResponse.json({ ok: true, alreadyConfirmed: true });
    }

    return NextResponse.json({ ok: false, name, message }, { status: 500 });
  }
}