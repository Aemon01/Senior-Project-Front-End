import { NextResponse } from "next/server";
import {
  ConfirmSignUpCommand,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { cognito, secretHash } from "@/lib/auth/cognito";

function getAttr(user: any, key: string) {
  return user?.UserAttributes?.find((a: any) => a.Name === key)?.Value ?? null;
}

async function fetchUserFromCognito(username: string) {
  const user = await cognito.send(
    new AdminGetUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      Username: username,
    })
  );

  const role = getAttr(user, "custom:role") ?? "student";
  const orgId = getAttr(user, "custom:orgId");
  const sub = getAttr(user, "sub") || user.Username;

  return { role, orgId, sub };
}

async function findBackendUserId(params: {
  email: string;
  cognito_user_id: string;
}) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return {
      ok: false as const,
      status: 500,
      detail: "BACKEND_URL not set",
    };
  }

  try {
    const res = await fetch(`${backendUrl}/auth/all`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const text = await res.text().catch(() => "");

    if (!res.ok) {
      return {
        ok: false as const,
        status: res.status,
        detail: text || res.statusText,
      };
    }

    let users: any[] = [];
    try {
      users = JSON.parse(text);
    } catch {
      return {
        ok: false as const,
        status: 500,
        detail: "Invalid JSON from /auth/all",
      };
    }

    const found =
      users.find(
        (u) =>
          String(u?.email || "").toLowerCase() === params.email.toLowerCase() ||
          String(u?.cognito_user_id || "") === params.cognito_user_id
      ) ?? null;

    if (!found?.user_id) {
      return {
        ok: false as const,
        status: 404,
        detail: "User not found in backend /auth/all",
      };
    }

    return {
      ok: true as const,
      user_id: String(found.user_id),
    };
  } catch (e: any) {
    return {
      ok: false as const,
      status: 500,
      detail: e?.message || "Failed to fetch /auth/all",
    };
  }
}

async function updateUserToBackend(payload: {
  user_id: string;
  cognito_user_id: string;
  email: string;
  is_email_verified: boolean;
  role: string;
  status: "active";
}) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return {
      ok: false as const,
      status: 500,
      detail: "BACKEND_URL not set",
    };
  }

  try {
    const { user_id, ...bodyPayload } = payload;

    const res = await fetch(
      `${backendUrl}/auth/user/${encodeURIComponent(user_id)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
        cache: "no-store",
      }
    );

    const text = await res.text().catch(() => "");

    if (!res.ok) {
      return {
        ok: false as const,
        status: res.status,
        detail: text || res.statusText,
      };
    }

    return {
      ok: true as const,
      status: res.status,
      detail: text,
    };
  } catch (e: any) {
    return {
      ok: false as const,
      status: 500,
      detail: e?.message || "fetch to backend failed",
    };
  }
}

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    const em = String(email || "").trim().toLowerCase();
    const otp = String(code || "").trim();

    if (!em || !otp) {
      return NextResponse.json(
        { ok: false, code: "MISSING", message: "missing email/code" },
        { status: 400 }
      );
    }

    try {
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

      const alreadyConfirmed =
        name === "NotAuthorizedException" &&
        /status is CONFIRMED/i.test(message);

      if (!alreadyConfirmed) {
        const status =
          name === "ExpiredCodeException" ||
          name === "CodeMismatchException" ||
          name === "InvalidParameterException" ||
          name === "NotAuthorizedException"
            ? 400
            : 500;

        const errorCode =
          name === "ExpiredCodeException"
            ? "EXPIRED_CODE"
            : name === "CodeMismatchException"
            ? "CODE_MISMATCH"
            : "CONFIRM_FAILED";

        console.error("COGNITO_CONFIRM_FAILED", {
          email: em,
          code: errorCode,
          name,
          message,
        });

        return NextResponse.json(
          { ok: false, code: errorCode, name, message },
          { status }
        );
      }
    }

    const { role, orgId, sub } = await fetchUserFromCognito(em);

    if (!sub) {
      console.error("MISSING_SUB", { email: em });

      return NextResponse.json(
        { ok: false, code: "MISSING_SUB", message: "Missing Cognito sub" },
        { status: 500 }
      );
    }

    const foundUser = await findBackendUserId({
      email: em,
      cognito_user_id: sub,
    });

    if (!foundUser.ok) {
      console.error("BACKEND_FIND_USER_FAILED", {
        email: em,
        cognito_user_id: sub,
        detail: foundUser.detail,
        status: foundUser.status,
      });

      return NextResponse.json(
        {
          ok: false,
          code: "BACKEND_FIND_USER_FAILED",
          message: "Failed to find backend user before update",
          detail: foundUser.detail,
        },
        { status: foundUser.status }
      );
    }

    const backendResult = await updateUserToBackend({
      user_id: foundUser.user_id,
      cognito_user_id: sub,
      email: em,
      is_email_verified: true,
      role,
      status: "active",
    });

    if (!backendResult.ok) {
      console.error("BACKEND_CONFIRM_UPDATE_FAILED", {
        user_id: foundUser.user_id,
        cognito_user_id: sub,
        email: em,
        detail: backendResult.detail,
        status: backendResult.status,
      });

      return NextResponse.json(
        {
          ok: false,
          code: "BACKEND_CONFIRM_UPDATE_FAILED",
          message: "Failed to update user in backend after confirm",
          detail: backendResult.detail,
        },
        { status: backendResult.status }
      );
    }

    console.log("CONFIRM_EMAIL_SUCCESS", {
      user_id: foundUser.user_id,
      cognito_user_id: sub,
      email: em,
      role,
      status: "active",
    });

    return NextResponse.json({
      ok: true,
      role,
      orgId,
    });
  } catch (e: any) {
    console.error("CONFIRM_FAILED_UNHANDLED", {
      name: e?.name || "Error",
      message: e?.message || "Confirm failed",
    });

    return NextResponse.json(
      {
        ok: false,
        code: "CONFIRM_FAILED",
        name: e?.name || "Error",
        message: e?.message || "Confirm failed",
      },
      { status: 500 }
    );
  }
}