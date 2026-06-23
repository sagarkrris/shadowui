import assert from "node:assert/strict";
import test from "node:test";

import {
  INTERVIEW_READY_QA_CATEGORIES,
  buildInterviewReadyMockPrompt,
  buildInterviewReadyTailorPrompt,
  getInterviewReadyQuestion,
  listInterviewReadyQuestions,
} from "../lib/interviewReadyQa.mjs";

test("interview ready Q&A exposes curated categories and searchable questions", () => {
  assert.ok(INTERVIEW_READY_QA_CATEGORIES.length >= 5);

  const javaMatches = listInterviewReadyQuestions({ search: "ConcurrentHashMap" });
  assert.equal(javaMatches.length, 1);
  assert.equal(javaMatches[0].id, "hashmap-vs-concurrenthashmap");

  const seniorDesign = listInterviewReadyQuestions({ categoryId: "system-design", difficulty: "Senior" });
  assert.equal(seniorDesign.length, 1);
  assert.equal(seniorDesign[0].id, "rate-limiter-design");
});

test("tailor prompt preserves polished answer expectations", () => {
  const prompt = buildInterviewReadyTailorPrompt("spring-transactional-boundaries", {
    position: "Java Backend Engineer",
    experience: "3-5 years",
    stack: "Java, Spring Boot, PostgreSQL",
  });

  assert.match(prompt, /polished, interview-ready answer/i);
  assert.match(prompt, /helps me ace the round/i);
  assert.match(prompt, /\*\*Interview-Ready Polished Answer\*\*/);
  assert.match(prompt, /Mistakes To Avoid/);
  assert.match(prompt, /Java Backend Engineer/);
});

test("mock prompt asks for a scored follow-up drill", () => {
  const question = getInterviewReadyQuestion("ownership-conflict");
  const prompt = buildInterviewReadyMockPrompt(question.id);

  assert.match(prompt, /Run a focused interview mock/i);
  assert.match(prompt, /Ask the question first and wait for my answer/i);
  assert.match(prompt, /score me on correctness, depth, communication, trade-offs, and executive clarity/i);
});
