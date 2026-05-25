import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildSystemPrompt } from "../../lib/chatPrompt.mjs";
import { normalizeChatMessages } from "../../lib/chatRequest.mjs";
import { getGeminiModelCandidates } from "../../lib/geminiModels.mjs";
import { getGeminiErrorStatus, withGeminiModelFallback } from "../../lib/geminiRetry.mjs";
import { createRequestLogger } from "../../lib/serverLogger.mjs";

export default async function handler(req, res) {
  const logger = createRequestLogger({ route: "/api/chat" });
  res.setHeader("X-Request-Id", logger.requestId);

  if (req.method !== "POST") {
    logger.warn("request.method_not_allowed", { method: req.method });
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { profile } = req.body;
  const messages = normalizeChatMessages(req.body?.messages);

  if (!messages) {
    logger.warn("request.invalid", { reason: "empty_messages" });
    return res.status(400).json({ error: "At least one chat message is required." });
  }

  if (!process.env.GEMINI_API_KEY) {
    logger.error("config.missing_api_key");
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const modelCandidates = await getGeminiModelCandidates(apiKey);
  logger.info("request.accepted", {
    messageCount: messages.length,
    hasProfile: Boolean(profile),
    profileFields: profile ? Object.keys(profile).filter((key) => profile[key]).sort() : [],
    modelCandidateCount: modelCandidates.length,
  });

  if (!modelCandidates.length) {
    logger.error("model.none_available");
    return res.status(500).json({
      error: "No supported Gemini models found. Please check your server API key configuration.",
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const history = messages.slice(0, -1).map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
    const lastMessage = messages[messages.length - 1];

    const { modelName, result } = await withGeminiModelFallback(
      modelCandidates,
      (candidate) => {
        const model = genAI.getGenerativeModel({
          model: candidate,
          systemInstruction: buildSystemPrompt(profile),
        });
        const chat = model.startChat({ history });
        return chat.sendMessageStream(lastMessage.content);
      },
      {
        onFallback: (details) => logger.warn("model.fallback", details),
      },
    );

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
    const status = getGeminiErrorStatus(error);
    logger.error("request.failed", {
      error,
      responseStatus: status,
      status: error.status,
      code: error.code,
    });
    const safeError = "AI request failed. Please try again.";
    if (!res.headersSent) {
      res.status(status).json({ error: safeError, requestId: logger.requestId });
    } else {
      res.write(`data: ${JSON.stringify({ error: safeError, requestId: logger.requestId })}\n\n`);
      res.end();
    }
  }
}
