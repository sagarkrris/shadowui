import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { SENIOR_JAVA_GUIDE_PARTS, SENIOR_JAVA_GUIDE_CODE } from "../lib/seniorJavaGuide.mjs";

const contentRoot = new URL("../content/senior-java/", import.meta.url);

test("the complete guide is available as safe reading pages with both companion files", async () => {
  const source = await readFile(new URL("Senior-Java-Interview-Master-Guide-Corrected.md", contentRoot), "utf8");
  assert.equal((source.match(/^<!-- ===== Part [1-8]:/gm) || []).length, 8);
  assert.equal((source.match(/^# Part (?:9|10|11|12|13|14|15|16) /gm) || []).length, 8);
  assert.equal(SENIOR_JAVA_GUIDE_PARTS.length, 17); // Part 1 is split for page size.
  const introduction = await readFile(new URL("rendered/introduction.html", contentRoot), "utf8");
  assert.match(introduction, /Revised 7 October 2026/);
  assert.match(introduction, /Framework, database, cloud and Kubernetes examples are not integration-tested/);

  const pages = await Promise.all(SENIOR_JAVA_GUIDE_PARTS.map(part => readFile(new URL(`rendered/${part.slug}.html`, contentRoot), "utf8")));
  const idsBySlug = new Map(SENIOR_JAVA_GUIDE_PARTS.map((part, index) => [part.slug, [...pages[index].matchAll(/id="([^"]+)"/g)].map(match => match[1])]));
  for (const [index, html] of pages.entries()) {
    assert.match(html, /<h[2-6] id="[^"]+">/);
    assert.doesNotMatch(html, /<(?:script|iframe|style|img)\b|href="(?:javascript:|data:)/i);
    const localIds = idsBySlug.get(SENIOR_JAVA_GUIDE_PARTS[index].slug);
    assert.equal(localIds.length, new Set(localIds).size, "heading IDs must be unique within a page");
    for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(localIds.includes(target), `Missing local target ${target}`);
    for (const [, slug, target] of html.matchAll(/href="\/senior-java-interview\/(part-[^#"]+)#([^"]+)"/g)) {
      assert.ok(idsBySlug.get(slug)?.includes(target), `Missing cross-page target ${slug}#${target}`);
    }
  }
  assert.match(pages[0], /2-Week Plan/);
  assert.match(pages[1], /Module 5: Maven/);
  assert.match(pages[9], /Coding interview practice track/);
  assert.match(pages[11], /SDE-3 Terminology and Follow-up Audit/);
  for (const [offset, first, last] of [[12, 154, 173], [13, 174, 193], [14, 194, 213]]) {
    const html = pages[offset];
    const questionNumbers = [...html.matchAll(/<h4 id="q(\d+)-/g)].map(match => Number(match[1]));
    assert.deepEqual(questionNumbers, Array.from({ length: 20 }, (_, index) => first + index));
    assert.equal(questionNumbers.at(-1), last);
  }
  for (const [offset, first, last] of [[15, 214, 222], [16, 223, 244]]) {
    const html = pages[offset];
    const questionNumbers = [...html.matchAll(/<h4 id="q(\d+)-/g)].map(match => Number(match[1]));
    assert.deepEqual(questionNumbers, Array.from({ length: last - first + 1 }, (_, index) => first + index));
  }

  for (const file of SENIOR_JAVA_GUIDE_CODE) {
    const code = await readFile(new URL(file.filename, contentRoot), "utf8");
    assert.match(code, new RegExp(`public final class ${file.filename.replace(".java", "")}`));
    assert.match(code, /public static void main\(String\[\] args\)/);
  }
});
