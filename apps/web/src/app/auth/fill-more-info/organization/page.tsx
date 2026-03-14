"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense } from "react";

function BoyModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

type OptionItem = { id: string; name: string };

const NAV_ITEMS = [
  { label: "About", href: "/about", enabled: false },
  { label: "Contact", href: "/contact", enabled: false },
  { label: "Log in", href: "/auth/sign-in" },
  { label: "Register", href: "/auth/register" },
];

const AVATARS = [
  "/images/avatar%20picture/avatar1.png",
  "/images/avatar%20picture/avatar2.png",
  "/images/avatar%20picture/avatar3.png",
];

function Avatar3D({ url }: { url: string }) {
  return (
    <div className={styles.avatarFrame3d} aria-label="Avatar frame">
      <Canvas camera={{ position: [0, 1.25, 1.8], fov: 42 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 3]} intensity={1.1} />
        <Suspense fallback={null}>
          {/* ปรับตำแหน่ง/สเกลให้พอดีกรอบ */}
          <group
            position={[0, -1.30, 0]}
            scale={2.0}
            rotation={[-0.50, -0.5, 0]}  // ✅ เงยหน้าขึ้น (ปรับได้)
          >
            <BoyModel url={url} />
          </group>
        </Suspense>

        {/* ล็อกไม่ให้ผู้ใช้หมุน/ซูมเอง (เหมือนรูปนิ่ง) */}
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
}
useGLTF.preload("/models/boy.glb");

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

export default function FillMoreInfoOrgPage() {
  const router = useRouter();

  const [openJob, setOpenJob] = useState(false);
  const [openSkill, setOpenSkill] = useState(false);

  const [avatarIndex, setAvatarIndex] = useState(0);
  const prevAvatar = () =>
    setAvatarIndex((i) => (i - 1 + AVATARS.length) % AVATARS.length);
  const nextAvatar = () =>
    setAvatarIndex((i) => (i + 1) % AVATARS.length);

  const [form, setForm] = useState({
    orgName: "",
    companySize: "",
    businessType: "",
    location: "",
    aboutUs: "",
    logoFile: null as File | null,

    email: "",
    phone: "",
    website: "",

    linkedin: "",
    facebook: "",
    instagram: "",
    youtube: "",
    tiktok: "",
  });

  const [jobOptions, setJobOptions] = useState<OptionItem[]>([]);
  const [skillOptions, setSkillOptions] = useState<OptionItem[]>([]);
  const [jobSelected, setJobSelected] = useState<string[]>([]);
  const [skillSelected, setSkillSelected] = useState<string[]>([]);


  const setField =
    (k: keyof typeof form) =>
      (e: ChangeEvent<HTMLInputElement>) =>
        setForm((p) => ({ ...p, [k]: e.target.value }));

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

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  // crop modal state
  const [cropOpen, setCropOpen] = useState(false);
  const [cropUrl, setCropUrl] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [imgNat, setImgNat] = useState({ w: 0, h: 0 });

  const cropBoxSize = 320; // ขนาดกรอบ crop (px)

  useEffect(() => {
    if (!form.logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(form.logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.logoFile]);

  useEffect(() => {
    if (!form.logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(form.logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.logoFile]);



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
          <h1 className={styles.title}>Organization</h1>

          <div className={styles.formScroll}>
            <div className={styles.formBlock}>

              {/* Basic Information */}
              <div className={styles.sectionTitle}>Basic Information</div>

              <div className={styles.grid2_OrgName}>
                <input
                  className={styles.input}
                  placeholder="Organization Name"
                  value={form.orgName}
                  onChange={(e) => setForm((p) => ({ ...p, orgName: e.target.value }))}
                />
                <input
                  className={styles.input}
                  placeholder="Company Size"
                  value={form.companySize}
                  onChange={(e) => setForm((p) => ({ ...p, companySize: e.target.value }))}
                />
              </div>

              <input
                className={styles.input}
                placeholder="Business Type"
                value={form.businessType}
                onChange={(e) => setForm((p) => ({ ...p, businessType: e.target.value }))}
              />

              <input
                className={styles.input}
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              />

              {/* About Us + Logo (2 columns) */}
              <div className={styles.gridAboutLogo}>
                <textarea
                  className={styles.textarea}
                  placeholder="About Us"
                  value={form.aboutUs}
                  onChange={(e) => setForm((p) => ({ ...p, aboutUs: e.target.value }))}
                />

                <div className={styles.logoBox}>
                  {!logoPreview && <div className={styles.logoLabel}>Logo</div>}
                  <label className={styles.logoDrop}>
                    <input
                      type="file"
                      accept="image/*"
                      className={styles.fileInput}
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        if (!f) return;

                        // เปิด crop modal ด้วยไฟล์ที่เพิ่งเลือก
                        const url = URL.createObjectURL(f);
                        setCropUrl(url);
                        setCropZoom(1);
                        setCropOffset({ x: 0, y: 0 });
                        setCropOpen(true);

                        // reset input เพื่อเลือกไฟล์เดิมซ้ำได้
                        e.currentTarget.value = "";
                      }}
                    />
                    <div className={styles.logoDropInner}>
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className={styles.logoPreviewImg} />
                      ) : (
                        <div className={styles.uploadText}>upload</div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div className={styles.hr} />

              {/* Contact */}
              <div className={styles.sectionTitle}>Contact</div>

              <div className={styles.grid2}>
                <input
                  className={styles.input}
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
                <input
                  className={styles.input}
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>

              <input
                className={styles.input}
                placeholder="Website"
                value={form.website}
                onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
              />

              <div className={styles.hr} />

              {/* Social */}
              <div className={styles.sectionTitle}>Organization</div>

              <input
                className={styles.input}
                placeholder="LinkedIn link"
                value={form.linkedin}
                onChange={(e) => setForm((p) => ({ ...p, linkedin: e.target.value }))}
              />
              <input
                className={styles.input}
                placeholder="Facebook link"
                value={form.facebook}
                onChange={(e) => setForm((p) => ({ ...p, facebook: e.target.value }))}
              />
              <input
                className={styles.input}
                placeholder="Instagram link"
                value={form.instagram}
                onChange={(e) => setForm((p) => ({ ...p, instagram: e.target.value }))}
              />
              <input
                className={styles.input}
                placeholder="YouTube link"
                value={form.youtube}
                onChange={(e) => setForm((p) => ({ ...p, youtube: e.target.value }))}
              />
              <input
                className={styles.input}
                placeholder="TikTok link"
                value={form.tiktok}
                onChange={(e) => setForm((p) => ({ ...p, tiktok: e.target.value }))}
              />

              <div className={styles.hr} />
            </div>
          </div>
        </section>

        {/* RIGHT: avatar 3D */}
        <section className={styles.avatarStage} aria-label="Avatar">
          <Avatar3D url="/models/boy.glb" />

          <div className={styles.avatarDots}>
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                type="button"
                className={`${styles.dot} ${i === avatarIndex ? styles.dotOn : ""}`}
                onClick={() => setAvatarIndex(i)}
                aria-label={`Select avatar ${i + 1}`}
              />
            ))}
          </div>

          <div className={styles.avatarControls}>
            <button className={styles.iconBtn} type="button" onClick={prevAvatar} aria-label="Previous">
              {"<"}
            </button>
            <button className={styles.iconBtn} type="button" onClick={nextAvatar} aria-label="Next">
              {">"}
            </button>
          </div>

          <button className={styles.nextBtn} type="button" onClick={() => router.push("/auth/fill-more-info/organization/employee")}>
            Next
          </button>
        </section>
      </main>

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
                style={{ transform: `translate(calc(-50% + ${cropOffset.x}px), calc(-50% + ${cropOffset.y}px)) scale(${cropZoom})` }}
              />

              {/* drag layer */}
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
                  // Cancel
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

                  const img = new Image();
                  img.src = cropUrl;
                  await new Promise<void>((res) => (img.onload = () => res()));

                  const Cw = cropBoxSize;
                  const Ch = cropBoxSize;

                  // cover scale (ให้รูปเต็มกรอบก่อน) แล้วคูณ zoom
                  const baseScale = Math.max(Cw / imgNat.w, Ch / imgNat.h);
                  const s = baseScale * cropZoom;

                  const rw = imgNat.w * s;
                  const rh = imgNat.h * s;

                  // ตำแหน่งรูปในกรอบ (center + offset)
                  const left = (Cw - rw) / 2 + cropOffset.x;
                  const top = (Ch - rh) / 2 + cropOffset.y;

                  // แปลงกลับเป็นพิกัดบนภาพจริง
                  let sx = (0 - left) / s;
                  let sy = (0 - top) / s;
                  let sw = Cw / s;
                  let sh = Ch / s;

                  // clamp ให้อยู่ในภาพ
                  sx = Math.max(0, Math.min(imgNat.w - sw, sx));
                  sy = Math.max(0, Math.min(imgNat.h - sh, sy));

                  const out = 512; // ไฟล์ output (px)
                  const canvas = document.createElement("canvas");
                  canvas.width = out;
                  canvas.height = out;
                  const ctx = canvas.getContext("2d")!;
                  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, out, out);

                  const blob: Blob = await new Promise((resolve) =>
                    canvas.toBlob((b) => resolve(b!), "image/png", 0.92)
                  );

                  const file = new File([blob], "logo.png", { type: "image/png" });

                  // set เป็น logoFile ที่ crop แล้ว
                  setForm((p) => ({ ...p, logoFile: file }));

                  // ปิด modal + cleanup
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
    </div>
  );
}
