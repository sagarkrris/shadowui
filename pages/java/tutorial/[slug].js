import Head from "next/head";
import Link from "next/link";
import { JAVA_TUTORIAL_CATALOG, getJavaTutorialBySlug, slugifyJavaTutorial } from "../../../lib/javaDigest.mjs";

export default function JavaTutorialArticle({ tutorial, previous, next }) {
  const share = () => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: tutorial.title, url }).catch((error) => {
        if (error?.name === "AbortError") return;
        if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
      });
  } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };
  if (tutorial.editorialStatus !== "curated") {
    return <>
      <Head><title>{tutorial.title} | Under editorial review | InterviewIQ Java</title><meta name="description" content={`${tutorial.title} is undergoing editorial review.`} /><meta name="robots" content="noindex, nofollow" /></Head>
      <main className="tutorial-article-page" style={{ background: "#08111f", color: "#e5edf8", padding: "32px 18px" }}><article style={{ margin: "0 auto", maxWidth: 920 }}>
        <nav style={{ color: "#8bd3ff", fontSize: 12, marginBottom: 20 }}><Link href="/">InterviewIQ</Link> / <Link href="/?workspace=java-digest">Java Digest</Link> / {tutorial.title}</nav>
        <header style={{ borderBottom: "1px solid #22324a", paddingBottom: 20 }}><div style={{ color: "#8bd3ff", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>{tutorial.category} · {tutorial.level} · Java {tutorial.javaVersions}</div><h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", lineHeight: 1.08, margin: "10px 0" }}>{tutorial.title}</h1><p style={{ color: "#a9bad1", fontSize: 17, lineHeight: 1.55 }}>This topic is being rewritten as a source-reviewed learning chapter.</p></header>
        <section aria-labelledby="editorial-review" style={{ background: "#101d30", border: "1px solid #38516e", borderRadius: 8, display: "grid", gap: 10, marginTop: 20, padding: 16 }}><h2 id="editorial-review" style={{ color: "#8bd3ff", fontSize: 24 }}>Under editorial review</h2><p style={{ color: "#c7d5e8", lineHeight: 1.65 }}>The earlier template text for this topic was not independently reviewed. It has been removed rather than presented as verified guidance.</p><Link href="/?workspace=java-digest" style={{ color: "#8bd3ff", fontWeight: 700 }}>Browse verified Java chapters →</Link></section>
      </article></main>
    </>;
  }
  const sections = ["Walkthrough", "How to think", "Example", "Expected result", "Diagram", "Benchmark", "Common mistakes", "Production note", "Retention exercise", "Interview answer", "Related"];
  return <>
    <Head><title>{tutorial.title} | InterviewIQ Java</title><meta name="description" content={`${tutorial.title}: a practical Java tutorial with examples, production trade-offs, benchmarks, and interview guidance.`} /><meta property="og:title" content={`${tutorial.title} | InterviewIQ Java`} /><meta property="og:description" content={tutorial.summary} /><link rel="canonical" href={`/java/tutorial/${slugifyJavaTutorial(tutorial.title)}`} /></Head>
    <main className="tutorial-article-page" style={{ background: "#08111f", color: "#e5edf8", padding: "32px 18px" }}><article style={{ margin: "0 auto", maxWidth: 920 }}>
      <nav style={{ color: "#8bd3ff", fontSize: 12, marginBottom: 20 }}><Link href="/">InterviewIQ</Link> / <Link href="/?workspace=java-digest">Java Digest</Link> / {tutorial.title}</nav>
      <header style={{ borderBottom: "1px solid #22324a", paddingBottom: 20 }}><div style={{ color: "#8bd3ff", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>{tutorial.category} · {tutorial.level} · Java {tutorial.javaVersions}</div><h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", lineHeight: 1.08, margin: "10px 0" }}>{tutorial.title}</h1><p style={{ color: "#a9bad1", fontSize: 17, lineHeight: 1.55 }}>{tutorial.summary}</p><div style={{ color: "#8295ae", fontSize: 12 }}>By {tutorial.author} · Reviewed {tutorial.reviewedAt} · {tutorial.editorialStatus === "curated" ? "Curated chapter" : "Editorial draft"}</div><div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}><button type="button" onClick={() => window.print()} style={{ border: "1px solid #38516e", borderRadius: 6, color: "#dbeafe", padding: "8px 11px" }}>Print / PDF</button><button type="button" onClick={share} style={{ border: "1px solid #38516e", borderRadius: 6, color: "#dbeafe", padding: "8px 11px" }}>Share article</button></div></header>
      <aside style={{ background: "#101d30", border: "1px solid #253b57", borderRadius: 8, margin: "20px 0", padding: 14 }}><strong style={{ color: "#8bd3ff" }}>On this page</strong><ol style={{ columns: "2 220px", lineHeight: 1.8, margin: "8px 0 0", paddingLeft: 20 }}>{sections.map((section) => <li key={section}><a href={`#${section.toLowerCase().replaceAll(" ", "-")}`} style={{ color: "#b8c8dc" }}>{section}</a></li>)}</ol></aside>
      <section style={{ display: "grid", gap: 16, fontSize: 16, lineHeight: 1.65 }}><Block id="walkthrough" title="Walkthrough">{tutorial.walkthrough}</Block><Block id="how-to-think" title="How to think">{tutorial.howToThink}</Block><Block id="example" title="Example"><pre style={codeStyle}>{tutorial.example}</pre></Block>{tutorial.output && <Block id="expected-result" title="Expected result">{tutorial.output}</Block>}<Block id="diagram" title="Diagram"><pre style={codeStyle}>{tutorial.diagram}</pre></Block><Block id="benchmark" title="Benchmark">{tutorial.benchmark}</Block><Block id="common-mistakes" title="Common mistakes">{tutorial.mistakes}</Block><Block id="production-note" title="Production note">{tutorial.productionNote}</Block><Block id="retention-exercise" title="Retention exercise">{tutorial.exercise}</Block><Block id="interview-answer" title="Interview answer">{tutorial.interviewAnswer}</Block>{tutorial.relatedTopics?.length > 0 && <Block id="related" title="Related tutorials"><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{tutorial.relatedTopics.map((topic) => <Link key={topic} href={`/java/tutorial/${slugifyJavaTutorial(topic)}`} style={{ color: "#8bd3ff" }}>{topic}</Link>)}</div></Block>}</section>
      <footer style={{ borderTop: "1px solid #22324a", display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 18 }}><span>{previous && <Link href={`/java/tutorial/${slugifyJavaTutorial(previous.title)}`} style={{ color: "#8bd3ff" }}>← {previous.title}</Link>}</span><span>{next && <Link href={`/java/tutorial/${slugifyJavaTutorial(next.title)}`} style={{ color: "#8bd3ff" }}>{next.title} →</Link>}</span></footer>
    </article></main>
  </>;
}

function Block({ id, title, children }) { return <section id={id}><h2 style={{ color: "#8bd3ff", fontSize: 24, marginBottom: 6 }}>{title}</h2><div style={{ color: "#c7d5e8" }}>{children}</div></section>; }
const codeStyle = { background: "#050b14", border: "1px solid #263b56", borderRadius: 7, color: "#a7f3d0", overflowX: "auto", padding: 14, whiteSpace: "pre-wrap" };

export function getStaticPaths() { return { paths: JAVA_TUTORIAL_CATALOG.map((tutorial) => ({ params: { slug: slugifyJavaTutorial(tutorial.title) } })), fallback: false }; }
export function getStaticProps({ params }) {
  const tutorial = getJavaTutorialBySlug(params.slug);
  if (!tutorial) return { notFound: true };
  const index = JAVA_TUTORIAL_CATALOG.findIndex((item) => item.id === tutorial.id);
  return { props: { tutorial, previous: index > 0 ? JAVA_TUTORIAL_CATALOG[index - 1] : null, next: index >= 0 && index < JAVA_TUTORIAL_CATALOG.length - 1 ? JAVA_TUTORIAL_CATALOG[index + 1] : null } };
}
