import { getCompanyPrep } from "./companyPrep.mjs";

export const INTERVIEW_READY_PRACTICE_STORAGE_KEY = "interviewiq.interviewReady.practice.v1";
export const INTERVIEW_READY_PRACTICE_STORAGE_VERSION = 1;

function clampScore(value) {
  return Math.max(0, Math.min(10, Math.round(value * 10) / 10));
}

function average(values = []) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function createInterviewReadyPracticeState(state = {}) {
  return {
    company: String(state.company || "Amazon").trim() || "Amazon",
    selectedQuestionId: state.selectedQuestionId || "",
    answers: state.answers && typeof state.answers === "object" ? state.answers : {},
    sessions: state.sessions && typeof state.sessions === "object" ? state.sessions : {},
  };
}

export function saveInterviewReadyAnswer(state = {}, {
  questionId,
  draft = "",
  company = "General",
  evaluation = null,
  durationSeconds = null,
  practicedAt = new Date().toISOString(),
} = {}) {
  if (!questionId) return createInterviewReadyPracticeState(state);

  const next = createInterviewReadyPracticeState(state);
  next.answers[questionId] = {
    questionId,
    draft: String(draft || ""),
    company: String(company || "General"),
    evaluation: evaluation || next.answers[questionId]?.evaluation || null,
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : next.answers[questionId]?.durationSeconds || null,
    practicedAt,
  };
  return next;
}

export function setInterviewReadyCompany(state = {}, company = "Amazon") {
  const next = createInterviewReadyPracticeState(state);
  next.company = String(company || "Amazon").trim() || "Amazon";
  return next;
}

export function setInterviewReadySelectedQuestion(state = {}, questionId = "") {
  const next = createInterviewReadyPracticeState(state);
  next.selectedQuestionId = questionId || "";
  return next;
}

export function buildInterviewReadyCompanyPack(company = "Amazon") {
  const prep = getCompanyPrep(company);

  return {
    company: prep.company,
    caveat: prep.caveat,
    packs: [
      {
        id: "behavioral",
        label: "Behavioral Pack",
        items: (prep.behavioral || []).slice(0, 4).map((question, index) => ({
          id: `behavioral-${index}`,
          type: "Behavioral",
          title: question,
          prompt: question,
        })),
      },
      {
        id: "coding",
        label: "Coding Pack",
        items: (prep.dsa || []).slice(0, 4).map((item, index) => ({
          id: `coding-${index}`,
          type: "Coding",
          title: item.title,
          prompt: item.prompt,
        })),
      },
      {
        id: "system-design",
        label: "System Design Pack",
        items: (prep.systemDesign || []).slice(0, 4).map((item, index) => ({
          id: `system-design-${index}`,
          type: "System Design",
          title: item.title,
          prompt: item.prompt,
        })),
      },
    ],
  };
}

function scoreDirectness(answer) {
  const text = normalizeText(answer);
  if (!text) return 0;
  const words = text.split(" ").length;
  const opener = text.split(/[.!?]/)[0] || "";
  let score = 4;

  if (words >= 35) score += 1.2;
  if (/\b(is|means|usually|because|should|would|difference|important)\b/i.test(opener)) score += 2.2;
  if (/\bfirst\b|\bto answer directly\b|\bdirectly\b/i.test(opener)) score += 1;
  if (words > 220) score -= 1.2;

  return clampScore(score);
}

function scoreDepth(answer) {
  const text = normalizeText(answer);
  if (!text) return 0;
  let score = 3.5;

  if (text.split(/[.!?]/).filter(Boolean).length >= 3) score += 1.5;
  if (/\bbecause\b|\btherefore\b|\bso that\b|\bthe reason\b/i.test(text)) score += 1.5;
  if (/\bfor example\b|\bfor instance\b|\bin practice\b/i.test(text)) score += 1.2;
  if (/\bdepends\b|\btrade-?off\b|\bhowever\b|\bon the other hand\b/i.test(text)) score += 1.8;

  return clampScore(score);
}

function scoreTradeoffs(answer) {
  const text = normalizeText(answer);
  if (!text) return 0;
  let score = 2.5;

  if (/\btrade-?off\b/i.test(text)) score += 3;
  if (/\bhowever\b|\bbut\b|\bdepends\b|\bwhereas\b|\bon the other hand\b/i.test(text)) score += 2.5;
  if (/\bcost\b|\bcomplexity\b|\blatency\b|\bconsistency\b|\bthroughput\b|\breadability\b/i.test(text)) score += 1.5;

  return clampScore(score);
}

