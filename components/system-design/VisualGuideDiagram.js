import { useId } from "react";
import IllustrationPanel from "../learning/IllustrationPanel";
import { artworkGraph, diagramSymbol } from "../../lib/diagramArtwork.mjs";
import styles from "../../styles/SystemDesignVisualGuide.module.css";

export default function VisualGuideDiagram({ diagram }) {
  const id = useId();
  const model = artworkGraph(diagram.nodes.map(([key,label,detail]) => ({ id: key, label, detail, symbol: diagramSymbol(key) })), diagram.edges.map(([from,to,label]) => ({ from: diagram.nodes[from][0], to: diagram.nodes[to][0], label })), diagram.title, diagram.description);
  return <figure className={styles.figure}>
    <figcaption>
      <p className={styles.diagramLabel}>Visual guide</p>
      <h3 id={`diagram-${id}`}>{diagram.title}</h3>
      <p>{diagram.description}</p>
    </figcaption>
    <IllustrationPanel model={model} artworkKey="system-design-guide" />
    <ol className={styles.textPath} aria-label={`${diagram.title} text path`}>
      {diagram.nodes.map(([key, title, detail]) => <li key={key}><strong>{title}</strong><span>{detail}</span></li>)}
    </ol>
  </figure>;
}
