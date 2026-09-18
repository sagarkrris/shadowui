import { DETECTIVE_CASES, DETECTIVE_REVIEWED_AT } from "../lib/productionDetective.mjs";
import { WEEKLY_CHALLENGES } from "../lib/weeklyChallenges.mjs";
import { BACKEND_FIELD_NOTES } from "../lib/backendFieldNotes.mjs";
import { PUBLIC_ARTICLES } from "../lib/publicContent.mjs";
import { ADVICE_FAILS_ARTICLES, ADVICE_FAILS_REVIEWED_AT } from "../lib/adviceFails.mjs";
import { EXPLAIN_LOGS, EXPLAIN_LOG_REVIEWED_AT } from "../lib/explainThisLog.mjs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://interviewiq.app";

export default function Rss() { return null; }

export function getServerSideProps({ res }) {
  const fieldNotes = BACKEND_FIELD_NOTES.map(blog => `<item><title>${escapeXml(blog.title)}</title><link>${escapeXml(`${SITE_URL}/tech-blogs/${blog.id}`)}</link><guid>${escapeXml(`${SITE_URL}/tech-blogs/${blog.id}`)}</guid><description>${escapeXml(blog.summary)}</description><pubDate>${new Date(`${blog.updated}T00:00:00Z`).toUTCString()}</pubDate></item>`).join("");
  const weeklyItems = WEEKLY_CHALLENGES.map(issue => `<item><title>${escapeXml(`Weekly challenge: ${issue.title}`)}</title><link>${escapeXml(`${SITE_URL}/weekly/${issue.slug}`)}</link><guid>${escapeXml(`${SITE_URL}/weekly/${issue.slug}`)}</guid><description>${escapeXml(issue.description)}</description><pubDate>${new Date(`${issue.date}T00:00:00Z`).toUTCString()}</pubDate></item>`).join("");
  const detectiveItems = DETECTIVE_CASES.map(incident => `<item><title>${escapeXml(incident.title)}</title><link>${escapeXml(`${SITE_URL}/detective/${incident.slug}`)}</link><guid>${escapeXml(`${SITE_URL}/detective/${incident.slug}`)}</guid><description>${escapeXml(incident.description)}</description><pubDate>${new Date(`${DETECTIVE_REVIEWED_AT}T00:00:00Z`).toUTCString()}</pubDate></item>`).join("");
  const adviceFailsItems = ADVICE_FAILS_ARTICLES.map(article => `<item><title>${escapeXml(article.title)}</title><link>${escapeXml(`${SITE_URL}/advice-fails/${article.slug}`)}</link><guid>${escapeXml(`${SITE_URL}/advice-fails/${article.slug}`)}</guid><description>${escapeXml(article.description)}</description><pubDate>${new Date(`${ADVICE_FAILS_REVIEWED_AT}T00:00:00Z`).toUTCString()}</pubDate></item>`).join("");
  const explainLogItems = EXPLAIN_LOGS.map(item => `<item><title>${escapeXml(item.title)}</title><link>${escapeXml(`${SITE_URL}/explain-log/${item.slug}`)}</link><guid>${escapeXml(`${SITE_URL}/explain-log/${item.slug}`)}</guid><description>${escapeXml(item.description)}</description><pubDate>${new Date(`${EXPLAIN_LOG_REVIEWED_AT}T00:00:00Z`).toUTCString()}</pubDate></item>`).join("");
  const items = PUBLIC_ARTICLES.map((article) => `<item><title>${escapeXml(article.title)}</title><link>${SITE_URL}/java/${article.slug}</link><guid>${SITE_URL}/java/${article.slug}</guid><description>${escapeXml(article.description)}</description><pubDate>${new Date(`${article.reviewedAt}T00:00:00Z`).toUTCString()}</pubDate></item>`).join("");
  res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.write(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>InterviewIQ Engineering Guides &amp; Cases</title><link>${SITE_URL}</link><description>Original Java, Spring, JVM, Kafka, SQL, and production interview guides.</description>${fieldNotes}${weeklyItems}${detectiveItems}${adviceFailsItems}${explainLogItems}${items}</channel></rss>`);
  res.end();
  return { props: {} };
}

function escapeXml(value) { return String(value).replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" }[character])); }
