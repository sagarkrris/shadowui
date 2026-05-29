import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  REQUIRED_STORY_QUESTIONS,
  buildResumeStoryMatches,
  extractResumeStoryClaims,
} from "../lib/resumeStoryMatcher.mjs";

const resumeText = [
  "Led a team of 5 engineers migrating a monolith to Spring Boot microservices.",
  "Built REST APIs for partner onboarding and improved API latency by 42%.",
  "Increased checkout reliability by reducing incidents from 12 to 3 per quarter.",
  "Reduced cloud cost by 18% through rightsizing and cache tuning.",
].join("\n");

test("extracts resume story claims across common interview-proof categories", () => {
  const claims = extractResumeStoryClaims(resumeText);
  const types = claims.map((claim) => claim.type);

  assert.deepEqual(
    ["performance", "api", "migration", "leadership", "reliability", "cost"].map((type) => types.includes(type)),
    [true, true, true, true, true, true],
  );

  const performance = claims.find((claim) => claim.type === "performance");
  assert.match(performance.sentence, /latency/i);
  assert.deepEqual(performance.metrics, ["42%"]);
});

test("builds resume story match cards with required proof questions and mock prompts", () => {
  const matches = buildResumeStoryMatches({
    resumeText,
    resumeAnalysis: {
      missingSkills: [{ name: "Kafka" }],
      gaps: ["Add production metrics"],
    },
    proofStories: [
      {
        title: "Checkout reliability story",
        action: "Added retry budgets and dashboards",
        result: "Reduced incidents from 12 to 3 per quarter",
        skillsProven: ["Reliability", "Spring Boot"],
        impactMetrics: ["12 to 3 per quarter"],
      },
    ],
  });

  assert.ok(matches.cards.length >= 6);
  assert.deepEqual(matches.requiredQuestions, REQUIRED_STORY_QUESTIONS);
  assert.ok(matches.cards.every((card) => card.questions.includes("Do you have a story for this?")));
  assert.ok(matches.cards.every((card) => card.questions.includes("Can you prove this with metrics?")));
  assert.ok(matches.cards.every((card) => card.questions.includes("What follow-up question will the interviewer ask?")));
  assert.ok(matches.cards.every((card) => /Practice this as a behavioral answer/i.test(card.mockPrompt)));
  assert.ok(matches.cards.some((card) => card.matchedStory?.title === "Checkout reliability story"));
  assert.ok(!matches.cards.find((card) => card.type === "leadership").metrics.includes("5x"));
});

test("does not invent metrics when a resume claim has no numbers", () => {
  const matches = buildResumeStoryMatches({
    resumeText: "Led platform migration and improved reliability for payment APIs.",
    proofStories: [],
  });

  assert.ok(matches.cards.length >= 3);
  assert.ok(matches.cards.every((card) => card.metrics.length === 0));
  assert.ok(matches.cards.every((card) => /ask me for missing metrics/i.test(card.mockPrompt)));
});

test("ResumeStoryMatcherPanel renders the expected proof prompts", () => {
  const source = readFileSync(new URL("../components/welcome/ResumeStoryMatcherPanel.js", import.meta.url), "utf8");

  assert.match(source, /Resume Story Matcher/);
  assert.match(source, /Do you have a story for this\?/);
  assert.match(source, /Can you prove this with metrics\?/);
  assert.match(source, /Practice this as a behavioral answer/);
});
