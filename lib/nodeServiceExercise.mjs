// A request-scoped service boundary. The caller owns authentication and the
// deadline; the injected adapter must cooperate with its AbortSignal.
export async function loadProfile(input, { lookup, signal } = {}) {
  if (!input || Array.isArray(input) || typeof input.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(input.id)) {
    throw new TypeError('id must contain 1–40 lowercase letters, digits or hyphens');
  }
  if (typeof lookup !== 'function' || !(signal instanceof AbortSignal)) {
    throw new TypeError('An adapter and request AbortSignal are required');
  }
  signal.throwIfAborted();
  const record = await lookup(input.id, { signal });
  // An adapter may finish at the same time as cancellation, or ignore it.
  // Never turn that late result into a successful response.
  signal.throwIfAborted();
  if (record === null) return null;
  if (!record || record.id !== input.id || typeof record.name !== 'string' || record.name.length > 80) {
    throw new TypeError('Invalid upstream profile');
  }
  return { id: record.id, name: record.name };
}

export const NODE_SERVICE_REFERENCE = `import assert from 'node:assert/strict';

${loadProfile.toString()}

const record = { id: 'u-7', name: 'Maya', internalNote: 'not public' };
const signal = new AbortController().signal;
assert.deepEqual(await loadProfile({ id: 'u-7' }, {
  signal, lookup: async () => record,
}), { id: 'u-7', name: 'Maya' });

let calls = 0;
await assert.rejects(loadProfile({ id: '../private' }, {
  signal, lookup: async () => { calls++; return record; },
}), TypeError);
assert.equal(calls, 0, 'invalid input must not reach the dependency');

const cancelled = new AbortController();
cancelled.abort(new DOMException('Client disconnected', 'AbortError'));
await assert.rejects(loadProfile({ id: 'u-7' }, {
  signal: cancelled.signal, lookup: async () => { calls++; return record; },
}), { name: 'AbortError' });
assert.equal(calls, 0, 'already-cancelled requests must not dispatch');

const during = new AbortController();
const reason = new DOMException('Request cancelled', 'AbortError');
await assert.rejects(loadProfile({ id: 'u-7' }, {
  signal: during.signal,
  lookup: async (_id, options) => {
    assert.equal(options.signal, during.signal);
    during.abort(reason);
    return record; // Deliberately uncooperative adapter returns a late value.
  },
}), error => error === reason);

const unavailable = new Error('Dependency unavailable');
await assert.rejects(loadProfile({ id: 'u-7' }, {
  signal, lookup: async () => { throw unavailable; },
}), error => error === unavailable);
assert.equal(await loadProfile({ id: 'u-7' }, {
  signal, lookup: async () => null,
}), null, 'not found is distinct from dependency failure');
console.log('All request-contract checks passed');
`;
