import { buildCodeRunnerHealth } from "../../../lib/codeRunner.mjs";
import { createRequestLogger } from "../../../lib/serverLogger.mjs";
import { withApiObservability } from "../../../lib/apiObservability.mjs";

async function handler(req, res) {
  const logger = createRequestLogger({ route: "/api/run-code/health", requestId: res.getHeader?.("X-Request-Id") || req.requestId });
  res.setHeader("X-Request-Id", logger.requestId);

  if (req.method !== "GET") {
    logger.warn("request.method_not_allowed", { method: req.method });
    return res.status(405).json({ error: "Method not allowed", requestId: logger.requestId });
  }

  const health = buildCodeRunnerHealth();
  logger.info("request.done", {
    provider: health.provider,
    status: health.status,
    configured: health.configured,
    runnable: health.runnable,
  });

  return res.status(200).json({ ...health, requestId: logger.requestId });
}

export default withApiObservability("/api/run-code/health", handler);
