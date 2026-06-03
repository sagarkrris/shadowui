import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSafeConfigErrorPayload, runGeminiRouteOperation } from "../../lib/aiGateway.mjs";
import { buildSystemPrompt } from "../../lib/chatPrompt.mjs";
import { normalizeChatMessages } from "../../lib/chatRequest.mjs";
import { getGeminiErrorStatus, getSafeGeminiErrorMessage } from "../../lib/geminiRetry.mjs";
import { createRequestLogger } from "../../lib/serverLogger.mjs";

export default async function handler(req, res) {
  const logger = createRequestLogger({ route: "/api/chat" });
  res.setHeader("X-Request-Id", logger.requestId);

  if (req.method !== "POST") {
    logger.warn("request.method_not_allowed", { method: req.method });
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { profile } = req.body;
  const interviewMode = req.body?.interviewMode;
  const roundStrategy = req.body?.roundStrategy;
  const interviewPanel = req.body?.interviewPanel;
  const messages = normalizeChatMessages(req.body?.messages);

  if (!messages) {
    logger.warn("request.invalid", { reason: "empty_messages" });
    return res.status(400).json({ error: "At least one chat message is required." });
  }

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
    logger.info("stream.done", { modelName, chunkCount, textChars });
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
    const safeError = getSafeGeminiErrorMessage(error);
    if (!res.headersSent) {
      res.status(status).json({ error: safeError, requestId: logger.requestId });
    } else {
      res.write(`data: ${JSON.stringify({ error: safeError, requestId: logger.requestId })}\n\n`);
      res.end();
    }
  }
}
