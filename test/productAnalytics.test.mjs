import { spawnSync } from 'node:child_process';
import { completedPathMilestones } from '../lib/learningMilestones.mjs';
import { LEARNING_PATHS, pathActivityId } from '../lib/learningHub.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { createMemoryStorage } from '../lib/localStateStore.mjs';
import { analyticsConsent, ANALYTICS_CONSENT_KEY, normalizeAnalyticsEvent, summarizeProductEvents, trackEvent } from '../lib/analytics.mjs';
import { analyticsEnvelope, analyticsVisitor } from '../lib/productAnalyticsStore.mjs';
import { learningAnalytics } from '../lib/learningAnalytics.mjs';
import { createAnalyticsHandler } from '../pages/api/analytics.js';
const envelope=()=>({consent:true,visitorId:randomUUID(),event:{name:'ai_completed',value:'100',eventId:randomUUID(),sessionId:randomUUID(),path:'/practice?answer=private',answer:'private',email:'private@example.test'}});
function response(){return {statusCode:200,setHeader(){},status(n){this.statusCode=n;return this;},json(value){this.body=value;return this;}};}
const request=(body,method='POST')=>({method,body,headers:{host:'localhost',origin:'http://localhost','content-type':'application/json'}});
const env={PRODUCT_ANALYTICS_ENABLED:'true',DATABASE_URL:'test'};
const allowed=async()=>({ok:true});
test('consent requires a literal boolean and analytics never breaks blocked-storage product actions',()=>{
  const storage=createMemoryStorage({[ANALYTICS_CONSENT_KEY]:JSON.stringify({version:1,enabled:'false',visitorId:randomUUID()})});
  assert.equal(analyticsConsent(storage).enabled,false);
  const original=Object.getOwnPropertyDescriptor(globalThis,'window');
  try {Object.defineProperty(globalThis,'window',{configurable:true,value:Object.defineProperty({},'localStorage',{get(){throw new Error('blocked storage');}})});assert.doesNotThrow(()=>trackEvent('page_view'));}
  finally{if(original)Object.defineProperty(globalThis,'window',original);else delete globalThis.window;}
});
test('measurement envelopes remove private payloads, route queries, freeform values and non-UUID identifiers',()=>{
  const input=envelope();const result=analyticsEnvelope(input);
  assert.equal(result.path,'/practice');assert.equal(result.visitorId,analyticsVisitor(input.visitorId));assert.ok(!JSON.stringify(result).includes('private'));
  input.event.value='my answer';assert.equal(analyticsEnvelope(input).value,'');
  input.event.name='detective_started';input.event.value='private-customer-name';assert.equal(analyticsEnvelope(input).value,'');
  input.event.sessionId='customer-name';assert.equal(analyticsEnvelope(input),null);
  assert.equal(analyticsEnvelope({...envelope(),consent:'true'}),null);
  assert.equal(normalizeAnalyticsEvent({name:'page_view',path:'/private/person@email.test'}).path,'/other');
});
test('missing and malformed latencies do not manufacture zero-ms performance',()=>{
  const events=[{name:'ai_completed',value:''},{name:'ai_completed',value:'not a number'},{name:'ai_completed',value:'-5'},{name:'ai_completed',value:'1000'}];
  assert.equal(summarizeProductEvents(events).medianAiLatencyMs,1000);assert.equal(summarizeProductEvents(events).aiCompletions,4);
});
test('API acknowledges durable storage only after success and deletion remains available when collection is disabled',async()=>{
  let stored,removed;
  const handler=createAnalyticsHandler({env,rateLimit:allowed,store:{record:async value=>{stored=value;return {inserted:true};},remove:async id=>{removed=id;}}});
  const good=envelope(),res=response();await handler(request(good),res);assert.equal(res.statusCode,202);assert.equal(res.body.stored,true);assert.ok(stored);
  const foreign=response();await handler({...request(good),headers:{...request(good).headers,origin:'https://elsewhere.test'}},foreign);assert.equal(foreign.statusCode,403);
  const failing=createAnalyticsHandler({env,rateLimit:allowed,store:{record:async()=>{throw Error('down');}}});const fail=response();await failing(request(good),fail);assert.equal(fail.statusCode,503);assert.equal(fail.body.stored,undefined);
  const deleted=response();await createAnalyticsHandler({env:{...env,PRODUCT_ANALYTICS_ENABLED:'false'},rateLimit:allowed,store:{remove:async id=>{removed=id;}}})(request({visitorId:good.visitorId},'DELETE'),deleted);assert.equal(deleted.body.deleted,true);assert.equal(removed,analyticsVisitor(good.visitorId));
  const late=response();await createAnalyticsHandler({env,rateLimit:allowed,store:{record:async()=>({withdrawn:true})}})(request(good),late);assert.equal(late.body.stored,false);
});
test('cohort reports use matured observed-browser denominators, exclude expired data and disclose limits',()=>{
  const now=Date.UTC(2026,10,17),day=86400000;
  const row=(id,age,name='page_view')=>({visitor_id:id,created_at:new Date(now-age*day).toISOString(),name,session_id:id,value:''});
  const report=learningAnalytics([row('a',9),row('a',2),row('b',9),row('new',2),row('expired',50),row('future',-1)],{now,retentionDays:30,truncated:true});
  assert.equal(report.day7.eligible,2);assert.equal(report.day7.returned,1);assert.equal(report.day7.rate,.5);assert.equal(report.observedBrowsers,3);assert.equal(report.day30.rate,null);assert.match(report.day30.limitation,/31/);assert.equal(report.truncated,true);
});

test('path milestones count completion transitions rather than visits or unchanged saved progress',()=>{const path=LEARNING_PATHS.find(p=>p.id==='full-stack');const completed=path.stages.flatMap(s=>s.activities.map(a=>pathActivityId(path.id,s.id,a.label)));assert.deepEqual(completedPathMilestones({completed:completed.slice(1)},{completed}),['full-stack']);assert.deepEqual(completedPathMilestones({completed},{completed}),[]);assert.deepEqual(completedPathMilestones({completed},{completed:completed.slice(1)}),[]);});


test('optional measurement transport failures never interrupt a consented product action',()=>{
  const names=['window','localStorage','sessionStorage','navigator','fetch'];
  const originals=new Map(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
  const storage=createMemoryStorage({[ANALYTICS_CONSENT_KEY]:JSON.stringify({version:1,enabled:true,visitorId:randomUUID()})});
  try {
    for(const [name,value] of Object.entries({window:{localStorage:storage,location:{pathname:'/practice'}},localStorage:storage,sessionStorage:createMemoryStorage(),navigator:{sendBeacon(){throw Error('blocked beacon');}},fetch(){throw Error('blocked fetch');}}))Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
    assert.doesNotThrow(()=>trackEvent('page_view'));
    assert.equal(JSON.parse(storage.getItem('interviewiq.productEvents.v1')).length,1);
  } finally { for(const [name,descriptor] of originals) {if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];} }
});

test('operator CLI never prints a malformed database credential on failure',()=>{const result=spawnSync(process.execPath,['scripts/operations/product-analytics.mjs'],{env:{...process.env,DATABASE_URL:'postgres://user:DO_NOT_PRINT_THIS@[invalid'},encoding:'utf8',timeout:5000});assert.equal(result.status,1);assert.ok(!`${result.stdout}${result.stderr}`.includes('DO_NOT_PRINT_THIS'));assert.match(result.stderr,/Product analytics operation failed/);});
