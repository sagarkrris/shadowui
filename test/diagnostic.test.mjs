import assert from 'node:assert/strict';
import test from 'node:test';
import { DIAGNOSTIC_DOMAINS, DIAGNOSTIC_QUESTIONS, DIAGNOSTIC_RETESTS, diagnosticEvidence, diagnosticPlan, diagnosticExport, normalizeDiagnostic, newDiagnostic } from '../lib/diagnostic.mjs';
import { diagnosticContent } from '../lib/diagnosticContent.mjs';
import { learningCatalogue } from '../lib/learningCatalog.mjs';
import { normalizeNotebook } from '../lib/learningNotebook.mjs';
import { PRACTICE_RUBRIC } from '../lib/dailyPractice.mjs';

const answered = correct => ({ version: 1, completed: true, minutes: 30, answers: Object.fromEntries(DIAGNOSTIC_QUESTIONS.map(question => [question.id, { choice: correct ? question.correct : (question.correct + 1) % question.choices.length, note: '' }])) });

test('optional baseline samples every domain with a distinct comparable retest', () => {
  assert.equal(DIAGNOSTIC_DOMAINS.length, 5);
  assert.equal(DIAGNOSTIC_QUESTIONS.length, 5);
  assert.equal(DIAGNOSTIC_RETESTS.length, 5);
  assert.equal(new Set([...DIAGNOSTIC_QUESTIONS, ...DIAGNOSTIC_RETESTS].map(item => item.id)).size, 10);
  for (const domain of DIAGNOSTIC_DOMAINS) {
    const baseline = DIAGNOSTIC_QUESTIONS.find(item => item.domain === domain.id);
    const retest = DIAGNOSTIC_RETESTS.find(item => item.domain === domain.id);
    assert.notEqual(baseline.prompt, retest.prompt);
    for (const item of [baseline, retest]) {
      assert.equal(new Set(item.choices).size, 4);
      assert.ok(Number.isInteger(item.correct) && item.correct >= 0 && item.correct < 4);
      assert.ok(item.rationale.length > 100);
    }
  }
});

test('unknown and malformed choices remain unobserved rather than being silently scored', () => {
  for (const choice of [undefined, null, '1', true, -1, 4, 1.5, Infinity]) {
    const value = { version: 1, answers: { 'java-jvm-baseline': { choice, note: 'x'.repeat(2000) }, unknown: { choice: 1 } }, minutes: 999 };
    const normalized = normalizeDiagnostic(value);
    assert.equal(normalized.answers['java-jvm-baseline'].choice, null);
    assert.equal(normalized.answers['java-jvm-baseline'].note.length, 1200);
    assert.equal(normalized.minutes, 30);
    assert.equal(Object.hasOwn(normalized.answers, 'unknown'), false);
    assert.equal(diagnosticEvidence(normalized)[0].status, 'Not observed');
  }
  for (const value of [null, [], {}, { version: 2 }, 'text']) assert.equal(normalizeDiagnostic(value), null);
  assert.equal(diagnosticEvidence(newDiagnostic()).filter(item => item.status === 'Not observed').length, 5);
});

test('correctness uses each selected option and does not score written text', () => {
  assert.ok(diagnosticEvidence(answered(true)).every(item => item.status === 'Baseline correct'));
  assert.ok(diagnosticEvidence(answered(false)).every(item => item.status === 'Review suggested'));
  const state = answered(false);
  state.answers['concurrency-baseline'].note = 'atomic volatile perfect correct explanation';
  assert.equal(diagnosticEvidence(state).find(item => item.id === 'concurrency').status, 'Review suggested');
});

test('plan prioritizes observed gaps and updates priorities from a different retest', () => {
  const state = answered(true);
  state.answers['spring-baseline'].choice = 1;
  assert.equal(diagnosticPlan(state).milestones[0].domain, 'spring');
  const retest = DIAGNOSTIC_RETESTS.find(item => item.domain === 'spring');
  state.answers[retest.id] = { choice: retest.correct };
  assert.equal(diagnosticEvidence(state).find(item => item.id === 'spring').retestStatus, 'Retest correct');
  assert.equal(diagnosticPlan(state).milestones.at(-1).domain, 'spring');
  const dsa = DIAGNOSTIC_RETESTS.find(item => item.domain === 'dsa');
  state.answers[dsa.id] = { choice: (dsa.correct + 1) % 4 };
  assert.equal(diagnosticPlan(state).milestones[0].domain, 'dsa');
});

test('budget milestones conserve planned minutes and export round-trips the supported schema', () => {
  for (const minutes of [15, 30, 60]) {
    const state = { ...answered(false), minutes };
    const plan = diagnosticPlan(state);
    assert.equal(plan.totalMinutes, 225);
    assert.equal(plan.sessions, Math.ceil(225 / minutes));
    assert.equal(plan.milestones.reduce((total, item) => total + item.minutes, 0), 225);
    assert.ok(plan.milestones.every(item => item.endSession >= item.startSession && item.endSession <= plan.sessions));
    const exported = JSON.parse(diagnosticExport(state));
    assert.deepEqual(normalizeDiagnostic(exported), normalizeDiagnostic(state));
    assert.match(exported.scope, /not a hiring prediction/);
  }
  assert.throws(() => diagnosticExport({ version: 99 }), /Unsupported/);
});

test('journeys reuse registered courses, real paths and the existing practice rubric', async () => {
  const { domains, rubric } = await diagnosticContent();
  assert.deepEqual(rubric, PRACTICE_RUBRIC);
  const catalogue = learningCatalogue();
  for (const domain of domains) {
    if (domain.course) assert.ok(catalogue.some(course => course.href === domain.lesson.href), domain.id);
    assert.match(domain.exerciseHref, /^\/(labs|build|tech-blogs)\//);
    assert.match(domain.path.href, /^\/java\/roadmap$|^\/learn\/roadmaps\/system-design$/);
    const feedback = domain.feedback;
    for (const field of ['answer', 'mechanism', 'example', 'tradeOff', 'verification']) assert.ok(feedback[field]?.length > 30, `${domain.id} ${field}`);
    assert.ok(feedback.followUp.question && feedback.followUp.answer);
    assert.ok(feedback.sources.every(([title, href]) => title && href.startsWith('https://')));
  }
  assert.equal(normalizeNotebook([{ id: 'diagnostic-learning-journey', href: '/diagnostic#journey', title: 'My diagnostic learning journey', completed: false }]).length, 1);
});
