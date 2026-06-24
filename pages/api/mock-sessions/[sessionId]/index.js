import { collaborativeMockStore } from "../../../../lib/mockCollabStore.mjs";
import { createRequestLogger } from "../../../../lib/serverLogger.mjs";

export default function handler(req, res) {
  const logger = createRequestLogger({ route: "/api/mock-sessions/[sessionId]" });
  res.setHeader("X-Request-Id", logger.requestId);
  res.setHeader("Cache-Control", "no-store");

  const sessionId = String(req.query?.sessionId || "").trim();
  if (!sessionId) {
    logger.warn("request.missing_session_id");
    return res.status(400).json({ error: "Session id is required.", requestId: logger.requestId });
  }

  if (req.method === "GET") {
    const session = collaborativeMockStore.getSession(sessionId);
    if (!session) {
      logger.warn("request.not_found", { sessionId });
      return res.status(404).json({ error: "Session not found.", requestId: logger.requestId });
    }

    logger.info("request.done", { sessionId, participantCount: session.participants.length });
    return res.status(200).json(session);
  }

  if (req.method === "POST") {
    try {
      const session = collaborativeMockStore.joinSession(sessionId, req.body || {});
      if (!session) {
        logger.warn("request.not_found", { sessionId });
        return res.status(404).json({ error: "Session not found.", requestId: logger.requestId });
      }

      logger.info("request.done", { sessionId, participantCount: session.participants.length });
      return res.status(200).json(session);
    } catch (error) {
      logger.warn("request.invalid", { sessionId, error });
      return res.status(400).json({
        error: error.message || "Invalid participant payload.",
        requestId: logger.requestId,
      });
    }
  }

  logger.warn("request.method_not_allowed", { method: req.method, sessionId });
  return res.status(405).json({ error: "Method not allowed" });
}
