import test from 'node:test';
import assert from 'node:assert/strict';
import { labResult } from '../lib/hubLabs.mjs';
import { learningCatalogue } from '../lib/learningCatalog.mjs';
import { searchDiscovery } from '../lib/publicNavigation.mjs';
import { normalizeBookmarks, editorialCredit } from '../lib/readerEditorial.mjs';
import { getJavaTutorialBySlug } from '../lib/javaDigest.mjs';
import { savedLearningRecords } from '../lib/savedLearningRecords.mjs';
import { LEARNING_PATHS } from '../lib/learningHub.mjs';
import { loadProfile, NODE_SERVICE_REFERENCE } from '../lib/nodeServiceExercise.mjs';

test('AI category includes courses from both former capitalizations', () => {
  const ai = learningCatalogue().filter(course => course.category.toLowerCase() === 'ai engineering');
  assert.ok(ai.some(course => course.id === 'production-llm-evals-guardrails'));
  assert.ok(ai.some(course => course.id === 'ai-software-engineers'));
  assert.deepEqual([...new Set(ai.map(course => course.category))], ['AI Engineering']);
});
test('discovery deduplicates destinations after filtering and before limiting', () => {
  const course = { href: '/tech-blogs/cache', title: 'Cache', type: 'Course' };
  const article = { ...course, type: 'Article', description: 'Cache ownership' };
  const lesson = { ...course, type: 'Lesson', href: '/tech-blogs/cache#lesson-1' };
  const records = [course, article, lesson];
  assert.deepEqual(searchDiscovery(records, 'cache', 'All', 2), [course, lesson]);
  assert.deepEqual(searchDiscovery(records, 'cache', 'Article'), [article]);
  assert.deepEqual(searchDiscovery(records, 'cache', 'Course'), [course]);
  assert.deepEqual(searchDiscovery(records, 'ownership'), [article]);
});
test('legacy bookmarks retain their exact anchor and recover searchable parent context', () => {
  const old = { href: '/java/tutorial/jdk-vs-jre-vs-jvm#read-expected-result', title: 'Expected result' };
  const [bookmark] = normalizeBookmarks([old]);
  assert.equal(bookmark.href, old.href);
  assert.equal(bookmark.title, old.title);
  assert.equal(bookmark.articleTitle, 'JDK vs JRE vs JVM');
  const records = savedLearningRecords({ getItem: key => key === 'interviewiq.readerBookmarks.v1' ? JSON.stringify([old]) : null });
  assert.equal(searchDiscovery(records, 'jdk expected', 'Saved')[0].href, old.href);
  assert.equal(normalizeBookmarks([{ ...old, articleTitle: 'My authored title' }])[0].articleTitle, 'My authored title');
});
test('reader toolbar and chapter header use the same update date', () => {
  for (const slug of ['jdk-vs-jre-vs-jvm', 'hashmap', 'virtual-threads']) {
    const chapter = getJavaTutorialBySlug(slug);
    assert.equal(editorialCredit(`/java/tutorial/${slug}`).updated, chapter.reviewedAt);
    assert.equal(editorialCredit(`/java/tutorial/${slug}`).author, chapter.author);
  }
});
test('zero-capacity cache never retains an entry or reports a hit', () => {
  const result = labResult('cache', { value: '0' });
  assert.equal(result.summary, '0 hits; 7 misses');
  assert.equal(result.lines.length, 7);
  assert.ok(result.lines.every(line => line.endsWith('oldest → newest: ')));
});
test('lab boundaries reject fractional, blank and out-of-range input instead of simulating another value', () => {
  for (const value of ['1.5', '', ' ', -1, 4, Infinity, NaN, null, false, []]) {
    const result = labResult('cache', { value });
    assert.ok(result.error, `must reject ${String(value)}`);
    assert.deepEqual(result.lines, []);
    assert.doesNotMatch(result.summary, /hits|misses/);
  }
  assert.equal(labResult('cache', { value: 2 }).summary, '3 hits; 4 misses');
});
test('Node roadmap builds validation and cancellation instead of AI prompting', () => {
  const stage = LEARNING_PATHS.find(path => path.id === 'full-stack').stages.find(stage => stage.id === 'server');
  assert.equal(stage.activities.find(activity => activity.label === 'Build').href, '/build/node-service-contract');
});
test('published Node exercise executes its own request-contract checks', async () => {
  await import(`data:text/javascript;base64,${Buffer.from(NODE_SERVICE_REFERENCE).toString('base64')}`);
});
test('request boundary rejects invalid upstream data and preserves absence', async () => {
  const signal = new AbortController().signal;
  for (const record of [undefined, {}, { id: 'other', name: 'Maya' }, { id: 'u-7', name: 7 }]) {
    await assert.rejects(loadProfile({ id: 'u-7' }, { signal, lookup: async () => record }), /Invalid upstream/);
  }
  assert.equal(await loadProfile({ id: 'u-7' }, { signal, lookup: async () => null }), null);
});
