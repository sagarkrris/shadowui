import Head from "next/head";
import Link from "next/link";
import { ADVICE_FAILS_ARTICLES, ADVICE_FAILS_REVIEWED_AT, adviceFailsArticle } from "../../lib/adviceFails.mjs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://interviewiq.app";

export default function AdviceFailsArticle({ article, next }) {
  const url = `/advice-fails/${article.slug}`;
  return <><Head><title>{article.title} | When Advice Fails</title><meta name="description" content={article.description} /><link rel="canonical" href={`${SITE_URL}${url}`} /><meta property="og:title" content={`${article.title} | When Advice Fails`} /><meta property="og:description" content={article.description} /><meta property="og:type" content="article" /><meta property="og:url" content={`${SITE_URL}${url}`} /></Head><main style={page}><article style={articleStyle}><nav style={nav}><Link href="/">InterviewIQ</Link> / <Link href="/advice-fails">When advice fails</Link> / {article.title}</nav><header style={hero}><p style={eyebrow}>{article.number} · {article.topic}</p><h1 style={heading}>{article.title}</h1><p style={lede}>{article.description}</p></header><section style={summary}><strong>The advice:</strong><span>{adviceFor(article.topic)}</span><strong>The missing condition:</strong><span>{missingCondition(article.topic)}</span></section><Section title="The concrete failure"><p>{article.failure}</p></Section><Section title="Reproduce it before you fix it"><p>{article.reproduction}</p><pre style={code}><code>{article.brokenCode}</code></pre></Section><Section title="The corrected approach"><p>{article.correction}</p><pre style={code}><code>{article.fixedCode}</code></pre></Section><Section title="When this correction works—and when it doesn't"><p>{article.conditions}</p></Section><Section title="How to verify it"><p>{article.verification}</p></Section><Section title="Rollback note"><p>{article.rollback}</p></Section><section style={references}><h2 style={sectionHeading}>Primary reference</h2><ul>{article.references.map((reference) => <li key={reference.url}><a style={{ color: "#8bd3ff" }} href={reference.url}>{reference.label}</a></li>)}</ul><p style={muted}>Original teaching scenario · technical review: <time dateTime={ADVICE_FAILS_REVIEWED_AT}>{ADVICE_FAILS_REVIEWED_AT}</time></p></section><footer style={footer}>{next ? <Link href={`/advice-fails/${next.slug}`} style={nextLink}>Next field note: {next.title} →</Link> : <Link href="/advice-fails" style={nextLink}>← All field notes</Link>}</footer></article></main></>;
}

function Section({ title, children }) { return <section style={section}><h2 style={sectionHeading}>{title}</h2>{children}</section>; }
function adviceFor(topic) { return ({ "Spring transactions": "Put @Transactional on the method.", "Java concurrency": "Add more threads to make it faster.", Caching: "Add a cache to make reads fast.", "API reliability": "Retry a timed-out write.", "PostgreSQL performance": "Add an index so the query uses it." }[topic]); }
function missingCondition(topic) { return ({ "Spring transactions": "The call must cross active transaction infrastructure.", "Java concurrency": "The constrained downstream resource must have capacity too.", Caching: "The invalidation and versioning scheme must meet the freshness promise.", "API reliability": "The command must be idempotent across uncertain outcomes.", "PostgreSQL performance": "The predicate and workload must make indexed access cheaper." }[topic]); }

export function getStaticPaths() { return { paths: ADVICE_FAILS_ARTICLES.map(({ slug }) => ({ params: { slug } })), fallback: false }; }
export function getStaticProps({ params }) { const article = adviceFailsArticle(params.slug); if (!article) return { notFound: true }; const index = ADVICE_FAILS_ARTICLES.findIndex((item) => item.slug === article.slug); return { props: { article, next: ADVICE_FAILS_ARTICLES[index + 1] || null } }; }

const page = { background: "#08111f", color: "#e5edf8", minHeight: "100vh", padding: "36px 18px 72px" };
const articleStyle = { margin: "0 auto", maxWidth: 800 };
const nav = { color: "#8bd3ff", fontSize: 13, lineHeight: 1.5, marginBottom: 38 };
const hero = { borderBottom: "1px solid #253b57", paddingBottom: 32 };
const eyebrow = { color: "#8bd3ff", fontSize: 11, fontWeight: 850, letterSpacing: ".09em", margin: 0, textTransform: "uppercase" };
const heading = { fontSize: "clamp(35px, 6vw, 58px)", letterSpacing: "-.04em", lineHeight: 1.02, margin: "10px 0 16px" };
const lede = { color: "#b7c6d9", fontSize: 19, lineHeight: 1.6, margin: 0 };
const summary = { background: "#10223b", border: "1px solid #315073", borderRadius: 10, display: "grid", gap: 5, lineHeight: 1.55, margin: "28px 0", padding: 18 };
const section = { borderBottom: "1px solid #253b57", color: "#c7d5e8", fontSize: 16, lineHeight: 1.7, padding: "26px 0" };
const sectionHeading = { color: "#f4f8ff", fontSize: 23, lineHeight: 1.2, margin: "0 0 12px" };
const code = { background: "#07111e", border: "1px solid #294563", borderRadius: 8, color: "#c7e7ff", fontSize: 13, lineHeight: 1.55, margin: "18px 0 0", overflowX: "auto", padding: 14, whiteSpace: "pre-wrap" };
const references = { background: "#101d30", borderRadius: 10, marginTop: 28, padding: 18 };
const muted = { color: "#8fa4bd", fontSize: 13, lineHeight: 1.5, marginBottom: 0 };
const footer = { borderTop: "1px solid #253b57", marginTop: 34, paddingTop: 22 };
const nextLink = { color: "#8bd3ff", fontWeight: 750, textDecoration: "none" };
