import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyPublishedJava } from '../scripts/validation/tech-blog-contracts.mjs';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import { COURSE_DIAGRAMS } from '../lib/techBlogDiagrams.mjs';

test('bulkhead course owns bounded admission, ambiguous completion, and Java 17 fixture coverage', () => {
  const course = listTechBlogs().find(blog => blog.id === 'java-bulkheads-backpressure');
  assert.ok(course);
  assert.equal(course.javaRelease, 17);
  assert.equal(course.chapters.length, 6);
  assert.ok(course.chapters.every(chapter => chapter.answer && chapter.whenToUse && chapter.avoid && COURSE_DIAGRAMS[chapter.diagramKey]));
  const report = verifyPublishedJava().find(item => item.courseId === course.id);
  assert.deepEqual(report && { examples: report.publishedExamples, fixture: report.fixture, output: report.output }, { examples: 6, fixture: 'BulkheadExampleChecks', output: 'Bulkhead checks passed' });
});
