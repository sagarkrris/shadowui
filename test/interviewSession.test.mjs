import assert from "node:assert/strict";
import test from "node:test";
import { addInterviewFollowUp, buildStructuredEvaluationPrompt, completeInterviewSession, createInterviewSession, parseStructuredEvaluation, reviewInterviewTurn, scoreInterviewTurn, startInterviewQuestion, submitInterviewAnswer } from "../lib/interviewSession.mjs";

test("interview sessions move through explicit question, answer, follow-up, score, and review states", () => {
  let session = startInterviewQuestion(createInterviewSession(), { question: "Explain idempotency" });
  session = submitInterviewAnswer(session, "I use a request key and durable result.");
  session = addInterviewFollowUp(session, "How do you handle retries?");
  session = submitInterviewAnswer(session, "The key makes retries return the original result.");
  session = scoreInterviewTurn(session, { score: 8, confidence: "high", strengths: ["Clear mechanism"] });
  session = reviewInterviewTurn(session, { notes: "Add storage expiry detail.", nextAction: "Practice a payment example." });
  session = completeInterviewSession(session);
  assert.equal(session.state, "complete");
  assert.equal(session.summary.averageScore, 8);
  assert.equal(session.turns[0].review.nextAction, "Practice a payment example.");
});

test("structured evaluation rejects invalid scores and preserves insufficient evidence", () => {
  assert.equal(parseStructuredEvaluation(JSON.stringify({ score: 12 })).ok, false);
  const parsed = parseStructuredEvaluation({ score: null, confidence: "insufficient-evidence", strengths: [], gaps: ["No metric"], recommendations: [] });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.score, null);
  assert.match(buildStructuredEvaluationPrompt({ question: "Q", answer: "A" }), /Do not invent candidate facts/);
});
