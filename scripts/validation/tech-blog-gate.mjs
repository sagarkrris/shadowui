import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { lstatSync, readFileSync, readlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function sourceFingerprint(root) {
  const files = [...new Set(execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean))].sort();
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(file + '\0');
    try {
      const path = join(root, file);
      const stat = lstatSync(path);
      hash.update(String(stat.mode) + '\0');
      hash.update(stat.isSymbolicLink() ? readlinkSync(path) : readFileSync(path));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      hash.update('deleted');
    }
    hash.update('\0');
  }
  return hash.digest('hex');
}

export function techBlogGateCommands(output) {
  return [
    ['unit', 'npm', ['run', 'test:unit']],
    ['practice-java', 'npm', ['run', 'test:build-challenges']],
    ['lint', 'npm', ['run', 'lint']],
    ['build', 'npm', ['run', 'build']],
    ['readers-and-diagrams', 'npx', ['playwright', 'test', 'e2e/tech-blog-release.spec.js', 'e2e/networking-blog.spec.js', 'e2e/visual-integrity.spec.js', 'e2e/build-challenges.spec.js', '--project=chromium', '--workers=2', '--retries=0', '--forbid-only', '--reporter=line,json', `--output=${join(output, 'browser')}`]],
    ['diff-whitespace', 'git', ['diff', '--check']],
  ];
}

export function validateUnitEvidence(output) {
  const stats = Object.fromEntries([...output.matchAll(/(?:^|\n)(?:#|ℹ) (tests|pass|fail|cancelled|skipped|todo) (\d+)/g)].map(match => [match[1], Number(match[2])]));
  if (!(stats.tests > 0 && stats.pass === stats.tests && ['fail', 'cancelled', 'skipped', 'todo'].every(key => stats[key] === 0))) {
    throw new Error('Unit evidence must contain a nonempty suite with no failed, skipped, cancelled, or todo tests');
  }
  return stats;
}

export function validateBrowserEvidence(report) {
  const stats = report.stats;
  if (!(stats?.expected > 0 && stats.unexpected === 0 && stats.skipped === 0 && stats.flaky === 0 && !report.errors?.length)) {
    throw new Error('Browser evidence must contain passing tests with no skipped, flaky, failed, or global errors');
  }
  const collect = suites => (suites || []).flatMap(suite => [
    ...(suite.specs || []).flatMap(spec => spec.tests || []), ...collect(suite.suites),
  ]);
  const tests = collect(report.suites);
  // Playwright counts an expected failure as "expected", not "unexpected".
  // A known failing test must not be presented as a passing release check.
  if (tests.length !== stats.expected || tests.some(test => test.expectedStatus !== 'passed' ||
      test.results?.length !== 1 || test.results[0].status !== 'passed' || test.results[0].errors?.length)) {
    throw new Error('Browser evidence requires one actual passing result per test; expected failures and retries are not release passes');
  }
  return stats;
}

// Exported orchestration permits deterministic tests of command errors, signals and stale evidence.
export function runTechBlogGate({ commands, cwd, env, fingerprint, report, persist, output, run = spawnSync }) {
  if (!commands.length) throw new Error('An empty gate cannot pass');
  for (const [name, command, args] of commands) {
    const step = { name, status: 'running', startedAt: new Date().toISOString() };
    report.steps.push(step);
    persist(report);
    let result;
    try {
      result = run(command, args, { cwd, env, stdio: name === 'unit' ? 'pipe' : 'inherit', encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 20 * 60 * 1000 });
      if (name === 'unit') {
        const log = (result.stdout || '') + (result.stderr || '');
        writeFileSync(join(output, 'unit.log'), log);
        process.stdout.write(log);
        if (result.status === 0) step.evidence = validateUnitEvidence(result.stdout || '');
      }
      if (name === 'readers-and-diagrams' && result.status === 0) {
        step.evidence = validateBrowserEvidence(JSON.parse(readFileSync(join(output, 'browser.json'), 'utf8')));
      }
    }
    catch (error) { result = { ...result, error }; }
    Object.assign(step, { status: result.status === 0 && !result.error && !result.signal ? 'passed' : 'failed', exitCode: result.status ?? null, signal: result.signal ?? null });
    if (result.error) step.error = result.error.message;
    persist(report);
    if (step.status !== 'passed') throw new Error(`Tech-blog gate failed at ${name}; remaining steps were not run`);
  }
  if (fingerprint() !== report.sourceFingerprint) throw new Error('Source changed during verification; rerun the complete gate on the final files');
  report.status = 'passed';
  report.finishedAt = new Date().toISOString();
  persist(report);
  return report;
}
