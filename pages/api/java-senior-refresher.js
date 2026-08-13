import { loadJavaSeniorRefresherQa } from "../../lib/javaSeniorRefresherQa.mjs";
import { withApiObservability } from "../../lib/apiObservability.mjs";

let cachedQuestions = null;

async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    cachedQuestions ||= await loadJavaSeniorRefresherQa();
    req.observabilityMeta = { questionCount: cachedQuestions.length };
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600");
    return res.status(200).json({ questions: cachedQuestions });
  } catch {
    return res.status(503).json({ error: "The Java senior refresher question bank is unavailable. Please try again." });
  }
}

export default withApiObservability("/api/java-senior-refresher", handler);
