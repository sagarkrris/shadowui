import { clearPrivateLocalData } from './localStoragePrivacy.mjs';
import { applyLearningDeviceState, readLearningDeviceState } from './learningDeviceState.mjs';
import { createSessionSnapshot, createSessionEnvelope, SESSION_STORAGE_KEY } from './sessionPersistence.mjs';
import { loadQuestionMemory } from './questionMemory.mjs';
import { createPrepProgressState } from './prepProgressBrain.mjs';
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
function capture(storage) {
  const entries = new Map();
  for (let i=0;i<storage.length;i++) {const key=storage.key(i); if (key && (key.startsWith('interviewiq') || key.startsWith('interviewprep.session'))) entries.set(key,storage.getItem(key));}
  return entries;
}
// Reconcile durable caches before changing React state. This prevents a later
// workspace mount from reloading another account's old, device-only cache.
export function applyCloudDeviceSnapshot(storage, snapshot, {accountChanged=false, discardUnownedData=false, transientStorage} = {}) {
  snapshot=object(snapshot);
  const discard=accountChanged || discardUnownedData;
  const full=Object.hasOwn(snapshot,'session') || discard;
  const session=createSessionSnapshot(snapshot.session || snapshot);
  const next={...snapshot,session,toolkitState:object(snapshot.toolkitState),applications:Array.isArray(snapshot.applications)?snapshot.applications:[],javaDigestProgress:{completedTopics:[],masteredTopics:[],reviewStages:{},...object(snapshot.javaDigestProgress)},questionMemory:object(snapshot.questionMemory),prepProgressState:createPrepProgressState(snapshot.prepProgressState)};
  const savedAt=new Date().toISOString();
  const writes=new Map([[SESSION_STORAGE_KEY,JSON.stringify(createSessionEnvelope(session))]]);
  if(full) {
    for(const [key,value] of [
      ['interviewiq.careerToolkit.v1',next.toolkitState],['interviewiq.applicationTracker.v1',next.applications],['interviewiq.javaDigestProgress.v1',next.javaDigestProgress],['interviewiq.prepProgressBrain.v1',next.prepProgressState],
    ]) writes.set(key,JSON.stringify({version:1,savedAt,state:value}));
    writes.set('interviewiq.questionMemory.v1',JSON.stringify({version:1,savedAt,memory:next.questionMemory}));
  }
  // Serialize and validate the incoming record before clearing any device keys.
  JSON.stringify(next);
  const sources=[storage,...(discard && transientStorage ? [transientStorage] : [])];
  const before=sources.map(source=>capture(source));
  try {
    if(discard) for(const source of sources) clearPrivateLocalData(source);
    if(full || snapshot.learningState) applyLearningDeviceState(storage,snapshot.learningState || {});
    for(const [key,value] of writes) storage.setItem(key,value);
  } catch(error) {
    for(let i=0;i<sources.length;i++) {
      try {clearPrivateLocalData(sources[i]);for(const [key,value] of before[i])sources[i].setItem(key,value);} catch { /* Recovery exports and in-memory draft remain available. */ }
    }
    throw error;
  }
  return {...next, _fullDeviceSnapshot:full, questionMemory:loadQuestionMemory(storage), learningState:readLearningDeviceState(storage)};
}
