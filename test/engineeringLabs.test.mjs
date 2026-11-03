import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { SQL_LESSONS, validateSql } from '../lib/sqlLab.mjs';
import { executeSqlQueries, runSqlLab } from '../lib/sqlLabRunner.mjs';
import { newGitRepo, gitCommand, gitHead } from '../lib/gitLab.mjs';
import { assessmentRemaining, assessmentSource, ASSESSMENT_FILES, normalizeAssessment } from '../lib/repositoryAssessment.mjs';
import { ASSESSMENT_HIDDEN_CHECKS, runRepositoryAssessment } from '../lib/repositoryAssessmentRunner.mjs';
import { journeyNext } from '../lib/preparationJourney.mjs';

test('SQL lessons execute real results and all challenge references pass two datasets', async()=>{
 for(const lesson of SQL_LESSONS){
  const example=await runSqlLab({sql:lesson.query,lessonId:lesson.id});assert.ok(example.steps.length>1);
  assert.equal((await runSqlLab({sql:lesson.expected,lessonId:lesson.id,check:true})).passed,true);
 }
 const joined=await runSqlLab({sql:SQL_LESSONS[1].query,lessonId:'join'});
 assert.deepEqual(joined.result.rows.find(r=>r[0]==='Jo'),['Jo',null]);
 assert.equal((await runSqlLab({sql:"SELECT 'Jo' AS name",lessonId:'filter',check:true})).passed,false);
});
test('SQL rejects changes and bounds large/recursive queries; custom SQL has no invented trace',async()=>{
 for(const sql of ['DELETE FROM engineers','SELECT 1; SELECT 2','SELECT load_extension(1)','PRAGMA database_list','SELECT 1 -- comment'])assert.throws(()=>validateSql(sql));
 await assert.rejects(executeSqlQueries(['SELECT missing FROM engineers']));
 await assert.rejects(executeSqlQueries(['WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n) SELECT x FROM n']),/100 rows/);
 await assert.rejects(executeSqlQueries(['WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n) SELECT sum(x) FROM n'],undefined,100),/time limit/);
 const result=await runSqlLab({sql:'SELECT COUNT(*) AS count FROM engineers',lessonId:'filter'});assert.deepEqual(result.result.rows,[[5]]);assert.deepEqual(result.steps,[]);
 assert.deepEqual((await executeSqlQueries(['SELECT 1 AS x, 2 AS x']))[0].rows,[[1,2]]);
});
test('Git staging snapshots remain separate from later working edits',()=>{
 let s={...newGitRepo(),work:'staged'};s=gitCommand(s,'git add note.txt').state;s.work='later';s=gitCommand(s,'git commit -m "save"').state;
 assert.equal(gitHead(s).text,'staged');assert.equal(s.work,'later');assert.equal(s.stage,null);
 assert.equal(gitCommand(s,'git switch -c feature').error,true);
});
test('Git fast-forward, conflict resolution, revert and reset preserve ancestry',()=>{
 let s=newGitRepo();const run=c=>{const r=gitCommand(s,c);assert.ok(!r.error,r.message);s=r.state;};const edit=t=>{s={...s,work:t};run('git add note.txt');run('git commit -m "edit"');};
 run('git switch -c feature');edit('feature');run('git switch main');run('git merge feature');assert.equal(gitHead(s).id,'c1');assert.equal(s.commits.length,2);
 run('git switch -c other');edit('other');run('git switch main');edit('main');run('git merge other');assert.ok(s.merge);assert.match(s.work,/<<<<<<</);
 s={...s,work:'resolved'};run('git add note.txt');run('git commit -m "resolve"');assert.equal(gitHead(s).parents.length,2);
 edit('new');run('git revert HEAD');assert.equal(gitHead(s).text,'resolved');const old=gitHead(s).id;run('git reset --hard c0');assert.ok(s.reflog.includes(old));run(`git reset --hard ${old}`);assert.equal(gitHead(s).text,'resolved');
});
test('Git rebase replaces linear commits and failures do not mutate history',()=>{
 let s=newGitRepo();const run=c=>{const r=gitCommand(s,c);assert.ok(!r.error,r.message);s=r.state;};
 s.work='greeting=hello\nstatus=draft';run('git add note.txt');run('git commit -m "base"');run('git switch -c feature');s.work='greeting=hello\nstatus=ready';run('git add note.txt');run('git commit -m "feature"');run('git switch main');s.work='greeting=hi\nstatus=draft';run('git add note.txt');run('git commit -m "main"');run('git switch feature');run('git rebase main');assert.equal(gitHead(s).parents[0],s.branches.main);assert.equal(gitHead(s).text,'greeting=hi\nstatus=ready');assert.notEqual(gitHead(s).id,'c2');assert.ok(s.commits.some(c=>c.id==='c2'));
 const before=structuredClone(s);assert.equal(gitCommand(s,'git switch -c constructor').error,true);assert.deepEqual(s,before);
});
test('assessment timers and saved drafts reject invalid data; journey prioritizes reviews',()=>{
 assert.equal(assessmentRemaining(10000,9001),1);assert.equal(assessmentRemaining(10000,11000),0);
 assert.deepEqual(normalizeAssessment({files:{}}).files,ASSESSMENT_FILES);
 assert.throws(()=>assessmentSource({'Checkout.java':'x'}));
 assert.equal(journeyNext({weak:['prep-final-role'],completed:[]}).id,'prep-final-role');
});
const reference={
 'ShippingPolicy.java':'class ShippingPolicy { long fee(long subtotal) { if(subtotal<0)throw new IllegalArgumentException();return subtotal>=1000?0:50;} }',
 'Checkout.java':'class Checkout { private final ShippingPolicy shipping; Checkout(ShippingPolicy shipping){if(shipping==null)throw new IllegalArgumentException();this.shipping=shipping;} long total(long price,int quantity){if(price<0||quantity<=0)throw new IllegalArgumentException();long subtotal=Math.multiplyExact(price,(long)quantity);return Math.addExact(subtotal,shipping.fee(subtotal));} }'
};
test('Java assessment reference passes, starter and policy-bypass regression fail executable checks',()=>{
 const dir=mkdtempSync(join(tmpdir(),'repository-assessment-'));
 try {
  const run=files=>{writeFileSync(join(dir,'Main.java'),assessmentSource(files,ASSESSMENT_HIDDEN_CHECKS));execFileSync('javac',['--release','17','Main.java'],{cwd:dir,stdio:'pipe'});return ()=>execFileSync('java',['Main'],{cwd:dir,stdio:'pipe'});};
  run(reference)();assert.throws(run(ASSESSMENT_FILES));
  assert.throws(run({...reference,'Checkout.java':reference['Checkout.java'].replace('shipping.fee(subtotal)','new ShippingPolicy().fee(subtotal)')}));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('assessment adapter executes generated Java harness and validates runner results',async()=>{
 const env={JAVA_RUNNER_URL:'https://runner.example',JAVA_RUNNER_SHARED_TOKEN:'a'.repeat(32)};
 const fetchImpl=async(_url,options)=>{
  const payload=JSON.parse(options.body);const dir=mkdtempSync(join(tmpdir(),'repository-adapter-'));
  try{writeFileSync(join(dir,'Main.java'),payload.code);execFileSync('javac',['--release','17','Main.java'],{cwd:dir,stdio:'pipe'});const stdout=execFileSync('java',['Main'],{cwd:dir,encoding:'utf8'});return new Response(JSON.stringify({phase:'run',exitCode:0,stdout}));}
  finally{rmSync(dir,{recursive:true,force:true});}
 };
 for(const mode of ['examples','assessment'])assert.equal((await runRepositoryAssessment(reference,mode,{env,fetchImpl})).passed,true);
 assert.equal((await runRepositoryAssessment(reference,'assessment',{env:{}})).statusCode,503);
});
