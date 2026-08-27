import { PUBLIC_ARTICLES, PUBLIC_RESOURCES } from "../lib/publicContent.mjs";
import { JAVA_TUTORIAL_CATALOG, slugifyJavaTutorial } from "../lib/javaDigest.mjs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://interviewiq.app";

export default function Sitemap() { return null; }

export function getServerSideProps({ res }) {
  const urls = [
    { loc: `${SITE_URL}/`, changefreq: "weekly", priority: "1.0" },
    { loc: `${SITE_URL}/java`, changefreq: "weekly", priority: "0.9" },
    { loc: `${SITE_URL}/resources`, changefreq: "monthly", priority: "0.8" },
    ...PUBLIC_RESOURCES.map((resource) => ({ loc: `${SITE_URL}/resources/${resource.slug}`, changefreq: "monthly", priority: "0.7" })),
    ...PUBLIC_ARTICLES.map((article) => ({ loc: `${SITE_URL}/java/${article.slug}`, changefreq: "monthly", priority: "0.9" })),
    ...JAVA_TUTORIAL_CATALOG.map((tutorial) => ({ loc: `${SITE_URL}/java/tutorial/${slugifyJavaTutorial(tutorial.title)}`, changefreq: "monthly", priority: "0.7" })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${escapeXml(url.loc)}</loc><changefreq>${url.changefreq}</changefreq><priority>${url.priority}</priority></url>`).join("")}</urlset>`;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.write(body);
  res.end();
  return { props: {} };
}

function escapeXml(value) { return String(value).replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" }[character])); }
