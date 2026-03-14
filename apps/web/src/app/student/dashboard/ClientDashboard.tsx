"use client";

import styles from "./ClientDashboard.module.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* =======================
   Types
======================= */
type StudentMe = {
  name: string;
  bio: string;
  phone: string;
  email: string;
  address: string;
  education: string;
  level: number;
  xp: number;
  xpMax: number;
};

type Skill = { id: string; name: string; percent: number };
type ModalKind = "editProfile" | "badges" | "certificate" | null;

type TileId = "badges" | "certificate" | "portfolio";

/* =======================
   Mock Data (replace w/ API later)
======================= */
const MOCK_ME: StudentMe = {
  name: "Carolyn Stewart",
  bio: "Experienced professional in design bringing fresh perspectives. Committed to creating impactful solutions and driving positive change.",
  phone: "123-745-9803",
  email: "carolyn.stewart@example.com",
  address: "1754 Maple Drive Houston, PA 71107",
  education: "Mahidol University",
  level: 10,
  xp: 500,
  xpMax: 1000,
};

const LEVEL_BADGES = [
  "/images/icons/badge01.png",
  "/images/icons/badge02.png",
  "/images/icons/badge03.png",
  "/images/icons/badge04.png",
  "/images/icons/badge05.png",
];


const BADGE_TILES: Array<{ id: TileId; label: string; image: string; alt: string }> = [
  { id: "badges", label: "badges", image: "/images/icons/porttfolio-icon.png", alt: "Badges" },
  { id: "certificate", label: "certificate", image: "/images/icons/porttfolio-icon.png", alt: "Certificate" },
  { id: "portfolio", label: "portfolio", image: "/images/icons/porttfolio-icon.png", alt: "Portfolio" },
];

const ACTIVITIES = [
  { id: "a1", title: "Frontend Basics & Web Terminology", sub: "Quiz", xp: 20 },
  { id: "a2", title: "UI Layout Explanation Task", sub: "Task", xp: 15 },
  { id: "a3", title: "Responsive Web Page Workshop", sub: "Workshop", xp: 50 },
];

const MOCK_SKILLS: Skill[] = [
  { id: "s1", name: "HTML", percent: 85 },
  { id: "s2", name: "CSS", percent: 70 },
  { id: "s3", name: "JavaScript", percent: 55 },
  { id: "s4", name: "React", percent: 42 },
  { id: "s5", name: "TypeScript", percent: 35 },
  { id: "s6", name: "UI/UX", percent: 60 },
  { id: "s7", name: "Git", percent: 50 },
  { id: "s8", name: "API", percent: 40 },
  { id: "s9", name: "Testing", percent: 25 },
  { id: "s10", name: "SQL", percent: 45 },
  { id: "s11", name: "Cloud", percent: 20 },
  { id: "s12", name: "Soft Skills", percent: 65 },
];

/* =======================
   Helpers
======================= */
function cx(...arr: Array<string | false | undefined | null>) {
  return arr.filter(Boolean).join(" ");
}

