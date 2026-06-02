const ALLOWED_TYPES = new Set(["mcq", "coding", "quantitative"]);
const ALLOWED_DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);

function stripJsonFence(text) {
  const raw = String(text || "").trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] || raw).trim();
}

function toChoice(choice, index) {
  if (typeof choice === "string") {
    return {
      id: String.fromCharCode(97 + index),
      text: choice.trim(),
    };
  }

  return {
    id: String(choice?.id || String.fromCharCode(97 + index)).trim().toLowerCase().slice(0, 1),
    text: String(choice?.text || "").trim(),
  };
}

function normalizeChallenge(item, index, source) {
  const type = String(item?.type || "").trim().toLowerCase();
  const choices = Array.isArray(item?.choices) ? item.choices.map(toChoice).filter((choice) => choice.id && choice.text) : [];
  const correctChoiceId = String(item?.correctChoiceId || "").trim().toLowerCase().slice(0, 1);
  const title = String(item?.title || "").trim();
  const prompt = String(item?.prompt || "").trim();
  const explanation = String(item?.explanation || "").trim();

  if (!ALLOWED_TYPES.has(type)) return null;
  if (!title || !prompt || explanation.length < 20) return null;
  if (choices.length !== 4) return null;
  if (!choices.some((choice) => choice.id === correctChoiceId)) return null;

  return {
    id: `generated-${type}-${index + 1}`,
    lessonId: String(item?.lessonId || "generated").trim() || "generated",
    type,
    typeLabel: type === "mcq" ? "MCQ" : type === "coding" ? "Coding" : "Quantitative",
    title,
    difficulty: ALLOWED_DIFFICULTIES.has(item?.difficulty) ? item.difficulty : "Medium",
    prompt,
    codeSnippet: typeof item?.codeSnippet === "string" ? item.codeSnippet.trim() : "",
    choices,
    correctChoiceId,
    explanation,
    trick: String(item?.trick || "Watch for assumptions that sound convenient but break the invariant.").trim(),
    tricky: Boolean(item?.tricky || type === "coding"),
    tags: Array.isArray(item?.tags) ? item.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 5) : ["Generated"],
    source,
  };
}

export function buildDsaChallengeGenerationPrompt({ stack = "JavaScript", count = 12 } = {}) {
  return [
    "Generate fresh DSA interview practice questions as strict JSON.",
    `Target stack: ${stack || "JavaScript"}.`,
    `Return exactly ${count} challenges.`,
    "Mix these types evenly: mcq, coding, quantitative.",
    "Include tricky interview traps, edge cases, and Big-O reasoning.",
    "Use this schema:",
    `{
  "challenges": [
    {
      "type": "mcq | coding | quantitative",
      "lessonId": "arrays | strings | hashing | two-pointers | stack-queue | trees | graph-bfs-dfs | dp-basics",
      "title": "short title",
      "difficulty": "Easy | Medium | Hard",
      "prompt": "question text",
      "codeSnippet": "only for coding questions, otherwise empty string",
      "choices": [
        { "id": "a", "text": "choice" },
        { "id": "b", "text": "choice" },
        { "id": "c", "text": "choice" },
        { "id": "d", "text": "choice" }
      ],
      "correctChoiceId": "a",
      "explanation": "why the answer is correct",
      "trick": "what trap the wrong answers exploit",
      "tricky": true,
      "tags": ["DSA", "Pattern"]
    }
  ]
}`,
    "Return JSON only. Do not include markdown unless you must wrap the JSON in a json code fence.",
  ].join("\n");
}

export function parseGeneratedDsaChallenges(text, { source = "generated" } = {}) {
  try {
    const parsed = JSON.parse(stripJsonFence(text));
    const items = Array.isArray(parsed?.challenges) ? parsed.challenges : [];
    return items
      .map((item, index) => normalizeChallenge(item, index, source))
      .filter(Boolean);
  } catch {
    return [];
  }
}
