import {
  decodeResumeUploadRequest,
  extractResumeTextFromBuffer,
} from "../../lib/resumeExtract.mjs";
import { createRequestLogger } from "../../lib/serverLogger.mjs";
import { withApiObservability } from "../../lib/apiObservability.mjs";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "8mb",
    },
  },
};

async function handler(req, res) {
  const logger = createRequestLogger({ route: "/api/extract-resume", requestId: res.getHeader?.("X-Request-Id") || req.requestId });
  res.setHeader("X-Request-Id", logger.requestId);

  if (req.method !== "POST") {
    logger.warn("request.method_not_allowed", { method: req.method });
    return res.status(405).json({ error: "Method not allowed" });
  }

  const decoded = decodeResumeUploadRequest(req.body);
  if (!decoded.ok) {
    logger.warn("request.invalid", {
      status: decoded.status,
      reason: decoded.error,
      mimeType: req.body?.mimeType,
    });
    return res.status(decoded.status).json({ error: decoded.error, requestId: logger.requestId });
  }

  const { buffer, fileName, mimeType, kind, bytes } = decoded.value;
  logger.info("request.accepted", {
    kind,
    mimeType,
    bytes,
  });

  try {
    const text = await extractResumeTextFromBuffer({ buffer, fileName, mimeType });
    logger.info("request.done", {
      kind,
      bytes,
      textChars: text.length,
    });
    return res.status(200).json({
      text,
      fileName,
      kind,
      textChars: text.length,
      requestId: logger.requestId,
    });
  } catch (error) {
    logger.error("request.failed", { error, kind, bytes });
    return res.status(422).json({
      error: "InterviewIQ could not extract text from this resume. Please try a DOCX/PDF export or paste the resume text.",
      requestId: logger.requestId,
    });
  }
}

export default withApiObservability("/api/extract-resume", handler);
