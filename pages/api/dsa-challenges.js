import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildDsaChallengeGenerationPrompt,
  parseGeneratedDsaChallenges,
} from "../../lib/dsaChallengeGeneration.mjs";
import { getGeminiModelCandidates } from "../../lib/geminiModels.mjs";
import { getGeminiErrorStatus, getSafeGeminiErrorMessage, withGeminiModelFallback } from "../../lib/geminiRetry.mjs";
import { createRequestLogger } from "../../lib/serverLogger.mjs";

export default async function handler(req, res) {
  const logger = createRequestLogger({ route: "/api/dsa-challenges" });
  res.setHeader("X-Request-Id", logger.requestId);
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    logger.warn("request.method_not_allowed", { method: req.method });
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.GEMINI_API_KEY) {
    logger.error("config.missing_api_key");
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  const stack = typeof req.body?.stack === "string" ? req.body.stack.slice(0, 120) : "JavaScript";
  const count = Math.max(6, Math.min(15, Number(req.body?.count) || 12));
  const prompt = buildDsaChallengeGenerationPrompt({ stack, count });
  const apiKey = process.env.GEMINI_API_KEY;
  const modelCandidates = await getGeminiModelCandidates(apiKey);

  logger.info("request.accepted", {
    stackLength: stack.length,
    count,
    modelCandidateCount: modelCandidates.length,
  });

  if (!modelCandidates.length) {
    logger.error("model.none_available");
    return res.status(500).json({ error: "No supported Gemini models found." });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const { modelName, result } = await withGeminiModelFallback(
      modelCandidates,
      (candidate) => {
        const model = genAI.getGenerativeModel({
          model: candidate,
          generationConfig: {
            temperature: 0.92,
            responseMimeType: "application/json",
          },
        });
        return model.generateContent(prompt);
      },
      {
        onFallback: (details) => logger.warn("model.fallback", details),
      },
    );

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
