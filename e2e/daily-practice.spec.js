import { expect, test } from '@playwright/test';
import { gotoSeededApp, mockChat } from './helpers/app.js';
test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => { await page.route('**/api/dsa-challenges', route => route.fulfill({ status: 503, json: { error: 'Offline fixture' } })); });
const evaluation = { score: 6, confidence: 'medium', strengths: ['Explained locking'], gaps: ['Missing atomicity'], recommendations: ['Trace two writers'], exercise: 'List the interleavings for two increments.', followUp: 'How would you make a shared counter safe?', dimensions: [{ key: 'correctness', score: 6, evidence: 'lock', deduction: 'Define the protected operation.' }] };
async function seed(page) { await mockChat(page, 'Explain how locking protects a shared counter.'); await gotoSeededApp(page, { homeDemoSeen: true, skipReadyCheck: true }); }
async function start(page) { await page.getByRole('button', { name: 'Start practice', exact: true }).click(); await expect(page.getByText('Current question', { exact: true })).toBeVisible(); }
async function answer(page) { await page.getByLabel('Message composer').fill('I use a lock around the shared counter.'); await page.getByRole('button', { name: 'Send', exact: true }).click(); }
async function attempts(page) { return page.evaluate(() => JSON.parse(localStorage.getItem('interviewprep.session.v1')).snapshot.practice.attempts); }

