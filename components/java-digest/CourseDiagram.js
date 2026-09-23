import { useId } from "react";
import { COURSE_DIAGRAMS } from "../../lib/techBlogDiagrams.mjs";

export default function CourseDiagram({ diagramKey, accent = "#8bd3ff" }) {
  const id = useId();
  const diagram = COURSE_DIAGRAMS[diagramKey];
  if (!diagram) return null;
  const marker = `course-arrow-${id}`;
  const height = diagram.height || Math.max(...diagram.nodes.map(node => node[2])) + 120;
  return <figure data-course-diagram={diagramKey} style={{ minWidth: 0, margin: "16px 0", color: "var(--jd-text, #e5edf8)" }}>
    <figcaption id={`caption-${id}`} style={{ fontWeight: 700 }}>{diagram.title}</figcaption>
    <p style={{ fontSize: 14, lineHeight: 1.6 }}>{diagram.description}</p>
    <div role="region" aria-label={`${diagram.title} scrollable diagram`} tabIndex={0}
      style={{ maxWidth: "100%", overflowX: "auto", border: "1px solid var(--jd-border, #38516e)", borderRadius: 8 }}>
      <svg role="img" aria-labelledby={`caption-${id} desc-${id}`} viewBox={`0 0 750 ${height}`}
        style={{ display: "block", width: "100%", minWidth: 750, height: "auto" }}>
        <desc id={`desc-${id}`}>{diagram.description}</desc>
        <defs><marker id={marker} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={accent} />
        </marker></defs>
        {diagram.edges.map(([from, to, label], index) => {
          const [, x1, y1] = diagram.nodes.find(node => node[0] === from);
          const [, x2, y2] = diagram.nodes.find(node => node[0] === to);
          const sameRow = y1 === y2;
          const sx = sameRow ? x1 + 200 : x1 + 100;
          const sy = sameRow ? y1 + 40 : y1 + (y2 > y1 ? 80 : 0);
          const ex = sameRow ? x2 : x2 + 100;
          const ey = sameRow ? y2 + 40 : y2 + (y2 > y1 ? 0 : 80);
          // Separate the outbound and return probe paths so their directions stay visible.
          const offset = diagramKey === "breaker" && from === "probe" && to === "open" ? 55 : 0;
          const mx = (sx + ex) / 2 + offset, my = (sy + ey) / 2;
          return <g key={index}>
            <path d={`M${sx},${sy} Q${mx},${my} ${ex},${ey}`} fill="none" stroke={accent} strokeWidth="2" markerEnd={`url(#${marker})`} />
            <text x={mx} y={sameRow ? y1 - 6 : my - 9} textAnchor="middle" fill="currentColor" fontSize="13">{label}</text>
          </g>;
        })}
        {diagram.nodes.map(([key, x, y, label, detail]) => <g key={key}>
          <rect x={x} y={y} width="200" height="80" rx="8" fill="var(--jd-surface-sunken, #101d30)" stroke={accent} />
          <text x={x + 100} y={y + 28} textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="700">{label}</text>
          <text x={x + 100} y={y + 54} textAnchor="middle" fill="currentColor" fontSize="12">{detail}</text>
        </g>)}
      </svg>
    </div>
    <small>Scroll horizontally on narrow screens. The explanation above describes every path.</small>
  </figure>;
}
