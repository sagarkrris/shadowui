import assert from "node:assert/strict";
import test from "node:test";

import { FRESHER_DSA_PROBLEMS, getFresherDsaDailyPlan, getFresherDsaProblem, getSpacedReviewQueue, scoreFresherDsaAttempt } from "../lib/fresherDsaProblems.mjs";

test("fresher DSA problem bank includes progressive hints, solutions, and tests", () => {
  assert.equal(FRESHER_DSA_PROBLEMS.length, 75);
  assert.ok(FRESHER_DSA_PROBLEMS.every((problem) => problem.hints.length === 3 && problem.pseudocode && problem.solution && problem.tests.length >= 2));
  assert.equal(getFresherDsaProblem("two-sum").pattern, "Arrays & Hashing");
  assert.equal(getFresherDsaDailyPlan(1).length, 2);
});

test("spaced review prioritizes never-reviewed and mistake-heavy problems", () => {
  const queue = getSpacedReviewQueue(FRESHER_DSA_PROBLEMS.slice(0, 3), {
    "two-sum": { reviewedAt: "2020-01-01T00:00:00.000Z", attempts: 2, mistakes: 1 },
  }, new Date("2026-01-01T00:00:00.000Z"));
  assert.equal(queue.length, 3);
  assert.ok(queue.filter((entry) => entry.due).length >= 2);
});

test("fresher DSA attempt score rewards independent interview readiness", () => {
  assert.equal(scoreFresherDsaAttempt({ solved: true, hintLevel: 0, explained: true, complexity: true, edgeCases: true }), 100);
  assert.ok(scoreFresherDsaAttempt({ solved: true, hintLevel: 2 }) > scoreFresherDsaAttempt({ hintLevel: 3 }));
});
