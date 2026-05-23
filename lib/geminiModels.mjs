const TEXT_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
];

const VISION_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
];

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

    return unique([...discoveredModels, ...fallbackModels]);
  } catch {
    return fallbackModels;
  }
}
