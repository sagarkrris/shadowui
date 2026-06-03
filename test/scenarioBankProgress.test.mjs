import assert from "node:assert/strict";
import test from "node:test";

import {
  SCENARIO_BANK_STORAGE_KEY,
  buildScenarioInterviewPlan,
  createScenarioBankProgress,
  estimateScenarioCoverage,
  recordScenarioBankAttempt,
} from "../lib/scenarioBank.mjs";

test("scenario bank exposes a versioned storage key and 1000+ coverage estimate", () => {
  assert.equal(SCENARIO_BANK_STORAGE_KEY, "interviewiq:scenario-bank:v1");
  assert.ok(estimateScenarioCoverage().total >= 1000);
  assert.ok(estimateScenarioCoverage({ track: "database", engine: "postgresql" }).total >= 100);
});

test("scenario bank progress records attempts and mastery per scenario", () => {
  const progress = recordScenarioBankAttempt(createScenarioBankProgress(), {
    id: "redis-cache-stampede",
    track: "database",
    engine: "redis",
    topic: "caching-patterns",
    difficulty: "Senior",
  }, { outcome: "mastered" });

  assert.equal(progress.scenarios["redis-cache-stampede"].attempts, 1);
  assert.equal(progress.scenarios["redis-cache-stampede"].mastered, true);
  assert.equal(progress.summary.mastered, 1);
  assert.equal(progress.summary.attempted, 1);
});

test("scenario interview plan prioritizes unseen or weak scenarios for selected filters", () => {
  const progress = recordScenarioBankAttempt(createScenarioBankProgress(), {
    id: "java-thread-pool-saturation",
    track: "java",
    topic: "concurrency",
    difficulty: "Senior",
  }, { outcome: "needsReview" });

  const plan = buildScenarioInterviewPlan({
    progress,
    state: { track: "java", topic: "concurrency", difficulty: "Senior" },
    count: 3,
  });

  assert.equal(plan.trackLabel, "Java");
  assert.ok(plan.items.length >= 1);
  assert.equal(plan.items[0].scenario.id, "java-thread-pool-saturation");
  assert.match(plan.prompt, /daily interview plan/i);
  assert.match(plan.prompt, /Thread Pool Saturation/i);
});
