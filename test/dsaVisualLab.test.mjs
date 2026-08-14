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
import {
  buildDsaDrillComparison,
  buildDsaDrillMockPrompt,
  buildDsaInterviewChallengeMockPrompt,
  getDsaDrillQuestion,
  listDsaInterviewChallenges,
  listDsaDrillQuestions,
} from "../lib/dsaDrillRoom.mjs";
import {
  buildDsaBigOChart,
  buildDsaPatternDecisionTree,
  listDsaOperationComplexities,
  listDsaComplexityCheats,
  listDsaPatternAtlas,
  listDsaVisualPlaygroundModules,
} from "../lib/dsaPatternAtlas.mjs";

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

test("builds deterministic DSA drill room questions with structured ideal answers", () => {
  const drills = listDsaDrillQuestions({ stack: "Java, Spring Boot" });
  const hashing = getDsaDrillQuestion("drill-hashing", { stack: "Java, Spring Boot" });

  assert.ok(drills.length >= 8);
  assert.equal(hashing.id, "drill-hashing");
  assert.match(hashing.question, /Hashing/i);
  assert.equal(hashing.answer.code.language, "Java");
  assert.match(hashing.answer.pattern, /Hashing/);
  assert.match(hashing.answer.bruteForce, /brute force/i);
  assert.match(hashing.answer.optimalApproach, /invariant/i);
  assert.ok(hashing.answer.edgeCases.length >= 3);
  assert.match(hashing.answer.complexity, /O\(n\)/);
  assert.match(buildDsaDrillMockPrompt(hashing), /wait for my answer/i);
});

test("compares a user's DSA drill answer against the local rubric", () => {
  const drill = getDsaDrillQuestion("drill-hashing", { stack: "Java, Spring Boot" });
  const strong = buildDsaDrillComparison({
    drill,
    response: "I would use a hash map. The invariant is that seen only contains previous values, then I dry run duplicates and empty input. Complexity is O(n) time and O(n) space.",
  });
  const weak = buildDsaDrillComparison({ drill, response: "I loop through the array." });

  assert.ok(strong.score > weak.score);
  assert.ok(strong.checks.some((check) => check.label === "Pattern" && check.covered));
  assert.ok(strong.checks.some((check) => check.label === "Complexity" && check.covered));
  assert.ok(weak.checks.some((check) => !check.covered));
  assert.match(strong.summary, /ready|close/i);
});

test("builds deterministic DSA interview challenges across mcq coding and quantitative types", () => {
  const challenges = listDsaInterviewChallenges({ stack: "Java, Spring Boot" });
  const types = new Set(challenges.map((challenge) => challenge.type));
  const hashingMcq = challenges.find((challenge) => challenge.lessonId === "hashing" && challenge.type === "mcq");
  const codingChallenge = challenges.find((challenge) => challenge.type === "coding");
  const quantitativeChallenge = challenges.find((challenge) => challenge.type === "quantitative");

  assert.ok(challenges.length >= 40);
  assert.ok(types.has("mcq"));
  assert.ok(types.has("coding"));
  assert.ok(types.has("quantitative"));
  assert.ok(challenges.every((challenge) => challenge.choices.length === 4));
  assert.ok(challenges.every((challenge) => challenge.choices.some((choice) => choice.id === challenge.correctChoiceId)));
  assert.ok(challenges.every((challenge) => challenge.explanation.length > 20));
  assert.ok(challenges.some((challenge) => challenge.tricky));
  assert.match(hashingMcq.prompt, /Hashing|hash/i);
  assert.match(codingChallenge.codeSnippet, /function|class|def|Map|for/i);
  assert.match(quantitativeChallenge.prompt, /complexity|how many|Big-O|space/i);
  assert.match(buildDsaInterviewChallengeMockPrompt(codingChallenge), /coding/i);
});

test("builds a beginner-friendly DSA pattern atlas with decision and complexity guides", () => {
  const patterns = listDsaPatternAtlas();
  const tree = buildDsaPatternDecisionTree();
  const complexity = listDsaComplexityCheats();
  const slidingWindow = patterns.find((pattern) => pattern.id === "sliding-window");

  assert.ok(patterns.length >= 12);
  assert.ok(slidingWindow);
  assert.match(slidingWindow.beginnerMeaning, /contiguous|window/i);
  assert.ok(slidingWindow.visualHint.items.length >= 3);
  assert.ok(slidingWindow.whenToUse.length >= 3);
  assert.ok(slidingWindow.examples.some((example) => /substring|subarray/i.test(example)));
  assert.ok(slidingWindow.pitfalls.length >= 2);
  assert.equal(slidingWindow.drillId, "drill-two-pointers");
  assert.match(tree.title, /Pattern Identifier/i);
  assert.ok(tree.steps.some((step) => /pair|two pointers|hashing/i.test(`${step.question} ${step.yes} ${step.no}`)));
  assert.ok(tree.steps.some((step) => /subarray|sliding window|prefix/i.test(`${step.question} ${step.yes} ${step.no}`)));
  assert.ok(complexity.some((row) => row.structure === "Array"));
  assert.ok(complexity.some((row) => row.structure === "HashMap"));
});

