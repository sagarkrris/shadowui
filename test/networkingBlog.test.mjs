import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import { COURSE_DIAGRAMS } from '../lib/techBlogDiagrams.mjs';

test('networking course compiles on Java 17 and exercises trust, ambiguity, and deadline boundaries', () => {
  const course = listTechBlogs().find(blog => blog.id === 'java-service-networking');
  assert.ok(course);
  assert.equal(course.javaRelease, 17);
  assert.equal(course.chapters.length, 6);
  assert.ok(course.chapters.every(chapter => chapter.whenToUse && chapter.avoid && chapter.answer && COURSE_DIAGRAMS[chapter.diagramKey]));
  assert.match(course.chapters[3].lesson, /business outcome is unknown/);
  assert.match(course.chapters[4].lesson, /authenticated principal and resource ownership/);
  const directory = mkdtempSync(join(tmpdir(), 'networking-course-'));
  try {
    const sources = course.chapters.map((chapter, index) => {
      const file = join(directory, `NetworkingChapter${index + 1}.java`);
      writeFileSync(file, chapter.example);
      return file;
    });
    const checks = fileURLToPath(new URL('./fixtures/NetworkingExampleChecks.java', import.meta.url));
    execFileSync('javac', ['--release', '17', '-d', directory, ...sources, checks], { stdio: 'pipe' });
    assert.match(execFileSync('java', ['-cp', directory, 'NetworkingExampleChecks'], { encoding: 'utf8', timeout: 10000 }), /Networking checks passed/);
    // Raw strings (even syntactically plausible ones) cannot cross the typed boundary.
    for (const raw of ['999.999.999.999', '::::', '.', '', 'localhost', '203.0.113.8, 10.0.0.4', '203.0.113.8\r\nX: y']) {
      const invalid = join(directory, 'RawHeader.java');
      writeFileSync(invalid, `class RawHeader { Object value = ProxyBoundaryExample.clientAddress(null, ${JSON.stringify(raw)}, true); }`);
      assert.throws(() => execFileSync('javac', ['--release', '17', '-cp', directory, '-d', directory, invalid], { timeout: 10000, stdio: 'pipe' }),
        error => error.status === 1 && /incompatible types/.test(error.stderr.toString()), `raw header accepted: ${raw}`);
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
