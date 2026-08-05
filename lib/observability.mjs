const counters = new Map();

export function estimateAiUsage({ inputChars = 0, outputChars = 0 } = {}) {
  const inputTokens = Math.ceil(Number(inputChars) / 4);
  const outputTokens = Math.ceil(Number(outputChars) / 4);
  const inputRate = Number(process.env.GEMINI_INPUT_COST_PER_MILLION || 0);
  const outputRate = Number(process.env.GEMINI_OUTPUT_COST_PER_MILLION || 0);
  return { inputTokens, outputTokens, estimatedCostUsd: Number(((inputTokens * inputRate + outputTokens * outputRate) / 1_000_000).toFixed(6)) };
}

export function recordMetric(name, value = {}) {
  counters.set(name, (counters.get(name) || 0) + 1);
  return { name, count: counters.get(name), ...value };
}

export function reportServerError(error, context = {}) {
  const endpoint = process.env.ERROR_TRACKING_WEBHOOK_URL;
  const payload = { error: { name: error?.name, message: error?.message, code: error?.code }, context, createdAt: new Date().toISOString() };
  if (endpoint) {
    fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", ...(process.env.ERROR_TRACKING_TOKEN ? { Authorization: `Bearer ${process.env.ERROR_TRACKING_TOKEN}` } : {}) }, body: JSON.stringify(payload) }).catch(() => undefined);
  }
  return payload;
}
