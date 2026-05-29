import assert from "node:assert/strict";
import test from "node:test";

import { buildPrepReportHtml, buildPrepReportMarkdown } from "../lib/prepReport.mjs";

test("builds a clean markdown prep report", () => {
  const markdown = buildPrepReportMarkdown({
    profile: { name: "Sagar", position: "Senior Engineer", stack: "Java, Spring Boot" },
    resumeAnalysis: { score: 72, missingSkills: [{ name: "System Design" }] },
    jobDescriptionAnalysis: { score: 64, missingSkills: [{ name: "AWS" }, { name: "Kafka" }] },
    weakSpots: ["Trade-offs", "Testing strategy"],
    mockScores: [7, 8],
    roadmap: {
      days: [
        { day: 1, title: "Foundation", focus: "Spring Boot", minutes: 25 },
      ],
    },
    companyFocus: { company: "Amazon", topic: "Spring Boot" },
    nextActions: ["Retry Spring Boot mock", "Update resume bullet"],
  });

  assert.match(markdown, /# InterviewIQ Prep Report/);
  assert.match(markdown, /Senior Engineer/);
  assert.match(markdown, /Resume Score: 72%/);
  assert.match(markdown, /Job Description Match: 64%/);
  assert.match(markdown, /AWS/);
  assert.match(markdown, /Trade-offs/);
  assert.match(markdown, /Average Mock Score: 7.5\/10/);
  assert.match(markdown, /Amazon/);
  assert.match(markdown, /Retry Spring Boot mock/);
});

test("builds a print-ready prep report without unsafe html", () => {
  const html = buildPrepReportHtml([
    "# InterviewIQ Prep Report",
    "## Candidate",
    "- Name: <Sagar>",
    "Plain text",
  ].join("\n"));

  assert.match(html, /<title>InterviewIQ Prep Report<\/title>/);
  assert.match(html, /<h1>InterviewIQ Prep Report<\/h1>/);
  assert.match(html, /<h2>Candidate<\/h2>/);
  assert.match(html, /<li>Name: &lt;Sagar&gt;<\/li>/);
  assert.match(html, /<p>Plain text<\/p>/);
});

test("adds final interview report sections only when optional inputs are provided", () => {
  const baseMarkdown = buildPrepReportMarkdown();

  assert.doesNotMatch(baseMarkdown, /## Final Interview Report/);

  const markdown = buildPrepReportMarkdown({
    finalInterviewReport: {
      offerReadiness: "Strong hire with one design-risk gap",
      resumeJdMatch: "Resume aligns to backend APIs and Kafka ownership",
      masteryMap: [
        { topic: "Spring Boot APIs", level: "Strong", evidence: "Mock score 8/10" },
        "SQL indexing - needs sharper query-plan language",
      ],
      weakSpotRadar: ["System design trade-offs", "Metrics-first debugging"],
      proofStories: [
        { title: "Payments latency", result: "Cut p95 by 38%" },
        "Mentored two engineers through release ownership",
      ],
      rolePack: {
        title: "Java Backend SDE II",
        focusTopics: ["Spring Boot REST APIs", "Kafka event flows"],
        priorityDrills: ["Debug an N+1 query", "Design idempotent retries"],
      },
      companyPrep: {
        company: "Amazon",
        signals: ["Ownership", "Dive Deep"],
      },
      canvasSummary: {
        problem: "Design order events",
        risks: ["Duplicate delivery"],
        decisions: ["Outbox pattern"],
      },
      final24HourPlan: ["Review proof stories", "Run one system design drill"],
    },
  });

  assert.match(markdown, /## Final Interview Report/);
  assert.match(markdown, /### Offer Readiness/);
  assert.match(markdown, /Strong hire with one design-risk gap/);
  assert.match(markdown, /### Resume\/JD Match/);
  assert.match(markdown, /Spring Boot APIs: Strong - Mock score 8\/10/);
  assert.match(markdown, /Payments latency - Cut p95 by 38%/);
  assert.match(markdown, /Role Pack: Java Backend SDE II/);
  assert.match(markdown, /Kafka event flows/);
  assert.match(markdown, /Company: Amazon/);
  assert.match(markdown, /Problem: Design order events/);
  assert.match(markdown, /Run one system design drill/);
});

test("renders final interview report html with escaped nested report content", () => {
  const markdown = buildPrepReportMarkdown({
    finalInterviewReport: {
      offerReadiness: "Ready <now>",
      proofStories: [{ title: "Ledger <migration>", result: "No regressions" }],
      rolePack: {
        title: "React Frontend Senior",
        actionPrompts: ["Explain render boundaries <clearly>"],
      },
    },
  });
  const html = buildPrepReportHtml(markdown);

  assert.match(html, /<h2>Final Interview Report<\/h2>/);
  assert.match(html, /<h3>Offer Readiness<\/h3>/);
  assert.match(html, /<li>Ready &lt;now&gt;<\/li>/);
  assert.match(html, /Ledger &lt;migration&gt; - No regressions/);
  assert.match(html, /Explain render boundaries &lt;clearly&gt;/);
});
