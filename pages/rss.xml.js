import { DETECTIVE_CASES, DETECTIVE_REVIEWED_AT } from "../lib/productionDetective.mjs";
import { PUBLIC_ARTICLES } from "../lib/publicContent.mjs";
import { ADVICE_FAILS_ARTICLES, ADVICE_FAILS_REVIEWED_AT } from "../lib/adviceFails.mjs";
import { EXPLAIN_LOGS, EXPLAIN_LOG_REVIEWED_AT } from "../lib/explainThisLog.mjs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://interviewiq.app";

export default function Rss() { return null; }

export function getServerSideProps({ res }) {
  const detectiveItems = DETECTIVE_CASES.map(incident => `<item><title>${escapeXml(incident.title)}</title><link>${escapeXml(`${SITE_URL}/detective/${incident.slug}`)}</link><guid>${escapeXml(`${SITE_URL}/detective/${incident.slug}`)}</guid><description>${escapeXml(incident.description)}</description><pubDate>${new Date(`${DETECTIVE_REVIEWED_AT}T00:00:00Z`).toUTCString()}</pubDate></item>`).join("");
  const adviceFailsItems = ADVICE_FAILS_ARTICLES.map(article => `<item><title>${escapeXml(article.title)}</title><link>${escapeXml(`${SITE_URL}/advice-fails/${article.slug}`)}</link><guid>${escapeXml(`${SITE_URL}/advice-fails/${article.slug}`)}</guid><description>${escapeXml(article.description)}</description><pubDate>${new Date(`${ADVICE_FAILS_REVIEWED_AT}T00:00:00Z`).toUTCString()}</pubDate></item>`).join("");
  const explainLogItems = EXPLAIN_LOGS.map(item => `<item><title>${escapeXml(item.title)}</title><link>${escapeXml(`${SITE_URL}/explain-log/${item.slug}`)}</link><guid>${escapeXml(`${SITE_URL}/explain-log/${item.slug}`)}</guid><description>${escapeXml(item.description)}</description><pubDate>${new Date(`${EXPLAIN_LOG_REVIEWED_AT}T00:00:00Z`).toUTCString()}</pubDate></item>`).join("");
  const items = PUBLIC_ARTICLES.map((article) => `<item><title>${escapeXml(article.title)}</title><link>${SITE_URL}/java/${article.slug}</link><guid>${SITE_URL}/java/${article.slug}</guid><description>${escapeXml(article.description)}</description><pubDate>${new Date(`${article.reviewedAt}T00:00:00Z`).toUTCString()}</pubDate></item>`).join("");
  res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.write(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>InterviewIQ Engineering Guides &amp; Cases</title><link>${SITE_URL}</link><description>Original Java, Spring, JVM, Kafka, SQL, and production interview guides.</description>${detectiveItems}${adviceFailsItems}${explainLogItems}${items}</channel></rss>`);
  res.end();
  return { props: {} };
}

function escapeXml(value) { return String(value).replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" }[character])); }
