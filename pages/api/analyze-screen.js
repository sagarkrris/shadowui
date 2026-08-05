import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSafeConfigErrorPayload, runGeminiRouteOperation } from "../../lib/aiGateway.mjs";
import { getGeminiErrorStatus, getSafeGeminiErrorMessage } from "../../lib/geminiRetry.mjs";
import { createRequestLogger } from "../../lib/serverLogger.mjs";
import { requireConfiguredUser } from "../../lib/apiAuth.mjs";

const SCREEN_PROMPT = `You are a full stack developer interview assistant analyzing a screenshot of a coding problem, system design prompt, UI task, database question, or interview scenario.

Analyze what you see and provide a part-wise structured response with these sections when relevant:

**Part 1: Problem Understanding**
Brief restatement of the problem.

**Part 2: Approach**
Step-by-step algorithm, design, debugging, or implementation approach.

**Part 3: Solution**
Working code, schema, architecture notes, or explanation depending on the screenshot.

**Part 4: Complexity / Trade-offs / Risks**
Time and space complexity for algorithms; trade-offs for architecture, frontend, backend, database, or cloud questions.

**Part 5: Interview Tips / Follow-up**
Edge cases, production concerns, and points to mention in the interview.

Skip a part only when it would be empty, but keep the remaining part labels clear. Be concise but complete. Format code in fenced code blocks with the right language when possible.`;

function buildScreenPrompt(context, profile) {
  const details = [];
  if (profile?.name) details.push(`Candidate name: ${String(profile.name).slice(0, 80)}`);
  if (profile?.position) details.push(`Target position: ${String(profile.position).slice(0, 120)}`);
  if (profile?.experience) details.push(`Years of experience: ${String(profile.experience).slice(0, 80)}`);
  if (profile?.stack) details.push(`Tech stack: ${String(profile.stack).slice(0, 240)}`);

  return [
    SCREEN_PROMPT,
    details.length ? `Candidate profile:\n${details.map((detail) => `- ${detail}`).join("\n")}` : "",
    context ? `Extra context from user: ${String(context).slice(0, 500)}` : "",
  ].filter(Boolean).join("\n\n");
}

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

export default async function handler(req, res) {
  const logger = createRequestLogger({ route: "/api/analyze-screen" });
  res.setHeader("X-Request-Id", logger.requestId);

  if (req.method !== "POST") {
    logger.warn("request.method_not_allowed", { method: req.method });
    return res.status(405).json({ error: "Method not allowed" });
  }
  const auth = await requireConfiguredUser(req);
  if (auth.required && !auth.user) return res.status(401).json({ error: "Sign in to use screen analysis." });

  const { imageBase64, mimeType = "image/png", context, profile } = req.body;

  if (!imageBase64) {
    logger.warn("request.invalid", { reason: "missing_image" });
    return res.status(400).json({ error: "imageBase64 required" });
  }
  try {
    const prompt = buildScreenPrompt(context, profile);

    const { modelCandidates, modelName, result } = await runGeminiRouteOperation({
      vision: true,
      onFallback: (details) => logger.warn("model.fallback", details),
      operation: (candidate, { apiKey }) => {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: candidate });
        return model.generateContentStream([
          { inlineData: { data: imageBase64, mimeType } },
          prompt,
        ]);
      },
    });

    logger.info("request.accepted", {
      mimeType,
      imageBytesApprox: Math.round((imageBase64.length * 3) / 4),
      contextLength: context ? String(context).length : 0,
      hasProfile: Boolean(profile),
      modelCandidateCount: modelCandidates.length,
    });

    logger.info("stream.start", { modelName });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

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
    const safeError = getSafeGeminiErrorMessage(error, "Screen analysis failed. Please try again.");
    if (!res.headersSent) {
      res.status(status).json({ error: safeError, requestId: logger.requestId });
    } else {
      res.write(`data: ${JSON.stringify({ error: safeError, requestId: logger.requestId })}\n\n`);
      res.end();
    }
  }
}
