import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAnswerCoachActions,
  buildInterviewDayPack,
  buildDailyPrepPlan,
  buildGuidedPrepMissions,
  buildOfferReadinessScore,
  buildPrepProgressDashboard,
  buildInterviewRoadmap,
  buildResumeBulletGenerator,
  deriveAnswerQualityHeatmap,
  deriveMockReplayTimelines,
  deriveMockSessionHistory,
  deriveMistakeBank,
  deriveProofVaultStories,
  deriveWeakSpotRadar,
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

test("builds a progress dashboard from mocks, weak spots, and mistake history", () => {
  const dashboard = buildPrepProgressDashboard({
    weakSpots: ["Trade-offs", "Complexity analysis"],
    mockScores: [6, 7, 8],
    mistakeBank: [
      { topic: "Trade-offs" },
      { topic: "Testing strategy" },
    ],
    messages: [
      { role: "assistant", content: "Score: 6/10\nGaps: Trade-offs were weak." },
      { role: "assistant", content: "Score: 8/10\nStrengths: Clear answer." },
    ],
  });

  assert.equal(dashboard.completedMocks, 3);
  assert.equal(dashboard.averageScore, 7);
  assert.equal(dashboard.weakSpotCount, 2);
  assert.equal(dashboard.mistakeCount, 2);
  assert.match(dashboard.nextActionPrompt, /Trade-offs/);
});

test("derives mock session history cards from scored feedback", () => {
  const sessions = deriveMockSessionHistory([
    { role: "user", content: "Explain Spring Boot dependency injection with constructor injection.", createdAt: "2026-05-26T09:00:00.000Z" },
    { role: "assistant", content: "Score: 7/10\nStrengths: Good basics.\nGaps: Add testing trade-offs.\nIdeal Answer: Use constructor injection.", createdAt: "2026-05-26T09:01:00.000Z" },
    { role: "user", content: "Design a cache for product lookups.", createdAt: "2026-05-26T10:00:00.000Z" },
    { role: "assistant", content: "Score: 8/10\nGaps: Mention invalidation and observability.", createdAt: "2026-05-26T10:01:00.000Z" },
  ]);

  assert.equal(sessions.length, 2);
  assert.equal(sessions[0].score, 8);
  assert.equal(sessions[0].date, "2026-05-26");
  assert.match(sessions[0].topic, /Design a cache/);
  assert.match(sessions[0].answerPreview, /Design a cache/);
  assert.match(sessions[0].gapSummary, /invalidation/);
  assert.match(sessions[0].retryPrompt, /Design a cache/);
});

test("derives mock replay timelines with question answer gaps and improved answer", () => {
  const replays = deriveMockReplayTimelines([
    { role: "assistant", content: "Question: Design a cache for product lookups.", createdAt: "2026-05-26T09:00:00.000Z" },
    { role: "user", content: "I would use Redis with TTL.", createdAt: "2026-05-26T09:01:00.000Z" },
    {
      role: "assistant",
      content: [
        "Score: 6/10",
        "Gaps: Missing invalidation and observability.",
        "Ideal Answer: Cover read-through cache, TTL, invalidation, metrics, and fallback.",
        "Improved Version: I would use Redis with clear invalidation rules, metrics, and fallback to DB.",
      ].join("\n"),
      createdAt: "2026-05-26T09:02:00.000Z",
    },
  ]);

  assert.equal(replays.length, 1);
  assert.match(replays[0].question, /Design a cache/);
  assert.match(replays[0].yourAnswer, /Redis/);
  assert.equal(replays[0].score, 6);
  assert.match(replays[0].gaps, /invalidation/);
  assert.match(replays[0].idealAnswer, /read-through/);
  assert.match(replays[0].improvedAnswer, /fallback/);
  assert.match(replays[0].retryPrompt, /Design a cache/);
  assert.deepEqual(
    replays[0].steps.map((step) => step.label),
    ["Question", "Your answer", "Score", "Gaps", "Ideal answer", "Improved answer"],
  );
  assert.ok(replays[0].actions.some((action) => action.label === "Save as proof story"));
  assert.ok(replays[0].actions.some((action) => action.label === "Schedule weak-spot review"));
});

test("builds a thirty minute daily prep plan from weak spots and upcoming interviews", () => {
  const plan = buildDailyPrepPlan({
    profile,
    topics,
    weakSpots: ["Trade-offs"],
    mockScores: [6, 7],
    mistakeBank: [{ topic: "Testing strategy", correction: "Add test pyramid coverage." }],
    interviews: [{ company: "Amazon", role: "SDE II", date: "2026-05-27", round: "System Design", status: "scheduled" }],
    now: "2026-05-26T00:00:00.000Z",
  });

  assert.equal(plan.totalMinutes, 30);
  assert.equal(plan.items.reduce((sum, item) => sum + item.minutes, 0), 30);
  assert.match(plan.summary, /Amazon/);
  assert.ok(plan.items.some((item) => item.focus.includes("Trade-offs")));
  assert.ok(plan.items.some((item) => item.focus.includes("Testing strategy")));
  assert.ok(plan.items.every((item) => item.prompt.includes("30-minute daily prep plan")));
});

