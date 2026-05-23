import assert from "node:assert/strict";
import test from "node:test";

import {
  createSessionSnapshot,
  loadSessionSnapshot,
  saveSessionSnapshot,
  SESSION_STORAGE_KEY,
} from "../lib/sessionPersistence.mjs";

function memoryStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

test("creates a refresh-safe snapshot without transient streaming messages", () => {
  const snapshot = createSessionSnapshot({
    candidateProfile: {
      name: "Sagar",
      position: "Developer",
      experience: "5-7 years",
      stack: "Java",
    },
    profileDraft: { name: "Draft", position: "", experience: "", stack: "" },
    messages: [
      { role: "user", content: "Explain collections" },
      { role: "assistant", content: "", streaming: true },
      { role: "assistant", content: "Score: 8/10", streaming: false },
    ],
    selectedCat: "Java Core",
    selectedSub: "Collections",
    expandedCat: "Java Core",
    mode: "interview",
    difficulty: "Hard",
    activeTab: "chat",
  });

  assert.equal(snapshot.candidateProfile.name, "Sagar");
  assert.equal(snapshot.messages.length, 2);
  assert.deepEqual(snapshot.messages[0], { role: "user", content: "Explain collections" });
  assert.deepEqual(snapshot.messages[1], { role: "assistant", content: "Score: 8/10" });
  assert.equal(snapshot.selectedCat, "Java Core");
});

test("saves and loads a valid session snapshot from storage", () => {
  const storage = memoryStorage();
  const snapshot = createSessionSnapshot({
    candidateProfile: { name: "Sagar", position: "Developer", experience: "5-7 years", stack: "Java" },
    profileDraft: { name: "", position: "", experience: "", stack: "" },
    messages: [{ role: "user", content: "Hi" }],
    selectedCat: "Java Core",
    selectedSub: null,
    expandedCat: "Java Core",
    mode: "practice",
    difficulty: "Mid",
    activeTab: "chat",
  });

  saveSessionSnapshot(storage, snapshot);

  assert.equal(JSON.parse(storage.getItem(SESSION_STORAGE_KEY)).version, 1);
  assert.deepEqual(loadSessionSnapshot(storage), snapshot);
});

test("preserves the course tab across refreshes", () => {
  const storage = memoryStorage();
  const snapshot = createSessionSnapshot({
    activeTab: "course",
  });

  saveSessionSnapshot(storage, snapshot);

  assert.equal(loadSessionSnapshot(storage).activeTab, "course");
});

test("returns null for missing or corrupt stored sessions", () => {
  assert.equal(loadSessionSnapshot(memoryStorage()), null);
  assert.equal(loadSessionSnapshot(memoryStorage({ [SESSION_STORAGE_KEY]: "not json" })), null);
});
