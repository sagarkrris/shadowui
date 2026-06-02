const AMAZON_PREP = {
  company: "Amazon",
  isSeeded: true,
  lastUpdated: "2026-05-22",
  caveat: "Seeded from public interview reports and prep guides. Use the resource links to refresh recent posts manually.",
  dsa: [
    {
      title: "Top K Frequent Elements",
      difficulty: "Medium",
      prompt: "Given a stream or array of values, return the K most frequent values and explain heap vs bucket trade-offs.",
      source: "LeetCode Discuss",
      date: "Recent reports vary",
    },
    {
      title: "Merge Intervals / Meeting Rooms",
      difficulty: "Medium",
      prompt: "Merge overlapping intervals or find minimum rooms/resources needed after sorting time ranges.",
      source: "Interview guides",
      date: "Common Amazon pattern",
    },
    {
      title: "LRU Cache",
      difficulty: "Medium",
      prompt: "Design and implement an LRU cache using a hash map and doubly linked list with O(1) operations.",
      source: "LeetCode / public reports",
      date: "Common Amazon pattern",
    },
    {
      title: "Binary Tree Right Side View",
      difficulty: "Medium",
      prompt: "Return the visible nodes from the right side of a binary tree using BFS or DFS.",
      source: "Public interview lists",
      date: "Common Amazon pattern",
    },
    {
      title: "Number of Islands",
      difficulty: "Medium",
      prompt: "Count connected components in a grid and discuss DFS, BFS, and visited-state trade-offs.",
      source: "Public interview lists",
      date: "Common Amazon pattern",
    },
  ],
  systemDesign: [
    {
      title: "Design an Amazon Locker Pickup System",
      difficulty: "Mid-Senior",
      prompt: "Design locker assignment, package lifecycle, pickup codes, expiration, notifications, and operational monitoring.",
      source: "Public system design guides",
      date: "Common Amazon-style prompt",
    },
    {
      title: "Design a Rate Limiter",
      difficulty: "Mid",
      prompt: "Compare token bucket, leaky bucket, fixed windows, and distributed counters under high traffic.",
      source: "System design prep guides",
      date: "Common Amazon-style prompt",
    },
    {
      title: "Design a Product Search Service",
      difficulty: "Senior",
      prompt: "Design indexing, ranking, filtering, availability, freshness, and relevance feedback for ecommerce search.",
      source: "Amazon-domain prep",
      date: "Common Amazon-style prompt",
    },
    {
      title: "Design a Notification Service",
      difficulty: "Mid-Senior",
      prompt: "Design email/SMS/push fanout, retries, templates, throttling, idempotency, and observability.",
      source: "System design prep guides",
      date: "Common Amazon-style prompt",
    },
    {
      title: "Design a Cart and Checkout Service",
      difficulty: "Senior",
      prompt: "Design cart persistence, inventory reservation, payment handoff, order creation, and failure recovery.",
      source: "Amazon-domain prep",
      date: "Common Amazon-style prompt",
    },
  ],
  behavioral: [
    "Tell me about a time you took ownership of a difficult problem.",
    "Tell me about a time you disagreed with a teammate or stakeholder.",
    "Tell me about a time you had to deliver under pressure.",
    "Tell me about a time you made a decision with incomplete data.",
    "Tell me about a time you simplified a complex process.",
    "Tell me about a time you received critical feedback.",
  ],
  resources: [
    {
      label: "LeetCode Discuss - Amazon interview experiences",
      url: "https://leetcode.com/discuss/interview-experience?currentPage=1&orderBy=hot&query=Amazon",
      note: "Use for recent public candidate reports; filter manually by date.",
    },
    {
      label: "IGotAnOffer - Amazon software engineer interview guide",
      url: "https://igotanoffer.com/blogs/tech/amazon-software-development-engineer-interview",
      note: "Role process, coding, system design, and behavioral preparation.",
    },
    {
      label: "Interview Query - Amazon software engineer interview questions",
      url: "https://www.interviewquery.com/interview-guides/amazon-software-engineer",
      note: "Question patterns and interview guide material.",
    },
    {
      label: "Exponent - Amazon software engineer interview guide",
      url: "https://www.tryexponent.com/guides/amazon-software-engineer",
      note: "System design and behavioral interview preparation.",
    },
    {
      label: "Reddit search - Amazon SDE interview experiences",
      url: "https://www.reddit.com/search/?q=Amazon%20SDE%20interview%20experience",
      note: "Community reports; verify recency and credibility.",
    },
  ],
};