test("builds guided prep missions from resume JD mock and interview signals", () => {
  const missions = buildGuidedPrepMissions({
    profile,
    topics,
    weakSpots: ["Trade-offs"],
    mockScores: [6, 7],
    mistakeBank: [{ topic: "Testing strategy", correction: "Add test pyramid coverage." }],
    interviews: [{ company: "Amazon", role: "SDE II", date: "2026-05-30", round: "System Design", status: "scheduled" }],
    resumeAnalysis: { score: 68, missingSkills: [{ name: "AWS" }] },
    jobDescriptionAnalysis: { score: 58, missingSkills: [{ name: "Message Queues" }] },
    proofStories: [{ title: "Latency story" }],
    activityDates: ["2026-05-28"],
    now: "2026-05-29T00:00:00.000Z",
  });

  assert.equal(missions.title, "Guided Prep Mission");
  assert.ok(missions.summary.includes("Amazon"));
  assert.equal(missions.tasks.length, 3);
  assert.ok(missions.tasks.every((task) => task.prompt.includes("Guided Prep Mission")));
  assert.ok(missions.tasks.some((task) => task.signal === "JD Gap"));
  assert.ok(missions.tasks.some((task) => task.focus.includes("Trade-offs") || task.focus.includes("Testing strategy")));
  assert.ok(missions.why.length >= 3);
  assert.ok(missions.completionImpact.offerReadinessDelta > 0);
});

test("builds deterministic answer coach actions for common answer rewrites", () => {
  const actions = buildAnswerCoachActions({
    profile,
    messages: [
      { role: "assistant", content: "Question: Explain how you handled a production outage." },
      { role: "user", content: "We had checkout latency and I added Redis caching but I did not mention metrics." },
      { role: "assistant", content: "Score: 6/10\nGaps: Add metrics and trade-offs." },
    ],
    selectedCat: "Behavioral",
    selectedSub: "Production incidents",
    weakSpots: ["Trade-offs"],
  });

  assert.deepEqual(
    actions.map((action) => action.label),
    ["Make it concise", "Make it senior-level", "Add metrics", "Add trade-offs", "Convert to STAR"],
  );
  assert.ok(actions.every((action) => action.prompt.includes("Answer Coach")));
  assert.ok(actions.every((action) => action.prompt.includes("Backend Developer")));
  assert.ok(actions.every((action) => action.prompt.includes("checkout latency")));
  assert.match(actions.find((action) => action.label === "Make it concise").prompt, /concise|tight/i);
  assert.match(actions.find((action) => action.label === "Make it senior-level").prompt, /senior-level|leadership/i);
  assert.match(actions.find((action) => action.label === "Add metrics").prompt, /metric|quant/i);
  assert.match(actions.find((action) => action.label === "Add trade-offs").prompt, /trade-off/i);
  assert.match(actions.find((action) => action.label === "Convert to STAR").prompt, /Situation|Task|Action|Result/);
});

test("builds ATS-friendly resume bullet suggestions from JD gaps and proof stories", () => {
  const generator = buildResumeBulletGenerator({
    profile,
    jobDescriptionAnalysis: {
      missingSkills: [{ name: "AWS" }, { name: "Message Queues" }],
    },
    resumeAnalysis: {
      missingSkills: [{ name: "System Design" }],
    },
    proofStories: [
      {
        title: "Checkout latency story",
        action: "I added Redis caching, JUnit coverage, and dashboards.",
        result: "Latency dropped 42% for 2M requests.",
        impactMetrics: ["42%", "2M requests"],
        skillsProven: ["Java", "Testing"],
      },
    ],
  });

  assert.equal(generator.title, "Resume Bullet Generator");
  assert.ok(generator.summary.includes("Backend Developer"));
  assert.equal(generator.suggestions.length, 3);
  assert.ok(generator.suggestions.every((suggestion) => suggestion.before));
  assert.ok(generator.suggestions.every((suggestion) => suggestion.after.includes("Backend Developer")));
  assert.ok(generator.suggestions.every((suggestion) => suggestion.after.includes("ATS-friendly")));
  assert.ok(generator.suggestions.every((suggestion) => suggestion.prompt.includes("Resume Bullet Generator")));
  assert.ok(generator.suggestions.some((suggestion) => suggestion.gap === "AWS"));
  assert.match(generator.suggestions[0].after, /42%|2M requests/);
  assert.match(generator.suggestions[0].after, /AWS|Message Queues|System Design/);
});

