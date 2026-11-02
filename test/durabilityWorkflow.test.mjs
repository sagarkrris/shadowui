import test from 'node:test';
import assert from 'node:assert/strict';
import { NOTEBOOK_KEY, NOTEBOOK_ARCHIVE_KEY, saveNote, normalizeNotebook, archiveNotebookNote } from '../lib/learningNotebook.mjs';
import { archivePrepSession, normalizePrepSessionHistory } from '../lib/prepSessionPlan.mjs';
import { validateInterviewDraft } from '../lib/careerToolkit.mjs';
import { linkedInterview, zonedInterviewInstant, interviewCalendar } from '../lib/interviewSchedule.mjs';
import { readLearningDeviceState, applyLearningDeviceState } from '../lib/learningDeviceState.mjs';
import { cloudRecoveryBackup, previewPracticeBackup } from '../lib/practiceBackup.mjs';
import { saveUserState } from '../lib/serverPersistence.mjs';
import { buildInterviewDayPack } from '../lib/prepInsights.mjs';
import { practiceSummary, compareAttempts } from '../lib/dailyPractice.mjs';
const storage = () => { const m = new Map(); return { getItem:k=>m.get(k)??null, setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k) }; };
test('notebook capacity refuses a new note without removing existing notes, then archives safely', () => {
  const s=storage(); for(let i=0;i<100;i++) saveNote(s,{id:`note-${i}`,href:'/labs/cache',title:`Note ${i}`});
  const before=s.getItem(NOTEBOOK_KEY); assert.throws(()=>saveNote(s,{id:'new-note',href:'/labs/cache'}),/full/); assert.equal(s.getItem(NOTEBOOK_KEY),before);
  archiveNotebookNote(s,'note-0'); saveNote(s,{id:'new-note',href:'/labs/cache'});
  assert.equal(JSON.parse(s.getItem(NOTEBOOK_KEY)).length,100); assert.equal(JSON.parse(s.getItem(NOTEBOOK_ARCHIVE_KEY))[0].id,'note-0');
  assert.equal(normalizeNotebook(Array.from({length:101},(_,i)=>({id:`old-${i}`,href:'/labs/cache'}))).length,101);
});
test('historical completed interview is allowed while a past scheduled interview is rejected', () => {
  const draft={company:'Example',role:'Engineer',date:'2026-10-01',status:'completed'}; const options={today:new Date('2026-11-02')};
  assert.equal(validateInterviewDraft(draft,options).ok,true); assert.equal(validateInterviewDraft({...draft,status:'scheduled'},options).ok,false);
});
test('session archives retain dated reflection and linked attempt IDs',()=>{
  const archive=archivePrepSession({minutes:15,baselineAttemptIds:[],reflection:'Review isolation',completed:[0,1,2],finished:true},[{id:'attempt'}],new Date('2026-11-02T10:00:00Z'));
  assert.equal(archive.completedAt,'2026-11-02T10:00:00.000Z'); assert.deepEqual(normalizePrepSessionHistory([archive])[0].attemptIds,['attempt']);
});
test('linked rounds convert time zones, handle DST gaps and export a non-injectable calendar',()=>{
  assert.equal(zonedInterviewInstant('2026-11-10T10:30','Asia/Kolkata'),'2026-11-10T05:00:00.000Z');
  assert.throws(()=>zonedInterviewInstant('2026-03-08T02:30','America/New_York'),/does not exist/);
  assert.notEqual(zonedInterviewInstant('2026-11-01T01:30','America/New_York'),zonedInterviewInstant('2026-11-01T01:30','America/New_York','later'));
  const e=linkedInterview({id:'app',company:'Example\nATTENDEE:evil',role:'Engineer'},{localTime:'2026-11-10T10:30',timeZone:'Asia/Kolkata',round:'Screen'},new Date('2026-11-02'));
  assert.equal(e.applicationId,'app'); const ics=interviewCalendar(e); assert.match(ics,/DTSTART:20261110T050000Z/); assert.ok(!ics.includes('\r\nATTENDEE:'));
});
test('learning device sync uses explicit keys and rolls back when writes fail',()=>{
  const s=storage();s.setItem(NOTEBOOK_KEY,'original');s.setItem('auth-token','secret');assert.deepEqual(readLearningDeviceState(s),{[NOTEBOOK_KEY]:'original'});
  applyLearningDeviceState(s,{[NOTEBOOK_KEY]:'cloud','auth-token':'evil'});assert.equal(s.getItem('auth-token'),'secret');
  const set=s.setItem;s.setItem=(key,value)=>{if(key===NOTEBOOK_ARCHIVE_KEY)throw Error('full');set(key,value);};
  assert.throws(()=>applyLearningDeviceState(s,{[NOTEBOOK_KEY]:'changed',[NOTEBOOK_ARCHIVE_KEY]:'archive'}));assert.equal(s.getItem(NOTEBOOK_KEY),'cloud');
});
test('cloud revision SQL refuses stale writes and revision-less writes',async()=>{
  process.env.APP_ENCRYPTION_KEY='test-key'; let revision=0;
  const db={query:async(sql,args)=>{const expected=args.length===2?0:args[2]; assert.match(sql,/RETURNING revision/); assert.match(sql,args.length===2?/WHERE interviewiq_user_state.revision = 0/:/WHERE user_id = \$1 AND revision = \$3/);if(expected!==revision)return{rows:[]};return{rows:[{revision:++revision}]};}};
  const outcomes=await Promise.all([saveUserState('user',{input:'first'},0,db),saveUserState('user',{input:'second'},0,db)]);
  assert.equal(outcomes.filter(v=>v.conflict).length,1);assert.equal(revision,1);assert.equal((await saveUserState('user',{},undefined,db)).conflict,true);
});
test('sync recovery is restorable and disputed/reassessed scores do not inflate completed practice',()=>{
  const snapshot={session:{messages:[],practice:{attempts:[]}},learningState:{[NOTEBOOK_KEY]:'[]'}};
  assert.equal(previewPracticeBackup(cloudRecoveryBackup(snapshot)).entries[NOTEBOOK_KEY],'[]');
  const attempts=[{id:'a',score:2,topic:'SQL',assessmentReview:{exclude:true}},{id:'b',score:8,topic:'SQL',assessmentOnly:true}];
  assert.equal(practiceSummary(attempts).average,8);assert.equal(practiceSummary(attempts).completed,1);assert.equal(compareAttempts({score:2,rubricVersion:1},{score:8,rubricVersion:1,assessmentOnly:true}).delta,null);
});

test('archiving a second version of the same activity never replaces the first archive',()=>{
 const s=storage();saveNote(s,{id:'activity',href:'/labs/cache',evidence:'first'});archiveNotebookNote(s,'activity');saveNote(s,{id:'activity',href:'/labs/cache',evidence:'second'});archiveNotebookNote(s,'activity');const archived=JSON.parse(s.getItem(NOTEBOOK_ARCHIVE_KEY));assert.equal(archived.length,2);assert.deepEqual(new Set(archived.map(note=>note.evidence)),new Set(['first','second']));
});

test('day packs use the linked future scheduled round and carry its time and application identity',()=>{
 const pack=buildInterviewDayPack({now:new Date('2026-11-02T10:00:00Z'),interviews:[{id:'rejected',status:'rejected',date:'2026-11-03',company:'Wrong'},{id:'linked',applicationId:'app',status:'scheduled',date:'2026-11-04',startsAt:'2026-11-04T05:00:00Z',timeZone:'Asia/Kolkata',company:'Example',role:'Engineer',round:'Screen'}]});assert.equal(pack.interviewId,'linked');assert.equal(pack.applicationId,'app');assert.equal(pack.timeZone,'Asia/Kolkata');
});
