import { randomUUID } from "node:crypto";

const REDACTED = "[redacted]";
const SENSITIVE_KEY_PATTERN = /api.?key|authorization|token|secret|password|base64|messages|content|prompt/i;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Error);
}

export function sanitizeLogMeta(value) {
  if (value instanceof Error) {
    return operationalErrorDetails(value);
  }

  if (Array.isArray(value)) return value.map(sanitizeLogMeta);
  if (!isPlainObject(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : sanitizeLogMeta(entry),
    ]),
  );
}

// Keep raw exception messages/stacks out of new operational failure events:
// providers and databases can embed credentials, queries, or submitted content.
export function operationalErrorDetails(error) {
  const name = ['Error', 'TypeError', 'RangeError', 'SyntaxError', 'AbortError', 'TimeoutError', 'AggregateError'].includes(error?.name) ? error.name : 'Error';
  const code = typeof error?.code === 'string' && /^[A-Z0-9_]{2,40}$/.test(error.code) ? error.code : undefined;
  return { name, ...(code ? { code } : {}), ...(Number.isInteger(error?.status) ? { status: error.status } : {}) };
}

export function logOperationalFailure(req, route, event, error) {
  createRequestLogger({ route, requestId: req.requestId }).error(event, { error: operationalErrorDetails(error) });
}

export function createRequestId() {
  return `req_${randomUUID().slice(0, 8)}`;
}

export function createRequestLogger({
  route,
  requestId = createRequestId(),
  sink = console,
  now = Date.now,
} = {}) {
  const startedAt = now();

  const write = (level, event, meta = {}) => {
    const payload = sanitizeLogMeta({
      level,
      route,
      requestId,
      event,
      elapsedMs: now() - startedAt,
      ...meta,
    });

    if (level === "error") {
      sink.error?.(payload);
    } else if (level === "warn") {
      sink.warn?.(payload);
    } else {
      (sink.log || sink.info)?.(payload);
    }
  };

  return {
    requestId,
    info(event, meta) {
      write("info", event, meta);
    },
    warn(event, meta) {
      write("warn", event, meta);
    },
    error(event, meta) {
      write("error", event, meta);
    },
  };
}
