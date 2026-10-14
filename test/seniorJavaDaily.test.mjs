import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { SENIOR_JAVA_DAILY_SETS } from "../lib/seniorJavaDaily.mjs";

const root = new URL("../content/senior-java/daily/", import.meta.url);

test("daily sets preserve sequential identities, complete answers, and unique routes", async () => {
  assert.deepEqual(SENIOR_JAVA_DAILY_SETS.slice(0, 8).map(set => set.slug), [
    "2026-10-07-set-01", "2026-10-07-set-02", "2026-10-07-set-03", "2026-10-08-set-04", "2026-10-09-set-05", "2026-10-12-set-06", "2026-10-13-set-07", "2026-10-14-set-08",
  ], "existing dated URLs cannot move when later sets are added");
  assert.deepEqual(SENIOR_JAVA_DAILY_SETS.map(set => set.number), Array.from({ length: SENIOR_JAVA_DAILY_SETS.length }, (_, index) => index + 1));
  assert.equal(new Set(SENIOR_JAVA_DAILY_SETS.map(set => set.slug)).size, SENIOR_JAVA_DAILY_SETS.length);
  assert.equal(new Set(SENIOR_JAVA_DAILY_SETS.map(set => set.file)).size, SENIOR_JAVA_DAILY_SETS.length);
  const questionHeadings = [];
  for (const set of SENIOR_JAVA_DAILY_SETS) {
    const count = set.questionCount ?? 12;
    assert.ok(Number.isInteger(count) && count > 0);
    const markdown = await readFile(new URL(`${set.file}.md`, root), "utf8");
    const html = await readFile(new URL(`rendered/${set.file}.html`, root), "utf8");
    assert.equal((markdown.match(/\*\*Say aloud:\*\*/g) || []).length, count, `${set.slug}: spoken answers`);
    assert.equal((markdown.match(/\*\*Follow-ups:\*\*/g) || []).length, count, `${set.slug}: follow-ups`);
    const headings = [...html.matchAll(/<h3 id="[^"]+">(\d+)\. ([\s\S]*?)<\/h3>/g)];
    assert.equal((html.match(/<h3\b/g) || []).length, count, `${set.slug}: reader heading contract`);
    assert.deepEqual(headings.map(match => Number(match[1])), Array.from({ length: count }, (_, index) => index + 1), `${set.slug}: question order`);
    questionHeadings.push(...headings.map(match => match[2]));
    if (set.number === 9) {
      for (const label of ["Root cause", "Evidence", "Fix", "Trade-offs"]) {
        assert.equal(markdown.split(`**${label}:**`).length - 1, count, label);
      }
      assert.equal(count, 28);
    }
    if (set.number === 8) assert.match(html, /<code>tenant_id<\/code>, <code>external_ref<\/code>/, "SQL identifiers remain readable rather than Markdown emphasis");
    assert.doesNotMatch(html, /<\/?(?:script|iframe|style|img)\b|href="(?:javascript:|data:)|\/Users\/sagkrish\/|::inbox-item/i);
    assert.match(html, /<pre><code/);
  }
  assert.equal(questionHeadings.length, SENIOR_JAVA_DAILY_SETS.reduce((total, set) => total + (set.questionCount ?? 12), 0));
  assert.equal(new Set(questionHeadings).size, questionHeadings.length, "all question scenarios remain distinct");
});
