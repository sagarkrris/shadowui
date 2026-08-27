import Head from "next/head";
import Link from "next/link";
import { getPublicResource, getPublicArticleUrl, PUBLIC_RESOURCES } from "../../lib/publicContent.mjs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://interviewiq.app";

export default function ResourcePage({ resource }) {
  const url = `${SITE_URL}/resources/${resource.slug}`;
  const download = () => {
    const text = `${resource.title}\n\n${resource.description}\n\n${resource.sections.map((item, index) => `${index + 1}. ${item}`).join("\n")}`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    link.download = `${resource.slug}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  return <>
    <Head><title>{resource.title} | InterviewIQ</title><meta name="description" content={resource.description} /><meta property="og:title" content={resource.title} /><meta property="og:description" content={resource.description} /><link rel="canonical" href={url} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: resource.title, description: resource.description, author: { "@type": "Organization", name: "InterviewIQ Editorial Team" }, mainEntityOfPage: { "@type": "WebPage", "@id": url } }) }} /></Head>
    <main style={{ background: "#08111f", color: "#e5edf8", minHeight: "100vh", padding: "40px 18px" }}><article style={{ margin: "0 auto", maxWidth: 820 }}>
      <nav aria-label="Breadcrumb" style={{ color: "#8bd3ff", fontSize: 12, marginBottom: 22 }}><Link href="/">InterviewIQ</Link> / <Link href="/resources">Free resources</Link> / {resource.title}</nav>
      <header><div style={{ color: "#8bd3ff", fontSize: 12, fontWeight: 800, letterSpacing: ".08em" }}>FREE INTERVIEW RESOURCE</div><h1 style={{ fontSize: "clamp(30px, 6vw, 52px)", lineHeight: 1.06, margin: "10px 0" }}>{resource.title}</h1><p style={{ color: "#a9bad1", fontSize: 18, lineHeight: 1.55 }}>{resource.description}</p><div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}><button type="button" onClick={download} style={buttonStyle}>Download checklist</button><button type="button" onClick={() => window.print()} style={buttonStyle}>Print / PDF</button><button type="button" onClick={() => navigator.clipboard?.writeText(url)} style={buttonStyle}>Copy link</button></div></header>
      <section style={cardStyle}><h2>Checklist</h2><ol>{resource.sections.map((section) => <li key={section}>{section}</li>)}</ol></section>
      <section style={cardStyle}><h2>Use it in practice</h2><p style={{ color: "#a9bad1", lineHeight: 1.55 }}>Read the detailed guides, then practice the concept with a timed drill and STAR answer in the private workspace.</p><Link href="/?workspace=java-digest" style={buttonStyle}>Open practice workspace</Link></section>
      <p style={{ color: "#8fa4bd", fontSize: 13, marginTop: 26 }}>More detailed reading: <Link href={getPublicArticleUrl(resource.slug === "jvm-troubleshooting-runbook" ? "debug-java-high-cpu" : "hashmap-internals")} style={{ color: "#8bd3ff" }}>browse Java backend guides</Link>.</p>
    </article></main>
  </>;
}

const buttonStyle = { background: "transparent", border: "1px solid #38516e", borderRadius: 6, color: "#dbeafe", display: "inline-block", padding: "9px 12px", textDecoration: "none" };
const cardStyle = { background: "#101d30", border: "1px solid #253b57", borderRadius: 9, lineHeight: 1.65, marginTop: 26, padding: 18 };

export function getStaticPaths() { return { paths: PUBLIC_RESOURCES.map((resource) => ({ params: { slug: resource.slug } })), fallback: false }; }
export function getStaticProps({ params }) { const resource = getPublicResource(params.slug); return resource ? { props: { resource } } : { notFound: true }; }
