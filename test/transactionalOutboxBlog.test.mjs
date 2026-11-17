import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyPublishedJava } from '../scripts/validation/tech-blog-contracts.mjs';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import { COURSE_DIAGRAMS } from '../lib/techBlogDiagrams.mjs';

test('transactional outbox course preserves duplicate publication and Java 17 evidence', () => {
  const course = listTechBlogs().find(blog => blog.id === 'java-transactional-outbox');
  assert.ok(course); assert.equal(course.javaRelease, 17); assert.equal(course.chapters.length, 6);
  assert.ok(course.chapters.every(chapter => chapter.answer && chapter.whenToUse && chapter.avoid && COURSE_DIAGRAMS[chapter.diagramKey]));
  const report = verifyPublishedJava().find(item => item.courseId === course.id);
  assert.deepEqual(report && { examples: report.publishedExamples, fixture: report.fixture, output: report.output }, { examples: 6, fixture: 'TransactionalOutboxExampleChecks', output: 'Transactional outbox checks passed' });
});
