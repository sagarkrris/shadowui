import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildPrepOSDashboard,
  buildSmartPrepTimeline,
} from "../lib/prepOperatingSystem.mjs";

const profile = {
  name: "Sagar",
  position: "Backend Developer",
  stack: "Java, Spring Boot, PostgreSQL",
};

const topics = [
  { cat: "Java Core", subs: ["Collections", "Concurrency"] },
  { cat: "Spring Boot", subs: ["REST Controllers", "Security"] },
  { cat: "System Design", subs: ["Caching", "Queues"] },
];

test("builds PrepOS Today from local prep signals", () => {
  const dashboard = buildPrepOSDashboard({
    profile,
    topics,
    weakSpots: [
      { topic: "Trade-offs", due: true, lastScore: 5 },
      "Complexity analysis",
    ],
    mockScores: [6, 7],
    questionMemory: {
      questions: {
        q1: { topic: "Concurrency", status: "Needs Review", dueForReview: true, lastScore: 4 },
        q2: { topic: "Collections", status: "Mastered", dueForReview: false, lastScore: 9 },
      },
    },
    proofStories: [
      { title: "Latency migration", result: "Reduced p95 latency by 38%", skillsProven: ["Spring Boot"] },
      { title: "Mentoring rollout", result: "Onboarded 4 engineers" },
    ],
    interviews: [{ company: "Amazon", role: "SDE II", round: "System Design", date: "2026-05-31", status: "scheduled" }],
    now: "2026-05-29T00:00:00.000Z",
  });

  assert.equal(dashboard.practiceNow.topic, "Trade-offs");
  assert.match(dashboard.practiceNow.prompt, /Trade-offs/);
  assert.ok(dashboard.whyItMatters.some((item) => /Amazon/.test(item)));
  assert.ok(dashboard.interviewRisks.some((risk) => /System Design/.test(risk.label)));
  assert.deepEqual(dashboard.weakTopicsDue.map((item) => item.topic), ["Trade-offs", "Complexity analysis", "Concurrency"]);
  assert.equal(dashboard.topStory.title, "Latency migration");
  assert.match(dashboard.nextMock.prompt, /Amazon|System Design|Trade-offs/);
});

test("falls back to selected topics when PrepOS has no history", () => {
  const dashboard = buildPrepOSDashboard({ profile, topics });

  assert.equal(dashboard.practiceNow.topic, "Collections");
  assert.match(dashboard.whyItMatters.join(" "), /Java Core|Collections/);
  assert.equal(dashboard.interviewRisks.length, 1);
  assert.equal(dashboard.topStory.title, "Proof story needed");
  assert.match(dashboard.nextMock.prompt, /Collections/);
});

test("builds Smart Prep Timeline milestones from profile, resume, JD, mocks, mastery, stories, interview, and final pack", () => {
  const timeline = buildSmartPrepTimeline({
    profile,
    topics,
    weakSpots: ["Trade-offs"],
    mockScores: [6, 7, 8],
    questionMemory: {
      questions: {
        q1: { status: "Mastered", topic: "Collections" },
        q2: { status: "Mastered", topic: "Concurrency" },
        q3: { status: "Needs Review", topic: "Caching", dueForReview: true },
      },
    },
    proofStories: [{ title: "Latency migration" }],
    interviews: [{ company: "Amazon", role: "SDE II", round: "System Design", date: "2026-05-31", status: "scheduled" }],
    resumeAnalysis: { score: 76 },
    jobDescriptionAnalysis: { score: 63 },
    finalPack: { ready: true },
    now: "2026-05-29T00:00:00.000Z",
  });

  assert.deepEqual(
    timeline.milestones.map((item) => item.id),
    ["profile", "resume", "jd", "mock", "weak-spots", "questions-mastered", "stories", "interview-scheduled", "final-pack"],
  );
  assert.equal(timeline.milestones.find((item) => item.id === "profile").status, "complete");
  assert.equal(timeline.milestones.find((item) => item.id === "weak-spots").status, "active");
  assert.equal(timeline.milestones.find((item) => item.id === "final-pack").status, "complete");
  assert.ok(timeline.milestones.every((item) => item.label && item.detail && item.action));
});

test("PrepOS UI source includes required labels", () => {
  const dashboardSource = readFileSync(new URL("../components/welcome/PrepOSDashboard.js", import.meta.url), "utf8");
  const timelineSource = readFileSync(new URL("../components/welcome/SmartPrepTimeline.js", import.meta.url), "utf8");

  assert.match(dashboardSource, /PrepOS Today/);
  assert.match(dashboardSource, /Practice now/);
  assert.match(dashboardSource, /Why it matters/);
  assert.match(dashboardSource, /Interview risks/);
  assert.match(timelineSource, /Smart Prep Timeline/);
});
