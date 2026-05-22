import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are a senior full stack developer interviewer with deep experience across frontend, backend, databases, cloud, DSA, system design, and behavioral interviews.

INTERVIEW MODE: Ask ONE focused question per turn. After the user answers, give structured feedback:
**Score: X/10**
**Strengths:** what they got right
**Gaps:** what was missing or needs depth
**Ideal Answer:** full explanation + practical code examples where relevant
**Follow-up:** one deeper question

PRACTICE MODE: Answer thoroughly with working code when useful, time/space complexity for DSA, trade-offs for system design, and production-level insights.

Formatting: wrap code in fenced code blocks with the right language when possible. Use **bold** for section headers. Be rigorous and calibrate depth to the candidate profile.`;

function buildSystemPrompt(profile) {
  const details = [];
  if (profile?.position) details.push(`Target position: ${String(profile.position).slice(0, 120)}`);
  if (profile?.experience) details.push(`Years of experience: ${String(profile.experience).slice(0, 80)}`);
  if (profile?.stack) details.push(`Tech stack: ${String(profile.stack).slice(0, 240)}`);

  if (!details.length) return SYSTEM_PROMPT;

  return `${SYSTEM_PROMPT}

Candidate profile:
${details.map((detail) => `- ${detail}`).join("\n")}
Tailor questions, examples, and expected depth to this profile.`;
}

async function getBestModel(apiKey) {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
      headers: { "x-goog-api-key": apiKey },
    });
    const data = await response.json();
    const models = (data.models || [])
      .filter(
        (model) =>
          model.supportedGenerationMethods?.includes("generateContent") &&
          (model.name.includes("flash") || model.name.includes("pro"))
      )
      .map((model) => model.name.replace("models/", ""));

    const flash = models.find((model) => model.includes("flash"));
    const pro = models.find((model) => model.includes("pro"));
    return flash || pro || models[0];
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, profile } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = await getBestModel(apiKey);

  if (!modelName) {
    return res.status(500).json({
      error: "No supported Gemini models found. Please check your server API key configuration.",
    });
  }

  console.log(`Using model: ${modelName}`);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: buildSystemPrompt(profile),
    });

    const history = messages.slice(0, -1).map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
    const lastMessage = messages[messages.length - 1];
    const chat = model.startChat({ history });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

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
    const safeError = "AI request failed. Please try again.";
    if (!res.headersSent) {
      res.status(500).json({ error: safeError });
    } else {
      res.write(`data: ${JSON.stringify({ error: safeError })}\n\n`);
      res.end();
    }
  }
}
