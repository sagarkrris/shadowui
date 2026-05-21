import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are a senior Java Tech Lead interviewer with 15+ years at top-tier product companies. The candidate has 6+ years of Java backend experience with Spring Boot, Micronaut, GCP, and OCI.

INTERVIEW MODE: Ask ONE focused question per turn. After the user answers, give structured feedback:
**Score: X/10**
**Strengths:** what they got right
**Gaps:** what was missing or needs depth
**Ideal Answer:** full explanation + Java code examples where relevant
**Follow-up:** one deeper question

PRACTICE MODE: Answer thoroughly with working Java code, time/space complexity for DSA, trade-offs for system design, and production-level insights.

Formatting: wrap code in \`\`\`java ... \`\`\` blocks. Use **bold** for section headers. Be rigorous — set high Tech Lead standards.`;

// Fetch available models from Google and pick the best one
async function getBestModel(apiKey) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await res.json();
    const models = (data.models || [])
      .filter(
        (m) =>
          m.supportedGenerationMethods?.includes("generateContent") &&
          (m.name.includes("flash") || m.name.includes("pro"))
      )
      .map((m) => m.name.replace("models/", ""));

    // Prefer flash (faster + free), then pro
    const flash = models.find((m) => m.includes("flash"));
    const pro = models.find((m) => m.includes("pro"));
    return flash || pro || models[0];
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Auto-detect available model for this API key
  const modelName = await getBestModel(apiKey);

  if (!modelName) {
    return res.status(500).json({
      error:
        "No supported Gemini models found for your API key. Please check your key at aistudio.google.com/app/apikey",
    });
  }

  console.log(`Using model: ${modelName}`);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_PROMPT,
    });

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const lastMessage = messages[messages.length - 1];
    const chat = model.startChat({ history });

    // SSE streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    // Send which model is being used so user can see
    res.write(`data: ${JSON.stringify({ model: modelName })}\n\n`);

    const result = await chat.sendMessageStream(lastMessage.content);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Gemini error:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
}
