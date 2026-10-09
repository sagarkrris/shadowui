import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { SENIOR_JAVA_DAILY_SETS } from "../lib/seniorJavaDaily.mjs";

const root = new URL("../content/senior-java/daily/", import.meta.url);

test("daily sets preserve sequential identities, complete answers, and unique routes", async () => {
  assert.deepEqual(SENIOR_JAVA_DAILY_SETS.slice(0, 5).map(set => set.slug), [
    "2026-10-07-set-01", "2026-10-07-set-02", "2026-10-07-set-03", "2026-10-08-set-04", "2026-10-09-set-05",
  ], "existing dated URLs cannot move when later sets are added");
  assert.deepEqual(SENIOR_JAVA_DAILY_SETS.map(set => set.number), Array.from({ length: SENIOR_JAVA_DAILY_SETS.length }, (_, index) => index + 1));
  assert.equal(new Set(SENIOR_JAVA_DAILY_SETS.map(set => set.slug)).size, SENIOR_JAVA_DAILY_SETS.length);
  assert.equal(new Set(SENIOR_JAVA_DAILY_SETS.map(set => set.file)).size, SENIOR_JAVA_DAILY_SETS.length);
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
  assert.equal(questionHeadings.length, 12 * SENIOR_JAVA_DAILY_SETS.length);
  assert.equal(new Set(questionHeadings).size, questionHeadings.length, "all question scenarios remain distinct");
});
