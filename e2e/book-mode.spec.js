import { expect, test } from '@playwright/test';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import { PUBLIC_STACK_GUIDES } from '../lib/seoGuides.mjs';
import { PUBLIC_VERTICAL_LISTICLES } from '../lib/verticalContent.mjs';
import { PUBLIC_RESOURCES } from '../lib/publicContent.mjs';
import { SCENARIO_SEEDS } from '../lib/scenarioBank.mjs';
import { gotoSeededApp } from './helpers/app.js';
import { extractResumeTextFromBuffer } from '../lib/resumeExtract.mjs';

const courses = listTechBlogs();
const interactiveCourse = courses.find(course => course.format !== 'field-note');
const bookDialog = page => page.locator('dialog[open]').filter({ has: page.getByRole('region', { name: 'Book pages', exact: true }) }).last();
const pageStatus = book => book.getByRole('status').filter({ hasText: /^Pages? \d/ });

async function openBook(page) {
  await page.getByRole('button', { name: 'Open Book Mode', exact: true }).click();
  const book = bookDialog(page);
  await expect(book).toBeVisible();
  await expect(pageStatus(book)).toHaveText(/^Pages? \d+(?:–\d+)? of \d+$/);
  return book;
}

async function jumpTo(book, title) {
  await book.getByLabel('Book contents', { exact: true }).selectOption({ label: title });
}

