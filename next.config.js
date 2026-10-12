/** @type {import('next').NextConfig} */
const path = require("node:path");

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
  // The refresher API parses this bundled source rather than fetching a public
  // asset, so retain it in the Vercel serverless function's filesystem.
  outputFileTracingIncludes: {
    "/api/java-senior-refresher": ["./pdf/java-senior-refresher-java-21-jvm-concurrency.pdf"],
  },
  async redirects() {
    return [
      // The literal Next route template was discovered by Google. Recover only
      // this obsolete placeholder; unknown real slugs must still return 404.
      { source: "/explain-log/\\[slug\\]", destination: "/explain-log", permanent: true },
      { source: "/explain-log/%5Bslug%5D", destination: "/explain-log", permanent: true },
      { source: "/", has: [{ type: "query", key: "workspace" }], destination: "/practice", permanent: false }];
  },
  async headers() {
    return [{ source: "/practice", headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }] }, { source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
      ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
    ] }];
  },
};

module.exports = nextConfig;
