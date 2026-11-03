import { test, expect } from '@playwright/test';

for (const viewport of [{width:1366,height:900},{width:390,height:844}]) {
 test.describe(`${viewport.width}px engineering labs`,()=>{
  test.use({viewport});
  test('SQL runs examples, custom SQL, errors and challenge checks',async({page})=>{
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('/labs/sql');await page.getByRole('button',{name:'Run query',exact:true}).click();
   await expect(page.getByRole('status').first()).toContainText('Query completed');
   await page.getByRole('button',{name:'Next step',exact:true}).click();
   await expect(page.getByRole('table').first()).toContainText('Ada');
   await page.getByLabel('SQL editor',{exact:true}).fill('SELECT 1 AS x, 2 AS x');
   await page.getByRole('button',{name:'Run query',exact:true}).click();await expect(page.getByRole('status').first()).toContainText('Custom SQL');
   await expect(page.getByRole('table')).toContainText('1');await expect(page.getByRole('table')).toContainText('2');
   await page.getByLabel('SQL editor',{exact:true}).fill('SELECT name FROM engineers WHERE team_id IS NULL ORDER BY name;');
   await page.getByRole('button',{name:'Check challenge',exact:true}).click();await expect(page.getByRole('status').first()).toContainText('Challenge passed');
   await page.getByLabel('SQL editor',{exact:true}).fill('DELETE FROM engineers');await page.getByRole('button',{name:'Run query',exact:true}).click();await expect(page.getByRole('status').first()).toContainText('read-only');
   expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
  test('SQL curriculum search, overview, progress and playback work together',async({page})=>{
   await page.goto('/labs/sql');
   await page.getByLabel('Search lessons',{exact:true}).fill('no such lesson');
   await expect(page.getByText('No lessons match. Try another search.')).toBeVisible();
   await page.getByLabel('Search lessons',{exact:true}).fill('ranking');
   await expect(page.getByRole('navigation',{name:'SQL lessons'}).getByRole('button')).toHaveCount(1);
   await page.getByRole('navigation',{name:'SQL lessons'}).getByRole('button').click();
   await expect(page.getByLabel('SQL editor',{exact:true})).toContainText('DENSE_RANK');
   await page.getByRole('button',{name:'Mark lesson complete',exact:true}).click();
   await expect(page.getByLabel('SQL course progress')).toHaveAttribute('value','1');
   await page.reload();await expect(page.getByLabel('SQL course progress')).toHaveAttribute('value','1');
   await page.getByRole('button',{name:'Course overview',exact:true}).click();
   await expect(page.getByRole('heading',{name:'A clear path from rows to rankings'})).toBeVisible();
   await page.getByRole('button',{name:'Open lesson 1',exact:true}).click();
   await expect(page.getByLabel('SQL editor',{exact:true})).toBeEnabled();
   await page.getByLabel('SQL editor',{exact:true}).press('Control+Enter');
   await expect(page.getByRole('status').first()).toContainText('Query completed');
   await page.getByRole('button',{name:'Play steps',exact:true}).click();
   await expect(page.getByText('Step 3 / 3',{exact:true})).toBeVisible();
   await expect(page.getByRole('button',{name:'Play steps',exact:true})).toBeVisible();
   await page.getByRole('button',{name:'Reset example',exact:true}).click();
   await expect(page.getByRole('region',{name:'Logical execution steps'})).toHaveCount(0);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await page.getByRole('region',{name:'SQL workspace',exact:true}).scrollIntoViewIfNeeded();
   await page.screenshot({path:`/private/tmp/sql-workspace-${viewport.width}.png`});
  });
  test('Git staging, branching and graph update with keyboard commands',async({page})=>{
   await page.goto('/labs/git');await page.getByLabel('Working tree: note.txt').fill('first edit');
   const run=async command=>{await page.getByLabel('Simulated Git command').fill(command);await page.getByLabel('Simulated Git command').press('Enter');};
   await run('git add note.txt');await page.getByLabel('Working tree: note.txt').fill('later edit');await run('git commit -m "save"');
   await expect(page.getByLabel('Commit graph')).toContainText('c1');await expect(page.getByLabel('Working tree: note.txt')).toHaveValue('later edit');
   await run('git restore note.txt');await expect(page.getByLabel('Working tree: note.txt')).toHaveValue('first edit');
   await run('git switch -c feature');await expect(page.getByLabel('Commit graph')).toContainText('feature (HEAD)');
   await page.getByRole('button',{name:'Reset experiment',exact:true}).click();await expect(page.getByLabel('Commit graph')).not.toContainText('c1');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
  test('journey progress persists and weak activities take priority',async({page})=>{
   await page.goto('/prepare');await page.locator('#final input').first().check();await page.locator('#final input').nth(1).check();
   await page.reload();await expect(page.locator('#final input').first()).toBeChecked();await expect(page.getByRole('link',{name:'Review: Review company and role preparation →'})).toBeVisible();
   await page.goto('/labs');await expect(page.getByRole('link',{name:'SQL Visual Lab',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Git Visual Lab',exact:true})).toBeVisible();
  });
  test('assessment files survive reload, expire, lock and review',async({page})=>{
   await page.route('**/api/repository-assessment',route=>route.fulfill({json:route.request().method()==='GET'?{configured:true}:{passed:true,message:'Practice checks passed for this submission.',mode:'assessment'}}));
   await page.goto('/assessments');await page.getByRole('button',{name:'Start 35-minute attempt',exact:true}).click();
   await page.getByLabel('ShippingPolicy.java',{exact:true}).fill('class ShippingPolicy { long fee(long value) { return 50; } }');
   await page.getByRole('button',{name:'Checkout.java',exact:true}).click();await expect(page.getByLabel('Checkout.java',{exact:true})).toContainText('class Checkout');
   await page.reload();await expect(page.getByLabel('Checkout.java',{exact:true})).toBeVisible();await page.getByRole('button',{name:'ShippingPolicy.java',exact:true}).click();await expect(page.getByLabel('ShippingPolicy.java',{exact:true})).toHaveValue('class ShippingPolicy { long fee(long value) { return 50; } }');
   await page.getByRole('button',{name:'Run assessment checks',exact:true}).click();await expect(page.getByLabel('Assessment result')).toContainText('Checks passed');
   await page.getByRole('button',{name:'Submit and lock files',exact:true}).click();await expect(page.getByLabel('ShippingPolicy.java',{exact:true})).toBeDisabled();
   await page.getByRole('button',{name:'Start another timed attempt with these files',exact:true}).click();await expect(page.getByLabel('ShippingPolicy.java',{exact:true})).toBeEnabled();
   await page.evaluate(()=>{const key='interviewiq.repositoryAssessment.v1';const value=JSON.parse(localStorage.getItem(key));value.attempts.checkout.deadline=Date.now()-1000;localStorage.setItem(key,JSON.stringify(value));});await page.reload();await expect(page.getByLabel('ShippingPolicy.java',{exact:true})).toBeDisabled();await expect(page.getByLabel('Time remaining')).toHaveText('00:00');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await page.screenshot({path:`/private/tmp/swe-assessment-${viewport.width}.png`,fullPage:true});
  });
 });
}
