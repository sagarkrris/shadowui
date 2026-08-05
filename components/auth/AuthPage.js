import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import BrandLogo from "../BrandLogo";
import { DEFAULT_TECH_THEME } from "../../lib/techTheme.mjs";
import { useAuth } from "../../hooks/useAuth";
import { getPasswordStrength } from "../../lib/passwordStrength.mjs";

export default function AuthPage({ mode }) {
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const isRegister = mode === "register";
  const alternateHref = isRegister ? "/sign-in" : "/sign-up";

  const strength = getPasswordStrength(password);
  useEffect(() => { if (auth.ready && auth.user && !registrationComplete) router.replace("/"); }, [auth.ready, auth.user, registrationComplete, router]);
  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    if (isRegister) setRegistrationComplete(true);
    try {
      const succeeded = await (isRegister ? auth.register : auth.login)({ email, password });
      if (succeeded && !isRegister) router.replace("/");
    } finally { setSubmitting(false); }
  };

  return <>
    <Head><title>{isRegister ? "Create account" : "Sign in"} · InterviewIQ</title></Head>
    <main className="auth-page" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "linear-gradient(135deg, #f5f9fd, #e9f1f8)", color: "#102033", colorScheme: "light", fontFamily: "Inter, system-ui, sans-serif" }}>
      <section aria-labelledby="auth-heading" style={{ width: "min(100%, 460px)", padding: "36px clamp(24px, 6vw, 42px)", background: "#ffffff", border: "1px solid #dbe5ef", borderRadius: 20, boxShadow: "0 18px 55px rgba(30,64,90,.14)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}><BrandLogo theme={DEFAULT_TECH_THEME} appearance="light" size={52} /></div>
        <p style={{ color: "#1f6feb", fontSize: 12, fontWeight: 900, letterSpacing: ".08em", margin: "0 0 8px", textAlign: "center", textTransform: "uppercase" }}>InterviewIQ</p>
        <h1 id="auth-heading" style={{ fontSize: 26, lineHeight: 1.2, margin: "0 0 9px", textAlign: "center" }}>{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.55, margin: "0 0 25px", textAlign: "center" }}>{isRegister ? "Save your preparation across browsers and devices." : "Sign in to continue your interview preparation."}</p>
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700 }}>Email<input aria-label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" style={{ minHeight: 46, border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", fontSize: 14, background: "#fff", color: "#102033", colorScheme: "light" }} /></label>
          <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700 }}>Password
            <span style={{ display: "flex", gap: 7 }}><input aria-label="Password" type={showPassword ? "text" : "password"} required minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" style={{ minHeight: 46, flex: 1, minWidth: 0, border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", fontSize: 14, background: "#fff", color: "#102033", colorScheme: "light" }} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} style={{ minWidth: 74, border: "1px solid #cbd5e1", borderRadius: 8, background: "#f8fafc", color: "#17324d", fontWeight: 700 }}>{showPassword ? "Hide" : "Show"}</button></span>
          </label>
          {isRegister && password ? <div aria-label="Password strength" style={{ display: "grid", gap: 5 }}><div style={{ height: 6, borderRadius: 999, background: "#e2e8f0", overflow: "hidden" }}><span style={{ display: "block", width: `${strength.percent}%`, height: "100%", background: strength.label === "Strong" ? "#15803d" : strength.label === "Fair" ? "#b7791f" : "#b91c1c" }} /></div><span style={{ color: strength.label === "Strong" ? "#166534" : strength.label === "Fair" ? "#92400e" : "#b91c1c", fontSize: 12 }}>{strength.label} password · use 12+ characters with upper/lowercase, a number, and a symbol.</span></div> : null}
          {auth.error ? <p role="alert" style={{ margin: 0, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "9px 10px", fontSize: 13 }}>{auth.error}</p> : null}
          {auth.deliveryWarning ? <p role="alert" style={{ margin: 0, color: "#b45309", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "9px 10px", fontSize: 13 }}>{auth.deliveryWarning}</p> : null}
          {auth.deliveryNotice ? <p role="status" style={{ margin: 0, color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "9px 10px", fontSize: 13 }}>{auth.deliveryNotice}</p> : null}
          <button type="submit" disabled={!auth.ready || submitting} aria-busy={submitting} style={{ minHeight: 46, border: 0, borderRadius: 8, background: "#123252", color: "#fff", cursor: auth.ready && !submitting ? "pointer" : "wait", fontSize: 14, fontWeight: 800 }}>{submitting ? (isRegister ? "Creating account…" : "Signing in…") : (isRegister ? "Create account" : "Sign in")}</button>
        </form>
        {registrationComplete && auth.deliveryNotice ? <p role="status" style={{ margin: "14px 0 0", color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 12px", fontSize: 13, lineHeight: 1.45 }}>Verification email sent. Check your inbox and spam folder before using protected features.</p> : null}
        {!isRegister ? <p style={{ margin: "15px 0 0", textAlign: "center" }}><Link href="/reset-password" style={{ color: "#1f6feb", fontSize: 13, fontWeight: 700 }}>Forgot password?</Link></p> : null}
        <p style={{ color: "#64748b", fontSize: 13, margin: "22px 0 0", textAlign: "center" }}>{isRegister ? "Already have an account?" : "New to InterviewIQ?"} <Link href={alternateHref} style={{ color: "#1f6feb", fontWeight: 800 }}>{isRegister ? "Sign in" : "Create an account"}</Link></p>
        <p style={{ margin: "18px 0 0", textAlign: "center" }}><Link href="/" style={{ color: "#475569", fontSize: 13, fontWeight: 700 }}>Return to InterviewIQ</Link></p>
      </section>
    </main>
  </>;
}
