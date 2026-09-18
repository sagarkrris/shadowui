import { safeLearningHref } from './learningNotebook.mjs';
export const RESUME_KEY = 'interviewiq.learningResume.v1';
export function normalizeResume(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.filter(item => item && safeLearningHref(item.href) && typeof item.title === 'string' && item.title.trim() && !seen.has(item.href.split('#')[0]) && seen.add(item.href.split('#')[0])).slice(0, 12).map(item => ({ href: item.href, title: item.title.slice(0, 200), section: typeof item.section === 'string' ? item.section.slice(0, 160) : '' }));
}
export function saveResume(storage, item) {
  let previous;
  try { previous = JSON.parse(storage.getItem(RESUME_KEY)); } catch { previous = []; }
  const next = normalizeResume([item, ...normalizeResume(previous)]);
  storage.setItem(RESUME_KEY, JSON.stringify(next));
  return next;
}
