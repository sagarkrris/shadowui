import { safeLearningHref } from './learningNotebook.mjs';
export function normalizeGapRepairs(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(item => item && typeof item.attemptId === 'string').slice(-100).map(item => ({ attemptId: item.attemptId, href: safeLearningHref(item.href) || '', title: typeof item.title === 'string' ? item.title.slice(0, 200) : '', studied: item.studied === true, exercise: typeof item.exercise === 'string' ? item.exercise.slice(0, 4000) : '', confirmed: item.confirmed === true }));
}
export function canRetestRepair(repair) {
  return Boolean(safeLearningHref(repair?.href) && repair.studied && repair.exercise?.trim() && repair.confirmed);
}
