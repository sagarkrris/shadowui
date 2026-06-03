import { useEffect, useMemo, useState } from "react";
import {
  DATABASE_ENGINES,
  SCENARIO_BANK_DIFFICULTIES,
  SCENARIO_BANK_MODES,
  SCENARIO_BANK_STORAGE_KEY,
  SCENARIO_BANK_TRACKS,
  buildScenarioInterviewPlan,
  buildScenarioAnswerPrompt,
  buildScenarioMockPrompt,
  buildScenarioVariantPrompt,
  createScenarioBankProgress,
  createScenarioBankState,
  estimateScenarioCoverage,
  listScenarioBankTopics,
  listScenarioSeeds,
  recordScenarioBankAttempt,
} from "../../lib/scenarioBank.mjs";
import { loadVersionedState, saveVersionedState } from "../../lib/localStateStore.mjs";

const wrap = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const responsiveGrid = (minColumnWidth, gap = 10) => ({
  display: "grid",
  gap,
  gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minColumnWidth}px), 1fr))`,
  minWidth: 0,
});

const supportedDatabaseCopy = "PostgreSQL, MySQL, MongoDB, Redis";

function getBrowserStorage() {
  return typeof window !== "undefined" ? window.localStorage : null;
}

function ControlButton({ label, icon, active, onClick, accent }) {
  return (
    <button
      type="button"
      className={active ? "glass-button" : ""}
      onClick={onClick}
      aria-label={label}
      style={{
        alignItems: "center",
        background: active ? "rgba(139,211,255,.12)" : "rgba(0,0,0,.14)",
        border: `1px solid ${active ? accent : "rgba(255,255,255,.08)"}`,
        borderRadius: 7,
        color: active ? "#f8fbff" : "#9fb0c7",
        cursor: "pointer",
        display: "inline-flex",
        fontSize: 11,
        fontWeight: 800,
        gap: 6,
        maxWidth: "100%",
        minHeight: 31,
        padding: "7px 10px",
      }}
    >
      <i className={`ti ${icon}`} style={{ color: active ? accent : "#9fb0c7", fontSize: 14 }} />
      {label}
    </button>
  );
}

function SelectControl({ label, value, options, onChange, accentBorder }) {
  return (
    <label style={{ ...wrap, display: "grid", gap: 5 }}>
      <span style={{ color: "#9fb0c7", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase" }}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="glass-input"
        style={{
          border: `1px solid ${accentBorder}`,
          borderRadius: 7,
          color: "#f8fbff",
          fontSize: 12,
          minWidth: 0,
          outline: "none",
          padding: "8px 9px",
          width: "100%",
        }}
      >
        {options.map((option) => (
          <option key={option.key || option} value={option.key || option}>
            {option.label || option}
          </option>
        ))}
      </select>
    </label>
  );
}

function DetailList({ title, icon, items, accent, color = "#9fb0c7" }) {
  return (
    <section style={{ ...wrap, border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, background: "rgba(255,255,255,.035)", padding: 10 }}>
      <h4 style={{ ...wrap, alignItems: "center", color: "#f8fbff", display: "flex", fontSize: 12, gap: 6, marginBottom: 7 }}>
        <i className={`ti ${icon}`} style={{ color: accent }} />
        {title}
      </h4>
      <ul style={{ ...wrap, color, display: "grid", fontSize: 11.4, gap: 6, lineHeight: 1.45, margin: 0, paddingLeft: 17 }}>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

function ProgressMetric({ label, value, accent }) {
  return (
    <div style={{ ...wrap, background: "rgba(0,0,0,.16)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 3, padding: "8px 9px" }}>
      <span style={{ color: "#9fb0c7", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color: accent, fontSize: 15 }}>{value}</strong>
    </div>
  );
}

function ScenarioCard({ scenario, scenarioProgress, state, accent, onAction, onRecord }) {
  const askVariant = () => {
    onAction?.(buildScenarioVariantPrompt(state), { type: "scenarioVariant", state, scenario });
  };
  const explainAnswer = () => {
    onAction?.(buildScenarioAnswerPrompt(scenario, state), { type: "scenarioAnswer", state, scenario });
  };
  const practiceMock = () => {
    onAction?.(buildScenarioMockPrompt(scenario, state), { type: "scenarioMock", state, scenario });
  };

  return (
    <article style={{ ...wrap, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, display: "grid", gap: 11, padding: 12 }}>
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between", minWidth: 0 }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
            {scenario.difficulty} Scenario
          </div>
          <h3 style={{ ...wrap, color: "#f8fbff", fontSize: 15, lineHeight: 1.25, marginTop: 4 }}>{scenario.title}</h3>
        </div>
        {scenarioProgress?.attempts ? (
          <span style={{ alignSelf: "start", border: `1px solid ${scenarioProgress.mastered ? "rgba(167,243,208,.38)" : "rgba(250,204,21,.36)"}`, borderRadius: 999, color: scenarioProgress.mastered ? "#a7f3d0" : "#facc15", flexShrink: 0, fontSize: 10.5, fontWeight: 900, padding: "3px 7px", whiteSpace: "nowrap" }}>
            {scenarioProgress.mastered ? "Mastered" : "Needs Review"} · {scenarioProgress.attempts}
          </span>
        ) : null}
      </div>

      <p style={{ ...wrap, color: "#cbd5e1", fontSize: 12, lineHeight: 1.55 }}>{scenario.prompt}</p>
      <p style={{ ...wrap, color: "#a7f3d0", fontSize: 11.4, lineHeight: 1.45 }}>
        <strong>Interviewer Signal:</strong> {scenario.interviewerIntent}
      </p>

      <div style={responsiveGrid(230, 9)}>
        <DetailList title="Ideal Answer Outline" icon="ti-list-check" items={scenario.answerOutline} accent={accent} />
        <DetailList title="Common Traps" icon="ti-alert-triangle" items={scenario.traps} accent="#fca5a5" color="#fca5a5" />
        <DetailList title="Follow-ups" icon="ti-messages" items={scenario.followUps} accent="#c4b5fd" />
        <DetailList title="Scoring Rubric" icon="ti-chart-radar" items={scenario.rubric} accent="#facc15" />
      </div>

      <section style={{ ...wrap, background: "rgba(0,0,0,.16)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 10 }}>
        <h4 style={{ color: "#f8fbff", fontSize: 12, marginBottom: 6 }}>Deep-Dive Answer</h4>
        <p style={{ ...wrap, color: "#cbd5e1", fontSize: 11.6, lineHeight: 1.55 }}>{scenario.deepDive}</p>
      </section>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, minWidth: 0 }}>
        <button type="button" className="glass-button" onClick={askVariant} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-sparkles" style={{ color: accent, marginRight: 6 }} />
          Generate Fresh Scenario
        </button>
        <button type="button" className="glass-button" onClick={explainAnswer} style={{ border: "1px solid rgba(167,243,208,.36)", borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-notes" style={{ color: "#a7f3d0", marginRight: 6 }} />
          Explain Answer
        </button>
        <button type="button" className="glass-button" onClick={practiceMock} style={{ border: "1px solid rgba(196,181,253,.38)", borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-player-play" style={{ color: "#c4b5fd", marginRight: 6 }} />
          Practice as Mock
        </button>
        <button type="button" onClick={() => onRecord?.(scenario, "needsReview")} style={{ background: "rgba(0,0,0,.12)", border: "1px solid rgba(250,204,21,.32)", borderRadius: 7, color: "#facc15", cursor: "pointer", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-refresh-alert" style={{ marginRight: 6 }} />
          Needs Review
        </button>
        <button type="button" onClick={() => onRecord?.(scenario, "mastered")} style={{ background: "rgba(0,0,0,.12)", border: "1px solid rgba(167,243,208,.34)", borderRadius: 7, color: "#a7f3d0", cursor: "pointer", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-circle-check" style={{ marginRight: 6 }} />
          Mastered
        </button>
      </div>
    </article>
  );
}

export default function ScenarioBank({ theme = {}, onAction }) {
  const [state, setState] = useState(() => createScenarioBankState());
  const [progress, setProgress] = useState(() => createScenarioBankProgress());
  const [storageReady, setStorageReady] = useState(false);
  const accent = theme.accentStrong || "#8bd3ff";
  const accentBorder = theme.accentBorder || "rgba(139, 211, 255, .26)";

  const topics = useMemo(() => listScenarioBankTopics(state.track, state.engine), [state.track, state.engine]);
  const scenarios = useMemo(() => listScenarioSeeds(state), [state]);
  const selectedTrack = SCENARIO_BANK_TRACKS.find((track) => track.key === state.track) || SCENARIO_BANK_TRACKS[0];
  const coverage = useMemo(() => estimateScenarioCoverage(state), [state]);
  const interviewPlan = useMemo(() => buildScenarioInterviewPlan({ progress, state, count: 5 }), [progress, state]);

  useEffect(() => {
    const saved = loadVersionedState(getBrowserStorage(), {
      key: SCENARIO_BANK_STORAGE_KEY,
      version: 1,
      fallback: createScenarioBankProgress(),
      normalize: createScenarioBankProgress,
    });

    setState(saved.state);
    setProgress(saved);
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;

    saveVersionedState(getBrowserStorage(), {
      key: SCENARIO_BANK_STORAGE_KEY,
      version: 1,
      value: { ...progress, state },
      normalize: createScenarioBankProgress,
    });
  }, [progress, state, storageReady]);

  const updateState = (patch) => {
    setState((previous) => createScenarioBankState({ ...previous, ...patch }));
  };
  const recordProgress = (scenario, outcome) => {
    setProgress((previous) => recordScenarioBankAttempt(previous, scenario, { outcome }));
  };
  const startDailyPlan = () => {
    onAction?.(interviewPlan.prompt, { type: "scenarioPlan", state, plan: interviewPlan });
  };

  const activeEngine = DATABASE_ENGINES.find((engine) => engine.key === state.engine) || DATABASE_ENGINES[0];
  const coverageLabel = state.track === "database"
    ? `${activeEngine.label} scenario coverage`
    : "Java scenario coverage";

  return (
    <section
      className="glass-card"
      style={{
        background: "linear-gradient(180deg, rgba(14,18,30,.82), rgba(7,10,18,.74))",
        border: "1px solid rgba(255,255,255,.1)",
        borderRadius: 8,
        color: "#eef4ff",
        display: "grid",
        flexShrink: 0,
        gap: 12,
        minWidth: 0,
        padding: 14,
        width: "100%",
      }}
    >
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", minWidth: 0 }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Scenario Bank</div>
          <h2 style={{ ...wrap, color: "#f8fbff", fontSize: 19, lineHeight: 1.25, marginTop: 4 }}>Java and database real-time interview scenarios</h2>
          <p style={{ ...wrap, color: "#9fb0c7", fontSize: 11.5, lineHeight: 1.45, marginTop: 6 }}>
            {coverageLabel}: curated seeds plus AI variants for {coverage.total.toLocaleString()}+ scenario paths.
          </p>
          <p style={{ ...wrap, color: "#cbd5e1", fontSize: 11.2, lineHeight: 1.45, marginTop: 4 }}>
            Database tracks: {supportedDatabaseCopy}. Modes: Learn, Timed Drill, Mock Interview.
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, minWidth: 0 }}>
          {SCENARIO_BANK_TRACKS.map((track) => (
            <ControlButton
              key={track.key}
              label={track.label}
              icon={track.icon}
              active={state.track === track.key}
              accent={accent}
              onClick={() => updateState({ track: track.key })}
            />
          ))}
          <button type="button" className="glass-button" onClick={startDailyPlan} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 900, padding: "7px 10px" }}>
            <i className="ti ti-calendar-bolt" style={{ color: accent, marginRight: 6 }} />
            Daily Plan
          </button>
        </div>
      </header>

      <section style={responsiveGrid(150, 8)}>
        <ProgressMetric label="Attempted" value={progress.summary.attempted} accent={accent} />
        <ProgressMetric label="Mastered" value={progress.summary.mastered} accent="#a7f3d0" />
        <ProgressMetric label="Needs Review" value={progress.summary.needsReview} accent="#facc15" />
        <ProgressMetric label="Coverage" value={`${coverage.total.toLocaleString()}+`} accent="#c4b5fd" />
      </section>

      <section style={{ border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 10, minWidth: 0, padding: 12 }}>
        <div style={responsiveGrid(160, 9)}>
          {state.track === "database" && (
            <SelectControl
              label="Database"
              value={state.engine}
              options={DATABASE_ENGINES}
              accentBorder={accentBorder}
              onChange={(engine) => updateState({ engine })}
            />
          )}
          <SelectControl
            label="Topic"
            value={state.topic}
            options={topics}
            accentBorder={accentBorder}
            onChange={(topic) => updateState({ topic })}
          />
          <SelectControl
            label="Difficulty"
            value={state.difficulty}
            options={SCENARIO_BANK_DIFFICULTIES}
            accentBorder={accentBorder}
            onChange={(difficulty) => updateState({ difficulty })}
          />
          <SelectControl
            label="Mode"
            value={state.mode}
            options={SCENARIO_BANK_MODES}
            accentBorder={accentBorder}
            onChange={(mode) => updateState({ mode })}
          />
        </div>
        <div style={{ ...wrap, alignItems: "center", color: "#cbd5e1", display: "flex", flexWrap: "wrap", fontSize: 11.5, gap: 8, lineHeight: 1.45 }}>
          <span style={{ color: accent, fontWeight: 900 }}>{selectedTrack.label}</span>
          <span>{selectedTrack.description}</span>
          {state.mode === "Timed Drill" && <span style={{ color: "#facc15", fontWeight: 800 }}>Timed Drill mode</span>}
        </div>
      </section>

      <div style={responsiveGrid(300, 10)}>
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            scenarioProgress={progress.scenarios[scenario.id]}
            state={state}
            accent={accent}
            onAction={onAction}
            onRecord={recordProgress}
          />
        ))}
      </div>

      {!scenarios.length && (
        <section style={{ ...wrap, border: `1px solid ${accentBorder}`, borderRadius: 8, padding: 12 }}>
          <h3 style={{ color: "#f8fbff", fontSize: 14 }}>Generate Fresh Scenario</h3>
          <p style={{ color: "#9fb0c7", fontSize: 12, lineHeight: 1.5, marginTop: 6 }}>No local seed matches this filter yet. Generate a real-time scenario for this topic instead.</p>
          <button type="button" className="glass-button" onClick={() => onAction?.(buildScenarioVariantPrompt(state), { type: "scenarioVariant", state })} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, marginTop: 10, padding: "7px 10px" }}>
            <i className="ti ti-sparkles" style={{ color: accent, marginRight: 6 }} />
            Generate Fresh Scenario
          </button>
        </section>
      )}
    </section>
  );
}
