import Head from "next/head";
import Link from "next/link";
import { getPublicArticle, getPublicArticleUrl, PUBLIC_ARTICLES } from "../../lib/publicContent.mjs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://interviewiq.app";

export default function PublicJavaArticle({ article, related }) {
  const url = `${SITE_URL}${getPublicArticleUrl(article.slug)}`;
  const source = article.source || {};
  const isScenario = Boolean(source.triage);
  return (
    <>
      <Head>
        <title>{article.title} | InterviewIQ</title>
        <meta name="description" content={article.description} />
        <meta name="keywords" content={article.keywords.join(", ")} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.description} />
        <meta property="og:url" content={url} />
        <meta name="twitter:card" content="summary" />
        <link rel="canonical" href={url} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.description,
          dateModified: article.reviewedAt,
          author: { "@type": "Organization", name: article.author },
          publisher: { "@type": "Organization", name: "InterviewIQ" },
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
        }) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "InterviewIQ", item: `${SITE_URL}/` }, { "@type": "ListItem", position: 2, name: "Java Guides", item: `${SITE_URL}/java` }, { "@type": "ListItem", position: 3, name: article.title, item: url }] }) }} />
      </Head>
      <main style={{ background: "#08111f", color: "#e5edf8", minHeight: "100vh", padding: "32px 18px" }}>
        <article style={{ margin: "0 auto", maxWidth: 920 }}>
          <nav aria-label="Breadcrumb" style={{ color: "#8bd3ff", fontSize: 12, marginBottom: 20 }}>
            <Link href="/">InterviewIQ</Link> / <Link href="/?workspace=java-digest">Java Interview Prep</Link> / {article.category} / {article.title}
          </nav>
          <header style={{ borderBottom: "1px solid #22324a", paddingBottom: 20 }}>
            <div style={{ color: "#8bd3ff", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>{article.category} · Interview guide</div>
            <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", lineHeight: 1.08, margin: "10px 0" }}>{article.title}</h1>
            <p style={{ color: "#a9bad1", fontSize: 17, lineHeight: 1.55 }}>{article.description}</p>
            <div style={{ color: "#8295ae", fontSize: 12 }}>By {article.author} · Reviewed {article.reviewedAt}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              <button type="button" onClick={() => window.print()} style={buttonStyle}>Print / PDF</button>
              <button type="button" onClick={() => { if (navigator.share) navigator.share({ title: article.title, url }); else navigator.clipboard?.writeText(url); }} style={buttonStyle}>Share article</button>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" style={buttonStyle}>LinkedIn</a>
              <a href={`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(article.title)}`} target="_blank" rel="noreferrer" style={buttonStyle}>Reddit</a>
              <a href={`https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(article.title)}`} target="_blank" rel="noreferrer" style={buttonStyle}>X</a>
              <Link href="/?workspace=java-digest" style={buttonStyle}>Practice this topic</Link>
            </div>
          </header>
          <aside style={panelStyle}><strong style={{ color: "#8bd3ff" }}>On this page</strong><ol style={{ columns: "2 220px", lineHeight: 1.8, margin: "8px 0 0", paddingLeft: 20 }}><li><a href="#answer">Direct answer</a></li><li><a href="#mental-model">Mental model</a></li><li><a href="#production">Production approach</a></li><li><a href="#star">STAR story</a></li><li><a href="#related">Related topics</a></li></ol></aside>
          <section id="answer" style={sectionStyle}><h2>Direct answer</h2><p>{article.body}</p></section>
          <section id="mental-model" style={sectionStyle}><h2>Simple mental model</h2><p>Start with the contract, identify the invariant or user-facing target, then trace the smallest set of components that can violate it. Separate diagnosis from mitigation and measure before and after every change.</p></section>
          {isScenario ? <section id="production" style={sectionStyle}><h2>Production approach</h2><ol>{source.triage.map((step) => <li key={step}>{step}</li>)}</ol><p><strong>Likely diagnosis:</strong> {source.diagnosis}</p><p><strong>Prevention:</strong> {source.prevention}</p></section> : <section id="production" style={sectionStyle}><h2>How it works and when to use it</h2><p>{source.answer}</p><p><strong>Example:</strong> {source.example}</p><p><strong>Common follow-ups:</strong> {source.followUps}</p></section>}
          <section id="star" style={sectionStyle}><h2>STAR interview story</h2><div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>{parseStar(article.star).map(([label, text]) => <div key={label} style={{ background: "#101d30", border: "1px solid #253b57", borderRadius: 7, padding: 10 }}><strong style={{ color: "#8bd3ff", display: "block", fontSize: 12 }}>{label}</strong><span>{text}</span></div>)}</div></section>
          <section id="related" style={sectionStyle}><h2>Related topics</h2><div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>{related.map((item) => <Link key={item.slug} href={getPublicArticleUrl(item.slug)} style={{ color: "#8bd3ff" }}>{item.title}</Link>)}</div></section>
        </article>
      </main>
    </>
  );
}

function parseStar(story) {
  const match = String(story || "").match(/^Situation:\s*(.*?)\s+Task:\s*(.*?)\s+Action:\s*(.*?)\s+Result:\s*(.*)$/s);
  return match ? [["Situation", match[1]], ["Task", match[2]], ["Action", match[3]], ["Result", match[4]]] : [["STAR story", story]];
}

const buttonStyle = { border: "1px solid #38516e", borderRadius: 6, color: "#dbeafe", display: "inline-block", padding: "8px 11px", textDecoration: "none" };
const panelStyle = { background: "#101d30", border: "1px solid #253b57", borderRadius: 8, margin: "20px 0", padding: 14 };
const sectionStyle = { color: "#c7d5e8", fontSize: 16, lineHeight: 1.65, marginTop: 24 };

export function getStaticPaths() { return { paths: PUBLIC_ARTICLES.map((article) => ({ params: { slug: article.slug } })), fallback: false }; }
export function getStaticProps({ params }) {
  const article = getPublicArticle(params.slug);
  if (!article) return { notFound: true };
  return { props: { article, related: PUBLIC_ARTICLES.filter((item) => item.slug !== article.slug).slice(0, 5) } };
}