test('practice result survives reload and agrees with review, home, history and export', async ({ page }) => {
  await page.route('**/api/evaluate', route => route.fulfill({ json: { evaluation } })); await seed(page); await start(page); await answer(page);
  const review = page.getByRole('region', { name: 'Practice review' }); await expect(review).toContainText('6/10'); await expect.poll(async () => (await attempts(page)).length).toBe(1);
  await page.reload(); await expect(review).toContainText('6/10');
  await review.getByText(/Attempt history and topic trends/).click(); await expect(review).toContainText('Too little evidence');
  await page.getByRole('button', { name: 'Home', exact: true }).first().click(); await expect(page.getByText('1 completed attempts · 6/10 average')).toBeVisible();
  await page.getByText('Your data · Backup and restore', { exact: true }).click(); const downloadPromise = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download full practice backup' }).click(); const download = await downloadPromise; expect(download.suggestedFilename()).toBe('interviewiq-practice-backup.json');
});
test('mock draft, current question and paused timer survive refresh and navigation', async ({ page }) => {
  await seed(page); await page.getByRole('button', { name: 'Start mock', exact: true }).click(); await page.getByLabel('Message composer').fill('Draft includes atomicity'); await page.getByRole('button', { name: 'Pause timer', exact: true }).click(); await page.reload(); await expect(page.getByLabel('Message composer')).toHaveValue('Draft includes atomicity'); await expect(page.getByRole('button', { name: 'Resume timer', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Home', exact: true }).first().click(); await page.getByRole('button', { name: 'Resume last session' }).click(); await expect(page.getByLabel('Message composer')).toHaveValue('Draft includes atomicity');
});

test('practice stays untimed and reveals formatted code on demand, while mock starts a timer', async ({ page }) => {
  const requests = await mockChat(page, '**Explain atomicity** in the following snippet.\n\n```java\ncount++;\n```');
  await gotoSeededApp(page);
  await start(page);
  expect(requests.at(-1).interviewMode).toBe('singleQuestionPractice');
  expect(requests.at(-1).interviewPanel).toBeNull();
  await expect(page.getByRole('button', { name: 'Pause timer' })).toHaveCount(0);
  const full = page.getByRole('region', { name: 'Full current question' });
  await expect(full).toBeHidden();
  await page.getByText('Show full question', { exact: true }).click();
  await expect(full.locator('strong')).toHaveText('Explain atomicity');
  await expect(full.locator('pre')).toContainText('count++;');
  await page.getByText('Hide full question', { exact: true }).click();
  await expect(full).toBeHidden();
  await page.getByRole('button', { name: 'Home', exact: true }).first().click();
  await page.getByRole('button', { name: 'Start mock', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause timer' })).toBeVisible();
  expect(requests.at(-1).interviewMode).toBe('strict');
});
test('failed evaluation retries the same answer once, including after refresh', async ({ page }) => {
  let count = 0; await page.route('**/api/evaluate', route => { count++; return route.fulfill(count === 1 ? { status: 503, json: { error: 'Unavailable' } } : { json: { evaluation } }); });
  await seed(page); await start(page); await answer(page); await expect(page.getByRole('button', { name: 'Retry saved request' })).toBeVisible(); await page.reload(); await page.getByRole('button', { name: 'Retry saved request' }).click(); await expect.poll(async () => (await attempts(page)).length).toBe(1); expect(count).toBe(2); await expect(page.getByRole('article', { name: 'Your message' }).filter({ hasText: 'I use a lock' })).toHaveCount(1);
});
test('drill and retest save two answers and a comparison with the same rubric', async ({ page }) => {
  let count = 0; await page.route('**/api/evaluate', route => route.fulfill({ json: { evaluation: { ...evaluation, score: ++count === 1 ? 6 : 8 } } })); await seed(page); await start(page); await answer(page);
  const review = page.getByRole('region', { name: 'Practice review' }); await expect(review).toBeVisible(); await review.getByLabel('Targeted exercise notes').fill('Read, increment and write must be one protected operation.'); await review.getByRole('button', { name: 'Complete drill and retest' }).click(); await expect(page.locator('.practice-current-question summary')).toContainText('How would you make a shared counter safe?'); await answer(page); await expect(review).toContainText('Improved'); await expect.poll(async () => (await attempts(page)).length).toBe(2); expect((await attempts(page))[1].parentId).toBe((await attempts(page))[0].id);
});
test('null score stays unassessed and individual deletion removes its messages', async ({ page }) => {
  await page.route('**/api/evaluate', route => route.fulfill({ json: { evaluation: { ...evaluation, score: null } } })); await seed(page); await start(page); await answer(page); const review = page.getByRole('region', { name: 'Practice review' }); await expect(review).toContainText('Not assessed'); await review.getByText(/Attempt history and topic trends/).click(); await review.locator('details').last().locator('summary').click(); await review.getByRole('button', { name: 'Remove this practice record' }).click(); await expect.poll(async () => (await attempts(page)).length).toBe(0); await expect(page.getByRole('article', { name: 'Your message' }).filter({ hasText: 'I use a lock' })).toHaveCount(0);
});
test('narrow screen supports keyboard focus and expanded feedback without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await seed(page); await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Start practice', exact: true }).focus(); await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeFocused(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); await page.screenshot({ path: test.info().outputPath('shadow-today-mobile.png') });
});
test('profile edit while evaluation loads preserves the answer and resulting score', async ({ page }) => {
  let release; const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/api/evaluate', async route => { await gate; await route.fulfill({ json: { evaluation } }); });
  await seed(page); await start(page); await answer(page); await expect(page.getByRole('button', { name: 'Stop request' })).toBeVisible();
  await page.getByLabel('Workspace options', { exact: true }).click();
  await page.getByRole('button', { name: 'Edit Profile', exact: true }).click(); await page.getByLabel('Name', { exact: true }).fill('Updated Name'); await page.getByRole('button', { name: 'Personalize Prep' }).click(); release();
  await expect.poll(async () => (await attempts(page)).length).toBe(1); await page.reload(); await expect(page.getByRole('region', { name: 'Practice review' })).toContainText('6/10');
});
test('truncated AI stream stays retryable and never records a partial score', async ({ page }) => {
  await seed(page); let count = 0;
  await page.route('**/api/chat', route => { count++; return route.fulfill({ contentType: 'text/event-stream', body: count === 1 ? 'data: {"text":"Partial question"}\n\n' : 'data: {"text":"Explain safe publication."}\n\ndata: [DONE]\n\n' }); });
  await page.getByRole('button', { name: 'Start practice', exact: true }).click(); await expect(page.getByRole('button', { name: 'Retry saved request' })).toBeVisible(); expect((await attempts(page)).length).toBe(0);
  await page.getByRole('button', { name: 'Retry saved request' }).click(); await expect(page.getByText('Current question', { exact: true })).toBeVisible(); expect((await attempts(page)).length).toBe(0);
});
test('full backup preview restores saved drafts and rejects incompatible data', async ({ page }) => {
  await seed(page); await page.getByLabel('Message composer').fill('Restore this draft'); await page.getByText('Your data · Backup and restore', { exact: true }).click();
  const pendingDownload = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download full practice backup' }).click(); const downloaded = await pendingDownload; const path = await downloaded.path();
  await page.getByLabel('Message composer').fill('Changed draft'); await page.getByLabel('Preview backup to restore').setInputFiles(path); await expect(page.getByRole('button', { name: 'Restore previewed backup' })).toBeVisible(); await expect(page.getByLabel('Message composer')).toHaveValue('Changed draft');
  await page.getByRole('button', { name: 'Restore previewed backup' }).click(); await expect(page.getByLabel('Message composer')).toHaveValue('Restore this draft');
  await page.getByText('Your data · Backup and restore', { exact: true }).click(); await page.getByLabel('Preview backup to restore').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"interviewiq-practice","version":99,"entries":{}}') }); await expect(page.getByText('Incompatible backup. No data was changed.')).toBeVisible(); await expect(page.getByLabel('Message composer')).toHaveValue('Restore this draft');
});
test('resume evidence and contextual reports persist without inventing missing facts', async ({ page }) => {
  await seed(page); await page.getByText('Resume evidence notebook', { exact: true }).click(); await page.getByRole('button', { name: 'Add evidence record' }).click(); await page.getByLabel('Project or situation', { exact: true }).fill('Order service'); await page.getByLabel('Action and technical decision', { exact: true }).fill('Added idempotency keys'); await expect(page.getByText(/Measurement needed/)).toBeVisible();
  await page.getByText('Report a problem with this content', { exact: true }).click(); await page.getByLabel('What is incorrect?').fill('The example does not handle empty input.'); await page.getByRole('button', { name: 'Preview report' }).click(); await expect(page.locator('pre').filter({ hasText: 'The example does not handle empty input.' })).toBeVisible(); await page.getByRole('button', { name: 'Save report locally' }).click(); await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('interviewprep.session.v1')).snapshot.practice.evidence[0]?.project)).toBe('Order service'); await page.reload(); await expect(page.getByLabel('Project or situation', { exact: true })).toHaveValue('Order service');
});
test('design versions restore user components and assumptions after refresh', async ({ page }) => {
  await gotoSeededApp(page, { activeTab: 'canvas', homeDemoSeen: true }); await page.getByRole('button', { name: 'New design', exact: true }).click(); await page.getByLabel('Design name', { exact: true }).fill('Order architecture'); await page.getByRole('button', { name: 'Add component', exact: true }).click(); await page.locator('.practice-panel').filter({ has: page.getByRole('heading', { name: 'Your saved designs', exact: true }) }).getByLabel('Component name', { exact: true }).fill('Order API'); await page.getByRole('button', { name: 'Save named version' }).click(); await page.locator('.practice-panel').filter({ has: page.getByRole('heading', { name: 'Your saved designs', exact: true }) }).getByLabel('Component name', { exact: true }).fill('Changed API'); await page.reload(); await expect(page.locator('.practice-panel').filter({ has: page.getByRole('heading', { name: 'Your saved designs', exact: true }) }).getByLabel('Component name', { exact: true })).toHaveValue('Changed API'); await page.getByText(/Version history · 1/).click(); await page.getByRole('button', { name: 'Restore version', exact: true }).click(); await expect(page.locator('.practice-panel').filter({ has: page.getByRole('heading', { name: 'Your saved designs', exact: true }) }).getByLabel('Component name', { exact: true })).toHaveValue('Order API');
});
test('executable DSA handles empty input and saves independent progress states', async ({ page }) => {
  await gotoSeededApp(page, { activeTab: 'dsaLab', homeDemoSeen: true }); await page.getByText('Executable DSA practice · input, code and trace together', { exact: true }).click(); await page.getByLabel('Input JSON', { exact: true }).fill('[]'); await expect(page.getByText('Output: null', { exact: true })).toBeVisible(); await page.getByLabel('Understood (self-reported)', { exact: true }).check(); await expect(page.getByLabel('Solved independently (self-reported)', { exact: true })).not.toBeChecked(); await page.reload(); await page.getByText('Executable DSA practice · input, code and trace together', { exact: true }).click(); await expect(page.getByLabel('Understood (self-reported)', { exact: true })).toBeChecked(); await expect(page.getByLabel('Input JSON', { exact: true })).toHaveValue('[]');
});

