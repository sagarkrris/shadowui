import { useCallback, useEffect, useMemo, useState } from "react";

const ROLE_OPTIONS = [
  { value: "host", label: "Host interviewer" },
  { value: "candidate", label: "Candidate" },
  { value: "observer", label: "Observer" },
];

function makeLocalParticipantId(role) {
  return `${role}-${Math.random().toString(36).slice(2, 10)}`;
}

function prettyStrategy(value = "") {
  return String(value).replace(/([A-Z])/g, " $1").trim() || "coding";
}

function prettyMode(value = "") {
  return String(value).replace(/([A-Z])/g, " $1").trim() || "strict";
}

export default function CollaborativeMockRoom({ theme = {}, profile = {} }) {
  const accent = theme.accent || "#8bd3ff";
  const accentBorder = theme.accentBorder || "rgba(139,211,255,.32)";
  const accentText = theme.accentText || "#cfeeff";
  const panel = theme.panel || "rgba(13,18,30,.72)";
  const softPanel = theme.panelStrong || "rgba(19,26,40,.9)";
  const defaultName = profile?.name || "";
  const [role, setRole] = useState("host");
  const [participantName, setParticipantName] = useState(defaultName);
  const [participantId, setParticipantId] = useState(() => makeLocalParticipantId("host"));
  const [topic, setTopic] = useState("Java Spring Boot");
  const [joinCode, setJoinCode] = useState("");
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [scoreText, setScoreText] = useState("");
  const [scoreValue, setScoreValue] = useState("7");

  useEffect(() => {
    setParticipantName((value) => value || defaultName);
  }, [defaultName]);

  useEffect(() => {
    setParticipantId((current) => (
      current.startsWith(`${role}-`) ? current : makeLocalParticipantId(role)
    ));
  }, [role]);

  const sessionId = session?.id || joinCode.trim();

  const currentParticipant = useMemo(() => (
    session?.participants?.find((participant) => participant.id === participantId) || null
  ), [participantId, session]);

  const activeAnswerTurnId = session?.activeTurn?.answerTurnId || null;
  const canAskQuestion = currentParticipant?.role === "host" && !session?.activeTurn;
  const canAnswerQuestion = currentParticipant?.role === "candidate" && session?.activeTurn && !activeAnswerTurnId;
  const canScoreAnswer = currentParticipant?.role === "host" && Boolean(activeAnswerTurnId);

  const fetchJson = useCallback(async (url, options) => {
    const response = await fetch(url, options);
    const body = await response.json();

    if (!response.ok) {
      throw new Error(body?.error || "Request failed.");
    }

    return body;
  }, []);

  const refreshSession = useCallback(async (currentSessionId = sessionId) => {
    if (!currentSessionId) return;
    const [nextSession, nextSummary] = await Promise.all([
      fetchJson(`/api/mock-sessions/${encodeURIComponent(currentSessionId)}`),
      fetchJson(`/api/mock-sessions/${encodeURIComponent(currentSessionId)}/summary`),
    ]);
    setSession(nextSession);
    setSummary(nextSummary);
  }, [fetchJson, sessionId]);

  useEffect(() => {
    if (!sessionId) return undefined;

    refreshSession(sessionId).catch((fetchError) => {
      setError(fetchError.message || "Could not refresh collaborative mock session.");
    });

    const timer = window.setInterval(() => {
      refreshSession(sessionId).catch(() => {});
    }, 5000);

    return () => window.clearInterval(timer);
  }, [refreshSession, sessionId]);

  async function createRoom() {
    setPending(true);
    setError("");

    try {
      const nextSession = await fetchJson("/api/mock-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          roundStrategy: "coding",
          interviewMode: "strict",
          interviewPanel: "seniorEngineer",
          host: {
            id: participantId,
            name: participantName || "Host",
          },
        }),
      });

      setSession(nextSession);
      setJoinCode(nextSession.id);
      setQuestionText("");
      setAnswerText("");
      setScoreText("");
      const nextSummary = await fetchJson(`/api/mock-sessions/${encodeURIComponent(nextSession.id)}/summary`);
      setSummary(nextSummary);
    } catch (requestError) {
      setError(requestError.message || "Could not create collaborative mock room.");
    } finally {
      setPending(false);
    }
  }

  async function joinRoom() {
    if (!joinCode.trim()) {
      setError("Enter a room code first.");
      return;
    }

    setPending(true);
    setError("");

    try {
      const nextSession = await fetchJson(`/api/mock-sessions/${encodeURIComponent(joinCode.trim())}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: participantId,
          name: participantName || (role === "candidate" ? "Candidate" : "Observer"),
          role,
        }),
      });

      setSession(nextSession);
      const nextSummary = await fetchJson(`/api/mock-sessions/${encodeURIComponent(nextSession.id)}/summary`);
      setSummary(nextSummary);
    } catch (requestError) {
      setError(requestError.message || "Could not join collaborative mock room.");
    } finally {
      setPending(false);
    }
  }

  async function submitTurn(turn) {
    if (!session?.id) return;
    setPending(true);
    setError("");

    try {
      const nextSession = await fetchJson(`/api/mock-sessions/${encodeURIComponent(session.id)}/turns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(turn),
      });

      setSession(nextSession);
      const nextSummary = await fetchJson(`/api/mock-sessions/${encodeURIComponent(nextSession.id)}/summary`);
      setSummary(nextSummary);
      setQuestionText("");
      setAnswerText("");
      setScoreText("");
    } catch (requestError) {
      setError(requestError.message || "Could not submit turn.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16, padding: 18 }}>
      <section className="glass-card" style={{ background: panel, border: `1px solid ${accentBorder}`, borderRadius: 18, display: "grid", gap: 14, padding: 18 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" }}>Collaborative Mock</div>
          <h2 style={{ color: "#f8fbff", fontSize: 24, lineHeight: 1.1, margin: 0 }}>Interview each other in a shared room</h2>
          <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6, margin: 0 }}>Create a room, share the code, ask one question at a time, and score the answer with fast structured feedback.</p>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "#cbd5e1", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Role</span>
            <select value={role} onChange={(event) => setRole(event.target.value)} style={{ background: softPanel, border: `1px solid ${accentBorder}`, borderRadius: 10, color: "#f8fbff", padding: "10px 12px" }}>
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "#cbd5e1", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Display name</span>
            <input value={participantName} onChange={(event) => setParticipantName(event.target.value)} placeholder="Your name" style={{ background: softPanel, border: `1px solid ${accentBorder}`, borderRadius: 10, color: "#f8fbff", padding: "10px 12px" }} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "#cbd5e1", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Topic</span>
            <input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Java Spring Boot" style={{ background: softPanel, border: `1px solid ${accentBorder}`, borderRadius: 10, color: "#f8fbff", padding: "10px 12px" }} />
          </label>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" className="glass-button" disabled={pending || role !== "host"} onClick={createRoom} style={{ border: `1px solid ${accentBorder}`, borderRadius: 10, color: accentText, cursor: role !== "host" ? "not-allowed" : "pointer", opacity: role !== "host" ? .45 : 1, padding: "10px 14px" }}>
            <i className="ti ti-users-group" />Create room
          </button>
          <input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} placeholder="Room code" style={{ background: softPanel, border: `1px solid ${accentBorder}`, borderRadius: 10, color: "#f8fbff", minWidth: 180, padding: "10px 12px" }} />
          <button type="button" className="glass-button" disabled={pending || !joinCode.trim()} onClick={joinRoom} style={{ border: `1px solid ${accentBorder}`, borderRadius: 10, color: accentText, cursor: joinCode.trim() ? "pointer" : "not-allowed", opacity: joinCode.trim() ? 1 : .5, padding: "10px 14px" }}>
            <i className="ti ti-login-2" />Join room
          </button>
          {session?.id ? (
            <button type="button" className="glass-button" disabled={pending} onClick={() => refreshSession(session.id)} style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, color: "#dbeafe", padding: "10px 14px" }}>
              <i className="ti ti-refresh" />Refresh
            </button>
          ) : null}
        </div>

        {error ? <div style={{ color: "#fda4af", fontSize: 12.5 }}>{error}</div> : null}
      </section>

      {session ? (
        <>
          <section className="glass-card" style={{ background: panel, border: "1px solid rgba(255,255,255,.08)", borderRadius: 18, display: "grid", gap: 14, padding: 18 }}>
            <div style={{ alignItems: "start", display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))" }}>
              <div>
                <div style={{ color: "#64748b", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Room code</div>
                <div style={{ color: "#f8fbff", fontSize: 18, fontWeight: 900 }}>{session.id}</div>
              </div>
              <div>
                <div style={{ color: "#64748b", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Status</div>
                <div style={{ color: accentText, fontSize: 16, fontWeight: 800 }}>{session.status}</div>
              </div>
              <div>
                <div style={{ color: "#64748b", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Round</div>
                <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 700 }}>{prettyStrategy(session.roundStrategy)}</div>
              </div>
              <div>
                <div style={{ color: "#64748b", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Mode</div>
                <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 700 }}>{prettyMode(session.interviewMode)}</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <strong style={{ color: "#f8fbff", fontSize: 13 }}>Participants</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {session.participants.map((participant) => (
                  <span key={participant.id} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 999, color: participant.id === participantId ? accentText : "#cbd5e1", fontSize: 12, fontWeight: 700, padding: "7px 10px" }}>
                    {participant.name} · {participant.role}
                  </span>
                ))}
              </div>
            </div>

            {session.activeTurn ? (
              <div style={{ background: "rgba(139,211,255,.08)", border: `1px solid ${accentBorder}`, borderRadius: 14, display: "grid", gap: 6, padding: 14 }}>
                <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Active question</div>
                <div style={{ color: "#f8fbff", fontSize: 15, fontWeight: 700, lineHeight: 1.5 }}>{session.activeTurn.question}</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>
                  {session.activeTurn.answerTurnId ? "Waiting for host score and feedback." : "Waiting for candidate answer."}
                </div>
              </div>
            ) : (
              <div style={{ color: "#94a3b8", fontSize: 12.5 }}>No active question. The host can ask the next one.</div>
            )}
          </section>

          <section className="glass-card" style={{ background: panel, border: "1px solid rgba(255,255,255,.08)", borderRadius: 18, display: "grid", gap: 14, padding: 18 }}>
            <strong style={{ color: "#f8fbff", fontSize: 14 }}>Room actions</strong>

            {canAskQuestion ? (
              <div style={{ display: "grid", gap: 8 }}>
                <textarea value={questionText} onChange={(event) => setQuestionText(event.target.value)} placeholder="Ask one interview question" rows={4} style={{ background: softPanel, border: `1px solid ${accentBorder}`, borderRadius: 12, color: "#f8fbff", padding: 12, resize: "vertical" }} />
                <button type="button" className="glass-button" disabled={pending || !questionText.trim()} onClick={() => submitTurn({ type: "question", authorId: participantId, content: questionText })} style={{ border: `1px solid ${accentBorder}`, borderRadius: 10, color: accentText, justifySelf: "start", padding: "10px 14px" }}>
                  <i className="ti ti-message-question" />Ask question
                </button>
              </div>
            ) : null}

            {canAnswerQuestion ? (
              <div style={{ display: "grid", gap: 8 }}>
                <textarea value={answerText} onChange={(event) => setAnswerText(event.target.value)} placeholder="Answer the active question" rows={5} style={{ background: softPanel, border: `1px solid ${accentBorder}`, borderRadius: 12, color: "#f8fbff", padding: 12, resize: "vertical" }} />
                <button type="button" className="glass-button" disabled={pending || !answerText.trim()} onClick={() => submitTurn({ type: "answer", authorId: participantId, content: answerText })} style={{ border: `1px solid ${accentBorder}`, borderRadius: 10, color: accentText, justifySelf: "start", padding: "10px 14px" }}>
                  <i className="ti ti-send-2" />Submit answer
                </button>
              </div>
            ) : null}

            {canScoreAnswer ? (
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "grid", gap: 8, gridTemplateColumns: "110px minmax(0, 1fr)" }}>
                  <input value={scoreValue} onChange={(event) => setScoreValue(event.target.value)} placeholder="7" style={{ background: softPanel, border: `1px solid ${accentBorder}`, borderRadius: 10, color: "#f8fbff", padding: "10px 12px" }} />
                  <input value={scoreText} onChange={(event) => setScoreText(event.target.value)} placeholder="Score feedback and next gap" style={{ background: softPanel, border: `1px solid ${accentBorder}`, borderRadius: 10, color: "#f8fbff", padding: "10px 12px" }} />
                </div>
                <button type="button" className="glass-button" disabled={pending || !scoreText.trim()} onClick={() => submitTurn({ type: "score", authorId: participantId, answerTurnId: activeAnswerTurnId, content: scoreText, score: Number(scoreValue) })} style={{ border: `1px solid ${accentBorder}`, borderRadius: 10, color: accentText, justifySelf: "start", padding: "10px 14px" }}>
                  <i className="ti ti-rosette-discount-check" />Score answer
                </button>
              </div>
            ) : null}

            {!canAskQuestion && !canAnswerQuestion && !canScoreAnswer ? (
              <div style={{ color: "#94a3b8", fontSize: 12.5 }}>Join a room in the right role to ask, answer, or score the current turn.</div>
            ) : null}
          </section>

          <section className="glass-card" style={{ background: panel, border: "1px solid rgba(255,255,255,.08)", borderRadius: 18, display: "grid", gap: 14, padding: 18 }}>
            <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 10 }}>
              <strong style={{ color: "#f8fbff", fontSize: 14 }}>Session summary</strong>
              {summary?.averageScore !== null && summary?.averageScore !== undefined ? (
                <span style={{ color: accentText, fontSize: 13, fontWeight: 800 }}>Average score: {summary.averageScore}/10</span>
              ) : null}
            </div>
            <div style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.6 }}>
              {summary?.nextAction || "Create or join a room to see interview progress."}
            </div>
            {summary?.feedbackHighlights?.length ? (
              <div style={{ display: "grid", gap: 8 }}>
                {summary.feedbackHighlights.map((item, index) => (
                  <div key={`${item}-${index}`} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, color: "#e2e8f0", fontSize: 12.5, lineHeight: 1.5, padding: 12 }}>
                    {item}
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
