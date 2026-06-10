import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildDsaExplainThenCodeCoach,
  buildDsaMockPrompt,
  buildDsaThinkingSystem,
  buildDsaVisualizationState,
  getDsaCodeTemplate,
  getDsaVisualLesson,
  listDsaVisualLessons,
} from "../../lib/dsaVisualLab.mjs";
import {
  buildDsaProgressSummary,
  filterBlind75Problems,
  getDsaProblemProgress,
  listBlind75Problems,
  listBlind75Visualizers,
  recordDsaMasteryStep,
  recordDsaMistake,
  recordDsaTestCaseMastery,
} from "../../lib/blind75VisualTrack.mjs";
import {
  buildDsaDrillComparison,
  buildDsaDrillMockPrompt,
  buildDsaInterviewChallengeMockPrompt,
  listDsaInterviewChallenges,
  listDsaDrillQuestions,
} from "../../lib/dsaDrillRoom.mjs";
import {
  buildDsaBigOChart,
  buildDsaPatternDecisionTree,
  listDsaOperationComplexities,
  listDsaComplexityCheats,
  listDsaPatternAtlas,
  listDsaVisualPlaygroundModules,
} from "../../lib/dsaPatternAtlas.mjs";
import {
  loadDsaConfidenceState,
  loadDsaLessonId,
  saveDsaConfidenceState,
  saveDsaLessonId,
} from "../../lib/dsaLabPersistence.mjs";
import BeginnerGuideBanner from "../BeginnerGuideBanner";

