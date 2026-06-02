import {
  buildCodeRunnerError,
  buildPistonPayload,
  CODE_RUN_LIMITS,
  CODE_RUNNER_PROVIDERS,
  extractPistonResult,
  getCodeRunnerProvider,
  isCodeRunnerConfigured,
  normalizeRunCodeRequest,
  PISTON_EXECUTE_URL,
} from "../../lib/codeRunner.mjs";
import { createRequestLogger } from "../../lib/serverLogger.mjs";
import { runCodeInVercelSandbox } from "../../lib/vercelSandboxRunner.mjs";

export default async function handler(req, res) {
  const logger = createRequestLogger({ route: "/api/run-code" });
  res.setHeader("X-Request-Id", logger.requestId);

  if (req.method !== "POST") {
    logger.warn("request.method_not_allowed", { method: req.method });
    return res.status(405).json({ error: "Method not allowed" });
  }

  const normalized = normalizeRunCodeRequest(req.body);
  if (!normalized.ok) {
    logger.warn("request.invalid", {
      status: normalized.status,
      reason: normalized.error,
    });
    return res.status(normalized.status).json({ error: normalized.error, requestId: logger.requestId });
  }

  const provider = getCodeRunnerProvider();

  if (!isCodeRunnerConfigured({ provider })) {
    const runnerError = buildCodeRunnerError({
      status: 503,
      body: { message: "Code runner is not configured." },
    });
    logger.warn("runner.not_configured");
    return res.status(runnerError.status).json({ ...runnerError, requestId: logger.requestId });
  }

  const { language, code, stdin } = normalized.value;
  logger.info("request.accepted", {
    provider,
    language,
    codeChars: code.length,
    stdinChars: stdin.length,
  });

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    provider === CODE_RUNNER_PROVIDERS.vercelSandbox
      ? CODE_RUN_LIMITS.sandboxRequestTimeoutMs
      : CODE_RUN_LIMITS.requestTimeoutMs,
  );

  try {
    if (provider === CODE_RUNNER_PROVIDERS.vercelSandbox) {
      const result = await runCodeInVercelSandbox({
        language,
        code,
        stdin,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (result.status && result.error) {
        logger.warn("sandbox.failed", {
          status: result.status,
          runnerUnavailable: result.runnerUnavailable,
        });
        return res.status(result.status).json({ ...result, requestId: logger.requestId });
      }

      logger.info("request.done", {
        provider,
        language,
        exitCode: result.exitCode,
        stdoutChars: result.stdout.length,
        stderrChars: result.stderr.length,
      });
      return res.status(200).json(result);
    }

    const upstream = await fetch(PISTON_EXECUTE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify(buildPistonPayload({ language, code, stdin })),
    });
    clearTimeout(timeout);

    if (!upstream.ok) {
      const body = await upstream.json().catch(() => ({}));
      const runnerError = buildCodeRunnerError({ status: upstream.status, body });
      logger.warn("upstream.failed", {
        status: upstream.status,
        mappedStatus: runnerError.status,
        runnerUnavailable: runnerError.runnerUnavailable,
      });
      return res.status(runnerError.status).json({ ...runnerError, requestId: logger.requestId });
    }

    const result = extractPistonResult(await upstream.json());
    logger.info("request.done", {
      language,
      exitCode: result.exitCode,
      stdoutChars: result.stdout.length,
      stderrChars: result.stderr.length,
    });
    return res.status(200).json(result);
  } catch (error) {
    clearTimeout(timeout);
    const timedOut = error?.name === "AbortError";
    const runnerError = buildCodeRunnerError({
      status: error?.status || error?.statusCode || 502,
      body: { message: error?.message },
      timedOut,
    });
    logger.error("request.failed", { error, timedOut });
    return res.status(runnerError.status).json({
      ...runnerError,
      requestId: logger.requestId,
    });
  }
}
