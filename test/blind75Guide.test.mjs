import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { getBlind75Problem, listBlind75Problems } from "../lib/blind75VisualTrack.mjs";
import { extractBlind75GuideEntryFromHtml, readBlind75GuideEntry, readBlind75GuideHtml } from "../lib/blind75Guide.mjs";

test("extracts the detailed Java chapter for each Blind 75 question from the supplied guide", async () => {
  const buffer = await readFile(new URL("../public/downloads/blind-75-java-interview-study-guide.docx", import.meta.url));
  const entry = await readBlind75GuideEntry({ buffer, problem: getBlind75Problem("two-sum") });
  const sections = Object.fromEntries(entry.sections.map((section) => [section.heading, section.content]));

  assert.equal(entry.title, "Two Sum");
  assert.match(sections["Key insight"], /complement/i);
  assert.match(sections["Java solution"], /int\[\] twoSum/);
  assert.match(sections["Worked example"], /\[0, 1\]/);
  assert.match(sections["Complexity"], /O\(n\)/);
  assert.match(sections["Interview follow-ups"], /sorted/i);
  assert.match(sections["Edge cases"], /same element/i);
});

test("matches guide chapters by stable identity, never roster position", async () => {
  const buffer = await readFile(new URL("../public/downloads/blind-75-java-interview-study-guide.docx", import.meta.url));
  const html = await readBlind75GuideHtml(buffer);

  for (const problem of listBlind75Problems()) {
    const entry = extractBlind75GuideEntryFromHtml(html, problem);
    if (problem.id === "binary-search") {
      assert.equal(entry, null, "Binary Search is not in the supplied document");
      continue;
    }
    assert.ok(entry?.sections?.length >= 8, `${problem.title} should have its full guide chapter`);
    assert.equal(entry.sourceTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), problem.id);
    assert.ok(entry.sections.some((section) => section.heading === "Java solution"), `${problem.title} should include Java code`);
  }
  const product = extractBlind75GuideEntryFromHtml(html, getBlind75Problem("product-of-array-except-self"));
  assert.equal(product.sourceOrder, 7);
  assert.match(product.sections.find(s => s.heading === "Java solution").content, /productExceptSelf/);
  assert.doesNotMatch(product.sections.find(s => s.heading === "Java solution").content, /class Codec/);
  assert.deepEqual(extractBlind75GuideEntryFromHtml(html, { ...getBlind75Problem("product-of-array-except-self"), order: 999 }), product);
});
