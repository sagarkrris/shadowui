import { flowModel } from '../../lib/visualModels.mjs';
import styles from '../../styles/ConceptFlow.module.css';
import IllustrationPanel from './IllustrationPanel';
import { DiagramSymbol } from './DiagramArtwork';
import { arrowArtworkModel, artworkGraph, sequenceArtworkModel } from '../../lib/diagramArtwork.mjs';
import artworkStyles from '../../styles/Illustration.module.css';

export default function ReadableFlowDiagram({ value, title = 'How it flows' }) {
  const model = flowModel(value);
  if (model.kind === 'empty') return null;
  const picture = model.kind === 'sequence' ? sequenceArtworkModel(model.steps, title)
    : model.kind === 'graph' ? artworkGraph(model.nodes.map(node => ({ ...node, detail: '', symbol: 'component' })), model.edges.map(([from,to]) => ({ from, to, label: 'authored direction' })), title, model.source)
      : arrowArtworkModel(model.source, title);
  return <figure aria-label={title} data-flow-kind={model.kind} className={styles.figure}>
    <figcaption className={styles.caption}>{title}</figcaption>
    <IllustrationPanel model={picture} source={picture ? undefined : model.source} title={title} artworkKey="authored-flow" />
    {model.kind === 'sequence' ? <ol className={styles.steps} aria-label={title}>
      {model.steps.map((step, index) => <li key={index} className={styles.step}>
        <span className={styles.number}>Step {index + 1}{index < model.steps.length - 1 ? ' →' : ''}</span>{step}
      </li>)}
    </ol> : model.kind === 'graph' ? <>
      <ul className={styles.steps} aria-label="Components">{model.nodes.map(node => <li key={node.id} className={styles.step}>{node.label}</li>)}</ul>
      <p className={styles.hint}>Connections below show the authored direction; adjacent cards do not imply a connection.</p>
      <ul aria-label="Directed connections">{model.edges.map(([from, to], index) => <li key={index}>
        {model.nodes.find(node => node.id === from).label} <span aria-label="to">→</span> {model.nodes.find(node => node.id === to).label}
      </li>)}</ul>
    </> : <>
      <div className={artworkStyles.source}>
        {!picture && <div className={artworkStyles.sourceTitle}><DiagramSymbol kind="code" /><span>Authored structure</span></div>}
        <pre role="region" tabIndex={0} aria-label={`${title}: original relationships`} className={styles.source}>{model.source}</pre>
      </div>
      <p className={styles.hint}>Read each arrow in its stated direction. Branches and separate paths keep their original layout; scroll sideways when needed.</p>
    </>}
  </figure>;
}
