import { useEffect, useMemo, useState } from "react";
import {
  analyzeJobDescriptionFit,
  analyzeResumeGaps,
  buildInterviewTrackerSummary,
  buildPracticeStreak,
  buildSpacedReviewQueue,
  CAREER_TOOLKIT_STORAGE_KEY,
  markReviewComplete,
  normalizeInterviewEvent,
  recordActivityDate,
  validateInterviewDraft,
} from "../../lib/careerToolkit.mjs";
import { buildRolePack } from "../../lib/rolePacks.mjs";

const EMPTY_STATE = {
  resumeText: "",
  resumeAnalysis: null,
  jobDescriptionText: "",
  jobDescriptionAnalysis: null,
  reviewHistory: {},
  interviews: [],
  activityDates: [],
};

const EMPTY_INTERVIEW = {
  company: "",
  role: "",
  date: "",
  round: "Technical",
  status: "scheduled",
  notes: "",
};

const RESUME_FILE_LIMIT_BYTES = 5 * 1024 * 1024;

function arrayBufferToBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return window.btoa(binary);
}

function readToolkitState() {
  if (typeof window === "undefined") return EMPTY_STATE;

  try {
    const raw = window.localStorage.getItem(CAREER_TOOLKIT_STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw);
    return { ...EMPTY_STATE, ...(parsed?.state || {}) };
  } catch {
    return EMPTY_STATE;
  }
}

function saveToolkitState(state) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      CAREER_TOOLKIT_STORAGE_KEY,
      JSON.stringify({ version: 1, savedAt: new Date().toISOString(), state }),
    );
  } catch {
    // Local storage can fail in private mode; the toolkit still works for this page session.
  }
}

function statCard({ icon, label, value, theme }) {
  return (
    <div className="glass-card" style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 10 }}>
      <div style={{ color: "#6b7280", fontSize: 10.5, display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
        <i className={`ti ${icon}`} />{label}
      </div>
      <strong style={{ color: theme.accentText, fontSize: 18, lineHeight: 1 }}>{value}</strong>
    </div>
  );
}

function severityColor(severity, theme) {
  if (severity === "High") return "#fca5a5";
  if (severity === "Medium") return theme.accentStrong;
  return "#9ca3af";
}

function scoreBandColor(score, theme) {
  if (score >= 80) return "#86efac";
  if (score >= 60) return theme.accentStrong;
  return "#fca5a5";
}

function normalizeResumeAnalysis(analysis) {
  if (!analysis) return null;

  return {
    ...analysis,
    scoreBreakdown: Array.isArray(analysis?.scoreBreakdown) ? analysis.scoreBreakdown : [],
    issues: Array.isArray(analysis?.issues) ? analysis.issues : [],
    rewriteSuggestions: Array.isArray(analysis?.rewriteSuggestions) ? analysis.rewriteSuggestions : [],
    missingSkills: Array.isArray(analysis?.missingSkills) ? analysis.missingSkills : [],
    interviewProofGaps: Array.isArray(analysis?.interviewProofGaps) ? analysis.interviewProofGaps : [],
    practicePlan: Array.isArray(analysis?.practicePlan) ? analysis.practicePlan : [],
  };
}

function normalizeJobDescriptionAnalysis(analysis) {
  if (!analysis) return null;

  return {
    ...analysis,
    requiredSkills: Array.isArray(analysis?.requiredSkills) ? analysis.requiredSkills : [],
    coveredSkills: Array.isArray(analysis?.coveredSkills) ? analysis.coveredSkills : [],
    missingSkills: Array.isArray(analysis?.missingSkills) ? analysis.missingSkills : [],
    practicePlan: Array.isArray(analysis?.practicePlan) ? analysis.practicePlan : [],
    mustKnowSkills: Array.isArray(analysis?.mustKnowSkills) ? analysis.mustKnowSkills : [],
    likelyQuestions: Array.isArray(analysis?.likelyQuestions) ? analysis.likelyQuestions : [],
    resumeRewriteSuggestions: Array.isArray(analysis?.resumeRewriteSuggestions) ? analysis.resumeRewriteSuggestions : [],
    gapUrgency: Array.isArray(analysis?.gapUrgency) ? analysis.gapUrgency : [],
    crashPlan: Array.isArray(analysis?.crashPlan) ? analysis.crashPlan : [],
  };
}

