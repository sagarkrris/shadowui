import assert from "node:assert/strict";
import test from "node:test";

import {
  SYSTEM_PROMPT,
  buildSystemPrompt,
} from "../lib/chatPrompt.mjs";

test("chat system prompt requires part-wise answers for readability", () => {
  assert.match(SYSTEM_PROMPT, /part-wise/i);
  assert.match(SYSTEM_PROMPT, /Part 1/i);
  assert.match(SYSTEM_PROMPT, /Part 2/i);
  assert.match(SYSTEM_PROMPT, /Part 3/i);
});

test("chat system prompt uses a detailed answer review rubric", () => {
  assert.match(SYSTEM_PROMPT, /Answer Review Mode/i);
  assert.match(SYSTEM_PROMPT, /Correctness/i);
  assert.match(SYSTEM_PROMPT, /Depth/i);
  assert.match(SYSTEM_PROMPT, /Examples/i);
  assert.match(SYSTEM_PROMPT, /Trade-offs/i);
  assert.match(SYSTEM_PROMPT, /Communication clarity/i);
  assert.match(SYSTEM_PROMPT, /Follow-up readiness/i);
});

test("chat system prompt requires answer comparison sections after user answers", () => {
  assert.match(SYSTEM_PROMPT, /Answer Comparison View/i);
  assert.match(SYSTEM_PROMPT, /Your Answer/i);
  assert.match(SYSTEM_PROMPT, /Ideal Answer/i);
  assert.match(SYSTEM_PROMPT, /Improved Version/i);
});

test("chat system prompt keeps candidate profile context", () => {
  const prompt = buildSystemPrompt({
    name: "Sagar",
    position: "Senior Software Engineer",
    experience: "8 years",
    stack: "Java, React, SQL",
  });

  assert.match(prompt, /Candidate name: Sagar/);
  assert.match(prompt, /Target position: Senior Software Engineer/);
  assert.match(prompt, /Tech stack: Java, React, SQL/);
  assert.match(prompt, /part-wise/i);
});

test("chat system prompt calibrates interviewer mode behavior", () => {
  const strict = buildSystemPrompt({}, { interviewMode: "strict" });
  const coach = buildSystemPrompt({}, { interviewMode: "coach" });
  const barRaiser = buildSystemPrompt({}, { interviewMode: "barRaiser" });
  const behavioralStar = buildSystemPrompt({}, { interviewMode: "behavioralStar" });
  const realPressure = buildSystemPrompt({}, { interviewMode: "realPressure" });

  assert.match(strict, /Strict Interviewer/i);
  assert.match(strict, /Ask exactly one question at a time/i);
  assert.match(strict, /short feedback only after/i);
  assert.match(coach, /Coach Mode/i);
  assert.match(coach, /Teach the concept first/i);
  assert.match(coach, /Then ask one practical question/i);
  assert.match(barRaiser, /Bar Raiser Mode/i);
  assert.match(barRaiser, /senior-level pressure/i);
  assert.match(barRaiser, /trade-offs, edge cases/i);
  assert.match(behavioralStar, /Behavioral STAR Mode/i);
  assert.match(behavioralStar, /Situation, Task, Action, Result/i);
  assert.match(behavioralStar, /metrics/i);
  assert.match(realPressure, /Real Pressure Mode/i);
  assert.match(realPressure, /timed/i);
  assert.match(realPressure, /no hints/i);
  assert.match(realPressure, /interruption follow-ups/i);
  assert.match(realPressure, /hire\/no-hire scorecard/i);
});

test("chat system prompt calibrates round strategy behavior", () => {
  const directAnswer = buildSystemPrompt({}, { interviewMode: "directAnswer", roundStrategy: "directAnswer" });
  const recruiter = buildSystemPrompt({}, { roundStrategy: "recruiter" });
  const coding = buildSystemPrompt({}, { roundStrategy: "coding" });
  const systemDesign = buildSystemPrompt({}, { roundStrategy: "systemDesign" });
  const manager = buildSystemPrompt({}, { roundStrategy: "manager" });
  const final = buildSystemPrompt({}, { roundStrategy: "final" });

  assert.match(directAnswer, /Direct answer mode/i);
  assert.match(directAnswer, /not a mock interview/i);
  assert.match(directAnswer, /Do not ask one question at a time/i);
  assert.match(directAnswer, /do not use LaTeX/i);
  assert.match(recruiter, /Recruiter Round/i);
  assert.match(recruiter, /motivation, resume alignment, compensation-safe expectations/i);
  assert.match(coding, /Coding Round/i);
  assert.match(coding, /correctness, complexity, edge cases/i);
  assert.match(systemDesign, /System Design Round/i);
  assert.match(systemDesign, /requirements, APIs, data model/i);
  assert.match(manager, /Manager Round/i);
  assert.match(manager, /ownership, collaboration, conflict/i);
  assert.match(final, /Final Round/i);
  assert.match(final, /offer readiness/i);
});

test("chat system prompt adds AI interview panel behavior", () => {
  const prompt = buildSystemPrompt(
    { name: "Sagar", position: "Staff Engineer", stack: "Java, React" },
    { roundStrategy: "systemDesign", interviewPanel: "systemDesignArchitect" },
  );

  assert.match(prompt, /AI Interview Panel Mode/i);
  assert.match(prompt, /System Design Architect/i);
  assert.match(prompt, /Architecture follow-ups/i);
  assert.match(prompt, /Private rubric/i);
});
