import { NextResponse } from "next/server";
import { decodeJwt } from "jose";
import { randomUUID } from "crypto";
import { Pool, PoolClient } from "pg";
import fs from "fs";
import http from "http";
import https from "https";

export const runtime = "nodejs";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "vcep_session";
const DATABASE_URL = process.env.DATABASE_URL!;
const BACKEND_URL = process.env.BACKEND_URL!;
const PGSSL_CA_PATH = process.env.PGSSL_CA_PATH;
const BACKEND_CA_PATH = process.env.BACKEND_CA_PATH || process.env.SSL_CERT_FILE || "";
const BACKEND_ALLOW_SELF_SIGNED =
  String(process.env.BACKEND_ALLOW_SELF_SIGNED || "true").toLowerCase() === "true";
const BACKEND_TIMEOUT_MS = Number(process.env.ORG_BACKEND_TIMEOUT_MS || 6000);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

declare global {
  // eslint-disable-next-line no-var
  var __vcepOrganizationPool: Pool | undefined;
}

type AppError = Error & {
  statusCode?: number;
};

function createError(message: string, statusCode = 500): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  return error;
}

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(`${name}=`));
  if (!found) return null;

  const value = found.slice(name.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
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
        refreshToken?: string;
      };

      if (parsed?.idToken) {
        return {
          idToken: parsed.idToken,
          accessToken: parsed.accessToken || "",
          refreshToken: parsed.refreshToken,
        };
      }
    } catch {}
  }

  const idToken = readCookie(cookieHeader, "vcep_id");
  const accessToken = readCookie(cookieHeader, "vcep_access");

  if (!idToken) return null;

  return {
    idToken,
    accessToken: accessToken || "",
  };
}

function stripPgSslParams(connectionString: string) {
  try {
    const url = new URL(connectionString);
    url.searchParams.delete("sslmode");
    url.searchParams.delete("sslcert");
    url.searchParams.delete("sslkey");
    url.searchParams.delete("sslrootcert");
    return url.toString();
  } catch {
    return connectionString
      .replace(/([?&])sslmode=[^&]*/gi, "$1")
      .replace(/([?&])sslcert=[^&]*/gi, "$1")
      .replace(/([?&])sslkey=[^&]*/gi, "$1")
      .replace(/([?&])sslrootcert=[^&]*/gi, "$1")
      .replace(/[?&]$/, "");
  }
}

