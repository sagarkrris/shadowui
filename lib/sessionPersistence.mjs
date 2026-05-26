export const SESSION_STORAGE_KEY = "interviewprep.session.v1";

const VERSION = 1;
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
  return ["strict", "coach", "barRaiser", "behavioralStar"].includes(interviewMode)
    ? interviewMode
    : "strict";
}

function normalizeRoundStrategy(roundStrategy) {
  return ["recruiter", "coding", "systemDesign", "manager", "final"].includes(roundStrategy)
    ? roundStrategy
    : "coding";
}

function normalizeActiveTab(activeTab) {
  return activeTab === "company" || activeTab === "course" ? activeTab : "chat";
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
    difficulty: typeof value.difficulty === "string" && value.difficulty ? value.difficulty : "Mid",
    activeTab: normalizeActiveTab(value.activeTab),
  };
}

export function createSessionSnapshot(state = {}) {
  return normalizeSessionSnapshot(state);
}

export function loadSessionSnapshot(storage) {
  if (!storage) return null;

  try {
    const raw = storage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== VERSION || !parsed.snapshot) return null;

    return normalizeSessionSnapshot(parsed.snapshot);
  } catch {
    return null;
  }
}

export function saveSessionSnapshot(storage, snapshot) {
  if (!storage) return false;

  try {
    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        version: VERSION,
        savedAt: new Date().toISOString(),
        snapshot: normalizeSessionSnapshot(snapshot),
      }),
    );
    return true;
  } catch {
    return false;
  }
}
