// Executes trusted repository fixtures only, never reader-submitted code.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SYMPTOMS } from '../../lib/engineeringSymptoms.mjs';
for (const entry of SYMPTOMS) {
  const path = fileURLToPath(new URL(`../../public/symptom-examples/${entry.fixture}`, import.meta.url));
  let output;
  if (entry.language === 'Java') {
    const directory = mkdtempSync(join(tmpdir(), 'symptom-java-'));
    try {
      execFileSync('javac', ['--release', '8', '-Xlint:-options', '-d', directory, path], { timeout: 15000, stdio: 'pipe' });
      output = execFileSync('java', ['-cp', directory, entry.fixture.replace('.java', '')], { encoding: 'utf8', timeout: 10000 });
    } finally { rmSync(directory, { recursive: true, force: true }); }
  } else output = execFileSync('python3', [path], { encoding: 'utf8', timeout: 10000 });
  assert.equal(output.trim(), entry.expected);
  console.log(`${entry.slug}: assertions and expected output passed`);
}
