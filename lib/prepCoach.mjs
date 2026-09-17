import { getDisplayName } from "./personalization.mjs";
import { getPrepLabel } from "./prepTopics.mjs";

const ACTIONS = [
  {
    id: "rapid-fire",
    label: "Rapid Fire",
    icon: "ti-bolt",
    description: "Ten quick questions with instant correction.",
  },
  {
    id: "deep-dive",
    label: "Deep Dive",
    icon: "ti-microscope",
    description: "One topic, production-level depth.",
  },
  {
    id: "mock-loop",
    label: "Mock Loop",
    icon: "ti-user-question",
    description: "Interview-style Q&A with scoring.",
  },
  {
    id: "weak-spot-review",
    label: "Weak Spot Review",
    icon: "ti-target-arrow",
    description: "Drill the current risk area.",
  },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function firstTopic(topics) {
  return topics?.[0]?.cat || "Full Stack";
}

function firstSubtopic(topics, index) {
  return topics?.[index]?.subs?.[0] || topics?.[0]?.subs?.[index] || firstTopic(topics);
}

function average(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function deriveMockScores(messages = [], structuredSessions = []) {
  const sessions = Array.isArray(structuredSessions) ? structuredSessions : [structuredSessions];
  const turns = sessions.flatMap(session => session?.turns || []);
  if (turns.length) return turns.map(turn => turn.score?.value).filter(Number.isFinite);
  return messages.filter(message => message.role === "assistant" && !message.streaming && !message.interrupted && !message.replay)
    .flatMap(message => { const match = String(message.content || "").match(/(?:overall\s*)?score\s*:?\s*(\d+(?:\.\d+)?)\s*\/\s*10/i); return match ? [clamp(Number(match[1]), 0, 10)] : []; });
}

export function buildPrepActionPrompt({ actionId, profile, topic, focusArea }) {
  const name = getDisplayName(profile);
  const stack = profile?.stack || "full stack";
  const target = topic || focusArea || "interview prep";

  const prompts = {
    "rapid-fire": `Run a rapid-fire interview drill for ${name} on ${target}, with extra attention to ${focusArea || target}. Use ${stack} examples where helpful. Ask 10 short questions one at a time and give immediate correction after each answer.`,
    "deep-dive": `Give ${name} a senior-level deep dive on ${target}, with extra attention to ${focusArea || target}. Explain concepts, common interview traps, production trade-offs, and include examples aligned to ${stack}.`,
    "mock-loop": `Start a realistic mock interview for ${name} on ${target}, with extra attention to ${focusArea || target}. Ask one question at a time, score each answer, and keep follow-ups focused on interview signal.`,
    "weak-spot-review": `Help ${name} improve the weak spot "${focusArea || target}". Diagnose gaps, teach the core idea, ask practice questions, and end with a concise cheat sheet.`,
  };

  return prompts[actionId] || prompts["mock-loop"];
}

export function buildPrepCommandCenter({ profile, topics = [], weakSpots = [], mockScores = [] }) {
  const name = getDisplayName(profile);
  const stack = profile?.stack || "full stack";
  const topic = firstTopic(topics);
  const focusArea = weakSpots[0] || topic;
  const warmupTopic = firstSubtopic(topics, 0);
  const coreTopic = firstSubtopic(topics, 1);
  const recentScores = mockScores.slice(-5);
  const scoreAverage = average(recentScores);
  const readinessScore = scoreAverage === null
    ? null
    : Math.round(clamp(scoreAverage * 10, 0, 100));
  const readinessLabel = readinessScore === null
    ? "Not assessed — complete a scored answer"
    : recentScores.length < 5 ? "Limited practice evidence — not a readiness estimate"
    : "Recent answer average — not a prediction of interview outcomes";

  const dailyPlan = [
    {
      title: "Warm up",
      detail: `Explain ${warmupTopic} in 90 seconds.`,
      minutes: 8,
      prompt: `Run an 8-minute warm-up for ${name} on ${warmupTopic}. Ask me to explain it in 90 seconds, then evaluate clarity, missing fundamentals, and one improvement. Use ${stack} examples where helpful.`,
    },
    {
      title: "Core drill",
      detail: `Practice ${coreTopic} with examples.`,
      minutes: 18,
      prompt: `Run an 18-minute core drill for ${name} on ${coreTopic}. Teach the key idea briefly, ask two practical questions, and include examples aligned to ${stack}.`,
    },
    {
      title: "Mock signal",
      detail: `Answer one scored ${focusArea} interview question.`,
      minutes: 20,
      prompt: `Start a 20-minute scored mock signal for ${name} on ${focusArea}. Ask one realistic interview question first, wait for my answer, then reply with Score: X/10, strengths, gaps, and one follow-up.`,
    },
  ];

  const actions = ACTIONS.map((action) => ({
    ...action,
    prompt: buildPrepActionPrompt({
      actionId: action.id,
      profile,
      topic,
      focusArea,
    }),
  }));

  return {
    prepLabel: getPrepLabel(profile?.stack),
    readinessScore,
    readinessLabel,
    focusArea,
    focusPrompt: `Help ${name} practice the focus area "${focusArea}". Start with one high-signal interview question, then score my answer and give a concise improvement plan using ${stack} examples where helpful.`,
    dailyPlan,
    actions,
  };
}
