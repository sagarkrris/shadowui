import assert from "node:assert/strict";
import test from "node:test";

import {
  FEATURED_BLIND75_IDS,
  getBlind75Problem,
  getBlind75ProblemCodeTemplate,
  listBlind75Problems,
  listBlind75Visualizers,
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
