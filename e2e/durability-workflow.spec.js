import { test, expect } from '@playwright/test';
import { createSessionSnapshot } from './helpers/app.js';
test.use({ serviceWorkers: 'block' });
const note={id:'saved-note',href:'/labs/cache',title:'My saved note',evidence:'Keep this evidence'};
async function seed(page,{practice={},entries={},activeTab='chat',messages=[]}={}) {
  const envelope=createSessionSnapshot({activeTab,messages}); envelope.snapshot.practice=practice;
  await page.addInitScript(({envelope,entries})=>{if(localStorage.getItem('__durability_seeded'))return;localStorage.setItem('__durability_seeded','1');localStorage.setItem('interviewprep.session.v1',JSON.stringify(envelope));localStorage.setItem('interviewiq.homeDemoSeen.v1','1');for(const [k,v]of Object.entries(entries))localStorage.setItem(k,v);},{envelope,entries});
}
async function auth(page) {
 await page.route('**/api/auth**',route=>{const action=new URL(route.request().url()).searchParams.get('action');return route.fulfill({json:action==='me'?{user:{id:'durability-user',email:'reader@example.test',emailVerified:true}}:{ok:true,csrfToken:'test-token'}});});
}
async function saved(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('interviewprep.session.v1')).snapshot.practice);}
test('notebook archive keeps evidence and active capacity is visible',async({page})=>{
 await seed(page,{entries:{'interviewiq.learningNotebook.v1':JSON.stringify([note])}});await page.goto('/notebook');
 await expect(page.getByText(/1 of 100 active note slots/)).toBeVisible();await page.getByRole('button',{name:'Archive My saved note',exact:true}).click();
 await page.getByText('Archived notes (1)',{exact:true}).click();await expect(page.getByText(note.evidence,{exact:true})).toBeVisible();await page.reload();await page.getByText('Archived notes (1)',{exact:true}).click();await expect(page.getByText(note.evidence,{exact:true})).toBeVisible();
});
test('sign-out offers backup before clearing local-only work',async({page})=>{
 await auth(page);await page.route('**/api/state',route=>route.fulfill({json:route.request().method()==='GET'?{state:null,revision:0}:{ok:true,revision:1}}));
 await seed(page,{entries:{'interviewiq.learningNotebook.v1':JSON.stringify([note])}});await page.goto('/practice');
 await page.getByLabel('Workspace options',{exact:true}).click();await page.locator('.header-account-actions').getByRole('button',{name:/Account/}).click();await page.getByRole('menuitem',{name:'Account & settings'}).click();await page.getByRole('button',{name:'Sign out',exact:true}).click();
 const protect=page.getByRole('region',{name:'Protect work before sign-out'});await expect(protect).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('interviewiq.learningNotebook.v1'))).toContain(note.id);
 const download=page.waitForEvent('download');await protect.getByRole('button',{name:'Download backup before sign-out'}).click();expect((await download).suggestedFilename()).toContain('before-signout');
 await protect.getByRole('button',{name:'Cancel sign-out'}).click();expect(await page.evaluate(()=>localStorage.getItem('interviewiq.learningNotebook.v1'))).toContain(note.id);
});
test('completed and replaced plans retain dated session history',async({page})=>{
 await seed(page);await page.goto('/practice');const plan=page.getByRole('region',{name:'Your prep session'});await plan.getByLabel('Available study time').selectOption('5');
 const boxes=plan.getByRole('checkbox');for(let i=0;i<await boxes.count();i++)await boxes.nth(i).check();await plan.getByLabel('Session reflection and remaining gaps').fill('My completed reflection');await plan.getByRole('button',{name:'Complete prep session',exact:true}).click();
 await expect.poll(async()=>(await saved(page)).planHistory.some(item=>item.reflection==='My completed reflection')).toBe(true);
 await plan.getByRole('button',{name:'Start a new prep session'}).click();await plan.getByText(/Session history/).click();await expect(plan.getByText('My completed reflection',{exact:true})).toBeVisible();await page.reload();await plan.getByText(/Session history/).click();await expect(plan.getByText('My completed reflection',{exact:true})).toBeVisible();
});
test('cloud conflict pauses saves and keeps the chosen device copy with the newer revision',async({page})=>{
 await auth(page);let reads=0;const writes=[];const remote=createSessionSnapshot().snapshot;remote.input='Cloud draft';
 await page.route('**/api/state',route=>{if(route.request().method()==='GET')return route.fulfill({json:{state:++reads===1?null:{session:remote},revision:reads===1?1:2}});const body=route.request().postDataJSON();writes.push(body);return route.fulfill(writes.length===1?{status:409,json:{error:'Conflict'}}:{json:{ok:true,revision:3}});});
 await seed(page);await page.goto('/practice');const conflict=page.getByRole('region',{name:'Cloud save conflict'});await expect(conflict).toBeVisible();await page.getByLabel('Message composer').fill('Device draft');await page.waitForTimeout(650);expect(writes.length).toBe(1);
 const download=page.waitForEvent('download');await conflict.getByRole('button',{name:'Keep this device copy'}).click();await download;await expect.poll(()=>writes.length).toBe(2);expect(writes[1].revision).toBe(2);expect(writes[1].state.session.input).toBe('Device draft');
});
test('linked interview schedules export calendars and edit the same round',async({page})=>{
 const app={id:'schedule-app',company:'Example',role:'Engineer',stage:'screen'};await seed(page,{activeTab:'company',entries:{'interviewiq.applicationTracker.v1':JSON.stringify({version:1,state:[app]})}});await page.goto('/practice?workspace=company');await page.getByRole('button',{name:/Applications/}).first().click();await page.getByText('Schedule rounds for Example',{exact:true}).click();
 await page.getByLabel('Interview date and time',{exact:true}).fill('2027-01-10T10:30');await page.getByLabel('Interview time zone',{exact:true}).fill('Asia/Kolkata');await page.getByRole('button',{name:'Save linked interview',exact:true}).click();
 await expect(page.getByText('2027-01-10T05:00:00.000Z · Asia/Kolkata',{exact:true})).toBeVisible();const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download calendar event'}).click();expect((await download).suggestedFilename()).toBe('interview.ics');await page.getByRole('button',{name:'Edit screen',exact:true}).click();await page.getByLabel('Interview date and time',{exact:true}).fill('2027-01-11T10:30');await page.getByRole('button',{name:'Save linked interview',exact:true}).click();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('interviewiq.careerToolkit.v1')).state.interviews.length)).toBe(1);
});
test('disputed assessment preserves evidence and excludes its score from practice summary',async({page})=>{
 const attempt={id:'review-attempt',question:'Explain isolation',answer:'My answer',topic:'SQL',score:3,difficulty:'Mid',round:'coding',gaps:['Missing case'],feedback:'Original feedback'};await seed(page,{practice:{attempts:[attempt]},messages:[{role:'assistant',content:'Original feedback',attemptId:attempt.id}]});await page.goto('/practice');const review=page.getByRole('region',{name:'Practice review'});await review.getByText('Review this assessment',{exact:true}).click();await review.getByLabel('Why do you question this assessment?').fill('The deduction ignores my example.');await review.getByLabel('Reference or verification notes').fill('Checked the primary reference.');await review.getByRole('button',{name:'Save dispute and exclude score'}).click();await expect(review.getByText('Assessment excluded while disputed.',{exact:true})).toBeVisible();await expect.poll(async()=>(await saved(page)).attempts[0].assessmentReview.exclude).toBe(true);expect((await saved(page)).attempts[0].feedback).toBe('Original feedback');await page.reload();await review.getByText('Review this assessment',{exact:true}).click();await expect(review.getByLabel('Why do you question this assessment?')).toHaveValue('The deduction ignores my example.');await review.getByRole('button',{name:'Keep assessment after checking'}).click();await expect.poll(async()=>(await saved(page)).attempts[0].assessmentReview.exclude).toBe(false);
});

