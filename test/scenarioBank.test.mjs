import assert from "node:assert/strict";
import test from "node:test";

import {
  DATABASE_ENGINES,
  SCENARIO_BANK_TRACKS,
  buildScenarioAnswerPrompt,
  buildScenarioMockPrompt,
  buildScenarioVariantPrompt,
  buildLocalScenarioVariant,
  createScenarioBankState,
  getScenarioSeed,
  listScenarioBankTopics,
  listScenarioSeeds,
} from "../lib/scenarioBank.mjs";

test("scenario bank exposes Java and database tracks with supported engines", () => {
  assert.ok(SCENARIO_BANK_TRACKS.some((track) => track.key === "java"));
  assert.ok(SCENARIO_BANK_TRACKS.some((track) => track.key === "database"));
  assert.deepEqual(DATABASE_ENGINES.map((engine) => engine.key), ["postgresql", "mysql", "mongodb", "redis"]);
});

test("normalizes scenario bank state with safe defaults and selected database engines", () => {
  const databaseState = createScenarioBankState({
    track: "database",
    engine: "mongodb",
    topic: "document-modeling",
    difficulty: "Senior",
    mode: "Mock Interview",
  });

  assert.equal(databaseState.track, "database");
  assert.equal(databaseState.engine, "mongodb");
  assert.equal(databaseState.topic, "document-modeling");
  assert.equal(databaseState.difficulty, "Senior");
  assert.equal(databaseState.mode, "Mock Interview");

  const fallbackState = createScenarioBankState({
    track: "unknown",
    engine: "oracle",
    topic: "missing",
    difficulty: "Principal",
    mode: "Exam",
  });

  assert.equal(fallbackState.track, "java");
  assert.equal(fallbackState.engine, "postgresql");
  assert.equal(fallbackState.topic, "core-java");
  assert.equal(fallbackState.difficulty, "Mid");
  assert.equal(fallbackState.mode, "Learn");
});

test("lists topics and local seeds for Java and selected database engines", () => {
  assert.ok(listScenarioBankTopics("java").some((topic) => topic.key === "concurrency"));
  assert.ok(listScenarioBankTopics("database", "postgresql").some((topic) => topic.key === "indexes"));
  assert.ok(listScenarioBankTopics("database", "mysql").some((topic) => topic.key === "transactions"));
  assert.ok(listScenarioBankTopics("database", "mongodb").some((topic) => topic.key === "document-modeling"));
  assert.ok(listScenarioBankTopics("database", "redis").some((topic) => topic.key === "caching-patterns"));

  assert.ok(listScenarioSeeds(createScenarioBankState()).length > 0);
  assert.ok(listScenarioSeeds({ track: "java", topic: "concurrency" }).length > 0);
  assert.ok(listScenarioSeeds({ track: "database", engine: "postgresql" }).some((seed) => seed.engine === "postgresql"));
  assert.ok(listScenarioSeeds({ track: "database", engine: "mongodb" }).some((seed) => seed.engine === "mongodb"));
  assert.equal(getScenarioSeed("java-thread-pool-saturation").id, "java-thread-pool-saturation");
});

test("scenario seeds include detailed local answer guidance", () => {
  const seed = getScenarioSeed("redis-cache-stampede");

  assert.match(seed.prompt, /cache/i);
  assert.ok(seed.answerOutline.length >= 3);
  assert.match(seed.deepDive, /lock|jitter|refresh/i);
  assert.ok(seed.traps.some((trap) => /TTL|lock|cache/i.test(trap)));
  assert.ok(seed.followUps.length >= 2);
  assert.ok(seed.rubric.some((item) => /trade|failure|correct/i.test(item)));
});

test("builds fresh local scenario variants without requiring AI", () => {
  const seed = getScenarioSeed("java-thread-pool-saturation");
  const variant = buildLocalScenarioVariant(seed, {
    difficulty: "Senior",
    mode: "Timed Drill",
  }, {
    variantIndex: 2,
  });

  assert.equal(variant.id, "java-thread-pool-saturation-local-variant-3");
  assert.equal(variant.generated, true);
  assert.equal(variant.track, seed.track);
  assert.equal(variant.topic, seed.topic);
  assert.equal(variant.difficulty, "Senior");
  assert.match(variant.title, /Fresh Variant/);
  assert.notEqual(variant.prompt, seed.prompt);
  assert.match(variant.prompt, /thread pool|checkout|Spring Boot/i);
  assert.ok(variant.answerOutline.length >= seed.answerOutline.length);
  assert.ok(variant.traps.some((trap) => /original scenario/i.test(trap)));
  assert.ok(variant.followUps.some((followUp) => /evidence/i.test(followUp)));
});

test("builds prompts for real-time variants, answer expansion, and mock practice", () => {
  const state = createScenarioBankState({
    track: "database",
    engine: "postgresql",
    topic: "indexes",
    difficulty: "Senior",
    mode: "Timed Drill",
  });
  const seed = getScenarioSeed("postgresql-composite-index-dashboard");

  const variantPrompt = buildScenarioVariantPrompt(state);
  assert.match(variantPrompt, /PostgreSQL/);
  assert.match(variantPrompt, /indexes/i);
  assert.match(variantPrompt, /Senior/);
  assert.match(variantPrompt, /realistic scenario/i);
  assert.match(variantPrompt, /traps/i);
  assert.match(variantPrompt, /follow-ups/i);
  assert.match(variantPrompt, /rubric/i);

  const answerPrompt = buildScenarioAnswerPrompt(seed, state);
  assert.match(answerPrompt, /Deep-dive answer/i);
  assert.match(answerPrompt, /PostgreSQL/);
  assert.match(answerPrompt, /composite index/i);

  const mockPrompt = buildScenarioMockPrompt(seed, state);
  assert.match(mockPrompt, /mock interview/i);
  assert.match(mockPrompt, /one question at a time/i);
  assert.match(mockPrompt, /PostgreSQL/);
});
