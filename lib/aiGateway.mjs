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

export function buildAiRetryRequest(lastRequest = {}) {
  return {
    text: typeof lastRequest.text === "string" ? lastRequest.text.trim() : "",
    apiText: typeof lastRequest.apiText === "string" && lastRequest.apiText.trim()
      ? lastRequest.apiText.trim()
      : typeof lastRequest.text === "string"
        ? lastRequest.text.trim()
        : "",
    metadata: lastRequest.metadata && typeof lastRequest.metadata === "object" ? lastRequest.metadata : {},
  };
}

export function buildAiFollowUpPrompt({
  latestUserMessage = "",
  latestAssistantMessage = "",
  focus = "go deeper",
} = {}) {
  const userPrompt = String(latestUserMessage || "").trim();
  const assistantReply = String(latestAssistantMessage || "").trim();
  const followUpFocus = String(focus || "go deeper").trim();

  if (!userPrompt && !assistantReply) return "";

  return [
    "Continue the same interview-prep session.",
    userPrompt ? `Original user ask: ${userPrompt}` : "",
    assistantReply ? `Latest answer summary: ${assistantReply.slice(0, 500)}` : "",
    `Follow-up goal: ${followUpFocus}.`,
    "Ask one sharp follow-up or provide the next deeper answer without restarting the topic.",
  ].filter(Boolean).join("\n");
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
