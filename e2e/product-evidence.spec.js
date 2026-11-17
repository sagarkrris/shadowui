import {test,expect} from '@playwright/test';
import {createSessionSnapshot,SESSION_STORAGE_KEY} from './helpers/app.js';

test.use({serviceWorkers:'block'});
test('shared checklist values remain explicitly unverified even with forged URL claims',async({page})=>{
  await page.goto('/share/readiness?score=99&verified=true&source=official');
  await expect(page.getByRole('heading',{level:1})).toHaveText('Self-reported preparation checklist');
  await expect(page.getByRole('note')).toContainText('Anyone can change them');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content',/Self-reported/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex, nofollow');
  await page.goto('/share/readiness?score=101');
  await expect(page.getByText('No valid value supplied',{exact:true})).toBeVisible();
});
test('evidence dashboard separates disputes, historical scores and version-matched retests',async({page})=>{
  const common={answer:'I explain the actual boundary.',question:'Explain locking.',topic:'Concurrency',rubricVersion:1,difficulty:'Senior',round:'coding',assessmentMeta:{model:'fixture',promptVersion:'v2',contentVersion:'q1',settingsVersion:'s1'}};
  const session=createSessionSnapshot();session.snapshot.practice={attempts:[{...common,id:'first',score:6},{...common,id:'fresh',parentId:'first',score:8},{...common,id:'disputed',score:10,assessmentReview:{exclude:true}}]};
  await page.addInitScript(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:SESSION_STORAGE_KEY,value:session});
  await page.goto('/progress');
  await expect(page.getByRole('heading',{name:'Recorded practice evidence',exact:true})).toBeVisible();
  await expect(page.getByText('1 comparable pairs · 1 improved scores.',{exact:false})).toBeVisible();
  await expect(page.getByText('Concurrency: +2/10 compared with its original attempt.',{exact:true})).toBeVisible();
  const topic=page.getByRole('article').filter({has:page.getByRole('heading',{name:'Concurrency',exact:true})});
  await expect(topic).toContainText('2 assessed answers');
  await expect(page.getByRole('link',{name:'Take the optional baseline diagnostic'})).toHaveAttribute('href','/diagnostic');
});
test('privacy contact and optional measurement consent work without collecting private query values',async({page})=>{
  const sent=[];
  await page.route('**/api/analytics',route=>{
    const method=route.request().method();
    if(method==='POST'){sent.push(route.request().postDataJSON());return route.fulfill({status:202,json:{stored:true}});}
    return route.fulfill({json:{enabled:true,retentionDays:30}});
  });
  await page.goto('/privacy?answer=private-query');
  await expect(page.getByRole('link',{name:'sgrkrishna23@gmail.com'})).toHaveAttribute('href',/^mailto:sgrkrishna23@gmail\.com/);
  const optIn=page.getByRole('checkbox',{name:'Allow optional product measurements on this browser'});
  await expect(optIn).toBeEnabled();await expect(optIn).not.toBeChecked();expect(sent).toHaveLength(0);
  await optIn.check();await page.goto('/learn?answer=private-query');
  await expect.poll(()=>sent.length).toBeGreaterThan(0);
  expect(JSON.stringify(sent)).not.toContain('private-query');expect(sent.every(event=>event.consent===true)).toBe(true);
  await page.goto('/privacy');await optIn.uncheck();const count=sent.length;await page.goto('/learn');
  expect(sent).toHaveLength(count);
});
test('blocked browser storage leaves privacy readable and optional measurements disabled',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Blocked','SecurityError');}}));
  await page.goto('/privacy');
  await expect(page.getByRole('heading',{name:'Privacy and your data',exact:true})).toBeVisible();
  await expect(page.getByText('Browser storage is unavailable. Optional measurements remain off.',{exact:true})).toBeVisible();
  await expect(page.getByRole('checkbox',{name:'Allow optional product measurements on this browser'})).toBeDisabled();
});
test('measurement deletion preserves a newer preference from another tab',async({page,context})=>{
  let release,deletedId;
  const wait=new Promise(resolve=>{release=resolve;});
  await page.route('**/api/analytics',async route=>{
    if(route.request().method()==='DELETE'){deletedId=route.request().postDataJSON().visitorId;await wait;return route.fulfill({json:{deleted:true}});}
    return route.fulfill({status:202,json:{stored:true}});
  });
  await page.goto('/privacy');await page.getByRole('checkbox',{name:'Allow optional product measurements on this browser'}).check();
  const previous=await page.evaluate(()=>JSON.parse(localStorage.getItem('interviewiq.analyticsConsent.v1')).visitorId);
  await page.getByRole('button',{name:'Delete collected browser measurements'}).click();
  await expect.poll(()=>deletedId).toBe(previous);
  const other=await context.newPage();await other.goto('/privacy');
  const current=await other.evaluate(()=>{const value={version:1,enabled:true,visitorId:crypto.randomUUID()};localStorage.setItem('interviewiq.analyticsConsent.v1',JSON.stringify(value));return value.visitorId;});
  release();
  await expect(page.getByRole('status')).toContainText('Newer browser preferences were preserved');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('interviewiq.analyticsConsent.v1')).visitorId)).toBe(current);
});
