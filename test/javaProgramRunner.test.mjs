import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { JAVA_PROGRAM_EXAMPLES } from '../lib/javaDigest.mjs';
import { buildJavaProgramRunner } from '../lib/javaProgramRunner.mjs';
import { javaTool } from '../scripts/validation/java-runtime.mjs';

test('each exercise opens a scaffold tied to its selected task', () => {
  for (const program of JAVA_PROGRAM_EXAMPLES) {
    const runner = buildJavaProgramRunner(program);
    assert.equal(runner.title, program.title);
    assert.equal(runner.prompt, program.prompt);
    assert.equal(runner.javaVersion, 17);
    assert.doesNotMatch(runner.code, /maxValue/);
    if (program.id !== 'program-1') {
      assert.ok(runner.code.includes(program.title));
      assert.match(runner.instructions, /not a supplied solution or an automated correctness check/);
      assert.match(runner.instructions, /configured local project/);
    }
  }
});

test('reverse scaffold compiles and its executable checks reject a code-unit reversal', () => {
  const directory = mkdtempSync(join(tmpdir(), 'java-practice-runner-'));
  try {
    const scaffold = buildJavaProgramRunner(JAVA_PROGRAM_EXAMPLES[0]).code;
    const compile = code => {
      writeFileSync(join(directory, 'Main.java'), code);
      const result = spawnSync(javaTool('javac', process.env, 17), ['--release', '17', 'Main.java'], { cwd: directory, encoding: 'utf8', timeout: 30000 });
      assert.equal(result.status, 0, result.stderr);
      return spawnSync(javaTool('java', process.env, 17), ['Main'], { cwd: directory, encoding: 'utf8', timeout: 30000 });
    };
    assert.notEqual(compile(scaffold).status, 0, 'unimplemented exercises cannot report passing');
    const placeholder = 'throw new UnsupportedOperationException("Implement reverse");';
    const correct = 'if (input == null) throw new IllegalArgumentException(); return new StringBuilder(input).reverse().toString();';
    const passed = compile(scaffold.replace(placeholder, correct));
    assert.equal(passed.status, 0, passed.stderr);
    assert.match(passed.stdout, /All four reverse checks passed/);
    const broken = 'if (input == null) throw new IllegalArgumentException(); String result = ""; for (int i = input.length() - 1; i >= 0; i--) result += input.charAt(i); return result;';
    assert.notEqual(compile(scaffold.replace(placeholder, broken)).status, 0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
