import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { SYMPTOMS, searchSymptoms } from '../lib/engineeringSymptoms.mjs';
test('symptom search finds natural observations and common aliases', () => {
  for (const [query, slug] of [
    ['CPU is low, but requests are slow.', 'low-cpu-slow-requests'],
    ['The query became slower after adding an index', 'query-slower-after-index'],
    ['Messages are processed twice', 'messages-processed-twice'],
    ['duplicate messages', 'messages-processed-twice'],
    ['IDEMPOTENCY', 'messages-processed-twice'],
  ]) assert.equal(searchSymptoms(query)[0]?.slug, slug);
  assert.equal(searchSymptoms('not-a-known-symptom').length, 0);
  assert.equal(searchSymptoms('', 'Databases').length, 1);
  assert.equal(searchSymptoms('CPU', 'Messaging').length, 0);
  assert.equal(searchSymptoms('  ').length, 10);
});
test('each curated entry has discriminating evidence, a real fixture and source links', () => {
  assert.equal(new Set(SYMPTOMS.map(entry => entry.slug)).size, SYMPTOMS.length);
  for (const entry of SYMPTOMS) {
    assert.match(entry.fixture, /^[a-zA-Z-]+\.(py|java)$/);
    assert.ok(existsSync(new URL(`../public/symptom-examples/${entry.fixture}`, import.meta.url)));
    assert.equal(entry.causes.length, 3);
    entry.causes.forEach(cause => ['title', 'evidence', 'against', 'next'].forEach(field => assert.ok(cause[field])));
    assert.ok(entry.fixtureScope && entry.expected && entry.firstStep);
    entry.references.forEach(link => assert.equal(new URL(link.href).protocol, 'https:'));
  }
});

test('all ten symptoms link to real lessons and existing scenario exercises', async () => {
  const { PUBLIC_ARTICLES } = await import('../lib/publicContent.mjs');
  const { SCENARIO_SEEDS } = await import('../lib/scenarioBank.mjs');
  const { DETECTIVE_CASES } = await import('../lib/productionDetective.mjs');
  assert.equal(SYMPTOMS.length, 10);
  for (const entry of SYMPTOMS) {
    const [lesson, scenario, relevance] = entry.learningPath;
    assert.ok(PUBLIC_ARTICLES.some(item => item.slug === lesson), entry.slug);
    const seed = SCENARIO_SEEDS.find(item => item.id === scenario);
    assert.ok(seed?.prompt && seed?.rubric.length && seed?.answerOutline.length, entry.slug);
    assert.ok(relevance && entry.reviewedAt && entry.runtime && entry.applicability);
    for (const link of entry.related.filter(link => link.href.startsWith('/detective/'))) {
      assert.ok(DETECTIVE_CASES.some(item => link.href === `/detective/${item.slug}`), link.href);
    }
    assert.equal(searchSymptoms(entry.title)[0]?.slug, entry.slug);
  }
});
test('Java and Spring context can be searched without knowing the topic name', () => {
  assert.equal(searchSymptoms('Java low CPU')[0]?.slug, 'low-cpu-slow-requests');
  assert.equal(searchSymptoms('Spring transaction roll back')[0]?.slug, 'transaction-does-not-roll-back');
  assert.equal(searchSymptoms('previous user context')[0]?.slug, 'request-sees-previous-user');
});