function buildResumeQuestionPrompts(resumeAnalysis, profile) {
  if (!resumeAnalysis) return [];

  const targetRole = profile?.position || resumeAnalysis.targetRole || "target role";
  const skills = [
    ...resumeAnalysis.matchedSkills.slice(0, 3),
    ...resumeAnalysis.missingSkills.slice(0, 2),
  ];

  return skills.slice(0, 4).map((skill) => ({
    skill: skill.name,
    prompt: `My resume mentions or implies ${skill.name}. Ask me one realistic interviewer question for a ${targetRole}, wait for my answer, then review correctness, depth, examples, trade-offs, communication clarity, and follow-up readiness.`,
  }));
}

export default function CareerToolkit({ profile, topics, messages, theme, onAction, onToolkitStateChange }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState(EMPTY_STATE);
  const [interviewDraft, setInterviewDraft] = useState(EMPTY_INTERVIEW);
  const [interviewNotice, setInterviewNotice] = useState("");
  const [resumeNotice, setResumeNotice] = useState("");
  const [resumeUploadBusy, setResumeUploadBusy] = useState(false);

  useEffect(() => {
    setState(readToolkitState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveToolkitState(state);
    onToolkitStateChange?.(state);
  }, [ready, state, onToolkitStateChange]);

  const reviewQueue = useMemo(
    () => buildSpacedReviewQueue({ messages, reviewHistory: state.reviewHistory }),
    [messages, state.reviewHistory],
  );
  const interviewSummary = useMemo(
    () => buildInterviewTrackerSummary(state.interviews),
    [state.interviews],
  );
  const reviewedCount = Object.values(state.reviewHistory || {}).reduce((sum, item) => sum + (item.completedCount || 0), 0);
  const streak = buildPracticeStreak(state.activityDates, {
    reviewedCount,
    interviewCount: state.interviews.length,
  });
  const badges = [
    streak.activeDays > 0 ? "First rep" : null,
    streak.currentStreak >= 3 ? "3-day streak" : null,
    reviewedCount > 0 ? "Review finisher" : null,
    state.interviews.length > 0 ? "Tracker ready" : null,
  ].filter(Boolean);
  const resumeAnalysis = normalizeResumeAnalysis(state.resumeAnalysis);
  const jobDescriptionAnalysis = normalizeJobDescriptionAnalysis(state.jobDescriptionAnalysis);
  const weakestScoreAreas = resumeAnalysis?.scoreBreakdown
    .filter((item) => item.score < 80)
    .sort((left, right) => left.score - right.score)
    .slice(0, 2) || [];
  const resumeQuestionPrompts = buildResumeQuestionPrompts(resumeAnalysis, profile);
  const rolePack = buildRolePack({ profile });

  const rememberActivity = () => {
    setState((previous) => ({
      ...previous,
      activityDates: recordActivityDate(previous.activityDates),
    }));
  };

  const runResumeAnalysis = () => {
    const analysis = analyzeResumeGaps({
      resumeText: state.resumeText,
      profile,
      topics,
    });

    setState((previous) => ({
      ...previous,
      resumeAnalysis: analysis,
      activityDates: recordActivityDate(previous.activityDates),
    }));
  };

  const runJobDescriptionAnalysis = () => {
    const analysis = analyzeJobDescriptionFit({
      jobDescriptionText: state.jobDescriptionText,
      resumeText: state.resumeText,
      profile,
      topics,
    });

    setState((previous) => ({
      ...previous,
      jobDescriptionAnalysis: analysis,
      activityDates: recordActivityDate(previous.activityDates),
    }));
  };

  const handleResumeFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > RESUME_FILE_LIMIT_BYTES) {
      setResumeNotice("Resume file is too large. Please upload a file under 5 MB or paste the key resume text.");
      event.target.value = "";
      return;
    }

    setResumeUploadBusy(true);
    setResumeNotice("Extracting resume text...");

    try {
      const response = await fetch("/api/extract-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          fileBase64: arrayBufferToBase64(await file.arrayBuffer()),
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "InterviewIQ could not extract text from this resume. Paste the text below and try again.");
      }

      const text = String(payload.text || "").trim();
      if (!text) {
        throw new Error("InterviewIQ could not find readable text in this resume. Please paste the resume text below.");
      }

      setState((previous) => ({ ...previous, resumeText: text, resumeAnalysis: null, jobDescriptionAnalysis: null }));
      setResumeNotice(`${file.name} extracted inside InterviewIQ. Resume text was not sent to Gemini or any external AI service.`);
    } catch (error) {
      setResumeNotice(error.message || "InterviewIQ could not extract this resume. Please paste the resume text below.");
    } finally {
      setResumeUploadBusy(false);
      event.target.value = "";
    }
  };

  const practicePrompt = (prompt) => {
    rememberActivity();
    onAction(prompt);
  };

  const markReview = (item) => {
    setState((previous) => ({
      ...previous,
      reviewHistory: markReviewComplete(previous.reviewHistory, item.topic),
      activityDates: recordActivityDate(previous.activityDates),
    }));
  };

  const addInterview = () => {
    const validation = validateInterviewDraft(interviewDraft);
    if (!validation.ok) {
      setInterviewNotice(validation.message);
      return;
    }

    const next = normalizeInterviewEvent(interviewDraft);

    setState((previous) => ({
      ...previous,
      interviews: [next, ...previous.interviews].slice(0, 12),
    }));
    setInterviewDraft(EMPTY_INTERVIEW);
    setInterviewNotice("");
  };

  const removeInterview = (id) => {
    setState((previous) => ({
      ...previous,
      interviews: previous.interviews.filter((event) => event.id !== id),
    }));
  };

  return (
    <section style={{ width: "100%", maxWidth: 980, display: "grid", gap: 12, marginTop: 22, textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 900 }}>
            <i className="ti ti-briefcase" />Career Toolkit
          </div>
          <p style={{ color: "#6b7280", fontSize: 11.5, lineHeight: 1.5, marginTop: 4 }}>
            Local resume gaps, weak-spot revision, interview schedule, and daily momentum.
          </p>
        </div>
        <button className="glass-button" onClick={rememberActivity} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: "7px 10px", color: theme.accentText, fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}>
          <i className="ti ti-flame" /> Mark today practiced
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
        {statCard({ icon: "ti-flame", label: "Current streak", value: `${streak.currentStreak}d`, theme })}
        {statCard({ icon: "ti-trophy", label: "XP level", value: `L${streak.level}`, theme })}
        {statCard({ icon: "ti-repeat", label: "Reviews done", value: reviewedCount, theme })}
        {statCard({ icon: "ti-calendar-event", label: "Upcoming", value: interviewSummary.upcomingCount, theme })}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(badges.length ? badges : ["Build your first badge today"]).map((badge) => (
          <span key={badge} style={{ color: badges.length ? theme.accentStrong : "#6b7280", border: `1px solid ${badges.length ? theme.accentBorder : "rgba(255,255,255,.07)"}`, background: badges.length ? theme.accentMuted : "rgba(255,255,255,.025)", borderRadius: 999, padding: "4px 8px", fontSize: 10.5, fontWeight: 800 }}>
            <i className="ti ti-award" /> {badge}
          </span>
        ))}
      </div>

      <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <span>
            <span style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 900 }}>
              <i className="ti ti-briefcase-2" />Role Pack Builder
            </span>
            <p style={{ color: "#9ca3af", fontSize: 11.3, lineHeight: 1.45, marginTop: 5 }}>
              {rolePack.title} tuned from your target role and stack.
            </p>
          </span>
          <span style={{ border: `1px solid ${theme.accentBorder}`, background: theme.accentMuted, color: theme.accentStrong, borderRadius: 999, padding: "5px 9px", fontSize: 10.8, fontWeight: 900 }}>
            {rolePack.rounds.length} rounds
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginBottom: 10 }}>
          {rolePack.focusTopics.slice(0, 6).map((topic) => (
            <button key={topic} className="glass-button" onClick={() => practicePrompt(`Role Pack Builder drill for ${rolePack.title}: ${topic}. Ask one realistic interview question, wait for my answer, then score it with the role-pack rubric.`)} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8, color: "#cbd5e1", fontSize: 10.8, textAlign: "left", cursor: "pointer" }}>
              {topic}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {rolePack.priorityDrills.slice(0, 3).map((drill) => (
            <button key={drill} className="glass-button" onClick={() => practicePrompt(`Role Pack Builder for ${rolePack.title}: ${drill}`)} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 7, padding: "5px 8px", color: theme.accentText, fontSize: 10.6, fontWeight: 800, cursor: "pointer" }}>
              {drill}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10, alignItems: "start" }}>
        <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: theme.accentText, fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <i className="ti ti-file-cv" />Resume Gap Analysis
          </div>
          <input type="file" aria-label="Upload resume file" accept=".txt,.md,.markdown,.pdf,.doc,.docx" onChange={handleResumeFile} disabled={resumeUploadBusy} style={{ color: "#9ca3af", fontSize: 11, marginBottom: 8, width: "100%", opacity: resumeUploadBusy ? .55 : 1 }} />
          <textarea
            value={state.resumeText}
            onChange={(event) => setState((previous) => ({ ...previous, resumeText: event.target.value, resumeAnalysis: null, jobDescriptionAnalysis: null }))}
            rows={5}
            className="glass-input"
            placeholder="Upload PDF/DOCX/TXT/MD or paste resume text here. Gap analysis stays in InterviewIQ."
            style={{ width: "100%", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 9, color: "#e8e8f0", fontSize: 12, lineHeight: 1.45, outline: "none", marginBottom: 8 }}
          />
          {resumeNotice && <p style={{ color: "#9ca3af", fontSize: 10.8, lineHeight: 1.4, marginBottom: 8 }}>{resumeNotice}</p>}
          <button className="glass-button" onClick={runResumeAnalysis} disabled={!state.resumeText.trim() || resumeUploadBusy} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: "7px 10px", color: theme.accentText, fontSize: 11.5, fontWeight: 800, cursor: state.resumeText.trim() && !resumeUploadBusy ? "pointer" : "not-allowed", opacity: state.resumeText.trim() && !resumeUploadBusy ? 1 : .45 }}>
            {resumeUploadBusy ? "Extracting..." : "Analyze gaps"}
          </button>
          {resumeAnalysis && (
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong style={{ color: theme.accentText, fontSize: 22 }}>{resumeAnalysis.score}%</strong>
                <span style={{ color: "#9ca3af", fontSize: 11.3 }}>{resumeAnalysis.summary}</span>
              </div>
              {weakestScoreAreas.length > 0 && (
                <div style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8, background: "rgba(255,255,255,.025)" }}>
                  <strong style={{ display: "block", color: theme.accentText, fontSize: 11.5, marginBottom: 4 }}>Why this score?</strong>
                  <p style={{ color: "#cbd5e1", fontSize: 10.8, lineHeight: 1.45 }}>
                    Lowest areas: {weakestScoreAreas.map((item) => `${item.label} ${item.score}%`).join(" and ")}. Improve these first to raise the resume match.
                  </p>
                </div>
              )}

              {resumeAnalysis.scoreBreakdown.length > 0 && (
              <div>
                <div style={{ color: theme.accentText, fontSize: 11.5, fontWeight: 900, marginBottom: 7 }}>
                  Score Breakdown
                </div>
                <div style={{ display: "grid", gap: 7 }}>
                  {resumeAnalysis.scoreBreakdown.map((item) => (
                    <div key={item.id} style={{ display: "grid", gap: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, color: "#cbd5e1", fontSize: 10.8 }}>
                        <span>{item.label}</span>
                        <strong style={{ color: scoreBandColor(item.score, theme) }}>{item.score}%</strong>
                      </div>
                      <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                        <div style={{ width: `${item.score}%`, height: "100%", background: scoreBandColor(item.score, theme), borderRadius: 999 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {resumeAnalysis.issues.length > 0 && (
                <div>
                  <div style={{ color: theme.accentText, fontSize: 11.5, fontWeight: 900, marginBottom: 7 }}>
                    Priority Fixes
                  </div>
                  <div style={{ display: "grid", gap: 7 }}>
                    {resumeAnalysis.issues.slice(0, 4).map((issue) => (
                      <article key={`${issue.severity}-${issue.title}`} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                          <strong style={{ color: "#e8e8f0", fontSize: 11.5 }}>{issue.title}</strong>
                          <span style={{ color: severityColor(issue.severity, theme), fontSize: 10, fontWeight: 900 }}>{issue.severity}</span>
                        </div>
                        <p style={{ color: "#9ca3af", fontSize: 10.8, lineHeight: 1.45, marginBottom: 5 }}>{issue.detail}</p>
                        <p style={{ color: theme.accentStrong, fontSize: 10.5, lineHeight: 1.4 }}>{issue.action}</p>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {resumeAnalysis.rewriteSuggestions.length > 0 && (
                <div>
                  <div style={{ color: theme.accentText, fontSize: 11.5, fontWeight: 900, marginBottom: 7 }}>
                    Rewrite Suggestions
                  </div>
                  <div style={{ display: "grid", gap: 7 }}>
                    {resumeAnalysis.rewriteSuggestions.slice(0, 2).map((suggestion) => (
                      <article key={suggestion.id} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8 }}>
                        <strong style={{ display: "block", color: "#e8e8f0", fontSize: 11.5, marginBottom: 5 }}>{suggestion.title}</strong>
                        <p style={{ color: "#6b7280", fontSize: 10.6, lineHeight: 1.4, marginBottom: 5 }}>{suggestion.original}</p>
                        <p style={{ color: "#cbd5e1", fontSize: 10.8, lineHeight: 1.45, marginBottom: 5 }}>{suggestion.improved}</p>
                        <p style={{ color: theme.accentStrong, fontSize: 10.5, lineHeight: 1.4 }}>{suggestion.reason}</p>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {resumeAnalysis.missingSkills.slice(0, 6).map((skill) => (
                  <span key={skill.name} style={{ color: theme.accentStrong, border: `1px solid ${theme.accentBorder}`, background: theme.accentMuted, borderRadius: 999, padding: "3px 7px", fontSize: 10.5, fontWeight: 700 }}>
                    {skill.name}
                  </span>
                ))}
              </div>
              {resumeAnalysis.interviewProofGaps.length > 0 && (
                <div>
                  <div style={{ color: theme.accentText, fontSize: 11.5, fontWeight: 900, marginBottom: 7 }}>
                    Interview Proof Gaps
                  </div>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    {resumeAnalysis.interviewProofGaps.slice(0, 4).map((gap) => (
                      <button key={gap.skill} className="glass-button" onClick={() => practicePrompt(gap.prompt)} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 999, padding: "5px 8px", color: theme.accentText, fontSize: 10.8, fontWeight: 800, cursor: "pointer" }}>
                        <i className="ti ti-user-question" />{gap.skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {resumeQuestionPrompts.length > 0 && (
                <div>
                  <div style={{ color: theme.accentText, fontSize: 11.5, fontWeight: 900, marginBottom: 7 }}>
                    Likely Resume Questions
                  </div>
                  <div style={{ display: "grid", gap: 7 }}>
                    {resumeQuestionPrompts.map((item) => (
                      <button key={item.skill} className="glass-button" onClick={() => practicePrompt(item.prompt)} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8, textAlign: "left", color: "#cbd5e1", fontSize: 11.2, cursor: "pointer" }}>
                        <strong style={{ display: "block", color: theme.accentText, marginBottom: 3 }}>Ask me this: {item.skill}</strong>
                        Practice a resume-based follow-up question.
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {resumeAnalysis.practicePlan.slice(0, 3).map((item) => (
                <button key={item.id} className="glass-button" onClick={() => practicePrompt(item.prompt)} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8, textAlign: "left", color: "#e8e8f0", fontSize: 11.5, cursor: "pointer" }}>
                  <strong style={{ display: "block", color: theme.accentText, marginBottom: 3 }}>{item.title}</strong>
                  <span style={{ color: "#6b7280" }}>{item.focus}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: theme.accentText, fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <i className="ti ti-file-search" />Target Job Description
          </div>
          <textarea
            value={state.jobDescriptionText}
            onChange={(event) => setState((previous) => ({ ...previous, jobDescriptionText: event.target.value, jobDescriptionAnalysis: null }))}
            rows={5}
            className="glass-input"
            placeholder="Paste the target job description to compare required skills with your resume evidence."
            style={{ width: "100%", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 9, color: "#e8e8f0", fontSize: 12, lineHeight: 1.45, outline: "none", marginBottom: 8 }}
          />
          <button className="glass-button" onClick={runJobDescriptionAnalysis} disabled={!state.jobDescriptionText.trim()} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: "7px 10px", color: theme.accentText, fontSize: 11.5, fontWeight: 800, cursor: state.jobDescriptionText.trim() ? "pointer" : "not-allowed", opacity: state.jobDescriptionText.trim() ? 1 : .45 }}>
            Analyze role fit
          </button>
          {jobDescriptionAnalysis && (
            <div style={{ marginTop: 10, display: "grid", gap: 9 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong style={{ color: scoreBandColor(jobDescriptionAnalysis.score, theme), fontSize: 22 }}>{jobDescriptionAnalysis.score}%</strong>
                <span style={{ color: "#9ca3af", fontSize: 11.3 }}>{jobDescriptionAnalysis.summary}</span>
              </div>
              <div style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 9, background: theme.accentMuted }}>
                <div style={{ color: theme.accentText, fontSize: 11.8, fontWeight: 900, marginBottom: 7 }}>
                  <i className="ti ti-sparkles" /> JD Copilot
                </div>
                <div style={{ display: "grid", gap: 9 }}>
                  <div>
                    <div style={{ color: theme.accentText, fontSize: 11.2, fontWeight: 900, marginBottom: 6 }}>Must-know skills</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {jobDescriptionAnalysis.mustKnowSkills.slice(0, 6).map((skill) => (
                        <span key={`must-${skill.name}`} style={{ color: skill.status === "missing" ? theme.accentStrong : "#86efac", border: `1px solid ${skill.status === "missing" ? theme.accentBorder : "rgba(134,239,172,.28)"}`, background: skill.status === "missing" ? "rgba(255,255,255,.035)" : "rgba(134,239,172,.08)", borderRadius: 999, padding: "3px 7px", fontSize: 10.3, fontWeight: 800 }}>
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: theme.accentText, fontSize: 11.2, fontWeight: 900, marginBottom: 6 }}>Top likely questions</div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {jobDescriptionAnalysis.likelyQuestions.slice(0, 3).map((item) => (
                        <button key={item.id} className="glass-button" onClick={() => practicePrompt(item.prompt)} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 7, padding: 7, textAlign: "left", color: "#cbd5e1", fontSize: 10.8, cursor: "pointer" }}>
                          {item.question}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: theme.accentText, fontSize: 11.2, fontWeight: 900, marginBottom: 6 }}>Resume proof rewrites</div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {jobDescriptionAnalysis.resumeRewriteSuggestions.slice(0, 2).map((item) => (
                        <article key={item.id} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 7, padding: 7 }}>
                          <strong style={{ display: "block", color: "#e8e8f0", fontSize: 10.8, marginBottom: 4 }}>{item.title}</strong>
                          <p style={{ color: "#cbd5e1", fontSize: 10.5, lineHeight: 1.4 }}>{item.after}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: theme.accentText, fontSize: 11.2, fontWeight: 900, marginBottom: 6 }}>Gap urgency</div>
                    <div style={{ display: "grid", gap: 5 }}>
                      {jobDescriptionAnalysis.gapUrgency.slice(0, 4).map((item) => (
                        <div key={`urgency-${item.skill}`} style={{ display: "grid", gridTemplateColumns: "1fr 34px", gap: 8, color: "#9ca3af", fontSize: 10.6 }}>
                          <span>{item.skill} · {item.action}</span>
                          <strong style={{ color: item.status === "missing" ? theme.accentStrong : "#86efac", textAlign: "right" }}>{item.priority}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: theme.accentText, fontSize: 11.2, fontWeight: 900, marginBottom: 6 }}>7-day role crash plan</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 6 }}>
                      {jobDescriptionAnalysis.crashPlan.slice(0, 7).map((day) => (
                        <button key={day.day} className="glass-button" onClick={() => practicePrompt(day.prompt)} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 7, padding: 7, textAlign: "left", cursor: "pointer" }}>
                          <strong style={{ display: "block", color: theme.accentText, fontSize: 10.6, marginBottom: 3 }}>Day {day.day}: {day.title}</strong>
                          <span style={{ display: "block", color: "#6b7280", fontSize: 10.2 }}>{day.focus}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {[
                ["Required signals", jobDescriptionAnalysis.requiredSkills, "#cbd5e1", "rgba(255,255,255,.07)", "rgba(255,255,255,.025)"],
                ["Covered by resume", jobDescriptionAnalysis.coveredSkills, "#86efac", "rgba(134,239,172,.28)", "rgba(134,239,172,.08)"],
                ["Missing from resume", jobDescriptionAnalysis.missingSkills, theme.accentStrong, theme.accentBorder, theme.accentMuted],
              ].map(([label, skills, color, border, background]) => (
                <div key={label}>
                  <div style={{ color: theme.accentText, fontSize: 11.5, fontWeight: 900, marginBottom: 6 }}>{label}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(skills.length ? skills : [{ name: "None detected" }]).slice(0, 8).map((skill) => (
                      <span key={`${label}-${skill.name}`} style={{ color, border: `1px solid ${border}`, background, borderRadius: 999, padding: "3px 7px", fontSize: 10.5, fontWeight: 700 }}>
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <div style={{ color: theme.accentText, fontSize: 11.5, fontWeight: 900, marginBottom: 7 }}>
                  Role-specific mocks
                </div>
                <div style={{ display: "grid", gap: 7 }}>
                  {jobDescriptionAnalysis.practicePlan.slice(0, 4).map((item) => (
                    <button key={item.id} className="glass-button" onClick={() => practicePrompt(item.prompt)} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8, textAlign: "left", color: "#e8e8f0", fontSize: 11.5, cursor: "pointer" }}>
                      <strong style={{ display: "block", color: theme.accentText, marginBottom: 3 }}>{item.title}</strong>
                      <span style={{ color: "#6b7280" }}>{item.focus}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="glass-card" style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 12 }}>
          <div style={{ color: theme.accentText, fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <i className="ti ti-repeat" />Spaced Weak-Spot Reviews
          </div>
          {reviewQueue.length ? (
            <div style={{ display: "grid", gap: 8 }}>
              {reviewQueue.slice(0, 4).map((item) => (
                <article key={item.id} style={{ border: `1px solid ${item.status === "due" ? theme.accentBorder : "rgba(255,255,255,.07)"}`, borderRadius: 8, padding: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                    <strong style={{ color: "#e8e8f0", fontSize: 11.8 }}>{item.topic}</strong>
                    <span style={{ color: item.status === "due" ? theme.accentStrong : "#6b7280", fontSize: 10.5, fontWeight: 800 }}>
                      {item.status === "due" ? "Due" : `${item.daysUntil}d`}
                    </span>
                  </div>
                  <p style={{ color: "#9ca3af", fontSize: 11, lineHeight: 1.42, marginBottom: 7 }}>{item.correction}</p>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    <button className="glass-button" onClick={() => practicePrompt(item.retryPrompt)} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 7, padding: "5px 8px", color: theme.accentText, fontSize: 10.8, fontWeight: 800, cursor: "pointer" }}>Practice</button>
                    <button className="glass-button" onClick={() => markReview(item)} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 7, padding: "5px 8px", color: "#9ca3af", fontSize: 10.8, fontWeight: 800, cursor: "pointer" }}>Reviewed</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 11, background: theme.accentMuted }}>
              <strong style={{ display: "block", color: theme.accentText, fontSize: 12, marginBottom: 5 }}>No review queue yet</strong>
              <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.45 }}>Complete a scored mock and gaps will return after 1, 3, and 7 days.</p>
            </div>
          )}
        </div>

        <div className="glass-card" style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 12 }}>
          <div style={{ color: theme.accentText, fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <i className="ti ti-calendar-event" />Interview Tracker
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 7, marginBottom: 8 }}>
            <input className="glass-input" value={interviewDraft.company} onChange={(event) => { setInterviewNotice(""); setInterviewDraft({ ...interviewDraft, company: event.target.value }); }} placeholder="Company" aria-invalid={Boolean(interviewNotice && !interviewDraft.company.trim())} maxLength={80} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 8, color: "#e8e8f0", fontSize: 11.5, outline: "none" }} />
            <input className="glass-input" value={interviewDraft.role} onChange={(event) => { setInterviewNotice(""); setInterviewDraft({ ...interviewDraft, role: event.target.value }); }} placeholder="Role" aria-invalid={Boolean(interviewNotice && !interviewDraft.role.trim())} maxLength={100} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 8, color: "#e8e8f0", fontSize: 11.5, outline: "none" }} />
            <input className="glass-input" type="date" value={interviewDraft.date} onChange={(event) => { setInterviewNotice(""); setInterviewDraft({ ...interviewDraft, date: event.target.value }); }} aria-invalid={Boolean(interviewNotice && /date/i.test(interviewNotice))} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 8, color: "#9ca3af", fontSize: 11.5, outline: "none" }} />
            <select className="glass-input" value={interviewDraft.round} onChange={(event) => { setInterviewNotice(""); setInterviewDraft({ ...interviewDraft, round: event.target.value }); }} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 8, color: "#9ca3af", fontSize: 11.5, outline: "none" }}>
              {["Recruiter", "Technical", "System Design", "Manager", "Final"].map((round) => <option key={round}>{round}</option>)}
            </select>
            <select className="glass-input" value={interviewDraft.status} onChange={(event) => { setInterviewNotice(""); setInterviewDraft({ ...interviewDraft, status: event.target.value }); }} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 8, color: "#9ca3af", fontSize: 11.5, outline: "none" }}>
              {["scheduled", "completed", "waiting", "offer", "rejected"].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <textarea className="glass-input" value={interviewDraft.notes} onChange={(event) => setInterviewDraft({ ...interviewDraft, notes: event.target.value })} placeholder="Notes or focus areas" rows={2} maxLength={400} style={{ width: "100%", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 8, color: "#e8e8f0", fontSize: 11.5, outline: "none", marginBottom: 8 }} />
          {interviewNotice && <p role="alert" style={{ color: "#fca5a5", fontSize: 10.8, lineHeight: 1.4, marginBottom: 8 }}>{interviewNotice}</p>}
          <button className="glass-button" onClick={addInterview} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: "7px 10px", color: theme.accentText, fontSize: 11.5, fontWeight: 800, cursor: "pointer", marginBottom: 9 }}>
            Add interview
          </button>
          {interviewSummary.next && (
            <div style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 8, marginBottom: 8, background: theme.accentMuted }}>
              <strong style={{ color: theme.accentText, fontSize: 11.8 }}>{interviewSummary.next.company} in {interviewSummary.next.daysUntil}d</strong>
              <p style={{ color: "#9ca3af", fontSize: 11, marginTop: 3 }}>{interviewSummary.next.round} - {interviewSummary.next.role}</p>
            </div>
          )}
          <div style={{ display: "grid", gap: 7 }}>
            {interviewSummary.events.slice(0, 4).map((event) => (
              <article key={event.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8 }}>
                <span style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", color: "#e8e8f0", fontSize: 11.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.company} - {event.role}</strong>
                  <span style={{ display: "block", color: "#6b7280", fontSize: 10.8 }}>{event.date} · {event.round} · {event.status}</span>
                </span>
                <button onClick={() => removeInterview(event.id)} title="Remove interview" style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 15 }}>
                  <i className="ti ti-x" />
                </button>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
