"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

import { Canvas, useFrame  } from "@react-three/fiber";
import { OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";

const NAV_ITEMS = [
  { label: "About", href: "/about", enabled: false },
  { label: "Contact", href: "/contact", enabled: false },
  { label: "Log in", href: "/auth/sign-in" },
  { label: "Register", href: "/auth/register" },
];



type AvatarOption = { id: string; modelUrl: string; unlockLevel: number };

type Employee = {
  firstName: string;
  lastName: string;
  position: string;
  phone: string;
  email: string; // สำหรับ invite employee2/3, employee1 อาจใช้/ไม่ใช้ก็ได้
  canCheckChallenge: boolean;
  avatarId: string | null; // ✅ เก็บเป็น avatar_id (uuid)
};

const emptyEmp = (): Employee => ({
  firstName: "",
  lastName: "",
  position: "",
  phone: "",
  email: "",
  canCheckChallenge: false,
  avatarId: null,
});

function pickIdleClip(names: string[]) {
  const n = names.map((x) => x.toLowerCase());

  // หา idle ก่อน
  const idleIdx = n.findIndex((x) => x.includes("idle"));
  if (idleIdx >= 0) return names[idleIdx];

  // ถ้าไม่มี idle ลองคลิปที่ดูเป็น loop ทั่วไป
  const loopIdx = n.findIndex((x) => x.includes("walk") || x.includes("run"));
  if (loopIdx >= 0) return names[loopIdx];

  // ไม่งั้นเอาตัวแรก
  return names[0];
}

function AnimatedGLB({ url }: { url: string }) {
  const group = useRef<THREE.Group>(null);
  const gltf = useGLTF(url);
  const { actions, names, mixer } = useAnimations(gltf.animations, group);

  useEffect(() => {
    if (!names?.length) return;

    // ✅ stop ทุกคลิป + reset เพื่อไม่ให้ท่าผสมค้าง
    names.forEach((n) => {
      const a = actions[n];
      if (!a) return;
      a.stop();
      a.reset();
    });

    const idleName = pickIdleClip(names);
    const a = actions[idleName];
    if (!a) return;

    // ✅ เล่นคลิปเดียววน
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
  } catch (e) {
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
    } catch {}
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
              {/* ✅ สำคัญมาก: key บังคับ remount เวลาเปลี่ยน modelUrl */}
              <AnimatedGLB key={modelUrl} url={modelUrl} />
            </ErrorCatcher>
          </group>
        </Suspense>

        {/* ✅ ล็อกไม่ให้หมุน/ซูม/แพน */}
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
}

export default function FillMoreInfoOrgEmployeePage() {
  const router = useRouter();

  // employee tabs
  const [maxVisible, setMaxVisible] = useState<1 | 2 | 3>(1); // เริ่มแค่ 1 คน
  const [activeEmp, setActiveEmp] = useState<0 | 1 | 2>(0);
  const [employees, setEmployees] = useState<Employee[]>([emptyEmp(), emptyEmp(), emptyEmp()]);

  // avatar options from DB
  const [avatarOptions, setAvatarOptions] = useState<AvatarOption[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(true);

  // account context (ต้องมี orgId/userId สำหรับบันทึกลง DB)
  const [orgId, setOrgId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [accountEmail, setAccountEmail] = useState<string>("");

  const emp = useMemo(() => employees[activeEmp], [employees, activeEmp]);

  // โหลด account info (ต้องให้ /api/org/active-account คืน orgId,userId,email)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/org/active-account", { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        setOrgId(String(j.orgId || ""));
        setUserId(String(j.userId || ""));
        setAccountEmail(String(j.email || ""));
      } catch { }
    })();
  }, []);

  // โหลด avatar options
  useEffect(() => {
    (async () => {
      setLoadingAvatars(true);
      try {
        const r = await fetch("/api/options/avatars/employee", { cache: "no-store" });
        if (!r.ok) return;
        const data: AvatarOption[] = await r.json();
        setAvatarOptions(data);

        // set default avatar ให้ทุกคน ถ้ายังไม่มี
        const firstId = data?.[0]?.id ?? null;
        setEmployees((prev) =>
          prev.map((e) => ({ ...e, avatarId: e.avatarId ?? firstId }))
        );
      } finally {
        setLoadingAvatars(false);
      }
    })();
  }, []);

  const setEmpField =
    (k: keyof Employee) =>
      (e: ChangeEvent<HTMLInputElement>) => {
        const v =
          e.target.type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : e.target.value;

        setEmployees((prev) => {
          const next = [...prev];
          next[activeEmp] = { ...next[activeEmp], [k]: v } as Employee;
          return next;
        });
      };

  const activeAvatar =
    avatarOptions.find((a) => a.id === employees[activeEmp].avatarId) ?? avatarOptions[0];

  const setEmpAvatarId = (id: string) => {
    setEmployees((prev) => {
      const copy = [...prev];
      copy[activeEmp] = { ...copy[activeEmp], avatarId: id };
      return copy;
    });
  };

  const prevAvatar = () => {
    if (!avatarOptions.length) return;
    const curId = activeAvatar?.id ?? avatarOptions[0].id;
    const idx = Math.max(0, avatarOptions.findIndex((a) => a.id === curId));
    const nextIdx = (idx - 1 + avatarOptions.length) % avatarOptions.length;
    setEmpAvatarId(avatarOptions[nextIdx].id);
  };

  const nextAvatar = () => {
    if (!avatarOptions.length) return;
    const curId = activeAvatar?.id ?? avatarOptions[0].id;
    const idx = Math.max(0, avatarOptions.findIndex((a) => a.id === curId));
    const nextIdx = (idx + 1) % avatarOptions.length;
    setEmpAvatarId(avatarOptions[nextIdx].id);
  };

  const validateEmp = (e: Employee, idx: number) => {
    if (!e.firstName.trim() || !e.lastName.trim()) return `Employee ${idx + 1}: missing name`;
    if (idx === 0) return null; // employee1 email ไม่จำเป็น (ใช้ accountEmail ได้)
    if (!e.email.trim()) return `Employee ${idx + 1}: missing email`;
    return null;
  };

  async function handleNext() {
    // employee1 ต้องรู้ orgId/userId เพื่อบันทึกลง employees
    if (!orgId || !userId) {
      alert("Missing orgId/userId (check /api/org/active-account).");
      return;
    }

    // validate fields ของคนที่เปิดใช้จริง
    const activeEmployees = employees.slice(0, maxVisible);
    for (let i = 0; i < activeEmployees.length; i++) {
      const msg = validateEmp(activeEmployees[i], i);
      if (msg) {
        alert(msg);
        return;
      }
    }

    // 1) บันทึก employee1 (ตัวเอง) ลง DB
    {
      const e1 = activeEmployees[0];
      const res = await fetch("/api/org/employees/save-self", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          orgId,
          firstName: e1.firstName,
          lastName: e1.lastName,
          position: e1.position,
          phone: e1.phone,
          avatarId: e1.avatarId,
          canCheckChallenge: e1.canCheckChallenge,
          email: accountEmail, // เก็บไว้เผื่อ backend ใช้
        }),
      });

      if (!res.ok) {
        console.error(await res.text());
        alert("Save employee1 failed");
        return;
      }
    }

    // 2) invite employee2/3 ถ้ามี
    for (let i = 1; i < activeEmployees.length; i++) {
      const e = activeEmployees[i];

      const res = await fetch("/api/org/employees/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          email: e.email,
          firstName: e.firstName,
          lastName: e.lastName,
          position: e.position,
          phone: e.phone,
          avatarId: e.avatarId,
          canCheckChallenge: e.canCheckChallenge,
        }),
      });

      if (!res.ok) {
        console.error(await res.text());
        alert(`Invite employee${i + 1} failed`);
        return;
      }
    }

    // 3) ไปหน้า dashboard ของ org
    router.push("/org/dashboard");
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
          <h1 className={styles.title}>Employees</h1>

          {/* tabs */}
          <div className={styles.empTabs} role="tablist" aria-label="Employees tabs">
            <button
              type="button"
              className={`${styles.empTab} ${activeEmp === 0 ? styles.empTabOn : ""}`}
              onClick={() => setActiveEmp(0)}
              role="tab"
              aria-selected={activeEmp === 0}
            >
              employee1
            </button>

            {maxVisible < 2 && (
              <button
                type="button"
                className={styles.empPlus}
                aria-label="Add employee 2"
                onClick={() => {
                  setMaxVisible(2);
                  setActiveEmp(1);
                }}
              >
                +
              </button>
            )}

            {maxVisible >= 2 && (
              <button
                type="button"
                className={`${styles.empTab} ${activeEmp === 1 ? styles.empTabOn : ""}`}
                onClick={() => setActiveEmp(1)}
                role="tab"
                aria-selected={activeEmp === 1}
              >
                employee2
              </button>
            )}

            {maxVisible === 2 && (
              <button
                type="button"
                className={styles.empPlus}
                aria-label="Add employee 3"
                onClick={() => {
                  setMaxVisible(3);
                  setActiveEmp(2);
                }}
              >
                +
              </button>
            )}

            {maxVisible >= 3 && (
              <button
                type="button"
                className={`${styles.empTab} ${activeEmp === 2 ? styles.empTabOn : ""}`}
                onClick={() => setActiveEmp(2)}
                role="tab"
                aria-selected={activeEmp === 2}
              >
                employee3
              </button>
            )}
          </div>

          <div className={styles.formScroll}>
            <div className={styles.formBlock}>
              <div className={styles.grid2}>
                <input
                  className={styles.input}
                  placeholder="First name"
                  value={emp.firstName}
                  onChange={setEmpField("firstName")}
                />
                <input
                  className={styles.input}
                  placeholder="Last name"
                  value={emp.lastName}
                  onChange={setEmpField("lastName")}
                />
              </div>

              <div className={styles.grid2}>
                <input
                  className={styles.input}
                  placeholder="position"
                  value={emp.position}
                  onChange={setEmpField("position")}
                />
                <input
                  className={styles.input}
                  placeholder="Phone number"
                  value={emp.phone}
                  onChange={setEmpField("phone")}
                />
              </div>

              {/* email: employee1 อาจปล่อยว่างได้ (ใช้ accountEmail); employee2/3 ต้องมี */}
              <input
                className={styles.input}
                placeholder="Email"
                value={emp.email}
                onChange={setEmpField("email")}
              />

              <div className={styles.hr} />

              <label className={styles.checkRow}>
                <input
                  className={styles.checkInput}
                  type="checkbox"
                  checked={emp.canCheckChallenge}
                  onChange={setEmpField("canCheckChallenge")}
                />
                <span className={styles.checkText}>Can check challenge activities</span>
              </label>
            </div>
          </div>
        </section>

        {/* RIGHT */}
        <section className={styles.avatarStage} aria-label="Avatar">
  <div className={styles.avatarRow}>
    <button
      className={styles.iconBtn}
      type="button"
      onClick={prevAvatar}
      aria-label="Previous"
    >
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

    <button
      className={styles.iconBtn}
      type="button"
      onClick={nextAvatar}
      aria-label="Next"
    >
      ▶
    </button>
  </div>

  {/* dots อยู่ใต้ตัวละคร */}
  <div className={styles.avatarDots}>
    {avatarOptions.map((a) => {
      const on = a.id === activeAvatar?.id;
      return (
        <button
          key={a.id}
          type="button"
          className={`${styles.dot} ${on ? styles.dotOn : ""}`}
          onClick={() => setEmpAvatarId(a.id)}
          aria-label="Select avatar"
        />
      );
    })}
  </div>

  <button className={styles.nextBtn} type="button" onClick={handleNext}>
    Next
  </button>
</section>
      </main>
    </div>
  );
}