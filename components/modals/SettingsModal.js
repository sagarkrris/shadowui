import { PRODUCT_TAGLINE } from "../../lib/agenticCourse.mjs";
import Link from "next/link";
import BrandLogo from "../BrandLogo";
import ProfileAvatar from "../auth/ProfileAvatar";

import { useState } from "react";
import { useRef } from "react";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { getPasswordStrength } from "../../lib/passwordStrength.mjs";

export default function SettingsModal({ onClose, onDeleteSuccess, theme, auth = {}, initialMode = "login", themePreference = "system", onThemePreferenceChange, themeStatus = "", appearance = "dark", authFocused = false }) {
  const [mode, setMode] = useState(initialMode === "register" ? "register" : "login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState("");
  const [accountAction, setAccountAction] = useState("");
  const [accountFeedback, setAccountFeedback] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const modalRef = useRef(null);
  useFocusTrap(modalRef);
  const strength = getPasswordStrength(password);
  const isAuthView = !auth.user;
  const submit = async (event) => {
    event.preventDefault();
    if (submitting || !auth.ready) return;
    if (mode === "register" && (!firstName.trim() || !lastName.trim())) { setValidationMessage("Enter your first and last name."); return; }
    if (password.length < 12) { setValidationMessage("Use a password with at least 12 characters."); return; }
    setValidationMessage("");
    setSubmitting(true);
    try { await auth[mode]?.({ firstName, lastName, email, password }); } finally { setSubmitting(false); }
  };
  const deleteAccount = async () => {
    if (deleteConfirmText !== "DELETE" || accountAction) return;
    setAccountAction("delete");
    setAccountFeedback("");
    try { const result = await auth.deleteAccount?.(); if (result?.ok) onDeleteSuccess?.(result); }
    finally { setAccountAction(""); setDeleteConfirmOpen(false); setDeleteConfirmText(""); }
  };
  const resendVerification = async () => {
    if (resendingVerification || !auth.resendVerification) return;
    setVerificationFeedback("");
    setResendingVerification(true);
    try { await auth.resendVerification(); }
    catch (error) { setVerificationFeedback(error?.message || "We could not send the verification email. Try again later."); }
    finally { setResendingVerification(false); }
  };
  const runAccountAction = async (name, action, successMessage) => {
    if (accountAction) return;
    setAccountFeedback("");
    setAccountAction(name);
    try {
      await action();
      if (successMessage) setAccountFeedback(successMessage);
    } catch {
      setAccountFeedback("We could not complete that account action. Please try again.");
    } finally { setAccountAction(""); }
  };
  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={isAuthView ? "auth-heading" : "settings-title"}
      ref={modalRef}
      className={`theme-${appearance}`}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.7)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100dvh",
        minHeight: "100dvh",
        maxHeight: "100dvh",
        padding: 16,
        overflow: "hidden",
        backdropFilter: "blur(4px)"
      }}
    >
      <div
        className={`glass-chrome settings-modal-surface ${isAuthView ? "auth-dialog" : ""}`}
        onClick={(event) => event.stopPropagation()}
        style={{
          border: `1px solid ${theme.accentBorder}`,
          borderRadius: 18,
          padding: isAuthView ? "28px clamp(22px, 5vw, 40px)" : 24,
          width: "min(520px, calc(100vw - 32px))",
          maxWidth: isAuthView ? 440 : 520,
          height: "min(820px, calc(100dvh - 32px))",
          maxHeight: "calc(100dvh - 32px)",
          minHeight: 0,
          overflowY: "auto",
          overscrollBehavior: "contain"
        }}
      >
        {!isAuthView ? <div style={{ width: 36, height: 4, background: "rgba(255,255,255,.1)", borderRadius: 2, margin: "0 auto 20px" }} /> : null}
        {isAuthView ? (
          <section aria-labelledby="auth-heading" className="auth-form-card" style={{ position: "relative", textAlign: "center" }}>
            <button aria-label="Close sign in" className="icon-btn" onClick={onClose} style={{ position: "absolute", right: -16, top: -18, color: "#64748b", fontSize: 20 }}>x</button>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}><BrandLogo theme={theme} appearance="light" size={52} /></div>
            <h1 id="auth-heading" style={{ color: appearance === "light" ? "#102033" : "#f8fbff", fontSize: 24, lineHeight: 1.2, margin: "0 0 9px" }}>{mode === "login" ? "Sign in to InterviewIQ" : "Create your InterviewIQ account"}</h1>
            <p style={{ color: appearance === "light" ? "#64748b" : "#94a3b8", fontSize: 13, lineHeight: 1.55, margin: "0 auto 24px", maxWidth: 330 }}>Sync your interview preparation across browsers and devices.</p>
            <div role="tablist" aria-label="Account access mode" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: 4, marginBottom: 22, borderRadius: 10, background: appearance === "light" ? "#eaf0f7" : "rgba(255,255,255,.06)" }}>
              <button type="button" role="tab" onClick={() => setMode("login")} aria-selected={mode === "login"} className="glass-button" style={{ minHeight: 38, border: mode === "login" ? `1px solid ${theme.accentBorder}` : "1px solid transparent", borderRadius: 8, color: mode === "login" ? theme.accentText : "#64748b", fontSize: 12, fontWeight: 800 }}>Sign in</button>
              <button type="button" role="tab" onClick={() => setMode("register")} aria-selected={mode === "register"} className="glass-button" style={{ minHeight: 38, border: mode === "register" ? `1px solid ${theme.accentBorder}` : "1px solid transparent", borderRadius: 8, color: mode === "register" ? theme.accentText : "#64748b", fontSize: 12, fontWeight: 800 }}>Create account</button>
            </div>
            <form onSubmit={submit} style={{ display: "grid", gap: 14, textAlign: "left" }}>
              {mode === "register" ? <>
                <label style={{ display: "grid", gap: 7, color: appearance === "light" ? "#334155" : "#cbd5e1", fontSize: 12, fontWeight: 700 }}>First name<input aria-label="First name" type="text" required autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" className="glass-input" style={{ minHeight: 44, borderRadius: 8, padding: "11px 12px", cursor: "text" }} /></label>
                <label style={{ display: "grid", gap: 7, color: appearance === "light" ? "#334155" : "#cbd5e1", fontSize: 12, fontWeight: 700 }}>Last name<input aria-label="Last name" type="text" required autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" className="glass-input" style={{ minHeight: 44, borderRadius: 8, padding: "11px 12px", cursor: "text" }} /></label>
              </> : null}
              <label style={{ display: "grid", gap: 7, color: appearance === "light" ? "#334155" : "#cbd5e1", fontSize: 12, fontWeight: 700 }}>
                Email
                <input aria-label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="glass-input" style={{ minHeight: 44, borderRadius: 8, padding: "11px 12px", cursor: "text" }} />
              </label>
              <label style={{ display: "grid", gap: 7, color: appearance === "light" ? "#334155" : "#cbd5e1", fontSize: 12, fontWeight: 700 }}>
                Password
                <span style={{ display: "flex", gap: 7 }}>
                  <input aria-label="Password" type={showPassword ? "text" : "password"} required minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" className="glass-input" style={{ minHeight: 44, borderRadius: 8, padding: "11px 12px", cursor: "text", flex: 1, minWidth: 0 }} />
                  <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="glass-button" style={{ minWidth: 70, borderRadius: 8, color: appearance === "light" ? "#17324d" : "#cbd5e1", fontSize: 11, fontWeight: 800 }}>{showPassword ? "Hide" : "Show"}</button>
                </span>
              </label>
              {mode === "register" && password ? <div aria-label="Password strength" style={{ display: "grid", gap: 5 }}><div style={{ height: 6, borderRadius: 999, background: appearance === "light" ? "#e2e8f0" : "rgba(255,255,255,.12)", overflow: "hidden" }}><span style={{ display: "block", width: `${strength.percent}%`, height: "100%", background: strength.label === "Strong" ? "#15803d" : strength.label === "Fair" ? "#b7791f" : "#b91c1c" }} /></div><span style={{ color: strength.label === "Strong" ? "#166534" : strength.label === "Fair" ? "#92400e" : "#b91c1c", fontSize: 12 }}>{strength.label} password · use 12+ characters with upper/lowercase, a number, and a symbol.</span></div> : null}
              {auth.error ? <p role="alert" style={{ color: "#dc2626", fontSize: 12, lineHeight: 1.45, margin: 0 }}>{auth.error}</p> : null}
              {auth.deliveryWarning ? <p role="alert" style={{ color: "#b45309", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "9px 10px", fontSize: 12, lineHeight: 1.45, margin: 0 }}>{auth.deliveryWarning}</p> : null}
              {auth.deliveryNotice ? <p role="status" style={{ color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "9px 10px", fontSize: 12, lineHeight: 1.45, margin: 0 }}>{auth.deliveryNotice}</p> : null}
              <button type="submit" disabled={submitting || !auth.ready} aria-busy={submitting} className="glass-button" style={{ minHeight: 46, border: `1px solid ${theme.accentBorder}`, borderRadius: 8, color: theme.accentText, cursor: submitting || !auth.ready ? "wait" : "pointer", fontSize: 13, fontWeight: 850, opacity: submitting || !auth.ready ? .65 : 1 }}>{submitting ? (mode === "login" ? "Signing in…" : "Creating account…") : (mode === "login" ? "Sign in and sync" : "Create secure account")}</button>
            </form>
            {mode === "login" ? <p style={{ margin: "14px 0 0", textAlign: "center" }}><Link href="/reset-password" style={{ color: theme.accentStrong, fontSize: 12, fontWeight: 700 }}>Forgot password?</Link></p> : null}
            <p style={{ color: appearance === "light" ? "#64748b" : "#94a3b8", fontSize: 12, lineHeight: 1.5, margin: "22px 0 0" }}>{mode === "login" ? "New to InterviewIQ? " : "Already have an account? "}<button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ background: "none", border: "none", color: theme.accentStrong, cursor: "pointer", font: "inherit", fontWeight: 800, padding: 0 }}>{mode === "login" ? "Create an account" : "Sign in"}</button></p>
          </section>
        ) : <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <span id="settings-title" className="settings-modal-title" style={{ fontSize: 15, fontWeight: 600, color: appearance === "light" ? "#17324d" : "#e8e8f0" }}>
            <i className={`ti ${theme.icon}`} style={{ color: theme.accentStrong, marginRight: 7 }} />
            About
          </span>
          <button aria-label="Close settings" className="icon-btn" onClick={onClose} style={{ color: "#6b7280", fontSize: 22, cursor: "pointer" }}>x</button>
        </div>

        <section aria-labelledby="account-heading" style={{ border: "1px solid rgba(255,255,255,.09)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <h2 id="account-heading" style={{ fontSize: 14, color: theme.accentText, margin: "0 0 12px" }}>Account profile & sync</h2>
          {auth.user ? <>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 10 }}>
              <ProfileAvatar user={auth.user} size={46} />
              <div style={{ minWidth: 0 }}>
                <strong style={{ color: appearance === "light" ? "#17324d" : "#f8fbff", fontSize: 14 }}>{`${auth.user.firstName || ""} ${auth.user.lastName || ""}`.trim() || "InterviewIQ account"}</strong>
                <p className="settings-modal-account-email" style={{ color: appearance === "light" ? "#526579" : "#cbd5e1", fontSize: 13, lineHeight: 1.5, margin: "2px 0 0", overflowWrap: "anywhere" }}>{auth.user.email}</p>
                {auth.user.oauthProvider ? <span style={{ color: appearance === "light" ? "#526579" : "#94a3b8", fontSize: 11, marginTop: 2 }}>{`${auth.user.oauthProvider[0].toUpperCase()}${auth.user.oauthProvider.slice(1)} account`}</span> : null}
              </div>
            </div>
            {!auth.user.emailVerified ? <p role="alert" style={{ color: "#facc15", fontSize: 12, lineHeight: 1.45, margin: "6px 0 0" }}>Email verification is required before AI features can be used when authentication enforcement is enabled.</p> : null}
            {!auth.user.emailVerified ? <button type="button" className="glass-button" onClick={resendVerification} disabled={resendingVerification} aria-busy={resendingVerification} style={{ marginTop: 12, minHeight: 36, padding: "8px 14px", cursor: resendingVerification ? "wait" : "pointer", opacity: resendingVerification ? .65 : 1 }}>{resendingVerification ? "Sending verification email…" : "Resend verification email"}</button> : null}
            {auth.error ? <p role="alert" style={{ color: appearance === "light" ? "#b42318" : "#fca5a5", background: appearance === "light" ? "#fff1f2" : "rgba(127,29,29,.18)", border: appearance === "light" ? "1px solid #fecdd3" : "1px solid rgba(248,113,113,.28)", borderRadius: 8, padding: "9px 10px", fontSize: 12, lineHeight: 1.45, margin: "10px 0 0" }}>{auth.error}</p> : null}
            {verificationFeedback ? <p role="alert" aria-live="polite" style={{ color: appearance === "light" ? "#b42318" : "#fca5a5", background: appearance === "light" ? "#fff1f2" : "rgba(127,29,29,.18)", border: appearance === "light" ? "1px solid #fecdd3" : "1px solid rgba(248,113,113,.28)", borderRadius: 8, padding: "9px 10px", fontSize: 12, lineHeight: 1.45, margin: "10px 0 0" }}>{verificationFeedback}</p> : null}
            {auth.deliveryWarning ? <p role="alert" style={{ color: "#fbbf24", fontSize: 12, lineHeight: 1.45, margin: "8px 0 0" }}>{auth.deliveryWarning}</p> : null}
              {auth.deliveryNotice ? <p role="status" style={{ color: "#86efac", fontSize: 12, lineHeight: 1.45, margin: "8px 0 0" }}>{auth.deliveryNotice}</p> : null}
            {validationMessage ? <p role="alert" className="field-validation" style={{ color: "#b45309", background: appearance === "light" ? "#fff7ed" : "rgba(120,53,15,.2)", border: appearance === "light" ? "1px solid #fed7aa" : "1px solid rgba(251,191,36,.28)", borderRadius: 8, padding: "9px 10px", fontSize: 12, lineHeight: 1.45, margin: "10px 0 0" }}>{validationMessage}</p> : null}
            {accountFeedback ? <p role="status" aria-live="polite" style={{ color: appearance === "light" ? "#166534" : "#86efac", background: appearance === "light" ? "#f0fdf4" : "rgba(20,83,45,.2)", border: appearance === "light" ? "1px solid #bbf7d0" : "1px solid rgba(134,239,172,.28)", borderRadius: 8, padding: "9px 10px", fontSize: 12, lineHeight: 1.45, margin: "10px 0 0" }}>{accountFeedback}</p> : null}
            <div className="account-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <button type="button" className="glass-button" disabled={Boolean(accountAction)} style={{ minHeight: 36, padding: "8px 12px", opacity: accountAction ? .65 : 1 }} onClick={() => runAccountAction("export", async () => { const data = await auth.exportAccount?.(); const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "interviewiq-account-export.json"; link.click(); URL.revokeObjectURL(url); }, "Account data export downloaded.")}>{accountAction === "export" ? "Preparing export…" : "Export data"}</button>
              <button type="button" className="glass-button" disabled={Boolean(accountAction)} style={{ minHeight: 36, padding: "8px 12px", opacity: accountAction ? .65 : 1 }} onClick={() => runAccountAction("revoke", auth.revokeSessions, "Other sessions were signed out.")}>{accountAction === "revoke" ? "Revoking…" : "Revoke sessions"}</button>
              <button type="button" className="glass-button danger-action" disabled={Boolean(accountAction)} style={{ minHeight: 36, padding: "8px 12px", opacity: accountAction ? .65 : 1 }} onClick={() => setDeleteConfirmOpen(true)}>{accountAction === "delete" ? "Deleting account…" : "Delete account permanently"}</button>
            </div>
            {deleteConfirmOpen ? <div className="delete-confirmation" role="alertdialog" aria-label="Confirm permanent account deletion">
              <strong>Permanent deletion</strong>
              <p>This removes your account and stored preparation data. Type DELETE to confirm.</p>
              <input aria-label="Type DELETE to confirm" value={deleteConfirmText} onChange={(event) => setDeleteConfirmText(event.target.value.toUpperCase())} placeholder="DELETE" autoComplete="off" />
              <div><button type="button" className="glass-button danger-action" disabled={deleteConfirmText !== "DELETE" || Boolean(accountAction)} onClick={deleteAccount}>{accountAction === "delete" ? "Deleting…" : "Confirm deletion"}</button><button type="button" className="glass-button" onClick={() => { setDeleteConfirmOpen(false); setDeleteConfirmText(""); }}>Cancel</button></div>
            </div> : null}
            <button type="button" className="glass-button" disabled={Boolean(accountAction)} onClick={() => runAccountAction("logout", auth.logout, "You have been signed out.")} style={{ marginTop: 12, minHeight: 36, padding: "8px 14px", opacity: accountAction ? .65 : 1 }}>{accountAction === "logout" ? "Signing out…" : "Sign out"}</button>
          </> : <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setMode("login")} aria-pressed={mode === "login"} className="glass-button">Sign in</button>
              <button type="button" onClick={() => setMode("register")} aria-pressed={mode === "register"} className="glass-button">Create account</button>
            </div>
            {mode === "register" ? <>
              <input aria-label="First name" type="text" required autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" className="glass-input" />
              <input aria-label="Last name" type="text" required autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" className="glass-input" />
            </> : null}
            <input aria-label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="glass-input" />
            <span style={{ display: "flex", gap: 7 }}><input aria-label="Password" type={showPassword ? "text" : "password"} required minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password (12+ characters)" className="glass-input" style={{ flex: 1, minWidth: 0 }} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="glass-button" style={{ minWidth: 62, color: appearance === "light" ? "#17324d" : "#cbd5e1", fontSize: 11, fontWeight: 800 }}>{showPassword ? "Hide" : "Show"}</button></span>
            {mode === "register" && password ? <div aria-label="Password strength" style={{ display: "grid", gap: 4 }}><div style={{ height: 5, borderRadius: 999, background: appearance === "light" ? "#e2e8f0" : "rgba(255,255,255,.12)", overflow: "hidden" }}><span style={{ display: "block", width: `${strength.percent}%`, height: "100%", background: strength.label === "Strong" ? "#15803d" : strength.label === "Fair" ? "#b7791f" : "#b91c1c" }} /></div><span style={{ color: strength.label === "Strong" ? "#166534" : strength.label === "Fair" ? "#92400e" : "#b91c1c", fontSize: 11 }}>{strength.label} password</span></div> : null}
            {auth.error ? <p role="alert" style={{ color: "#fca5a5", fontSize: 11 }}>{auth.error}</p> : null}
            <button type="submit" disabled={submitting || !auth.ready} aria-busy={submitting} className="glass-button" style={{ color: theme.accentText, cursor: submitting || !auth.ready ? "wait" : "pointer", opacity: submitting || !auth.ready ? .65 : 1 }}>{submitting ? (mode === "login" ? "Signing in…" : "Creating account…") : (mode === "login" ? "Sign in and sync" : "Create secure account")}</button>
          </form>}
        </section>

        <section aria-labelledby="theme-heading" style={{ border: "1px solid rgba(255,255,255,.09)", borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <h2 id="theme-heading" style={{ fontSize: 13, color: theme.accentText, margin: "0 0 8px" }}>Appearance</h2>
          <label style={{ display: "grid", gap: 6, color: "#94a3b8", fontSize: 12 }}>
            Theme preference
            <select aria-label="Theme preference" value={themePreference} onChange={(event) => onThemePreferenceChange?.(event.target.value)} className="glass-input" style={{ borderRadius: 7, color: "inherit", padding: "8px 9px" }}>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <p role="status" aria-live="polite" style={{ color: appearance === "light" ? "#526579" : "#94a3b8", fontSize: 11, lineHeight: 1.45, marginTop: 7 }}>{themeStatus || "System follows your device preference. Your selection syncs with your account when signed in."}</p>
        </section>

        <div className="settings-modal-copy" style={{ fontSize: 13, color: appearance === "light" ? "#526579" : "#9ca3af", lineHeight: 1.8 }}>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: theme.accentText }}>InterviewIQ</strong>
          </p>
          <p style={{ marginBottom: 12 }}>
            Designed & Developed by
            <strong className="settings-modal-author" style={{ color: appearance === "light" ? "#17324d" : "#ffffff" }}> Sagar Krishna</strong>
          </p>
          <p style={{ marginBottom: 12 }}>
            {PRODUCT_TAGLINE} with:
          </p>
          <ul style={{ paddingLeft: 18 }}>
            <li>Mock Interviews</li>
            <li>Experience & Tech Stack Based Practice Packs</li>
            <li>Frontend, Backend & Database Practice</li>
            <li>DSA Practice</li>
            <li>System Design Preparation</li>
            <li>Voice Input</li>
            <li>Screen Analysis</li>
            <li>Code Help</li>
          </ul>
        </div>
        </>}
      </div>
    </div>
  );
}
