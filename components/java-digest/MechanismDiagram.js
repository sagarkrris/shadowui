import styles from '../../styles/ConceptFlow.module.css';
import IllustrationPanel from '../learning/IllustrationPanel';
import { sequenceArtworkModel } from '../../lib/diagramArtwork.mjs';

export default function MechanismDiagram({ steps, title = 'Mechanism at a glance' }) {
  if (!Array.isArray(steps) || steps.length < 2) return null;
  return <figure data-mechanism-diagram className={styles.figure}>
    <figcaption className={styles.caption}>{title}</figcaption>
    <IllustrationPanel model={sequenceArtworkModel(steps, title)} artworkKey="mechanism" />
  </figure>;
}
