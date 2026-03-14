"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";

type OptionItem = { id: string; name: string };
type AvatarOption = { id: string; modelUrl: string; unlockLevel: number };

const NAV_ITEMS = [
  { label: "About", href: "/about", enabled: false },
  { label: "Contact", href: "/contact", enabled: false },
  { label: "Log in", href: "/auth/sign-in" },
  { label: "Register", href: "/auth/register" },
];

function pickIdleClip(names: string[]) {
  const n = names.map((x) => x.toLowerCase());

  const idleIdx = n.findIndex((x) => x.includes("idle"));
  if (idleIdx >= 0) return names[idleIdx];

  const loopIdx = n.findIndex((x) => x.includes("walk") || x.includes("run"));
  if (loopIdx >= 0) return names[loopIdx];

  return names[0];
}

function AnimatedGLB({ url }: { url: string }) {
  const group = useRef<THREE.Group>(null);
  const gltf = useGLTF(url);
  const { actions, names, mixer } = useAnimations(gltf.animations, group);

  useEffect(() => {
    // ✅ ถ้าไฟล์ไม่มี animation: แสดงโมเดลเฉยๆ (ไม่ error)
    if (!names?.length) return;

    // stop + reset กันท่าผสมค้าง
    names.forEach((n) => {
      const a = actions[n];
      if (!a) return;
      a.stop();
      a.reset();
    });

    const clipName = pickIdleClip(names);
    const a = actions[clipName];
    if (!a) return;

    a.reset();
    a.setLoop(THREE.LoopRepeat, Infinity);
    a.clampWhenFinished = false;
    a.enabled = true;
    a.setEffectiveWeight(1);
    a.setEffectiveTimeScale(1);
    a.fadeIn(0.2);
    a.play();

    return () => {
      a.stop();
    };
  }, [actions, names, url]);

  useFrame((_, dt) => {
    mixer?.update(dt);
  });

  return (
    <group ref={group}>
      <primitive object={gltf.scene} />
    </group>
  );
}

// error boundary แบบเล็ก
function ErrorCatcher({
  children,
  onError,
}: {
  children: React.ReactNode;
  onError: () => void;
}) {
  try {
    return <>{children}</>;
  } catch {
    onError();
    return null;
  }
}

function Avatar3D({ modelUrl }: { modelUrl: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    try {
      useGLTF.preload(modelUrl);
    } catch { }
  }, [modelUrl]);

  if (failed) return <div className={styles.avatarPlaceholder}>Model load failed</div>;

  return (
    <div className={styles.avatarFrame3d} aria-label="Avatar 3D frame">
      <Canvas camera={{ position: [0, 1.25, 1.8], fov: 42 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 3]} intensity={1.1} />

        <Suspense fallback={null}>
          <group position={[0, -1.3, 0]} scale={2.0} rotation={[-0.5, -0.5, 0]}>
            <ErrorCatcher onError={() => setFailed(true)}>
              {/* ✅ key บังคับ remount เวลาเปลี่ยน modelUrl */}
              <AnimatedGLB key={modelUrl} url={modelUrl} />
            </ErrorCatcher>
          </group>
        </Suspense>

        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
}

function SelectorBox({
  title,
  options,
  selectedIds,
  onToggle,
}: {
  title: string;
  options: OptionItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter((o) => o.name.toLowerCase().includes(s));
  }, [options, q]);

  const selectedNames = useMemo(() => {
    const set = new Set(selectedIds);
    return options.filter((o) => set.has(o.id)).map((o) => o.name);
  }, [options, selectedIds]);

  return (
    <div className={styles.selectorBox}>
      <div className={styles.selectorTag}>{title}</div>

      <div className={styles.searchRow}>
        <div className={styles.searchIcon}>⌕</div>
        <input
          className={styles.searchInput}
          placeholder="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className={styles.optionGrid}>
        {filtered.map((o) => {
          const on = selectedIds.includes(o.id);
          return (
            <div
              key={o.id}
              className={styles.optionItem}
              onClick={() => onToggle(o.id)}
              onKeyDown={(e) =>
                e.key === "Enter" || e.key === " " ? onToggle(o.id) : null
              }
              role="button"
              tabIndex={0}
            >
              <div className={`${styles.checkBox} ${on ? styles.checkBoxOn : ""}`}>
                {on ? "✓" : ""}
              </div>
              <div className={styles.optionLabel}>{o.name}</div>
            </div>
          );
        })}
      </div>

      {selectedNames.length > 0 && (
        <p className={styles.note} style={{ marginTop: 14 }}>
          Selected: {selectedNames.join(", ")}
        </p>
      )}
    </div>
  );
}

