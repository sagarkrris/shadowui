import { BEGINNER_STEPS } from "../lib/prepProgressBrain.mjs";

const STEP_LABELS = {
  watch: "Watch",
  predict: "Predict",
  explain: "Explain",
  practice: "Practice",
  review: "Review",
};
const DEFAULT_STEPS = BEGINNER_STEPS.map((id) => ({ id, label: STEP_LABELS[id] }));

function normalizeStep(step) {
  if (typeof step === "string") {
    const id = step.toLowerCase().replace(/[^a-z]/g, "");
    return { id, label: step };
  }

  return {
    id: step?.id || "watch",
    label: step?.label || STEP_LABELS[step?.id] || "Watch",
  };
}

export default function BeginnerGuideBanner({
  enabled = false,
  title = "Beginner Guided Mode",
  detail = "Use the same simple loop here: watch one idea, predict the next move, explain it, practice once, then review the miss.",
  accent = "#8bd3ff",
  steps = DEFAULT_STEPS,
  currentStep = "watch",
  onStepSelect,
}) {
  if (!enabled) return null;

  const normalizedSteps = steps.map(normalizeStep);
  const activeIndex = Math.max(0, normalizedSteps.findIndex((step) => step.id === currentStep));

  return (
    <section style={{ background: "rgba(139,211,255,.055)", border: `1px solid ${accent}33`, borderRadius: 8, display: "grid", gap: 8, marginBottom: 10, padding: 10 }}>
      <div style={{ alignItems: "center", color: accent, display: "flex", fontSize: 11, fontWeight: 950, gap: 7, textTransform: "uppercase" }}>
        <i className="ti ti-school" />{title}
      </div>
      <p style={{ color: "#cbd5e1", fontSize: 11.4, lineHeight: 1.45, margin: 0, overflowWrap: "anywhere" }}>{detail}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {normalizedSteps.map((step, index) => {
          const active = step.id === currentStep;
          const complete = index < activeIndex;
          const style = {
            background: active ? "rgba(139,211,255,.1)" : complete ? "rgba(167,243,208,.08)" : "transparent",
            border: `1px solid ${active ? `${accent}66` : complete ? "rgba(167,243,208,.25)" : "rgba(255,255,255,.09)"}`,
            borderRadius: 999,
            color: active ? "#f8fbff" : complete ? "#a7f3d0" : "#dbeafe",
            cursor: onStepSelect ? "pointer" : "default",
            fontSize: 10.5,
            fontWeight: 850,
            padding: "4px 7px",
          };
          const content = `${index + 1}. ${step.label}`;

          return onStepSelect ? (
            <button key={step.id} type="button" aria-pressed={active} onClick={() => onStepSelect(step.id)} style={style}>
              {content}
            </button>
          ) : (
            <span key={step.id} style={style}>
              {content}
            </span>
          );
        })}
      </div>
    </section>
  );
}
