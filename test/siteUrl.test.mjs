import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const moduleUrl = new URL('../lib/siteUrl.mjs', import.meta.url).href;
function resolveOrigin(value) {
  const env = { ...process.env };
  if (value === undefined) delete env.NEXT_PUBLIC_SITE_URL;
  else env.NEXT_PUBLIC_SITE_URL = value;
  return execFileSync(process.execPath, ['--input-type=module', '-e', `import { SITE_URL } from ${JSON.stringify(moduleUrl)}; process.stdout.write(SITE_URL);`], { env, encoding: 'utf8' });
}
test('missing or blank production origin uses the real ElevatePrep host', () => {
  for (const value of [undefined, '', '  ']) assert.equal(resolveOrigin(value), 'https://elevateprep.vercel.app');
});
test('custom production origin is retained without trailing slash inconsistencies', () => {
  assert.equal(resolveOrigin(' https://learning.example.test/// '), 'https://learning.example.test');
});
