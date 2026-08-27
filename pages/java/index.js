import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PUBLIC_ARTICLES, getPublicArticleUrl } from "../../lib/publicContent.mjs";

export default function JavaGuidesIndex() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [recentSearches, setRecentSearches] = useState([]);
  const categories = ["All", ...new Set(PUBLIC_ARTICLES.map((article) => article.category))];
  useEffect(() => {
    try { setRecentSearches(JSON.parse(window.localStorage.getItem("interviewiq.publicSearches") || "[]")); } catch { setRecentSearches([]); }
  }, []);
  useEffect(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized || normalized.length < 3 || typeof window === "undefined") return;
    const timer = window.setTimeout(() => {
      const stored = (() => { try { return JSON.parse(window.localStorage.getItem("interviewiq.publicSearches") || "[]"); } catch { return []; } })();
      const next = [normalized, ...stored.filter((item) => item !== normalized)].slice(0, 8);
      setRecentSearches(next);
      window.localStorage.setItem("interviewiq.publicSearches", JSON.stringify(next));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [query]);
  const articles = useMemo(() => PUBLIC_ARTICLES.filter((article) => {
    const search = normalizeSearch(query);
    const haystack = normalizeSearch(`${article.title} ${article.description} ${article.keywords.join(" ")}`);
    const tokens = search.split(" ").filter(Boolean);
    const direct = !tokens.length || tokens.every((token) => haystack.includes(token));
    const fuzzy = tokens.length > 0 && tokens.every((token) => haystack.split(" ").some((word) => word.length > 3 && levenshtein(token, word) <= (token.length > 6 ? 2 : 1)));
    return (category === "All" || article.category === category) && (direct || fuzzy || article.keywords.some((keyword) => synonyms(keyword).some((term) => search.includes(term))));
  }), [category, query]);
  return <>
    <Head>
      <title>Java Backend Interview Guides | InterviewIQ</title>
      <meta name="description" content="Original, practical Java, Spring, JVM, Kafka, Redis, SQL, and production debugging interview guides." />
      <meta property="og:title" content="Java Backend Interview Guides | InterviewIQ" />
      <meta property="og:description" content="Original, practical backend interview guides with production scenarios and STAR answers." />
      <link rel="canonical" href="https://interviewiq.app/java" />
      <link rel="alternate" type="application/rss+xml" title="InterviewIQ Java Guides" href="/rss.xml" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", itemListElement: PUBLIC_ARTICLES.map((article, index) => ({ "@type": "ListItem", position: index + 1, name: article.title, url: `https://interviewiq.app/java/${article.slug}` })) }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "InterviewIQ", item: "https://interviewiq.app/" }, { "@type": "ListItem", position: 2, name: "Java Backend Interview Guides", item: "https://interviewiq.app/java" }] }) }} />
    </Head>
    <main style={{ background: "#08111f", color: "#e5edf8", minHeight: "100vh", padding: "40px 18px" }}>
      <section style={{ margin: "0 auto", maxWidth: 1060 }}>
        <nav aria-label="Breadcrumb" style={{ color: "#8bd3ff", fontSize: 12, marginBottom: 22 }}><Link href="/">InterviewIQ</Link> / Java Backend Interview Guides</nav>
        <header style={{ maxWidth: 780 }}><div style={{ color: "#8bd3ff", fontSize: 12, fontWeight: 800, letterSpacing: ".08em" }}>PEOPLE-FIRST INTERVIEW PREPARATION</div><h1 style={{ fontSize: "clamp(30px, 6vw, 54px)", lineHeight: 1.06, margin: "10px 0" }}>Java backend guides that explain the why, not just the answer</h1><p style={{ color: "#a9bad1", fontSize: 18, lineHeight: 1.55 }}>Learn internal mechanics, production debugging, trade-offs, and how to communicate your experience in STAR format.</p></header>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "24px 0" }}><input aria-label="Search Java guides" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search HashMap, Kafka, SQL..." style={inputStyle} />{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} style={{ ...buttonStyle, background: category === item ? "#12304b" : "transparent" }}>{item}</button>)}</div>
        {recentSearches.length > 0 && !query && <div style={{ color: "#8fa4bd", fontSize: 12, marginBottom: 16 }}>Recent searches: {recentSearches.slice(0, 5).map((item) => <button key={item} type="button" onClick={() => setQuery(item)} style={{ ...buttonStyle, fontSize: 11, margin: "0 4px", padding: "5px 8px" }}>{item}</button>)}</div>}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>{articles.map((article) => <article key={article.slug} style={cardStyle}><div style={{ color: "#8bd3ff", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>{article.category}</div><h2 style={{ fontSize: 21, lineHeight: 1.2, margin: "7px 0" }}><Link href={getPublicArticleUrl(article.slug)} style={{ color: "#f8fbff" }}>{article.title}</Link></h2><p style={{ color: "#a9bad1", lineHeight: 1.5, margin: 0 }}>{highlight(article.description, query)}</p><div style={{ color: "#8fa4bd", fontSize: 11 }}>Related incident and interview evidence included</div><Link href={getPublicArticleUrl(article.slug)} style={{ color: "#8bd3ff", marginTop: 12 }}>Read guide →</Link></article>)}</div>
        {!articles.length && <p style={{ color: "#a9bad1", marginTop: 22 }}>No guide matches that search yet. Try a broader term or use the practice workspace.</p>}
        <section style={{ ...cardStyle, marginTop: 28 }}><h2 style={{ marginTop: 0 }}>People also study</h2><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{PUBLIC_ARTICLES.slice(0, 5).map((article) => <Link key={article.slug} href={getPublicArticleUrl(article.slug)} style={buttonStyle}>{article.title}</Link>)}</div></section>
        <section style={{ ...cardStyle, marginTop: 12 }}><h2 style={{ marginTop: 0 }}>Practice after reading</h2><p style={{ color: "#a9bad1", lineHeight: 1.5 }}>Turn any guide into a timed interview drill, save it for review, and practice the STAR story in the private workspace.</p><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><Link href="/?workspace=java-digest" style={buttonStyle}>Open Java practice workspace</Link><Link href="/resources" style={buttonStyle}>Free checklists and posters</Link></div></section>
      </section>
    </main>
  </>;
}

const inputStyle = { background: "#101d30", border: "1px solid #38516e", borderRadius: 6, color: "#f8fbff", flex: "1 1 280px", fontSize: 14, minWidth: 220, padding: "10px 12px" };
const buttonStyle = { border: "1px solid #38516e", borderRadius: 6, color: "#dbeafe", display: "inline-block", padding: "9px 12px", textDecoration: "none" };
const cardStyle = { background: "#101d30", border: "1px solid #253b57", borderRadius: 9, display: "grid", gap: 5, padding: 16 };

function normalizeSearch(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim(); }
function synonyms(value) { const map = { hashmap: ["hash map", "map"], kafka: ["broker", "consumer", "streaming"], redis: ["cache", "caching"], jvm: ["java virtual machine", "heap", "gc"], sql: ["database", "query", "postgresql"] }; return [value, ...(map[value] || [])]; }
function levenshtein(left, right) { const row = Array.from({ length: right.length + 1 }, (_, index) => index); for (let i = 1; i <= left.length; i += 1) { let previous = row[0]; row[0] = i; for (let j = 1; j <= right.length; j += 1) { const current = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (left[i - 1] === right[j - 1] ? 0 : 1)); previous = current; } } return row[right.length]; }
function highlight(text, query) { const terms = normalizeSearch(query).split(" ").filter((term) => term.length > 1); if (!terms.length) return text; const pattern = new RegExp(`(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "ig"); return String(text).split(pattern).map((part, index) => terms.some((term) => part.toLowerCase() === term.toLowerCase()) ? <mark key={`${part}-${index}`} style={{ background: "#174b66", color: "#f8fbff" }}>{part}</mark> : part); }
