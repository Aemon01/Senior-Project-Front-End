import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL!;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "vcep_session";

type SessionTokens = {
  accessToken: string;
  idToken: string;
};

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  const found = parts.find((p) => p.startsWith(name + "="));
  if (!found) return null;
  const value = found.slice(name.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
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
    } catch {}
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
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, any>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, any>;
      }
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

function normalizeSkillKind(value: unknown): "soft" | "technical" {
  const text = String(value ?? "").trim().toLowerCase();
  return text.includes("soft") ? "soft" : "technical";
}

function normalizeSource(item: any): "upload" | "platform" {
  if (typeof item?.fromSystem === "boolean") return item.fromSystem ? "platform" : "upload";
  if (typeof item?.from_system === "boolean") return item.from_system ? "platform" : "upload";
  if (typeof item?.FromSystem === "boolean") return item.FromSystem ? "platform" : "upload";

  const raw = String(item?.source ?? item?.origin ?? item?.item_source ?? "platform")
    .trim()
    .toLowerCase();

  return ["upload", "uploaded", "uploaded_by_user", "user", "manual", "custom"].includes(raw)
    ? "upload"
    : "platform";
}

function normalizeSelected(item: any) {
  const candidates = [item?.isSelected, item?.is_selected, item?.selected, item?.enable, item?.Enable, item?.enabled];

  for (const value of candidates) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes", "y"].includes(normalized)) return true;
      if (["false", "0", "no", "n"].includes(normalized)) return false;
    }
  }

  return true;
}

