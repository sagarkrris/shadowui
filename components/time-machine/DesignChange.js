import { designTransition } from '../../lib/timeMachineDesign.mjs';
import styles from '../../styles/TimeMachine.module.css';
import IllustrationPanel from '../learning/IllustrationPanel';
import { artworkGraph, diagramSymbol } from '../../lib/diagramArtwork.mjs';
function DesignSnapshot({ title, design }) {
  const labels = new Map(design.nodes.map(node => [node.id, node.label]));
  return <section className={styles.snapshot} aria-label={`${title} design`}>
    <h4>{title}</h4>
    <IllustrationPanel artworkKey="time-machine" model={artworkGraph(design.nodes.map(node => ({ ...node, detail: `${node.status ? `${node.status}: ` : ''}${node.detail}`, symbol: diagramSymbol(node.id) })), design.links.map(link => ({ ...link, label: `${link.status ? `${link.status}: ` : ''}${link.label}` })), `${title} design`, 'Connections show responsibilities, not deployed infrastructure.')} />
    <div className={styles.nodes}>{design.nodes.map(node => <div className={styles.node} data-change={node.status || 'Before'} key={node.id}>
      {node.status && <span className={styles.badge}>{node.status}</span>}<strong>{node.label}</strong><p>{node.detail}</p>
    </div>)}</div>
    <h5>Connections and policies</h5><ul className={styles.connections}>{design.links.map(link => <li key={link.id}><span>{labels.get(link.from)} <span aria-label="to">→</span> {labels.get(link.to)}</span><small>{link.status ? `${link.status} · ` : ''}{link.label}</small></li>)}</ul>
  </section>;
}
export default function DesignChange({ timeline, index }) {
  const transition = designTransition(timeline, index);
  if (!transition) return null;
  return <figure className={styles.designChange} aria-label="Before and after design">
    <figcaption><strong>How this decision changes the design</strong><p>Conceptual design implied by your choices. Connections show responsibilities, not a deployed or tested topology.</p></figcaption>
    <div className={styles.designPair}><DesignSnapshot title="Before" design={transition.before} /><DesignSnapshot title="After" design={transition.after} /></div>
    {transition.removedLinks.length > 0 && <p><strong>Replaced connections:</strong> {transition.removedLinks.map(link => link.label).join('; ')}. Their responsibilities still need to be fulfilled by the new path.</p>}
    <p><strong>Preserve this invariant:</strong> {transition.keep}</p>
    <h4>Where the obligations came from</h4><ul>{transition.after.obligations.map((item, position) => <li key={position}><strong>{item.stage === index ? 'New obligation' : 'Inherited obligation'} · {item.origin}</strong><p>{item.text}</p></li>)}</ul>
  </figure>;
}
