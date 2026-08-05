import { createRequestId, createRequestLogger } from "./serverLogger.mjs";

const VALID_REQUEST_ID = /^[A-Za-z0-9_-]{8,128}$/;

function requestIdFrom(req) {
  const headers = req.headers || {};
  const candidate = Array.isArray(headers["x-request-id"]) ? headers["x-request-id"][0] : headers["x-request-id"];
  return typeof candidate === "string" && VALID_REQUEST_ID.test(candidate) ? candidate : createRequestId();
}

export function withApiObservability(route, handler) {
  return async function observedHandler(req, res) {
    const requestId = requestIdFrom(req);
    const logger = createRequestLogger({ route, requestId });
    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);
    logger.info("request.started", { method: req.method });

    try {
      await handler(req, res);
    } catch (error) {
      logger.error("request.unhandled", { error });
      if (!res.headersSent) res.status(500).json({ error: "Unexpected server error.", requestId });
    } finally {
      logger.info("request.completed", { method: req.method, status: res.statusCode });
    }
  };
}
