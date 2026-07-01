export function createMemoryStorage(initial = {}) {
  const data = { ...initial };

  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
    removeItem(key) {
      delete data[key];
    },
    snapshot() {
      return { ...data };
    },
  };
}

function normalizeWith(value, normalize) {
  return typeof normalize === "function" ? normalize(value) : value;
}

function normalizeEnvelope(envelope = {}, normalize) {
  return {
    version: Number(envelope.version) || 1,
    savedAt: typeof envelope.savedAt === "string" && envelope.savedAt ? envelope.savedAt : new Date(0).toISOString(),
    state: normalizeWith(envelope.state, normalize),
  };
}

export function loadVersionedState(storage, {
  key,
  version = 1,
  fallback = null,
  normalize,
} = {}) {
  if (!storage || !key) return normalizeWith(fallback, normalize);

  try {
    const raw = storage.getItem(key);
    if (!raw) return normalizeWith(fallback, normalize);

    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== version || !Object.prototype.hasOwnProperty.call(parsed, "state")) {
      return normalizeWith(fallback, normalize);
    }

    return normalizeWith(parsed.state, normalize);
  } catch {
    return normalizeWith(fallback, normalize);
  }
}

export function saveVersionedState(storage, {
  key,
  version = 1,
  value,
  normalize,
} = {}) {
  if (!storage || !key) return false;

  try {
    storage.setItem(
      key,
      JSON.stringify({
        version,
        savedAt: new Date().toISOString(),
        state: normalizeWith(value, normalize),
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function resolveVersionedStateConflict(localEnvelope = {}, incomingEnvelope = {}, { normalize } = {}) {
  const local = normalizeEnvelope(localEnvelope, normalize);
  const incoming = normalizeEnvelope(incomingEnvelope, normalize);
  const localTime = Date.parse(local.savedAt);
  const incomingTime = Date.parse(incoming.savedAt);

  if (!Number.isFinite(localTime)) return { winner: "incoming", value: incoming.state };
  if (!Number.isFinite(incomingTime)) return { winner: "local", value: local.state };
  if (incomingTime > localTime) return { winner: "incoming", value: incoming.state };
  if (localTime > incomingTime) return { winner: "local", value: local.state };

  const localSize = JSON.stringify(local.state || {}).length;
  const incomingSize = JSON.stringify(incoming.state || {}).length;

  return incomingSize > localSize
    ? { winner: "incoming", value: incoming.state }
    : { winner: "local", value: local.state };
}

export function updateVersionedState(storage, {
  key,
  version = 1,
  fallback = null,
  normalize,
  update,
} = {}) {
  const current = loadVersionedState(storage, { key, version, fallback, normalize });
  const next = normalizeWith(typeof update === "function" ? update(current) : current, normalize);
  saveVersionedState(storage, { key, version, value: next, normalize });
  return next;
}
