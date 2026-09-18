import test from 'node:test';
import assert from 'node:assert/strict';
import { TINY_SYSTEMS, systemExercise, normalizeSystemDrafts } from '../lib/tinySystems.mjs';
import { normalizeNotebook, notebookMarkdown } from '../lib/learningNotebook.mjs';
import { DETECTIVE_CASES } from '../lib/productionDetective.mjs';
import { interviewPrompt } from '../lib/interviewTransfer.mjs';
test('draft normalization invalidates stale test claims and bounds code', () => {
  const drafts = normalizeSystemDrafts({ 0: { code: 'new', testedSource: 'old' }, 1: { code: 'same', testedSource: 'same' }, 2: { code: 'x'.repeat(40000) } });
  assert.equal(drafts[0].testedSource, null); assert.equal(drafts[1].testedSource, 'same'); assert.equal(drafts[2].code.length, 30000);
  assert.deepEqual(normalizeSystemDrafts(null), {});
});
test('project routes are unique and chapters require meaningful tests and limitations', () => {
  assert.equal(new Set(TINY_SYSTEMS.map(item => item.slug)).size, 4);
  for (const project of TINY_SYSTEMS) { assert.equal(project.chapters.length, 3); assert.ok(project.scope); assert.throws(() => systemExercise(project, 99)); for (const chapter of project.chapters) assert.ok(chapter.requirement && chapter.test && chapter.limitation); }
});
test('interview answers survive notebook export without expanding valid self-assessment indices', () => {
  const notes = normalizeNotebook([{ id: 'interview-example', href: '/detective/example#interview-answer', interviewAnswer: 'Evidence first', interviewChecks: [0, 0, 1, 4, -1] }]);
  assert.deepEqual(notes[0].interviewChecks, [0, 1]); assert.match(notebookMarkdown(notes), /Interview answer: Evidence first/);
  for (const incident of DETECTIVE_CASES) assert.notEqual(interviewPrompt(incident.slug), interviewPrompt('missing'));
});
