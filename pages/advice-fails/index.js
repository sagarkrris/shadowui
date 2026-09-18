import Head from "next/head";
import Link from "next/link";
import { ADVICE_FAILS_ARTICLES } from "../../lib/adviceFails.mjs";

export default function AdviceFailsIndex() {
  return <><Head><title>When Advice Fails | InterviewIQ</title><meta name="description" content="Five practical backend articles about the conditions where familiar engineering advice fails—and what to do instead." /><link rel="canonical" href="https://interviewiq.app/advice-fails" /></Head><main style={page}><article style={article}><nav style={nav}><Link href="/">InterviewIQ</Link> / When advice fails</nav><header><p style={eyebrow}>ENGINEERING FIELD NOTES · ISSUE 01</p><h1 style={heading}>When advice fails.</h1><p style={lede}>Useful engineering advice has conditions. These short, concrete backend articles begin with the failure mode—then show a reproducible example, a correction, and the boundaries where that correction holds.</p></header><section style={principle}><strong>Read for the constraint, not the slogan.</strong><span>Every article is an original teaching scenario with verification and rollback steps. It is a guide to better experiments, not a production copy-and-paste recipe.</span></section><section aria-labelledby="articles" style={grid}><h2 id="articles" style={{ gridColumn: "1 / -1", margin: "8px 0 0" }}>Five failure modes worth recognizing</h2>{ADVICE_FAILS_ARTICLES.map((item) => <Link href={`/advice-fails/${item.slug}`} key={item.slug} style={card}><span style={number}>{item.number}</span><p style={eyebrow}>{item.topic}</p><h2 style={{ fontSize: 23, lineHeight: 1.16, margin: 0 }}>{item.title}</h2><p style={muted}>{item.description}</p><span style={read}>Read the field note →</span></Link>)}</section></article></main></>;
}

const page = { background: "#08111f", color: "#e5edf8", minHeight: "100vh", padding: "40px 18px 72px" };
const article = { margin: "0 auto", maxWidth: 1060 };
const nav = { color: "#8bd3ff", fontSize: 13, marginBottom: 42 };
const eyebrow = { color: "#8bd3ff", fontSize: 11, fontWeight: 850, letterSpacing: ".09em", margin: 0, textTransform: "uppercase" };
const heading = { fontSize: "clamp(40px, 8vw, 76px)", letterSpacing: "-.05em", lineHeight: .95, margin: "10px 0 18px" };
const lede = { color: "#b7c6d9", fontSize: 19, lineHeight: 1.6, maxWidth: 760 };
const principle = { background: "#10223b", border: "1px solid #315073", borderRadius: 12, display: "grid", gap: 5, lineHeight: 1.55, margin: "34px 0", maxWidth: 780, padding: "18px 20px" };
const grid = { display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" };
const card = { background: "#101d30", border: "1px solid #253b57", borderRadius: 12, color: "#e5edf8", display: "grid", gap: 10, minHeight: 220, padding: 20, position: "relative", textDecoration: "none" };
const number = { color: "#446b90", fontFamily: "ui-monospace, monospace", fontSize: 13, fontWeight: 800 };
const muted = { color: "#a9bad1", lineHeight: 1.55, margin: 0 };
const read = { color: "#8bd3ff", fontWeight: 750, marginTop: "auto" };