// Discover every catalog course rather than leaving future additions outside Book Mode coverage.
for (const course of courses) {
  test(`Book Mode catalog: ${course.id} preserves content and reaches the final section`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/tech-blogs/${course.id}`);
    await expect(page.getByRole('searchbox', { name: 'Search within this article' })).toBeVisible();
    const examples = await page.locator('main pre').allTextContents();
    const answer = page.locator('main details').filter({ has: page.locator('summary', { hasText: /^Sample answer$/ }) }).first();
    if (course.format !== 'field-note') {
      await answer.locator('summary').click();
      await expect(answer).toHaveAttribute('open', '');
    }
    const lastHeading = page.locator('main h2').last();
    const finalTitle = await lastHeading.textContent();
    const book = await openBook(page);
    await expect(pageStatus(book)).toHaveText(/^Pages \d+–\d+ of \d+$/);
    expect(await book.locator('pre').allTextContents()).toEqual(examples);
    if (course.format !== 'field-note') await expect(answer).toHaveAttribute('open', '');
    const pages = book.getByRole('region', { name: 'Book pages', exact: true });
    await jumpTo(book, (await book.getByLabel('Book contents').locator('option').nth(1).textContent()).trim());
    const before = await pages.evaluate(element => element.scrollLeft);
    await expect(book.getByRole('button', { name: 'Next page', exact: false })).toBeEnabled();
    await pages.focus();
    await pages.press('ArrowRight');
    await expect.poll(() => pages.evaluate(element => element.scrollLeft)).toBeGreaterThan(before + 100);
    await jumpTo(book, finalTitle);
    await expect(lastHeading).toBeInViewport();
    await book.getByRole('button', { name: 'Exit Book Mode', exact: false }).click();
    await expect(bookDialog(page)).toHaveCount(0);
    await expect(lastHeading).toBeInViewport();
    expect(await page.locator('main pre').allTextContents()).toEqual(examples);
    if (course.format !== 'field-note') await expect(answer).toHaveAttribute('open', '');
    expect(errors).toEqual([]);
  });
}

const publicRoutes = [
  `/tech-blogs/${interactiveCourse.id}`,
  '/java/hashmap-internals',
  ...['spring', 'sql', 'python', 'aws', 'javascript', 'system-design'].map(stack => {
    const entry = PUBLIC_STACK_GUIDES.find(guide => guide.stack === stack) || PUBLIC_VERTICAL_LISTICLES.find(article => article.vertical === stack);
    return `/${stack}/${entry.slug}`;
  }),
  `/guides/${PUBLIC_STACK_GUIDES[0].stack}/${PUBLIC_STACK_GUIDES[0].slug}`,
  '/java/listicle/java-interview-questions',
  '/java/tutorial/jdk-vs-jre-vs-jvm',
  '/symptoms/low-cpu-slow-requests',
  '/advice-fails/transactional-didnt-start-a-transaction',
  '/explain-log/null-profile-stack-trace',
  `/resources/${PUBLIC_RESOURCES[0].slug}`,
  `/scenarios/${SCENARIO_SEEDS[0].id}`,
  '/weekly/2026-09-18-transaction-boundaries',
  '/senior-java-interview/daily/2026-10-07-set-01',
  '/learn/ai-engineering',
  '/learn/spring-transactions',
];

for (const route of publicRoutes) {
  test(`Book Mode public route: ${route} uses one mobile page and restores its content`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto(route);
    expect(response.status()).toBe(200);
    const title = await page.locator('main h1').first().textContent();
    const book = await openBook(page);
    await expect(pageStatus(book)).toHaveText(/^Page \d+ of \d+$/);
    await expect(book.locator('h1').first()).toHaveText(title);
    expect(await book.evaluate(element => element.scrollWidth <= innerWidth + 1)).toBe(true);
    if (route === `/tech-blogs/${interactiveCourse.id}`) await page.screenshot({ path: testInfo.outputPath('public-book-mobile.png') });
    const contents = book.getByLabel('Book contents', { exact: true });
    const last = contents.locator('option').last();
    if (await last.getAttribute('value')) {
      const heading = (await last.textContent()).trim();
      await contents.selectOption(await last.getAttribute('value'));
      await expect(book.getByRole('heading', { name: heading, exact: true }).last()).toBeInViewport();
    }
    await book.getByRole('button', { name: 'Exit Book Mode', exact: false }).press('Escape');
    await expect(bookDialog(page)).toHaveCount(0);
    await expect(page.locator('main h1').first()).toHaveText(title);
    await expect(page.getByRole('button', { name: 'Open Book Mode', exact: true })).toBeFocused();
  });
}

test('Book Mode preserves public demo state and keeps expanded diagrams interactive', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/tech-blogs/${interactiveCourse.id}`);
  const demo = page.getByRole('region', { name: 'Interactive course demo', exact: true });
  await demo.getByRole('button', { name: 'Next', exact: true }).click();
  const progress = demo.getByRole('progressbar', { name: 'Demo progress' });
  await expect(progress).toHaveAttribute('value', '2');
  const book = await openBook(page);
  await expect(progress).toHaveAttribute('value', '2');
  await jumpTo(book, 'Explore the concept');
  await demo.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(progress).toHaveAttribute('value', '3');
  await book.getByText('Reading settings', { exact: true }).click();
  await book.getByLabel('Expand diagram', { exact: true }).selectOption('0');
  const expanded = page.getByRole('dialog', { name: 'Expanded diagram', exact: true });
  await expect(expanded).toBeVisible();
  await expect(expanded.locator('svg')).toBeVisible();
  const textView = expanded.getByRole('button', { name: 'Text view', exact: true });
  await textView.click();
  await expect(textView).toHaveAttribute('aria-pressed', 'true');
  await expect(expanded.locator('svg')).not.toBeVisible();
  await expanded.getByRole('button', { name: 'Close expanded view' }).press('Escape');
  await expect(expanded).not.toBeVisible();
  await expect(book).toBeVisible();
  await book.getByLabel('Expand code or table', { exact: true }).selectOption('0');
  const expandedCode = page.getByRole('dialog', { name: 'Expanded code or table', exact: true });
  await expect(expandedCode).toBeVisible();
  await expect(expandedCode.locator('pre,table')).toHaveCount(1);
  await expandedCode.getByRole('button', { name: 'Close expanded view' }).press('Escape');
  await book.getByText('Reading settings', { exact: true }).click();
  await jumpTo(book, 'Explore the concept');
  await page.screenshot({ path: testInfo.outputPath('public-book-desktop.png') });
  await book.getByRole('button', { name: 'Exit Book Mode', exact: false }).click();
  await expect(progress).toHaveAttribute('value', '3');
  await expect(page.locator('[data-course-diagram]').first().getByRole('button', { name: 'Text view', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await demo.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(progress).toHaveAttribute('value', '1');
});

test('Book Mode retains article search, bookmarks and working code-copy controls', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copied = text; } } }));
  await page.goto('/java/hashmap-internals');
  const bookmark = page.getByRole('button', { name: 'Bookmark Say this first', exact: true });
  await bookmark.click();
  const search = page.getByRole('searchbox', { name: 'Search within this article' });
  await search.fill('HashMap');
  const book = await openBook(page);
  await expect(search).toHaveValue('HashMap');
  await expect(bookmark).toHaveAttribute('aria-pressed', 'true');
  await jumpTo(book, 'Say this first');
  await expect(page.getByRole('heading', { name: 'Say this first', exact: true })).toBeInViewport();
  await bookmark.click();
  await expect(bookmark).toHaveAttribute('aria-pressed', 'false');
  await book.getByRole('button', { name: 'Copy code example 1', exact: true }).click();
  expect(await page.evaluate(() => window.__copied)).toContain('Map');
  await book.getByRole('button', { name: 'Exit Book Mode', exact: false }).click();
  await expect(search).toHaveValue('HashMap');
  await expect(bookmark).toHaveAttribute('aria-pressed', 'false');
  await search.fill('');
  await bookmark.click();
  await page.reload();
  await expect(bookmark).toHaveAttribute('aria-pressed', 'true');
});

