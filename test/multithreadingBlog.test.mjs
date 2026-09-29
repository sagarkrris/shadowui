import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import { COURSE_DIAGRAMS } from '../lib/techBlogDiagrams.mjs';

test('multithreading course has Java 17 examples and real-world interview answers', () => {
  const course = listTechBlogs().find((blog) => blog.id === 'java-multithreading-production');
  assert.ok(course);
  assert.equal(course.javaRelease, 17);
  assert.equal(course.chapters.length, 7);
  assert.equal(course.interviewQa.length, 6);
  assert.ok(course.interviewQa.every(({ question, answer }) => question && answer));
  assert.ok(course.chapters.every((chapter) => chapter.whenToUse && chapter.avoid && chapter.answer && COURSE_DIAGRAMS[chapter.diagramKey]));
  const directory = mkdtempSync(join(tmpdir(), 'multithreading-course-'));
  try {
    const sources = course.chapters.map((chapter, index) => {
      const file = join(directory, `MultithreadingChapter${index + 1}.java`);
      writeFileSync(file, chapter.example);
      return file;
    });
    const checks = fileURLToPath(new URL('./fixtures/MultithreadingExampleChecks.java', import.meta.url));
    execFileSync('javac', ['--release', '17', '-d', directory, ...sources, checks], { stdio: 'pipe' });
    assert.match(execFileSync('java', ['-cp', directory, 'MultithreadingExampleChecks'], { encoding: 'utf8', timeout: 10000 }), /Multithreading checks passed/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
