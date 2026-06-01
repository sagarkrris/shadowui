import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildDsaExplainThenCodeCoach,
  buildDsaMockPrompt,
  buildDsaThinkingSystem,
  buildDsaVisualizationState,
  getDsaCodeTemplate,
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
  assert.ok(state.steps.every((step) => step.narration));
  assert.ok(state.steps.every((step) => step.changed));
  assert.ok(state.steps.every((step) => step.invariant));
  assert.ok(state.steps.every((step) => step.interviewScript));
  assert.ok(state.steps.every((step) => step.sidePanel?.title));
  assert.equal(state.steps[0].sidePanel.kind, "pointers");
});

test("builds a mock prompt that coaches implementation and dry run", () => {
  const lesson = getDsaVisualLesson("two-pointers");
  const prompt = buildDsaMockPrompt(lesson);

  assert.match(prompt, /interview/i);
  assert.match(prompt, /dry run/i);
  assert.match(prompt, /code/i);
  assert.match(prompt, /complexity/i);
});

test("returns selected-stack code templates for DSA lessons", () => {
  const java = getDsaCodeTemplate("two-pointers", "Java, Spring Boot");
  const python = getDsaCodeTemplate("two-pointers", "Python, FastAPI");
  const javascript = getDsaCodeTemplate("two-pointers", "React, Node.js");
  const ruby = getDsaCodeTemplate("two-pointers", "Ruby on Rails");
  const rust = getDsaCodeTemplate("two-pointers", "Rust");
  const rubyHashing = getDsaCodeTemplate("hashing", "Ruby on Rails");
  const rustHashing = getDsaCodeTemplate("hashing", "Rust");

  assert.match(java.language, /Java/);
  assert.match(java.code, /class Solution/);
  assert.match(java.code, /int\[\]/);
  assert.match(python.language, /Python/);
  assert.match(python.code, /def solve_two_pointers/);
  assert.match(javascript.language, /JavaScript/);
  assert.match(javascript.code, /function solveTwoPointers/);
  assert.match(ruby.language, /Ruby/);
  assert.match(ruby.code, /def solve_two_pointers/);
  assert.match(ruby.code, /end/);
  assert.match(rust.language, /Rust/);
  assert.match(rust.code, /impl Solution/);
  assert.match(rust.code, /Vec<i32>/);
  assert.equal(rubyHashing.language, "Ruby");
  assert.match(rubyHashing.code, /def two_sum/);
  assert.doesNotMatch(rubyHashing.code, /function twoSum/);
  assert.equal(rustHashing.language, "Rust");
  assert.match(rustHashing.code, /HashMap/);
  assert.doesNotMatch(rustHashing.code, /function twoSum/);
});

test("builds Blind 75 visualization states with pattern panels", () => {
  const twoSum = buildDsaVisualizationState("blind75-two-sum");
  const binarySearch = buildDsaVisualizationState("blind75-binary-search");

  assert.equal(twoSum.lessonId, "blind75-two-sum");
  assert.equal(twoSum.steps[0].sidePanel.kind, "map");
  assert.match(twoSum.steps[0].invariant, /lookup|map|seen/i);
  assert.ok(twoSum.steps.every((step) => step.narration));

  assert.equal(binarySearch.lessonId, "blind75-binary-search");
  assert.equal(binarySearch.steps[0].sidePanel.kind, "binary-search");
  assert.ok(binarySearch.steps.some((step) => step.highlight.mid !== undefined));
});

test("Blind 75 visual lessons expose trainer metadata", () => {
  const lesson = getDsaVisualLesson("blind75-two-sum");

  assert.equal(lesson.blind75, true);
  assert.ok(lesson.masteryChecklist.some((step) => step.id === "visualize"));
  assert.ok(lesson.testCases.some((testCase) => testCase.type === "edge"));
  assert.ok(lesson.codeWalkthrough.some((step) => /Map|lookup|complement/i.test(step.codeCue)));
});

test("returns selected-stack code templates for Blind 75 problems", () => {
  const java = getDsaCodeTemplate("blind75-two-sum", "Java, Spring Boot");
  const python = getDsaCodeTemplate("blind75-valid-palindrome", "Python, FastAPI");
  const javascript = getDsaCodeTemplate("blind75-longest-substring-without-repeating-characters", "React, Node.js");

  assert.equal(java.language, "Java");
  assert.match(java.code, /twoSum/);
  assert.match(java.code, /HashMap/);
  assert.equal(python.language, "Python");
  assert.match(python.code, /valid_palindrome/);
  assert.equal(javascript.language, "JavaScript");
  assert.match(javascript.code, /lengthOfLongestSubstring/);
});

