import test from 'node:test';
import { verifyPublishedJava } from '../scripts/validation/tech-blog-contracts.mjs';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import assert from 'node:assert/strict';
test('published runtime probes preserve delegation, initialization and isolated type identity', () => {
  // The shared verifier validates the complete catalog before selecting fixtures.
  const evidence = verifyPublishedJava();
  const runtime = evidence.find(row => row.courseId === 'java-runtime-jdk-jvm-classloaders');
  assert.equal(runtime.publishedExamples, 8);
  assert.equal(runtime.fixture, 'RuntimeClassLoadingChecks');
  assert.equal(listTechBlogs().find(row => row.id === runtime.courseId).chapters.length, 8);
});
