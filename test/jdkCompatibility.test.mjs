import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { javaTool } from '../scripts/validation/java-runtime.mjs';
import { getJavaTutorialBySlug } from '../lib/javaDigest.mjs';

test('published Greeting bytecode target and source launch match the lesson', () => {
  const lesson = getJavaTutorialBySlug('jdk-vs-jre-vs-jvm');
  const dir = mkdtempSync(join(tmpdir(), 'jdk-boundary-'));
  const run = (tool, args) => spawnSync(javaTool(tool), args, { cwd: dir, encoding: 'utf8' });
  try {
    writeFileSync(join(dir, 'Greeting.java'), lesson.runnableExample.source);
    assert.equal(run('javac', ['--release', '17', 'Greeting.java']).status, 0);
    assert.equal(readFileSync(join(dir, 'Greeting.class')).readUInt16BE(6), 61);
    assert.match(run('javap', ['-c', 'Greeting']).stdout, /PrintStream.println/);
    assert.equal(run('java', ['Greeting.java']).stdout.trim(), 'Hello from the JVM');
    assert.equal(run('javac', ['--release', '11', 'Greeting.java']).status, 0);
    assert.equal(readFileSync(join(dir, 'Greeting.class')).readUInt16BE(6), 55);
    assert.equal(run('java', ['Greeting']).stdout.trim(), 'Hello from the JVM');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
