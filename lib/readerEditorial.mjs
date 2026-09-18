import { PUBLIC_ARTICLES } from "./publicContent.mjs";
import { DETECTIVE_CASES } from "./productionDetective.mjs";
import { BACKEND_FIELD_NOTES } from './backendFieldNotes.mjs';

export const EDITORIAL_PROMISE = "Understand Java and backend failures through working examples.";
export const READER_ARTICLES = [...BACKEND_FIELD_NOTES.map(article => ({ title: article.title, description: article.summary, href: `/tech-blogs/${article.id}`, category: article.category, minutes: article.minutes })), ...PUBLIC_ARTICLES.map(article => ({
  title: article.title, description: article.description, href: `/java/${article.slug}`, category: article.category,
  minutes: Math.max(3, Math.ceil([article.body, article.internals, ...article.answerSteps, article.source?.example || ""].join(" ").split(/\s+/).length / 200)),
}))];
export const READING_SERIES = [
  { slug: 'backend-failure-boundaries', title: 'Understand backend failure boundaries', description: 'Connect uncertain outcomes, resource ownership, and commit durability to three runnable models.', prerequisites: 'HTTP requests, database transactions, and basic resource pooling.', items: BACKEND_FIELD_NOTES.map(article => `/tech-blogs/${article.id}`) },
  { slug: "debug-spring-applications", title: "Debug Spring applications", description: "Trace an annotation through its proxy boundary, then investigate a failed rollback.", prerequisites: "Java methods, exceptions, and basic dependency injection.", items: ["/java/spring-transactional-not-working", "/detective/the-rollback-that-never-happened", "/java/system-design-reliability"] },
  { slug: "understand-database-performance", title: "Understand database performance", description: "Read an execution plan, investigate an index trade-off, and protect the write path.", prerequisites: "Basic SELECT, WHERE, and SQL indexes.", items: ["/java/slow-sql-query", "/detective/the-cost-of-a-faster-query", "/java/redis-cache-evictions"] },
  { slug: "follow-java-failures", title: "Follow Java failures", description: "Connect collection contracts to a missing lookup, then learn to inspect a busy JVM.", prerequisites: "Java classes, equals, hashCode, and collections.", items: ["/java/hashmap-internals", "/detective/the-vanishing-map-entry", "/java/debug-java-high-cpu", "/java/jvm-memory-leak"] },
];
export function readingItem(href) {
  const article = READER_ARTICLES.find(item => item.href === href);
  if (article) return article;
  const incident = DETECTIVE_CASES.find(item => `/detective/${item.slug}` === href);
  return incident ? { href, title: incident.title, description: incident.description, minutes: 5, category: "Investigation" } : null;
}
export function editorialCredit(path) {
  const fieldNote = BACKEND_FIELD_NOTES.find(article => path === `/tech-blogs/${article.id}`);
  if (fieldNote) return { author: 'InterviewIQ Editorial', reviewer: 'Individual reviewer not yet assigned', updated: fieldNote.updated, runtime: `Example verified with ${fieldNote.runtime}. ${fieldNote.scope}` };
  const article = PUBLIC_ARTICLES.find(item => path === `/java/${item.slug}`);
  const incident = DETECTIVE_CASES.find(item => path === `/detective/${item.slug}`);
  return {
    author: article?.author || "InterviewIQ Editorial",
    reviewer: "Individual reviewer not yet assigned",
    updated: incident ? "2026-09-18" : article?.reviewedAt || null,
    runtime: incident?.lab.kind === "map" ? "Example compiled with Java release 17 and executed on Temurin 21 (2026-09-17)." : incident ? "Interactive browser model tested; the production runtime is not executed here." : "Runtime verification not yet recorded for this article.",
  };
}
export const PUBLIC_CORRECTIONS = [
  { id: "detective-scroll-2026-09-18", date: "2026-09-18", status: "Fixed in source", title: "Production Detective did not respond to normal scrolling", affected: "/detective", report: "A reader reported stuck scrolling on phones, tablets, and desktop.", resolution: "The page inherited a locked document body. It now has its own scroll container. Native wheel and keyboard checks cover six screen sizes; Chromium also has a touch-swipe check.", verification: "67 browser checks passed across Chromium, Firefox, and WebKit; physical devices were not tested. Deployment has not been verified." },
];
export const DIGEST_ISSUE = { title: "When the annotation is not the boundary", date: "2026-09-18", explanation: "/java/spring-transactional-not-working", challenge: "/detective/the-rollback-that-never-happened", takeaway: "In Spring proxy mode, test the real injected call path. An annotation on a method does not prove that an internal call created a transaction." };
export const READER_BOOKMARK_KEY = "interviewiq.readerBookmarks.v1";
export function normalizeBookmarks(value) {
  return Array.isArray(value) ? value.filter(item => item && typeof item.href === "string" && /^\/(?:java|tech-blogs|guides|detective|spring|sql|python|aws|javascript|system-design)\/[a-zA-Z0-9/_-]+#[a-zA-Z0-9_-]+$/.test(item.href) && typeof item.title === "string").map(item => ({ href: item.href, title: item.title.slice(0, 180) })).filter((item, index, array) => array.findIndex(other => other.href === item.href) === index).slice(-100) : [];
}
export function sectionId(text, occurrence = 1) { return `read-${String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "section"}${occurrence > 1 ? `-${occurrence}` : ""}`; }
