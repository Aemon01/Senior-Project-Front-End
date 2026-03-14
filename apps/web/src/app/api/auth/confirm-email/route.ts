import { NextResponse } from "next/server";
import {
  ConfirmSignUpCommand,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { cognito, secretHash } from "@/lib/auth/cognito";

function getAttr(user: any, key: string) {
  return user?.UserAttributes?.find((a: any) => a.Name === key)?.Value ?? null;
}

async function fetchRoleAndOrgId(username: string) {
  const user = await cognito.send(
    new AdminGetUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      Username: username,
    })
  );

  const role = getAttr(user, "custom:role"); // "student" | "employee"
  const orgId = getAttr(user, "custom:orgId"); // อาจมีเฉพาะ employee

  return { role, orgId };
}

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    const em = (email || "").trim().toLowerCase();
    const otp = String(code || "").trim();

    if (!em || !otp) {
      return NextResponse.json(
        { ok: false, code: "MISSING", message: "missing email/code" },
        { status: 400 }
      );
    }

    try {
      // 1) confirm code
      await cognito.send(
        new ConfirmSignUpCommand({
          ClientId: process.env.COGNITO_CLIENT_ID!,
          Username: em,
          ConfirmationCode: otp,
          SecretHash: secretHash(em),
        })
      );
    } catch (e: any) {
      const name = e?.name || e?.__type;
      const message = e?.message || "Confirm failed";

      // ✅ user confirmed already => allow continue (still need to fetch role)
      if (!(name === "NotAuthorizedException" && /status is CONFIRMED/i.test(message))) {
        const status =
          name === "ExpiredCodeException" ||
          name === "CodeMismatchException" ||
          name === "InvalidParameterException" ||
          name === "NotAuthorizedException"
            ? 400
            : 500;

        const code =
          name === "ExpiredCodeException"
            ? "EXPIRED_CODE"
            : name === "CodeMismatchException"
            ? "CODE_MISMATCH"
            : "CONFIRM_FAILED";

        return NextResponse.json({ ok: false, code, name, message }, { status });
      }
    }

    // 2) ✅ fetch REAL role from Cognito
    const { role, orgId } = await fetchRoleAndOrgId(em);

    return NextResponse.json({
      ok: true,
      role, // "student" | "employee"
      orgId,
    });
  } catch (e: any) {
    const name = e?.name || e?.__type;
    const message = e?.message || "Confirm failed";
    return NextResponse.json({ ok: false, code: "CONFIRM_FAILED", name, message }, { status: 500 });
  }
}