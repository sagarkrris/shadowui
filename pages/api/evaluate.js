import { assessmentMetadata } from '../../lib/assessmentMetadata.mjs';
import { EVALUATION_RESPONSE_SCHEMA, requestVerifiedEvaluation } from "../../lib/evaluationRequest.mjs";
import { getSafeConfigErrorPayload, runGeminiRouteOperation } from "../../lib/aiGateway.mjs";
import { buildStructuredEvaluationPrompt } from "../../lib/interviewSession.mjs";
import { getGeminiErrorStatus, getSafeGeminiErrorMessage } from "../../lib/geminiRetry.mjs";
import { createRequestLogger } from "../../lib/serverLogger.mjs";
import { getClientAddress } from "../../lib/requestSecurity.mjs";
import { checkDistributedRateLimit } from "../../lib/redisRateLimit.mjs";
import { requireConfiguredUser } from "../../lib/apiAuth.mjs";
import { estimateAiUsage, recordMetric, reportServerError } from "../../lib/observability.mjs";
import { withApiObservability } from "../../lib/apiObservability.mjs";
import { createGeminiClient, generateContent } from "../../lib/googleGenai.mjs";

export const config = { maxDuration: 60 };

export function createEvaluateHandler({ authorize = requireConfiguredUser, rateLimit = checkDistributedRateLimit, runOperation = runGeminiRouteOperation } = {}) {
return async function handler(req, res) {
  const logger = createRequestLogger({ route: "/api/evaluate", requestId: res.getHeader?.("X-Request-Id") || req.requestId });
  res.setHeader("X-Request-Id", logger.requestId);
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const auth = await authorize(req);
  if (auth.required && !auth.user) return res.status(401).json({ error: "Sign in to use AI evaluation." });
  const rate = await rateLimit(`evaluate:${getClientAddress(req)}`, { limit: 20 });
  if (!rate.ok) { recordMetric("ai.rate_limited", { route: "/api/evaluate" }); return res.status(429).json({ error: "Too many evaluation requests." }); }
  const question = String(req.body?.question || "").trim();
  const answer = String(req.body?.answer || "").trim();
  if (!question || !answer || question.length > 12000 || answer.length > 12000) return res.status(400).json({ error: "Question and answer are required and must be under 12,000 characters." });
  try {
    const signal = AbortSignal.timeout(50000);
    let assessedModel = '';
    const { evaluation, outputChars } = await requestVerifiedEvaluation({
      answer,
      prompt: buildStructuredEvaluationPrompt({ question, answer, profile: req.body?.profile, round: req.body?.round, difficulty: req.body?.difficulty, feedbackDepth: req.body?.feedbackDepth }),
      onInvalid: details => logger.warn("evaluation.invalid", details),
      generate: async contents => {
        const { result, modelName } = await runOperation({
          onFallback: (details) => logger.warn("model.fallback", details),
          operation: (candidate, { apiKey }) => generateContent(createGeminiClient(apiKey), { model: candidate, config: { responseMimeType: "application/json", responseJsonSchema: EVALUATION_RESPONSE_SCHEMA, httpOptions: { timeout: 25000 }, abortSignal: signal }, contents }),
        });
        assessedModel = modelName;
        return result;
      },
    });
    const usage = estimateAiUsage({ inputChars: question.length + answer.length, outputChars });
    recordMetric("ai.evaluation", { route: "/api/evaluate", ...usage });
    return res.status(200).json({ evaluation: { ...evaluation, assessmentMeta: assessmentMetadata(assessedModel, { ...req.body, question }) }, usage, requestId: logger.requestId });
  } catch (error) {
    if (error.name === "EvaluationValidationError") return res.status(502).json({ error: error.message, requestId: logger.requestId });
    if (error.name === "AiConfigError") return res.status(error.status).json(getSafeConfigErrorPayload(error));
    logger.error("request.failed", { error });
    reportServerError(error, { route: "/api/evaluate", requestId: logger.requestId });
    return res.status(getGeminiErrorStatus(error)).json({ error: getSafeGeminiErrorMessage(error), requestId: logger.requestId });
  }
}

}
export default withApiObservability("/api/evaluate", createEvaluateHandler());
