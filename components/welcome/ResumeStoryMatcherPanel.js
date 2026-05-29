import { useMemo } from "react";
import { buildResumeStoryMatches } from "../../lib/resumeStoryMatcher.mjs";

const FALLBACK_THEME = {
  accentText: "#a7f3d0",
  accentStrong: "#34d399",
  accentMuted: "rgba(52,211,153,.1)",
  accentBorder: "rgba(52,211,153,.28)",
};

export default function ResumeStoryMatcherPanel({
  resumeText = "",
  resumeAnalysis = null,
  proofStories = [],
  matches: externalMatches = null,
  theme = FALLBACK_THEME,
  onAction,
}) {
  const matches = useMemo(
    () => externalMatches || buildResumeStoryMatches({ resumeText, resumeAnalysis, proofStories }),
    [externalMatches, resumeText, resumeAnalysis, proofStories],
  );
  const activeTheme = { ...FALLBACK_THEME, ...theme };

  return (
    <section style={{ width: "100%", maxWidth: 860, display: "grid", gap: 12, marginTop: 22, textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: activeTheme.accentText, fontSize: 12, fontWeight: 800 }}>
            <i className="ti ti-file-search" />Resume Story Matcher
          </div>
          <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.45, marginTop: 5 }}>
            {matches.cards.length ? `${matches.cards.length} resume claims need interview proof.` : matches.summary}
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10 }}>
        {matches.cards.length ? matches.cards.map((card) => (
          <article key={card.id} className="glass-card" style={{ border: `1px solid ${activeTheme.accentBorder}`, borderRadius: 8, padding: 12, display: "grid", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: activeTheme.accentText, background: activeTheme.accentMuted, border: `1px solid ${activeTheme.accentBorder}`, borderRadius: 999, padding: "3px 8px", fontSize: 10.5, fontWeight: 900 }}>
                <i className={`ti ${card.icon}`} />{card.label}
              </span>
              {card.metrics.length ? (
                <span style={{ color: "#86efac", fontSize: 10.5, fontWeight: 900 }}>{card.metrics.join(", ")}</span>
              ) : (
                <span style={{ color: "#fca5a5", fontSize: 10.5, fontWeight: 900 }}>Metrics needed</span>
              )}
            </div>

            <strong style={{ color: "#e8e8f0", fontSize: 12.5, lineHeight: 1.45 }}>{card.claim}</strong>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ color: "#cbd5e1", fontSize: 11.2, fontWeight: 800 }}>Do you have a story for this?</div>
              <div style={{ color: "#cbd5e1", fontSize: 11.2, fontWeight: 800 }}>Can you prove this with metrics?</div>
              <div style={{ color: "#cbd5e1", fontSize: 11.2, fontWeight: 800 }}>What follow-up question will the interviewer ask?</div>
            </div>

            {card.matchedStory ? (
              <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 9 }}>
                <div style={{ color: activeTheme.accentStrong, fontSize: 10.5, fontWeight: 900, marginBottom: 4 }}>Matched proof story</div>
                <p style={{ color: "#9ca3af", fontSize: 11.2, lineHeight: 1.45 }}>{card.matchedStory.title}</p>
              </div>
            ) : null}

            <button className="glass-button" onClick={() => onAction?.(card.mockPrompt)} style={{ justifySelf: "start", display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, border: `1px solid ${activeTheme.accentBorder}`, color: activeTheme.accentText, fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}>
              <i className="ti ti-user-question" />Practice this as a behavioral answer
            </button>
          </article>
        )) : (
          <div className="glass-card" style={{ border: `1px solid ${activeTheme.accentBorder}`, borderRadius: 8, padding: 12 }}>
            <strong style={{ display: "block", color: activeTheme.accentText, fontSize: 12, marginBottom: 6 }}>No resume claims detected yet</strong>
            <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.45 }}>Add resume text with performance, APIs, migration, leadership, reliability, or cost claims.</p>
          </div>
        )}
      </div>
    </section>
  );
}
