import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { EXPLAIN_LOG_REVIEWED_AT, EXPLAIN_LOGS, explainLog } from "../../lib/explainThisLog.mjs";
import { trackEvent } from "../../lib/analytics.mjs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://interviewiq.app";

export default function ExplainLogPage({ item, next }) { return <LogReader key={item.slug} item={item} next={next} />; }

function LogReader({ item, next }) {
  const [selected, setSelected] = useState(null);
  const [opened, setOpened] = useState(new Set());
  const completed = useRef(false);
  const started = useRef(false);
  const inspected = useRef(new Set());
  useEffect(() => {
    try {
      const seenKey = `interviewiq.explainLog.seen.${item.slug}`;
      if (sessionStorage.getItem(seenKey)) return;
      sessionStorage.setItem(seenKey, "1");
      const dateKey = `interviewiq.explainLog.visit.${item.slug}`;
      const previous = localStorage.getItem(dateKey); const today = new Date().toISOString().slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(previous || "") && previous < today) trackEvent("explain_log_returned", { value: item.slug });
      localStorage.setItem(dateKey, today); trackEvent("explain_log_viewed", { value: item.slug });
    } catch { trackEvent("explain_log_viewed", { value: item.slug }); }
  }, [item.slug]);
  function inspect(index) {
    setSelected(index);
    if (inspected.current.has(index)) return;
    inspected.current.add(index);
    setOpened(new Set(inspected.current));
    if (!started.current) { started.current = true; trackEvent("explain_log_started", { value: item.slug }); }
    if (inspected.current.size === item.artifact.length && !completed.current) { completed.current = true; trackEvent("explain_log_completed", { value: item.slug }); }
  }
  const url = `/explain-log/${item.slug}`;
  return <><Head><title>{item.title} | Explain This Log</title><meta name="description" content={item.description} /><link rel="canonical" href={`${SITE_URL}${url}`} /><meta property="og:title" content={`${item.title} | Explain This Log`} /><meta property="og:description" content={item.description} /><meta property="og:type" content="article" /></Head><main style={page}><article style={article}><nav style={nav}><Link href="/">InterviewIQ</Link> / <Link href="/explain-log">Explain this log</Link> / {item.title}</nav><header><p style={eyebrow}>{item.number} · {item.kind}</p><h1 style={heading}>{item.title}</h1><p style={lede}>{item.description}</p></header><section style={instruction}><strong>Read one line at a time.</strong><span>Select a line to reveal its meaning. {opened.size} of {item.artifact.length} inspected.</span></section><section style={reader} aria-label={`${item.kind} reader`}><div style={artifact}>{item.artifact.map((line, index) => <button type="button" key={line.text} onClick={() => inspect(index)} aria-pressed={selected === index} style={{ ...lineButton, ...(selected === index ? selectedLine : {}) }}><span style={lineNumber}>{String(index + 1).padStart(2, "0")}</span><code>{line.text}</code></button>)}</div><aside style={explanation} aria-live="polite">{selected === null ? <><p style={eyebrow}>LINE-BY-LINE</p><h2 style={sectionHeading}>Choose a line.</h2><p style={muted}>Start with the literal observation. A useful explanation is specific about the evidence it has and the evidence it still needs.</p></> : <><p style={eyebrow}>LINE {String(selected + 1).padStart(2, "0")}</p><h2 style={sectionHeading}>What it means</h2><p style={muted}>{item.artifact[selected].meaning}</p></>}</aside></section><section style={twoColumn}><Evidence title="What this proves" body={item.proves} color="#8bd3ff" /><Evidence title="What it doesn't prove" body={item.doesNotProve} color="#e9a8d5" /></section><section style={nextSteps}><p style={eyebrow}>INVESTIGATION ORDER</p><h2 style={sectionHeading}>What to inspect next</h2><ol style={{ color: "#c7d5e8", lineHeight: 1.65, margin: 0, paddingLeft: 22 }}>{item.next.map((step) => <li key={step}>{step}</li>)}</ol></section><section style={reference}><a href={item.reference.url} style={{ color: "#8bd3ff" }}>{item.reference.label}</a><p style={small}>Fictional artifact · technical review: <time dateTime={EXPLAIN_LOG_REVIEWED_AT}>{EXPLAIN_LOG_REVIEWED_AT}</time> · No reader data or artifact content is uploaded.</p></section><footer style={footer}>{next ? <Link href={`/explain-log/${next.slug}`} style={nextLink}>Next artifact: {next.title} →</Link> : <Link href="/explain-log" style={nextLink}>← All artifacts</Link>}</footer></article></main></>;
}
function Evidence({ title, body, color }) { return <section style={{ ...evidence, borderColor: color }}><h2 style={{ ...sectionHeading, color }}>{title}</h2><p style={muted}>{body}</p></section>; }
export function getStaticPaths() { return { paths: EXPLAIN_LOGS.map(({ slug }) => ({ params: { slug } })), fallback: false }; }
export function getStaticProps({ params }) { const item = explainLog(params.slug); if (!item) return { notFound: true }; const index = EXPLAIN_LOGS.findIndex((entry) => entry.slug === item.slug); return { props: { item, next: EXPLAIN_LOGS[index + 1] || null } }; }
const page = { background: "#08111f", color: "#e5edf8", minHeight: "100vh", padding: "36px 18px 72px" };
const article = { margin: "0 auto", maxWidth: 960 };
const nav = { color: "#8bd3ff", fontSize: 13, lineHeight: 1.5, marginBottom: 38 };
const eyebrow = { color: "#8bd3ff", fontSize: 11, fontWeight: 850, letterSpacing: ".09em", margin: 0, textTransform: "uppercase" };
const heading = { fontSize: "clamp(35px, 6vw, 58px)", letterSpacing: "-.04em", lineHeight: 1.02, margin: "10px 0 16px" };
const lede = { color: "#b7c6d9", fontSize: 19, lineHeight: 1.6, margin: 0 };
const instruction = { background: "#10223b", border: "1px solid #315073", borderRadius: 10, display: "grid", gap: 4, lineHeight: 1.55, margin: "28px 0", padding: 16 };
const reader = { display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" };
const artifact = { background: "#07111e", border: "1px solid #294563", borderRadius: 10, display: "grid", padding: 8 };
const lineButton = { background: "transparent", border: 0, borderBottom: "1px solid #1d324a", color: "#c7e7ff", cursor: "pointer", display: "grid", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", gap: 10, gridTemplateColumns: "24px minmax(0, 1fr)", lineHeight: 1.55, overflowWrap: "anywhere", padding: "11px 8px", textAlign: "left", whiteSpace: "pre-wrap", wordBreak: "break-word" };
const selectedLine = { background: "#12304d", borderRadius: 6, color: "#fff" };
const lineNumber = { color: "#6f9ec4", fontSize: 11, paddingTop: 2 };
const explanation = { background: "#101d30", border: "1px solid #253b57", borderRadius: 10, minHeight: 180, padding: 18 };
const sectionHeading = { color: "#f4f8ff", fontSize: 22, lineHeight: 1.2, margin: "8px 0 10px" };
const muted = { color: "#c7d5e8", lineHeight: 1.65, margin: 0 };
const twoColumn = { display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", marginTop: 18 };
const evidence = { background: "#101d30", border: "1px solid", borderLeftWidth: 3, borderRadius: 10, padding: 18 };
const nextSteps = { borderBottom: "1px solid #253b57", borderTop: "1px solid #253b57", marginTop: 28, padding: "25px 0" };
const reference = { background: "#101d30", borderRadius: 10, marginTop: 28, padding: 16 };
const small = { color: "#8fa4bd", fontSize: 13, lineHeight: 1.5, marginBottom: 0 };
const footer = { borderTop: "1px solid #253b57", marginTop: 34, paddingTop: 22 };
const nextLink = { color: "#8bd3ff", fontWeight: 750, textDecoration: "none" };
