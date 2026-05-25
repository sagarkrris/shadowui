import assert from "node:assert/strict";
import test from "node:test";

import {
  CODE_RUN_LIMITS,
  CODE_RUNNER_FEATURE_STATE,
  buildCodeRunnerError,
  buildPistonPayload,
  extractPistonResult,
  normalizeRunCodeRequest,
} from "../lib/codeRunner.mjs";

test("marks the live code runner as an upcoming feature", () => {
  assert.equal(CODE_RUNNER_FEATURE_STATE.status, "upcoming");
  assert.match(CODE_RUNNER_FEATURE_STATE.title, /Upcoming feature/i);
});

test("normalizes supported code-run requests", () => {
  const result = normalizeRunCodeRequest({
    language: "Python",
    code: "print('hello')",
    stdin: "input",
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.language, "python");
  assert.equal(result.value.code, "print('hello')");
  assert.equal(result.value.stdin, "input");
});

test("rejects unsupported or risky languages", () => {
  const result = normalizeRunCodeRequest({
    language: "bash",
    code: "echo hello",
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.match(result.error, /Unsupported language/);
});

test("rejects oversized code and stdin payloads", () => {
  const code = "x".repeat(CODE_RUN_LIMITS.maxCodeChars + 1);
  const stdin = "x".repeat(CODE_RUN_LIMITS.maxStdinChars + 1);

  assert.equal(normalizeRunCodeRequest({ language: "python", code }).status, 413);
  assert.equal(normalizeRunCodeRequest({ language: "python", code: "print(1)", stdin }).status, 413);
});

test("builds the expected Piston execution payload", () => {
  const payload = buildPistonPayload({
    language: "python",
    code: "print('hello')",
    stdin: "",
  });

  assert.equal(payload.language, "python");
  assert.equal(payload.files[0].name, "main.py");
  assert.equal(payload.files[0].content, "print('hello')");
  assert.equal(payload.run_memory_limit, CODE_RUN_LIMITS.runMemoryBytes);
});

test("extracts compile and runtime output from Piston responses", () => {
  assert.deepEqual(
    extractPistonResult({
      compile: { stdout: "", stderr: "SyntaxError", code: 1 },
      run: { stdout: "", stderr: "", code: 0 },
    }),
    {
      stdout: "",
      stderr: "SyntaxError",
      exitCode: 1,
    },
  );

  assert.deepEqual(
    extractPistonResult({
      run: { stdout: "42\n", stderr: "", code: 0 },
    }),
    {
      stdout: "42\n",
      stderr: "",
      exitCode: 0,
    },
  );
});

test("classifies Piston whitelist failures as runner availability errors", () => {
  const error = buildCodeRunnerError({
    status: 401,
    body: {
      message: "Public Piston API is now whitelist only as of 2/15/2026.",
    },
  });

  assert.equal(error.status, 503);
  assert.equal(error.runnerUnavailable, true);
  assert.match(error.error, /whitelist/i);
  assert.match(error.error, /PISTON_EXECUTE_URL/);
});
