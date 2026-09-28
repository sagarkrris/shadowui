import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyBackgroundJobs } from '../scripts/validation/verify-background-jobs.mjs';

test('published Java 17 background-job examples enforce admission and drain invariants', () => {
  assert.match(verifyBackgroundJobs(), /Background job checks passed/);
});
