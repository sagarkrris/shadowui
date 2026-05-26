import assert from "node:assert/strict";
import test from "node:test";

import { parseAnswerRubric } from "../lib/answerRubric.mjs";

test("parses answer rubric scores from assistant feedback", () => {
  const rubric = parseAnswerRubric([
    "Score: 7/10",
    "Correctness: 7/10",
    "Depth: 6/10",
    "Examples: 8/10",
    "Trade-offs: 5/10",
    "Communication: 9/10",
    "Follow-up readiness: 6/10",
  ].join("\n"));

  assert.deepEqual(
    rubric.map((item) => [item.key, item.label, item.score]),
    [
      ["correctness", "Correctness", 7],
      ["depth", "Depth", 6],
      ["examples", "Examples", 8],
      ["tradeOffs", "Trade-offs", 5],
      ["communication", "Communication", 9],
      ["followUpReadiness", "Follow-up readiness", 6],
    ],
  );
});

test("returns no rubric when feedback has no category scores", () => {
  assert.deepEqual(parseAnswerRubric("Score: 7/10\nGaps: Needs depth."), []);
});
