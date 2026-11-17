import Link from 'next/link';
import { useState } from 'react';
import ReaderLayout from '../../components/reader/ReaderLayout';
import LessonPractice from '../../components/learning/LessonPractice';
import { HUB_LABS, LAB_CONTROLS, labResult } from '../../lib/hubLabs.mjs';
import styles from '../../styles/Reader.module.css';
export default function LearningLab({ lab }) {
  const [value, setValue] = useState(LAB_CONTROLS[lab.id]?.initial ?? 3);
  const [enabled, setEnabled] = useState(false);
  const result = labResult(lab.id, { value, enabled });
  const control = LAB_CONTROLS[lab.id];
  return <ReaderLayout title={lab.title} description={lab.scope}><p><Link href="/labs">All labs</Link> · <Link href="/learn">Learning hub</Link></p><h1>{lab.title}</h1><p className={styles.lead}>{lab.scope}</p>
    <section className={styles.card} aria-label="Lab controls">{control && <label>{control.label}<input type="number" min={control.min} max={control.max} step="1" aria-invalid={Boolean(result.error)} aria-describedby="lab-result" value={value} onChange={e => setValue(e.target.value)} /></label>}
      {['concurrency', 'agents'].includes(lab.id) && <label><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />{lab.id === 'agents' ? 'Simulate application approval for write' : 'Serialize the complete increment'}</label>}
      <button onClick={() => { setEnabled(false); setValue(control?.initial ?? 3); }}>Reset experiment</button>
      <h2>Computed result</h2><p id="lab-result" role="status">{result.summary}</p><ol>{result.lines.map((line, index) => <li key={index}>{line}</li>)}</ol>
    </section><p><a href={lab.source}>Read the primary reference</a> · <Link href={`/tech-blogs/${lab.course}`}>Study the connected course</Link></p>
    <LessonPractice id={`lab-${lab.id}`} title={lab.title} question="Change one input, predict the result, and explain what this model cannot establish." />
  </ReaderLayout>;
}
export function getStaticPaths() { return { paths: HUB_LABS.map(lab => ({ params: { slug: lab.id } })), fallback: false }; }
export function getStaticProps({ params }) { return { props: { lab: HUB_LABS.find(lab => lab.id === params.slug) } }; }
