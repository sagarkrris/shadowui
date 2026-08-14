import { useEffect, useMemo, useState } from "react";
import {
  DATABASE_ENGINES,
  RECENT_SCENARIO_BANK_LEVELS,
  RECENT_SCENARIO_BANK_ROUNDS,
  SCENARIO_BANK_DIFFICULTIES,
  SCENARIO_BANK_MODES,
  SCENARIO_BANK_STORAGE_KEY,
  SCENARIO_BANK_TRACKS,
  buildRecentScenarioAnswerPrompt,
  buildRecentScenarioMockPrompt,
  buildScenarioInterviewPlan,
  buildScenarioAnswerPrompt,
  buildLocalScenarioVariant,
  buildScenarioMockPrompt,
  createScenarioBankProgress,
  createScenarioBankState,
  estimateScenarioCoverage,
  listRecentScenarioCompanies,
  listRecentScenarioReports,
  listScenarioBankTopics,
  listScenarioSeeds,
  recordScenarioBankAttempt,
} from "../../lib/scenarioBank.mjs";
import { loadVersionedState, saveVersionedState } from "../../lib/localStateStore.mjs";
import BeginnerGuideBanner from "../BeginnerGuideBanner";

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
const ANSWER_STYLES = [
  { key: "concise", label: "Concise", icon: "ti-align-left", guidance: "Direct answer, trade-off, one example, no wandering." },
  { key: "star", label: "STAR", icon: "ti-stars", guidance: "Situation, task, action, result, then technical lesson." },
  { key: "senior", label: "Senior Engineer", icon: "ti-badge", guidance: "Diagnosis, options, chosen trade-off, failure modes, observability." },
  { key: "barRaiser", label: "Bar Raiser", icon: "ti-diamond", guidance: "High ownership, ambiguity handling, measurable impact, follow-up depth." },
];

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
      title={label}
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
        <i className={`ti ${icon}`} title={title} style={{ color: accent }} />
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

function scoreScenarioAnswer(answer, style, scenario) {
  const text = String(answer || "").toLowerCase();
  const trapTerms = String(scenario?.traps?.[0] || "trap")
    .split(/\s+/)
    .slice(0, 3)
    .map(escapeRegExp)
    .filter(Boolean)
    .join("|");
  const styleChecks = {
    concise: [
      ["Direct answer", /\b(i would|use|choose|because|trade[- ]?off)\b/i],
      ["Example", /\b(example|for instance|case)\b/i],
      ["Trap awareness", new RegExp(trapTerms || "trap", "i")],
    ],
    star: [
      ["Situation", /\bsituation|context|when\b/i],
      ["Task", /\btask|goal|needed\b/i],
      ["Action", /\baction|i did|implemented|changed\b/i],
      ["Result", /\bresult|impact|reduced|improved|saved|increased\b/i],
    ],
    senior: [
      ["Diagnosis", /\bdiagnose|root cause|bottleneck|latency|failure\b/i],
      ["Options", /\boption|alternative|trade[- ]?off|choose\b/i],
      ["Operations", /\bmetric|log|trace|alert|observability|rollback\b/i],
      ["Risk", /\brisk|failure|edge|fallback|degrad/i],
    ],
    barRaiser: [
      ["Ownership", /\bowned|ownership|led|drove|decided\b/i],
      ["Ambiguity", /\bambiguous|unclear|incomplete|trade[- ]?off\b/i],
      ["Impact", /\bimpact|customer|business|measur|percent|%|revenue\b/i],
      ["Follow-up depth", /\bfollow[- ]?up|next|learned|prevent\b/i],
    ],
  };
  const checks = styleChecks[style] || styleChecks.concise;
  const results = checks.map(([label, pattern]) => ({
    label,
    covered: pattern.test(text),
  }));
  const score = results.length ? Math.round((results.filter((item) => item.covered).length / results.length) * 100) : 0;

  return {
    score,
    checks: results,
    summary: score >= 75
      ? "This answer fits the selected style. Tighten with one sharper metric or trade-off."
      : score >= 45
        ? "Good base. Add the missing style markers before using it in a mock."
        : "Not interview-ready yet. Start with the style structure, then add technical evidence.",
  };
}

