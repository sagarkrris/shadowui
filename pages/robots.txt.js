const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://interviewiq.app";

export default function Robots() { return null; }

export function getServerSideProps({ res }) {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.write(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /sign-in\nDisallow: /sign-up\nDisallow: /reset-password\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  res.end();
  return { props: {} };
}
