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

function pickString(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text && text !== "null" && text !== "undefined" && text !== "string") return text;
  }
  return "";
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

function normalizeDate(value: unknown) {
  const text = pickString(value);
  if (!text) return "";
  return text.includes("T") ? text.slice(0, 10) : text;
}

function normalizeSource(value: unknown): "upload" | "platform" {
  const text = String(value ?? "").trim().toLowerCase();
  if (["upload", "uploaded", "uploaded by user", "uploaded_by_user", "user", "manual", "custom"].includes(text)) {
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
  if (json?.data?.student_info || json?.data?.studentInfo || json?.data?.education || json?.data?.skills) return json.data;
  if (json?.data?.Info || json?.data?.Education || json?.data?.Skills) return json.data;
  if (json?.data) return json.data;

  const keys = Object.keys(json);
  if (keys.length === 1 && typeof json[keys[0]] === "object") return json[keys[0]];
  return json;
}

function candidateObjects(...values: unknown[]) {
  const out: Record<string, any>[] = [];
  for (const value of values) {
    const root = safeObject(value);
    const list = [
      root,
      root.student_info,
      root.studentInfo,
      root.Info,
      root.info,
      root.student,
      root.Student,
      root.profile,
      root.Profile,
      root.user,
      root.User,
      root.commonInfo,
      root.common_info,
      root.data,
      root.data?.student_info,
      root.data?.studentInfo,
      root.data?.Info,
      root.data?.info,
      root.data?.student,
      root.data?.profile,
    ];
    for (const item of list) {
      const obj = safeObject(item);
      if (Object.keys(obj).length) out.push(obj);
    }
  }
  return out;
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
  for (const value of values) if (Array.isArray(value) && value.length > 0) return value;
  for (const value of values) if (Array.isArray(value)) return value;
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
  const objects = candidateObjects(portfolioRoot, dashboardRoot, studentRoot);

  const firstName = pickFromObjects(objects, "first_name", "firstName", "FirstName");
  const lastName = pickFromObjects(objects, "last_name", "lastName", "LastName");
  const fullName = pickFromObjects(objects, "name", "full_name", "fullName", "participant_name");
  const parts = fullName.split(/\s+/).filter(Boolean);

  return {
    first_name: firstName || parts[0] || "",
    last_name: lastName || parts.slice(1).join(" ") || "",
    phone: pickFromObjects(objects, "phone", "Phone", "phone_number", "phoneNumber", "participant_phone"),
    email: pickFromObjects(objects, "email", "Email", "participant_email"),
    address: pickFromObjects(objects, "address", "Address", "location", "Location"),
    about_me: pickFromObjects(objects, "about_me", "aboutMe", "AboutMe", "bio", "about", "description"),
    birth_date: pickFromObjects(objects, "birth_date", "birthDate", "BirthDate"),
    profile_image_url: pickFromObjects(objects, "profile_image_url", "profileImageUrl", "ProfileImageUrl", "profile_image", "avatar_image_url", "avatarImageUrl", "image_url", "imageUrl", "participant_avatar"),
  };
}

function normalizeEducation(portfolioRoot: any, dashboardRoot: any, studentRoot: any) {
  return firstArray(
    portfolioRoot?.education,
    portfolioRoot?.Education,
    portfolioRoot?.student_info?.education,
    portfolioRoot?.studentInfo?.education,
    dashboardRoot?.education,
    dashboardRoot?.Education,
    studentRoot?.education,
    studentRoot?.Education,
  )
    .map((item: any, index: number) => ({
      id: pickString(item?.id) || `education-${index}`,
      school: pickString(item?.school, item?.university, item?.institution, item?.facultyschool),
      degree: pickString(item?.degree, item?.degreeLevel, item?.degree_level, item?.education_level),
      faculty: pickString(item?.faculty),
      fieldOfStudy: pickString(item?.fieldOfStudy, item?.field_of_study, item?.major, item?.department),
      startYear: pickString(item?.startYear, item?.start_year, item?.from),
      endYear: pickString(item?.endYear, item?.end_year, item?.to),
      gpa: pickString(item?.gpa),
    }))
    .filter((item: any) => Boolean(item.school || item.degree || item.faculty || item.fieldOfStudy || item.startYear || item.endYear));
}

function normalizeSkills(portfolioRoot: any) {
  const seen = new Set<string>();
  return firstArray(portfolioRoot?.skills, portfolioRoot?.Skills)
    .map((item: any, index: number) => ({
      id: pickString(item?.id, item?.skillID, item?.skill_id) || `skill-${index}`,
      name: pickString(item?.name, item?.Name, item?.skill_name, item?.skillName, item?.title),
      kind: normalizeSkillKind(item?.kind ?? item?.category ?? item?.Category ?? item?.skill_type ?? item?.skill_category),
      source: item?.fromSystem === true || item?.FromSystem === true ? "platform" : normalizeSource(item?.source),
      isSelected: typeof item?.isSelected === "boolean" ? item.isSelected : typeof item?.enable === "boolean" ? item.enable : true,
    }))
    .filter((item) => {
      if (!item.name || item.isSelected === false) return false;
      const key = `${item.name.toLowerCase()}|${item.kind}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function normalizeCertificates(portfolioRoot: any) {
  return firstArray(portfolioRoot?.certificates, portfolioRoot?.certificate, portfolioRoot?.Certificates)
    .map((item: any, index: number) => ({
      id: pickString(item?.id) || `certificate-${index}`,
      title: pickString(item?.title, item?.name, item?.certificate_name, item?.certificateName),
      date: normalizeDate(item?.date ?? item?.issued_at ?? item?.year),
      itemType: String(item?.itemType ?? item?.type ?? "certificate").toLowerCase().includes("badge") ? ("badge" as const) : ("certificate" as const),
      source: item?.fromSystem === true || item?.FromSystem === true ? "platform" : normalizeSource(item?.source),
      isSelected: typeof item?.isSelected === "boolean" ? item.isSelected : typeof item?.enable === "boolean" ? item.enable : true,
    }))
    .filter((item) => item.title && item.isSelected !== false);
}

function normalizeExperiences(portfolioRoot: any) {
  return firstArray(portfolioRoot?.experiences, portfolioRoot?.experience, portfolioRoot?.Experience, portfolioRoot?.activities, portfolioRoot?.Activities)
    .map((item: any, index: number) => {
      const startYear = pickString(item?.startYear, item?.StartYear, item?.start_year);
      const endYear = pickString(item?.endYear, item?.EndYear, item?.end_year);
      return {
        id: pickString(item?.id, item?.activityID, item?.ActivityID, item?.activity_id) || `experience-${index}`,
        period: pickString(item?.period) || (startYear && endYear ? `${startYear} - ${endYear}` : startYear || endYear),
        title: pickString(item?.title, item?.topic, item?.Topic, item?.activity_name, item?.name),
        description: pickString(item?.description, item?.Description, item?.detail, item?.activity_detail),
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
    const studentInfo = normalizeStudentInfo(portfolioRoot, dashboardRoot, studentRoot);

    return NextResponse.json({
      ok: true,
      data: {
        student_info: studentInfo,
        studentInfo,
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
