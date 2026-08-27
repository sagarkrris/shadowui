import BrandLogo from "../BrandLogo";
import { PRODUCT_TAGLINE } from "../../lib/agenticCourse.mjs";
import { useRef } from "react";
import { useFocusTrap } from "../../hooks/useFocusTrap";

export default function AboutModal({ onClose, theme, appearance = "light" }) {
  const modalRef = useRef(null);
  const isLight = appearance === "light";
  useFocusTrap(modalRef);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="about-heading" ref={modalRef} onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, display: "grid", placeItems: "center", padding: 20, background: "rgba(5, 15, 28, .58)", backdropFilter: "blur(5px)" }}>
      <section onClick={(event) => event.stopPropagation()} style={{ width: "min(100%, 460px)", padding: "34px clamp(24px, 6vw, 42px)", border: `1px solid ${isLight ? "#dbe5ef" : theme.accentBorder}`, borderRadius: 20, background: isLight ? "#ffffff" : theme.surface, boxShadow: "0 24px 70px rgba(5, 15, 28, .28)", color: isLight ? "#102033" : "#f8fbff", position: "relative", textAlign: "center" }}>
        <button type="button" aria-label="Close about" className="icon-btn" onClick={onClose} style={{ position: "absolute", right: 16, top: 16, color: isLight ? "#475569" : "#cbd5e1" }}>×</button>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><BrandLogo theme={theme} appearance={appearance} size={52} /></div>
        <p style={{ color: isLight ? "#1f6feb" : theme.accentStrong, fontSize: 12, fontWeight: 900, letterSpacing: ".08em", margin: "0 0 8px", textTransform: "uppercase" }}>InterviewIQ</p>
        <h1 id="about-heading" style={{ fontSize: 26, lineHeight: 1.2, margin: "0 0 12px" }}>Built for focused interview preparation.</h1>
        <p style={{ color: isLight ? "#64748b" : "#cbd5e1", fontSize: 14, lineHeight: 1.6, margin: "0 auto", maxWidth: 360 }}>{PRODUCT_TAGLINE}</p>
        <div style={{ borderTop: `1px solid ${isLight ? "#e2e8f0" : "rgba(255,255,255,.1)"}`, display: "grid", gap: 8, marginTop: 24, paddingTop: 22, textAlign: "left" }}>
          {["Mock interviews and answer review", "Role- and stack-aware practice", "DSA, system design, and company preparation"].map((item) => <div key={item} style={{ color: isLight ? "#334155" : "#e2e8f0", fontSize: 13, lineHeight: 1.45 }}><span style={{ color: isLight ? "#1f6feb" : theme.accentStrong, fontWeight: 900, marginRight: 8 }}>✓</span>{item}</div>)}
        </div>
        <p style={{ color: isLight ? "#64748b" : "#94a3b8", fontSize: 12, margin: "24px 0 0" }}>Designed &amp; developed by Sagar Krishna</p>
      </section>
    </div>
  );
}
