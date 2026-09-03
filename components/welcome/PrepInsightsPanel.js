import {
  buildAnswerCoachActions,
  buildDailyPrepPlan,
  buildGuidedPrepMissions,
  buildInterviewDayPack,
  buildInterviewRoadmap,
  buildOfferReadinessScore,
  buildPrepProgressDashboard,
  buildResumeBulletGenerator,
  deriveAnswerQualityHeatmap,
  deriveMockReplayTimelines,
  deriveMockSessionHistory,
  deriveMistakeBank,
  deriveProofVaultStories,
  deriveWeakSpotRadar,
} from "../../lib/prepInsights.mjs";
import { buildPrepReportHtml, buildPrepReportMarkdown } from "../../lib/prepReport.mjs";
import { buildMasteryMap } from "../../lib/questionMemory.mjs";
import { buildRolePack } from "../../lib/rolePacks.mjs";
import SkillGraphPanel from "./SkillGraphPanel";
import ResumeStoryMatcherPanel from "./ResumeStoryMatcherPanel";
import { trackEvent } from "../../lib/analytics.mjs";

const CAREER_TOOLKIT_STORAGE_KEY = "interviewiq.careerToolkit.v1";
const ANSWER_COACH_ACTION_ORDER = ["Make it concise", "Make it senior-level", "Add metrics", "Add trade-offs", "Convert to STAR"];
const SKILL_GRAPH_SECTION_LABEL = "Skill Graph";
const RESUME_STORY_MATCHER_SECTION_LABEL = "Resume Story Matcher";

function readToolkitState() {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(window.localStorage.getItem(CAREER_TOOLKIT_STORAGE_KEY) || "{}")?.state || {};
  } catch {
    return {};
  }
}

