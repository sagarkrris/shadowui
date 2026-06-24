import assert from "node:assert/strict";
import test from "node:test";

import {
  FEATURED_BLIND75_IDS,
  buildDsaProgressSummary,
  createDsaConfidenceState,
  DSA_CONFIDENCE_STORAGE_KEY,
  filterBlind75Problems,
  getBlind75Problem,
  getBlind75ProblemCodeTemplate,
  listBlind75Problems,
  listBlind75Visualizers,
  recordDsaMasteryStep,
  recordDsaMistake,
} from "../lib/blind75VisualTrack.mjs";

test("Blind 75 track contains complete original metadata", () => {
  const problems = listBlind75Problems();

  assert.equal(problems.length, 75);
  assert.equal(new Set(problems.map((problem) => problem.id)).size, 75);
  assert.equal(FEATURED_BLIND75_IDS.length, 15);

  for (const problem of problems) {
    assert.ok(problem.title.length > 3, `${problem.id} should have a title`);
    assert.ok(problem.summary.length > 20, `${problem.id} should have a useful summary`);
    assert.ok(problem.invariant.length > 20, `${problem.id} should have an invariant`);
    assert.ok(problem.dryRun.length > 20, `${problem.id} should have a dry run`);
    assert.ok(problem.quiz.question.includes("?"), `${problem.id} should have a quiz question`);
    assert.ok(problem.quiz.answer.length > 15, `${problem.id} should have a quiz answer`);
    assert.ok(problem.edgeCases.length >= 2, `${problem.id} should have edge cases`);
    assert.ok(problem.masteryChecklist.length >= 6, `${problem.id} should have mastery checklist steps`);
    assert.ok(problem.testCases.length >= 3, `${problem.id} should have normal, edge, and trick test cases`);
    assert.ok(problem.codeWalkthrough.length >= 3, `${problem.id} should have a code walkthrough`);
    assert.ok(problem.mockPrompt.includes(problem.title), `${problem.id} should have a problem mock prompt`);
    assert.notEqual(problem.defaultInput, undefined, `${problem.id} should have a default input`);
    assert.ok(problem.visualizerId, `${problem.id} should map to a visualizer`);
  }
});

test("Blind 75 track exposes the requested reusable visualizers", () => {
  const visualizers = listBlind75Visualizers().map((item) => item.id);
  const required = [
    "arrays-hashing",
    "two-pointers",
    "sliding-window",
    "stack",
    "binary-search",
    "linked-list",
    "trees",
    "graphs",
    "dp",
  ];

  assert.ok(required.every((id) => visualizers.includes(id)));
});

test("returns a complete featured problem", () => {
  const problem = getBlind75Problem("two-sum");

  assert.equal(problem.title, "Two Sum");
  assert.equal(problem.featured, true);
  assert.equal(problem.visualizerId, "arrays-hashing");
  assert.ok(problem.mockPrompt.includes("Two Sum"));
  assert.ok(problem.edgeCases.some((edgeCase) => /duplicate|negative|target|pair/i.test(edgeCase)));
  assert.match(problem.statement, /Given|Return|Find/i);
  assert.ok(Array.isArray(problem.examples));
  assert.ok(problem.examples.length >= 2);
  assert.ok(problem.examples.every((example) => example.input && example.output && example.explanation));
  assert.ok(Array.isArray(problem.constraints));
  assert.ok(problem.constraints.length >= 2);
  assert.ok(problem.tags.includes("LeetCode-style"));
});

test("returns selected-stack Blind 75 code templates", () => {
  const java = getBlind75ProblemCodeTemplate("two-sum", "Java, Spring Boot");
  const python = getBlind75ProblemCodeTemplate("two-sum", "Python, FastAPI");
  const javascript = getBlind75ProblemCodeTemplate("two-sum", "React, Node.js");

  assert.equal(java.language, "Java");
  assert.match(java.code, /class Solution/);
  assert.match(java.code, /twoSum/);
  assert.equal(python.language, "Python");
  assert.match(python.code, /def two_sum/);
  assert.equal(javascript.language, "JavaScript");
  assert.match(javascript.code, /function twoSum/);
});

test("creates and summarizes local DSA confidence progress", () => {
  const initial = createDsaConfidenceState({ now: "2026-05-29T00:00:00.000Z" });

  assert.equal(DSA_CONFIDENCE_STORAGE_KEY, "interviewiq:dsa-confidence:v1");
  assert.equal(initial.version, 1);
  assert.deepEqual(initial.problems, {});

  const visualized = recordDsaMasteryStep(initial, "two-sum", "visualize", true, {
    now: "2026-05-29T00:01:00.000Z",
  });
  const weak = recordDsaMistake(visualized, "two-sum", {
    type: "Missed complement lookup",
    note: "Stored before checking and reused the same index.",
  }, {
    now: "2026-05-29T00:02:00.000Z",
  });

  assert.equal(weak.problems["two-sum"].status, "weak");
  assert.equal(weak.problems["two-sum"].mastery.visualize, true);
  assert.equal(weak.problems["two-sum"].mistakes.length, 1);

  const summary = buildDsaProgressSummary(weak);
  assert.equal(summary.total, 75);
  assert.equal(summary.weak, 1);
  assert.equal(summary.mastered, 0);
  assert.equal(summary.notStarted, 74);
});

test("marks a Blind 75 problem mastered when every mastery step is complete", () => {
  let state = createDsaConfidenceState({ now: "2026-05-29T00:00:00.000Z" });

  for (const step of getBlind75Problem("two-sum").masteryChecklist) {
    state = recordDsaMasteryStep(state, "two-sum", step.id, true, {
      now: "2026-05-29T00:03:00.000Z",
    });
  }

  assert.equal(state.problems["two-sum"].status, "mastered");

  const summary = buildDsaProgressSummary(state);
  assert.equal(summary.mastered, 1);
  assert.equal(summary.notStarted, 74);
});

test("filters Blind 75 problems by difficulty and confidence status", () => {
  let state = createDsaConfidenceState({ now: "2026-05-29T00:00:00.000Z" });
  state = recordDsaMistake(state, "two-sum", { type: "Forgot target complement" }, {
    now: "2026-05-29T00:04:00.000Z",
  });

  const weak = filterBlind75Problems({ state, status: "weak" });
  const easy = filterBlind75Problems({ state, difficulty: "Easy" });
  const notStarted = filterBlind75Problems({ state, status: "not-started" });

  assert.deepEqual(weak.map((problem) => problem.id), ["two-sum"]);
  assert.ok(easy.every((problem) => problem.difficulty === "Easy"));
  assert.equal(notStarted.length, 74);
});
