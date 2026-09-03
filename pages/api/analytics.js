import { normalizeAnalyticsEvent } from "../../lib/analytics.mjs";
import { recordMetric } from "../../lib/observability.mjs";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  if (req.headers["content-length"] && Number(req.headers["content-length"]) > 4096) return res.status(413).json({ error: "Analytics payload is too large." });
  const event = normalizeAnalyticsEvent(req.body);
  if (!event) return res.status(400).json({ error: "Unsupported analytics event." });
  recordMetric(`product.${event.name}`, { path: event.path, value: event.value || undefined });
  return res.status(204).end();
}
