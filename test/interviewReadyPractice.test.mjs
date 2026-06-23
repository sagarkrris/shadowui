import assert from "node:assert/strict";
import test from "node:test";

import { createMemoryStorage, loadVersionedState, saveVersionedState } from "../lib/localStateStore.mjs";
import {
  INTERVIEW_READY_PRACTICE_STORAGE_VERSION,
  buildInterviewReadyCompanyPack,
  createInterviewReadyPracticeState,
  evaluateInterviewReadyAnswer,
  saveInterviewReadyAnswer,
} from "../lib/interviewReadyPractice.mjs";
import { getInterviewReadyQuestion } from "../lib/interviewReadyQa.mjs";

test("interview ready practice evaluator rewards direct, example-backed answers", () => {
  const question = getInterviewReadyQuestion("hashmap-vs-concurrenthashmap");
  const evaluation = evaluateInterviewReadyAnswer(
    "HashMap is fine for single-threaded code, but ConcurrentHashMap is better for shared mutable state because it gives safe concurrent access with better throughput than locking the whole map. For example, I would use ConcurrentHashMap for a request cache in a backend service, while still being careful with compound operations like check-then-act because those may need compute or extra coordination.",
    question,
  );

  assert.ok(evaluation.overall >= 6.5);
  assert.equal(evaluation.roboticSignals.length, 0);
  assert.ok(evaluation.strengths.length >= 2);
});

test("interview ready practice evaluator flags vague and robotic drafts", () => {
  const question = getInterviewReadyQuestion("ownership-conflict");
  const evaluation = evaluateInterviewReadyAnswer(
    "Firstly, basically, I would say it depends. Secondly, as we know, conflict is important. Thirdly, I kind of handled it somehow.",
    question,
  );

  assert.ok(evaluation.overall < 7);
  assert.ok(evaluation.roboticSignals.length >= 1);
  assert.ok(evaluation.vagueSignals.length >= 1);
});

test("interview ready practice state saves answers locally", () => {
  const storage = createMemoryStorage();
  const next = saveInterviewReadyAnswer(createInterviewReadyPracticeState(), {
    questionId: "hashmap-vs-concurrenthashmap",
    company: "Amazon",
    draft: "My saved answer",
    evaluation: { overall: 8.1 },
    durationSeconds: 61,
  });

  assert.equal(saveVersionedState(storage, {
    key: "practice",
    version: INTERVIEW_READY_PRACTICE_STORAGE_VERSION,
    value: next,
    normalize: createInterviewReadyPracticeState,
  }), true);

  const restored = loadVersionedState(storage, {
    key: "practice",
    version: INTERVIEW_READY_PRACTICE_STORAGE_VERSION,
    fallback: createInterviewReadyPracticeState(),
    normalize: createInterviewReadyPracticeState,
  });

  assert.equal(restored.answers["hashmap-vs-concurrenthashmap"].draft, "My saved answer");
  assert.equal(restored.answers["hashmap-vs-concurrenthashmap"].company, "Amazon");
});

test("company pack builder exposes company-specific practice packs", () => {
  const pack = buildInterviewReadyCompanyPack("Amazon");

  assert.equal(pack.company, "Amazon");
  assert.ok(pack.packs.length >= 3);
  assert.ok(pack.packs.every((item) => item.items.length >= 1));
});
