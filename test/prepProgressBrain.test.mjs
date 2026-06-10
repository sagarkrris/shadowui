import assert from "node:assert/strict";
import test from "node:test";

import {
  buildBeginnerGuidedPath,
  buildDailyPrepPlanMarkdown,
  buildPracticeReplayTimeline,
  buildUnifiedPrepProgress,
  createPrepProgressState,
  recordBeginnerStep,
  recordPrepActivity,
} from "../lib/prepProgressBrain.mjs";

test("builds a unified progress brain from question memory mocks and canvas", () => {
  const progress = buildUnifiedPrepProgress({
    profile: { position: "Java Backend Engineer", stack: "Java, Spring Boot, PostgreSQL" },
    weakSpots: ["Indexes"],
    mockScores: [7, 8],
    questionMemory: {
      questions: {
        "two-sum": {
          questionId: "two-sum",
          question: "Solve Two Sum",
          attempts: [
            { score: 8, attemptedAt: "2026-06-01T00:00:00.000Z" },
            { score: 9, attemptedAt: "2026-06-02T00:00:00.000Z" },
          ],
        },
      },
    },
    systemDesignCanvas: {
      problem: "Design ticket booking",
      sections: { requirements: "Seat holds" },
    },
    prepProgressState: recordPrepActivity(createPrepProgressState(), {
      workspaceId: "dsaLab",
      type: "practice",
      label: "Started DSA practice",
      happenedAt: "2026-06-10T00:00:00.000Z",
    }),
    beginnerMode: true,
  });

  assert.equal(progress.title, "Unified Progress Brain");
  assert.ok(progress.readinessScore > 0);
  assert.equal(progress.beginnerMode, true);
  assert.equal(progress.beginnerStep, "watch");
  assert.equal(progress.summary.weakSpot, "Indexes");
  assert.equal(progress.summary.activityCount, 1);
  assert.ok(progress.lanes.some((lane) => lane.id === "dsa" && lane.workspaceId === "dsaLab"));
  assert.ok(progress.lanes.some((lane) => lane.id === "dsa" && lane.detail.includes("DSA event")));
  assert.ok(progress.lanes.some((lane) => lane.id === "systemDesign" && lane.score >= 70));
  assert.deepEqual(progress.beginnerPath.map((step) => step.label), ["Watch", "Predict", "Explain", "Practice", "Review"]);
  assert.match(progress.dailyPlanMarkdown, /InterviewIQ Daily Prep Plan/);
});

test("builds beginner guided path with actionable workspace handoffs", () => {
  const path = buildBeginnerGuidedPath({
    summary: { weakSpot: "dynamic programming" },
    lanes: [
      { workspaceId: "canvas", score: 70 },
      { workspaceId: "dsaLab", score: 22 },
    ],
  });

  assert.equal(path[0].workspaceId, "dsaLab");
  assert.match(path[2].prompt, /entry-level/i);
  assert.match(path[3].prompt, /beginner-friendly/i);
});

test("records activity events and current beginner step in prep progress state", () => {
  const started = createPrepProgressState();
  const withStep = recordBeginnerStep(started, "practice");
  const withActivity = recordPrepActivity(withStep, {
    workspaceId: "scenarioBank",
    type: "mock",
    label: "Scenario mock",
    detail: "Practiced a database trade-off.",
    happenedAt: "2026-06-10T08:00:00.000Z",
  });
  const progress = buildUnifiedPrepProgress({ prepProgressState: withActivity, beginnerMode: true });

  assert.equal(withActivity.beginnerStep, "practice");
  assert.equal(withActivity.events.length, 1);
  assert.equal(progress.beginnerPath.find((step) => step.id === "practice").active, true);
  assert.equal(progress.beginnerPath.find((step) => step.id === "predict").completed, true);
  assert.ok(progress.replay.some((item) => item.type === "Workspace Activity" && item.title === "Scenario mock"));
});

test("builds practice replay timeline from scored chat and question memory", () => {
  const replay = buildPracticeReplayTimeline({
    messages: [
      { role: "user", content: "My answer about indexes" },
      { role: "assistant", content: "Score: 6/10\nGaps: discuss query plan." },
    ],
    masteryMap: {
      entries: [
        {
          questionId: "arrays-1",
          question: "Array rotation",
          attemptCount: 1,
          lastSeenAt: "2026-06-09T00:00:00.000Z",
          lastScore: 5,
          status: "Needs Review",
          dueForReview: true,
        },
      ],
    },
  });

  assert.ok(replay.length >= 2);
  assert.ok(replay.some((item) => item.type === "Mock Review" && item.score === 6));
  assert.ok(replay.some((item) => item.type === "Question Memory" && item.status === "Needs Review"));
});

test("exports a daily prep plan from unified progress", () => {
  const markdown = buildDailyPrepPlanMarkdown(buildUnifiedPrepProgress({
    profile: { stack: "Java" },
    weakSpots: ["transactions"],
    prepProgressState: recordBeginnerStep(createPrepProgressState(), "review"),
  }));

  assert.match(markdown, /^# InterviewIQ Daily Prep Plan/);
  assert.match(markdown, /Focus: transactions/);
  assert.match(markdown, /## Workspace Lanes/);
  assert.match(markdown, /Review/);
});
