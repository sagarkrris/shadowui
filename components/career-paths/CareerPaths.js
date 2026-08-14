import { useState } from "react";

function buildPaths(stack = "software engineering") {
  const isJava = /\b(java|spring)\b/i.test(stack);
  const foundationsWorkspace = isJava ? "javaDigest" : "interviewReady";
  const foundationsTitle = isJava ? "Java foundations" : `${stack} foundations`;
  const foundationsAction = isJava ? "Open Java fundamentals" : "Open Interview Ready Q&A";
  const foundationsDetail = isJava
    ? "Learn OOP, collections, SQL, HTTP, and Spring through short explanations and drills."
    : `Build core ${stack} knowledge, HTTP, data, testing, and debugging through focused interview drills.`;
  return {
  fresher: { label: "Fresher path", eyebrow: "FROM FUNDAMENTALS TO YOUR FIRST OFFER", description: `Build ${stack} confidence in the order interviews actually probe: fundamentals, code, projects, then communication.`, steps: [
    [foundationsTitle, foundationsDetail, foundationsWorkspace, foundationsAction],
    ["Progressive DSA", "Use visual patterns, hints, dry runs, and spaced review before timed mocks.", "dsaLab", "Open Fresher DSA Path"],
    ["Project stories", "Turn project work into specific STAR examples with technical decisions and measurable results.", "chat", "Build my project story", "Help me turn my strongest project into a fresher interview story. Ask for context, contribution, technical decision, and result. Then create a concise STAR answer and likely follow-ups."],
    ["First interview loop", "Practice introduction, fundamentals, coding, project discussion, and behavioral questions.", "chat", "Start fresher loop", `Run a realistic fresher ${stack} interview loop: introduction, core fundamentals, one entry-level coding question, project discussion, and behavioral close. Ask one question at a time and score clarity, correctness, and next steps.`],
  ] },
  senior: { label: "Senior engineer path", eyebrow: "PRODUCTION JUDGEMENT, ARCHITECTURE, AND INFLUENCE", description: "Practice constraints, trade-offs, incident ownership, architecture, and leadership.", steps: [
    ["Senior technical judgement", isJava ? "Review Java, JVM, concurrency, observability, and production trade-offs." : `Review ${stack} architecture, reliability, observability, testing, security, and production trade-offs.`, isJava ? "javaDigest" : "interviewReady", isJava ? "Open Senior Refresher" : "Open Senior Q&A"],
    ["Production scenarios", "Diagnose incidents, performance regressions, queues, migrations, and security decisions.", "scenarioBank", "Open Scenario Bank"],
    ["Design under constraints", "Defend APIs, data, failure modes, capacity, and operational trade-offs.", "designLab", "Open Design Lab"],
    ["Leadership and loops", "Build high-signal stories and rehearse a complete company interview loop.", "offerWarRoom", "Open Offer War Room"],
  ] },
};
}

const TOOLS = [
  ["Adaptive review", "Revisit missed or due questions instead of only browsing content.", "dsaLab", "Open spaced review"],
  ["JD-to-plan", "Use Home → Career Toolkit to turn a job description into a focused 7/14-day plan.", "chat", "Open Career Toolkit"],
  ["Company loop", "Practice recruiter, coding, system-design, behavioral, and final rounds with continuity.", "offerWarRoom", "Open full interview loop"],
  ["Spoken-answer coaching", "Record or paste an answer for pace, filler-word, STAR, and clarity feedback; raw audio is not persisted.", "chat", "Start recording review"],
];

function Card({ item, accent, onAction, onOpenWorkspace }) {
  const [title, detail, workspace, action, prompt] = item;
  return <article style={{ background: "var(--jd-surface-subtle)", border: "1px solid var(--jd-border)", borderRadius: 9, display: "grid", gap: 8, padding: 12 }}>
    <strong style={{ color: "var(--jd-text)", fontSize: 13 }}>{title}</strong><p style={{ color: "var(--jd-text-soft)", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}>{detail}</p>
    <button type="button" className="glass-button" onClick={() => { onOpenWorkspace?.(workspace); if (prompt) onAction?.(prompt); }} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "var(--jd-text)", cursor: "pointer", fontSize: 11, fontWeight: 850, justifySelf: "start", padding: "7px 9px" }}>{action}</button>
  </article>;
}

export default function CareerPaths({ theme = {}, profile = {}, onAction, onOpenWorkspace }) {
  const [track, setTrack] = useState("fresher"); const paths = buildPaths(profile?.stack || "software engineering"); const path = paths[track]; const accent = theme.accentStrong || "#8bd3ff";
  return <section className="glass-card" style={{ background: "var(--jd-background)", border: "1px solid var(--jd-border-strong)", borderRadius: 9, color: "var(--jd-text)", display: "grid", gap: 14, padding: 15, width: "100%" }}>
    <header style={{ display: "grid", gap: 6 }}><div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{path.eyebrow}</div><h2 style={{ fontSize: 19, lineHeight: 1.25, margin: 0 }}>{path.label}</h2><p style={{ color: "var(--jd-text-soft)", fontSize: 12, lineHeight: 1.5, margin: 0 }}>{path.description}</p><div style={{ display: "flex", gap: 8, marginTop: 4 }}>{Object.entries(paths).map(([id, value]) => <button key={id} type="button" className="glass-button" onClick={() => setTrack(id)} aria-pressed={track === id} style={{ border: `1px solid ${track === id ? `${accent}88` : "var(--jd-border)"}`, borderRadius: 7, color: track === id ? accent : "var(--jd-text-soft)", cursor: "pointer", fontSize: 11.5, fontWeight: 850, padding: "7px 10px" }}>{value.label}</button>)}</div></header>
    <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))" }}>{path.steps.map((item) => <Card key={item[0]} item={item} accent={accent} onAction={onAction} onOpenWorkspace={onOpenWorkspace} />)}</div>
    <section style={{ borderTop: "1px solid var(--jd-border)", display: "grid", gap: 9, paddingTop: 12 }}><strong style={{ color: accent, fontSize: 10.5, textTransform: "uppercase" }}>Prep tools that adapt with you</strong><div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))" }}>{TOOLS.map((item) => <Card key={item[0]} item={item} accent={accent} onAction={onAction} onOpenWorkspace={onOpenWorkspace} />)}</div></section>
  </section>;
}
