import { createRequestLogger } from './serverLogger.mjs';

// Never log the destination, token, response body or exception message.
export async function deliverTelemetry(payload, { endpoint, token, channel, fetchImpl = fetch, logger = createRequestLogger({ route: 'telemetry' }) } = {}) {
  if (!endpoint) return false;
  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(1000),
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(payload),
    });
    // Cancel unused response bodies so the connection can be released.
    await response.body?.cancel();
    if (!response.ok) {
      logger.warn('telemetry.delivery_failed', { channel, status: response.status });
      return false;
    }
    return true;
  } catch {
    logger.warn('telemetry.delivery_failed', { channel, reason: 'network_or_timeout' });
    return false;
  }
}
