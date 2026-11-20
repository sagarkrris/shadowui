import { createRequestLogger, operationalErrorDetails, sanitizeLogMeta } from './serverLogger.mjs';
import { deliverTelemetry } from './telemetryDelivery.mjs';

const counters = new Map();

function emitMetric(payload) {
  // Metrics remain best effort. Server failures always have a local log as well.
  const metricsEndpoint = process.env.METRICS_WEBHOOK_URL;
  void deliverTelemetry(payload, {
    endpoint: metricsEndpoint || process.env.ERROR_TRACKING_WEBHOOK_URL,
    token: metricsEndpoint ? process.env.METRICS_WEBHOOK_TOKEN : process.env.ERROR_TRACKING_TOKEN,
    channel: 'metrics',
  });
}

export function estimateAiUsage({ inputChars = 0, outputChars = 0 } = {}) {
  const inputTokens = Math.ceil(Number(inputChars) / 4);
  const outputTokens = Math.ceil(Number(outputChars) / 4);
  const inputRate = Number(process.env.GEMINI_INPUT_COST_PER_MILLION || 0);
  const outputRate = Number(process.env.GEMINI_OUTPUT_COST_PER_MILLION || 0);
  return { inputTokens, outputTokens, estimatedCostUsd: Number(((inputTokens * inputRate + outputTokens * outputRate) / 1_000_000).toFixed(6)) };
}

export function recordMetric(name, value = {}) {
  counters.set(name, (counters.get(name) || 0) + 1);
  const metric = { type: "metric", name, count: counters.get(name), ...value, createdAt: new Date().toISOString() };
  emitMetric(metric);
  return metric;
}

export async function reportServerError(error, context = {}) {
  const payload = { error: operationalErrorDetails(error), context: sanitizeLogMeta(context), createdAt: new Date().toISOString() };
  const logger = createRequestLogger({ route: context.route, requestId: context.requestId });
  logger.error('server.failed', { error: payload.error });
  await deliverTelemetry(payload, {
    endpoint: process.env.ERROR_TRACKING_WEBHOOK_URL,
    token: process.env.ERROR_TRACKING_TOKEN,
    channel: 'errors',
    logger,
  });
  return payload;
}
