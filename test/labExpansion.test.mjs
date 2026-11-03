import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {SQL_LESSONS,SQL_SCHEMA} from '../lib/sqlLab.mjs';
import {executeSqlQueries,runSqlLab} from '../lib/sqlLabRunner.mjs';
import {normalizeSqlSession,normalizeGitSession} from '../lib/labSessions.mjs';
import {GIT_EXERCISES,gitExerciseRepo,gitGraphLayout} from '../lib/gitExercises.mjs';
import {gitCommand,gitHead,newGitRepo} from '../lib/gitLab.mjs';
import {REPOSITORY_ASSESSMENTS,normalizeAssessmentWorkspace,archiveAssessment,assessmentSource} from '../lib/repositoryAssessment.mjs';
import {REPOSITORY_CHECKS} from '../lib/repositoryAssessmentChecks.mjs';
import {ASSESSMENT_REFERENCES} from './fixtures/repositoryAssessmentReferences.mjs';
import {updatePracticeGap,normalizePracticeGaps} from '../lib/practiceGaps.mjs';
import {isPracticeKey,exportPracticeBackup,previewPracticeBackup} from '../lib/practiceBackup.mjs';

test('expanded SQL covers twelve lessons with unique IDs and honest runnable plans',async()=>{
 assert.equal(SQL_LESSONS.length,12);assert.equal(new Set(SQL_LESSONS.map(l=>l.id)).size,12);
 for(const id of ['projection','ordering','aggregates','subquery','cte','exists','window-frames','query-plans']){
  const l=SQL_LESSONS.find(l=>l.id===id);assert.ok(l.answer.length>150);assert.ok(l.followUp.length>100);
  assert.equal((await runSqlLab({sql:l.expected,lessonId:id,check:true})).passed,true);
 }
 const plans=await executeSqlQueries(['EXPLAIN QUERY PLAN SELECT name FROM engineers WHERE team_id=1 ORDER BY salary']);assert.ok(plans[0].rows.some(r=>String(r.at(-1)).includes('engineers_team_salary')));
 const tie=SQL_SCHEMA+'DELETE FROM engineers; INSERT INTO engineers VALUES (1,\'A\',1,70),(2,\'B\',1,70);';
 const ranked=await executeSqlQueries([SQL_LESSONS.find(l=>l.id==='window').query],tie);assert.deepEqual(ranked[0].rows.map(r=>r.at(-1)),[1,1]);
 const empty=await executeSqlQueries([SQL_LESSONS.find(l=>l.id==='aggregates').expected]);assert.deepEqual(empty[0].rows,[[0,null]]);
});
test('SQL feedback targets shape and result errors; drafts preserve empty edits and selected lessons',async()=>{
 const result=await runSqlLab({sql:'SELECT name AS wrong FROM engineers',lessonId:'filter',check:true});assert.equal(result.passed,false);assert.match(result.feedback.detail,/column/);assert.equal(result.feedback.href,'/labs/sql?lesson=filter');
 const draft=normalizeSqlSession({selectedId:'cte',drafts:{filter:'',cte:'SELECT 1',unknown:'bad'},overview:true});assert.equal(draft.drafts.filter,'');assert.equal(draft.selectedId,'cte');assert.ok(!Object.hasOwn(draft.drafts,'unknown'));
});
test('Git exercises finish with intended ancestry and recovery and can be restored safely',()=>{
 for(const exercise of GIT_EXERCISES){let repo=gitExerciseRepo(exercise.id);for(const step of exercise.steps){if(step.kind==='edit')repo.work=step.value;else{const result=gitCommand(repo,step.value);assert.ok(!result.error,result.message);repo=result.state;}}
  if(exercise.id==='conflict')assert.equal(gitHead(repo).parents.length,2);
  if(exercise.id==='recovery')assert.equal(gitHead(repo).text,'second note');
  if(exercise.id==='rebase'){assert.equal(gitHead(repo).text,'greeting=hi\nanchor=1\nanchor=2\nanchor=3\nanchor=4\nanchor=5\nstatus=ready');assert.notEqual(gitHead(repo).id,'c2');assert.ok(repo.commits.some(c=>c.id==='c2'));}
  const saved=normalizeGitSession({repo,checkpoint:newGitRepo(),exerciseId:exercise.id,exerciseStep:exercise.steps.length});assert.deepEqual(saved.repo,repo);assert.equal(saved.checkpoint.commits[0].id,'c0');
  const graph=gitGraphLayout(repo);assert.equal(graph.nodes.length,repo.commits.length);assert.ok(graph.nodes.every(n=>n.x>0&&n.x<graph.width&&n.y<graph.height));
 }
 const cyclic=newGitRepo();cyclic.commits[0].parents=['c0'];assert.deepEqual(normalizeGitSession({repo:cyclic}).repo,newGitRepo());
});
test('legacy assessment drafts migrate and history is immutable, idempotent and independently scoped',()=>{
 const checkout=REPOSITORY_ASSESSMENTS[0];let state=normalizeAssessmentWorkspace({files:checkout.files,deadline:1000,notes:'original'});state=archiveAssessment(state,'checkout',500);assert.equal(state.history.length,1);assert.equal(state.history[0].attempt.notes,'original');
 state.attempts.checkout.notes='later';assert.equal(state.history[0].attempt.notes,'original');assert.equal(archiveAssessment(state,'checkout',600).history.length,1);
 state.attempts.api={...state.attempts.api,id:'api-attempt',deadline:2000};state=archiveAssessment(state,'api',2500);assert.equal(state.history.length,2);assert.equal(state.history[1].attempt.submittedAt,2000);
 const blank=structuredClone(state);blank.attempts.checkout.files['Checkout.java']='';const restored=normalizeAssessmentWorkspace(blank);assert.equal(restored.attempts.checkout.files['Checkout.java'],'');assert.equal(restored.attempts.checkout.deadline,1000);
 state.history=state.history.filter(h=>h.assessmentId!=='checkout');assert.equal(archiveAssessment(state,'checkout',700).history.length,1);
});
test('practice gaps reject unsafe links and clear only the check that passed',()=>{
 const a={id:'sql-cte',title:'CTE',detail:'Check groups',drill:'Use WITH',href:'/labs/sql?lesson=cte'},b={...a,id:'assessment-api',href:'/assessments?task=api'};
 assert.equal(normalizePracticeGaps([{...a,href:'javascript:alert(1)'}]).length,0);
 let list=updatePracticeGap([],a);list=updatePracticeGap(list,b);list=updatePracticeGap(list,a,true);assert.deepEqual(list.map(g=>g.id),['assessment-api']);
});
test('browser drafts join private practice backups without broadening credential inclusion',()=>{
 const entries=new Map([['interviewiq.sqlLabSession.v1','{"drafts":{}}'],['interviewiq.gitLabSession.v1','{}'],['interviewiq.auth.session','secret']]);
 const storage={get length(){return entries.size;},key:i=>[...entries.keys()][i],getItem:key=>entries.get(key)};
 const backup=previewPracticeBackup(exportPracticeBackup(storage));assert.equal(Object.keys(backup.entries).length,2);assert.equal(isPracticeKey('interviewiq.auth.session'),false);
});
test('all new Java tasks compile references and reject starters and realistic mutations',()=>{
 const dir=mkdtempSync(join(tmpdir(),'assessment-catalog-'));
 const run=(spec,files)=>{writeFileSync(join(dir,'Main.java'),assessmentSource(files,REPOSITORY_CHECKS[spec.id],spec.id));const compile=spawnSync('javac',['--release','17','Main.java'],{cwd:dir,encoding:'utf8',timeout:30000});assert.equal(compile.status,0,compile.stderr);return spawnSync('java',['Main'],{cwd:dir,encoding:'utf8',timeout:12000});};
 try{for(const spec of REPOSITORY_ASSESSMENTS.filter(s=>s.id!=='checkout')){
  const refs=ASSESSMENT_REFERENCES[spec.id];const good=run(spec,refs);assert.equal(good.status,0,`${spec.id}: ${good.stderr}`);assert.notEqual(run(spec,spec.files).status,0,`${spec.id} starter must fail`);
  const bad={...refs};
  if(spec.id==='api')bad['PagingEndpoint.java']=bad['PagingEndpoint.java'].replace('(long)page*size','page*size');
  if(spec.id==='cache')bad['CacheEntry.java']=bad['CacheEntry.java'].replace('now<expiry','now<=expiry');
  if(spec.id==='concurrency')bad['Lease.java']=bad['Lease.java'].replace('closed.compareAndSet(false,true)','true');
  if(spec.id==='debugging')bad['VersionGate.java']=bad['VersionGate.java'].replace('e.version>old.version','e.version>=old.version');
  assert.notEqual(run(spec,bad).status,0,`${spec.id} mutation must fail`);
 }}finally{rmSync(dir,{recursive:true,force:true});}
});

