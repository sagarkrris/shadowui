import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILD_CHALLENGES, exerciseSource, normalizeChallengeProgress, referenceSource } from '../lib/buildChallenges.mjs';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import { runnerConfiguration, validateChallengeRun, challengePayload, parseChallengeResult, executeChallenge } from '../lib/challengeRunner.mjs';

const c = BUILD_CHALLENGES[0];
const input = { challenge: c, code: c.starter, mode: 'all' };
const env = { JAVA_RUNNER_URL: 'https://runner.example', JAVA_RUNNER_SHARED_TOKEN: 'test-secret'.repeat(4) };
const success = { phase: 'run', exitCode: 0, stdout: `CHECKS PASSED: ${c.id} v1 all\n`, timedOut: false };

test('thirteen unique challenges have real lesson links, authored failure checks, hints and references', () => {
  assert.equal(BUILD_CHALLENGES.length, 13);
  assert.equal(new Set(BUILD_CHALLENGES.map(c => c.id)).size, 13);
  for (const challenge of BUILD_CHALLENGES) {
    assert.ok(listTechBlogs().some(blog => blog.id === challenge.lesson), challenge.lesson);
    assert.ok(challenge.cases.some(t => !t.failure));
    assert.ok(challenge.cases.filter(t => t.failure).length >= 2);
    assert.ok(challenge.hints.length >= 2);
    assert.ok(referenceSource(challenge).includes(challenge.solution));
    assert.ok(challenge.explanation && challenge.followUp);
  }
});
test('download includes exact draft and imports, and suite selection is bounded', () => {
  const draft = 'import java.math.BigDecimal;\nclass Solution { BigDecimal amount; }';
  const source = exerciseSource(c, draft);
  assert.ok(source.indexOf('import java.math.BigDecimal;') < source.indexOf('public class Main'));
  assert.ok(source.includes('class Solution { BigDecimal amount; }'));
  assert.ok(exerciseSource(c, c.starter, 'basic').includes('Burst'));
  assert.ok(!exerciseSource(c, c.starter, 'basic').includes('// Exact expiry'));
  assert.throws(() => exerciseSource(c, c.starter, 'unknown'));
  assert.throws(() => exerciseSource(c, 'x'.repeat(12001)));
});
test('progress rejects unknown/versioned/oversized data and invalidates edited evidence', () => {
  const item = { version: 1, code: 'draft', notes: 'n'.repeat(5000), evidence: 'runner', testedSource: 'draft' };
  const normalized = normalizeChallengeProgress({ [c.id]: item, unknown: item });
  assert.deepEqual(Object.keys(normalized), [c.id]);
  assert.equal(normalized[c.id].notes.length, 4000);
  assert.equal(normalized[c.id].evidence, 'runner');
  assert.equal(normalizeChallengeProgress({ [c.id]: { ...item, code: 'edited' } })[c.id].evidence, null);
  for (const change of [{ version: 2 }, { code: 'a'.repeat(12001) }]) assert.deepEqual(normalizeChallengeProgress({ [c.id]: { ...item, ...change } }), {});
  assert.deepEqual(normalizeChallengeProgress(null), {});
});
test('practice reuses the private Java runner configuration without a Piston service', () => {
  assert.equal(runnerConfiguration({}), null);
  assert.equal(runnerConfiguration(env).url, env.JAVA_RUNNER_URL);
  for (const url of ['https://user:pass@runner.example', 'https://runner.example/?token=secret', 'file:///tmp/execute']) assert.equal(runnerConfiguration({ ...env, JAVA_RUNNER_URL: url }), null);
  assert.ok(runnerConfiguration({ ...env, JAVA_RUNNER_URL: 'http://127.0.0.1:8080' }));
  assert.equal(runnerConfiguration({ ...env, JAVA_RUNNER_SHARED_TOKEN: 'short' }), null);
});
test('only known, bounded submissions reach the isolated runner payload', () => {
  for (const body of [null, {}, { id: c.id, mode: 'all', code: '' }, { id: c.id, mode: 'all', code: 'a'.repeat(12001) }]) assert.ok(validateChallengeRun(body).error);
  assert.equal(validateChallengeRun({ id: c.id, mode: 'all', code: c.starter }).challenge, c);
  const payload = challengePayload(input);
  assert.equal(payload.javaVersion, 17);
  assert.equal(payload.language, 'java');
  assert.equal(payload.code, exerciseSource(c,c.starter,'all'));
});
test('passing requires explicit compile/run success and the correct harness marker', () => {
  assert.equal(parseChallengeResult(success, c, 'all').passed, true);
  for (const change of [{exitCode: undefined}, {phase: 'compile'}, {exitCode: 1}, {signal: 'SIGKILL'}, {timedOut: true}, {outputLimited: true}, {stdout: 'wrong suite'}]) assert.equal(parseChallengeResult({...success,...change},c,'all').passed,false);
  assert.equal(parseChallengeResult(success, c, 'basic').passed, false);
  assert.ok(parseChallengeResult({ ...success, stderr: 'a'.repeat(30000) }, c, 'all').output.length <= 16000);
});
test('runner safely handles unconfigured, malformed, oversized, failed and successful upstreams', async () => {
  assert.equal((await executeChallenge(input, { env: {}, fetchImpl: () => { throw Error('must not call'); } })).statusCode, 503);
  let observed;
  const result = await executeChallenge(input, { env, fetchImpl: async (url, options) => { observed = { url, options }; return Response.json(success); } });
  assert.equal(result.passed, true);
  assert.equal(observed.url, `${env.JAVA_RUNNER_URL}/v1/run`);
  assert.equal(observed.options.redirect, 'error');
  assert.equal(observed.options.headers['X-Java-Runner-Token'], env.JAVA_RUNNER_SHARED_TOKEN);
  assert.equal(JSON.parse(observed.options.body).javaVersion, 17);
  for (const response of [new Response('bad json'), new Response('a'.repeat(131073)), Response.json({}), new Response('', { status: 500 })]) {
    const result = await executeChallenge(input, { env, fetchImpl: async () => response });
    assert.equal(result.statusCode, 503);
    assert.ok(!result.error.includes('test-secret'));
  }
});
