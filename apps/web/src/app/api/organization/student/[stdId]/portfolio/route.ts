import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL!;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "vcep_session";

type RouteContext = {
  params: Promise<{ stdId: string }> | { stdId: string };
};

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(`${name}=`));
  if (!found) return null;
  const raw = found.slice(name.length + 1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function getAccessToken(req: Request) {
  const cookieHeader = req.headers.get("cookie");
  const sessionRaw = readCookie(cookieHeader, COOKIE_NAME);

  if (sessionRaw) {
    try {
      const session = JSON.parse(sessionRaw) as { accessToken?: string };
      if (session?.accessToken) return session.accessToken;
    } catch {}
  }

  return readCookie(cookieHeader, "vcep_access");
}

function safeArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function safeObject(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, any>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return {};
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text && text !== "null" && text !== "undefined") return text;
  }
  return "";
}

function normalizeDate(value: unknown) {
  const text = pickString(value);
  if (!text) return "";
  return text.includes("T") ? text.slice(0, 10) : text;
}

function normalizeSource(value: unknown): "upload" | "platform" {
  const text = String(value ?? "").trim().toLowerCase();

  // Match PortfolioPage icons exactly:
  // sign01-icon.png = Uploaded by user, sign02-icon.png = Platform.
  if (
    text === "upload" ||
    text === "uploaded" ||
    text === "uploaded by user" ||
    text === "user" ||
    text === "manual" ||
    text === "custom"
  ) {
    return "upload";
  }

  return "platform";
}

function normalizeSkillKind(value: unknown): "soft" | "technical" {
  const text = String(value ?? "").trim().toLowerCase();
  return text.includes("soft") ? "soft" : "technical";
}

function unwrapPortfolio(json: any) {
  if (!json) return {};
  if (json?.data?.Info || json?.data?.Education || json?.data?.Skills) return json.data;
  if (json?.data?.info || json?.data?.education || json?.data?.skills) return json.data;
  if (json?.data) return json.data;

  const keys = Object.keys(json);
  if (keys.length === 1 && typeof json[keys[0]] === "object") return json[keys[0]];
  return json;
}

function getCandidateObjects(...values: unknown[]) {
  const result: Record<string, any>[] = [];

  for (const value of values) {
    const root = safeObject(value);
    const candidates = [
      root,
      root.Info,
      root.info,
      root.student_info,
      root.studentInfo,
      root.StudentInfo,
      root.student,
      root.Student,
      root.profile,
      root.Profile,
      root.user,
      root.User,
      root.commonInfo,
      root.common_info,
      root.data,
      root.data?.Info,
      root.data?.info,
      root.data?.student_info,
      root.data?.studentInfo,
    ];

    for (const candidate of candidates) {
      const object = safeObject(candidate);
      if (Object.keys(object).length > 0) result.push(object);
    }
  }

  return result;
}

function pickFromObjects(objects: Record<string, any>[], ...keys: string[]) {
  for (const object of objects) {
    for (const key of keys) {
      const value = pickString(object?.[key]);
      if (value) return value;
    }
  }
  return "";
}

function firstArray(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0) return value;
  }
  for (const value of values) {
    if (Array.isArray(value)) return value;
  }
  return [];
}

async function fetchJson(url: string, accessToken: string) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const raw = await response.text();
  let json: any = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = raw ? { message: raw } : null;
  }

  if (!response.ok) return null;
  return json;
}

function normalizeStudentInfo(portfolioRoot: any, dashboardRoot: any, studentRoot: any) {
  const objects = getCandidateObjects(portfolioRoot, dashboardRoot, studentRoot);

  return {
    firstName: pickFromObjects(objects, "first_name", "firstName", "FirstName", "name", "full_name", "fullName"),
    lastName: pickFromObjects(objects, "last_name", "lastName", "LastName", "surname", "family_name", "familyName"),
    phone: pickFromObjects(objects, "phone", "Phone", "phone_number", "phoneNumber"),
    email: pickFromObjects(objects, "email", "Email"),
    address: pickFromObjects(objects, "address", "Address", "location", "Location"),
    aboutMe: pickFromObjects(objects, "about_me", "aboutMe", "AboutMe", "bio", "description"),
    profileImageUrl: pickFromObjects(objects, "profile_image_url", "profileImageUrl", "ProfileImageUrl", "profile_image", "avatar_image_url", "avatarImageUrl", "image_url", "imageUrl"),
  };
}

