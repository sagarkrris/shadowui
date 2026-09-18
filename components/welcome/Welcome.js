import Link from "next/link";
import { practiceSummary } from "../../lib/dailyPractice.mjs";
import { useCallback, useEffect, useState } from "react";
import { getQuickPrompts } from "../../lib/prompts.mjs";
import { getStackGreeting } from "../../lib/personalization.mjs";
import { buildPrepCommandCenter } from "../../lib/prepCoach.mjs";
import { deriveProofVaultStories } from "../../lib/prepInsights.mjs";
import { CAREER_TOOLKIT_STORAGE_KEY } from "../../lib/careerToolkit.mjs";
import PrepCommandCenter from "./PrepCommandCenter";
import PracticePack from "./PracticePack";
import PrepInsightsPanel from "./PrepInsightsPanel";
import CareerToolkit from "./CareerToolkit";
import InterviewMissionControl from "./InterviewMissionControl";
import PrepOSDashboard from "./PrepOSDashboard";
import SmartPrepTimeline from "./SmartPrepTimeline";
import UnifiedProgressBrain from "./UnifiedProgressBrain";
import CodeRunner from "../CodeRunner";

export default function Welcome({ practice = { attempts: [] }, onResume, hasDraft, onChip, onStart, onScreen, onVoice, onRecordReview, selectedCat, selectedSub, mode, difficulty, theme, profile, showCodeTools, topics, weakSpots, mockScores, messages, structuredSessions = [], questionMemory, onQuestionMemoryChange, systemDesignCanvas, onPracticeMock, onOpenWorkspace, beginnerMode, onBeginnerModeChange, prepProgressState, onNotify, onBeginnerStepChange, onExportPlan, onToolkitStateChange: onExternalToolkitStateChange }) {
  const [toolkitState, setToolkitState] = useState({});
  const [activeSection, setActiveSection] = useState("overview");
  const summary = practiceSummary(practice.attempts);
  const lastAttempt = practice.attempts.at(-1);
  const topic = selectedSub || selectedCat;
  const quickPrompts = getQuickPrompts(selectedCat, selectedSub);

  const commandCenter = buildPrepCommandCenter({ profile, topics, weakSpots, mockScores });
  const proofStories = deriveProofVaultStories(messages, profile);
  const handleToolkitStateChange = useCallback((nextState) => { const next = nextState || {}; setToolkitState(next); onExternalToolkitStateChange?.(next); }, [onExternalToolkitStateChange]);
  const featureBadges = [
    ["ti-screenshot", "Screen AI"],
    ["ti-microphone", "Voice"],
    ["ti-wave-sine", "Record Review"],
    ...(showCodeTools ? [["ti-code", "Code Help"]] : []),
    ["ti-bolt", "Streaming"],
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      setToolkitState(JSON.parse(window.localStorage.getItem(CAREER_TOOLKIT_STORAGE_KEY) || "{}")?.state || {});
    } catch {
      setToolkitState({});
    }
  }, []);

  useEffect(() => {
    const selectFromHash = () => {
      const section = window.location.hash.replace("#dashboard-", "");
      if (["overview", "practice", "career"].includes(section)) setActiveSection(section);
    };
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, []);

  useEffect(() => {
    const root = document.querySelector(".chat-scroll");
    const sections = ["overview", "practice", "career"].map((id) => document.getElementById(`dashboard-${id}`)).filter(Boolean);
    if (!root || !sections.length || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) setActiveSection(visible.target.id.replace("dashboard-", ""));
    }, { root, threshold: [0.15, 0.4, 0.7], rootMargin: "-8% 0px -55% 0px" });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="welcome-screen prep-home-screen" style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "18px 20px 28px", textAlign: "center", overflowY: "visible" }}>
      <section className="practice-panel today-card">
        <p>Today · 12 minutes</p><h1>Practise {lastAttempt?.topic || topic || 'your next interview topic'}</h1>
        <p>{lastAttempt?.gaps?.[0] ? `Your last answer: ${lastAttempt.gaps[0]}` : 'Answer one question, review the evidence, and try again.'}</p>
        <button onClick={() => onStart(lastAttempt?.topic || topic)}>Start practice</button>
        {hasDraft && <button onClick={onResume}>Resume last session</button>}
        <p>{summary.completed} completed attempts · {summary.average === null ? 'Not assessed' : `${summary.average}/10 average`}</p>
        <p>{summary.readiness}</p>
        <button onClick={() => onOpenWorkspace?.('javaDigest')}>Explore topics</button>
        <p>Learn: study an explanation · Practice: improve an answer · Mock: timed interview · Review: revisit recorded evidence.</p>
      </section>
      <section className="practice-panel" style={{ width: "100%" }}><h2>Production Detective</h2><p>Investigate a five-minute debugging mystery. Follow the evidence, choose a diagnosis, and explore the repair.</p><Link href="/detective">Open the case files →</Link></section>
      <section className="practice-panel" style={{ width: "100%" }}><h2>When Advice Fails</h2><p>Five practical backend field notes on the conditions where familiar advice breaks—and how to verify a safer correction.</p><Link href="/advice-fails">Read the field notes →</Link></section>
      <section className="practice-panel" style={{ width: "100%" }}><h2>Explain This Log</h2><p>Decode fictional stack traces, query plans, thread dumps, and HTTP exchanges without uploading production data.</p><Link href="/explain-log">Open the log reader →</Link></section>
      <details className="practice-panel" style={{ width: '100%' }}><summary>Advanced tools and learning plans</summary>
      <div className="welcome-actions" style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", justifyContent: "center" }}>
        <button className="glass-button" onClick={onStart} disabled={!onStart} aria-label="Start mock interview" style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", border: `1px solid ${theme.accentBorder}`, borderRadius: 10, background: theme.accentSoft, color: theme.accentText, fontSize: 13, fontWeight: 800, cursor: onStart ? "pointer" : "not-allowed", opacity: onStart ? 1 : 0.55 }}>
          <i className="ti ti-player-play" />Start mock
        </button>
        <button className="glass-button" onClick={onScreen} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", border: `1px solid ${theme.accentBorder}`, borderRadius: 10, color: theme.accentText, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          <i className="ti ti-screenshot" />Analyze Screen
        </button>
        <button className="glass-button" onClick={onVoice} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", border: `1px solid ${theme.accentBorder}`, borderRadius: 10, color: theme.accentText, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          <i className="ti ti-microphone" />Voice Input
        </button>
        <button className="glass-button" onClick={onRecordReview} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", border: `1px solid ${theme.accentBorder}`, borderRadius: 10, color: theme.accentText, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          <i className="ti ti-wave-sine" />Record Review
        </button>
        <button className="welcome-java-digest-launch" onClick={() => onOpenWorkspace?.("javaDigest")}>
          <i className="ti ti-news" /><span>Open Java Digest<small>Java + Spring curriculum</small></span><i className="ti ti-arrow-right" aria-hidden="true" />
        </button>
      </div>

      <div aria-label="Focused prompts" style={{ display: "grid", gap: 8, justifyItems: "center", width: "100%", maxWidth: 520 }}>
        <div style={{ color: theme.appearance === "light" ? "#526579" : "#cbd5e1", fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>Focused prompts</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        {quickPrompts.map((chip) => (
          <button key={chip} className="glass-button" onClick={() => onChip(chip)} style={{ padding: "6px 13px", fontSize: 12, fontWeight: 500, borderRadius: 20, border: `1px solid ${theme.accentBorder}`, color: theme.accentText, cursor: "pointer" }}>
            {chip}
          </button>
        ))}
        </div>
      </div>

      <nav className="dashboard-section-nav" aria-label="Dashboard sections">
        <a href="#dashboard-overview" onClick={() => setActiveSection("overview")} aria-current={activeSection === "overview" ? "location" : undefined}>Overview</a>
        <a href="#dashboard-practice" onClick={() => setActiveSection("practice")} aria-current={activeSection === "practice" ? "location" : undefined}>Practice</a>
        <a href="#dashboard-career" onClick={() => setActiveSection("career")} aria-current={activeSection === "career" ? "location" : undefined}>Career</a>
      </nav>

      <div className="welcome-secondary">
      <div id="dashboard-overview" className="dashboard-section">
      <InterviewMissionControl
        profile={profile}
        topics={topics}
        weakSpots={weakSpots}
        systemDesignCanvas={systemDesignCanvas}
        theme={theme}
        onAction={onChip}
        onOpenWorkspace={onOpenWorkspace}
      />

      <UnifiedProgressBrain
        profile={profile}
        weakSpots={weakSpots}
        mockScores={mockScores}
        questionMemory={questionMemory}
        systemDesignCanvas={systemDesignCanvas}
        messages={messages}
        structuredSessions={structuredSessions}
        prepProgressState={prepProgressState}
        theme={theme}
        beginnerMode={beginnerMode}
        onBeginnerModeChange={onBeginnerModeChange}
        onBeginnerStepChange={onBeginnerStepChange}
        onAction={onChip}
        onOpenWorkspace={onOpenWorkspace}
        onExportPlan={onExportPlan}
      />
      </div>

      <div id="dashboard-practice" className="dashboard-section">
      {mode === "practice" && (
        <PracticePack
          profile={profile}
          selectedCat={selectedCat}
          selectedSub={selectedSub}
          difficulty={difficulty}
          theme={theme}
          questionMemory={questionMemory}
          onQuestionMemoryChange={onQuestionMemoryChange}
          onPracticeMock={onPracticeMock}
        />
      )}

      {showCodeTools && (
        <CodeRunner
          profile={profile}
          selectedCat={selectedCat}
          selectedSub={selectedSub}
          theme={theme}
        />
      )}

      <PrepCommandCenter center={commandCenter} theme={theme} onAction={onChip} />
      </div>

      <div id="dashboard-career" className="dashboard-section">
      <PrepOSDashboard
        profile={profile}
        topics={topics}
        weakSpots={weakSpots}
        mockScores={mockScores}
        questionMemory={questionMemory}
        proofStories={proofStories}
        interviews={toolkitState.interviews || []}
        theme={theme}
        onAction={onChip}
      />

      <CareerToolkit
        profile={profile}
        topics={topics}
        messages={messages}
        theme={theme}
        onAction={onChip}
        onNotify={onNotify}
        onToolkitStateChange={handleToolkitStateChange}
      />

      <SmartPrepTimeline
        profile={profile}
        topics={topics}
        weakSpots={weakSpots}
        mockScores={mockScores}
        questionMemory={questionMemory}
        proofStories={proofStories}
        interviews={toolkitState.interviews || []}
        resumeAnalysis={toolkitState.resumeAnalysis || null}
        jobDescriptionAnalysis={toolkitState.jobDescriptionAnalysis || null}
        finalPack={toolkitState.finalPack || null}
        theme={theme}
        onAction={(milestone) => onChip(typeof milestone === "string" ? milestone : `Help me with this prep milestone: ${milestone.label}. ${milestone.detail}`)}
      />

      <PrepInsightsPanel
        profile={profile}
        topics={topics}
        weakSpots={weakSpots}
        mockScores={mockScores}
        messages={messages}
        questionMemory={questionMemory}
        systemDesignCanvas={systemDesignCanvas}
        theme={theme}
        selectedCat={selectedCat}
        selectedSub={selectedSub}
        onAction={onChip}
      />

      <div className="welcome-features" style={{ marginTop: 28, display: "flex", gap: 20, fontSize: 11, color: "#374151", flexWrap: "wrap", justifyContent: "center" }}>
        {featureBadges.map(([icon, label]) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}><i className={`ti ${icon}`} />{label}</span>
        ))}
      </div>
      </div>
      </div>
      </details>
    </div>
  );
}
