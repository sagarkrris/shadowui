import { expect, test } from '@playwright/test';
import { gotoSeededApp, createSessionSnapshot } from './helpers/app.js';
test.use({ serviceWorkers: 'block' });
async function auth(page) {
  await page.route('**/api/auth**', route => route.fulfill({ json: new URL(route.request().url()).searchParams.get('action') === 'me' ? { user: { id: 'practice-user', emailVerified: true, email: 'practice@example.test' } } : { csrfToken: 'test-token' } }));
}
test('failed cloud hydration never writes over the unread remote state', async ({ page }) => {
  await auth(page); let writes = 0; let reads = 0;
  await page.route('**/api/state', route => { if (route.request().method() === 'PUT') { writes++; return route.fulfill({ json: { ok: true } }); } reads++; return route.fulfill(reads === 1 ? { status: 503, json: { error: 'Unavailable' } } : { json: { state: null } }); });
  await gotoSeededApp(page, { homeDemoSeen: true, skipReadyCheck: true }); await expect(page.getByLabel('Retry cloud sync')).toBeVisible(); await page.getByLabel('Message composer').fill('Keep local draft'); expect(writes).toBe(0); await page.getByLabel('Retry cloud sync').click(); await expect.poll(() => writes).toBeGreaterThan(0); await expect(page.getByLabel('Message composer')).toHaveValue('Keep local draft');
});
test('typing while cloud hydration waits preserves the newer local draft', async ({ page }) => {
  await auth(page); let release; const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/api/state', async route => { if (route.request().method() === 'PUT') return route.fulfill({ json: { ok: true } }); await gate; return route.fulfill({ json: { state: { session: { ...createSessionSnapshot().snapshot, input: 'Old remote draft' } } } }); });
  await gotoSeededApp(page, { homeDemoSeen: true, skipReadyCheck: true }); await page.getByLabel('Message composer').fill('New local draft'); release(); await expect(page.getByText('Saved and synced', { exact: true })).toBeVisible(); await expect(page.getByLabel('Message composer')).toHaveValue('New local draft');
});
test('cloud writes serialize while the user continues editing', async ({ page }) => {
  await auth(page); const writes = []; let release; const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/api/state', async route => { if (route.request().method() === 'GET') return route.fulfill({ json: { state: null } }); writes.push(route.request().postDataJSON().state.session.input); if (writes.length === 1) await gate; return route.fulfill({ json: { ok: true } }); });
  await gotoSeededApp(page, { homeDemoSeen: true, skipReadyCheck: true }); await expect.poll(() => writes.length).toBe(1); await page.getByLabel('Message composer').fill('Latest draft'); await page.waitForTimeout(650); expect(writes.length).toBe(1); release(); await expect.poll(() => writes.at(-1)).toBe('Latest draft'); await expect(page.getByText('Saved and synced', { exact: true })).toBeVisible();
});
