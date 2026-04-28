import { NextResponse } from "next/server";
import { decodeJwt } from "jose";

const BACKEND = process.env.BACKEND_URL!;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "vcep_session";

type SessionTokens = {
  accessToken: string;
  idToken: string;
};


const PUBLIC_ASSET_BASE =
  process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL ||
  "https://vcep-assets-dev.s3.ap-southeast-2.amazonaws.com";

function toPublicAssetUrl(value: unknown) {
  const raw = pickString(value);
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `${PUBLIC_ASSET_BASE.replace(/\/+$/, "")}/${raw.replace(/^\/+/, "")}`;
}
function getFileNameFromUrl(url: unknown) {
  const cleanUrl = pickString(url);
  if (!cleanUrl) return "";
  try {
    const parsed = new URL(cleanUrl);
    const lastPart = parsed.pathname.split("/").filter(Boolean).pop() ?? "";
    return decodeURIComponent(lastPart);
  } catch {
    const lastPart = cleanUrl.split("?")[0].split("/").filter(Boolean).pop() ?? "";
    try {
      return decodeURIComponent(lastPart);
    } catch {
      return lastPart;
    }
  }
}


type PortfolioType =
  | "info"
  | "education"
  | "skills"
  | "certificate"
  | "experience";

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  const found = parts.find((p) => p.startsWith(name + "="));
  if (!found) return null;
  const v = found.slice(name.length + 1);
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

function getSessionTokens(req: Request): SessionTokens | null {
  const cookieHeader = req.headers.get("cookie");
  const raw = readCookie(cookieHeader, COOKIE_NAME);

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as {
        accessToken?: string;
        idToken?: string;
      };

      if (parsed?.accessToken && parsed?.idToken) {
        return {
          accessToken: parsed.accessToken,
          idToken: parsed.idToken,
        };
      }
    } catch { }
  }

  const accessToken = readCookie(cookieHeader, "vcep_access");
  const idToken = readCookie(cookieHeader, "vcep_id");

  if (!accessToken || !idToken) return null;

  return { accessToken, idToken };
}

function safeArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function safeObject(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, any>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, any>;
      }
    } catch { }
  }
  return {};
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    const s = String(value ?? "").trim();
    if (s && s !== "null" && s !== "undefined") return s;
  }
  return "";
}

function isValidUUID(value: unknown): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(value ?? "")
  );
}

function ensureUUID(value: unknown): string {
  const s = String(value ?? "").trim();
  return isValidUUID(s) ? s : crypto.randomUUID();
}

function normalizeSource(value: unknown): "upload" | "platform" {
  return String(value ?? "").trim().toLowerCase() === "upload"
    ? "upload"
    : "platform";
}

function normalizeSkillKind(value: unknown): "soft" | "technical" {
  const s = String(value ?? "").trim().toLowerCase();
  return s.includes("soft") ? "soft" : "technical";
}

function normalizeDate(value: unknown) {
  const s = pickString(value);
  if (!s) return "";
  if (s.includes("T")) return s.slice(0, 10);
  return s;
}

function unwrapPortfolioRoot(value: any, stdId?: string) {
  const root = value?.data ?? value ?? {};

  if (
    root?.info ||
    root?.Info ||
    root?.education ||
    root?.Education ||
    root?.skills ||
    root?.Skills ||
    root?.certificates ||
    root?.Certificates ||
    root?.experience ||
    root?.Experience
  ) {
    return root;
  }

  if (stdId && root?.[stdId]) return root[stdId];

  if (
    root?.std_id &&
    typeof root.std_id === "object" &&
    !Array.isArray(root.std_id)
  ) {
    return root.std_id;
  }

  if (
    root?.portfolio &&
    typeof root.portfolio === "object" &&
    !Array.isArray(root.portfolio)
  ) {
    return root.portfolio;
  }

  const firstObjectValue = Object.values(root).find(
    (item) => item && typeof item === "object" && !Array.isArray(item)
  );

  return (firstObjectValue as any) ?? root;
}