/* =======================
   Page
======================= */
export default function ClientDashboard() {
  const router = useRouter();

  const [me, setMe] = useState<StudentMe | null>(null);
  const [skills] = useState<Skill[]>(MOCK_SKILLS);

  const avatarChoices = useMemo(
    () => [
      "/images/avatar%20picture/avatar1.png",
      "/images/avatar%20picture/avatar2.png",
      "/images/avatar%20picture/avatar3.png",
    ],
    []
  );
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  // profile photo
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropUrl, setCropUrl] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [imgNat, setImgNat] = useState({ w: 0, h: 0 });

  const cropBoxWidth = 280;
  const cropBoxHeight = 190;
  const baseScale =
    imgNat.w && imgNat.h
      ? Math.max(cropBoxWidth / imgNat.w, cropBoxHeight / imgNat.h)
      : 1;

  // modal
  const [modal, setModal] = useState<ModalKind>(null);

  // edit draft
  const [draft, setDraft] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    phone: "",
    email: "",
    address: "",
    about: "",
  });

  const closeCropModal = () => {
    if (cropUrl) URL.revokeObjectURL(cropUrl);
    setCropUrl(null);
    setCropOpen(false);
  };

  const startCropPhoto = (f: File | null) => {
    if (!f) return;
    const url = URL.createObjectURL(f);
    setCropUrl(url);
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
    setCropOpen(true);
  };

  useEffect(() => {
    return () => {
      if (photoUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  useEffect(() => {
    setMe(MOCK_ME);
  }, []);

  useEffect(() => {
    if (!me) return;
    const parts = me.name.split(" ");
    setDraft((p) => ({
      ...p,
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" ") ?? "",
      phone: me.phone,
      email: me.email,
      address: me.address,
      about: me.bio,
    }));
  }, [me]);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setModal(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

  if (!me) return null;

  const filledMedals = Math.min(5, Math.max(0, Math.floor(me.level / 2)));

  const onPickPhoto = (f: File | null) => {
    startCropPhoto(f);
  };

  const openPhotoPicker = () => fileRef.current?.click();

  const onClickTile = (id: TileId) => {
    if (id === "portfolio") return router.push("/student/portfolio");
    if (id === "badges") return setModal("badges");
    if (id === "certificate") return setModal("certificate");
  };

  const saveEdit = () => {
    const fullName = `${draft.firstName} ${draft.lastName}`.trim() || me.name;

    setMe((prev) =>
      prev
        ? {
          ...prev,
          name: fullName,
          phone: draft.phone,
          email: draft.email,
          address: draft.address,
          bio: draft.about,
        }
        : prev
    );

    setModal(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.board}>
        <div className={styles.dash}>
          {/* LEFT */}
          <div className={styles.left}>
            <TopProfileRow
              me={me}
              photoUrl={photoUrl}
              fileRef={fileRef}
              onPickPhoto={onPickPhoto}
              openPhotoPicker={openPhotoPicker}
              onEdit={() => setModal("editProfile")}
            />

            <MidRow
              me={me}
              filledMedals={filledMedals}
              skills={skills}
              onClickTile={onClickTile}
            />

            <ActivityMissionSplit />

            <BottomSplit />
          </div>

          {/* RIGHT */}
          <div className={styles.right}>
            <AvatarCard
              selected={selectedAvatar}
              onSelect={setSelectedAvatar}
              avatarChoices={avatarChoices}
            />
            <CalendarCard title="October" />
          </div>

          {/* MODALS */}
          {modal && (
            <ModalShell onClose={() => setModal(null)}>
              {modal === "editProfile" && (
                <EditProfileModal
                  draft={draft}
                  setDraft={setDraft}
                  onCancel={() => setModal(null)}
                  onSave={saveEdit}
                />
              )}

              {modal === "badges" && (
                <GridModal title="Badges" count={8} onClose={() => setModal(null)} />
              )}

              {modal === "certificate" && (
                <GridModal title="Certificate" count={6} onClose={() => setModal(null)} />
              )}
            </ModalShell>
          )}
          {cropOpen && cropUrl && (
            <div className={styles.cropOverlay} role="dialog" aria-modal="true">
              <div className={styles.cropModal}>
                <div className={styles.cropHeader}>
                  <div className={styles.cropTitle}>Crop Profile Photo</div>
                  <button
                    type="button"
                    className={styles.cropClose}
                    onClick={closeCropModal}
                  >
                    ✕
                  </button>
                </div>

                <div
                  className={styles.cropBox}
                  style={{ width: cropBoxWidth, height: cropBoxHeight }}
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
                      transform: `translate(calc(-50% + ${cropOffset.x}px), calc(-50% + ${cropOffset.y}px)) scale(${baseScale * cropZoom})`,
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
                    onClick={closeCropModal}
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

                      const Cw = cropBoxWidth;
                      const Ch = cropBoxHeight;

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

                      const outW = 840;
                      const outH = 570;
                      const canvas = document.createElement("canvas");
                      canvas.width = outW;
                      canvas.height = outH;

                      const ctx = canvas.getContext("2d")!;
                      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

                      const blob: Blob = await new Promise((resolve) =>
                        canvas.toBlob((b) => resolve(b!), "image/png", 0.92)
                      );

                      const nextUrl = URL.createObjectURL(blob);

                      setPhotoUrl((prev) => {
                        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
                        return nextUrl;
                      });

                      closeCropModal();
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

  );
}

/* =======================
   Sections
======================= */
function TopProfileRow({
  me,
  photoUrl,
  fileRef,
  onPickPhoto,
  openPhotoPicker,
  onEdit,
}: {
  me: StudentMe;
  photoUrl: string | null;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onPickPhoto: (f: File | null) => void;
  openPhotoPicker: () => void;
  onEdit: () => void;
}) {
  return (
    <div className={styles.topGrid}>
      <section className={cx(styles.card, styles.photoCard)}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className={styles.hiddenFile}
          onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
        />

        <button
          type="button"
          className={styles.photoBtn}
          onClick={openPhotoPicker}
          aria-label="Change profile photo"
        >
          <div className={styles.photoFrame}>
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className={styles.photoImg} />
            ) : (
              <div className={styles.photoPlaceholder} />
            )}
          </div>
        </button>
      </section>

      <section className={styles.bioBox}>
        <div className={styles.bioBg} />

        <button
          className={styles.editButtonIcon}
          type="button"
          aria-label="Edit personal information"
          onClick={onEdit}
        >
          ✎
        </button>

        <div className={styles.bioInformation}>
          <div className={styles.profileName}>{me.name}</div>

          <div className={styles.profileBio}>
            {me.bio}
          </div>

          <div className={styles.linesWrap}>
            <div className={styles.lineTop} />
            <div className={styles.lineBottomLeft} />
            <div className={styles.lineBottomRight} />
            <div className={styles.lineVertical} />
          </div>

          <div className={styles.profilePhone}>
            Phone: {me.phone}
          </div>

          <div className={styles.profileEmail}>
            Email: {me.email}
          </div>

          <div className={styles.profileAddress}>
            Address: {me.address}
          </div>

          <div className={styles.profileEducation}>
            Education: {me.education}
          </div>
        </div>
      </section>
    </div>
  );
}

function MidRow({
  me,
  skills,
  onClickTile,
}: {
  me: StudentMe;
  filledMedals: number;
  skills: Skill[];
  onClickTile: (id: TileId) => void;
}) {
  const badgeThresholds = [5, 6, 10, 20, 35];
  const filledMedals = badgeThresholds.filter((lv) => me.level >= lv).length;
  const currentBadgeIndex =
    filledMedals > 0 ? Math.min(filledMedals - 1, LEVEL_BADGES.length - 1) : -1;

  return (
    <div className={styles.midGrid}>
      <section className={cx(styles.card, styles.rankCard)}>
        <div className={styles.rankTop}>
          <div className={styles.levelWrap}>
            <div className={styles.levelXpBox} />

            <div className={styles.levelXpScore}>
              <span>{me.xp}/{me.xpMax}</span>
              <span>XP</span>
            </div>

            <div className={styles.levelBadgeBox}>
              <div className={styles.levelBadgeBg} />
              <div className={styles.levelValue}>{me.level}</div>
            </div>

            <img
              src={
                currentBadgeIndex >= 0
                  ? LEVEL_BADGES[currentBadgeIndex]
                  : "/images/icons/badge01-icon.png"
              }
              alt=""
              aria-hidden="true"
              className={styles.levelBadgeIcon}
            />

          </div>
        </div>

        <div className={styles.medalRow}>
          {LEVEL_BADGES.map((src, i) => {
            const unlocked = i < filledMedals;
            const active = i === currentBadgeIndex;

            return (
              <div
                key={src}
                className={cx(
                  styles.medalSlot,
                  unlocked ? styles.medalOn : styles.medalOff,
                  active && styles.medalActive
                )}
              >
                <img
                  src={src}
                  alt={`Level badge ${i + 1}`}
                  className={styles.medalImg}
                  draggable={false}
                />
              </div>
            );
          })}
        </div>

        <div className={styles.tileRow}>
          {BADGE_TILES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={styles.tileBtn}
              onClick={() => onClickTile(t.id)}
              aria-label={t.label}
            >
              <div className={styles.tileOuter} />
              <div className={styles.tileInner} />

              <div className={styles.tileIconWrap}>
                <img src={t.image} alt={t.alt} className={styles.tileIcon} />
              </div>

              <div className={styles.tileLabel}>{t.label}</div>
            </button>
          ))}
        </div>

      </section>

      <section className={cx(styles.card, styles.skillCard)}>
        <div className={styles.skillHead}>
          <div className={styles.skillTitle}>Skill Progress graph</div>
        </div>

        <div className={styles.skillViewport}>
          <div
            className={styles.skillScroll}
            role="region"
            aria-label="Skill progress list"
          >
            <div className={styles.skillRow}>
              {skills.map((s, i) => (
                <div key={s.id} className={styles.skillCol}>
                  <div className={styles.skillPct}>{s.percent}%</div>

                  <div className={styles.skillTube}>
                    <div
                      className={cx(
                        styles.skillFill,
                        i === 0 && styles.trackGreenWide,
                        i === 1 && styles.trackPink,
                        i === 2 && styles.trackYellow,
                        i === 3 && styles.trackGreen,
                        i === 4 && styles.trackSoftPink,
                        i === 5 && styles.trackBlue,
                        i === 6 && styles.trackOrange,
                        i === 7 && styles.trackRose,
                        i === 8 && styles.trackSoftPink,
                        i === 9 && styles.trackBlue,
                        i === 10 && styles.trackOrange,
                        i === 11 && styles.trackRose
                      )}
                      style={{ height: `${s.percent}%` }}
                    />

                  </div>

                  <div className={styles.skillLabel} title={s.name}>
                    {s.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/*  Split card: Activity | Mission (Figma structure) */
function ActivityMissionSplit() {
  return (
    <section className={cx(styles.card, styles.splitCard)}>
      <div className={styles.splitLeft}>
        <div className={styles.cardHead}>
          <div className={styles.sectionTitle}>Activity Overview</div>
          <button className={styles.viewAll} type="button">
            view all
          </button>
        </div>

        <div className={styles.activityCards}>
          {ACTIVITIES.map((a) => (
            <div key={a.id} className={styles.activityItem}>
              <div>
                <div className={styles.activityTitle}>{a.title}</div>
                <div className={styles.activitySub}>{a.sub}</div>
              </div>

              <div className={styles.activityBottom}>
                <div className={styles.activityXp}>{a.xp} XP</div>
                <div className={styles.star}>⭐</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.splitVR} aria-hidden />

      <div className={styles.splitRight}>
        <div className={styles.sectionTitle}>Today’s mission</div>
        <div className={styles.missionList}>
          <div className={styles.missionItem}>
            <div>Join 2 activities</div>
            <b>10 XP</b>
          </div>
          <div className={styles.missionItem}>
            <div>Complete one activity</div>
            <b>10 XP</b>
          </div>
          <div className={styles.missionItem}>
            <div>Join activity in 15 minutes</div>
            <b>10 XP</b>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Split card: Completion | XP chart (Figma structure) */
function BottomSplit() {
  return (
    <section className={cx(styles.card, styles.splitCardBottom)}>
      <div className={styles.completionPane}>
        <div className={styles.sectionTitle}>Activity Completion Status</div>

        <div className={styles.completionBody}>
          <div className={styles.donut}>
            <div className={styles.donutCenter}>15</div>
          </div>

          <div className={styles.legend}>
            <div>
              <span className={cx(styles.dot, styles.dotGreen)} /> Completed
            </div>
            <div>
              <span className={cx(styles.dot, styles.dotYellow)} /> In progress
            </div>
            <div>
              <span className={cx(styles.dot, styles.dotRed)} /> Not started
            </div>
          </div>
        </div>
      </div>

      <div className={styles.splitVR} aria-hidden />

      <div className={styles.xpPane}>
        <div className={styles.cardHead}>
          <div className={styles.sectionTitle}>สถิติ XP ล่าสุด</div>
          <div className={styles.periodToggle}>
            <button className={cx(styles.pill, styles.pillOn)} type="button">
              daily
            </button>
            <button className={styles.pill} type="button">
              weekly
            </button>
          </div>
        </div>

        <div className={styles.barChart}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={styles.barCol}>
              <div className={styles.bar} style={{ height: `${22 + (i % 5) * 14}%` }} />
              <div className={styles.barLabel}>D{i + 1}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AvatarCard({
  selected,
  onSelect,
  avatarChoices,
}: {
  selected: number;
  onSelect: (idx: number) => void;
  avatarChoices: string[];
}) {
  return (
    <section className={cx(styles.card, styles.avatarCard)}>
      <div className={styles.avatarBig}>
        <div className={styles.avatarStub} />
      </div>

      <div className={styles.avatarThumbRow}>
        {avatarChoices.map((src, idx) => (
          <button
            key={src}
            type="button"
            className={cx(styles.avatarThumbCard, idx === selected && styles.avatarThumbCardOn)}
            onClick={() => onSelect(idx)}
          >
            <div className={styles.avatarThumbImg} />
            <div className={styles.avatarCheck}>
              <span className={cx(styles.checkBox, idx === selected && styles.checkBoxOn)}>
                {idx === selected ? "✓" : ""}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

type CalendarEvent =
  | "pink"
  | "yellow"
  | "green"
  | "softPink"
  | "blue"
  | "orange"
  | "rose"
  | "greenWide";

type CalendarDayItem = {
  day: string;
  weekend?: boolean;
  otherMonth?: boolean;
  muted?: boolean;
  events: CalendarEvent[];
};

function CalendarCard({ title }: { title: string }) {
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const weeks: CalendarDayItem[][] = [
    [
      { day: "28", otherMonth: true, events: [] },
      { day: "29", otherMonth: true, events: [] },
      { day: "30", otherMonth: true, events: [] },
      { day: "1", events: ["green", "orange"] },
      { day: "2", events: ["orange"] },
      { day: "3", events: ["rose"] },
      { day: "4", weekend: true, events: [] },
    ],
    [
      { day: "5", weekend: true, events: ["pink", "yellow", "green"] },
      { day: "6", events: ["softPink", "blue"] },
      { day: "7", events: [] },
      { day: "8", events: ["greenWide", "pink"] },
      { day: "9", events: [] },
      { day: "10", events: [] },
      { day: "11", weekend: true, events: [] },
    ],
    [
      { day: "12", weekend: true, muted: true, events: [] },
      { day: "13", muted: true, events: [] },
      { day: "14", muted: true, events: [] },
      { day: "15", muted: true, events: [] },
      { day: "16", muted: true, events: [] },
      { day: "17", muted: true, events: [] },
      { day: "18", weekend: true, muted: true, events: [] },
    ],
    [
      { day: "19", weekend: true, muted: true, events: [] },
      { day: "20", muted: true, events: [] },
      { day: "21", muted: true, events: [] },
      { day: "22", muted: true, events: [] },
      { day: "23", muted: true, events: [] },
      { day: "24", muted: true, events: [] },
      { day: "25", weekend: true, muted: true, events: [] },
    ],
    [
      { day: "26", weekend: true, muted: true, events: [] },
      { day: "27", muted: true, events: [] },
      { day: "28", muted: true, events: [] },
      { day: "29", muted: true, events: [] },
      { day: "30", muted: true, events: [] },
      { day: "31", muted: true, events: [] },
      { day: "1", otherMonth: true, muted: true, events: [] },
    ],
    [
      { day: "2", otherMonth: true, events: [] },
      { day: "3", otherMonth: true, events: [] },
      { day: "4", otherMonth: true, events: [] },
      { day: "5", otherMonth: true, events: [] },
      { day: "6", otherMonth: true, events: [] },
      { day: "7", otherMonth: true, events: [] },
      { day: "8", otherMonth: true, events: [] },
    ],
  ];

  return (
    <section className={cx(styles.card, styles.calendarCard)}>
      <div className={styles.calendarPanel}>
        <div className={styles.calendarHeader}>
          <div className={styles.calendarMonthChip}>
            <div className={styles.calendarTitle}>{title}</div>
          </div>
        </div>

        <div className={styles.calendarGrid}>
          <div className={styles.calendarRow}>
            {weekDays.map((d, idx) => (
              <div
                key={d}
                className={cx(
                  styles.calendarWeekDay,
                  (idx === 0 || idx === 6) && styles.calendarWeekEnd
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {weeks.map((week, rowIdx) => (
            <div key={rowIdx} className={styles.calendarRow}>
              {week.map((item, idx) => (
                <div
                  key={`${rowIdx}-${idx}-${item.day}`}
                  className={cx(
                    styles.calendarCell,
                    item.weekend && styles.calendarWeekEnd,
                    item.otherMonth && styles.calendarOtherMonth,
                    item.muted && styles.calendarMutedCell
                  )}
                >
                  <div className={styles.calendarCellInner}>
                    <div className={styles.calendarDay}>{item.day}</div>

                    <div className={styles.calendarEvents}>
                      {item.events.map((event, i) => (
                        <div
                          key={i}
                          className={cx(
                            styles.trackBar,
                            event === "pink" && styles.trackPink,
                            event === "yellow" && styles.trackYellow,
                            event === "green" && styles.trackGreen,
                            event === "softPink" && styles.trackSoftPink,
                            event === "blue" && styles.trackBlue,
                            event === "orange" && styles.trackOrange,
                            event === "rose" && styles.trackRose,
                            event === "greenWide" && styles.trackGreenWide
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =======================
   Modal Components
======================= */
function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function EditProfileModal({
  draft,
  setDraft,
  onCancel,
  onSave,
}: {
  draft: {
    firstName: string;
    lastName: string;
    birthDate: string;
    phone: string;
    email: string;
    address: string;
    about: string;
  };
  setDraft: React.Dispatch<React.SetStateAction<any>>;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <>
      <div className={styles.modalTitle}>Personal Information</div>

      <div className={styles.modalForm}>
        <Field label="First name">
          <input className={styles.modalInput} value={draft.firstName} onChange={(e) => setDraft((p: any) => ({ ...p, firstName: e.target.value }))} />
        </Field>

        <Field label="Last name">
          <input className={styles.modalInput} value={draft.lastName} onChange={(e) => setDraft((p: any) => ({ ...p, lastName: e.target.value }))} />
        </Field>

        <div className={styles.modalGrid2}>
          <Field label="Birth date">
            <input className={styles.modalInput} value={draft.birthDate} onChange={(e) => setDraft((p: any) => ({ ...p, birthDate: e.target.value }))} />
          </Field>

          <Field label="Phone number">
            <input className={styles.modalInput} value={draft.phone} onChange={(e) => setDraft((p: any) => ({ ...p, phone: e.target.value }))} />
          </Field>
        </div>

        <Field label="Email">
          <input className={styles.modalInput} value={draft.email} onChange={(e) => setDraft((p: any) => ({ ...p, email: e.target.value }))} />
        </Field>

        <Field label="Address">
          <input className={styles.modalInput} value={draft.address} onChange={(e) => setDraft((p: any) => ({ ...p, address: e.target.value }))} />
        </Field>

        <Field label="About me">
          <textarea className={styles.modalTextarea} value={draft.about} onChange={(e) => setDraft((p: any) => ({ ...p, about: e.target.value }))} />
        </Field>
      </div>

      <div className={styles.modalActions}>
        <button className={cx(styles.modalBtn, styles.modalOk)} type="button" onClick={onSave} aria-label="Save">
          ✓
        </button>
        <button className={cx(styles.modalBtn, styles.modalCancel)} type="button" onClick={onCancel} aria-label="Cancel">
          ✕
        </button>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className={styles.field}>
      <div className={styles.modalLabel}>{label}</div>
      {children}
    </label>
  );
}

function GridModal({ title, count, onClose }: { title: string; count: number; onClose: () => void }) {
  return (
    <>
      <div className={styles.modalTitle}>{title}</div>
      <div className={styles.modalGridBadges}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles.modalBadgeBox} />
        ))}
      </div>
      <div className={styles.modalActions}>
        <button className={cx(styles.modalBtn, styles.modalOk)} type="button" onClick={onClose} aria-label="Close">
          ✓
        </button>
      </div>
    </>
  );
}