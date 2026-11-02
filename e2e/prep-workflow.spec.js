import { test, expect } from '@playwright/test';
import { createSessionSnapshot, javaBackendProfile } from './helpers/app.js';
import { createTechBuddySession } from '../lib/techBuddy.mjs';
test.use({ serviceWorkers: 'block' });
const question = 'Explain transaction isolation and a write-skew failure.';
const baseline = { id: 'baseline', questionId: 'sql-isolation', question, answer: 'My original explanation', topic: 'SQL isolation', difficulty: 'Mid', round: 'coding', score: 5, rubricVersion: 1, gaps: ['Missing failure case'], exercise: 'Trace two concurrent writers.', feedback: 'Check the boundary.', completedAt: '2026-10-01T00:00:00Z' };
const memory = { version: 1, memory: { questions: { 'sql-isolation': { questionId: 'sql-isolation', question, topic: 'SQL isolation', attempts: [{ score: 9, attemptedAt: '2026-08-01T00:00:00Z' }, { score: 9, attemptedAt: '2026-08-02T00:00:00Z' }] } } } };
async function seed(page, { practice = {}, activeTab = 'chat', messages = [], entries = {} } = {}) {
  const envelope = createSessionSnapshot({ profile: javaBackendProfile, activeTab, messages });
  envelope.snapshot.practice = practice;
  await page.addInitScript(({ envelope, entries }) => {
    if (localStorage.getItem('__prep_workflow_seeded')) return;
    localStorage.setItem('__prep_workflow_seeded', '1');
    localStorage.setItem('interviewprep.session.v1', JSON.stringify(envelope));
    localStorage.setItem('interviewiq.homeDemoSeen.v1', '1');
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
  }, { envelope, entries });
}
async function saved(page) { return page.evaluate(() => JSON.parse(localStorage.getItem('interviewprep.session.v1')).snapshot.practice); }
test('homepage resumes an exact unfinished Buddy answer without replacing the session', async ({ page }) => {
  const buddy = { ...createTechBuddySession({ id: 'preserved-buddy', topic: 'SQL isolation' }), phase: 'question', current: { id: 'q1', question }, draft: 'My unfinished answer' };
  await seed(page, { practice: { buddy } });
  await page.goto('/');
  await page.getByRole('link', { name: /Resume Tech Buddy: SQL isolation/ }).click();
  const region = page.getByRole('region', { name: 'Tech Buddy interview', exact: true });
  await expect(region.getByLabel('Your interview answer', { exact: true })).toHaveValue('My unfinished answer');
  await expect(region.getByRole('article', { name: 'Interviewer question' })).toContainText(question);
  expect((await saved(page)).buddy.id).toBe('preserved-buddy');
});
test('hub follows the selected roadmap and retests the original due mastered question', async ({ page }) => {
  await seed(page, { practice: { attempts: [baseline] }, entries: { 'interviewiq.activeLearningPath.v1': 'system-design', 'interviewiq.questionMemory.v1': JSON.stringify(memory) } });
  let submitted;
  await page.route('**/api/evaluate', route => { submitted = route.request().postDataJSON(); return route.fulfill({ json: { evaluation: { score: 8, strengths: ['Clear'], gaps: [], recommendations: [], dimensions: [] } } }); });
  await page.goto('/learn');
  await expect(page.locator('#progress').getByRole('link', { name: 'Continue learning: System Design →', exact: true })).toBeVisible();
  await page.getByRole('link', { name: question, exact: true }).click();
  await expect(page.getByRole('region', { name: 'Original question review' })).toContainText(question);
  await page.getByText('Your previous answer', { exact: true }).click();
  await expect(page.getByRole('region', { name: 'Original question review' })).toContainText(baseline.answer);
  await page.getByLabel('Message composer').fill('My improved answer with a failure case.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect.poll(async () => (await saved(page)).attempts.length).toBe(2);
  expect(submitted.question).toBe(question);
  const latest = (await saved(page)).attempts.at(-1);
  expect(latest.questionId).toBe('sql-isolation'); expect(latest.parentId).toBe('baseline');
  await expect(page.getByRole('region', { name: 'Practice review' })).toContainText('Improved');
});
test('gap repair retains study and exercise evidence across a lesson visit and retests the baseline', async ({ page }) => {
  await seed(page, { practice: { attempts: [baseline] }, messages: [{ role: 'assistant', content: baseline.feedback }] });
  await page.route('**/api/discovery', route => route.fulfill({ json: { items: [{ title: 'SQL isolation boundary', href: '/sql/transactions', type: 'Lesson', category: 'SQL', description: 'SQL isolation failure cases' }] } }));
  await page.goto('/practice');
  await page.getByRole('button', { name: 'Work on this gap', exact: true }).click();
  const repair = page.getByRole('region', { name: 'Gap repair', exact: true });
  await repair.getByRole('button', { name: 'SQL isolation boundary', exact: true }).click();
  await repair.getByLabel('I studied the selected explanation').check();
  await repair.getByLabel('Repair exercise and evidence').fill('Two writers violate the shared constraint.');
  await expect(repair.getByRole('button', { name: 'Retest this gap' })).toBeDisabled();
  await repair.getByLabel('I completed the exercise and checked its failure case').check();
  await expect.poll(async () => (await saved(page)).repairs[0]?.confirmed).toBe(true);
  await page.reload(); await page.getByRole('button', { name: 'Work on this gap', exact: true }).click();
  await expect(repair.getByLabel('Repair exercise and evidence')).toHaveValue('Two writers violate the shared constraint.');
  await repair.getByRole('button', { name: 'Retest this gap' }).click();
  await expect.poll(async () => (await saved(page)).active?.parentId).toBe('baseline');
  expect((await saved(page)).active.question).toBe(question);
});
for (const minutes of [5, 15, 30]) test(`${minutes}-minute plan persists and has an explicit finish line`, async ({ page }) => {
  await seed(page); await page.goto('/practice');
  const plan = page.getByRole('region', { name: 'Your prep session' });
  await plan.getByLabel('Available study time').selectOption(String(minutes));
  const boxes = plan.getByRole('checkbox');
  for (let index = 0; index < await boxes.count(); index++) await boxes.nth(index).check();
  if (minutes === 30) await expect(plan.getByRole('button', { name: 'Complete prep session' })).toBeDisabled();
  await plan.getByLabel('Session reflection and remaining gaps').fill('Revisit isolation tomorrow.');
  await plan.getByRole('button', { name: 'Complete prep session' }).click();
  await expect.poll(async () => (await saved(page)).plan.finished).toBe(true);
  await page.reload(); await expect(plan.getByRole('status')).toContainText('Session complete');
});
test('application stage, follow-up and debrief persist and create a targeted review', async ({ page }) => {
  const application = { id: 'app-1', company: 'Example', role: 'Engineer', stage: 'applied' };
  await seed(page, { activeTab: 'company', entries: { 'interviewiq.applicationTracker.v1': JSON.stringify({ version: 1, savedAt: '2026-11-02T00:00:00Z', state: [application] }) } });
  await page.goto('/practice?workspace=company');
  await page.getByRole('button', { name: /Applications/, exact: false }).first().click();
  await page.getByLabel('Stage for Example', { exact: true }).selectOption('screen');
  await page.getByLabel('Next follow-up for Example').fill('2026-11-10T10:30');
  await page.getByText('Interview debrief for Example', { exact: true }).click();
  await page.getByLabel('Difficult areas for Example').fill('Transaction isolation');
  await page.getByLabel('Evidence and stories used for Example').fill('Migration story');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('interviewiq.applicationTracker.v1')).state[0].debrief?.difficultAreas)).toBe('Transaction isolation');
  await page.reload(); await page.getByRole('button', { name: /Applications/, exact: false }).first().click();
  await expect(page.getByLabel('Stage for Example', { exact: true })).toHaveValue('screen');
  await page.getByText('Interview debrief for Example', { exact: true }).click();
  await expect(page.getByLabel('Evidence and stories used for Example')).toHaveValue('Migration story');
  await page.getByRole('link', { name: 'Review this interview gap', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Original question review' })).toContainText('Transaction isolation');
});
test('missing saved question shows a safe recovery message', async ({ page }) => {
  await seed(page); await page.goto('/practice?reviewQuestion=missing');
  await expect(page.getByText('This question is unavailable on this device. Choose another saved question.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Message composer')).toBeVisible();
});

test('new plan and repair controls fit a phone and pass automated accessibility checks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, { practice: { attempts: [baseline] } });
  await page.goto('/practice');
  await expect(page.getByRole('region', { name: 'Your prep session' })).toBeVisible();
  const scroll = page.locator('.chat-scroll');
  expect(await scroll.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: 'Repair my last gap', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Gap repair', exact: true })).toBeVisible();
  expect(await scroll.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
  expect(await page.getByRole('region', { name: 'Gap repair', exact: true }).evaluate(async el => (await window.axe.run(el, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations)).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('gap-repair-mobile.png') });
});
