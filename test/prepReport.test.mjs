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