test('each new assessment adapter compiles its emitted example and hidden harness and reports targeted failures',async()=>{
 const {runRepositoryAssessment}=await import('../lib/repositoryAssessmentRunner.mjs');
 const env={JAVA_RUNNER_URL:'https://runner.example',JAVA_RUNNER_SHARED_TOKEN:'x'.repeat(32)};
 const dir=mkdtempSync(join(tmpdir(),'assessment-adapter-all-'));
 try{
  const fetchImpl=async(_url,options)=>{const payload=JSON.parse(options.body);assert.equal(payload.javaVersion,17);assert.ok(payload.code.length<=12000);writeFileSync(join(dir,'Main.java'),payload.code);const compiled=spawnSync('javac',['--release','17','Main.java'],{cwd:dir,encoding:'utf8',timeout:30000});assert.equal(compiled.status,0,compiled.stderr);const run=spawnSync('java',['Main'],{cwd:dir,encoding:'utf8',timeout:12000});return new Response(JSON.stringify({phase:'run',exitCode:run.status,stdout:run.stdout,stderr:run.stderr}));};
  for(const spec of REPOSITORY_ASSESSMENTS.filter(s=>s.id!=='checkout'))for(const mode of ['examples','assessment'])assert.equal((await runRepositoryAssessment(ASSESSMENT_REFERENCES[spec.id],mode,{env,fetchImpl,assessmentId:spec.id})).passed,true,`${spec.id} ${mode}`);
  const failure=await runRepositoryAssessment(ASSESSMENT_REFERENCES.concurrency,'assessment',{env,assessmentId:'concurrency',fetchImpl:async()=>new Response(JSON.stringify({phase:'run',exitCode:1,stdout:'GROUP:validation\nGROUP:capacity\nGROUP:ownership\n'}))});assert.equal(failure.passed,false);assert.match(failure.feedback.detail,/release/);assert.equal(failure.output,'');
 }finally{rmSync(dir,{recursive:true,force:true});}
});

 test('rebase skips a patch already applied upstream instead of inventing another commit',()=>{
  let s=newGitRepo();const run=command=>{const result=gitCommand(s,command);assert.ok(!result.error,result.message);s=result.state;};
  run('git switch -c feature');s.work='same';run('git add note.txt');run('git commit -m "feature"');run('git switch main');s.work='same';run('git add note.txt');run('git commit -m "main"');run('git switch feature');const count=s.commits.length;run('git rebase main');assert.equal(gitHead(s).id,s.branches.main);assert.equal(s.commits.length,count);assert.ok(s.commits.some(c=>c.id==='c1'));
 });
 test('rebase conflicts leave both branch refs and work unchanged',()=>{
  let s=gitExerciseRepo('conflict');const before=structuredClone(s);const result=gitCommand(s,'git rebase feature');assert.equal(result.error,true);assert.deepEqual(result.state,before);assert.deepEqual(s,before);
 });

 test('guided rebase outcome agrees with Git on independent separated edits',()=>{
  const dir=mkdtempSync(join(tmpdir(),'git-rebase-guide-'));
  const env={...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'};
  const git=(...args)=>{const run=spawnSync('git',['-c','user.name=Practice Fixture','-c','user.email=fixture@example.invalid','-c','core.hooksPath=/dev/null',...args],{cwd:dir,env,encoding:'utf8',timeout:10000});assert.equal(run.status,0,run.stderr);return run.stdout;};
  try{
   let model=gitExerciseRepo('rebase');const base=model.commits.find(c=>c.id==='c1').text,feature=model.commits.find(c=>c.id==='c2').text,main=model.commits.find(c=>c.id==='c3').text;
   git('init','--initial-branch=main');writeFileSync(join(dir,'note.txt'),base);git('add','note.txt');git('commit','-m','base');git('switch','-c','feature');writeFileSync(join(dir,'note.txt'),feature);git('add','note.txt');git('commit','-m','feature');git('switch','main');writeFileSync(join(dir,'note.txt'),main);git('add','note.txt');git('commit','-m','main');git('switch','feature');git('rebase','main');
   const replay=gitCommand(model,'git rebase main');assert.ok(!replay.error,replay.message);assert.equal(git('show','HEAD:note.txt'),gitHead(replay.state).text);
  }finally{rmSync(dir,{recursive:true,force:true});}
 });
