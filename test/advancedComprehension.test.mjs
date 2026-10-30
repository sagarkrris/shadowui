import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADVANCED_COMPREHENSION_EXERCISES } from '../lib/advancedComprehensionExercises.mjs';

// Explicit registration prevents an added runnable lesson from silently lacking behavior checks.
const fixtures = {
  'request-path': 'RequestPathChecks', 'lookup-cost': 'LookupCostChecks',
  'ai-patch-contract': 'AiPatchContractChecks', 'async-ownership': 'AsyncOwnershipChecks',
  'graph-visited': 'GraphVisitedChecks', 'pagination-boundary': 'PaginationBoundaryChecks',
  'mock-event-service': 'MockEventServiceChecks', 'mock-export-service': 'MockExportServiceChecks',
};
assert.deepEqual(Object.keys(fixtures).sort(), ADVANCED_COMPREHENSION_EXERCISES.map(lesson => lesson.id).sort());
for (const lesson of ADVANCED_COMPREHENSION_EXERCISES) {
  test(`${lesson.id}: published starter fails the contract and reference passes behavioral regressions`, () => {
    const directory = mkdtempSync(join(tmpdir(), 'advanced-comprehension-'));
    try {
      for (const variant of ['starter', 'reference']) {
        const source = join(directory, 'Exercise.java');
        writeFileSync(source, lesson[variant]);
        const fixture = fileURLToPath(new URL(`./fixtures/comprehension/${fixtures[lesson.id]}.java`, import.meta.url));
        execFileSync('javac', ['--release', String(lesson.javaRelease), '-d', directory, source, fixture], { timeout: 15000, stdio: 'pipe' });
        const result = spawnSync('java', ['-cp', directory, 'Checks'], { timeout: 7000, encoding: 'utf8', maxBuffer: 1024 * 1024 });
        assert.ifError(result.error);
        if (variant === 'starter') {
          assert.equal(result.status, 1, result.stderr);
          assert.match(result.stderr, /AssertionError/);
        } else {
          assert.equal(result.status, 0, result.stderr);
          assert.match(result.stdout, /PASS/);
        }
      }
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
}

for (const lesson of ADVANCED_COMPREHENSION_EXERCISES.filter(item => item.projectFiles)) {
  test(`${lesson.id}: separate project files retain starter failures and reference behavior`, () => {
    for (const variant of ['starter', 'reference']) {
      const directory = mkdtempSync(join(tmpdir(), 'comprehension-project-'));
      try {
        const files = lesson.projectFiles[variant].map(file => {
          const path = join(directory, file.name); writeFileSync(path, file.source); return path;
        });
        const original = fileURLToPath(new URL(`./fixtures/comprehension/${fixtures[lesson.id]}.java`, import.meta.url));
        const fixture = join(directory, 'Checks.java');
        writeFileSync(fixture, readFileSync(original, 'utf8').replaceAll('Exercise.Service', 'Service').replaceAll('Exercise.ExportService', 'ExportService'));
        execFileSync('javac', ['--release', '17', '-d', directory, ...files, fixture], { timeout: 15000, stdio: 'pipe' });
        const demo = execFileSync('java', ['-cp', directory, 'Exercise'], { timeout: 7000, encoding: 'utf8' });
        const expectedDemo = {
          'request-path': variant === 'starter' ? 'south' : 'north',
          'mock-event-service': variant === 'starter' ? '10' : '20',
          'mock-export-service': variant === 'starter' ? '[c]' : '[b, c]',
        }[lesson.id];
        assert.ok(demo.includes(expectedDemo), demo);
        const result = spawnSync('java', ['-cp', directory, 'Checks'], { timeout: 7000, encoding: 'utf8' });
        assert.ifError(result.error);
        assert.equal(result.status, variant === 'starter' ? 1 : 0, result.stderr);
        if (variant === 'starter') assert.match(result.stderr, /AssertionError/);
        else assert.match(result.stdout, /PASS/);
      } finally { rmSync(directory, { recursive: true, force: true }); }
    }
  });
}
