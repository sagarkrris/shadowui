export const LEARNING_DEVICE_KEYS = ['interviewiq.learningNotebook.v1', 'interviewiq.learningNotebookArchive.v1', 'interviewiq.readerBookmarks.v1', 'interviewiq.learningHub.v1', 'interviewiq.learningResume.v1', 'interviewiq.activeLearningPath.v1', 'interviewiq.javaBackendJourney.v1'];
export function readLearningDeviceState(storage) {
  const entries = {};
  for (const key of LEARNING_DEVICE_KEYS) { const value = storage.getItem(key); if (value !== null) entries[key] = value; }
  return entries;
}
export function applyLearningDeviceState(storage, entries) {
  if (!entries || typeof entries !== 'object') return;
  const keys = LEARNING_DEVICE_KEYS;
  if (keys.some(key => Object.hasOwn(entries, key) && (typeof entries[key] !== 'string' || entries[key].length > 2_000_000))) throw new Error('Learning data is invalid or too large. Your device copy is preserved.');
  const previous = keys.map(key => [key, storage.getItem(key)]);
  try { for (const key of keys) { if (Object.hasOwn(entries, key)) storage.setItem(key, entries[key]); else storage.removeItem(key); } }
  catch (error) { for (const [key, value] of previous) { try { if (value === null) storage.removeItem(key); else storage.setItem(key, value); } catch { /* Keep recovery exports available. */ } } throw error; }
}
