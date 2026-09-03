import { buildJavaSeniorRefresherFallbackQa } from "../../lib/javaSeniorRefresherQa.mjs";
import { withApiObservability } from "../../lib/apiObservability.mjs";

let cachedPayload = null;

async function loadQuestions() {
  // The bundled bank contains the reviewed answers for the exact interview
  // questions exposed by the UI. The PDF is retained as supplemental study
  // material, but its extracted wording must not replace those answers.
  return { questions: buildJavaSeniorRefresherFallbackQa(), source: "curated" };
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