const GUIDED_STAGES = ["Learn", "Pattern Atlas", "Visual Playground", "Big-O Board", "Visualize", "Dry run", "Explain-Then-Code", "Code", "Quiz", "Interview Challenges", "Drill Room", "Practice as Mock"];
const CHALLENGE_FILTERS = [
  { id: "all", label: "All" },
  { id: "mcq", label: "MCQ" },
  { id: "coding", label: "Coding" },
  { id: "quantitative", label: "Quantitative" },
  { id: "tricky", label: "Tricky" },
];
const TRACKS = [
  { id: "thinking", label: "How To Approach" },
  { id: "core", label: "Interview Core" },
  { id: "blind75", label: "Blind 75 Visual Track" },
];
const THINKING_METHOD_LABELS = [
  "Understand the problem",
  "Say brute force first",
  "Detect the pattern",
  "Build the invariant",
  "Dry run before code",
  "Write code skeleton",
  "Test like an interviewer",
  "Explain complexity",
];
const BLIND75_FILTERS = [
  { id: "featured", label: "Featured 15", type: "scope" },
  { id: "all", label: "All 75", type: "scope" },
  { id: "Easy", label: "Easy", type: "difficulty" },
  { id: "Medium", label: "Medium", type: "difficulty" },
  { id: "Hard", label: "Hard", type: "difficulty" },
  { id: "weak", label: "Weak", type: "status" },
  { id: "not-started", label: "Not Started", type: "status" },
  { id: "mastered", label: "Mastered", type: "status" },
];
const SPEEDS = [
  { label: "Slow", value: 1800 },
  { label: "Normal", value: 1200 },
  { label: "Fast", value: 700 },
];
const REEL_TONES = [
  { id: "interview", label: "Interview", icon: "ti-user-question" },
  { id: "beginner", label: "Beginner", icon: "ti-school" },
  { id: "cinema", label: "Cinema", icon: "ti-movie" },
];
const EXPLAIN_READINESS_ITEMS = [
  { id: "brute", label: "Brute force", cue: "Say the slow obvious idea first.", pattern: /\b(brute|naive|nested|try all|all pairs)\b/i },
  { id: "optimal", label: "Optimal idea", cue: "Name the pattern and why it removes repeated work.", pattern: /\b(optimal|pattern|hash|pointer|stack|queue|tree|graph|dp|window|map)\b/i },
  { id: "invariant", label: "Invariant", cue: "State the rule that stays true after every move.", pattern: /\b(invariant|maintain|guarantee|state|always)\b/i },
  { id: "edge", label: "Edge cases", cue: "Mention empty, duplicate, boundary, or no-answer cases.", pattern: /\b(edge|empty|duplicate|single|null|boundary|no answer)\b/i },
  { id: "complexity", label: "Complexity", cue: "Close with time, space, and the trade-off.", pattern: /\b(o\(|time|space|complexity|trade[- ]?off)\b/i },
];

function getStorage() {
  return typeof window !== "undefined" ? window.localStorage : null;
}

function formatInputValue(value) {
  return Array.isArray(value) ? value.join(", ") : String(value || "");
}

function resolveBlind75Filter(filter) {
  const match = BLIND75_FILTERS.find((item) => item.id === filter) || BLIND75_FILTERS[0];
  return {
    featuredOnly: match.id === "featured",
    difficulty: match.type === "difficulty" ? match.id : "all",
    status: match.type === "status" ? match.id : "all",
  };
}

function statusLabel(status) {
  if (status === "weak") return "Weak";
  if (status === "improving") return "Improving";
  if (status === "mastered") return "Mastered";
  return "Not Started";
}

function statusTone(status, accent) {
  if (status === "weak") return "#fda4af";
  if (status === "improving") return "#facc15";
  if (status === "mastered") return "#a7f3d0";
  return accent;
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

function normalizeHighlightIndex(value, itemCount) {
  if (!Number.isInteger(value)) return null;
  const normalized = value < 0 && Number.isInteger(itemCount) ? itemCount + value : value;
  if (normalized < 0) return null;
  if (Number.isInteger(itemCount) && normalized >= itemCount) return null;
  return normalized;
}

function activeIndexes(highlight = {}, itemCount) {
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
  const indexes = scalarKeys.map((key) => normalizeHighlightIndex(highlight[key], itemCount))
    .filter((item) => Number.isInteger(item));

  if (Array.isArray(highlight.from)) indexes.push(...highlight.from.map((item) => normalizeHighlightIndex(item, itemCount)).filter((item) => Number.isInteger(item)));
  if (Array.isArray(highlight.visitedIndexes)) indexes.push(...highlight.visitedIndexes.map((item) => normalizeHighlightIndex(item, itemCount)).filter((item) => Number.isInteger(item)));
  if (Array.isArray(highlight.frontierIndexes)) indexes.push(...highlight.frontierIndexes.map((item) => normalizeHighlightIndex(item, itemCount)).filter((item) => Number.isInteger(item)));
  return new Set(indexes);
}

function highlightMatchesIndex(value, index, itemCount) {
  return normalizeHighlightIndex(value, itemCount) === index;
}

function highlightArrayIncludes(values, index, itemCount) {
  return Array.isArray(values) && values.some((value) => highlightMatchesIndex(value, index, itemCount));
}

function pointerBadges(index, highlight = {}, accent, itemCount) {
  const badges = [];
  if (highlightMatchesIndex(highlight.index, index, itemCount)) badges.push(["i", accent]);
  if (highlightMatchesIndex(highlight.left, index, itemCount)) badges.push(["L", "#a7f3d0"]);
  if (highlightMatchesIndex(highlight.right, index, itemCount)) badges.push(["R", "#facc15"]);
  if (highlightMatchesIndex(highlight.low, index, itemCount)) badges.push(["low", "#93c5fd"]);
  if (highlightMatchesIndex(highlight.mid, index, itemCount)) badges.push(["mid", "#facc15"]);
  if (highlightMatchesIndex(highlight.high, index, itemCount)) badges.push(["high", "#fda4af"]);
  if (highlightMatchesIndex(highlight.windowStart, index, itemCount)) badges.push(["win L", "#a7f3d0"]);
  if (highlightMatchesIndex(highlight.windowEnd, index, itemCount)) badges.push(["win R", "#facc15"]);
  if (highlightMatchesIndex(highlight.prev, index, itemCount)) badges.push(["prev", "#93c5fd"]);
  if (highlightMatchesIndex(highlight.current, index, itemCount)) badges.push(["cur", accent]);
  if (highlightMatchesIndex(highlight.next, index, itemCount)) badges.push(["next", "#c084fc"]);
  if (highlightMatchesIndex(highlight.nodeIndex, index, itemCount)) badges.push(["node", accent]);
  if (highlightMatchesIndex(highlight.to, index, itemCount)) badges.push(["to", "#c084fc"]);
  if (highlightArrayIncludes(highlight.from, index, itemCount)) badges.push(["from", "#93c5fd"]);
  if (highlightArrayIncludes(highlight.visitedIndexes, index, itemCount)) badges.push(["seen", "#a7f3d0"]);
  if (highlightArrayIncludes(highlight.frontierIndexes, index, itemCount)) badges.push(["front", "#facc15"]);
  return badges;
}

function summarizeHighlightPosition(highlight = {}, itemCount) {
  const orderedKeys = ["index", "left", "right", "low", "mid", "high", "windowStart", "windowEnd", "current", "prev", "next", "nodeIndex"];
  const labels = {
    index: "i",
    left: "left",
    right: "right",
    low: "low",
    mid: "mid",
    high: "high",
    windowStart: "win L",
    windowEnd: "win R",
    current: "current",
    prev: "prev",
    next: "next",
    nodeIndex: "node",
  };
  const parts = orderedKeys
    .map((key) => {
      const value = normalizeHighlightIndex(highlight[key], itemCount);
      return Number.isInteger(value) ? `${labels[key]}=${value}` : null;
    })
    .filter(Boolean);

  if (Array.isArray(highlight.frontierIndexes) && highlight.frontierIndexes.length) parts.push(`frontier=${highlight.frontierIndexes.join(",")}`);
  if (Array.isArray(highlight.visitedIndexes) && highlight.visitedIndexes.length) parts.push(`seen=${highlight.visitedIndexes.join(",")}`);
  return parts.join(" | ") || "state setup";
}

function buildDryRunRows(steps = [], input) {
  const itemCount = Array.isArray(input) ? input.length : String(input || "").length;
  return steps.map((step, index) => {
    const stateItems = step.sidePanel?.items || [];
    const stateText = stateItems.length
      ? stateItems.map((item) => `${item.label}: ${item.value}`).join(" | ")
      : step.changed || "Track the active state";

    return {
      id: `${step.title}-${index}`,
      step: step.stepNumber || index + 1,
      pointer: summarizeHighlightPosition(step.highlight || {}, itemCount),
      state: stateText,
      decision: step.changed || step.title,
      reason: step.invariant || step.explanation,
    };
  });
}

function buildPredictionOptions(currentStep, stepIndex) {
  const correct = currentStep?.changed || "Keep the invariant true with the next state update.";
  const wrongMoves = [
    "Move both pointers without proving any choice can be skipped.",
    "Return immediately because the first highlighted value looks important.",
    "Ignore the tracked state and restart the scan from the beginning.",
    "Change the answer before checking the invariant.",
  ];
  const offset = stepIndex % wrongMoves.length;
  return [
    { id: "correct", label: correct, correct: true },
    { id: "wrong-a", label: wrongMoves[offset], correct: false },
    { id: "wrong-b", label: wrongMoves[(offset + 1) % wrongMoves.length], correct: false },
  ];
}

function findCodeFocusLine(lines, walkthrough, stepIndex) {
  const cue = String(walkthrough?.codeCue || "").toLowerCase();
  if (cue) {
    const cueIndex = lines.findIndex((line) => line.toLowerCase().includes(cue));
    if (cueIndex >= 0) return cueIndex;
  }

  const codeSignals = [
    /const|let|map|set|stack|queue|dp|left|right/i,
    /for|while|if|return|dfs|bfs/i,
    /return|else|break|continue/i,
  ];
  const signal = codeSignals[Math.min(stepIndex, codeSignals.length - 1)];
  const signalIndex = lines.findIndex((line) => signal.test(line));
  if (signalIndex >= 0) return signalIndex;
  return Math.min(stepIndex, Math.max(lines.length - 1, 0));
}

function buildChallengeVisualSteps(challenge) {
  if (!challenge) return [];
  const correctChoice = (challenge.choices || []).find((choice) => choice.id === challenge.correctChoiceId);
  return [
    { label: "Signal", value: challenge.typeLabel || challenge.type || "Question", tone: "#93c5fd" },
    { label: "Trap", value: challenge.trick || "Watch for skipped reasoning.", tone: "#facc15" },
    { label: "Answer", value: correctChoice?.text || challenge.explanation || "Choose the option tied to the invariant.", tone: "#a7f3d0" },
  ];
}

function VisualInput({ input, highlight, accent, isPlaying }) {
  const itemCount = Array.isArray(input) ? input.length : String(input).length;
  const active = activeIndexes(highlight, itemCount);

  if (Array.isArray(input)) {
    return (
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(58px, 1fr))", alignItems: "end" }}>
        {input.map((value, index) => {
          const isActive = active.has(index);
          const height = typeof value === "number" ? Math.max(50, Math.min(106, 44 + Number(value) * 7)) : 62;

          return (
            <div key={`${value}-${index}`} style={{ display: "grid", gap: 5, alignItems: "end" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 3, minHeight: 18 }}>
                {pointerBadges(index, highlight, accent, input.length).map(([label, color]) => (
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

function ReelTimeline({ steps, stepIndex, accent, onSelectStep }) {
  return (
    <div style={{ alignItems: "center", display: "grid", gap: 7, gridTemplateColumns: `repeat(${Math.max(steps.length, 1)}, minmax(28px, 1fr))` }}>
      {steps.map((step, index) => {
        const complete = index < stepIndex;
        const active = index === stepIndex;
        return (
          <button
            key={`${step.title}-${index}`}
            type="button"
            onClick={() => onSelectStep(index)}
            title={step.title}
            style={{
              background: active ? accent : complete ? "rgba(167,243,208,.72)" : "rgba(255,255,255,.13)",
              border: `1px solid ${active ? accent : complete ? "rgba(167,243,208,.72)" : "rgba(255,255,255,.15)"}`,
              borderRadius: 999,
              cursor: "pointer",
              height: 9,
              minWidth: 0,
              opacity: active ? 1 : .86,
              padding: 0,
              transition: "background .24s ease, border-color .24s ease, opacity .24s ease",
            }}
            aria-label={`Go to step ${index + 1}: ${step.title}`}
          />
        );
      })}
    </div>
  );
}

function ReelKeyMoments({ input, highlight, accent }) {
  const values = Array.isArray(input) ? input : String(input).split("");
  const itemCount = values.length;
  const active = activeIndexes(highlight, itemCount);
  const activeItems = values
    .map((value, index) => ({ value, index, badges: pointerBadges(index, highlight, accent, itemCount) }))
    .filter((item) => active.has(item.index) || item.badges.length);

  if (!activeItems.length) {
    return (
      <div style={{ color: "#93a4bf", fontSize: 11.5, lineHeight: 1.45 }}>
        Watch the invariant first; the next frame will mark the exact value or pointer.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {activeItems.map((item) => (
        <div key={`${item.value}-${item.index}`} style={{ background: "rgba(0,0,0,.18)", border: `1px solid ${accent}44`, borderRadius: 8, display: "grid", gap: 4, minWidth: 72, padding: "8px 9px" }}>
          <span style={{ color: "#7d8aa2", fontSize: 10, fontWeight: 850 }}>index {item.index}</span>
          <strong style={{ color: "#f8fbff", fontSize: 16 }}>{String(item.value)}</strong>
          <span style={{ color: accent, fontSize: 10.5, fontWeight: 900 }}>
            {item.badges.map(([label]) => label).join(" / ") || "focus"}
          </span>
        </div>
      ))}
    </div>
  );
}

function ReelPredictor({ currentStep, stepIndex, accent }) {
  const [choiceId, setChoiceId] = useState("");
  const options = useMemo(() => buildPredictionOptions(currentStep, stepIndex), [currentStep, stepIndex]);
  const selected = options.find((option) => option.id === choiceId);

  useEffect(() => {
    setChoiceId("");
  }, [stepIndex, currentStep?.title]);

  return (
    <div style={{ background: "rgba(0,0,0,.18)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
      <div style={{ alignItems: "center", color: accent, display: "flex", fontSize: 10.5, fontWeight: 900, gap: 6, textTransform: "uppercase" }}>
        <i className="ti ti-player-pause" />
        Pause and predict
      </div>
      <strong style={{ color: "#f8fbff", fontSize: 12.5, lineHeight: 1.35 }}>What should happen before the next frame?</strong>
      <div style={{ display: "grid", gap: 7 }}>
        {options.map((option) => {
          const active = choiceId === option.id;
          const tone = !active ? "rgba(255,255,255,.08)" : option.correct ? "#a7f3d0" : "#fda4af";
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setChoiceId(option.id)}
              style={{
                background: active ? `${tone}13` : "rgba(255,255,255,.035)",
                border: `1px solid ${active ? tone : "rgba(255,255,255,.075)"}`,
                borderRadius: 7,
                color: active ? "#f8fbff" : "#dbeafe",
                cursor: "pointer",
                display: "grid",
                fontSize: 11.2,
                fontWeight: 850,
                gap: 4,
                lineHeight: 1.4,
                padding: 8,
                textAlign: "left",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {selected ? (
        <div style={{ background: selected.correct ? "rgba(167,243,208,.08)" : "rgba(253,164,175,.08)", border: `1px solid ${selected.correct ? "rgba(167,243,208,.25)" : "rgba(253,164,175,.25)"}`, borderRadius: 7, color: selected.correct ? "#a7f3d0" : "#fecdd3", fontSize: 11.2, lineHeight: 1.45, padding: 8, transform: selected.correct ? "none" : "rotate(-.4deg)" }}>
          {selected.correct
            ? "Good prediction. Now advance the scene and say the invariant out loud."
            : `Rejected frame: that move would break the invariant. Correct move: ${options[0]?.label}`}
        </div>
      ) : null}
    </div>
  );
}

function buildBeginnerBeat(lesson, currentStep, stepIndex, totalSteps) {
  const stepName = String(currentStep?.title || "this move").toLowerCase();
  const changed = currentStep?.changed || "The algorithm updates one small piece of state.";
  const invariant = currentStep?.invariant || lesson.memoryHook;
  const position = stepIndex === 0
    ? "First, we set up the rule of the game."
    : stepIndex >= totalSteps - 1
      ? "Finally, we use the rule we protected the whole time."
      : "Now we make one safe move and keep the rule true.";

  return {
    caption: `${position} ${changed}`,
    why: `This works because: ${invariant}`,
    mistake: `Beginner trap: do not rush past ${stepName}; say what changed before moving on.`,
  };
}

function getLessonTone(lesson, tone) {
  if (tone === "beginner") return `Imagine this as one small story: ${lesson.memoryHook} Each frame changes only one thing, then checks the rule again.`;
  if (tone === "cinema") return `Watch the scene like a camera shot: focus on the highlighted value, then follow the state change before the next cut.`;
  return lesson.memoryHook;
}

function buildStoryboardSteps(steps, stepIndex) {
  if (!steps.length) return [];
  return steps.map((step, index) => {
    if (index === 0) return { label: "Setup", title: step.title, active: index === stepIndex };
    if (index === steps.length - 1) return { label: "Return", title: step.title, active: index === stepIndex };
    return { label: `Move ${index}`, title: step.title, active: index === stepIndex };
  });
}

function ReelStoryboard({ steps, stepIndex, accent, onSelectStep }) {
  const storyboard = buildStoryboardSteps(steps, stepIndex);

  return (
    <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))" }}>
      {storyboard.map((beat, index) => {
        const active = beat.active;
        return (
          <button
            key={`${beat.label}-${beat.title}`}
            type="button"
            onClick={() => onSelectStep(index)}
            title={beat.title}
            style={{
              background: active ? `${accent}1f` : "rgba(255,255,255,.04)",
              border: `1px solid ${active ? accent : "rgba(255,255,255,.08)"}`,
              borderRadius: 8,
              color: active ? "#f8fbff" : "#93a4bf",
              cursor: "pointer",
              display: "grid",
              gap: 3,
              minHeight: 58,
              padding: 8,
              textAlign: "left",
            }}
          >
            <span style={{ color: active ? accent : "#7d8aa2", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{beat.label}</span>
            <strong style={{ color: active ? "#f8fbff" : "#dbeafe", fontSize: 11, lineHeight: 1.3 }}>{beat.title}</strong>
          </button>
        );
      })}
    </div>
  );
}

function BeginnerDirectorCard({ lesson, currentStep, stepIndex, totalSteps, accent }) {
  const beat = buildBeginnerBeat(lesson, currentStep, stepIndex, totalSteps);

  return (
    <div style={{ background: "rgba(0,0,0,.18)", border: `1px solid ${accent}35`, borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
      <div style={{ alignItems: "center", color: accent, display: "flex", fontSize: 10.5, fontWeight: 900, gap: 6, textTransform: "uppercase" }}>
        <i className="ti ti-sparkles" />
        Beginner Director
      </div>
      <strong style={{ color: "#f8fbff", fontSize: 12.5, lineHeight: 1.4 }}>{beat.caption}</strong>
      <div style={{ color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.45 }}>{beat.why}</div>
      <div style={{ background: "rgba(250,204,21,.08)", border: "1px solid rgba(250,204,21,.18)", borderRadius: 7, color: "#fde68a", fontSize: 11.2, lineHeight: 1.4, padding: 8 }}>
        {beat.mistake}
      </div>
    </div>
  );
}

function DsaReelView({ lesson, state, currentStep, stepIndex, accent, playing, lessonTone, onSelectStep }) {
  const sceneNumber = stepIndex + 1;
  const progress = state.steps.length ? ((sceneNumber) / state.steps.length) * 100 : 0;

  return (
    <section style={{ background: "linear-gradient(135deg, rgba(15,23,42,.82), rgba(2,6,23,.72))", border: `1px solid ${accent}55`, borderRadius: 8, boxShadow: playing ? `0 0 0 4px ${accent}12` : "none", display: "grid", gap: 12, overflow: "hidden", padding: 12, position: "relative" }}>
      <div style={{ background: `linear-gradient(90deg, ${accent}, rgba(255,255,255,.08))`, height: 3, left: 0, position: "absolute", top: 0, width: `${progress}%`, transition: "width .28s ease" }} />
      <div style={{ alignItems: "start", display: "grid", gap: 10, gridTemplateColumns: "minmax(0, 1fr) auto" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: accent, display: "flex", flexWrap: "wrap", fontSize: 11, fontWeight: 900, gap: 7, textTransform: "uppercase" }}>
            <span>Scene {sceneNumber}/{state.steps.length}</span>
            <span style={{ color: "#64748b" }}>|</span>
            <span>{lesson.title}</span>
          </div>
          <h3 style={{ color: "#f8fbff", fontSize: 16, lineHeight: 1.25, margin: "5px 0 0" }}>{currentStep?.title}</h3>
        </div>
        <div style={{ background: playing ? "rgba(167,243,208,.12)" : "rgba(255,255,255,.055)", border: `1px solid ${playing ? "rgba(167,243,208,.32)" : "rgba(255,255,255,.1)"}`, borderRadius: 999, color: playing ? "#a7f3d0" : "#93a4bf", fontSize: 10.5, fontWeight: 900, padding: "6px 8px", whiteSpace: "nowrap" }}>
          {playing ? "Playing" : "Paused"}
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))" }}>
        <div style={{ background: "radial-gradient(circle at 50% 0%, rgba(255,255,255,.10), rgba(255,255,255,.035) 52%, rgba(0,0,0,.16))", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 12, minHeight: 196, padding: 12 }}>
          <VisualInput input={state.input} highlight={currentStep?.highlight || {}} accent={accent} isPlaying={playing} />
          <ReelTimeline steps={state.steps} stepIndex={stepIndex} accent={accent} onSelectStep={onSelectStep} />
        </div>

        <aside style={{ alignContent: "start", display: "grid", gap: 8 }}>
          <div style={{ background: "rgba(147,197,253,.08)", border: "1px solid rgba(147,197,253,.18)", borderRadius: 8, display: "grid", gap: 5, padding: 10 }}>
            <span style={{ color: "#93c5fd", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Voiceover</span>
            <span style={{ color: "#dbeafe", fontSize: 11.5, lineHeight: 1.45 }}>{currentStep?.interviewScript || "Say the invariant, then explain the move."}</span>
          </div>
          <div style={{ background: `${accent}14`, border: `1px solid ${accent}42`, borderRadius: 8, display: "grid", gap: 5, padding: 10 }}>
            <span style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Move</span>
            <strong style={{ color: "#f8fbff", fontSize: 12.5, lineHeight: 1.35 }}>{currentStep?.changed}</strong>
          </div>
          <div style={{ background: "rgba(0,0,0,.16)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 6, padding: 10 }}>
            <span style={{ color: "#facc15", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Focus</span>
            <ReelKeyMoments input={state.input} highlight={currentStep?.highlight || {}} accent={accent} />
          </div>
        </aside>
      </div>

      <ReelPredictor currentStep={currentStep} stepIndex={stepIndex} accent={accent} />

      <div style={{ background: "rgba(0,0,0,.18)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 8, padding: 11 }}>
        <div style={{ color: "#93a4bf", fontSize: 11.5, lineHeight: 1.45 }}>
          <strong style={{ color: accent }}>Mental image:</strong> {lessonTone || lesson.memoryHook}
        </div>
        <p style={{ color: "#dbeafe", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{currentStep?.narration || currentStep?.explanation}</p>
        <div style={{ color: "#93a4bf", fontSize: 11.5, lineHeight: 1.45 }}>
          <strong style={{ color: "#a7f3d0" }}>Invariant:</strong> {currentStep?.invariant || lesson.memoryHook}
        </div>
      </div>

      <BeginnerDirectorCard
        lesson={lesson}
        currentStep={currentStep}
        stepIndex={stepIndex}
        totalSteps={state.steps.length}
        accent={accent}
      />

      <ReelStoryboard steps={state.steps} stepIndex={stepIndex} accent={accent} onSelectStep={onSelectStep} />
    </section>
  );
}

function DryRunTable({ rows, activeIndex, accent }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, overflowX: "auto" }}>
      <div style={{ background: "rgba(255,255,255,.045)", color: accent, display: "grid", fontSize: 10, fontWeight: 900, gap: 0, gridTemplateColumns: "48px minmax(90px, .8fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(140px, 1.1fr)", minWidth: 640, textTransform: "uppercase" }}>
        {["Step", "Pointer", "State", "Decision", "Reason"].map((label) => (
          <span key={label} style={{ borderRight: "1px solid rgba(255,255,255,.07)", padding: "7px 8px" }}>{label}</span>
        ))}
      </div>
      <div style={{ display: "grid" }}>
        {rows.map((row, index) => {
          const active = index === activeIndex;
          return (
            <div key={row.id} style={{ background: active ? `${accent}10` : "rgba(0,0,0,.12)", borderTop: "1px solid rgba(255,255,255,.07)", color: "#dbeafe", display: "grid", fontSize: 10.8, gap: 0, gridTemplateColumns: "48px minmax(90px, .8fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(140px, 1.1fr)", lineHeight: 1.4, minWidth: 640 }}>
              <strong style={{ color: active ? accent : "#93a4bf", padding: "8px" }}>{row.step}</strong>
              <span style={{ padding: "8px" }}>{row.pointer}</span>
              <span style={{ padding: "8px" }}>{row.state}</span>
              <span style={{ padding: "8px" }}>{row.decision}</span>
              <span style={{ padding: "8px" }}>{row.reason}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExplainReadinessChecklist({ explanation, judged, score, accent }) {
  return (
    <section style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 8, padding: 11 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
        <strong style={{ color: accent, fontSize: 11, textTransform: "uppercase" }}>Approach readiness</strong>
        <span style={{ color: judged ? "#a7f3d0" : "#93a4bf", fontSize: 11, fontWeight: 900 }}>{judged ? `${score}% ready` : "Before code"}</span>
      </div>
      <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(138px, 1fr))" }}>
        {EXPLAIN_READINESS_ITEMS.map((item) => {
          const covered = item.pattern.test(explanation || "");
          return (
            <div key={item.id} style={{ background: covered ? "rgba(167,243,208,.08)" : "rgba(255,255,255,.035)", border: `1px solid ${covered ? "rgba(167,243,208,.24)" : "rgba(255,255,255,.07)"}`, borderRadius: 7, display: "grid", gap: 5, minHeight: 78, padding: 8 }}>
              <span style={{ alignItems: "center", color: covered ? "#a7f3d0" : "#dbeafe", display: "flex", fontSize: 11.2, fontWeight: 900, gap: 6 }}>
                <i className={`ti ${covered ? "ti-circle-check" : "ti-circle"}`} />
                {item.label}
              </span>
              <span style={{ color: "#93a4bf", fontSize: 10.6, lineHeight: 1.35 }}>{item.cue}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CodeSyncBlock({ code, walkthrough, stepIndex, accent }) {
  const lines = String(code?.code || "").split("\n");
  const focusLine = findCodeFocusLine(lines, walkthrough, stepIndex);

  return (
    <section style={{ background: "rgba(0,0,0,.18)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 8, minWidth: 0, padding: 12 }}>
      <div style={{ alignItems: "center", color: accent, display: "flex", fontSize: 11, fontWeight: 900, gap: 7, justifyContent: "space-between", textTransform: "uppercase", flexWrap: "wrap" }}>
        <span style={{ alignItems: "center", display: "inline-flex", gap: 7 }}>
          <i className="ti ti-code" />
          Synced code
        </span>
        <span style={{ color: "#a7f3d0" }}>{code?.language}</span>
      </div>
      <div style={{ color: "#93a4bf", fontSize: 11.5, lineHeight: 1.45 }}>
        Scene cue: {walkthrough?.say || "The highlighted line is the closest code match for the current visual step."}
      </div>
      <pre style={{ color: "#dbeafe", fontSize: 11.6, lineHeight: 1.6, margin: 0, overflowX: "auto", whiteSpace: "pre" }}>
        <code>
          {lines.map((line, index) => {
            const active = index === focusLine;
            return (
              <span key={`${line}-${index}`} style={{ background: active ? `${accent}1f` : "transparent", borderLeft: active ? `3px solid ${accent}` : "3px solid transparent", display: "block", padding: "0 8px" }}>
                <span style={{ color: active ? accent : "#64748b", display: "inline-block", marginRight: 10, minWidth: 22, textAlign: "right" }}>{index + 1}</span>
                {line || " "}
              </span>
            );
          })}
        </code>
      </pre>
    </section>
  );
}

function ChallengeVisualExplanation({ challenge, choiceId, accent }) {
  const answered = Boolean(choiceId);
  const correct = answered && choiceId === challenge?.correctChoiceId;
  const steps = buildChallengeVisualSteps(challenge);

  if (!answered || !challenge) return null;

  return (
    <section style={{ background: correct ? "rgba(167,243,208,.06)" : "rgba(253,164,175,.06)", border: `1px solid ${correct ? "rgba(167,243,208,.22)" : "rgba(253,164,175,.22)"}`, borderRadius: 8, display: "grid", gap: 9, padding: 10 }}>
      <div style={{ alignItems: "center", color: correct ? "#a7f3d0" : "#fda4af", display: "flex", fontSize: 11, fontWeight: 900, gap: 7, textTransform: "uppercase" }}>
        <i className={`ti ${correct ? "ti-route-check" : "ti-route-x"}`} />
        Visual answer path
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}>
        {steps.map((step, index) => (
          <div key={step.label} style={{ background: "rgba(0,0,0,.16)", border: `1px solid ${step.tone}33`, borderRadius: 8, display: "grid", gap: 5, minHeight: 84, padding: 9 }}>
            <span style={{ color: step.tone, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{index + 1}. {step.label}</span>
            <span style={{ color: "#dbeafe", fontSize: 11, lineHeight: 1.4 }}>{step.value}</span>
          </div>
        ))}
      </div>
      <div style={{ color: "#dbeafe", fontSize: 11.5, lineHeight: 1.45 }}>
        {correct ? "The selected option follows the signal, avoids the trap, and lands on the invariant-backed answer." : "Your selection hit the trap. Follow the path above from signal to trap to correct answer, then try the next challenge."}
      </div>
    </section>
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

function DrillRoomPanel({
  accent,
  accentBorder,
  drill,
  drills,
  answer,
  comparison,
  compared,
  revealed,
  onAnswerChange,
  onChooseDrill,
  onCompare,
  onNext,
  onPractice,
  onReveal,
}) {
  return (
    <section style={{ background: "rgba(255,255,255,.04)", border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 12, padding: 12 }}>
      <div style={{ alignItems: "start", display: "grid", gap: 12, gridTemplateColumns: "minmax(0, 1fr) auto" }}>
        <div>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>DSA Drill Room</div>
          <h3 style={{ color: "#f8fbff", fontSize: 16, lineHeight: 1.3, margin: "4px 0" }}>
            {drill.title}
          </h3>
          <p style={{ color: "#93a4bf", fontSize: 12, lineHeight: 1.5, margin: 0 }}>
            Answer first, then reveal the ideal structure or compare your approach against the rubric.
          </p>
        </div>
        <strong style={{ background: "rgba(139,211,255,.08)", border: `1px solid ${accentBorder}`, borderRadius: 999, color: accent, fontSize: 11, fontWeight: 900, padding: "7px 10px", whiteSpace: "nowrap" }}>
          {drill.difficulty}
        </strong>
      </div>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))" }}>
        {drills.map((item) => {
          const active = item.id === drill.id;
          return (
            <button
              key={item.id}
              type="button"
              className={active ? "glass-button" : ""}
              onClick={() => onChooseDrill(item.id)}
              style={{
                background: active ? `${accent}1f` : "rgba(0,0,0,.14)",
                border: `1px solid ${active ? accent : "rgba(255,255,255,.08)"}`,
                borderRadius: 8,
                color: active ? "#f8fbff" : "#93a4bf",
                cursor: "pointer",
                display: "grid",
                gap: 4,
                minHeight: 72,
                padding: 9,
                textAlign: "left",
              }}
            >
              <span style={{ color: active ? accent : "#7dd3fc", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{item.difficulty}</span>
              <strong style={{ color: "#f8fbff", fontSize: 11.5, lineHeight: 1.35 }}>{item.answer.pattern}</strong>
            </button>
          );
        })}
      </div>

      <section style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 9, padding: 11 }}>
        <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Question</div>
        <strong style={{ color: "#f8fbff", fontSize: 13.5, lineHeight: 1.45 }}>{drill.question}</strong>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {drill.tags.map((tag) => (
            <span key={tag} style={{ background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 999, color: "#93a4bf", fontSize: 10.5, fontWeight: 850, padding: "3px 7px" }}>
              {tag}
            </span>
          ))}
        </div>
      </section>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(270px, 100%), 1fr))" }}>
        <label style={{ color: "#dbeafe", display: "grid", fontSize: 11, fontWeight: 900, gap: 7, textTransform: "uppercase" }}>
          My answer
          <textarea
            value={answer}
            onChange={(event) => onAnswerChange(event.target.value)}
            rows={8}
            placeholder="Write the pattern, brute force, optimal invariant, dry run, edge cases, and complexity..."
            style={{
              background: "rgba(0,0,0,.18)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 8,
              color: "#f8fbff",
              fontSize: 12.5,
              lineHeight: 1.5,
              minHeight: 146,
              outline: "none",
              padding: "10px 11px",
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <ActionButton icon="ti-scale" label="Compare my answer" onClick={onCompare} disabled={!answer.trim()} tone={accent} />
            <ActionButton icon="ti-eye" label="Reveal answer" onClick={onReveal} tone="#facc15" />
            <ActionButton icon="ti-user-question" label="Practice as Mock" onClick={onPractice} tone="#a7f3d0" />
            <ActionButton icon="ti-arrow-right" label="Next question" onClick={onNext} tone="#93c5fd" />
          </div>
        </label>

        <section style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 8, padding: 11 }}>
          <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 8 }}>
            <strong style={{ color: accent, fontSize: 11, textTransform: "uppercase" }}>Comparison</strong>
            <span style={{ color: compared ? "#a7f3d0" : "#93a4bf", fontSize: 11, fontWeight: 900 }}>{compared ? `${comparison.score}%` : "Waiting"}</span>
          </div>
          <p style={{ color: "#dbeafe", fontSize: 11.5, lineHeight: 1.45, margin: 0 }}>
            {compared ? comparison.summary : "Compare after writing your answer. The rubric checks pattern, brute force, invariant, dry run, edge cases, and complexity."}
          </p>
          <div style={{ display: "grid", gap: 7 }}>
            {comparison.checks.map((check) => (
              <div key={check.label} style={{ alignItems: "start", background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 7, display: "grid", gap: 7, gridTemplateColumns: "18px 1fr", padding: 8 }}>
                <i className={`ti ${compared && check.covered ? "ti-circle-check" : "ti-circle"}`} style={{ color: compared && check.covered ? "#a7f3d0" : "#7d8aa2", fontSize: 15, marginTop: 1 }} />
                <span>
                  <strong style={{ color: "#f8fbff", display: "block", fontSize: 11.2 }}>{check.label}</strong>
                  <span style={{ color: "#93a4bf", display: "block", fontSize: 10.6, lineHeight: 1.35 }}>{compared ? check.feedback : "Not checked yet."}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {revealed ? (
        <section style={{ background: "rgba(0,0,0,.16)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 10, padding: 11 }}>
          <div style={{ color: "#facc15", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Ideal answer</div>
          <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(min(230px, 100%), 1fr))" }}>
            {[
              ["Pattern", drill.answer.pattern],
              ["Brute force", drill.answer.bruteForce],
              ["Optimal approach", drill.answer.optimalApproach],
              ["Dry run", drill.answer.dryRun],
              ["Complexity", drill.answer.complexity],
            ].map(([label, value]) => (
              <div key={label} style={{ border: "1px solid rgba(255,255,255,.075)", borderRadius: 7, display: "grid", gap: 5, padding: 9 }}>
                <strong style={{ color: accent, fontSize: 10.8, textTransform: "uppercase" }}>{label}</strong>
                <span style={{ color: "#dbeafe", fontSize: 11.4, lineHeight: 1.45 }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ border: "1px solid rgba(255,255,255,.075)", borderRadius: 7, display: "grid", gap: 6, padding: 9 }}>
            <strong style={{ color: "#facc15", fontSize: 10.8, textTransform: "uppercase" }}>Edge cases</strong>
            <ul style={{ color: "#dbeafe", fontSize: 11.4, lineHeight: 1.5, margin: 0, paddingLeft: 17 }}>
              {drill.answer.edgeCases.map((edgeCase) => <li key={edgeCase}>{edgeCase}</li>)}
            </ul>
          </div>
          <div style={{ border: "1px solid rgba(255,255,255,.075)", borderRadius: 7, display: "grid", gap: 7, minWidth: 0, padding: 9 }}>
            <strong style={{ color: "#a7f3d0", fontSize: 10.8, textTransform: "uppercase" }}>{drill.answer.code.language} code</strong>
            <pre style={{ color: "#dbeafe", fontSize: 11.3, lineHeight: 1.55, margin: 0, overflowX: "auto", whiteSpace: "pre" }}>
              <code>{drill.answer.code.code}</code>
            </pre>
          </div>
        </section>
      ) : null}
    </section>
  );
}

function InterviewChallengesPanel({
  accent,
  accentBorder,
  challenge,
  challenges,
  choiceId,
  error,
  filter,
  loading,
  score,
  source,
  onChooseChallenge,
  onChooseChoice,
  onFilter,
  onNext,
  onPractice,
  onRefresh,
}) {
  const answered = Boolean(choiceId);
  const correct = answered && choiceId === challenge?.correctChoiceId;
  const sourceLabel = loading ? "Generating" : source === "generated" ? "Generated" : source === "fallback" ? "Local fallback" : "Local bank";

  return (
    <section style={{ background: "rgba(255,255,255,.04)", border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 12, padding: 12 }}>
      <div style={{ alignItems: "start", display: "grid", gap: 12, gridTemplateColumns: "minmax(0, 1fr) auto" }}>
        <div>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Interview Challenges</div>
          <h3 style={{ color: "#f8fbff", fontSize: 16, lineHeight: 1.3, margin: "4px 0" }}>
            Tricky interview coding, MCQ, and quantitative questions.
          </h3>
          <p style={{ color: "#93a4bf", fontSize: 12, lineHeight: 1.5, margin: 0 }}>
            Pick the answer, read the trap, then move to the next pattern without leaving the visual lab.
          </p>
        </div>
        <div style={{ alignItems: "end", display: "grid", gap: 6, justifyItems: "end" }}>
          <strong style={{ background: "rgba(139,211,255,.08)", border: `1px solid ${accentBorder}`, borderRadius: 999, color: accent, fontSize: 11, fontWeight: 900, padding: "7px 10px", whiteSpace: "nowrap" }}>
            {score.correct}/{score.answered || 0} correct
          </strong>
          <span style={{ color: source === "generated" ? "#a7f3d0" : source === "fallback" ? "#facc15" : "#93a4bf", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
            {sourceLabel}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
        <ActionButton icon="ti-refresh" label={loading ? "Generating..." : "Refresh Questions"} onClick={onRefresh} disabled={loading} tone="#a7f3d0" />
        {CHALLENGE_FILTERS.map((item) => {
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={active ? "glass-button" : ""}
              onClick={() => onFilter(item.id)}
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
        {error ? (
          <span style={{ color: "#facc15", fontSize: 11, fontWeight: 850 }}>
            {error}
          </span>
        ) : null}
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))" }}>
        <section style={{ alignContent: "start", background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 9, padding: 11 }}>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Question bank</div>
          <div style={{ display: "grid", gap: 8 }}>
            {challenges.slice(0, 10).map((item) => {
              const active = item.id === challenge?.id;
              const tone = item.type === "coding" ? "#a7f3d0" : item.type === "quantitative" ? "#facc15" : accent;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={active ? "glass-button" : ""}
                  onClick={() => onChooseChallenge(item.id)}
                  style={{
                    background: active ? `${tone}1f` : "rgba(255,255,255,.035)",
                    border: `1px solid ${active ? tone : "rgba(255,255,255,.075)"}`,
                    borderRadius: 8,
                    color: active ? "#f8fbff" : "#dbeafe",
                    cursor: "pointer",
                    display: "grid",
                    gap: 5,
                    minHeight: 78,
                    padding: 10,
                    textAlign: "left",
                  }}
                >
                  <span style={{ color: tone, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
                    {item.typeLabel} · {item.difficulty}
                  </span>
                  <strong style={{ color: "#f8fbff", fontSize: 11.7, lineHeight: 1.35 }}>{item.title}</strong>
                  {item.tricky ? (
                    <span style={{ color: "#fda4af", fontSize: 10.5, fontWeight: 850 }}>Tricky interview trap</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ alignContent: "start", background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 11, minWidth: 0, padding: 11 }}>
          <div style={{ alignItems: "start", display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
            <div>
              <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>{challenge?.typeLabel}</div>
              <h4 style={{ color: "#f8fbff", fontSize: 16, lineHeight: 1.3, margin: "4px 0 0" }}>{challenge?.title}</h4>
            </div>
            <span style={{ background: correct ? "rgba(167,243,208,.1)" : answered ? "rgba(253,164,175,.1)" : "rgba(139,211,255,.08)", border: `1px solid ${correct ? "rgba(167,243,208,.35)" : answered ? "rgba(253,164,175,.3)" : accentBorder}`, borderRadius: 999, color: correct ? "#a7f3d0" : answered ? "#fda4af" : accent, fontSize: 11, fontWeight: 900, padding: "7px 10px" }}>
              {answered ? (correct ? "Correct" : "Review") : "Choose one"}
            </span>
          </div>

          <strong style={{ color: "#f8fbff", fontSize: 13.2, lineHeight: 1.45 }}>{challenge?.prompt}</strong>

          {challenge?.codeSnippet ? (
            <pre style={{ background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, color: "#dbeafe", fontSize: 11, lineHeight: 1.5, margin: 0, maxHeight: 220, overflow: "auto", padding: 10, whiteSpace: "pre" }}>
              <code>{challenge.codeSnippet}</code>
            </pre>
          ) : null}

          <div style={{ display: "grid", gap: 8 }}>
            {(challenge?.choices || []).map((choice) => {
              const selected = choice.id === choiceId;
              const isCorrectChoice = answered && choice.id === challenge.correctChoiceId;
              const tone = isCorrectChoice ? "#a7f3d0" : selected ? "#fda4af" : "rgba(255,255,255,.08)";
              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => onChooseChoice(choice.id)}
                  style={{
                    background: selected || isCorrectChoice ? `${tone}14` : "rgba(255,255,255,.035)",
                    border: `1px solid ${selected || isCorrectChoice ? tone : "rgba(255,255,255,.075)"}`,
                    borderRadius: 8,
                    color: "#dbeafe",
                    cursor: "pointer",
                    display: "grid",
                    gap: 7,
                    gridTemplateColumns: "24px 1fr",
                    minHeight: 46,
                    padding: 10,
                    textAlign: "left",
                  }}
                >
                  <strong style={{ color: selected || isCorrectChoice ? tone : accent, fontSize: 12, textTransform: "uppercase" }}>{choice.id}</strong>
                  <span style={{ fontSize: 11.7, lineHeight: 1.4 }}>{choice.text}</span>
                </button>
              );
            })}
          </div>

          {answered ? (
            <section style={{ background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 7, padding: 10 }}>
              <strong style={{ color: correct ? "#a7f3d0" : "#fda4af", fontSize: 11, textTransform: "uppercase" }}>
                {correct ? "Why it works" : "Trick to catch"}
              </strong>
              <span style={{ color: "#dbeafe", fontSize: 11.5, lineHeight: 1.5 }}>{challenge?.explanation}</span>
              <span style={{ color: "#facc15", fontSize: 11.2, lineHeight: 1.45 }}>Trick note: {challenge?.trick}</span>
            </section>
          ) : null}

          <ChallengeVisualExplanation challenge={challenge} choiceId={choiceId} accent={accent} />

          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <ActionButton icon="ti-arrow-right" label="Next question" onClick={onNext} tone="#93c5fd" />
            <ActionButton icon="ti-user-question" label="Practice as Mock" onClick={onPractice} tone="#a7f3d0" />
          </div>
        </section>
      </div>
    </section>
  );
}

function PatternAtlasPanel({
  accent,
  accentBorder,
  patterns,
  selectedPattern,
  selectedPatternId,
  decisionTree,
  complexityCheats,
  onSelectPattern,
  onPracticePattern,
}) {
  const visualItems = selectedPattern?.visualHint?.items || [];

  return (
    <section style={{ background: "rgba(255,255,255,.04)", border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 12, padding: 12 }}>
      <div style={{ alignItems: "start", display: "grid", gap: 12, gridTemplateColumns: "minmax(0, 1fr) auto" }}>
        <div>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>DSA Pattern Atlas</div>
          <h3 style={{ color: "#f8fbff", fontSize: 16, lineHeight: 1.3, margin: "4px 0" }}>
            Pick the pattern first, then the code becomes much easier to explain.
          </h3>
          <p style={{ color: "#93a4bf", fontSize: 12, lineHeight: 1.5, margin: 0 }}>
            A beginner-friendly map for choosing the right DSA idea from problem signals, examples, pitfalls, and complexity clues.
          </p>
        </div>
        <ActionButton icon="ti-target-arrow" label="Practice this pattern" onClick={() => onPracticePattern(selectedPattern?.drillId)} tone="#a7f3d0" />
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))" }}>
        <section style={{ alignContent: "start", background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 9, padding: 11 }}>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Pattern menu</div>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(138px, 1fr))" }}>
            {patterns.map((pattern) => {
              const active = pattern.id === selectedPatternId;
              return (
                <button
                  key={pattern.id}
                  type="button"
                  className={active ? "glass-button" : ""}
                  onClick={() => onSelectPattern(pattern.id)}
                  style={{
                    background: active ? `${accent}1f` : "rgba(255,255,255,.035)",
                    border: `1px solid ${active ? accent : "rgba(255,255,255,.075)"}`,
                    borderRadius: 8,
                    color: active ? "#f8fbff" : "#dbeafe",
                    cursor: "pointer",
                    display: "grid",
                    gap: 6,
                    minHeight: 106,
                    padding: 10,
                    textAlign: "left",
                  }}
                >
                  <span style={{ alignItems: "center", display: "flex", gap: 7, fontSize: 11.5, fontWeight: 900 }}>
                    <i className={`ti ${pattern.icon}`} style={{ color: active ? accent : "#7dd3fc", fontSize: 15 }} />
                    {pattern.title}
                  </span>
                  <span style={{ color: active ? "#a7f3d0" : "#93a4bf", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{pattern.difficulty}</span>
                  <span style={{ color: active ? "#dbeafe" : "#93a4bf", fontSize: 10.8, lineHeight: 1.4 }}>{pattern.memoryHook}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ alignContent: "start", background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 11, padding: 11 }}>
          <div style={{ alignItems: "start", display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
            <div>
              <div style={{ alignItems: "center", color: accent, display: "flex", fontSize: 11, fontWeight: 900, gap: 7, textTransform: "uppercase" }}>
                <i className={`ti ${selectedPattern?.icon || "ti-map"}`} />
                {selectedPattern?.difficulty || "Beginner"}
              </div>
              <h4 style={{ color: "#f8fbff", fontSize: 16, lineHeight: 1.3, margin: "4px 0 0" }}>{selectedPattern?.title}</h4>
            </div>
            <span style={{ background: "rgba(139,211,255,.08)", border: `1px solid ${accentBorder}`, borderRadius: 999, color: accent, fontSize: 11, fontWeight: 900, padding: "7px 10px" }}>
              Start here
            </span>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <strong style={{ color: "#a7f3d0", fontSize: 11, textTransform: "uppercase" }}>Beginner meaning</strong>
            <p style={{ color: "#dbeafe", fontSize: 12, lineHeight: 1.55, margin: 0 }}>{selectedPattern?.beginnerMeaning}</p>
          </div>

          <div style={{ background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
            <strong style={{ color: "#facc15", fontSize: 11, textTransform: "uppercase" }}>Visual hint</strong>
            <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
              {visualItems.map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  style={{
                    background: index === 0 || index === visualItems.length - 1 ? `${accent}1f` : "rgba(255,255,255,.045)",
                    border: `1px solid ${index === 0 || index === visualItems.length - 1 ? accent : "rgba(255,255,255,.08)"}`,
                    borderRadius: 7,
                    color: "#f8fbff",
                    display: "inline-grid",
                    flex: "0 0 auto",
                    fontSize: 11.5,
                    fontWeight: 900,
                    minHeight: 34,
                    minWidth: 42,
                    padding: "8px 9px",
                    placeItems: "center",
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(190px, 100%), 1fr))" }}>
            <section style={{ border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 7, padding: 10 }}>
              <strong style={{ color: "#a7f3d0", fontSize: 11, textTransform: "uppercase" }}>When to use it</strong>
              <ul style={{ color: "#dbeafe", fontSize: 11.4, lineHeight: 1.5, margin: 0, paddingLeft: 17 }}>
                {(selectedPattern?.whenToUse || []).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
            <section style={{ border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 7, padding: 10 }}>
              <strong style={{ color: "#fda4af", fontSize: 11, textTransform: "uppercase" }}>Common pitfalls</strong>
              <ul style={{ color: "#dbeafe", fontSize: 11.4, lineHeight: 1.5, margin: 0, paddingLeft: 17 }}>
                {(selectedPattern?.pitfalls || []).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          </div>

          <section style={{ border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 7, padding: 10 }}>
            <strong style={{ color: accent, fontSize: 11, textTransform: "uppercase" }}>Example questions</strong>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {(selectedPattern?.examples || []).map((example) => (
                <span key={example} style={{ background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 999, color: "#dbeafe", fontSize: 10.8, fontWeight: 850, lineHeight: 1.35, padding: "5px 8px" }}>
                  {example}
                </span>
              ))}
            </div>
          </section>
        </section>
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))" }}>
        <section style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 9, padding: 11 }}>
          <div>
            <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Pattern Identifier</div>
            <p style={{ color: "#93a4bf", fontSize: 11.5, lineHeight: 1.45, margin: "4px 0 0" }}>{decisionTree.subtitle}</p>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {decisionTree.steps.map((step, index) => (
              <article key={step.question} style={{ background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, display: "grid", gap: 7, padding: 9 }}>
                <span style={{ color: accent, fontSize: 10.5, fontWeight: 900 }}>Question {index + 1}</span>
                <strong style={{ color: "#f8fbff", fontSize: 11.8, lineHeight: 1.4 }}>{step.question}</strong>
                <span style={{ color: "#a7f3d0", fontSize: 10.8, lineHeight: 1.4 }}>Yes: {step.yes}</span>
                <span style={{ color: "#facc15", fontSize: 10.8, lineHeight: 1.4 }}>No: {step.no}</span>
              </article>
            ))}
          </div>
        </section>

        <section style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 9, padding: 11 }}>
          <div>
            <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Complexity board</div>
            <p style={{ color: "#93a4bf", fontSize: 11.5, lineHeight: 1.45, margin: "4px 0 0" }}>
              Use this to say time and space clearly before the interviewer asks.
            </p>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {complexityCheats.map((row) => (
              <article key={row.structure} style={{ border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 7, padding: 9 }}>
                <strong style={{ color: "#f8fbff", fontSize: 12 }}>{row.structure}</strong>
                <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fit, minmax(78px, 1fr))" }}>
                  {[
                    ["Access", row.access],
                    ["Search", row.search],
                    ["Insert", row.insert],
                    ["Delete", row.delete],
                  ].map(([label, value]) => (
                    <span key={label} style={{ background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 7, color: "#dbeafe", display: "grid", fontSize: 10.5, gap: 2, padding: "6px 7px" }}>
                      <strong style={{ color: accent, fontSize: 10, textTransform: "uppercase" }}>{label}</strong>
                      {value}
                    </span>
                  ))}
                </div>
                <span style={{ color: "#93a4bf", fontSize: 10.8, lineHeight: 1.4 }}>{row.beginnerNote}</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function DsaVisualPlaygroundPanel({
  accent,
  accentBorder,
  modules,
  selectedModule,
  selectedModuleId,
  bigOChart,
  operationComplexities,
  onSelectModule,
}) {
  const visualItems = selectedModule?.visualModel?.items || [];

  return (
    <section style={{ background: "rgba(255,255,255,.04)", border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 12, padding: 12 }}>
      <div style={{ alignItems: "start", display: "grid", gap: 12, gridTemplateColumns: "minmax(0, 1fr) auto" }}>
        <div>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>DSA Visual Playground</div>
          <h3 style={{ color: "#f8fbff", fontSize: 16, lineHeight: 1.3, margin: "4px 0" }}>
            Learn visually how each data structure behaves before memorizing the table.
          </h3>
          <p style={{ color: "#93a4bf", fontSize: 12, lineHeight: 1.5, margin: 0 }}>
            Use the module map, growth curve, and operation matrix to connect what you see with the complexity you say in interviews.
          </p>
          <p style={{ color: "#dbeafe", fontSize: 11.5, lineHeight: 1.45, margin: "5px 0 0" }}>
            Starter modules: ArrayList, Hash Table, Binary Heap, Union-Find, Sorting Algorithms.
          </p>
        </div>
        <strong style={{ background: "rgba(167,243,208,.09)", border: "1px solid rgba(167,243,208,.3)", borderRadius: 999, color: "#a7f3d0", fontSize: 11, fontWeight: 900, padding: "7px 10px", whiteSpace: "nowrap" }}>
          Learn visually
        </strong>
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))" }}>
        <section style={{ alignContent: "start", background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 9, padding: 11 }}>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Module map</div>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(138px, 1fr))" }}>
            {modules.map((module) => {
              const active = module.id === selectedModuleId;
              return (
                <button
                  key={module.id}
                  type="button"
                  className={active ? "glass-button" : ""}
                  onClick={() => onSelectModule(module.id)}
                  style={{
                    background: active ? `${accent}1f` : "rgba(255,255,255,.035)",
                    border: `1px solid ${active ? accent : "rgba(255,255,255,.075)"}`,
                    borderRadius: 8,
                    color: active ? "#f8fbff" : "#dbeafe",
                    cursor: "pointer",
                    display: "grid",
                    gap: 6,
                    minHeight: 104,
                    padding: 10,
                    textAlign: "left",
                  }}
                >
                  <span style={{ alignItems: "center", display: "flex", gap: 7, fontSize: 11.5, fontWeight: 900 }}>
                    <i className={`ti ${module.icon}`} style={{ color: active ? accent : "#7dd3fc", fontSize: 15 }} />
                    {module.title}
                  </span>
                  <span style={{ color: active ? "#a7f3d0" : "#93a4bf", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{module.category}</span>
                  <span style={{ color: active ? "#dbeafe" : "#93a4bf", fontSize: 10.8, lineHeight: 1.4 }}>{module.useWhen}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ alignContent: "start", background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 11, padding: 11 }}>
          <div style={{ alignItems: "start", display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
            <div>
              <div style={{ alignItems: "center", color: accent, display: "flex", fontSize: 11, fontWeight: 900, gap: 7, textTransform: "uppercase" }}>
                <i className={`ti ${selectedModule?.icon || "ti-layout-grid"}`} />
                {selectedModule?.category}
              </div>
              <h4 style={{ color: "#f8fbff", fontSize: 16, lineHeight: 1.3, margin: "4px 0 0" }}>{selectedModule?.title}</h4>
            </div>
            <span style={{ background: "rgba(139,211,255,.08)", border: `1px solid ${accentBorder}`, borderRadius: 999, color: accent, fontSize: 11, fontWeight: 900, padding: "7px 10px" }}>
              Visual model
            </span>
          </div>

          <p style={{ color: "#dbeafe", fontSize: 12, lineHeight: 1.55, margin: 0 }}>{selectedModule?.beginnerMeaning}</p>

          <div style={{ background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, display: "grid", gap: 8, minWidth: 0, padding: 10 }}>
            <strong style={{ color: "#facc15", fontSize: 11, textTransform: "uppercase" }}>{selectedModule?.visualModel?.type || "visual"}</strong>
            <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
              {visualItems.map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  style={{
                    background: index === 0 ? `${accent}1f` : "rgba(255,255,255,.045)",
                    border: `1px solid ${index === 0 ? accent : "rgba(255,255,255,.08)"}`,
                    borderRadius: 7,
                    color: "#f8fbff",
                    display: "inline-grid",
                    flex: "0 0 auto",
                    fontSize: 11.5,
                    fontWeight: 900,
                    minHeight: 36,
                    minWidth: 46,
                    padding: "8px 9px",
                    placeItems: "center",
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(190px, 100%), 1fr))" }}>
            <section style={{ border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 7, padding: 10 }}>
              <strong style={{ color: "#a7f3d0", fontSize: 11, textTransform: "uppercase" }}>Operations to practice</strong>
              <ul style={{ color: "#dbeafe", fontSize: 11.4, lineHeight: 1.5, margin: 0, paddingLeft: 17 }}>
                {(selectedModule?.operations || []).map((operation) => <li key={operation}>{operation}</li>)}
              </ul>
            </section>
            <section style={{ border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 7, padding: 10 }}>
              <strong style={{ color: "#fda4af", fontSize: 11, textTransform: "uppercase" }}>Beginner trap</strong>
              <span style={{ color: "#dbeafe", fontSize: 11.4, lineHeight: 1.5 }}>{selectedModule?.commonMistake}</span>
            </section>
          </div>

          <section style={{ border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 7, padding: 10 }}>
            <strong style={{ color: accent, fontSize: 11, textTransform: "uppercase" }}>Complexity hint</strong>
            <span style={{ color: "#dbeafe", fontSize: 11.4, lineHeight: 1.5 }}>{selectedModule?.complexityHint}</span>
          </section>
        </section>
      </div>

      <section style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 10, padding: 11 }}>
          <div>
            <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Big-O Cheat Sheet</div>
            <strong style={{ color: "#f8fbff", display: "block", fontSize: 12.5, lineHeight: 1.35, marginTop: 4 }}>Growth curve guide</strong>
            <p style={{ color: "#93a4bf", fontSize: 11.5, lineHeight: 1.45, margin: "4px 0 0" }}>{bigOChart.subtitle}</p>
          </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))" }}>
          {bigOChart.curves.map((curve, index) => {
            const tone = curve.rating === "Excellent" ? "#a7f3d0" : curve.rating === "Good" ? "#8bd3ff" : curve.rating === "Fair" ? "#facc15" : curve.rating === "Bad" ? "#fb923c" : "#fda4af";
            return (
              <article key={curve.label} style={{ background: "rgba(255,255,255,.035)", border: `1px solid ${tone}55`, borderRadius: 8, display: "grid", gap: 7, minHeight: 132, padding: 10 }}>
                <div style={{ alignItems: "end", display: "grid", gap: 3, gridTemplateColumns: "repeat(5, 1fr)", minHeight: 42 }}>
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <span key={bar} style={{ background: `${tone}55`, borderRadius: 5, display: "block", height: Math.min(42, 8 + (bar + index) * (index + 1.4)) }} />
                  ))}
                </div>
                <strong style={{ color: "#f8fbff", fontSize: 13 }}>{curve.label}</strong>
                <span style={{ color: tone, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{curve.rating} growth curve</span>
                <span style={{ color: "#93a4bf", fontSize: 10.8, lineHeight: 1.4 }}>{curve.example}: {curve.explanation}</span>
              </article>
            );
          })}
        </div>
        <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(min(210px, 100%), 1fr))" }}>
          {bigOChart.rules.map((rule) => (
            <div key={rule} style={{ alignItems: "start", background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 7, display: "grid", gap: 7, gridTemplateColumns: "18px 1fr", padding: 8 }}>
              <i className="ti ti-circle-check" style={{ color: "#a7f3d0", fontSize: 15, marginTop: 1 }} />
              <span style={{ color: "#dbeafe", fontSize: 11.2, lineHeight: 1.45 }}>{rule}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 9, minWidth: 0, padding: 11 }}>
        <div>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Operation matrix</div>
          <p style={{ color: "#93a4bf", fontSize: 11.5, lineHeight: 1.45, margin: "4px 0 0" }}>
            Average and worst-case costs for the structures beginners confuse most often.
          </p>
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))" }}>
          {operationComplexities.map((row) => (
            <article key={row.structure} style={{ border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 7, padding: 9 }}>
              <strong style={{ color: "#f8fbff", fontSize: 12 }}>{row.structure}</strong>
              <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fit, minmax(84px, 1fr))" }}>
                {[
                  ["Access", row.access],
                  ["Search", row.search],
                  ["Insert", row.insert],
                  ["Delete", row.delete],
                ].map(([label, value]) => (
                  <span key={label} style={{ background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 7, color: "#dbeafe", display: "grid", fontSize: 10.5, gap: 2, padding: "6px 7px" }}>
                    <strong style={{ color: accent, fontSize: 10, textTransform: "uppercase" }}>{label}</strong>
                    Avg {value.average}
                    <span style={{ color: "#93a4bf" }}>Worst {value.worst}</span>
                  </span>
                ))}
              </div>
              <span style={{ color: "#93a4bf", fontSize: 10.8, lineHeight: 1.4 }}>{row.note}</span>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export default function DsaVisualLab({ initialLessonId = "arrays", onPractice, theme = {}, profile = {}, beginnerMode = false, beginnerStep = "watch", onBeginnerStepChange, onActivity }) {
  const lessons = useMemo(() => listDsaVisualLessons(), []);
  const blind75Problems = useMemo(() => listBlind75Problems(), []);
  const blind75Visualizers = useMemo(() => listBlind75Visualizers(), []);
  const fallbackLessonId = lessons.some((lesson) => lesson.id === initialLessonId) ? initialLessonId : "arrays";
  const isKnownLessonId = (lessonId) => (
    lessons.some((lessonItem) => lessonItem.id === lessonId)
    || blind75Problems.some((problem) => problem.lessonId === lessonId)
  );
  const defaultLessonId = (() => {
    const savedLessonId = loadDsaLessonId(getStorage());
    return isKnownLessonId(savedLessonId) ? savedLessonId : fallbackLessonId;
  })();
  const [selectedLessonId, setSelectedLessonId] = useState(() => {
    return defaultLessonId;
  });
  const [track, setTrack] = useState(() => defaultLessonId.startsWith("blind75-") ? "blind75" : "core");
  const [blind75Filter, setBlind75Filter] = useState("featured");
  const [confidenceState, setConfidenceState] = useState(() => loadDsaConfidenceState(getStorage()));
  const [revealedTestCases, setRevealedTestCases] = useState({});
  const [inputValue, setInputValue] = useState(() => formatInputValue(buildDsaVisualizationState(defaultLessonId).input));
  const [approachExplanation, setApproachExplanation] = useState("");
  const [explanationJudged, setExplanationJudged] = useState(false);
  const [selectedDrillId, setSelectedDrillId] = useState("drill-arrays");
  const [drillAnswer, setDrillAnswer] = useState("");
  const [drillRevealed, setDrillRevealed] = useState(false);
  const [drillCompared, setDrillCompared] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState("challenge-arrays-mcq");
  const [challengeChoiceId, setChallengeChoiceId] = useState("");
  const [challengeFilter, setChallengeFilter] = useState("all");
  const [challengeScore, setChallengeScore] = useState({ answered: 0, correct: 0 });
  const [generatedChallenges, setGeneratedChallenges] = useState([]);
  const [challengeSource, setChallengeSource] = useState("local");
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [challengeError, setChallengeError] = useState("");
  const [selectedPatternId, setSelectedPatternId] = useState("sliding-window");
  const [selectedPlaygroundModuleId, setSelectedPlaygroundModuleId] = useState("array-list");
  const [stepIndex, setStepIndex] = useState(0);
  const [stage, setStage] = useState("Visualize");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1200);
  const [visualMode, setVisualMode] = useState("reel");
  const [reelTone, setReelTone] = useState("beginner");
  const accent = theme.accentStrong || "#8bd3ff";
  const accentBorder = theme.accentBorder || "rgba(139, 211, 255, .28)";
  const lesson = useMemo(() => getDsaVisualLesson(selectedLessonId), [selectedLessonId]);
  const state = useMemo(
    () => buildDsaVisualizationState(selectedLessonId, inputValue),
    [selectedLessonId, inputValue],
  );
  const currentStep = state.steps[Math.min(stepIndex, state.steps.length - 1)] || state.steps[0];
  const dryRunRows = useMemo(() => buildDryRunRows(state.steps, state.input), [state.steps, state.input]);
  const stackText = profile?.stack || "";
  const selectedCode = useMemo(() => getDsaCodeTemplate(lesson, stackText), [lesson, stackText]);
  const drillQuestions = useMemo(() => listDsaDrillQuestions({ stack: stackText }), [stackText]);
  const selectedDrill = useMemo(
    () => drillQuestions.find((drill) => drill.id === selectedDrillId) || drillQuestions[0],
    [drillQuestions, selectedDrillId],
  );
  const drillComparison = useMemo(
    () => buildDsaDrillComparison({ drill: selectedDrill, response: drillAnswer }),
    [selectedDrill, drillAnswer],
  );
  const interviewChallenges = useMemo(() => listDsaInterviewChallenges({ stack: stackText }), [stackText]);
  const activeInterviewChallenges = generatedChallenges.length ? generatedChallenges : interviewChallenges;
  const filteredInterviewChallenges = useMemo(() => {
    if (challengeFilter === "tricky") return activeInterviewChallenges.filter((challenge) => challenge.tricky);
    if (challengeFilter === "all") return activeInterviewChallenges;
    return activeInterviewChallenges.filter((challenge) => challenge.type === challengeFilter);
  }, [activeInterviewChallenges, challengeFilter]);
  const selectedChallenge = useMemo(
    () => filteredInterviewChallenges.find((challenge) => challenge.id === selectedChallengeId)
      || activeInterviewChallenges.find((challenge) => challenge.id === selectedChallengeId)
      || filteredInterviewChallenges[0]
      || activeInterviewChallenges[0],
    [activeInterviewChallenges, filteredInterviewChallenges, selectedChallengeId],
  );
  const patternAtlas = useMemo(() => listDsaPatternAtlas(), []);
  const selectedPattern = useMemo(
    () => patternAtlas.find((pattern) => pattern.id === selectedPatternId) || patternAtlas[0],
    [patternAtlas, selectedPatternId],
  );
  const patternDecisionTree = useMemo(() => buildDsaPatternDecisionTree(), []);
  const complexityCheats = useMemo(() => listDsaComplexityCheats(), []);
  const playgroundModules = useMemo(() => listDsaVisualPlaygroundModules(), []);
  const selectedPlaygroundModule = useMemo(
    () => playgroundModules.find((module) => module.id === selectedPlaygroundModuleId) || playgroundModules[0],
    [playgroundModules, selectedPlaygroundModuleId],
  );
  const bigOChart = useMemo(() => buildDsaBigOChart(), []);
  const operationComplexities = useMemo(() => listDsaOperationComplexities(), []);
  const thinkingSystem = useMemo(() => buildDsaThinkingSystem({
    lesson,
    stack: stackText,
  }), [lesson, stackText]);
  const thinkingSteps = thinkingSystem.steps.length
    ? thinkingSystem.steps
    : THINKING_METHOD_LABELS.map((label) => ({ label, coach: "Use this step before moving to code.", say: label }));
  const explainThenCodeCoach = useMemo(() => buildDsaExplainThenCodeCoach({
    lesson,
    stack: stackText,
    explanation: approachExplanation,
  }), [lesson, stackText, approachExplanation]);
  const mockPrompt = useMemo(() => buildDsaMockPrompt(lesson), [lesson]);
  const progressSummary = useMemo(() => buildDsaProgressSummary(confidenceState), [confidenceState]);
  const visibleBlind75Problems = useMemo(
    () => filterBlind75Problems({
      ...resolveBlind75Filter(blind75Filter),
      state: confidenceState,
    }),
    [blind75Filter, confidenceState],
  );
  const currentBlind75Problem = useMemo(
    () => lesson.blind75 ? blind75Problems.find((problem) => problem.id === lesson.problemId) : null,
    [lesson, blind75Problems],
  );
  const currentVisualizer = useMemo(
    () => currentBlind75Problem ? blind75Visualizers.find((visualizer) => visualizer.id === currentBlind75Problem.visualizerId) : null,
    [currentBlind75Problem, blind75Visualizers],
  );
  const currentProblemProgress = useMemo(
    () => currentBlind75Problem ? getDsaProblemProgress(confidenceState, currentBlind75Problem.id) : null,
    [confidenceState, currentBlind75Problem],
  );
  const currentWalkthrough = useMemo(() => {
    const steps = lesson.codeWalkthrough || [];
    return steps.find((item) => item.visualStep === stepIndex) || steps[Math.min(stepIndex, steps.length - 1)] || null;
  }, [lesson, stepIndex]);

  const refreshGeneratedChallenges = useCallback(async () => {
    setChallengeLoading(true);
    setChallengeError("");

    try {
      const response = await fetch("/api/dsa-challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stack: stackText || "JavaScript",
          count: 12,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !Array.isArray(data.challenges) || !data.challenges.length) {
        throw new Error(data.error || "Could not generate fresh questions.");
      }

      setGeneratedChallenges(data.challenges);
      setSelectedChallengeId(data.challenges[0]?.id || "challenge-arrays-mcq");
      setChallengeChoiceId("");
      setChallengeSource("generated");
    } catch (error) {
      setGeneratedChallenges([]);
      setSelectedChallengeId("challenge-arrays-mcq");
      setChallengeChoiceId("");
      setChallengeSource("fallback");
      setChallengeError("Local fallback");
    } finally {
      setChallengeLoading(false);
    }
  }, [stackText]);

  useEffect(() => {
    refreshGeneratedChallenges();
  }, [refreshGeneratedChallenges]);

  useEffect(() => {
    saveDsaLessonId(getStorage(), selectedLessonId);
  }, [selectedLessonId]);

  useEffect(() => {
    saveDsaConfidenceState(getStorage(), confidenceState);
  }, [confidenceState]);

  useEffect(() => {
    setInputValue(formatInputValue(buildDsaVisualizationState(selectedLessonId).input));
    setApproachExplanation("");
    setExplanationJudged(false);
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

  const chooseThinkingLesson = (lessonId) => {
    setTrack("thinking");
    setSelectedLessonId(lessonId);
  };

  const chooseTrack = (nextTrack) => {
    setTrack(nextTrack);
    setSelectedLessonId((lessonId) => {
      if (nextTrack === "blind75") {
        return String(lessonId).startsWith("blind75-") ? lessonId : "blind75-two-sum";
      }
      if (nextTrack === "thinking") {
        return isKnownLessonId(lessonId) ? lessonId : fallbackLessonId;
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

  const practiceThinkingAsMock = () => {
    setStage("Practice as Mock");
    onPractice?.(thinkingSystem.mockPrompt, { lesson, problem: currentBlind75Problem, thinkingSystem, language: thinkingSystem.code.language });
  };

  const chooseDrill = (drillId) => {
    setSelectedDrillId(drillId);
    setDrillAnswer("");
    setDrillRevealed(false);
    setDrillCompared(false);
    setStage("Drill Room");
  };

  const updateDrillAnswer = (value) => {
    setDrillAnswer(value);
    setDrillCompared(false);
  };

  const compareDrillAnswer = () => {
    setStage("Drill Room");
    setDrillCompared(true);
  };

  const revealDrillAnswer = () => {
    setStage("Drill Room");
    setDrillRevealed(true);
  };

  const nextDrill = () => {
    const index = drillQuestions.findIndex((drill) => drill.id === selectedDrill.id);
    const nextQuestion = drillQuestions[(index + 1) % drillQuestions.length] || drillQuestions[0];
    chooseDrill(nextQuestion.id);
  };

  const practiceDrillAsMock = () => {
    setStage("Practice as Mock");
    onPractice?.(buildDsaDrillMockPrompt(selectedDrill), {
      drill: selectedDrill,
      response: drillAnswer,
      comparison: drillComparison,
      language: selectedDrill.answer.code.language,
    });
  };

  const chooseChallenge = (challengeId) => {
    setSelectedChallengeId(challengeId);
    setChallengeChoiceId("");
    setStage("Interview Challenges");
  };

  const filterChallenges = (filterId) => {
    setChallengeFilter(filterId);
    setChallengeChoiceId("");
    setStage("Interview Challenges");
  };

  const chooseChallengeChoice = (choiceId) => {
    if (challengeChoiceId || !selectedChallenge) return;
    setChallengeChoiceId(choiceId);
    setChallengeScore((value) => ({
      answered: value.answered + 1,
      correct: value.correct + (choiceId === selectedChallenge.correctChoiceId ? 1 : 0),
    }));
  };

  const nextChallenge = () => {
    const challengeList = filteredInterviewChallenges.length ? filteredInterviewChallenges : activeInterviewChallenges;
    const index = challengeList.findIndex((challenge) => challenge.id === selectedChallenge?.id);
    const nextItem = challengeList[(index + 1) % challengeList.length] || challengeList[0];
    setSelectedChallengeId(nextItem?.id || "challenge-arrays-mcq");
    setChallengeChoiceId("");
    setStage("Interview Challenges");
  };

  const practiceChallengeAsMock = () => {
    setStage("Practice as Mock");
    onPractice?.(buildDsaInterviewChallengeMockPrompt(selectedChallenge), {
      challenge: selectedChallenge,
      response: challengeChoiceId,
      language: stackText || "JavaScript",
    });
  };

  const judgeExplanation = () => {
    setStage("Explain-Then-Code");
    setExplanationJudged(true);
  };

  const toggleMasteryStep = (stepId) => {
    if (!currentBlind75Problem) return;
    const completed = Boolean(currentProblemProgress?.mastery?.[stepId]);
    setConfidenceState((value) => recordDsaMasteryStep(value, currentBlind75Problem.id, stepId, !completed));
    onActivity?.({
      workspaceId: "dsaLab",
      type: !completed ? "practice" : "review",
      label: !completed ? "Marked DSA mastery step" : "Reopened DSA mastery step",
      detail: currentBlind75Problem.title,
    });
  };

  const markWeakSpot = () => {
    if (!currentBlind75Problem) return;
    setConfidenceState((value) => recordDsaMistake(value, currentBlind75Problem.id, {
      type: `Needs replay: ${currentStep?.title || currentBlind75Problem.pattern}`,
      note: currentStep?.interviewScript || "Replay the invariant, dry run, and edge cases before retrying.",
    }));
    onActivity?.({
      workspaceId: "dsaLab",
      type: "review",
      label: "Marked DSA weak spot",
      detail: currentBlind75Problem.title,
    });
  };

  const markTestCaseMastered = (testCaseId) => {
    if (!currentBlind75Problem) return;
    setConfidenceState((value) => recordDsaTestCaseMastery(value, currentBlind75Problem.id, testCaseId));
    onActivity?.({
      workspaceId: "dsaLab",
      type: "practice",
      label: "Mastered DSA test case",
      detail: currentBlind75Problem.title,
    });
  };

  const toggleExpected = (testCaseId) => {
    const key = `${currentBlind75Problem?.id || "core"}:${testCaseId}`;
    setRevealedTestCases((value) => ({ ...value, [key]: !value[key] }));
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
        overflow: "visible",
        padding: 14,
        textAlign: "left",
        touchAction: "pan-y",
        width: "100%",
      }}
    >
      <BeginnerGuideBanner
        enabled={beginnerMode}
        accent={accent}
        currentStep={beginnerStep}
        onStepSelect={onBeginnerStepChange}
        detail="For DSA: watch the pointer or state move, predict the next step, explain the invariant, practice one input, then review the missed edge case."
      />

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

      {stage === "Drill Room" ? (
        <DrillRoomPanel
          accent={accent}
          accentBorder={accentBorder}
          drill={selectedDrill}
          drills={drillQuestions}
          answer={drillAnswer}
          comparison={drillComparison}
          compared={drillCompared}
          revealed={drillRevealed}
          onAnswerChange={updateDrillAnswer}
          onChooseDrill={chooseDrill}
          onCompare={compareDrillAnswer}
          onNext={nextDrill}
          onPractice={practiceDrillAsMock}
          onReveal={revealDrillAnswer}
        />
      ) : null}

      {stage === "Interview Challenges" ? (
        <InterviewChallengesPanel
          accent={accent}
          accentBorder={accentBorder}
          challenge={selectedChallenge}
          challenges={filteredInterviewChallenges}
          choiceId={challengeChoiceId}
          error={challengeError}
          filter={challengeFilter}
          loading={challengeLoading}
          score={challengeScore}
          source={challengeSource}
          onChooseChallenge={chooseChallenge}
          onChooseChoice={chooseChallengeChoice}
          onFilter={filterChallenges}
          onNext={nextChallenge}
          onPractice={practiceChallengeAsMock}
          onRefresh={refreshGeneratedChallenges}
        />
      ) : null}

      {stage === "Pattern Atlas" ? (
        <PatternAtlasPanel
          accent={accent}
          accentBorder={accentBorder}
          patterns={patternAtlas}
          selectedPattern={selectedPattern}
          selectedPatternId={selectedPatternId}
          decisionTree={patternDecisionTree}
          complexityCheats={complexityCheats}
          onSelectPattern={setSelectedPatternId}
          onPracticePattern={chooseDrill}
        />
      ) : null}

      {stage === "Visual Playground" || stage === "Big-O Board" ? (
        <DsaVisualPlaygroundPanel
          accent={accent}
          accentBorder={accentBorder}
          modules={playgroundModules}
          selectedModule={selectedPlaygroundModule}
          selectedModuleId={selectedPlaygroundModuleId}
          bigOChart={bigOChart}
          operationComplexities={operationComplexities}
          onSelectModule={setSelectedPlaygroundModuleId}
        />
      ) : null}

      {track === "thinking" ? (
        <section style={{ background: "rgba(255,255,255,.035)", border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 12, padding: 12 }}>
          <div style={{ alignItems: "start", display: "grid", gap: 12, gridTemplateColumns: "minmax(0, 1fr) auto" }}>
            <div>
              <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>DSA Thinking System</div>
              <h3 style={{ color: "#f8fbff", fontSize: 16, lineHeight: 1.3, margin: "4px 0" }}>
                Learn how to approach {thinkingSystem.lessonTitle} before touching code.
              </h3>
              <p style={{ color: "#93a4bf", fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                {thinkingSystem.subtitle}
              </p>
            </div>
            <ActionButton icon="ti-user-question" label="Practice method" onClick={practiceThinkingAsMock} tone="#a7f3d0" />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Pick a pattern to learn</div>
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(138px, 1fr))" }}>
              {lessons.map((item) => {
                const active = item.id === selectedLessonId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={active ? "glass-button" : ""}
                    onClick={() => chooseThinkingLesson(item.id)}
                    style={{
                      background: active ? `${accent}1f` : "rgba(0,0,0,.14)",
                      border: `1px solid ${active ? accent : "rgba(255,255,255,.08)"}`,
                      borderRadius: 8,
                      color: active ? "#f8fbff" : "#93a4bf",
                      cursor: "pointer",
                      display: "grid",
                      gap: 5,
                      minHeight: 76,
                      padding: 9,
                      textAlign: "left",
                    }}
                  >
                    <span style={{ alignItems: "center", display: "flex", gap: 7, fontSize: 11.5, fontWeight: 900 }}>
                      <i className={`ti ${item.icon}`} style={{ color: active ? accent : "#7d8aa2" }} />
                      {item.title}
                    </span>
                    <span style={{ color: active ? accent : "#7d8aa2", fontSize: 10.5, fontWeight: 850 }}>
                      {item.complexity.time} / {item.complexity.space}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(230px, 100%), 1fr))" }}>
            <section style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 8, padding: 11 }}>
              <div style={{ color: "#a7f3d0", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Pattern signals</div>
              {thinkingSystem.patternSignals.map((signal) => (
                <div key={signal} style={{ alignItems: "start", display: "grid", gap: 7, gridTemplateColumns: "18px 1fr" }}>
                  <i className="ti ti-circle-check" style={{ color: "#a7f3d0", fontSize: 15, marginTop: 1 }} />
                  <span style={{ color: "#dbeafe", fontSize: 11.5, lineHeight: 1.45 }}>{signal}</span>
                </div>
              ))}
            </section>

            <section style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 8, padding: 11 }}>
              <div style={{ color: "#facc15", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>What to say in interview</div>
              <p style={{ color: "#dbeafe", fontSize: 11.5, lineHeight: 1.55, margin: 0, whiteSpace: "pre-line" }}>
                {thinkingSystem.interviewScript}
              </p>
            </section>
          </div>

          <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(min(190px, 100%), 1fr))" }}>
            {thinkingSteps.map((step, index) => (
              <article key={step.label} style={{ background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 7, minHeight: 138, padding: 11 }}>
                <span style={{ color: accent, fontSize: 10.5, fontWeight: 900 }}>Step {index + 1}</span>
                <strong style={{ color: "#f8fbff", fontSize: 12.5, lineHeight: 1.35 }}>{step.label}</strong>
                <span style={{ color: "#93a4bf", fontSize: 11.2, lineHeight: 1.45 }}>{step.coach}</span>
                <span style={{ borderTop: "1px solid rgba(255,255,255,.07)", color: "#dbeafe", fontSize: 10.8, lineHeight: 1.4, paddingTop: 7 }}>
                  Say: {step.say}
                </span>
              </article>
            ))}
          </div>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))" }}>
            <section style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 8, padding: 11 }}>
              <div style={{ color: "#facc15", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Test like an interviewer</div>
              {thinkingSystem.edgeCases.map((edgeCase) => (
                <div key={edgeCase} style={{ alignItems: "start", display: "grid", gap: 7, gridTemplateColumns: "18px 1fr" }}>
                  <i className="ti ti-alert-circle" style={{ color: "#facc15", fontSize: 15, marginTop: 1 }} />
                  <span style={{ color: "#dbeafe", fontSize: 11.2, lineHeight: 1.45 }}>{edgeCase}</span>
                </div>
              ))}
            </section>

            <section style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 8, minWidth: 0, padding: 11 }}>
              <div style={{ alignItems: "center", color: accent, display: "flex", fontSize: 11, fontWeight: 900, gap: 7, justifyContent: "space-between", textTransform: "uppercase", flexWrap: "wrap" }}>
              <span>Selected stack code</span>
                <span style={{ color: "#a7f3d0" }}>{thinkingSystem.code.language}</span>
              </div>
              <p style={{ color: "#93a4bf", fontSize: 11.5, lineHeight: 1.45, margin: 0 }}>
                Use this after the invariant and dry run are clear, then explain the complexity out loud.
              </p>
              <pre style={{ color: "#dbeafe", fontSize: 11.5, lineHeight: 1.55, margin: 0, overflowX: "auto", whiteSpace: "pre" }}>
                <code>{thinkingSystem.code.code}</code>
              </pre>
            </section>
          </div>
        </section>
      ) : track === "core" ? (
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
            <div style={{ alignItems: "center", display: "flex", gap: 7, flexWrap: "wrap" }}>
              <span style={{ background: "rgba(167,243,208,.09)", border: "1px solid rgba(167,243,208,.3)", borderRadius: 999, color: "#a7f3d0", fontSize: 11, fontWeight: 900, padding: "7px 9px" }}>
                {progressSummary.mastered}/75 mastered
              </span>
              <span style={{ background: "rgba(253,164,175,.09)", border: "1px solid rgba(253,164,175,.3)", borderRadius: 999, color: "#fda4af", fontSize: 11, fontWeight: 900, padding: "7px 9px" }}>
                {progressSummary.weak} weak
              </span>
              <span style={{ background: "rgba(139,211,255,.08)", border: "1px solid rgba(139,211,255,.26)", borderRadius: 999, color: accent, fontSize: 11, fontWeight: 900, padding: "7px 9px" }}>
                {progressSummary.notStarted} not started
              </span>
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

          <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(178px, 1fr))" }}>
            {visibleBlind75Problems.map((problem) => {
              const active = problem.lessonId === selectedLessonId;
              const progress = getDsaProblemProgress(confidenceState, problem.id);
              const tone = statusTone(progress.status, accent);
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
                  <span style={{ color: tone, fontSize: 10.5, fontWeight: 900 }}>
                    {statusLabel(progress.status)}
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

      {stage === "Explain-Then-Code" ? (
        <section style={{ background: "rgba(255,255,255,.04)", border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 12, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Explain-Then-Code Mode</div>
              <h3 style={{ color: "#f8fbff", fontSize: 15.5, lineHeight: 1.3, margin: "4px 0" }}>Explain first. Code only after the approach is interview-ready.</h3>
              <p style={{ color: "#93a4bf", fontSize: 12, lineHeight: 1.45, margin: 0 }}>{explainThenCodeCoach.summary}</p>
            </div>
            <strong style={{ background: explanationJudged ? "rgba(167,243,208,.1)" : "rgba(250,204,21,.1)", border: `1px solid ${explanationJudged ? "rgba(167,243,208,.35)" : "rgba(250,204,21,.28)"}`, borderRadius: 999, color: explanationJudged ? "#a7f3d0" : "#facc15", fontSize: 11, fontWeight: 900, padding: "7px 10px" }}>
              {explanationJudged ? `${explainThenCodeCoach.judge.score}% explanation` : "Explain before code"}
            </strong>
          </div>

          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            {explainThenCodeCoach.flow.map((item, index) => (
              <div key={item.label} style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 6, padding: 10 }}>
                <span style={{ color: accent, fontSize: 10.5, fontWeight: 900 }}>Step {index + 1}</span>
                <strong style={{ color: "#f8fbff", fontSize: 12 }}>{item.label}</strong>
                <span style={{ color: "#93a4bf", fontSize: 10.8, lineHeight: 1.4 }}>{item.detail}</span>
              </div>
            ))}
          </div>

          <ExplainReadinessChecklist
            explanation={approachExplanation}
            judged={explanationJudged}
            score={explainThenCodeCoach.judge.score}
            accent={accent}
          />

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))" }}>
            <label style={{ color: "#dbeafe", display: "grid", fontSize: 11, fontWeight: 900, gap: 7, textTransform: "uppercase" }}>
              Explain approach
              <textarea
                value={approachExplanation}
                onChange={(event) => {
                  setApproachExplanation(event.target.value);
                  setExplanationJudged(false);
                }}
                rows={7}
                placeholder="Example: I use a HashMap. The invariant is... I handle empty and duplicate values... Time is O(n), space is O(n), and the trade-off is..."
                style={{
                  background: "rgba(0,0,0,.18)",
                  border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: 8,
                  color: "#f8fbff",
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  minHeight: 132,
                  outline: "none",
                  padding: "10px 11px",
                  resize: "vertical",
                }}
              />
              <button type="button" className="glass-button" onClick={judgeExplanation} disabled={!approachExplanation.trim()} style={{ border: `1px solid ${accentBorder}`, borderRadius: 8, color: approachExplanation.trim() ? "#f8fbff" : "#64748b", cursor: approachExplanation.trim() ? "pointer" : "not-allowed", fontSize: 11.5, fontWeight: 900, padding: "9px 10px", textAlign: "left" }}>
                <i className="ti ti-scale" /> Judge explanation
              </button>
            </label>

            <section style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 8, padding: 11 }}>
              <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong style={{ color: accent, fontSize: 11, textTransform: "uppercase" }}>Judge explanation</strong>
                <span style={{ color: explanationJudged ? "#a7f3d0" : "#93a4bf", fontSize: 11, fontWeight: 900 }}>{explanationJudged ? `${explainThenCodeCoach.judge.score}%` : "Waiting"}</span>
              </div>
              <p style={{ color: "#dbeafe", fontSize: 11.5, lineHeight: 1.45, margin: 0 }}>
                {explanationJudged ? explainThenCodeCoach.judge.verdict : "Write your approach, then judge it before opening the template."}
              </p>
              <div style={{ display: "grid", gap: 7 }}>
                {explainThenCodeCoach.judge.checks.map((check) => (
                  <div key={check.label} style={{ alignItems: "start", background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 7, display: "grid", gap: 7, gridTemplateColumns: "18px 1fr", padding: 8 }}>
                    <i className={`ti ${explanationJudged && check.covered ? "ti-circle-check" : "ti-circle"}`} style={{ color: explanationJudged && check.covered ? "#a7f3d0" : "#7d8aa2", fontSize: 15, marginTop: 1 }} />
                    <span>
                      <strong style={{ color: "#f8fbff", display: "block", fontSize: 11.2 }}>{check.label}</strong>
                      <span style={{ color: "#93a4bf", display: "block", fontSize: 10.6, lineHeight: 1.35 }}>{explanationJudged ? (check.covered ? check.evidence : check.coaching) : check.coaching}</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))" }}>
            <section style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 8, padding: 11, minWidth: 0 }}>
              <div style={{ alignItems: "center", color: accent, display: "flex", fontSize: 11, fontWeight: 900, gap: 7, justifyContent: "space-between", textTransform: "uppercase", flexWrap: "wrap" }}>
                <span>Show code template</span>
                <span style={{ color: "#a7f3d0" }}>{explainThenCodeCoach.code.language}</span>
              </div>
              {explanationJudged ? (
                <CodeSyncBlock code={explainThenCodeCoach.code} walkthrough={currentWalkthrough} stepIndex={stepIndex} accent={accent} />
              ) : (
                <p style={{ color: "#93a4bf", fontSize: 12, lineHeight: 1.45, margin: 0 }}>
                  Code locked until you judge the explanation. This keeps the interview habit: approach first, template second.
                </p>
              )}
            </section>

            <section style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 8, padding: 11 }}>
              <div style={{ color: "#facc15", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Quiz edge cases</div>
              {explainThenCodeCoach.edgeQuiz.slice(0, 3).map((item) => (
                <div key={item.id} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 7, display: "grid", gap: 5, padding: 8 }}>
                  <span style={{ color: item.type === "edge" ? "#facc15" : "#93c5fd", fontSize: 10.2, fontWeight: 900, textTransform: "uppercase" }}>{item.type}</span>
                  <strong style={{ color: "#f8fbff", fontSize: 11.4, lineHeight: 1.35 }}>{item.prompt}</strong>
                  <span style={{ color: "#93a4bf", fontSize: 10.8, lineHeight: 1.4 }}>{explanationJudged ? `Expected: ${item.expected}. ${item.why}` : "Judge explanation first, then answer this case out loud."}</span>
                </div>
              ))}
            </section>
          </div>
        </section>
      ) : null}

      {currentBlind75Problem ? (
        <section style={{ background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 12, padding: 12 }}>
          <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
            <div>
              <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Pattern Mastery Mode</div>
              <p style={{ color: "#93a4bf", fontSize: 12, lineHeight: 1.45, margin: "4px 0 0" }}>
                Mark each interview-ready behavior when you can do it without hesitation.
              </p>
            </div>
            <button
              type="button"
              className="glass-button"
              onClick={markWeakSpot}
              style={{
                background: "rgba(253,164,175,.1)",
                border: "1px solid rgba(253,164,175,.35)",
                borderRadius: 7,
                color: "#fda4af",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 900,
                padding: "8px 10px",
              }}
            >
              <i className="ti ti-alert-triangle" /> Mark weak spot
            </button>
          </div>

          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))" }}>
            {(lesson.masteryChecklist || []).map((item) => {
              const completed = Boolean(currentProblemProgress?.mastery?.[item.id]);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={completed ? "glass-button" : ""}
                  onClick={() => toggleMasteryStep(item.id)}
                  style={{
                    background: completed ? "rgba(167,243,208,.11)" : "rgba(0,0,0,.14)",
                    border: `1px solid ${completed ? "rgba(167,243,208,.38)" : "rgba(255,255,255,.08)"}`,
                    borderRadius: 8,
                    color: completed ? "#d1fae5" : "#dbeafe",
                    cursor: "pointer",
                    display: "grid",
                    gap: 6,
                    minHeight: 86,
                    padding: 10,
                    textAlign: "left",
                  }}
                >
                  <span style={{ alignItems: "center", display: "flex", gap: 7, fontSize: 11.5, fontWeight: 900 }}>
                    <i className={`ti ${completed ? "ti-circle-check" : "ti-circle"}`} style={{ color: completed ? "#a7f3d0" : "#7d8aa2" }} />
                    {item.label}
                  </span>
                  <span style={{ color: completed ? "#a7f3d0" : "#93a4bf", fontSize: 10.8, lineHeight: 1.4 }}>{item.coach}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(230px, 100%), 1fr))" }}>
            <section style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 8, padding: 11 }}>
              <div style={{ color: "#fda4af", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Mistake Replay</div>
              {(currentProblemProgress?.mistakes || []).length ? (
                <div style={{ display: "grid", gap: 7 }}>
                  {currentProblemProgress.mistakes.slice(0, 3).map((mistake) => (
                    <div key={mistake.id} style={{ background: "rgba(253,164,175,.07)", border: "1px solid rgba(253,164,175,.18)", borderRadius: 7, display: "grid", gap: 4, padding: 8 }}>
                      <strong style={{ color: "#fecdd3", fontSize: 11.5, lineHeight: 1.35 }}>{mistake.type}</strong>
                      <span style={{ color: "#dbeafe", fontSize: 10.8, lineHeight: 1.45 }}>{mistake.note}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#93a4bf", fontSize: 12, lineHeight: 1.45, margin: 0 }}>
                  No mistakes saved yet. Use Mark weak spot when a dry run, invariant, or edge case feels shaky.
                </p>
              )}
            </section>

            <section style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 8, padding: 11 }}>
              <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Code Walkthrough</div>
              <strong style={{ color: "#f8fbff", fontSize: 12.5, lineHeight: 1.35 }}>
                {currentWalkthrough?.title || "Current step"}: {currentWalkthrough?.codeCue || "Map the visual step to code"}
              </strong>
              <p style={{ color: "#dbeafe", fontSize: 11.5, lineHeight: 1.45, margin: 0 }}>{currentWalkthrough?.interviewCue}</p>
              <div style={{ color: "#93a4bf", fontSize: 10.8, lineHeight: 1.45 }}>
                {selectedCode.language} cue: {currentWalkthrough?.say}
              </div>
            </section>
          </div>

          <section style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 8, padding: 11 }}>
            <div style={{ color: "#facc15", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Test Case Trainer</div>
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(min(210px, 100%), 1fr))" }}>
              {(lesson.testCases || []).map((testCase) => {
                const key = `${currentBlind75Problem.id}:${testCase.id}`;
                const revealed = Boolean(revealedTestCases[key]);
                const mastered = (currentProblemProgress?.testCasesMastered || []).includes(testCase.id);
                return (
                  <div key={testCase.id} style={{ border: `1px solid ${mastered ? "rgba(167,243,208,.34)" : "rgba(255,255,255,.08)"}`, borderRadius: 8, display: "grid", gap: 7, padding: 9 }}>
                    <span style={{ color: mastered ? "#a7f3d0" : "#facc15", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{testCase.type}</span>
                    <strong style={{ color: "#f8fbff", fontSize: 11.5, lineHeight: 1.35 }}>{testCase.input}</strong>
                    {revealed ? (
                      <span style={{ color: "#dbeafe", fontSize: 10.8, lineHeight: 1.45 }}>
                        Expected: {testCase.expected}. {testCase.why}
                      </span>
                    ) : null}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button type="button" onClick={() => toggleExpected(testCase.id)} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 7, color: "#dbeafe", cursor: "pointer", fontSize: 10.5, fontWeight: 850, padding: "6px 8px" }}>
                        Reveal expected
                      </button>
                      <button type="button" onClick={() => markTestCaseMastered(testCase.id)} style={{ background: mastered ? "rgba(167,243,208,.13)" : "rgba(167,243,208,.06)", border: "1px solid rgba(167,243,208,.24)", borderRadius: 7, color: "#a7f3d0", cursor: "pointer", fontSize: 10.5, fontWeight: 850, padding: "6px 8px" }}>
                        {mastered ? "Mastered" : "Mark tested"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
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

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ alignItems: "center", display: "flex", gap: 7, justifyContent: "space-between", flexWrap: "wrap" }}>
              <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Scene View</div>
              <div style={{ background: "rgba(0,0,0,.18)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "flex", gap: 4, padding: 4 }}>
                {[
                  ["reel", "Reel"],
                  ["diagram", "Diagram"],
                ].map(([value, label]) => {
                  const active = visualMode === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setVisualMode(value)}
                      style={{
                        background: active ? `${accent}24` : "transparent",
                        border: `1px solid ${active ? accent : "transparent"}`,
                        borderRadius: 7,
                        color: active ? "#f8fbff" : "#93a4bf",
                        cursor: "pointer",
                        fontSize: 10.5,
                        fontWeight: 900,
                        padding: "6px 9px",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))" }}>
              {REEL_TONES.map((tone) => {
                const active = reelTone === tone.id;
                return (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setReelTone(tone.id)}
                    style={{
                      alignItems: "center",
                      background: active ? `${accent}18` : "rgba(255,255,255,.035)",
                      border: `1px solid ${active ? accent : "rgba(255,255,255,.075)"}`,
                      borderRadius: 8,
                      color: active ? "#f8fbff" : "#93a4bf",
                      cursor: "pointer",
                      display: "flex",
                      fontSize: 10.5,
                      fontWeight: 900,
                      gap: 6,
                      justifyContent: "center",
                      padding: "7px 8px",
                    }}
                  >
                    <i className={`ti ${tone.icon}`} style={{ color: active ? accent : "#7d8aa2", fontSize: 13 }} />
                    {tone.label}
                  </button>
                );
              })}
            </div>
          </div>

          {visualMode === "reel" ? (
            <DsaReelView
              lesson={lesson}
              state={state}
              currentStep={currentStep}
              stepIndex={Math.min(stepIndex, state.steps.length - 1)}
              accent={accent}
              playing={playing}
              lessonTone={getLessonTone(lesson, reelTone)}
              onSelectStep={(index) => setStepIndex(index)}
            />
          ) : (
            <VisualInput input={state.input} highlight={currentStep?.highlight || {}} accent={accent} isPlaying={playing} />
          )}

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
            <DryRunTable rows={dryRunRows} activeIndex={Math.min(stepIndex, dryRunRows.length - 1)} accent={accent} />
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
        <div style={{ color: "#93a4bf", fontSize: 11.5, lineHeight: 1.45 }}>
          What to say in interview: name the invariant, dry run one input, then write this template cleanly.
        </div>
        <CodeSyncBlock code={selectedCode} walkthrough={currentWalkthrough} stepIndex={stepIndex} accent={accent} />
      </section>
    </section>
  );
}
