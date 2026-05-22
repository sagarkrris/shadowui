import { GoogleGenerativeAI } from "@google/generative-ai";

const SCREEN_PROMPT = `You are a full stack developer interview assistant analyzing a screenshot of a coding problem, system design prompt, UI task, database question, or interview scenario.

Analyze what you see and provide a structured response with these sections when relevant:

**Problem Understanding**
Brief restatement of the problem.

**Approach**
Step-by-step algorithm, design, debugging, or implementation approach.

**Solution**
Working code, schema, architecture notes, or explanation depending on the screenshot.

**Complexity / Trade-offs**
Time and space complexity for algorithms; trade-offs for architecture, frontend, backend, database, or cloud questions.

**Key Insights**
Edge cases, production concerns, and points to mention in the interview.

Be concise but complete. Format code in fenced code blocks with the right language when possible.`;

function buildScreenPrompt(context, profile) {
  const details = [];
  if (profile?.position) details.push(`Target position: ${String(profile.position).slice(0, 120)}`);
  if (profile?.experience) details.push(`Years of experience: ${String(profile.experience).slice(0, 80)}`);
  if (profile?.stack) details.push(`Tech stack: ${String(profile.stack).slice(0, 240)}`);

  return [
    SCREEN_PROMPT,
    details.length ? `Candidate profile:\n${details.map((detail) => `- ${detail}`).join("\n")}` : "",
    context ? `Extra context from user: ${String(context).slice(0, 500)}` : "",
  ].filter(Boolean).join("\n\n");
}

async function getBestVisionModel(apiKey) {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
      headers: { "x-goog-api-key": apiKey },
    });
    const data = await response.json();
    const models = (data.models || [])
      .filter(
        (model) =>
          model.supportedGenerationMethods?.includes("generateContent") &&
          (model.name.includes("flash") ||
            model.name.includes("pro") ||
            model.name.includes("gemini-pro-vision"))
      )
      .map((model) => model.name.replace("models/", ""));

    const flash = models.find((model) => model.includes("flash"));
    const pro = models.find((model) => model.includes("pro"));
    return flash || pro || "gemini-1.5-flash-latest";
  } catch {
    return "gemini-1.5-flash-latest";
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { imageBase64, mimeType = "image/png", context, profile } = req.body;

  if (!imageBase64) return res.status(400).json({ error: "imageBase64 required" });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = await getBestVisionModel(apiKey);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = buildScreenPrompt(context, profile);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const result = await model.generateContentStream([
      { inlineData: { data: imageBase64, mimeType } },
      prompt,
    ]);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Screen analysis error:", error.message);
    const safeError = "Screen analysis failed. Please try again.";
    if (!res.headersSent) {
      res.status(500).json({ error: safeError });
    } else {
      res.write(`data: ${JSON.stringify({ error: safeError })}\n\n`);
      res.end();
    }
  }
}
