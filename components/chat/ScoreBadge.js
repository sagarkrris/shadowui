import { parseAnswerRubric } from "../../lib/answerRubric.mjs";

export default function ScoreBadge({ content }) {
  const match = content.match(/Score:\s*(\d+(?:\.\d+)?)\/10/i);
  if (!match) return null;
  const score = Number(match[1]);
  const color = score >= 8 ? "#22c55e" : score >= 6 ? "#f59e0b" : "#ef4444";
  const rubric = parseAnswerRubric(content);

  return (
    <div style={{ display: "grid", gap: 7, marginBottom: 8 }}>
      <div style={{ display: "inline-flex", width: "fit-content", alignItems: "center", gap: 5, padding: "2px 10px", borderRadius: 20, background: `${color}20`, border: `1px solid ${color}40`, color, fontSize: 11, fontWeight: 600 }}>
        <i className="ti ti-star-filled" style={{ fontSize: 10 }} />{score}/10
      </div>
      {rubric.length > 0 && (
        <div title="Correctness, Depth, Examples, Trade-offs, Communication, Follow-up readiness" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 7, border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8, background: "rgba(255,255,255,.025)" }}>
          {rubric.map((item) => (
            <label key={item.key} style={{ display: "grid", gap: 3, color: "#9ca3af", fontSize: 10.5, fontWeight: 700 }}>
              <span style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                <span>{item.label}</span>
                <strong style={{ color: "#e8e8f0" }}>{item.score}/10</strong>
              </span>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={item.score}
                readOnly
                disabled
                aria-label={`${item.label} rubric score`}
                style={{ width: "100%", accentColor: color }}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
