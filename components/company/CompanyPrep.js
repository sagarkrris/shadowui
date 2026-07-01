import { useEffect, useState } from "react";
import { buildCompanyMockPrompt, buildCompanyPrepRoom, buildCompanyProviderStatus, buildCompanyReadinessScore, buildQuestionBankRefreshState, markQuestionBankVerified } from "../../lib/companyPrep.mjs";
import ApplicationTrackerPanel from "./ApplicationTrackerPanel";
import BeginnerGuideBanner from "../BeginnerGuideBanner";

const QUESTION_BANK_REFRESH_KEY = "interviewiq.companyPrep.refresh.v1";
const CAREER_TOOLKIT_STORAGE_KEY = "interviewiq.careerToolkit.v1";
const COMPANY_ROUND_MAP_KEY = "interviewiq.companyPrep.roundMap.v1";

async function readJsonIfAvailable(response) {
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("application/json")) {
    throw new Error("Expected JSON response");
  }

  return response.json();
}

function readCareerToolkitState() {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(window.localStorage.getItem(CAREER_TOOLKIT_STORAGE_KEY) || "{}")?.state || {};
  } catch {
    return {};
  }
}

function focusedCompanyQuestions(prep, topic) {
  if (!prep || !topic) return [];

  const topicText = String(topic);
  const base = [
    ...prep.dsa.map((item) => ({ ...item, type: "DSA" })),
    ...prep.systemDesign.map((item) => ({ ...item, type: "System Design" })),
  ];
  const matches = base.filter((item) => {
    const text = `${item.title} ${item.prompt} ${item.source}`.toLowerCase();
    return topicText.toLowerCase().split(/[^a-z0-9+#]+/i).filter(Boolean).some((part) => text.includes(part));
  });

  return (matches.length ? matches : base.slice(0, 3)).slice(0, 3).map((item, index) => ({
    ...item,
    title: `${topicText}: ${item.title}`,
    prompt: `${item.prompt} Connect your answer back to ${topicText} and ${prep.company}.`,
    id: `${topicText}-${index}-${item.title}`,
  }));
}

function QuestionList({ title, icon, items, company, type, theme, onMock }) {
  return (
    <section style={{ borderTop: `1px solid ${theme.accentBorder}`, paddingTop: 12 }}>
      <h2 style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#e8e8f0", marginBottom: 10 }}>
        <i className={`ti ${icon}`} style={{ color: theme.accentStrong }} />{title}
      </h2>
      <div style={{ display: "grid", gap: 8 }}>
        {items.map((item) => (
          <article key={`${type}-${item.title}`} className="glass-card" style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
              <strong style={{ fontSize: 12.5, color: theme.accentText }}>{item.title}</strong>
              <span style={{ fontSize: 10, color: "#6b7280", whiteSpace: "nowrap" }}>{item.difficulty}</span>
            </div>
            <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.55, marginBottom: 8 }}>{item.prompt}</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 10.5, color: "#4b5563" }}>{item.source} - {item.date}</span>
              <button className="glass-button" onClick={() => onMock(buildCompanyMockPrompt({ ...item, company, type }))} style={{ display: "inline-flex", alignItems: "center", gap: 5, border: `1px solid ${theme.accentBorder}`, color: theme.accentText, borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 600 }}>
                <i className="ti ti-player-play" />Mock
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function readRoundMapState(company) {
  if (typeof window === "undefined") return {};

  try {
    const parsed = JSON.parse(window.localStorage.getItem(COMPANY_ROUND_MAP_KEY) || "{}");
    return parsed?.[company] || {};
  } catch {
    return {};
  }
}

function saveRoundMapState(company, state) {
  if (typeof window === "undefined" || !company) return;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(COMPANY_ROUND_MAP_KEY) || "{}");
    window.localStorage.setItem(COMPANY_ROUND_MAP_KEY, JSON.stringify({ ...parsed, [company]: state }));
  } catch {
    // Round tracking is local-only; prep content should keep working without storage.
  }
}

function buildDefaultRoundMap(prepRoom, weakSpots = []) {
  const rounds = prepRoom?.interviewRounds?.length ? prepRoom.interviewRounds : [
    { id: "recruiter", name: "Recruiter", focus: "Role fit", detail: "Clarify background, motivation, and logistics." },
    { id: "coding", name: "Coding", focus: "DSA", detail: "Solve a coding prompt with dry run, edge cases, and complexity." },
    { id: "system-design", name: "System Design", focus: "Architecture", detail: "Discuss requirements, APIs, storage, scaling, and trade-offs." },
    { id: "manager", name: "Manager", focus: "Behavioral", detail: "Show ownership, conflict handling, and delivery judgment." },
  ];

  return rounds.map((round, index) => {
    const text = `${round.name} ${round.focus} ${round.detail}`.toLowerCase();
    const weakMatches = weakSpots.filter((spot) => text.includes(String(spot).toLowerCase()));

    return {
      ...round,
      order: index + 1,
      weakMatches,
      defaultStatus: weakMatches.length ? "weak" : "planned",
    };
  });
}

function RoundMap({ prep, prepRoom, weakSpots, state, theme, onUpdate, onMock, onActivity }) {
  const rounds = buildDefaultRoundMap(prepRoom, weakSpots);
  const statusTone = {
    planned: theme.accentStrong,
    practiced: "#a7f3d0",
    weak: "#fda4af",
  };

  const setStatus = (round, status) => {
    const next = {
      ...state,
      [round.id]: {
        ...(state[round.id] || {}),
        status,
        updatedAt: new Date().toISOString(),
      },
    };
    onUpdate(next);
    onActivity?.({
      workspaceId: "company",
      type: status === "weak" ? "review" : "practice",
      label: status === "weak" ? "Marked company round weak" : "Marked company round practiced",
      detail: `${prep.company} ${round.name}`,
    });
  };

  return (
    <section className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, display: "grid", gap: 11, padding: 12 }}>
      <div style={{ alignItems: "start", display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ color: theme.accentText, fontSize: 14, display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <i className="ti ti-route" />Round Map
          </h2>
          <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.45 }}>
            Recruiter to final loop, with local weak-spot status per round.
          </p>
        </div>
        <span style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 999, color: theme.accentStrong, fontSize: 10.5, fontWeight: 900, padding: "5px 8px" }}>
          {prep.company}
        </span>
      </div>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))" }}>
        {rounds.map((round) => {
          const saved = state[round.id] || {};
          const status = saved.status || round.defaultStatus;
          const tone = statusTone[status] || theme.accentStrong;
          const mockPrompt = [
            `Run a ${prep.company} ${round.name} round for ${prepRoom?.roleContext || "my target role"}.`,
            `Round focus: ${round.focus}.`,
            `Round detail: ${round.detail}.`,
            round.weakMatches.length ? `Pay special attention to weak spots: ${round.weakMatches.join(", ")}.` : "Score clarity, depth, and interview readiness.",
          ].join("\n");

          return (
            <article key={round.id} style={{ background: "rgba(0,0,0,.14)", border: `1px solid ${tone}40`, borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
              <div style={{ alignItems: "center", display: "flex", gap: 7, justifyContent: "space-between" }}>
                <span style={{ color: tone, fontSize: 10.5, fontWeight: 950, textTransform: "uppercase" }}>Round {round.order}</span>
                <span style={{ color: tone, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{status}</span>
              </div>
              <strong style={{ color: "#f8fbff", fontSize: 12.5, lineHeight: 1.35 }}>{round.name}</strong>
              <span style={{ color: "#cbd5e1", fontSize: 11.2, lineHeight: 1.4 }}>{round.focus}</span>
              <span style={{ color: "#9ca3af", fontSize: 10.8, lineHeight: 1.4 }}>{round.detail}</span>
              {round.weakMatches.length ? (
                <span style={{ color: "#fecdd3", fontSize: 10.5, lineHeight: 1.35 }}>Weak spot: {round.weakMatches.join(", ")}</span>
              ) : null}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button type="button" className="glass-button" onClick={() => onMock(mockPrompt)} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 7, color: theme.accentText, cursor: "pointer", fontSize: 10.5, fontWeight: 850, padding: "6px 8px" }}>
                  <i className="ti ti-player-play" />Mock
                </button>
                <button type="button" onClick={() => setStatus(round, "practiced")} style={{ background: "rgba(167,243,208,.07)", border: "1px solid rgba(167,243,208,.24)", borderRadius: 7, color: "#a7f3d0", cursor: "pointer", fontSize: 10.5, fontWeight: 850, padding: "6px 8px" }}>
                  Practiced
                </button>
                <button type="button" onClick={() => setStatus(round, "weak")} style={{ background: "rgba(253,164,175,.07)", border: "1px solid rgba(253,164,175,.24)", borderRadius: 7, color: "#fda4af", cursor: "pointer", fontSize: 10.5, fontWeight: 850, padding: "6px 8px" }}>
                  Weak
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function CompanyPrep({ theme, weakSpots, mockScores = [], messages = [], selectedCat, selectedSub, onMock, beginnerMode = false, beginnerStep = "watch", onBeginnerStepChange, onActivity, applications = [], onApplicationsChange }) {
  const [query, setQuery] = useState("Amazon");
  const [roleContext, setRoleContext] = useState("");
  const [companyPrep, setCompanyPrep] = useState(null);
  const [refreshState, setRefreshState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roundMapState, setRoundMapState] = useState({});

  const loadCompany = async (company = query) => {
    const trimmed = company.trim() || "Amazon";
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/company-prep?company=${encodeURIComponent(trimmed)}`);
      if (!response.ok) throw new Error("Company prep lookup failed");
      const data = await readJsonIfAvailable(response);
      setCompanyPrep(data);
      setRefreshState(readRefreshState(data.company));
      setRoundMapState(readRoundMapState(data.company));
    } catch (err) {
      setError(err.message || "Could not load company prep");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompany("Amazon");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const readRefreshState = (company) => {
    if (typeof window === "undefined") return null;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(QUESTION_BANK_REFRESH_KEY) || "{}");
      return parsed[company] || null;
    } catch {
      return null;
    }
  };

  const saveRefreshState = (nextState) => {
    if (typeof window === "undefined" || !nextState?.company) return;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(QUESTION_BANK_REFRESH_KEY) || "{}");
      window.localStorage.setItem(QUESTION_BANK_REFRESH_KEY, JSON.stringify({ ...parsed, [nextState.company]: nextState }));
    } catch {
      // Local refresh metadata is optional; Company Prep still works without storage.
    }
  };

  const refreshLocalBank = () => {
    const nextState = buildQuestionBankRefreshState({ prep });
    setRefreshState(nextState);
    saveRefreshState(nextState);
    onActivity?.({
      workspaceId: "company",
      type: "refresh",
      label: "Refreshed company question bank",
      detail: prep?.company || "Company prep",
    });
  };

  const markVerified = (questionId) => {
    const baseState = refreshState || buildQuestionBankRefreshState({ prep });
    const nextState = markQuestionBankVerified(baseState, { questionId });
    setRefreshState(nextState);
    saveRefreshState(nextState);
    onActivity?.({
      workspaceId: "company",
      type: "review",
      label: "Verified company question",
      detail: questionId,
    });
  };
  const updateRoundMapState = (nextState) => {
    setRoundMapState(nextState);
    saveRoundMapState(prep?.company, nextState);
  };

  const prep = companyPrep;
  const topicFocus = selectedSub || selectedCat;
  const focusQuestions = focusedCompanyQuestions(prep, topicFocus);
  const careerToolkitState = readCareerToolkitState();
  const prepRoom = prep ? buildCompanyPrepRoom({
    prep,
    roleContext,
    selectedCat,
    selectedSub,
    careerToolkitState,
    messages,
  }) : null;
  const readiness = buildCompanyReadinessScore({
    prep,
    refreshState,
    weakSpots,
    mockScores,
    messages,
    resumeAnalysis: careerToolkitState.resumeAnalysis,
    jobDescriptionAnalysis: careerToolkitState.jobDescriptionAnalysis,
  });
  const providerStatus = buildCompanyProviderStatus({ prep, refreshState });

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px 22px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 14 }}>
        <BeginnerGuideBanner
          enabled={beginnerMode}
          accent={theme.accentStrong}
          currentStep={beginnerStep}
          onStepSelect={onBeginnerStepChange}
          detail="For company prep: pick one round, predict what the interviewer wants, explain one answer, practice a mock, then mark the round Practiced or Weak."
        />

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px" }}>
            <h1 style={{ fontSize: 18, color: "#e8e8f0", marginBottom: 4 }}>Company Prep</h1>
            <p style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.5 }}>Publicly reported questions, mock interviews, weak spots, and source links.</p>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); loadCompany(); }} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: 7, flex: "1 1 430px", minWidth: 0 }}>
            <input className="glass-input" aria-label="Company search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company, e.g. Amazon" style={{ minWidth: 0, border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, padding: "9px 11px", color: "#e8e8f0", outline: "none", fontSize: 13 }} />
            <input className="glass-input" aria-label="Role context" value={roleContext} onChange={(event) => setRoleContext(event.target.value)} placeholder="Role context, e.g. SDE II backend" style={{ minWidth: 0, border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, padding: "9px 11px", color: "#e8e8f0", outline: "none", fontSize: 13 }} />
            <button className="glass-button" disabled={loading} style={{ border: `1px solid ${theme.accentBorder}`, color: theme.accentText, borderRadius: 8, padding: "0 13px", fontSize: 12, fontWeight: 700 }}>
              {loading ? "Loading" : "Search"}
            </button>
          </form>
        </div>

        {error && <div style={{ color: "#f87171", fontSize: 12 }}>{error}</div>}

        {prep && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
              {[
                ["DSA", prep.dsa.length, "ti-code"],
                ["System Design", prep.systemDesign.length, "ti-topology-star"],
                ["Behavioral", prep.behavioral.length, "ti-users"],
                ["Resources", prep.resources.length, "ti-link"],
                ["Readiness", `${readiness.score}%`, "ti-gauge"],
              ].map(([label, value, icon]) => (
                <div key={label} className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 700 }}><i className={`ti ${icon}`} />{label}</div>
                  <div style={{ color: "#e8e8f0", fontSize: 20, fontWeight: 700, marginTop: 4 }}>{value}</div>
                </div>
              ))}
            </div>

            <div className="glass-card" style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ color: theme.accentText, fontSize: 15, marginBottom: 4 }}>{prep.company} Interview Console</h2>
                  <p style={{ color: "#6b7280", fontSize: 12, lineHeight: 1.5 }}>{prep.caveat}</p>
                </div>
                <span style={{ color: "#4b5563", fontSize: 11 }}>Updated {prep.lastUpdated}</span>
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
                {prep.resources.slice(0, 3).map((resource) => (
                  <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer" className="glass-button" style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${theme.accentBorder}`, borderRadius: 999, padding: "5px 9px", color: theme.accentText, textDecoration: "none", fontSize: 10.8, fontWeight: 800 }}>
                    <i className="ti ti-external-link" />{resource.label}
                  </a>
                ))}
                <button className="glass-button" onClick={refreshLocalBank} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${theme.accentBorder}`, borderRadius: 999, padding: "5px 9px", color: theme.accentText, fontSize: 10.8, fontWeight: 800 }}>
                  <i className="ti ti-refresh" />Refresh local bank
                </button>
              </div>
              {refreshState && (
                <div style={{ marginTop: 9, border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8 }}>
                  <div style={{ color: theme.accentText, fontSize: 11.5, fontWeight: 800, marginBottom: 3 }}>Local refresh log</div>
                  <p style={{ color: "#9ca3af", fontSize: 10.8, lineHeight: 1.45 }}>
                    Refreshed {new Date(refreshState.refreshedAt).toLocaleString()} from {refreshState.sourceLinks.length} source links. No live scraping claimed.
                  </p>
                </div>
              )}
            </div>

            {prepRoom && (
              <section className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 11 }}>
                  <div>
                    <h2 style={{ color: theme.accentText, fontSize: 15, display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                      <i className="ti ti-door" />{prepRoom.company} Prep Room
                    </h2>
                    <p style={{ color: "#9ca3af", fontSize: 11.8, lineHeight: 1.45 }}>Role context: {prepRoom.roleContext}</p>
                  </div>
                  <span style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 999, padding: "5px 9px", color: theme.accentStrong, fontSize: 10.8, fontWeight: 900 }}>
                    {prepRoom.topicFocus}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 8, marginBottom: 12 }}>
                  {prepRoom.notes.map((note) => (
                    <div key={note.id} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 9 }}>
                      <strong style={{ display: "block", color: theme.accentText, fontSize: 11.5, marginBottom: 4 }}>{note.label}</strong>
                      <span style={{ display: "block", color: "#9ca3af", fontSize: 10.8, lineHeight: 1.45 }}>{note.detail}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))", gap: 12 }}>
                  <section>
                    <h3 style={{ color: "#e8e8f0", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <i className="ti ti-route" style={{ color: theme.accentStrong }} />Interview Rounds
                    </h3>
                    <div style={{ display: "grid", gap: 7 }}>
                      {prepRoom.interviewRounds.map((round) => (
                        <div key={round.id} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8 }}>
                          <strong style={{ display: "block", color: theme.accentText, fontSize: 11.5, marginBottom: 3 }}>{round.name}</strong>
                          <span style={{ display: "block", color: "#cbd5e1", fontSize: 10.8, marginBottom: 3 }}>{round.focus}</span>
                          <span style={{ display: "block", color: "#6b7280", fontSize: 10.5, lineHeight: 1.4 }}>{round.detail}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 style={{ color: "#e8e8f0", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <i className="ti ti-alert-hexagon" style={{ color: theme.accentStrong }} />JD Gaps
                    </h3>
                    <div style={{ display: "grid", gap: 7 }}>
                      {prepRoom.jdGaps.length ? prepRoom.jdGaps.map((gap) => (
                        <button key={gap.id} className="glass-button" onClick={() => onMock(`Mock me on this ${prepRoom.company} JD gap for ${prepRoom.roleContext}: ${gap.name}. ${gap.action}`)} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8, textAlign: "left", cursor: "pointer" }}>
                          <strong style={{ display: "block", color: theme.accentText, fontSize: 11.5, marginBottom: 3 }}>{gap.name}</strong>
                          <span style={{ display: "block", color: "#9ca3af", fontSize: 10.8, lineHeight: 1.4 }}>{gap.action}</span>
                        </button>
                      )) : (
                        <p style={{ color: "#6b7280", fontSize: 11.3, lineHeight: 1.45 }}>Run JD analysis in Career Toolkit to fill company-specific gaps here.</p>
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 style={{ color: "#e8e8f0", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <i className="ti ti-message-question" style={{ color: theme.accentStrong }} />Likely Questions
                    </h3>
                    <div style={{ display: "grid", gap: 7 }}>
                      {prepRoom.likelyQuestions.slice(0, 5).map((question) => (
                        <button key={question.id} className="glass-button" onClick={() => onMock(question.prompt)} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8, textAlign: "left", cursor: "pointer" }}>
                          <strong style={{ display: "block", color: theme.accentText, fontSize: 11.5, marginBottom: 3 }}>{question.question}</strong>
                          <span style={{ color: "#6b7280", fontSize: 10.5 }}>{question.source}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 style={{ color: "#e8e8f0", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <i className="ti ti-bookmarks" style={{ color: theme.accentStrong }} />Story References
                    </h3>
                    {prepRoom.storyReferences.length ? (
                      <div style={{ display: "grid", gap: 7 }}>
                        {prepRoom.storyReferences.map((story) => (
                          <button key={story.id} className="glass-button" onClick={() => onMock(story.prompt)} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8, textAlign: "left", cursor: "pointer" }}>
                            <strong style={{ display: "block", color: theme.accentText, fontSize: 11.5, marginBottom: 3 }}>{story.title}</strong>
                            <span style={{ display: "block", color: "#9ca3af", fontSize: 10.8, lineHeight: 1.4 }}>{story.result}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: "#6b7280", fontSize: 11.3, lineHeight: 1.45 }}>No saved story references yet. Strong scored mocks will create reusable proof material.</p>
                    )}
                  </section>
                </div>

                <section style={{ borderTop: `1px solid ${theme.accentBorder}`, marginTop: 12, paddingTop: 11 }}>
                  <h3 style={{ color: "#e8e8f0", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <i className="ti ti-calendar-check" style={{ color: theme.accentStrong }} />Final-Day Checklist
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 7, marginBottom: 10 }}>
                    {prepRoom.finalDayChecklist.map((item) => (
                      <div key={item} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8, color: "#9ca3af", fontSize: 10.8, lineHeight: 1.4 }}>
                        {item}
                      </div>
                    ))}
                  </div>
                  <button className="glass-button" onClick={() => onMock(prepRoom.finalDayActionPrompt)} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 8, color: theme.accentText, fontSize: 11.5, fontWeight: 800, cursor: "pointer", width: "100%", textAlign: "left" }}>
                    <i className="ti ti-player-play" />Run final-day rehearsal
                  </button>
                </section>
              </section>
            )}

            {prepRoom && (
              <RoundMap
                prep={prep}
                prepRoom={prepRoom}
                weakSpots={weakSpots}
                state={roundMapState}
                theme={theme}
                onUpdate={updateRoundMapState}
                onMock={onMock}
                onActivity={onActivity}
              />
            )}

            <section className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <div>
                  <h2 style={{ color: theme.accentText, fontSize: 13, display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                    <i className="ti ti-plug-connected" />Provider Status
                  </h2>
                  <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.45 }}>{providerStatus.note}</p>
                </div>
                <strong style={{ color: providerStatus.ageDays !== null && providerStatus.ageDays <= 30 ? "#86efac" : theme.accentStrong, fontSize: 12 }}>
                  {providerStatus.freshnessLabel}
                </strong>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginBottom: 10 }}>
                <div style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8 }}>
                  <div style={{ color: "#6b7280", fontSize: 10.5, marginBottom: 3 }}>Provider</div>
                  <strong style={{ color: "#e8e8f0", fontSize: 12 }}>{providerStatus.provider}</strong>
                </div>
                <div style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8 }}>
                  <div style={{ color: "#6b7280", fontSize: 10.5, marginBottom: 3 }}>Freshness</div>
                  <strong style={{ color: "#e8e8f0", fontSize: 12 }}>{providerStatus.ageDays === null ? "Unknown" : `${providerStatus.ageDays}d old`}</strong>
                </div>
                <div style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8 }}>
                  <div style={{ color: "#6b7280", fontSize: 10.5, marginBottom: 3 }}>Verified</div>
                  <strong style={{ color: "#e8e8f0", fontSize: 12 }}>{providerStatus.verifiedCount}</strong>
                </div>
              </div>
              <button className="glass-button" onClick={refreshLocalBank} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 8, color: theme.accentText, fontSize: 11.5, fontWeight: 800, cursor: "pointer", width: "100%", textAlign: "left" }}>
                <i className="ti ti-refresh" />Refresh local bank
              </button>
            </section>

            <section className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <div>
                  <h2 style={{ color: theme.accentText, fontSize: 13, display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                    <i className="ti ti-gauge" />Company Readiness
                  </h2>
                  <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.45 }}>{readiness.label}</p>
                </div>
                <strong style={{ color: readiness.score >= 80 ? "#86efac" : theme.accentStrong, fontSize: 24 }}>{readiness.score}%</strong>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginBottom: 10 }}>
                {readiness.factors.map((factor) => (
                  <div key={factor.label} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8 }}>
                    <div style={{ color: "#6b7280", fontSize: 10.5, marginBottom: 3 }}>{factor.label}</div>
                    <strong style={{ color: "#e8e8f0", fontSize: 12 }}>{factor.value}</strong>
                  </div>
                ))}
              </div>
              <button className="glass-button" onClick={() => onMock(readiness.nextActionPrompt)} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 8, color: theme.accentText, fontSize: 11.5, fontWeight: 800, cursor: "pointer", width: "100%", textAlign: "left" }}>
                <i className="ti ti-player-play" />Run readiness mock
              </button>
            </section>

            <ApplicationTrackerPanel applications={applications} onChange={onApplicationsChange} theme={theme} />

            {topicFocus && focusQuestions.length > 0 && (
              <section className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                  <h2 style={{ color: theme.accentText, fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>
                    <i className="ti ti-target-arrow" />Topic Focus
                  </h2>
                  <span style={{ color: theme.accentStrong, fontSize: 10.8, fontWeight: 800 }}>{topicFocus}</span>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {focusQuestions.map((item) => (
                    <button key={item.id} className="glass-button" onClick={() => onMock(buildCompanyMockPrompt({ ...item, company: prep.company, type: item.type || "Topic Focus" }))} style={{ textAlign: "left", border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 9, color: "#cbd5e1", fontSize: 12, lineHeight: 1.45 }}>
                      <strong style={{ display: "block", color: theme.accentText, fontSize: 12, marginBottom: 3 }}>{item.title}</strong>
                      {item.prompt}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 14 }}>
              <div style={{ display: "grid", gap: 16 }}>
                <QuestionList title="Latest DSA Patterns" icon="ti-binary-tree" items={prep.dsa} company={prep.company} type="DSA" theme={theme} onMock={onMock} />
                <QuestionList title="System Design Prompts" icon="ti-topology-star" items={prep.systemDesign} company={prep.company} type="System Design" theme={theme} onMock={onMock} />
                <section style={{ borderTop: `1px solid ${theme.accentBorder}`, paddingTop: 12 }}>
                  <h2 style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#e8e8f0", marginBottom: 10 }}>
                    <i className="ti ti-checkup-list" style={{ color: theme.accentStrong }} />Verification Queue
                  </h2>
                  <div style={{ display: "grid", gap: 7 }}>
                    {[...prep.dsa.slice(0, 2), ...prep.systemDesign.slice(0, 1)].map((item) => {
                      const questionId = `${item.difficulty === "Medium" ? "DSA" : "System Design"}-${item.title}`;
                      const verified = refreshState?.verifiedQuestions?.[questionId];
                      return (
                        <button key={questionId} className="glass-button" onClick={() => markVerified(questionId)} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 9, color: verified ? "#86efac" : "#9ca3af", fontSize: 11.5, textAlign: "left" }}>
                          {verified ? "Recent verified" : "Mark verified"} · {item.title}
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>

              <aside style={{ display: "grid", gap: 14, alignContent: "start" }}>
                <section style={{ borderTop: `1px solid ${theme.accentBorder}`, paddingTop: 12 }}>
                  <h2 style={{ fontSize: 13, color: "#e8e8f0", marginBottom: 10 }}><i className="ti ti-users" style={{ color: theme.accentStrong, marginRight: 7 }} />Behavioral Cheat Sheet</h2>
                  <div style={{ display: "grid", gap: 7 }}>
                    {prep.behavioral.map((question) => (
                      <button key={question} className="glass-button" onClick={() => onMock(buildCompanyMockPrompt({ company: prep.company, type: "Behavioral", title: "Behavioral question", prompt: question }))} style={{ textAlign: "left", border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 9, color: "#9ca3af", fontSize: 12, lineHeight: 1.45 }}>
                        {question}
                      </button>
                    ))}
                  </div>
                </section>

                <section style={{ borderTop: `1px solid ${theme.accentBorder}`, paddingTop: 12 }}>
                  <h2 style={{ fontSize: 13, color: "#e8e8f0", marginBottom: 10 }}><i className="ti ti-alert-triangle" style={{ color: theme.accentStrong, marginRight: 7 }} />Weak Spots</h2>
                  {weakSpots.length ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                      {weakSpots.map((spot) => <span key={spot} className="glass-card" style={{ border: "1px solid rgba(239,68,68,.25)", color: "#fca5a5", borderRadius: 999, padding: "4px 8px", fontSize: 11 }}>{spot}</span>)}
                    </div>
                  ) : (
                    <p style={{ color: "#6b7280", fontSize: 12, lineHeight: 1.5 }}>Start a mock interview and feedback gaps will appear here automatically.</p>
                  )}
                </section>

                <section style={{ borderTop: `1px solid ${theme.accentBorder}`, paddingTop: 12 }}>
                  <h2 style={{ fontSize: 13, color: "#e8e8f0", marginBottom: 10 }}><i className="ti ti-link" style={{ color: theme.accentStrong, marginRight: 7 }} />Resources</h2>
                  <div style={{ display: "grid", gap: 8 }}>
                    {prep.resources.map((resource) => (
                      <a key={resource.url} className="glass-card" href={resource.url} target="_blank" rel="noreferrer" style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 9, textDecoration: "none" }}>
                        <div style={{ color: theme.accentText, fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{resource.label}</div>
                        <div style={{ color: "#6b7280", fontSize: 11, lineHeight: 1.4 }}>{resource.note}</div>
                      </a>
                    ))}
                  </div>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
