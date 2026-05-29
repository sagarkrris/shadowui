import { getDisplayName } from "./personalization.mjs";
import { getPrepLabel } from "./prepTopics.mjs";

const MISTAKE_PATTERNS = [
  {
    topic: "Edge cases",
    pattern: /edge cases?|boundary|corner cases?/i,
    correction: "Name the boundary conditions before coding: empty input, one item, null or invalid values, duplicates, limits, and failure cases.",
  },
  {
    topic: "Trade-offs",
    pattern: /trade-?offs?|pros and cons|alternative/i,
    correction: "Compare at least two approaches, explain why you chose one, and mention when the other approach would be better.",
  },
  {
    topic: "Complexity analysis",
    pattern: /complexity|time\/space|big o|memory/i,
    correction: "State time and space complexity, explain the driver of each cost, and call out what changes with input size.",
  },
  {
    topic: "System design depth",
    pattern: /scalability|capacity|partition|cache|queue|availability|latency/i,
    correction: "Clarify scale, APIs, data model, bottlenecks, failure modes, observability, and rollout trade-offs.",
  },
  {
    topic: "Behavioral structure",
    pattern: /star|situation|task|action|result|behavioral/i,
    correction: "Use STAR: set context briefly, explain your action clearly, quantify the result, and close with learning.",
  },
  {
    topic: "Testing strategy",
    pattern: /test|coverage|mock|integration|unit/i,
    correction: "Explain the test pyramid for this case: fast unit tests, focused integration tests, and one user-level confidence check.",
  },
];

const STORY_SKILLS = [
  { name: "Java", pattern: /java|spring|jvm|junit|mockito/i },
  { name: "React", pattern: /react|frontend|ui|component|next\.?js/i },
  { name: "System Design", pattern: /system design|architecture|scale|scalability|cache|queue|kafka|latency/i },
  { name: "Leadership", pattern: /led|owned|mentored|aligned|stakeholder|collaboration|conflict|manager/i },
  { name: "Testing", pattern: /test|junit|mockito|pytest|jest|coverage|qa/i },
  { name: "Databases", pattern: /sql|postgres|database|query|index|transaction/i },
  { name: "Cloud", pattern: /aws|azure|gcp|cloud|lambda|ecs|s3/i },
  { name: "Observability", pattern: /log|metric|trace|dashboard|monitor|alert|observability/i },
];

const HEATMAP_DIMENSIONS = [
  { label: "Correctness", aliases: ["Correctness"] },
  { label: "Depth", aliases: ["Depth"] },
  { label: "Examples", aliases: ["Examples"] },
  { label: "Trade-offs", aliases: ["Trade-offs", "Tradeoffs"] },
  { label: "Communication", aliases: ["Communication", "Communication clarity"] },
  { label: "Follow-up readiness", aliases: ["Follow-up readiness", "Follow up readiness"] },
];

const WEAK_SPOT_RADAR_CATEGORIES = [
  {
    label: "Trade-offs",
    pattern: /trade-?offs?|alternative|pros and cons|why choose|why this/i,
    correction: "Compare two viable options, state your choice, and name when the other option wins.",
  },
  {
    label: "Edge cases",
    pattern: /edge cases?|boundary|corner cases?|empty input|null|duplicate|limit/i,
    correction: "Call out boundaries before solving: empty, one item, invalid input, duplicates, limits, and failure paths.",
  },
  {
    label: "Complexity",
    pattern: /complexity|time\/space|big o|runtime|memory/i,
    correction: "State time and space cost, explain the driver, and say what changes as input size grows.",
  },
  {
    label: "Communication",
    pattern: /communication|clarity|structure|concise|rambl|unclear|hard to follow/i,
    correction: "Lead with the answer, then structure the reasoning in crisp steps with a clear close.",
  },
  {
    label: "System design depth",
    pattern: /system design depth|scalability|capacity|partition|cache|queue|availability|latency|bottleneck|observability|rollout/i,
    correction: "Cover requirements, APIs, data model, scale, bottlenecks, failure modes, observability, and rollout.",
  },
  {
    label: "Missing metrics",
    pattern: /missing metrics?|metrics?|quantif|measurable|impact|numbers?|percent|latency|revenue|users/i,
    correction: "Attach measurable impact: latency, cost, users, conversion, throughput, incidents, or time saved.",
  },
];

function firstTopic(topics) {
  return topics?.[0]?.cat || "Core stack";
}

function firstSubtopic(topics, index) {
  return topics?.[index]?.subs?.[0] || topics?.[0]?.subs?.[index] || firstTopic(topics);
}

