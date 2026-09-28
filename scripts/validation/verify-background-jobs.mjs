import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listTechBlogs } from '../../lib/techBlogs.mjs';

// Compile exactly what learners receive, not a second implementation of the examples.
export function verifyBackgroundJobs() {
  const course = listTechBlogs().find(blog => blog.id === 'java-background-jobs');
  assert.equal(course?.javaRelease, 17);
  assert.equal(course.chapters.length, 6);
  const dir = mkdtempSync(join(tmpdir(), 'background-jobs-check-'));
  try {
    const files = course.chapters.map((chapter, index) => {
      assert.ok(chapter.example && !chapter.exampleRuntime, chapter.title);
      const path = join(dir, `Chapter${index}.java`);
      writeFileSync(path, chapter.example);
      return path;
    });
    const fixture = fileURLToPath(new URL('../../test/fixtures/BackgroundJobsChecks.java', import.meta.url));
    execFileSync('javac', ['--release', String(course.javaRelease), '-d', dir, ...files, fixture], { timeout: 30000, stdio: 'pipe' });
    return execFileSync('java', ['-cp', dir, 'BackgroundJobsChecks'], { timeout: 15000, encoding: 'utf8', stdio: 'pipe' }).trim();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(verifyBackgroundJobs());
}
