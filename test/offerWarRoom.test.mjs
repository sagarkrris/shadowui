import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCompanyWarLanes,
  buildInterviewDaySimulator,
  buildMockLoopPlan,
  buildOfferWarRoomModel,
  buildSpeechWarCoach,
  buildStoryVault,
  buildWeakSpotRevengeMode,
  createOfferWarRoomState,
} from "../lib/offerWarRoom.mjs";

test("offer war room creates safe persisted state defaults", () => {
  const state = createOfferWarRoomState();

  assert.match(state.companyTargets, /Amazon/);
  assert.equal(state.roleLevel, "Mid");
  assert.equal(state.selectedCompany, "Amazon");
});

test("offer war room builds company lanes and full loop prompts", () => {
  const lanes = buildCompanyWarLanes({
    companies: ["Amazon", "Google"],
    role: "Backend Engineer",
    roleLevel: "Senior",
    weakSpots: ["Trade-offs"],
  });
  const loop = buildMockLoopPlan({
    company: "Amazon",
    role: "Backend Engineer",
    roleLevel: "Senior",
    weakSpots: ["Trade-offs"],
  });

  assert.equal(lanes.length, 2);
  assert.match(lanes[0].dailyPrompt, /Amazon/);
  assert.match(lanes[0].loopPrompt, /bar raiser/i);
  assert.equal(loop.rounds.length, 5);
  assert.match(loop.rounds[0].prompt, /Recruiter/);
  assert.match(loop.rounds[4].prompt, /bar-raiser depth/i);
});

test("offer war room builds an interview-day simulator with runbook and final reporting", () => {
  const simulator = buildInterviewDaySimulator({
    company: "Google",
    role: "Backend Engineer",
    roleLevel: "Senior",
    weakSpots: ["Trade-offs"],
  });

  assert.equal(simulator.runbook.length, 5);
  assert.equal(simulator.runbook[0].slot, 1);
  assert.equal(simulator.runbook[1].durationMinutes, 45);
  assert.match(simulator.fullDayPrompt, /complete interview-day simulator/i);
  assert.match(simulator.fullDayPrompt, /final offer-readiness report/i);
  assert.match(simulator.finalReportPrompt, /48-hour repair plan/i);
  assert.equal(simulator.weaknessToWatch, "Trade-offs");
});

test("offer war room builds story vault weak spot revenge and speech coach", () => {
  const messages = [
    { role: "user", content: "Situation: Checkout was failing. Task: stabilize payments. Action: added idempotency keys and better tracing. Result: payment duplicates dropped 90%." },
    { role: "assistant", content: "Score: 8/10\nStrengths: strong result.\nGaps: add trade-offs." },
    { role: "assistant", content: "Gaps: Communication was a bit vague and trade-offs were shallow." },
  ];

  const stories = buildStoryVault({ messages, profile: { position: "Senior Backend Engineer", stack: "Java, Spring Boot" } });
  const revenge = buildWeakSpotRevengeMode({ messages, weakSpots: ["Trade-offs", "Communication"] });
  const speech = buildSpeechWarCoach({
    transcript: "Situation: latency spiked. Task: stabilize the API. Action: added tracing and rollback guardrails. Result: p95 fell 20%.",
    question: "Tell me about a production issue.",
    role: "Senior Backend Engineer",
  });

  assert.ok(stories.length >= 1);
  assert.match(stories[0].pressurePrompt, /follow-ups on ownership, trade-offs, metrics/i);
  assert.match(revenge.revengePrompt, /Weak-Spot Revenge Mode/i);
  assert.ok(revenge.categories.some((item) => item.label === "Trade-offs"));
  assert.ok(speech.review.clarityScore > 0);
  assert.match(speech.prompt, /Tell me about a production issue/);
});

test("offer war room model combines overview missions and final-day workflow", () => {
  const model = buildOfferWarRoomModel({
    state: {
      companyTargets: "Amazon, Google, Stripe",
      roleLevel: "Senior",
      selectedCompany: "Google",
      speechTranscript: "Situation: a release regressed search. Task: protect conversion. Action: narrowed the blast radius and rolled back. Result: recovered conversion by 11%.",
      speechQuestion: "Tell me about a production issue.",
    },
    profile: { position: "Senior Backend Engineer", stack: "Java, Spring Boot" },
    topics: [{ cat: "Backend", subs: ["Concurrency", "System Design"] }],
    weakSpots: ["Trade-offs", "Communication"],
    mockScores: [7, 8, 8],
    messages: [
      { role: "user", content: "Situation: Checkout latency spiked. Task: stabilize the service. Action: introduced caching and retries. Result: latency fell 24%." },
      { role: "assistant", content: "Score: 8/10\nTrade-offs: 7/10\nCommunication: 6/10\nStrengths: clear result.\nGaps: Communication was still vague." },
    ],
    careerToolkitState: {
      interviews: [{ company: "Amazon", round: "System Design", date: "2026-06-30", role: "Senior Backend Engineer" }],
      jobDescriptionAnalysis: { score: 68, missingSkills: [{ name: "AWS" }] },
      resumeAnalysis: { score: 71 },
    },
  });

  assert.equal(model.companies.length, 3);
  assert.equal(model.mockLoop.company, "Google");
  assert.equal(model.interviewDaySimulator.company, "Google");
  assert.equal(model.interviewDaySimulator.runbook.length, 5);
  assert.match(model.overview.mission, /next/i);
  assert.ok(model.dayPack.warmups.length >= 3);
  assert.ok(model.missionBoard.tasks.length >= 3);
});
