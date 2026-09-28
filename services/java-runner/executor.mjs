import { mkdtemp, rm, writeFile, chmod } from 'node:fs/promises';
import { basename, isAbsolute, join, normalize } from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';

export const LIMITS = Object.freeze({ code: 20000, stdin: 4000, output: 16000, timeoutMs: 8000 });

export function workspaceConfiguration(env = process.env) {
  const localRoot = env.JAVA_RUNNER_WORKSPACE_ROOT || '/submissions';
  const hostRoot = env.JAVA_RUNNER_HOST_WORKSPACE_ROOT;
  for (const root of [localRoot, hostRoot]) {
    if (typeof root !== 'string' || !isAbsolute(root) || normalize(root) === '/' || /[,\r\n]/.test(root)) {
      throw new Error('Configure absolute dedicated local and host submission roots.');
    }
  }
  return { localRoot: normalize(localRoot), hostRoot: normalize(hostRoot) };
}

export function runProcess(command, args, { stdin = '', timeoutMs = LIMITS.timeoutMs, outputLimit = LIMITS.output } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    const chunks = { stdout: [], stderr: [] }; let bytes = 0;
    let timedOut = false, outputLimited = false, spawnFailed = false;
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, timeoutMs);
    for (const stream of ['stdout', 'stderr']) child[stream].on('data', chunk => {
      const remaining = Math.max(0, outputLimit - bytes);
      if (remaining) chunks[stream].push(chunk.subarray(0, remaining));
      bytes += chunk.length;
      if (bytes > outputLimit) { outputLimited = true; child.kill('SIGKILL'); }
    });
    child.on('error', () => { spawnFailed = true; });
    child.stdin.on('error', () => {});
    child.on('close', (exitCode, signal) => {
      clearTimeout(timer);
      resolve({ stdout: Buffer.concat(chunks.stdout).toString('utf8'), stderr: Buffer.concat(chunks.stderr).toString('utf8'), exitCode: spawnFailed ? 1 : (exitCode ?? 1), signal, timedOut, outputLimited });
    });
    child.stdin.end(stdin);
  });
}

export async function runContainer(flags, command, { stdin = '', processRunner = runProcess } = {}) {
  const name = `interviewiq-java-${randomUUID()}`;
  try {
    return await processRunner('docker', ['run', '--name', name, '-i', ...flags, ...command], { stdin });
  } finally {
    // Killing the Docker client does not guarantee the workload has stopped.
    const cleanup = await processRunner('docker', ['rm', '-f', name], { timeoutMs: 5000 });
    if (cleanup.exitCode !== 0 && !(!cleanup.timedOut && !cleanup.outputLimited && /No such container/i.test(cleanup.stderr))) {
      const error = new Error('Container cleanup failed; retain workspace for operator recovery.');
      error.code = 'CONTAINER_CLEANUP_FAILED';
      throw error;
    }
  }
}

export async function executeJava(request, { workspace = workspaceConfiguration(), containerRunner = runContainer } = {}) {
  const { language, code, stdin, javaVersion } = request || {};
  if (language !== 'java' || typeof code !== 'string' || !code.trim() || code.length > LIMITS.code) throw new Error('Invalid Java source');
  if (typeof stdin !== 'string' || stdin.length > LIMITS.stdin || !Number.isInteger(javaVersion) || javaVersion < 8 || javaVersion > 21) throw new Error('Invalid run request');
  const directory = await mkdtemp(join(workspace.localRoot, 'job-'));
  const hostDirectory = join(workspace.hostRoot, basename(directory));
  let safeToRemove = true;
  try {
    await chmod(directory, 0o777);
    await writeFile(join(directory, 'Main.java'), code, { mode: 0o666 });
    const flags = ['--network', 'none', '--read-only', '--tmpfs', '/tmp:rw,noexec,nosuid,size=16m',
      '--pids-limit', '64', '--memory', '256m', '--memory-swap', '256m', '--cpus', '0.5',
      '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--user', '65532:65532',
      '--ulimit', 'nofile=64:64', '--ulimit', 'fsize=16777216:16777216',
      '--mount', `type=bind,src=${hostDirectory},dst=/workspace`, '--workdir', '/workspace'];
    const image = `eclipse-temurin:${javaVersion}-jdk`;
    const compile = await containerRunner(flags, [image, 'javac', '-J-Xmx128m', 'Main.java']);
    if (compile.exitCode !== 0 || compile.timedOut || compile.outputLimited) return { ...compile, phase: 'compile' };
    // Await inside try so workspace cleanup cannot race execution.
    return { ...await containerRunner(flags, [image, 'java', '-Xmx128m', '-cp', '/workspace', 'Main'], { stdin }), phase: 'run' };
  } catch (error) {
    if (error.code === 'CONTAINER_CLEANUP_FAILED') safeToRemove = false;
    throw error;
  } finally {
    if (safeToRemove) await rm(directory, { recursive: true, force: true });
  }
}
