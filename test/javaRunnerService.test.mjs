import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { executeJava, runContainer, runProcess, workspaceConfiguration, LIMITS } from '../services/java-runner/executor.mjs';
import { BUILD_CHALLENGES } from '../lib/buildChallenges.mjs';
import { challengePayload, executeChallenge } from '../lib/challengeRunner.mjs';

const request = { language: 'java', code: 'class Main {}', stdin: 'hello', javaVersion: 17 };
const success = { exitCode: 0, stdout: '', stderr: '', timedOut: false, outputLimited: false };
async function fixture(t) {
  const localRoot = await mkdtemp(join(tmpdir(), 'runner-regression-'));
  t.after(() => rm(localRoot, { recursive: true, force: true }));
  return { localRoot, hostRoot: '/host/submissions' };
}

test('workspace configuration requires explicit dedicated host path', () => {
  assert.throws(() => workspaceConfiguration({}));
  for (const root of ['/', 'relative', '/a/..', '/tmp,a']) assert.throws(() => workspaceConfiguration({ JAVA_RUNNER_HOST_WORKSPACE_ROOT: root }));
  assert.deepEqual(workspaceConfiguration({ JAVA_RUNNER_HOST_WORKSPACE_ROOT: '/srv/jobs' }), { localRoot: '/submissions', hostRoot: '/srv/jobs' });
});
test('workspace survives execution and uses host-visible mapping, then is removed', async t => {
  const workspace = await fixture(t);
  let finish; const pending = new Promise(resolve => { finish = resolve; });
  let started; const runtimeStarted = new Promise(resolve => { started = resolve; });
  const calls = [];
  const execution = executeJava(request, { workspace, containerRunner: async (flags, command, options) => {
    calls.push({ flags, command, options });
    const [job] = await readdir(workspace.localRoot);
    assert.ok(flags.includes(`type=bind,src=/host/submissions/${job},dst=/workspace`));
    assert.equal(await readFile(join(workspace.localRoot, job, 'Main.java'), 'utf8'), request.code);
    if (command.includes('java')) { started(); return pending; }
    return success;
  } });
  await runtimeStarted;
  assert.equal((await readdir(workspace.localRoot)).length, 1);
  finish(success);
  assert.equal((await execution).phase, 'run');
  assert.deepEqual(await readdir(workspace.localRoot), []);
  assert.equal(calls[1].options.stdin, 'hello');
  assert.ok(calls[0].flags.includes('--network') && calls[0].flags.includes('none'));
});
test('compiler failure never executes Java and still cleans workspace', async t => {
  const workspace = await fixture(t); let calls=0;
  const result = await executeJava(request, { workspace, containerRunner: async () => { calls++; return {...success,exitCode:1}; } });
  assert.equal(calls,1); assert.equal(result.phase,'compile');
  assert.deepEqual(await readdir(workspace.localRoot),[]);
});
test('runtime failures clean files, but unconfirmed container cleanup retains them', async t => {
  const workspace=await fixture(t);
  await assert.rejects(executeJava(request,{workspace,containerRunner:async()=>{throw Error('failed');}}),/failed/);
  assert.deepEqual(await readdir(workspace.localRoot),[]);
  const failure=Object.assign(Error('cleanup failed'),{code:'CONTAINER_CLEANUP_FAILED'});
  await assert.rejects(executeJava(request,{workspace,containerRunner:async()=>{throw failure;}}),/cleanup failed/);
  assert.equal((await readdir(workspace.localRoot)).length,1);
});
test('timeout removes the exact workload container before returning and forwards stdin', async () => {
  const calls=[];
  const result=await runContainer(['--network','none'],['image','java'],{stdin:'hello',processRunner:async(command,args,options)=>{
    calls.push({command,args,options}); return args[0]==='run'?{...success,exitCode:137,timedOut:true}:success;
  }});
  assert.equal(result.timedOut,true);
  assert.equal(calls[0].options.stdin,'hello'); assert.ok(calls[0].args.includes('-i'));
  assert.deepEqual(calls[1].args,['rm','-f',calls[0].args[2]]);
});
test('cleanup failure is fail-closed; nonexistent container after startup failure is safe', async () => {
  await assert.rejects(runContainer([],[],{processRunner:async()=>({...success,exitCode:1,stderr:'daemon unreachable'})}),{code:'CONTAINER_CLEANUP_FAILED'});
  const result=await runContainer([],[],{processRunner:async(_command,args)=>({...success,exitCode:1,stderr:args[0]==='rm'?'No such container: test':'image unavailable'})});
  assert.equal(result.exitCode,1);
});
test('process transport bounds time and output and preserves stdin', async () => {
  const echo=await runProcess(process.execPath,['-e','process.stdin.pipe(process.stdout)'],{stdin:'hello'});
  assert.equal(echo.stdout,'hello'); assert.equal(echo.exitCode,0);
  const timeout=await runProcess(process.execPath,['-e','setInterval(()=>{},1000)'],{timeoutMs:200});
  assert.equal(timeout.timedOut,true); assert.notEqual(timeout.exitCode,0);
  const output=await runProcess(process.execPath,['-e','process.stdout.write("a".repeat(100000))'],{outputLimit:1024});
  assert.equal(output.outputLimited,true); assert.ok(Buffer.byteLength(output.stdout)<=1024);
});
test('every maximum-sized practice draft fits the service envelope', () => {
  for(const challenge of BUILD_CHALLENGES) assert.ok(challengePayload({challenge,code:' '.repeat(12000),mode:'all'}).code.length<=LIMITS.code);
});
test('practice request and service response contracts interoperate end to end', async t => {
  const workspace=await fixture(t); workspace.hostRoot=workspace.localRoot;
  const challenge=BUILD_CHALLENGES[0];
  const result=await executeChallenge({challenge,code:challenge.starter,mode:'all'}, {
    env:{JAVA_RUNNER_URL:'http://runner.internal',JAVA_RUNNER_SHARED_TOKEN:'test-token'.repeat(4)},
    fetchImpl:async(url,options)=>{
      assert.equal(url,'http://runner.internal/v1/run');
      const body=JSON.parse(options.body); assert.equal(body.javaVersion,17);
      const response=await executeJava(body,{workspace,containerRunner:async(flags,command)=>{
        const mount=flags[flags.indexOf('--mount')+1];
        assert.ok(mount.includes(basename(workspace.localRoot)));
        return {...success,stdout:command.includes('java')?`CHECKS PASSED: ${challenge.id} v1 all\n`:''};
      }});
      return Response.json(response);
    }
  });
  assert.equal(result.passed,true);
  assert.deepEqual(await readdir(workspace.localRoot),[]);
});
