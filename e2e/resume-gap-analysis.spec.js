import { expect, test } from '@playwright/test';
import { gotoSeededApp, mockChat } from './helpers/app.js';

test('resume review shows evidence, JD priorities, grounded rewrites and invalidates edited inputs', async ({ page }) => {
  await gotoSeededApp(page);
  await page.getByText('Advanced tools and learning plans', { exact: true }).click();
  await page.getByLabel('Resume text', { exact: true }).fill('Experience\nBuilt Java APIs and reduced latency by 42%.\nSkills\nSQL. No Docker experience.');
  await page.getByLabel('Target job description text', { exact: true }).fill('Required:\nJava\nSQL\nPreferred:\nDocker');
  await page.getByRole('button', { name: 'Analyze gaps', exact: true }).click();
  await expect(page.getByText('Resume coverage assessment', { exact: true })).toBeVisible();
  const java = page.locator('article').filter({ has: page.getByText('Java · Required', { exact: true }) });
  await expect(java).toContainText('Demonstrated in an experience statement');
  await expect(java.locator('blockquote')).toHaveText('Built Java APIs and reduced latency by 42%');
  const sql = page.locator('article').filter({ has: page.getByText('SQL · Required', { exact: true }) });
  await expect(sql).toContainText('Mentioned — add a concrete experience example');
  const docker = page.locator('article').filter({ has: page.getByText('Docker · Preferred', { exact: true }) });
  await expect(docker).toContainText('Not found');
  await expect(page.getByText('No quantified impact found', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Improved: Built Java APIs/)).toContainText('[explain your specific decision');
  await page.getByLabel('Target job description text', { exact: true }).fill('Required: Java');
  await expect(page.getByText('Resume coverage assessment', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Analyze gaps', exact: true }).click();
  await expect(page.getByText('Java · Required', { exact: true })).toBeVisible();
  await expect(page.getByText('Docker · Preferred', { exact: true })).toHaveCount(0);
  await page.reload();
  await page.getByText('Advanced tools and learning plans', { exact: true }).click();
  await expect(page.getByText('Java · Required', { exact: true })).toBeVisible();
});

test('legacy scores are cleared without deleting resume text and unsupported targets stay unscored', async ({ page }) => {
  await gotoSeededApp(page);
  await page.evaluate(() => localStorage.setItem('interviewiq.careerToolkit.v1', JSON.stringify({ version: 1, state: { resumeText: 'Built Java APIs.', resumeAnalysis: { score: 100 } } })));
  await page.reload();
  await page.getByText('Advanced tools and learning plans', { exact: true }).click();
  await expect(page.getByLabel('Resume text', { exact: true })).toHaveValue('Built Java APIs.');
  await expect(page.getByText('Resume coverage assessment', { exact: true })).toHaveCount(0);
  await page.getByLabel('Target job description text', { exact: true }).fill('Floral arrangement');
  await page.getByRole('button', { name: 'Analyze gaps', exact: true }).click();
  await expect(page.getByText('Unscored', { exact: true })).toBeVisible();
  await expect(page.getByText(/No supported skills were recognized in this job description/)).toBeVisible();
  await page.getByLabel('Resume text', { exact: true }).fill('JavaScript');
  await expect(page.getByText('Resume coverage assessment', { exact: true })).toHaveCount(0);
});

test('required JD gaps outrank preferred coverage and negation stays scoped to the skill', async ({page}) => {
  await gotoSeededApp(page);
  await page.getByText('Advanced tools and learning plans',{exact:true}).click();
  await page.getByLabel('Resume text',{exact:true}).fill('Java AWS SQL');
  await page.getByLabel('Target job description text',{exact:true}).fill('Required: Docker. Preferred: Java, AWS, SQL.');
  await page.getByRole('button',{name:'Analyze role fit',exact:true}).click();
  await expect(page.getByText('Required evidence missing: Docker. Review these gaps before preferred skills.',{exact:true})).toBeVisible();
  await expect(page.getByText('60%',{exact:true})).toBeVisible();
  await page.getByLabel('Resume text',{exact:true}).fill('Java experience: none. Built services with no downtime using Docker.');
  await page.getByLabel('Target job description text',{exact:true}).fill('Required: Java and Docker.');
  await page.getByRole('button',{name:'Analyze gaps',exact:true}).click();
  const java=page.locator('article').filter({has:page.getByText('Java · Required',{exact:true})});
  const docker=page.locator('article').filter({has:page.getByText('Docker · Required',{exact:true})});
  await expect(java).toContainText('Not found');
  await expect(docker).toContainText('Demonstrated in an experience statement');
});

test('unsupported JavaScript backend profile gets an honest general fallback',async({page})=>{
 await gotoSeededApp(page,{profile:{name:'Audit',position:'Backend Developer',experience:'2-4 years',stack:'JavaScript, Node.js'}});
 await page.getByText('Advanced tools and learning plans',{exact:true}).click();
 await expect(page.getByText(/No curated role pack matches this profile/)).toBeVisible();
 await expect(page.getByText('Java Backend SDE II tuned from your target role and stack.',{exact:true})).toHaveCount(0);
});

test('outgoing crash-plan request retains the JD business context',async({page})=>{
 const requests=await mockChat(page,'Please provide the target job description.');
 await gotoSeededApp(page);
 await page.getByText('Advanced tools and learning plans',{exact:true}).click();
 await page.getByLabel('Resume text',{exact:true}).fill('Built Java APIs.');
 await page.getByLabel('Target job description text',{exact:true}).fill('Required: Docker. Build payment authorization for HeliosBank with PCI audit trails.');
 await page.getByRole('button',{name:'Analyze role fit',exact:true}).click();
 await page.getByRole('button',{name:/Day 1: Role map/}).click();
 await expect.poll(()=>requests.length).toBe(1);
 const payload=JSON.stringify(requests[0]);
 expect(payload).toContain('Extract must-have requirements');
 expect(payload).toContain('HeliosBank');
 expect(payload).toContain('PCI audit trails');
 expect(payload).toContain('payment authorization');
});
