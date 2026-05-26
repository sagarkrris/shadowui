import {
  buildDailyPrepPlan,
  buildInterviewDayPack,
  buildInterviewRoadmap,
  buildOfferReadinessScore,
  buildPrepProgressDashboard,
  deriveAnswerQualityHeatmap,
  deriveMockReplayTimelines,
  deriveMockSessionHistory,
  deriveMistakeBank,
  deriveProofVaultStories,
} from "../../lib/prepInsights.mjs";
import { buildPrepReportHtml, buildPrepReportMarkdown } from "../../lib/prepReport.mjs";

const CAREER_TOOLKIT_STORAGE_KEY = "interviewiq.careerToolkit.v1";

function readToolkitState() {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(window.localStorage.getItem(CAREER_TOOLKIT_STORAGE_KEY) || "{}")?.state || {};
  } catch {
    return {};
  }
}

export default function PrepInsightsPanel({ profile, topics, weakSpots, mockScores, messages, theme, selectedCat, selectedSub, onAction }) {
  const mistakeBank = deriveMistakeBank(messages);
  const sessionHistory = deriveMockSessionHistory(messages);
  const mockReplays = deriveMockReplayTimelines(messages);
  const proofStories = deriveProofVaultStories(messages, profile);
  const heatmap = deriveAnswerQualityHeatmap(messages);
  const roadmap = buildInterviewRoadmap({ profile, topics, weakSpots, mockScores });
  const dashboard = buildPrepProgressDashboard({ weakSpots, mockScores, mistakeBank, messages });
  const toolkitState = readToolkitState();
  const companyPrepScore = Array.isArray(toolkitState.interviews) && toolkitState.interviews.length ? 70 : 35;
  const offerReadiness = buildOfferReadinessScore({
    resumeAnalysis: toolkitState.resumeAnalysis,
    jobDescriptionAnalysis: toolkitState.jobDescriptionAnalysis,
    mockScores,
    weakSpots,
    proofStories,
    companyPrepScore,
  });
  const dayPack = buildInterviewDayPack({
    profile,
    topics,
    interviews: toolkitState.interviews,
    jobDescriptionAnalysis: toolkitState.jobDescriptionAnalysis,
    proofStories,
    weakSpots,
  });
  const dailyPlan = buildDailyPrepPlan({
    profile,
    topics,
    weakSpots,
    mockScores,
    mistakeBank,
    interviews: toolkitState.interviews,
  });

  const buildReportMarkdown = () => {
    let resumeAnalysis = null;
    let jobDescriptionAnalysis = null;
    try {
      const latestToolkitState = readToolkitState();
      resumeAnalysis = latestToolkitState.resumeAnalysis || null;
      jobDescriptionAnalysis = latestToolkitState.jobDescriptionAnalysis || null;
    } catch {
      resumeAnalysis = null;
      jobDescriptionAnalysis = null;
    }

    return buildPrepReportMarkdown({
      profile,
      resumeAnalysis,
      jobDescriptionAnalysis,
      weakSpots,
      mockScores,
      roadmap,
      companyFocus: { company: "Company Prep", topic: selectedSub || selectedCat },
      nextActions: [
        dashboard.nextActionPrompt,
        sessionHistory[0]?.retryPrompt,
        mistakeBank[0]?.retryPrompt,
      ].filter(Boolean),
    });
  };

  const downloadPrepReport = () => {
    const markdown = buildReportMarkdown();
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "interviewiq-prep-report.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  const printPrepReport = () => {
    const markdown = buildReportMarkdown();
    const reportWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!reportWindow) {
      downloadPrepReport();
      return;
    }

    reportWindow.document.write(buildPrepReportHtml(markdown));
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  return (
    <section style={{ width: "100%", maxWidth: 860, display: "grid", gap: 12, marginTop: 22, textAlign: "left" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 10 }}>
        <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 7 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 800 }}>
              <i className="ti ti-gauge" />Offer Readiness
            </span>
            <strong style={{ color: offerReadiness.score >= 80 ? "#86efac" : theme.accentStrong, fontSize: 24 }}>{offerReadiness.score}%</strong>
          </div>
          <p style={{ color: "#9ca3af", fontSize: 11.3, lineHeight: 1.45, marginBottom: 9 }}>{offerReadiness.label}</p>
          <div style={{ display: "grid", gap: 6, marginBottom: 9 }}>
            {offerReadiness.factors.map((factor) => (
              <div key={factor.label} style={{ display: "grid", gridTemplateColumns: "92px 1fr 34px", alignItems: "center", gap: 7 }}>
                <span style={{ color: "#6b7280", fontSize: 10.3 }}>{factor.label}</span>
                <span style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                  <span style={{ display: "block", width: `${factor.score}%`, height: "100%", borderRadius: 999, background: factor.score >= 75 ? "#86efac" : theme.accentStrong }} />
                </span>
                <strong style={{ color: "#cbd5e1", fontSize: 10.5, textAlign: "right" }}>{factor.score}</strong>
              </div>
            ))}
          </div>
          <button className="glass-button" onClick={() => onAction(offerReadiness.nextActionPrompt)} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 8, color: theme.accentText, fontSize: 11.5, fontWeight: 800, cursor: "pointer", width: "100%", textAlign: "left" }}>
            <i className="ti ti-player-play" /> Improve weakest signal
          </button>
        </div>

        <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 800, marginBottom: 7 }}>
            <i className="ti ti-chart-bar" />Progress Dashboard
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginBottom: 10 }}>
            {[
              ["Mocks", dashboard.completedMocks],
              ["Avg", dashboard.averageScore === null ? "--" : `${dashboard.averageScore}/10`],
              ["Weak spots", dashboard.weakSpotCount],
              ["Mistakes", dashboard.mistakeCount],
            ].map(([label, value]) => (
              <div key={label} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8 }}>
                <div style={{ color: "#6b7280", fontSize: 10.5, marginBottom: 3 }}>{label}</div>
                <strong style={{ color: theme.accentText, fontSize: 17 }}>{value}</strong>
              </div>
            ))}
          </div>
          <p style={{ color: "#9ca3af", fontSize: 11.3, lineHeight: 1.45, marginBottom: 8 }}>{dashboard.readinessLabel}</p>
          <button className="glass-button" onClick={() => onAction(dashboard.nextActionPrompt)} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 8, color: theme.accentText, fontSize: 11.5, fontWeight: 800, cursor: "pointer", width: "100%", textAlign: "left" }}>
            <i className="ti ti-player-play" /> Next focused rep
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 7 }}>
            <button className="glass-button" onClick={downloadPrepReport} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8, color: theme.accentText, fontSize: 11.5, fontWeight: 800, cursor: "pointer", textAlign: "left" }}>
              <i className="ti ti-download" /> Markdown
            </button>
            <button className="glass-button" onClick={printPrepReport} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8, color: theme.accentText, fontSize: 11.5, fontWeight: 800, cursor: "pointer", textAlign: "left" }}>
              <i className="ti ti-file-type-pdf" /> Save PDF
            </button>
          </div>
        </div>

        <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 800, marginBottom: 7 }}>
            <i className="ti ti-route" />{roadmap.title}
          </div>
          <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.5, marginBottom: 10 }}>{roadmap.summary}</p>
          <div style={{ display: "grid", gap: 7 }}>
            {roadmap.days.slice(0, 4).map((day) => (
              <button key={day.day} className="glass-button" onClick={() => onAction(day.prompt)} title={`Start day ${day.day}`} style={{ display: "grid", gridTemplateColumns: "30px 1fr auto", alignItems: "center", gap: 8, border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8, textAlign: "left", cursor: "pointer" }}>
                <span style={{ width: 24, height: 24, borderRadius: 7, display: "inline-flex", alignItems: "center", justifyContent: "center", background: theme.accentMuted, color: theme.accentStrong, fontSize: 11, fontWeight: 900 }}>{day.day}</span>
                <span style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", color: "#e8e8f0", fontSize: 11.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{day.title}</strong>
                  <span style={{ display: "block", color: "#6b7280", fontSize: 10.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{day.focus}</span>
                </span>
                <span style={{ color: theme.accentStrong, fontSize: 10.5, fontWeight: 800 }}>{day.minutes}m</span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 800, marginBottom: 7 }}>
            <i className="ti ti-chart-dots" />Answer Quality Heatmap
          </div>
          <p style={{ color: "#9ca3af", fontSize: 11.3, lineHeight: 1.45, marginBottom: 9 }}>{heatmap.summary}</p>
          <div style={{ display: "grid", gap: 7 }}>
            {heatmap.dimensions.map((dimension) => (
              <div key={dimension.label} style={{ display: "grid", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 7, color: "#cbd5e1", fontSize: 10.8 }}>
                  <span>{dimension.label}</span>
                  <strong style={{ color: dimension.score >= 8 ? "#86efac" : theme.accentStrong }}>{dimension.score ? `${dimension.score}/10` : "--"}</strong>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                  <div style={{ width: `${dimension.percent}%`, height: "100%", background: dimension.score >= 8 ? "#86efac" : theme.accentStrong, borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 800, marginBottom: 7 }}>
            <i className="ti ti-calendar-check" />{"Today's 30-Minute Plan"}
          </div>
          <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.5, marginBottom: 10 }}>{dailyPlan.summary}</p>
          <div style={{ display: "grid", gap: 7 }}>
            {dailyPlan.items.map((item) => (
              <button key={`${item.title}-${item.focus}`} className="glass-button" onClick={() => onAction(item.prompt)} title={`Start step: ${item.title}`} style={{ display: "grid", gridTemplateColumns: "34px 1fr auto", alignItems: "center", gap: 8, border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8, textAlign: "left", cursor: "pointer" }}>
                <span style={{ width: 26, height: 26, borderRadius: 7, display: "inline-flex", alignItems: "center", justifyContent: "center", background: theme.accentMuted, color: theme.accentStrong, fontSize: 10.5, fontWeight: 900 }}>{item.minutes}m</span>
                <span style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", color: "#e8e8f0", fontSize: 11.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</strong>
                  <span style={{ display: "block", color: "#6b7280", fontSize: 10.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.focus}</span>
                </span>
                <span style={{ color: theme.accentStrong, fontSize: 10.5, fontWeight: 800 }}>Start step</span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 800, marginBottom: 7 }}>
            <i className="ti ti-briefcase-2" />Interview Day Pack
          </div>
          <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.5, marginBottom: 9 }}>
            {dayPack.date ? `${dayPack.company} ${dayPack.round} in ${dayPack.daysUntil}d for ${dayPack.role}.` : "Add an interview date to build a one-click day-of prep pack."}
          </p>
          <div style={{ display: "grid", gap: 7, marginBottom: 9 }}>
            {dayPack.warmups.map((item) => (
              <button key={item.title} className="glass-button" onClick={() => onAction(item.prompt)} style={{ display: "grid", gridTemplateColumns: "34px 1fr auto", alignItems: "center", gap: 8, border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8, textAlign: "left", cursor: "pointer" }}>
                <span style={{ width: 26, height: 26, borderRadius: 7, display: "inline-flex", alignItems: "center", justifyContent: "center", background: theme.accentMuted, color: theme.accentStrong, fontSize: 10.5, fontWeight: 900 }}>{item.minutes}m</span>
                <strong style={{ color: "#e8e8f0", fontSize: 11.5 }}>{item.title}</strong>
                <span style={{ color: theme.accentStrong, fontSize: 10.5, fontWeight: 800 }}>Start</span>
              </button>
            ))}
          </div>
          <div style={{ color: theme.accentText, fontSize: 11.5, fontWeight: 900, marginBottom: 6 }}>Top 10 likely questions</div>
          <div style={{ display: "grid", gap: 5 }}>
            {dayPack.questions.slice(0, 5).map((question) => (
              <button key={question} className="glass-button" onClick={() => onAction(`Interview Day Pack drill: ${question}`)} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 7, padding: 7, color: "#cbd5e1", fontSize: 10.8, textAlign: "left", cursor: "pointer" }}>
                {question}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 800, marginBottom: 7 }}>
            <i className="ti ti-bug" />Mistake Bank
          </div>
          {mistakeBank.length ? (
            <div style={{ display: "grid", gap: 8 }}>
              {mistakeBank.slice(0, 4).map((item) => (
                <article key={item.id} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 9 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                    <strong style={{ color: "#e8e8f0", fontSize: 11.8 }}>{item.topic}</strong>
                    <button className="glass-button" onClick={() => onAction(item.retryPrompt)} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 7, padding: "4px 7px", color: theme.accentText, fontSize: 10.5, fontWeight: 800, cursor: "pointer" }}>
                      Retry
                    </button>
                  </div>
                  <p style={{ color: "#9ca3af", fontSize: 11, lineHeight: 1.45 }}>{item.correction}</p>
                </article>
              ))}
            </div>
          ) : (
            <div style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 11, background: theme.accentMuted }}>
              <strong style={{ display: "block", color: theme.accentText, fontSize: 12, marginBottom: 5 }}>No mistakes captured yet</strong>
              <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.45 }}>Complete a scored mock and InterviewIQ will collect repeatable gaps here.</p>
            </div>
          )}
        </div>

        <div className="glass-card" style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 800, marginBottom: 7 }}>
            <i className="ti ti-database-star" />Proof Vault
          </div>
          {proofStories.length ? (
            <div style={{ display: "grid", gap: 8 }}>
              {proofStories.slice(0, 3).map((story) => (
                <article key={story.id} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 9 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                    <strong style={{ color: "#e8e8f0", fontSize: 11.8 }}>{story.title}</strong>
                    <span style={{ color: story.score >= 8 ? "#86efac" : theme.accentStrong, fontSize: 10.5, fontWeight: 900 }}>{story.score}/10</span>
                  </div>
                  <p style={{ color: "#9ca3af", fontSize: 10.8, lineHeight: 1.42, marginBottom: 5 }}><strong style={{ color: "#cbd5e1" }}>Result:</strong> {story.result}</p>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 7 }}>
                    {story.skillsProven.slice(0, 4).map((skill) => (
                      <span key={skill} style={{ color: theme.accentStrong, border: `1px solid ${theme.accentBorder}`, background: theme.accentMuted, borderRadius: 999, padding: "3px 7px", fontSize: 10.2, fontWeight: 800 }}>{skill}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {story.actions.map((action) => (
                      <button key={action.label} className="glass-button" onClick={() => onAction(action.prompt)} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 7, padding: "4px 7px", color: theme.accentText, fontSize: 10.5, fontWeight: 800, cursor: "pointer" }}>
                        {action.label}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 11, background: theme.accentMuted }}>
              <strong style={{ display: "block", color: theme.accentText, fontSize: 12, marginBottom: 5 }}>No saved proof stories yet</strong>
              <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.45 }}>Score 7+ on a mock answer and InterviewIQ will turn it into reusable STAR story material.</p>
            </div>
          )}
        </div>

        <div className="glass-card" style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 800, marginBottom: 7 }}>
            <i className="ti ti-timeline" />Mock Replay
          </div>
          {mockReplays.length ? (
            <div style={{ display: "grid", gap: 8 }}>
              {mockReplays.slice(0, 3).map((replay) => (
                <article key={replay.id} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 9 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <strong style={{ color: "#e8e8f0", fontSize: 11.8 }}>{replay.date}</strong>
                    <span style={{ color: replay.score >= 8 ? "#86efac" : theme.accentStrong, fontSize: 10.5, fontWeight: 900 }}>{replay.score}/10</span>
                  </div>
                  {[
                    ["Question", replay.question],
                    ["Your answer", replay.yourAnswer],
                    ["Gaps", replay.gaps],
                    ["Improved", replay.improvedAnswer],
                  ].map(([label, value]) => (
                    <p key={label} style={{ color: label === "Gaps" ? theme.accentStrong : "#9ca3af", fontSize: 10.7, lineHeight: 1.42, marginBottom: 5 }}>
                      <strong style={{ color: "#cbd5e1" }}>{label}:</strong> {value}
                    </p>
                  ))}
                  <button className="glass-button" onClick={() => onAction(replay.retryPrompt)} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 7, padding: "4px 7px", color: theme.accentText, fontSize: 10.5, fontWeight: 800, cursor: "pointer" }}>
                    Replay mock
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 11, background: theme.accentMuted }}>
              <strong style={{ display: "block", color: theme.accentText, fontSize: 12, marginBottom: 5 }}>No replay yet</strong>
              <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.45 }}>Complete a scored mock and the full question-answer-feedback timeline will appear here.</p>
            </div>
          )}
        </div>

        <div className="glass-card" style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 800, marginBottom: 7 }}>
            <i className="ti ti-history" />Session History
          </div>
          {sessionHistory.length ? (
            <div style={{ display: "grid", gap: 8 }}>
              {sessionHistory.slice(0, 4).map((session) => (
                <article key={session.id} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 9 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                    <strong style={{ color: "#e8e8f0", fontSize: 11.8 }}>{session.title}</strong>
                    <span style={{ color: session.score >= 8 ? "#86efac" : theme.accentStrong, fontSize: 10.5, fontWeight: 900 }}>{session.score}/10</span>
                  </div>
                  <p style={{ color: "#9ca3af", fontSize: 10.8, lineHeight: 1.4, marginBottom: 5 }}>{session.answerPreview}</p>
                  <p style={{ color: "#6b7280", fontSize: 10.6, lineHeight: 1.4, marginBottom: 5 }}>{session.date} · {session.topic}</p>
                  <p style={{ color: "#6b7280", fontSize: 10.6, lineHeight: 1.4, marginBottom: 7 }}>{session.gapSummary}</p>
                  <button className="glass-button" onClick={() => onAction(session.retryPrompt)} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 7, padding: "4px 7px", color: theme.accentText, fontSize: 10.5, fontWeight: 800, cursor: "pointer" }}>
                    Retry session
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 11, background: theme.accentMuted }}>
              <strong style={{ display: "block", color: theme.accentText, fontSize: 12, marginBottom: 5 }}>No scored sessions yet</strong>
              <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.45 }}>Run a mock and the latest scored sessions will appear here with retry prompts.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
