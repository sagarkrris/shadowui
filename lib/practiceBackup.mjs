import { importSessionSnapshot, SESSION_STORAGE_KEY } from './sessionPersistence.mjs';
// Never include auth/session credentials or arbitrary origin storage.
export function isPracticeKey(key) {
  return key === SESSION_STORAGE_KEY || (/^interviewiq[.:]/.test(key) && !/auth|token|csrf|secret|session/i.test(key));
}
export function exportPracticeBackup(storage) {
  const entries = {};
  for (let i = 0; i < storage.length; i++) { const key = storage.key(i); if (isPracticeKey(key)) entries[key] = storage.getItem(key); }
  return JSON.stringify({ format: 'interviewiq-practice', version: 1, exportedAt: new Date().toISOString(), entries }, null, 2);
}
export function previewPracticeBackup(raw) {
  if (typeof raw !== 'string' || raw.length > 10000000) throw new Error('Backup must be a JSON file under 10 MB.');
  const parsed = JSON.parse(raw);
  if (parsed?.format !== 'interviewiq-practice' || parsed.version !== 1 || !parsed.entries || typeof parsed.entries !== 'object' || Array.isArray(parsed.entries)) throw new Error('Incompatible backup. No data was changed.');
  const entries = Object.entries(parsed.entries);
  if (!entries.length || entries.some(([key, value]) => !isPracticeKey(key) || typeof value !== 'string')) throw new Error('Backup contains unsupported data. No data was changed.');
  if (Object.hasOwn(parsed.entries, SESSION_STORAGE_KEY) && !importSessionSnapshot(parsed.entries[SESSION_STORAGE_KEY])) throw new Error('Session is malformed or incompatible. No data was changed.');
  return parsed;
}
export function restorePracticeBackup(storage, backup) {
  const validated = previewPracticeBackup(JSON.stringify(backup));
  const previous = Object.keys(validated.entries).map(key => [key, storage.getItem(key)]);
  try { for (const [key, value] of Object.entries(validated.entries)) storage.setItem(key, value); }
  catch (error) { for (const [key, value] of previous) { try { if (value === null) storage.removeItem(key); else storage.setItem(key, value); } catch { /* Original values remain in the caller's exported backup. */ } } throw new Error(`Restore failed: ${error.message}. Keep your backup and free device storage before retrying.`); }
}

export function summarizePracticeBackup(backup) {
  const validated = previewPracticeBackup(JSON.stringify(backup));
  const summaries = [];
  for (const [key, raw] of Object.entries(validated.entries)) {
    let value;
    try { value = JSON.parse(raw); } catch { /* Older keys can hold plain text. */ }
    if (key === SESSION_STORAGE_KEY) {
      const session = importSessionSnapshot(raw);
      summaries.push({ label: 'Practice session and profile', detail: `${session.practice.attempts.length} practice attempts · ${session.practice.designs.length} saved designs · ${session.messages.length} messages` });
    } else if (key === 'interviewiq.learningNotebookArchive.v1') summaries.push({ label: 'Archived notebook', detail: `${Array.isArray(value) ? value.length : 0} archived notes` });
    else if (key === 'interviewiq.learningNotebook.v1') summaries.push({ label: 'Learning notebook', detail: `${Array.isArray(value) ? value.length : 0} notes` });
    else if (key === 'interviewiq.readerBookmarks.v1') summaries.push({ label: 'Bookmarked explanations', detail: `${Array.isArray(value) ? value.length : 0} bookmarks` });
    else if (key === 'interviewiq.learningHub.v1') summaries.push({ label: 'Learning progress', detail: `${Array.isArray(value?.completed) ? value.completed.length : 0} completed activities` });
    else if (key === 'interviewiq.learningResume.v1') summaries.push({ label: 'Reading positions', detail: `${Array.isArray(value) ? value.length : 0} saved positions` });
    else if (key === 'interviewiq.activeLearningPath.v1') summaries.push({ label: 'Selected learning path', detail: 'Saved path selection' });
    else if (key === 'interviewiq.javaBackendJourney.v1') summaries.push({ label: 'Backend roadmap', detail: 'Saved roadmap progress' });
    else summaries.push({ label: 'Additional workspace data', detail: 'Saved preferences or progress' });
  }
  return summaries;
}

export function cloudRecoveryBackup(snapshot) {
  const entries = {};
  const session = snapshot?.session || (Array.isArray(snapshot?.messages) ? snapshot : null);
  if (session) entries[SESSION_STORAGE_KEY] = JSON.stringify({ version: 2, savedAt: new Date().toISOString(), snapshot: session });
  for (const [key, value] of Object.entries(snapshot?.learningState || {})) if (isPracticeKey(key) && typeof value === 'string') entries[key] = value;
  for (const [field, key] of Object.entries({ toolkitState: 'interviewiq.careerToolkit.v1', applications: 'interviewiq.applicationTracker.v1', javaDigestProgress: 'interviewiq.javaDigestProgress.v1', prepProgressState: 'interviewiq.prepProgressBrain.v1' })) {
    if (snapshot?.[field]) entries[key] = JSON.stringify({ version: 1, savedAt: new Date().toISOString(), state: snapshot[field] });
  }
  if (snapshot?.questionMemory) entries['interviewiq.questionMemory.v1'] = JSON.stringify({ version: 1, memory: snapshot.questionMemory });
  return JSON.stringify({ format: 'interviewiq-practice', version: 1, exportedAt: new Date().toISOString(), entries }, null, 2);
}
