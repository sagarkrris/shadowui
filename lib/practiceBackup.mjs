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
  if (parsed.entries[SESSION_STORAGE_KEY] && !importSessionSnapshot(parsed.entries[SESSION_STORAGE_KEY])) throw new Error('Session is malformed or incompatible. No data was changed.');
  return parsed;
}
export function restorePracticeBackup(storage, backup) {
  const validated = previewPracticeBackup(JSON.stringify(backup));
  const previous = Object.keys(validated.entries).map(key => [key, storage.getItem(key)]);
  try { for (const [key, value] of Object.entries(validated.entries)) storage.setItem(key, value); }
  catch (error) { for (const [key, value] of previous) { try { if (value === null) storage.removeItem(key); else storage.setItem(key, value); } catch { /* Original values remain in the caller's exported backup. */ } } throw new Error(`Restore failed: ${error.message}. Keep your backup and free device storage before retrying.`); }
}
