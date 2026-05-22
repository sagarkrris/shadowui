import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCompanyMockPrompt,
  deriveWeakSpots,
  getCompanyPrep,
} from "../lib/companyPrep.mjs";

test("returns seeded Amazon company prep with questions and sources", () => {
  const prep = getCompanyPrep("Amazon");

  assert.equal(prep.company, "Amazon");
  assert.ok(prep.dsa.length >= 4);
  assert.ok(prep.systemDesign.length >= 4);
  assert.ok(prep.behavioral.length >= 4);
  assert.ok(prep.resources.every((resource) => resource.url.startsWith("https://")));
});

test("falls back to a generic company prep shape for unknown companies", () => {
  const prep = getCompanyPrep("Stripe");

  assert.equal(prep.company, "Stripe");
  assert.equal(prep.isSeeded, false);
  assert.ok(prep.resources.some((resource) => resource.url.includes("leetcode.com")));
});

test("builds a mock interview prompt from a company question", () => {
  const prompt = buildCompanyMockPrompt({
    company: "Amazon",
    type: "DSA",
    title: "Top K Frequent Elements",
    prompt: "Given a stream of items, return the top K most frequent values.",
  });

  assert.match(prompt, /Amazon/);
  assert.match(prompt, /Top K Frequent Elements/);
  assert.match(prompt, /one question at a time/i);
});

test("derives weak spots from assistant feedback messages", () => {
  const weakSpots = deriveWeakSpots([
    { role: "assistant", content: "**Gaps:** Missed edge cases and did not discuss trade-offs." },
    { role: "assistant", content: "**Gaps:** Complexity analysis was shallow." },
  ]);

  assert.deepEqual(weakSpots.slice(0, 3), ["Edge cases", "Trade-offs", "Complexity analysis"]);
});
