import assert from 'node:assert/strict';
import test from 'node:test';
import { practiceEvidence, comparableEvidencePair, sharedChecklist } from '../lib/practiceEvidence.mjs';
import { buildAnswerRewriteStudio, buildOfferReadinessScore } from '../lib/prepInsights.mjs';
import { publicDataPolicy, auditRetentionDays, productAnalyticsRetentionDays } from '../lib/dataPolicy.mjs';
import { isPracticeKey } from '../lib/practiceBackup.mjs';
const attempt = (id, overrides={})=>({id,answer:'I explain the actual mechanism.',question:'Explain this boundary.',topic:'Java JVM',score:7,confidence:'medium',rubricVersion:1,difficulty:'Senior',round:'coding',assessmentMeta:{model:'model-a',promptVersion:'v2',contentVersion:'question-1',settingsVersion:'settings-1'},...overrides});
test('evidence deduplicates records, excludes disputes and reassessments, and preserves unassessed answers',()=>{
  const report=practiceEvidence([attempt('a'),attempt('a',{score:8}),attempt('dispute',{assessmentReview:{exclude:true}}),attempt('reassess',{assessmentOnly:true}),attempt('unscored',{score:null}),attempt('unsupported',{confidence:'insufficient-evidence'}),{id:'empty',score:10}]);
  assert.equal(report.submitted,3); assert.equal(report.assessed,1); assert.equal(report.average,8); assert.equal(report.excluded,2); assert.equal(report.unassessed,2); assert.equal(report.covered,1);
});
test('only version-matched fresh answers to the same question establish a comparable pair',()=>{
  const first=attempt('a'), second=attempt('b',{parentId:'a',score:9});
  assert.equal(comparableEvidencePair(first,second),true);
  for(const change of [{question:'Different question'},{round:'systemDesign'},{difficulty:'Mid'},{rubricVersion:2},{assessmentOnly:true},{assessmentReview:{exclude:true}},{assessmentMeta:{...first.assessmentMeta,model:'different'}},{assessmentMeta:{...first.assessmentMeta,promptVersion:'old'}},{assessmentMeta:{...first.assessmentMeta,contentVersion:'changed'}},{assessmentMeta:undefined},{score:null}]) assert.equal(comparableEvidencePair(first,{...second,...change}),false,JSON.stringify(change));
  const report=practiceEvidence([first,second]); assert.equal(report.improved,1); assert.equal(report.comparisons[0].delta,2);
  assert.equal(practiceEvidence([attempt('old',{assessmentMeta:undefined})]).unversioned,1);
});
test('URL checklist values are never treated as a verified assessment',()=>{
  assert.deepEqual(sharedChecklist({score:'99',verified:'true',source:'official'}),{score:99,label:'Preparation checklist',stack:'Software engineering',verified:false});
  for(const score of [undefined,'','NaN','Infinity','-1','101','100.01',['99'],'1e2','<script>']) assert.equal(sharedChecklist({score}).score,null);
  assert.equal(sharedChecklist({score:'0'}).score,0);
});
test('concise extracts preserve decimal and package-name sentence boundaries',()=>{
  for(const original of ['I used org.example.Client to isolate the failure. I did not deploy the fix.','I measured 0.5 seconds. We did not meet the target.']) {
    const studio=buildAnswerRewriteStudio({messages:[{role:'user',content:original}]});
    assert.ok(studio.versions.every(version=>version.text===original));
  }
});
test('public policy exposes only bounded policy settings and the authorized contact',()=>{
  const policy=publicDataPolicy({SUPPORT_EMAIL:'bad\nheader',DATA_RETENTION_DAYS:'no',PRODUCT_ANALYTICS_RETENTION_DAYS:'Infinity',DATABASE_URL:'secret-db',SESSION_SECRET:'do-not-expose',PRODUCT_ANALYTICS_ENABLED:'true'});
  assert.equal(policy.supportEmail,'sgrkrishna23@gmail.com');assert.equal(policy.auditDays,90);assert.equal(policy.analyticsDays,30);assert.equal(policy.analyticsConfigured,true);assert.ok(!JSON.stringify(policy).includes('secret'));
  assert.equal(auditRetentionDays(1),7);assert.equal(productAnalyticsRetentionDays(999),365);
  assert.equal(isPracticeKey('interviewiq.analyticsConsent.v1'),false);assert.equal(isPracticeKey('interviewiq.diagnostic.v1'),true);
});

test('an empty preparation checklist does not award points for having no known weak spots',()=>{const result=buildOfferReadinessScore();assert.equal(result.score,0);assert.match(result.label,/not a hiring prediction/);});
