import BrandLogo from "./BrandLogo";
import { useEffect, useState } from "react";

const WATERMARK_TILES = Array.from({ length: 12 }, (_, index) => index);

function maskEmail(email) {
  const [local, domain] = String(email || "").split("@");
  if (!local || !domain) return "guest";
  return `${local.slice(0, 1)}***@${domain}`;
}

function getSessionId() {
  if (typeof window === "undefined") return "local";
  try {
    const key = "interviewiq.watermark.session.v1";
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
    const created = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 10);
    window.sessionStorage.setItem(key, created);
    return created;
  } catch {
    return "local";
  }
}

export default function BrandWatermark() {
  const [identity, setIdentity] = useState("guest");
  const [sessionId, setSessionId] = useState("local");
  const [timestamp, setTimestamp] = useState("");

  useEffect(() => {
    setSessionId(getSessionId());
    setTimestamp(new Date().toISOString().slice(0, 16).replace("T", " "));
    fetch("/api/auth?action=me", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setIdentity(maskEmail(payload?.user?.email)))
      .catch(() => setIdentity("guest"));
  }, []);

  const label = `InterviewIQ · ${identity} · ${timestamp || "session"} · ${sessionId}`;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(140px, 1fr))",
        alignItems: "center",
        justifyItems: "center",
        gap: "clamp(40px, 9vw, 140px)",
        padding: "clamp(20px, 6vw, 90px)",
        opacity: 0.085,
        pointerEvents: "none",
        userSelect: "none",
        transform: "rotate(-18deg) scale(1.18)",
        transformOrigin: "center",
      }}
    >
      {WATERMARK_TILES.map((tile) => (
        <span key={tile} style={{ display: "grid", justifyItems: "center", gap: 5 }}>
          <BrandLogo size={150} />
          <span style={{ color: "#8bd3ff", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 8, fontWeight: 800, letterSpacing: ".04em", whiteSpace: "nowrap" }}>{label}</span>
        </span>
      ))}
    </div>
  );
}
