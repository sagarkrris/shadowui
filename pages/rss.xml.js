import { PUBLIC_ARTICLES } from "../lib/publicContent.mjs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://interviewiq.app";

export default function Rss() { return null; }

export function getServerSideProps({ res }) {
  const items = PUBLIC_ARTICLES.map((article) => `<item><title>${escapeXml(article.title)}</title><link>${SITE_URL}/java/${article.slug}</link><guid>${SITE_URL}/java/${article.slug}</guid><description>${escapeXml(article.description)}</description><pubDate>${new Date(`${article.reviewedAt}T00:00:00Z`).toUTCString()}</pubDate></item>`).join("");
  res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.write(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>InterviewIQ Java Interview Guides</title><link>${SITE_URL}</link><description>Original Java, Spring, JVM, Kafka, SQL, and production interview guides.</description>${items}</channel></rss>`);
  res.end();
  return { props: {} };
}

function escapeXml(value) { return String(value).replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" }[character])); }
