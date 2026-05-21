import { GoogleGenerativeAI } from "@google/generative-ai";

const SCREEN_PROMPT = `You are a Java Tech Lead interview assistant analyzing a screenshot of a coding problem or interview question.

Analyze what you see and provide a structured response with these sections:

**Problem Understanding**
Brief restatement of the problem.

**Approach**
Step-by-step algorithm or design approach.

**Java Solution**
Complete working Java code with comments.

**Complexity**
- Time: O(?)
- Space: O(?)

**Key Insights**
Edge cases and optimizations to mention in the interview.

Be concise but complete. Format code in \`\`\`java blocks.`;

async function getBestVisionModel(apiKey) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await res.json();
    const models = (data.models || [])
      .filter(
        (m) =>
          m.supportedGenerationMethods?.includes("generateContent") &&
          (m.name.includes("flash") || m.name.includes("pro")) &&
          m.name.includes("1.5") || m.name.includes("2.0") || m.name.includes("gemini-pro-vision")
      )
      .map((m) => m.name.replace("models/", ""));
    const flash = models.find((m) => m.includes("flash"));
    const pro = models.find((m) => m.includes("pro"));
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

  const { imageBase64, mimeType = "image/png", context } = req.body;

  if (!imageBase64) return res.status(400).json({ error: "imageBase64 required" });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = await getBestVisionModel(apiKey);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = context
      ? `${SCREEN_PROMPT}\n\nExtra context from user: ${context}`
      : SCREEN_PROMPT;

    // SSE streaming
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
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
}
