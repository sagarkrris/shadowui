import { useEffect, useMemo, useState } from "react";
import {
  buildDsaMockPrompt,
  buildDsaVisualizationState,
  DSA_VISUAL_LAB_STORAGE_KEY,
  getDsaCodeTemplate,
  getDsaVisualLesson,
  listDsaVisualLessons,
} from "../../lib/dsaVisualLab.mjs";
import {
  listBlind75Problems,
  listBlind75Visualizers,
} from "../../lib/blind75VisualTrack.mjs";

const GUIDED_STAGES = ["Learn", "Visualize", "Dry run", "Code", "Quiz", "Practice as Mock"];
const TRACKS = [
  { id: "core", label: "Interview Core" },
  { id: "blind75", label: "Blind 75 Visual Track" },
];
const BLIND75_FILTERS = [
  { id: "featured", label: "Featured 15" },
  { id: "all", label: "All 75" },
];
const SPEEDS = [
  { label: "Slow", value: 1800 },
  { label: "Normal", value: 1200 },
  { label: "Fast", value: 700 },
];

function getStorage() {
  return typeof window !== "undefined" ? window.localStorage : null;
}

function readSavedLessonId() {
  try {
    return getStorage()?.getItem(DSA_VISUAL_LAB_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

function formatInputValue(value) {
  return Array.isArray(value) ? value.join(", ") : String(value || "");
}

function ActionButton({ icon, label, onClick, disabled, tone = "#8bd3ff" }) {
  return (
    <button
      type="button"
      className="glass-button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      style={{
        alignItems: "center",
        border: `1px solid ${tone}55`,
        borderRadius: 7,
        color: disabled ? "#64748b" : "#f8fbff",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        fontSize: 11,
        fontWeight: 800,
        gap: 6,
        minHeight: 32,
        opacity: disabled ? 0.58 : 1,
        padding: "8px 10px",
        whiteSpace: "nowrap",
      }}
    >
      <i className={`ti ${icon}`} style={{ color: disabled ? "#64748b" : tone, fontSize: 14 }} />
      {label}
    </button>
  );
}

function activeIndexes(highlight = {}) {
  const scalarKeys = [
    "index",
    "left",
    "right",
    "to",
    "low",
    "mid",
    "high",
    "windowStart",
    "windowEnd",
    "slow",
    "fast",
    "current",
    "prev",
    "next",
    "nodeIndex",
  ];
  const indexes = scalarKeys.map((key) => highlight[key])
    .filter((item) => Number.isInteger(item));

  if (Array.isArray(highlight.from)) indexes.push(...highlight.from.filter((item) => Number.isInteger(item)));
  if (Array.isArray(highlight.visitedIndexes)) indexes.push(...highlight.visitedIndexes.filter((item) => Number.isInteger(item)));
  if (Array.isArray(highlight.frontierIndexes)) indexes.push(...highlight.frontierIndexes.filter((item) => Number.isInteger(item)));
  return new Set(indexes);
}

function pointerBadges(index, highlight = {}, accent) {
  const badges = [];
  if (highlight.index === index) badges.push(["i", accent]);
  if (highlight.left === index) badges.push(["L", "#a7f3d0"]);
  if (highlight.right === index) badges.push(["R", "#facc15"]);
  if (highlight.low === index) badges.push(["low", "#93c5fd"]);
  if (highlight.mid === index) badges.push(["mid", "#facc15"]);
  if (highlight.high === index) badges.push(["high", "#fda4af"]);
  if (highlight.windowStart === index) badges.push(["win L", "#a7f3d0"]);
  if (highlight.windowEnd === index) badges.push(["win R", "#facc15"]);
  if (highlight.prev === index) badges.push(["prev", "#93c5fd"]);
  if (highlight.current === index) badges.push(["cur", accent]);
  if (highlight.next === index) badges.push(["next", "#c084fc"]);
  if (highlight.nodeIndex === index) badges.push(["node", accent]);
  if (highlight.to === index) badges.push(["to", "#c084fc"]);
  if (Array.isArray(highlight.from) && highlight.from.includes(index)) badges.push(["from", "#93c5fd"]);
  if (Array.isArray(highlight.visitedIndexes) && highlight.visitedIndexes.includes(index)) badges.push(["seen", "#a7f3d0"]);
  if (Array.isArray(highlight.frontierIndexes) && highlight.frontierIndexes.includes(index)) badges.push(["front", "#facc15"]);
  return badges;
}

function VisualInput({ input, highlight, accent, isPlaying }) {
  const active = activeIndexes(highlight);

  if (Array.isArray(input)) {
    return (
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(58px, 1fr))", alignItems: "end" }}>
        {input.map((value, index) => {
          const isActive = active.has(index);
          const height = typeof value === "number" ? Math.max(50, Math.min(106, 44 + Number(value) * 7)) : 62;

          return (
            <div key={`${value}-${index}`} style={{ display: "grid", gap: 5, alignItems: "end" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 3, minHeight: 18 }}>
                {pointerBadges(index, highlight, accent).map(([label, color]) => (
                  <span key={label} style={{ background: `${color}22`, border: `1px solid ${color}88`, borderRadius: 999, color, fontSize: 9.5, fontWeight: 900, padding: "2px 5px" }}>
                    {label}
                  </span>
                ))}
              </div>
              <div
                style={{
                  background: isActive ? `linear-gradient(180deg, ${accent}44, rgba(255,255,255,.055))` : "rgba(255,255,255,.045)",
                  border: `1px solid ${isActive ? accent : "rgba(255,255,255,.08)"}`,
                  borderRadius: 8,
                  color: "#f8fbff",
                  display: "grid",
                  gap: 4,
                  minHeight: height,
                  padding: 8,
                  placeItems: "center",
                  transform: isActive ? "translateY(-4px) scale(1.03)" : "translateY(0) scale(1)",
                  transition: "transform .28s ease, border-color .28s ease, background .28s ease, min-height .28s ease",
                  boxShadow: isActive && isPlaying ? `0 0 0 4px ${accent}16` : "none",
                }}
              >
                <strong style={{ fontSize: 15 }}>{value}</strong>
                <span style={{ color: isActive ? accent : "#7d8aa2", fontSize: 10, fontWeight: 800 }}>i={index}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {String(input).split("").map((char, index) => {
        const isActive = active.has(index);

        return (
          <span
            key={`${char}-${index}`}
            style={{
              background: isActive ? `${accent}22` : "rgba(255,255,255,.045)",
              border: `1px solid ${isActive ? accent : "rgba(255,255,255,.08)"}`,
              borderRadius: 7,
              color: "#f8fbff",
              display: "inline-grid",
              fontSize: 15,
              fontWeight: 800,
              minWidth: 38,
              padding: "9px 8px",
              placeItems: "center",
              transform: isActive ? "translateY(-3px)" : "translateY(0)",
              transition: "transform .24s ease, border-color .24s ease, background .24s ease",
            }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
}

function StatePanel({ panel, accent }) {
  return (
    <section style={{ background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 9, padding: 12 }}>
      <div style={{ alignItems: "center", color: accent, display: "flex", fontSize: 11, fontWeight: 900, gap: 7, textTransform: "uppercase" }}>
        <i className="ti ti-chart-dots" />
        State Panel
      </div>
      <strong style={{ color: "#f8fbff", fontSize: 13, lineHeight: 1.35 }}>{panel.title}</strong>
      <div style={{ display: "grid", gap: 7 }}>
        {panel.items.map((item) => (
          <div key={`${item.label}-${item.value}`} style={{ alignItems: "center", background: "rgba(0,0,0,.15)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 7, display: "grid", gap: 5, gridTemplateColumns: "90px 1fr", padding: 8 }}>
            <span style={{ color: "#7d8aa2", fontSize: 10.5, fontWeight: 850 }}>{item.label}</span>
            <strong style={{ color: "#dbeafe", fontSize: 11.5, lineHeight: 1.35 }}>{String(item.value)}</strong>
          </div>
        ))}
      </div>
      <div style={{ color: "#64748b", fontSize: 10.5, lineHeight: 1.45 }}>
        Panel type: {panel.kind === "map" ? "map" : panel.kind === "stack" ? "stack/queue" : panel.kind === "tree" ? "tree" : panel.kind}
      </div>
    </section>
  );
}

export default function DsaVisualLab({ initialLessonId = "arrays", onPractice, theme = {}, profile = {} }) {
  const lessons = useMemo(() => listDsaVisualLessons(), []);
  const blind75Problems = useMemo(() => listBlind75Problems(), []);
  const blind75Visualizers = useMemo(() => listBlind75Visualizers(), []);
  const fallbackLessonId = lessons.some((lesson) => lesson.id === initialLessonId) ? initialLessonId : "arrays";
  const isKnownLessonId = (lessonId) => (
    lessons.some((lessonItem) => lessonItem.id === lessonId)
    || blind75Problems.some((problem) => problem.lessonId === lessonId)
  );
  const defaultLessonId = (() => {
    const savedLessonId = readSavedLessonId();
    return isKnownLessonId(savedLessonId) ? savedLessonId : fallbackLessonId;
  })();
  const [selectedLessonId, setSelectedLessonId] = useState(() => {
    return defaultLessonId;
  });
  const [track, setTrack] = useState(() => defaultLessonId.startsWith("blind75-") ? "blind75" : "core");
  const [blind75Filter, setBlind75Filter] = useState("featured");
  const [inputValue, setInputValue] = useState(() => formatInputValue(buildDsaVisualizationState(defaultLessonId).input));
  const [stepIndex, setStepIndex] = useState(0);
  const [stage, setStage] = useState("Visualize");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1200);
  const accent = theme.accentStrong || "#8bd3ff";
  const accentBorder = theme.accentBorder || "rgba(139, 211, 255, .28)";
  const lesson = useMemo(() => getDsaVisualLesson(selectedLessonId), [selectedLessonId]);
  const state = useMemo(
    () => buildDsaVisualizationState(selectedLessonId, inputValue),
    [selectedLessonId, inputValue],
  );
  const currentStep = state.steps[Math.min(stepIndex, state.steps.length - 1)] || state.steps[0];
  const stackText = profile?.stack || "";
  const selectedCode = useMemo(() => getDsaCodeTemplate(lesson, stackText), [lesson, stackText]);
  const mockPrompt = useMemo(() => buildDsaMockPrompt(lesson), [lesson]);
  const visibleBlind75Problems = useMemo(
    () => blind75Filter === "featured" ? blind75Problems.filter((problem) => problem.featured) : blind75Problems,
    [blind75Filter, blind75Problems],
  );
  const currentBlind75Problem = useMemo(
    () => lesson.blind75 ? blind75Problems.find((problem) => problem.id === lesson.problemId) : null,
    [lesson, blind75Problems],
  );
  const currentVisualizer = useMemo(
    () => currentBlind75Problem ? blind75Visualizers.find((visualizer) => visualizer.id === currentBlind75Problem.visualizerId) : null,
    [currentBlind75Problem, blind75Visualizers],
  );

  useEffect(() => {
    try {
      getStorage()?.setItem(DSA_VISUAL_LAB_STORAGE_KEY, selectedLessonId);
    } catch {
      // Local storage is optional for this standalone lab.
    }
  }, [selectedLessonId]);

  useEffect(() => {
    setInputValue(formatInputValue(buildDsaVisualizationState(selectedLessonId).input));
    setStepIndex(0);
    setPlaying(false);
    setStage("Visualize");
  }, [selectedLessonId]);

  useEffect(() => {
    if (!playing) return undefined;

    const timer = window.setInterval(() => {
      setStepIndex((value) => {
        if (value >= state.steps.length - 1) {
          setPlaying(false);
          return value;
        }
        return value + 1;
      });
    }, speed);

    return () => window.clearInterval(timer);
  }, [playing, speed, state.steps.length]);

  const chooseLesson = (lessonId) => {
    setTrack(String(lessonId).startsWith("blind75-") ? "blind75" : "core");
    setSelectedLessonId(lessonId);
  };

  const chooseTrack = (nextTrack) => {
    setTrack(nextTrack);
    setSelectedLessonId((lessonId) => {
      if (nextTrack === "blind75") {
        return String(lessonId).startsWith("blind75-") ? lessonId : "blind75-two-sum";
      }
      return String(lessonId).startsWith("blind75-") ? fallbackLessonId : lessonId;
    });
  };

  const visualize = () => {
    setStage("Visualize");
    setStepIndex(0);
  };

  const reset = () => {
    setPlaying(false);
    setInputValue(formatInputValue(buildDsaVisualizationState(selectedLessonId).input));
    setStepIndex(0);
    setStage("Visualize");
  };

  const previous = () => {
    setPlaying(false);
    setStepIndex((value) => Math.max(0, value - 1));
  };

  const next = () => {
    setPlaying(false);
    setStepIndex((value) => Math.min(state.steps.length - 1, value + 1));
  };

  const practiceAsMock = () => {
    setStage("Practice as Mock");
    onPractice?.(mockPrompt, { lesson, problem: currentBlind75Problem, visualizationState: state, language: selectedCode.language });
  };

  return (
    <section
      className="glass-card"
      style={{
        background: "linear-gradient(180deg, rgba(12,18,29,.88), rgba(7,11,19,.80))",
        border: "1px solid rgba(255,255,255,.1)",
        borderRadius: 8,
        color: "#edf4ff",
        display: "grid",
        gap: 14,
        padding: 14,
        textAlign: "left",
        width: "100%",
      }}
    >
      <header style={{ display: "grid", gap: 10 }}>
        <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <div style={{ alignItems: "center", color: accent, display: "flex", fontSize: 12, fontWeight: 900, gap: 7, textTransform: "uppercase" }}>
              <i className="ti ti-bulb" />
              DSA Visual Lab
            </div>
            <h2 style={{ color: "#ffffff", fontSize: 18, lineHeight: 1.25, margin: "4px 0 0" }}>
              Interview Pattern Theater
            </h2>
            <p style={{ color: "#93a4bf", fontSize: 12.5, lineHeight: 1.5, margin: "5px 0 0" }}>
              Play the pattern, narrate the invariant, then code it in your selected stack.
            </p>
          </div>
          <ActionButton icon="ti-user-question" label="Practice as Mock" onClick={practiceAsMock} tone="#a7f3d0" />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Track</div>
          <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            {TRACKS.map((item) => {
              const active = track === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={active ? "glass-button" : ""}
                  onClick={() => chooseTrack(item.id)}
                  style={{
                    background: active ? `${accent}1f` : "rgba(255,255,255,.035)",
                    border: `1px solid ${active ? accent : "rgba(255,255,255,.075)"}`,
                    borderRadius: 8,
                    color: active ? "#f8fbff" : "#93a4bf",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 850,
                    padding: "8px 9px",
                    textAlign: "center",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Guided Mode</div>
          <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))" }}>
            {GUIDED_STAGES.map((item) => {
              const active = stage === item;
              return (
                <button
                  key={item}
                  type="button"
                  className={active ? "glass-button" : ""}
                  onClick={() => item === "Practice as Mock" ? practiceAsMock() : setStage(item)}
                  style={{
                    background: active ? `${accent}1f` : "rgba(255,255,255,.035)",
                    border: `1px solid ${active ? accent : "rgba(255,255,255,.075)"}`,
                    borderRadius: 8,
                    color: active ? "#f8fbff" : "#93a4bf",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 850,
                    padding: "8px 9px",
                    textAlign: "center",
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {track === "core" ? (
        <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
          {lessons.map((item) => {
            const active = item.id === selectedLessonId;

            return (
              <button
                key={item.id}
                type="button"
                className="glass-button"
                onClick={() => chooseLesson(item.id)}
                style={{
                  background: active ? `${accent}1f` : "rgba(255,255,255,.045)",
                  border: `1px solid ${active ? accent : "rgba(255,255,255,.08)"}`,
                  borderRadius: 8,
                  color: "#f8fbff",
                  cursor: "pointer",
                  display: "grid",
                  gap: 7,
                  minHeight: 104,
                  padding: 11,
                  textAlign: "left",
                }}
              >
                <span style={{ alignItems: "center", display: "flex", gap: 7, fontSize: 12, fontWeight: 900 }}>
                  <i className={`ti ${item.icon}`} style={{ color: active ? accent : "#93a4bf", fontSize: 15 }} />
                  {item.title}
                </span>
                <span style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.45 }}>{item.memoryHook}</span>
                <span style={{ color: active ? accent : "#7d8aa2", fontSize: 10.5, fontWeight: 800 }}>
                  {item.complexity.time} / {item.complexity.space}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <section style={{ background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
          <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
            <div>
              <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Blind 75 Visual Track</div>
              <p style={{ color: "#93a4bf", fontSize: 12, lineHeight: 1.45, margin: "4px 0 0" }}>
                Learn the roadmap through pattern visualizers first, then practice each problem as a mock.
              </p>
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {BLIND75_FILTERS.map((item) => {
                const active = blind75Filter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={active ? "glass-button" : ""}
                    onClick={() => setBlind75Filter(item.id)}
                    style={{
                      background: active ? `${accent}1f` : "rgba(0,0,0,.14)",
                      border: `1px solid ${active ? accent : "rgba(255,255,255,.08)"}`,
                      borderRadius: 7,
                      color: active ? "#f8fbff" : "#93a4bf",
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 850,
                      padding: "8px 10px",
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(178px, 1fr))", maxHeight: blind75Filter === "all" ? 340 : "none", overflowY: blind75Filter === "all" ? "auto" : "visible", paddingRight: blind75Filter === "all" ? 4 : 0 }}>
            {visibleBlind75Problems.map((problem) => {
              const active = problem.lessonId === selectedLessonId;
              return (
                <button
                  key={problem.id}
                  type="button"
                  className="glass-button"
                  onClick={() => chooseLesson(problem.lessonId)}
                  style={{
                    background: active ? `${accent}1f` : "rgba(255,255,255,.04)",
                    border: `1px solid ${active ? accent : "rgba(255,255,255,.075)"}`,
                    borderRadius: 8,
                    color: "#f8fbff",
                    cursor: "pointer",
                    display: "grid",
                    gap: 6,
                    minHeight: 118,
                    padding: 11,
                    textAlign: "left",
                  }}
                >
                  <span style={{ alignItems: "center", color: active ? accent : "#7dd3fc", display: "flex", fontSize: 10.5, fontWeight: 900, gap: 6, textTransform: "uppercase" }}>
                    <i className="ti ti-map-pin" />
                    #{problem.order} · {problem.difficulty}
                  </span>
                  <strong style={{ color: "#f8fbff", fontSize: 12.5, lineHeight: 1.35 }}>{problem.title}</strong>
                  <span style={{ color: "#9ca3af", fontSize: 11, lineHeight: 1.45 }}>{problem.summary}</span>
                  <span style={{ color: active ? accent : "#7d8aa2", fontSize: 10.5, fontWeight: 850 }}>
                    Pattern visualizer: {problem.pattern}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {currentBlind75Problem ? (
        <section style={{ background: "rgba(0,0,0,.16)", border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
          <div style={{ alignItems: "start", display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <div>
              <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>{currentBlind75Problem.category}</div>
              <h3 style={{ color: "#f8fbff", fontSize: 16, lineHeight: 1.3, margin: "3px 0 5px" }}>{currentBlind75Problem.title}</h3>
              <p style={{ color: "#cbd5e1", fontSize: 12.5, lineHeight: 1.5, margin: 0 }}>{currentBlind75Problem.summary}</p>
            </div>
            <div style={{ background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 6, padding: 10 }}>
              <strong style={{ color: accent, fontSize: 11, textTransform: "uppercase" }}>Pattern visualizer</strong>
              <span style={{ color: "#f8fbff", fontSize: 12.5, fontWeight: 850 }}>{currentVisualizer?.title || currentBlind75Problem.pattern}</span>
              <span style={{ color: "#93a4bf", fontSize: 11.5, lineHeight: 1.45 }}>{currentVisualizer?.memoryHook || currentBlind75Problem.memoryHook}</span>
            </div>
          </div>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
            <div style={{ border: "1px solid rgba(255,255,255,.075)", borderRadius: 7, padding: 9 }}>
              <strong style={{ color: "#a7f3d0", display: "block", fontSize: 11, marginBottom: 4 }}>Invariant</strong>
              <span style={{ color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.45 }}>{currentBlind75Problem.invariant}</span>
            </div>
            <div style={{ border: "1px solid rgba(255,255,255,.075)", borderRadius: 7, padding: 9 }}>
              <strong style={{ color: "#facc15", display: "block", fontSize: 11, marginBottom: 4 }}>Edge cases</strong>
              <span style={{ color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.45 }}>{currentBlind75Problem.edgeCases.join(" · ")}</span>
            </div>
          </div>
        </section>
      ) : null}

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))" }}>
        <article style={{ background: "rgba(255,255,255,.045)", border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 12, padding: 12, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
            <label style={{ color: "#dbeafe", display: "grid", flex: "1 1 220px", fontSize: 11, fontWeight: 900, gap: 6, textTransform: "uppercase" }}>
              Visualize
              <input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Try: 1, 2, 3, 4"
                style={{
                  background: "rgba(0,0,0,.18)",
                  border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: 7,
                  color: "#f8fbff",
                  fontSize: 13,
                  minHeight: 34,
                  outline: "none",
                  padding: "8px 10px",
                }}
              />
            </label>
            <div style={{ alignItems: "end", display: "flex", gap: 7, flexWrap: "wrap" }}>
              <ActionButton icon={playing ? "ti-player-pause" : "ti-player-play"} label={playing ? "Pause" : "Play"} onClick={() => setPlaying((value) => !value)} tone="#a7f3d0" />
              <ActionButton icon="ti-player-track-prev" label="Previous" onClick={previous} disabled={stepIndex === 0} tone={accent} />
              <ActionButton icon="ti-arrow-right" label="Next" onClick={next} disabled={stepIndex >= state.steps.length - 1} tone={accent} />
              <ActionButton icon="ti-refresh" label="Reset" onClick={reset} tone="#facc15" />
              <ActionButton icon="ti-player-play" label="Visualize" onClick={visualize} tone={accent} />
            </div>
          </div>

          <label style={{ alignItems: "center", color: "#93a4bf", display: "flex", gap: 8, fontSize: 11, fontWeight: 850 }}>
            Speed
            <input
              aria-label="Speed"
              type="range"
              min="0"
              max={SPEEDS.length - 1}
              value={SPEEDS.findIndex((item) => item.value === speed)}
              onChange={(event) => setSpeed(SPEEDS[Number(event.target.value)]?.value || 1200)}
              style={{ accentColor: accent, flex: "1 1 140px" }}
            />
            <span style={{ color: accent }}>{SPEEDS.find((item) => item.value === speed)?.label || "Normal"}</span>
          </label>

          <VisualInput input={state.input} highlight={currentStep?.highlight || {}} accent={accent} isPlaying={playing} />

          <div style={{ background: "rgba(0,0,0,.16)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 8, padding: 11 }}>
            <div style={{ alignItems: "center", color: accent, display: "flex", fontSize: 11, fontWeight: 900, gap: 7 }}>
              <i className="ti ti-route" />
              Step {currentStep?.stepNumber || 1} of {state.steps.length}: {currentStep?.title}
            </div>
            <p style={{ color: "#dbeafe", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{currentStep?.narration || currentStep?.explanation}</p>
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
              <div style={{ border: "1px solid rgba(255,255,255,.075)", borderRadius: 7, padding: 9 }}>
                <strong style={{ color: "#facc15", display: "block", fontSize: 11, marginBottom: 4 }}>What changed</strong>
                <span style={{ color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.45 }}>{currentStep?.changed}</span>
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,.075)", borderRadius: 7, padding: 9 }}>
                <strong style={{ color: "#a7f3d0", display: "block", fontSize: 11, marginBottom: 4 }}>Invariant</strong>
                <span style={{ color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.45 }}>{currentStep?.invariant}</span>
              </div>
            </div>
          </div>
        </article>

        <aside style={{ display: "grid", gap: 10, alignContent: "start" }}>
          <StatePanel panel={currentStep?.sidePanel || { title: "State Panel", kind: "state", items: [] }} accent={accent} />

          <section style={{ background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 7, padding: 12 }}>
            <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Dry Run</div>
            <p style={{ color: "#dbeafe", fontSize: 12.5, lineHeight: 1.5, margin: 0 }}>{lesson.dryRun}</p>
            <div style={{ borderTop: "1px solid rgba(255,255,255,.07)", color: "#93a4bf", fontSize: 11.5, lineHeight: 1.45, paddingTop: 8 }}>
              Dry-run script: {currentStep?.interviewScript}
            </div>
          </section>

          <section style={{ background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 7, padding: 12 }}>
            <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Quiz</div>
            <strong style={{ color: "#f8fbff", fontSize: 13, lineHeight: 1.4 }}>{lesson.quiz.question}</strong>
            <p style={{ color: "#93a4bf", fontSize: 12, lineHeight: 1.45, margin: 0 }}>{lesson.quiz.answer}</p>
          </section>
        </aside>
      </div>

      <section style={{ background: "rgba(0,0,0,.18)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 8, padding: 12 }}>
        <div style={{ alignItems: "center", color: accent, display: "flex", fontSize: 11, fontWeight: 900, gap: 7, justifyContent: "space-between", textTransform: "uppercase", flexWrap: "wrap" }}>
          <span style={{ alignItems: "center", display: "inline-flex", gap: 7 }}>
            <i className="ti ti-code" />
            Selected stack code
          </span>
          <span style={{ color: "#a7f3d0" }}>{selectedCode.language}</span>
        </div>
        <div style={{ color: "#93a4bf", fontSize: 11.5, lineHeight: 1.45 }}>
          What to say in interview: name the invariant, dry run one input, then write this template cleanly.
        </div>
        <pre style={{ color: "#dbeafe", fontSize: 12, lineHeight: 1.55, margin: 0, overflowX: "auto", whiteSpace: "pre" }}>
          <code>{selectedCode.code}</code>
        </pre>
      </section>
    </section>
  );
}
