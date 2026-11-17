import assert from 'node:assert/strict';
import test from 'node:test';
import { operationalConfiguration, runnerEndpoint, verifyRunnerOperational } from '../scripts/validation/operational-preflight.mjs';
import { calibrationObservation, calibrationMetrics } from '../scripts/validation/ai-calibration-metrics.mjs';
import { CALIBRATION_DATASET, cases } from '../scripts/validation/ai-calibration-fixtures.mjs';
import { parseStructuredEvaluation } from '../lib/interviewSession.mjs';
import { PRACTICE_RUBRIC } from '../lib/dailyPractice.mjs';

const env = { JAVA_RUNNER_URL: 'http://127.0.0.1:8080', JAVA_RUNNER_SHARED_TOKEN: 'secret-test-token-must-never-appear-in-reports', GEMINI_API_KEY: 'secret-provider-key-never-printed' };
const result = (fields = {}) => ({ phase: 'run', exitCode: 0, stdout: '', stderr: '', timedOut: false, outputLimited: false, ...fields });
const response = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });

test('preflight distinguishes configuration presence from health without exposing values', () => {
  const report = operationalConfiguration(env);
  assert.equal(report.runner.endpointValid, true);
  assert.equal(report.runner.health, 'not-checked');
  assert.equal(report.runner.execution, 'not-checked');
  assert.equal(report.ai.providerHealth, 'not-checked');
  assert.equal(report.ai.calibration, 'not-run');
  assert.equal(JSON.stringify(report).includes(env.GEMINI_API_KEY), false);
  assert.equal(JSON.stringify(report).includes(env.JAVA_RUNNER_SHARED_TOKEN), false);
  for (const url of ['http://user:password@localhost:8080', 'file:///tmp/run', 'http://localhost:8080/v1/run', 'http://localhost/?token=secret']) assert.equal(runnerEndpoint({ JAVA_RUNNER_URL: url }), null);
});

test('operational run refuses nonlocal endpoints before contacting anything', async () => {
  let called = false;
  await assert.rejects(verifyRunnerOperational({ env: { ...env, JAVA_RUNNER_URL: 'https://example.com' }, fetchImpl: async () => { called = true; } }), /loopback/);
  assert.equal(called, false);
});

test('known runner contracts, client abort drain, capacity and final health are checked', async () => {
  let active = 0;
  const observed = [];
  const fetchImpl = async (url, options) => {
    assert.equal(options.headers['X-Java-Runner-Token'], env.JAVA_RUNNER_SHARED_TOKEN);
    if (url.pathname === '/health') return response({ ready: true, active });
    const { code, language, javaVersion, stdin } = JSON.parse(options.body);
    assert.equal(language, 'java'); assert.equal(javaVersion, 17); assert.equal(stdin, 'runner-input');
    observed.push(code);
    if (active >= 2) return response({ error: 'capacity' }, 429);
    if (code.includes('Thread.sleep')) {
      active++;
      return new Promise((resolve, reject) => {
        let finished = false;
        const finish = aborted => { if (finished) return; finished = true; active--; if (aborted) reject(new Error('aborted-secret-detail')); else resolve(response(result())); };
        options.signal.addEventListener('abort', () => finish(true), { once: true });
        setTimeout(() => finish(false), 10);
      });
    }
    if (code.includes('RUNNER_OK')) return response(result({ stdout: 'RUNNER_OK' }));
    if (code.includes('Scanner')) return response(result({ stdout: 'runner-input' }));
    if (code.includes('deliberately invalid')) return response(result({ phase: 'compile', exitCode: 1, stderr: 'compile error secret detail' }));
    if (code.includes('AssertionError')) return response(result({ exitCode: 1, stderr: 'java.lang.AssertionError: known-check' }));
    if (code.includes('println')) return response(result({ exitCode: 137, stdout: 'x'.repeat(16000), outputLimited: true }));
    if (code.includes('while (true)')) return response(result({ exitCode: 137, timedOut: true }));
    throw new Error('unexpected-program');
  };
  const report = await verifyRunnerOperational({ env, fetchImpl, pause: () => new Promise(resolve => setTimeout(resolve, 1)) });
  assert.equal(report.passed, true, JSON.stringify(report));
  assert.equal(report.results.length, 9);
  assert.equal(report.results.find(item => item.id === 'client-abort-bounded-drain').remoteCancellationSupported, false);
  assert.ok(observed.length >= 9);
  assert.equal(JSON.stringify(report).includes('secret'), false);
  assert.equal(report.results.find(item => item.id === 'output-bound').outputBytes, 16000);
});

