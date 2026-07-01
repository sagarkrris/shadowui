const BASE_URL = "https://app.coderpad.io/api/questions";

export function getCoderPadConfig(env = process.env) {
  return { configured: Boolean(env.CODERPAD_API_TOKEN), baseUrl: BASE_URL };
}

export function normalizeCoderPadQuestion(value = {}) {
  return {
    id: `coderpad:${String(value.id || "")}`,
    title: String(value.title || "Untitled question").trim().slice(0, 240),
    prompt: String(value.description || value.contents || "").trim().slice(0, 20_000),
    language: String(value.language || "").trim().slice(0, 80),
    provider: "coderpad",
  };
}

export async function listCoderPadQuestions({ env = process.env, fetchImpl = fetch } = {}) {
  const token = env.CODERPAD_API_TOKEN;
  if (!token) return { configured: false, questions: [] };
  const response = await fetchImpl(BASE_URL, { headers: { Authorization: `Token token="${token}"`, Accept: "application/json" } });
  if (!response.ok) throw new Error(`CoderPad request failed with ${response.status}`);
  const payload = await response.json();
  const items = Array.isArray(payload) ? payload : (payload.questions || []);
  return { configured: true, questions: items.map(normalizeCoderPadQuestion), refreshedAt: new Date().toISOString() };
}
