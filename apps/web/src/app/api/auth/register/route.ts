import { NextResponse } from "next/server";
import {
  SignUpCommand,
  ResendConfirmationCodeCommand,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import crypto from "crypto";
import { cognito, secretHash } from "@/lib/auth/cognito";

const ALLOWED_ROLES = ["student", "employee", "user"] as const;
type UserRole = (typeof ALLOWED_ROLES)[number];

function getAttr(user: any, key: string) {
  return user?.UserAttributes?.find((a: any) => a.Name === key)?.Value ?? null;
}

function isAllowedRole(role: string): role is UserRole {
  return ALLOWED_ROLES.includes(role as UserRole);
}

async function upsertUserToBackend(payload: {
  user_id: string;
  cognito_user_id: string;
  email: string;
  is_email_verified: boolean;
  role: string;
  status: "pending" | "active";
}) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error("BACKEND_URL not set");
  }

  const res = await fetch(`${backendUrl}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Backend /auth/register failed: ${detail || res.statusText}`);
  }

  return res;
}

export async function POST(req: Request) {
  const body = await req.json();

  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const roleRaw = String(body?.role || "").trim().toLowerCase();

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, message: "missing email/password" },
      { status: 400 }
    );
  }

  if (!isAllowedRole(roleRaw)) {
    return NextResponse.json(
      { ok: false, message: "invalid role" },
      { status: 400 }
    );
  }

  const role: UserRole = roleRaw;

  try {
    let generatedOrgId: string | undefined;

    const attrs: { Name: string; Value: string }[] = [
      { Name: "email", Value: email },
      { Name: "custom:role", Value: role },
    ];

    if (role === "employee") {
      generatedOrgId = crypto.randomUUID();
      attrs.push({ Name: "custom:orgId", Value: generatedOrgId });
    }

    const signUpRes = await cognito.send(
      new SignUpCommand({
        ClientId: process.env.COGNITO_CLIENT_ID!,
        Username: email,
        Password: password,
        SecretHash: secretHash(email),
        UserAttributes: attrs,
      })
    );

    const cognitoUserId = signUpRes.UserSub;
    if (!cognitoUserId) {
      return NextResponse.json(
        { ok: false, message: "Missing Cognito UserSub" },
        { status: 500 }
      );
    }

    await upsertUserToBackend({
      user_id: cognitoUserId,
      cognito_user_id: cognitoUserId,
      email,
      is_email_verified: false,
      role,
      status: "pending",
    });

    return NextResponse.json({
      ok: true,
      action: "confirm",
      role,
      orgId: generatedOrgId,
    });
  } catch (e: any) {
    const name = e?.name || e?.__type;

    if (name === "UsernameExistsException") {
      try {
        const user = await cognito.send(
          new AdminGetUserCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID!,
            Username: email,
          })
        );

        const status = user.UserStatus;
        const existingRole = (getAttr(user, "custom:role") as string | null) ?? "user";
        const sub = user.Username || getAttr(user, "sub");

        if (sub) {
          try {
            await upsertUserToBackend({
              user_id: sub,
              cognito_user_id: sub,
              email,
              is_email_verified: status === "CONFIRMED",
              role: existingRole,
              status: status === "CONFIRMED" ? "active" : "pending",
            });
          } catch {
            // ไม่ให้ล้มทั้ง flow ถ้า backend sync ซ้ำไม่ได้
          }
        }

        if (status !== "CONFIRMED") {
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
              role: existingRole,
              message: "This email already exists. Please confirm your email.",
            },
            { status: 409 }
          );
        }

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
        return NextResponse.json(
          {
            ok: false,
            action: "confirm",
            message: "Account may already exist. Please confirm your email.",
          },
          { status: 409 }
        );
      }
    }

    const message = e?.message || "Sign up failed";
    const status =
      name === "InvalidPasswordException" || name === "InvalidParameterException"
        ? 400
        : 500;

    return NextResponse.json({ ok: false, name, message }, { status });
  }
}