import assert from 'node:assert/strict';
import test from 'node:test';
import { BEGINNER_PATHS } from '../lib/aiBeginnerPaths.mjs';
import { chunkDocuments, cosineSimilarity, lexicalTerms, termVector, runRagPlayground } from '../lib/ragPlayground.mjs';

test('beginner paths have distinct lessons and valid comprehension checks', () => {
  assert.deepEqual(BEGINNER_PATHS.map(path => path.id), ['genai', 'rag']);
  const ids = [];
  for (const path of BEGINNER_PATHS) {
    assert.equal(path.lessons.length, 6);
    for (const lesson of path.lessons) {
      ids.push(lesson.id);
      for (const key of ['objective', 'explanation', 'example', 'exercise', 'solution', 'pitfall', 'interview', 'answer']) assert.ok(lesson[key]);
      assert.ok(Number.isInteger(lesson.quiz.correct));
      assert.ok(lesson.quiz.correct >= 0 && lesson.quiz.correct < lesson.quiz.options.length);
      assert.ok(lesson.quiz.explanation);
    }
  }
  assert.equal(new Set(ids).size, 12);
});
test('paragraph chunking preserves stable document identity and ignores empty sections', () => {
  assert.deepEqual(chunkDocuments([{ id: 'guide', title: 'Guide', text: '\n\n First section.\n\n\nSecond section.\n\n' }]), [
    { id: 'guide-1', title: 'Guide', text: 'First section.' },
    { id: 'guide-2', title: 'Guide', text: 'Second section.' },
  ]);
});
test('lexical vectors count repeated terms and use a consistent vocabulary', () => {
  assert.deepEqual(lexicalTerms('How do I reset MY password?'), ['reset', 'password']);
  assert.deepEqual(termVector('token TOKEN reset', ['reset', 'token', 'unknown']), [1, 2, 0]);
  assert.deepEqual(termVector('credentials renewal', ['reset', 'token']), [0, 0]);
});
test('cosine calculation handles exact, orthogonal, zero and invalid vectors', () => {
  assert.ok(Math.abs(cosineSimilarity([1, 1, 0], [1, 0, 1]) - 0.5) < 1e-12);
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  assert.equal(cosineSimilarity([0, 0], [1, 1]), 0);
  assert.throws(() => cosineSimilarity([1], [1, 2]), /equal dimensions/);
  assert.throws(() => cosineSimilarity([NaN], [1]), /finite/);
});
test('retrieval selects grounded sources, respects top-k and assembles exact evidence', () => {
  const result = runRagPlayground('password reset', 1);
  assert.equal(result.selected[0].id, 'password-1');
  assert.equal(result.selected.length, 1);
  assert.equal(result.context.sources[0].text, result.selected[0].text);
  assert.ok(result.answer.startsWith('[password-1]'));
  const ambiguous = runRagPlayground('token', 2);
  assert.deepEqual(new Set(ambiguous.selected.map(chunk => chunk.id)), new Set(['api-1', 'password-1']));
  assert.equal(runRagPlayground('token', 1).selected.length, 1);
  assert.equal(runRagPlayground('support hours', 1).selected[0].id, 'support-1');
});
test('absent vocabulary abstains without fabricated sources and rejects invalid input', () => {
  for (const query of ['refund policy', 'credentials renewal', '???']) {
    const result = runRagPlayground(query);
    assert.equal(result.status, 'abstained');
    assert.deepEqual(result.context.sources, []);
    assert.ok(result.ranked.every(chunk => chunk.score === 0));
  }
  for (const query of ['', '  ', null, 'x'.repeat(501)]) assert.throws(() => runRagPlayground(query), /question/);
  for (const k of [0, 4, 1.5, '2']) assert.throws(() => runRagPlayground('token', k), /top-k/);
});
