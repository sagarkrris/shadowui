import { useMemo } from "react";
import { SKILL_GRAPH_STATUSES, buildSkillGraph } from "../../lib/skillGraph.mjs";

const FALLBACK_THEME = {
  accentText: "#a7f3d0",
  accentStrong: "#34d399",
  accentMuted: "rgba(52,211,153,.1)",
  accentBorder: "rgba(52,211,153,.28)",
};

const STATUS_TONES = {
  New: { color: "#cbd5e1", background: "rgba(148,163,184,.1)", border: "rgba(148,163,184,.24)" },
  Weak: { color: "#fca5a5", background: "rgba(239,68,68,.1)", border: "rgba(239,68,68,.26)" },
  Improving: { color: "#fde68a", background: "rgba(245,158,11,.11)", border: "rgba(245,158,11,.28)" },
  Strong: { color: "#93c5fd", background: "rgba(59,130,246,.11)", border: "rgba(59,130,246,.28)" },
  Mastered: { color: "#86efac", background: "rgba(34,197,94,.12)", border: "rgba(34,197,94,.3)" },
};

function toneFor(status) {
  return STATUS_TONES[status] || STATUS_TONES.New;
}

export default function SkillGraphPanel({
  profile,
  topics = [],
  weakSpots = [],
  mockScores = [],
  questionMemory = {},
  graph: externalGraph = null,
  theme = FALLBACK_THEME,
  onAction,
}) {
  const graph = useMemo(
    () => externalGraph || buildSkillGraph({ profile, topics, weakSpots, mockScores, questionMemory }),
    [externalGraph, profile, topics, weakSpots, mockScores, questionMemory],
  );

  const activeTheme = { ...FALLBACK_THEME, ...theme };

  return (
    <section style={{ width: "100%", maxWidth: 860, display: "grid", gap: 12, marginTop: 22, textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: activeTheme.accentText, fontSize: 12, fontWeight: 800 }}>
            <i className="ti ti-chart-dots-3" />Skill Graph
          </div>
          <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.45, marginTop: 5 }}>
            {graph.summary.total} skills mapped from local prep evidence.
          </p>
        </div>
        <button className="glass-button" onClick={() => onAction?.(graph.focusPrompt)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 11px", borderRadius: 8, border: `1px solid ${activeTheme.accentBorder}`, color: activeTheme.accentText, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
          <i className="ti ti-target-arrow" />Practice focus
        </button>
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {SKILL_GRAPH_STATUSES.map((status) => {
          const tone = toneFor(status);
          return (
            <span key={status} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: tone.color, background: tone.background, border: `1px solid ${tone.border}`, borderRadius: 999, padding: "4px 8px", fontSize: 10.5, fontWeight: 900 }}>
              {status}
              <span style={{ color: "#e5e7eb" }}>{graph.summary.byStatus[status] || 0}</span>
            </span>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
        {graph.nodes.map((node) => {
          const tone = toneFor(node.status);
          const evidence = node.evidence[0];

          return (
            <article key={node.id} className="glass-card" style={{ border: `1px solid ${tone.border}`, borderRadius: 8, padding: 12, display: "grid", gap: 9 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#e8e8f0", fontSize: 12.5, fontWeight: 900 }}>
                    <i className={`ti ${node.icon}`} />{node.label}
                  </div>
                </div>
                <span style={{ color: tone.color, background: tone.background, border: `1px solid ${tone.border}`, borderRadius: 999, padding: "3px 7px", fontSize: 10.2, fontWeight: 900 }}>
                  {node.status}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                <div style={{ width: `${node.score}%`, height: "100%", background: tone.color }} />
              </div>
              <p style={{ color: "#9ca3af", fontSize: 11.2, lineHeight: 1.45 }}>
                {evidence?.detail || node.nextAction}
              </p>
              <button className="glass-button" onClick={() => onAction?.(`Skill Graph drill: ${node.label}. ${node.nextAction}`)} style={{ justifySelf: "start", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 9px", borderRadius: 8, border: `1px solid ${activeTheme.accentBorder}`, color: activeTheme.accentText, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                <i className="ti ti-player-play" />Start drill
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
