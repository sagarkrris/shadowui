import assert from "node:assert/strict";
import test from "node:test";
import { bookReadingRoute } from "../lib/bookReadingRoutes.mjs";

test("Book Mode is available on public lessons and article detail pages", () => {
  for (const category of ["java", "tech-blogs", "symptoms", "advice-fails", "explain-log", "resources", "weekly"]) {
    assert.deepEqual(bookReadingRoute(`/${category}/example`), { path: `/${category}/example`, contentsHref: `/${category}` });
  }
  for (const category of ["spring", "sql", "python", "aws", "javascript", "system-design"]) {
    assert.deepEqual(bookReadingRoute(`/${category}/example`), { path: `/${category}/example`, contentsHref: "/guides" });
  }
  assert.equal(bookReadingRoute("/scenarios/example").contentsHref, "/symptoms");
  assert.equal(bookReadingRoute("/java/tutorial/example").contentsHref, "/java");
  assert.equal(bookReadingRoute("/java/listicle/example").contentsHref, "/java");
  assert.equal(bookReadingRoute("/guides/java/example").contentsHref, "/guides");
  assert.equal(bookReadingRoute("/senior-java-interview/daily/example").contentsHref, "/senior-java-interview/daily");
  for (const course of ["ai-engineering", "spring-transactions"]) {
    assert.equal(bookReadingRoute(`/learn/${course}`).contentsHref, "/learn");
  }
});

test("reading identity is stable across section links, queries and trailing slash", () => {
  assert.deepEqual(bookReadingRoute("/java/classes/?source=learn#examples"), {
    path: "/java/classes", contentsHref: "/java",
  });
});

test("indexes, workspaces, live tools and the existing Senior Java reader are excluded", () => {
  for (const path of ["/", "/java", "/tech-blogs", "/guides", "/learn", "/symptoms", "/resources", "/weekly", "/explain-log", "/advice-fails", "/series/example", "/java/roadmap", "/learn/roadmaps/java", "/system-design/visual-guide", "/practice", "/?workspace=course", "/labs/example", "/build/example", "/detective/example", "/senior-java-interview", "/senior-java-interview/part-1", "/senior-java-interview/daily", "/java/tutorial", "/java/listicle", "/java/example/unknown", "/guides/java/example/unknown"]) {
    assert.equal(bookReadingRoute(path), null, path);
  }
});

test("invalid route inputs do not enable a reader", () => {
  for (const value of [null, undefined, 5, "", "java/classes", "https://example.com/java/classes", "//java/classes"]) {
    assert.equal(bookReadingRoute(value), null);
  }
});
