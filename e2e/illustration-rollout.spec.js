import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { gotoSeededApp, mockDsaChallenges } from './helpers/app.js';
import { COURSE_DIAGRAMS } from '../lib/techBlogDiagrams.mjs';

test.use({ serviceWorkers: 'block' });

for (const width of [375,1366]) {
  test(`course artwork preserves branching, exports and resets at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({width,height:900});
    await page.goto('/tech-blogs/caching-patterns-java');
    const figure = page.locator('[data-course-diagram="cache"]').first();
    const svg = figure.locator('svg');
    await expect(svg).toHaveAttribute('data-diagram-artwork','cache');
    await expect(svg.locator('path[marker-end]')).toHaveCount(COURSE_DIAGRAMS.cache.edges.length);
    for (const [from,to] of COURSE_DIAGRAMS.cache.edges) await expect(svg.locator(`[data-artwork-edge="${from}:${to}"]`)).toHaveCount(1);
    const initial = await svg.evaluate(el => el.getBoundingClientRect().width);
    await figure.getByRole('button',{name:'Enlarge illustration',exact:true}).click();
    expect(await svg.evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThan(initial);
    const pending = page.waitForEvent('download');
    await figure.getByRole('button',{name:'Download SVG',exact:true}).click();
    const file = await pending;
    const source = await readFile(await file.path(),'utf8');
    expect(source).toContain('CONNECTION KEY');
    const preview = await page.context().newPage();
    await preview.goto(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`);
    await expect(preview.getByRole('img')).toBeVisible();
    await preview.locator('svg').screenshot({path:testInfo.outputPath(`cache-export-${width}.png`)});
    await preview.close();
    await figure.getByRole('button',{name:'Text view',exact:true}).click();
    await expect(svg).toBeHidden();
    await expect(figure.getByRole('listitem').filter({hasText:'miss'})).toContainText('Load source');
    await figure.getByRole('button',{name:'Diagram',exact:true}).click();
    await figure.getByRole('button',{name:'Reset illustration size',exact:true}).click();
    expect(await svg.evaluate(el => el.getBoundingClientRect().width)).toBe(initial);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1)).toBe(true);
  });

  test(`tutorial, system-design, solution-board and time-machine artwork at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({width,height:900});
    const cases = [
      ['/java/tutorial/dependency-inversion','authored-flow'],
      ['/system-design/visual-guide','system-design-guide'],
      ['/hld/url-shortener','design-board'],
      ['/lld/seat-reservation','design-board'],
    ];
    for (const [route,key] of cases) {
      await page.goto(route);
      const svg=page.locator(`svg[data-diagram-artwork="${key}"]`).first();
      await expect(svg).toBeVisible();
      if (key !== 'design-board') await expect(svg.locator('path[marker-end]').first()).toBeAttached();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1)).toBe(true);
      if (route === '/system-design/visual-guide') await svg.screenshot({path:testInfo.outputPath(`system-guide-${width}.png`)});
    }
    await page.goto('/time-machine/database-decisions');
    await page.getByRole('radio',{name:'Cache catalogue reads'}).check();
    await page.getByRole('button',{name:'Record decision and move forward'}).click();
    const design=page.getByRole('figure',{name:'Before and after design'}).last();
    await expect(design.locator('[data-diagram-artwork="time-machine"]')).toHaveCount(2);
    await expect(design.getByRole('region',{name:'After design',exact:true})).toContainText('Catalogue cache');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1)).toBe(true);
  });
}

test('AI comparison pictures track focus without inventing execution arrows', async ({ page }) => {
  await gotoSeededApp(page,{activeTab:'course',homeDemoSeen:true});
  const beginner=page.locator('#beginner-genai');
  await beginner.getByLabel('Choose a lesson').selectOption('4');
  const guide=beginner.getByRole('region',{name:'Visual guide: Match the missing capability'});
  const svg=guide.locator('[data-diagram-artwork="ai-lesson"]');
  await expect(svg.locator('path[marker-end]')).toHaveCount(0);
  await guide.locator('[data-visual-steps] button').last().click();
  await expect(svg.locator('text').filter({hasText:'FOCUS'})).toHaveCount(1);
  await expect(guide.locator('[data-visual-steps] button').last()).toHaveAttribute('aria-pressed','true');
  await expect(svg.locator('[data-diagram-node]').last()).toContainText('FOCUS');
});

test('workspace tutorial previews use the same illustrated flow as public articles', async ({ page }) => {
  await gotoSeededApp(page,{activeTab:'javaDigest',homeDemoSeen:true});
  await page.getByRole('navigation',{name:'Java Digest sections'}).getByRole('button',{name:'Tutorial Library',exact:true}).click();
  await page.getByText('Read full chapter',{exact:true}).first().click();
  await expect(page.locator('[data-flow-kind]').first().locator('[data-diagram-artwork="authored-flow"]')).toBeVisible();
  await expect(page.locator('[data-flow-kind]').first().locator('[data-source-preserved]')).toHaveCount(1);
  await expect(page.locator('[data-flow-kind]').first().getByRole('region',{name:/original relationships$/})).toContainText('Greeting.class bytecode');
});

test('design workspaces retain selected steps and revision warnings', async ({ page }) => {
  await gotoSeededApp(page,{activeTab:'designLab',homeDemoSeen:true});
  await expect(page.locator('[data-diagram-artwork="design-pattern-flow"]').first()).toBeVisible();
  await page.getByRole('button',{name:'Next diagram step',exact:true}).first().click();
  await expect(page.locator('[data-diagram-artwork="design-pattern-flow"]').first().locator('[data-diagram-node="step-1"]')).toContainText('FOCUS');
  await page.getByRole('button',{name:'OOD / UML',exact:true}).click();
  await expect(page.locator('[data-diagram-artwork="uml-classes"]').first()).toBeVisible();
  await page.getByRole('button',{name:'Agentic AI',exact:true}).click();
  await expect(page.locator('[data-diagram-artwork="agent-architecture"]').first()).toBeVisible();
  await page.getByRole('button',{name:'Revise a design',exact:true}).click();
  const workshop=page.getByRole('region',{name:'Design revision workspace'});
  await workshop.getByRole('button',{name:'Freeze baseline and introduce provider outage'}).click();
  await expect(workshop.locator('[data-diagram-artwork="editable-revision"]')).toHaveCount(2);
  await expect(workshop.getByRole('region',{name:'Failure path review'})).not.toBeEmpty();
  await page.getByRole('button',{name:'Continue in System Canvas',exact:true}).click();
  await expect(page.locator('[data-diagram-artwork="system-canvas"]').first()).toBeVisible();
});

test('DSA pictures preserve live input and next-step interaction', async ({ page }) => {
  await mockDsaChallenges(page,{fail:true});
  await gotoSeededApp(page,{activeTab:'dsaLab',selectedCat:'DSA',selectedSub:'Arrays & Strings'});
  await page.getByRole('button',{name:'Visualize',exact:true}).first().click();
  const picture=page.locator('[data-diagram-artwork="dsa-array"]').first();
  await expect(picture).toBeVisible();
  const values=await picture.locator('strong').allTextContents();
  expect(values.length).toBeGreaterThan(0);
  await expect(picture).toContainText('i=0');
  await page.getByRole('button',{name:'Next',exact:true}).last().click();
  await expect(page.getByRole('button',{name:'Previous',exact:true}).last()).toBeEnabled();
  expect(await picture.locator('strong').allTextContents()).toEqual(values);
});
