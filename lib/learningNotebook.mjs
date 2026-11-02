export const NOTEBOOK_ARCHIVE_KEY = 'interviewiq.learningNotebookArchive.v1';
export const NOTEBOOK_CAPACITY = 100;
export const NOTEBOOK_KEY = 'interviewiq.learningNotebook.v1';
export function safeLearningHref(value) {
  return typeof value === 'string' && /^\/[a-z0-9][a-z0-9/\-]*(?:#[a-z0-9-]+)?$/i.test(value) ? value : null;
}
export function normalizeNotebook(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.filter(item => item && typeof item.id === 'string' && /^[a-z0-9-]{1,100}$/.test(item.id) && safeLearningHref(item.href) && !seen.has(item.id) && seen.add(item.id)).map(item => ({
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
  const current = normalizeNotebook(previous);
  if (!current.some(item => item.id === valid.id) && current.length >= NOTEBOOK_CAPACITY) { const error = new Error('Notebook is full. Open My notebook to archive or export notes before adding another. Existing notes have been kept.'); error.code = 'NOTEBOOK_FULL'; throw error; }
  const next = [valid, ...current.filter(item => item.id !== valid.id)];
  storage.setItem(NOTEBOOK_KEY, JSON.stringify(next));
  return next;
}
export function notebookMarkdown(notes) {
  return '# My engineering notebook\n\n' + normalizeNotebook(notes).map(note => `## ${note.title}\n${note.href}\nStatus: ${note.completed ? 'Completed activity' : 'In progress'}\n\nWhat failed: ${note.failure}\n\nEvidence: ${note.evidence}\n\nChange and risk: ${note.repair}\n\nChanged my mind: ${note.misconception}\n\nInterview answer: ${note.interviewAnswer}\nSelf-assessed criteria: ${note.interviewChecks.length}/4\n`).join('\n');
}

export function removeNotebookNote(storage, id) {
  const current = normalizeNotebook(JSON.parse(storage.getItem(NOTEBOOK_KEY) || '[]'));
  const removed = current.find(note => note.id === id);
  const next = current.filter(note => note.id !== id);
  storage.setItem(NOTEBOOK_KEY, JSON.stringify(next));
  return { notes: next, removed };
}
export function undoNotebookRemoval(storage, removed) {
  const current = normalizeNotebook(JSON.parse(storage.getItem(NOTEBOOK_KEY) || '[]'));
  if (current.some(note => note.id === removed.id)) throw new Error('This note was saved again. Your newer version has been kept.');
  if (current.length >= 100) throw new Error('Your notebook is full. Export it before restoring this note.');
  return saveNote(storage, removed);
}

export function archiveNotebookNote(storage, id) {
  const notes = normalizeNotebook(JSON.parse(storage.getItem(NOTEBOOK_KEY) || '[]'));
  const note = notes.find(item => item.id === id);
  if (!note) throw new Error('Note is unavailable.');
  const previousArchive = storage.getItem(NOTEBOOK_ARCHIVE_KEY);
  const archive = normalizeNotebook(JSON.parse(previousArchive || '[]'));
  const archivedNote = archive.some(item => item.id === id) ? { ...note, id: `${id.slice(0, 55)}-archive-${crypto.randomUUID()}` } : note;
  storage.setItem(NOTEBOOK_ARCHIVE_KEY, JSON.stringify([archivedNote, ...archive]));
  try { storage.setItem(NOTEBOOK_KEY, JSON.stringify(notes.filter(item => item.id !== id))); }
  catch (error) { if (previousArchive === null) storage.removeItem(NOTEBOOK_ARCHIVE_KEY); else storage.setItem(NOTEBOOK_ARCHIVE_KEY, previousArchive); throw error; }
  return notes.filter(item => item.id !== id);
}

export function notebookSaveMessage(error, fallback) { return error?.code === 'NOTEBOOK_FULL' ? error.message : fallback; }