for (const width of [390, 1440]) test(`Book Mode workspace at ${width}px retains demo state and Escape unwinds one reader at a time`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await gotoSeededApp(page, { activeTab: 'javaDigest', homeDemoSeen: true });
  await page.getByRole('button', { name: 'Tech Blogs', exact: true }).click();
  await page.getByText(interactiveCourse.title, { exact: true }).click();
  const lesson = page.getByRole('dialog', { name: `${interactiveCourse.title} full lesson`, exact: true });
  const demo = lesson.getByRole('region', { name: 'Interactive course demo', exact: true });
  await demo.getByRole('button', { name: 'Next', exact: true }).click();
  const progress = demo.getByRole('progressbar', { name: 'Demo progress' });
  await expect(progress).toHaveAttribute('value', '2');
  const book = await openBook(page);
  await expect(progress).toHaveAttribute('value', '2');
  if (width === 390) {
    const lines = await book.getByLabel('Book contents', { exact: true }).evaluate(select => {
      const range = document.createRange();
      range.selectNodeContents(select.parentElement.firstChild);
      return range.getClientRects().length;
    });
    expect(lines).toBe(1);
    await book.getByText('Reading settings', { exact: true }).click();
    await book.getByLabel('Text size', { exact: true }).selectOption('22');
    await expect(book.locator('[data-book-content] p:not([data-book-atomic] *)').first()).toHaveCSS('font-size', '22px');
    await book.getByText('Reading settings', { exact: true }).click();
  }
  await jumpTo(book, 'Explore the concept');
  await demo.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(progress).toHaveAttribute('value', '3');
  await page.screenshot({ path: testInfo.outputPath(`workspace-book-${width}.png`) });
  await book.getByText('Reading settings', { exact: true }).click();
  await book.getByLabel('Expand code or table', { exact: true }).selectOption('0');
  const expanded = page.getByRole('dialog', { name: 'Expanded code or table', exact: true });
  await expect(expanded).toBeVisible();
  await expanded.getByRole('button', { name: 'Close expanded view' }).press('Escape');
  await expect(expanded).not.toBeVisible();
  await expect(book).toBeVisible();
  await book.getByRole('button', { name: 'Exit Book Mode', exact: false }).press('Escape');
  await expect(bookDialog(page)).toHaveCount(0);
  await expect(lesson).toBeVisible();
  await expect(progress).toHaveAttribute('value', '3');
  await lesson.getByRole('button', { name: 'Close lesson reader' }).press('Escape');
  await expect(lesson).toHaveCount(0);
});


