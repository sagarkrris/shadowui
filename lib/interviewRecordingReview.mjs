const FILLER_PATTERNS = [
  { label: "um", pattern: /\bum+\b/gi },
  { label: "uh", pattern: /\buh+\b/gi },
  { label: "like", pattern: /\blike\b/gi },
  { label: "you know", pattern: /\byou know\b/gi },
  { label: "basically", pattern: /\bbasically\b/gi },
  { label: "actually", pattern: /\bactually\b/gi },
  { label: "literally", pattern: /\bliterally\b/gi },
  { label: "sort of", pattern: /\bsort of\b/gi },
  { label: "kind of", pattern: /\bkind of\b/gi },
];

const NUMBER_WORD_PATTERN = /\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million)\b/gi;
const NUMERIC_PATTERN = /\b\d+(?:\.\d+)?%?\b/gi;

function normalizeTranscript(transcript = "") {
  return `${transcript}`.replace(/\s+/g, " ").trim();
}

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

function formatDuration(durationMs = 0) {
  const totalSeconds = Math.max(0, Math.round(Number(durationMs) / 1000) || 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = `${totalSeconds % 60}`.padStart(2, "0");

  return {
    ms: totalSeconds * 1000,
    seconds: totalSeconds,
    label: `${minutes}:${seconds}`,
  };
}

function getWords(transcript) {
  return transcript.match(/[A-Za-z0-9%]+(?:'[A-Za-z0-9]+)?/g) || [];
}

function getSentences(transcript) {
  return transcript.split(/[.!?]+/).map((sentence) => sentence.trim()).filter(Boolean);
}

function analyzeFillers(transcript) {
  const items = FILLER_PATTERNS.map(({ label, pattern }) => ({
    label,
    count: countMatches(transcript, pattern),
  })).filter((item) => item.count > 0);

  return {
    total: items.reduce((sum, item) => sum + item.count, 0),
    items,
  };
}

function analyzeStarStructure(transcript) {
  return {
    situation: /\b(?:situation|context|problem|challenge|when)\b/i.test(transcript),
    task: /\b(?:task|goal|responsib(?:le|ility)|needed|my role)\b/i.test(transcript),
    action: /\b(?:action|i took|i built|implemented|added|created|led|simplified|designed)\b/i.test(transcript),
    result: /\b(?:result|outcome|impact|lift|fell|reduced|improved|saved|increased|decreased|fewer)\b/i.test(transcript),
  };
}

function analyzeMetrics(transcript) {
  const numeric = transcript.match(NUMERIC_PATTERN) || [];
  const numberWords = transcript.match(NUMBER_WORD_PATTERN) || [];
  const count = numeric.length + numberWords.length;

  return {
    count,
    hasNumbers: count > 0,
    examples: [...numeric, ...numberWords].slice(0, 5),
  };
}

function scoreClarity({ words, sentences, fillerTotal, starCovered, metrics }) {
  if (words.length === 0) return 0;

  const averageSentenceLength = sentences.length ? words.length / sentences.length : words.length;
  const fillerPenalty = Math.min(24, fillerTotal * 4);
  const sentencePenalty = averageSentenceLength > 28 ? Math.min(18, Math.round((averageSentenceLength - 28) / 2)) : 0;
  const starPenalty = (4 - starCovered) * 7;
  const metricBonus = metrics.hasNumbers ? 4 : 0;

  return Math.max(0, Math.min(100, Math.round(96 - fillerPenalty - sentencePenalty - starPenalty + metricBonus)));
}

function starLabels(starStructure) {
  return [
    ["situation", "Situation"],
    ["task", "Task"],
    ["action", "Action"],
    ["result", "Result"],
  ].filter(([key]) => starStructure[key]).map(([, label]) => label);
}

export function buildPrivateTranscriptPreview(transcript = "", { maxWords = 18 } = {}) {
  const words = getWords(normalizeTranscript(transcript));
  if (words.length === 0) return "";

  const preview = words.slice(0, maxWords).join(" ");
  return words.length > maxWords ? `${preview}...` : preview;
}

export function analyzeInterviewRecordingTranscript(transcript = "", options = {}) {
  const normalizedTranscript = normalizeTranscript(transcript);
  const duration = formatDuration(options.durationMs);
  const words = getWords(normalizedTranscript);

  if (words.length === 0) {
    return {
      empty: true,
      transcript: "",
      transcriptPreview: "",
      duration,
      wordCount: 0,
      fillerWords: { total: 0, items: [] },
      starStructure: { situation: false, task: false, action: false, result: false },
      starCoverage: [],
      metrics: { count: 0, hasNumbers: false, examples: [] },
      clarityScore: 0,
      displayText: "No transcript captured. Recording review works best when you type or paste the answer after the interview.",
      fallback: {
        type: "typed-fallback",
        message: "Type or paste your answer to generate a recording review.",
      },
    };
  }

  const sentences = getSentences(normalizedTranscript);
  const fillerWords = analyzeFillers(normalizedTranscript);
  const starStructure = analyzeStarStructure(normalizedTranscript);
  const starCoverage = starLabels(starStructure);
  const metrics = analyzeMetrics(normalizedTranscript);
  const clarityScore = scoreClarity({
    words,
    sentences,
    fillerTotal: fillerWords.total,
    starCovered: starCoverage.length,
    metrics,
  });
  const wordsPerMinute = duration.seconds > 0 ? Math.round(words.length / (duration.seconds / 60)) : 0;

  return {
    empty: false,
    transcript: normalizedTranscript,
    transcriptPreview: buildPrivateTranscriptPreview(normalizedTranscript),
    duration,
    wordCount: words.length,
    wordsPerMinute,
    fillerWords,
    starStructure,
    starCoverage,
    metrics,
    clarityScore,
    displayText: `Transcript reviewed locally: ${words.length} words over ${duration.label}, ${fillerWords.total} filler ${fillerWords.total === 1 ? "word" : "words"}, ${starCoverage.length}/4 STAR cues, clarity ${clarityScore}/100.`,
    fallback: null,
  };
}

export function buildInterviewRecordingReviewPrompt(review, context = {}) {
  const safeReview = review || analyzeInterviewRecordingTranscript("");
  const roleLine = context.role ? `Role: ${context.role}` : "Role: Not specified";
  const questionLine = context.question ? `Question: ${context.question}` : "Question: Not specified";
  const coverage = safeReview.starCoverage?.length ? safeReview.starCoverage.join(", ") : "None detected";
  const fillers = safeReview.fillerWords?.items?.length
    ? safeReview.fillerWords.items.map((item) => `${item.label} (${item.count})`).join(", ")
    : "None detected";

  return [
    "Review this interview answer using the local transcript analysis below.",
    "Do not ask for or reference stored audio; provide concise coaching based on the transcript-derived signals.",
    roleLine,
    questionLine,
    `Duration: ${safeReview.duration?.label || "0:00"}`,
    `Words: ${safeReview.wordCount || 0}`,
    `Pace: ${safeReview.wordsPerMinute || 0} wpm`,
    `Filler words: ${safeReview.fillerWords?.total || 0}${fillers === "None detected" ? "" : ` (${fillers})`}`,
    `STAR coverage: ${coverage}`,
    `Metrics mentioned: ${safeReview.metrics?.hasNumbers ? "Yes" : "No"}`,
    `Clarity score: ${safeReview.clarityScore || 0}/100`,
    `Transcript preview: ${safeReview.transcriptPreview || "No transcript captured"}`,
    "Return: 3 strengths, 3 improvements, a rewritten STAR answer outline, and one next practice drill.",
  ].join("\n");
}
