import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getPasswordStrength } from "../lib/passwordStrength.mjs";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [csrfToken, setCsrfToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const token = typeof router.query.token === "string" ? router.query.token : "";
  const strength = getPasswordStrength(password);

  useEffect(() => {
    fetch("/api/auth?action=csrf").then((response) => response.json()).then((payload) => setCsrfToken(payload.csrfToken || "")).catch(() => setError("Security setup is unavailable. Refresh and try again."));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (submitting) return;
    if (token && password !== confirmPassword) { setError("Passwords do not match."); return; }
    setSubmitting(true);
    const action = token ? "reset" : "forgot";
    const body = token ? { token, password } : { email };
    const response = await fetch(`/api/auth?action=${action}`, { method: "POST", headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}) }, body: JSON.stringify(body) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const rawError = String(payload.error || "Unable to complete this request.");
      setError(rawError.toLowerCase().includes("csrf")
        ? "Your security session expired. Refresh the page and try again."
        : response.status === 429
          ? "Too many attempts. Please wait a moment and try again."
          : rawError);
      setSubmitting(false);
      return;
    }
    setMessage(token ? "Your password has been reset. You can now sign in." : "If that account exists, reset instructions will be sent shortly.");
    if (!token) setEmail("");
    setSubmitting(false);
  };

  return <>
    <Head><title>{token ? "Reset password" : "Forgot password"} · InterviewIQ</title></Head>
    <main className="auth-page" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "linear-gradient(135deg,#f5f9fd,#e9f1f8)", color: "#102033", colorScheme: "light", fontFamily: "Inter, system-ui, sans-serif" }}>
      <section aria-labelledby="reset-heading" style={{ width: "100%", maxWidth: 430, padding: "34px clamp(24px,6vw,42px)", background: "#fff", border: "1px solid #dbe5ef", borderRadius: 18, boxShadow: "0 18px 55px rgba(30,64,90,.14)" }}>
        <div style={{ width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: 12, background: "#123252", color: "#fff", fontWeight: 800, marginBottom: 20 }}>IQ</div>
        <h1 id="reset-heading" style={{ margin: "0 0 10px", fontSize: 25 }}>{token ? "Choose a new password" : "Reset your password"}</h1>
        <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: 14, lineHeight: 1.55 }}>{token ? "Use a strong password with at least 12 characters." : "Enter your account email and we’ll send a secure reset link."}</p>
        <form onSubmit={submit} style={{ display: "grid", gap: 15 }}>
          {!token ? <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700 }}>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} style={{ minHeight: 44, border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", fontSize: 14, background: "#fff", color: "#102033", colorScheme: "light" }} /></label> : <>
            <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700 }}>New password<span style={{ display: "flex", gap: 7 }}><input required minLength={12} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} style={{ minHeight: 44, flex: 1, minWidth: 0, border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", fontSize: 14, background: "#fff", color: "#102033", colorScheme: "light" }} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} style={{ minWidth: 68, border: "1px solid #cbd5e1", borderRadius: 8, background: "#f8fafc", color: "#17324d", fontWeight: 700 }}>{showPassword ? "Hide" : "Show"}</button></span></label>
            {password ? <div aria-label="Password strength" style={{ display: "grid", gap: 5 }}><div style={{ height: 6, borderRadius: 999, background: "#e2e8f0", overflow: "hidden" }}><span style={{ display: "block", width: `${strength.percent}%`, height: "100%", background: strength.label === "Strong" ? "#15803d" : strength.label === "Fair" ? "#b7791f" : "#b91c1c" }} /></div><span style={{ color: "#526579", fontSize: 12 }}>{strength.label} password</span></div> : null}
            <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700 }}>Confirm password<span style={{ display: "flex", gap: 7 }}><input required minLength={12} type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} style={{ minHeight: 44, flex: 1, minWidth: 0, border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", fontSize: 14, background: "#fff", color: "#102033", colorScheme: "light" }} /><button type="button" aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} onClick={() => setShowConfirmPassword((value) => !value)} style={{ minWidth: 68, border: "1px solid #cbd5e1", borderRadius: 8, background: "#f8fafc", color: "#17324d", fontWeight: 700 }}>{showConfirmPassword ? "Hide" : "Show"}</button></span></label>
          </>}
          {error ? <p role="alert" style={{ margin: 0, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "9px 10px", fontSize: 13 }}>{error}</p> : null}
          {message ? <p role="status" style={{ margin: 0, color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "9px 10px", fontSize: 13 }}>{message}</p> : null}
          <button type="submit" disabled={submitting} aria-busy={submitting} style={{ minHeight: 46, border: 0, borderRadius: 8, background: "#123252", color: "#fff", fontWeight: 800, cursor: submitting ? "wait" : "pointer" }}>{submitting ? "Sending…" : (token ? "Reset password" : "Send reset link")}</button>
        </form>
        <p style={{ margin: "22px 0 0", textAlign: "center", fontSize: 13 }}><Link href="/" style={{ color: "#123252", fontWeight: 700 }}>Return to InterviewIQ</Link></p>
      </section>
    </main>
  </>;
}
