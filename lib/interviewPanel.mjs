const DEFAULT_PANEL_KEY = "seniorEngineer";

function cleanText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function category(key, label, weight, guidance) {
  return { key, label, weight, guidance };
}

export const INTERVIEW_PANELISTS = [
  {
    key: "recruiter",
    label: "Recruiter",
    icon: "HR",
    followUpStyle: "Warm, structured follow-ups that clarify motivation, role fit, communication, and logistics.",
    scoringEmphasis: "Clarity, motivation, role alignment, compensation readiness, and concise career narrative.",
    openingInstruction: "Start by asking for a crisp career walkthrough tailored to the target role.",
    rubricCategories: [
      category("careerStory", "Career story", 20, "Explains the path, transitions, and current search without rambling."),
      category("roleMotivation", "Role motivation", 25, "Connects the company, role, and personal goals with credible specifics."),
      category("communication", "Communication clarity", 20, "Answers directly, uses plain language, and keeps responses scoped."),
      category("logistics", "Logistics readiness", 15, "Handles availability, location, authorization, and expectations cleanly."),
      category("cultureFit", "Culture fit signals", 20, "Shows collaboration, ownership, and values alignment through examples."),
    ],
  },
  {
    key: "seniorEngineer",
    label: "Senior Engineer",
    icon: "SE",
    followUpStyle: "Technical follow-ups that probe trade-offs, edge cases, debugging habits, and implementation depth.",
    scoringEmphasis: "Technical depth, correctness, maintainability, testing judgment, and practical trade-off reasoning.",
    openingInstruction: "Open with a hands-on technical question and require the candidate to reason out loud.",
    rubricCategories: [
      category("technicalDepth", "Technical depth", 25, "Demonstrates strong fundamentals and can explain decisions under scrutiny."),
      category("correctness", "Correctness and edge cases", 25, "Covers failure modes, boundaries, data shape, and complexity."),
      category("codeQuality", "Code quality", 20, "Balances readability, maintainability, testability, and simple abstractions."),
      category("debugging", "Debugging approach", 15, "Uses hypotheses, instrumentation, and evidence instead of guesses."),
      category("collaboration", "Engineering collaboration", 15, "Communicates assumptions and works well with product and peers."),
    ],
  },
  {
    key: "engineeringManager",
    label: "Engineering Manager",
    icon: "EM",
    followUpStyle: "Behavioral and leadership follow-ups that ask for scope, people impact, conflict, and measurable outcomes.",
    scoringEmphasis: "Leadership judgment, team leverage, prioritization, coaching, delivery ownership, and self-awareness.",
    openingInstruction: "Begin with a leadership situation and ask for context, action, outcome, and reflection.",
    rubricCategories: [
      category("leadership", "Leadership judgment", 25, "Makes thoughtful decisions with incomplete information and owns results."),
      category("teamImpact", "Team impact", 20, "Improves people, process, clarity, and execution beyond personal output."),
      category("prioritization", "Prioritization", 20, "Balances business value, risk, technical debt, and team capacity."),
      category("conflict", "Conflict handling", 15, "Navigates disagreement with empathy, evidence, and clear decisions."),
      category("reflection", "Reflection and growth", 20, "Extracts lessons and changes future behavior with maturity."),
    ],
  },
  {
    key: "systemDesignArchitect",
    label: "System Design Architect",
    icon: "SA",
    followUpStyle: "Architecture follow-ups that pressure-test requirements, scale, data ownership, reliability, and trade-offs.",
    scoringEmphasis: "Architecture clarity, constraints, scalability, reliability, data modeling, and trade-off discipline.",
    openingInstruction: "Set a realistic system design problem and first ask the candidate to define requirements and constraints.",
    rubricCategories: [
      category("requirements", "Requirements and constraints", 20, "Clarifies users, scope, non-functional needs, and success metrics."),
      category("architecture", "Architecture quality", 25, "Presents coherent components, interfaces, ownership boundaries, and flows."),
      category("dataModeling", "Data modeling", 15, "Chooses storage, schemas, indexes, partitioning, and consistency deliberately."),
      category("scalability", "Scalability and reliability", 25, "Handles bottlenecks, failures, latency, observability, and growth."),
      category("tradeoffs", "Trade-off reasoning", 15, "Compares options and explains why one path fits the constraints."),
    ],
  },
  {
    key: "barRaiser",
    label: "Bar Raiser",
    icon: "BR",
    followUpStyle: "High-signal follow-ups that challenge vague claims, inspect ownership, and compare evidence against the hiring bar.",
    scoringEmphasis: "Bar-raising evidence, ownership, judgment, customer impact, learning velocity, and durable excellence.",
    openingInstruction: "Open with the candidate's proudest high-impact example and dig until the evidence is specific.",
    rubricCategories: [
      category("barRaisingEvidence", "Bar-raising evidence", 25, "Shows accomplishments that exceed the expected level for the role."),
      category("ownership", "Ownership and accountability", 20, "Takes responsibility for ambiguous work, misses, and outcomes."),
      category("judgment", "Judgment under ambiguity", 20, "Makes principled calls with limited data and explains alternatives."),
      category("customerImpact", "Customer and business impact", 20, "Connects work to measurable value for users, customers, or the business."),
      category("learningVelocity", "Learning velocity", 15, "Adapts quickly, incorporates feedback, and raises future standards."),
    ],
  },
];