test('confirming sign-out clears private work and leaves no previous profile visible',async({page})=>{
 let signedIn=true;await page.route('**/api/auth**',route=>{const action=new URL(route.request().url()).searchParams.get('action');if(action==='logout')signedIn=false;return route.fulfill({json:action==='me'?{user:signedIn?{id:'signed-in',emailVerified:true,email:'reader@example.test'}:null}:{ok:true,csrfToken:'token'}});});
 await page.route('**/api/state',route=>route.fulfill({json:route.request().method()==='GET'?{state:null,revision:0}:{ok:true,revision:1}}));await seed(page,{entries:{'interviewiq.learningNotebook.v1':JSON.stringify([note])}});await page.goto('/practice');await page.getByLabel('Workspace options',{exact:true}).click();await page.locator('.header-account-actions').getByRole('button',{name:/Account/}).click();await page.getByRole('menuitem',{name:'Account & settings'}).click();await page.getByRole('button',{name:'Sign out',exact:true}).click();await Promise.all([page.waitForEvent('framenavigated',frame=>frame===page.mainFrame()),page.getByRole('button',{name:'Sign out and clear device',exact:true}).click()]);await page.waitForLoadState('domcontentloaded');await expect.poll(()=>page.evaluate(()=>localStorage.getItem('interviewiq.learningNotebook.v1'))).toBeNull();await expect(page.getByRole('region',{name:'Your prep session'})).toHaveCount(0);
});
test('a separate reassessment preserves the original and does not count as a new submitted answer',async({page})=>{
 const attempt={id:'original-assessment',question:'Explain isolation',answer:'My original answer',topic:'SQL',score:3,difficulty:'Mid',round:'coding',rubricVersion:1,feedback:'Original feedback'};
 await seed(page,{practice:{attempts:[attempt]},messages:[{role:'assistant',content:'Original feedback',attemptId:attempt.id}]});let submitted;await page.route('**/api/evaluate',route=>{submitted=route.request().postDataJSON();return route.fulfill({json:{evaluation:{score:8,strengths:['Example considered'],gaps:[],recommendations:[],dimensions:[]}}});});await page.goto('/practice');const review=page.getByRole('region',{name:'Practice review'});await review.getByText('Review this assessment',{exact:true}).click();await review.getByLabel('Why do you question this assessment?').fill('Check the example in my answer.');await review.getByRole('button',{name:'Request a separate reassessment'}).click();await expect.poll(async()=>(await saved(page)).attempts.length).toBe(2);const attempts=(await saved(page)).attempts;expect(attempts[0].feedback).toBe('Original feedback');expect(attempts[1].assessmentOnly).toBe(true);expect(attempts[1].parentId).toBe(attempt.id);expect(submitted.answer).toBe(attempt.answer);
});