async function fetchJson(url: string, accessToken: string) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const raw = await res.text();
  let json: any = null;

  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = raw;
  }

  if (!res.ok) {
    throw new Error(
      `${url} failed: ${res.status} ${typeof json === "string" ? json : JSON.stringify(json)
      }`
    );
  }

  return json;
}

async function tryFetchJson(url: string, accessToken: string) {
  try {
    return await fetchJson(url, accessToken);
  } catch {
    return null;
  }
}

async function readResponseJson(res: Response) {
  const raw = await res.text();
  let json: any = null;

  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = raw ? { message: raw } : null;
  }

  return json;
}

async function updatePortfolioBackend(
  stdId: string,
  accessToken: string,
  type: PortfolioType,
  payload: any
) {
  const url = `${BACKEND}/student/${stdId}/portfolio/${type}`;
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const json = await readResponseJson(res);
    return { ok: res.ok, status: res.status, json };
  } catch (error: any) {
    return { ok: false, status: 500, json: { message: error?.message || "Update failed" } };
  }
}

async function getStdId(accessToken: string, idToken: string) {
  const jwt = decodeJwt(idToken);

  const userJson = await fetchJson(`${BACKEND}/auth/all`, accessToken);
  const users = safeArray<any>(
    Array.isArray(userJson)
      ? userJson
      : Array.isArray(userJson?.data)
        ? userJson.data
        : Array.isArray(userJson?.users)
          ? userJson.users
          : []
  );

  const user = users.find(
    (u) => u?.cognito_user_id === jwt.sub || u?.cognitoUserId === jwt.sub
  );

  if (!user?.user_id) return null;

  const studentJson = await fetchJson(`${BACKEND}/student/all`, accessToken);
  const students = safeArray<any>(
    Array.isArray(studentJson)
      ? studentJson
      : Array.isArray(studentJson?.data)
        ? studentJson.data
        : Array.isArray(studentJson?.students)
          ? studentJson.students
          : []
  );

  return students.find((s) => s?.user_id === user.user_id)?.std_id ?? null;
}

function normalizeStudentInfo(portfolioRoot: any, dashboardRoot: any) {
  const info = safeObject(
    portfolioRoot?.info ??
      portfolioRoot?.Info ??
      portfolioRoot?.student_info ??
      portfolioRoot?.studentInfo ??
      {}
  );

  const dashboardInfo = safeObject(
    dashboardRoot?.student_info ??
      dashboardRoot?.studentInfo ??
      dashboardRoot?.student ??
      dashboardRoot ??
      {}
  );

  return {
    first_name: pickString(
      info.first_name,
      info.firstName,
      info.FirstName,
      dashboardInfo.first_name,
      dashboardInfo.firstName,
      dashboardInfo.FirstName
    ),
    last_name: pickString(
      info.last_name,
      info.lastName,
      info.LastName,
      dashboardInfo.last_name,
      dashboardInfo.lastName,
      dashboardInfo.LastName
    ),
    birth_date: normalizeDate(
      info.birth_date ??
        info.birthDate ??
        info.BirthDate ??
        dashboardInfo.birth_date ??
        dashboardInfo.birthDate
    ),
    phone: pickString(info.phone, info.Phone, dashboardInfo.phone),
    email: pickString(info.email, info.Email, dashboardInfo.email),
    address: pickString(info.address, info.Address, dashboardInfo.address),
    about_me: pickString(
      info.about_me,
      info.aboutMe,
      info.AboutMe,
      dashboardInfo.about_me,
      dashboardInfo.aboutMe
    ),
    profile_image_url: toPublicAssetUrl(
      pickString(
        info.profile_image_url,
        info.profileImageUrl,
        info.ProfileImageUrl,
        info.avatar_image_url,
        info.avatarImageUrl,
        dashboardInfo.profile_image_url,
        dashboardInfo.profileImageUrl,
        dashboardInfo.avatar_image_url,
        dashboardInfo.avatarImageUrl
      )
    ),
  };
}

