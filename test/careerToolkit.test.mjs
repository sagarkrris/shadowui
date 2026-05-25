import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzeResumeGaps,
  buildInterviewTrackerSummary,
  buildPracticeStreak,
  buildSpacedReviewQueue,
  normalizeInterviewEvent,
  recordActivityDate,
  validateInterviewDraft,
} from "../lib/careerToolkit.mjs";

const profile = {
  name: "Sagar",
  position: "Senior Software Engineer",
  experience: "8 years",
  stack: "Java, Spring Boot, React, SQL, AWS",
};

const topics = [
  { cat: "Java Core", subs: ["Collections", "Concurrency", "JVM Memory"] },
  { cat: "Spring Boot", subs: ["REST Controllers", "Spring Security", "JPA & Hibernate"] },
  { cat: "System Design", subs: ["Caching", "Message Queues", "Scalability"] },
];

test("analyzes resume gaps against the target role and stack", () => {
  const analysis = analyzeResumeGaps({
    resumeText: "Built Java Spring Boot REST APIs with SQL tuning, JPA, React dashboards, AWS deployments, and JUnit tests.",
    profile,
    topics,
  });

  assert.equal(analysis.targetRole, "Senior Software Engineer");
  assert.ok(analysis.score >= 50);
  assert.ok(analysis.matchedSkills.some((skill) => skill.name === "Java"));
  assert.ok(analysis.matchedSkills.some((skill) => skill.name === "Spring Boot"));
  assert.ok(analysis.missingSkills.some((skill) => /System Design|Caching|Message Queues|Concurrency/.test(skill.name)));
  assert.ok(analysis.practicePlan.length >= 3);
});

test("builds a spaced repetition queue from weak assistant feedback", () => {
  const queue = buildSpacedReviewQueue({
    messages: [
      {
        role: "assistant",
        content: "**Score: 6/10**\n**Gaps:** Missing trade-offs, edge cases, and complexity analysis.",
      },
    ],
    reviewHistory: {
      "trade-offs": { completedCount: 1, lastReviewedAt: "2026-05-22T00:00:00.000Z" },
    },
    now: "2026-05-25T00:00:00.000Z",
  });

  assert.ok(queue.some((item) => item.topic === "Trade-offs"));
  assert.ok(queue.some((item) => item.topic === "Edge cases"));
  assert.equal(queue.find((item) => item.topic === "Trade-offs").intervalDays, 3);
  assert.equal(queue.find((item) => item.topic === "Trade-offs").status, "due");
});

test("normalizes interview events and summarizes upcoming schedule", () => {
  const interview = normalizeInterviewEvent({
    company: "Amazon",
    role: "SDE II",
    date: "2026-05-30",
    round: "System Design",
    status: "scheduled",
    notes: "Focus on scalability",
  });
  const summary = buildInterviewTrackerSummary([interview], "2026-05-25");

  assert.equal(interview.company, "Amazon");
  assert.equal(summary.total, 1);
  assert.equal(summary.upcomingCount, 1);
  assert.equal(summary.next.company, "Amazon");
  assert.equal(summary.next.daysUntil, 5);
});

test("validates interview tracker fields before adding a schedule item", () => {
  assert.deepEqual(
    validateInterviewDraft({ company: "", role: "SDE II", date: "2026-05-30" }, { today: "2026-05-25" }),
    { ok: false, message: "Company is required." },
  );

  assert.deepEqual(
    validateInterviewDraft({ company: "Amazon", role: "", date: "2026-05-30" }, { today: "2026-05-25" }),
    { ok: false, message: "Role is required." },
  );

  assert.deepEqual(
    validateInterviewDraft({ company: "Amazon", role: "SDE II", date: "" }, { today: "2026-05-25" }),
    { ok: false, message: "Interview date is required." },
  );

  assert.deepEqual(
    validateInterviewDraft({ company: "Amazon", role: "SDE II", date: "2026-02-31" }, { today: "2026-05-25" }),
    { ok: false, message: "Enter a valid interview date." },
  );

  assert.deepEqual(
    validateInterviewDraft({ company: "Amazon", role: "SDE II", date: "2026-05-24" }, { today: "2026-05-25" }),
    { ok: false, message: "Interview date cannot be in the past." },
  );

  assert.deepEqual(
    validateInterviewDraft({ company: "Amazon", role: "SDE II", date: "2026-05-30" }, { today: "2026-05-25" }),
    { ok: true, message: "" },
  );
});

test("does not normalize impossible interview dates into another calendar day", () => {
  const interview = normalizeInterviewEvent({
    company: "Amazon",
    role: "SDE II",
    date: "2026-02-31",
  });

  assert.equal(interview.date, "");
});

test("calculates practice streak and XP from activity dates", () => {
  const dates = ["2026-05-22", "2026-05-23", "2026-05-24"];
  const updated = recordActivityDate(dates, "2026-05-25");
  const streak = buildPracticeStreak(updated, {
    today: "2026-05-25",
    reviewedCount: 2,
    interviewCount: 1,
  });

  assert.deepEqual(updated, ["2026-05-22", "2026-05-23", "2026-05-24", "2026-05-25"]);
  assert.equal(streak.currentStreak, 4);
  assert.equal(streak.longestStreak, 4);
  assert.ok(streak.xp > 0);
});
