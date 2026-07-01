import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCompanyPrepRoom,
  buildCompanyProviderStatus,
  buildCompanyReadinessScore,
  buildQuestionBankRefreshState,
  buildCompanyMockPrompt,
  deriveWeakSpots,
  getCompanyPrep,
  markQuestionBankVerified,
} from "../lib/companyPrep.mjs";

test("returns seeded Amazon company prep with questions and sources", () => {
  const prep = getCompanyPrep("Amazon");

  assert.equal(prep.company, "Amazon");
  assert.ok(prep.dsa.length >= 4);
  assert.ok(prep.systemDesign.length >= 4);
  assert.ok(prep.behavioral.length >= 4);
  assert.ok(prep.resources.every((resource) => resource.url.startsWith("https://")));
});

test("falls back to a generic company prep shape for unknown companies", () => {
  const prep = getCompanyPrep("Stripe");

  assert.equal(prep.company, "Stripe");
  assert.equal(prep.isSeeded, false);
  assert.ok(prep.resources.some((resource) => resource.url.includes("leetcode.com")));
  assert.ok(prep.resources.length >= 3);
});

test("builds a mock interview prompt from a company question", () => {
  const prompt = buildCompanyMockPrompt({
    company: "Amazon",
    type: "DSA",
    title: "Top K Frequent Elements",
    prompt: "Given a stream of items, return the top K most frequent values.",
  });

  assert.match(prompt, /Amazon/);
  assert.match(prompt, /Top K Frequent Elements/);
  assert.match(prompt, /one question at a time/i);
});

test("derives weak spots from assistant feedback messages", () => {
  const weakSpots = deriveWeakSpots([
    { role: "assistant", content: "**Gaps:** Missed edge cases and did not discuss trade-offs." },
    { role: "assistant", content: "**Gaps:** Complexity analysis was shallow." },
  ]);

  assert.deepEqual(weakSpots.slice(0, 3), ["Edge cases", "Trade-offs", "Complexity analysis"]);
});

test("derives database weak spots from scored feedback", () => {
  const weakSpots = deriveWeakSpots([
    {
      role: "assistant",
      content: "Score: 3/10\nGaps: Databases were weak. Missing indexing, transactions, and SQL query tuning details.",
    },
  ]);

  assert.ok(weakSpots.includes("Databases"));
});

test("builds local question bank refresh metadata without claiming live scraping", () => {
  const prep = getCompanyPrep("Amazon");
  const refresh = buildQuestionBankRefreshState({ prep, now: new Date("2026-05-26T12:00:00.000Z") });

  assert.equal(refresh.company, "Amazon");
  assert.equal(refresh.refreshedAt, "2026-05-26T12:00:00.000Z");
  assert.equal(refresh.sourceLinks.length, prep.resources.length);
  assert.equal(refresh.liveScraped, false);
  assert.match(refresh.note, /manual/i);
});

test("builds provider freshness and verification status for company sources", () => {
  const prep = getCompanyPrep("Amazon");
  const refresh = markQuestionBankVerified(
    buildQuestionBankRefreshState({ prep, now: new Date("2026-06-28T12:00:00.000Z") }),
    { questionId: "DSA-Top K Frequent Elements", now: new Date("2026-06-28T12:05:00.000Z") },
  );
  const status = buildCompanyProviderStatus({
    prep,
    refreshState: refresh,
    now: new Date("2026-07-01T12:00:00.000Z"),
  });

  assert.equal(status.company, "Amazon");
  assert.equal(status.verifiedCount, 1);
  assert.match(status.freshnessLabel, /Fresh/);
});

test("marks local question bank questions as verified and recent", () => {
  const state = buildQuestionBankRefreshState({
    prep: getCompanyPrep("Amazon"),
    now: new Date("2026-05-26T12:00:00.000Z"),
  });
  const verified = markQuestionBankVerified(state, {
    questionId: "DSA-Top K Frequent Elements",
    now: new Date("2026-05-26T12:05:00.000Z"),
  });

  assert.equal(verified.verifiedQuestions["DSA-Top K Frequent Elements"].status, "recent");
  assert.equal(verified.verifiedQuestions["DSA-Top K Frequent Elements"].verifiedAt, "2026-05-26T12:05:00.000Z");
});