function normalizeEducation(portfolioRoot: any) {
  const list = safeArray<any>(portfolioRoot?.education ?? portfolioRoot?.Education ?? []);

  return list.map((item, index) => ({
    id:
      pickString(item?.id, item?.educationID, item?.EducationID) ||
      `education-${index}`,
    school: pickString(
      item?.institution,
      item?.Institution,
      item?.school,
      item?.School,
      item?.university,
      item?.University,
      item?.facultyschool
    ),
    degree: pickString(
      item?.degreeLevel,
      item?.DegreeLevel,
      item?.degree_level,
      item?.degree,
      item?.Degree
    ),
    faculty: pickString(item?.faculty, item?.Faculty),
    fieldOfStudy: pickString(
      item?.major,
      item?.Major,
      item?.field_of_study,
      item?.fieldOfStudy,
      item?.FieldOfStudy
    ),
    startYear: String(item?.startYear ?? item?.StartYear ?? item?.start_year ?? ""),
    endYear: String(item?.endYear ?? item?.EndYear ?? item?.end_year ?? ""),
    gpa: pickString(item?.gpa, item?.GPA),
  }));
}

function normalizeSkills(portfolioRoot: any) {
  const list = safeArray<any>(portfolioRoot?.skills ?? portfolioRoot?.Skills ?? []);
  return list.map((item, index) => ({
    id: pickString(item?.skillID, item?.skill_id) || `skill-${index}`,
    name: pickString(item?.name, item?.Name),
    kind: normalizeSkillKind(item?.category ?? item?.Category ?? item?.kind),
    source: (item?.fromSystem === true || item?.FromSystem === true) ? "platform" : "upload",
    isSelected: typeof item?.enable === "boolean" ? item.enable : (typeof item?.Enable === "boolean" ? item.Enable : true),
  }));
}

function normalizeCertificates(portfolioRoot: any, stdId?: string) {
  const list = safeArray<any>(portfolioRoot?.certificates ?? portfolioRoot?.Certificates ?? []);
  return list.map((item, index) => {
    const typeStr = String(item?.type ?? item?.Type ?? item?.itemType ?? "certificate").toLowerCase();
    const fileName = pickString(item?.fileName, item?.file_name);
    const rawLink = pickString(
      item?.badgeLink,
      item?.badge_link,
      item?.badgeUrl,
      item?.badge_url,
      item?.certificateLink,
      item?.certificate_link,
      item?.fileUrl,
      item?.file_url,
      item?.externalWebsite,
      item?.external_website,
      item?.url,
      item?.link,
      fileName && stdId ? `student-certificates//` : ""
    );

    return {
      id: `certificate-${index}`,
      itemType: typeStr === "badge" ? "badge" : "certificate",
      title: pickString(item?.name, item?.Name, item?.title, item?.Title),
      date: normalizeDate(item?.date ?? item?.issue_date ?? item?.IssueDate),
      badgeLink: toPublicAssetUrl(rawLink),
      fileName: fileName || getFileNameFromUrl(rawLink),
      source: (item?.fromSystem === true || item?.FromSystem === true) ? "platform" : "upload",
      isSelected: typeof item?.enable === "boolean" ? item.enable : (typeof item?.Enable === "boolean" ? item.Enable : true),
    };
  });
}

function normalizeExperiences(portfolioRoot: any) {
  const list = safeArray<any>(portfolioRoot?.experience ?? portfolioRoot?.Experience ?? []);
  return list.map((item, index) => {
    const start = String(item?.StartYear ?? item?.start_year ?? "");
    const end = String(item?.EndYear ?? item?.end_year ?? "");
    const period = start && end ? `${start} - ${end}` : start || end || "";
    return {
      id: pickString(item?.activityID, item?.ActivityID) || `experience-${index}`,
      period,
      title: pickString(item?.topic, item?.Topic),
      description: pickString(item?.description, item?.Description),
      source: (item?.fromSystem === true || item?.FromSystem === true) ? "platform" : "upload",
      enable: typeof item?.enable === "boolean" ? item.enable : (typeof item?.Enable === "boolean" ? item.Enable : true),
      files: [],
    };
  });
}

