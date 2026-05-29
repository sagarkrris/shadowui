import { useEffect, useMemo, useState } from "react";
import {
  buildCanvasMockPrompt,
  buildCanvasReviewPrompt,
  createSystemDesignCanvasState,
  exportSystemDesignCanvasMarkdown,
  SYSTEM_DESIGN_CANVAS_SECTIONS,
} from "../../lib/systemDesignCanvas.mjs";

function ActionButton({ icon, label, onClick, tone = "#8bd3ff" }) {
  return (
    <button
      type="button"
      className="glass-button"
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{
        alignItems: "center",
        border: `1px solid ${tone}55`,
        borderRadius: 7,
        color: "#f8fbff",
        display: "inline-flex",
        fontSize: 11,
        fontWeight: 700,
        gap: 6,
        lineHeight: 1,
        minHeight: 30,
        padding: "7px 10px",
        whiteSpace: "nowrap",
      }}
    >
      <i className={`ti ${icon}`} style={{ color: tone, fontSize: 14 }} />
      {label}
    </button>
  );
}

export default function SystemDesignCanvas({
  initialState,
  onChange,
  onReview,
  onMock,
  onExport,
  onAction,
  theme = {},
}) {
  const normalizedInitialState = useMemo(
    () => createSystemDesignCanvasState(initialState),
    [initialState],
  );
  const [canvasState, setCanvasState] = useState(normalizedInitialState);
  const accent = theme.accentStrong || "#8bd3ff";
  const accentBorder = theme.accentBorder || "rgba(139, 211, 255, .26)";

  useEffect(() => {
    setCanvasState(normalizedInitialState);
  }, [normalizedInitialState]);

  const commitState = (nextState) => {
    const normalized = createSystemDesignCanvasState(nextState);
    setCanvasState(normalized);
    onChange?.(normalized);
  };

  const updateProblem = (event) => {
    commitState({ ...canvasState, problem: event.target.value });
  };

  const updateSection = (key, value) => {
    commitState({
      ...canvasState,
      sections: {
        ...canvasState.sections,
        [key]: value,
      },
    });
  };

  const reviewCanvas = () => {
    const prompt = buildCanvasReviewPrompt(canvasState);
    onReview?.(prompt, canvasState);
    onAction?.(prompt, { type: "review", canvasState });
  };

  const mockCanvas = () => {
    const prompt = buildCanvasMockPrompt(canvasState);
    onMock?.(prompt, canvasState);
    onAction?.(prompt, { type: "mock", canvasState });
  };

  const exportCanvas = async () => {
    const markdown = exportSystemDesignCanvasMarkdown(canvasState);
    onExport?.(markdown, canvasState);

    if (!onExport && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(markdown);
    }
  };

  return (
    <section
      className="glass-card"
      style={{
        background: "linear-gradient(180deg, rgba(14,18,30,.82), rgba(7,10,18,.74))",
        backdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,.1)",
        borderRadius: 8,
        boxShadow: "0 18px 46px rgba(0,0,0,.24)",
        color: "#eef4ff",
        display: "grid",
        gap: 12,
        padding: 14,
      }}
    >
      <header
        style={{
          alignItems: "center",
          display: "grid",
          gap: 10,
          gridTemplateColumns: "minmax(180px, 1fr) auto",
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "#9fb0c7", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
            System Design Canvas
          </span>
          <input
            value={canvasState.problem}
            onChange={updateProblem}
            placeholder="Problem, e.g. Design a global notification service"
            style={{
              background: "rgba(255,255,255,.06)",
              border: `1px solid ${accentBorder}`,
              borderRadius: 7,
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 700,
              minHeight: 34,
              outline: "none",
              padding: "8px 10px",
              width: "100%",
            }}
          />
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "flex-end" }}>
          <ActionButton icon="ti-sparkles" label="Review" onClick={reviewCanvas} tone={accent} />
          <ActionButton icon="ti-player-play" label="Mock" onClick={mockCanvas} tone="#a7f3d0" />
          <ActionButton icon="ti-download" label="Export" onClick={exportCanvas} tone="#facc15" />
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gap: 9,
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        }}
      >
        {SYSTEM_DESIGN_CANVAS_SECTIONS.map((section) => (
          <label
            key={section.key}
            style={{
              background: "rgba(255,255,255,.045)",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 8,
              display: "grid",
              gap: 7,
              minHeight: 146,
              padding: 10,
            }}
          >
            <span style={{ alignItems: "center", color: "#eaf2ff", display: "flex", fontSize: 12, fontWeight: 800, gap: 6 }}>
              <i className="ti ti-layout-kanban" style={{ color: accent, fontSize: 13 }} />
              {section.label}
            </span>
            <textarea
              value={canvasState.sections[section.key]}
              onChange={(event) => updateSection(section.key, event.target.value)}
              placeholder={section.placeholder}
              rows={4}
              style={{
                background: "rgba(0,0,0,.16)",
                border: "1px solid rgba(255,255,255,.07)",
                borderRadius: 7,
                color: "#f7fbff",
                fontSize: 12,
                lineHeight: 1.45,
                minHeight: 92,
                outline: "none",
                padding: 9,
                resize: "vertical",
                width: "100%",
              }}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