test("builds a company readiness score from refresh verification mocks and fit signals", () => {
  const prep = getCompanyPrep("Amazon");
  const refresh = markQuestionBankVerified(
    buildQuestionBankRefreshState({ prep, now: new Date("2026-05-26T12:00:00.000Z") }),
    { questionId: "DSA-Top K Frequent Elements", now: new Date("2026-05-26T12:05:00.000Z") },
  );
  const readiness = buildCompanyReadinessScore({
    prep,
    refreshState: refresh,
    weakSpots: ["Trade-offs"],
    mockScores: [7, 8],
    resumeAnalysis: { score: 72 },
    jobDescriptionAnalysis: { score: 64 },
  });

  assert.ok(readiness.score > 0);
  assert.equal(readiness.company, "Amazon");
  assert.ok(readiness.factors.some((factor) => factor.label === "Verified local bank"));
  assert.ok(readiness.factors.some((factor) => factor.label === "Mock average"));
  assert.match(readiness.nextActionPrompt, /Amazon/);
});

test("builds a dedicated company prep room from role context and Career Toolkit analysis", () => {
  const prep = getCompanyPrep("Amazon");
  const room = buildCompanyPrepRoom({
    prep,
    roleContext: "Senior Backend Engineer",
    selectedCat: "System Design",
    selectedSub: "Message Queues",
    careerToolkitState: {
      jobDescriptionAnalysis: {
        score: 58,
        targetRole: "Senior Backend Engineer",
        missingSkills: [
          { name: "AWS", category: "Cloud" },
          { name: "Message Queues", category: "Architecture" },
        ],
        likelyQuestions: [
          {
            id: "jd-question-aws",
            skill: "AWS",
            question: "How would you use AWS in this role?",
            prompt: "Mock me on AWS for the target JD.",
          },
        ],
        gapUrgency: [
          { skill: "Message Queues", status: "missing", action: "Prepare one queue design proof." },
        ],
      },
      proofStories: [
        {
          id: "story-latency",
          title: "Latency reduction story",
          skillsProven: ["AWS", "Message Queues"],
          result: "Reduced checkout latency by 42%.",
          actions: [{ label: "Use in system design", prompt: "Use this story in system design." }],
        },
      ],
    },
  });

  assert.equal(room.company, "Amazon");
  assert.equal(room.roleContext, "Senior Backend Engineer");
  assert.ok(room.notes.some((note) => /Message Queues/.test(note.detail)));
  assert.ok(room.interviewRounds.some((round) => round.name === "Coding screen"));
  assert.ok(room.interviewRounds.some((round) => /System Design/.test(round.name)));
  assert.deepEqual(room.jdGaps.map((gap) => gap.name), ["AWS", "Message Queues"]);
  assert.ok(room.likelyQuestions.some((question) => question.question.includes("AWS")));
  assert.ok(room.storyReferences.some((story) => story.title === "Latency reduction story"));
  assert.ok(room.finalDayChecklist.length >= 5);
  assert.match(room.finalDayActionPrompt, /Amazon/);
  assert.match(room.finalDayActionPrompt, /Senior Backend Engineer/);
});

test("derives story references from scored local messages when saved stories are unavailable", () => {
  const room = buildCompanyPrepRoom({
    prep: getCompanyPrep("Stripe"),
    roleContext: "Full Stack Engineer",
    careerToolkitState: {
      jobDescriptionAnalysis: {
        missingSkills: [{ name: "React", category: "Frontend" }],
        likelyQuestions: [],
      },
    },
    messages: [
      {
        role: "user",
        content: "Situation: Checkout was slow. Task: stabilize conversion. Action: added React profiling and API caching. Result: improved conversion by 12%.",
      },
      {
        role: "assistant",
        content: "Score: 8/10\nStrengths: Clear metric.\nGaps: Add trade-offs.\nImproved Version: Strong STAR story.",
      },
    ],
  });

  assert.ok(room.storyReferences.length > 0);
  assert.ok(room.storyReferences[0].title.includes("proof story"));
  assert.ok(room.storyReferences[0].skillsProven.length > 0);
});
