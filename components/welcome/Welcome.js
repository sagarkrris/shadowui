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

export default function Welcome({ onChip, onScreen, onVoice, onRecordReview, selectedCat, selectedSub, mode, difficulty, theme, profile, showCodeTools, topics, weakSpots, mockScores, messages, structuredSessions = [], questionMemory, onQuestionMemoryChange, systemDesignCanvas, onPracticeMock, onOpenWorkspace, beginnerMode, onBeginnerModeChange, prepProgressState, onBeginnerStepChange, onExportPlan, onToolkitStateChange: onExternalToolkitStateChange }) {
  const [toolkitState, setToolkitState] = useState({});
  const topic = selectedSub || selectedCat;
  const quickPrompts = getQuickPrompts(selectedCat, selectedSub);
  const greeting = getStackGreeting(profile);
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

  return (
    <div className="welcome-screen prep-home-screen" style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "18px 20px 28px", textAlign: "center", overflowY: "visible" }}>
      <div className="welcome-logo" style={{ width: 60, height: 60, borderRadius: "50%", background: theme.accentSoft, border: `1px solid ${theme.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, color: theme.accentStrong, fontSize: greeting.stackBadge.length > 8 ? 11 : greeting.stackBadge.length > 6 ? 12 : 14, fontWeight: 900, lineHeight: 1, letterSpacing: 0, textAlign: "center", padding: "0 8px", overflowWrap: "anywhere" }}>
        {greeting.stackBadge}
      </div>
      <h1 className="welcome-title" style={{ fontSize: 20, fontWeight: 600, color: "#e8e8f0", marginBottom: 8, maxWidth: 520, overflowWrap: "anywhere", lineHeight: 1.35 }}>{greeting.headline}</h1>
      {topic ? (
        <p className="welcome-copy" style={{ fontSize: 13.5, color: "#6b7280", marginBottom: 24, maxWidth: 340, lineHeight: 1.65 }}>
          {`${greeting.context} Ready for ${topic}. Hit Start or pick a focused prompt below.`}
        </p>
      ) : (
        <p className="welcome-copy" style={{ fontSize: 13.5, color: "#6b7280", marginBottom: 24, maxWidth: 340, lineHeight: 1.65 }}>
          {`${greeting.context} Select a topic from the sidebar, choose mode & difficulty, then hit Start - or jump in below.`}
        </p>
      )}

      <div className="welcome-actions" style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", justifyContent: "center" }}>
        <button className="glass-button" onClick={onScreen} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", border: `1px solid ${theme.accentBorder}`, borderRadius: 10, color: theme.accentText, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          <i className="ti ti-screenshot" />Analyze Screen
        </button>
        <button className="glass-button" onClick={onVoice} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", border: `1px solid ${theme.accentBorder}`, borderRadius: 10, color: theme.accentText, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          <i className="ti ti-microphone" />Voice Input
        </button>
        <button className="glass-button" onClick={onRecordReview} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", border: `1px solid ${theme.accentBorder}`, borderRadius: 10, color: theme.accentText, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          <i className="ti ti-wave-sine" />Record Review
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", maxWidth: 500 }}>
        {quickPrompts.map((chip) => (
          <button key={chip} className="glass-button" onClick={() => onChip(chip)} style={{ padding: "6px 13px", fontSize: 12, fontWeight: 500, borderRadius: 20, border: `1px solid ${theme.accentBorder}`, color: theme.accentText, cursor: "pointer" }}>
            {chip}
          </button>
        ))}
      </div>

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
  );
}
