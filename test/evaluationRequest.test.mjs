import assert from 'node:assert/strict';
import test from 'node:test';
import { requestVerifiedEvaluation } from '../lib/evaluationRequest.mjs';
import { readAiJsonResponse } from '../lib/aiResponse.mjs';

test('invalid evidence is regenerated once and only verified feedback is returned', async () => {
  const prompts = [];
  const result = await requestVerifiedEvaluation({ prompt: 'Review', answer: 'Uses a hash bucket.', generate: async prompt => {
    prompts.push(prompt);
    return { text: JSON.stringify({ score: 6, dimensions: [{ key: 'correctness', evidence: prompts.length === 1 ? 'invented claim' : 'hash bucket' }] }) };
  } });
  assert.equal(prompts.length, 2);
  assert.match(prompts[1], /failed validation/);
  assert.equal(result.evaluation.dimensions[0].evidence, 'hash bucket');
});

test('repeated invalid output fails closed without an endless retry', async () => {
  let calls = 0;
  await assert.rejects(requestVerifiedEvaluation({ prompt: 'Review', answer: 'Answer', generate: async () => { calls++; return { text: 'not JSON' }; } }), /not valid JSON/);
  assert.equal(calls, 2);
});

test('valid output is evaluated once and transport failures are not retried by validation', async () => {
  let calls = 0;
  const result = await requestVerifiedEvaluation({ prompt: 'Review', answer: 'Answer', generate: async () => { calls++; return { text: '{"score":null}' }; } });
  assert.equal(result.evaluation.score, null);
  assert.equal(calls, 1);
  await assert.rejects(requestVerifiedEvaluation({ generate: async () => { throw new Error('Network unavailable'); } }), /Network unavailable/);
});

test('proxy timeout HTML is replaced by actionable copy and a request ID', async () => {
  await assert.rejects(readAiJsonResponse(new Response('<h1>Timeout</h1>', { status: 504, headers: { 'x-request-id': 'request-123' } })), /timed out.*Request ID: request-123/);
});

test('JSON failures retain their diagnostic ID and successful evaluation is unchanged', async () => {
  await assert.rejects(readAiJsonResponse(new Response(JSON.stringify({ error: 'Invalid evidence', requestId: 'validation-123' }), { status: 502 })), /Invalid evidence.*validation-123/);
  const payload = { evaluation: { score: 7 } };
  assert.deepEqual(await readAiJsonResponse(new Response(JSON.stringify(payload))), payload);
});