function scoreExample(answer) {
  const text = normalizeText(answer);
  if (!text) return 0;
  let score = 2.5;

  if (/\bfor example\b|\bfor instance\b|\bimagine\b|\bin a backend service\b|\bin practice\b/i.test(text)) score += 3;
  if (/\bapi\b|\bcache\b|\bdatabase\b|\brequest\b|\bpayment\b|\border\b|\bthread\b|\bservice\b/i.test(text)) score += 2.2;
  if (/\bteam\b|\bproject\b|\buser\b|\bproduction\b/i.test(text)) score += 1;

  return clampScore(score);
}

function scoreConfidence(answer) {
  const text = normalizeText(answer);
  if (!text) return 0;
  let score = 6;

  if (/\bkind of\b|\bsort of\b|\bmaybe\b|\bprobably\b|\bi guess\b|\bsomehow\b/i.test(text)) score -= 2.5;
  if (/\bi would say\b|\bi would explain\b|\bi would start\b/i.test(text)) score += 0.8;
  if (/\bmust\b|\bshould\b|\bimportant\b|\bkey point\b/i.test(text)) score += 1;

  return clampScore(score);
}

export function evaluateInterviewReadyAnswer(answer = "", question = null) {
  const text = normalizeText(answer);
  const words = text ? text.split(" ").length : 0;
  const rubric = [
    { key: "directness", label: "Directness", score: scoreDirectness(text) },
    { key: "depth", label: "Depth", score: scoreDepth(text) },
    { key: "tradeOffs", label: "Trade-offs", score: scoreTradeoffs(text) },
    { key: "examples", label: "Examples", score: scoreExample(text) },
    { key: "confidence", label: "Confidence", score: scoreConfidence(text) },
  ];
  const overall = clampScore(average(rubric.map((item) => item.score)));
  const strengths = [];
  const gaps = [];
  const roboticSignals = [];
  const vagueSignals = [];

  if (rubric.find((item) => item.key === "directness")?.score >= 7) strengths.push("You get to the answer quickly instead of circling around it.");
  else gaps.push("Open with the answer sooner so the interviewer knows your position in the first sentence.");

  if (rubric.find((item) => item.key === "tradeOffs")?.score >= 7) strengths.push("You include trade-offs, which makes the answer sound experienced.");
  else gaps.push("Add one trade-off or decision rule so the answer sounds more senior and less textbook.");

  if (rubric.find((item) => item.key === "examples")?.score >= 7) strengths.push("Your example makes the explanation concrete and easier to trust.");
  else gaps.push("Add one realistic backend or team example to stop the answer from sounding abstract.");

  if (words < 40) vagueSignals.push("The answer is too short to show depth yet.");
  if (!/\bfor example\b|\bfor instance\b|\bin practice\b/i.test(text)) vagueSignals.push("There is no concrete example anchoring the answer.");
  if (!/\bbecause\b|\bso that\b|\bthe reason\b/i.test(text)) vagueSignals.push("The reasoning is implied more than explained.");

  const repeatedFirst = (text.match(/\b(first|second|third|basically)\b/gi) || []).length;
  if (repeatedFirst >= 3) roboticSignals.push("The answer leans on list-style filler and may sound rehearsed.");
  if (/\bfirstly\b|\bsecondly\b|\bthirdly\b/i.test(text)) roboticSignals.push("Heavy sequencing words can make delivery sound scripted.");
  if (/\baccording to\b|\bas we know\b|\bin conclusion\b/i.test(text)) roboticSignals.push("Some phrasing sounds essay-like rather than spoken.");

  const questionKeywords = String(question?.question || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 4);
  const repeatedKeywords = questionKeywords.filter((token) => new RegExp(`\\b${token}\\b`, "gi").test(text)).length;
  if (questionKeywords.length && repeatedKeywords >= Math.max(3, Math.ceil(questionKeywords.length * 0.7)) && words < 80) {
    roboticSignals.push("You may be mirroring the question more than explaining it in your own words.");
  }

  return {
    overall,
    rubric,
    strengths,
    gaps,
    roboticSignals,
    vagueSignals,
    suggestedNextStep: overall >= 7.5
      ? "Good base. Tighten the follow-up angle and practice saying it in under 60 seconds."
      : "Rewrite the first two sentences, add one example, and include one trade-off before rehearsing again.",
  };
}
