import { useId, useRef, useState } from "react";
import IllustratedCourseDiagram from './IllustratedCourseDiagram';
import { canIllustrateCourseDiagram } from '../../lib/illustratedCourseDiagrams.mjs';
import { COURSE_DIAGRAMS } from "../../lib/techBlogDiagrams.mjs";
import styles from "../../styles/CourseDiagram.module.css";
import DiagramArtwork from '../learning/DiagramArtwork';
import { courseArtworkModel } from '../../lib/diagramArtwork.mjs';
import { downloadDiagramSvg } from '../learning/IllustrationPanel';

export default function CourseDiagram({ diagramKey, accent = "#8bd3ff" }) {
  const id = useId();
  const [textView, setTextView] = useState(false);
  const [enlarged, setEnlarged] = useState(false);
  const canvas = useRef(null);
  const diagram = COURSE_DIAGRAMS[diagramKey];
  if (!diagram) return null;
  const illustrated = canIllustrateCourseDiagram(diagramKey, diagram);
  const model = courseArtworkModel(diagram);
  if (!model) return null;
  function downloadIllustration() { downloadDiagramSvg(canvas.current, `${diagramKey}-illustration`); }
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
    <div className={styles.illustrationTools} role="group" aria-label="Illustration tools">
      <span>Illustrated explainer</span>
      <button type="button" aria-pressed={enlarged} aria-controls={`canvas-${id}`} onClick={() => setEnlarged(value => !value)}>{enlarged ? 'Reset illustration size' : 'Enlarge illustration'}</button>
      <button type="button" onClick={downloadIllustration}>Download SVG</button>
    </div>
    <div ref={canvas} id={`canvas-${id}`} role="region" aria-label={`${diagram.title} scrollable diagram`} tabIndex={0} className={styles.canvas}>
      {illustrated ? <IllustratedCourseDiagram diagramKey={diagramKey} diagram={diagram} enlarged={enlarged} /> : <DiagramArtwork model={model} artworkKey={diagramKey} enlarged={enlarged} />}
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
