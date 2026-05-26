import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../components/welcome/CareerToolkit.js", import.meta.url), "utf8");

test("interview tracker form uses shared validation and exposes validation messages", () => {
  assert.match(source, /validateInterviewDraft/);
  assert.match(source, /role="alert"/);
  assert.match(source, /aria-invalid/);
  assert.ok(source.includes("maxLength={80}"));
  assert.ok(source.includes("maxLength={100}"));
  assert.ok(source.includes("maxLength={400}"));
});

test("career toolkit exposes a target job description analysis workflow", () => {
  assert.match(source, /Target Job Description/);
  assert.match(source, /jobDescriptionText/);
  assert.match(source, /jobDescriptionAnalysis/);
  assert.match(source, /Analyze role fit/);
  assert.match(source, /Role-specific mocks/);
  assert.match(source, /analyzeJobDescriptionFit/);
});

test("resume analyzer renders a full review surface instead of only a score", () => {
  assert.match(source, /Score Breakdown/);
  assert.match(source, /Priority Fixes/);
  assert.match(source, /Rewrite Suggestions/);
  assert.match(source, /Interview Proof Gaps/);
  assert.match(source, /scoreBreakdown/);
  assert.match(source, /rewriteSuggestions/);
  assert.match(source, /interviewProofGaps/);
});

test("resume analyzer tolerates legacy saved analysis without review arrays", () => {
  assert.match(source, /function normalizeResumeAnalysis/);
  assert.match(source, /Array\.isArray\(analysis\?\.scoreBreakdown\)/);
  assert.match(source, /Array\.isArray\(analysis\?\.issues\)/);
  assert.match(source, /Array\.isArray\(analysis\?\.rewriteSuggestions\)/);
  assert.match(source, /Array\.isArray\(analysis\?\.interviewProofGaps\)/);
});

test("resume analyzer offers likely interviewer questions from the resume", () => {
  assert.match(source, /Likely Resume Questions/);
  assert.match(source, /resumeQuestionPrompts/);
  assert.match(source, /Ask me this/);
});