function normalizeCompany(company) {
  return String(company || "").trim();
}

function titleCase(value) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getCompanyPrep(company) {
  const normalized = normalizeCompany(company);
  const displayName = normalized ? titleCase(normalized) : "Amazon";
  if (/^amazon$/i.test(normalized) || !normalized) return AMAZON_PREP;

  return {
    company: displayName,
    isSeeded: false,
    lastUpdated: "2026-05-22",
    caveat: "No curated local dataset yet. Use these links to gather recent public reports, then run mock interviews from the generic question sets.",
    dsa: [
      { title: "Array / Hash Map Coding Round", difficulty: "Medium", prompt: `Practice a ${displayName} coding round using arrays, hash maps, sorting, and edge-case analysis.`, source: "Generic prep", date: "On demand" },
      { title: "Tree or Graph Traversal", difficulty: "Medium", prompt: `Practice BFS/DFS, visited state, and complexity discussion for ${displayName}.`, source: "Generic prep", date: "On demand" },
    ],
    systemDesign: [
      { title: "Design a Scalable Service", difficulty: "Mid-Senior", prompt: `Design a high-traffic product feature for ${displayName}, including APIs, storage, caching, and observability.`, source: "Generic prep", date: "On demand" },
      { title: "Design a Queue-Based Workflow", difficulty: "Senior", prompt: `Design async processing, retries, idempotency, and failure recovery for ${displayName}.`, source: "Generic prep", date: "On demand" },
    ],
    behavioral: [
      "Tell me about a time you owned a difficult problem.",
      "Tell me about a time you disagreed with someone.",
      "Tell me about a time you delivered under pressure.",
      "Tell me about a time you learned from a mistake.",
    ],
    resources: [
      { label: `LeetCode Discuss - ${displayName}`, url: `https://leetcode.com/discuss/interview-experience?currentPage=1&orderBy=hot&query=${encodeURIComponent(displayName)}`, note: "Recent public candidate reports." },
      { label: `Reddit search - ${displayName} interview experience`, url: `https://www.reddit.com/search/?q=${encodeURIComponent(displayName + " software engineer interview experience")}`, note: "Community reports; verify recency." },
      { label: `Google search - ${displayName} system design interview`, url: `https://www.google.com/search?q=${encodeURIComponent(displayName + " system design interview questions")}`, note: "Manual discovery link." },
    ],
  };
}

export function buildQuestionBankRefreshState({ prep, now = new Date() } = {}) {
  const refreshedAt = now.toISOString();

  return {
    company: prep?.company || "Unknown company",
    refreshedAt,
    sourceLinks: (prep?.resources || []).map((resource) => ({
      label: resource.label,
      url: resource.url,
      note: resource.note,
      checkedAt: refreshedAt,
    })),
    verifiedQuestions: {},
    liveScraped: false,
    note: "Manual local refresh only: source links and timestamps are recorded locally; InterviewIQ does not live scrape or claim these questions are newly discovered.",
  };
}

export function markQuestionBankVerified(state = {}, { questionId, now = new Date() } = {}) {
  if (!questionId) return state;

  return {
    ...state,
    verifiedQuestions: {
      ...(state.verifiedQuestions || {}),
      [questionId]: {
        status: "recent",
        verifiedAt: now.toISOString(),
      },
    },
  };
}