test('runner failure stops extra execution, and oversized output cannot pass a case', async () => {
  let runs = 0;
  const report = await verifyRunnerOperational({ env, fetchImpl: async url => {
    if (url.pathname === '/health') return response({ ready: true, active: 0 });
    runs++; return response(result({ stdout: 'x'.repeat(16001) }));
  } });
  assert.equal(report.passed, false);
  assert.equal(runs, 1);
  assert.equal(report.results[0].passed, false);
  assert.equal(report.results[0].outputBytes, null);
});

function evaluation(sample, extra = {}) {
  return { score: 9, confidence: 'high', followUp: 'Why would a compound invariant need a lock?', exercise: 'Trace the lost update before choosing a primitive.', dimensions: PRACTICE_RUBRIC.map(item => ({ key: item.key, score: 9, evidence: sample.answer.slice(0, 12), deduction: '' })), ...extra };
}
test('versioned synthetic labels explicitly lack expert validity and metrics expose missing evidence', () => {
  assert.equal(CALIBRATION_DATASET.version, 1);
  assert.match(CALIBRATION_DATASET.reviewStatus, /awaiting/);
  assert.equal(CALIBRATION_DATASET.populationValidity, 'not-established');
  const sample = cases.find(item => item.id === 'strong');
  const raw = evaluation(sample);
  const valid = calibrationObservation(sample, raw, parseStructuredEvaluation(raw, { answer: sample.answer }));
  assert.equal(valid.passed, true);
  assert.equal(valid.validQuoteCount, 5);
  const missing = evaluation(sample, { dimensions: [], followUp: '', exercise: '' });
  const invalid = calibrationObservation(sample, missing, parseStructuredEvaluation(missing, { answer: sample.answer }));
  assert.equal(invalid.passed, false);
  assert.equal(invalid.rubricComplete, false);
  const invented = evaluation(sample, { dimensions: [{ key: 'correctness', evidence: 'invented quotation' }] });
  const rejected = calibrationObservation(sample, invented, parseStructuredEvaluation(invented, { answer: sample.answer }));
  assert.equal(rejected.validEvidence, false);
  assert.equal(rejected.passed, false);
});

test('calibration variance is descriptive and absent repeats or quotes stay unassessed', () => {
  const sample = cases.find(item => item.id === 'strong');
  const observations = [8, 10].map(score => { const raw = evaluation(sample, { score }); return { id: sample.id, ...calibrationObservation(sample, raw, parseStructuredEvaluation(raw, { answer: sample.answer })) }; });
  const metrics = calibrationMetrics(observations);
  assert.equal(metrics.perCase[0].mean, 9);
  assert.equal(metrics.perCase[0].populationVariance, 1);
  assert.equal(metrics.perCase[0].range, 2);
  assert.equal(metrics.evidenceQuoteValidity, 1);
  assert.equal(metrics.followUpPresence, 1);
  assert.equal(metrics.expertAgreement, null);
  assert.equal(calibrationMetrics(observations.slice(0, 1)).perCase[0].populationVariance, null);
  assert.equal(calibrationMetrics([]).evidenceQuoteValidity, null);
  assert.equal(calibrationMetrics([]).provisionalBandAgreement, null);
});
