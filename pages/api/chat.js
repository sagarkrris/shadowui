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

// Try models in order until one works
const MODELS = [
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-001",
  "gemini-1.5-pro-latest",
  "gemini-pro",
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // Convert messages to Gemini format
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const lastMessage = messages[messages.length - 1];

  // Try each model until one succeeds
  let lastError = null;
  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT,
      });

      const chat = model.startChat({ history });

      // Set up SSE streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      const result = await chat.sendMessageStream(lastMessage.content);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
      return; // success — exit
    } catch (error) {
      lastError = error;
      // If 404 (model not found) or 429 (quota), try next model
      if (
        error.message?.includes("404") ||
        error.message?.includes("not found") ||
        error.message?.includes("429") ||
        error.message?.includes("quota")
      ) {
        console.warn(`Model ${modelName} failed, trying next...`);
        continue;
      }
      // Other errors — stop immediately
      break;
    }
  }

  // All models failed
  console.error("All Gemini models failed:", lastError?.message);
  if (!res.headersSent) {
    res.status(500).json({ error: lastError?.message || "All models unavailable" });
  } else {
    res.write(`data: ${JSON.stringify({ error: "Model unavailable, please try again." })}\n\n`);
    res.end();
  }
}