function average(values) {
  if (!values?.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function compactText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function normalizeId(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function skillName(value) {
  return typeof value === "string" ? value : value?.name || value?.skill || "";
}

function buildJdGaps(jobDescriptionAnalysis = {}) {
  const urgencyBySkill = new Map(
    (jobDescriptionAnalysis.gapUrgency || []).map((gap) => [skillName(gap), gap]),
  );

  return uniqueBy(jobDescriptionAnalysis.missingSkills || [], skillName)
    .map((skill, index) => {
      const name = skillName(skill);
      const urgency = urgencyBySkill.get(name) || {};

      return {
        id: `jd-gap-${normalizeId(name) || index}`,
        name,
        category: skill?.category || urgency.category || "JD gap",
        status: urgency.status || "missing",
        action: urgency.action || `Prepare one project proof and one mock answer for ${name}.`,
      };
    })
    .filter((gap) => gap.name)
    .slice(0, 5);
}

function buildLikelyQuestions({ prep, jobDescriptionAnalysis = {}, roleContext }) {
  const jdQuestions = (jobDescriptionAnalysis.likelyQuestions || []).map((item, index) => ({
    id: item.id || `jd-question-${index}`,
    source: "Career Toolkit JD analysis",
    skill: item.skill || "Target role",
    question: compactText(item.question, `Explain a ${roleContext} trade-off.`),
    prompt: item.prompt || `Ask me this target-role question: ${item.question}`,
  }));
  const companyQuestions = [
    ...(prep?.dsa || []).slice(0, 2).map((item, index) => ({
      id: `company-dsa-${index}`,
      source: `${prep.company} coding pattern`,
      skill: "Coding",
      question: item.title,
      prompt: buildCompanyMockPrompt({ ...item, company: prep.company, type: "DSA" }),
    })),
    ...(prep?.systemDesign || []).slice(0, 2).map((item, index) => ({
      id: `company-system-${index}`,
      source: `${prep.company} system design pattern`,
      skill: "System Design",
      question: item.title,
      prompt: buildCompanyMockPrompt({ ...item, company: prep.company, type: "System Design" }),
    })),
    ...(prep?.behavioral || []).slice(0, 1).map((question, index) => ({
      id: `company-behavioral-${index}`,
      source: `${prep.company} behavioral pattern`,
      skill: "Behavioral",
      question,
      prompt: buildCompanyMockPrompt({ company: prep.company, type: "Behavioral", title: "Behavioral question", prompt: question }),
    })),
  ];

  return uniqueBy([...jdQuestions, ...companyQuestions], (item) => item.question)
    .slice(0, 7);
}

function normalizeStoryReference(story, index) {
  const actions = Array.isArray(story?.actions) ? story.actions : [];

  return {
    id: story?.id || `story-reference-${index}`,
    title: compactText(story?.title, `Proof story ${index + 1}`),
    result: compactText(story?.result || story?.impact || story?.summary, "Reuse this story as role-fit evidence."),
    skillsProven: (story?.skillsProven || story?.skills || []).map(String).filter(Boolean).slice(0, 4),
    prompt: actions[0]?.prompt || story?.prompt || `Use this proof story in a company interview: ${story?.title || "Proof story"}`,
  };
}

function extractLocalScore(value) {
  const match = /score:\s*(\d+(?:\.\d+)?)\s*(?:\/\s*10)?/i.exec(String(value || ""));
  if (!match) return null;
  return Number(match[1]);
}

function extractLocalMetrics(value) {
  return Array.from(String(value || "").matchAll(/\b\d+(?:\.\d+)?\s*(?:%|percent|x|k|m|million|ms|seconds?|users|requests|latency|hours|days|cost|revenue)\b|\b\d+(?:\.\d+)?%/gi))
    .map((match) => match[0])
    .slice(0, 3);
}

function inferLocalStorySkills(value, profile = {}) {
  const text = [value, profile?.position, profile?.stack].join(" ");
  const checks = [
    ["Java", /java|spring|jvm/i],
    ["React", /react|frontend|ui/i],
    ["System Design", /system design|scale|cache|queue|architecture/i],
    ["AWS", /aws|cloud|lambda|s3|ecs/i],
    ["Testing", /test|junit|mock|coverage/i],
    ["Leadership", /led|owned|stakeholder|mentor/i],
  ];

  return checks.filter(([, pattern]) => pattern.test(text)).map(([name]) => name).slice(0, 5);
}

function deriveLocalProofStories(messages = [], profile = {}) {
  const stories = [];

  messages.forEach((message, index) => {
    if (message.role !== "assistant") return;

    const score = extractLocalScore(message.content);
    if (score === null || score < 7) return;

    const previousUser = messages
      .slice(0, index)
      .reverse()
      .find((item) => item.role === "user");
    if (!previousUser?.content) return;

    const skillsProven = inferLocalStorySkills(previousUser.content, profile);
    const metrics = extractLocalMetrics(previousUser.content);
    const titleSkill = skillsProven[0] || "Interview";

    stories.push({
      id: `story-${index}`,
      title: `${titleSkill} proof story`,
      result: metrics.length ? `Metrics: ${metrics.join(", ")}` : "Add a measurable outcome before interview day.",
      skillsProven,
      prompt: `Use this proof story in a company interview. Convert it into a crisp STAR answer and ask one follow-up: ${previousUser.content}`,
    });
  });

  return stories.reverse().slice(0, 4);
}

function buildStoryReferences({ careerToolkitState = {}, messages = [] }) {
  const savedStories = [
    ...(careerToolkitState.proofStories || []),
    ...(careerToolkitState.savedStories || []),
    ...(careerToolkitState.storyReferences || []),
  ];
  const derivedStories = savedStories.length ? [] : deriveLocalProofStories(messages, careerToolkitState.profile || {});

  return uniqueBy([...savedStories, ...derivedStories].map(normalizeStoryReference), (story) => story.id)
    .slice(0, 4);
}

function resolveRoleContext({ roleContext, careerToolkitState = {}, selectedCat, selectedSub }) {
  return compactText(
    roleContext ||
      careerToolkitState.jobDescriptionAnalysis?.targetRole ||
      careerToolkitState.resumeAnalysis?.targetRole ||
      selectedSub ||
      selectedCat,
    "target role",
  );
}

function buildInterviewRounds({ prep, roleContext, jdGaps, storyReferences }) {
  const primaryGap = jdGaps[0]?.name || roleContext;
  const proofStory = storyReferences[0]?.title || "one STAR proof story";
  const codingPrompt = prep?.dsa?.[0];
  const systemPrompt = prep?.systemDesign?.[0];
  const behavioralPrompt = prep?.behavioral?.[0];

  return [
    {
      id: "coding-screen",
      name: "Coding screen",
      focus: codingPrompt?.title || "Core coding pattern",
      detail: `Solve one ${prep.company} coding pattern and explain edge cases for ${roleContext}.`,
    },
    {
      id: "system-design",
      name: "System Design round",
      focus: systemPrompt?.title || primaryGap,
      detail: `Connect architecture trade-offs to ${primaryGap}.`,
    },
    {
      id: "behavioral",
      name: "Behavioral loop",
      focus: proofStory,
      detail: behavioralPrompt || `Prepare ownership, conflict, and delivery stories for ${prep.company}.`,
    },
    {
      id: "final-loop",
      name: "Final loop calibration",
      focus: primaryGap,
      detail: `Run a mixed rehearsal for ${prep.company} ${roleContext}: JD gap, company pattern, and proof story.`,
    },
  ];
}

function buildFinalDayChecklist({ prep, roleContext, jdGaps, storyReferences }) {
  const primaryGap = jdGaps[0]?.name || "the highest-risk JD gap";
  const storyTitle = storyReferences[0]?.title || "one measurable STAR story";

  return [
    `Review ${prep.company} notes and the local caveat before claiming recency.`,
    `Drill ${primaryGap} with one practical answer and one trade-off.`,
    `Run one coding or system design question tied to ${roleContext}.`,
    `Rehearse ${storyTitle} with Situation, Task, Action, Result, and metric.`,
    "Prepare two interviewer questions about team, scope, quality bar, and success metrics.",
    "Confirm logistics, resume copy, quiet setup, and a one-line opening pitch.",
  ];
}

export function buildCompanyPrepRoom({
  prep = null,
  roleContext = "",
  selectedCat = "",
  selectedSub = "",
  careerToolkitState = {},
  messages = [],
} = {}) {
  const activePrep = prep || getCompanyPrep();
  const activeRoleContext = resolveRoleContext({ roleContext, careerToolkitState, selectedCat, selectedSub });
  const jobDescriptionAnalysis = careerToolkitState.jobDescriptionAnalysis || {};
  const topicFocus = compactText(selectedSub || selectedCat, "company-specific fundamentals");
  const jdGaps = buildJdGaps(jobDescriptionAnalysis);
  const storyReferences = buildStoryReferences({ careerToolkitState, messages });
  const likelyQuestions = buildLikelyQuestions({ prep: activePrep, jobDescriptionAnalysis, roleContext: activeRoleContext });
  const interviewRounds = buildInterviewRounds({
    prep: activePrep,
    roleContext: activeRoleContext,
    jdGaps,
    storyReferences,
  });
  const finalDayChecklist = buildFinalDayChecklist({
    prep: activePrep,
    roleContext: activeRoleContext,
    jdGaps,
    storyReferences,
  });
  const primaryGaps = jdGaps.map((gap) => gap.name).slice(0, 3).join(", ") || "company fundamentals";
  const primaryQuestions = likelyQuestions.map((question) => question.question).slice(0, 3).join("; ");
  const primaryStories = storyReferences.map((story) => story.title).slice(0, 2).join(", ") || "no saved story yet";

  return {
    company: activePrep.company,
    roleContext: activeRoleContext,
    topicFocus,
    notes: [
      {
        id: "company-note",
        label: `${activePrep.company} notes`,
        detail: activePrep.caveat,
      },
      {
        id: "role-note",
        label: "Role context",
        detail: `Prep is scoped to ${activeRoleContext}${topicFocus ? ` with focus on ${topicFocus}` : ""}.`,
      },
      {
        id: "jd-note",
        label: "JD gaps",
        detail: jdGaps.length
          ? `Highest-risk JD gaps: ${primaryGaps}.`
          : "No JD gap analysis is stored yet. Paste a JD in Career Toolkit to tailor this room.",
      },
      {
        id: "story-note",
        label: "Story references",
        detail: storyReferences.length
          ? `Saved proof stories available: ${primaryStories}.`
          : "No saved proof story references found yet. Score a mock answer 7+ to create one.",
      },
    ],
    interviewRounds,
    jdGaps,
    likelyQuestions,
    storyReferences,
    finalDayChecklist,
    finalDayActionPrompt: [
      `Run a final-day ${activePrep.company} rehearsal for ${activeRoleContext}.`,
      `Use JD gaps: ${primaryGaps}.`,
      `Use likely questions: ${primaryQuestions}.`,
      `Use story references: ${primaryStories}.`,
      "Ask one question at a time, score each answer, then finish with a final-day checklist and top three fixes.",
    ].join("\n"),
  };
}

export function buildCompanyReadinessScore({
  prep = null,
  refreshState = null,
  weakSpots = [],
  mockScores = [],
  resumeAnalysis = null,
  jobDescriptionAnalysis = null,
} = {}) {
  const company = prep?.company || refreshState?.company || "Company";
  const totalQuestions = (prep?.dsa?.length || 0) + (prep?.systemDesign?.length || 0);
  const verifiedCount = Object.keys(refreshState?.verifiedQuestions || {}).length;
  const verifiedScore = totalQuestions ? Math.min(100, Math.round((verifiedCount / Math.min(totalQuestions, 5)) * 100)) : 0;
  const mockAverage = average(mockScores);
  const mockScore = mockAverage === null ? 0 : Math.round(mockAverage * 10);
  const fitScores = [resumeAnalysis?.score, jobDescriptionAnalysis?.score].filter(Number.isFinite);
  const fitScore = fitScores.length ? Math.round(average(fitScores)) : 0;
  const weakSpotPenalty = Math.min(25, weakSpots.length * 5);
  const score = clampScore((verifiedScore * 0.3) + (mockScore * 0.35) + (fitScore * 0.35) - weakSpotPenalty);

  return {
    company,
    score,
    label: score >= 80 ? "Company ready" : score >= 60 ? "Close with focused reps" : "Needs company practice",
    factors: [
      { label: "Verified local bank", value: `${verifiedCount}/${Math.min(totalQuestions, 5) || 0}`, score: verifiedScore },
      { label: "Mock average", value: mockAverage === null ? "No scored mocks" : `${Math.round(mockAverage * 10) / 10}/10`, score: mockScore },
      { label: "Resume/JD fit", value: fitScores.length ? `${fitScore}%` : "Not analyzed", score: fitScore },
      { label: "Weak spot load", value: `${weakSpots.length} active`, score: clampScore(100 - weakSpotPenalty) },
    ],
    nextActionPrompt: `Run a ${company} readiness mock. Focus on ${weakSpots[0] || "the most important company question"}, ask one realistic question, wait for my answer, then score it and give next actions.`,
  };
}

export function buildCompanyMockPrompt(question) {
  return `Start a mock ${question.type || "interview"} interview for ${question.company}.
Ask one question at a time.
Use this real/publicly reported prompt as the first question:
${question.title}: ${question.prompt}

After I answer, give Score: X/10, Strengths, Gaps, Ideal Answer, and one follow-up question.`;
}

export function deriveWeakSpots(messages = []) {
  const text = messages
    .filter((message) => message.role === "assistant")
    .map((message) => message.content || "")
    .join("\n")
    .toLowerCase();
  const checks = [
    ["Edge cases", /edge cases?/],
    ["Trade-offs", /trade-?offs?/],
    ["Complexity analysis", /complexity|time\/space|big o/],
    ["Databases", /databases?|sql|indexing|transactions?|query tuning|schema|nosql/],
    ["System design depth", /scalability|capacity|partition|cache|queue/],
    ["Behavioral structure", /star|situation|task|action|result/],
    ["Testing strategy", /test|coverage|mock/],
  ];
  return checks.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}
