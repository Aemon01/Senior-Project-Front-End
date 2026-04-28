"use client";

import Image from "next/image";
import {
  useMemo,
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  Suspense,
} from "react";
import { useRouter } from "next/navigation";
import { ORGANIZATION_SIDEBAR_ITEMS } from "@/lib/config/organization/routes";
import styles from "./OrgDashboard.module.css";
import { Canvas, useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

type OrgForm = {
  orgName: string;
  companySize: string;
  businessType: string;
  location: string;
  aboutUs: string;

  logoFile: File | null;
  logoPreview: string | null;

  email: string;
  phone: string;
  website: string;

  linkedin: string;
  facebook: string;
  instagram: string;
  youtube: string;
  tiktok: string;
};

type AvatarOption = {
  id: string;
  modelUrl: string;
  unlockLevel: number;
};

type Employee = {
  id: string;
  userId: string;
  orgId: string;
  firstName: string;
  lastName: string;
  position: string;
  phone: string;
  email: string;
  canCheckChallenge: boolean;
  avatarId: string | null;
  legacyAvatarIndex: number | null;
};

const emptyEmp = (id: string, userId = "", orgId = ""): Employee => ({
  id,
  userId,
  orgId,
  firstName: "",
  lastName: "",
  position: "",
  phone: "",
  email: "",
  canCheckChallenge: false,
  avatarId: null,
  legacyAvatarIndex: null,
});

type StatsTab = "all" | "participants" | "skills";
type ActivityFilter = "all" | "Meetings" | "Courses" | "Challenges";
type ActivityStatusTone = "pending" | "join" | "ended";

type GraphBar = {
  label: string;
  value: number;
};

type OrgActivityRow = {
  id: string;
  title: string;
  difficulty: string;
  category: string;
  kind: Exclude<ActivityFilter, "all">;
  xp: number;
  status: string;
  statusLabel: string;
  statusTone: ActivityStatusTone;
  createdAt: string;
};

type ParticipantItem = {
  id: string;
  name: string;
  subtitle: string;
  score: number;
  avatarBg: string;
  initials: string;
  level: number;
  profileImage: string;
  email?: string;
  phone?: string;
  address?: string;
  about?: string;
  university?: string;
  faculty?: string;
  major?: string;
};

type PortfolioSource = "platform" | "upload" | "user" | "uploaded_by_user" | "manual" | "custom" | string;

type ParticipantPortfolioData = {
  studentInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
    aboutMe: string;
    profileImageUrl: string;
  };
  education: Array<{
    id: string;
    school: string;
    degree: string;
    faculty: string;
    fieldOfStudy: string;
    startYear: string;
    endYear: string;
    gpa: string;
  }>;
  skills: Array<{
    id: string;
    name: string;
    kind: "soft" | "technical";
    source: PortfolioSource;
    isSelected?: boolean;
  }>;
  certificates: Array<{
    id: string;
    title: string;
    date: string;
    itemType: "certificate" | "badge";
    source: PortfolioSource;
    isSelected?: boolean;
  }>;
  experiences: Array<{
    id: string;
    period: string;
    title: string;
    description: string;
    source: PortfolioSource;
  }>;
};

const LEVEL_BADGES = [
  "/images/icons/badge01.png",
  "/images/icons/badge02.png",
  "/images/icons/badge03.png",
  "/images/icons/badge04.png",
  "/images/icons/badge05.png",
];

function getLevelBadgeSrc(level: number): string {
  const thresholds = [1, 3, 5, 10, 16];
  const filled = thresholds.filter((lv) => level >= lv).length;
  const index = filled > 0 ? Math.min(filled - 1, LEVEL_BADGES.length - 1) : -1;
  return index >= 0 ? LEVEL_BADGES[index] : "/images/icons/badge01-icon.png";
}

// ─── Employee Avatar Viewer ───────────────────────────────────────────────────

function pickIdleClip(names: string[]) {
  const lowered = names.map((name) => name.toLowerCase());
  const idleIndex = lowered.findIndex((name) => name.includes("idle"));
  if (idleIndex >= 0) return names[idleIndex];
  const loopIndex = lowered.findIndex(
    (name) => name.includes("walk") || name.includes("run"),
  );
  if (loopIndex >= 0) return names[loopIndex];
  return names[0];
}

function AnimatedAvatarGLB({ url }: { url: string }) {
  const group = useRef<THREE.Group>(null);
  const gltf = useGLTF(url);
  const clonedScene = useMemo(() => cloneSkinned(gltf.scene), [gltf.scene]);
  const { actions, names, mixer } = useAnimations(gltf.animations, group);

  useEffect(() => {
    if (!names?.length) return;

    names.forEach((name) => {
      const action = actions[name];
      if (!action) return;
      action.stop();
      action.reset();
    });

    const idleName = pickIdleClip(names);
    const activeAction = actions[idleName];
    if (!activeAction) return;

    activeAction.reset();
    activeAction.setLoop(THREE.LoopRepeat, Infinity);
    activeAction.setEffectiveWeight(1);
    activeAction.setEffectiveTimeScale(1);
    activeAction.fadeIn(0.2);
    activeAction.play();

    return () => {
      activeAction.stop();
    };
  }, [actions, names, url]);

  useFrame((_, delta) => mixer?.update(delta));

  return (
    <group ref={group}>
      <primitive object={clonedScene as any} />
    </group>
  );
}

function EmployeeAvatarViewer({ modelUrl }: { modelUrl: string | null }) {
  if (!modelUrl) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f7f7",
          color: "#9ca3af",
          fontSize: 10,
          fontWeight: 600,
        }}
      >
        No avatar
      </div>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 1.25, 1.8] as [number, number, number], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.5]}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 5, 3]} intensity={1.1} />
      <Suspense fallback={null}>
        <group position={[0, -1.3, 0]} scale={2.0} rotation={[-0.5, -0.5, 0]}>
          <AnimatedAvatarGLB key={modelUrl} url={modelUrl} />
        </group>
      </Suspense>
    </Canvas>
  );
}

function EmployeeAvatarOptionPreview({
  modelUrl,
}: {
  modelUrl: string | null;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
        borderRadius: 12,
        background: "#f7f7f7",
        pointerEvents: "none",
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        <EmployeeAvatarViewer modelUrl={modelUrl} />
      </div>
    </div>
  );
}

// ─── 3D Building Viewer ──────────────────────────────────────────────────────

// FALLBACK_GLB: ไฟล์เล็กที่โหลดได้เสมอ ป้องกัน useGLTF hook เรียกแบบ conditional
const FALLBACK_GLB =
  "https://vcep-assets-dev.s3.ap-southeast-2.amazonaws.com/building-models/building-model-typeB.glb";

function NormalizedBuildingInner({ url }: { url: string }) {
    // useGLTF ต้องเรียกเสมอ (ไม่ conditional) — ใช้ fallback ถ้า url ว่าง
    const { scene } = useGLTF(url || FALLBACK_GLB);
    const normalized = useMemo(() => {
        const root = scene.clone(true);
        root.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const scale = 2.2 / Math.max(size.y, 0.0001);
        root.scale.setScalar(scale);
        root.updateMatrixWorld(true);
        const scaledBox = new THREE.Box3().setFromObject(root);
        const center = scaledBox.getCenter(new THREE.Vector3());
        root.position.set(-center.x, -scaledBox.min.y, -center.z);
        return root;
    }, [scene]);
    return <primitive object={normalized as any} />;
}

