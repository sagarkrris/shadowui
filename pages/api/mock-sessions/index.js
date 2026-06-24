import { collaborativeMockStore } from "../../../lib/mockCollabStore.mjs";
import { createRequestLogger } from "../../../lib/serverLogger.mjs";

export default function handler(req, res) {
  const logger = createRequestLogger({ route: "/api/mock-sessions" });
  res.setHeader("X-Request-Id", logger.requestId);
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    logger.warn("request.method_not_allowed", { method: req.method });
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = collaborativeMockStore.createSession(req.body || {});
    logger.info("request.done", {
      sessionId: session.id,
      participantCount: session.participants.length,
      status: session.status,
    });
    return res.status(200).json(session);
  } catch (error) {
    logger.warn("request.invalid", { error });
    return res.status(400).json({
      error: error.message || "Invalid collaborative mock session payload.",
      requestId: logger.requestId,
    });
  }
}
