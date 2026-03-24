"use client";

import Link from "next/link";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const NAV_ITEMS = [
  { label: "About", href: "/about", enabled: false },
  { label: "Contact", href: "/contact", enabled: false },
  { label: "Log in", href: "/auth/sign-in" },
  { label: "Register", href: "/auth/register", active: true },
];

type AccountType = "student" | "employee";

function validatePassword(pw: string) {
  const minLen = pw.length >= 8;
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasNumber = /\d/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw); // มีสัญลักษณ์อย่างน้อย 1 ตัว

  const ok = minLen && hasUpper && hasLower && hasNumber && hasSymbol;

  return {
    ok,
    rules: { minLen, hasUpper, hasLower, hasNumber, hasSymbol },
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("student");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pwCheck = useMemo(() => validatePassword(password), [password]);
  const hasTypedPw = password.length > 0;
  const showPwRules = true;

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <Link href="/" className={styles.logoWrap} aria-label="Home">
          <img src="/images/logo/logo-v1-no_bg.png" alt="VCEP" className={styles.logo} draggable={false} />
        </Link>

        <nav className={styles.navBar} aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const isDisabled = item.enabled === false;
            const cls = `${styles.navItem} ${item.active ? styles.navItemActive : ""} ${isDisabled ? styles.navItemDisabled : ""
              }`;

            if (isDisabled) {
              return (
                <span key={item.label} className={cls} aria-disabled="true" title="Coming soon">
                  {item.label}
                </span>
              );
            }

            return (
              <Link key={item.label} href={item.href} className={cls} aria-current={item.active ? "page" : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <main className={styles.main}>
        <section className={styles.left}>
          <img className={styles.city} src="/images/building/small_map.png" alt="" aria-hidden draggable={false} />
        </section>

        <section className={styles.card} aria-label="Register form">
          <h1 className={styles.title}>Register with email</h1>

          <div className={styles.toggleRow} role="group" aria-label="Account type">
            <button
              type="button"
              className={`${styles.toggle} ${accountType === "student" ? styles.toggleActive : ""}`}
              onClick={() => setAccountType("student")}
            >
              Student
            </button>
            <button
              type="button"
              className={`${styles.toggle} ${accountType === "employee" ? styles.toggleActive : ""}`}
              onClick={() => setAccountType("employee")}
            >
              Organization
            </button>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);

              const em = email.trim().toLowerCase();
              const pw = password;

              if (!em || !pw) return;

              if (!pwCheck.ok) {
                setError("Password does not meet requirements.");
                return;
              }

              setLoading(true);
              try {
                const body: any = { email: em, password: pw, role: accountType };

                const r = await fetch("/api/auth/register", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(body),
                });

                const data = await r.json().catch(() => ({}));

                //  สำเร็จ: ไปยืนยันอีเมล
                if (r.ok && data?.ok) {
                  router.push(`/auth/confirm-email?email=${encodeURIComponent(em)}`);
                  return;
                }

                //  เคส "มี user อยู่แล้ว" -> แยก confirm/login ตาม action
                if (r.status === 409) {
                  if (data?.action === "confirm") {
                    router.push(`/auth/confirm-email?email=${encodeURIComponent(em)}`);
                    return;
                  }
                  if (data?.action === "login") {
                    router.push(`/auth/sign-in?email=${encodeURIComponent(em)}`);
                    return;
                  }
                }
                // error อื่น ๆ
                setError(data?.detail || data?.message || "Sign up failed");
              } catch {
                setError("Network error");
              } finally {
                setLoading(false);
              }
            }}
          >
            <input
              className={styles.input}
              type="email"
              value={email}
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <div className={styles.passwordRow}>
              <input
                className={styles.input}
                type={showPw ? "text" : "password"}
                value={password}
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.showPwBtn}
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/*  Checklist เงื่อนไขรหัสผ่าน */}
            {showPwRules && (
              <div className={styles.note} style={{ marginTop: 6, lineHeight: 1.5, opacity: hasTypedPw ? 1 : 0.7 }}>
                <div style={{ color: pwCheck.ok && hasTypedPw ? "green" : "inherit" }}>
                  Password requirements:
                </div>

                <div
                  style={{
                    color: !hasTypedPw ? "inherit" : pwCheck.rules.minLen ? "green" : "crimson",
                  }}
                >
                  • At least 8 characters
                </div>

                <div
                  style={{
                    color: !hasTypedPw ? "inherit" : pwCheck.rules.hasUpper ? "green" : "crimson",
                  }}
                >
                  • 1 uppercase (A–Z)
                </div>

                <div
                  style={{
                    color: !hasTypedPw ? "inherit" : pwCheck.rules.hasLower ? "green" : "crimson",
                  }}
                >
                  • 1 lowercase (a–z)
                </div>

                <div
                  style={{
                    color: !hasTypedPw ? "inherit" : pwCheck.rules.hasNumber ? "green" : "crimson",
                  }}
                >
                  • 1 number (0–9)
                </div>

                <div
                  style={{
                    color: !hasTypedPw ? "inherit" : pwCheck.rules.hasSymbol ? "green" : "crimson",
                  }}
                >
                  • 1 symbol (!@#$...)
                </div>
              </div>
            )}

            {error && (
              <p className={styles.note} style={{ color: "crimson" }}>
                {error}
              </p>
            )}

            <p className={styles.note}>We will send a 6-digit code to your email</p>

            <button className={styles.confirm} type="submit" disabled={loading || !pwCheck.ok}>
              {loading ? "Sending..." : "Confirm"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}