test("builds Explain-Then-Code coaching from an approach explanation and selected stack", () => {
  assert.equal(typeof buildDsaExplainThenCodeCoach, "function");

  const strong = buildDsaExplainThenCodeCoach({
    lesson: getDsaVisualLesson("blind75-two-sum"),
    stack: "Java, Spring Boot",
    explanation: "I use a HashMap. The invariant is that the map contains only previous numbers and their indexes. I handle empty input and duplicate values. Time is O(n), space is O(n), and the trade-off is memory for faster lookup compared with sorting.",
  });

  assert.equal(strong.title, "Explain-Then-Code Mode");
  assert.deepEqual(
    strong.flow.map((item) => item.label),
    ["Explain approach", "Judge explanation", "Show code template", "Quiz edge cases"],
  );
  assert.equal(strong.code.language, "Java");
  assert.match(strong.code.code, /HashMap|class Solution/);
  assert.ok(strong.judge.score >= 90);
  assert.ok(strong.judge.checks.every((check) => check.covered));
  assert.ok(strong.edgeQuiz.length >= 3);
  assert.ok(strong.edgeQuiz.some((item) => item.type === "edge"));

  const weak = buildDsaExplainThenCodeCoach({
    lesson: getDsaVisualLesson("blind75-two-sum"),
    stack: "Java, Spring Boot",
    explanation: "I loop and use a map.",
  });

  assert.ok(weak.judge.score < strong.judge.score);
  assert.ok(weak.judge.checks.some((check) => !check.covered));
  assert.match(weak.nextPrompt, /Explain-Then-Code Mode/);
});

test("builds a beginner DSA Thinking System with selected-stack approach and code", () => {
  assert.equal(typeof buildDsaThinkingSystem, "function");

  const thinkingSystem = buildDsaThinkingSystem({
    lesson: getDsaVisualLesson("blind75-two-sum"),
    stack: "Java, Spring Boot, React",
  });

  assert.equal(thinkingSystem.title, "DSA Thinking System");
  assert.deepEqual(
    thinkingSystem.steps.map((step) => step.label),
    [
      "Understand the problem",
      "Say brute force first",
      "Detect the pattern",
      "Build the invariant",
      "Dry run before code",
      "Write code skeleton",
      "Test like an interviewer",
      "Explain complexity",
    ],
  );
  assert.ok(thinkingSystem.steps.every((step) => step.coach.length > 20));
  assert.ok(thinkingSystem.patternSignals.length >= 3);
  assert.ok(thinkingSystem.patternSignals.some((signal) => /lookup|seen|map|hash/i.test(signal)));
  assert.ok(thinkingSystem.edgeCases.length >= 3);
  assert.equal(thinkingSystem.code.language, "Java");
  assert.match(thinkingSystem.code.code, /class Solution|HashMap/);
  assert.match(thinkingSystem.interviewScript, /input|output|constraints/i);
  assert.match(thinkingSystem.interviewScript, /brute force/i);
  assert.match(thinkingSystem.interviewScript, /pattern/i);
  assert.match(thinkingSystem.interviewScript, /invariant/i);
  assert.match(thinkingSystem.interviewScript, /dry run/i);
  assert.match(thinkingSystem.interviewScript, /complexity/i);
  assert.match(thinkingSystem.mockPrompt, /DSA Thinking System/);
});

test("DsaVisualLab source exposes the required learning surfaces", () => {
  const source = readFileSync(new URL("../components/dsa/DsaVisualLab.js", import.meta.url), "utf8");

  assert.match(source, /DSA Visual Lab/);
  assert.match(source, /DSA Thinking System/);
  assert.match(source, /buildDsaThinkingSystem/);
  assert.match(source, /How To Approach/);
  assert.match(source, /Understand the problem/);
  assert.match(source, /Say brute force first/);
  assert.match(source, /Detect the pattern/);
  assert.match(source, /Build the invariant/);
  assert.match(source, /Dry run before code/);
  assert.match(source, /Write code skeleton/);
  assert.match(source, /Test like an interviewer/);
  assert.match(source, /Explain complexity/);
  assert.match(source, /Interview Pattern Theater/);
  assert.match(source, /Guided Mode/);
  assert.match(source, /Learn/);
  assert.match(source, /Visualize/);
  assert.match(source, /Dry Run/);
  assert.match(source, /Play/);
  assert.match(source, /Pause/);
  assert.match(source, /Speed/);
  assert.match(source, /What changed/);
  assert.match(source, /What to say in interview/);
  assert.match(source, /State Panel/);
  assert.match(source, /Selected stack code/);
  assert.match(source, /Quiz/);
  assert.match(source, /Practice as Mock/);
  assert.match(source, /Blind 75 Visual Track/);
  assert.match(source, /Featured 15/);
  assert.match(source, /All 75/);
  assert.match(source, /Pattern visualizer/);
  assert.match(source, /Edge cases/);
});
