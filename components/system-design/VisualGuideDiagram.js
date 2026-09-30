import { useId } from "react";
import styles from "../../styles/SystemDesignVisualGuide.module.css";

const xPositions = [24, 266, 508, 750, 992];

export default function VisualGuideDiagram({ diagram }) {
  const id = useId();
  const width = Math.max(760, diagram.nodes.length * 242);
  return <figure className={styles.figure}>
    <figcaption>
      <p className={styles.diagramLabel}>Visual guide</p>
      <h3 id={`diagram-${id}`}>{diagram.title}</h3>
      <p>{diagram.description}</p>
    </figcaption>
    <div className={styles.diagramScroller} role="region" aria-label={`${diagram.title} diagram`} tabIndex={0}>
      <svg role="img" aria-labelledby={`diagram-${id} diagram-desc-${id}`} viewBox={`0 0 ${width} 210`} className={styles.diagram}>
        <desc id={`diagram-desc-${id}`}>{diagram.description}</desc>
        <defs><marker id={`arrow-${id}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker></defs>
        {diagram.edges.map(([from, to, label]) => {
          const startX = xPositions[from] + 200;
          const endX = xPositions[to];
          const middleX = (startX + endX) / 2;
          return <g key={`${from}-${to}`}>
            <path d={`M${startX} 82 L${endX} 82`} markerEnd={`url(#arrow-${id})`} />
            <text x={middleX} y="64" textAnchor="middle">{label}</text>
          </g>;
        })}
        {diagram.nodes.map(([key, title, detail], index) => <g key={key} transform={`translate(${xPositions[index]} 40)`}>
          <rect width="200" height="88" rx="11" />
          <text x="100" y="33" textAnchor="middle" className={styles.nodeTitle}>{title}</text>
          <text x="100" y="59" textAnchor="middle" className={styles.nodeDetail}>{detail}</text>
        </g>)}
      </svg>
    </div>
    <ol className={styles.textPath} aria-label={`${diagram.title} text path`}>
      {diagram.nodes.map(([key, title, detail]) => <li key={key}><strong>{title}</strong><span>{detail}</span></li>)}
    </ol>
  </figure>;
}
