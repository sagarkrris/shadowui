import { useMemo } from "react";
import { buildSmartPrepTimeline } from "../../lib/prepOperatingSystem.mjs";

const DEFAULT_THEME = {
  accentText: "#bae6fd",
  accentStrong: "#38bdf8",
  accentBorder: "rgba(56,189,248,.28)",
  accentMuted: "rgba(14,165,233,.10)",
};

const STATUS_TONE = {
  complete: { icon: "ti-circle-check", color: "#86efac", border: "rgba(34,197,94,.28)", background: "rgba(34,197,94,.10)" },
  active: { icon: "ti-player-play", color: "#fde68a", border: "rgba(250,204,21,.28)", background: "rgba(234,179,8,.09)" },
  pending: { icon: "ti-circle-dotted", color: "#94a3b8", border: "rgba(148,163,184,.20)", background: "rgba(148,163,184,.06)" },
};

function handleAction(onAction, milestone) {
  if (typeof onAction === "function") onAction(milestone);
}

export default function SmartPrepTimeline({
  timeline,
  profile,
  topics,
  weakSpots,
  mockScores,
  questionMemory,
  proofStories,
  interviews,
  resumeAnalysis,
  jobDescriptionAnalysis,
  finalPack,
  theme = DEFAULT_THEME,
  onAction,
}) {
  const prepTimeline = useMemo(
    () => timeline || buildSmartPrepTimeline({
      profile,
      topics,
      weakSpots,
      mockScores,
      questionMemory,
      proofStories,
      interviews,
      resumeAnalysis,
      jobDescriptionAnalysis,
      finalPack,
    }),
    [timeline, profile, topics, weakSpots, mockScores, questionMemory, proofStories, interviews, resumeAnalysis, jobDescriptionAnalysis, finalPack],
  );

  return (
    <section style={{ width: "100%", maxWidth: 860, display: "grid", gap: 12, marginTop: 22, textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 900 }}>
            <i className="ti ti-route" />Smart Prep Timeline
          </div>
          <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.5, marginTop: 5 }}>
            {prepTimeline.completed}/{prepTimeline.total} prep milestones complete.
          </p>
        </div>
        {prepTimeline.next && (
          <button
            className="glass-button"
            onClick={() => handleAction(onAction, prepTimeline.next)}
            title={prepTimeline.next.action}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: "8px 11px", color: theme.accentText, fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}
          >
            <i className="ti ti-arrow-right" />{prepTimeline.next.action}
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, alignItems: "stretch" }}>
        {prepTimeline.milestones.map((milestone, index) => {
          const tone = STATUS_TONE[milestone.status] || STATUS_TONE.pending;
          return (
            <article key={milestone.id} className="glass-card" style={{ position: "relative", border: `1px solid ${tone.border}`, borderRadius: 8, padding: 11, minHeight: 142, display: "flex", flexDirection: "column", gap: 8, background: tone.background }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 999, border: `1px solid ${tone.border}`, color: tone.color, background: "rgba(2,6,23,.30)", flex: "0 0 auto" }}>
                  <i className={`ti ${tone.icon}`} />
                </span>
                <span style={{ color: "#64748b", fontSize: 10.5, fontWeight: 800 }}>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div style={{ display: "grid", gap: 5 }}>
                <strong style={{ color: "#e8e8f0", fontSize: 12.2, lineHeight: 1.35 }}>{milestone.label}</strong>
                <p style={{ color: "#9ca3af", fontSize: 11.2, lineHeight: 1.45 }}>{milestone.detail}</p>
              </div>
              <button
                className="glass-button"
                onClick={() => handleAction(onAction, milestone)}
                title={milestone.action}
                style={{ marginTop: "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, border: `1px solid ${tone.border}`, borderRadius: 8, padding: "6px 8px", color: tone.color, fontSize: 10.8, fontWeight: 800, cursor: "pointer" }}
              >
                <i className="ti ti-bolt" />{milestone.action}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
