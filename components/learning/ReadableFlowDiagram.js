import React from "react";

function parseSteps(value) {
  const source = String(value || "").replace(/\\n/g, "\n");
  const labels = [...source.matchAll(/\["([^"\\]+)"\]/g)].map((match) => match[1]);
  if (labels.length > 1) return labels;
  const chunks = source.split(/(?:-->|→|->|⇒|\n\s*└─|\n\s*└──|\n\s*├─)/).map((item) => item.replace(/^[^\w]+/, "").trim()).filter(Boolean);
  return chunks.length > 1 ? chunks : [source.trim()];
}

export default function ReadableFlowDiagram({ value, title = "How it flows", accent = "#8bd3ff" }) { const steps = parseSteps(value); return <div aria-label={title} style={{ background: "linear-gradient(135deg, #102b43, #163b4d)", border: `1px solid ${accent}88`, borderRadius: 9, color: "#f4f9ff", display: "grid", gap: 8, padding: 12 }}><div style={{ color: accent, fontSize: 10.5, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" }}>{title}</div><div style={{ alignItems: "stretch", display: "flex", flexWrap: "wrap", gap: 6 }}>{steps.map((step, index) => <React.Fragment key={`${step}-${index}`}><div style={{ background: "rgba(3,15,27,.5)", border: "1px solid rgba(173,225,240,.28)", borderRadius: 7, color: "#eaf4ff", flex: "1 1 150px", fontSize: 11.5, lineHeight: 1.35, minWidth: 130, padding: "9px 10px" }}><span style={{ color: accent, display: "block", fontSize: 10, fontWeight: 900, marginBottom: 3 }}>STEP {index + 1}</span>{step}</div>{index < steps.length - 1 ? <span aria-hidden="true" style={{ alignSelf: "center", color: accent, fontSize: 18, fontWeight: 900 }}>→</span> : null}</React.Fragment>)}</div></div>; }
export { parseSteps };
