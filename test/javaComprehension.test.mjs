import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JAVA_COMPREHENSION_EXERCISES } from '../lib/codeComprehensionExercises.mjs';

test('the eight foundation Java comprehension starters demonstrate failures and corrected examples satisfy their contracts', () => {
  assert.equal(JAVA_COMPREHENSION_EXERCISES.length, 16);
  const directory = mkdtempSync(join(tmpdir(), 'java-comprehension-'));
  try {
    const sources = JAVA_COMPREHENSION_EXERCISES.slice(0, 8).flatMap(lesson => {
      assert.equal(lesson.javaRelease, 17);
      const baseName = lesson.id.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('');
      return [['Starter', lesson.starter], ['Reference', lesson.reference]].map(([suffix, source]) => {
        const className = `${baseName}${suffix}`;
        const path = join(directory, `${className}.java`);
        // Only the enclosing name changes so all published snippets compile together.
        writeFileSync(path, source.replace(/\bExercise\b/g, className));
        return path;
      });
    });
    const fixture = fileURLToPath(new URL('./fixtures/ComprehensionChecks.java', import.meta.url));
    execFileSync('javac', ['--release', '17', '-d', directory, ...sources, fixture], { timeout: 30000, stdio: 'pipe' });
    const output = execFileSync('java', ['-cp', directory, 'ComprehensionChecks'], { timeout: 15000, encoding: 'utf8' });
    assert.match(output, /Eight Java comprehension exercises passed/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('the published sample statements can be entered after opening each class in JShell', () => {
  const directory = mkdtempSync(join(tmpdir(), 'comprehension-jshell-'));
  try {
    const commands = JAVA_COMPREHENSION_EXERCISES.flatMap((lesson, index) =>
      ['starter', 'reference'].flatMap(variant => {
        const folder = join(directory, `${lesson.id}-${variant}`);
        mkdirSync(folder);
        const source = join(folder, 'Exercise.java');
        writeFileSync(source, lesson[variant]);
        return ['/reset', `/open ${source}`, lesson.sample, `System.out.println("SAMPLE_${index}_${variant}_FINISHED");`];
      }));
    const script = join(directory, 'samples.jsh');
    writeFileSync(script, [...commands, '/exit', ''].join('\n'));
    // Local execution avoids JShell's default debugger socket. These are authored snippets only.
    const result = spawnSync('jshell', ['--execution', 'local', '--feedback', 'concise', script], { timeout: 60000, encoding: 'utf8', stdio: 'pipe' });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    const output = result.stdout + result.stderr;
    assert.doesNotMatch(output, /(?:^|\n).*\bError:/);
    for (const [index] of JAVA_COMPREHENSION_EXERCISES.entries()) {
      for (const variant of ['starter', 'reference']) assert.ok(output.includes(`SAMPLE_${index}_${variant}_FINISHED`));
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
