// Each process owns a temporary compilation directory; never share Main.java/classes.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { BUILD_CHALLENGES } from '../../lib/buildChallenges.mjs';
import { runConcurrent, testWorkers } from './test-workers.mjs';

if (process.argv.length !== 2) throw new Error('Java practice verification accepts no skip/filter arguments');
const workers = testWorkers();
console.log(`Java practice: ${workers} workers across ${BUILD_CHALLENGES.length} suites`);
const worker = fileURLToPath(new URL('./check-build-challenge.mjs', import.meta.url));
await runConcurrent(BUILD_CHALLENGES, workers, challenge => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [worker, challenge.id], { stdio: 'inherit' });
  child.once('error', reject);
  child.once('exit', (code, signal) => {
    if (code === 0 && !signal) resolve();
    else reject(new Error(`${challenge.id}: worker failed (${signal || code})`));
  });
}));
