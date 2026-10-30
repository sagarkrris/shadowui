import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { testWorkers } from './test-workers.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const files = readdirSync(new URL('../../test/', import.meta.url))
  .filter(name => name.endsWith('.test.mjs')).sort().map(name => `test/${name}`);
if (!files.length) throw new Error('No unit test files discovered');
const workers = testWorkers();
console.log(`Unit tests: ${workers} workers across ${files.length} files`);
const result = spawnSync(process.execPath, ['--test', `--test-concurrency=${workers}`, ...files], {
  cwd: root, stdio: 'inherit', env: process.env,
});
if (result.error) throw result.error;
process.exitCode = result.signal ? 1 : (result.status ?? 1);
