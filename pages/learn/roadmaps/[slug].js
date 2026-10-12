import Link from 'next/link';
import ReaderLayout from '../../../components/reader/ReaderLayout';
import useHubProgress from '../../../components/learning/useHubProgress';
import { LEARNING_PATHS, pathActivityId, learningPathProgress } from '../../../lib/learningHub.mjs';
import styles from '../../../styles/Reader.module.css';
export default function GuidedPath({ path }) {
  const { progress, ready, message, toggle, update } = useHubProgress();
  const result = learningPathProgress(path, progress);
  return <ReaderLayout title={`${path.title} roadmap`} description={path.description}><p><Link href="/learn">Learning hub</Link></p><h1>{path.title} roadmap</h1><p className={styles.lead}>{path.description}</p><p>Learn → Experiment → Build → Interview → Review. Complete the exercise and checkpoint before marking an activity done. Workspace activities require a prep profile; Tech Buddy also requires an available AI provider.</p>
    <section className={styles.featuredGuide}><h2>Continue your path</h2><p>{result.completed} of {result.total} activities complete</p>{result.next ? <Link href={result.next.href}>{result.next.review ? 'Review weak stage' : 'Next activity'}: {result.next.stage.title} →</Link> : <p>Path complete. Revisit any stage you cannot yet defend.</p>}<p role="status">{message}</p></section>
    {path.stages.map((stage, i) => { const weakId = `stage-${path.id}-${stage.id}`; return <section className={styles.card} key={stage.id} id={`stage-${stage.id}`}><p className={styles.eyebrow}>Stage {i + 1}</p><h2>{stage.title}</h2><p><strong>Prerequisites:</strong> {stage.prerequisites}</p><p><strong>Checkpoint:</strong> {stage.outcome}</p><ol>{stage.activities.map(activity => { const id = pathActivityId(path.id, stage.id, activity.label); return <li key={id}><Link href={activity.href}>{activity.label}: {activity.title}</Link><label><input type="checkbox" disabled={!ready} checked={progress.completed.includes(id)} onChange={() => toggle('completed', id)} />Completed {stage.title}: {activity.label}</label></li>; })}</ol>
      <label><input type="checkbox" disabled={!ready} checked={progress.weak.includes(weakId)} onChange={() => toggle('weak', weakId)} />I need to revisit {stage.title}</label>
      <details id={`review-${stage.id}`}><summary>Write a review for {stage.title}</summary><label>Reflection for {stage.title}<textarea disabled={!ready} rows={4} maxLength={4000} value={progress.notes[weakId] || ''} onChange={e => update(current => ({ ...current, notes: { ...current.notes, [weakId]: e.target.value } }))} /></label><p>Record what you built, a failing case, and what you would change next. Notes save as you type.</p></details>
    </section>; })}<p>Activity completion and weak areas are self-assessed, not an interview-readiness prediction.</p>
  </ReaderLayout>;
}
export function getStaticPaths() { return { paths: LEARNING_PATHS.filter(p => p.id !== 'java-backend').map(p => ({ params: { slug: p.id } })), fallback: false }; }
export function getStaticProps({ params }) { return { props: { path: LEARNING_PATHS.find(p => p.id === params.slug) } }; }
