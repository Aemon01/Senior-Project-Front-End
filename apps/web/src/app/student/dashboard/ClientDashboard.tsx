"use client";

import styles from "./page.module.css";
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

const BADGE_TILES: Array<{ id: TileId; label: string }> = [
  { id: "badges", label: "badges" },
  { id: "certificate", label: "certificate" },
  { id: "portfolio", label: "portfolio" },
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
    if (!f) return;
    setPhotoUrl(URL.createObjectURL(f));
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
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className={styles.photoImg} />
          ) : (
            <div className={styles.photoPlaceholder} />
          )}
        </button>
      </section>

      <section className={cx(styles.card, styles.profileCard)}>
        <div className={styles.profileHead}>
          <div className={styles.profileName}>{me.name}</div>
          <button className={styles.editBtn} type="button" aria-label="Edit" onClick={onEdit}>
            ✎
          </button>
        </div>

        <div className={styles.profileBio}>{me.bio}</div>

        <div className={styles.hr} />

        <div className={styles.profileInfo2col}>
          <div className={styles.infoCol}>
            <div className={styles.infoRow}>
              <span>Phone:</span> {me.phone}
            </div>
            <div className={styles.infoRow}>
              <span>Address:</span> {me.address}
            </div>
          </div>

          <div className={styles.vr} aria-hidden />

          <div className={styles.infoCol}>
            <div className={styles.infoRow}>
              <span>Email:</span> {me.email}
            </div>
            <div className={styles.infoRow}>
              <span>Education:</span> {me.education}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MidRow({
  me,
  filledMedals,
  skills,
  onClickTile,
}: {
  me: StudentMe;
  filledMedals: number;
  skills: Skill[];
  onClickTile: (id: TileId) => void;
}) {
  return (
    <div className={styles.midGrid}>
      <section className={cx(styles.card, styles.rankCard)}>
        <div className={styles.rankTop}>
          <div className={styles.xpBox}>
            <div className={styles.xpTop}>
              {me.xp}/{me.xpMax}
            </div>
            <div className={styles.xpBottom}>XP</div>
          </div>

          <div className={styles.levelBox}>
            <div className={styles.levelNum}>{me.level}</div>
            <div className={styles.levelMedal} aria-hidden />
          </div>
        </div>

        <div className={styles.medalRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cx(styles.medalSlot, i < filledMedals ? styles.medalOn : styles.medalOff)}>
              🏅
            </div>
          ))}
        </div>

        <div className={styles.tileRow}>
          {BADGE_TILES.map((t) => (
            <button key={t.id} type="button" className={styles.tileBtn} onClick={() => onClickTile(t.id)}>
              <div className={styles.tileThumb} aria-hidden />
              <div className={styles.tileLabel}>{t.label}</div>
            </button>
          ))}
        </div>
      </section>

      <section className={cx(styles.card, styles.skillCard)}>
        <div className={styles.sectionTitle}>Skill Progress graph</div>

        <div className={styles.skillScroll} role="region" aria-label="Skill progress list">
          <div className={styles.skillRow}>
            {skills.map((s) => (
              <div key={s.id} className={styles.skillCol}>
                <div className={styles.skillPct}>{s.percent}%</div>
                <div className={styles.skillTube}>
                  <div className={styles.skillFill} style={{ height: `${s.percent}%` }} />
                </div>
                <div className={styles.skillLabel}>{s.name}</div>
              </div>
            ))}
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
      <div className={styles.splitLeft}>
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

      <div className={styles.splitRight}>
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

function CalendarCard({ title }: { title: string }) {
  return (
    <section className={cx(styles.card, styles.calendarCard)}>
      <div className={styles.calendarTitle}>{title}</div>

      <div className={styles.calendarGrid}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className={styles.calDow}>
            {d}
          </div>
        ))}

        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className={styles.calCell}>
            {i < 2 ? "" : i - 1}
          </div>
        ))}
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