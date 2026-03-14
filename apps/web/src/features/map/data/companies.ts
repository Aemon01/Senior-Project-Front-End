import { Company } from "../types";

export const DEFAULT_COMPANIES: Company[] = [
  {
    id: "c1",
    name: "CyberIndustries",
    tagline: "Internship • Challenge • Workshop",
    description:
      "องค์กรด้าน Cybersecurity ที่เปิดรับนักศึกษาเข้าร่วมกิจกรรม/โปรเจกต์ พร้อมมี mentorship.",
    tags: ["Cybersecurity", "Internship", "Workshops"],
    logoText: "CI",
    meshKeys: ["house_big"],
  },
  {
    id: "c2",
    name: "FreshMart Co.",
    tagline: "Retail Tech • Data • Operations",
    description:
      "บริษัทค้าปลีกที่มีโปรแกรมฝึกงานด้าน Data/Software และกิจกรรมการแข่งขันด้านระบบ.",
    tags: ["Retail", "Data", "Software"],
    logoText: "FM",
    meshKeys: ["supermarket"],
  },
  {
    id: "c3",
    name: "NextTower Group",
    tagline: "Software • Product • UX",
    description:
      "บริษัทสายผลิตภัณฑ์ดิจิทัล มีคอร์ส/กิจกรรมพัฒนาทักษะ และรับนักศึกษาฝึกงาน.",
    tags: ["Product", "Frontend", "UX"],
    logoText: "NT",
    meshKeys: ["building"],
  },
];

export function buildCompanyIndex(companies: Company[]) {
  const index: Record<string, Company> = {};
  for (const company of companies) {
    const keys = company.meshKeys ?? [];
    for (const key of keys) {
      index[key.toLowerCase()] = company;
    }
  }
  return index;
}

export const DEFAULT_COMPANY_INDEX = buildCompanyIndex(DEFAULT_COMPANIES);

export function resolveCompanyByMeshName(
  meshName: string,
  index: Record<string, Company>
): Company | null {
  const lower = meshName.toLowerCase();
  const keys = Object.keys(index);
  const hitKey = keys.find((k) => lower.includes(k));
  return hitKey ? index[hitKey] : null;
}

export function buildFallbackCompany(meshName: string): Company {
  return {
    id: "unknown",
    name: meshName,
    tagline: "Company profile",
    description:
      "ยังไม่ได้ map ข้อมูลบริษัทกับชื่อ mesh นี้ (เพิ่มใน meshKeys ของ company ได้เลย).",
    tags: ["Unmapped"],
    logoText: "?",
  };
}
