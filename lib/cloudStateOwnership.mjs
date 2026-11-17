import { normalizePractice } from './dailyPractice.mjs';
const EMPTY_PRACTICE = JSON.stringify(normalizePractice());
export const CLOUD_OWNER_KEY = 'interviewiq.cloudStateOwner.v1';

export function hasPrivateCloudWork(local) {
  const session = local?.session || {};
  const practice = session.practice || {};
  const hasValues = value => {
    if (Array.isArray(value)) return value.some(hasValues);
    if (value && typeof value === 'object') return Object.entries(value).some(([key,item]) => !['version','savedAt'].includes(key) && !(key === 'beginnerStep' && item === 'watch') && hasValues(item));
    return typeof value === 'string' ? Boolean(value.trim()) : Boolean(value);
  };
  return Boolean(session.input || session.codeInput || session.messages?.length || practice.attempts?.length || local?.applications?.length || Object.keys(local?.learningState || {}).length)
    || JSON.stringify(normalizePractice(practice)) !== EMPTY_PRACTICE
    || [session.systemDesignCanvas, session.interviewSession?.turns, session.interviewSession?.profile, session.interviewSession?.summary, local?.toolkitState, local?.javaDigestProgress, local?.questionMemory, local?.prepProgressState, practice.evidence, practice.designs, practice.buddy].some(hasValues);
}

export function cloudHydrationNeedsChoice({ local, remote, previousOwner, userId, restoredLocally = false }) {
  const hasWork = hasPrivateCloudWork(local);
  const hasProfile = [local?.session?.candidateProfile, local?.session?.profileDraft].some(profile => Object.values(profile || {}).some(value => typeof value === 'string' ? Boolean(value.trim()) : Boolean(value)));
  // Legacy browser data has no reliable account provenance. Treat an absent
  // owner exactly like a different owner until the user explicitly imports it.
  if (previousOwner !== userId && (hasWork || hasProfile)) return true;
  if (!hasWork) return false;
  // Restoring a device copy is not permission to import another account's work.
  return !restoredLocally && Boolean(remote) && JSON.stringify(remote) !== JSON.stringify(local);
}
