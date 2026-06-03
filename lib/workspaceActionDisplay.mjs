const DISPLAY_LIMIT = 520;

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function clip(value, limit = DISPLAY_LIMIT) {
  const text = cleanText(value);
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 1)).trim()}...`;
}

function firstPromptLine(prompt) {
  return cleanText(String(prompt || "").split("\n").find((line) => cleanText(line)) || prompt);
}

function withDetail(title, detail) {
  const cleanTitle = cleanText(title);
  const cleanDetail = clip(detail);
  return cleanDetail ? `${cleanTitle}\n\n${cleanDetail}` : cleanTitle;
}

function scenarioDisplayLabel(type) {
  if (type === "scenarioAnswer") return "Explain Answer";
  if (type === "scenarioMock") return "Practice Mock";
  if (type === "scenarioVariant") return "Generate Fresh Scenario";
  if (type === "scenarioPlan") return "Scenario Daily Plan";
  return "Scenario Bank";
}

function canvasDisplayLabel(type) {
  if (type === "studio") return "System Design Studio";
  if (type === "mock") return "System Design Mock";
  return "System Design Review";
}

export function buildWorkspaceActionDisplayText(prompt, metadata = {}) {
  const type = metadata?.type || "";
  const scenario = metadata?.scenario;
  if (scenario) {
    return withDetail(`${scenarioDisplayLabel(type)}: ${scenario.title || "Scenario"}`, scenario.prompt || prompt);
  }

  if (type === "scenarioVariant" || type === "scenarioPlan") {
    const state = metadata?.state || {};
    const track = state.track === "database" ? state.engine || "database" : "Java";
    return withDetail(`${scenarioDisplayLabel(type)}: ${track}`, firstPromptLine(prompt));
  }

  const canvasState = metadata?.canvasState;
  if (canvasState || type === "studio" || type === "review" || type === "mock") {
    const problem = cleanText(canvasState?.problem) || cleanText(metadata?.blueprint?.problem || metadata?.blueprint?.title) || "Current design";
    return withDetail(`${canvasDisplayLabel(type)}: ${problem}`, firstPromptLine(prompt));
  }

  const system = metadata?.system;
  if (system) {
    return withDetail(`Design Lab Practice: ${system.title || "Selected system"}`, system.focus || firstPromptLine(prompt));
  }

  const pattern = metadata?.pattern;
  if (pattern) {
    return withDetail(`Practice Pattern: ${pattern.name || "Design pattern"}`, pattern.intent || firstPromptLine(prompt));
  }

  return clip(prompt);
}