const PANEL_BY_KEY = new Map(INTERVIEW_PANELISTS.map((panelist) => [panelist.key, panelist]));
const PANEL_ALIASES = new Map();

for (const panelist of INTERVIEW_PANELISTS) {
  PANEL_ALIASES.set(normalizeKey(panelist.key), panelist.key);
  PANEL_ALIASES.set(normalizeKey(panelist.label), panelist.key);
}

PANEL_ALIASES.set("systemdesign", "systemDesignArchitect");
PANEL_ALIASES.set("architect", "systemDesignArchitect");
PANEL_ALIASES.set("manager", "engineeringManager");
PANEL_ALIASES.set("em", "engineeringManager");
PANEL_ALIASES.set("se", "seniorEngineer");
PANEL_ALIASES.set("br", "barRaiser");

export function normalizeInterviewPanel(value) {
  if (value && typeof value === "object") {
    const candidate = value.key || value.label || value.panel;
    const matched = PANEL_ALIASES.get(normalizeKey(candidate));
    return PANEL_BY_KEY.get(matched) || PANEL_BY_KEY.get(DEFAULT_PANEL_KEY);
  }

  const matched = PANEL_ALIASES.get(normalizeKey(value));
  return PANEL_BY_KEY.get(matched) || PANEL_BY_KEY.get(DEFAULT_PANEL_KEY);
}

function profileLines(profile = {}) {
  const fields = [
    ["Candidate", profile.name],
    ["Target role", profile.position || profile.role],
    ["Experience", profile.experience],
    ["Stack", profile.stack],
  ];

  const lines = fields
    .map(([label, value]) => [label, cleanText(value)])
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`);

  return lines.length ? lines : ["Candidate: the current InterviewIQ user"];
}

export function buildInterviewPanelPrompt({ panel, profile, roundStrategy } = {}) {
  const panelist = normalizeInterviewPanel(panel);
  const round = cleanText(roundStrategy) || "general interview practice";
  const rubric = buildPanelScoreRubric(panelist);
  const rubricLines = rubric.categories.map(
    (item) => `- ${item.label} (${item.weight}%): ${item.guidance}`,
  );

  return [
    `Act as the ${panelist.label} in an AI Interview Panel Mode session.`,
    `Round strategy: ${round}`,
    ...profileLines(profile),
    "",
    `Opening instruction: ${panelist.openingInstruction}`,
    `Follow-up style: ${panelist.followUpStyle}`,
    `Scoring emphasis: ${panelist.scoringEmphasis}`,
    "",
    "Run the interview one question at a time. Wait for my answer before scoring or moving to the next question.",
    "After each answer, give Score: X/10, concise evidence, one gap, and the next best follow-up.",
    "",
    "Private rubric:",
    ...rubricLines,
  ].join("\n");
}

export function buildPanelScoreRubric(panel) {
  const panelist = normalizeInterviewPanel(panel);

  return {
    panel: panelist,
    instructions: "Score each category from 1-5, then convert the weighted result to a concise 10-point interview score.",
    categories: panelist.rubricCategories.map((item) => ({ ...item })),
  };
}