function average(values) {
  if (!values?.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function extractScore(content) {
  const match = String(content || "").match(/score:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i);
  return match ? Number(match[1]) : null;
}

function extractGapSummary(content) {
  const line = String(content || "")
    .split("\n")
    .find((item) => /gaps?:|miss|weak|shallow|improve|trade|complex|test/i.test(item));

  return line?.replace(/^\*\*?gaps?:\*\*?\s*/i, "").trim() || "Review the feedback and retry this topic.";
}

function extractSection(content, headings = []) {
  const text = String(content || "");
  const headingPattern = headings.join("|");
  const match = text.match(new RegExp(`(?:^|\\n)\\s*(?:\\*\\*)?(${headingPattern})(?:\\*\\*)?\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*(?:\\*\\*)?(?:Score|Strengths|Gaps|Ideal Answer|Improved Version|Your Answer|Follow-up|Next Steps)(?:\\*\\*)?\\s*:|$)`, "i"));
  return match?.[2]?.trim() || "";
}

function preview(value, fallback = "Recent answer") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > 92 ? `${text.slice(0, 89)}...` : text;
}

function dateOnly(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Current session";
  return date.toISOString().slice(0, 10);
}

function diffDays(left, right) {
  const leftDate = new Date(`${dateOnly(left)}T00:00:00.000Z`);
  const rightDate = new Date(`${dateOnly(right)}T00:00:00.000Z`);
  if (Number.isNaN(leftDate.getTime()) || Number.isNaN(rightDate.getTime())) return 0;
  return Math.round((leftDate - rightDate) / 86400000);
}

function topicFromAnswer(value) {
  return preview(value, "Mock session").slice(0, 64);
}

function extractStarPart(answer, heading, nextHeadings) {
  const names = [heading, ...nextHeadings].join("|");
  const match = String(answer || "").match(new RegExp(`${heading}\\s*:\\s*([\\s\\S]*?)(?=\\b(?:${names})\\s*:|$)`, "i"));
  return preview(match?.[1], "");
}

function inferStorySkills(answer, profile = {}) {
  const text = [answer, profile?.stack, profile?.position].join(" ");
  return STORY_SKILLS.filter((skill) => skill.pattern.test(text)).map((skill) => skill.name).slice(0, 5);
}

function extractImpactMetrics(answer) {
  return Array.from(String(answer || "").matchAll(/\b\d+(?:\.\d+)?\s*(?:%|percent|x|k|m|million|ms|sec|seconds|users|requests|latency|hours|days|cost|revenue)\b|\b\d+(?:\.\d+)?%/gi))
    .map((match) => match[0])
    .slice(0, 4);
}

function rubricScore(content, aliases) {
  const text = String(content || "");
  for (const alias of aliases) {
    const match = text.match(new RegExp(`${alias}\\s*:\\s*(\\d+(?:\\.\\d+)?)\\s*\\/\\s*10`, "i"));
    if (match) return Number(match[1]);
  }
  return null;
}

export function deriveMockReplayTimelines(messages = []) {
  const replays = [];

  messages.forEach((message, index) => {
    if (message.role !== "assistant") return;

    const score = extractScore(message.content);
    if (score === null) return;

    const previousUserIndex = messages
      .slice(0, index)
      .map((item, itemIndex) => ({ item, itemIndex }))
      .reverse()
      .find(({ item }) => item.role === "user")?.itemIndex;
    if (previousUserIndex === undefined) return;

    const previousUser = messages[previousUserIndex];
    const previousQuestion = messages
      .slice(0, previousUserIndex)
      .reverse()
      .find((item) => item.role === "assistant");
    const question = preview(
      extractSection(previousQuestion?.content, ["Question"]) || previousQuestion?.content,
      "Previous mock question",
    );
    const yourAnswer = preview(previousUser?.content, "Your answer");
    const gaps = preview(extractSection(message.content, ["Gaps"]) || extractGapSummary(message.content));
    const idealAnswer = preview(extractSection(message.content, ["Ideal Answer"]), "Ideal answer was not captured.");
    const improvedAnswer = preview(extractSection(message.content, ["Improved Version"]), "Improved version was not captured.");
    const steps = [
      { label: "Question", detail: question, tone: "neutral" },
      { label: "Your answer", detail: yourAnswer, tone: "neutral" },
      { label: "Score", detail: `${score}/10`, tone: score >= 8 ? "strong" : "risk" },
      { label: "Gaps", detail: gaps, tone: "risk" },
      { label: "Ideal answer", detail: idealAnswer, tone: "neutral" },
      { label: "Improved answer", detail: improvedAnswer, tone: "strong" },
    ];
    const actions = [
      {
        label: "Replay mock",
        prompt: [
          "Replay this mock interview.",
          `Previous question: ${question}`,
          `My previous answer: ${yourAnswer}`,
          `Previous gaps: ${gaps}`,
          "Ask a similar question, wait for my answer, then compare Your Answer, Ideal Answer, and Improved Version.",
        ].join("\n"),
      },
      {
        label: "Save as proof story",
        prompt: `Turn this mock answer into a Proof Vault STAR story. Question: ${question}. Answer: ${yourAnswer}. Improved answer: ${improvedAnswer}. Extract Situation, Task, Action, Result, skills proven, metrics, weak spots, and where to use it.`,
      },
      {
        label: "Schedule weak-spot review",
        prompt: `Create a spaced weak-spot review from this mock gap: ${gaps}. Teach the correction, ask one similar question, and schedule follow-up reps at 1, 3, and 7 days.`,
      },
    ];

    replays.push({
      id: `replay-${index}`,
      date: dateOnly(message.createdAt || previousUser.createdAt),
      question,
      yourAnswer,
      score,
      gaps,
      idealAnswer,
      improvedAnswer,
      steps,
      actions,
      retryPrompt: actions[0].prompt,
    });
  });

  return replays.reverse().slice(0, 4);
}

export function deriveProofVaultStories(messages = [], profile = {}) {
  const stories = [];

  messages.forEach((message, index) => {
    if (message.role !== "assistant") return;

    const score = extractScore(message.content);
    if (score === null || score < 7) return;

    const previousUser = messages
      .slice(0, index)
      .reverse()
      .find((item) => item.role === "user");
    if (!previousUser?.content) return;

    const answer = String(previousUser.content);
    const gaps = extractGapSummary(message.content);
    const situation = extractStarPart(answer, "Situation", ["Task", "Action", "Result"]) || preview(answer, "Situation not separated yet");
    const task = extractStarPart(answer, "Task", ["Action", "Result"]) || "Clarify the responsibility and success criteria.";
    const action = extractStarPart(answer, "Action", ["Result"]) || "Capture the concrete decisions and actions you owned.";
    const result = extractStarPart(answer, "Result", []) || "Add a measurable outcome or learning.";
    const skillsProven = inferStorySkills(answer, profile);
    const impactMetrics = extractImpactMetrics(answer);
    const titleSkill = skillsProven[0] || "Interview";

    stories.push({
      id: `story-${index}`,
      title: `${titleSkill} proof story`,
      date: dateOnly(message.createdAt || previousUser.createdAt),
      score,
      situation,
      task,
      action,
      result,
      skillsProven,
      impactMetrics,
      targetFit: profile?.position || "Target role",
      weakSpots: gaps ? [gaps] : [],
      actions: [
        {
          label: "Use in behavioral",
          prompt: `Use this proof story in a behavioral interview. Convert it into a crisp STAR answer, keep the metric, and ask me one follow-up: ${answer}`,
        },
        {
          label: "Use in system design",
          prompt: `Use this proof story as system design evidence. Pull out scale, trade-offs, failure handling, and observability: ${answer}`,
        },
        {
          label: "Use in resume",
          prompt: `Turn this proof story into one strong resume bullet with action, scope, and measurable result: ${answer}`,
        },
      ],
    });
  });

  return stories.reverse().slice(0, 6);
}

export function deriveMockSessionHistory(messages = []) {
  const sessions = [];

  messages.forEach((message, index) => {
    if (message.role !== "assistant") return;

    const score = extractScore(message.content);
    if (score === null) return;

    const previousUser = [...messages.slice(0, index)].reverse().find((item) => item.role === "user");
    const answerPreview = preview(previousUser?.content, "Mock answer");
    const gapSummary = preview(extractGapSummary(message.content), "Review the feedback and retry this topic.");

    sessions.push({
      id: `session-${index}`,
      title: `Mock Session ${sessions.length + 1}`,
      score,
      date: dateOnly(message.createdAt || previousUser?.createdAt),
      topic: topicFromAnswer(previousUser?.content),
      answerPreview,
      gapSummary,
      retryPrompt: [
        "Retry this mock session.",
        `My previous answer was: ${answerPreview}`,
        `Previous feedback gap: ${gapSummary}`,
        "Ask a similar follow-up question, wait for my answer, then show Your Answer, Ideal Answer, and Improved Version.",
      ].join("\n"),
    });
  });

  return sessions.reverse().slice(0, 6);
}

export function buildDailyPrepPlan({
  profile,
  topics = [],
  weakSpots = [],
  mockScores = [],
  mistakeBank = [],
  interviews = [],
  now = new Date(),
} = {}) {
  const name = getDisplayName(profile);
  const today = dateOnly(now);
  const upcoming = interviews
    .filter((item) => item?.status !== "completed" && item?.date && item.date >= today)
    .sort((left, right) => left.date.localeCompare(right.date))[0];
  const recentAverage = average(mockScores.slice(-3));
  const weakFocus = weakSpots[0] || firstSubtopic(topics, 0);
  const mistakeFocus = mistakeBank[0]?.topic || weakSpots[1] || firstSubtopic(topics, 1);
  const companyFocus = upcoming?.company
    ? `${upcoming.company} ${upcoming.round || "interview"}`
    : firstTopic(topics);
  const summary = upcoming
    ? `${name}'s 30-minute plan prioritizes ${upcoming.company} on ${upcoming.date}.`
    : `${name}'s 30-minute plan targets the highest-risk prep gaps.`;
  const scoreContext = recentAverage === null
    ? "No scored mock average yet"
    : `Recent mock average ${Math.round(recentAverage * 10) / 10}/10`;
  const items = [
    {
      title: "Warm up the weak spot",
      focus: weakFocus,
      minutes: 8,
      prompt: `Run my 30-minute daily prep plan warm-up. Focus on ${weakFocus}. Keep it practical for ${profile?.position || "my target role"} and end with one check question.`,
    },
    {
      title: "Repair one repeated gap",
      focus: mistakeFocus,
      minutes: 8,
      prompt: `Run my 30-minute daily prep plan mistake repair. Teach ${mistakeFocus}, ask one interview question, and wait for my answer.`,
    },
    {
      title: "Company or role drill",
      focus: companyFocus,
      minutes: 9,
      prompt: `Run my 30-minute daily prep plan company drill for ${companyFocus}. ${scoreContext}. Ask one realistic question and score my answer.`,
    },
    {
      title: "Close with a replay",
      focus: "Answer polish",
      minutes: 5,
      prompt: "Run my 30-minute daily prep plan polish step. Ask me to improve one previous answer using Your Answer, Ideal Answer, and Improved Version.",
    },
  ];

  return {
    title: "Today's 30-Minute Plan",
    totalMinutes: 30,
    summary,
    items,
  };
}

function firstSkillName(items = [], fallback = "Core stack") {
  return items.map((item) => item?.name || item).filter(Boolean)[0] || fallback;
}

function skillNames(items = [], limit = 6) {
  return Array.from(new Set(
    (Array.isArray(items) ? items : [])
      .map((item) => item?.name || item)
      .filter(Boolean),
  )).slice(0, limit);
}

function latestMessageContent(messages = [], role) {
  return [...messages].reverse().find((message) => message?.role === role)?.content || "";
}

export function buildAnswerCoachActions({
  profile,
  messages = [],
  selectedCat = "",
  selectedSub = "",
  weakSpots = [],
} = {}) {
  const role = profile?.position || "target role";
  const answer = preview(latestMessageContent(messages, "user"), "Use my latest answer from the chat.");
  const feedback = preview(extractGapSummary(latestMessageContent(messages, "assistant")), "No scored feedback captured yet.");
  const focus = [selectedSub, selectedCat, weakSpots[0]].filter(Boolean).join(" / ") || "current interview answer";
  const base = [
    "Answer Coach",
    `Target role: ${role}`,
    `Focus: ${focus}`,
    `Current answer: ${answer}`,
    `Known feedback: ${feedback}`,
  ];
  const actions = [
    {
      label: "Make it concise",
      goal: "Make the answer concise and tight while preserving the strongest evidence.",
      instruction: "Return a shorter answer, remove filler, keep one clear result, and explain what changed.",
    },
    {
      label: "Make it senior-level",
      goal: "Make the answer senior-level by adding ownership, judgment, leadership, and business context.",
      instruction: "Elevate from task execution to decision quality, stakeholder alignment, risk control, and outcome ownership.",
    },
    {
      label: "Add metrics",
      goal: "Add metrics that quantify impact without inventing facts.",
      instruction: "Ask for missing numbers when needed, then suggest measurable placeholders for latency, scale, revenue, cost, quality, or time saved.",
    },
    {
      label: "Add trade-offs",
      goal: "Add trade-offs and alternatives.",
      instruction: "Compare at least two approaches, state why one won, and mention when the rejected option would be better.",
    },
    {
      label: "Convert to STAR",
      goal: "Convert to STAR.",
      instruction: "Rewrite using Situation, Task, Action, Result headings, keep it interview-ready, and end with one likely follow-up question.",
    },
  ];

  return actions.map((action) => ({
    ...action,
    prompt: [...base, `Rewrite goal: ${action.goal}`, action.instruction].join("\n"),
  }));
}

export function buildResumeBulletGenerator({
  profile,
  jobDescriptionAnalysis = null,
  resumeAnalysis = null,
  proofStories = [],
} = {}) {
  const role = profile?.position || "target role";
  const jdGaps = skillNames(jobDescriptionAnalysis?.missingSkills, 4);
  const resumeGaps = skillNames(resumeAnalysis?.missingSkills, 4);
  const gaps = Array.from(new Set([...jdGaps, ...resumeGaps])).slice(0, 3);
  const fallbackGaps = gaps.length ? gaps : ["role impact"];
  const stories = proofStories.length ? proofStories : [{
    title: "Proof story needed",
    action: "Add a concrete project, decision, or production example.",
    result: "Add measurable impact.",
    impactMetrics: [],
    skillsProven: [],
  }];
  const suggestions = fallbackGaps.map((gap, index) => {
    const story = stories[index % stories.length] || stories[0];
    const storyAction = preview(story.action || story.situation || story.title, "Add a concrete project, decision, or production example.");
    const storyResult = preview(story.result, "Add measurable impact.");
    const metrics = (story.impactMetrics || []).filter(Boolean).slice(0, 2);
    const metricText = metrics.length ? metrics.join(" / ") : "measurable impact";
    const skills = Array.from(new Set([gap, ...skillNames(story.skillsProven, 3)])).slice(0, 4).join(", ");
    const after = `ATS-friendly ${role} bullet: Delivered ${gap} impact by ${storyAction.replace(/\.$/, "")}, improving ${storyResult.replace(/\.$/, "")} (${metricText}); keywords: ${skills}.`;

    return {
      id: `resume-bullet-${index + 1}`,
      gap,
      storyTitle: story.title || "Proof story",
      before: `${story.title || "Proof story"}: ${storyAction} Result: ${storyResult}`,
      after,
      prompt: [
        "Resume Bullet Generator",
        `Target role: ${role}`,
        `JD gap: ${gap}`,
        `Proof Vault story: ${story.title || "Proof story"}`,
        `Before: ${storyAction} Result: ${storyResult}`,
        `After draft: ${after}`,
        "Generate an impact-based, ATS-friendly, role-specific resume bullet with a before/after comparison. Do not invent metrics; ask me for missing numbers if needed.",
      ].join("\n"),
    };
  });

  return {
    title: "Resume Bullet Generator",
    summary: `Impact bullets for ${role} using JD gaps and Proof Vault stories.`,
    gaps: fallbackGaps,
    suggestions,
  };
}

export function buildGuidedPrepMissions({
  profile,
  topics = [],
  weakSpots = [],
  mockScores = [],
  mistakeBank = [],
  interviews = [],
  resumeAnalysis = null,
  jobDescriptionAnalysis = null,
  proofStories = [],
  activityDates = [],
  now = new Date(),
} = {}) {
  const name = getDisplayName(profile);
  const today = dateOnly(now);
  const upcoming = interviews
    .filter((item) => item?.status !== "completed" && item?.date && item.date >= today)
    .sort((left, right) => left.date.localeCompare(right.date))[0] || null;
  const recentAverage = average(mockScores.slice(-3));
  const jdGap = firstSkillName(jobDescriptionAnalysis?.missingSkills, firstSubtopic(topics, 0));
  const resumeGap = firstSkillName(resumeAnalysis?.missingSkills, firstSubtopic(topics, 1));
  const weakFocus = weakSpots[0] || mistakeBank[0]?.topic || firstSubtopic(topics, 2);
  const storyFocus = proofStories.length ? proofStories[0].title : "Behavioral STAR story";
  const companyContext = upcoming?.company ? `${upcoming.company} ${upcoming.round || "interview"}` : firstTopic(topics);
  const staleActivity = !activityDates.map(dateOnly).filter(Boolean).includes(today);
  const scoreContext = recentAverage === null ? "No scored mock average yet" : `recent mock average ${Math.round(recentAverage * 10) / 10}/10`;
  const why = [
    jobDescriptionAnalysis ? `JD match is ${jobDescriptionAnalysis.score || 0}%, so the first mission targets ${jdGap}.` : `No JD match yet, so the first mission uses ${jdGap}.`,
    resumeAnalysis ? `Resume match is ${resumeAnalysis.score || 0}%, so proof must improve around ${resumeGap}.` : `Resume gaps are not analyzed yet, so InterviewIQ will use your selected stack.`,
    `${scoreContext}; weak-spot focus is ${weakFocus}.`,
    upcoming ? `${upcoming.company} is scheduled for ${upcoming.date}.` : "No scheduled interview is attached yet.",
  ];
  const tasks = [
    {
      id: "mission-jd-gap",
      signal: "JD Gap",
      title: "Close the role gap",
      focus: jdGap,
      minutes: 12,
      prompt: `Guided Prep Mission for ${name}: close the JD gap "${jdGap}" for ${profile?.position || "my target role"}. Explain the concept briefly, ask one realistic interview question, wait for my answer, then score it and give one resume proof bullet.`,
    },
    {
      id: "mission-weak-spot",
      signal: "Weak Spot",
      title: "Repair the highest-risk answer pattern",
      focus: weakFocus,
      minutes: 10,
      prompt: `Guided Prep Mission for ${name}: repair my weak spot "${weakFocus}". Teach the correction, ask one role-specific question, wait for my answer, then show Your Answer, Ideal Answer, Improved Version, and Score: X/10.`,
    },
    {
      id: "mission-story",
      signal: proofStories.length ? "Story Coverage" : "Proof Story",
      title: "Polish interview proof",
      focus: proofStories.length ? storyFocus : resumeGap,
      minutes: 8,
      prompt: `Guided Prep Mission for ${name}: create or polish one proof story for ${companyContext}. Use STAR, include measurable impact, connect it to ${resumeGap}, and ask one follow-up question.`,
    },
  ];

  return {
    title: "Guided Prep Mission",
    summary: upcoming
      ? `${name}'s next three moves are tuned for ${upcoming.company} on ${upcoming.date}.`
      : `${name}'s next three moves are tuned from mock scores, gaps, and selected stack.`,
    status: staleActivity ? "Ready for today's first rep" : "Practice logged today",
    tasks,
    why,
    completionImpact: {
      offerReadinessDelta: clamp(tasks.length * 4 + (staleActivity ? 3 : 1), 1, 18),
      xp: tasks.reduce((sum, task) => sum + task.minutes, 0) * 2,
      weakSpotsReduced: Math.min(2, weakSpots.length || mistakeBank.length || 1),
    },
  };
}

export function buildPrepProgressDashboard({
  weakSpots = [],
  mockScores = [],
  mistakeBank = [],
  messages = [],
} = {}) {
  const completedMocks = mockScores.length;
  const averageScore = completedMocks ? Math.round(average(mockScores) * 10) / 10 : null;
  const weakSpotCount = weakSpots.length;
  const mistakeCount = mistakeBank.length;
  const recentAssistantSignals = messages
    .filter((message) => message.role === "assistant" && /score:|gaps?:|strengths?:/i.test(message.content || ""))
    .length;
  const nextFocus = weakSpots[0] || mistakeBank[0]?.topic || "scored mock interview";

  return {
    completedMocks,
    averageScore,
    weakSpotCount,
    mistakeCount,
    recentAssistantSignals,
    readinessLabel: averageScore === null
      ? "No scored mocks yet"
      : averageScore >= 8
        ? "Interview-ready signal"
        : averageScore >= 6.5
          ? "Improving"
          : "Needs focused reps",
    nextActionPrompt: `Run a focused mock on ${nextFocus}. Ask one realistic interview question, wait for my answer, then score it with correctness, depth, examples, trade-offs, communication clarity, and follow-up readiness.`,
  };
}

export function buildOfferReadinessScore({
  resumeAnalysis = null,
  jobDescriptionAnalysis = null,
  mockScores = [],
  weakSpots = [],
  proofStories = [],
  companyPrepScore = 0,
} = {}) {
  const mockAverage = average(mockScores);
  const factors = [
    { label: "Resume Match", score: Number.isFinite(resumeAnalysis?.score) ? resumeAnalysis.score : 0 },
    { label: "JD Match", score: Number.isFinite(jobDescriptionAnalysis?.score) ? jobDescriptionAnalysis.score : 0 },
    { label: "Mock Average", score: mockAverage === null ? 0 : mockAverage * 10 },
    { label: "Weak Spot Control", score: clamp(100 - Math.min(weakSpots.length, 6) * 12) },
    { label: "Story Coverage", score: clamp((proofStories.length / 3) * 100) },
    { label: "Company Prep", score: Number.isFinite(companyPrepScore) ? companyPrepScore : 0 },
  ].map((factor) => ({ ...factor, score: clamp(factor.score) }));
  const score = clamp(factors.reduce((sum, factor) => sum + factor.score, 0) / factors.length);
  const weakest = [...factors].sort((left, right) => left.score - right.score)[0];

  return {
    score,
    label: score >= 85 ? "Offer-ready signal" : score >= 70 ? "Close to offer-ready" : "Needs focused prep",
    factors,
    weakest,
    nextActionPrompt: `Improve offer readiness by focusing on ${weakest.label}. Run one targeted mock, wait for my answer, then score it and give next actions.`,
  };
}

export function deriveAnswerQualityHeatmap(messages = []) {
  const assistantFeedback = messages.filter((message) => message.role === "assistant");
  const dimensions = HEATMAP_DIMENSIONS.map((dimension) => {
    const scores = assistantFeedback
      .map((message) => rubricScore(message.content, dimension.aliases))
      .filter((score) => Number.isFinite(score));
    const score = scores.length ? Math.round(average(scores) * 10) / 10 : 0;

    return {
      label: dimension.label,
      score,
      percent: clamp(score * 10),
      status: score >= 8 ? "Strong" : score >= 6.5 ? "Developing" : "Needs work",
    };
  });
  const strongest = [...dimensions].sort((left, right) => right.score - left.score)[0] || dimensions[0];
  const weakest = [...dimensions].sort((left, right) => left.score - right.score)[0] || dimensions[0];

  return {
    dimensions,
    strongest,
    weakest,
    summary: weakest?.score > 0
      ? `Strongest: ${strongest.label}. Improve: ${weakest.label}.`
      : "Complete scored mocks with rubric feedback to build the heatmap.",
  };
}

export function deriveWeakSpotRadar(messages = [], weakSpots = []) {
  const assistantFeedback = messages.filter((message) => message.role === "assistant");
  const weakSpotText = weakSpots.join("\n");
  const categories = WEAK_SPOT_RADAR_CATEGORIES.map((category) => {
    const messageHits = assistantFeedback.filter((message) => category.pattern.test(message.content || ""));
    const weakSpotHit = category.pattern.test(weakSpotText) ? 1 : 0;
    const count = messageHits.length + weakSpotHit;
    const evidence = messageHits
      .flatMap((message) => String(message.content || "").split("\n"))
      .find((line) => category.pattern.test(line))
      ?.replace(/\s+/g, " ")
      .trim() || "";

    return {
      label: category.label,
      count,
      score: clamp(count * 25),
      status: count >= 2 ? "Repeated" : count === 1 ? "Watch" : "Clear",
      correction: category.correction,
      evidence: preview(evidence, count ? "Mentioned in recent feedback." : "No recent signal."),
      prompt: [
        "Weak Spot Radar category drill.",
        `Focus weakness: ${category.label}.`,
        `Recent signal count: ${count}.`,
        `Correction: ${category.correction}`,
        "Run one strict timed question for this weakness, give no hints, use interruption follow-ups, then finish with a hire/no-hire scorecard and one repair drill.",
      ].join("\n"),
    };
  });
  const highestRisk = [...categories].sort((left, right) => right.count - left.count)[0] || categories[0];
  const repeatedCount = categories.filter((category) => category.count >= 2).length;

  return {
    categories,
    highestRisk,
    repeatedCount,
    summary: highestRisk?.count
      ? `${highestRisk.label} is the top repeated weakness; ${repeatedCount || 1} radar signal${(repeatedCount || 1) === 1 ? "" : "s"} need pressure reps.`
      : "No repeated weakness pattern yet. Complete scored mocks to populate the radar.",
    actionPrompt: [
      "Weak Spot Radar pressure drill.",
      `Top weakness: ${highestRisk?.label || "Interview fundamentals"}.`,
      `Correction: ${highestRisk?.correction || "Answer with structure, depth, trade-offs, and metrics."}`,
      "Run one strict timed question, give no hints, use interruption follow-ups, and finish with a hire/no-hire scorecard.",
    ].join("\n"),
  };
}

export function buildInterviewDayPack({
  profile,
  topics = [],
  interviews = [],
  jobDescriptionAnalysis = null,
  proofStories = [],
  weakSpots = [],
  now = new Date(),
} = {}) {
  const today = dateOnly(now);
  const upcoming = interviews
    .filter((item) => item?.status !== "completed" && item?.date && item.date >= today)
    .sort((left, right) => left.date.localeCompare(right.date))[0] || null;
  const targetCompany = upcoming?.company || "Next interview";
  const round = upcoming?.round || "Interview";
  const role = upcoming?.role || profile?.position || "Target role";
  const jdGaps = (jobDescriptionAnalysis?.missingSkills || []).map((skill) => skill.name || skill).filter(Boolean);
  const topicQuestions = topics.flatMap((topic) => [topic.cat, ...(topic.subs || [])]).filter(Boolean);
  const storyQuestions = proofStories.map((story) => `Use proof story: ${story.title}`);
  const questions = Array.from(new Set([
    ...jdGaps.map((skill) => `Explain ${skill} for ${role}.`),
    ...weakSpots.map((spot) => `Repair weak spot: ${spot}.`),
    ...storyQuestions,
    ...topicQuestions.slice(0, 8).map((topic) => `Answer a likely ${topic} question.`),
  ])).slice(0, 10);
  const context = `${targetCompany} ${round}`.trim();

  return {
    company: targetCompany,
    role,
    round,
    date: upcoming?.date || "",
    daysUntil: upcoming?.date ? diffDays(upcoming.date, today) : null,
    notes: upcoming?.notes || "",
    questions,
    proofStories: proofStories.slice(0, 3),
    warmups: [
      {
        title: "Opening pitch",
        minutes: 5,
        prompt: `Interview Day Pack for ${context}: help me deliver a crisp opening pitch for ${role}.`,
      },
      {
        title: "Top risk drill",
        minutes: 10,
        prompt: `Interview Day Pack for ${context}: drill my highest-risk gap: ${jdGaps[0] || weakSpots[0] || firstTopic(topics)}.`,
      },
      {
        title: "Final mock signal",
        minutes: 15,
        prompt: `Interview Day Pack for ${context}: ask one realistic ${round} question, wait for my answer, then score it with next actions.`,
      },
    ],
  };
}

function buildRetryPrompt(topic, correction) {
  return [
    `Drill my interview weakness: ${topic}.`,
    `Teach the correction first: ${correction}`,
    "Then ask one realistic interview question and wait for my answer.",
    "After I answer, reply with Score: X/10, strengths, gaps, and an improved answer.",
  ].join("\n");
}

export function deriveMistakeBank(messages = []) {
  const matches = [];

  messages.forEach((message, messageIndex) => {
    if (message.role !== "assistant") return;

    const content = String(message.content || "");
    MISTAKE_PATTERNS.forEach((mistake) => {
      if (!mistake.pattern.test(content)) return;

      matches.push({
        id: mistake.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        topic: mistake.topic,
        correction: mistake.correction,
        evidence: content.split("\n").find((line) => /gap|miss|weak|shallow|trade|complex|edge|test/i.test(line))?.trim() || "Mentioned in recent assistant feedback.",
        retryPrompt: buildRetryPrompt(mistake.topic, mistake.correction),
        messageIndex,
      });
    });
  });

  const latestByTopic = new Map();
  matches.forEach((item) => {
    latestByTopic.set(item.topic, item);
  });

  return MISTAKE_PATTERNS
    .map((mistake) => latestByTopic.get(mistake.topic))
    .filter(Boolean)
    .slice(0, 6);
}

export function buildInterviewRoadmap({
  profile,
  topics = [],
  weakSpots = [],
  mockScores = [],
} = {}) {
  const name = getDisplayName(profile);
  const stack = profile?.stack || getPrepLabel(profile?.stack);
  const prepLabel = getPrepLabel(profile?.stack);
  const recentAverage = average(mockScores.slice(-5));
  const scoreContext = recentAverage === null
    ? "No scored mock yet"
    : `Recent mock average ${Math.round(recentAverage * 10)}/100`;
  const focusQueue = [
    ...weakSpots,
    firstTopic(topics),
    firstSubtopic(topics, 0),
    firstSubtopic(topics, 1),
    firstSubtopic(topics, 2),
    "System Design",
    "Behavioral STAR story",
  ].filter(Boolean);

  const templates = [
    ["Foundation", 25, "Review fundamentals and explain concepts out loud."],
    ["Weak Spot Repair", 30, "Fix the highest-risk gap from recent feedback."],
    ["Implementation Drill", 35, "Practice a hands-on coding or API scenario."],
    ["System Design", 40, "Walk through architecture, trade-offs, and failure modes."],
    ["Behavioral Signal", 25, "Prepare one STAR story with measurable impact."],
    ["Scored Mock", 45, "Run a realistic mock round and capture a score."],
    ["Polish", 30, "Retry missed topics and tighten final answer structure."],
  ];

  const days = templates.map(([title, minutes, detail], index) => {
    const focus = focusQueue[index % focusQueue.length] || "Interview prep";

    return {
      day: index + 1,
      title,
      focus,
      minutes,
      detail,
      prompt: `Run day ${index + 1} of ${name}'s ${prepLabel} roadmap. Focus: ${focus}. Stack: ${stack}. Spend about ${minutes} minutes. ${detail} End with Score: X/10 if this includes an answer attempt, plus next steps.`,
    };
  });

  return {
    title: "7-Day Interview Roadmap",
    summary: `${name}'s ${prepLabel} plan for ${stack}. ${scoreContext}.`,
    days,
  };
}
