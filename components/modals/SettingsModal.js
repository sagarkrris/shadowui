import { PRODUCT_TAGLINE } from "../../lib/agenticCourse.mjs";

import { useState } from "react";
import { useRef } from "react";
import { useFocusTrap } from "../../hooks/useFocusTrap";

export default function SettingsModal({ onClose, theme, auth = {} }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const modalRef = useRef(null);
  useFocusTrap(modalRef);
  const submit = async (event) => { event.preventDefault(); await auth[mode]?.({ email, password }); };
  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      ref={modalRef}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.7)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        backdropFilter: "blur(4px)"
      }}
    >
      <div
        className="glass-chrome"
        onClick={(event) => event.stopPropagation()}
        style={{
          border: `1px solid ${theme.accentBorder}`,
          borderRadius: "16px 16px 0 0",
          padding: 20,
          width: "100%",
          maxWidth: 480,
          maxHeight: "min(88vh, 820px)",
          overflowY: "auto"
        }}
      >
        <div style={{ width: 36, height: 4, background: "rgba(255,255,255,.1)", borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span id="settings-title" style={{ fontSize: 15, fontWeight: 600, color: "#e8e8f0" }}>
            <i className={`ti ${theme.icon}`} style={{ color: theme.accentStrong, marginRight: 7 }} />
            About
          </span>
          <button aria-label="Close settings" className="icon-btn" onClick={onClose} style={{ color: "#6b7280", fontSize: 22, cursor: "pointer" }}>x</button>
        </div>

        <section aria-labelledby="account-heading" style={{ border: "1px solid rgba(255,255,255,.09)", borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <h2 id="account-heading" style={{ fontSize: 13, color: theme.accentText, margin: "0 0 8px" }}>Account sync</h2>
          {auth.user ? <>
            <p style={{ color: "#cbd5e1", fontSize: 12 }}>Signed in as {auth.user.email}</p>
            {!auth.user.emailVerified ? <p role="alert" style={{ color: "#facc15", fontSize: 11 }}>Email verification is required before AI features can be used when authentication enforcement is enabled.</p> : null}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="glass-button" onClick={async () => { const data = await auth.exportAccount?.(); const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "interviewiq-account-export.json"; link.click(); URL.revokeObjectURL(url); }}>Export data</button>
              <button type="button" className="glass-button" onClick={auth.revokeSessions}>Revoke sessions</button>
              <button type="button" className="glass-button" onClick={async () => { if (window.confirm("Delete your account and all stored data? This cannot be undone.")) await auth.deleteAccount?.(); }}>Delete account</button>
            </div>
            <button type="button" className="glass-button" onClick={auth.logout} style={{ padding: "8px 11px" }}>Sign out</button>
          </> : <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setMode("login")} aria-pressed={mode === "login"} className="glass-button">Sign in</button>
              <button type="button" onClick={() => setMode("register")} aria-pressed={mode === "register"} className="glass-button">Create account</button>
            </div>
            <input aria-label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="glass-input" />
            <input aria-label="Password" type="password" required minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password (12+ characters)" className="glass-input" />
            {auth.error ? <p role="alert" style={{ color: "#fca5a5", fontSize: 11 }}>{auth.error}</p> : null}
            <button type="submit" className="glass-button" style={{ color: theme.accentText }}>{mode === "login" ? "Sign in and sync" : "Create secure account"}</button>
          </form>}
        </section>

        <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.8 }}>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: theme.accentText }}>InterviewIQ</strong>
          </p>
          <p style={{ marginBottom: 12 }}>
            Designed & Developed by
            <strong style={{ color: "#ffffff" }}> Sagar Krishna</strong>
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
      </div>
    </div>
  );
}
