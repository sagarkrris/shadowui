import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import BrandLogo from "../BrandLogo";
import { DEFAULT_TECH_THEME } from "../../lib/techTheme.mjs";
import { useAuth } from "../../hooks/useAuth";

export default function AuthPage({ mode }) {
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isRegister = mode === "register";
  const alternateHref = isRegister ? "/sign-in" : "/sign-up";

  useEffect(() => { if (auth.ready && auth.user) router.replace("/"); }, [auth.ready, auth.user, router]);
  const submit = async (event) => {
    event.preventDefault();
    const succeeded = await (isRegister ? auth.register : auth.login)({ email, password });
    if (succeeded) router.replace("/");
  };

  return <>
    <Head><title>{isRegister ? "Create account" : "Sign in"} · InterviewIQ</title></Head>
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "linear-gradient(135deg, #f5f9fd, #e9f1f8)", color: "#102033", fontFamily: "Inter, system-ui, sans-serif" }}>
      <section aria-labelledby="auth-heading" style={{ width: "min(100%, 460px)", padding: "36px clamp(24px, 6vw, 42px)", background: "#ffffff", border: "1px solid #dbe5ef", borderRadius: 20, boxShadow: "0 18px 55px rgba(30,64,90,.14)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}><BrandLogo theme={DEFAULT_TECH_THEME} size={52} /></div>
        <p style={{ color: "#1f6feb", fontSize: 12, fontWeight: 900, letterSpacing: ".08em", margin: "0 0 8px", textAlign: "center", textTransform: "uppercase" }}>InterviewIQ</p>
        <h1 id="auth-heading" style={{ fontSize: 26, lineHeight: 1.2, margin: "0 0 9px", textAlign: "center" }}>{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.55, margin: "0 0 25px", textAlign: "center" }}>{isRegister ? "Save your preparation across browsers and devices." : "Sign in to continue your interview preparation."}</p>
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700 }}>Email<input aria-label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" style={{ minHeight: 46, border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", fontSize: 14 }} /></label>
          <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700 }}>Password<input aria-label="Password" type="password" required minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" style={{ minHeight: 46, border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", fontSize: 14 }} /></label>
          {auth.error ? <p role="alert" style={{ margin: 0, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "9px 10px", fontSize: 13 }}>{auth.error}</p> : null}
          {auth.deliveryWarning ? <p role="alert" style={{ margin: 0, color: "#b45309", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "9px 10px", fontSize: 13 }}>{auth.deliveryWarning}</p> : null}
          {auth.deliveryNotice ? <p role="status" style={{ margin: 0, color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "9px 10px", fontSize: 13 }}>{auth.deliveryNotice}</p> : null}
          <button type="submit" disabled={!auth.ready} style={{ minHeight: 46, border: 0, borderRadius: 8, background: "#123252", color: "#fff", cursor: auth.ready ? "pointer" : "wait", fontSize: 14, fontWeight: 800 }}>{isRegister ? "Create account" : "Sign in"}</button>
        </form>
        {!isRegister ? <p style={{ margin: "15px 0 0", textAlign: "center" }}><Link href="/reset-password" style={{ color: "#1f6feb", fontSize: 13, fontWeight: 700 }}>Forgot password?</Link></p> : null}
        <p style={{ color: "#64748b", fontSize: 13, margin: "22px 0 0", textAlign: "center" }}>{isRegister ? "Already have an account?" : "New to InterviewIQ?"} <Link href={alternateHref} style={{ color: "#1f6feb", fontWeight: 800 }}>{isRegister ? "Sign in" : "Create an account"}</Link></p>
        <p style={{ margin: "18px 0 0", textAlign: "center" }}><Link href="/" style={{ color: "#475569", fontSize: 13, fontWeight: 700 }}>Return to InterviewIQ</Link></p>
      </section>
    </main>
  </>;
}
