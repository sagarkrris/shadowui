import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { SENIOR_JAVA_DAILY_SETS } from "../lib/seniorJavaDaily.mjs";

const root = new URL("../content/senior-java/daily/", import.meta.url);

test("the three archived daily sets are published intact and uniquely routed", async () => {
  assert.deepEqual(SENIOR_JAVA_DAILY_SETS.map(set => set.number), [1, 2, 3]);
  assert.equal(new Set(SENIOR_JAVA_DAILY_SETS.map(set => set.slug)).size, 3);
  const questionHeadings = [];
  for (const set of SENIOR_JAVA_DAILY_SETS) {
    const markdown = await readFile(new URL(`${set.file}.md`, root), "utf8");
    const html = await readFile(new URL(`rendered/${set.file}.html`, root), "utf8");
    assert.equal((markdown.match(/\*\*Say aloud:\*\*/g) || []).length, 12, `${set.slug}: spoken answers`);
    assert.equal((markdown.match(/\*\*Follow-ups:\*\*/g) || []).length, 12, `${set.slug}: follow-ups`);
    const headings = [...html.matchAll(/<h3 id="[^"]+">(\d+)\. ([\s\S]*?)<\/h3>/g)];
    assert.deepEqual(headings.map(match => Number(match[1])), Array.from({ length: 12 }, (_, index) => index + 1), `${set.slug}: question order`);
    questionHeadings.push(...headings.map(match => match[2]));
    assert.doesNotMatch(html, /<\/?(?:script|iframe|style|img)\b|href="(?:javascript:|data:)|\/Users\/sagkrish\/|::inbox-item/i);
    assert.match(html, /<pre><code/);
  }
  assert.equal(questionHeadings.length, 36);
  assert.equal(new Set(questionHeadings).size, 36, "all question scenarios remain distinct");
});
