// Trusted repository fixtures only. Never executes user submissions.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TINY_SYSTEMS, systemExercise } from '../../lib/tinySystems.mjs';
const directory = mkdtempSync(join(tmpdir(), 'tiny-systems-'));
try {
  for (const project of TINY_SYSTEMS) for (let stage = 0; stage < project.chapters.length; stage++) {
    for (const solution of [false, true]) {
      const file = join(directory, 'Main.java');
      writeFileSync(file, systemExercise(project, stage, solution));
      execFileSync('javac', ['--release', '8', '-Xlint:-options', '-d', directory, file], { timeout: 15000, stdio: 'pipe' });
      const run = spawnSync('java', ['-cp', directory, 'Main'], { timeout: 10000, encoding: 'utf8' });
      if (solution) { assert.equal(run.status, 0, run.stderr); assert.equal(run.stdout.trim(), `Chapter ${stage + 1}: all checks passed`); }
      else { assert.notEqual(run.status, 0); assert.match(run.stderr, new RegExp(`UnsupportedOperationException: Implement chapter ${stage + 1}`)); }
    }
    console.log(`${project.slug} chapter ${stage + 1}: starter fails as intended; reference checks pass`);
  }
} finally { rmSync(directory, { recursive: true, force: true }); }
