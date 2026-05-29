export const SYSTEM_DESIGN_CANVAS_SECTIONS = [
  {
    key: "requirements",
    label: "Requirements",
    placeholder: "Users, core jobs, functional and non-functional requirements.",
  },
  {
    key: "constraints",
    label: "Constraints",
    placeholder: "Latency, consistency, privacy, budget, reliability, and launch scope.",
  },
  {
    key: "estimation",
    label: "Capacity",
    placeholder: "Traffic, storage, QPS, fanout, bandwidth, and growth assumptions.",
  },
  {
    key: "api",
    label: "API / Interfaces",
    placeholder: "Endpoints, events, contracts, request/response shapes, and error cases.",
  },
  {
    key: "data",
    label: "Data Model",
    placeholder: "Entities, indexes, partition keys, retention, and data ownership.",
  },
  {
    key: "architecture",
    label: "Architecture",
    placeholder: "Services, queues, caches, storage, dependencies, and request flow.",
  },
  {
    key: "scaling",
    label: "Scaling Plan",
    placeholder: "Bottlenecks, sharding, caching, backpressure, and failure handling.",
  },
  {
    key: "risks",
    label: "Risks / Trade-offs",
    placeholder: "Open questions, trade-offs, migrations, observability, and rollout risks.",
  },
];

const SECTION_KEYS = new Set(SYSTEM_DESIGN_CANVAS_SECTIONS.map((section) => section.key));

function cleanText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeSections(value = {}) {
  const input = value && typeof value === "object" ? value : {};

  return SYSTEM_DESIGN_CANVAS_SECTIONS.reduce((sections, section) => {
    sections[section.key] = cleanText(input[section.key]);
    return sections;
  }, {});
}

export function createSystemDesignCanvasState(value = {}) {
  const input = value && typeof value === "object" ? value : {};
  const sections = normalizeSections(input.sections || input);

  return {
    problem: cleanText(input.problem || input.title),
    sections,
  };
}

function sectionLines(state) {
  return SYSTEM_DESIGN_CANVAS_SECTIONS.map((section) => {
    const content = state.sections[section.key] || "Not captured yet.";
    return `${section.label}: ${content}`;
  });
}

export function buildSystemDesignReviewPrompt(value = {}) {
  const state = createSystemDesignCanvasState(value);
  const problem = state.problem || "the current system design problem";

  return [
    "Review this system design canvas like a senior interviewer.",
    `Problem: ${problem}`,
    "",
    ...sectionLines(state),
    "",
    "Give a concise score, strongest decisions, missing depth, risky assumptions, and the next three improvements.",
  ].join("\n");
}

export function buildSystemDesignMockPrompt(value = {}) {
  const state = createSystemDesignCanvasState(value);
  const problem = state.problem || "the current system design problem";

  return [
    "Run a system design mock interview from this canvas.",
    `Problem: ${problem}`,
    "",
    ...sectionLines(state),
    "",
    "Ask one question at a time. Push on vague areas, require trade-offs, and wait for my answer before moving on.",
  ].join("\n");
}

export const buildCanvasReviewPrompt = buildSystemDesignReviewPrompt;
export const buildCanvasMockPrompt = buildSystemDesignMockPrompt;

export function exportSystemDesignCanvasMarkdown(value = {}) {
  const state = createSystemDesignCanvasState(value);
  const problem = state.problem || "Untitled";
  const body = SYSTEM_DESIGN_CANVAS_SECTIONS.map((section) => {
    const content = state.sections[section.key] || "_Not captured yet._";
    return `## ${section.label}\n\n${content}`;
  });

  return [`# System Design Canvas: ${problem}`, "", ...body].join("\n\n");
}

export function isSystemDesignCanvasSection(key) {
  return SECTION_KEYS.has(key);
}
