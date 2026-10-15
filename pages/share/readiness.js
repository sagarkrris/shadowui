import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

export default function ReadinessShare() {
  const { query } = useRouter();
  const score = Math.max(0, Math.min(100, Number(query.score) || 0));
  const label = String(query.label || "Interview preparation in progress").slice(0, 80);
  const stack = String(query.stack || "Software Engineering").slice(0, 40);
  return <><Head><title>{`${score}% readiness · InterviewIQ`}</title><meta name="description" content={`${score}% ${stack} interview readiness signal — ${label}.`} /><meta property="og:title" content={`${score}% interview readiness · InterviewIQ`} /><meta property="og:description" content={`${stack} preparation tracked with InterviewIQ.`} /></Head><main style={{ alignItems: "center", background: "#f8f9fa", color: "#202124", display: "grid", minHeight: "100vh", padding: 24, placeItems: "center" }}><article style={{ background: "#ffffff", border: "1px solid #dadce0", borderRadius: 8, boxShadow: "none", maxWidth: 520, padding: "38px 32px", textAlign: "center", width: "100%" }}><div style={{ color: "#1967d2", fontSize: 12, fontWeight: 900, letterSpacing: ".1em" }}>INTERVIEWIQ READINESS SIGNAL</div><div style={{ color: "#1967d2", fontSize: 86, fontWeight: 900, letterSpacing: "-.06em", lineHeight: 1, margin: "24px 0 12px" }}>{score}%</div><h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{label}</h1><p style={{ color: "#5f6368", lineHeight: 1.6, margin: "0 0 24px" }}>{stack} preparation with structured practice, feedback, and measurable next steps.</p><Link href="/sign-up" style={{ background: "#1967d2", borderRadius: 8, color: "#ffffff", display: "inline-block", fontWeight: 900, padding: "12px 18px", textDecoration: "none" }}>Build your readiness signal →</Link><div style={{ color: "#5f6368", fontSize: 11, marginTop: 20 }}>interviewiq.app</div></article></main></>;
}
