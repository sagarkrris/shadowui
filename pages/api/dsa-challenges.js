import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSafeConfigErrorPayload, runGeminiRouteOperation } from "../../lib/aiGateway.mjs";
import {
  buildDsaChallengeGenerationPrompt,
  parseGeneratedDsaChallenges,
} from "../../lib/dsaChallengeGeneration.mjs";
import { getGeminiErrorStatus, getSafeGeminiErrorMessage } from "../../lib/geminiRetry.mjs";
import { createRequestLogger } from "../../lib/serverLogger.mjs";
import { requireConfiguredUser } from "../../lib/apiAuth.mjs";

export default async function handler(req, res) {
  const logger = createRequestLogger({ route: "/api/dsa-challenges" });
  res.setHeader("X-Request-Id", logger.requestId);
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    logger.warn("request.method_not_allowed", { method: req.method });
    return res.status(405).json({ error: "Method not allowed" });
  }
  const auth = await requireConfiguredUser(req);
  if (auth.required && !auth.user) return res.status(401).json({ error: "Sign in to generate DSA challenges." });

  const stack = typeof req.body?.stack === "string" ? req.body.stack.slice(0, 120) : "JavaScript";
  const count = Math.max(6, Math.min(15, Number(req.body?.count) || 12));
  const prompt = buildDsaChallengeGenerationPrompt({ stack, count });

  try {
    const { modelCandidates, modelName, result } = await runGeminiRouteOperation({
      onFallback: (details) => logger.warn("model.fallback", details),
      operation: (candidate, { apiKey }) => {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: candidate,
          generationConfig: {
            temperature: 0.92,
            responseMimeType: "application/json",
          },
        });
        return model.generateContent(prompt);
      },
    });

    logger.info("request.accepted", {
      stackLength: stack.length,
      count,
      modelCandidateCount: modelCandidates.length,
    });

    const text = result.response.text();
    const challenges = parseGeneratedDsaChallenges(text, { source: "generated" });

    if (!challenges.length) {
      logger.error("response.invalid_json", { modelName, textChars: text.length });
      return res.status(502).json({ error: "Generated questions were invalid." });
    }

    logger.info("request.done", { modelName, challengeCount: challenges.length });
    return res.status(200).json({
      source: "generated",
      model: modelName,
      challenges: challenges.slice(0, count),
    });
  } catch (error) {
    if (error.name === "AiConfigError") {
      logger.error("config.failed", { code: error.code });
      return res.status(error.status).json(getSafeConfigErrorPayload(error));
    }

    const status = getGeminiErrorStatus(error);
    logger.error("request.failed", {
      error,
      responseStatus: status,
      status: error.status,
      code: error.code,
    });
    return res.status(status).json({
      error: getSafeGeminiErrorMessage(error, "Could not generate fresh DSA questions."),
      requestId: logger.requestId,
    });
  }
}
