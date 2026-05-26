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
    ["System design depth", /scalability|capacity|partition|cache|queue/],
    ["Behavioral structure", /star|situation|task|action|result/],
    ["Testing strategy", /test|coverage|mock/],
  ];
  return checks.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}
