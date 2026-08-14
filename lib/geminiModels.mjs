const TEXT_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];

const VISION_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];

const MODEL_CACHE_TTL_MS = 5 * 60 * 1000;
const modelCache = new Map();

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function modelPriority(modelName) {
  if (modelName.includes("flash")) return 0;
  return 1;
}

function normalizeModelName(model) {
  return String(model?.name || "").replace(/^models\//, "");
}

export async function getGeminiModelCandidates(apiKey, { vision = false, fetchImpl = fetch } = {}) {
  const fallbackModels = vision ? VISION_MODEL_FALLBACKS : TEXT_MODEL_FALLBACKS;
  const configured = String(process.env.GEMINI_MODEL_ALLOWLIST || "").split(",").map((model) => model.trim()).filter(Boolean);
  if (configured.length) return unique(configured).slice(0, 4);
  const useCache = fetchImpl === fetch;
  const cacheKey = `${apiKey}:${vision ? "vision" : "text"}`;
  const cached = useCache ? modelCache.get(cacheKey) : null;
  if (cached && cached.expiresAt > Date.now()) return cached.models;

  try {
    const response = await fetchImpl("https://generativelanguage.googleapis.com/v1beta/models", {
      headers: { "x-goog-api-key": apiKey },
    });
    const data = await response.json();
    const discoveredModels = (data.models || [])
      .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
      .map(normalizeModelName)
      .filter((modelName) => modelName.includes("flash"))
      .sort((a, b) => modelPriority(a) - modelPriority(b));

    const models = unique([...discoveredModels, ...fallbackModels]).slice(0, 4);
    if (useCache) modelCache.set(cacheKey, { models, expiresAt: Date.now() + MODEL_CACHE_TTL_MS });
    return models;
  } catch {
    const models = unique(fallbackModels);
    if (useCache) modelCache.set(cacheKey, { models, expiresAt: Date.now() + 30_000 });
    return models;
  }
}
