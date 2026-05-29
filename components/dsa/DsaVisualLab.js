import { useEffect, useMemo, useState } from "react";
import {
  buildDsaMockPrompt,
  buildDsaVisualizationState,
  DSA_VISUAL_LAB_STORAGE_KEY,
  getDsaVisualLesson,
  listDsaVisualLessons,
} from "../../lib/dsaVisualLab.mjs";

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

function VisualInput({ input, highlight, accent }) {
  if (Array.isArray(input)) {
    return (
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(54px, 1fr))" }}>
        {input.map((value, index) => {
          const active = [highlight.index, highlight.left, highlight.right, highlight.to].includes(index)
            || (Array.isArray(highlight.from) && highlight.from.includes(index));

          return (
            <div
              key={`${value}-${index}`}
              style={{
                background: active ? `${accent}22` : "rgba(255,255,255,.045)",
                border: `1px solid ${active ? accent : "rgba(255,255,255,.08)"}`,
                borderRadius: 7,
                color: "#f8fbff",
                display: "grid",
                gap: 4,
                minHeight: 58,
                padding: 8,
                placeItems: "center",
              }}
            >
              <strong style={{ fontSize: 15 }}>{value}</strong>
              <span style={{ color: active ? accent : "#7d8aa2", fontSize: 10, fontWeight: 800 }}>i={index}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {String(input).split("").map((char, index) => {
        const active = highlight.index === index;

        return (
          <span
            key={`${char}-${index}`}
            style={{
              background: active ? `${accent}22` : "rgba(255,255,255,.045)",
              border: `1px solid ${active ? accent : "rgba(255,255,255,.08)"}`,
              borderRadius: 7,
              color: "#f8fbff",
              display: "inline-grid",
              fontSize: 15,
              fontWeight: 800,
              minWidth: 38,
              padding: "9px 8px",
              placeItems: "center",
            }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
}

export default function DsaVisualLab({ initialLessonId = "arrays", onPractice, theme = {} }) {
  const lessons = useMemo(() => listDsaVisualLessons(), []);
  const fallbackLessonId = lessons.some((lesson) => lesson.id === initialLessonId) ? initialLessonId : "arrays";
  const [selectedLessonId, setSelectedLessonId] = useState(() => {
    const savedLessonId = readSavedLessonId();
    return lessons.some((lesson) => lesson.id === savedLessonId) ? savedLessonId : fallbackLessonId;
  });
  const lesson = useMemo(() => getDsaVisualLesson(selectedLessonId), [selectedLessonId]);
  const [inputValue, setInputValue] = useState(() => formatInputValue(buildDsaVisualizationState(fallbackLessonId).input));
  const [stepIndex, setStepIndex] = useState(0);
  const accent = theme.accentStrong || "#8bd3ff";
  const accentBorder = theme.accentBorder || "rgba(139, 211, 255, .28)";
  const state = useMemo(
    () => buildDsaVisualizationState(selectedLessonId, inputValue),
    [selectedLessonId, inputValue],
  );
  const currentStep = state.steps[Math.min(stepIndex, state.steps.length - 1)] || state.steps[0];
  const mockPrompt = useMemo(() => buildDsaMockPrompt(lesson), [lesson]);

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
  }, [selectedLessonId]);

  const chooseLesson = (lessonId) => {
    setSelectedLessonId(lessonId);
  };

  const visualize = () => {
    setStepIndex(0);
  };

  const reset = () => {
    setInputValue(formatInputValue(buildDsaVisualizationState(selectedLessonId).input));
    setStepIndex(0);
  };

  const practiceAsMock = () => {
    onPractice?.(mockPrompt, { lesson, visualizationState: state });
  };

  return (
    <section
      className="glass-card"
      style={{
        background: "linear-gradient(180deg, rgba(12,18,29,.86), rgba(7,11,19,.78))",
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
      <header style={{ display: "grid", gap: 9 }}>
        <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <div style={{ alignItems: "center", color: accent, display: "flex", fontSize: 12, fontWeight: 900, gap: 7, textTransform: "uppercase" }}>
              <i className="ti ti-bulb" />
              DSA Visual Lab
            </div>
            <h2 style={{ color: "#ffffff", fontSize: 18, lineHeight: 1.25, margin: "4px 0 0" }}>
              See the pattern, dry run it, then code it.
            </h2>
          </div>
          <ActionButton icon="ti-user-question" label="Practice as Mock" onClick={practiceAsMock} tone="#a7f3d0" />
        </div>
      </header>

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
                {item.complexity.time} · {item.complexity.space}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))" }}>
        <article style={{ background: "rgba(255,255,255,.045)", border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 12, padding: 12 }}>
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
              <ActionButton icon="ti-player-play" label="Visualize" onClick={visualize} tone={accent} />
              <ActionButton icon="ti-arrow-left" label="Previous" onClick={() => setStepIndex((value) => Math.max(0, value - 1))} disabled={stepIndex === 0} tone={accent} />
              <ActionButton icon="ti-arrow-right" label="Next" onClick={() => setStepIndex((value) => Math.min(state.steps.length - 1, value + 1))} disabled={stepIndex >= state.steps.length - 1} tone={accent} />
              <ActionButton icon="ti-refresh" label="Reset" onClick={reset} tone="#facc15" />
            </div>
          </div>

          <VisualInput input={state.input} highlight={currentStep?.highlight || {}} accent={accent} />

          <div style={{ background: "rgba(0,0,0,.16)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 7, padding: 11 }}>
            <div style={{ color: accent, fontSize: 11, fontWeight: 900 }}>
              Step {currentStep?.stepNumber || 1} of {state.steps.length}: {currentStep?.title}
            </div>
            <p style={{ color: "#dbeafe", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{currentStep?.explanation}</p>
            <p style={{ color: "#93a4bf", fontSize: 12, lineHeight: 1.45, margin: 0 }}>
              Memory hook: {lesson.memoryHook}
            </p>
          </div>
        </article>

        <aside style={{ display: "grid", gap: 10 }}>
          <section style={{ background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 7, padding: 12 }}>
            <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Dry Run</div>
            <p style={{ color: "#dbeafe", fontSize: 12.5, lineHeight: 1.5, margin: 0 }}>{lesson.dryRun}</p>
          </section>

          <section style={{ background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 7, padding: 12 }}>
            <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Quiz</div>
            <strong style={{ color: "#f8fbff", fontSize: 13, lineHeight: 1.4 }}>{lesson.quiz.question}</strong>
            <p style={{ color: "#93a4bf", fontSize: 12, lineHeight: 1.45, margin: 0 }}>{lesson.quiz.answer}</p>
          </section>
        </aside>
      </div>

      <section style={{ background: "rgba(0,0,0,.18)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 8, padding: 12 }}>
        <div style={{ alignItems: "center", color: accent, display: "flex", fontSize: 11, fontWeight: 900, gap: 7, textTransform: "uppercase" }}>
          <i className="ti ti-code" />
          Code Template
        </div>
        <pre style={{ color: "#dbeafe", fontSize: 12, lineHeight: 1.55, margin: 0, overflowX: "auto", whiteSpace: "pre" }}>
          <code>{lesson.codeTemplate}</code>
        </pre>
      </section>
    </section>
  );
}
