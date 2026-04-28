import { NextResponse } from "next/server";
import { decodeJwt } from "jose";

const BACKEND = process.env.BACKEND_URL!;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "vcep_session";

type SessionTokens = {
  accessToken: string;
  idToken: string;
};

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

function buildCandidateObjects(...values: unknown[]) {
  const candidates: Record<string, any>[] = [];

  const push = (value: unknown) => {
    const obj = safeObject(value);
    if (Object.keys(obj).length > 0) candidates.push(obj);
  };

  values.forEach((value) => {
    const root = safeObject(value);
    push(root);
    push(root?.Info);
    push(root?.info);
    push(root?.student_info);
    push(root?.studentInfo);
    push(root?.StudentInfo);
    push(root?.student);
    push(root?.Student);
    push(root?.profile);
    push(root?.Profile);
    push(root?.user);
    push(root?.User);
    push(root?.commonInfo);
    push(root?.common_info);
    push(root?.data);
    push(root?.data?.Info);
    push(root?.data?.info);
    push(root?.data?.student_info);
    push(root?.data?.studentInfo);
  });

  return candidates;
}

function pickStringFromObjects(objects: Record<string, any>[], ...keys: string[]) {
  for (const obj of objects) {
    for (const key of keys) {
      const s = pickString(obj?.[key]);
      if (s) return s;
    }
  }
  return "";
}

function firstNonEmptyArray<T = any>(...values: unknown[]): T[] {
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0) return value as T[];
  }
  for (const value of values) {
    if (Array.isArray(value)) return value as T[];
  }
  return [];
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

function normalizeStudentInfo(portfolioRoot: any, dashboardRoot: any, studentRoot: any) {
  const infoObjects = buildCandidateObjects(portfolioRoot, dashboardRoot, studentRoot);

  return {
    first_name: pickStringFromObjects(infoObjects, "first_name", "firstName", "FirstName", "name", "full_name", "fullName"),
    last_name: pickStringFromObjects(infoObjects, "last_name", "lastName", "LastName", "surname", "family_name", "familyName"),
    birth_date: normalizeDate(
      pickStringFromObjects(infoObjects, "birth_date", "birthDate", "BirthDate", "dob", "date_of_birth")
    ),
    phone: pickStringFromObjects(infoObjects, "phone", "Phone", "phone_number", "phoneNumber"),
    email: pickStringFromObjects(infoObjects, "email", "Email"),
    address: pickStringFromObjects(infoObjects, "address", "Address", "location", "Location"),
    about_me: pickStringFromObjects(infoObjects, "about_me", "aboutMe", "AboutMe", "bio", "description"),
    profile_image_url: pickStringFromObjects(
      infoObjects,
      "profile_image_url",
      "profileImageUrl",
      "ProfileImageUrl",
      "profile_url",
      "image_url",
      "imageUrl"
    ),
    avatar_image_url: pickStringFromObjects(
      infoObjects,
      "avatar_image_url",
      "avatarImageUrl",
      "AvatarImageUrl",
      "avatar_url",
      "avatarUrl"
    ),
  };
}

function normalizeEducation(portfolioRoot: any, dashboardRoot: any, studentRoot: any) {
  const list = firstNonEmptyArray<any>(
    portfolioRoot?.Education,
    portfolioRoot?.education,
    dashboardRoot?.Education,
    dashboardRoot?.education,
    studentRoot?.Education,
    studentRoot?.education
  );

  console.log("[normalizeEducation] raw list:", JSON.stringify(list));

  return list
    .map((item, index) => ({
      id: `education-${index}`,
      school: pickString(item?.institution, item?.school, item?.university, item?.facultyschool),
      degree: pickString(item?.degreeLevel, item?.degree_level, item?.degree),
      faculty: pickString(item?.faculty),
      fieldOfStudy: pickString(item?.major, item?.field_of_study, item?.fieldOfStudy),
      startYear: String(item?.startYear ?? item?.start_year ?? ""),
      endYear: String(item?.endYear ?? item?.end_year ?? ""),
      gpa: pickString(item?.gpa),
    }))
    .filter((item) => Boolean(item.school || item.degree || item.faculty || item.fieldOfStudy));
}

function normalizeSkills(portfolioRoot: any) {
  const list = safeArray<any>(portfolioRoot?.Skills ?? portfolioRoot?.skills ?? []);
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  return list
    .map((item, index) => ({
      id: pickString(item?.skillID, item?.skill_id) || `skill-${index}`,
      name: pickString(item?.name, item?.Name),
      kind: normalizeSkillKind(item?.category ?? item?.Category ?? item?.kind),
      source: (item?.fromSystem === true || item?.FromSystem === true) ? "platform" : "upload",
      isSelected: typeof item?.enable === "boolean" ? item.enable : (typeof item?.Enable === "boolean" ? item.Enable : true),
    }))
    .filter((item) => {
      if (!item.name) return false;
      // dedup: prefer keeping the one with isSelected=true (by skillID first, then name+kind)
      const nameKey = `${item.name.toLowerCase()}|${item.kind}`;
      if (item.id && !item.id.startsWith("skill-")) {
        if (seenIds.has(item.id)) return false;
        seenIds.add(item.id);
      } else {
        if (seenNames.has(nameKey)) return false;
        seenNames.add(nameKey);
      }
      return true;
    });
}

