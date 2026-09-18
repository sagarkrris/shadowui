import test from 'node:test';
import assert from 'node:assert/strict';
import { AGENTIC_UI_COURSE as course } from '../lib/agenticCourse.mjs';
import { contextBudget, validatePlan, retrieve, draft, run, fingerprint, saveApproved, estimateCost } from '../public/course/interviewiq-lab.mjs';

test('each module resolves a unique stable lesson and session even after reorder', () => {
  assert.equal(new Set(course.modules.map(module => module.lessonId)).size, course.modules.length);
  const lessons = [...course.lessons].reverse();
  for (const courseModule of course.modules) {
    const lesson = lessons.find(item => item.id === courseModule.lessonId);
    const session = course.classroomSessions.find(item => item.id === courseModule.sessionId);
    assert.equal(lesson.id, session.id);
    assert.ok(courseModule.title.includes(lesson.title));
    assert.equal(session.agenda.reduce((sum, item) => sum + item.minutes, 0), 90);
    for (const field of ['workedExample', 'solution', 'misconception', 'homework', 'failure']) assert.ok(session[field]);
    assert.ok(session.steps.length >= 3);
    assert.ok(session.dialogue.length >= 4);
  }
});
test('interviews cover all experience levels with explained follow-ups and coding practice', () => {
  for (const level of ['Beginner', 'Intermediate', 'Senior']) assert.ok(course.interviewQuestions.filter(item => item.level === level).length >= 4);
  assert.equal(new Set(course.interviewQuestions.map(item => item.id)).size, course.interviewQuestions.length);
  assert.ok(course.interviewQuestions.every(item => item.followUpAnswer && item.rubric.length >= 3));
  assert.ok(course.interviewQuestions.some(item => /Coding/.test(item.category)));
});
test('context budget fails closed on overflow and invalid values', () => {
  assert.equal(contextBudget().remaining, 1000);
  assert.throws(() => contextBudget({ historyTokens: 3200 }), /exceeded/);
  assert.throws(() => contextBudget({ historyTokens: -1 }), /Invalid/);
});
test('model boundary rejects malformed types, unknown sources, ranges and extra keys', () => {
  const valid = { topic: 'Java', sourceId: 'java-1', minutes: 30 };
  assert.deepEqual(validatePlan(valid, ['java-1']), valid);
  for (const value of [null, [], { ...valid, minutes: '30' }, { ...valid, minutes: 300 }, { ...valid, sourceId: 'private-1' }, { ...valid, execute: true }]) assert.throws(() => validatePlan(value, ['java-1']), /Invalid plan/);
});
test('retrieval scopes before ranking, leaves input untouched and abstains on absent evidence', () => {
  const corpus = [{ id: 'private', tenant: 'other', text: 'Java collections secret' }, { id: 'allowed', tenant: 'learner', text: 'Java' }];
  const original = structuredClone(corpus);
  assert.equal(retrieve('Java collections', 'learner', corpus)[0].id, 'allowed');
  assert.deepEqual(corpus, original);
  assert.deepEqual(retrieve('secret', 'learner', corpus), []);
  assert.equal(draft('thread safety').status, 'abstained');
});
test('approval rejects edited payloads and duplicate operation IDs cannot save twice', () => {
  const plan = draft('Java').plan;
  const store = new Map();
  assert.equal(saveApproved(plan, null, 'id', store).status, 'pending_approval');
  assert.equal(store.size, 0);
  assert.throws(() => saveApproved({ ...plan, minutes: 45 }, fingerprint(plan), 'id', store), /Stale/);
  assert.equal(saveApproved(plan, fingerprint(plan), 'id', store).status, 'saved');
  assert.equal(saveApproved(plan, fingerprint(plan), 'id', store).status, 'duplicate');
  const edited = { ...plan, minutes: 45 };
  assert.throws(() => saveApproved(edited, fingerprint(edited), 'id', store), /reused/);
  assert.equal(store.size, 1);
});
test('all lab stages run and documented failure cases produce their expected outcomes', () => {
  for (let stage = 1; stage <= 6; stage++) assert.ok(run(stage));
  assert.throws(() => run(2, ['--malformed']), /Invalid plan/);
  assert.throws(() => run(5, ['--approve', '--stale']), /Stale approval/);
  assert.equal(run(6, ['--unknown']).savedCount, 0);
  assert.equal(run(6).replay.savedCount, 1);
  assert.equal(run(4).checks.length, 5);
  assert.equal(estimateCost(1000, 250, 2), 0.004);
});
