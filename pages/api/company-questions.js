import { listCoderPadQuestions } from "../../lib/coderpadQuestionBank.mjs";
import { withApiObservability } from "../../lib/apiObservability.mjs";

async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const result = await listCoderPadQuestions();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(502).json({ error: "Question provider unavailable" });
  }
}

export default withApiObservability("/api/company-questions", handler);
