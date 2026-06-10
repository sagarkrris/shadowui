import { useEffect, useMemo, useState } from "react";
import {
  INTERVIEW_MISSION_CONTROL_STORAGE_KEY,
  INTERVIEW_MISSION_CONTROL_STORAGE_VERSION,
  buildInterviewMissionControl,
  createMissionControlState,
  recordMissionCompletion,
} from "../../lib/interviewMissionControl.mjs";
import { SCENARIO_BANK_STORAGE_KEY, createScenarioBankProgress } from "../../lib/scenarioBank.mjs";
import { loadVersionedState, saveVersionedState } from "../../lib/localStateStore.mjs";

const DEFAULT_THEME = {
  accentText: "#bae6fd",
  accentStrong: "#38bdf8",
  accentBorder: "rgba(56,189,248,.28)",
  accentMuted: "rgba(14,165,233,.10)",
};

const wrap = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

function getBrowserStorage() {
  return typeof window !== "undefined" ? window.localStorage : null;
}

function MissionButton({ children, icon, onClick, tone, disabled = false }) {
  return (
    <button
      type="button"
      className={!disabled ? "glass-button" : ""}
      onClick={onClick}
      disabled={disabled}
      style={{
        alignItems: "center",
        border: `1px solid ${tone}55`,
        borderRadius: 7,
        color: disabled ? "#64748b" : "#f8fbff",
        cursor: disabled ? "default" : "pointer",
        display: "inline-flex",
        fontSize: 10.8,
        fontWeight: 850,
        gap: 6,
        minHeight: 30,
        padding: "7px 9px",
        whiteSpace: "nowrap",
      }}
    >
      <i className={`ti ${icon}`} style={{ color: disabled ? "#64748b" : tone, fontSize: 13 }} />
      {children}
    </button>
  );
}

