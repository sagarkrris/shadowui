import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import { COURSE_DIAGRAMS } from '../lib/techBlogDiagrams.mjs';

test('cache-stampede course compiles on Java 17 and protects ownership, cancellation, and stale publication', () => {
  const course = listTechBlogs().find(blog => blog.id === 'java-cache-stampede-control');
  assert.ok(course); assert.equal(course.javaRelease, 17); assert.equal(course.chapters.length, 6);
  assert.ok(course.chapters.every(chapter => chapter.whenToUse && chapter.avoid && chapter.answer && COURSE_DIAGRAMS[chapter.diagramKey]));
  const directory = mkdtempSync(join(tmpdir(), 'cache-stampede-course-'));
  try { const sources = course.chapters.map((chapter, index) => { const file = join(directory, `CacheChapter${index}.java`); writeFileSync(file, chapter.example); return file; }); const fixture = fileURLToPath(new URL('./fixtures/CacheStampedeExampleChecks.java', import.meta.url)); execFileSync('javac', ['--release', '17', '-d', directory, ...sources, fixture], { stdio: 'pipe' }); assert.match(execFileSync('java', ['-cp', directory, 'CacheStampedeExampleChecks'], { encoding: 'utf8' }), /Cache stampede checks passed/); } finally { rmSync(directory, { recursive: true, force: true }); }
});
