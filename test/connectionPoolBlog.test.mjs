import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import { COURSE_DIAGRAMS } from '../lib/techBlogDiagrams.mjs';

test('connection-pool course compiles on Java 17 and enforces ownership and deadline boundaries', () => {
  const course = listTechBlogs().find((blog) => blog.id === 'java-connection-pools');
  assert.ok(course);
  assert.equal(course.javaRelease, 17);
  assert.equal(course.chapters.length, 6);
  assert.ok(course.chapters.every((chapter) => chapter.whenToUse && chapter.avoid && chapter.answer && COURSE_DIAGRAMS[chapter.diagramKey]));
  const directory = mkdtempSync(join(tmpdir(), 'connection-pool-course-'));
  try {
    const sources = course.chapters.map((chapter, index) => {
      const file = join(directory, `ConnectionPoolChapter${index + 1}.java`);
      writeFileSync(file, chapter.example);
      return file;
    });
    const checks = fileURLToPath(new URL('./fixtures/ConnectionPoolExampleChecks.java', import.meta.url));
    execFileSync('javac', ['--release', '17', '-d', directory, ...sources, checks], { stdio: 'pipe' });
    assert.match(execFileSync('java', ['-cp', directory, 'ConnectionPoolExampleChecks'], { encoding: 'utf8', timeout: 10000 }), /Connection pool checks passed/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
