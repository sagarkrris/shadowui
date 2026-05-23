import assert from "node:assert/strict";
import test from "node:test";

import {
  buildInterviewRoadmap,
  deriveMistakeBank,
} from "../lib/prepInsights.mjs";

const profile = {
  name: "Sagar",
  position: "Backend Developer",
  experience: "5-7 years",
  stack: "Java, Spring Boot, PostgreSQL",
};

const topics = [
  { cat: "Java Core", subs: ["Collections", "Concurrency"] },
  { cat: "Spring Boot", subs: ["REST Controllers", "Spring Security"] },
  { cat: "System Design", subs: ["Caching", "Message Queues"] },
];

test("derives a mistake bank from scored feedback and weak spot language", () => {
  const bank = deriveMistakeBank([
    { role: "assistant", content: "Score: 6/10\nGaps: Missed edge cases and did not discuss trade-offs.\nIdeal Answer: Mention validation and failure modes." },
    { role: "assistant", content: "Score: 7/10\nGaps: Complexity analysis was shallow. Add Big O and memory trade-offs." },
  ]);

  assert.ok(bank.length >= 3);
  assert.deepEqual(
    bank.slice(0, 3).map((item) => item.topic),
    ["Edge cases", "Trade-offs", "Complexity analysis"],
  );
  assert.ok(bank.every((item) => item.retryPrompt.includes("Score: X/10")));
  assert.ok(bank.every((item) => item.correction.length > 20));
});

test("keeps the mistake bank unique and ordered by most recent feedback signal", () => {
  const bank = deriveMistakeBank([
    { role: "assistant", content: "Gaps: Edge cases were weak." },
    { role: "assistant", content: "Gaps: Edge cases still missing. Testing strategy was unclear." },
  ]);

  assert.equal(bank.filter((item) => item.topic === "Edge cases").length, 1);
  assert.equal(bank[0].topic, "Edge cases");
  assert.ok(bank.some((item) => item.topic === "Testing strategy"));
});

test("builds a seven day interview roadmap from profile, topics, weak spots, and scores", () => {
  const roadmap = buildInterviewRoadmap({
    profile,
    topics,
    weakSpots: ["Trade-offs", "Complexity analysis"],
    mockScores: [6, 7],
  });

  assert.equal(roadmap.title, "7-Day Interview Roadmap");
  assert.match(roadmap.summary, /Sagar/);
  assert.match(roadmap.summary, /Java/);
  assert.equal(roadmap.days.length, 7);
  assert.deepEqual(roadmap.days.map((day) => day.day), [1, 2, 3, 4, 5, 6, 7]);
  assert.ok(roadmap.days.every((day) => day.prompt.includes("Sagar")));
  assert.ok(roadmap.days.some((day) => day.focus.includes("Trade-offs")));
});
