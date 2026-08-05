import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSafeConfigErrorPayload, runGeminiRouteOperation } from "../../lib/aiGateway.mjs";
import { buildStructuredEvaluationPrompt, parseStructuredEvaluation } from "../../lib/interviewSession.mjs";
import { getGeminiErrorStatus, getSafeGeminiErrorMessage } from "../../lib/geminiRetry.mjs";
import { createRequestLogger } from "../../lib/serverLogger.mjs";
import { getClientAddress } from "../../lib/requestSecurity.mjs";
import { checkDistributedRateLimit } from "../../lib/redisRateLimit.mjs";
import { requireConfiguredUser } from "../../lib/apiAuth.mjs";
import { estimateAiUsage, recordMetric, reportServerError } from "../../lib/observability.mjs";

export default async function handler(req, res) {
  const logger = createRequestLogger({ route: "/api/evaluate" });
  res.setHeader("X-Request-Id", logger.requestId);
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const auth = await requireConfiguredUser(req);
  if (auth.required && !auth.user) return res.status(401).json({ error: "Sign in to use AI evaluation." });
  const rate = await checkDistributedRateLimit(`evaluate:${getClientAddress(req)}`, { limit: 20 });
  if (!rate.ok) { recordMetric("ai.rate_limited", { route: "/api/evaluate" }); return res.status(429).json({ error: "Too many evaluation requests." }); }
  const question = String(req.body?.question || "").trim();
  const answer = String(req.body?.answer || "").trim();
  if (!question || !answer || question.length > 12000 || answer.length > 12000) return res.status(400).json({ error: "Question and answer are required and must be under 12,000 characters." });
  try {
    const { result } = await runGeminiRouteOperation({
      onFallback: (details) => logger.warn("model.fallback", details),
      operation: (candidate, { apiKey }) => new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: candidate, generationConfig: { responseMimeType: "application/json" } }).generateContent(buildStructuredEvaluationPrompt({ question, answer, profile: req.body?.profile, round: req.body?.round })),
    });
    const parsed = parseStructuredEvaluation(result.response.text());
    if (!parsed.ok) return res.status(502).json({ error: parsed.error, requestId: logger.requestId });
    const usage = estimateAiUsage({ inputChars: question.length + answer.length, outputChars: result.response.text().length });
    recordMetric("ai.evaluation", { route: "/api/evaluate", ...usage });
    return res.status(200).json({ evaluation: parsed.value, usage, requestId: logger.requestId });
  } catch (error) {
    if (error.name === "AiConfigError") return res.status(error.status).json(getSafeConfigErrorPayload(error));
    logger.error("request.failed", { error });
    reportServerError(error, { route: "/api/evaluate", requestId: logger.requestId });
    return res.status(getGeminiErrorStatus(error)).json({ error: getSafeGeminiErrorMessage(error), requestId: logger.requestId });
  }
}
