import { readFile } from "node:fs/promises";
import path from "node:path";
import { getBlind75Problem } from "../../lib/blind75VisualTrack.mjs";
import { extractBlind75GuideEntryFromHtml, readBlind75GuideHtml } from "../../lib/blind75Guide.mjs";

const guidePath = path.join(process.cwd(), "public", "downloads", "blind-75-java-interview-study-guide.docx");
const entryCache = new Map();
let guideHtmlPromise;

function getGuideHtml() {
  if (!guideHtmlPromise) guideHtmlPromise = readFile(guidePath).then(readBlind75GuideHtml);
  return guideHtmlPromise;
}

async function getGuideEntry(problem) {
  if (!entryCache.has(problem.id)) {
    entryCache.set(problem.id, getGuideHtml().then((html) => extractBlind75GuideEntryFromHtml(html, problem)));
  }
  return entryCache.get(problem.id);
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const problemId = typeof req.query.problemId === "string" ? req.query.problemId : "";
  const problem = getBlind75Problem(problemId);
  if (!problemId || problem.id !== problemId) return res.status(400).json({ error: "Unknown Blind 75 problem" });

  try {
    const entry = await getGuideEntry(problem);
    if (!entry?.sections?.length) return res.status(404).json({ error: "This question is not included in the supplied Java study guide. You can still open its visualizer." });
    res.setHeader("Cache-Control", "no-cache");
    return res.status(200).json(entry);
  } catch {
    return res.status(500).json({ error: "The Java study guide could not be read" });
  }
}
