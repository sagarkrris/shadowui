import styles from '../../styles/ConceptFlow.module.css';
import IllustrationPanel from './IllustrationPanel';
import { resolveFlowArtwork } from '../../lib/diagramArtwork.mjs';

export default function ReadableFlowDiagram({ value, title = 'How it flows', steps }) {
  const { kind, source, picture } = resolveFlowArtwork(value, title, steps);
  if (!picture && !source) return null;
  return <figure aria-label={title} data-flow-kind={kind} className={styles.figure}>
    <figcaption className={styles.caption}>{title}</figcaption>
    <IllustrationPanel model={picture} source={source} title={title} artworkKey="authored-flow" sourceLabel={`${title}: original relationships`} />
  </figure>;
}
