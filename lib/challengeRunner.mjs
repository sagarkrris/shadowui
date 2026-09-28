import { findChallenge, exerciseSource, CHALLENGE_CODE_LIMIT } from './buildChallenges.mjs';
import { getJavaRunnerConfig, executeJavaProgram } from './codeRunner.mjs';

// One runner and one credential pair for both editor and practice execution.
export function runnerConfiguration(env = process.env) { return getJavaRunnerConfig(env); }

export function validateChallengeRun(body) {
  const challenge = findChallenge(body?.id);
  if (!challenge || !['basic', 'all'].includes(body?.mode)) return { error: 'Choose a known challenge and test suite.' };
  if (typeof body.code !== 'string' || !body.code.trim() || body.code.length > CHALLENGE_CODE_LIMIT) return { error: 'Java source must contain 1–12,000 characters.' };
  return { challenge, code: body.code, mode: body.mode };
}

export function challengePayload({ challenge, code, mode }) {
  return { language: 'java', javaVersion: 17, code: exerciseSource(challenge, code, mode), stdin: '' };
}

export function parseChallengeResult(data, challenge, mode) {
  const marker = `CHECKS PASSED: ${challenge.id} v${challenge.version} ${mode}`;
  const output = [data?.stdout, data?.stderr].filter(x => typeof x === 'string').join('\n').slice(0,16000);
  const passed = Boolean(data?.phase === 'run' && data.exitCode === 0 && !data.timedOut && !data.outputLimited && !data.signal && typeof data.stdout === 'string' && data.stdout.split(/\r?\n/).includes(marker));
  return { passed, mode, output, status: passed ? 'passed' : 'failed',
    message: passed ? 'Practice checks passed for this submitted draft.' : 'Checks did not pass. Review compiler errors, assertion failures, or execution limits.' };
}

export async function executeChallenge(input, options = {}) {
  if (!runnerConfiguration(options.env || process.env)) return { statusCode: 503, error: 'Live tests are not configured. Download Main.java and run the checks locally.' };
  const result = await executeJavaProgram(challengePayload(input), options);
  if (!result.ok) return { statusCode: result.status, error: result.error };
  return { statusCode: 200, ...parseChallengeResult(result.value, input.challenge, input.mode) };
}
