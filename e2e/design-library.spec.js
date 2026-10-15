import { test, expect } from '@playwright/test';
import { DESIGN_PROBLEMS, designHref } from '../lib/designLibrary.mjs';
import { readFile } from 'node:fs/promises';

test('catalog filters, progress and revisit flags persist across reloads', async ({ page }) => {
  await page.goto('/hld');
  await expect(page.getByRole('heading', { level:1 })).toContainText('High-level design');
  await page.getByRole('searchbox').fill('url shortener');
  await expect(page.getByRole('status')).toContainText('1 of 12');
  await page.getByRole('checkbox', {name:'Completed: Design a URL shortener',exact:true}).check();
  await page.getByRole('button', {name:'Revisit: Design a URL shortener',exact:true}).click();
  await page.reload();
  await page.getByLabel('Progress', {exact:true}).selectOption('Completed');
  await expect(page.getByRole('status')).toContainText('1 of 12');
  await expect(page.getByRole('button', {name:'Revisit: Design a URL shortener',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button', {name:'Clear filters',exact:true}).click();
  await page.getByRole('searchbox').fill('no-such-design');
  await expect(page.getByRole('heading',{name:'No matching problems'})).toBeVisible();
});

test('solution tabs, keyboard access, downloads and notes survive navigation', async ({ page }) => {
  await page.goto('/lld/seat-reservation');
  await page.getByRole('tab',{name:'Diagram',exact:true}).press('ArrowRight');
  await expect(page.getByRole('tab',{name:'Walkthrough',exact:true})).toBeFocused();
  await expect(page.getByRole('tabpanel')).toContainText('generation token');
  await page.getByRole('tab',{name:'Java model',exact:true}).click();
  await expect(page.getByRole('tabpanel')).toContainText('public class SeatHold');
  const download = page.waitForEvent('download');
  await page.getByRole('button',{name:'Download Java source',exact:true}).click();
  expect((await download).suggestedFilename()).toBe('SeatHold.java');
  await page.getByRole('button',{name:'Close solution',exact:true}).click();
  await page.getByLabel('Requirements, diagram outline & trade-offs').fill('Compare the hold generation at commit.');
  await page.reload();
  await page.getByRole('button',{name:'Close solution',exact:true}).click();
  await expect(page.getByLabel('Requirements, diagram outline & trade-offs')).toHaveValue('Compare the hold generation at commit.');
  await page.goto('/hld/rate-limiter');
  await page.getByRole('button',{name:'Close solution',exact:true}).click();
  await expect(page.getByLabel('Requirements, diagram outline & trade-offs')).toHaveValue('');
});

test('reference board includes all six sections and exports a populated portable SVG', async ({ page }) => {
  await page.goto('/hld/url-shortener');
  const board = page.getByRole('img',{name:'Design a URL shortener — reference diagram',exact:true});
  await expect(board).toBeVisible();
  const labels = await board.locator('text').allTextContents();
  for (const label of ['Functional requirements','Non-functional requirements','Capacity & assumptions','System architecture','API design','Data model & ownership','Key design decisions']) expect(labels).toContain(label);
  const overflow = await board.locator('g[data-board-card] text').evaluateAll(elements => elements.filter(element => {
    const box=element.getBBox();
    const parent=element.parentElement;
    return box.x + box.width > 278 || box.y + box.height > Number(parent.dataset.cardHeight)-6;
  }).map(element => element.textContent));
  expect(overflow).toEqual([]);
  const download = page.waitForEvent('download');
  await page.getByRole('button',{name:'Download SVG',exact:true}).click();
  const file = await download;
  const svg = await readFile(await file.path(),'utf8');
  expect(svg).toContain('viewBox="0 0 900 ');
  expect(svg).toContain('Functional requirements');
  expect(svg).toContain('Key design decisions');
  expect(svg).toContain('Link database');
  expect(svg.length).toBeGreaterThan(10000);
});

test('mobile catalog and workspace stack without document overflow', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  for (const path of ['/hld','/lld','/hld/url-shortener','/lld/lru-cache']) {
    await page.goto(path);
    await expect(page.getByRole('heading',{level:1})).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (path.split('/').length > 2) {
      const description = page.locator('[class*="description"]').first();
      const center = page.getByRole('region',{name:'Reference solution',exact:true});
      const a = await description.boundingBox(), b = await center.boundingBox();
      expect(b.y).toBeGreaterThanOrEqual(a.y+a.height-1);
      await page.getByRole('button',{name:'Close solution',exact:true}).click();
      await expect(page.getByLabel('Requirements, diagram outline & trade-offs')).toBeEditable();
    }
  }
});

test('unavailable storage preserves notes and completion in the current session', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Full','QuotaExceededError'); }; });
  await page.goto('/hld/url-shortener');
  await page.getByRole('button',{name:'Mark completed',exact:true}).click();
  await page.getByRole('button',{name:'Close solution',exact:true}).click();
  await page.getByLabel('Requirements, diagram outline & trade-offs').fill('Keep my session notes');
  await expect(page.getByRole('button',{name:'✓ Completed',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByLabel('Requirements, diagram outline & trade-offs')).toHaveValue('Keep my session notes');
  await expect(page.getByRole('status').filter({hasText:'notes are only kept'})).toBeVisible();
});

for (const track of ['hld','lld']) test(`${track.toUpperCase()}: every listed solution renders its own walkthrough and checks`, async ({ page }) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const problem of DESIGN_PROBLEMS.filter(p => p.track === track)) {
    const response = await page.goto(designHref(problem));
    expect(response.status()).toBe(200);
    await expect(page.getByRole('heading',{level:1})).toHaveText(problem.title);
    await expect(page.getByRole('img',{name:`${problem.title} — reference diagram`})).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const clipped = await page.locator('g[data-board-card] text').evaluateAll(elements => elements.filter(element => {
      const box=element.getBBox();
      return box.x+box.width>278 || box.y+box.height>Number(element.parentElement.dataset.cardHeight)-6;
    }).map(element=>element.textContent));
    expect(clipped).toEqual([]);
    await page.getByRole('tab',{name:'Walkthrough',exact:true}).click();
    await expect(page.getByRole('tabpanel')).toContainText(problem.steps[0]);
    await page.getByRole('tab',{name:'Checks',exact:true}).click();
    await expect(page.getByRole('tabpanel')).toContainText(problem.checks[0]);
    expect(errors, `${problem.slug} should hydrate without client errors`).toEqual([]);
  }
});

for (const width of [390, 1280]) test(`solution tabs remain accessible at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  for (const path of ['/hld/url-shortener', '/lld/seat-reservation']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    const tabs = await page.getByRole('tab').allTextContents();
    for (const name of tabs) {
      await page.getByRole('tab', { name, exact: true }).click();
      expect(await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations), `${path}: ${name}`).toEqual([]);
    }
  }
});
