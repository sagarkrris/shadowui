import { useMemo } from "react";
import { buildPrepOSDashboard } from "../../lib/prepOperatingSystem.mjs";

const DEFAULT_THEME = {
  accentText: "#bae6fd",
  accentStrong: "#38bdf8",
  accentBorder: "rgba(56,189,248,.28)",
  accentMuted: "rgba(14,165,233,.10)",
};

function actionHandler(onAction, prompt) {
  if (typeof onAction === "function") onAction(prompt);
}

function riskTone(level, theme) {
  if (level === "high") return { color: "#fca5a5", border: "rgba(248,113,113,.30)", background: "rgba(239,68,68,.10)" };
  if (level === "medium") return { color: "#fde68a", border: "rgba(250,204,21,.28)", background: "rgba(234,179,8,.09)" };
  return { color: theme.accentText, border: theme.accentBorder, background: theme.accentMuted };
}

export default function PrepOSDashboard({
  dashboard,
  profile,
  topics,
  weakSpots,
  mockScores,
  questionMemory,
  proofStories,
  interviews,
  theme = DEFAULT_THEME,
  onAction,
}) {
  const prepOS = useMemo(
    () => dashboard || buildPrepOSDashboard({ profile, topics, weakSpots, mockScores, questionMemory, proofStories, interviews }),
    [dashboard, profile, topics, weakSpots, mockScores, questionMemory, proofStories, interviews],
  );

  return (
    <section style={{ width: "100%", maxWidth: 860, display: "grid", gap: 12, marginTop: 22, textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 900 }}>
            <i className="ti ti-layout-dashboard" />PrepOS Today
          </div>
          <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.5, marginTop: 5 }}>
            Local weak spots, memory, mocks, stories, and interview dates collapsed into one next move.
          </p>
        </div>
        <button
          className="glass-button"
          onClick={() => actionHandler(onAction, prepOS.nextMock.prompt)}
          title="Start next mock"
          style={{ display: "inline-flex", alignItems: "center", gap: 7, border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: "8px 11px", color: theme.accentText, fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}
        >
          <i className="ti ti-user-question" />Next mock
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
        <button
          className="glass-card"
          onClick={() => actionHandler(onAction, prepOS.practiceNow.prompt)}
          title="Practice now"
          style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12, textAlign: "left", cursor: "pointer" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 11.5, fontWeight: 900, marginBottom: 8 }}>
            <i className="ti ti-target-arrow" />Practice now
          </span>
          <strong style={{ display: "block", color: "#e8e8f0", fontSize: 14, lineHeight: 1.35 }}>{prepOS.practiceNow.topic}</strong>
          <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.45, marginTop: 7 }}>{prepOS.practiceNow.detail}</p>
        </button>

        <article className="glass-card" style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 11.5, fontWeight: 900, marginBottom: 8 }}>
            <i className="ti ti-sparkles" />Top saved story
          </span>
          <strong style={{ display: "block", color: "#e8e8f0", fontSize: 13.2, lineHeight: 1.35 }}>{prepOS.topStory.title}</strong>
          <p style={{ color: "#6b7280", fontSize: 11.5, lineHeight: 1.45, marginTop: 7 }}>{prepOS.topStory.result || prepOS.topStory.action || "Use this story as interview proof."}</p>
        </article>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
        <article className="glass-card" style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 11.5, fontWeight: 900, marginBottom: 8 }}>
            <i className="ti ti-info-circle" />Why it matters
          </span>
          <ul style={{ margin: 0, paddingLeft: 17, color: "#9ca3af", fontSize: 11.5, lineHeight: 1.55 }}>
            {prepOS.whyItMatters.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>

        <article className="glass-card" style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 11.5, fontWeight: 900, marginBottom: 8 }}>
            <i className="ti ti-alert-triangle" />Interview risks
          </span>
          <div style={{ display: "grid", gap: 7 }}>
            {prepOS.interviewRisks.map((risk) => {
              const tone = riskTone(risk.level, theme);
              return (
                <div key={risk.id} style={{ border: `1px solid ${tone.border}`, background: tone.background, borderRadius: 8, padding: 8 }}>
                  <strong style={{ display: "block", color: tone.color, fontSize: 11.5, lineHeight: 1.35 }}>{risk.label}</strong>
                  <span style={{ color: "#9ca3af", fontSize: 10.8, lineHeight: 1.4 }}>{risk.detail}</span>
                </div>
              );
            })}
          </div>
        </article>
      </div>

      {prepOS.weakTopicsDue.length > 0 && (
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {prepOS.weakTopicsDue.map((item) => (
            <button
              key={`${item.source}-${item.topic}`}
              className="glass-button"
              onClick={() => actionHandler(onAction, `Drill my weak topic "${item.topic}" and score the answer.`)}
              title={`Review ${item.topic}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${theme.accentBorder}`, borderRadius: 999, padding: "5px 9px", color: theme.accentText, fontSize: 10.8, fontWeight: 800, cursor: "pointer" }}
            >
              <i className="ti ti-clock-exclamation" />{item.topic}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