test("derives a proof vault story bank from high-signal mock answers", () => {
  const stories = deriveProofVaultStories([
    { role: "assistant", content: "Question: Tell me about a time you improved API reliability.", createdAt: "2026-05-26T08:00:00.000Z" },
    { role: "user", content: "Situation: checkout APIs were timing out. Task: stabilize reliability. Action: I added Redis caching, JUnit coverage, and dashboards. Result: latency dropped 42% for 2M requests.", createdAt: "2026-05-26T08:01:00.000Z" },
    { role: "assistant", content: "Score: 8/10\nStrengths: Clear ownership and metrics.\nGaps: Add trade-offs.\nImproved Version: Strong STAR story with cache invalidation trade-offs.", createdAt: "2026-05-26T08:02:00.000Z" },
  ], profile);

  assert.equal(stories.length, 1);
  assert.match(stories[0].situation, /checkout/i);
  assert.match(stories[0].task, /stabilize/i);
  assert.match(stories[0].action, /Redis/i);
  assert.match(stories[0].result, /42%/);
  assert.ok(stories[0].skillsProven.some((skill) => skill === "Java" || skill === "Testing"));
  assert.ok(stories[0].impactMetrics.includes("42%"));
  assert.ok(stories[0].actions.some((action) => /behavioral/i.test(action.label)));
});

test("builds an executive offer readiness score from prep signals", () => {
  const readiness = buildOfferReadinessScore({
    resumeAnalysis: { score: 78 },
    jobDescriptionAnalysis: { score: 70 },
    mockScores: [7, 8],
    weakSpots: ["Trade-offs"],
    proofStories: [{ id: "story-1" }, { id: "story-2" }],
    companyPrepScore: 80,
  });

  assert.ok(readiness.score >= 65);
  assert.equal(readiness.factors.length, 6);
  assert.ok(readiness.factors.some((factor) => factor.label === "Story Coverage"));
  assert.match(readiness.nextActionPrompt, /offer readiness/i);
});

test("derives an answer quality heatmap from rubric scores and feedback gaps", () => {
  const heatmap = deriveAnswerQualityHeatmap([
    {
      role: "assistant",
      content: [
        "Score: 7/10",
        "Correctness: 8/10",
        "Depth: 6/10",
        "Examples: 7/10",
        "Trade-offs: 5/10",
        "Communication: 8/10",
        "Follow-up readiness: 6/10",
        "Gaps: Missing edge cases and metrics.",
      ].join("\n"),
    },
  ]);

  assert.equal(heatmap.dimensions.length, 6);
  assert.equal(heatmap.strongest.label, "Correctness");
  assert.equal(heatmap.weakest.label, "Trade-offs");
  assert.ok(heatmap.dimensions.every((dimension) => Number.isFinite(dimension.score)));
  assert.match(heatmap.summary, /Trade-offs/);
});

test("derives a weak spot radar from repeated weakness feedback", () => {
  const radar = deriveWeakSpotRadar([
    {
      role: "assistant",
      content: [
        "Score: 6/10",
        "Gaps: Missing trade-offs, edge cases, and complexity.",
        "Communication clarity: 5/10",
      ].join("\n"),
    },
    {
      role: "assistant",
      content: [
        "Score: 5/10",
        "Gaps: Trade-offs still weak. Missing metrics and system design depth around scaling.",
        "Communication clarity: 6/10",
      ].join("\n"),
    },
  ], ["Trade-offs"]);

  assert.equal(radar.categories.length, 6);
  assert.deepEqual(
    radar.categories.map((category) => category.label),
    ["Trade-offs", "Edge cases", "Complexity", "Communication", "System design depth", "Missing metrics"],
  );
  assert.equal(radar.repeatedCount, 2);
  assert.equal(radar.highestRisk.label, "Trade-offs");
  assert.ok(radar.categories.every((category) => Number.isFinite(category.score)));
  assert.ok(radar.categories.every((category) => Number.isFinite(category.count)));
  assert.ok(radar.categories.every((category) => category.prompt.includes(category.label)));
  assert.ok(radar.categories.every((category) => category.prompt.includes(category.correction)));
  assert.match(radar.summary, /Trade-offs/);
  assert.match(radar.actionPrompt, /Weak Spot Radar/);
  assert.match(radar.actionPrompt, /hire\/no-hire/i);
});

test("builds an interview day pack from the next scheduled round", () => {
  const pack = buildInterviewDayPack({
    profile,
    topics,
    interviews: [
      { company: "Amazon", role: "SDE II", date: "2026-05-30", round: "System Design", status: "scheduled", notes: "Focus on scale" },
    ],
    jobDescriptionAnalysis: { missingSkills: [{ name: "AWS" }, { name: "Message Queues" }] },
    proofStories: [{ title: "Latency reduction story", actions: [{ label: "Use in system design", prompt: "Use story" }] }],
    weakSpots: ["Trade-offs"],
    now: "2026-05-26T00:00:00.000Z",
  });

  assert.equal(pack.company, "Amazon");
  assert.equal(pack.daysUntil, 4);
  assert.ok(pack.questions.length <= 10);
  assert.ok(pack.questions.some((question) => /AWS|Message Queues|Trade-offs/.test(question)));
  assert.ok(pack.warmups.every((item) => item.prompt.includes("Interview Day Pack")));
});