function getPool() {
  if (global.__vcepOrganizationPool) return global.__vcepOrganizationPool;

  const ssl =
    PGSSL_CA_PATH && fs.existsSync(PGSSL_CA_PATH)
      ? { ca: fs.readFileSync(PGSSL_CA_PATH, "utf8") }
      : { rejectUnauthorized: false };

  global.__vcepOrganizationPool = new Pool({
    connectionString: stripPgSslParams(DATABASE_URL),
    ssl,
  });

  return global.__vcepOrganizationPool;
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringValue(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function parseJsonObject(value: unknown) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function toPublicAssetUrl(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(raw)) return raw;

  const base = (
    String(process.env.ASSETS_PUBLIC_BASE || "").trim() ||
    String(process.env.S3_PUBLIC_BASE_URL || "").trim() ||
    String(process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL || "").trim()
  ).replace(/\/$/, "");

  if (!base) return raw;
  return `${base}/${raw.replace(/^\/+/, "")}`;
}

function buildContact(body: any, fallbackEmail: string) {
  return JSON.stringify({
    email: toStringValue(body?.email, fallbackEmail),
    phone: toStringValue(body?.phone),
    location: toStringValue(body?.location),
    businessType: toStringValue(body?.businessType),
    linkedin: toStringValue(body?.linkedin),
    facebook: toStringValue(body?.facebook),
    instagram: toStringValue(body?.instagram),
    youtube: toStringValue(body?.youtube),
    tiktok: toStringValue(body?.tiktok),
  });
}

function buildSocialLinks(body: any) {
  return JSON.stringify({
    linkedin: toStringValue(body?.linkedin),
    facebook: toStringValue(body?.facebook),
    instagram: toStringValue(body?.instagram),
    youtube: toStringValue(body?.youtube),
    tiktok: toStringValue(body?.tiktok),
  });
}

function normalizeOrg(orgRaw: any, fallbackEmail: string) {
  const contact = parseJsonObject(orgRaw?.contact);
  const social = parseJsonObject(orgRaw?.social_links);

  return {
    orgId: toStringValue(orgRaw?.org_id),
    orgName: toStringValue(orgRaw?.org_name, "Organization"),
    aboutUs: toStringValue(orgRaw?.about_org),
    companySize: toStringValue(orgRaw?.size),
    businessType:
      toStringValue(contact?.businessType) ||
      toStringValue(contact?.business_type) ||
      toStringValue(orgRaw?.business_type),
    location:
      toStringValue(contact?.location) ||
      toStringValue(contact?.address) ||
      toStringValue(orgRaw?.building_id),
    email: toStringValue(contact?.email, fallbackEmail),
    phone: toStringValue(contact?.phone),
    website: toStringValue(orgRaw?.website_url),
    logoPreview: toPublicAssetUrl(orgRaw?.logo),
    buildingId: toStringValue(orgRaw?.building_id),
    positionX: toNumber(orgRaw?.position_x),
    positionY: toNumber(orgRaw?.position_y),
    linkedin: toStringValue(social?.linkedin) || toStringValue(contact?.linkedin),
    facebook: toStringValue(social?.facebook) || toStringValue(contact?.facebook),
    instagram: toStringValue(social?.instagram) || toStringValue(contact?.instagram),
    youtube: toStringValue(social?.youtube) || toStringValue(contact?.youtube),
    tiktok: toStringValue(social?.tiktok) || toStringValue(contact?.tiktok),
    raw: orgRaw,
  };
}

type EmployeeContext = {
  userId: string;
  empId: string;
  orgId: string;
  email: string;
  emailFromToken: string;
  role: string;
  tokenRole: string;
  accessToken: string;
  needsEmployeeBootstrap: boolean;
};

async function getEmployeeContext(req: Request): Promise<EmployeeContext> {
  const sess = getSessionTokens(req);
  const idToken = sess?.idToken;
  const accessToken = sess?.accessToken || "";

  if (!idToken) {
    throw createError("Unauthorized", 401);
  }

  const payload = decodeJwt(idToken);
  const cognitoUserId = String(payload.sub || "");
  const tokenRole = String(payload["custom:role"] || "").toLowerCase();
  const emailFromToken = String(payload.email || "").toLowerCase();
  const orgIdFromToken = String(payload["custom:orgId"] || "");

  if (!cognitoUserId) {
    throw createError("Invalid token", 401);
  }

  const pool = getPool();

  const userRes = await pool.query(
    `
      SELECT user_id, email, role, status
      FROM users
      WHERE cognito_user_id = $1
         OR lower(email) = lower($2)
      ORDER BY CASE WHEN cognito_user_id = $1 THEN 0 ELSE 1 END
      LIMIT 1
    `,
    [cognitoUserId, emailFromToken]
  );

  const user = userRes.rows[0];
  if (!user?.user_id) {
    throw createError("User not found", 404);
  }

  const resolvedRole = String(user.role || tokenRole || "").toLowerCase();
  if (resolvedRole !== "employee") {
    throw createError("Only employee accounts can access this route", 403);
  }

  const empRes = await pool.query(
    `
      SELECT emp_id, org_id
      FROM employees
      WHERE user_id = $1
      LIMIT 1
    `,
    [user.user_id]
  );

  const employee = empRes.rows[0] || null;

  const resolvedOrgId = (() => {
    const fromEmp = String(employee?.org_id || "").trim();
    if (fromEmp && UUID_REGEX.test(fromEmp)) return fromEmp;
    const fromToken = String(orgIdFromToken || "").trim();
    if (fromToken && UUID_REGEX.test(fromToken)) return fromToken;
    return "";
  })();

  return {
    userId: String(user.user_id),
    empId: employee?.emp_id ? String(employee.emp_id) : "",
    orgId: resolvedOrgId,
    email: String(user.email || emailFromToken || "").toLowerCase(),
    emailFromToken,
    role: resolvedRole,
    tokenRole,
    accessToken,
    needsEmployeeBootstrap: !employee,
  };
}

async function syncBuildingSelection(
  client: PoolClient,
  previousBuildingId: string | null,
  nextBuildingId: string | null
) {
  const prevId = previousBuildingId?.trim() || null;
  const nextId = nextBuildingId?.trim() || null;

  if (!nextId) {
    if (prevId) {
      await client.query(
        `
        UPDATE building
        SET building_selected = false
        WHERE building_id = $1
        `,
        [prevId]
      );
    }
    return;
  }

  const targetRes = await client.query(
    `
    SELECT
      building_id,
      COALESCE(building_selected, false) AS building_selected
    FROM building
    WHERE building_id = $1
    FOR UPDATE
    `,
    [nextId]
  );

  if (targetRes.rowCount === 0) {
    throw createError("Selected building not found", 404);
  }

  const target = targetRes.rows[0];

  if (target.building_selected && prevId !== nextId) {
    throw createError("This building has already been selected by another organization", 409);
  }

  if (prevId && prevId !== nextId) {
    await client.query(
      `
      UPDATE building
      SET building_selected = false
      WHERE building_id = $1
      `,
      [prevId]
    );
  }

  await client.query(
    `
    UPDATE building
    SET building_selected = true
    WHERE building_id = $1
    `,
    [nextId]
  );
}

function getBackendAgent(target: URL) {
  if (target.protocol !== "https:") return undefined;

  const ca =
    BACKEND_CA_PATH && fs.existsSync(BACKEND_CA_PATH)
      ? fs.readFileSync(BACKEND_CA_PATH, "utf8")
      : undefined;

  return new https.Agent({
    ca,
    rejectUnauthorized: ca ? true : !BACKEND_ALLOW_SELF_SIGNED,
  });
}

async function requestBackendJson(
  path: string,
  accessToken: string,
  init: {
    method?: "GET" | "POST" | "PUT";
    body?: string;
    timeoutMs?: number;
  } = {}
) {
  const target = new URL(path, BACKEND_URL);
  const isHttps = target.protocol === "https:";
  const client = isHttps ? https : http;
  const body = init.body;
  const timeoutMs = Math.max(1000, Number(init.timeoutMs || BACKEND_TIMEOUT_MS));

  return new Promise<any>((resolve, reject) => {
    const req = client.request(
      target,
      {
        method: init.method || "GET",
        headers: {
          Accept: "application/json",
          ...(body
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(body),
              }
            : {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        agent: getBackendAgent(target),
      },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          const status = res.statusCode || 500;
          const contentType = String(res.headers["content-type"] || "").toLowerCase();

          let parsed: any = raw;
          if (raw && contentType.includes("application/json")) {
            try {
              parsed = JSON.parse(raw);
            } catch {}
          } else if (raw) {
            try {
              parsed = JSON.parse(raw);
            } catch {}
          }

          if (status < 200 || status >= 300) {
            const message =
              (parsed &&
                typeof parsed === "object" &&
                (parsed.message ||
                  parsed.error ||
                  (Array.isArray(parsed.detail)
                    ? parsed.detail.map((d: any) => d?.msg || JSON.stringify(d)).join("; ")
                    : parsed.detail))) ||
              (typeof parsed === "string" && parsed) ||
              `Backend request failed with status ${status}`;

            reject(createError(String(message), status));
            return;
          }

          resolve(parsed);
        });
      }
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(createError("Backend sync timed out", 504));
    });

    req.on("error", (error: any) => {
      reject(createError(error?.message || "Backend request failed", error?.statusCode || 500));
    });

    if (body) req.write(body);
    req.end();
  });
}

