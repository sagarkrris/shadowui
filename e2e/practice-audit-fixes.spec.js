import { expect, test } from '@playwright/test';
import { gotoSeededApp, createSessionSnapshot } from './helpers/app.js';

test.use({serviceWorkers:'block'});

test('practice composer remains reachable in a short desktop viewport',async({page})=>{
  await page.setViewportSize({width:1680,height:400});
  await gotoSeededApp(page,{skipReadyCheck:true});
  const composer=page.getByRole('textbox',{name:'Message composer',exact:true});
  await composer.scrollIntoViewIfNeeded();
  await composer.fill('My answer is reachable.');
  await composer.scrollIntoViewIfNeeded();
  const bounds=await composer.boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y+bounds.height).toBeLessThanOrEqual(400);
  await expect(composer).toHaveValue('My answer is reachable.');
});

test('mobile cloud conflict is visible without opening navigation and can be resolved',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.route('**/api/auth**',route=>route.fulfill({json:new URL(route.request().url()).searchParams.get('action')==='me'?{user:{id:'audit-user',emailVerified:true,email:'audit@example.test'}}:{csrfToken:'test-token'}}));
  let release;
  const hydration=new Promise(resolve=>{release=resolve;});
  await page.route('**/api/state',async route=>{
    if(route.request().method()==='PUT') return route.fulfill({json:{ok:true}});
    await hydration;
    return route.fulfill({json:{state:{session:{...createSessionSnapshot().snapshot,input:'Remote draft'}}}});
  });
  await gotoSeededApp(page,{skipReadyCheck:true,cloudOwner:'audit-user'});
  await page.getByRole('textbox',{name:'Message composer',exact:true}).fill('New local draft');
  release();
  const conflict=page.getByRole('region',{name:'Cloud save conflict'});
  await expect(conflict).toBeVisible();
  await conflict.getByText('Cloud saving paused · Review copies',{exact:true}).click();
  await conflict.getByRole('button',{name:'Keep this device copy',exact:true}).click();
  await expect(conflict).toHaveCount(0);
  await expect(page.getByRole('textbox',{name:'Message composer',exact:true})).toHaveValue('New local draft');
});

test('screenshots are not rewritten or judged as candidate explanations',async({page})=>{
  await gotoSeededApp(page,{skipReadyCheck:true,messages:[{role:'user',content:'📸 Screenshot — explain this code'},{role:'assistant',content:'Here is a code explanation.'}]});
  const tools=page.getByText('Answer tools need a written answer. Screenshot labels and generated practice prompts are not assessed.',{exact:true});
  // Answer tools are intentionally disclosed separately from the conversation.
  await page.getByText('Answer tools · Rewrite and explanation checks',{exact:true}).click();
  await expect(tools).toBeVisible();
  await expect(page.getByText('Code Explanation Judge',{exact:true})).toHaveCount(0);
});

test('recent scenario linked from code comprehension renders its authored answer',async({page})=>{
  const response=await page.goto('/scenarios/google-ai-code-comprehension-2026');
  expect(response.status()).toBe(200);
  await expect(page.getByRole('heading',{level:1})).toContainText(/Google|comprehension/i);
  await page.getByText('Compare with the existing answer outline and rubric',{exact:true}).click();
  await expect(page.getByRole('heading',{name:'Answer outline',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Self-review rubric',exact:true})).toBeVisible();
});

test('mobile answer tools keep Polish visible and distinguish missing grades from assessment',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await gotoSeededApp(page,{skipReadyCheck:true,messages:[{role:'user',content:'I use a queue to buffer requests.'},{role:'assistant',content:'Score: N/10\nCorrectness: X/10\nPlease explain your backpressure policy.'}]});
  await expect(page.getByRole('note')).toContainText('unfinished grading fields');
  await expect(page.getByRole('log',{name:'Conversation messages'})).toContainText('Score: Not assessed');
  await page.getByText('Answer tools · Rewrite and explanation checks',{exact:true}).click();
  const tools=page.getByRole('region',{name:'Answer Rewrite Studio and Code Explanation Judge'});
  const polish=tools.getByRole('button',{name:'Polish',exact:true});
  await polish.scrollIntoViewIfNeeded();
  const box=await polish.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x+box.width).toBeLessThanOrEqual(390);
  expect(await polish.evaluate(button=>button.scrollWidth<=button.clientWidth)).toBe(true);
  expect(box.height).toBeGreaterThanOrEqual(36);
  await expect(tools).toContainText('Keyword coverage only. Mentioning an area does not prove the explanation is correct.');
  await expect(tools).toContainText('I use a queue to buffer requests.');
});
