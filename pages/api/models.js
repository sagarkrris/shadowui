import { createRequestLogger } from "../../lib/serverLogger.mjs";
import { withApiObservability } from "../../lib/apiObservability.mjs";

async function handler(req, res) {
  const logger = createRequestLogger({ route: "/api/models", requestId: res.getHeader?.("X-Request-Id") || req.requestId });
  res.setHeader("X-Request-Id", logger.requestId);

  if (req.method !== "GET") {
    logger.warn("request.method_not_allowed", { method: req.method });
    return res.status(405).json({ error: "Method not allowed" });
  }

  const configured = Boolean(process.env.GEMINI_API_KEY);
  logger.info("request.done", { configured });
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    configured,
    message: "Model diagnostics are disabled so API-key-backed provider details are not exposed in browser inspection.",
  });
}

export default withApiObservability("/api/models", handler);
