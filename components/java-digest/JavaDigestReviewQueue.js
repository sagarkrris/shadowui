export default function JavaDigestReviewQueue({ dueTutorials, dueReviewCount, accent, onOpen }) {
  if (!dueTutorials.length) return null;
  return <section style={{ background: "var(--jd-surface-subtle)", border: `1px solid ${accent}44`, borderRadius: 8, display: "grid", gap: 7, padding: 11 }}>
    <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Review queue · {dueReviewCount} due</div>
    <div style={{ color: "var(--jd-text-soft)", fontSize: 11.3, lineHeight: 1.45 }}>Recall these from memory first, then open the lesson and mark it complete to advance its interval.</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{dueTutorials.map((tutorial) => <button key={tutorial.id} type="button" className="glass-button" onClick={() => onOpen(tutorial)} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "var(--jd-text)", cursor: "pointer", fontSize: 10.5, padding: "6px 8px" }}>{tutorial.title}</button>)}</div>
  </section>;
}
