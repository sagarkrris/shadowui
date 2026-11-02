import test from 'node:test';
import assert from 'node:assert/strict';
import { continueLearningItems } from '../lib/continueLearning.mjs';
import { saveSessionSnapshot, loadSessionSnapshot } from '../lib/sessionPersistence.mjs';
import { buildMasteryMap, recordQuestionAttempt, prioritizePracticeCards } from '../lib/questionMemory.mjs';
import { createTechBuddySession } from '../lib/techBuddy.mjs';
import { recommendLearningPath, LEARNING_PATHS, learningPathProgress } from '../lib/learningHub.mjs';
import { normalizePractice } from '../lib/dailyPractice.mjs';
import { canFinishPrepSession, normalizePrepSessionPlan } from '../lib/prepSessionPlan.mjs';
import { canRetestRepair } from '../lib/gapRepair.mjs';
import { createApplication, applicationDebriefReview, applicationFollowUpInput, buildApplicationTracker } from '../lib/applicationTracker.mjs';
const store = () => { const values = new Map(); return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) }; };
test('unfinished Buddy interview, Ask draft, and pending requests get resumable shortcuts', () => {
  for (const changes of [{ phase: 'question', current: { id: 'q', question: 'Explain isolation' }, draft: 'My draft' }, { interaction: 'ask', askDraft: 'My question' }, { phase: 'error', pending: { id: 'p', kind: 'question' } }]) {
    const storage = store();
    saveSessionSnapshot(storage, { messages: [], practice: { buddy: { ...createTechBuddySession({ id: 'buddy', topic: 'SQL' }), ...changes } } });
    assert.equal(continueLearningItems(storage)[0].href, '/practice?resumeBuddy=1');
    assert.equal(loadSessionSnapshot(storage).practice.buddy.id, 'buddy');
  }
  const storage = store(); saveSessionSnapshot(storage, { messages: [], practice: { buddy: { ...createTechBuddySession({ id: 'done' }), phase: 'complete' } } });
  assert.equal(continueLearningItems(storage).length, 0);
});
test('selected roadmap wins over other unfinished and weak paths; completion explains fallback', () => {
  const paths = LEARNING_PATHS.map(path => ({ ...path, result: learningPathProgress(path, {}) }));
  assert.equal(recommendLearningPath(paths, 'system-design').path.id, 'system-design');
  paths[0].result.weak = [{}];
  assert.equal(recommendLearningPath(paths, 'ai-engineering').path.id, 'ai-engineering');
  paths[2].result.next = null;
  assert.match(recommendLearningPath(paths, 'system-design').reason, /complete/);
});
test('mastered questions stay mastered while becoming due, and due cards precede new cards', () => {
  const memory = { questions: { mastered: { attempts: [{ score: 9, attemptedAt: '2026-08-01' }, { score: 9, attemptedAt: '2026-08-02' }] } } };
  const map = buildMasteryMap(memory, [], { now: new Date('2026-11-02') });
  assert.equal(map.entries[0].status, 'Mastered'); assert.equal(map.entries[0].dueForReview, true);
  assert.equal(prioritizePracticeCards([{ id: 'new' }, { id: 'mastered' }], map)[0].id, 'mastered');
  assert.equal(buildMasteryMap(memory, [], { now: '2026-08-03' }).entries[0].dueForReview, false);
});
test('repeated completion of the same retest cannot inflate question history', () => {
  const storage = store();
  const attempt = { questionId: 'original', question: 'Explain isolation', attemptId: 'attempt-1', score: 8 };
  recordQuestionAttempt(storage, attempt);
  assert.equal(recordQuestionAttempt(storage, attempt).questions.original.attemptCount, 1);
  assert.equal(recordQuestionAttempt(storage, { ...attempt, attemptId: 'attempt-2' }).questions.original.attemptCount, 2);
});
test('time plans have finite completion requirements and survive practice serialization', () => {
  assert.equal(canFinishPrepSession({ minutes: 5, completed: [0, 1] }), true);
  assert.equal(canFinishPrepSession({ minutes: 15, completed: [0, 1] }), false);
  assert.equal(canFinishPrepSession({ minutes: 30, completed: [0, 1, 2] }), false);
  const plan = { minutes: 30, completed: [0, 1, 2], reflection: 'Review isolation', finished: true };
  assert.equal(canFinishPrepSession(plan), true);
  const storage = store(); saveSessionSnapshot(storage, { messages: [], practice: { plan } });
  assert.deepEqual(loadSessionSnapshot(storage).practice.plan, plan);
  assert.equal(normalizePrepSessionPlan({ minutes: 999 }).minutes, 15);
});
test('repair requires explicit study and exercise evidence; invalid links cannot survive storage', () => {
  const repair = { attemptId: 'baseline', href: '/sql/isolation', title: 'Isolation', studied: true, exercise: 'Boundary checked', confirmed: true };
  assert.equal(canRetestRepair(repair), true); assert.equal(canRetestRepair({ ...repair, confirmed: false }), false);
  assert.equal(normalizePractice({ repairs: [{ ...repair, href: 'javascript:alert(1)' }] }).repairs[0].href, '');
  const storage = store(); saveSessionSnapshot(storage, { messages: [], practice: { repairs: [repair] } });
  assert.deepEqual(loadSessionSnapshot(storage).practice.repairs[0], repair);
});
test('application updates retain debrief, identity and typed spaces; terminal stages remove due follow-ups', () => {
  const application = createApplication({ id: 'application-1', company: 'Example', role: 'Engineer', stage: 'screen', followUpAt: '2026-10-01T10:00', debrief: { questions: 'Explain SQL ', difficultAreas: 'Transaction isolation', evidence: 'My migration story', nextAction: 'Retest' } });
  const updated = createApplication({ ...application, stage: 'offer' });
  assert.equal(updated.offer.salary, null);
  assert.equal(updated.debrief.questions, 'Explain SQL '); assert.equal(updated.id, application.id);
  assert.equal(buildApplicationTracker([updated], { now: new Date('2026-11-02') }).followUpsDue.length, 0);
  assert.equal(applicationDebriefReview(updated).questionId, 'application-review-application-1');
  assert.match(applicationDebriefReview(updated).question, /Transaction isolation/);
  assert.equal(applicationDebriefReview({ ...application, debrief: { difficultAreas: ' ' } }), null);
});

test('editing a debrief gap can create a new review without overwriting old question history', () => {
  const original = applicationDebriefReview({ id: 'app', company: 'Example', debrief: { reviewId: 'revision-1', difficultAreas: 'Isolation' } });
  const updated = applicationDebriefReview({ id: 'app', company: 'Example', debrief: { reviewId: 'revision-2', difficultAreas: 'Caching' } });
  assert.notEqual(original.questionId, updated.questionId);
});

test('historical ISO follow-ups remain editable as local date/time values', () => {
  assert.equal(applicationFollowUpInput('2026-11-10T10:30'), '2026-11-10T10:30');
  assert.match(applicationFollowUpInput('2026-11-10T10:30:00Z'), /^2026-11-10T\d{2}:\d{2}$/);
  assert.equal(applicationFollowUpInput('invalid'), '');
});
