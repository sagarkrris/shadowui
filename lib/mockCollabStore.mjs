import {
  appendCollaborativeMockTurn,
  createCollaborativeMockSession,
  joinCollaborativeMockSession,
  summarizeCollaborativeMockSession,
} from "./mockCollabSession.mjs";

function cloneValue(value) {
  return globalThis.structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

export function createCollaborativeMockStore() {
  const sessions = new Map();

  return {
    createSession(input) {
      const session = createCollaborativeMockSession(input);
      sessions.set(session.id, session);
      return cloneValue(session);
    },
    getSession(sessionId) {
      const session = sessions.get(String(sessionId || ""));
      return session ? cloneValue(session) : null;
    },
    joinSession(sessionId, participant) {
      const existing = sessions.get(String(sessionId || ""));
      if (!existing) return null;
      const session = joinCollaborativeMockSession(existing, participant);
      sessions.set(session.id, session);
      return cloneValue(session);
    },
    appendTurn(sessionId, turn) {
      const existing = sessions.get(String(sessionId || ""));
      if (!existing) return null;
      const session = appendCollaborativeMockTurn(existing, turn);
      sessions.set(session.id, session);
      return cloneValue(session);
    },
    getSummary(sessionId) {
      const existing = sessions.get(String(sessionId || ""));
      return existing ? summarizeCollaborativeMockSession(existing) : null;
    },
    reset() {
      sessions.clear();
    },
  };
}

export const collaborativeMockStore = createCollaborativeMockStore();
