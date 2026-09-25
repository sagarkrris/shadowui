import { useId, useState } from "react";
import { COURSE_DIAGRAMS } from "../../lib/techBlogDiagrams.mjs";
import styles from "../../styles/CourseDiagram.module.css";

export default function CourseDiagram({ diagramKey, accent = "#8bd3ff" }) {
  const id = useId();
  const [textView, setTextView] = useState(false);
  const diagram = COURSE_DIAGRAMS[diagramKey];
  if (!diagram) return null;
  const marker = `course-arrow-${id}`;
  const height = diagram.height || Math.max(...diagram.nodes.map(node => node[2])) + 120;
  return <figure data-course-diagram={diagramKey} className={styles.figure} style={{ "--diagram-accent": accent }}>
    <figcaption className={styles.header}>
      <div><span className={styles.eyebrow}>Visual guide</span>
        <div id={`caption-${id}`} className={styles.title}>{diagram.title}</div>
      </div>
      <div className={styles.controls} role="group" aria-label={`View for ${diagram.title}`}>
        <button type="button" aria-pressed={!textView} aria-controls={`visual-${id}`} onClick={() => setTextView(false)}>Diagram</button>
        <button type="button" aria-pressed={textView} aria-controls={`text-${id}`} onClick={() => setTextView(true)}>Text view</button>
      </div>
    </figcaption>
    <p className={styles.description}>{diagram.description}</p>
    <div id={`visual-${id}`} hidden={textView}>
    <div role="region" aria-label={`${diagram.title} scrollable diagram`} tabIndex={0} className={styles.canvas}>
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
          const sx = sameRow ? x1 + (x2 > x1 ? 200 : 0) : x1 + 100;
          const sy = sameRow ? y1 + 40 : y1 + (y2 > y1 ? 80 : 0);
          const ex = sameRow ? x2 + (x2 > x1 ? 0 : 200) : x2 + 100;
          const ey = sameRow ? y2 + 40 : y2 + (y2 > y1 ? 0 : 80);
          // Separate the outbound and return probe paths so their directions stay visible.
          const offset = diagramKey === "breaker" && from === "probe" && to === "open" ? 55 : 0;
          const mx = (sx + ex) / 2 + offset, my = (sy + ey) / 2;
          return <g key={index}>
            <path d={`M${sx},${sy} Q${mx},${my} ${ex},${ey}`} fill="none" stroke={accent} strokeWidth="2" markerEnd={`url(#${marker})`} />
            <text className={styles.edgeLabel} x={mx} y={sameRow ? y1 - 6 : my - 9} textAnchor="middle" fill="currentColor" fontSize="13">{label}</text>
          </g>;
        })}
        {diagram.nodes.map(([key, x, y, label, detail]) => <g key={key}>
          <rect x={x} y={y} width="200" height="80" rx="8" fill="var(--jd-surface-sunken, #101d30)" stroke={accent} />
          <path d={`M${x + 12},${y + 1} h176`} stroke={accent} strokeWidth="3" />
          <text x={x + 100} y={y + 28} textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="700">{label}</text>
          <text x={x + 100} y={y + 54} textAnchor="middle" fill="currentColor" fontSize="12">{detail}</text>
        </g>)}
      </svg>
    </div>
    <p className={styles.hint}>Follow the labeled arrows. Scroll sideways for the full diagram, or choose Text view.</p>
    </div>
    <div id={`text-${id}`} hidden={!textView} className={styles.textView}>
      <dl className={styles.nodes}>{diagram.nodes.map(([key, , , label, detail]) => <div key={key}>
        <dt>{label}</dt><dd>{detail}</dd>
      </div>)}</dl>
      <h4 className={styles.connectionHeading}>Connections</h4>
      <ul className={styles.connections}>{diagram.edges.map(([from, to, label], index) => <li key={index}>
        <strong>{diagram.nodes.find(node => node[0] === from)[3]}</strong>
        <span className={styles.relationship}>{label}</span>
        <span aria-hidden="true"> → </span>
        <strong>{diagram.nodes.find(node => node[0] === to)[3]}</strong>
      </li>)}</ul>
    </div>
  </figure>;
}
