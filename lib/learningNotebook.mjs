export const NOTEBOOK_KEY = 'interviewiq.learningNotebook.v1';
export function safeLearningHref(value) {
  return typeof value === 'string' && /^\/[a-z0-9][a-z0-9/\-]*(?:#[a-z0-9-]+)?$/i.test(value) ? value : null;
}
export function normalizeNotebook(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.filter(item => item && typeof item.id === 'string' && /^[a-z0-9-]{1,100}$/.test(item.id) && safeLearningHref(item.href) && !seen.has(item.id) && seen.add(item.id)).slice(0, 100).map(item => ({
    id: item.id, href: item.href, title: String(item.title || 'Learning note').slice(0, 200),
    failure: String(item.failure || '').slice(0, 3000), evidence: String(item.evidence || '').slice(0, 3000),
    repair: String(item.repair || '').slice(0, 3000), misconception: String(item.misconception || '').slice(0, 3000),
    interviewAnswer: typeof item.interviewAnswer === 'string' ? item.interviewAnswer.slice(0, 4000) : '',
    interviewChecks: Array.isArray(item.interviewChecks) ? [...new Set(item.interviewChecks.filter(index => Number.isInteger(index) && index >= 0 && index < 4))] : [],
    completed: item.completed === true, steps: Array.isArray(item.steps) ? [...new Set(item.steps.filter(x => Number.isInteger(x) && x >= 0 && x < 5))] : [],
  }));
}
export function saveNote(storage, note) {
  let previous;
  try { previous = JSON.parse(storage.getItem(NOTEBOOK_KEY) || '[]'); } catch { previous = []; }
  const valid = normalizeNotebook([note])[0];
  if (!valid) throw new Error('Invalid learning note');
  const next = [valid, ...normalizeNotebook(previous).filter(item => item.id !== valid.id)].slice(0, 100);
  storage.setItem(NOTEBOOK_KEY, JSON.stringify(next));
  return next;
}
export function notebookMarkdown(notes) {
  return '# My engineering notebook\n\n' + normalizeNotebook(notes).map(note => `## ${note.title}\n${note.href}\nStatus: ${note.completed ? 'Completed activity' : 'In progress'}\n\nWhat failed: ${note.failure}\n\nEvidence: ${note.evidence}\n\nChange and risk: ${note.repair}\n\nChanged my mind: ${note.misconception}\n\nInterview answer: ${note.interviewAnswer}\nSelf-assessed criteria: ${note.interviewChecks.length}/4\n`).join('\n');
}
