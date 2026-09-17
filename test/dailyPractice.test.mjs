import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePractice, recordAttempt, compareAttempts, practiceSummary, evidenceBullet, capacityEstimate, scoreValue } from '../lib/dailyPractice.mjs';
import { createSessionSnapshot, exportSessionSnapshot, importSessionSnapshot, saveSessionSnapshot, loadSessionSnapshot } from '../lib/sessionPersistence.mjs';
import { exportPracticeBackup, previewPracticeBackup, restorePracticeBackup } from '../lib/practiceBackup.mjs';
import { EXECUTABLE_LESSONS, runLesson } from '../lib/executableLessons.mjs';
import { createInterviewSession, startInterviewQuestion, submitInterviewAnswer, scoreInterviewTurn, parseStructuredEvaluation } from '../lib/interviewSession.mjs';
const storage = () => { const map = new Map(); return { get length() { return map.size; }, key(i) { return [...map.keys()][i]; }, getItem(k) { return map.get(k) ?? null; }, setItem(k, v) { map.set(k, v); }, removeItem(k) { map.delete(k); } }; };
test('duplicate completion and retries create one result and preserve unassessed scores', () => {
  const initial = normalizePractice({ pending: { text: 'answer' } });
  const first = recordAttempt(initial, { id: 'a', score: null });
  const retry = recordAttempt(first, { id: 'a', score: 8 });
  assert.equal(retry.attempts.length, 1); assert.equal(retry.attempts[0].score, null); assert.equal(retry.pending, null);
  for (const value of [null, undefined, '', NaN, 11]) assert.equal(scoreValue(value), null);
  assert.equal(scoreValue(0), 0);
});
test('structured null score never becomes zero', () => {
  let session = startInterviewQuestion(createInterviewSession(), { question: 'Why?' }); session = submitInterviewAnswer(session, 'Unsure'); session = scoreInterviewTurn(session, { score: null }); assert.equal(session.turns[0].score.value, null);
});
test('draft, code, pending evaluation, paused timer and attempts survive export/restore', () => {
  const source = createSessionSnapshot({ input: 'draft', codeInput: 'return 1;', mockTimer: { status: 'paused', endsAt: null, remaining: 42 }, practice: { attempts: [{ id: 'a', score: 0 }], active: { question: 'Why?' }, pending: { text: 'answer', metadata: { retryAnswer: 'answer' } } }, messages: [{ role: 'assistant', content: 'partial', streaming: true }] });
  const restored = importSessionSnapshot(exportSessionSnapshot(source)); assert.deepEqual(restored, source); assert.equal(restored.messages[0].interrupted, true); assert.equal(restored.mockTimer.remaining, 42);
  const store = storage(); assert.equal(saveSessionSnapshot(store, source), true); assert.deepEqual(loadSessionSnapshot(store), source);
});
test('malformed and future versions are rejected before replacement', () => {
  for (const raw of ['bad json', '{"snapshot":[]}', '{"version":999,"snapshot":{"messages":[]}}', '{"exportVersion":999,"snapshot":{"messages":[]}}']) assert.equal(importSessionSnapshot(raw), null);
});
test('comparisons require matching rubric and difficulty and two assessed user attempts', () => {
  const base = { score: 3, difficulty: 'Mid', round: 'coding', rubricVersion: 1 };
  assert.deepEqual(compareAttempts(base, { ...base, score: 7 }), { status: 'Improved', delta: 4 });
  assert.equal(compareAttempts(base, { ...base, score: null }).delta, null);
  assert.equal(compareAttempts(base, { ...base, difficulty: 'Lead' }).delta, null);
  assert.equal(compareAttempts(base, base).status, 'Remains open');
  assert.match(practiceSummary([{ score: 10, topic: 'Java' }]).readiness, /Too little evidence/);
});
test('missing resume facts stay incomplete and every bullet links to evidence', () => {
  const result = evidenceBullet({ id: 'source', action: 'Designed caching' }); assert.equal(result.evidenceId, 'source'); assert.ok(result.missing.includes('measurement')); assert.match(result.bullet, /Measurement needed/);
});
test('capacity calculations expose arithmetic and reject invalid inputs', () => {
  assert.deepEqual(capacityEstimate({ users: 86400, requestsPerDay: 1, peakFactor: 3, bytesPerWrite: 100, writePercent: 50, retentionDays: 2 }), { averageQps: 1, peakQps: 3, storageBytes: 8640000 }); assert.equal(capacityEstimate({ users: -1 }), null); assert.equal(capacityEstimate({ writePercent: 101 }), null);
});
test('full backup roundtrip excludes tokens and validates before writing', () => {
  const source = storage(); saveSessionSnapshot(source, createSessionSnapshot({ input: 'keep me' })); source.setItem('interviewiq.executableDsa.v1', '{"progress":{}}'); source.setItem('interviewiq.authToken', 'secret');
  const raw = exportPracticeBackup(source); assert.ok(!raw.includes('secret')); const backup = previewPracticeBackup(raw); const dest = storage(); restorePracticeBackup(dest, backup); assert.equal(loadSessionSnapshot(dest).input, 'keep me'); assert.equal(dest.getItem('interviewiq.executableDsa.v1'), '{"progress":{}}');
  assert.throws(() => previewPracticeBackup('{"format":"interviewiq-practice","version":99,"entries":{}}'));
});
test('failed backup writes roll back already replaced keys', () => {
  const store = storage(); store.setItem('interviewiq.one', 'old'); const original = store.setItem; store.setItem = (key, value) => { if (key === 'interviewiq.two') throw new Error('Quota'); original(key, value); };
  assert.throws(() => restorePracticeBackup(store, { format: 'interviewiq-practice', version: 1, entries: { 'interviewiq.one': 'new', 'interviewiq.two': 'new' } })); assert.equal(store.getItem('interviewiq.one'), 'old');
});
for (const lesson of EXECUTABLE_LESSONS) test(`canonical ${lesson.id}: normal, boundary and adversarial outputs match executable code`, () => {
  for (const example of lesson.tests) { const result = runLesson(lesson.id, example.input, example.target); assert.deepEqual(result.output, example.output); assert.ok(result.frames.every(frame => frame.line >= 1 && frame.line <= lesson.code.length)); }
});
test('traces are generated from actual input, with sortedness/null/overflow checks', () => {
  assert.equal(runLesson('max', [100, -1]).frames[1].best, 100); assert.equal(runLesson('max', []).output, null);
  assert.throws(() => runLesson('max', null)); assert.throws(() => runLesson('max', [Number.MAX_SAFE_INTEGER + 1])); assert.throws(() => runLesson('binary-search', [2, 1], 1));
});
test('evaluation retains separate rubric evidence and exercises', () => {
  const value = parseStructuredEvaluation({ score: 7, dimensions: [{ key: 'correctness', score: 8, evidence: 'atomic', deduction: 'Missing ordering' }], exercise: 'Trace two writers' }).value; assert.equal(value.dimensions[0].evidence, 'atomic'); assert.equal(value.exercise, 'Trace two writers');
});
test('legacy overall scores migrate once without counting rubric dimensions or AI rewrites', async () => {
  const { migrateLegacyPractice } = await import('../lib/dailyPractice.mjs');
  const messages = [{ role: 'user', content: 'Use a lock' }, { role: 'assistant', content: 'Score: 6/10\nCorrectness: 7/10\nDepth: 5/10' }];
  const state = migrateLegacyPractice(messages); assert.equal(state.attempts.length, 1); assert.equal(state.attempts[0].score, 6);
  const snapshot = createSessionSnapshot({ messages }); assert.equal(snapshot.practice.attempts.length, 1); assert.equal(createSessionSnapshot(snapshot).practice.attempts.length, 1);
});
test('recent answer averages do not award points for activity or inflate a zero score', async () => {
  const { buildPrepCommandCenter } = await import('../lib/prepCoach.mjs');
  assert.equal(buildPrepCommandCenter({ profile: { name: 'Tester' }, mockScores: [0] }).readinessScore, 0);
  assert.equal(buildPrepCommandCenter({ profile: { name: 'Tester', stack: 'Java' } }).readinessScore, null);
});
