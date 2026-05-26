export const ANSWER_RUBRIC_CATEGORIES = [
  { key: "correctness", label: "Correctness", pattern: /correctness/i },
  { key: "depth", label: "Depth", pattern: /depth/i },
  { key: "examples", label: "Examples", pattern: /examples?/i },
  { key: "tradeOffs", label: "Trade-offs", pattern: /trade-?offs?/i },
  { key: "communication", label: "Communication", pattern: /communication(?: clarity)?/i },
  { key: "followUpReadiness", label: "Follow-up readiness", pattern: /follow-?up readiness/i },
];

function extractScore(content, pattern) {
  const line = String(content || "")
    .split("\n")
    .find((item) => pattern.test(item));
  const match = line?.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  if (!match) return null;

  const score = Number(match[1]);
  if (!Number.isFinite(score)) return null;

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

export function parseAnswerRubric(content = "") {
  return ANSWER_RUBRIC_CATEGORIES
    .map((category) => ({
      ...category,
      score: extractScore(content, category.pattern),
    }))
    .filter((category) => category.score !== null)
    .map(({ key, label, score }) => ({ key, label, score }));
}
