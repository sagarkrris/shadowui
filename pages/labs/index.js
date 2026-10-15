import Link from 'next/link';
import ReaderLayout from '../../components/reader/ReaderLayout';
import UiIcon from '../../components/reader/UiIcon';
import { HUB_LABS } from '../../lib/hubLabs.mjs';
import styles from '../../styles/Reader.module.css';

export default function Labs() {
  return <ReaderLayout title="Interactive engineering labs" description="Explore caching, concurrency, indexes, queues, and agent workflows with bounded teaching models.">
    <header className={styles.hero}><p className={styles.eyebrow}>LEARN BY CHANGING SOMETHING</p><h1>Change a constraint.<br />Explain the result.</h1><p className={styles.lead}>Predict the outcome, change the controls, and compare the computed trace. Five small experiments that make an abstract idea easier to see.</p><p className={styles.small}>Teaching models with explicit limits. No infrastructure or external actions run.</p></header>
    <div className={styles.grid}>{HUB_LABS.map((lab, index) => <article key={lab.id} className={`${styles.card} ${styles.labCard}`}><div className={styles.labCardTop}><span>EXPERIMENT 0{index + 1}</span><UiIcon name={['layers', 'pulse', 'search', 'route', 'lab'][index]} size={28} /></div><h2><Link href={`/labs/${lab.id}`}>{lab.title}</Link></h2><p>{lab.scope}</p><Link className={styles.labLink} href={`/labs/${lab.id}`}>Open experiment <UiIcon name="arrow" size={18} /></Link></article>)}</div><div className={styles.actions}><Link className={styles.button} href="/learn">Return to the learning hub →</Link><Link href="/build">Put the idea into code</Link></div>
  </ReaderLayout>;
}
