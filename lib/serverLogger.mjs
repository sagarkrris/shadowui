import { randomUUID } from "node:crypto";

const REDACTED = "[redacted]";
const SENSITIVE_KEY_PATTERN = /api.?key|authorization|token|secret|password|base64|messages|content|prompt/i;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Error);
}

export function sanitizeLogMeta(value) {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      status: value.status,
      code: value.code,
    };
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
