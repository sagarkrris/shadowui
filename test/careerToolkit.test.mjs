import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzeResumeGaps,
  analyzeJobDescriptionFit,
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
  assert.ok(analysis.scoreBreakdown.find((item) => item.id === "role-match").score >= 50);
  assert.ok(analysis.matchedSkills.some((skill) => skill.name === "Java"));
  assert.ok(analysis.matchedSkills.some((skill) => skill.name === "Spring Boot"));
  assert.ok(analysis.missingSkills.some((skill) => /System Design|Caching|Message Queues|Concurrency/.test(skill.name)));
  assert.ok(analysis.practicePlan.length >= 3);
});

test("compares a target job description with resume evidence and builds role-specific mocks", () => {
  const fit = analyzeJobDescriptionFit({
    jobDescriptionText: "Senior Java engineer needed for Spring Boot APIs, Kafka eventing, AWS, system design, observability, and React dashboards.",
    resumeText: "Built Java Spring Boot REST APIs and React dashboards with JUnit tests.",
    profile,
    topics,
  });

  assert.ok(fit.score > 0);
  assert.equal(fit.targetRole, "Senior Software Engineer");
  assert.ok(fit.requiredSkills.some((skill) => skill.name === "Java"));
  assert.ok(fit.requiredSkills.some((skill) => skill.name === "AWS"));
  assert.ok(fit.coveredSkills.some((skill) => skill.name === "Spring Boot"));
  assert.ok(fit.missingSkills.some((skill) => skill.name === "AWS"));
  assert.ok(fit.missingSkills.some((skill) => skill.name === "Message Queues"));
  assert.ok(fit.practicePlan.length >= 3);
  assert.ok(fit.practicePlan[0].prompt.includes("job description"));
});

test("returns an empty job description fit when no target description is entered", () => {
  const fit = analyzeJobDescriptionFit({ jobDescriptionText: "", resumeText: "Java", profile, topics });

  assert.equal(fit.score, 0);
  assert.deepEqual(fit.requiredSkills, []);
  assert.deepEqual(fit.practicePlan, []);
});

test("does not score a thin resume as perfect when the target role has broader expectations", () => {
  const analysis = analyzeResumeGaps({
    resumeText: "Java developer with backend API experience.",
    profile: {
      name: "Sagar",
      position: "Full Stack Developer",
      experience: "5-7 years",
      stack: "Java",
    },
  });

  assert.ok(analysis.score < 80);
  assert.ok(analysis.missingSkills.some((skill) => skill.name === "React"));
  assert.ok(analysis.missingSkills.some((skill) => skill.name === "System Design"));
  assert.ok(analysis.practicePlan.length > 0);
});

test("requires senior resumes to show interview-critical proof beyond named stack keywords", () => {
  const analysis = analyzeResumeGaps({
    resumeText: "Built Java, Spring Boot, React, SQL, and AWS applications.",
    profile,
  });

  assert.ok(analysis.score < 100);
  assert.ok(analysis.missingSkills.some((skill) => skill.name === "System Design"));
  assert.ok(analysis.missingSkills.some((skill) => skill.name === "Testing"));
});

test("returns a resume review with score categories, issues, and rewrite suggestions", () => {
  const analysis = analyzeResumeGaps({
    resumeText: [
      "Sagar Krishna",
      "Software Engineer",
      "Experience",
      "Worked on Java APIs.",
      "Used Spring Boot and SQL.",
    ].join("\n"),
    profile,
    topics,
  });

  assert.deepEqual(
    analysis.scoreBreakdown.map((item) => item.id),
    ["ats-basics", "content-strength", "role-match", "interview-proof"],
  );
  assert.ok(analysis.scoreBreakdown.every((item) => Number.isInteger(item.score)));
  assert.ok(analysis.issues.some((issue) => issue.severity === "High"));
  assert.ok(analysis.issues.some((issue) => /quantified/i.test(issue.title)));
  assert.ok(analysis.rewriteSuggestions.length > 0);
  assert.ok(analysis.rewriteSuggestions[0].improved.includes("Improved:"));
  assert.ok(analysis.interviewProofGaps.length > 0);
});

test("rewards measurable impact and complete resume basics in the review breakdown", () => {
  const analysis = analyzeResumeGaps({
    resumeText: [
      "Sagar Krishna",
      "sagar@example.com | +1 555 0100 | linkedin.com/in/sagar | github.com/sagar",
      "Summary",
      "Senior Software Engineer with 8 years building Java, Spring Boot, React, SQL, and AWS systems.",
      "Experience",
      "Reduced API latency by 42% by redesigning Spring Boot caching and SQL indexes for 2M monthly requests.",
      "Led system design for Kafka message queues, observability dashboards, CI/CD, JUnit, Mockito, and security hardening.",
      "Skills",
      "Java, Spring Boot, React, SQL, AWS, Docker, System Design, Testing, Security, DSA, Observability",
    ].join("\n"),
    profile,
    topics,
  });

  const byId = Object.fromEntries(analysis.scoreBreakdown.map((item) => [item.id, item.score]));

  assert.ok(byId["ats-basics"] >= 80);
  assert.ok(byId["content-strength"] >= 80);
  assert.ok(byId["interview-proof"] >= 80);
  assert.ok(analysis.issues.every((issue) => issue.severity !== "High"));
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