test('failed evaluation keeps diagnostics after reload and lets the user continue without losing the answer', async ({ page }) => {
  await page.route('**/api/evaluate', route => route.fulfill({ status: 504, contentType: 'text/html', headers: { 'x-request-id': 'timeout-fixture' }, body: '<h1>Gateway timeout</h1>' }));
  await seed(page); await start(page); await answer(page);
  const recovery = page.getByRole('region', { name: 'Unfinished request' });
  await expect(recovery).toContainText('AI evaluation timed out');
  await expect(recovery).toContainText('timeout-fixture');
  await page.reload();
  await expect(recovery).toContainText('timeout-fixture');
  await page.getByRole('button', { name: 'Keep answer and continue', exact: true }).click();
  await expect(recovery).toHaveCount(0);
  await expect(page.getByRole('article', { name: 'Your message' }).filter({ hasText: 'I use a lock' })).toHaveCount(1);
  expect((await attempts(page)).length).toBe(0);
  await page.getByLabel('Message composer').fill('Explain atomicity instead.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Your message' }).filter({ hasText: 'Explain atomicity instead.' })).toBeVisible();
});

test('screen analysis is readable in light mode, validates uploads, and sends JPEG with its actual MIME type', async ({ page }) => {
  await seed(page);
  // The modal lives outside the themed app shell and must carry its own theme.
  await page.getByRole('button', { name: 'Analyze Screen', exact: true }).last().click();
  const modal = page.getByRole('dialog', { name: 'Analyze Screen' });
  await expect(modal).toBeVisible();
  await expect(modal).toHaveClass(/theme-light/);
  const colors = await modal.locator('.screen-modal-panel').evaluate(element => ({ foreground: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor }));
  expect(colors.background).toBe('rgb(255, 255, 255)');
  expect(colors.foreground).toBe('rgb(23, 43, 69)');
  await expect(modal.getByRole('button', { name: 'Analyze with AI', exact: true })).toBeDisabled();
  await modal.getByLabel('Screenshot image').setInputFiles({ name: 'bad.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await expect(modal.getByRole('alert')).toHaveText('Choose a PNG, JPEG, or WebP image.');
  const image = await page.evaluate(() => { const canvas = document.createElement('canvas'); canvas.width = 20; canvas.height = 20; return canvas.toDataURL('image/jpeg').split(',')[1]; });
  await modal.getByLabel('Screenshot image').setInputFiles({ name: 'capture.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(image, 'base64') });
  await expect(modal.getByRole('img', { name: 'Screenshot preview' })).toBeVisible();
  await expect(modal.getByRole('button', { name: 'Analyze with AI', exact: true })).toBeEnabled();
  let mimeType;
  await page.route('**/api/analyze-screen', route => { mimeType = route.request().postDataJSON().mimeType; return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"text":"The image shows a blank canvas."}\n\ndata: [DONE]\n\n' }); });
  await modal.getByRole('button', { name: 'Analyze with AI', exact: true }).click();
  await expect(page.getByRole('article', { name: 'InterviewIQ response' }).filter({ hasText: 'The image shows a blank canvas.' })).toBeVisible();
  expect(mimeType).toBe('image/jpeg');
});

test('screen dialog fits a narrow viewport and keeps close and upload controls reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await seed(page);
  await page.getByRole('button', { name: 'Analyze Screen', exact: true }).last().click();
  const modal = page.getByRole('dialog', { name: 'Analyze Screen' });
  await expect(modal.getByRole('button', { name: 'Upload Image', exact: true })).toBeVisible();
  const bounds = await modal.locator('.screen-modal-panel').boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(600);
  await modal.getByRole('button', { name: 'Close screen analysis' }).click();
  await expect(modal).toHaveCount(0);
});

test('home groups optional practice cards and answer tools stay collapsed until requested', async ({ page }) => {
  await page.route('**/api/evaluate', route => route.fulfill({ json: { evaluation } }));
  await seed(page);
  await expect(page.getByRole('heading', { name: 'Production Detective' })).not.toBeVisible();
  await page.getByText('Explore debugging and backend practice', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Production Detective' })).toBeVisible();
  await start(page); await answer(page);
  await expect(page.getByRole('region', { name: 'Practice review' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Polish', exact: true })).not.toBeVisible();
  await page.getByText('Answer tools · Rewrite and explanation checks', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Polish', exact: true })).toBeVisible();
});


test('screen analysis carries the dark theme outside the app shell', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await seed(page);
  await page.getByRole('button', { name: 'Analyze Screen', exact: true }).last().click();
  const modal = page.getByRole('dialog', { name: 'Analyze Screen' });
  await expect(modal).toHaveClass(/theme-dark/);
  const colors = await modal.locator('.screen-modal-panel').evaluate(element => ({ foreground: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor }));
  expect(colors.background).toBe('rgb(23, 33, 47)');
  expect(colors.foreground).toBe('rgb(226, 232, 240)');
});
