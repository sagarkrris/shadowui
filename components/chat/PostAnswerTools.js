import { useMemo, useState } from "react";
import { buildAnswerRewriteStudio, buildCodeExplanationJudge } from "../../lib/prepInsights.mjs";

const REWRITE_VERSION_ORDER = [
  "Original answer",
  "Concise version",
  "Senior version",
  "STAR version",
  "Metrics-added version",
  "Interviewer-ready final answer",
];

const EXPLANATION_CHECK_ORDER = ["Invariant", "Edge cases", "Complexity", "Trade-offs"];

export default function PostAnswerTools({
  profile,
  messages = [],
  selectedCat,
  selectedSub,
  weakSpots = [],
  theme,
  onAction,
  loading = false,
}) {
  const [selectedVersion, setSelectedVersion] = useState("Interviewer-ready final answer");
  const hasUserAnswer = messages.some((message) => message?.role === "user" && String(message.content || "").trim());
  const hasAssistantResponse = messages.some((message) => message?.role === "assistant" && !message.streaming && String(message.content || "").trim());
  const answerRewriteStudio = useMemo(() => buildAnswerRewriteStudio({
    profile,
    messages,
    selectedCat,
    selectedSub,
    weakSpots,
  }), [profile, messages, selectedCat, selectedSub, weakSpots]);
  const codeExplanationJudge = useMemo(() => buildCodeExplanationJudge({
    profile,
    messages,
    selectedCat,
    selectedSub,
  }), [profile, messages, selectedCat, selectedSub]);

  if (loading || !hasUserAnswer || !hasAssistantResponse) return null;

  const activeVersion =
    answerRewriteStudio.versions.find((version) => version.label === selectedVersion) ||
    answerRewriteStudio.versions.at(-1);
  const coveredCount = codeExplanationJudge.checks.filter((check) => check.covered).length;

  return (
    <section
      aria-label="Answer Rewrite Studio and Code Explanation Judge"
      className="post-answer-tools"
      style={{
        width: "100%",
        maxWidth: 900,
        alignSelf: "center",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 10,
        margin: "4px 0 18px",
      }}
    >
      <article className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 9 }}>
          <span>
            <span style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 900 }}>
              <i className="ti ti-writing-sign" />Answer Rewrite Studio
            </span>
            <p style={{ color: "#8b949e", fontSize: 11, lineHeight: 1.45, marginTop: 4 }}>{answerRewriteStudio.summary}</p>
          </span>
          <button className="glass-button" onClick={() => onAction(answerRewriteStudio.actionPrompt)} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 7, padding: "5px 8px", color: theme.accentText, fontSize: 10.8, fontWeight: 850, cursor: "pointer", whiteSpace: "nowrap" }}>
            Polish
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 9 }}>
          {REWRITE_VERSION_ORDER.map((label) => {
            const version = answerRewriteStudio.versions.find((item) => item.label === label);
            if (!version) return null;
            const active = activeVersion?.label === label;

            return (
              <button
                key={label}
                className={active ? "glass-button" : ""}
                onClick={() => setSelectedVersion(label)}
                title={label}
                style={{
                  border: active ? `1px solid ${theme.accentBorder}` : "1px solid rgba(255,255,255,.07)",
                  borderRadius: 7,
                  padding: "5px 7px",
                  background: active ? theme.accentMuted : "rgba(255,255,255,.03)",
                  color: active ? theme.accentText : "#9ca3af",
                  fontSize: 10.4,
                  fontWeight: 850,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 10, background: "rgba(0,0,0,.12)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
            <strong style={{ color: theme.accentStrong, fontSize: 11.5 }}>{activeVersion?.label}</strong>
            <button className="glass-button" onClick={() => onAction(activeVersion?.prompt)} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 7, padding: "4px 7px", color: theme.accentText, fontSize: 10.5, fontWeight: 800, cursor: "pointer" }}>
              Practice
            </button>
          </div>
          <p style={{ color: "#d1d5db", fontSize: 12, lineHeight: 1.55, margin: 0 }}>{activeVersion?.text}</p>
        </div>
      </article>

      <article className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 9 }}>
          <span>
            <span style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 900 }}>
              <i className="ti ti-code-dots" />Code Explanation Judge
            </span>
            <p style={{ color: "#8b949e", fontSize: 11, lineHeight: 1.45, marginTop: 4 }}>Checks whether your dry run sounds complete enough for an interviewer.</p>
          </span>
          <strong style={{ color: codeExplanationJudge.score >= 90 ? "#86efac" : theme.accentStrong, fontSize: 22, lineHeight: 1 }}>
            {codeExplanationJudge.score}
          </strong>
        </div>

        <div style={{ display: "grid", gap: 7, marginBottom: 9 }}>
          {EXPLANATION_CHECK_ORDER.map((label) => codeExplanationJudge.checks.find((check) => check.label === label)).filter(Boolean).map((check) => (
            <button
              key={check.label}
              className="glass-button"
              onClick={() => onAction(check.prompt)}
              title={check.coaching}
              style={{
                border: "1px solid rgba(255,255,255,.07)",
                borderRadius: 8,
                padding: 9,
                display: "grid",
                gridTemplateColumns: "22px 1fr auto",
                gap: 7,
                alignItems: "center",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <i className={`ti ${check.covered ? "ti-circle-check" : "ti-alert-circle"}`} style={{ color: check.covered ? "#86efac" : theme.accentStrong, fontSize: 16 }} />
              <span>
                <strong style={{ display: "block", color: "#e5e7eb", fontSize: 11.5 }}>{check.label}</strong>
                <span style={{ display: "block", color: "#7f8792", fontSize: 10.3, lineHeight: 1.35 }}>{check.covered ? check.evidence : check.coaching}</span>
              </span>
              <span style={{ color: check.covered ? "#86efac" : theme.accentStrong, fontSize: 10.4, fontWeight: 850 }}>
                {check.covered ? "Covered" : "Fix"}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
          <p style={{ color: "#cbd5e1", fontSize: 11.3, lineHeight: 1.45, margin: 0 }}>
            {coveredCount}/4 covered. {codeExplanationJudge.verdict}
          </p>
          <button className="glass-button" onClick={() => onAction(codeExplanationJudge.nextActionPrompt)} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 7, padding: "6px 8px", color: theme.accentText, fontSize: 10.8, fontWeight: 850, cursor: "pointer", whiteSpace: "nowrap" }}>
            Practice explanation
          </button>
        </div>
      </article>
    </section>
  );
}
