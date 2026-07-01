import { normalizeWorkspaceTab } from "./workspaces.mjs";

export const SESSION_STORAGE_KEY = "interviewprep.session.v1";
export const SESSION_EXPORT_VERSION = 2;

const VERSION = 2;
const MAX_MESSAGES = 80;

function nullableString(value) {
  return typeof value === "string" && value ? value : null;
}

function normalizeProfile(profile) {
  if (!profile || typeof profile !== "object") return null;

  return {
    name: typeof profile.name === "string" ? profile.name : "",
    position: typeof profile.position === "string" ? profile.position : "",
    experience: typeof profile.experience === "string" ? profile.experience : "",
    stack: typeof profile.stack === "string" ? profile.stack : "",
  };
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((message) => message && (message.role === "user" || message.role === "assistant"))
    .map((message) => ({
      role: message.role,
      content: typeof message.content === "string" ? message.content : "",
    }))
    .filter((message) => message.content)
    .slice(-MAX_MESSAGES);
}

function normalizeMode(mode) {
  return mode === "practice" ? "practice" : "interview";
}

function normalizeInterviewMode(interviewMode) {
  return ["strict", "coach", "barRaiser", "behavioralStar", "realPressure"].includes(interviewMode)
    ? interviewMode
    : "strict";
}

function normalizeRoundStrategy(roundStrategy) {
  return ["recruiter", "coding", "systemDesign", "manager", "final"].includes(roundStrategy)
    ? roundStrategy
    : "coding";
}

function normalizeInterviewPanel(interviewPanel) {
  return ["recruiter", "seniorEngineer", "engineeringManager", "systemDesignArchitect", "barRaiser"].includes(interviewPanel)
    ? interviewPanel
    : "seniorEngineer";
}

function normalizeActiveTab(activeTab) {
  return normalizeWorkspaceTab(activeTab);
}

function normalizeSessionSnapshot(value = {}) {
  const candidateProfile = normalizeProfile(value.candidateProfile);

  return {
    candidateProfile,
    profileDraft: normalizeProfile(value.profileDraft) || {
      name: "",
      position: "",
      experience: "",
      stack: "",
    },
    messages: normalizeMessages(value.messages),
    selectedCat: nullableString(value.selectedCat),
    selectedSub: nullableString(value.selectedSub),
    expandedCat: nullableString(value.expandedCat),
    mode: normalizeMode(value.mode),
    interviewMode: normalizeInterviewMode(value.interviewMode),
    roundStrategy: normalizeRoundStrategy(value.roundStrategy),
    interviewPanel: normalizeInterviewPanel(value.interviewPanel),
    difficulty: typeof value.difficulty === "string" && value.difficulty ? value.difficulty : "Mid",
    activeTab: normalizeActiveTab(value.activeTab),
  };
}

function normalizeSessionEnvelope(value = {}) {
  const snapshot = normalizeSessionSnapshot(value.snapshot || value);

  return {
    version: Number.isFinite(Number(value.version)) ? Number(value.version) : VERSION,
    savedAt: typeof value.savedAt === "string" && value.savedAt ? value.savedAt : new Date().toISOString(),
    sessionId: typeof value.sessionId === "string" && value.sessionId ? value.sessionId : "",
    source: typeof value.source === "string" && value.source ? value.source : "local",
    snapshot,
  };
}

export function createSessionSnapshot(state = {}) {
  return normalizeSessionSnapshot(state);
}

export function createSessionEnvelope(snapshot, metadata = {}) {
  return normalizeSessionEnvelope({
    version: VERSION,
    savedAt: metadata.savedAt,
    sessionId: metadata.sessionId,
    source: metadata.source,
    snapshot: normalizeSessionSnapshot(snapshot),
  });
}

export function loadSessionEnvelope(storage) {
  if (!storage) return null;

  try {
    const raw = storage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.snapshot) return null;

    return normalizeSessionEnvelope(parsed);
  } catch {
    return null;
  }
}

export function loadSessionSnapshot(storage) {
  return loadSessionEnvelope(storage)?.snapshot || null;
}

export function saveSessionSnapshot(storage, snapshot) {
  if (!storage) return false;

  try {
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(createSessionEnvelope(snapshot)));
    return true;
  } catch {
    return false;
  }
}

export function exportSessionSnapshot(snapshot, metadata = {}) {
  return JSON.stringify({
    exportVersion: SESSION_EXPORT_VERSION,
    ...createSessionEnvelope(snapshot, metadata),
  });
}

export function importSessionSnapshot(value) {
  try {
    const parsed = JSON.parse(String(value || ""));
    if (!parsed || !parsed.snapshot) return null;
    return normalizeSessionSnapshot(parsed.snapshot);
  } catch {
    return null;
  }
}
