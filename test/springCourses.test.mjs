import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('published Spring labs package and exercise real Boot and database behavior', () => {
  const project = mkdtempSync(join(tmpdir(), 'spring-orders-test-'));
  try {
    cpSync(new URL('../public/spring-labs/', import.meta.url), project, { recursive: true });
    const settings = fileURLToPath(new URL('./fixtures/spring-blog/settings.xml', import.meta.url));
    try {
      execFileSync('mvn', ['-B', '-s', settings, 'package'], {
        cwd: project, encoding: 'utf8', stdio: 'pipe', timeout: 180_000,
      });
    } catch (error) {
      assert.fail([error.message, error.stdout, error.stderr].filter(Boolean).join('\n'));
    }
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});