function buildBackendPayload(type: PortfolioType, body: any) {
  if (type === "info") {
    return {
      first_name: pickString(body?.first_name, body?.firstName),
      last_name: pickString(body?.last_name, body?.lastName),
      email: pickString(body?.email),
      phone: pickString(body?.phone),
      address: pickString(body?.address),
      about_me: pickString(body?.about_me, body?.aboutMe),
      birth_date: pickString(body?.birth_date, body?.birthDate),
      profile_image_url: toPublicAssetUrl(pickString(body?.profile_image_url, body?.profileImageUrl, body?.avatar_image_url, body?.avatarImageUrl)),
    };
  }

  if (type === "education") {
    // Education schema has no ID field — omit it entirely
    return safeArray<any>(body?.education ?? body).map((item) => ({
      institution: pickString(item?.institution, item?.school),
      degreeLevel: pickString(item?.degreeLevel, item?.degree_level, item?.degree),
      faculty: pickString(item?.faculty),
      major: pickString(item?.major, item?.field_of_study, item?.fieldOfStudy),
      startYear: parseInt(pickString(item?.startYear, item?.start_year)) || 0,
      endYear: parseInt(pickString(item?.endYear, item?.end_year)) || 0,
      gpa: pickString(item?.gpa),
    }));
  }

  if (type === "skills") {
    return safeArray<any>(body?.skills ?? body).map((item) => {
      return {
        skillID: ensureUUID(pickString(item?.skillID, item?.id, item?.skill_id)),
        name: pickString(item?.name),
        category: normalizeSkillKind(item?.category ?? item?.kind ?? item?.skill_type),
        fromSystem: item?.source === "platform" || item?.fromSystem === true,
        enable: typeof item?.isSelected === "boolean" ? item.isSelected : (typeof item?.enable === "boolean" ? item.enable : true),
      };
    });
  }

  if (type === "certificate") {
    // Certificate schema has no ID field — omit it entirely
    return safeArray<any>(body?.certificates ?? body).map((item) => {
      const fileUrl = toPublicAssetUrl(pickString(item?.badgeLink, item?.badge_link, item?.badgeUrl, item?.badge_url, item?.certificateLink, item?.certificate_link, item?.fileUrl, item?.file_url, item?.externalWebsite, item?.external_website, item?.url, item?.link));
      const fileName = pickString(item?.fileName, item?.file_name);
      const itemType = String(item?.itemType ?? item?.type ?? "certificate");
      const fromSystem = item?.source === "platform" || item?.fromSystem === true;
      const enable = typeof item?.isSelected === "boolean" ? item.isSelected : (typeof item?.enable === "boolean" ? item.enable : true);

      return {
        name: pickString(item?.name, item?.title),
        title: pickString(item?.name, item?.title),
        type: itemType,
        itemType,
        badgeLink: fileUrl,
        badge_link: fileUrl,
        fileUrl,
        file_url: fileUrl,
        badgeUrl: fileUrl,
        badge_url: fileUrl,
        certificateLink: fileUrl,
        certificate_link: fileUrl,
        externalWebsite: fileUrl,
        external_website: fileUrl,
        fileName,
        file_name: fileName,
        fromSystem,
        source: fromSystem ? "platform" : "upload",
        enable,
        isSelected: enable,
      };
    });
  }

  if (type === "experience") {
    return safeArray<any>(body?.experiences ?? body?.experience ?? body).map((item) => {
      return {
        activityID: ensureUUID(pickString(item?.activityID, item?.id, item?.activity_id, item?.ActivityID)),
        topic: pickString(item?.topic, item?.title),
        description: pickString(item?.description),
        startYear: parseInt(pickString(item?.startYear, item?.start_year)) || 0,
        endYear: parseInt(pickString(item?.endYear, item?.end_year)) || 0,
        fromSystem: item?.source === "platform" || item?.fromSystem === true,
        enable: typeof item?.enable === "boolean" ? item.enable : true,
        externalWebsite: pickString(item?.externalWebsite, item?.external_website),
      };
    });
  }

  return body;
}

