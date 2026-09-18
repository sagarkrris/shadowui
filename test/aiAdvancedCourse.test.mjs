import assert from 'node:assert/strict';
import test from 'node:test';
import { ADVANCED_WORKSHOPS, INTERVIEW_SCENARIOS, remainingInterviewSeconds, interviewSelfAssessment } from '../lib/aiAdvancedCourse.mjs';

test('every advanced scenario has a unique identity and valid remediation workshop', () => {
  assert.equal(ADVANCED_WORKSHOPS.length, 6);
  assert.equal(INTERVIEW_SCENARIOS.length, 6);
  assert.equal(new Set(ADVANCED_WORKSHOPS.map(item => item.id)).size, 6);
  assert.equal(new Set(INTERVIEW_SCENARIOS.map(item => item.id)).size, 6);
  for (const scenario of INTERVIEW_SCENARIOS) {
    assert.ok(ADVANCED_WORKSHOPS.some(item => item.id === scenario.workshopId));
    assert.ok([5, 10].includes(scenario.minutes));
    for (const field of ['prompt', 'conciseAnswer', 'followUp', 'followUpAnswer']) assert.ok(scenario[field]);
    assert.equal(scenario.rubric.length, 4);
    assert.equal(new Set(scenario.rubric).size, 4);
    assert.ok(scenario.clarifications.length && scenario.reasoning.length && scenario.pitfalls.length);
  }
  for (const workshop of ADVANCED_WORKSHOPS) {
    assert.equal(workshop.concepts.length, 3);
    for (const field of ['prerequisite', 'objective', 'workedExample', 'exercise', 'starter', 'solution', 'homework', 'misconception']) assert.ok(workshop[field]);
    assert.equal(workshop.acceptance.length, 3);
  }
});

test('deadline-based timer handles delayed ticks, exact expiry, and background throttling', () => {
  assert.equal(remainingInterviewSeconds(61000, 1000), 60);
  assert.equal(remainingInterviewSeconds(61000, 1501), 60);
  assert.equal(remainingInterviewSeconds(61000, 42500), 19);
  assert.equal(remainingInterviewSeconds(61000, 61000), 0);
  assert.equal(remainingInterviewSeconds(61000, 900000), 0);
});

test('self-assessment reflects only rubric criteria actually selected and exposes omissions', () => {
  const rubric = ['State assumptions', 'Explain recovery', 'Measure outcomes'];
  assert.deepEqual(interviewSelfAssessment(rubric, []), { covered: 0, total: 3, revisit: rubric });
  assert.deepEqual(interviewSelfAssessment(rubric, [1, 1, 99]), { covered: 1, total: 3, revisit: ['State assumptions', 'Measure outcomes'] });
  assert.deepEqual(interviewSelfAssessment(rubric, [0, 1, 2]), { covered: 3, total: 3, revisit: [] });
});
