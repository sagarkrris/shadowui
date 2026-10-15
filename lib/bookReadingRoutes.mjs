/** Public reading pages with a substantial lesson or article body. */
export function bookReadingRoute(value) {
  if (typeof value !== "string") return null;
  const path = value.split(/[?#]/)[0].replace(/\/+$/, "");
  if (!path.startsWith("/") || path.startsWith("//")) return null;

  if (/^\/senior-java-interview\/daily\/[^/]+$/.test(path)) {
    return { path, contentsHref: "/senior-java-interview/daily" };
  }
  if (/^\/java\/(?:tutorial|listicle)\/[^/]+$/.test(path)) {
    return { path, contentsHref: "/java" };
  }
  if (/^\/guides\/[^/]+\/[^/]+$/.test(path)) {
    return { path, contentsHref: "/guides" };
  }
  if (path === "/learn/ai-engineering" || path === "/learn/spring-transactions") {
    return { path, contentsHref: "/learn" };
  }

  const match = path.match(/^\/(java|tech-blogs|spring|sql|python|aws|javascript|system-design|symptoms|advice-fails|explain-log|resources|scenarios|weekly)\/[^/]+$/);
  if (!match || /^\/java\/(?:roadmap|tutorial|listicle)$/.test(path) || path === "/system-design/visual-guide") return null;
  // Stack-specific articles share the guides catalog; those stacks have no index route.
  const contentsHref = /^(?:spring|sql|python|aws|javascript|system-design)$/.test(match[1])
    ? "/guides" : match[1] === "scenarios" ? "/symptoms" : `/${match[1]}`;
  return { path, contentsHref };
}
