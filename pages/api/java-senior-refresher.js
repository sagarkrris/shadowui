import { buildJavaSeniorRefresherFallbackQa, loadJavaSeniorRefresherQa } from "../../lib/javaSeniorRefresherQa.mjs";
import { withApiObservability } from "../../lib/apiObservability.mjs";

let cachedPayload = null;

async function loadQuestions() {
  try {
    const questions = await loadJavaSeniorRefresherQa();
    if (questions.length) return { questions, source: "pdf" };
  } catch {
    // Fall through to the bundled content when serverless file access fails.
  }

  return { questions: buildJavaSeniorRefresherFallbackQa(), source: "bundled-fallback" };
}

async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    cachedPayload ||= await loadQuestions();
    req.observabilityMeta = { questionCount: cachedPayload.questions.length, source: cachedPayload.source };
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600");
    return res.status(200).json(cachedPayload);
  } catch {
    return res.status(503).json({ error: "The Java senior refresher question bank is unavailable. Please try again." });
  }
}

export default withApiObservability("/api/java-senior-refresher", handler);
