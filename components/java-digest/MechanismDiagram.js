import { useId } from "react";

const BOX_W = 140;
const BOX_H = 54;
const GAP_X = 20;
const GAP_Y = 22;
const PAD = 10;
const MAX_CHARS_PER_LINE = 17;
const MAX_STEPS = 4;

function wrapLabel(text) {
  const words = String(text).split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > MAX_CHARS_PER_LINE && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function StepBox({ x, y, index, label, accent }) {
  const lines = wrapLabel(label);
  const lineHeight = 13;
  const textBlockHeight = lines.length * lineHeight;
  const startY = y + BOX_H / 2 - textBlockHeight / 2 + lineHeight / 2 - 2;

  return (
    <g>
      <rect x={x} y={y} width={BOX_W} height={BOX_H} rx={8} fill="var(--jd-surface-subtle)" stroke={`${accent}55`} strokeWidth={0.75} />
      <circle cx={x + 14} cy={y + 14} r={9} fill={accent} />
      <text x={x + 14} y={y + 14} textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={800} fill="var(--jd-surface-page, #0b1120)">{index}</text>
      <text x={x + BOX_W / 2} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--jd-text)">
        {lines.map((line, i) => <tspan key={`${index}-${i}`} x={x + BOX_W / 2} y={startY + i * lineHeight}>{line}</tspan>)}
      </text>
    </g>
  );
}

function ArrowMarker({ id, accent }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke={accent} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </marker>
  );
}

export default function MechanismDiagram({ steps, accent = "#8bd3ff", title }) {
  const markerId = `mech-arrow-${useId().replace(/:/g, "")}`;
  const diagramSteps = Array.isArray(steps) ? steps.slice(0, MAX_STEPS) : [];
  if (diagramSteps.length < 2) return null;

  const row1 = diagramSteps.slice(0, 2);
  const row2 = diagramSteps.slice(2, 4);
  const row1Y = PAD;
  const row2Y = PAD + BOX_H + GAP_Y;
  const width = PAD * 2 + BOX_W * 2 + GAP_X;
  const height = row2.length ? row2Y + BOX_H + PAD : row1Y + BOX_H + PAD;
  const box1X = PAD;
  const box2X = PAD + BOX_W + GAP_X;

  return (
    <figure style={{ margin: 0 }}>
      {title ? <figcaption style={{ color: accent, fontSize: 10.3, fontWeight: 900, marginBottom: 6, textTransform: "uppercase" }}>{title}</figcaption> : null}
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Diagram: ${diagramSteps.join(" -> ")}`}>
        <defs><ArrowMarker id={markerId} accent={accent} /></defs>
        <StepBox x={box1X} y={row1Y} index={1} label={row1[0]} accent={accent} />
        {row1[1] ? <StepBox x={box2X} y={row1Y} index={2} label={row1[1]} accent={accent} /> : null}
        {row1[1] ? <line x1={box1X + BOX_W} y1={row1Y + BOX_H / 2} x2={box2X} y2={row1Y + BOX_H / 2} stroke={accent} strokeWidth={0.75} markerEnd={`url(#${markerId})`} /> : null}
        {row2[0] ? <StepBox x={box1X} y={row2Y} index={3} label={row2[0]} accent={accent} /> : null}
        {row2[1] ? <StepBox x={box2X} y={row2Y} index={4} label={row2[1]} accent={accent} /> : null}
        {row2[0] ? <path d={`M ${box2X + BOX_W / 2} ${row1Y + BOX_H} L ${box2X + BOX_W / 2} ${row1Y + BOX_H + GAP_Y / 2} L ${box1X + BOX_W / 2} ${row1Y + BOX_H + GAP_Y / 2} L ${box1X + BOX_W / 2} ${row2Y}`} fill="none" stroke={accent} strokeWidth={0.75} markerEnd={`url(#${markerId})`} /> : null}
        {row2[1] ? <line x1={box1X + BOX_W} y1={row2Y + BOX_H / 2} x2={box2X} y2={row2Y + BOX_H / 2} stroke={accent} strokeWidth={0.75} markerEnd={`url(#${markerId})`} /> : null}
      </svg>
    </figure>
  );
}