function unwrapPortfolioRoot(value: any, stdId?: string) {
  const root = value?.data ?? value ?? {};

  if (
    root?.info ||
    root?.Info ||
    root?.student_info ||
    root?.studentInfo ||
    root?.education ||
    root?.Education ||
    root?.skills ||
    root?.Skills ||
    root?.certificates ||
    root?.Certificates ||
    root?.experience ||
    root?.Experience ||
    root?.experiences
  ) {
    return root;
  }

  if (stdId && root?.[stdId]) return root[stdId];

  if (root?.std_id && typeof root.std_id === "object" && !Array.isArray(root.std_id)) {
    return root.std_id;
  }

  if (root?.portfolio && typeof root.portfolio === "object" && !Array.isArray(root.portfolio)) {
    return root.portfolio;
  }

  const firstObjectValue = Object.values(root).find(
    (item) => item && typeof item === "object" && !Array.isArray(item),
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
      `${url} failed: ${res.status} ${typeof json === "string" ? json : JSON.stringify(json)}`,
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

function normalizeStudentInfo(portfolioRoot: any, dashboardRoot: any) {
  const info = safeObject(
    portfolioRoot?.info ??
      portfolioRoot?.Info ??
      portfolioRoot?.student_info ??
      portfolioRoot?.studentInfo ??
      {},
  );

  const dashboardInfo = safeObject(
    dashboardRoot?.student_info ??
      dashboardRoot?.studentInfo ??
      dashboardRoot?.student ??
      dashboardRoot ??
      {},
  );

  return {
    first_name: pickString(info.first_name, info.firstName, info.FirstName, dashboardInfo.first_name, dashboardInfo.firstName, dashboardInfo.FirstName),
    last_name: pickString(info.last_name, info.lastName, info.LastName, dashboardInfo.last_name, dashboardInfo.lastName, dashboardInfo.LastName),
    birth_date: normalizeDate(info.birth_date ?? info.birthDate ?? info.BirthDate ?? dashboardInfo.birth_date ?? dashboardInfo.birthDate),
    phone: pickString(info.phone, info.Phone, dashboardInfo.phone),
    email: pickString(info.email, info.Email, dashboardInfo.email),
    address: pickString(info.address, info.Address, dashboardInfo.address),
    about_me: pickString(info.about_me, info.aboutMe, info.AboutMe, dashboardInfo.about_me, dashboardInfo.aboutMe),
    profile_image_url: pickString(
      info.profile_image_url,
      info.profileImageUrl,
      info.ProfileImageUrl,
      dashboardInfo.profile_image_url,
      dashboardInfo.profileImageUrl,
      dashboardInfo.avatar_image_url,
      dashboardInfo.avatarImageUrl,
    ),
  };
}

function normalizeEducation(portfolioRoot: any) {
  const list = safeArray<any>(portfolioRoot?.education ?? portfolioRoot?.Education ?? []);

  return list
    .map((item, index) => ({
      id: pickString(item?.id, item?.educationID, item?.EducationID) || `education-${index}`,
      school: pickString(item?.institution, item?.Institution, item?.school, item?.School, item?.university, item?.University, item?.facultyschool),
      degree: pickString(item?.degreeLevel, item?.DegreeLevel, item?.degree_level, item?.degree, item?.Degree),
      faculty: pickString(item?.faculty, item?.Faculty),
      fieldOfStudy: pickString(item?.major, item?.Major, item?.field_of_study, item?.fieldOfStudy, item?.FieldOfStudy),
      startYear: pickString(item?.startYear, item?.StartYear, item?.start_year),
      endYear: pickString(item?.endYear, item?.EndYear, item?.end_year),
      gpa: pickString(item?.gpa, item?.GPA),
    }))
    .filter((item) => Boolean(item.school || item.degree || item.faculty || item.fieldOfStudy));
}

function normalizeSkills(portfolioRoot: any) {
  const list = safeArray<any>(portfolioRoot?.skills ?? portfolioRoot?.Skills ?? []);
  const seen = new Set<string>();

  return list
    .map((item, index) => ({
      id: pickString(item?.skillID, item?.skill_id, item?.id) || `skill-${index}`,
      name: pickString(item?.name, item?.Name, item?.skillName, item?.skill_name),
      kind: normalizeSkillKind(item?.category ?? item?.Category ?? item?.kind),
      source: normalizeSource(item),
      isSelected: normalizeSelected(item),
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
  const list = safeArray<any>(portfolioRoot?.certificates ?? portfolioRoot?.Certificates ?? []);

  return list
    .map((item, index) => {
      const typeText = String(item?.type ?? item?.Type ?? item?.itemType ?? item?.item_type ?? "certificate").toLowerCase();
      const link = pickString(
        item?.badgeLink,
        item?.badge_link,
        item?.badgeUrl,
        item?.badge_url,
        item?.certificateLink,
        item?.certificate_link,
        item?.fileUrl,
        item?.file_url,
        item?.url,
        item?.externalWebsite,
        item?.external_website,
      );

      return {
        id: pickString(item?.id, item?.certificate_id, item?.badge_id) || `certificate-${index}`,
        itemType: typeText === "badge" ? "badge" : "certificate",
        title: pickString(item?.name, item?.Name, item?.title, item?.certificate_name, item?.badge_name),
        date: normalizeDate(item?.date ?? item?.issue_date ?? item?.issued_at),
        badgeLink: link,
        fileName: pickString(item?.fileName, item?.file_name),
        source: normalizeSource(item),
        isSelected: normalizeSelected(item),
      };
    })
    .filter((item) => Boolean(item.title) && item.isSelected !== false);
}

function normalizeExperiences(portfolioRoot: any) {
  const list = safeArray<any>(portfolioRoot?.experience ?? portfolioRoot?.Experience ?? portfolioRoot?.experiences ?? []);

  return list
    .map((item, index) => {
      const start = pickString(item?.StartYear, item?.startYear, item?.start_year);
      const end = pickString(item?.EndYear, item?.endYear, item?.end_year);
      const period = pickString(item?.period, item?.year, item?.date) || (start || end ? `${start || "-"} - ${end || "Present"}` : "");

      return {
        id: pickString(item?.activityID, item?.ActivityID, item?.activity_id, item?.id) || `experience-${index}`,
        period,
        title: pickString(item?.topic, item?.Topic, item?.title, item?.activity_name),
        description: pickString(item?.description, item?.Description, item?.detail, item?.subtitle),
        source: normalizeSource(item),
        isSelected: normalizeSelected(item),
      };
    })
    .filter((item) => Boolean(item.title) && item.isSelected !== false);
}

export async function GET(
  req: Request,
  context: { params: Promise<{ stdId: string }> | { stdId: string } },
) {
  try {
    const sess = getSessionTokens(req);
    if (!sess) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const stdId = String(params?.stdId ?? "").trim();

    if (!stdId) {
      return NextResponse.json({ ok: false, message: "Missing student id" }, { status: 400 });
    }

    const [portfolioJson, dashboardJson] = await Promise.all([
      tryFetchJson(`${BACKEND}/student/${stdId}/portfolio`, sess.accessToken),
      tryFetchJson(`${BACKEND}/student/${stdId}/dashboard`, sess.accessToken),
    ]);

    const portfolioRoot = unwrapPortfolioRoot(portfolioJson, stdId);
    const dashboardRoot = dashboardJson?.data ?? dashboardJson ?? {};

    const data = {
      student_info: normalizeStudentInfo(portfolioRoot, dashboardRoot),
      education: normalizeEducation(portfolioRoot),
      skills: normalizeSkills(portfolioRoot),
      certificates: normalizeCertificates(portfolioRoot),
      experiences: normalizeExperiences(portfolioRoot),
    };

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error?.message || "Server Error" },
      { status: 500 },
    );
  }
}
