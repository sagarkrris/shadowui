import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSafeConfigErrorPayload, runGeminiRouteOperation } from "../../lib/aiGateway.mjs";
import { buildSystemPrompt } from "../../lib/chatPrompt.mjs";
import { normalizeChatMessages } from "../../lib/chatRequest.mjs";
import { getGeminiErrorStatus, getSafeGeminiErrorMessage } from "../../lib/geminiRetry.mjs";
import { createRequestLogger } from "../../lib/serverLogger.mjs";
import { CHAT_LIMITS, getClientAddress, validateChatRequest } from "../../lib/requestSecurity.mjs";
import { checkDistributedRateLimit } from "../../lib/redisRateLimit.mjs";
import { requireConfiguredUser } from "../../lib/apiAuth.mjs";
import { estimateAiUsage, recordMetric, reportServerError } from "../../lib/observability.mjs";

export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

export default async function handler(req, res) {
  const logger = createRequestLogger({ route: "/api/chat" });
  res.setHeader("X-Request-Id", logger.requestId);

  if (req.method !== "POST") {
    logger.warn("request.method_not_allowed", { method: req.method });
    return res.status(405).json({ error: "Method not allowed" });
  }
  const auth = await requireConfiguredUser(req);
  if (auth.required && !auth.user) return res.status(401).json({ error: "Sign in to use AI interview features." });

  const rate = await checkDistributedRateLimit(`chat:${getClientAddress(req)}`);
  res.setHeader("X-RateLimit-Remaining", String(rate.remaining));
  if (!rate.ok) {
    logger.warn("rate_limited", { distributed: rate.distributed, degraded: rate.degraded });
    recordMetric("ai.rate_limited", { route: "/api/chat" });
    res.setHeader("Retry-After", String(rate.retryAfter));
    return res.status(429).json({ error: "Too many AI requests. Please try again shortly." });
  }

  const { profile } = req.body;
  const interviewMode = req.body?.interviewMode;
  const roundStrategy = req.body?.roundStrategy;
  const interviewPanel = req.body?.interviewPanel;
  const messages = normalizeChatMessages(req.body?.messages);

  const validation = validateChatRequest(req.body);
  if (!validation.ok) {
    logger.warn("request.invalid", { reason: validation.error });
    return res.status(validation.status).json({ error: validation.error, limits: CHAT_LIMITS });
  }
  if (!messages) return res.status(400).json({ error: "At least one chat message is required." });

  try {
    const history = messages.slice(0, -1).map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
    const lastMessage = messages[messages.length - 1];

    const { modelCandidates, modelName, result } = await runGeminiRouteOperation({
      noModelsMessage: "No supported Gemini models found. Please check your server API key configuration.",
      onFallback: (details) => logger.warn("model.fallback", details),
      operation: (candidate, { apiKey }) => {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: candidate,
          systemInstruction: buildSystemPrompt(profile, { interviewMode, roundStrategy, interviewPanel }),
        });
        const chat = model.startChat({ history });
        return chat.sendMessageStream(lastMessage.content);
      },
    });

    logger.info("request.accepted", {
      messageCount: messages.length,
      hasProfile: Boolean(profile),
      profileFields: profile ? Object.keys(profile).filter((key) => profile[key]).sort() : [],
      interviewPanel: interviewPanel || "default",
      modelCandidateCount: modelCandidates.length,
    });

    logger.info("stream.start", { modelName });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    res.write(`data: ${JSON.stringify({ model: modelName })}\n\n`);

    let chunkCount = 0;
    let textChars = 0;
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        chunkCount += 1;
        textChars += text.length;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
    const usage = estimateAiUsage({ inputChars: apiMessages.reduce((sum, item) => sum + item.content.length, 0), outputChars: textChars });
    logger.info("stream.done", { modelName, chunkCount, textChars, ...usage });
    recordMetric("ai.request", { route: "/api/chat", modelName, ...usage });
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
    reportServerError(error, { route: "/api/chat", requestId: logger.requestId, status });
    const safeError = getSafeGeminiErrorMessage(error);
    if (!res.headersSent) {
      res.status(status).json({ error: safeError, requestId: logger.requestId });
    } else {
      res.write(`data: ${JSON.stringify({ error: safeError, requestId: logger.requestId })}\n\n`);
      res.end();
    }
  }
}
