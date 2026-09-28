export const JAVA_VERSIONS = Object.freeze(Array.from({ length: 14 }, (_, index) => index + 8));

export const CODE_RUNNER_FEATURE_STATE = {
  status: "self-hosted",
  title: "Java Code Runner",
  summary: "Runs Java programs in InterviewIQ's isolated runner. Choose a JDK from Java 8 through Java 21.",
};

export const CODE_RUN_LIMITS = Object.freeze({
  maxCodeChars: 12000,
  maxStdinChars: 4000,
  requestTimeoutMs: 30000,
  runTimeoutMs: 8000,
  runMemoryBytes: 128000000,
});

export const JAVA_LANGUAGE = Object.freeze({
  id: "java",
  label: "Java",
  fileName: "Main.java",
  starter: "class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello, InterviewIQ!\");\n  }\n}\n",
});

function stringField(value) { return typeof value === "string" ? value : ""; }

export function normalizeRunCodeRequest(body = {}) {
  const language = stringField(body.language || "java").trim().toLowerCase();
  const code = stringField(body.code);
  const stdin = stringField(body.stdin);
  const javaVersion = Number(body.javaVersion || 21);
  if (language !== "java") return { ok: false, status: 400, error: "Only Java is supported by this runner." };
  if (!JAVA_VERSIONS.includes(javaVersion)) return { ok: false, status: 400, error: "Choose a Java version from 8 through 21." };
  if (!code.trim()) return { ok: false, status: 400, error: "Code is required." };
  if (code.length > CODE_RUN_LIMITS.maxCodeChars) return { ok: false, status: 413, error: `Code is too large. Keep it under ${CODE_RUN_LIMITS.maxCodeChars} characters.` };
  if (stdin.length > CODE_RUN_LIMITS.maxStdinChars) return { ok: false, status: 413, error: `Input is too large. Keep stdin under ${CODE_RUN_LIMITS.maxStdinChars} characters.` };
  return { ok: true, value: { language, code, stdin, javaVersion } };
}

export function getJavaRunnerConfig(env = process.env) {
  const url = String(env.JAVA_RUNNER_URL || "").trim().replace(/\/$/, "");
  const token = String(env.JAVA_RUNNER_SHARED_TOKEN || "").trim();
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash || token.length < 32) return null;
    return { url, token };
  } catch { return null; }
}

export function isCodeRunnerConfigured(env = process.env) { return Boolean(getJavaRunnerConfig(env)); }

export function buildCodeRunnerHealth(env = process.env) {
  const configured = isCodeRunnerConfigured(env);
  return {
    provider: "interviewiq-java-runner", configured, runnable: configured,
    status: configured ? "ready" : "not_configured", title: CODE_RUNNER_FEATURE_STATE.title,
    summary: configured ? CODE_RUNNER_FEATURE_STATE.summary : "The self-hosted Java runner has not been connected yet.",
    supportedLanguages: ["java"], supportedJavaVersions: JAVA_VERSIONS,
    auth: { mode: "internal-shared-token", ready: configured },
    javaRuntime: { mode: "isolated-container", ready: configured },
  };
}

export async function executeJavaProgram(request, { env = process.env, fetchImpl = fetch } = {}) {
  const config = getJavaRunnerConfig(env);
  if (!config) return { ok: false, status: 503, error: "The self-hosted Java runner is not configured.", runnerUnavailable: true };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CODE_RUN_LIMITS.requestTimeoutMs);
  try {
    const response = await fetchImpl(`${config.url}/v1/run`, {
      method: "POST", headers: { "Content-Type": "application/json", "X-Java-Runner-Token": config.token },
      body: JSON.stringify(request), signal: controller.signal, redirect: 'error',
    });
    if (!response.ok) { await response.body?.cancel(); return { ok: false, status: response.status === 429 ? 429 : 503, error: 'The Java runner is temporarily unavailable.', runnerUnavailable: response.status >= 500 }; }
    const reader = response.body.getReader(); const chunks = []; let bytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        bytes += value.length; if (bytes > 131072) throw new Error('Runner response too large');
        chunks.push(value);
      }
    } finally { await reader.cancel(); }
    const result = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!result || typeof result !== 'object' || !Number.isInteger(result.exitCode)) throw new Error('Invalid runner response');
    return { ok: true, value: { stdout: String(result.stdout || '').slice(0,16000), stderr: String(result.stderr || '').slice(0,16000), exitCode: result.exitCode, timedOut: result.timedOut === true, outputLimited: result.outputLimited === true, signal: result.signal || null, phase: result.phase || null } };
  } catch (error) {
    return { ok: false, status: error?.name === "AbortError" ? 504 : 503, error: error?.name === "AbortError" ? "Code execution timed out." : "The Java runner is temporarily unavailable.", runnerUnavailable: true };
  } finally { clearTimeout(timer); }
}