export default function FillMoreInfoStudentPage() {
  const [openJob, setOpenJob] = useState(false);
  const [openSkill, setOpenSkill] = useState(false);

  // ✅ avatar from DB (เหมือน employees)
  const [avatarOptions, setAvatarOptions] = useState<AvatarOption[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(true);
  const [avatarId, setAvatarId] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    phone: "",
    university: "",
    faculty: "",
    major: "",
    year: "",
  });

  const [jobOptions, setJobOptions] = useState<OptionItem[]>([]);
  const [skillOptions, setSkillOptions] = useState<OptionItem[]>([]);
  const [jobSelected, setJobSelected] = useState<string[]>([]);
  const [skillSelected, setSkillSelected] = useState<string[]>([]);

  const setField =
    (k: keyof typeof form) =>
      (e: ChangeEvent<HTMLInputElement>) =>
        setForm((p) => ({ ...p, [k]: e.target.value }));

  // jobs/skills
  useEffect(() => {
    (async () => {
      const [jobsRes, skillsRes] = await Promise.all([
        fetch("/api/options/jobs", { cache: "no-store" }),
        fetch("/api/options/skills", { cache: "no-store" }),
      ]);

      if (jobsRes.ok) setJobOptions(await jobsRes.json());
      if (skillsRes.ok) setSkillOptions(await skillsRes.json());
    })();
  }, []);

  // avatars
  useEffect(() => {
    (async () => {
      setLoadingAvatars(true);
      try {
        const r = await fetch("/api/options/avatars/student", { cache: "no-store" })
        if (!r.ok) return;

        const data: AvatarOption[] = await r.json();
        setAvatarOptions(data);

        const firstId = data?.[0]?.id ?? null;
        setAvatarId((prev) => prev ?? firstId);

        // preload ลดกระตุก
        data.forEach((a) => {
          try {
            useGLTF.preload(a.modelUrl);
          } catch { }
        });
      } finally {
        setLoadingAvatars(false);
      }
    })();
  }, []);

  const toggleJob = (id: string) => {
    setJobSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSkill = (id: string) => {
    setSkillSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const activeAvatar =
    avatarOptions.find((a) => a.id === avatarId) ?? avatarOptions[0];

  const prevAvatar = () => {
    if (!avatarOptions.length) return;
    const curId = activeAvatar?.id ?? avatarOptions[0].id;
    const idx = Math.max(0, avatarOptions.findIndex((a) => a.id === curId));
    const nextIdx = (idx - 1 + avatarOptions.length) % avatarOptions.length;
    setAvatarId(avatarOptions[nextIdx].id);
  };

  const nextAvatar = () => {
    if (!avatarOptions.length) return;
    const curId = activeAvatar?.id ?? avatarOptions[0].id;
    const idx = Math.max(0, avatarOptions.findIndex((a) => a.id === curId));
    const nextIdx = (idx + 1) % avatarOptions.length;
    setAvatarId(avatarOptions[nextIdx].id);
  };

  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleNext = async () => {
    setErr(null);

    if (!avatarId) {
      setErr("Please select avatar");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        birth_date: toRFC3339Date(form.birthDate),    // แนะนำ YYYY-MM-DD
        phone: form.phone.trim(),
        university: form.university.trim(),
        faculty: form.faculty.trim(),
        major: form.major.trim(),
        year: Number(form.year || 0),
        avatar_choice: avatarId,
        // ถ้า backend ยังไม่รองรับ job_ids/skill_ids ให้ย้ายไปเก็บใน profile jsonb แทน
        job_ids: jobSelected,
        skill_ids: skillSelected,
        is_profile_complete: true,
      };

      const r = await fetch("/api/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await r.json().catch(() => null);
      if (!r.ok || !res?.ok) {
        throw new Error(res?.detail || res?.message || "Save failed");
      }

      router.push("/student/explore");
    } catch (e: any) {
      setErr(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  function toRFC3339Date(input: string) {
    const s = (input || "").trim();

    // 1) ถ้าเป็น YYYY-MM-DD → แปลงเป็น 00:00:00Z
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00:00Z`;

    // 2) ถ้าเป็น DD/MM/YYYY หรือ DD-MM-YYYY → แปลงเป็น YYYY-MM-DDT00:00:00Z
    const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (m) {
      const dd = String(m[1]).padStart(2, "0");
      const mm = String(m[2]).padStart(2, "0");
      const yyyy = m[3];
      return `${yyyy}-${mm}-${dd}T00:00:00Z`;
    }

    // 3) ถ้ามาเป็น ISO datetime อยู่แล้ว ให้ส่งตรง
    return s;
  }

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <Link href="/" className={styles.logoWrap} aria-label="Home">
          <img src="/images/logo/logo-v1-no_bg.png" alt="VCEP" className={styles.logo} />
        </Link>

        <nav className={styles.navBar} aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const disabled = item.enabled === false;
            const cls = `${styles.navItem} ${disabled ? styles.navItemDisabled : ""}`;
            return disabled ? (
              <span key={item.label} className={cls} aria-disabled="true" title="Coming soon">
                {item.label}
              </span>
            ) : (
              <Link key={item.label} href={item.href} className={cls}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <main className={styles.main}>
        {/* LEFT */}
        <section className={styles.card}>
          <h1 className={styles.title}>Student</h1>

          <div className={styles.formScroll}>
            <div className={styles.formBlock}>
              <div className={styles.grid2}>
                <input className={styles.input} placeholder="First name" value={form.firstName} onChange={setField("firstName")} />
                <input className={styles.input} placeholder="Last name" value={form.lastName} onChange={setField("lastName")} />
              </div>

              <div className={styles.grid2}>
                <input
                  className={styles.input}
                  type="date"
                  value={form.birthDate}
                  onChange={setField("birthDate")}
                />
                <input className={styles.input} placeholder="Phone number" value={form.phone} onChange={setField("phone")} />
              </div>

              <div className={styles.hr} />

              <div className={styles.stack}>
                <input className={styles.input} placeholder="University" value={form.university} onChange={setField("university")} />
                <input className={styles.input} placeholder="Faculty" value={form.faculty} onChange={setField("faculty")} />
              </div>

              <div className={styles.grid2}>
                <input className={styles.input} placeholder="Major" value={form.major} onChange={setField("major")} />
                <input className={styles.input} placeholder="Year" value={form.year} onChange={setField("year")} />
              </div>

              <div className={styles.hr} />

              <button type="button" className={styles.pickField} onClick={() => setOpenJob((v) => !v)}>
                <span className={styles.pickPlaceholder}>
                  {jobSelected.length ? `${jobSelected.length} selected` : "Job of interest"}
                </span>
              </button>

              {openJob && (
                <SelectorBox title="Job of interest" options={jobOptions} selectedIds={jobSelected} onToggle={toggleJob} />
              )}

              <button type="button" className={styles.pickField} onClick={() => setOpenSkill((v) => !v)}>
                <span className={styles.pickPlaceholder}>
                  {skillSelected.length ? `${skillSelected.length} selected` : "Your skills"}
                </span>
              </button>

              {openSkill && (
                <SelectorBox title="Your skills" options={skillOptions} selectedIds={skillSelected} onToggle={toggleSkill} />
              )}

              <div className={styles.hr} />
            </div>
          </div>
        </section>

        {/* RIGHT (เหมือน employees) */}
        <section className={styles.avatarStage} aria-label="Avatar">
          <div className={styles.avatarRow}>
            <button className={styles.iconBtn} type="button" onClick={prevAvatar} aria-label="Previous">
              ◀
            </button>

            <div className={styles.avatarCenter}>
              {loadingAvatars ? (
                <div className={styles.avatarPlaceholder}>Loading...</div>
              ) : activeAvatar ? (
                <Avatar3D modelUrl={activeAvatar.modelUrl} />
              ) : (
                <div className={styles.avatarPlaceholder}>No avatars</div>
              )}
            </div>

            <button className={styles.iconBtn} type="button" onClick={nextAvatar} aria-label="Next">
              ▶
            </button>
          </div>

          <div className={styles.avatarDots}>
            {avatarOptions.map((a) => {
              const on = a.id === activeAvatar?.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  className={`${styles.dot} ${on ? styles.dotOn : ""}`}
                  onClick={() => setAvatarId(a.id)}
                  aria-label="Select avatar"
                />
              );
            })}
          </div>
        </section>
        <div className={styles.nextWrap}>
          <button
            className={styles.nextBtn}
            type="button"
            onClick={handleNext}
            disabled={saving}
          >
            {saving ? "Saving..." : "Next"}
          </button>

          {err && <p className={styles.note} style={{ marginTop: 8 }}>{err}</p>}
        </div>
      </main>
    </div>
  );
}