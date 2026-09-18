// Compile only repository-authored fixtures. Never use this as a public code runner.
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { CHAPTERS, containerSource, javaExercise } from '../../lib/tinyContainer.mjs';
for (let stage = 0; stage < CHAPTERS.length; stage++) {
  const dir = await mkdtemp(join(tmpdir(), 'tiny-container-'));
  try {
    for (const solution of [false, true]) {
      await writeFile(join(dir, 'Main.java'), javaExercise(stage, containerSource(stage, solution)));
      execFileSync('javac', ['--release', '8', 'Main.java'], { cwd: dir, timeout: 15000 });
      if (solution) {
        const output = execFileSync('java', ['Main'], { cwd: dir, timeout: 5000, encoding: 'utf8' });
        assert.match(output, /All chapter checks passed/);
        console.log(`${CHAPTERS[stage].id}: reference checks passed`);
      } else {
        assert.throws(() => execFileSync('java', ['Main'], { cwd: dir, timeout: 5000, stdio: 'pipe' }), /Command failed/);
        console.log(`${CHAPTERS[stage].id}: starter fails as intended`);
      }
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
}
