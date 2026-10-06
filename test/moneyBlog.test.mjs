import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import { COURSE_DIAGRAMS } from '../lib/techBlogDiagrams.mjs';
import { findChallenge, referenceSource, exerciseSource } from '../lib/buildChallenges.mjs';

test('money course preserves exact parsing, allocation, quote, and reconciliation boundaries', () => {
  const course = listTechBlogs().find(blog => blog.id === 'java-money-production');
  assert.ok(course); assert.equal(course.javaRelease, 17); assert.equal(course.chapters.length, 6);
  assert.ok(course.chapters.every(chapter => chapter.whenToUse && chapter.avoid && chapter.answer && COURSE_DIAGRAMS[chapter.diagramKey]));
  const directory = mkdtempSync(join(tmpdir(), 'money-course-'));
  try {
    const sources = course.chapters.map((chapter, index) => { const file = join(directory, `MoneyChapter${index}.java`); writeFileSync(file, chapter.example); return file; });
    const fixture = fileURLToPath(new URL('./fixtures/MoneyExampleChecks.java', import.meta.url));
    execFileSync('javac', ['--release', '17', '-d', directory, ...sources, fixture], { stdio: 'pipe' });
    assert.match(execFileSync('java', ['-cp', directory, 'MoneyExampleChecks'], { encoding: 'utf8' }), /Money checks passed/);
    writeFileSync(sources[2], course.chapters[2].example.replace('for (long extra = total - assigned, i = 0; i < extra; i++)', 'for (long extra = 0, i = 0; i < extra; i++)'));
    execFileSync('javac', ['--release', '17', '-d', directory, ...sources, fixture], { stdio: 'pipe' });
    assert.throws(() => execFileSync('java', ['-cp', directory, 'MoneyExampleChecks'], { stdio: 'pipe' }));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('money allocation challenge rejects floor-only allocation', () => {
  const challenge = findChallenge('allocate-minor-units');
  const source = referenceSource(challenge);
  const mutant = source.replace('for (long extra = total - assigned, i = 0; i < extra; i++)', 'for (long extra = 0, i = 0; i < extra; i++)');
  assert.notEqual(mutant, source);
  const directory = mkdtempSync(join(tmpdir(), 'money-practice-mutation-'));
  try {
    for (const implementation of [source, mutant]) {
      const file = join(directory, 'Main.java');
      writeFileSync(file, exerciseSource(challenge, implementation));
      execFileSync('javac', ['--release', '17', '-d', directory, file], { stdio: 'pipe', timeout: 15000 });
      const run = () => execFileSync('java', ['-cp', directory, 'Main'], { stdio: 'pipe', timeout: 10000 });
      if (implementation === source) run(); else assert.throws(run);
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
