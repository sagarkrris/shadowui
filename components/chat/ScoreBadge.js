export default function ScoreBadge({ content }) {
  const match = content.match(/Score:\s*(\d+)\/10/i);
  if (!match) return null;
  const score = parseInt(match[1]);
  const color = score >= 8 ? "#22c55e" : score >= 6 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 10px", borderRadius: 20, background: `${color}20`, border: `1px solid ${color}40`, color, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
      <i className="ti ti-star-filled" style={{ fontSize: 10 }} />{score}/10
    </div>
  );
}
