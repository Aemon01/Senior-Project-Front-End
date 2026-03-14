import { NextResponse } from "next/server";
import { ConfirmForgotPasswordCommand } from "@aws-sdk/client-cognito-identity-provider";
import { cognito, secretHash } from "@/lib/auth/cognito";

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();
    const em = (email || "").trim().toLowerCase();
    const otp = String(code || "").trim();
    const pw = String(newPassword || "");

    if (!em || !otp || !pw) {
      return NextResponse.json({ ok: false, code: "MISSING", message: "missing fields" }, { status: 400 });
    }

    await cognito.send(
      new ConfirmForgotPasswordCommand({
        ClientId: process.env.COGNITO_CLIENT_ID!,
        Username: em,
        ConfirmationCode: otp,
        Password: pw,
        SecretHash: secretHash(em),
      })
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const name = e?.name || e?.__type;
    const message = e?.message || "Reset password failed";

    const status =
      name === "ExpiredCodeException" ||
      name === "CodeMismatchException" ||
      name === "InvalidPasswordException" ||
      name === "InvalidParameterException"
        ? 400
        : 500;

    const code =
      name === "ExpiredCodeException"
        ? "EXPIRED_CODE"
        : name === "CodeMismatchException"
        ? "CODE_MISMATCH"
        : name === "InvalidPasswordException"
        ? "INVALID_PASSWORD"
        : "RESET_FAILED";

    return NextResponse.json({ ok: false, code, name, message }, { status });
  }
}