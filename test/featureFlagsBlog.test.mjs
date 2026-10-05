import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import { COURSE_DIAGRAMS } from '../lib/techBlogDiagrams.mjs';
import { findChallenge, exerciseSource, referenceSource, normalizeChallengeProgress } from '../lib/buildChallenges.mjs';

test('feature flag course compiles on Java 17 and preserves targeting, outage, and retirement boundaries', () => {
  const course = listTechBlogs().find(blog => blog.id === 'java-feature-flags-production');
  assert.ok(course);
  assert.equal(course.javaRelease, 17);
  assert.equal(course.chapters.length, 6);
  assert.ok(course.chapters.every(chapter => chapter.whenToUse && chapter.avoid && chapter.answer && COURSE_DIAGRAMS[chapter.diagramKey]));
  assert.match(course.chapters[0].lesson, /must not grant access/);
  assert.match(course.chapters[4].answer, /changes later evaluations only/);
  const directory = mkdtempSync(join(tmpdir(), 'feature-flag-course-'));
  try {
    const sources = course.chapters.map((chapter, index) => {
      const file = join(directory, `FeatureFlagChapter${index + 1}.java`);
      writeFileSync(file, chapter.example);
      return file;
    });
    const checks = fileURLToPath(new URL('./fixtures/FeatureFlagsExampleChecks.java', import.meta.url));
    execFileSync('javac', ['--release', '17', '-d', directory, ...sources, checks], { stdio: 'pipe' });
    assert.match(execFileSync('java', ['-cp', directory, 'FeatureFlagsExampleChecks'], { encoding: 'utf8', timeout: 10000 }), /Feature flag checks passed/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('rollout practice rejects constant and inclusive-threshold implementations', () => {
  const challenge = findChallenge('stable-feature-rollout');
  const directory = mkdtempSync(join(tmpdir(), 'feature-flag-mutations-'));
  try {
    const reference = referenceSource(challenge);
    const variants = [
      ['reference', reference, true],
      ['all intermediate subjects disabled', reference.replace('return bucket < percent;', 'return false;'), false],
      ['all intermediate subjects enabled', reference.replace('return bucket < percent;', 'return true;'), false],
      ['inclusive threshold', reference.replace('return bucket < percent;', 'return bucket <= percent;'), false],
    ];
    for (const [name, source, shouldPass] of variants) {
      if (!shouldPass) assert.notEqual(source, reference, name);
      const file = join(directory, 'Main.java');
      writeFileSync(file, exerciseSource(challenge, source, 'all'));
      execFileSync('javac', ['--release', '17', '-d', directory, file], { timeout: 15000, stdio: 'pipe' });
      const run = () => execFileSync('java', ['-cp', directory, 'Main'], { timeout: 10000, encoding: 'utf8', stdio: 'pipe' });
      if (shouldPass) assert.match(run(), /CHECKS PASSED/);
      else assert.throws(run, error => error.status === 1 && /AssertionError/.test(error.stderr), name);
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('stronger rollout checks preserve old drafts and invalidate only old evidence', () => {
  const id = 'stable-feature-rollout';
  const draft = { version: 1, code: 'my implementation', notes: 'my reasoning', testedSource: 'my implementation', evidence: 'runner' };
  const migrated = normalizeChallengeProgress({ [id]: draft })[id];
  assert.deepEqual(migrated, { ...draft, version: 2, testedSource: null, evidence: null });
  const checked = { ...migrated, testedSource: migrated.code, evidence: 'local' };
  assert.deepEqual(normalizeChallengeProgress({ [id]: checked })[id], checked);
  assert.deepEqual(normalizeChallengeProgress({ [id]: { ...draft, version: 3 } }), {});
});
