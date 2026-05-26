import { useEffect, useState } from "react";
import { buildCompanyMockPrompt, buildCompanyReadinessScore, buildQuestionBankRefreshState, markQuestionBankVerified } from "../../lib/companyPrep.mjs";

const QUESTION_BANK_REFRESH_KEY = "interviewiq.companyPrep.refresh.v1";
const CAREER_TOOLKIT_STORAGE_KEY = "interviewiq.careerToolkit.v1";

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

export default function CompanyPrep({ theme, weakSpots, mockScores = [], messages = [], selectedCat, selectedSub, onMock }) {
  const [query, setQuery] = useState("Amazon");
  const [companyPrep, setCompanyPrep] = useState(null);
  const [refreshState, setRefreshState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCompany = async (company = query) => {
    const trimmed = company.trim() || "Amazon";
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/company-prep?company=${encodeURIComponent(trimmed)}`);
      if (!response.ok) throw new Error("Company prep lookup failed");
      const data = await response.json();
      setCompanyPrep(data);
      setRefreshState(readRefreshState(data.company));
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
  };

  const markVerified = (questionId) => {
    const baseState = refreshState || buildQuestionBankRefreshState({ prep });
    const nextState = markQuestionBankVerified(baseState, { questionId });
    setRefreshState(nextState);
    saveRefreshState(nextState);
  };

  const prep = companyPrep;
  const topicFocus = selectedSub || selectedCat;
  const focusQuestions = focusedCompanyQuestions(prep, topicFocus);
  const careerToolkitState = readCareerToolkitState();
  const readiness = buildCompanyReadinessScore({
    prep,
    refreshState,
    weakSpots,
    mockScores,
    messages,
    resumeAnalysis: careerToolkitState.resumeAnalysis,
    jobDescriptionAnalysis: careerToolkitState.jobDescriptionAnalysis,
  });

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px 22px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px" }}>
            <h1 style={{ fontSize: 18, color: "#e8e8f0", marginBottom: 4 }}>Company Prep</h1>
            <p style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.5 }}>Publicly reported questions, mock interviews, weak spots, and source links.</p>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); loadCompany(); }} style={{ display: "flex", gap: 7, flex: "1 1 320px" }}>
            <input className="glass-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company, e.g. Amazon" style={{ flex: 1, border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, padding: "9px 11px", color: "#e8e8f0", outline: "none", fontSize: 13 }} />
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
