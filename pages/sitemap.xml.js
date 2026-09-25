import { WEEKLY_CHALLENGES } from "../lib/weeklyChallenges.mjs";
import { TINY_SYSTEMS } from "../lib/tinySystems.mjs";
import { listTechBlogs } from "../lib/techBlogs.mjs";
import { SCENARIO_SEEDS } from "../lib/scenarioBank.mjs";
import { SYMPTOMS } from "../lib/engineeringSymptoms.mjs";
import { READING_SERIES } from "../lib/readerEditorial.mjs";
import { DETECTIVE_CASES } from "../lib/productionDetective.mjs";
import { PUBLIC_ARTICLES, PUBLIC_RESOURCES } from "../lib/publicContent.mjs";
import { JAVA_TUTORIAL_CATALOG, slugifyJavaTutorial } from "../lib/javaDigest.mjs";
import { PUBLIC_STACK_GUIDES } from "../lib/seoGuides.mjs";
import { PUBLIC_VERTICAL_LISTICLES } from "../lib/verticalContent.mjs";
import { ADVICE_FAILS_ARTICLES } from "../lib/adviceFails.mjs";
import { EXPLAIN_LOGS } from "../lib/explainThisLog.mjs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://interviewiq.app";

export default function Sitemap() { return null; }

export function getServerSideProps({ res }) {
  const urls = [
    { loc: `${SITE_URL}/tech-blogs`, changefreq: "weekly", priority: "0.8" },
    ...listTechBlogs().map(blog => ({ loc: `${SITE_URL}/tech-blogs/${blog.id}`, changefreq: "monthly", priority: "0.8" })),
    ...["/build", ...TINY_SYSTEMS.map(project => `/build/${project.slug}`)].map(path => ({ loc: `${SITE_URL}${path}`, changefreq: "monthly", priority: "0.8" })),
    ...["/explore", "/learn/spring-transactions", "/weekly", ...WEEKLY_CHALLENGES.map(issue => `/weekly/${issue.slug}`)].map(path => ({ loc: `${SITE_URL}${path}`, changefreq: "weekly", priority: "0.8" })),
    ...SCENARIO_SEEDS.map(scenario => ({ loc: `${SITE_URL}/scenarios/${scenario.id}`, changefreq: "monthly", priority: "0.7" })),
    ...["/symptoms", ...SYMPTOMS.map(entry => `/symptoms/${entry.slug}`)].map(path => ({ loc: `${SITE_URL}${path}`, changefreq: "monthly", priority: "0.8" })),
    ...["/time-machine/database-decisions", "/build/java-dependency-injection", "/series", "/editorial", "/corrections", "/requests", "/digest", ...READING_SERIES.map(s => `/series/${s.slug}`)].map(path => ({ loc: `${SITE_URL}${path}`, changefreq: "weekly", priority: "0.7" })),
    { loc: `${SITE_URL}/detective`, changefreq: "weekly", priority: "0.9" },
    ...DETECTIVE_CASES.map(incident => ({ loc: `${SITE_URL}/detective/${incident.slug}`, changefreq: "monthly", priority: "0.8" })),
    { loc: `${SITE_URL}/advice-fails`, changefreq: "weekly", priority: "0.9" },
    ...ADVICE_FAILS_ARTICLES.map(article => ({ loc: `${SITE_URL}/advice-fails/${article.slug}`, changefreq: "monthly", priority: "0.85" })),
    { loc: `${SITE_URL}/explain-log`, changefreq: "weekly", priority: "0.9" },
    ...EXPLAIN_LOGS.map(item => ({ loc: `${SITE_URL}/explain-log/${item.slug}`, changefreq: "monthly", priority: "0.85" })),
    { loc: `${SITE_URL}/`, changefreq: "weekly", priority: "1.0" },
    { loc: `${SITE_URL}/java`, changefreq: "weekly", priority: "0.9" },
    { loc: `${SITE_URL}/java/roadmap`, changefreq: "weekly", priority: "0.9" },
    { loc: `${SITE_URL}/resources`, changefreq: "monthly", priority: "0.8" },
    ...PUBLIC_RESOURCES.map((resource) => ({ loc: `${SITE_URL}/resources/${resource.slug}`, changefreq: "monthly", priority: "0.7" })),
    ...PUBLIC_ARTICLES.map((article) => ({ loc: `${SITE_URL}/java/${article.slug}`, changefreq: "monthly", priority: "0.9" })),
    ...JAVA_TUTORIAL_CATALOG.map((tutorial) => ({ loc: `${SITE_URL}/java/tutorial/${slugifyJavaTutorial(tutorial.title)}`, changefreq: "monthly", priority: "0.7" })),
    { loc: `${SITE_URL}/guides`, changefreq: "weekly", priority: "0.9" },
    ...PUBLIC_STACK_GUIDES.map((guide) => ({ loc: `${SITE_URL}/guides/${guide.stack}/${guide.slug}`, changefreq: "monthly", priority: "0.85" })),
    ...PUBLIC_VERTICAL_LISTICLES.filter((item) => item.vertical !== "java").map((item) => ({ loc: `${SITE_URL}/${item.vertical}/${item.slug}`, changefreq: "monthly", priority: "0.9" })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${escapeXml(url.loc)}</loc><changefreq>${url.changefreq}</changefreq><priority>${url.priority}</priority></url>`).join("")}</urlset>`;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.write(body);
  res.end();
  return { props: {} };
}

function escapeXml(value) { return String(value).replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" }[character])); }
