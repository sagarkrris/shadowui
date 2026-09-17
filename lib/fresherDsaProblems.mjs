import javaReferences from "./blind75JavaReferences.json" with { type: "json" };
import { listBlind75Problems } from "./blind75VisualTrack.mjs";

function generatedGuidedProblem(problem) {
  const reference = javaReferences[problem.id];
  const testRows = reference.tests.replace(/^Input\s*\| Expected\s*/, "").split(/\n\s*\n/).filter(Boolean);
  return {
    id: problem.id, title: problem.title, pattern: problem.pattern, level: problem.difficulty,
    prompt: reference.statement,
    hints: [`Name the ${problem.pattern} state before writing code.`, reference.invariant, "Test the boundary case before optimizing."],
    pseudocode: reference.invariant,
    solutionKind: "complete-solution", solution: reference.code,
    tests: testRows.length > 1 ? testRows : reference.tests.split("; "),
    constraints: reference.constraints, complexity: reference.complexity,
  };
}

export const FRESHER_DSA_PROBLEMS = listBlind75Problems().map(generatedGuidedProblem);

export function getFresherDsaProblem(id) {
  return FRESHER_DSA_PROBLEMS.find((problem) => problem.id === id) || FRESHER_DSA_PROBLEMS[0];
}

export function getFresherDsaDailyPlan(day = 1) {
  const index = Math.max(0, Number(day || 1) - 1) % FRESHER_DSA_PROBLEMS.length;
  return [FRESHER_DSA_PROBLEMS[index], FRESHER_DSA_PROBLEMS[(index + 1) % FRESHER_DSA_PROBLEMS.length]];
}

export function getSpacedReviewQueue(problems = FRESHER_DSA_PROBLEMS, reviewState = {}, now = new Date()) {
  const current = now instanceof Date ? now.getTime() : new Date(now).getTime();
  return [...problems].map((problem) => {
    const state = reviewState[problem.id] || {};
    const attempts = Number(state.attempts || 0);
    const mistakes = Number(state.mistakes || 0);
    const intervalDays = mistakes > 0 ? 1 : Math.min(14, Math.max(1, 2 ** Math.min(attempts, 3)));
    const dueAt = state.reviewedAt ? new Date(state.reviewedAt).getTime() + intervalDays * 86400000 : 0;
    return { problem, due: !dueAt || dueAt <= current, dueAt: dueAt ? new Date(dueAt).toISOString() : null, intervalDays, attempts, mistakes };
  }).sort((a, b) => Number(b.due) - Number(a.due) || a.dueAt?.localeCompare(b.dueAt || "") || 0);
}

export function scoreFresherDsaAttempt({ solved = false, hintLevel = 0, explained = false, complexity = false, edgeCases = false } = {}) {
  return Math.max(0, Math.min(100, (solved ? 45 : 0) + (explained ? 20 : 0) + (complexity ? 15 : 0) + (edgeCases ? 15 : 0) + (hintLevel === 0 ? 5 : 0)));
}
