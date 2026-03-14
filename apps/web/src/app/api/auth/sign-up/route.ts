import { NextResponse } from "next/server";
import {
  SignUpCommand,
  ResendConfirmationCodeCommand,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import crypto from "crypto";
import { cognito, secretHash } from "@/lib/auth/cognito";

function getAttr(user: any, key: string) {
  return user?.UserAttributes?.find((a: any) => a.Name === key)?.Value ?? null;
}

export async function POST(req: Request) {
  const body = await req.json();

  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const role = body?.role as "student" | "employee";

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, message: "missing email/password" },
      { status: 400 }
    );
  }
  if (role !== "student" && role !== "employee") {
    return NextResponse.json({ ok: false, message: "invalid role" }, { status: 400 });
  }

  try {
    // สมัครใหม่ (ครั้งแรกจริง ๆ)
    let generatedOrgId: string | undefined;

    const attrs: { Name: string; Value: string }[] = [
      { Name: "email", Value: email },
      { Name: "custom:role", Value: role },
    ];

    if (role === "employee") {
      generatedOrgId = crypto.randomUUID();
      attrs.push({ Name: "custom:orgId", Value: generatedOrgId });
    }

    // ✅ สมัคร Cognito
    const signUpRes = await cognito.send(
      new SignUpCommand({
        ClientId: process.env.COGNITO_CLIENT_ID!,
        Username: email,
        Password: password,
        SecretHash: secretHash(email),
        UserAttributes: attrs,
      })
    );

    // ✅ Cognito sub (สำคัญ)
    const cognitoUserId = signUpRes.UserSub;
    if (!cognitoUserId) {
      return NextResponse.json(
        { ok: false, message: "Missing Cognito UserSub" },
        { status: 500 }
      );
    }

    // ✅ สร้าง row ในตาราง users ของ backend ตั้งแต่ตอนสมัคร (pending)
    // ต้องมี BACKEND_URL ใน .env.local เช่น https://vcep-platform.duckdns.org
    try {
      const backendUrl = process.env.BACKEND_URL!;
      if (!backendUrl) throw new Error("BACKEND_URL not set");

      const r = await fetch(`${backendUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // บาง backend ไม่รับ user_id ใน model -> ไม่เป็นไร (จะ ignore)
          // แต่ backend ควร map users.user_id = cognito_user_id เพื่อให้ students FK ผ่าน
          user_id: cognitoUserId,
          cognito_user_id: cognitoUserId,
          email,
          is_email_verified: false,
          role,
          status: "pending",
        }),
      });

      // ถ้า backend ตอบ error ให้แสดง detail จะได้ debug ง่าย
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        return NextResponse.json(
          {
            ok: false,
            message: "Backend /auth/register failed",
            detail: t,
          },
          { status: 500 }
        );
      }
    } catch (err: any) {
      return NextResponse.json(
        {
          ok: false,
          message: "Failed to create user row in backend",
          detail: err?.message || String(err),
        },
        { status: 500 }
      );
    }

    // ✅ สมัครใหม่สำเร็จ => ไป confirm-email
    return NextResponse.json({
      ok: true,
      action: "confirm",
      role,
      orgId: generatedOrgId,
    });
  } catch (e: any) {
    const name = e?.name || e?.__type;

    // ✅ ถ้าอีเมลนี้มีอยู่แล้ว
    if (name === "UsernameExistsException") {
      try {
        const user = await cognito.send(
          new AdminGetUserCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID!,
            Username: email,
          })
        );

        const status = user.UserStatus; // UNCONFIRMED | CONFIRMED | ...
        const existingRole =
          (getAttr(user, "custom:role") as "student" | "employee" | null) ?? "student";

        // ✅ ยังไม่ confirm -> resend แล้วไป confirm-email
        if (status !== "CONFIRMED") {
          try {
            await cognito.send(
              new ResendConfirmationCodeCommand({
                ClientId: process.env.COGNITO_CLIENT_ID!,
                Username: email,
                SecretHash: secretHash(email),
              })
            );
          } catch {
            // resend fail ไม่เป็นไร
          }

          return NextResponse.json(
            {
              ok: false,
              action: "confirm",
              role: existingRole,
              message:
                existingRole === "student"
                  ? "This email was registered as Student. Please confirm your email."
                  : "This email was registered as Organization. Please confirm your email.",
            },
            { status: 409 }
          );
        }

        // ✅ confirm แล้ว -> ไป login
        return NextResponse.json(
          {
            ok: false,
            action: "login",
            role: existingRole,
            message: "Account already confirmed. Please sign in.",
          },
          { status: 409 }
        );
      } catch {
        // fallback
        try {
          await cognito.send(
            new ResendConfirmationCodeCommand({
              ClientId: process.env.COGNITO_CLIENT_ID!,
              Username: email,
              SecretHash: secretHash(email),
            })
          );
        } catch {}

        return NextResponse.json(
          {
            ok: false,
            action: "confirm",
            message: "Account may already exist. Please confirm your email (or resend code).",
          },
          { status: 409 }
        );
      }
    }

    const message = e?.message || "Sign up failed";
    const status =
      name === "InvalidPasswordException" || name === "InvalidParameterException" ? 400 : 500;

    return NextResponse.json({ ok: false, name, message }, { status });
  }
}