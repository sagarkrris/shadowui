import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import { COURSE_DIAGRAMS } from '../lib/techBlogDiagrams.mjs';

test('file upload course compiles on Java 17 and protects bounded, versioned lifecycle decisions', () => {
  const course = listTechBlogs().find(blog => blog.id === 'java-file-uploads-production');
  assert.ok(course);
  assert.equal(course.javaRelease, 17);
  assert.equal(course.chapters.length, 6);
  assert.ok(course.chapters.every(chapter => chapter.whenToUse && chapter.avoid && chapter.answer && COURSE_DIAGRAMS[chapter.diagramKey]));
  assert.match(course.chapters[2].lesson, /UNKNOWN, not CLEAN/);
  assert.match(course.chapters[4].lesson, /current resource state/);
  const directory = mkdtempSync(join(tmpdir(), 'file-upload-course-'));
  try {
    const sources = course.chapters.map((chapter, index) => {
      const file = join(directory, `FileUploadChapter${index + 1}.java`);
      writeFileSync(file, chapter.example);
      return file;
    });
    const checks = fileURLToPath(new URL('./fixtures/FileUploadsExampleChecks.java', import.meta.url));
    execFileSync('javac', ['--release', '17', '-d', directory, ...sources, checks], { stdio: 'pipe' });
    assert.match(execFileSync('java', ['-cp', directory, 'FileUploadsExampleChecks'], { encoding: 'utf8', timeout: 10000 }), /File upload checks passed/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
