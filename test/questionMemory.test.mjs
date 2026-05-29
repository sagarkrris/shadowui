import assert from "node:assert/strict";
import test from "node:test";

import {
  QUESTION_MEMORY_STORAGE_KEY,
  buildMasteryMap,
  loadQuestionMemory,
  prioritizePracticeCards,
  recordQuestionAttempt,
  saveQuestionMemory,
} from "../lib/questionMemory.mjs";

function memoryStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

test("saves and loads question memory with the versioned localStorage key", () => {
  const storage = memoryStorage();
  const memory = {
    questions: {
      "react-render-performance": {
        questionId: "react-render-performance",
        status: "Improving",
        attemptCount: 1,
        attempts: [{ score: 7, attemptedAt: "2026-05-29T08:00:00.000Z" }],
      },
    },
  };

  assert.equal(saveQuestionMemory(storage, memory), true);
  assert.equal(JSON.parse(storage.getItem(QUESTION_MEMORY_STORAGE_KEY)).version, 1);
  assert.deepEqual(loadQuestionMemory(storage).questions["react-render-performance"].attempts[0].score, 7);
});

test("records question attempts and updates mastery metadata", () => {
  const storage = memoryStorage();

  const first = recordQuestionAttempt(storage, {
    questionId: "spring-security-jwt",
    question: "How would you secure a Spring Boot REST API with JWT?",
    packId: "spring-boot",
    topic: "Spring Security",
    stack: "Java, Spring Boot",
    score: 4,
    attemptedAt: "2026-05-28T10:00:00.000Z",
  });
  const second = recordQuestionAttempt(storage, {
    questionId: "spring-security-jwt",
    score: 8,
    attemptedAt: "2026-05-29T10:00:00.000Z",
  });

  assert.equal(first.questions["spring-security-jwt"].status, "Needs Review");
  assert.equal(second.questions["spring-security-jwt"].attemptCount, 2);
  assert.equal(second.questions["spring-security-jwt"].lastScore, 8);
  assert.equal(second.questions["spring-security-jwt"].bestScore, 8);
  assert.equal(loadQuestionMemory(storage).questions["spring-security-jwt"].status, "Improving");
});

test("builds a mastery map with New, Needs Review, Improving, and Mastered statuses", () => {
  const mastery = buildMasteryMap({
    questions: {
      needs: {
        questionId: "needs",
        attempts: [{ score: 4, attemptedAt: "2026-05-29T08:00:00.000Z" }],
      },
      improving: {
        questionId: "improving",
        attempts: [
          { score: 5, attemptedAt: "2026-05-28T08:00:00.000Z" },
          { score: 7, attemptedAt: "2026-05-29T08:00:00.000Z" },
        ],
      },
      mastered: {
        questionId: "mastered",
        attempts: [
          { score: 9, attemptedAt: "2026-05-28T08:00:00.000Z" },
          { score: 8, attemptedAt: "2026-05-29T08:00:00.000Z" },
        ],
      },
    },
  }, [
    { id: "new-card", question: "New card" },
    { id: "needs", question: "Needs card" },
    { id: "improving", question: "Improving card" },
    { id: "mastered", question: "Mastered card" },
  ], { now: "2026-05-29T12:00:00.000Z" });

  assert.equal(mastery.byQuestionId["new-card"].status, "New");
  assert.equal(mastery.byQuestionId.needs.status, "Needs Review");
  assert.equal(mastery.byQuestionId.improving.status, "Improving");
  assert.equal(mastery.byQuestionId.mastered.status, "Mastered");
  assert.equal(mastery.summary.total, 4);
  assert.equal(mastery.summary.byStatus.Mastered, 1);
});

test("marks stale non-mastered attempts as due for review", () => {
  const mastery = buildMasteryMap({
    questions: {
      stale: {
        questionId: "stale",
        attempts: [{ score: 7, attemptedAt: "2026-05-15T08:00:00.000Z" }],
      },
    },
  }, [{ id: "stale", question: "Stale card" }], { now: "2026-05-29T08:00:00.000Z" });

  assert.equal(mastery.byQuestionId.stale.status, "Needs Review");
  assert.equal(mastery.byQuestionId.stale.dueForReview, true);
});

test("prioritizes practice cards by memory status while keeping mastered cards last", () => {
  const cards = [
    { id: "mastered", question: "Mastered" },
    { id: "new-card", question: "New" },
    { id: "improving", question: "Improving" },
    { id: "needs", question: "Needs" },
  ];
  const mastery = {
    byQuestionId: {
      mastered: { status: "Mastered" },
      improving: { status: "Improving" },
      needs: { status: "Needs Review" },
    },
  };

  assert.deepEqual(
    prioritizePracticeCards(cards, mastery).map((card) => `${card.id}:${card.masteryStatus}`),
    ["needs:Needs Review", "improving:Improving", "new-card:New", "mastered:Mastered"],
  );
});
