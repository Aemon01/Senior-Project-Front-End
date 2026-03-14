import { NextResponse } from "next/server";
import { RespondToAuthChallengeCommand } from "@aws-sdk/client-cognito-identity-provider";
import { cognito, secretHash } from "@/lib/auth/cognito";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const newPassword = String(body?.newPassword || "");
    const session = String(body?.session || "");

    

    if (!email || !newPassword || !session) {
      return NextResponse.json({ ok: false, message: "missing fields" }, { status: 400 });
    }

    const resp = await cognito.send(new RespondToAuthChallengeCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      ChallengeName: "NEW_PASSWORD_REQUIRED",
      Session: session,
      ChallengeResponses: {
        USERNAME: email,
        NEW_PASSWORD: newPassword,
        SECRET_HASH: secretHash(email), // คุณมีฟังก์ชันนี้แล้วใน lib/auth/cognito
      },
    }));


    // TODO: เซ็ต cookie session ของคุณเหมือน login สำเร็จ (ใช้ tokens จาก resp.AuthenticationResult)

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.name ?? "new password failed" }, { status: 500 });
  }
}