function normalizeCertificates(portfolioRoot: any) {
  const list = safeArray<any>(portfolioRoot?.Certificates ?? portfolioRoot?.certificates ?? []);
  return list
    .map((item, index) => {
      const typeStr = String(item?.Type ?? item?.type ?? item?.itemType ?? "certificate").toLowerCase();
      return {
        id: pickString(item?.certificateID, item?.certificate_id, item?.id) || `certificate-${index}`,
        itemType: typeStr === "badge" ? "badge" : "certificate",
        title: pickString(item?.name, item?.Name, item?.title),
        date: normalizeDate(item?.date ?? item?.issue_date),
        badgeLink: pickString(item?.badgeLink, item?.badge_link),
        source: (item?.fromSystem === true || item?.FromSystem === true || item?.source === "platform") ? "platform" : "upload",
        isSelected: typeof item?.enable === "boolean" ? item.enable : (typeof item?.Enable === "boolean" ? item.Enable : true),
      };
    })
    .filter((item) => Boolean(item.title)); // filter empty certificates
}

function normalizeExperiences(portfolioRoot: any) {
  const list = safeArray<any>(portfolioRoot?.Experience ?? portfolioRoot?.experience ?? []);
  const seen = new Set<string>();
  return list
    .map((item, index) => {
      const start = String(item?.startYear ?? item?.StartYear ?? item?.start_year ?? "");
      const end = String(item?.endYear ?? item?.EndYear ?? item?.end_year ?? "");
      const startNum = parseInt(start) || 0;
      const endNum = parseInt(end) || 0;
      const period = startNum && endNum
        ? `${startNum} - ${endNum}`
        : startNum ? String(startNum) : endNum ? String(endNum) : "";
      // Preserve enable field so client knows which platform items are active/inactive
      const enable = typeof item?.enable === "boolean" ? item.enable : true;
      return {
        id: pickString(item?.activityID, item?.ActivityID) || `experience-${index}`,
        period,
        title: pickString(item?.topic, item?.Topic),
        description: pickString(item?.description, item?.Description),
        source: (item?.fromSystem === true || item?.FromSystem === true) ? "platform" : "upload",
        enable,
        files: [],
      };
    })
    .filter((item) => {
      // Filter out mock data but KEEP disabled platform items (enable=false)
      if (!item.title || item.title === "string") return false;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
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
      profile_image_url: pickString(body?.profile_image_url),
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
    return safeArray<any>(body?.certificates ?? body).map((item) => ({
      name: pickString(item?.name, item?.title),
      type: String(item?.itemType ?? item?.type ?? "certificate"),
      badgeLink: pickString(item?.badgeLink, item?.badge_link),
      fromSystem: item?.source === "platform" || item?.fromSystem === true,
      enable: typeof item?.isSelected === "boolean" ? item.isSelected : (typeof item?.enable === "boolean" ? item.enable : true),
    }));
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

    const [portfolioJson, dashboardJson, studentJson] = await Promise.all([
      tryFetchJson(`${BACKEND}/student/${stdId}/portfolio`, sess.accessToken),
      tryFetchJson(`${BACKEND}/student/${stdId}/dashboard`, sess.accessToken),
      tryFetchJson(`${BACKEND}/student/${stdId}`, sess.accessToken),
    ]);

    // Backend may wrap with: { data: {...} } or { std_id: {...} } or flat
    function unwrapPortfolio(json: any): any {
      if (!json) return {};
      // { data: { Info, Education, ... } }
      if (json?.data?.Info || json?.data?.Education || json?.data?.Skills) return json.data;
      if (json?.data) return json.data;
      // { std_id: { Info, Education, ... } } — std_id is a dynamic UUID key
      const keys = Object.keys(json);
      if (keys.length === 1 && json[keys[0]]?.Info !== undefined) return json[keys[0]];
      // flat: { Info, Education, ... }
      if (json?.Info || json?.Education) return json;
      return json;
    }

    const portfolioRoot = unwrapPortfolio(portfolioJson);
    const dashboardRoot = unwrapPortfolio(dashboardJson);
    const studentRoot = unwrapPortfolio(studentJson);

    console.log("portfolioRoot keys: ", portfolioRoot ? Object.keys(portfolioRoot) : "null");
    console.log("portfolioRoot.Info: ", portfolioRoot?.Info ?? portfolioRoot?.info ?? "NOT FOUND");
    var data = {
      student_info: normalizeStudentInfo(portfolioRoot, dashboardRoot, studentRoot),
      education: normalizeEducation(portfolioRoot, dashboardRoot, studentRoot),
      skills: normalizeSkills(portfolioRoot),
      certificates: normalizeCertificates(portfolioRoot),
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

    console.log("payload: ", JSON.stringify(payload, null, 2));
    console.log("[PUT experience] enable values:", type === "experience" ? (Array.isArray(payload) ? payload.map((i: any) => ({ id: i.activityID, enable: i.enable })) : "not array") : "n/a");

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