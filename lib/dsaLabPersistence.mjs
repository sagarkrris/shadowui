import {
  createDsaConfidenceState,
  DSA_CONFIDENCE_STORAGE_KEY,
} from "./blind75VisualTrack.mjs";
import { DSA_VISUAL_LAB_STORAGE_KEY } from "./dsaVisualLab.mjs";

export function loadDsaLessonId(storage) {
  if (!storage) return null;

  try {
    return storage.getItem(DSA_VISUAL_LAB_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function saveDsaLessonId(storage, lessonId) {
  if (!storage) return false;

  try {
    storage.setItem(DSA_VISUAL_LAB_STORAGE_KEY, String(lessonId || ""));
    return true;
  } catch {
    return false;
  }
}

export function loadDsaConfidenceState(storage) {
  if (!storage) return createDsaConfidenceState();

  try {
    const raw = storage.getItem(DSA_CONFIDENCE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : createDsaConfidenceState();
  } catch {
    return createDsaConfidenceState();
  }
}

export function saveDsaConfidenceState(storage, confidenceState) {
  if (!storage) return false;

  try {
    storage.setItem(DSA_CONFIDENCE_STORAGE_KEY, JSON.stringify(confidenceState || createDsaConfidenceState()));
    return true;
  } catch {
    return false;
  }
}
