import { useId } from 'react';
import {gitHead} from '../../lib/gitLab.mjs';
import {gitGraphLayout} from '../../lib/gitExercises.mjs';
import styles from '../../styles/EngineeringLabs.module.css';
export default function GitCommitGraph({repo,previousHead}){
 const id=useId().replaceAll(':','');const graph=gitGraphLayout(repo);const nodes=new Map(graph.nodes.map(n=>[n.id,n]));const head=gitHead(repo).id;
 return <div className={styles.scroll} tabIndex={0} aria-label="Scrollable commit diagram"><svg role="img" aria-labelledby={`${id}-title ${id}-desc`} width={graph.width} height={graph.height} className={styles.commitSvg}>
  <title id={`${id}-title`}>Branches and commit ancestry</title><desc id={`${id}-desc`}>HEAD is on {repo.branch} at {head}. Arrows point to parent commits. The text graph below includes every relationship.</desc><defs><marker id={`${id}-arrow`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#718d85"/></marker></defs>
  {graph.nodes.flatMap(c=>c.parents.map(parent=>{const p=nodes.get(parent);return <path key={`${c.id}-${parent}`} d={`M${c.x},${c.y-12} C${c.x},${(c.y+p.y)/2} ${p.x},${(c.y+p.y)/2} ${p.x},${p.y+16}`} fill="none" stroke="#718d85" strokeWidth="2" markerEnd={`url(#${id}-arrow)`}/>;}))}
  {graph.nodes.map(c=><g key={c.id} data-head={c.id===head?'true':'false'}><circle cx={c.x} cy={c.y} r="12" fill={c.id===head?'#176d58':'#e7f1ea'} stroke="#176d58" strokeWidth={c.id===head?'4':'2'}/>{previousHead&&previousHead!==head&&c.id===previousHead&&<circle cx={c.x} cy={c.y} r="18" fill="none" stroke="#ad6a20" strokeDasharray="4 3"/>}<text x={c.x+24} y={c.y+4} fill="#173d32" fontSize="13">{c.id}{c.id===head?' · HEAD':''}</text><text x={c.x+24} y={c.y+23} fill="#45665b" fontSize="12">{c.labels.join(', ')}</text><title>{c.message}</title></g>)}
 </svg><p>{previousHead&&previousHead!==head?`HEAD moved: ${previousHead} → ${head}. The dashed ring marks its previous commit.`:`HEAD → ${repo.branch} → ${head}`}</p></div>;
}
