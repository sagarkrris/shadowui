import { getGeminiModelCandidates } from "./geminiModels.mjs";
import { withGeminiModelFallback } from "./geminiRetry.mjs";

export class AiConfigError extends Error {
  constructor(message, { status = 500, code = "AI_CONFIG_ERROR" } = {}) {
    super(message);
    this.name = "AiConfigError";
    this.status = status;
    this.code = code;
  }
}

export function getRequiredGeminiApiKey(env = process.env) {
  const apiKey = env?.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiConfigError("GEMINI_API_KEY not configured", {
      status: 500,
      code: "GEMINI_API_KEY_MISSING",
    });
  }
  return apiKey;
}

export function getSafeConfigErrorPayload(error) {
  return {
    error: error?.message || "AI service is not configured",
    code: error?.code || "AI_CONFIG_ERROR",
  };
}

export async function runGeminiRouteOperation({
  env = process.env,
  vision = false,
  getModelCandidates = getGeminiModelCandidates,
  runWithFallback = withGeminiModelFallback,
  operation,
  onFallback,
  noModelsMessage = "No supported Gemini models found.",
} = {}) {
  const apiKey = getRequiredGeminiApiKey(env);
  const modelCandidates = await getModelCandidates(apiKey, { vision });

  if (!modelCandidates.length) {
    throw new AiConfigError(noModelsMessage, {
      status: 500,
      code: "GEMINI_MODELS_UNAVAILABLE",
    });
  }

  const { modelName, result } = await runWithFallback(
    modelCandidates,
    (candidate) => operation(candidate, { apiKey }),
    { onFallback },
  );

  return {
    apiKey,
    modelCandidates,
    modelName,
    result,
  };
}
