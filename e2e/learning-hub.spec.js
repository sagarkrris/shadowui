import { test, expect } from '@playwright/test';
import { LEARNING_PATHS } from '../lib/learningHub.mjs';
import { learningCatalogue } from '../lib/learningCatalog.mjs';

test('all roadmaps have resolving activity destinations and ordered course anchors', async ({ request }) => {
  const hrefs = new Set(LEARNING_PATHS.flatMap(p=>p.stages.flatMap(s=>s.activities.map(a=>a.href))).filter(h=>!h.startsWith('#')).map(h=>h.split('#')[0]));
  for(const href of hrefs) expect((await request.get(href)).status(),href).toBe(200);
  for(const slug of ['full-stack','system-design','ai-engineering']) expect((await request.get(`/learn/roadmaps/${slug}`)).status()).toBe(200);
  expect((await request.get('/learn/roadmaps/unknown')).status()).toBe(404);
  expect((await request.get('/labs/unknown')).status()).toBe(404);
});
test('roadmap completion, weak-stage priority, and reflection persist through reload', async ({ page }) => {
  await page.goto('/learn/roadmaps/system-design');
  await page.getByRole('checkbox',{name:'Completed Requirements and capacity: Learn',exact:true}).check();
  await page.getByRole('checkbox',{name:'I need to revisit Storage and consistency',exact:true}).check();
  await expect(page.getByRole('link',{name:'Review weak stage: Storage and consistency →',exact:true})).toBeVisible();
  await page.locator('#review-storage summary').click();
  await page.getByLabel('Reflection for Storage and consistency').fill('The local log model does not implement durable replication.');
  await page.reload();
  await expect(page.getByRole('checkbox',{name:'Completed Requirements and capacity: Learn',exact:true})).toBeChecked();
  await page.locator('#review-storage summary').click();
  await expect(page.getByLabel('Reflection for Storage and consistency')).toHaveValue(/durable replication/);
  await page.goto('/learn');
  await expect(page.getByText('1/20 activities complete · 1 weak stages')).toBeVisible();
  await expect(page.getByRole('link',{name:'Review a weak area: System Design →'})).toBeVisible();
});
test('lesson completion and weakness flow from a public lesson to the shared map', async ({ page }) => {
  await page.goto('/tech-blogs/java-money-production#lesson-1');
  const lesson=page.locator('#lesson-1');
  await lesson.getByRole('checkbox',{name:'I completed this lesson and its self-check'}).check();
  await lesson.getByRole('checkbox',{name:'I need another attempt at this lesson'}).check();
  await page.goto('/learn');
  await expect(page.getByText(/1 of \d+ catalogue lessons complete · 1 lessons marked/)).toBeVisible();
  await expect(page.getByRole('link',{name:/Revisit/})).toBeVisible();
  await page.getByRole('searchbox',{name:'Search courses and lessons'}).fill('Java Money');
  await expect(page.getByText('1 catalog entry')).toBeVisible();
  await page.getByText('Ordered lessons and checkpoints',{exact:true}).click();
  await expect(page.getByText(/· complete · revisit/)).toBeVisible();
});
test('blocked storage retains consecutive visit-only changes and warns honestly', async ({ page }) => {
  await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('blocked');};});
  await page.goto('/learn/roadmaps/system-design');
  await page.getByRole('checkbox',{name:'Completed Requirements and capacity: Learn',exact:true}).check();
  await page.getByRole('checkbox',{name:'Completed Requirements and capacity: Experiment',exact:true}).check();
  await expect(page.getByText('2 of 20 activities complete')).toBeVisible();
  await expect(page.getByText('Could not save. Copy your notes before leaving; changes last only for this visit.')).toBeVisible();
});
test('labs recompute, reset, and expose their boundaries', async ({ page }) => {
  await page.goto('/labs/cache'); await page.getByLabel('Cache capacity').fill('3'); await expect(page.getByText('4 hits; 3 misses')).toBeVisible();
  await page.getByRole('button',{name:'Reset experiment'}).click(); await expect(page.getByLabel('Cache capacity')).toHaveValue('2');
  await page.goto('/labs/concurrency'); await expect(page.getByText('Final counter: 1')).toBeVisible(); await page.getByLabel('Serialize the complete increment').check(); await expect(page.getByText('Final counter: 2')).toBeVisible();
  await page.goto('/labs/indexes'); await page.getByLabel('Lookup target (65 is absent)').fill('65'); await expect(page.getByText('Absent: linear 64 comparisons; binary 7')).toBeVisible();
  await page.goto('/labs/queues'); await page.getByLabel('Arrivals per tick').fill('8'); await expect(page.getByText('6 served; 6 queued; 20 rejected')).toBeVisible();
  await page.goto('/labs/agents'); await expect(page.getByText('Paused: approval required before write')).toBeVisible(); await page.getByLabel('Simulate application approval for write').check(); await expect(page.getByText('Completed 3 simulated steps')).toBeVisible(); await page.getByLabel('Maximum steps').fill('0'); await expect(page.getByText('Stopped: step budget exhausted')).toBeVisible();
});
// Give each course its own timeout so catalogue growth cannot exhaust one shared budget.
for(const course of learningCatalogue().filter(course=>course.id!=='java-fundamentals')) {
  test(`catalogue course ${course.id} exposes contextual practice and real anchors`, async ({ page }) => {
    await page.goto(course.href);
    for(const lesson of course.lessons) {
      const section=page.getByRole('region',{name:`Practice ${lesson.title}`,exact:true});
      await expect(section).toBeAttached();
      await expect(section.getByRole('link',{name:'Practise this lesson with Tech Buddy →'})).toHaveAttribute('href',/buddyTopic=/);
      const anchor=lesson.href.split('#')[1];
      if(anchor) await expect(page.locator(`[id="${anchor}"]`)).toHaveCount(1);
    }
  });
}
test('Java fundamentals chapter exposes contextual practice', async ({ page }) => {
  await page.goto('/java/tutorial/jdk-vs-jre-vs-jvm'); await expect(page.getByRole('region',{name:'Practice JDK vs JRE vs JVM',exact:true})).toBeAttached();
});
test('legacy backend and digest completion appear without corrupting saved data', async ({ page }) => {
  await page.goto('/learn');
  await page.evaluate(()=>{localStorage.setItem('interviewiq.javaBackendJourney.v1',JSON.stringify(['foundations:Learn']));localStorage.setItem('interviewiq.javaDigestProgress.v1',JSON.stringify({version:1,state:{completedTutorials:['catalog-1','catalog-1','obsolete']}}));});
  await page.reload(); await expect(page.getByText('1/30 activities complete · 0 weak stages')).toBeVisible(); await expect(page.getByText(/1 of \d+ catalogue lessons complete/)).toBeVisible();
});
for(const width of [390,1440]) test(`hub, roadmaps, and labs fit and pass accessibility at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});
  for(const path of ['/learn','/learn/roadmaps/full-stack','/learn/roadmaps/ai-engineering','/learn/ai-engineering','/labs','/labs/indexes','/labs/agents']) {
    await page.goto(path); expect(await page.locator('[data-reader-scroll]').evaluate(el=>el.scrollWidth-el.clientWidth),path).toBeLessThanOrEqual(1);
    await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});
    expect(await page.evaluate(async()=> (await window.axe.run('main',{runOnly:['wcag2a','wcag2aa','wcag21aa']})).violations),path).toEqual([]);
  }
  await page.goto('/learn'); await page.screenshot({path:test.info().outputPath(`learning-hub-${width}.png`)});
});

test('Spring courses connect the catalog, lesson progress, topic answers and downloadable lab', async ({ page, request }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/learn');
  await page.getByRole('searchbox', { name: 'Search courses and lessons' }).fill('Spring Framework');
  await page.getByRole('link', { name: 'Spring Framework from first bean to production boundaries' }).click();
  await page.getByRole('link', { name: 'Transactions and proxy boundaries', exact: true }).click();
  await expect(page).toHaveURL(/#transactions$/);
  const lesson = page.getByRole('region', { name: 'Transactions and proxy boundaries' });
  const buddyLink = lesson.getByRole('link', { name: 'Practise this lesson with Tech Buddy →' });
  await expect(buddyLink).toHaveAttribute('href', /lessonHref=%2Flearn%2Fspring%2Fspring-framework%23transactions/);
  await lesson.getByText('Failure cases and interview follow-up').click();
  await expect(lesson.getByText(/test-owned transaction/)).toBeVisible();
  await lesson.getByRole('checkbox', { name: 'I completed this lesson and its self-check' }).check();
  await page.reload();
  await expect(lesson.getByRole('checkbox', { name: 'I completed this lesson and its self-check' })).toBeChecked();

  await page.getByRole('link', { name: 'Get the project and run the labs' }).click();
  await page.getByText('Download project files').click();
  for (const link of await page.locator('a[download]').all()) {
    const href = await link.getAttribute('href');
    expect((await request.get(href)).status(), href).toBe(200);
  }
  await expect(page.getByRole('heading', { name: 'Capstone acceptance criteria' })).toBeVisible();

  await page.goto('/senior-java-interview/topics/spring-boot#spring-boot-001');
  const firstAnswer = page.locator('[data-interview-question]').first();
  await firstAnswer.getByText('Tier 4 · Deep dive and verification').click();
  await firstAnswer.getByRole('link', { name: 'Worked example and runnable checkpoint' }).click();
  await expect(page).toHaveURL(/spring-boot#startup$/);
});

test('Spring annotation guide explains proxy and startup behavior at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/learn/spring/spring-framework#transactions');
  const lesson = page.getByRole('region', { name: 'Transactions and proxy boundaries' });
  await lesson.getByRole('link', { name: 'Annotation internals for this lesson' }).click();
  await expect(page).toHaveURL(/annotation-internals#transaction-cases$/);
  await expect(page.getByText('One row survives.', { exact: true })).toBeVisible();
  await expect(page.getByText('Zero rows survive.', { exact: true }).first()).toBeVisible();
  const navigation = page.getByRole('navigation', { name: 'Annotation topics' });
  await navigation.getByRole('link', { name: '@Autowired, @Qualifier and @Primary' }).click();
  const injection = page.getByRole('region', { name: '@Autowired, @Qualifier and @Primary' });
  await injection.getByText('Edge cases, verification and follow-up').click();
  await expect(injection.getByText(/Constructor cycles cannot both complete/)).toBeVisible();
  expect(await page.locator('main').evaluate(main => main.scrollWidth <= main.clientWidth)).toBe(true);
});

test('Hibernate course connects interview answers, tracked lessons and runnable project files', async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/senior-java-interview/topics/hibernate');
  const answer = page.locator('[data-interview-question]').first();
  await answer.getByText('Tier 4 · Deep dive and verification').click();
  await answer.getByRole('link', { name: 'Worked example and runnable checkpoint' }).click();
  await expect(page).toHaveURL(/learn\/hibernate#setup$/);

  const navigation = page.getByRole('navigation', { name: 'Hibernate course contents' });
  await navigation.getByRole('link', { name: 'Optimistic and pessimistic concurrency' }).click();
  const lesson = page.getByRole('region', { name: 'Optimistic and pessimistic concurrency' });
  await lesson.getByText('Edge cases and interview follow-up').click();
  await expect(lesson.getByText(/Bulk updates normally bypass automatic version checks/)).toBeVisible();
  await lesson.getByRole('checkbox', { name: 'I completed this lesson and its self-check' }).check();
  await page.reload();
  await expect(lesson.getByRole('checkbox', { name: 'I completed this lesson and its self-check' })).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.getByRole('link', { name: 'Get the project and run the labs' }).click();
  await page.getByText('Download project files').click();
  const downloads = page.locator('a[download]');
  await expect(downloads).toHaveCount(8);
  for (const link of await downloads.all()) {
    const href = await link.getAttribute('href');
    expect((await request.get(href)).status(), href).toBe(200);
  }
  await expect(page.getByRole('heading', { name: 'Acceptance criteria' })).toBeVisible();
});

test('Java and Micronaut course connects interview answers, Java bridge and runnable downloads', async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/senior-java-interview/topics/micronaut');
  const answer = page.locator('[data-interview-question]').first();
  await answer.getByText('Tier 4 · Deep dive and verification').click();
  await answer.getByRole('link', { name: 'Worked example and runnable checkpoint' }).click();
  await expect(page).toHaveURL(/learn\/micronaut#di$/);

  await page.getByText('Java bridge', { exact: true }).click();
  for (const link of await page.locator('details[open] a[href^="/java/tutorial/"]').all()) {
    const href = await link.getAttribute('href');
    expect((await request.get(href)).status(), href).toBe(200);
  }
  const navigation = page.getByRole('navigation', { name: 'Micronaut course contents' });
  await navigation.getByRole('link', { name: 'Trace generated interception and same-class calls' }).click();
  const lesson = page.getByRole('region', { name: 'Trace generated interception and same-class calls' });
  await lesson.getByText('Edge cases and interview follow-up').click();
  await expect(lesson.getByText(/Private or final methods cannot be overridden/)).toBeVisible();
  await lesson.getByRole('checkbox', { name: 'I completed this lesson and its self-check' }).check();
  await page.reload();
  await expect(lesson.getByRole('checkbox', { name: 'I completed this lesson and its self-check' })).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.getByRole('link', { name: 'Get the project and run the labs' }).click();
  await page.getByText('Download project files').click();
  const downloads = page.locator('a[download]');
  await expect(downloads).toHaveCount(13);
  for (const link of await downloads.all()) {
    const href = await link.getAttribute('href');
    expect((await request.get(href)).status(), href).toBe(200);
  }
  await expect(page.getByRole('heading', { name: 'Acceptance criteria' })).toBeVisible();
});

test('Standalone Java course connects the Java guide, tracked lessons and the indexer download', async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/senior-java-interview/topics/java');
  const answer = page.locator('[data-interview-question]').first();
  await answer.getByText('Tier 4 · Deep dive and verification').click();
  await answer.getByRole('link', { name: 'Worked example and runnable checkpoint' }).click();
  await expect(page).toHaveURL(/learn\/java#objects$/);

  await page.getByText('Start here if Java is new to you').click();
  for (const link of await page.locator('details[open] a[href^="/java/tutorial/"]').all()) {
    const href = await link.getAttribute('href');
    expect((await request.get(href)).status(), href).toBe(200);
  }
  const navigation = page.getByRole('navigation', { name: 'Standalone Java course contents' });
  await navigation.getByRole('link', { name: 'Publish a versioned snapshot and recover after restart' }).click();
  const lesson = page.getByRole('region', { name: 'Publish a versioned snapshot and recover after restart' });
  await lesson.getByText('Edge cases and interview follow-up').click();
  await expect(lesson.getByText(/no power-loss durability guarantee/)).toBeVisible();
  await lesson.getByRole('checkbox', { name: 'I completed this lesson and its self-check' }).check();
  await page.reload();
  await expect(lesson.getByRole('checkbox', { name: 'I completed this lesson and its self-check' })).toBeChecked();

  await page.getByRole('link', { name: 'Get the indexer and run the labs' }).click();
  await page.getByText('Download project files').click();
  const downloads = page.locator('a[download]');
  await expect(downloads).toHaveCount(11);
  for (const link of await downloads.all()) {
    const href = await link.getAttribute('href');
    expect((await request.get(href)).status(), href).toBe(200);
  }
  await expect(page.getByRole('heading', { name: 'Observe the JVM' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