function normalizeEducation(portfolioRoot: any, dashboardRoot: any, studentRoot: any) {
  return firstArray(
    portfolioRoot?.Education,
    portfolioRoot?.education,
    dashboardRoot?.Education,
    dashboardRoot?.education,
    studentRoot?.Education,
    studentRoot?.education,
  )
    .map((item: any, index: number) => ({
      id: pickString(item?.id) || `education-${index}`,
      school: pickString(item?.institution, item?.school, item?.university, item?.facultyschool),
      degree: pickString(item?.degreeLevel, item?.degree_level, item?.degree),
      faculty: pickString(item?.faculty),
      fieldOfStudy: pickString(item?.major, item?.field_of_study, item?.fieldOfStudy),
      startYear: pickString(item?.startYear, item?.start_year),
      endYear: pickString(item?.endYear, item?.end_year),
      gpa: pickString(item?.gpa),
    }))
    .filter((item: any) => Boolean(item.school || item.degree || item.faculty || item.fieldOfStudy));
}

function normalizeSkills(portfolioRoot: any) {
  const seen = new Set<string>();
  return safeArray<any>(portfolioRoot?.Skills ?? portfolioRoot?.skills)
    .map((item, index) => ({
      id: pickString(item?.skillID, item?.skill_id, item?.id) || `skill-${index}`,
      name: pickString(item?.name, item?.Name, item?.skill_name, item?.skillName),
      kind: normalizeSkillKind(item?.category ?? item?.Category ?? item?.kind ?? item?.skill_type),
      source: item?.fromSystem === true || item?.FromSystem === true ? "platform" : normalizeSource(item?.source),
      isSelected: typeof item?.enable === "boolean" ? item.enable : typeof item?.isSelected === "boolean" ? item.isSelected : true,
    }))
    .filter((item) => {
      if (!item.name) return false;
      const key = `${item.name.toLowerCase()}|${item.kind}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function normalizeCertificates(portfolioRoot: any) {
  return safeArray<any>(portfolioRoot?.Certificates ?? portfolioRoot?.certificates ?? portfolioRoot?.certificate)
    .map((item, index) => ({
      id: pickString(item?.id) || `certificate-${index}`,
      title: pickString(item?.name, item?.title),
      date: normalizeDate(item?.date),
      itemType: String(item?.type ?? item?.itemType ?? "certificate").toLowerCase().includes("badge") ? "badge" as const : "certificate" as const,
      source: item?.fromSystem === true || item?.FromSystem === true ? "platform" : normalizeSource(item?.source),
      isSelected: typeof item?.enable === "boolean" ? item.enable : typeof item?.isSelected === "boolean" ? item.isSelected : true,
    }))
    .filter((item) => item.title);
}

function normalizeExperiences(portfolioRoot: any) {
  return safeArray<any>(portfolioRoot?.Experience ?? portfolioRoot?.experience ?? portfolioRoot?.experiences)
    .map((item, index) => {
      const startYear = pickString(item?.startYear, item?.StartYear, item?.start_year);
      const endYear = pickString(item?.endYear, item?.EndYear, item?.end_year);
      return {
        id: pickString(item?.activityID, item?.ActivityID, item?.id) || `experience-${index}`,
        period: startYear && endYear ? `${startYear} - ${endYear}` : startYear || endYear,
        title: pickString(item?.topic, item?.Topic, item?.title),
        description: pickString(item?.description, item?.Description),
        source: item?.fromSystem === true || item?.FromSystem === true ? "platform" : normalizeSource(item?.source),
        enable: typeof item?.enable === "boolean" ? item.enable : true,
      };
    })
    .filter((item) => item.title && item.title !== "string" && item.enable !== false);
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const stdId = String(params?.stdId ?? "").trim();
    if (!stdId) {
      return NextResponse.json({ ok: false, message: "Missing student id" }, { status: 400 });
    }

    const [portfolioJson, dashboardJson, studentJson] = await Promise.all([
      fetchJson(`${BACKEND}/student/${stdId}/portfolio`, accessToken),
      fetchJson(`${BACKEND}/student/${stdId}/dashboard`, accessToken),
      fetchJson(`${BACKEND}/student/${stdId}`, accessToken),
    ]);

    const portfolioRoot = unwrapPortfolio(portfolioJson);
    const dashboardRoot = unwrapPortfolio(dashboardJson);
    const studentRoot = unwrapPortfolio(studentJson);

    return NextResponse.json({
      ok: true,
      data: {
        studentInfo: normalizeStudentInfo(portfolioRoot, dashboardRoot, studentRoot),
        education: normalizeEducation(portfolioRoot, dashboardRoot, studentRoot),
        skills: normalizeSkills(portfolioRoot),
        certificates: normalizeCertificates(portfolioRoot),
        experiences: normalizeExperiences(portfolioRoot),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error?.message || "Server Error" },
      { status: 500 },
    );
  }
}
