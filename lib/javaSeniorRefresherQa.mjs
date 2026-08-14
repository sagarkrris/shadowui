const REFRESHER_PDF_FILE = "java-senior-refresher-java-21-jvm-concurrency.pdf";

import { listJavaSeniorRefresherArticles } from "./javaDigest.mjs";

function normalizedLines(text) {
  return String(text || "")
    .replace(/Java Senior Refresher - Java 21, JVM, Concurrency, Collections, Streams Page \d+/g, "")
    .replace(/-- \d+ of \d+ --/g, "")
    .replace(/Senior answer\s+(?=[A-Z])/g, "Senior answer\n")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("Java Senior Refresher -") && !/^Page \d+$/.test(line));
}

function isSectionHeading(line) {
  return /^\d+\.\s/.test(line) || /senior-level interview answers$/i.test(line);
}

/**
 * Preserves every question immediately followed by its "Senior answer" block.
 * The PDF is the source of truth; this function deliberately does not summarize or rewrite it.
 */
export function parseJavaSeniorRefresherQa(text) {
  const lines = normalizedLines(text);
  const entries = [];
  let section = "Java Senior Refresher";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (isSectionHeading(line)) section = line;
    if (lines[index + 1] !== "Senior answer") continue;

    const answerLines = [];
    let cursor = index + 2;
    while (cursor < lines.length && lines[cursor + 1] !== "Senior answer") {
      if (isSectionHeading(lines[cursor])) break;
      answerLines.push(lines[cursor]);
      cursor += 1;
    }

    const answer = answerLines.join(" ").trim();
    if (line && answer) {
      entries.push({
        id: `refresher-qa-${entries.length + 1}`,
        section,
        question: line,
        answer,
      });
    }
  }

  return entries;
}

// The PDF remains the preferred source. This bundled fallback keeps the
// refresher usable in serverless environments that do not expose public files
// to the runtime filesystem.
export function buildJavaSeniorRefresherFallbackQa() {
  return listJavaSeniorRefresherArticles().flatMap((article) => (
    (article.questions || []).map((question, index) => ({
      id: `refresher-fallback-${article.id}-${index + 1}`,
      section: article.title,
      question,
      answer: [article.summary, ...(article.learn || [])].filter(Boolean).join(" "),
    }))
  ));
}

export async function loadJavaSeniorRefresherQa() {
  const [{ readFile }, path, { extractResumeTextFromBuffer }] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
    import("./resumeExtract.mjs"),
  ]);
  const filePath = path.join(process.cwd(), "public", REFRESHER_PDF_FILE);
  const buffer = await readFile(filePath);
  const text = await extractResumeTextFromBuffer({
    buffer,
    fileName: REFRESHER_PDF_FILE,
    mimeType: "application/pdf",
  });

  return parseJavaSeniorRefresherQa(text);
}
