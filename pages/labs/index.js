import Link from 'next/link';
import ReaderLayout from '../../components/reader/ReaderLayout';
import { HUB_LABS } from '../../lib/hubLabs.mjs';
import styles from '../../styles/Reader.module.css';
export default function Labs() { return <ReaderLayout title="Interactive engineering labs" description="Explore caching, concurrency, indexes, queues, and agent workflows with bounded teaching models."><h1>Change a constraint. Explain the result.</h1><p>Predict the outcome, change the controls, and compare the computed trace. These are teaching models with explicit limits.</p><div className={styles.grid}>{HUB_LABS.map(lab => <article key={lab.id} className={styles.card}><h2><Link href={`/labs/${lab.id}`}>{lab.title}</Link></h2><p>{lab.scope}</p></article>)}</div><Link href="/learn">Return to the learning hub →</Link></ReaderLayout>; }
