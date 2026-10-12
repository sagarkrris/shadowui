import Link from 'next/link';
import { useState } from 'react';
import ReaderLayout from '../../components/reader/ReaderLayout';
import LessonPractice from '../../components/learning/LessonPractice';
import { HUB_LABS, labResult } from '../../lib/hubLabs.mjs';
import styles from '../../styles/Reader.module.css';
export default function LearningLab({ lab }) {
  const [value, setValue] = useState(lab.id === 'indexes' ? 32 : lab.id === 'cache' ? 2 : lab.id === 'queues' ? 4 : 3);
  const [enabled, setEnabled] = useState(false);
  const result = labResult(lab.id, { value, enabled });
  const controls = { cache: ['Cache capacity', 1, 3], indexes: ['Lookup target (65 is absent)', 1, 65], queues: ['Arrivals per tick', 0, 8], agents: ['Maximum steps', 0, 4] };
  const control = controls[lab.id];
  return <ReaderLayout title={lab.title} description={lab.scope}><p><Link href="/labs">All labs</Link> · <Link href="/learn">Learning hub</Link></p><h1>{lab.title}</h1><p className={styles.lead}>{lab.scope}</p>
    <section className={styles.card} aria-label="Lab controls">{control && <label>{control[0]}<input type="number" min={control[1]} max={control[2]} value={value} onChange={e => setValue(e.target.value)} /></label>}
      {['concurrency', 'agents'].includes(lab.id) && <label><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />{lab.id === 'agents' ? 'Simulate application approval for write' : 'Serialize the complete increment'}</label>}
      <button onClick={() => { setEnabled(false); setValue(lab.id === 'indexes' ? 32 : lab.id === 'cache' ? 2 : lab.id === 'queues' ? 4 : 3); }}>Reset experiment</button>
      <h2>Computed result</h2><p role="status">{result.summary}</p><ol>{result.lines.map((line, index) => <li key={index}>{line}</li>)}</ol>
    </section><p><a href={lab.source}>Read the primary reference</a> · <Link href={`/tech-blogs/${lab.course}`}>Study the connected course</Link></p>
    <LessonPractice id={`lab-${lab.id}`} title={lab.title} question="Change one input, predict the result, and explain what this model cannot establish." />
  </ReaderLayout>;
}
export function getStaticPaths() { return { paths: HUB_LABS.map(lab => ({ params: { slug: lab.id } })), fallback: false }; }
export function getStaticProps({ params }) { return { props: { lab: HUB_LABS.find(lab => lab.id === params.slug) } }; }
