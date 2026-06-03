import assert from "node:assert/strict";
import test from "node:test";

import { DSA_CONFIDENCE_STORAGE_KEY } from "../lib/blind75VisualTrack.mjs";
import { createMemoryStorage } from "../lib/localStateStore.mjs";
import { DSA_VISUAL_LAB_STORAGE_KEY } from "../lib/dsaVisualLab.mjs";
import {
  loadDsaConfidenceState,
  loadDsaLessonId,
  saveDsaConfidenceState,
  saveDsaLessonId,
} from "../lib/dsaLabPersistence.mjs";

test("DSA lab persistence reads and writes the selected lesson id", () => {
  const storage = createMemoryStorage();

  assert.equal(loadDsaLessonId(storage), null);
  assert.equal(saveDsaLessonId(storage, "blind75-two-sum"), true);
  assert.equal(loadDsaLessonId(storage), "blind75-two-sum");
  assert.equal(storage.getItem(DSA_VISUAL_LAB_STORAGE_KEY), "blind75-two-sum");
});

test("DSA lab persistence reads and writes confidence state with fallback", () => {
  const storage = createMemoryStorage();
  const fallback = loadDsaConfidenceState(storage);

  assert.deepEqual(fallback.problems, {});
  assert.equal(saveDsaConfidenceState(storage, { problems: { twoSum: { status: "mastered" } } }), true);

  const loaded = loadDsaConfidenceState(storage);
  assert.equal(loaded.problems.twoSum.status, "mastered");
  assert.match(storage.getItem(DSA_CONFIDENCE_STORAGE_KEY), /twoSum/);
});

test("DSA lab persistence falls back when storage is corrupt", () => {
  const storage = createMemoryStorage({ [DSA_CONFIDENCE_STORAGE_KEY]: "{bad json" });

  assert.deepEqual(loadDsaConfidenceState(storage).problems, {});
});
