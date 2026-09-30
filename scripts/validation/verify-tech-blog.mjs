import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateTechBlogCatalog, verifyPublishedJava } from './tech-blog-contracts.mjs';
import { runTechBlogGate, sourceFingerprint, techBlogGateCommands } from './tech-blog-gate.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const output = mkdtempSync(join(tmpdir(), 'tech-blog-release-'));
const report = { status: 'running', startedAt: new Date().toISOString(), steps: [], limitations: ['Decision-model fixtures do not verify live infrastructure.', 'Practice browser tests use offline/mocked adapters, not a live sandbox.', 'Semantic review of claims and diagram meaning remains required; this is not a zero-bug guarantee.'] };
const persist = value => writeFileSync(join(output, 'report.json'), JSON.stringify(value, null, 2));
console.log(`Tech-blog gate artifacts: ${output}`);
try {
  if (process.argv.length > 2) throw new Error('This mandatory gate accepts no skip/filter arguments');
  report.sourceFingerprint = sourceFingerprint(root);
  persist(report);
  report.courses = validateTechBlogCatalog();
  report.javaEvidence = verifyPublishedJava();
  persist(report);
  const env = { ...process.env };
  // Never test an arbitrary/stale development server or inherit a caller's course filter.
  for (const key of Object.keys(env)) if (key.startsWith('E2E_')) delete env[key];
  Object.assign(env, { E2E_PRODUCTION: '1', E2E_PORT: '3001', PLAYWRIGHT_HTML_OUTPUT_DIR: join(output, 'html'), PLAYWRIGHT_JSON_OUTPUT_FILE: join(output, 'browser.json'), FORCE_COLOR: '0', NODE_DISABLE_COLORS: '1' });
  runTechBlogGate({ commands: techBlogGateCommands(output), cwd: root, env, fingerprint: () => sourceFingerprint(root), report, persist, output });
  console.log(`Tech-blog gate PASSED for ${report.courses.length} courses. Evidence: ${join(output, 'report.json')}`);
} catch (error) {
  report.status = 'failed';
  report.error = error.message;
  report.finishedAt = new Date().toISOString();
  persist(report);
  console.error(`Tech-blog gate FAILED: ${error.message}. Evidence: ${join(output, 'report.json')}`);
  process.exitCode = 1;
}
