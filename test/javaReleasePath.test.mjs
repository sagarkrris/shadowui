import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { JAVA_RELEASE_PATH } from '../lib/javaReleasePath.mjs';
import { JAVA_RELEASE_CHAPTERS } from '../lib/javaReleaseLessons.mjs';
import { JAVA_CURATED_TUTORIAL_CATALOG, getJavaTutorialBySlug, slugifyJavaTutorial } from '../lib/javaDigest.mjs';

test('every release from 8 through 26 resolves to actual published lessons', () => {
  assert.deepEqual(JAVA_RELEASE_PATH.map(item => item.release), Array.from({ length: 19 }, (_, i) => i + 8));
  const linked = new Set();
  for (const release of JAVA_RELEASE_PATH) for (const title of release.lessons) {
    const chapter = getJavaTutorialBySlug(slugifyJavaTutorial(title));
    assert.ok(chapter && chapter.editorialStatus === 'curated', `${release.release}: ${title}`);
    linked.add(title);
  }
  for (const title of Object.keys(JAVA_RELEASE_CHAPTERS)) assert.ok(linked.has(title), title);
  assert.equal(new Set(JAVA_CURATED_TUTORIAL_CATALOG.map(item => slugifyJavaTutorial(item.title))).size, JAVA_CURATED_TUTORIAL_CATALOG.length);
});

test('permanent features and version-specific opt-in labs cannot share misleading flags', () => {
  for (const lesson of Object.values(JAVA_RELEASE_CHAPTERS)) {
    const example = lesson.runnableExample;
    assert.equal(example.release, lesson.release);
    if (lesson.status === 'preview') {
      assert.equal(lesson.release, 26);
      assert.ok(example.compileArgs.includes('--enable-preview') && example.runArgs.includes('--enable-preview'));
    } else assert.ok(!example.compileArgs.includes('--enable-preview') && !example.runArgs.includes('--enable-preview'));
    if (lesson.status === 'incubator') {
      assert.ok(example.compileArgs.includes('jdk.incubator.vector') && example.runArgs.includes('jdk.incubator.vector'));
    }
    assert.ok(lesson.exercise && lesson.solution && lesson.followUp.includes('?'));
  }
  assert.equal(JAVA_RELEASE_CHAPTERS['Scoped values'].status, 'permanent');
  assert.equal(JAVA_RELEASE_CHAPTERS['Structured concurrency in Java 26'].status, 'preview');
});

test('CI preserves JDK 26 before setup-java selects the existing JDK 21 baseline', () => {
  const yaml = createRequire(import.meta.url)('js-yaml');
  const workflow = yaml.load(readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8'));
  assert.equal(workflow.jobs.validate['runs-on'], 'ubuntu-24.04');
  const steps = workflow.jobs.validate.steps;
  const java26 = steps.findIndex(step => step.uses?.startsWith('actions/setup-java') && step.with?.['java-version'] === '26');
  const preserved = steps.findIndex(step => step.run?.includes('CONTENT_JAVA26_HOME=$JAVA_HOME'));
  const java21 = steps.findIndex(step => step.uses?.startsWith('actions/setup-java') && step.with?.['java-version'] === '21');
  const gate = steps.findIndex(step => step.run === 'npm run verify:tech-blog');
  assert.ok(java26 >= 0 && java26 < preserved && preserved < java21 && java21 < gate);
  assert.ok(steps[preserved].run.includes('$GITHUB_ENV'), 'later test processes must inherit the preserved path');
});
