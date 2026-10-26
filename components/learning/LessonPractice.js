import Link from 'next/link';
import { buddyHref } from '../../lib/learningHub.mjs';
import useHubProgress from './useHubProgress';
import { useId } from 'react';
import styles from './LessonPractice.module.css';
export default function LessonPractice({ id, title, question, exercise }) {
  const { progress, ready, message, toggle } = useHubProgress();
  const helpId = useId();
  return <section aria-label={`Practice ${title}`} className={styles.card}>
    <h3>Practice this lesson</h3><p>{exercise || 'Write the smallest example, test a boundary input, and explain one limitation.'}</p>
    <p className={styles.checkpoint}><strong>Checkpoint:</strong> {question || `Explain ${title}, give an example, and defend one trade-off.`}</p>
    <div className={styles.actions}>
      <Link className={styles.start} prefetch={false} href={buddyHref(`${title}: ${question || 'Explain the mechanism, a boundary case, and a trade-off.'}`)}>Practise this lesson with Tech Buddy →</Link>
      <Link prefetch={false} href="/learn">View my learning progress →</Link>
    </div>
    <fieldset className={styles.progress} aria-describedby={helpId}>
      <legend>Your learning progress</legend>
      <label><input type="checkbox" disabled={!ready} checked={progress.completed.includes(id)} onChange={() => toggle('completed', id)} /> <span>I completed this lesson and its self-check</span></label>
      <label><input type="checkbox" disabled={!ready} checked={progress.weak.includes(id)} onChange={() => toggle('weak', id)} /> <span>I need another attempt at this lesson</span></label>
      <p id={helpId} className={styles.help}>Completion records what you finished. Mark another attempt when you want to revisit it; both can be selected. Progress is saved in this browser.</p>
    </fieldset>
    <p role="status" className={styles.status}>{message}</p>
  </section>;
}
