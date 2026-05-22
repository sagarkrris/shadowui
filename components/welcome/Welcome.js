import { getQuickPrompts } from "../../lib/prompts.mjs";
import { getStackGreeting } from "../../lib/personalization.mjs";
import { buildPrepCommandCenter } from "../../lib/prepCoach.mjs";
import PrepCommandCenter from "./PrepCommandCenter";

export default function Welcome({ onChip, onScreen, onVoice, selectedCat, selectedSub, theme, profile, showCodeTools, topics, weakSpots }) {
  const topic = selectedSub || selectedCat;
  const quickPrompts = getQuickPrompts(selectedCat, selectedSub);
  const greeting = getStackGreeting(profile);
  const commandCenter = buildPrepCommandCenter({ profile, topics, weakSpots });
  const featureBadges = [
    ["ti-screenshot", "Screen AI"],
    ["ti-microphone", "Voice"],
    ...(showCodeTools ? [["ti-code", "Code Review"]] : []),
    ["ti-bolt", "Streaming"],
  ];

  return (
    <div className="welcome-screen" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px", textAlign: "center", overflowY: "auto" }}>
      <div className="welcome-logo" style={{ width: 60, height: 60, borderRadius: "50%", background: theme.accentSoft, border: `1px solid ${theme.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
        <i className={`ti ${theme.icon}`} style={{ fontSize: 26, color: theme.accentStrong }} />
      </div>
      <h1 className="welcome-title" style={{ fontSize: 20, fontWeight: 600, color: "#e8e8f0", marginBottom: 8, maxWidth: 520, overflowWrap: "anywhere", lineHeight: 1.35 }}>{greeting.headline}</h1>
      {topic ? (
        <p className="welcome-copy" style={{ fontSize: 13.5, color: "#6b7280", marginBottom: 24, maxWidth: 340, lineHeight: 1.65 }}>
          {`${greeting.context} Ready for ${topic}. Hit Start or pick a focused prompt below.`}
        </p>
      ) : (
        <p className="welcome-copy" style={{ fontSize: 13.5, color: "#6b7280", marginBottom: 24, maxWidth: 340, lineHeight: 1.65 }}>
          {`${greeting.context} Select a topic from the sidebar, choose mode & difficulty, then hit Start - or jump in below.`}
        </p>
      )}

      <div className="welcome-actions" style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", justifyContent: "center" }}>
        <button className="glass-button" onClick={onScreen} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", border: `1px solid ${theme.accentBorder}`, borderRadius: 10, color: theme.accentText, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          <i className="ti ti-screenshot" />Analyze Screen
        </button>
        <button className="glass-button" onClick={onVoice} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", border: `1px solid ${theme.accentBorder}`, borderRadius: 10, color: theme.accentText, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          <i className="ti ti-microphone" />Voice Input
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", maxWidth: 500 }}>
        {quickPrompts.map((chip) => (
          <button key={chip} className="glass-button" onClick={() => onChip(chip)} style={{ padding: "6px 13px", fontSize: 12, fontWeight: 500, borderRadius: 20, border: `1px solid ${theme.accentBorder}`, color: theme.accentText, cursor: "pointer" }}>
            {chip}
          </button>
        ))}
      </div>

      <PrepCommandCenter center={commandCenter} theme={theme} onAction={onChip} />

      <div className="welcome-features" style={{ marginTop: 28, display: "flex", gap: 20, fontSize: 11, color: "#374151", flexWrap: "wrap", justifyContent: "center" }}>
        {featureBadges.map(([icon, label]) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}><i className={`ti ${icon}`} />{label}</span>
        ))}
      </div>
    </div>
  );
}
