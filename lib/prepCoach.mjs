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

export function deriveMockScores(messages = []) {
  return messages
    .filter((message) => message.role === "assistant")
    .flatMap((message) => {
      const matches = String(message.content || "").matchAll(/Score:\s*(\d+(?:\.\d+)?)\s*\/\s*10/gi);
      return Array.from(matches, ([, score]) => clamp(Number(score), 0, 10));
    });
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
  const topic = firstTopic(topics);
  const focusArea = weakSpots[0] || topic;
  const recentScores = mockScores.slice(-5);
  const scoreAverage = average(recentScores);
  const readinessScore = scoreAverage === null
    ? null
    : Math.round(clamp(scoreAverage * 10 - Math.min(weakSpots.length, 5) * 2, 35, 98));
  const readinessLabel =
    readinessScore === null
      ? "Start a scored mock to measure readiness"
      : readinessScore >= 85
      ? "Interview ready"
      : readinessScore >= 70
        ? "Interview momentum building"
        : "Needs focused reps";

  const dailyPlan = [
    {
      title: "Warm up",
      detail: `Explain ${firstSubtopic(topics, 0)} in 90 seconds.`,
      minutes: 8,
    },
    {
      title: "Core drill",
      detail: `Practice ${firstSubtopic(topics, 1)} with examples.`,
      minutes: 18,
    },
    {
      title: "Mock signal",
      detail: `Answer one scored ${focusArea} interview question.`,
      minutes: 20,
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
    dailyPlan,
    actions,
  };
}
