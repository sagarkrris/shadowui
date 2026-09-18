import Head from "next/head";
import Link from "next/link";
import { EXPLAIN_LOGS } from "../../lib/explainThisLog.mjs";

export default function ExplainLogIndex() {
  return <><Head><title>Explain This Log | InterviewIQ</title><meta name="description" content="Learn to read fictional stack traces, query plans, thread dumps, and HTTP exchanges—one line at a time." /><link rel="canonical" href="https://interviewiq.app/explain-log" /></Head><main style={page}><article style={article}><nav style={nav}><Link href="/">InterviewIQ</Link> / Explain this log</nav><header><p style={eyebrow}>CURATED FICTIONAL ARTIFACTS</p><h1 style={heading}>Explain this log.</h1><p style={lede}>Click each line to decode it. Every example separates what the artifact proves from what it cannot prove, so an incident clue never becomes an overconfident diagnosis.</p></header><section style={notice}><strong>Safe by design.</strong><span>These are fictional teaching examples. This site does not accept, upload, or store production logs.</span></section><section style={grid}>{EXPLAIN_LOGS.map((item) => <Link key={item.slug} href={`/explain-log/${item.slug}`} style={card}><span style={number}>{item.number}</span><p style={eyebrow}>{item.kind}</p><h2 style={{ fontSize: 23, lineHeight: 1.16, margin: 0 }}>{item.title}</h2><p style={muted}>{item.description}</p><span style={open}>Decode the artifact →</span></Link>)}</section></article></main></>;
}
const page = { background: "#08111f", color: "#e5edf8", minHeight: "100vh", padding: "40px 18px 72px" };
const article = { margin: "0 auto", maxWidth: 1060 };
const nav = { color: "#8bd3ff", fontSize: 13, marginBottom: 42 };
const eyebrow = { color: "#8bd3ff", fontSize: 11, fontWeight: 850, letterSpacing: ".09em", margin: 0, textTransform: "uppercase" };
const heading = { fontSize: "clamp(40px, 8vw, 76px)", letterSpacing: "-.05em", lineHeight: .95, margin: "10px 0 18px" };
const lede = { color: "#b7c6d9", fontSize: 19, lineHeight: 1.6, maxWidth: 760 };
const notice = { background: "#10223b", border: "1px solid #315073", borderRadius: 12, display: "grid", gap: 5, lineHeight: 1.55, margin: "34px 0", maxWidth: 780, padding: "18px 20px" };
const grid = { display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" };
const card = { background: "#101d30", border: "1px solid #253b57", borderRadius: 12, color: "#e5edf8", display: "grid", gap: 10, minHeight: 220, padding: 20, textDecoration: "none" };
const number = { color: "#446b90", fontFamily: "ui-monospace, monospace", fontSize: 13, fontWeight: 800 };
const muted = { color: "#a9bad1", lineHeight: 1.55, margin: 0 };
const open = { color: "#8bd3ff", fontWeight: 750, marginTop: "auto" };
