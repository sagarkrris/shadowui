import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getPublicArticle, PUBLIC_ARTICLES } from "../lib/publicContent.mjs";

test("public article catalog has indexable, search-focused guides", () => {
  assert.ok(PUBLIC_ARTICLES.length >= 9);
  assert.equal(new Set(PUBLIC_ARTICLES.map((article) => article.slug)).size, PUBLIC_ARTICLES.length);
  for (const article of PUBLIC_ARTICLES) {
    assert.match(article.slug, /^[a-z0-9-]+$/);
    assert.ok(article.title.length > 20);
    assert.ok(article.description.length > 50);
    assert.ok(article.keywords.length >= 2);
    assert.ok(article.reviewedAt);
  }
  assert.equal(getPublicArticle("hashmap-internals").category, "Java Collections");
});

test("public SEO routes expose metadata, structured data, sitemap, robots, and RSS", () => {
  const article = readFileSync(new URL("../pages/java/[slug].js", import.meta.url), "utf8");
  const index = readFileSync(new URL("../pages/java/index.js", import.meta.url), "utf8");
  const sitemap = readFileSync(new URL("../pages/sitemap.xml.js", import.meta.url), "utf8");
  const resources = readFileSync(new URL("../pages/resources.js", import.meta.url), "utf8");
  const resourcePage = readFileSync(new URL("../pages/resources/[slug].js", import.meta.url), "utf8");
  const robots = readFileSync(new URL("../pages/robots.txt.js", import.meta.url), "utf8");
  const rss = readFileSync(new URL("../pages/rss.xml.js", import.meta.url), "utf8");
  assert.match(article, /application\/ld\+json/);
  assert.match(article, /rel="canonical"/);
  assert.match(article, /Breadcrumb/);
  assert.match(article, /BreadcrumbList/);
  assert.match(article, /STAR interview story/);
  assert.match(index, /Search Java guides/);
  assert.match(index, /levenshtein/);
  assert.match(index, /synonyms/);
  assert.match(index, /Recent searches/);
  assert.match(index, /People also study/);
  assert.match(index, /application\/rss\+xml/);
  assert.match(index, /Free checklists and posters/);
  assert.match(resources, /Download checklist/);
  assert.match(resources, /PUBLIC_RESOURCES/);
  assert.match(resourcePage, /getStaticPaths/);
  assert.match(resourcePage, /Download checklist/);
  assert.match(sitemap, /sitemaps\.org\/schemas\/sitemap/);
  assert.match(robots, /Sitemap:/);
  assert.match(rss, /application\/rss\+xml/);
});
