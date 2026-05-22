import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPrepActionPrompt,
  buildPrepCommandCenter,
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
  });

  assert.equal(center.readinessScore, 72);
  assert.equal(center.readinessLabel, "Interview momentum building");
  assert.equal(center.focusArea, "Caching");
  assert.equal(center.dailyPlan.length, 3);
  assert.deepEqual(
    center.dailyPlan.map((item) => item.title),
    ["Warm up", "Core drill", "Mock signal"],
  );
  assert.ok(center.actions.some((action) => action.id === "weak-spot-review"));
});

test("uses topic focus when weak spots are not available", () => {
  const center = buildPrepCommandCenter({
    profile,
    topics,
    weakSpots: [],
  });

  assert.equal(center.focusArea, "Python Core");
  assert.equal(center.readinessScore, 82);
  assert.ok(center.actions.every((action) => action.prompt.includes("Sagar")));
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
