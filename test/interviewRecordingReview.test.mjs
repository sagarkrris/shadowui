import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  analyzeInterviewRecordingTranscript,
  buildInterviewRecordingReviewPrompt,
  buildPrivateTranscriptPreview,
} from "../lib/interviewRecordingReview.mjs";

test("analyzes a transcript locally with duration, fillers, STAR structure, metrics, and clarity score", () => {
  const transcript = [
    "Um in my last project, the situation was a checkout flow that dropped mobile users.",
    "My task was to improve conversion without hurting reliability.",
    "I took action by adding metrics, interviewing support, and simplifying the retry path.",
    "The result was a 14 percent lift and fewer checkout tickets.",
  ].join(" ");

  const review = analyzeInterviewRecordingTranscript(transcript, { durationMs: 124000 });

  assert.equal(review.empty, false);
  assert.equal(review.duration.label, "2:04");
  assert.equal(review.fillerWords.total, 1);
  assert.deepEqual(review.starStructure, {
    situation: true,
    task: true,
    action: true,
    result: true,
  });
  assert.equal(review.metrics.hasNumbers, true);
  assert.equal(review.metrics.count, 1);
  assert.ok(review.clarityScore >= 80);
  assert.match(review.displayText, /Transcript reviewed locally/);
  assert.doesNotMatch(review.displayText, /checkout flow/);
});

test("builds privacy-safe transcript preview without exposing the full answer", () => {
  const preview = buildPrivateTranscriptPreview(
    "I designed the auth migration for Acme Bank with customer identifiers and production incident details.",
    { maxWords: 7 }
  );

  assert.equal(preview, "I designed the auth migration for Acme...");
  assert.doesNotMatch(preview, /customer identifiers/);
});

test("generates an AI prompt from local analysis without including raw audio", () => {
  const review = analyzeInterviewRecordingTranscript(
    "Situation: latency spiked. Task: stabilize the API. Action: added tracing. Result: p95 fell 20%.",
    { durationMs: 61000 }
  );

  const prompt = buildInterviewRecordingReviewPrompt(review, {
    role: "Senior Frontend Engineer",
    question: "Tell me about a production issue.",
  });

  assert.match(prompt, /Senior Frontend Engineer/);
  assert.match(prompt, /Tell me about a production issue/);
  assert.match(prompt, /Duration: 1:01/);
  assert.match(prompt, /STAR coverage: Situation, Task, Action, Result/);
  assert.doesNotMatch(prompt, /raw audio/i);
  assert.doesNotMatch(prompt, /base64/i);
});

test("handles empty transcripts with typed fallback messaging", () => {
  const review = analyzeInterviewRecordingTranscript("   ", { durationMs: 0 });

  assert.equal(review.empty, true);
  assert.equal(review.clarityScore, 0);
  assert.equal(review.duration.label, "0:00");
  assert.match(review.displayText, /No transcript captured/);
  assert.match(review.fallback.message, /type or paste/i);
});

test("recording review modal uses transcript-first analysis and does not persist raw audio", () => {
  const source = readFileSync(
    new URL("../components/modals/RecordingReviewModal.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /analyzeInterviewRecordingTranscript/);
  assert.match(source, /buildInterviewRecordingReviewPrompt/);
  assert.match(source, /getRecordingSupport/);
  assert.match(source, /onReviewReady/);
  assert.doesNotMatch(source, /localStorage/);
  assert.doesNotMatch(source, /sessionStorage/);
  assert.doesNotMatch(source, /indexedDB/);
});
