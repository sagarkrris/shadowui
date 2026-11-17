import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { latestCandidateAnswer, displayAssessmentText } from '../lib/answerSource.mjs';
import { buildAnswerRewriteStudio, buildCodeExplanationJudge } from '../lib/prepInsights.mjs';
import { PUBLIC_SCENARIOS, publicScenario } from '../lib/publicScenarios.mjs';
import { getDesignLabPattern } from '../lib/designLab.mjs';
import { javaTool } from '../scripts/validation/java-runtime.mjs';

test('answer tools reject a screenshot or generated request instead of silently grading an older answer', () => {
  for (const last of [
    {role:'user',content:'📸 Screenshot — Explain this code'},
    {role:'user',content:'Screenshot: editor.png'},
    {role:'user',content:'Explain Answer: tree bins'},
    {role:'user',content:'Practice Mock: Java'},
    {role:'user',content:'Visible tool request',apiContent:'Generated prompt'},
  ]) {
    const messages = [{role:'user',content:'An earlier answer with metrics and examples'},last,{role:'assistant',content:'Here is my explanation.'}];
    assert.equal(latestCandidateAnswer(messages),'');
    assert.equal(buildAnswerRewriteStudio({messages}).available,false);
    const judge = buildCodeExplanationJudge({messages});
    assert.equal(judge.available,false);
    assert.equal(judge.score,null);
    assert.equal(judge.nextActionPrompt,'');
  }
  assert.equal(latestCandidateAnswer([{role:'user',content:'I use a queue.'}]), 'I use a queue.');
});

test('rewrite drafts do not invent experience, metrics, or ownership', () => {
  const original='We added Redis caching to checkout. I measured the hit ratio. I did not own the deployment.';
  const studio=buildAnswerRewriteStudio({messages:[{role:'user',content:original}]});
  assert.equal(studio.available,true);
  for(const draft of studio.versions) {
    if(draft.label==='Concise version') assert.equal(draft.text,'We added Redis caching to checkout. I measured the hit ratio.');
    else assert.equal(draft.text,original);
    if(draft.label!=='Original answer') assert.ok(draft.guidance);
  }
});

test('unfinished assessment grades are explicit and code fences stay literal', () => {
  const result=displayAssessmentText('Score: N/10\n**Correctness: X/10**\nDepth: ?/10\nExamples: 7/10\n```java\nScore: X/10\n```');
  assert.equal(result.incomplete,true);
  assert.match(result.text,/Score: Not assessed/);
  assert.match(result.text,/Correctness: Not assessed/);
  assert.match(result.text,/Examples: 7\/10/);
  assert.match(result.text,/```java\nScore: X\/10/);
  assert.equal(displayAssessmentText('Score: 8/10').incomplete,false);
  for (const value of ['**Correctness:** X/10', '- **Score**: N/10', '1. Depth: ?/10', '**Examples:**', 'Trade-offs: /10']) {
    assert.equal(displayAssessmentText(value).incomplete,true);
    assert.match(displayAssessmentText(value).text,/Not assessed/);
  }
});

test('recent code comprehension scenario resolves without falling back for unknown IDs', () => {
  const scenario=publicScenario('google-ai-code-comprehension-2026');
  assert.ok(scenario);
  assert.ok(scenario.deepDive && scenario.difficulty && scenario.traps.length);
  assert.equal(publicScenario('not-a-real-scenario'),null);
  assert.equal(new Set(PUBLIC_SCENARIOS.map(item=>item.id)).size,PUBLIC_SCENARIOS.length);
});

test('published Spring registry constructor injects the actual provider map', () => {
  const dir=mkdtempSync(join(tmpdir(),'notification-registry-'));
  try {
    const snippet=getDesignLabPattern('factory-method').springBootExample;
    const code=`import java.util.Map;\n@interface Service {}\ninterface NotificationSender {}\n${snippet}\nclass RegistryCheck { public static void main(String[] args) { NotificationSender sender=new NotificationSender() {}; NotificationSenderRegistry registry=new NotificationSenderRegistry(Map.of("email",sender)); if(registry.get("email")!=sender || registry.get("missing")!=null) throw new AssertionError("Registry lost provider selection"); } }`;
    writeFileSync(join(dir,'RegistryCheck.java'),code);
    execFileSync(javaTool('javac'),['--release','17',join(dir,'RegistryCheck.java')],{stdio:'pipe'});
    execFileSync(javaTool('java'),['-cp',dir,'RegistryCheck'],{stdio:'pipe'});
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
