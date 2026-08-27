const wrap = { minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-word" };

function ChipButton({ label, icon, active, onClick, accent }) {
  return <button type="button" className={active ? "glass-button" : ""} onClick={onClick} aria-label={label} style={{ alignItems: "center", background: active ? "var(--jd-accent-surface-strong)" : "var(--jd-surface-sunken)", border: `1px solid ${active ? accent : "var(--jd-border)"}`, borderRadius: 7, color: active ? "var(--jd-text)" : "var(--jd-text-muted)", cursor: "pointer", display: "inline-flex", fontSize: 11, fontWeight: 800, gap: 6, minHeight: 31, padding: "7px 10px" }}><i className={`ti ${icon}`} style={{ color: active ? accent : "var(--jd-text-muted)", fontSize: 14 }} />{label}</button>;
}

function buildStarFrame(title, context = "") {
  return `Situation: a project needed a reliable approach to ${title}. Task: apply the concept without weakening correctness. Action: clarified the constraint, implemented the smallest observable change, tested normal and failure paths, and measured the result. Result: the behavior matched the contract and the trade-off was documented. ${context}`;
}

export default function JavaDigestTutorialCard({ tutorial, accent, completedIds, bookmarkedIds, onToggleStatus, onOpen }) {
  return <article className="java-digest-card" style={{ ...wrap, borderRadius: 8, display: "grid", gap: 7, padding: 10 }}>
    <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7 }}><span style={{ color: accent, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{tutorial.category}</span><span style={{ border: "1px solid var(--jd-border-strong)", borderRadius: 999, color: "var(--jd-warning-text)", fontSize: 9.8, fontWeight: 900, padding: "3px 6px" }}>{tutorial.level}</span></div>
    <h3 style={{ ...wrap, color: "var(--jd-text)", fontSize: 13.5, lineHeight: 1.25 }}>{tutorial.title}</h3>
    <div style={{ color: "var(--jd-text-muted)", fontSize: 10.2 }}>Java {tutorial.javaVersions} · Reviewed {tutorial.reviewedAt} · {tutorial.editorialStatus === "curated" ? "Curated chapter" : "Editorial draft"}</div>
    <p style={{ ...wrap, color: "var(--jd-text-soft)", fontSize: 11.3, lineHeight: 1.5, margin: 0 }}>{tutorial.summary}</p>
    <div style={{ color: "var(--jd-accent-alt)", fontSize: 11.1, lineHeight: 1.5 }}><b>Memory hook:</b> {tutorial.memoryHook}</div>
    <details style={{ borderTop: "1px solid var(--jd-border)", paddingTop: 7 }}>
      <summary style={{ color: accent, cursor: "pointer", fontSize: 11.2, fontWeight: 850 }}>Read full chapter</summary>
      <div style={{ display: "grid", gap: 7, marginTop: 8 }}>
        <div style={{ color: "var(--jd-text-soft)", fontSize: 11.2, lineHeight: 1.5 }}><b>Walkthrough:</b> {tutorial.walkthrough}</div>
        <div style={{ color: "var(--jd-text-soft)", fontSize: 11.2, lineHeight: 1.5 }}><b>How to think:</b> {tutorial.howToThink}</div>
        <code style={{ background: "var(--jd-surface-sunken)", borderRadius: 6, color: "var(--jd-code-text)", display: "block", fontSize: 10.8, lineHeight: 1.45, padding: 7, whiteSpace: "pre-wrap" }}>{tutorial.example}</code>
        {tutorial.output && <div style={{ color: "var(--jd-accent-alt)", fontSize: 11.1 }}><b>Expected result:</b> {tutorial.output}</div>}
        <pre style={{ background: "var(--jd-surface-sunken)", border: "1px solid var(--jd-border)", borderRadius: 6, color: "var(--jd-accent-alt)", fontSize: 10.6, lineHeight: 1.45, margin: 0, overflowX: "auto", padding: 7, whiteSpace: "pre-wrap" }}>{tutorial.diagram}</pre>
        <div style={{ color: "var(--jd-text-soft)", fontSize: 11.1, lineHeight: 1.5 }}><b>Benchmark:</b> {tutorial.benchmark}</div>
        <div style={{ color: "var(--jd-danger-text)", fontSize: 11.1, lineHeight: 1.5 }}><b>Common mistakes:</b> {tutorial.mistakes}</div>
        <div style={{ color: "var(--jd-warning-text)", fontSize: 11.1, lineHeight: 1.5 }}><b>Production note:</b> {tutorial.productionNote}</div>
        <div style={{ color: "var(--jd-text-soft)", fontSize: 11.1, lineHeight: 1.5 }}><b>Retention exercise:</b> {tutorial.exercise}</div>
        <div style={{ color: "var(--jd-accent-alt)", fontSize: 11.1, lineHeight: 1.5 }}><b>Interview answer:</b> {tutorial.interviewAnswer}</div>
        {tutorial.relatedTopics?.length > 0 && <div style={{ color: "var(--jd-text-muted)", fontSize: 11.1, lineHeight: 1.5 }}><b>Related:</b> {tutorial.relatedTopics.join(" · ")}</div>}
        <div style={{ borderLeft: `3px solid ${accent}`, color: "var(--jd-text-soft)", fontSize: 11.1, lineHeight: 1.5, paddingLeft: 8 }}><b style={{ color: accent }}>STAR story:</b> {buildStarFrame(tutorial.title, tutorial.practice)}</div>
      </div>
    </details>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}><a href={`/java/tutorial/${slugifyJavaTutorial(tutorial.title)}`} className="glass-button" style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "var(--jd-text)", fontSize: 10.5, padding: "5px 7px", textDecoration: "none" }}><i className="ti ti-external-link" style={{ color: accent, marginRight: 4 }} />Open article</a><button type="button" className="glass-button" onClick={() => onOpen?.(tutorial)} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "var(--jd-text)", fontSize: 10.5, padding: "5px 7px" }}><i className="ti ti-book-open" style={{ color: accent, marginRight: 4 }} />Read / resume</button><ChipButton label={completedIds.has(tutorial.id) ? "Completed" : "Mark complete"} icon="ti-check" active={completedIds.has(tutorial.id)} accent={accent} onClick={() => onToggleStatus("completedTutorials", tutorial.id)} /><ChipButton label={bookmarkedIds.has(tutorial.id) ? "Bookmarked" : "Bookmark"} icon="ti-bookmark" active={bookmarkedIds.has(tutorial.id)} accent="var(--jd-warning)" onClick={() => onToggleStatus("bookmarkedTutorials", tutorial.id)} /></div>
  </article>;
}
import { slugifyJavaTutorial } from "../../lib/javaDigest.mjs";
