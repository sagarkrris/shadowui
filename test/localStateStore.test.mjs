import assert from "node:assert/strict";
import test from "node:test";

import {
  createMemoryStorage,
  loadVersionedState,
  saveVersionedState,
  updateVersionedState,
} from "../lib/localStateStore.mjs";

test("versioned local state adapter saves normalized payloads", () => {
  const storage = createMemoryStorage();
  const normalize = (value = {}) => ({ count: Number(value.count) || 0 });

  assert.equal(saveVersionedState(storage, {
    key: "demo:v1",
    version: 1,
    value: { count: "3" },
    normalize,
  }), true);

  assert.deepEqual(loadVersionedState(storage, {
    key: "demo:v1",
    version: 1,
    fallback: { count: 0 },
    normalize,
  }), { count: 3 });
});

test("versioned local state adapter falls back on corrupt or mismatched state", () => {
  const storage = createMemoryStorage({
    "demo:v1": "{bad json",
    "demo:v2": JSON.stringify({ version: 1, state: { count: 9 } }),
  });

  assert.deepEqual(loadVersionedState(storage, { key: "demo:v1", version: 1, fallback: { count: 0 } }), { count: 0 });
  assert.deepEqual(loadVersionedState(storage, { key: "demo:v2", version: 2, fallback: { count: 0 } }), { count: 0 });
});

test("versioned local state adapter updates from existing state", () => {
  const storage = createMemoryStorage();

  const next = updateVersionedState(storage, {
    key: "demo:v1",
    version: 1,
    fallback: { count: 1 },
    update: (state) => ({ count: state.count + 1 }),
  });

  assert.deepEqual(next, { count: 2 });
  assert.deepEqual(loadVersionedState(storage, { key: "demo:v1", version: 1, fallback: { count: 0 } }), { count: 2 });
});
