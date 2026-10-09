import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import { COURSE_DEMO_ASSIGNMENTS } from '../lib/courseDemos.mjs';
import { JAVA_BLOG_FIXTURES, validateTechBlogCatalog } from '../scripts/validation/tech-blog-contracts.mjs';
import { runTechBlogGate, sourceFingerprint, techBlogGateCommands, validateUnitEvidence, validateBrowserEvidence } from '../scripts/validation/tech-blog-gate.mjs';

test('release inventory includes every catalog entry and rejects missing demo or Java behavior coverage', () => {
  const blogs = listTechBlogs();
  assert.deepEqual(validateTechBlogCatalog(), blogs.map(b => b.id));
  const assignments = { ...COURSE_DEMO_ASSIGNMENTS };
  delete assignments['kubernetes-java-production'];
  assert.throws(() => validateTechBlogCatalog(blogs, assignments), /explicit demo/);
  const fixtures = { ...JAVA_BLOG_FIXTURES };
  delete fixtures['java-service-networking'];
  assert.throws(() => validateTechBlogCatalog(blogs, COURSE_DEMO_ASSIGNMENTS, fixtures), /behavioral fixture/);
  const changed = blogs.map(b => b.id === 'java-service-networking' ? { ...b, javaRelease: undefined } : b);
  assert.throws(() => validateTechBlogCatalog(changed), /declare javaRelease/);
});

test('new Java courses cannot silently join a compilation-only gate', () => {
  const course = { ...listTechBlogs().find(b => b.id === 'java-service-networking'), id: 'unverified-java-course' };
  assert.throws(() => validateTechBlogCatalog([...listTechBlogs(), course], { ...COURSE_DEMO_ASSIGNMENTS, [course.id]: ['networkCall'] }), /behavioral fixture/);
});

test('release CLI rejects requests to skip browser verification', () => {
  assert.throws(() => execFileSync(process.execPath, ['scripts/validation/verify-tech-blog.mjs', '--skip-browser'], { encoding: 'utf8', stdio: 'pipe' }),
    error => error.status === 1 && /accepts no skip\/filter arguments/.test(error.stderr));
});

test('gate always includes unit, Java practice, lint, build and unfiltered production browser checks', () => {
  const steps = techBlogGateCommands('/tmp/evidence');
  assert.deepEqual(steps.map(s => s[0]), ['unit', 'practice-java', 'lint', 'build', 'readers-and-diagrams', 'diff-whitespace']);
  const browser = steps.find(s => s[0] === 'readers-and-diagrams')[2];
  for (const arg of ['e2e/tech-blog-release.spec.js', 'e2e/visual-integrity.spec.js', 'e2e/build-challenges.spec.js', 'e2e/senior-java-guide.spec.js', '--retries=0', '--forbid-only']) assert.ok(browser.includes(arg));
  assert.ok(!browser.includes('--grep'));
});

function runModel(result, fingerprint = () => 'before') {
  const report = { status: 'running', sourceFingerprint: 'before', steps: [] };
  let calls = 0;
  const run = () => { calls++; return result; };
  const execute = () => runTechBlogGate({ commands: [['first', 'node', []], ['second', 'node', []]], report, fingerprint, run, persist: () => {} });
  return { execute, report, calls: () => calls };
}
test('nonzero exits, spawn failures, timeouts and signals cannot pass or run later steps', () => {
  for (const result of [{ status: 1 }, { status: null, error: new Error('ENOENT') }, { status: null, signal: 'SIGTERM' }, { status: 0, error: new Error('ETIMEDOUT') }, { status: 0, signal: 'SIGINT' }]) {
    const model = runModel(result);
    assert.throws(model.execute, /failed at first/);
    assert.equal(model.calls(), 1);
    assert.equal(model.report.steps[0].status, 'failed');
    assert.notEqual(model.report.status, 'passed');
  }
});
test('stale source evidence fails even if every subprocess exits zero', () => {
  const model = runModel({ status: 0 }, () => 'after');
  assert.throws(model.execute, /Source changed/);
  assert.notEqual(model.report.status, 'passed');
  assert.equal(runModel({ status: 0 }).execute().status, 'passed');
});
test('zero, skipped, cancelled, todo and flaky suites cannot count as passing evidence', () => {
  const good = '# tests 2\n# pass 2\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n';
  assert.equal(validateUnitEvidence(good).tests, 2);
  assert.equal(validateUnitEvidence(good.replaceAll('#', 'ℹ')).pass, 2);
  for (const bad of ['', good.replace('tests 2', 'tests 0'), ...['fail', 'cancelled', 'skipped', 'todo'].map(key => good.replace(`${key} 0`, `${key} 1`))]) {
    assert.throws(() => validateUnitEvidence(bad), /Unit evidence/);
  }
  const stats = { expected: 1, unexpected: 0, skipped: 0, flaky: 0 };
  const browser = (expectedStatus = 'passed', results = [{ status: 'passed', errors: [] }]) => ({ stats, suites: [{ suites: [{ specs: [{ tests: [{ expectedStatus, results }] }] }] }] });
  assert.equal(validateBrowserEvidence(browser()).expected, 1);
  for (const bad of [{}, { stats: { ...stats, expected: 0 } }, { stats, errors: ['server failed'] }, ...['unexpected', 'skipped', 'flaky'].map(key => ({ stats: { ...stats, [key]: 1 } }))]) {
    assert.throws(() => validateBrowserEvidence(bad), /Browser evidence/);
  }
  for (const bad of [{ stats }, browser('failed', [{ status: 'failed' }]), browser('passed', []), browser('passed', [{ status: 'failed' }, { status: 'passed' }])]) {
    assert.throws(() => validateBrowserEvidence(bad), /actual passing result/);
  }
  assert.throws(() => runTechBlogGate({ commands: [] }), /empty gate/);
});
test('fingerprint detects tracked edits, new content, and deletions without relying on git status alone', () => {
  const root = mkdtempSync(join(tmpdir(), 'blog-gate-snapshot-'));
  try {
    execFileSync('git', ['init', '-q', root]);
    const file = join(root, 'lesson.mjs');
    writeFileSync(file, 'first');
    execFileSync('git', ['add', 'lesson.mjs'], { cwd: root });
    const first = sourceFingerprint(root);
    writeFileSync(file, 'second');
    assert.notEqual(sourceFingerprint(root), first);
    writeFileSync(file, 'first');
    assert.equal(sourceFingerprint(root), first);
    writeFileSync(join(root, 'new.mjs'), 'untracked course');
    const withNew = sourceFingerprint(root);
    assert.notEqual(withNew, first);
    rmSync(file);
    assert.notEqual(sourceFingerprint(root), withNew);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
