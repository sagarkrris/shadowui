import { executeJavaProgram, normalizeRunCodeRequest } from "../../../lib/codeRunner.mjs";
import { requireConfiguredUser } from "../../../lib/apiAuth.mjs";
import { checkDistributedRateLimit } from "../../../lib/redisRateLimit.mjs";
import { getClientAddress } from "../../../lib/requestSecurity.mjs";
import { createRequestLogger } from "../../../lib/serverLogger.mjs";
import { recordMetric } from "../../../lib/observability.mjs";
import { withApiObservability } from "../../../lib/apiObservability.mjs";

export const config = { api: { bodyParser: { sizeLimit: "20kb" } } };

async function handler(req, res) {
  const logger = createRequestLogger({ route: "/api/run-code", requestId: res.getHeader?.("X-Request-Id") || req.requestId });
  res.setHeader("X-Request-Id", logger.requestId);
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const auth = await requireConfiguredUser(req);
  if (auth.required && !auth.user) return res.status(401).json({ error: "Sign in to run Java programs." });
  const rate = await checkDistributedRateLimit(`java-runner:${getClientAddress(req)}`, { limit: 10 });
  res.setHeader("X-RateLimit-Remaining", String(rate.remaining));
  if (!rate.ok) return res.status(429).json({ error: "Too many code runs. Please try again shortly." });
  const normalized = normalizeRunCodeRequest(req.body);
  if (!normalized.ok) return res.status(normalized.status).json({ error: normalized.error });
  const result = await executeJavaProgram(normalized.value);
  if (!result.ok) {
    logger.warn("runner.failed", { status: result.status, runnerUnavailable: result.runnerUnavailable });
    recordMetric("java_runner.failed", { status: result.status });
    return res.status(result.status).json({ error: result.error, runnerUnavailable: result.runnerUnavailable, requestId: logger.requestId });
  }
  logger.info("runner.completed", { javaVersion: normalized.value.javaVersion, exitCode: result.value.exitCode, timedOut: result.value.timedOut });
  recordMetric("java_runner.completed", { javaVersion: normalized.value.javaVersion, exitCode: result.value.exitCode });
  return res.status(200).json({ ...result.value, requestId: logger.requestId });
}

export default withApiObservability("/api/run-code", handler);
