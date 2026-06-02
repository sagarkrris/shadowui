import { Sandbox } from "@vercel/sandbox";
import { CODE_RUN_LIMITS, getCodeLanguage } from "./codeRunner.mjs";

export const VERCEL_SANDBOX_JAVA_SNAPSHOT_ID = process.env.VERCEL_SANDBOX_JAVA_SNAPSHOT_ID || "";
export const VERCEL_SANDBOX_AUTO_INSTALL_JAVA = process.env.VERCEL_SANDBOX_AUTO_INSTALL_JAVA === "1";

const OUTPUT_LIMIT = 12000;
const SANDBOX_TIMEOUT_MS = 90 * 1000;
const INSTALL_TIMEOUT_MS = 75 * 1000;

function truncateOutput(value = "") {
  const text = String(value || "");
  if (text.length <= OUTPUT_LIMIT) return text;
  return `${text.slice(0, OUTPUT_LIMIT)}\n[output truncated]`;
}

function sandboxCredentials() {
  const teamId = process.env.VERCEL_TEAM_ID || "";
  const projectId = process.env.VERCEL_PROJECT_ID || "";
  const token = process.env.VERCEL_TOKEN || "";

  return teamId && projectId && token ? { teamId, projectId, token } : {};
}

function sandboxSource() {
  const snapshotId = VERCEL_SANDBOX_JAVA_SNAPSHOT_ID.trim();
  return snapshotId ? { source: { type: "snapshot", snapshotId } } : {};
}

async function readCommandResult(command) {
  const [stdout, stderr] = await Promise.all([
    command.stdout().catch(() => ""),
    command.stderr().catch(() => ""),
  ]);

  return {
    stdout: truncateOutput(stdout),
    stderr: truncateOutput(stderr),
    exitCode: Number.isInteger(command.exitCode) ? command.exitCode : 0,
  };
}

async function runCommand(sandbox, command) {
  return sandbox.runCommand(command);
}

async function ensureJavaToolchain(sandbox) {
  const check = await runCommand(sandbox, {
    cmd: "bash",
    args: ["-lc", "command -v javac >/dev/null 2>&1 && java -version >/dev/null 2>&1"],
    timeout: 5000,
  });

  if (check.exitCode === 0) return null;

  if (!VERCEL_SANDBOX_AUTO_INSTALL_JAVA) {
    return {
      status: 503,
      error: "Vercel Sandbox is configured, but Java is not installed in the sandbox image. Create a Java snapshot and set VERCEL_SANDBOX_JAVA_SNAPSHOT_ID, or set VERCEL_SANDBOX_AUTO_INSTALL_JAVA=1 for development.",
      runnerUnavailable: true,
    };
  }

  const install = await runCommand(sandbox, {
    cmd: "bash",
    args: [
      "-lc",
      "dnf install -y java-17-amazon-corretto-devel || dnf install -y java-17-openjdk-devel",
    ],
    sudo: true,
    timeout: INSTALL_TIMEOUT_MS,
  });

  if (install.exitCode !== 0) {
    const result = await readCommandResult(install);
    return {
      status: 503,
      error: `Could not install Java in Vercel Sandbox.\n${result.stderr || result.stdout}`.trim(),
      runnerUnavailable: true,
    };
  }

  await sandbox.updateNetworkPolicy("deny-all").catch(() => undefined);
  return null;
}

export function canRunInVercelSandbox(language) {
  return getCodeLanguage(language)?.id === "java";
}

export async function runCodeInVercelSandbox({ language, code, stdin = "", signal } = {}) {
  if (!canRunInVercelSandbox(language)) {
    return {
      status: 400,
      error: "Vercel Sandbox coding lab currently supports Java only.",
    };
  }

  const shouldAllowSetupNetwork = !VERCEL_SANDBOX_JAVA_SNAPSHOT_ID && VERCEL_SANDBOX_AUTO_INSTALL_JAVA;
  const sandbox = await Sandbox.create({
    ...sandboxCredentials(),
    ...sandboxSource(),
    persistent: false,
    runtime: "node24",
    resources: { vcpus: 1 },
    timeout: SANDBOX_TIMEOUT_MS,
    networkPolicy: shouldAllowSetupNetwork ? "allow-all" : "deny-all",
    signal,
  });

  try {
    const setupError = await ensureJavaToolchain(sandbox);
    if (setupError) return setupError;

    await sandbox.writeFiles([
      { path: "Main.java", content: code },
      { path: "input.txt", content: stdin || "" },
    ], { signal });

    const compile = await runCommand(sandbox, {
      cmd: "javac",
      args: ["Main.java"],
      timeout: CODE_RUN_LIMITS.compileTimeoutMs,
    });
    const compileResult = await readCommandResult(compile);

    if (compileResult.exitCode !== 0) {
      return {
        stdout: compileResult.stdout,
        stderr: compileResult.stderr || "Compilation failed.",
        exitCode: compileResult.exitCode,
      };
    }

    const run = await runCommand(sandbox, {
      cmd: "bash",
      args: ["-lc", "timeout 8s java Main < input.txt"],
      timeout: CODE_RUN_LIMITS.runTimeoutMs + 1000,
    });
    return readCommandResult(run);
  } finally {
    await sandbox.stop().catch(() => undefined);
  }
}