function DailyPrepPath({ missionControl, accent, accentBorder, onAction, onOpenWorkspace }) {
  const visualMission = missionControl.missions.find((mission) => mission.workspaceId === "dsaLab" || mission.workspaceId === "canvas") || missionControl.missions[0];
  const mockMission = missionControl.missions.find((mission) => /mock/i.test(mission.actionLabel)) || missionControl.missions[1] || missionControl.missions[0];
  const reviewMission = missionControl.missions.find((mission) => mission.workspaceId === "canvas") || missionControl.missions[2] || missionControl.missions[0];
  const steps = [
    {
      id: "weakest",
      icon: "ti-target-arrow",
      title: "Weakest Topic",
      detail: missionControl.summary.weakSpot,
      action: () => onOpenWorkspace?.(visualMission?.workspaceId || "dsaLab"),
      label: "Open workspace",
    },
    {
      id: "visual",
      icon: "ti-route",
      title: "One Visual Drill",
      detail: visualMission?.title || "Run a focused visual drill.",
      action: () => visualMission?.prompt ? onAction?.(visualMission.prompt) : onOpenWorkspace?.("dsaLab"),
      label: "Start drill",
    },
    {
      id: "mock",
      icon: "ti-player-play",
      title: "One Mock",
      detail: mockMission?.title || "Run one scored mock.",
      action: () => mockMission?.prompt ? onAction?.(mockMission.prompt) : undefined,
      label: "Start mock",
    },
    {
      id: "review",
      icon: "ti-notes",
      title: "One Review",
      detail: reviewMission?.evidence || "Review the misses and update tomorrow's focus.",
      action: () => onOpenWorkspace?.(reviewMission?.workspaceId || "canvas"),
      label: "Review",
    },
  ];

  return (
    <section className="glass-card" style={{ border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
      <div>
        <div style={{ alignItems: "center", color: accent, display: "flex", fontSize: 11, fontWeight: 950, gap: 7, textTransform: "uppercase" }}>
          <i className="ti ti-calendar-bolt" />Daily Prep Path
        </div>
        <p style={{ ...wrap, color: "#9ca3af", fontSize: 11.3, lineHeight: 1.45, marginTop: 5 }}>
          Today: weakest topic, one visual drill, one mock, one review.
        </p>
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))" }}>
        {steps.map((step, index) => (
          <article key={step.id} style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 7, minHeight: 128, padding: 10 }}>
            <span style={{ color: accent, fontSize: 10.5, fontWeight: 950, textTransform: "uppercase" }}>
              <i className={`ti ${step.icon}`} /> Step {index + 1}
            </span>
            <strong style={{ ...wrap, color: "#f8fbff", fontSize: 12.5, lineHeight: 1.35 }}>{step.title}</strong>
            <span style={{ ...wrap, color: "#cbd5e1", fontSize: 11, lineHeight: 1.4 }}>{step.detail}</span>
            <button type="button" className="glass-button" onClick={step.action} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", cursor: "pointer", fontSize: 10.6, fontWeight: 850, marginTop: "auto", padding: "6px 8px", textAlign: "left" }}>
              {step.label}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function InterviewMissionControl({
  profile,
  topics,
  weakSpots,
  systemDesignCanvas,
  theme = DEFAULT_THEME,
  onAction,
  onOpenWorkspace,
}) {
  const [missionState, setMissionState] = useState(() => createMissionControlState());
  const [scenarioProgress, setScenarioProgress] = useState(() => createScenarioBankProgress());
  const accent = theme.accentStrong || DEFAULT_THEME.accentStrong;
  const accentBorder = theme.accentBorder || DEFAULT_THEME.accentBorder;

  useEffect(() => {
    const storage = getBrowserStorage();

    setMissionState(loadVersionedState(storage, {
      key: INTERVIEW_MISSION_CONTROL_STORAGE_KEY,
      version: INTERVIEW_MISSION_CONTROL_STORAGE_VERSION,
      fallback: createMissionControlState(),
      normalize: createMissionControlState,
    }));
    setScenarioProgress(loadVersionedState(storage, {
      key: SCENARIO_BANK_STORAGE_KEY,
      version: 1,
      fallback: createScenarioBankProgress(),
      normalize: createScenarioBankProgress,
    }));
  }, []);

  const missionControl = useMemo(
    () => buildInterviewMissionControl({
      profile,
      topics,
      weakSpots,
      scenarioProgress,
      missionState,
      systemDesignCanvas,
    }),
    [profile, topics, weakSpots, scenarioProgress, missionState, systemDesignCanvas],
  );

  const markDone = (missionId) => {
    setMissionState((previous) => {
      const next = recordMissionCompletion(previous, missionId, { today: missionControl.day });
      saveVersionedState(getBrowserStorage(), {
        key: INTERVIEW_MISSION_CONTROL_STORAGE_KEY,
        version: INTERVIEW_MISSION_CONTROL_STORAGE_VERSION,
        value: next,
        normalize: createMissionControlState,
      });
      return next;
    });
  };

  return (
    <section style={{ width: "100%", maxWidth: 920, display: "grid", gap: 12, marginTop: 22, textAlign: "left" }}>
      <header style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", minWidth: 0 }}>
        <div style={wrap}>
          <div style={{ alignItems: "center", color: theme.accentText || DEFAULT_THEME.accentText, display: "flex", fontSize: 12, fontWeight: 900, gap: 7 }}>
            <i className="ti ti-radar" />{missionControl.title}
          </div>
          <p style={{ ...wrap, color: "#9ca3af", fontSize: 11.5, lineHeight: 1.5, marginTop: 5 }}>
            {missionControl.subtitle}
          </p>
        </div>
        <div style={{ alignItems: "center", border: `1px solid ${accentBorder}`, borderRadius: 8, color: "#cbd5e1", display: "flex", fontSize: 11.2, fontWeight: 850, gap: 7, padding: "7px 9px" }}>
          <i className="ti ti-checkup-list" style={{ color: accent }} />
          {missionControl.summary.completedToday}/{missionControl.summary.total} today
        </div>
      </header>

      <DailyPrepPath
        missionControl={missionControl}
        accent={accent}
        accentBorder={accentBorder}
        onAction={onAction}
        onOpenWorkspace={onOpenWorkspace}
      />

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 245px), 1fr))", minWidth: 0 }}>
        {missionControl.missions.map((mission) => (
          <article
            key={mission.id}
            className="glass-card"
            style={{
              border: `1px solid ${mission.completed ? "rgba(167,243,208,.36)" : "rgba(255,255,255,.075)"}`,
              borderRadius: 8,
              display: "grid",
              gap: 10,
              minHeight: 212,
              minWidth: 0,
              padding: 12,
            }}
          >
            <div style={{ alignItems: "flex-start", display: "flex", gap: 9, justifyContent: "space-between", minWidth: 0 }}>
              <div style={wrap}>
                <span style={{ alignItems: "center", color: mission.completed ? "#a7f3d0" : accent, display: "flex", fontSize: 10.7, fontWeight: 950, gap: 6, textTransform: "uppercase" }}>
                  <i className={`ti ${mission.icon}`} />{mission.workspaceLabel}
                </span>
                <h3 style={{ ...wrap, color: "#f8fbff", fontSize: 13.5, lineHeight: 1.35, marginTop: 6 }}>{mission.title}</h3>
              </div>
              {mission.completed && (
                <span style={{ border: "1px solid rgba(167,243,208,.34)", borderRadius: 999, color: "#a7f3d0", flexShrink: 0, fontSize: 10, fontWeight: 900, padding: "3px 7px", whiteSpace: "nowrap" }}>
                  Done
                </span>
              )}
            </div>

            <p style={{ ...wrap, color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}>{mission.detail}</p>
            <p style={{ ...wrap, color: "#6b7280", fontSize: 10.8, lineHeight: 1.45, margin: 0 }}>{mission.evidence}</p>

            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7, marginTop: "auto" }}>
              <MissionButton icon="ti-player-play" tone={accent} onClick={() => onAction?.(mission.prompt)}>
                {mission.actionLabel}
              </MissionButton>
              <MissionButton icon="ti-external-link" tone="#c4b5fd" onClick={() => onOpenWorkspace?.(mission.workspaceId)}>
                Open
              </MissionButton>
              <MissionButton icon="ti-circle-check" tone="#a7f3d0" onClick={() => markDone(mission.id)} disabled={mission.completed}>
                Done
              </MissionButton>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
