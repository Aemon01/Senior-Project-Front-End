import { NextResponse } from "next/server";
import { InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import { decodeJwt } from "jose";
import { cognito, secretHash } from "@/lib/auth/cognito";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const em = (email || "").trim().toLowerCase();

  if (!em || !password) {
    return NextResponse.json({ code: "MISSING", message: "missing" }, { status: 400 });
  }

  try {
    const res = await cognito.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: process.env.COGNITO_CLIENT_ID!,
        AuthParameters: {
          USERNAME: em,
          PASSWORD: password,
          SECRET_HASH: secretHash(em),
        },
      })
    );

    // ✅ เคสถูก invite: ต้องตั้งรหัสใหม่ก่อน
    if (res.ChallengeName === "NEW_PASSWORD_REQUIRED") {
      return NextResponse.json(
        {
          ok: false,
          challenge: "NEW_PASSWORD_REQUIRED",
          session: res.Session,   // สำคัญ: ส่ง session กลับไป
          username: em,
        },
        { status: 200 }
      );
    }

    const idToken = res.AuthenticationResult?.IdToken;
    const accessToken = res.AuthenticationResult?.AccessToken;
    const refreshToken = res.AuthenticationResult?.RefreshToken;

    if (!idToken || !accessToken) {
      return NextResponse.json({ code: "LOGIN_FAILED", message: "login failed" }, { status: 401 });
    }

    const payload = decodeJwt(idToken);
    const role = (payload["custom:role"] as string) ?? "student";

    const response = NextResponse.json({ ok: true, role });

    response.cookies.set("vcep_access", accessToken, {
      httpOnly: true,
      secure: process.env.AUTH_COOKIE_SECURE === "true",
      sameSite: "lax",
      path: "/",
    });

    response.cookies.set("vcep_id", idToken, {
      httpOnly: true,
      secure: process.env.AUTH_COOKIE_SECURE === "true",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (err: any) {
    const name = err?.name;

    if (name === "UserNotConfirmedException") {
      return NextResponse.json({ code: "USER_NOT_CONFIRMED", message: "Email not confirmed" }, { status: 403 });
    }

    if (name === "NotAuthorizedException" || name === "UserNotFoundException") {
      return NextResponse.json({ code: "INVALID_CREDENTIALS", message: "Email or password is incorrect" }, { status: 401 });
    }

    return NextResponse.json({ code: "COGNITO_ERROR", message: name ?? "Login failed" }, { status: 500 });
  }
}