export async function GET(req: Request) {
  try {
    const sess = getSessionTokens(req);
    if (!sess) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const stdId = await getStdId(sess.accessToken, sess.idToken);
    if (!stdId) {
      return NextResponse.json(
        { ok: false, message: "Student not found" },
        { status: 404 }
      );
    }

    //     {
    //   "certificates": [
    //     {
    //       "badgeLink": "string",
    //       "enable": true,
    //       "name": "string",
    //       "type": "string"
    //     }
    //   ],
    //   "education": [
    //     {
    //       "degreeLevel": "string",
    //       "endYear": 0,
    //       "faculty": "string",
    //       "gpa": "string",
    //       "institution": "string",
    //       "major": "string",
    //       "startYear": 0
    //     }
    //   ],
    //   "experience": [
    //     {
    //       "activityID": "string",
    //       "description": "string",
    //       "enable": true,
    //       "endYear": 0,
    //       "externalWebsite": "string",
    //       "fromSystem": true,
    //       "startYear": 0,
    //       "topic": "string"
    //     }
    //   ],
    //   "info": {
    //     "aboutMe": "string",
    //     "address": "string",
    //     "email": "string",
    //     "firstName": "string",
    //     "lastName": "string",
    //     "phone": "string"
    //     "profile_image_url": "1234",
    //     "birth_date": "string"
    //   },
    //   "skills": [
    //     {
    //       "category": "string",
    //       "enable": true,
    //       "fromSystem": true,
    //       "name": "string",
    //       "skillID": "string"
    //     }
    //   ]
    // }

    const [portfolioJson, dashboardJson] = await Promise.all([
      tryFetchJson(`${BACKEND}/student/${stdId}/portfolio`, sess.accessToken),
      tryFetchJson(`${BACKEND}/student/${stdId}/dashboard`, sess.accessToken),
    ]);

    const portfolioRoot = unwrapPortfolioRoot(portfolioJson, stdId);
    const dashboardRoot = dashboardJson?.data ?? dashboardJson ?? {};

    // console.log("portfolioRoot: ", portfolioRoot);
    // console.log("dashboardRoot: ", dashboardRoot);
    var data = {
      student_info: normalizeStudentInfo(portfolioRoot, dashboardRoot),
      education: normalizeEducation(portfolioRoot),
      skills: normalizeSkills(portfolioRoot),
      certificates: normalizeCertificates(portfolioRoot, stdId),
      experiences: normalizeExperiences(portfolioRoot),
    }

    console.log("data: ", data);

    return NextResponse.json({
      ok: true,
      data: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || "Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  console.log("PUT /api/student/portfolio");
  try {
    const sess = getSessionTokens(req);
    if (!sess) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as PortfolioType | null;
    console.log("type: ", type);

    if (!type) {
      return NextResponse.json(
        { ok: false, message: "Missing portfolio type" },
        { status: 400 }
      );
    }

    const stdId = await getStdId(sess.accessToken, sess.idToken);
    console.log("stdId: ", stdId);
    if (!stdId) {
      return NextResponse.json(
        { ok: false, message: "Student not found" },
        { status: 404 }
      );
    }

    console.log("stdId: ", stdId);

    const body = await req.json();
    const payload = buildBackendPayload(type, body);

    console.log("payload: ", payload);

    const result = await updatePortfolioBackend(
      stdId,
      sess.accessToken,
      type,
      payload
    );

    console.log("result: ", result);

    return NextResponse.json(
      {
        ok: result.ok,
        message:
          result.json?.message ||
          (result.ok ? "Portfolio updated successfully" : "Update failed"),
        data: result.json?.data ?? result.json ?? null,
      },
      { status: result.status }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || "Update failed" },
      { status: 500 }
    );
  }
}
