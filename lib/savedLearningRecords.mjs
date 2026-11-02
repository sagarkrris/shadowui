import { NOTEBOOK_KEY, normalizeNotebook } from './learningNotebook.mjs';
import { READER_BOOKMARK_KEY, normalizeBookmarks } from './readerEditorial.mjs';
export function savedLearningRecords(storage) {
  const read = (key, normalize) => { try { return normalize(JSON.parse(storage.getItem(key))); } catch { return []; } };
  return [
    ...read(NOTEBOOK_KEY, normalizeNotebook).map(note => ({ title: note.title, href: note.href, description: [note.failure, note.evidence, note.repair, note.interviewAnswer].filter(Boolean).join(' ') || 'Saved in this browser', type: 'Saved', category: 'My notebook' })),
    ...read(READER_BOOKMARK_KEY, normalizeBookmarks).map(item => ({ ...item, type: 'Saved', category: 'Bookmarked explanation', description: 'Saved in this browser' })),
  ];
}
