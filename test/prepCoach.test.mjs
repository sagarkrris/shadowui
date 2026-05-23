import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPrepActionPrompt,
  buildPrepCommandCenter,
  deriveMockScores,
} from "../lib/prepCoach.mjs";

const topics = [
  { cat: "Python Core", subs: ["Data Structures", "Decorators", "Async IO"] },
  { cat: "Django & FastAPI", subs: ["Django ORM", "FastAPI Routing"] },
  { cat: "Behavioral", subs: ["Ownership"] },
];

const profile = {
  name: "Sagar",
  position: "Backend Developer",
  experience: "2-4 years",
  stack: "Python, Django",
};

test("builds a concise command center from profile, topics, and weak spots", () => {
  const center = buildPrepCommandCenter({
    profile,
    topics,
    weakSpots: ["Caching", "Complexity"],
    mockScores: [8, 7],
  });

  assert.equal(center.readinessScore, 71);
  assert.equal(center.readinessLabel, "Interview momentum building");
  assert.equal(center.focusArea, "Caching");
  assert.equal(center.dailyPlan.length, 3);
  assert.deepEqual(
    center.dailyPlan.map((item) => item.title),
    ["Warm up", "Core drill", "Mock signal"],
  );
  assert.ok(center.actions.some((action) => action.id === "weak-spot-review"));
});

test("does not show a fake readiness score before scored mock feedback exists", () => {
  const center = buildPrepCommandCenter({
    profile,
    topics,
    weakSpots: [],
    mockScores: [],
  });

  assert.equal(center.focusArea, "Python Core");
  assert.equal(center.readinessScore, null);
  assert.equal(center.readinessLabel, "Start a scored mock to measure readiness");
  assert.ok(center.actions.every((action) => action.prompt.includes("Sagar")));
});

test("derives mock scores from assistant feedback messages", () => {
  const scores = deriveMockScores([
    { role: "user", content: "My answer" },
    { role: "assistant", content: "**Score: 8/10**\nStrengths: Clear examples." },
    { role: "assistant", content: "Score: 6/10\nGaps: Discuss trade-offs." },
  ]);

  assert.deepEqual(scores, [8, 6]);
});

test("uses recent mock scores to calculate readiness", () => {
  const center = buildPrepCommandCenter({
    profile,
    topics,
    weakSpots: [],
    mockScores: [4, 6, 7, 8, 9, 10],
  });

  assert.equal(center.readinessScore, 80);
  assert.equal(center.readinessLabel, "Interview momentum building");
});

test("builds action prompts with the candidate context", () => {
  const prompt = buildPrepActionPrompt({
    actionId: "rapid-fire",
    profile,
    topic: "Python Core",
    focusArea: "Complexity",
  });

  assert.match(prompt, /Sagar/);
  assert.match(prompt, /Python Core/);
  assert.match(prompt, /Complexity/);
  assert.match(prompt, /rapid-fire/i);
});
