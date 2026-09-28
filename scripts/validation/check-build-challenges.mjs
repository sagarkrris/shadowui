// Executes only authored repository fixtures, never network/user submissions.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BUILD_CHALLENGES, exerciseSource, referenceSource } from '../../lib/buildChallenges.mjs';

const directory = mkdtempSync(join(tmpdir(), 'build-challenges-'));
try {
  for (const c of BUILD_CHALLENGES) {
    for (const mode of ['basic', 'all']) for (const reference of [false, true]) {
      const file = join(directory, 'Main.java');
      writeFileSync(file, exerciseSource(c, reference ? referenceSource(c) : c.starter, mode));
      execFileSync('javac', ['--release', '17', '-d', directory, file], { timeout: 15000, stdio: 'pipe' });
      const run = spawnSync('java', ['-cp', directory, 'Main'], { timeout: 10000, encoding: 'utf8' });
      assert.ifError(run.error);
      if (reference) {
        assert.equal(run.status, 0, `${c.id}: ${run.stderr}`);
        assert.ok(run.stdout.includes(`CHECKS PASSED: ${c.id} v${c.version} ${mode}`));
      } else {
        assert.notEqual(run.status, 0, `${c.id}: starter unexpectedly passed`);
        assert.match(run.stderr, /UnsupportedOperationException/);
      }
    }
    console.log(`${c.id}: Java 17 starters compile/fail; references pass examples and failure checks`);
  }
} finally { rmSync(directory, { recursive: true, force: true }); }