function OrgBuildingViewer({ modelUrl }: { modelUrl: string | null }) {
  if (!modelUrl) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f7f7",
          color: "#9ca3af",
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        No building
      </div>
    );
  }
  return (
    <Canvas
      frameloop="demand"
      // กล้องห่างขึ้น fov เล็กลง = model ดูพอดีใน frame 220px
      camera={{ position: [0, 1.6, 7.2] as [number, number, number], fov: 25 }}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
      style={{ width: "100%", height: "100%" }}
    >
      {/* แสงนุ่ม เหมือน card อื่น — ambient สว่าง + directional อ่อน */}
      <ambientLight intensity={1.4} />
      <directionalLight position={[5, 10, 6]} intensity={0.7} />
      <directionalLight position={[-4, 4, -4]} intensity={0.25} />
      <Suspense fallback={null}>
        {/* ขยับ model ลงเล็กน้อย + หมุนมุมเดียวกับ fill-more-info */}
        <group
          position={[0, -0.85, 0] as [number, number, number]}
          rotation={[-0.06, -0.5, 0] as [number, number, number]}
        >
          <NormalizedBuildingInner url={modelUrl} />
        </group>
      </Suspense>
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function OrgDashboardPage() {
  const router = useRouter();
  const [isEditOrgOpen, setIsEditOrgOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [orgSaving, setOrgSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const [orgDraft, setOrgDraft] = useState<OrgForm>({
    orgName: "",
    companySize: "",
    businessType: "",
    location: "",
    aboutUs: "",
    logoFile: null,
    logoPreview: null,
    email: "",
    phone: "",
    website: "",
    linkedin: "",
    facebook: "",
    instagram: "",
    youtube: "",
    tiktok: "",
  });

  const [summary, setSummary] = useState({
    totalActivities: 0,
    totalParticipants: 0,
    meetings: 0,
    courses: 0,
    challenges: 0,
    published: 0,
    draft: 0,
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [building, setBuilding] = useState<{
    buildingId: string;
    buildingName: string;
    modelUrl: string | null;
    previewUrl: string | null;
  } | null>(null);
  const [participantRows, setParticipantRows] = useState<ParticipantItem[]>([]);
  const [selectedParticipant, setSelectedParticipant] =
    useState<ParticipantItem | null>(null);
  const [participantPortfolio, setParticipantPortfolio] =
    useState<ParticipantPortfolioData | null>(null);
  const [participantPortfolioLoading, setParticipantPortfolioLoading] =
    useState(false);
  const [participantPortfolioError, setParticipantPortfolioError] =
    useState("");
  const [activityRows, setActivityRows] = useState<OrgActivityRow[]>([]);
  const [participantBars, setParticipantBars] = useState<GraphBar[]>([]);
  const [skillBars, setSkillBars] = useState<GraphBar[]>([]);

  // ── Computed: By-month distribution from activityRows.createdAt ──
  const monthDonutData = useMemo((): GraphBar[] => {
    const counts: Record<string, number> = {};
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    for (const act of activityRows) {
      if (!act.createdAt) continue;
      const d = new Date(act.createdAt);
      if (isNaN(d.getTime())) continue;
      const key = monthNames[d.getMonth()];
      counts[key] = (counts[key] ?? 0) + 1;
    }
    // order by calendar month
    return monthNames
      .filter((m) => counts[m])
      .map((m) => ({ label: m, value: counts[m] }));
  }, [activityRows]);

  // ── Computed: Activity-type donut ──
  const typeDonutData = useMemo((): Array<{
    label: string;
    value: number;
    color: string;
  }> => {
    const colors: Record<string, string> = {
      Meetings: "#66bdce",
      Courses: "#a8dcb3",
      Challenges: "#ffd286",
    };
    const counts: Record<string, number> = {
      Meetings: 0,
      Courses: 0,
      Challenges: 0,
    };
    for (const act of activityRows) {
      if (counts[act.kind] !== undefined) counts[act.kind]++;
    }
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([label, value]) => ({
        label,
        value,
        color: colors[label] ?? "#cdb4db",
      }));
  }, [activityRows]);

  const [activeEmployeeEmail, setActiveEmployeeEmail] = useState<string>("");
  const [activeOrgId, setActiveOrgId] = useState<string>("");
  const [avatarOptions, setAvatarOptions] = useState<AvatarOption[]>([]);
  const [loadingAvatarOptions, setLoadingAvatarOptions] = useState(true);

  const setOrgField =
    (key: keyof OrgForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setOrgDraft((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const [cropOpen, setCropOpen] = useState(false);
  const [cropUrl, setCropUrl] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [imgNat, setImgNat] = useState({ w: 0, h: 0 });

  const cropBoxSize = 320;

  const openLogoCrop = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;

    const url = URL.createObjectURL(f);
    setCropUrl(url);
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
    setCropOpen(true);

    e.currentTarget.value = "";
  };

  const openEditOrg = () => setIsEditOrgOpen(true);
  const closeEditOrg = () => setIsEditOrgOpen(false);
  const closeSaved = () => setIsSavedOpen(false);

  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<Employee>(() => emptyEmp("draft"));
  const [employeeModalMode, setEmployeeModalMode] = useState<"add" | "edit">(
    "add",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  const setDraftField =
    (k: keyof Employee) => (e: ChangeEvent<HTMLInputElement>) => {
      const v =
        e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;

      setDraft((prev) => ({ ...prev, [k]: v }) as Employee);
    };

  const setDraftAvatar = (avatarId: string) =>
    setDraft((prev) => ({ ...prev, avatarId }));

  const openAdd = () => {
    setError("");
    setEmployeeModalMode("add");
    setDraft({
      ...emptyEmp("draft", "", activeOrgId),
      avatarId: avatarOptions[0]?.id ?? null,
    });
    setIsOpen(true);
  };

  const openEditEmployee = (employee: Employee) => {
    setError("");
    setEmployeeModalMode("edit");
    setDraft({
      ...employee,
      orgId: employee.orgId || activeOrgId,
      avatarId:
        employee.avatarId ||
        resolveAvatarOption(employee)?.id ||
        avatarOptions[0]?.id ||
        null,
    });
    setIsOpen(true);
  };

  const closeAdd = () => {
    if (saving) return;
    setIsOpen(false);
  };

  const [statsTab, setStatsTab] = useState<StatsTab>("participants");
  const [selectedActivityKind, setSelectedActivityKind] =
    useState<ActivityFilter>("all");
  const [isActivityTypeOpen, setIsActivityTypeOpen] = useState(false);

  function normalizePortfolioSource(source?: PortfolioSource): "upload" | "platform" {
    const normalized = String(source ?? "platform").trim().toLowerCase();
    if (
      [
        "upload",
        "uploaded",
        "uploaded_by_user",
        "uploaded by user",
        "user",
        "manual",
        "custom",
      ].includes(normalized)
    ) {
      return "upload";
    }
    return "platform";
  }

  function getPortfolioSourceIcon(source?: PortfolioSource) {
    return normalizePortfolioSource(source) === "upload"
      ? "/images/icons/sign01-icon.png"
      : "/images/icons/sign02-icon.png";
  }

  function makePortfolioId(prefix: string, item: any, index: number) {
    return String(
      item?.id ??
        item?.skill_id ??
        item?.certificate_id ??
        item?.badge_id ??
        item?.activity_id ??
        item?.portfolio_id ??
        `${prefix}-${index}`,
    );
  }

  function normalizeRawList(...values: any[]): any[] {
    for (const value of values) {
      if (Array.isArray(value)) return value;
    }
    return [];
  }

  function normalizeEducationItems(value: any): ParticipantPortfolioData["education"] {
    if (typeof value === "string" && value.trim()) {
      return [
        {
          id: "education-text-0",
          school: value.trim(),
          degree: "",
          faculty: "",
          fieldOfStudy: "",
          startYear: "",
          endYear: "",
          gpa: "",
        },
      ];
    }

    if (!Array.isArray(value)) return [];

    return value.map((item: any, index: number) => ({
      id: makePortfolioId("education", item, index),
      school: String(item?.school ?? item?.university ?? item?.institution ?? item?.title ?? "").trim(),
      degree: String(item?.degree ?? item?.education_level ?? "").trim(),
      faculty: String(item?.faculty ?? "").trim(),
      fieldOfStudy: String(item?.fieldOfStudy ?? item?.field_of_study ?? item?.major ?? item?.department ?? "").trim(),
      startYear: String(item?.startYear ?? item?.start_year ?? item?.from ?? "").trim(),
      endYear: String(item?.endYear ?? item?.end_year ?? item?.to ?? "").trim(),
      gpa: String(item?.gpa ?? "").trim(),
    }));
  }

  function normalizeSkillItems(root: any): ParticipantPortfolioData["skills"] {
    const skillGroups: Array<{ value: any[]; kind?: "soft" | "technical" }> = [
      { value: normalizeRawList(root?.skills, root?.Skills) },
      { value: normalizeRawList(root?.softSkills, root?.soft_skills), kind: "soft" },
      { value: normalizeRawList(root?.technicalSkills, root?.technical_skills), kind: "technical" },
    ];

    return skillGroups.flatMap(({ value, kind }) =>
      value.map((item: any, index: number) => {
        const category = String(item?.kind ?? item?.category ?? item?.skill_category ?? item?.type ?? "").toLowerCase();
        const inferredKind: "soft" | "technical" =
          kind ?? (category.includes("soft") ? "soft" : "technical");

        return {
          id: makePortfolioId(`skill-${inferredKind}`, item, index),
          name:
            String(item?.name ?? item?.title ?? item?.skill_name ?? item?.skillName ?? "").trim() ||
            "Skill",
          kind: inferredKind,
          source: item?.source ?? item?.origin ?? item?.item_source ?? item?.created_by_type ?? "platform",
          isSelected: item?.isSelected ?? item?.is_selected ?? item?.selected,
        };
      }),
    );
  }

  function normalizeCertificateItems(root: any): ParticipantPortfolioData["certificates"] {
    const certificates = normalizeRawList(root?.certificates, root?.certificate, root?.Certificates).map(
      (item: any, index: number) => ({
        id: makePortfolioId("certificate", item, index),
        title:
          String(item?.title ?? item?.name ?? item?.certificate_name ?? item?.certificateName ?? "").trim() ||
          "Certificate",
        date: String(item?.date ?? item?.issued_at ?? item?.year ?? "").trim(),
        itemType: "certificate" as const,
        source: item?.source ?? item?.origin ?? item?.item_source ?? item?.created_by_type ?? "platform",
        isSelected: item?.isSelected ?? item?.is_selected ?? item?.selected,
      }),
    );

    const badges = normalizeRawList(root?.badges, root?.badge, root?.Badges).map((item: any, index: number) => ({
      id: makePortfolioId("badge", item, index),
      title: String(item?.title ?? item?.name ?? item?.badge_name ?? item?.badgeName ?? "").trim() || "Badge",
      date: String(item?.date ?? item?.issued_at ?? item?.year ?? "").trim(),
      itemType: "badge" as const,
      source: item?.source ?? item?.origin ?? item?.item_source ?? item?.created_by_type ?? "platform",
      isSelected: item?.isSelected ?? item?.is_selected ?? item?.selected,
    }));

    return [...certificates, ...badges];
  }

  function normalizeExperienceItems(root: any): ParticipantPortfolioData["experiences"] {
    return normalizeRawList(
      root?.experiences,
      root?.experience,
      root?.Experience,
      root?.activities,
      root?.Activities,
    ).map((item: any, index: number) => ({
      id: makePortfolioId("experience", item, index),
      period: String(item?.period ?? item?.year ?? item?.date ?? item?.activity_year ?? "").trim(),
      title:
        String(item?.title ?? item?.name ?? item?.activity_name ?? item?.certificate_name ?? "").trim() ||
        "Activity",
      description: String(item?.description ?? item?.detail ?? item?.activity_detail ?? item?.subtitle ?? "").trim(),
      source: item?.source ?? item?.origin ?? item?.item_source ?? item?.created_by_type ?? "platform",
    }));
  }


  function normalizeS3ImageUrl(value: unknown) {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    if (raw.startsWith("http") || raw.startsWith("data:")) return raw;
    if (/^[0-9a-f-]{36}$/i.test(raw)) return "";
    return `https://vcep-assets-dev.s3.ap-southeast-2.amazonaws.com/${raw.replace(/^\/+/, "")}`;
  }

  function normalizeParticipantPortfolio(
    data: any,
    fallback: ParticipantItem,
  ): ParticipantPortfolioData {
    const root = data?.data ?? data?.portfolio ?? data ?? {};
    const info =
      root?.studentInfo ??
      root?.student_info ??
      root?.student ??
      root?.profile ??
      root?.Info ??
      root?.info ??
      root?.data?.studentInfo ??
      root?.data?.student_info ??
      {};

    const firstName = String(info?.firstName ?? info?.first_name ?? info?.FirstName ?? info?.name?.split?.(" ")?.[0] ?? "").trim();
    const lastName = String(info?.lastName ?? info?.last_name ?? info?.LastName ?? info?.name?.split?.(" ")?.slice?.(1)?.join?.(" ") ?? "").trim();
    const fallbackNames = fallback.name.split(/\s+/).filter(Boolean);
    const resolvedFirstName = firstName || fallbackNames[0] || fallback.name;
    const resolvedLastName = lastName || fallbackNames.slice(1).join(" ");

    const rawPhoto = String(
      info?.profileImageUrl ??
        info?.profile_image_url ??
        info?.avatarImageUrl ??
        info?.avatar_image_url ??
        info?.profileImage ??
        info?.profile_image ??
        fallback.profileImage ??
        "",
    ).trim();

    const educationValue =
      root?.education ??
      root?.Education ??
      info?.education ??
      info?.Education ??
      root?.education_text ??
      root?.student_info?.education ??
      root?.studentInfo?.education ??
      "";

    return {
      studentInfo: {
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        phone: String(info?.phone ?? info?.Phone ?? info?.phone_number ?? fallback.phone ?? "").trim(),
        email: String(info?.email ?? info?.Email ?? fallback.email ?? "").trim(),
        address: String(info?.address ?? info?.Address ?? info?.location ?? fallback.address ?? "").trim(),
        aboutMe: String(info?.aboutMe ?? info?.about_me ?? info?.AboutMe ?? info?.about ?? info?.bio ?? root?.bio ?? fallback.about ?? "").trim(),
        profileImageUrl: normalizeS3ImageUrl(rawPhoto) || fallback.profileImage,
      },
      education: normalizeEducationItems(educationValue),
      skills: normalizeSkillItems(root),
      certificates: normalizeCertificateItems(root),
      experiences: normalizeExperienceItems(root),
    };
  }

  function getParticipantPopupName() {
    const info = participantPortfolio?.studentInfo;
    const fromPortfolio = [info?.firstName, info?.lastName].filter(Boolean).join(" ").trim();
    return fromPortfolio || selectedParticipant?.name || "Student";
  }

  function formatEducationLine(item: ParticipantPortfolioData["education"][number]) {
    const title = [item.school, item.faculty, item.fieldOfStudy].filter(Boolean).join(" • ");
    const year = [item.startYear, item.endYear].filter(Boolean).join(" - ");
    const degree = item.degree ? ` (${item.degree})` : "";
    const gpa = item.gpa ? ` • GPA ${item.gpa}` : "";
    return `${title || "Education"}${degree}${year ? ` • ${year}` : ""}${gpa}`;
  }

  async function openParticipantPortfolio(person: ParticipantItem) {
    setSelectedParticipant(person);
    setParticipantPortfolio(null);
    setParticipantPortfolioError("");
    setParticipantPortfolioLoading(true);

    try {
      const response = await fetch(
        `/api/organization/student/${person.id}/portfolio`,
        {
          cache: "no-store",
          credentials: "include",
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Failed to load student portfolio");
      }
      setParticipantPortfolio(normalizeParticipantPortfolio(data, person));
    } catch (error: any) {
      setParticipantPortfolioError(
        error?.message || "Failed to load student portfolio",
      );
      setParticipantPortfolio(normalizeParticipantPortfolio({}, person));
    } finally {
      setParticipantPortfolioLoading(false);
    }
  }

  function closeParticipantPortfolio() {
    setSelectedParticipant(null);
    setParticipantPortfolio(null);
    setParticipantPortfolioError("");
    setParticipantPortfolioLoading(false);
  }

  function toStringValue(value: unknown, fallback = "") {
    const text = String(value ?? "").trim();
    return text || fallback;
  }

  function toNumber(value: unknown, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function normalizeExternalUrl(value: unknown) {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    if (/^(https?:)?\/\//i.test(raw)) {
      return raw.startsWith("//") ? `https:${raw}` : raw;
    }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return `mailto:${raw}`;
    return `https://${raw.replace(/^\/+/, "")}`;
  }

  function getHostLabel(value: string) {
    try {
      const url = new URL(normalizeExternalUrl(value));
      return url.hostname.replace(/^www\./, "");
    } catch {
      return (
        value
          .replace(/^https?:\/\//i, "")
          .replace(/^www\./i, "")
          .split("/")[0] || value
      );
    }
  }

  const orgLinkItems = useMemo(
    () =>
      [
        { key: "website", label: "Website", value: orgDraft.website },
        { key: "linkedin", label: "LinkedIn", value: orgDraft.linkedin },
        { key: "facebook", label: "Facebook", value: orgDraft.facebook },
        { key: "instagram", label: "Instagram", value: orgDraft.instagram },
        { key: "youtube", label: "YouTube", value: orgDraft.youtube },
        { key: "tiktok", label: "TikTok", value: orgDraft.tiktok },
      ].filter((item) => item.value.trim()),
    [
      orgDraft.website,
      orgDraft.linkedin,
      orgDraft.facebook,
      orgDraft.instagram,
      orgDraft.youtube,
      orgDraft.tiktok,
    ],
  );

  function resolveLegacyAvatarIndex(value: unknown) {
    const raw = String(value ?? "").trim();
    if (!raw) return null;
    const match = raw.match(/(\d+)/);
    if (!match) return null;
    const numeric = Number(match[1]);
    if (!Number.isFinite(numeric)) return null;
    return Math.max(0, (numeric || 1) - 1);
  }

  function resolveAvatarOption(
    employee: Pick<Employee, "avatarId" | "legacyAvatarIndex">,
  ) {
    if (!avatarOptions.length) return null;

    const avatarRef = String(employee.avatarId ?? "").trim();

    if (avatarRef) {
      const exact = avatarOptions.find(
        (option) => option.id === avatarRef || option.modelUrl === avatarRef,
      );
      if (exact) return exact;

      const refIndex = resolveLegacyAvatarIndex(avatarRef);
      if (refIndex !== null) {
        return (
          avatarOptions[refIndex % avatarOptions.length] ?? avatarOptions[0]
        );
      }
    }

    if (
      typeof employee.legacyAvatarIndex === "number" &&
      employee.legacyAvatarIndex >= 0
    ) {
      return (
        avatarOptions[employee.legacyAvatarIndex % avatarOptions.length] ??
        avatarOptions[0]
      );
    }

    return avatarOptions[0];
  }

  function deriveActivityKind(value: unknown): Exclude<ActivityFilter, "all"> {
    const raw = String(value ?? "")
      .trim()
      .toLowerCase();
    if (raw.includes("meeting")) return "Meetings";
    if (raw.includes("course")) return "Courses";
    return "Challenges";
  }

  function deriveStatusTone(value: unknown): ActivityStatusTone {
    const raw = String(value ?? "")
      .trim()
      .toLowerCase();
    if (
      raw.includes("end") ||
      raw.includes("close") ||
      raw.includes("complete") ||
      raw.includes("finish")
    ) {
      return "ended";
    }

    if (
      raw.includes("join") ||
      raw.includes("open") ||
      raw.includes("active") ||
      raw.includes("publish") ||
      raw.includes("public")
    ) {
      return "join";
    }

    return "pending";
  }

  function formatStatusLabel(
    value: unknown,
    fallbackTone?: ActivityStatusTone,
  ) {
    const raw = String(value ?? "").trim();
    if (raw) {
      return raw
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .map(
          (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
        )
        .join(" ");
    }

    if (fallbackTone === "join") return "Published";
    if (fallbackTone === "ended") return "Ended";
    return "Pending";
  }

  function getStatusBadgeClass(statusTone: ActivityStatusTone) {
    if (statusTone === "join")
      return `${styles.activityStatusBadge} ${styles.activityStatusBadgeJoin}`;
    if (statusTone === "ended")
      return `${styles.activityStatusBadge} ${styles.activityStatusBadgeEnded}`;
    return `${styles.activityStatusBadge} ${styles.activityStatusBadgePending}`;
  }

  async function loadAvatarOptions() {
    try {
      setLoadingAvatarOptions(true);
      const response = await fetch("/api/options/avatars/employee", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load employee avatars");
      }

      const options = (await response.json().catch(() => [])) as AvatarOption[];
      const safeOptions = Array.isArray(options) ? options : [];
      setAvatarOptions(safeOptions);
      safeOptions.forEach((option) => {
        if (option?.modelUrl) {
          useGLTF.preload(option.modelUrl);
        }
      });
    } catch {
      setAvatarOptions([]);
    } finally {
      setLoadingAvatarOptions(false);
    }
  }

  async function refreshDashboard() {
    try {
      setPageLoading(true);
      setPageError("");

      const response = await fetch("/api/organization/dashboard", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json?.ok) {
        throw new Error(
          json?.message || "Failed to load organization dashboard",
        );
      }

      const data = json?.data ?? {};
      const org = data?.org ?? {};
      const summaryData = data?.summary ?? {};

      setOrgDraft((prev) => ({
        ...prev,
        orgName: toStringValue(org?.orgName),
        companySize: toStringValue(org?.companySize),
        businessType: toStringValue(org?.businessType),
        location: toStringValue(org?.location),
        aboutUs: toStringValue(org?.aboutUs),
        logoPreview: org?.logoPreview ?? null,
        email: toStringValue(org?.email),
        phone: toStringValue(org?.phone),
        website: toStringValue(org?.website),
        linkedin: toStringValue(org?.linkedin),
        facebook: toStringValue(org?.facebook),
        instagram: toStringValue(org?.instagram),
        youtube: toStringValue(org?.youtube),
        tiktok: toStringValue(org?.tiktok),
      }));

      setSummary({
        totalActivities: toNumber(summaryData?.totalActivities, 0),
        totalParticipants: toNumber(summaryData?.totalParticipants, 0),
        meetings: toNumber(summaryData?.meetings, 0),
        courses: toNumber(summaryData?.courses, 0),
        challenges: toNumber(summaryData?.challenges, 0),
        published: toNumber(summaryData?.published, 0),
        draft: toNumber(summaryData?.draft, 0),
      });

      const nextActivities: OrgActivityRow[] = Array.isArray(data?.activities)
        ? data.activities.map((item: any, index: number) => {
            const statusTone = deriveStatusTone(
              item?.statusTone || item?.status,
            );
            return {
              id: toStringValue(item?.id, `activity-${index}`),
              title: toStringValue(item?.title, "Activity"),
              difficulty: toStringValue(item?.difficulty, "-"),
              category: toStringValue(
                item?.category,
                deriveActivityKind(item?.kind || item?.category),
              ),
              kind: deriveActivityKind(item?.kind || item?.category),
              xp: toNumber(item?.xp, 0),
              status: toStringValue(item?.status, "pending"),
              statusLabel: formatStatusLabel(
                item?.statusLabel || item?.status,
                statusTone,
              ),
              statusTone,
              createdAt: toStringValue(
                item?.createdAt ??
                  item?.created_at ??
                  item?.activity_create_at ??
                  item?.commonInfo?.activity_create_at ??
                  "",
              ),
            };
          })
        : [];
      setActivityRows(nextActivities);

      // fetch participants from all activities and deduplicate by std_id
      const activityIds = nextActivities.map((a) => a.id).filter(Boolean);
      let enrichedParticipants: ParticipantItem[] = [];
      if (activityIds.length > 0) {
        const allParticipantFetches = await Promise.all(
          activityIds.map((actId) =>
            fetch(`/api/organization/activity/${actId}/participants`, {
              cache: "no-store",
              credentials: "include",
            })
              .then((r) => r.json().catch(() => ({})))
              .then((d) =>
                Array.isArray(d?.participants) ? d.participants : [],
              )
              .catch(() => []),
          ),
        );

        const seen = new Set<string>();
        const deduped: ParticipantItem[] = [];

        for (const list of allParticipantFetches) {
          for (const person of list) {
            const uid = String(
              person?.std_id ??
                person?.StdID ??
                person?.student?.std_id ??
                person?.participant_info?.participant_id ??
                person?.id ??
                "",
            ).trim();
            if (!uid || seen.has(uid)) continue;
            seen.add(uid);

            const firstName = String(
              person?.first_name ??
                person?.participant_info?.participant_name?.split(" ")[0] ??
                "",
            ).trim();
            const lastName = String(person?.last_name ?? "").trim();
            const fullName =
              [firstName, lastName].filter(Boolean).join(" ") ||
              String(person?.name ?? "Participant").trim();
            const initials =
              [firstName[0], lastName[0]]
                .filter(Boolean)
                .join("")
                .toUpperCase() || "PT";
            const bio = String(
              person?.bio ??
                person?.about ??
                person?.student?.bio ??
                person?.participant_info?.participant_faculty ??
                "",
            ).trim();
            const uni = String(
              person?.university ??
                person?.student?.university ??
                person?.participant_info?.participant_university ??
                "",
            ).trim();
            const subtitle = bio || uni || "";
            const avatarColors = [
              "#f1d6d8",
              "#efd0bf",
              "#c7dce7",
              "#e5d7c8",
              "#d7e8d3",
              "#dcd7e8",
              "#e8e3d7",
            ];
            const avatarBg = avatarColors[deduped.length % avatarColors.length];

            const rawImg = String(
              person?.profile_image_url ??
                person?.profileImageUrl ??
                person?.profile_image ??
                person?.profileImage ??
                person?.student?.profile_image_url ??
                person?.student?.profile_image ??
                person?.participant_info?.participant_avatar ??
                "",
            ).trim();
            const profileImage = rawImg.startsWith("http")
              ? rawImg
              : rawImg && !rawImg.match(/^[0-9a-f-]{36}$/)
                ? `https://vcep-assets-dev.s3.ap-southeast-2.amazonaws.com/${rawImg}`
                : "";

            deduped.push({
              id: uid,
              name: fullName,
              subtitle,
              score: toNumber(
                person?.score ?? person?.xp ?? person?.current_xp,
                0,
              ),
              avatarBg,
              initials,
              level: 0, // will enrich below
              profileImage,
              email: String(person?.email ?? person?.participant_info?.participant_email ?? person?.student?.email ?? "").trim(),
              phone: String(person?.phone ?? person?.participant_info?.participant_phone ?? person?.student?.phone ?? "").trim(),
              address: String(person?.address ?? person?.participant_info?.participant_address ?? person?.student?.address ?? "").trim(),
              about: String(person?.about_me ?? person?.about ?? person?.bio ?? person?.student?.about_me ?? person?.student?.bio ?? "").trim(),
              university: uni,
              faculty: String(person?.faculty ?? person?.student?.faculty ?? person?.participant_info?.participant_faculty ?? "").trim(),
              major: String(person?.major ?? person?.student?.major ?? person?.participant_info?.participant_major ?? "").trim(),
            });
          }
        }

        // enrich level + profileImage from /api/organization/student/{std_id}
        enrichedParticipants = await Promise.all(
          deduped.map(async (p) => {
            try {
              const r = await fetch(`/api/organization/student/${p.id}`, {
                cache: "no-store",
                credentials: "include",
              });
              if (r.ok) {
                const d = await r.json().catch(() => ({}));
                const lv = Number(d?.level ?? 0);
                const rawImg = String(
                  d?.profile_image_url ??
                    d?.profileImageUrl ??
                    d?.profile_image ??
                    "",
                ).trim();
                const img = rawImg.startsWith("http")
                  ? rawImg
                  : rawImg
                    ? `https://vcep-assets-dev.s3.ap-southeast-2.amazonaws.com/${rawImg}`
                    : "";
                return {
                  ...p,
                  level: lv > 0 ? lv : p.level,
                  profileImage: img || p.profileImage,
                };
              }
            } catch {}
            return p;
          }),
        );
        // sort by level descending
        enrichedParticipants.sort((a, b) => b.level - a.level);
        setParticipantRows(enrichedParticipants);
      } else {
        setParticipantRows([]);
      }

      const nextEmployees: Employee[] = Array.isArray(data?.employees)
        ? data.employees.map((emp: any, index: number) => ({
            id: toStringValue(emp?.id ?? emp?.empId, `employee-${index}`),
            userId: toStringValue(emp?.userId ?? emp?.user_id),
            orgId: toStringValue(
              emp?.orgId ?? emp?.org_id ?? data?.account?.orgId,
            ),
            firstName: toStringValue(emp?.firstName),
            lastName: toStringValue(emp?.lastName),
            position: toStringValue(emp?.position),
            phone: toStringValue(emp?.phone),
            email: toStringValue(emp?.email).toLowerCase(),
            canCheckChallenge: Boolean(emp?.canCheckChallenge),
            avatarId: toStringValue(emp?.avatarChoice ?? emp?.avatarId) || null,
            legacyAvatarIndex: resolveLegacyAvatarIndex(emp?.avatarIndex),
          }))
        : [];
      setEmployees(nextEmployees);

      // ── Participant bars: compute university distribution from enriched participants ──
      if (
        Array.isArray(data?.participantBars) &&
        data.participantBars.length > 0
      ) {
        setParticipantBars(
          data.participantBars.map((item: any, index: number) => ({
            label: toStringValue(item?.label, `University ${index + 1}`),
            value: toNumber(item?.value, 0),
          })),
        );
      } else {
        // Normalize university name: strip common suffixes and lowercase for grouping,
        // but keep the longest/most descriptive form for display
        function normalizeUni(raw: string): string {
          return raw
            .toLowerCase()
            .replace(/\buniversity\b/g, "")
            .replace(/\bof\b/g, "")
            .replace(/\s+/g, " ")
            .trim();
        }

        // derive from enrichedParticipants subtitle (bio = "Major • Faculty • University")
        const uniMap: Record<string, { count: number; display: string }> = {};
        const participantSource =
          activityIds.length > 0 ? (enrichedParticipants ?? []) : [];
        for (const p of participantSource) {
          const subtitle = String(p?.subtitle ?? "").trim();
          const parts = subtitle
            .split("•")
            .map((s: string) => s.trim())
            .filter(Boolean);
          const raw =
            parts.length >= 2 ? parts[parts.length - 1] : subtitle || "Unknown";
          const key = normalizeUni(raw);
          if (!key) continue;
          if (!uniMap[key]) {
            uniMap[key] = { count: 0, display: raw };
          } else if (raw.length > uniMap[key].display.length) {
            uniMap[key].display = raw; // prefer longer/more descriptive name
          }
          uniMap[key].count++;
        }
        const computedParticipantBars: GraphBar[] = Object.values(uniMap)
          .sort((a, b) => b.count - a.count)
          .slice(0, 8)
          .map(({ display, count }) => ({ label: display, value: count }));
        setParticipantBars(computedParticipantBars);
      }

      // ── Skill bars: fetch from /api/organization/activity/{id}/skills and aggregate ──
      if (Array.isArray(data?.skillBars) && data.skillBars.length > 0) {
        setSkillBars(
          data.skillBars.map((item: any, index: number) => ({
            label: toStringValue(item?.label, `Skill ${index + 1}`),
            value: toNumber(item?.value, 0),
          })),
        );
      } else if (nextActivities.length > 0) {
        const allSkillFetches = await Promise.all(
          nextActivities.map((act) =>
            fetch(`/api/organization/activity/${act.id}/skills`, {
              cache: "no-store",
              credentials: "include",
            })
              .then((r) => r.json().catch(() => ({})))
              .then((d) => (Array.isArray(d?.skills) ? d.skills : []))
              .catch(() => []),
          ),
        );
        const skillCount: Record<string, number> = {};
        for (const skillList of allSkillFetches) {
          for (const skill of skillList) {
            const name = String(
              skill?.skill_name ?? skill?.skillName ?? "",
            ).trim();
            if (name) skillCount[name] = (skillCount[name] ?? 0) + 1;
          }
        }
        const computedSkillBars: GraphBar[] = Object.entries(skillCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 8)
          .map(([label, value]) => ({ label, value }));
        setSkillBars(computedSkillBars);
      } else {
        setSkillBars([]);
      }

      // Building info
      const buildingData = data?.building ?? null;
      setBuilding(
        buildingData
          ? {
              buildingId: toStringValue(buildingData?.buildingId),
              buildingName: toStringValue(buildingData?.buildingName),
              modelUrl: buildingData?.modelUrl ?? null,
              previewUrl: buildingData?.previewUrl ?? null,
            }
          : null,
      );

      const activeEmail = toStringValue(data?.account?.email).toLowerCase();
      setActiveEmployeeEmail(activeEmail);
      setActiveOrgId(toStringValue(data?.account?.orgId));
    } catch (e: any) {
      setPageError(e?.message || "Failed to load organization dashboard");
    } finally {
      setPageLoading(false);
    }
  }

  const handleSaveOrg = async () => {
    try {
      setOrgSaving(true);

      // Step 1: Upload logo to S3 if a new file was selected
      let logoKey: string | undefined;
      if (orgDraft.logoFile) {
        setLogoUploading(true);
        const formData = new FormData();
        formData.append("file", orgDraft.logoFile);

        const uploadRes = await fetch("/api/organization/logo", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        const uploadJson = await uploadRes.json().catch(() => ({}));
        setLogoUploading(false);

        if (!uploadRes.ok || !uploadJson?.ok || !uploadJson?.key) {
          throw new Error(uploadJson?.message || "Failed to upload logo");
        }

        logoKey = uploadJson.key;

        // Update preview to show the S3 public URL
        setOrgDraft((prev) => ({
          ...prev,
          logoPreview: uploadJson.url,
          logoFile: null,
        }));
      }

      // Step 2: Save org info (with logo key if uploaded)
      const response = await fetch("/api/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orgName: orgDraft.orgName,
          companySize: orgDraft.companySize,
          businessType: orgDraft.businessType,
          location: orgDraft.location,
          aboutUs: orgDraft.aboutUs,
          email: orgDraft.email,
          phone: orgDraft.phone,
          website: orgDraft.website,
          linkedin: orgDraft.linkedin,
          facebook: orgDraft.facebook,
          instagram: orgDraft.instagram,
          youtube: orgDraft.youtube,
          tiktok: orgDraft.tiktok,
          // ส่ง S3 key เมื่อมีการ upload ใหม่ มิฉะนั้นส่ง preview URL เดิม
          logo: logoKey ?? orgDraft.logoPreview ?? undefined,
        }),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json?.ok) {
        throw new Error(json?.message || "Failed to save organization");
      }

      await refreshDashboard();
      setIsEditOrgOpen(false);
      setIsSavedOpen(true);
    } catch (e: any) {
      setLogoUploading(false);
      alert(e?.message || "Failed to save organization");
    } finally {
      setOrgSaving(false);
    }
  };

  const submitEmployee = async () => {
    setError("");

    if (!draft.firstName.trim() || !draft.lastName.trim()) {
      setError("Please fill first name and last name.");
      return;
    }
    if (!draft.email.trim()) {
      setError("Please fill email.");
      return;
    }

    setSaving(true);
    try {
      if (employeeModalMode === "edit") {
        if (!draft.userId.trim()) {
          setError("Missing employee user id.");
          return;
        }

        const r = await fetch("/api/organization/employees/save-self", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            userId: draft.userId,
            orgId: draft.orgId || activeOrgId,
            firstName: draft.firstName.trim(),
            lastName: draft.lastName.trim(),
            position: draft.position.trim(),
            phone: draft.phone.trim(),
            avatarId: draft.avatarId,
            canCheckChallenge: draft.canCheckChallenge,
            email: draft.email.trim().toLowerCase(),
          }),
        });

        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d?.ok) {
          setError(d?.message || "Save failed");
          return;
        }
      } else {
        const r = await fetch("/api/organization/employees/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: draft.email.trim().toLowerCase(),
            firstName: draft.firstName.trim(),
            lastName: draft.lastName.trim(),
            position: draft.position.trim(),
            phone: draft.phone.trim(),
            canCheckChallenge: draft.canCheckChallenge,
            avatarId: draft.avatarId,
          }),
        });

        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d?.ok) {
          setError(d?.message || "Invite failed");
          return;
        }
      }

      await refreshDashboard();
      setIsOpen(false);
    } catch (e: any) {
      setError(
        e?.message ||
          (employeeModalMode === "edit"
            ? "Failed to update employee"
            : "Failed to add employee"),
      );
    } finally {
      setSaving(false);
    }
  };

  const MAX_EMP = 3;
  const shownEmployees = employees.slice(0, MAX_EMP);
  // ปุ่มเพิ่มหายเมื่อครบ 3 คน
  const canAddMore = employees.length < MAX_EMP;

  const filteredOrgActivities = useMemo(() => {
    if (selectedActivityKind === "all") return activityRows;
    return activityRows.filter((item) => item.kind === selectedActivityKind);
  }, [activityRows, selectedActivityKind]);

  useEffect(() => {
    loadAvatarOptions();
    refreshDashboard();
  }, []);

  if (pageLoading) {
    return (
      <main className={styles.main}>
        <div style={{ padding: 24 }}>Loading organization dashboard...</div>
      </main>
    );
  }

  if (pageError) {
    return (
      <main className={styles.main}>
        <div style={{ padding: 24, color: "#b42318" }}>{pageError}</div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      {/* ===== Row 1: Org profile + summary cards + avatar box ===== */}
      <section className={styles.topGrid}>
        {/* Org profile card */}
        <div className={styles.orgCard}>
          <div className={styles.orgCardBg} />

          <button
            className={styles.orgEditBtn}
            type="button"
            aria-label="Edit organization"
            onClick={openEditOrg}
          >
            <Image
              src="/images/icons/button03-icon.png"
              alt=""
              fill
              sizes="40px"
              className={styles.orgEditBtnIcon}
            />
          </button>

          <div className={styles.orgCardContent}>
            <div className={styles.orgLogoBox}>
              <div className={styles.orgLogoCircle} aria-hidden="true">
                {orgDraft.logoPreview ? (
                  <img
                    src={orgDraft.logoPreview}
                    alt="Organization logo"
                    className={styles.orgLogoImg}
                  />
                ) : (
                  <div className={styles.orgLogoMark} />
                )}
              </div>
            </div>

            <div className={styles.orgInfoWrap}>
              <h1 className={styles.orgName}>{orgDraft.orgName}</h1>

              <p className={styles.orgDesc}>{orgDraft.aboutUs}</p>

              <div className={styles.orgMetaGrid}>
                <div className={styles.orgPhone}>Phone: {orgDraft.phone}</div>
                <div className={styles.orgEmail}>Email: {orgDraft.email}</div>
                <div className={styles.orgAddress}>
                  Address: {orgDraft.location}
                </div>
              </div>

              {orgLinkItems.length > 0 && (
                <div
                  className={styles.orgLinksWrap}
                  aria-label="Organization links"
                >
                  {orgLinkItems.map((item) => (
                    <a
                      key={item.key}
                      className={styles.orgLinkChip}
                      href={normalizeExternalUrl(item.value)}
                      target="_blank"
                      rel="noreferrer noopener"
                      title={`${item.label}: ${item.value}`}
                    >
                      <span className={styles.orgLinkLabel}>{item.label}</span>
                      <span className={styles.orgLinkValue}>
                        {getHostLabel(item.value)}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryCardBg} />

          <div className={styles.summaryTopBox}>
            <div className={styles.summaryTopBoxBg} />

            <div className={styles.summaryTotalValue}>
              {summary.totalActivities}
            </div>
            <div className={styles.summaryTotalLabel}>Total Activities</div>

            <div className={styles.summaryMiniStat}>
              <div className={styles.summaryMiniLabel}>challenge</div>
              <div className={styles.summaryMiniValue}>
                {summary.challenges}
              </div>
            </div>

            <div className={styles.summaryMiniStat}>
              <div className={styles.summaryMiniLabel}>courses</div>
              <div className={styles.summaryMiniValue}>{summary.courses}</div>
            </div>

            <div className={styles.summaryMiniStat}>
              <div className={styles.summaryMiniLabel}>meetings</div>
              <div className={styles.summaryMiniValue}>{summary.meetings}</div>
            </div>
          </div>

          <div className={styles.summaryBottom}>
            <div className={styles.summaryParticipantIconWrap}>
              <img
                src="/images/icons/body-icon.png"
                alt=""
                className={styles.summaryParticipantIcon}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>

            <div className={styles.summaryParticipantText}>
              <div className={styles.summaryParticipantValue}>
                {participantRows.length}
              </div>
              <div className={styles.summaryParticipantLabel}>
                Total Participants
              </div>
            </div>
          </div>
        </div>

        {/* Avatar box */}
        <div className={styles.avatarBox}>
          <div className={styles.buildingWrap}>
            <div className={styles.buildingImg}>
              <OrgBuildingViewer modelUrl={building?.modelUrl ?? null} />
            </div>
            {building?.buildingName && (
              <div className={styles.buildingLabel}>
                {building.buildingName}
              </div>
            )}
          </div>

          <div className={styles.avatarRow}>
            {/* Employee slots — always 3 columns */}
            {Array.from({ length: MAX_EMP }, (_, i) => {
              const emp = shownEmployees[i];
              if (!emp) {
                // Slot ว่าง — กดเพื่อเพิ่มพนักงาน
                return (
                  <button
                    key={`empty-${i}`}
                    type="button"
                    className={styles.avatarTileEmpty}
                    onClick={openAdd}
                    aria-label="Add employee"
                  />
                );
              }
              const isActive = emp.email === activeEmployeeEmail;
              const avatarOption = resolveAvatarOption(emp);

              return (
                <div
                  key={emp.id}
                  className={styles.avatarTile}
                  title={`Edit ${emp.firstName} ${emp.lastName}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => openEditEmployee(emp)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openEditEmployee(emp);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    <div
                      className={`${styles.avatarThumb} ${isActive ? styles.avatarThumbActive : ""}`}
                      style={{ overflow: "hidden" }}
                    >
                      <EmployeeAvatarViewer
                        modelUrl={avatarOption?.modelUrl ?? null}
                      />
                    </div>
                    {isActive && (
                      <span
                        style={{
                          position: "absolute",
                          top: -4,
                          right: -4,
                          background: "#10b981",
                          borderRadius: "50%",
                          width: 10,
                          height: 10,
                          border: "2px solid white",
                          display: "block",
                        }}
                      />
                    )}
                    {emp.canCheckChallenge && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: -2,
                          right: -4,
                          background: "#f59e0b",
                          borderRadius: 4,
                          fontSize: 8,
                          fontWeight: 700,
                          color: "white",
                          padding: "1px 3px",
                        }}
                      >
                        ★
                      </span>
                    )}
                  </div>
                  <div className={styles.avatarName}>{emp.firstName}</div>
                  {emp.position && (
                    <div
                      style={{
                        fontSize: 9,
                        color: "#6b7280",
                        marginTop: 1,
                        textAlign: "center",
                      }}
                    >
                      {emp.position}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary of activities */}
        <div className={styles.summaryOfActivities}>
          <div className={styles.summaryOfActivitiesBg} />

          <div className={styles.summaryOfActivitiesInner}>
            <div
              className={`${styles.summaryActivityBox} ${styles.summaryActivityBoxDual}`}
            >
              <div className={styles.summaryActivityBoxBg} />
              <div className={styles.summaryActivityTopValue}>
                {summary.published}
              </div>
              <div className={styles.summaryActivityTopLabel}>Published</div>
              <div className={styles.summaryActivitySplit} />
              <div className={styles.summaryActivityBottomValue}>
                {summary.draft}
              </div>
              <div className={styles.summaryActivityBottomLabel}>Draft</div>
            </div>

            <div className={styles.summaryActivityDivider} />

            <div className={styles.summaryActivityBox}>
              <div className={styles.summaryActivityBoxBg} />
              <div className={styles.summaryActivityValue}>
                {summary.meetings}
              </div>
              <div className={styles.summaryActivityLabel}>Meetings</div>
            </div>

            <div className={styles.summaryActivityDivider} />

            <div className={styles.summaryActivityBox}>
              <div className={styles.summaryActivityBoxBg} />
              <div className={styles.summaryActivityValue}>
                {summary.courses}
              </div>
              <div className={styles.summaryActivityLabel}>Courses</div>
            </div>

            <div className={styles.summaryActivityDivider} />

            <div className={styles.summaryActivityBox}>
              <div className={styles.summaryActivityBoxBg} />
              <div className={styles.summaryActivityValue}>
                {summary.challenges}
              </div>
              <div className={styles.summaryActivityLabel}>Challenges</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Row 2: Figma-like contents + participants list ===== */}
      <section className={styles.midGrid}>
        <div className={styles.dashboardContent}>
          <section className={styles.statisticsGraphCard}>
            <div className={styles.statisticsGraphBg} />

            <div className={styles.statisticsTabs}>
              <div className={styles.statisticsTabsDividerLeft} />
              <div className={styles.statisticsTabsDividerRight} />
              <div className={styles.statisticsTabsUnderline} />

              <button
                type="button"
                className={`${styles.statisticsTabBtn} ${statsTab === "all" ? styles.statisticsTabBtnActive : ""}`}
                onClick={() => setStatsTab("all")}
              >
                All activity statistics
              </button>

              <button
                type="button"
                className={`${styles.statisticsTabBtn} ${statsTab === "participants" ? styles.statisticsTabBtnActive : ""}`}
                onClick={() => setStatsTab("participants")}
              >
                Statistics of participants
              </button>

              <button
                type="button"
                className={`${styles.statisticsTabBtn} ${statsTab === "skills" ? styles.statisticsTabBtnActive : ""}`}
                onClick={() => setStatsTab("skills")}
              >
                skill statistics
              </button>
            </div>

            {statsTab === "all" ? (
              summary.totalActivities === 0 ? (
                <div
                  className={styles.activityEmptyState}
                  style={{ margin: "16px 0" }}
                >
                  No activity statistics yet.
                </div>
              ) : (
                <div className={styles.allStatisticsBody}>
                  {/* ── Left half: By Month ── */}
                  <div className={styles.donutHalf}>
                    <div className={styles.donutHalfLabel}>By Month</div>
                    <div className={styles.donutHalfBody}>
                      {(() => {
                        const MONTH_COLORS = [
                          "#a8dcb3",
                          "#ffd286",
                          "#66bdce",
                          "#cdb4db",
                          "#f4a5a5",
                          "#b5cff0",
                          "#f0d9b5",
                          "#c5e8d1",
                        ];
                        const total =
                          monthDonutData.reduce((s, d) => s + d.value, 0) || 1;
                        let angle = 0;
                        const segments = monthDonutData.map((d, i) => {
                          const pct = (d.value / total) * 100;
                          const seg = {
                            start: angle,
                            end: angle + pct,
                            color: MONTH_COLORS[i % MONTH_COLORS.length],
                            ...d,
                          };
                          angle += pct;
                          return seg;
                        });
                        const hasMonthData = segments.length > 0;
                        const fallbackTypes = [
                          { value: summary.meetings, color: "#a8dcb3" },
                          { value: summary.courses, color: "#ffd286" },
                          { value: summary.challenges, color: "#66bdce" },
                        ].filter((d) => d.value > 0);
                        const fallbackTotal =
                          fallbackTypes.reduce((s, d) => s + d.value, 0) || 1;
                        let fa = 0;
                        const fallbackSegs = fallbackTypes.map((d) => {
                          const pct = (d.value / fallbackTotal) * 100;
                          const seg = {
                            start: fa,
                            end: fa + pct,
                            color: d.color,
                          };
                          fa += pct;
                          return seg;
                        });
                        const gradient = hasMonthData
                          ? `conic-gradient(${segments.map((s) => `${s.color} ${s.start.toFixed(2)}% ${s.end.toFixed(2)}%`).join(", ")})`
                          : fallbackSegs.length > 0
                            ? `conic-gradient(${fallbackSegs.map((s) => `${s.color} ${s.start.toFixed(2)}% ${s.end.toFixed(2)}%`).join(", ")})`
                            : "conic-gradient(#e5e5e5 0% 100%)";
                        const legendItems = hasMonthData
                          ? monthDonutData.map((item, i) => ({
                              label: item.label,
                              value: item.value,
                              color: MONTH_COLORS[i % MONTH_COLORS.length],
                            }))
                          : [
                              {
                                label: "Meetings",
                                value: summary.meetings,
                                color: "#a8dcb3",
                              },
                              {
                                label: "Courses",
                                value: summary.courses,
                                color: "#ffd286",
                              },
                              {
                                label: "Challenges",
                                value: summary.challenges,
                                color: "#66bdce",
                              },
                            ].filter((d) => d.value > 0);
                        return (
                          <>
                            <div className={styles.donutBlock}>
                              <div
                                className={styles.donutRing}
                                style={{ background: gradient }}
                              >
                                <div
                                  className={styles.donutHole}
                                  style={{
                                    flexDirection: "column",
                                    gap: 0,
                                    fontSize: 11,
                                  }}
                                >
                                  <span
                                    style={{ fontWeight: 700, fontSize: 15 }}
                                  >
                                    {summary.totalActivities}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 8,
                                      color: "#777",
                                      fontWeight: 300,
                                      lineHeight: 1,
                                    }}
                                  >
                                    total
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className={styles.donutLegendGrid}>
                              {legendItems.map((item) => (
                                <div
                                  key={item.label}
                                  className={styles.donutLegendItem}
                                >
                                  <span
                                    style={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: 2,
                                      background: item.color,
                                      flexShrink: 0,
                                    }}
                                  />
                                  <span className={styles.donutLegendValue}>
                                    {item.value}
                                  </span>
                                  <span className={styles.donutLegendLabel}>
                                    {item.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* ── Center divider ── */}
                  <div className={styles.donutSectionDivider} />

                  {/* ── Right half: Activity types ── */}
                  <div className={styles.donutHalf}>
                    <div className={styles.donutHalfLabel}>Activity types</div>
                    <div className={styles.donutHalfBody}>
                      {(() => {
                        const total =
                          typeDonutData.reduce((s, d) => s + d.value, 0) || 1;
                        let angle = 0;
                        const segments = typeDonutData.map((d) => {
                          const pct = (d.value / total) * 100;
                          const seg = { start: angle, end: angle + pct, ...d };
                          angle += pct;
                          return seg;
                        });
                        const gradient =
                          segments.length > 0
                            ? `conic-gradient(${segments.map((s) => `${s.color} ${s.start.toFixed(2)}% ${s.end.toFixed(2)}%`).join(", ")})`
                            : "conic-gradient(#e5e5e5 0% 100%)";
                        const allTypes = [
                          {
                            label: "Meetings",
                            value: summary.meetings,
                            color: "#66bdce",
                          },
                          {
                            label: "Courses",
                            value: summary.courses,
                            color: "#a8dcb3",
                          },
                          {
                            label: "Challenges",
                            value: summary.challenges,
                            color: "#ffd286",
                          },
                        ];
                        return (
                          <>
                            <div className={styles.donutBlock}>
                              <div
                                className={styles.donutRing}
                                style={{ background: gradient }}
                              >
                                <div
                                  className={styles.donutHole}
                                  style={{ flexDirection: "column", gap: 0 }}
                                >
                                  <span
                                    style={{ fontWeight: 700, fontSize: 15 }}
                                  >
                                    {summary.totalActivities}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 8,
                                      color: "#777",
                                      fontWeight: 300,
                                      lineHeight: 1,
                                    }}
                                  >
                                    total
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className={styles.donutLegendGridSingle}>
                              {allTypes.map((item) => (
                                <div
                                  key={item.label}
                                  className={styles.donutLegendItemWide}
                                >
                                  <span
                                    style={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: 2,
                                      background: item.color,
                                      flexShrink: 0,
                                    }}
                                  />
                                  <span className={styles.donutLegendValue}>
                                    {item.value}
                                  </span>
                                  <span className={styles.donutLegendLabel}>
                                    {item.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className={styles.statisticsBarsWrap}>
                <div className={styles.statisticsBarsUnit}>
                  {statsTab === "participants"
                    ? "Number of participants (by university)"
                    : "Number of activities (by skill)"}
                </div>
                <div className={styles.statisticsBarsChart}>
                  <div className={styles.statisticsBarsBaseline} />
                  <div className={styles.statisticsBarsRow}>
                    {(statsTab === "participants" ? participantBars : skillBars)
                      .length === 0 ? (
                      <div
                        className={styles.activityEmptyState}
                        style={{ width: "100%", margin: "0" }}
                      >
                        No statistics available yet.
                      </div>
                    ) : (
                      (() => {
                        const currentBars =
                          statsTab === "participants"
                            ? participantBars
                            : skillBars;
                        const max = Math.max(
                          1,
                          ...currentBars.map((bar) => bar.value || 0),
                        );
                        const MAX_BAR_H = 90; // px — fits safely in container
                        return currentBars.map((item, index) => {
                          const barHeight = Math.max(
                            8,
                            (item.value / max) * MAX_BAR_H,
                          );
                          return (
                            <div
                              key={`${item.label}-${index}`}
                              className={styles.statisticsBarItem}
                            >
                              <div className={styles.statisticsBarValueWrap}>
                                <span className={styles.statisticsBarValue}>
                                  {item.value}
                                </span>
                              </div>
                              <div
                                className={styles.statisticsBar}
                                style={{ height: `${barHeight}px` }}
                              />
                              <div
                                className={styles.statisticsBarLabel}
                                title={item.label}
                              >
                                {item.label}
                              </div>
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className={styles.activityOverviewCard}>
            <div className={styles.activityOverviewBg} />

            <div className={styles.activityOverviewHeader}>
              <div className={styles.activityOverviewTitle}>
                Activity Overview
              </div>

              <button
                type="button"
                className={styles.activityOverviewAddBtn}
                aria-label="Create new activity"
                onClick={() => setIsActivityTypeOpen(true)}
              >
                <Image
                  src="/images/icons/button05-icon.png"
                  alt=""
                  width={50}
                  height={50}
                  className={styles.activityOverviewAddIcon}
                />
              </button>
            </div>

            <div className={styles.activityOverviewScroll}>
              {filteredOrgActivities.length === 0 ? (
                <div className={styles.activityEmptyState}>
                  No activities created yet.
                </div>
              ) : (
                filteredOrgActivities.map((item) => (
                  <div
                    key={item.id}
                    className={styles.activityTableRow}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      router.push(`/organization/activities/${item.id}`)
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/organization/activities/${item.id}`);
                      }
                    }}
                  >
                    <div className={styles.activityThumbWrap}>
                      <div className={styles.activityThumbCard}>
                        <div className={styles.activityThumbPieceTop} />
                        <div className={styles.activityThumbPieceBottom} />
                      </div>
                    </div>

                    <div className={styles.activityNameCell} title={item.title}>
                      {item.title}
                    </div>
                    <div className={styles.activityDivider} />

                    <div className={styles.activityInfoCell}>
                      <div className={styles.activityInfoHead}>difficulty</div>
                      <div className={styles.activityInfoValue}>
                        {item.difficulty}
                      </div>
                    </div>
                    <div className={styles.activityDivider} />

                    <div className={styles.activityInfoCell}>
                      <div className={styles.activityInfoHead}>Category</div>
                      <div className={styles.activityInfoValue}>
                        {item.category}
                      </div>
                    </div>
                    <div className={styles.activityDivider} />

                    <div className={styles.activityInfoCellXp}>
                      <div className={styles.activityInfoHead}>XP</div>
                      <div className={styles.activityInfoValue}>{item.xp}</div>
                    </div>
                    <div className={styles.activityDivider} />

                    <div className={styles.activityStatusColumn}>
                      <div className={getStatusBadgeClass(item.statusTone)}>
                        {item.statusLabel}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className={styles.sideParticipantsCol}>
          <section className={styles.rightPanel}>
            <h3 className={styles.rightTitle}>Participants</h3>

            <div className={styles.studentsListScroller}>
              {participantRows.length === 0 ? (
                <div className={styles.activityEmptyState}>
                  No participants yet.
                </div>
              ) : (
                participantRows.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    className={styles.studentRowButton}
                    aria-label={person.name}
                    title={person.name}
                    onClick={() => openParticipantPortfolio(person)}
                  >
                    <div className={styles.studentRowCard}>
                      <div
                        className={styles.studentAvatar}
                        style={{
                          background: person.profileImage
                            ? "transparent"
                            : person.avatarBg,
                        }}
                      >
                        {person.profileImage ? (
                          <img
                            src={person.profileImage}
                            alt={person.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "50%",
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span className={styles.studentAvatarInitials}>
                            {person.initials}
                          </span>
                        )}
                      </div>

                      <div className={styles.studentMeta}>
                        <div className={styles.studentName}>{person.name}</div>
                        <div className={styles.studentSubtitle}>
                          {person.subtitle}
                        </div>
                      </div>

                      <div className={styles.studentScoreArea}>
                        <img
                          src={getLevelBadgeSrc(person.level)}
                          alt={`Level ${person.level}`}
                          width={28}
                          height={28}
                          style={{ objectFit: "contain" }}
                        />
                        <div className={styles.studentScore}>
                          Lv.{person.level}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>
        </div>
      </section>

      {selectedParticipant && (() => {
        const popupData =
          participantPortfolio ??
          normalizeParticipantPortfolio({}, selectedParticipant);
        const info = popupData.studentInfo;
        const popupPhoto =
          normalizeS3ImageUrl(info?.profileImageUrl) || selectedParticipant.profileImage;
        const popupName = getParticipantPopupName();
        const softSkills = popupData.skills.filter((skill) => skill.kind === "soft");
        const technicalSkills = popupData.skills.filter((skill) => skill.kind === "technical");
        const certificates = popupData.certificates.filter((item) => item.itemType === "certificate");
        const badges = popupData.certificates.filter((item) => item.itemType === "badge");

        return (
          <div className={styles.participantPopupOverlay} onClick={closeParticipantPortfolio}>
            <div
              className={styles.participantPopupCard}
              role="dialog"
              aria-modal="true"
              aria-label="Student portfolio"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className={styles.participantPopupClose}
                onClick={closeParticipantPortfolio}
                aria-label="Close student portfolio"
              >
                ×
              </button>

              <div className={styles.participantPopupHeader}>
                <div className={styles.participantPopupPhotoCard}>
                  {popupPhoto ? (
                    <img
                      src={popupPhoto}
                      alt={popupName}
                      className={styles.participantPopupPhoto}
                    />
                  ) : (
                    <div
                      className={styles.participantPopupInitials}
                      style={{ background: selectedParticipant.avatarBg }}
                    >
                      {selectedParticipant.initials}
                    </div>
                  )}
                </div>

                <div className={styles.participantPopupBioCard}>
                  <div className={styles.participantPopupName}>{popupName}</div>
                  <div className={styles.participantPopupBioText}>
                    {info?.aboutMe || selectedParticipant.subtitle || "No bio information yet."}
                  </div>

                  <div className={styles.participantPopupInfoGrid}>
                    <div><span>Phone:</span> {info?.phone || "-"}</div>
                    <div><span>Email:</span> {info?.email || "-"}</div>
                    <div className={styles.participantPopupFullInfo}><span>Address:</span> {info?.address || "-"}</div>
                  </div>
                </div>
              </div>

              {participantPortfolioLoading ? (
                <div className={styles.participantPopupState}>Loading portfolio...</div>
              ) : participantPortfolioError ? (
                <div className={styles.participantPopupError}>{participantPortfolioError}</div>
              ) : (
                <div className={styles.participantPopupScroll}>
                  <section className={styles.participantPopupSection}>
                    <h4>Education</h4>
                    <div className={styles.participantPopupSectionBody}>
                      {popupData.education.length === 0 ? (
                        <div className={styles.participantPopupEmpty}>No education information.</div>
                      ) : (
                        popupData.education.map((item, index) => (
                          <div key={`${item.id || "education"}-${index}`} className={styles.participantPopupLine}>
                            {formatEducationLine(item)}
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section className={styles.participantPopupSkillGrid}>
                    <div>
                      <h4>Soft Skills</h4>
                      <div className={styles.participantPopupSectionBody}>
                        {softSkills.length === 0 ? (
                          <div className={styles.participantPopupEmpty}>No soft skills.</div>
                        ) : (
                          softSkills.map((skill, index) => (
                            <div key={`${skill.id || "soft-skill"}-${index}`} className={styles.participantPopupSourceLine}>
                              <img
                                src={getPortfolioSourceIcon(skill.source)}
                                alt=""
                                className={styles.participantPopupSourceIcon}
                              />
                              <span>{skill.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <h4>Technical Skills</h4>
                      <div className={styles.participantPopupSectionBody}>
                        {technicalSkills.length === 0 ? (
                          <div className={styles.participantPopupEmpty}>No technical skills.</div>
                        ) : (
                          technicalSkills.map((skill, index) => (
                            <div key={`${skill.id || "technical-skill"}-${index}`} className={styles.participantPopupSourceLine}>
                              <img
                                src={getPortfolioSourceIcon(skill.source)}
                                alt=""
                                className={styles.participantPopupSourceIcon}
                              />
                              <span>{skill.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </section>

                  <section className={styles.participantPopupSection}>
                    <h4>Badge and Certificate</h4>
                    <div className={styles.participantPopupSectionBody}>
                      {certificates.length === 0 && badges.length === 0 ? (
                        <div className={styles.participantPopupEmpty}>No badge or certificate.</div>
                      ) : (
                        <>
                          {certificates.length > 0 && (
                            <>
                              <div className={styles.participantPopupSubTitle}>Certificates</div>
                              <div className={styles.participantPopupList}>
                                {certificates.map((item, index) => (
                                  <div key={`${item.id || "certificate"}-${index}`} className={styles.participantPopupSourceLine}>
                                    <img
                                      src={getPortfolioSourceIcon(item.source)}
                                      alt=""
                                      className={styles.participantPopupSourceIcon}
                                    />
                                    <span>{item.title}{item.date ? ` • ${item.date}` : ""}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}

                          {badges.length > 0 && (
                            <>
                              <div className={styles.participantPopupSubTitle}>Badges</div>
                              <div className={styles.participantPopupList}>
                                {badges.map((item, index) => (
                                  <div key={`${item.id || "badge"}-${index}`} className={styles.participantPopupSourceLine}>
                                    <img
                                      src={getPortfolioSourceIcon(item.source)}
                                      alt=""
                                      className={styles.participantPopupSourceIcon}
                                    />
                                    <span>{item.title}{item.date ? ` • ${item.date}` : ""}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </section>

                  <section className={styles.participantPopupSection}>
                    <h4>Experience and Activity</h4>
                    <div className={styles.participantPopupSectionBody}>
                      {popupData.experiences.length === 0 ? (
                        <div className={styles.participantPopupEmpty}>No experience or activity.</div>
                      ) : (
                        popupData.experiences.map((item, index) => (
                          <div key={`${item.id || "experience"}-${index}`} className={styles.participantPopupExperienceItem}>
                            <div className={styles.participantPopupExperienceTitle}>
                              <img
                                src={getPortfolioSourceIcon(item.source)}
                                alt=""
                                className={styles.participantPopupSourceIcon}
                              />
                              <span>{item.period ? `[${item.period}] - ` : ""}{item.title}</span>
                            </div>
                            {item.description && (
                              <div className={styles.participantPopupExperienceDesc}>{item.description}</div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {isActivityTypeOpen && (
        <div
          className={styles.activityCreateOverlay}
          onClick={() => setIsActivityTypeOpen(false)}
        >
          <div
            className={styles.activityCreateModal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Select activity type"
          >
            <button
              type="button"
              className={styles.activityCreateClose}
              onClick={() => setIsActivityTypeOpen(false)}
              aria-label="Close"
            >
              ×
            </button>

            <div className={styles.activityCreateHeader}>
              <div className={styles.activityCreateTitle}>Create activity</div>
              <div className={styles.activityCreateSubtitle}>
                Choose the type of activity you want to create.
              </div>
            </div>

            <div className={styles.activityCreateGrid}>
              {(
                [
                  {
                    label: "Meetings",
                    description:
                      "Live sessions, mentoring, interviews, or discussion-based activities.",
                    route: "meeting",
                  },
                  {
                    label: "Courses",
                    description:
                      "Structured learning with modules, lessons, and guided progress.",
                    route: "course",
                  },
                  {
                    label: "Challenges",
                    description:
                      "Hands-on tasks, case work, and portfolio-based submissions.",
                    route: "challenge",
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={styles.activityCreateCard}
                  onClick={() => {
                    setIsActivityTypeOpen(false);
                    router.push(`/organization/activities/${item.route}`);
                  }}
                >
                  <span className={styles.activityCreateCardAccent} />
                  <div className={styles.activityCreateCardTitle}>
                    {item.label}
                  </div>
                  <div className={styles.activityCreateCardText}>
                    {item.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* ===== Modal: Add employee ===== */}
      {isOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {employeeModalMode === "edit"
                  ? "Edit employee"
                  : "Add employee"}
              </h2>
              <button
                className={styles.modalClose}
                type="button"
                onClick={closeAdd}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.grid2}>
                <input
                  className={styles.input}
                  placeholder="First name"
                  value={draft.firstName}
                  onChange={setDraftField("firstName")}
                />
                <input
                  className={styles.input}
                  placeholder="Last name"
                  value={draft.lastName}
                  onChange={setDraftField("lastName")}
                />
              </div>

              <div className={styles.grid2}>
                <input
                  className={styles.input}
                  placeholder="Position"
                  value={draft.position}
                  onChange={setDraftField("position")}
                />
                <input
                  className={styles.input}
                  placeholder="Phone number"
                  value={draft.phone}
                  onChange={setDraftField("phone")}
                />
              </div>

              <input
                className={styles.input}
                placeholder="Email"
                value={draft.email}
                onChange={
                  employeeModalMode === "edit"
                    ? undefined
                    : setDraftField("email")
                }
                readOnly={employeeModalMode === "edit"}
              />
              {employeeModalMode === "edit" && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    marginTop: 4,
                    marginBottom: 8,
                  }}
                >
                  Email is read-only here.
                </div>
              )}

              <div className={styles.hr} />

              <label className={styles.checkRow}>
                <input
                  className={styles.checkInput}
                  type="checkbox"
                  checked={draft.canCheckChallenge}
                  onChange={setDraftField("canCheckChallenge")}
                />
                <span className={styles.checkText}>
                  Can check challenge activities
                </span>
              </label>

              <div className={styles.avatarPickTitle}>Avatar</div>
              <div className={styles.avatarPickRow}>
                {loadingAvatarOptions ? (
                  <div style={{ fontSize: 11, color: "#6b7280" }}>
                    Loading avatars...
                  </div>
                ) : avatarOptions.length === 0 ? (
                  <div style={{ fontSize: 11, color: "#b42318" }}>
                    No employee avatars
                  </div>
                ) : (
                  avatarOptions.map((option, index) => {
                    const on = draft.avatarId === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={`${styles.avatarPickBtn} ${on ? styles.avatarPickBtnOn : ""}`}
                        onClick={() => setDraftAvatar(option.id)}
                        aria-label={`Select avatar ${index + 1}`}
                        title={`Employee avatar ${index + 1}`}
                        style={{
                          overflow: "hidden",
                          padding: 0,
                          position: "relative",
                          display: "block",
                        }}
                      >
                        <EmployeeAvatarOptionPreview
                          modelUrl={option.modelUrl}
                        />
                      </button>
                    );
                  })
                )}
              </div>

              {error && <div className={styles.errorText}>{error}</div>}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.secondaryBtn}
                type="button"
                onClick={closeAdd}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className={styles.primaryBtn}
                type="button"
                onClick={submitEmployee}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : employeeModalMode === "edit"
                    ? "Save changes"
                    : "Send invite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditOrgOpen && (
        <div className={styles.orgPopupOverlay} onClick={closeEditOrg}>
          <div
            className={styles.orgPopupCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Edit organization information"
          >
            <div className={styles.orgPopupInner}>
              <div className={styles.orgPopupScroll}>
                <div className={styles.popupSectionTitle}>
                  Basic Information
                </div>

                <div className={styles.popupGridOrgName}>
                  <input
                    className={styles.popupInput}
                    placeholder="Organization Name"
                    value={orgDraft.orgName}
                    onChange={setOrgField("orgName")}
                  />
                  <input
                    className={styles.popupInput}
                    placeholder="Company Size"
                    value={orgDraft.companySize}
                    onChange={setOrgField("companySize")}
                  />
                </div>

                <input
                  className={styles.popupInput}
                  placeholder="Business Type"
                  value={orgDraft.businessType}
                  onChange={setOrgField("businessType")}
                />

                <input
                  className={styles.popupInput}
                  placeholder="Location"
                  value={orgDraft.location}
                  onChange={setOrgField("location")}
                />

                <div className={styles.popupAboutLogo}>
                  <textarea
                    className={styles.popupTextarea}
                    placeholder="About Us"
                    value={orgDraft.aboutUs}
                    onChange={setOrgField("aboutUs")}
                  />

                  <div className={styles.popupLogoBox}>
                    {!orgDraft.logoPreview && (
                      <div className={styles.popupLogoLabel}>Logo</div>
                    )}

                    <label
                      className={styles.popupLogoDrop}
                      style={{ opacity: logoUploading ? 0.6 : 1 }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className={styles.popupHiddenFile}
                        onChange={openLogoCrop}
                        disabled={logoUploading}
                      />
                      <div className={styles.popupLogoDropInner}>
                        {logoUploading ? (
                          <div className={styles.popupUploadText}>
                            Uploading...
                          </div>
                        ) : orgDraft.logoPreview ? (
                          <img
                            src={orgDraft.logoPreview}
                            alt="Logo preview"
                            className={styles.popupLogoPreview}
                          />
                        ) : (
                          <div className={styles.popupUploadText}>upload</div>
                        )}
                      </div>
                    </label>
                    {orgDraft.logoFile && !logoUploading && (
                      <div
                        style={{
                          fontSize: 10,
                          color: "#6b7280",
                          marginTop: 4,
                          textAlign: "center",
                        }}
                      >
                        Ready to upload
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.popupDivider} />

                <div className={styles.popupSectionTitle}>Contact</div>

                <div className={styles.popupGrid2}>
                  <input
                    className={styles.popupInput}
                    placeholder="Email"
                    value={orgDraft.email}
                    onChange={setOrgField("email")}
                  />
                  <input
                    className={styles.popupInput}
                    placeholder="Phone number"
                    value={orgDraft.phone}
                    onChange={setOrgField("phone")}
                  />
                </div>

                <input
                  className={styles.popupInput}
                  placeholder="Website"
                  value={orgDraft.website}
                  onChange={setOrgField("website")}
                />

                <div className={styles.popupDivider} />

                <div className={styles.popupSectionTitle}>Organization</div>

                <input
                  className={styles.popupInput}
                  placeholder="LinkedIn link"
                  value={orgDraft.linkedin}
                  onChange={setOrgField("linkedin")}
                />
                <input
                  className={styles.popupInput}
                  placeholder="Facebook link"
                  value={orgDraft.facebook}
                  onChange={setOrgField("facebook")}
                />
                <input
                  className={styles.popupInput}
                  placeholder="Instagram link"
                  value={orgDraft.instagram}
                  onChange={setOrgField("instagram")}
                />
                <input
                  className={styles.popupInput}
                  placeholder="YouTube link"
                  value={orgDraft.youtube}
                  onChange={setOrgField("youtube")}
                />
                <input
                  className={styles.popupInput}
                  placeholder="TikTok link"
                  value={orgDraft.tiktok}
                  onChange={setOrgField("tiktok")}
                />
              </div>
            </div>

            <div className={styles.popupActionRow}>
              <button
                type="button"
                className={styles.popupIconButton}
                onClick={handleSaveOrg}
                disabled={orgSaving || logoUploading}
                aria-label="Save organization"
              >
                <Image
                  src="/images/icons/button01-icon.png"
                  alt=""
                  width={60}
                  height={60}
                  className={styles.popupActionIcon}
                />
              </button>

              <button
                type="button"
                className={styles.popupIconButton}
                onClick={closeEditOrg}
                aria-label="Cancel organization editing"
              >
                <Image
                  src="/images/icons/button02-icon.png"
                  alt=""
                  width={60}
                  height={60}
                  className={styles.popupActionIcon}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {isSavedOpen && (
        <div className={styles.savedPopupOverlay} onClick={closeSaved}>
          <div
            className={styles.savedPopupCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Saved"
          >
            <div className={styles.savedPopupBg} />
            <Image
              src="/images/icons/save-icon.png"
              alt=""
              width={60}
              height={60}
              className={styles.savedPopupIcon}
            />
            <div className={styles.savedPopupTitle}>Save</div>
          </div>
        </div>
      )}

      {cropOpen && cropUrl && (
        <div className={styles.cropOverlay} role="dialog" aria-modal="true">
          <div className={styles.cropModal}>
            <div className={styles.cropHeader}>
              <div className={styles.cropTitle}>Crop Logo</div>
              <button
                type="button"
                className={styles.cropClose}
                onClick={() => {
                  URL.revokeObjectURL(cropUrl);
                  setCropUrl(null);
                  setCropOpen(false);
                }}
              >
                ✕
              </button>
            </div>

            <div
              className={styles.cropBox}
              style={{ width: cropBoxSize, height: cropBoxSize }}
            >
              <img
                src={cropUrl}
                alt="Crop source"
                className={styles.cropImg}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setImgNat({ w: img.naturalWidth, h: img.naturalHeight });
                }}
                draggable={false}
                style={{
                  transform: `translate(calc(-50% + ${cropOffset.x}px), calc(-50% + ${cropOffset.y}px)) scale(${cropZoom})`,
                }}
              />

              <div
                className={styles.cropDragLayer}
                onMouseDown={(downEvt) => {
                  downEvt.preventDefault();
                  const start = { x: downEvt.clientX, y: downEvt.clientY };
                  const startOff = { ...cropOffset };

                  const onMove = (moveEvt: MouseEvent) => {
                    const dx = moveEvt.clientX - start.x;
                    const dy = moveEvt.clientY - start.y;
                    setCropOffset({ x: startOff.x + dx, y: startOff.y + dy });
                  };

                  const onUp = () => {
                    window.removeEventListener("mousemove", onMove);
                    window.removeEventListener("mouseup", onUp);
                  };

                  window.addEventListener("mousemove", onMove);
                  window.addEventListener("mouseup", onUp);
                }}
              />
            </div>

            <div className={styles.cropControls}>
              <label className={styles.cropLabel}>
                Zoom
                <input
                  type="range"
                  min={1}
                  max={2.5}
                  step={0.01}
                  value={cropZoom}
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                />
              </label>
            </div>

            <div className={styles.cropActions}>
              <button
                type="button"
                className={styles.cropBtn}
                onClick={() => {
                  URL.revokeObjectURL(cropUrl);
                  setCropUrl(null);
                  setCropOpen(false);
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className={styles.cropBtnPrimary}
                onClick={async () => {
                  if (!cropUrl || !imgNat.w || !imgNat.h) return;

                  const img = document.createElement("img");
                  img.src = cropUrl;
                  await new Promise<void>((res) => (img.onload = () => res()));

                  const Cw = cropBoxSize;
                  const Ch = cropBoxSize;

                  const baseScale = Math.max(Cw / imgNat.w, Ch / imgNat.h);
                  const s = baseScale * cropZoom;

                  const rw = imgNat.w * s;
                  const rh = imgNat.h * s;

                  const left = (Cw - rw) / 2 + cropOffset.x;
                  const top = (Ch - rh) / 2 + cropOffset.y;

                  let sx = (0 - left) / s;
                  let sy = (0 - top) / s;
                  let sw = Cw / s;
                  let sh = Ch / s;

                  sx = Math.max(0, Math.min(imgNat.w - sw, sx));
                  sy = Math.max(0, Math.min(imgNat.h - sh, sy));

                  const out = 512;
                  const canvas = document.createElement("canvas");
                  canvas.width = out;
                  canvas.height = out;
                  const ctx = canvas.getContext("2d")!;
                  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, out, out);

                  const blob: Blob = await new Promise((resolve) =>
                    canvas.toBlob((b) => resolve(b!), "image/png", 0.92),
                  );

                  const file = new File([blob], "logo.png", {
                    type: "image/png",
                  });
                  const previewUrl = URL.createObjectURL(file);

                  setOrgDraft((prev) => ({
                    ...prev,
                    logoFile: file,
                    logoPreview: previewUrl,
                  }));

                  URL.revokeObjectURL(cropUrl);
                  setCropUrl(null);
                  setCropOpen(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
