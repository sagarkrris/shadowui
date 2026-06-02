import {
  buildCodeRunnerError,
} from "../../../lib/codeRunner.mjs";
import { createRequestLogger } from "../../../lib/serverLogger.mjs";

export default async function handler(req, res) {
  const logger = createRequestLogger({ route: "/api/run-code" });
  res.setHeader("X-Request-Id", logger.requestId);

  if (req.method !== "POST") {
    logger.warn("request.method_not_allowed", { method: req.method });
    return res.status(405).json({ error: "Method not allowed" });
  }

  const runnerError = buildCodeRunnerError({
    status: 503,
    body: { message: "Code runner is not configured." },
  });
  logger.warn("runner.upcoming");
  return res.status(runnerError.status).json({ ...runnerError, requestId: logger.requestId });
}
