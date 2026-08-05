import { getCompanyPrep } from "../../lib/companyPrep.mjs";
import { createRequestLogger } from "../../lib/serverLogger.mjs";
import { withApiObservability } from "../../lib/apiObservability.mjs";

function handler(req, res) {
  const logger = createRequestLogger({ route: "/api/company-prep", requestId: res.getHeader?.("X-Request-Id") || req.requestId });
  res.setHeader("X-Request-Id", logger.requestId);

  if (req.method !== "GET") {
    logger.warn("request.method_not_allowed", { method: req.method });
    return res.status(405).json({ error: "Method not allowed" });
  }

  const company = String(req.query.company || "").trim();
  logger.info("request.accepted", {
    hasCompany: Boolean(company),
    companyLength: company.length,
  });
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(getCompanyPrep(company));
  logger.info("request.done", { status: 200 });
}

export default withApiObservability("/api/company-prep", handler);