function AnswerStyleLab({ scenario, accent }) {
  const [style, setStyle] = useState("concise");
  const [answer, setAnswer] = useState("");
  const assessment = useMemo(() => scoreScenarioAnswer(answer, style, scenario), [answer, style, scenario]);
  const selectedStyle = ANSWER_STYLES.find((item) => item.key === style) || ANSWER_STYLES[0];

  return (
    <section style={{ ...wrap, background: "rgba(0,0,0,.16)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, display: "grid", gap: 9, padding: 10 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
        <h4 style={{ color: "#f8fbff", fontSize: 12, margin: 0 }}>Answer Style Lab</h4>
        <span style={{ color: assessment.score >= 75 ? "#a7f3d0" : accent, fontSize: 11, fontWeight: 900 }}>{assessment.score}%</span>
      </div>
      <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(116px, 1fr))" }}>
        {ANSWER_STYLES.map((item) => {
          const active = item.key === style;
          return (
            <button key={item.key} type="button" className={active ? "glass-button" : ""} onClick={() => setStyle(item.key)} style={{ alignItems: "center", background: active ? "rgba(139,211,255,.12)" : "rgba(255,255,255,.035)", border: `1px solid ${active ? accent : "rgba(255,255,255,.075)"}`, borderRadius: 7, color: active ? "#f8fbff" : "#9fb0c7", cursor: "pointer", display: "flex", fontSize: 10.5, fontWeight: 850, gap: 6, justifyContent: "center", padding: "7px 8px" }}>
              <i className={`ti ${item.icon}`} style={{ color: active ? accent : "#9fb0c7" }} />
              {item.label}
            </button>
          );
        })}
      </div>
      <p style={{ color: "#9fb0c7", fontSize: 11.2, lineHeight: 1.45, margin: 0 }}>{selectedStyle.guidance}</p>
      <textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        rows={4}
        placeholder={`Draft a ${selectedStyle.label.toLowerCase()} answer for this scenario...`}
        style={{ background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 7, color: "#f8fbff", fontSize: 12, lineHeight: 1.45, minHeight: 92, outline: "none", padding: 9, resize: "vertical" }}
      />
      <div style={{ color: "#dbeafe", fontSize: 11.4, lineHeight: 1.45 }}>{assessment.summary}</div>
      <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
        {assessment.checks.map((check) => (
          <span key={check.label} style={{ border: `1px solid ${check.covered ? "rgba(167,243,208,.26)" : "rgba(255,255,255,.08)"}`, borderRadius: 7, color: check.covered ? "#a7f3d0" : "#9fb0c7", fontSize: 10.6, fontWeight: 850, padding: "6px 8px" }}>
            <i className={`ti ${check.covered ? "ti-circle-check" : "ti-circle"}`} /> {check.label}
          </span>
        ))}
      </div>
    </section>
  );
}

function ScenarioCard({ scenario, scenarioProgress, state, accent, onAction, onRecord, onGenerateFresh, generated = false }) {
  const askVariant = () => {
    onGenerateFresh?.(scenario);
  };
  const explainAnswer = () => {
    onAction?.(buildScenarioAnswerPrompt(scenario, state), { type: "scenarioAnswer", state, scenario });
  };
  const practiceMock = () => {
    onAction?.(buildScenarioMockPrompt(scenario, state), { type: "scenarioMock", state, scenario });
  };
  const beginnerContext = {
    what: "This is a production-style interview scenario. It is testing whether you can diagnose a realistic situation, not recite a definition.",
    why: `It matters because interviewers use scenarios like this to see how you reason about ${scenario.title}, trade-offs, risks, and operational evidence.`,
    where: "You will use this thinking during debugging, design reviews, incident response, stakeholder explanations, and senior technical interviews.",
  };

  return (
    <article style={{ ...wrap, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, display: "grid", gap: 11, padding: 12 }}>
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between", minWidth: 0 }}>
        <div style={wrap}>
          <div style={{ color: generated ? "#a7f3d0" : accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
            {generated ? "Fresh Local Scenario" : `${scenario.difficulty} Scenario`}
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
      <section style={{ ...wrap, background: `${accent}10`, border: `1px solid ${accent}2f`, borderRadius: 8, display: "grid", gap: 6, padding: 10 }}>
        <div style={{ color: accent, fontSize: 10.8, fontWeight: 900, textTransform: "uppercase" }}>Beginner Context</div>
        <p style={{ color: "#dbeafe", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}><strong style={{ color: "#f8fbff" }}>What is this?</strong> {beginnerContext.what}</p>
        <p style={{ color: "#dbeafe", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}><strong style={{ color: "#f8fbff" }}>Why does it matter?</strong> {beginnerContext.why}</p>
        <p style={{ color: "#dbeafe", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}><strong style={{ color: "#f8fbff" }}>Where is it used?</strong> {beginnerContext.where}</p>
      </section>
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
        <h4 style={{ color: "#f8fbff", fontSize: 12, marginBottom: 6 }}>Interview-ready answer</h4>
        <p style={{ ...wrap, color: "#cbd5e1", fontSize: 11.6, lineHeight: 1.55 }}>{scenario.deepDive}</p>
      </section>

      <AnswerStyleLab scenario={scenario} accent={accent} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, minWidth: 0 }}>
        <button type="button" className="glass-button" onClick={askVariant} title="Generate Fresh Scenario" style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-sparkles" style={{ color: accent, marginRight: 6 }} />
          Generate Fresh Scenario
        </button>
        <button type="button" className="glass-button" onClick={explainAnswer} title="Explain Answer" style={{ border: "1px solid rgba(167,243,208,.36)", borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-notes" style={{ color: "#a7f3d0", marginRight: 6 }} />
          Explain Answer
        </button>
        <button type="button" className="glass-button" onClick={practiceMock} title="Practice as Mock" style={{ border: "1px solid rgba(196,181,253,.38)", borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-player-play" style={{ color: "#c4b5fd", marginRight: 6 }} />
          Practice as Mock
        </button>
        <button type="button" onClick={() => onRecord?.(scenario, "needsReview")} title="Mark Needs Review" style={{ background: "rgba(0,0,0,.12)", border: "1px solid rgba(250,204,21,.32)", borderRadius: 7, color: "#facc15", cursor: "pointer", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-refresh-alert" style={{ marginRight: 6 }} />
          Needs Review
        </button>
        <button type="button" onClick={() => onRecord?.(scenario, "mastered")} title="Mark Mastered" style={{ background: "rgba(0,0,0,.12)", border: "1px solid rgba(167,243,208,.34)", borderRadius: 7, color: "#a7f3d0", cursor: "pointer", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-circle-check" style={{ marginRight: 6 }} />
          Mastered
        </button>
      </div>
    </article>
  );
}

function RecentScenarioCard({ report, progressItem, accent, onAction, onRecord }) {
  const explainAnswer = () => {
    onAction?.(buildRecentScenarioAnswerPrompt(report), { type: "recentScenarioAnswer", report });
  };
  const practiceMock = () => {
    onAction?.(buildRecentScenarioMockPrompt(report), { type: "recentScenarioMock", report });
  };

  return (
    <article style={{ ...wrap, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, display: "grid", gap: 11, padding: 12 }}>
      <div style={{ alignItems: "flex-start", display: "flex", gap: 8, justifyContent: "space-between", minWidth: 0 }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
            {report.company} · {report.round} · {report.level}
          </div>
          <h3 style={{ ...wrap, color: "#f8fbff", fontSize: 15, lineHeight: 1.25, marginTop: 4 }}>{report.title}</h3>
        </div>
        {progressItem?.attempts ? (
          <span style={{ alignSelf: "start", border: `1px solid ${progressItem.mastered ? "rgba(167,243,208,.38)" : "rgba(250,204,21,.36)"}`, borderRadius: 999, color: progressItem.mastered ? "#a7f3d0" : "#facc15", flexShrink: 0, fontSize: 10.5, fontWeight: 900, padding: "3px 7px", whiteSpace: "nowrap" }}>
            {progressItem.mastered ? "Trap learned" : "Needs review"} · {progressItem.attempts}
          </span>
        ) : null}
      </div>

      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7 }}>
        <span style={{ border: `1px solid ${accent}44`, borderRadius: 999, color: accent, fontSize: 10.2, fontWeight: 900, padding: "3px 7px" }}>{report.freshnessLabel}</span>
        <span style={{ border: "1px solid rgba(167,243,208,.24)", borderRadius: 999, color: "#a7f3d0", fontSize: 10.2, fontWeight: 900, padding: "3px 7px" }}>{report.confidence}</span>
        <span style={{ border: "1px solid rgba(250,204,21,.26)", borderRadius: 999, color: "#facc15", fontSize: 10.2, fontWeight: 900, padding: "3px 7px" }}>{report.trapType}</span>
      </div>

      <p style={{ ...wrap, color: "#cbd5e1", fontSize: 12, lineHeight: 1.55 }}>{report.prompt}</p>

      <section style={{ ...wrap, background: "rgba(250,204,21,.08)", border: "1px solid rgba(250,204,21,.24)", borderRadius: 8, display: "grid", gap: 6, padding: 10 }}>
        <div style={{ color: "#facc15", fontSize: 10.8, fontWeight: 900, textTransform: "uppercase" }}>Why candidates get trapped</div>
        <p style={{ color: "#fef3c7", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}>{report.candidateTrap}</p>
      </section>

      <section style={{ ...wrap, background: "rgba(0,0,0,.16)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 10 }}>
        <h4 style={{ color: "#f8fbff", fontSize: 12, marginBottom: 6 }}>Interview-ready answer</h4>
        <p style={{ ...wrap, color: "#d1fae5", fontSize: 11.6, lineHeight: 1.55 }}>{report.polishedAnswer}</p>
      </section>

      <div style={responsiveGrid(220, 9)}>
        <DetailList title="Strong answer points" icon="ti-list-check" items={report.answerOutline} accent={accent} />
        <DetailList title="Likely follow-ups" icon="ti-messages" items={report.followUps} accent="#c4b5fd" />
        <DetailList title="Rubric" icon="ti-chart-radar" items={report.rubric} accent="#facc15" />
      </div>

      <section style={{ ...wrap, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 6, padding: 10 }}>
        <div style={{ color: "#9fb0c7", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Public-source pointers</div>
        <div style={{ display: "grid", gap: 6 }}>
          {report.sourceLinks.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer" style={{ color: "#dbeafe", fontSize: 11.3, lineHeight: 1.45, textDecoration: "none" }}>
              <strong style={{ color: accent }}>{link.label}</strong> - {link.note}
            </a>
          ))}
        </div>
      </section>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, minWidth: 0 }}>
        <button type="button" className="glass-button" onClick={explainAnswer} title="Explain Answer" style={{ border: "1px solid rgba(167,243,208,.36)", borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-notes" style={{ color: "#a7f3d0", marginRight: 6 }} />
          Explain Answer
        </button>
        <button type="button" className="glass-button" onClick={practiceMock} title="Practice as Mock" style={{ border: "1px solid rgba(196,181,253,.38)", borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-player-play" style={{ color: "#c4b5fd", marginRight: 6 }} />
          Practice as Mock
        </button>
        <button type="button" onClick={() => onRecord?.(report, "needsReview")} title="Mark Needs Review" style={{ background: "rgba(0,0,0,.12)", border: "1px solid rgba(250,204,21,.32)", borderRadius: 7, color: "#facc15", cursor: "pointer", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-refresh-alert" style={{ marginRight: 6 }} />
          Needs Review
        </button>
        <button type="button" onClick={() => onRecord?.(report, "mastered")} title="Mark Trap Learned" style={{ background: "rgba(0,0,0,.12)", border: "1px solid rgba(167,243,208,.34)", borderRadius: 7, color: "#a7f3d0", cursor: "pointer", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-circle-check" style={{ marginRight: 6 }} />
          Trap Learned
        </button>
      </div>
    </article>
  );
}

export default function ScenarioBank({ theme = {}, onAction, beginnerMode = false, beginnerStep = "watch", onBeginnerStepChange, onActivity }) {
  const [view, setView] = useState("core");
  const [state, setState] = useState(() => createScenarioBankState());
  const [progress, setProgress] = useState(() => createScenarioBankProgress());
  const [generatedScenario, setGeneratedScenario] = useState(null);
  const [variantIndex, setVariantIndex] = useState(0);
  const [storageReady, setStorageReady] = useState(false);
  const [recentCompany, setRecentCompany] = useState("All");
  const [recentRound, setRecentRound] = useState("All");
  const [recentLevel, setRecentLevel] = useState("All");
  const accent = theme.accentStrong || "#8bd3ff";
  const accentBorder = theme.accentBorder || "rgba(139, 211, 255, .26)";

  const topics = useMemo(() => listScenarioBankTopics(state.track, state.engine), [state.track, state.engine]);
  const scenarios = useMemo(() => listScenarioSeeds(state), [state]);
  const recentCompanies = useMemo(() => listRecentScenarioCompanies(), []);
  const recentReports = useMemo(() => listRecentScenarioReports({
    company: recentCompany,
    round: recentRound,
    level: recentLevel,
  }), [recentCompany, recentRound, recentLevel]);
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
    setGeneratedScenario(null);
  };
  const recordProgress = (scenario, outcome) => {
    setProgress((previous) => recordScenarioBankAttempt(previous, scenario, { outcome }));
    onActivity?.({
      workspaceId: "scenarioBank",
      type: outcome === "mastered" ? "practice" : "review",
      label: outcome === "mastered" ? "Marked scenario mastered" : "Marked scenario for review",
      detail: scenario?.title || scenario?.prompt || "Scenario progress updated.",
    });
  };
  const generateFreshScenario = (scenario) => {
    const nextScenario = buildLocalScenarioVariant(scenario, state, { variantIndex });
    setGeneratedScenario(nextScenario);
    setVariantIndex((previous) => previous + 1);
    onActivity?.({
      workspaceId: "scenarioBank",
      type: "generate",
      label: "Generated scenario variant",
      detail: nextScenario.title,
    });
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
      className="glass-card scenario-bank"
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
      <BeginnerGuideBanner
        enabled={beginnerMode}
        accent={accent}
        currentStep={beginnerStep}
        onStepSelect={onBeginnerStepChange}
        detail="For scenarios: read the prompt, predict the interviewer signal, explain with one structure, practice one answer, then review the missing rubric item."
      />

      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", minWidth: 0 }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Scenario Bank</div>
          <h2 style={{ ...wrap, color: "#f8fbff", fontSize: 19, lineHeight: 1.25, marginTop: 4 }}>Java, database, and recent public-report trap scenarios</h2>
          <p style={{ ...wrap, color: "#9fb0c7", fontSize: 11.5, lineHeight: 1.45, marginTop: 6 }}>
            {view === "core"
              ? `${coverageLabel}: curated seeds plus AI variants for ${coverage.total.toLocaleString()}+ scenario paths.`
              : "Recent Trap Bank: source-backed, manually refreshed scenarios that commonly trap candidates in modern interview loops."}
          </p>
          <p style={{ ...wrap, color: "#cbd5e1", fontSize: 11.2, lineHeight: 1.45, marginTop: 4 }}>
            {view === "core"
              ? `Database tracks: ${supportedDatabaseCopy}. Modes: Learn, Timed Drill, Mock Interview.`
              : "Recent items are based on public reports and prep guides, with freshness and confidence labels instead of claiming direct live scraping."}
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, minWidth: 0 }}>
          <ControlButton
            label="Core Drills"
            icon="ti-layout-grid"
            active={view === "core"}
            accent={accent}
            onClick={() => setView("core")}
          />
          <ControlButton
            label="Recent Trap Bank"
            icon="ti-radar-2"
            active={view === "recent"}
            accent={accent}
            onClick={() => setView("recent")}
          />
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
          <button type="button" className="glass-button" onClick={startDailyPlan} title="Daily Plan" style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 900, padding: "7px 10px" }}>
            <i className="ti ti-calendar-bolt" style={{ color: accent, marginRight: 6 }} />
            Daily Plan
          </button>
        </div>
      </header>

      <section style={responsiveGrid(150, 8)}>
        <ProgressMetric label="Attempted" value={progress.summary.attempted} accent={accent} />
        <ProgressMetric label="Mastered" value={progress.summary.mastered} accent="#a7f3d0" />
        <ProgressMetric label="Needs Review" value={progress.summary.needsReview} accent="#facc15" />
        <ProgressMetric label={view === "core" ? "Coverage" : "Recent items"} value={view === "core" ? `${coverage.total.toLocaleString()}+` : recentReports.length} accent="#c4b5fd" />
      </section>

      {view === "core" ? (
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
      ) : (
      <section style={{ border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 10, minWidth: 0, padding: 12 }}>
        <div style={responsiveGrid(160, 9)}>
          <SelectControl
            label="Company"
            value={recentCompany}
            options={recentCompanies}
            accentBorder={accentBorder}
            onChange={setRecentCompany}
          />
          <SelectControl
            label="Round"
            value={recentRound}
            options={RECENT_SCENARIO_BANK_ROUNDS}
            accentBorder={accentBorder}
            onChange={setRecentRound}
          />
          <SelectControl
            label="Level"
            value={recentLevel}
            options={RECENT_SCENARIO_BANK_LEVELS}
            accentBorder={accentBorder}
            onChange={setRecentLevel}
          />
        </div>
        <div style={{ ...wrap, alignItems: "center", color: "#cbd5e1", display: "flex", flexWrap: "wrap", fontSize: 11.5, gap: 8, lineHeight: 1.45 }}>
          <span style={{ color: accent, fontWeight: 900 }}>Recent Trap Bank</span>
          <span>Questions and scenario themes that frequently surface in public reports and trap candidates when answers stay shallow or generic.</span>
        </div>
      </section>
      )}

      {view === "core" && generatedScenario && (
        <section style={{ border: "1px solid rgba(167,243,208,.28)", borderRadius: 8, display: "grid", gap: 10, minWidth: 0, padding: 12, background: "rgba(16,185,129,.055)" }}>
          <div style={{ ...wrap, color: "#a7f3d0", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>
            Generated Variant
          </div>
          <ScenarioCard
            scenario={generatedScenario}
            scenarioProgress={progress.scenarios[generatedScenario.id]}
            state={state}
            accent={accent}
            onAction={onAction}
            onRecord={recordProgress}
            onGenerateFresh={generateFreshScenario}
            generated
          />
        </section>
      )}

      {view === "core" ? (
      <>
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
              onGenerateFresh={generateFreshScenario}
            />
          ))}
        </div>

        {!scenarios.length && (
        <section style={{ ...wrap, border: `1px solid ${accentBorder}`, borderRadius: 8, padding: 12 }}>
          <h3 style={{ color: "#f8fbff", fontSize: 14 }}>Generate Fresh Scenario</h3>
          <p style={{ color: "#9fb0c7", fontSize: 12, lineHeight: 1.5, marginTop: 6 }}>No local seed matches this filter yet. Generate a real-time scenario for this topic instead.</p>
          <button type="button" className="glass-button" onClick={() => generateFreshScenario(null)} title="Generate Fresh Scenario" style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, marginTop: 10, padding: "7px 10px" }}>
            <i className="ti ti-sparkles" style={{ color: accent, marginRight: 6 }} />
            Generate Fresh Scenario
          </button>
        </section>
        )}
      </>
      ) : (
      <>
        <div style={responsiveGrid(300, 10)}>
          {recentReports.map((report) => (
            <RecentScenarioCard
              key={report.id}
              report={report}
              progressItem={progress.scenarios[report.id]}
              accent={accent}
              onAction={onAction}
              onRecord={recordProgress}
            />
          ))}
        </div>
        {!recentReports.length && (
          <section style={{ ...wrap, border: `1px solid ${accentBorder}`, borderRadius: 8, padding: 12 }}>
            <h3 style={{ color: "#f8fbff", fontSize: 14 }}>No recent reports match this filter</h3>
            <p style={{ color: "#9fb0c7", fontSize: 12, lineHeight: 1.5, marginTop: 6 }}>Try broadening the company, round, or level filters. The recent bank is intentionally curated instead of inflated with low-signal items.</p>
          </section>
        )}
      </>
      )}
    </section>
  );
}
