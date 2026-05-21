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

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Convert messages to Gemini format
    // Gemini uses "user" / "model" roles (not "assistant")
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const lastMessage = messages[messages.length - 1];

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
  } catch (error) {
    console.error("Gemini API error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "Internal server error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
}
