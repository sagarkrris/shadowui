import assert from 'node:assert/strict';
import test from 'node:test';
import { createEvaluateHandler } from '../pages/api/evaluate.js';
import { assessmentMetadata } from '../lib/assessmentMetadata.mjs';
import { PRACTICE_RUBRIC } from '../lib/dailyPractice.mjs';
test('evaluation route records the successful fallback model and stable version metadata without raw profile data',async()=>{
  const answer='I bound the retry budget.';
  const evaluation={score:7,confidence:'medium',strengths:['Bounded budget'],gaps:[],recommendations:[],inventedMetrics:[],followUp:'What if the write committed?',exercise:'Test uncertain outcomes.',dimensions:PRACTICE_RUBRIC.map(d=>({key:d.key,score:7,evidence:answer,deduction:''}))};
  const body={question:'Explain retries.',answer,profile:{name:'Private candidate',position:'Backend',experience:'5 years',stack:'Java'},round:'systemDesign',difficulty:'Senior',feedbackDepth:'Detailed explanation'};
  const handler=createEvaluateHandler({authorize:async()=>({required:false}),rateLimit:async()=>({ok:true}),runOperation:async()=>({modelName:'successful-fallback-model',result:{text:JSON.stringify(evaluation)}})});
  const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},getHeader(k){return this.headers[k];},status(n){this.statusCode=n;return this;},json(v){this.body=v;return this;}};
  await handler({method:'POST',headers:{},body},res);
  assert.equal(res.statusCode,200);
  assert.deepEqual(res.body.evaluation.assessmentMeta,assessmentMetadata('successful-fallback-model',body));
  assert.ok(!JSON.stringify(res.body.evaluation.assessmentMeta).includes('Private candidate'));
  assert.notEqual(assessmentMetadata('successful-fallback-model',{...body,profile:{...body.profile,experience:'1 year'}}).settingsVersion,res.body.evaluation.assessmentMeta.settingsVersion);
  assert.equal(assessmentMetadata('successful-fallback-model',{...body,answer:'A fresh answer.'}).contentVersion,res.body.evaluation.assessmentMeta.contentVersion);
});
