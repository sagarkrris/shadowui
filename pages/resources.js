import Head from "next/head";
import Link from "next/link";
import { PUBLIC_RESOURCES } from "../lib/publicContent.mjs";

export default function Resources() {
  const download = (resource) => {
    const text = `${resource.title}\n\n${resource.description}\n\n${resource.sections.map((item, index) => `${index + 1}. ${item}`).join("\n")}`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    link.download = `${resource.slug}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  return <>
    <Head><title>Free Java Interview Checklists and Study Resources | InterviewIQ</title><meta name="description" content="Download free original Java, JVM, Kafka, Spring Boot, SQL, DSA, and STAR interview preparation checklists." /><link rel="canonical" href="https://interviewiq.app/resources" /></Head>
    <main style={{ background: "#08111f", color: "#e5edf8", minHeight: "100vh", padding: "40px 18px" }}><section style={{ margin: "0 auto", maxWidth: 1060 }}>
      <nav aria-label="Breadcrumb" style={{ color: "#8bd3ff", fontSize: 12, marginBottom: 22 }}><Link href="/">InterviewIQ</Link> / Free resources</nav>
      <header style={{ maxWidth: 800 }}><div style={{ color: "#8bd3ff", fontSize: 12, fontWeight: 800, letterSpacing: ".08em" }}>FREE, ORIGINAL, SHAREABLE</div><h1 style={{ fontSize: "clamp(30px, 6vw, 54px)", lineHeight: 1.06, margin: "10px 0" }}>Interview resources you can print, share, and use today</h1><p style={{ color: "#a9bad1", fontSize: 18, lineHeight: 1.55 }}>Short checklists for the moments that matter: explaining Java internals, debugging production, solving DSA problems, and telling your story.</p></header>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", marginTop: 28 }}>{PUBLIC_RESOURCES.map((resource) => <article key={resource.slug} style={cardStyle}><h2 style={{ fontSize: 21, lineHeight: 1.2, margin: 0 }}><Link href={`/resources/${resource.slug}`} style={{ color: "#f8fbff" }}>{resource.title}</Link></h2><p style={{ color: "#a9bad1", lineHeight: 1.5, margin: 0 }}>{resource.description}</p><ul style={{ color: "#c7d5e8", lineHeight: 1.5, margin: 0, paddingLeft: 20 }}>{resource.sections.slice(0, 3).map((section) => <li key={section}>{section}</li>)}</ul><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><button type="button" onClick={() => download(resource)} style={buttonStyle}>Download checklist</button><Link href={`/resources/${resource.slug}`} style={buttonStyle}>Open resource page</Link></div></article>)}</div>
      <section style={{ ...cardStyle, marginTop: 28 }}><h2 style={{ marginTop: 0 }}>Get a weekly practice prompt</h2><p style={{ color: "#a9bad1", lineHeight: 1.5 }}>Use these resources with the private practice workspace for review queues, mock interviews, and personalized weak-topic drills.</p><Link href="/?workspace=java-digest" style={buttonStyle}>Open practice workspace</Link></section>
    </section></main>
  </>;
}

const buttonStyle = { background: "transparent", border: "1px solid #38516e", borderRadius: 6, color: "#dbeafe", display: "inline-block", padding: "9px 12px", textDecoration: "none" };
const cardStyle = { background: "#101d30", border: "1px solid #253b57", borderRadius: 9, display: "grid", gap: 10, padding: 16 };
