// These tests exercise browser decisions only; server isolation is checked by
// scripts/security/verify-account-isolation.mjs against real PostgreSQL.
import { test, expect } from '@playwright/test';
import { createSessionSnapshot, SESSION_STORAGE_KEY } from './helpers/app.js';

test.use({ serviceWorkers: 'block' });

async function switchedAccount(page, { unowned = false } = {}) {
  await page.addInitScript(({key,session,unowned}) => { if (localStorage.getItem('__account_fixture_ready__')) return; localStorage.clear(); localStorage.setItem('__account_fixture_ready__','1'); localStorage.setItem(key,JSON.stringify(session)); localStorage.setItem('interviewiq.homeDemoSeen.v1','1'); if (!unowned) localStorage.setItem('interviewiq.cloudStateOwner.v1','previous-account'); localStorage.setItem('interviewiq.learningNotebook.v1',JSON.stringify([{id:'private-note',title:'Previous private notebook'}])); localStorage.setItem('interviewiq.careerToolkit.v1',JSON.stringify({version:1,state:{resumeText:'Previous private resume'}})); localStorage.setItem('interviewiq.diagnostic.v1','previous private diagnostic'); }, {key:SESSION_STORAGE_KEY,session:createSessionSnapshot(),unowned});
  await page.route('**/api/auth**', route => route.fulfill({ json: new URL(route.request().url()).searchParams.get('action') === 'me' ? { user: { id: 'new-account', emailVerified: true, email: 'synthetic@example.invalid' } } : { csrfToken: 'synthetic-csrf' } }));
  const writes = [];
  await page.route('**/api/state', route => {
    if (route.request().method() === 'PUT') { writes.push(route.request().postDataJSON()); return route.fulfill({ json: { ok: true, revision: 1 } }); }
    return route.fulfill({ json: { userId: 'new-account', state: null, revision: 0 } });
  });
  await page.goto('/practice');
  const conflict = page.getByRole('region', { name: 'Cloud save conflict' });
  await expect(conflict).toBeVisible();
  await conflict.getByText('Cloud saving paused · Review copies', { exact: true }).click();
  // Advance beyond the save debounce: no implicit import into the empty account.
  await page.waitForTimeout(650);
  expect(writes).toHaveLength(0);
  return { conflict, writes };
}

for (const unowned of [false,true]) {
test(`existing ${unowned ? 'unowned legacy' : 'other-account'} device work requires explicit import into an empty cloud account`, async ({ page }) => {
  const { conflict, writes } = await switchedAccount(page,{unowned});
  await conflict.getByRole('button', { name: 'Keep this device copy', exact: true }).click();
  await expect.poll(() => writes.length).toBeGreaterThan(0);
  expect(writes[0].userId).toBe('new-account');
  expect(writes[0].state.session.candidateProfile.name).toBe('Sagar');
});

test(`choosing an empty cloud copy clears ${unowned ? 'unowned legacy' : 'other-account'} caches before saving`, async ({ page }) => {
  const { conflict, writes } = await switchedAccount(page,{unowned});
  await conflict.getByRole('button', { name: 'Use cloud copy', exact: true }).click();
  await expect.poll(() => writes.length).toBeGreaterThan(0);
  expect(writes.every(write => write.state.session.candidateProfile?.name !== 'Sagar')).toBe(true);
  expect(writes.every(write=>!JSON.stringify(write.state).includes('Previous private'))).toBe(true);
  expect(await page.evaluate(()=>localStorage.getItem('interviewiq.diagnostic.v1'))).toBe(null);
  expect(await page.evaluate(()=>localStorage.getItem('interviewiq.learningNotebook.v1'))).toBe(null);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('interviewiq.careerToolkit.v1')).state)).toEqual({});
});

}
