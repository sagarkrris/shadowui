import test from 'node:test';
import assert from 'node:assert/strict';
import { ESLint } from 'eslint';

const eslint = new ESLint();
const filePath = 'e2e/screenshot-portability.spec.js';
const pathErrors = async source => (await eslint.lintText(source, { filePath }))[0].messages
  .filter(message => message.ruleId === 'no-restricted-syntax');

test('browser screenshot lint rejects machine-specific and shared artifact paths', async () => {
  for (const path of ["'/private/tmp/mobile.png'", "'/tmp/mobile.png'", "'screenshots/mobile.png'", '`/private/tmp/mobile-${width}.png`', 'artifactPath']) {
    for (const receiver of ['page', 'summary']) {
      assert.equal((await pathErrors(`${receiver}.screenshot({ path: ${path} });`)).length, 1, `${receiver}: ${path}`);
    }
  }
});

test('browser screenshot lint accepts isolated output paths and in-memory captures', async () => {
  for (const source of [
    "page.screenshot({ path: test.info().outputPath('mobile.png'), fullPage: true });",
    "summary.screenshot({ path: testInfo.outputPath(`summary-${width}.png`) });",
    'page.screenshot();',
    'page.screenshot({ fullPage: true });',
  ]) assert.deepEqual(await pathErrors(source), []);
});