export default function PrepInsightsPanel({ profile, topics, weakSpots, mockScores, messages, structuredSessions = [], questionMemory, systemDesignCanvas, theme, selectedCat, selectedSub, onAction }) {
  const mistakeBank = deriveMistakeBank(messages, structuredSessions);
  const sessionHistory = deriveMockSessionHistory(messages);
  const mockReplays = deriveMockReplayTimelines(messages, structuredSessions);
  const proofStories = deriveProofVaultStories(messages, profile);
  const heatmap = deriveAnswerQualityHeatmap(messages);
  const radar = deriveWeakSpotRadar(messages, weakSpots);
  const masteryMap = buildMasteryMap(questionMemory || { questions: {} });
  const rolePack = buildRolePack({ profile });
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
  const shareReadiness = async () => { const params = new URLSearchParams({ score: String(Math.round(offerReadiness.score)), label: offerReadiness.label, stack: profile?.stack || "Software Engineering" }); const url = `${window.location.origin}/share/readiness?${params}`; trackEvent("readiness_shared", { value: String(Math.round(offerReadiness.score)) }); if (navigator.share) await navigator.share({ title: "My InterviewIQ readiness signal", url }); else await navigator.clipboard?.writeText(url); };
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
  const missionBoard = buildGuidedPrepMissions({
    profile,
    topics,
    weakSpots,
    mockScores,
    mistakeBank,
    interviews: toolkitState.interviews,
    resumeAnalysis: toolkitState.resumeAnalysis,
    jobDescriptionAnalysis: toolkitState.jobDescriptionAnalysis,
    proofStories,
    activityDates: toolkitState.activityDates,
  });
  const answerCoachActions = buildAnswerCoachActions({
    profile,
    messages,
    selectedCat,
    selectedSub,
    weakSpots,
  });
  const resumeBulletGenerator = buildResumeBulletGenerator({
    profile,
    jobDescriptionAnalysis: toolkitState.jobDescriptionAnalysis,
    resumeAnalysis: toolkitState.resumeAnalysis,
    proofStories,
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
      finalInterviewReport: {
        offerReadiness: offerReadiness.factors,
        resumeJdMatch: [
          resumeAnalysis ? `Resume Match: ${resumeAnalysis.score || 0}%` : "Resume not analyzed yet",
          jobDescriptionAnalysis ? `JD Match: ${jobDescriptionAnalysis.score || 0}%` : "JD not analyzed yet",
        ],
        masteryMap: Object.entries(masteryMap.summary.byStatus).map(([status, count]) => `${status}: ${count}`),
        weakSpotRadar: radar.categories.map((category) => `${category.label}: ${category.status}`),
        proofStories,
        rolePack,
        companyPrep: { company: "Company Prep", topic: selectedSub || selectedCat, signals: weakSpots.slice(0, 4) },
        canvasSummary: systemDesignCanvas?.problem ? {
          problem: systemDesignCanvas.problem,
          capturedSections: Object.entries(systemDesignCanvas.sections || {})
            .filter(([, value]) => String(value || "").trim())
            .map(([key]) => key),
        } : ["No system design canvas captured yet"],
        final24HourPlan: dayPack.warmups.map((item) => `${item.minutes}m ${item.title}`),
      },
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
      <div aria-label={SKILL_GRAPH_SECTION_LABEL}>
        <SkillGraphPanel
          profile={profile}
          topics={topics}
          weakSpots={weakSpots}
          mockScores={mockScores}
          questionMemory={questionMemory}
          theme={theme}
          onAction={onAction}
        />
      </div>

      <div aria-label={RESUME_STORY_MATCHER_SECTION_LABEL}>
        <ResumeStoryMatcherPanel
          resumeText={toolkitState.resumeText || ""}
          resumeAnalysis={toolkitState.resumeAnalysis || null}
          proofStories={proofStories}
          theme={theme}
          onAction={onAction}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 10 }}>
        <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12, gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <span>
              <span style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 900 }}>
                <i className="ti ti-target-arrow" />Guided Prep Mission
              </span>
              <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.5, marginTop: 5 }}>{missionBoard.summary}</p>
            </span>
            <span style={{ border: `1px solid ${theme.accentBorder}`, background: theme.accentMuted, color: theme.accentStrong, borderRadius: 999, padding: "5px 9px", fontSize: 10.8, fontWeight: 900 }}>
              {missionBoard.status}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8, marginBottom: 10 }}>
            {missionBoard.tasks.map((task) => (
              <button key={task.id} className="glass-button" onClick={() => onAction(task.prompt)} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 10, textAlign: "left", cursor: "pointer" }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                  <strong style={{ color: "#e8e8f0", fontSize: 11.7 }}>{task.title}</strong>
                  <span style={{ color: theme.accentStrong, fontSize: 10.4, fontWeight: 900 }}>{task.minutes}m</span>
                </span>
                <span style={{ display: "block", color: "#6b7280", fontSize: 10.5, marginBottom: 5 }}>{task.signal}</span>
                <span style={{ display: "block", color: "#cbd5e1", fontSize: 11, lineHeight: 1.35 }}>{task.focus}</span>
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 10 }}>
            <p style={{ color: "#6b7280", fontSize: 10.8, lineHeight: 1.45 }}>
              {missionBoard.why.slice(0, 2).join(" ")}
            </p>
            <strong style={{ color: theme.accentStrong, fontSize: 11.3, whiteSpace: "nowrap" }}>
              Offer readiness impact +{missionBoard.completionImpact.offerReadinessDelta}
            </strong>
          </div>
        </div>

        <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12, gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 9, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 900 }}>
              <i className="ti ti-message-2-cog" />Answer Coach
            </span>
            <span style={{ color: "#6b7280", fontSize: 10.8 }}>Rewrite the latest answer without leaving prep flow</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(138px, 1fr))", gap: 7 }}>
            {ANSWER_COACH_ACTION_ORDER.map((label) => answerCoachActions.find((action) => action.label === label)).filter(Boolean).map((action) => (
              <button key={action.label} className="glass-button" onClick={() => onAction(action.prompt)} title={action.goal} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 9, color: theme.accentText, fontSize: 11.3, fontWeight: 850, cursor: "pointer", textAlign: "left" }}>
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12, gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <span>
              <span style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 900 }}>
                <i className="ti ti-file-pencil" />Resume Bullet Generator
              </span>
              <p style={{ color: "#9ca3af", fontSize: 11.3, lineHeight: 1.45, marginTop: 5 }}>{resumeBulletGenerator.summary}</p>
            </span>
            <span style={{ border: `1px solid ${theme.accentBorder}`, background: theme.accentMuted, color: theme.accentStrong, borderRadius: 999, padding: "5px 9px", fontSize: 10.8, fontWeight: 900 }}>
              ATS-friendly
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 8 }}>
            {resumeBulletGenerator.suggestions.map((suggestion) => (
              <article key={suggestion.id} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 9 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 7 }}>
                  <strong style={{ color: "#e8e8f0", fontSize: 11.6 }}>{suggestion.gap}</strong>
                  <button className="glass-button" onClick={() => onAction(suggestion.prompt)} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 7, padding: "4px 7px", color: theme.accentText, fontSize: 10.5, fontWeight: 800, cursor: "pointer" }}>
                    Generate
                  </button>
                </div>
                <p style={{ color: "#6b7280", fontSize: 10.5, lineHeight: 1.35, marginBottom: 5 }}><strong style={{ color: "#cbd5e1" }}>Before:</strong> {suggestion.before}</p>
                <p style={{ color: "#9ca3af", fontSize: 10.7, lineHeight: 1.38 }}><strong style={{ color: theme.accentStrong }}>After:</strong> {suggestion.after}</p>
              </article>
            ))}
          </div>
        </div>

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
          <button className="glass-button" onClick={shareReadiness} style={{ border: "1px solid rgba(114,208,166,.45)", borderRadius: 8, marginTop: 7, padding: 8, color: "#a7f3d0", fontSize: 11.5, fontWeight: 800, cursor: "pointer", width: "100%", textAlign: "left" }}><i className="ti ti-share-3" /> Share readiness card</button>
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
            <i className="ti ti-map-star" />Mastery Map
          </div>
          <p style={{ color: "#9ca3af", fontSize: 11.3, lineHeight: 1.45, marginBottom: 9 }}>
            {masteryMap.summary.total ? `${masteryMap.summary.total} tracked questions across practice and mocks.` : "Practice questions will appear here once you mark or answer them."}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 7 }}>
            {Object.entries(masteryMap.summary.byStatus).map(([status, count]) => (
              <div key={status} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8 }}>
                <div style={{ color: "#6b7280", fontSize: 10.3, marginBottom: 3 }}>{status}</div>
                <strong style={{ color: status === "Mastered" ? "#86efac" : theme.accentText, fontSize: 16 }}>{count}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 800, marginBottom: 7 }}>
            <i className="ti ti-report-analytics" />Final Interview Report
          </div>
          <p style={{ color: "#9ca3af", fontSize: 11.3, lineHeight: 1.45, marginBottom: 9 }}>
            Combines offer readiness, role pack, masteryMap, weak spots, proof stories, and systemDesignCanvas notes.
          </p>
          <div style={{ display: "grid", gap: 6, marginBottom: 9 }}>
            <strong style={{ color: "#e8e8f0", fontSize: 11.5 }}>{rolePack.title}</strong>
            <span style={{ color: "#6b7280", fontSize: 10.8 }}>{rolePack.focusTopics.slice(0, 3).join(" / ")}</span>
          </div>
          <button className="glass-button" onClick={downloadPrepReport} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 8, color: theme.accentText, fontSize: 11.5, fontWeight: 800, cursor: "pointer", width: "100%", textAlign: "left" }}>
            <i className="ti ti-download" /> Export final report
          </button>
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

        <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12, gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 9, flexWrap: "wrap" }}>
            <span>
              <span style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 900 }}>
                <i className="ti ti-radar" />Weak Spot Radar
              </span>
              <p style={{ color: "#9ca3af", fontSize: 11.3, lineHeight: 1.45, marginTop: 5 }}>{radar.summary}</p>
            </span>
            <span style={{ border: `1px solid ${theme.accentBorder}`, background: theme.accentMuted, color: theme.accentStrong, borderRadius: 999, padding: "5px 9px", fontSize: 10.5, fontWeight: 900 }}>
              Repeated signals {radar.repeatedCount}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(122px, 1fr))", gap: 8, marginBottom: 10 }}>
            {radar.categories.map((category) => (
              <button key={category.label} className="glass-button" onClick={() => onAction(category.prompt)} title={category.status} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 9, minHeight: 86, display: "grid", alignContent: "space-between", gap: 7, cursor: "pointer", textAlign: "left" }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <strong style={{ color: "#e8e8f0", fontSize: 11 }}>{category.label}</strong>
                  <span style={{ color: category.status === "Repeated" ? theme.accentStrong : "#6b7280", fontSize: 10.2, fontWeight: 900 }}>{category.count}</span>
                </span>
                <span style={{ height: 46, display: "flex", alignItems: "flex-end", justifyContent: "center", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                  <span style={{ width: "100%", maxWidth: 42, height: `${Math.max(8, category.score * 0.42)}px`, borderRadius: "8px 8px 0 0", background: category.status === "Repeated" ? theme.accentStrong : theme.accentMuted, border: `1px solid ${category.status === "Repeated" ? theme.accentBorder : "rgba(255,255,255,.08)"}` }} />
                </span>
                <span style={{ color: category.status === "Repeated" ? theme.accentStrong : "#6b7280", fontSize: 10.2, fontWeight: 800 }}>{category.status}</span>
              </button>
            ))}
          </div>
          <button className="glass-button" onClick={() => onAction(radar.actionPrompt)} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 8, color: theme.accentText, fontSize: 11.5, fontWeight: 800, cursor: "pointer", width: "100%", textAlign: "left" }}>
            <i className="ti ti-player-play" /> Pressure drill: {radar.highestRisk.label}
          </button>
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
            <div className="empty-state">
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
            <div className="empty-state">
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
                  <div style={{ color: theme.accentText, fontSize: 10.8, fontWeight: 900, marginBottom: 6 }}>Part-wise Replay</div>
                  <div style={{ display: "grid", gap: 5, marginBottom: 8 }}>
                    {replay.steps.map((step) => (
                      <div key={step.label} style={{ display: "grid", gridTemplateColumns: "86px 1fr", gap: 7, borderLeft: `2px solid ${step.tone === "strong" ? "#86efac" : step.tone === "risk" ? theme.accentStrong : "rgba(255,255,255,.12)"}`, paddingLeft: 7 }}>
                        <strong style={{ color: "#cbd5e1", fontSize: 10.4 }}>{step.label}</strong>
                        <span style={{ color: step.tone === "risk" ? theme.accentStrong : "#9ca3af", fontSize: 10.5, lineHeight: 1.38 }}>{step.detail}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {replay.actions.map((action) => (
                      <button key={action.label} className="glass-button" aria-label={action.label === "Replay mock" ? "Replay mock" : action.label} onClick={() => onAction(action.prompt)} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 7, padding: "4px 7px", color: theme.accentText, fontSize: 10.5, fontWeight: 800, cursor: "pointer" }}>
                        {action.label}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
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
            <div className="empty-state">
              <strong style={{ display: "block", color: theme.accentText, fontSize: 12, marginBottom: 5 }}>No scored sessions yet</strong>
              <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.45 }}>Run a mock and the latest scored sessions will appear here with retry prompts.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