test('Book Mode preserves an unsaved exercise and client navigation returns to the current article', async ({ page }) => {
  await page.goto('/learn/spring-transactions');
  const exercise = page.getByRole('textbox', { name: 'Java exercise', exact: true });
  const draft = '// My unsaved boundary repair\nproxy.inner();';
  await exercise.fill(draft);
  let book = await openBook(page);
  await expect(exercise).toHaveValue(draft);
  await jumpTo(book, 'Implement: repair the failing boundary test');
  await exercise.fill(`${draft}\n// Still editing in Book Mode`);
  await book.getByRole('button', { name: 'Exit Book Mode', exact: false }).click();
  await expect(exercise).toHaveValue(`${draft}\n// Still editing in Book Mode`);
  // No Save action was used: retaining this value proves the reader did not remount the lesson.
  await page.goto('/java/hashmap-internals');
  book = await openBook(page);
  await book.getByRole('link', { name: 'HashMap vs ConcurrentHashMap: Differences and Use Cases', exact: true }).click();
  await expect(page).toHaveURL(/\/java\/hashmap-vs-concurrenthashmap$/);
  await expect(bookDialog(page)).toHaveCount(0);
  await expect(page.getByRole('searchbox', { name: 'Search within this article' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Open Book Mode', exact: true })).toHaveCount(1);
  book = await openBook(page);
  await expect(book.locator('h1')).toHaveText('HashMap vs ConcurrentHashMap: Differences and Use Cases');
  await book.getByRole('button', { name: 'Exit Book Mode', exact: false }).click();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('How HashMap Works Internally in Java');
  await expect(page.getByRole('button', { name: 'Open Book Mode', exact: true })).toHaveCount(1);
});


test('printing from Book Mode restores the regular article and emits its complete readable PDF', async ({ page }, testInfo) => {
  const resource = PUBLIC_RESOURCES[0];
  await page.goto(`/resources/${resource.slug}`);
  const book = await openBook(page);
  await expect(book.locator('main')).toHaveCount(1);
  const pdf = await page.pdf({ path: testInfo.outputPath('book-mode-full-article.pdf'), format: 'A4', printBackground: true });
  await expect(bookDialog(page)).toHaveCount(0);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  const main = page.locator('main');
  expect(await main.evaluate(element => element.closest('dialog') === null)).toBe(true);
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(resource.title);
  const text = (await extractResumeTextFromBuffer({ buffer: pdf, fileName: 'book-mode-full-article.pdf', mimeType: 'application/pdf' })).replace(/\s+/g, ' ');
  expect(text).toContain(resource.title);
  // The final checklist item catches a blank print or a print limited to the current spread.
  for (const section of resource.sections) expect(text).toContain(section);
  await page.getByRole('button', { name: 'Open Book Mode', exact: true }).click();
  await expect(bookDialog(page)).toBeVisible();
});


test('Book Mode rejects malformed saved settings and position without making the article unreadable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    localStorage.setItem('interviewiq.book.settings.v1', JSON.stringify({ theme: 'unknown', size: '1000', font: ['serif'], spacing: '-4', layout: 'vertical' }));
    localStorage.setItem('interviewiq.book.position.v1./java/hashmap-internals', JSON.stringify({ stale: true }));
  });
  await page.goto('/java/hashmap-internals');
  const book = await openBook(page);
  await expect(book).toHaveAttribute('data-theme', 'paper');
  await expect(book.locator('h1')).toBeInViewport();
  await book.getByText('Reading settings', { exact: true }).click();
  for (const [label, value] of [['Theme', 'paper'], ['Text size', '18'], ['Font', 'serif'], ['Line spacing', '1.7'], ['Layout', 'spread']]) {
    await expect(book.getByLabel(label, { exact: true })).toHaveValue(value);
  }
  await book.getByRole('button', { name: 'Exit Book Mode', exact: false }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
});
