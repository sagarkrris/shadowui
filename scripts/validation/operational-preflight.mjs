// Operator tool only. Imports do not contact services, start Docker, or execute Java.
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { LIMITS } from '../../services/java-runner/executor.mjs';

export function runnerEndpoint(env = {}) {
  try {
    const url = new URL(env.JAVA_RUNNER_URL);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) return null;
    return url;
  } catch { return null; }
}
export function operationalConfiguration(env = {}) {
  const endpoint = runnerEndpoint(env);
  return { schemaVersion: 1, mode: 'configuration-only', runner: { endpointPresent: Boolean(env.JAVA_RUNNER_URL), endpointValid: Boolean(endpoint), tokenPresent: Boolean(env.JAVA_RUNNER_SHARED_TOKEN), tokenMeetsLength: String(env.JAVA_RUNNER_SHARED_TOKEN || '').trim().length >= 32, health: 'not-checked', execution: 'not-checked' }, ai: { keyPresent: Boolean(env.GEMINI_API_KEY), providerHealth: 'not-checked', calibration: 'not-run' }, limits: ['Configuration presence is not operational health.', 'No provider request or Java execution has occurred.'] };
}
const requestBody = code => ({ language: 'java', javaVersion: 17, code, stdin: 'runner-input' });
const program = body => `class Main { public static void main(String[] args) throws Exception { ${body} } }`;
export const RUNNER_OPERATIONAL_CASES = [
  { id: 'known-pass', code: program('System.out.print("RUNNER_OK");'), check: value => value.phase === 'run' && value.exitCode === 0 && value.stdout === 'RUNNER_OK' && !value.timedOut && !value.outputLimited },
  { id: 'stdin', code: program('System.out.print(new java.util.Scanner(System.in).nextLine());'), check: value => value.phase === 'run' && value.exitCode === 0 && value.stdout === 'runner-input' },
  { id: 'compile-error', code: 'class Main { this is deliberately invalid Java }', check: value => value.phase === 'compile' && Number.isInteger(value.exitCode) && value.exitCode !== 0 && !value.timedOut },
  { id: 'assertion-failure', code: program('throw new AssertionError("known-check");'), check: value => value.phase === 'run' && Number.isInteger(value.exitCode) && value.exitCode !== 0 && !value.timedOut && value.stderr.includes('AssertionError') },
  { id: 'infinite-loop', code: program('while (true) { }'), check: value => value.phase === 'run' && value.timedOut === true && value.exitCode !== 0 },
  { id: 'output-bound', code: program('while (true) System.out.println("0123456789012345678901234567890123456789");'), check: value => value.phase === 'run' && value.outputLimited === true },
];
function boundedResult(value) {
  return value && typeof value === 'object' && typeof value.stdout === 'string' && typeof value.stderr === 'string' && Buffer.byteLength(value.stdout) + Buffer.byteLength(value.stderr) <= LIMITS.output;
}
export async function verifyRunnerOperational({ env = process.env, fetchImpl = fetch, pause = ms => new Promise(resolve => setTimeout(resolve, ms)), now = () => Date.now() } = {}) {
  const endpoint = runnerEndpoint(env);
  if (!endpoint || !['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname) || String(env.JAVA_RUNNER_SHARED_TOKEN || '').trim().length < 32) {
    throw new Error('Runner integration requires a loopback-only dedicated runner endpoint and a 32+ character shared token.');
  }
  const token = String(env.JAVA_RUNNER_SHARED_TOKEN).trim();
  const headers = { 'Content-Type': 'application/json', 'X-Java-Runner-Token': token };
  async function request(path, options = {}) {
    const response = await fetchImpl(new URL(path, endpoint), { ...options, redirect: 'error', headers, signal: options.signal || AbortSignal.timeout(35000) });
    // A misrouted endpoint must not retain an unbounded response or raw gateway body.
    const reader = response.body?.getReader();
    let body = ''; let bytes = 0; const decoder = new TextDecoder();
    if (reader) {
      try { for (;;) { const { value, done } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > 65536) throw new Error('bounded-response'); body += decoder.decode(value, {stream:true}); } }
      finally { await reader.cancel().catch(() => {}); }
    } else { body = await response.text(); if (Buffer.byteLength(body) > 65536) throw new Error('bounded-response'); }
    body += decoder.decode();
    let value; try { value = JSON.parse(body); } catch { throw new Error('invalid-response'); }
    return { status: response.status, value };
  }
  const health = () => request('/health', { signal: AbortSignal.timeout(3000) });
  const run = (code, signal) => request('/v1/run', { method: 'POST', body: JSON.stringify(requestBody(code)), ...(signal ? { signal } : {}) });
  const results = [];
  const first = await health();
  if (first.status !== 200 || first.value.ready !== true || first.value.active !== 0) throw new Error('Runner must be healthy and idle on a dedicated test instance.');
  for (const sample of RUNNER_OPERATIONAL_CASES) {
    const start = now();
    try {
      const response = await run(sample.code);
      results.push({ id: sample.id, passed: response.status === 200 && boundedResult(response.value) && sample.check(response.value), status: response.status, phase: response.value.phase === 'run' ? 'run' : response.value.phase === 'compile' ? 'compile' : 'unknown', outputBytes: boundedResult(response.value) ? Buffer.byteLength(response.value.stdout) + Buffer.byteLength(response.value.stderr) : null, elapsedMs: Math.max(0, now() - start) });
    } catch { results.push({ id: sample.id, passed: false, error: 'RUNNER_REQUEST_FAILED' }); }
    if (!results.at(-1).passed) break;
  }
  async function waitActive(expected) {
    const began = now();
    for (let attempt = 0; attempt < 120 && now() - began <= 25000; attempt++) {
      const response = await health();
      if (response.status !== 200 || response.value.ready !== true) throw new Error('runner-unhealthy');
      if (response.value.active === expected) return;
      await pause(200);
    }
    throw new Error('admission-did-not-reach-expected-state');
  }
  if (results.length === RUNNER_OPERATIONAL_CASES.length && results.every(item => item.passed)) {
    // The service has no remote-cancel protocol. Verify bounded drain after client abort,
    // rather than claiming that closing HTTP immediately terminates the workload.
    const controller = new AbortController();
    const pending = run(program('Thread.sleep(2000);'), controller.signal).then(() => 'completed', () => 'aborted');
    try { await waitActive(1); controller.abort(); const outcome = await pending; await waitActive(0); results.push({ id: 'client-abort-bounded-drain', passed: outcome === 'aborted', remoteCancellationSupported: false }); }
    catch { controller.abort(); await pending; results.push({ id: 'client-abort-bounded-drain', passed: false, remoteCancellationSupported: false }); }
    const jobs = [run(program('Thread.sleep(2000);')), run(program('Thread.sleep(2000);'))];
    // Attach rejection handlers immediately so transport failures cannot become unhandled.
    const settled = Promise.allSettled(jobs);
    try { await waitActive(2); const extra = await run(program('System.out.print("must-not-admit");')); const finished = await settled; await waitActive(0); results.push({ id: 'saturation', passed: extra.status === 429 && finished.every(item => item.status === 'fulfilled' && item.value.status === 200 && item.value.value.exitCode === 0) }); }
    catch { await settled; results.push({ id: 'saturation', passed: false }); }
  }
  const last = await health();
  results.push({ id: 'final-admission-health', passed: last.status === 200 && last.value.ready === true && last.value.active === 0 });
  return { schemaVersion: 1, mode: 'runner-integration', passed: results.length === 9 && results.every(item => item.passed), javaVersion: 17, results, limits: ['Known synthetic Java was sent only to the separately configured loopback runner.', 'Client abort is not remote execution cancellation; bounded drain was checked.', 'Health and response checks do not independently attest container isolation, daemon configuration, orphan cleanup or aggregate disk quotas.', 'Other JDK images require separate operational verification. AI provider health and calibration were not tested.'] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.loadEnvFile('.env.local'); } catch { /* Optional operator environment. */ }
  const live = process.argv.includes('--runner-integration');
  const output = process.argv.find(arg => arg.startsWith('--report='))?.slice('--report='.length);
  let report;
  try { report = live ? await verifyRunnerOperational() : operationalConfiguration(process.env); }
  catch { report = { schemaVersion: 1, mode: live ? 'runner-integration' : 'configuration-only', passed: false, error: 'RUNNER_PREFLIGHT_FAILED', limits: ['Check private service configuration, idle admission and dedicated-loopback requirements. No credentials or service error bodies are included.'] }; }
  const text = JSON.stringify(report, null, 2);
  if (output) await writeFile(output, text, { mode: 0o600 });
  console.log(text);
  process.exitCode = report.passed === false ? 1 : 0;
}