test("builds a visual playground and Big-O cheat sheet for data structures", () => {
  const modules = listDsaVisualPlaygroundModules();
  const bigO = buildDsaBigOChart();
  const operations = listDsaOperationComplexities();
  const moduleTitles = modules.map((module) => module.title);

  assert.ok(modules.length >= 12);
  assert.ok(moduleTitles.includes("ArrayList"));
  assert.ok(moduleTitles.includes("Linked List"));
  assert.ok(moduleTitles.includes("Hash Table"));
  assert.ok(moduleTitles.includes("Binary Heap"));
  assert.ok(moduleTitles.includes("Union-Find DS"));
  assert.ok(moduleTitles.includes("Sorting Algorithms"));
  assert.ok(modules.every((module) => module.beginnerMeaning.length > 20));
  assert.ok(modules.every((module) => module.visualModel.items.length >= 3));
  assert.ok(modules.every((module) => module.operations.length >= 2));

  assert.match(bigO.title, /Big-O Cheat Sheet/i);
  assert.ok(bigO.curves.some((curve) => curve.label === "O(1)" && /Excellent/i.test(curve.rating)));
  assert.ok(bigO.curves.some((curve) => curve.label === "O(n log n)"));
  assert.ok(bigO.curves.some((curve) => curve.label === "O(2^n)" && /Horrible/i.test(curve.rating)));
  assert.ok(bigO.rules.some((rule) => /drop constants/i.test(rule.toLowerCase())));

  assert.ok(operations.length >= 10);
  assert.ok(operations.some((row) => row.structure === "ArrayList" && row.access.average === "O(1)"));
  assert.ok(operations.some((row) => row.structure === "Hash Table" && row.search.average === "O(1) avg"));
  assert.ok(operations.some((row) => row.structure === "Binary Heap" && row.insert.average === "O(log n)"));
  assert.ok(operations.some((row) => row.structure === "Skip List"));
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
  assert.match(source, /Fresher DSA Path/);
  assert.match(source, /FRESHER_DSA_PLAYBOOK/);
  assert.match(source, /Constraint map/);
  assert.match(source, /Pattern recognition cards/);
  assert.match(source, /Progressive practice and mock interviews/);
  assert.match(source, /Guided Mode/);
  assert.match(source, /Learn/);
  assert.match(source, /Learning Path/);
  assert.match(source, /Start With The Picture/);
  assert.match(source, /Build One Tiny Version/);
  assert.match(source, /Answer Like An Interviewer Expects/);
  assert.match(source, /Pattern modules/);
  assert.match(source, /Beginner ladder/);
  assert.match(source, /Most-Asked DSA Classroom/);
  assert.match(source, /A teacher-style visual script for the highest-frequency interview problem set/);
  assert.match(source, /Search problem/);
  assert.match(source, /Teacher board/);
  assert.match(source, /Classroom solve script/);
  assert.match(source, /Teach this/);
  assert.match(source, /Open visualizer/);
  assert.match(source, /When you see it/);
  assert.match(source, /Solve it like this/);
  assert.match(source, /Say out loud/);
  assert.match(source, /Edge check/);
  assert.match(source, /Visualize/);
  assert.match(source, /Frame Debugger/);
  assert.match(source, /DSA Execution Replay/);
  assert.match(source, /pointer movement/i);
  assert.match(source, /stack\/queue growth/i);
  assert.match(source, /recursion call stack/i);
  assert.match(source, /DP table filling/i);
  assert.match(source, /Why this step happened/);
  assert.match(source, /Before state/);
  assert.match(source, /After state/);
  assert.match(source, /Dry Run/);
  assert.match(source, /Play/);
  assert.match(source, /Pause/);
  assert.match(source, /Rewind/);
  assert.match(source, /Speed/);
  assert.match(source, /What changed/);
  assert.match(source, /What to say in interview/);
  assert.match(source, /State Panel/);
  assert.match(source, /Selected stack code/);
  assert.match(source, /Quiz/);
  assert.match(source, /Interview Challenges/);
  assert.match(source, /Refresh Questions/);
  assert.match(source, /Generated/);
  assert.match(source, /Local fallback/);
  assert.match(source, /MCQ/);
  assert.match(source, /Coding/);
  assert.match(source, /Quantitative/);
  assert.match(source, /Tricky interview/i);
  assert.match(source, /Pattern Atlas/);
  assert.match(source, /Pattern Identifier/);
  assert.match(source, /Beginner meaning/);
  assert.match(source, /When to use it/);
  assert.match(source, /Common pitfalls/);
  assert.match(source, /Complexity board/);
  assert.match(source, /DSA Visual Playground/);
  assert.match(source, /Learn visually/);
  assert.match(source, /Module map/);
  assert.match(source, /Big-O Cheat Sheet/);
  assert.match(source, /Growth curve/);
  assert.match(source, /Operation matrix/);
  assert.match(source, /ArrayList/);
  assert.match(source, /Hash Table/);
  assert.match(source, /Binary Heap/);
  assert.match(source, /Union-Find/);
  assert.match(source, /Sorting Algorithms/);
  assert.match(source, /Drill Room/);
  assert.match(source, /Reveal answer/);
  assert.match(source, /Compare my answer/);
  assert.match(source, /Ideal answer/);
  assert.match(source, /buildDsaDrillComparison/);
  assert.match(source, /Practice as Mock/);
  assert.match(source, /Blind 75 Visual Track/);
  assert.match(source, /Featured 15/);
  assert.match(source, /All 75/);
  assert.match(source, /Pattern visualizer/);
  assert.match(source, /Edge cases/);
  assert.match(source, /Problem Explorer/);
  assert.match(source, /Examples/);
  assert.match(source, /Constraints/);
  assert.match(source, /LeetCode-style prompt/);
  assert.match(source, /Open problem reader/);
});
