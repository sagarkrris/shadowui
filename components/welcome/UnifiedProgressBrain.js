import { useMemo } from "react";
import { buildUnifiedPrepProgress, nextBeginnerStep } from "../../lib/prepProgressBrain.mjs";

const wrap = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

function ProgressButton({ children, icon, onClick, tone, disabled = false, isLight = false }) {
  return (
    <button
      type="button"
      className="glass-button"
      onClick={onClick}
      disabled={disabled}
      style={{
        alignItems: "center",
        border: `1px solid ${tone}55`,
        borderRadius: 7,
        color: isLight ? "#17324d" : "#f8fbff",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        fontSize: 10.6,
        fontWeight: 850,
        gap: 6,
        maxWidth: "100%",
        minHeight: 29,
        opacity: disabled ? 0.55 : 1,
        padding: "6px 8px",
        textAlign: "left",
        overflowWrap: "anywhere",
      }}
    >
      <i className={`ti ${icon}`} style={{ color: tone, fontSize: 13 }} />
      {children}
    </button>
  );
}

function LaneCard({ lane, accent, onOpenWorkspace, isLight = false }) {
  const tone = lane.status === "Strong" ? "#a7f3d0" : lane.status === "Improving" ? "#facc15" : accent;

  return (
    <article style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 8, minHeight: 142, padding: 10 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", minWidth: 0 }}>
        <strong style={{ ...wrap, alignItems: "center", color: isLight ? "#17324d" : "#f8fbff", display: "flex", fontSize: 12, gap: 6 }}>
          <i className={`ti ${lane.icon}`} style={{ color: tone }} />
          {lane.label}
        </strong>
        <span style={{ border: `1px solid ${tone}44`, borderRadius: 999, color: tone, flexShrink: 0, fontSize: 10, fontWeight: 900, padding: "3px 7px" }}>
          {lane.score}%
        </span>
      </div>
      <div style={{ background: "rgba(255,255,255,.055)", borderRadius: 999, height: 6, overflow: "hidden" }}>
        <span style={{ background: tone, display: "block", height: "100%", width: `${lane.score}%` }} />
      </div>
      <span style={{ color: tone, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{lane.status}</span>
      <p style={{ ...wrap, color: isLight ? "#526579" : "#cbd5e1", fontSize: 11, lineHeight: 1.45, margin: 0 }}>{lane.detail}</p>
      <ProgressButton icon="ti-external-link" tone={accent} isLight={isLight} onClick={() => onOpenWorkspace?.(lane.workspaceId)}>
        {lane.actionLabel}
      </ProgressButton>
    </article>
  );
}

function BeginnerPath({ steps, accent, onAction, onOpenWorkspace, onStepChange }) {
  return (
    <section style={{ border: `1px solid ${accent}33`, borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ color: accent, fontSize: 10.8, fontWeight: 950, textTransform: "uppercase" }}>
          Beginner Guided Mode
        </div>
        <ProgressButton icon="ti-arrow-right" tone={accent} onClick={() => onStepChange?.(nextBeginnerStep(steps.find((step) => step.active)?.id))}>
          Next step
        </ProgressButton>
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))" }}>
        {steps.map((step, index) => (
          <article key={step.id} style={{ background: step.active ? "rgba(139,211,255,.09)" : "rgba(255,255,255,.035)", border: `1px solid ${step.active ? `${accent}55` : step.completed ? "rgba(167,243,208,.22)" : "rgba(255,255,255,.075)"}`, borderRadius: 8, display: "grid", gap: 7, minHeight: 124, padding: 9 }}>
            <span style={{ color: accent, fontSize: 10.2, fontWeight: 950, textTransform: "uppercase" }}>
              <i className={`ti ${step.completed ? "ti-circle-check" : step.icon}`} /> {index + 1}. {step.label}
            </span>
            <p style={{ ...wrap, color: "#dbeafe", fontSize: 11, lineHeight: 1.4, margin: 0 }}>{step.detail}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "auto" }}>
              <button
                type="button"
                className="glass-button"
                onClick={() => step.prompt ? onAction?.(step.prompt) : onOpenWorkspace?.(step.workspaceId)}
                style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", cursor: "pointer", fontSize: 10.5, fontWeight: 850, padding: "6px 8px", textAlign: "left" }}
              >
                {step.actionLabel}
              </button>
              <button
                type="button"
                onClick={() => onStepChange?.(step.id)}
                style={{ background: step.active ? "rgba(167,243,208,.1)" : "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 7, color: step.active ? "#a7f3d0" : "#cbd5e1", cursor: "pointer", fontSize: 10.5, fontWeight: 850, padding: "6px 8px" }}
              >
                {step.active ? "Current" : "Set current"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReplayTimeline({ replay, accent }) {
  if (!replay.length) {
    return (
      <section style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, padding: 10 }}>
        <div style={{ color: accent, fontSize: 10.8, fontWeight: 950, textTransform: "uppercase" }}>Practice Replay Timeline</div>
        <p style={{ ...wrap, color: "#9ca3af", fontSize: 11.2, lineHeight: 1.45, margin: "6px 0 0" }}>
          Start one mock or practice card and the replay timeline will show score, status, and the next review cue.
        </p>
      </section>
    );
  }

  return (
    <section style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
      <div style={{ color: accent, fontSize: 10.8, fontWeight: 950, textTransform: "uppercase" }}>Practice Replay Timeline</div>
      {replay.map((item) => (
        <div key={item.id} style={{ borderLeft: `2px solid ${accent}`, display: "grid", gap: 3, paddingLeft: 9 }}>
          <span style={{ color: "#f8fbff", fontSize: 11.5, fontWeight: 850 }}>{item.type}: {item.status}</span>
          <span style={{ ...wrap, color: "#cbd5e1", fontSize: 10.8, lineHeight: 1.4 }}>{item.title}</span>
          <span style={{ color: "#93a4bf", fontSize: 10.5 }}>{item.detail}</span>
        </div>
      ))}
    </section>
  );
}

export default function UnifiedProgressBrain({
  profile,
  weakSpots,
  mockScores,
  questionMemory,
  systemDesignCanvas,
  messages,
  prepProgressState,
  theme = {},
  beginnerMode,
  onBeginnerModeChange,
  onBeginnerStepChange,
  onAction,
  onOpenWorkspace,
  onExportPlan,
}) {
  const accent = theme.accentStrong || "#38bdf8";
  const accentBorder = theme.accentBorder || "rgba(56,189,248,.28)";
  const isLight = theme.appearance === "light";
  const progress = useMemo(() => buildUnifiedPrepProgress({
    profile,
    weakSpots,
    mockScores,
    questionMemory,
    systemDesignCanvas,
    messages,
    beginnerMode,
    prepProgressState,
  }), [profile, weakSpots, mockScores, questionMemory, systemDesignCanvas, messages, beginnerMode, prepProgressState]);

  return (
    <section aria-label="Unified Progress Brain" className="glass-card" style={{ border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 12, marginTop: 22, padding: 12, textAlign: "left", width: "100%", maxWidth: 920 }}>
      <header style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={wrap}>
          <div style={{ alignItems: "center", color: theme.accentText || "#bae6fd", display: "flex", fontSize: 12, fontWeight: 950, gap: 7 }}>
            <i className="ti ti-brain" />{progress.title}
          </div>
          <p style={{ ...wrap, color: "#9ca3af", fontSize: 11.5, lineHeight: 1.5, marginTop: 5 }}>{progress.subtitle}</p>
        </div>
        <label style={{ alignItems: "center", border: `1px solid ${accentBorder}`, borderRadius: 999, color: beginnerMode ? "#a7f3d0" : "#cbd5e1", cursor: "pointer", display: "inline-flex", fontSize: 11, fontWeight: 900, gap: 7, padding: "6px 9px" }}>
          <input
            type="checkbox"
            checked={Boolean(beginnerMode)}
            onChange={(event) => onBeginnerModeChange?.(event.target.checked)}
            style={{ accentColor: accent }}
          />
          Beginner Path
        </label>
      </header>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))" }}>
        <section style={{ alignSelf: "start", background: isLight ? "#f8fbff" : "rgba(0,0,0,.16)", border: isLight ? "1px solid #dbe5ef" : "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 8, padding: 11 }}>
          <span style={{ color: "#9ca3af", fontSize: 10.8, fontWeight: 950, textTransform: "uppercase" }}>Readiness</span>
          <strong style={{ color: accent, fontSize: 34, lineHeight: 1 }}>{progress.readinessScore}%</strong>
          <p style={{ ...wrap, color: "#cbd5e1", fontSize: 11.2, lineHeight: 1.45, margin: 0 }}>
            Focus: {progress.summary.weakSpot}. Due reviews: {progress.summary.dueForReview}. Mock avg: {progress.summary.mockAverage || "new"}.
          </p>
        </section>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))" }}>
          {progress.lanes.map((lane) => (
            <LaneCard key={lane.id} lane={lane} accent={accent} isLight={isLight} onOpenWorkspace={onOpenWorkspace} />
          ))}
        </div>
      </div>

      {beginnerMode && (
        <BeginnerPath
          steps={progress.beginnerPath}
          accent={accent}
          onAction={onAction}
          onOpenWorkspace={onOpenWorkspace}
          onStepChange={onBeginnerStepChange}
        />
      )}

      <ReplayTimeline replay={progress.replay} accent={accent} />

      <section style={{ alignItems: "center", border: `1px solid ${accentBorder}`, borderRadius: 8, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between", padding: 10 }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 10.8, fontWeight: 950, textTransform: "uppercase" }}>Export Daily Prep Plan</div>
          <p style={{ color: "#9ca3af", fontSize: 11.2, lineHeight: 1.4, margin: "4px 0 0" }}>Copy or download today&apos;s generated plan from your real workspace activity.</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          <ProgressButton icon="ti-copy" tone={accent} onClick={() => onExportPlan?.(progress.dailyPlanMarkdown, "copy")}>Copy Plan</ProgressButton>
          <ProgressButton icon="ti-download" tone="#a7f3d0" onClick={() => onExportPlan?.(progress.dailyPlanMarkdown, "download")}>Download</ProgressButton>
        </div>
      </section>
    </section>
  );
}
