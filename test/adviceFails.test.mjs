import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ADVICE_FAILS_ARTICLES, adviceFailsArticle } from "../lib/adviceFails.mjs";

test("When Advice Fails launches five complete and addressable field notes", () => {
  assert.equal(ADVICE_FAILS_ARTICLES.length, 5);
  assert.equal(new Set(ADVICE_FAILS_ARTICLES.map((article) => article.slug)).size, ADVICE_FAILS_ARTICLES.length);
  for (const article of ADVICE_FAILS_ARTICLES) {
    assert.equal(adviceFailsArticle(article.slug), article);
    for (const field of ["failure", "reproduction", "brokenCode", "correction", "fixedCode", "conditions", "verification", "rollback"]) assert.ok(article[field], `${article.slug} has ${field}`);
    assert.ok(article.references.length, `${article.slug} cites a primary reference`);
  }
});

test("field notes are public, statically generated, syndicated, and discoverable", () => {
  const detail = readFileSync(new URL("../pages/advice-fails/[slug].js", import.meta.url), "utf8");
  const welcome = readFileSync(new URL("../components/welcome/Welcome.js", import.meta.url), "utf8");
  const sitemap = readFileSync(new URL("../pages/sitemap.xml.js", import.meta.url), "utf8");
  const rss = readFileSync(new URL("../pages/rss.xml.js", import.meta.url), "utf8");
  assert.match(detail, /getStaticPaths/);
  assert.match(detail, /Reproduce it before you fix it/);
  assert.match(detail, /When this correction works—and when it doesn't/);
  assert.match(sitemap, /ADVICE_FAILS_ARTICLES/);
  assert.match(rss, /adviceFailsItems/);
  assert.match(welcome, /When Advice Fails/);
});
