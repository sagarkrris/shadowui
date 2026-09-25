import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { listTechBlogs } from "../lib/techBlogs.mjs";
import { COURSE_DIAGRAMS } from "../lib/techBlogDiagrams.mjs";
import { getServerSideProps } from "../pages/sitemap.xml.js";

test("gateway course supplies original guidance and discoverable diagrams", () => {
  const matches = listTechBlogs().filter(b => b.id === "api-gateway-production-patterns");
  assert.equal(matches.length, 1);
  const blog = matches[0];
  assert.equal(blog.chapters.length, 6);
  for (const chapter of blog.chapters) {
    for (const field of ["lesson", "whenToUse", "avoid", "walkthrough", "example", "quiz", "answer"])
      assert.ok(chapter[field], field);
  }
  assert.equal(blog.sourceUrl, undefined);
  assert.match(blog.sections.at(-1).body, /are original/);
  assert.ok(COURSE_DIAGRAMS[blog.chapters[1].diagramKey]);
  let xml = "";
  getServerSideProps({res:{setHeader(){},write(body){xml += body;},end(){}}});
  assert.ok(xml.includes("/tech-blogs/api-gateway-production-patterns</loc>"));
});

test("published tech blog catalog contains no external publisher credit", () => {
  assert.doesNotMatch(JSON.stringify(listTechBlogs()), /algomaster|ashish pratap|substack\.com\/inbox|topic inspiration/i);
});

test("published gateway retry model enforces the operation and attempt budget", () => {
  const example = listTechBlogs().find(b => b.id === "api-gateway-production-patterns").chapters.at(-1).example;
  const extra = `
    for (const method of ["DELETE", "PATCH", "", null]) {
      assert.equal(mayRetry({...base, method}), false);
    }
    assert.equal(mayRetry({...base, method:"POST", sameIntent:false, durableDedup:true}), false);
    assert.equal(mayRetry({...base, minimumAttemptMs:0}), false);
    assert.equal(mayRetry({...base, attempts:0}), false);
    assert.equal(mayRetry({...base, remainingMs:100}), true);
    assert.equal(mayRetry({...base, status:504}), true);
  `;
  const output = execFileSync(process.execPath, ["--input-type=module", "-e", example + extra],
    {encoding:"utf8",timeout:10000});
  assert.match(output, /Gateway retry policy checks passed/);
});
