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

test('Java time course resolves DST, deadline, schedule identity, and uncertain delivery boundaries', () => {
  const course = listTechBlogs().find(blog => blog.id === 'java-time-production');
  assert.ok(course); assert.equal(course.javaRelease, 17); assert.equal(course.chapters.length, 6);
  assert.ok(course.chapters.every(chapter => chapter.whenToUse && chapter.avoid && chapter.answer && COURSE_DIAGRAMS[chapter.diagramKey]));
  const directory = mkdtempSync(join(tmpdir(), 'java-time-course-'));
  try {
    const sources = course.chapters.map((chapter, index) => { const file = join(directory, `TimeChapter${index}.java`); writeFileSync(file, chapter.example); return file; });
    const fixture = fileURLToPath(new URL('./fixtures/JavaTimeExampleChecks.java', import.meta.url));
    execFileSync('javac', ['--release', '17', '-d', directory, ...sources, fixture], { stdio: 'pipe' });
    assert.match(execFileSync('java', ['-cp', directory, 'JavaTimeExampleChecks'], { encoding: 'utf8' }), /Java time checks passed/);
    writeFileSync(sources[3], course.chapters[3].example.replace('elapsed >= timeoutNanos ? 0 : timeoutNanos - elapsed', 'elapsed <= timeoutNanos ? 0 : timeoutNanos - elapsed'));
    execFileSync('javac', ['--release', '17', '-d', directory, ...sources, fixture], { stdio: 'pipe' });
    assert.throws(() => execFileSync('java', ['-cp', directory, 'JavaTimeExampleChecks'], { stdio: 'pipe' }));
    writeFileSync(sources[3], course.chapters[3].example.replace('if (timeoutNanos < 0)', 'if (startedNanos < 0 || nowNanos < startedNanos || timeoutNanos < 0)'));
    execFileSync('javac', ['--release', '17', '-d', directory, ...sources, fixture], { stdio: 'pipe' });
    assert.throws(() => execFileSync('java', ['-cp', directory, 'JavaTimeExampleChecks'], { stdio: 'pipe' }));
    writeFileSync(sources[3], course.chapters[3].example);
    writeFileSync(sources[5], course.chapters[5].example.replace('return Action.WAIT', 'return Action.RUN'));
    execFileSync('javac', ['--release', '17', '-d', directory, ...sources, fixture], { stdio: 'pipe' });
    assert.throws(() => execFileSync('java', ['-cp', directory, 'JavaTimeExampleChecks'], { stdio: 'pipe' }));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('monotonic deadline challenge rejects a premature-expiry mutant', () => {
  const challenge = findChallenge('monotonic-deadline-budget');
  const source = referenceSource(challenge);
  const mutant = source.replace('elapsed >= timeout ? 0 : timeout - elapsed', 'elapsed <= timeout ? 0 : timeout - elapsed');
  assert.notEqual(mutant, source);
  const directory = mkdtempSync(join(tmpdir(), 'java-time-practice-mutation-'));
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
