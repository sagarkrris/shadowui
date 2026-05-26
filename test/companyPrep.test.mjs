import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCompanyReadinessScore,
  buildQuestionBankRefreshState,
  buildCompanyMockPrompt,
  deriveWeakSpots,
  getCompanyPrep,
  markQuestionBankVerified,
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
  assert.ok(prep.resources.length >= 3);
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

test("builds local question bank refresh metadata without claiming live scraping", () => {
  const prep = getCompanyPrep("Amazon");
  const refresh = buildQuestionBankRefreshState({ prep, now: new Date("2026-05-26T12:00:00.000Z") });

  assert.equal(refresh.company, "Amazon");
  assert.equal(refresh.refreshedAt, "2026-05-26T12:00:00.000Z");
  assert.equal(refresh.sourceLinks.length, prep.resources.length);
  assert.equal(refresh.liveScraped, false);
  assert.match(refresh.note, /manual/i);
});

test("marks local question bank questions as verified and recent", () => {
  const state = buildQuestionBankRefreshState({
    prep: getCompanyPrep("Amazon"),
    now: new Date("2026-05-26T12:00:00.000Z"),
  });
  const verified = markQuestionBankVerified(state, {
    questionId: "DSA-Top K Frequent Elements",
    now: new Date("2026-05-26T12:05:00.000Z"),
  });

  assert.equal(verified.verifiedQuestions["DSA-Top K Frequent Elements"].status, "recent");
  assert.equal(verified.verifiedQuestions["DSA-Top K Frequent Elements"].verifiedAt, "2026-05-26T12:05:00.000Z");
});

test("builds a company readiness score from refresh verification mocks and fit signals", () => {
  const prep = getCompanyPrep("Amazon");
  const refresh = markQuestionBankVerified(
    buildQuestionBankRefreshState({ prep, now: new Date("2026-05-26T12:00:00.000Z") }),
    { questionId: "DSA-Top K Frequent Elements", now: new Date("2026-05-26T12:05:00.000Z") },
  );
  const readiness = buildCompanyReadinessScore({
    prep,
    refreshState: refresh,
    weakSpots: ["Trade-offs"],
    mockScores: [7, 8],
    resumeAnalysis: { score: 72 },
    jobDescriptionAnalysis: { score: 64 },
  });

  assert.ok(readiness.score > 0);
  assert.equal(readiness.company, "Amazon");
  assert.ok(readiness.factors.some((factor) => factor.label === "Verified local bank"));
  assert.ok(readiness.factors.some((factor) => factor.label === "Mock average"));
  assert.match(readiness.nextActionPrompt, /Amazon/);
});
