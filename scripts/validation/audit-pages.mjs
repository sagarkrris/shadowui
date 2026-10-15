import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

// Read-only audit of every concrete route in a freshly built Pages Router app.
// Exercise mutations and workspaces through the separate browser regression suite.
const build = resolve(process.env.AUDIT_BUILD_DIR || '.next');
const origin = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:3102';
const output = process.env.AUDIT_OUTPUT || mkdtempSync(join(tmpdir(), 'interviewiq-page-audit-'));
mkdirSync(output, { recursive: true });
const pages = JSON.parse(readFileSync(join(build, 'server/pages-manifest.json'), 'utf8'));
const prerender = JSON.parse(readFileSync(join(build, 'prerender-manifest.json'), 'utf8'));
const routes = [...new Set([...Object.keys(prerender.routes), ...Object.keys(pages).filter(path => !path.includes('[') && !/^\/(?:api\/|_)/.test(path))])].sort();
writeFileSync(join(output, 'routes.json'), JSON.stringify(routes, null, 2));
const browser = await chromium.launch();
const checks = [];
let cursor = 0;
const jobs = routes.filter(path => !['/practice', '/robots.txt', '/rss.xml', '/sitemap.xml'].includes(path)).flatMap(path => [390, 1280].map(width => ({ path, width })));
try {
  await Promise.all(Array.from({ length: 2 }, async () => {
    const context = await browser.newContext({ serviceWorkers: 'block', colorScheme: 'light' });
    const page = await context.newPage();
    while (cursor < jobs.length) {
      const { path, width } = jobs[cursor++];
      const errors = [];
      const onError = error => errors.push(error.message);
      page.on('pageerror', onError);
      const result = { path, width };
      try {
        await page.setViewportSize({ width, height: 900 });
        result.status = (await page.goto(`${origin}${path}`, { waitUntil: 'load', timeout: 30000 })).status();
        await page.locator('h1').first().waitFor({ state: 'visible', timeout: 10000 });
        if (/^\/(?:java|tech-blogs|guides|spring|sql|python|aws|javascript|system-design)\/.+/.test(path) && path !== '/java/roadmap') {
          // ReaderTools adds stable section IDs after hydration.
          await page.locator('.reader-tools').waitFor({ state: 'attached', timeout: 10000 });
        }
        Object.assign(result, await page.evaluate(() => ({
          title: document.title,
          headings: [...document.querySelectorAll('h1')].map(el => el.textContent.trim()),
          overflow: document.documentElement.scrollWidth - innerWidth,
          mainOverflow: [...document.querySelectorAll('main')].map(el => el.scrollWidth - el.clientWidth),
          nestedCodeBlocks: document.querySelectorAll('pre pre').length,
          ids: [...document.querySelectorAll('[id]')].map(el => el.id),
          links: [...document.querySelectorAll('a[href]')].map(el => el.getAttribute('href')),
        })));
        await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
        result.accessibility = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, html: n.html.slice(0, 400), summary: n.failureSummary })) })));
        result.errors = errors;
        result.passed = result.status === (path === '/404' ? 404 : 200) && result.headings.length > 0 && result.overflow <= 1 && result.mainOverflow.every(x => x <= 1) && result.nestedCodeBlocks === 0 && !errors.length && !result.accessibility.length;
      } catch (error) { result.passed = false; result.error = error.message; result.errors = errors; }
      if (!result.passed) {
        const filename = `${path.replace(/[^a-z0-9]/gi, '_') || 'home'}-${width}.png`;
        try { await page.screenshot({ path: join(output, filename) }); result.screenshot = filename; } catch { /* Preserve the diagnostic even if a page crashed. */ }
      }
      checks.push(result);
      appendFileSync(join(output, 'pages.jsonl'), `${JSON.stringify(result)}\n`);
      if (checks.length % 25 === 0) console.log(`${checks.length}/${jobs.length} page/viewport checks; ${checks.filter(r => !r.passed).length} failures`);
      page.off('pageerror', onError);
    }
    await context.close();
  }));
} finally { await browser.close(); }
const destinations = new Map(checks.filter(r => r.ids).map(r => [r.path, new Set(r.ids)]));
const fragmentFailures = new Map();
const internalLinks = new Set();
for (const result of checks) for (const href of result.links || []) {
  try {
    const url = new URL(href, `${origin}${result.path}`);
    if (url.origin !== origin) continue;
    internalLinks.add(`${url.pathname}${url.search}`);
    const target = destinations.get(url.pathname.replace(/\/$/, '') || '/');
    if (url.hash.length > 1 && target && !target.has(decodeURIComponent(url.hash.slice(1)))) {
      fragmentFailures.set(`${result.path} → ${href}`, { from: result.path, href });
    }
  } catch { fragmentFailures.set(`${result.path} → ${href}`, { from: result.path, href, invalid: true }); }
}
const linkFailures = [];
let linkCursor = 0;
const links = [...internalLinks];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (linkCursor < links.length) {
    const path = links[linkCursor++];
    try { const response = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(20000) }); await response.arrayBuffer(); if (!response.ok) linkFailures.push({ path, status: response.status }); }
    catch (error) { linkFailures.push({ path, error: error.message }); }
  }
}));
const report = { origin, routes: routes.length, checkedPages: jobs.length, passedPages: checks.filter(r => r.passed).length, failedPages: checks.filter(r => !r.passed), internalLinks: links.length, linkFailures, fragmentFailures: [...fragmentFailures.values()], coverage: { appearance: 'light', widths: [390, 1280], workspace: 'Covered by the seeded workspace regression suite', feedsAndRobots: 'Covered by the route HTTP inventory and indexing tests' } };
writeFileSync(join(output, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, failedPages: report.failedPages.map(({ path, width, error }) => ({ path, width, error })) }, null, 2));
console.log(`Page audit evidence: ${output}`);
process.exitCode = report.failedPages.length || linkFailures.length || fragmentFailures.size ? 1 : 0;