async function syncOrgToBackend(
  accessToken: string,
  body: any,
  orgId: string,
  fallbackEmail: string,
  fallbackBuildingId: string | null
) {
  const logo = toStringValue(body?.logo ?? body?.logoKey);
  const selectedBuildingId =
    toStringValue(body?.buildingId ?? body?.building_id) ||
    (fallbackBuildingId ? String(fallbackBuildingId) : "");

  const payload: Record<string, any> = {
    org_id: orgId,
    about_org: toStringValue(body?.aboutUs ?? body?.about_org),
    contact: buildContact(body, fallbackEmail),
    org_name: toStringValue(body?.orgName ?? body?.org_name, "Organization"),
    position_x: toNumber(body?.positionX ?? body?.position_x),
    position_y: toNumber(body?.positionY ?? body?.position_y),
    size: toStringValue(body?.companySize ?? body?.size),
    website_url: toStringValue(body?.website ?? body?.website_url),
  };

  if (logo) payload.logo = logo;
  if (selectedBuildingId) payload.building_id = selectedBuildingId;

  let lastError: Error | null = null;

  for (const method of ["PUT", "POST"] as const) {
    try {
      const raw = await requestBackendJson("/org", accessToken, {
        method,
        body: JSON.stringify(payload),
        timeoutMs: BACKEND_TIMEOUT_MS,
      });
      return { ok: true as const, raw, warning: "" };
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  return {
    ok: false as const,
    raw: null,
    warning: lastError?.message || "Failed to sync organization to backend",
  };
}

async function upsertLocalOrganization(
  client: PoolClient,
  params: {
    orgId: string;
    body: any;
    nextBuildingId: string | null;
    fallbackEmail: string;
    backendOrg?: any;
  }
) {
  const { orgId, body, nextBuildingId, fallbackEmail, backendOrg } = params;

  await client.query(
    `
    INSERT INTO organizations (
      org_id,
      org_name,
      about_org,
      size,
      contact,
      website_url,
      logo,
      building_id,
      position_x,
      position_y,
      social_links
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5::jsonb,
      $6,
      NULLIF($7, ''),
      $8,
      $9,
      $10,
      $11::jsonb
    )
    ON CONFLICT (org_id)
    DO UPDATE SET
      org_name = EXCLUDED.org_name,
      about_org = EXCLUDED.about_org,
      size = EXCLUDED.size,
      contact = EXCLUDED.contact,
      website_url = EXCLUDED.website_url,
      logo = COALESCE(EXCLUDED.logo, organizations.logo),
      building_id = EXCLUDED.building_id,
      position_x = EXCLUDED.position_x,
      position_y = EXCLUDED.position_y,
      social_links = EXCLUDED.social_links,
      updated_at = NOW()
    `,
    [
      orgId,
      toStringValue(backendOrg?.org_name ?? body?.orgName ?? body?.org_name, "Organization"),
      toStringValue(backendOrg?.about_org ?? body?.aboutUs ?? body?.about_org),
      toStringValue(backendOrg?.size ?? body?.companySize ?? body?.size),
      buildContact(body, fallbackEmail),
      toStringValue(backendOrg?.website_url ?? body?.website ?? body?.website_url),
      toStringValue(backendOrg?.logo ?? body?.logo ?? body?.logoKey),
      nextBuildingId,
      toNumber(backendOrg?.position_x ?? body?.positionX ?? body?.position_x),
      toNumber(backendOrg?.position_y ?? body?.positionY ?? body?.position_y),
      buildSocialLinks(body),
    ]
  );
}

async function getLocalOrganizationById(pool: Pool, orgId: string) {
  const res = await pool.query(
    `
    SELECT
      org_id,
      org_name,
      about_org,
      size,
      contact,
      website_url,
      logo,
      building_id,
      position_x,
      position_y,
      social_links,
      created_at,
      updated_at
    FROM organizations
    WHERE org_id = $1
    LIMIT 1
    `,
    [orgId]
  );

  return res.rows[0] || null;
}

function buildLocalOrgFromBody(
  orgId: string,
  body: any,
  fallbackEmail: string,
  nextBuildingId: string | null
) {
  return {
    org_id: orgId,
    org_name: toStringValue(body?.orgName ?? body?.org_name, "Organization"),
    about_org: toStringValue(body?.aboutUs ?? body?.about_org),
    size: toStringValue(body?.companySize ?? body?.size),
    contact: buildContact(body, fallbackEmail),
    website_url: toStringValue(body?.website ?? body?.website_url),
    logo: toStringValue(body?.logo ?? body?.logoKey),
    building_id: nextBuildingId,
    position_x: toNumber(body?.positionX ?? body?.position_x),
    position_y: toNumber(body?.positionY ?? body?.position_y),
    social_links: buildSocialLinks(body),
  };
}

export async function GET(req: Request) {
  try {
    const context = await getEmployeeContext(req);
    const pool = getPool();

    if (!context.orgId) {
      return NextResponse.json({ ok: true, data: { organization: null } });
    }

    const localOrg = await getLocalOrganizationById(pool, context.orgId);
    if (localOrg) {
      return NextResponse.json({
        ok: true,
        data: {
          organization: normalizeOrg(localOrg, context.email || context.emailFromToken || ""),
        },
      });
    }

    try {
      const orgRaw = await requestBackendJson(
        `/org/${encodeURIComponent(context.orgId)}`,
        context.accessToken,
        { timeoutMs: Math.min(BACKEND_TIMEOUT_MS, 4000) }
      );

      return NextResponse.json({
        ok: true,
        data: {
          organization: normalizeOrg(orgRaw, context.email || context.emailFromToken || ""),
        },
      });
    } catch (error: any) {
      if (Number(error?.statusCode) === 404) {
        return NextResponse.json({ ok: true, data: { organization: null } });
      }

      return NextResponse.json({ ok: true, data: { organization: null } });
    }
  } catch (error: any) {
    const message = error?.message || "Server error";
    const status =
      message === "Unauthorized" || message === "Invalid token"
        ? 401
        : message === "Only employee accounts can access this route"
          ? 403
          : Number(error?.statusCode || 500);

    return NextResponse.json({ ok: false, message }, { status });
  }
}

export async function POST(req: Request) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const context = await getEmployeeContext(req);
    const body = await req.json();

    const requestedOrgId =
      toStringValue(body?.orgId || body?.org_id) || context.orgId || "";
    const stableOrgId = requestedOrgId && UUID_REGEX.test(requestedOrgId) ? requestedOrgId : randomUUID();
    const requestedBuildingId = toStringValue(body?.buildingId ?? body?.building_id) || null;

    let previousBuildingId: string | null = null;

    await client.query("BEGIN");

    const existingOrgRes = await client.query(
      `
      SELECT org_id, building_id
      FROM organizations
      WHERE org_id = $1
      FOR UPDATE
      `,
      [stableOrgId]
    );

    previousBuildingId = existingOrgRes.rows[0]?.building_id
      ? String(existingOrgRes.rows[0].building_id)
      : null;

    const nextBuildingId = requestedBuildingId || previousBuildingId || null;

    if (requestedBuildingId || previousBuildingId) {
      await syncBuildingSelection(client, previousBuildingId, nextBuildingId);
    }

    await upsertLocalOrganization(client, {
      orgId: stableOrgId,
      body,
      nextBuildingId,
      fallbackEmail: context.email || context.emailFromToken || "",
    });

    await client.query("COMMIT");

    const backendSync = await syncOrgToBackend(
      context.accessToken,
      body,
      stableOrgId,
      context.email || context.emailFromToken || "",
      previousBuildingId
    );

    if (backendSync.ok && backendSync.raw) {
      const syncClient = await pool.connect();
      try {
        await upsertLocalOrganization(syncClient, {
          orgId: stableOrgId,
          body,
          nextBuildingId,
          fallbackEmail: context.email || context.emailFromToken || "",
          backendOrg: backendSync.raw,
        });
      } finally {
        syncClient.release();
      }
    }

    const localOrg =
      backendSync.ok && backendSync.raw
        ? {
            ...buildLocalOrgFromBody(
              stableOrgId,
              body,
              context.email || context.emailFromToken || "",
              nextBuildingId
            ),
            ...backendSync.raw,
            org_id: stableOrgId,
            building_id: nextBuildingId,
          }
        : buildLocalOrgFromBody(
            stableOrgId,
            body,
            context.email || context.emailFromToken || "",
            nextBuildingId
          );

    return NextResponse.json({
      ok: true,
      data: {
        organization: normalizeOrg(localOrg, context.email || context.emailFromToken || ""),
      },
      warning: backendSync.ok ? "" : backendSync.warning,
    });
  } catch (error: any) {
    await client.query("ROLLBACK").catch(() => null);

    const message = error?.message || "Failed to save organization";
    const status =
      message === "Unauthorized" || message === "Invalid token"
        ? 401
        : message === "Only employee accounts can access this route"
          ? 403
          : Number(error?.statusCode || 500);

    return NextResponse.json({ ok: false, message }, { status });
  } finally {
    client.release();
  }
}

export async function PUT(req: Request) {
  return POST(req);
}
