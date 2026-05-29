import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildDsaMockPrompt,
  buildDsaVisualizationState,
  getDsaVisualLesson,
  listDsaVisualLessons,
} from "../lib/dsaVisualLab.mjs";

test("lists the required interview DSA visual lessons", () => {
  const lessons = listDsaVisualLessons();
  const labels = lessons.map((lesson) => lesson.title);

  assert.ok(lessons.length >= 8);
  assert.ok(labels.includes("Arrays"));
  assert.ok(labels.includes("Strings"));
  assert.ok(labels.includes("Hashing"));
  assert.ok(labels.includes("Two Pointers"));
  assert.ok(labels.includes("Stack/Queue"));
  assert.ok(labels.includes("Trees"));
  assert.ok(labels.includes("Graph BFS/DFS"));
  assert.ok(labels.includes("DP Basics"));
});

test("returns the complete two pointers lesson sections", () => {
  const lesson = getDsaVisualLesson("two-pointers");

  assert.equal(lesson.id, "two-pointers");
  assert.equal(lesson.title, "Two Pointers");
  assert.ok(lesson.concept.includes("pointer"));
  assert.ok(lesson.memoryHook.length > 10);
  assert.ok(Array.isArray(lesson.steps));
  assert.ok(lesson.steps.length >= 3);
  assert.ok(lesson.codeTemplate.includes("function"));
  assert.match(lesson.complexity.time, /O\(/);
  assert.ok(lesson.quiz.question.includes("?"));
  assert.ok(lesson.mockPrompt.includes("Two Pointers"));
});

test("builds two pointer visualization steps with highlights and explanations", () => {
  const state = buildDsaVisualizationState("two-pointers", [1, 2, 3, 4]);

  assert.equal(state.lessonId, "two-pointers");
  assert.deepEqual(state.input, [1, 2, 3, 4]);
  assert.ok(state.steps.length >= 3);
  assert.deepEqual(state.steps[0].highlight, { left: 0, right: 3 });
  assert.equal(typeof state.steps[0].explanation, "string");
  assert.ok(state.steps[0].explanation.length > 20);
  assert.ok(state.steps.every((step) => step.memoryHook));
});

test("builds a mock prompt that coaches implementation and dry run", () => {
  const lesson = getDsaVisualLesson("two-pointers");
  const prompt = buildDsaMockPrompt(lesson);

  assert.match(prompt, /interview/i);
  assert.match(prompt, /dry run/i);
  assert.match(prompt, /code/i);
  assert.match(prompt, /complexity/i);
});

test("DsaVisualLab source exposes the required learning surfaces", () => {
  const source = readFileSync(new URL("../components/dsa/DsaVisualLab.js", import.meta.url), "utf8");

  assert.match(source, /DSA Visual Lab/);
  assert.match(source, /Visualize/);
  assert.match(source, /Dry Run/);
  assert.match(source, /Quiz/);
  assert.match(source, /Practice as Mock/);
});
