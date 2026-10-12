import test from 'node:test';
import assert from 'node:assert/strict';
import { JAVA_BACKEND_STAGES, normalizeRoadmapProgress, nextRoadmapActivity, roadmapActivityId } from '../lib/javaBackendRoadmap.mjs';

test('invalid, duplicate, and obsolete activity progress cannot advance the journey', () => {
  for (const value of [null, {}, 'foundations:Learn', [null, 42, 'old:Learn']]) {
    assert.deepEqual(normalizeRoadmapProgress(value), []);
    assert.equal(nextRoadmapActivity(value).stage.id, 'foundations');
  }
  assert.deepEqual(normalizeRoadmapProgress(['foundations:Learn', 'foundations:Learn', 'removed:Build']), ['foundations:Learn']);
});
test('recommendation fills the earliest gap even when later stages were completed', () => {
  const later = JAVA_BACKEND_STAGES.slice(1).flatMap(s => s.activities.map(a => roadmapActivityId(s.id, a.label)));
  const next = nextRoadmapActivity(['foundations:Learn', 'foundations:Build', ...later]);
  assert.equal(next.stage.id, 'foundations');
  assert.equal(next.activity.label, 'Experiment');
});
test('completing every activity finishes the path; reopening one restores its recommendation', () => {
  const all = JAVA_BACKEND_STAGES.flatMap(s => s.activities.map(a => roadmapActivityId(s.id, a.label)));
  assert.equal(nextRoadmapActivity(all), null);
  const reopened = nextRoadmapActivity(all.filter(id => id !== 'data:Review'));
  assert.equal(reopened.stage.id, 'data');
  assert.equal(reopened.activity.href, '/java/roadmap#review-data');
});
test('interview handoffs carry each stage question into the existing warm-up flow', () => {
  for (const stage of JAVA_BACKEND_STAGES) {
    const interview = stage.activities.find(a => a.label === 'Interview');
    const url = new URL(interview.href, 'https://example.test');
    assert.equal(url.pathname, '/practice');
    assert.equal(url.searchParams.get('buddy'), '1');
    assert.equal(url.searchParams.get('buddyMode'), 'warmup');
    assert.equal(url.searchParams.get('buddyTopic'), interview.title);
  }
});
