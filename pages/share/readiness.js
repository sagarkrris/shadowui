import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

export default function ReadinessShare() {
  const { query } = useRouter();
  const score = Math.max(0, Math.min(100, Number(query.score) || 0));
  const label = String(query.label || "Interview preparation in progress").slice(0, 80);
  const stack = String(query.stack || "Software Engineering").slice(0, 40);
  return <><Head><title>{`${score}% readiness · InterviewIQ`}</title><meta name="description" content={`${score}% ${stack} interview readiness signal — ${label}.`} /><meta property="og:title" content={`${score}% interview readiness · InterviewIQ`} /><meta property="og:description" content={`${stack} preparation tracked with InterviewIQ.`} /></Head><main style={{ alignItems: "center", background: "linear-gradient(145deg,#08111f,#123252)", color: "#f8fbff", display: "grid", minHeight: "100vh", padding: 24, placeItems: "center" }}><article style={{ background: "rgba(16,29,48,.92)", border: "1px solid rgba(139,211,255,.35)", borderRadius: 20, boxShadow: "0 24px 80px rgba(0,0,0,.35)", maxWidth: 520, padding: "38px 32px", textAlign: "center", width: "100%" }}><div style={{ color: "#72d0a6", fontSize: 12, fontWeight: 900, letterSpacing: ".1em" }}>INTERVIEWIQ READINESS SIGNAL</div><div style={{ color: "#8bd3ff", fontSize: 86, fontWeight: 900, letterSpacing: "-.06em", lineHeight: 1, margin: "24px 0 12px" }}>{score}%</div><h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{label}</h1><p style={{ color: "#a9bad1", lineHeight: 1.6, margin: "0 0 24px" }}>{stack} preparation with structured practice, feedback, and measurable next steps.</p><Link href="/sign-up" style={{ background: "#72d0a6", borderRadius: 8, color: "#08111f", display: "inline-block", fontWeight: 900, padding: "12px 18px", textDecoration: "none" }}>Build your readiness signal →</Link><div style={{ color: "#8295ae", fontSize: 11, marginTop: 20 }}>interviewiq.app</div></article></main></>;
}
