import Link from 'next/link';
import { buddyHref } from '../../lib/learningHub.mjs';
import useHubProgress from './useHubProgress';
export default function LessonPractice({ id, title, question, exercise }) {
  const { progress, ready, message, toggle } = useHubProgress();
  return <section aria-label={`Practice ${title}`} style={{ border: '1px solid #718c91', borderRadius: 8, padding: 14, marginTop: 16 }}>
    <h3>Practice this lesson</h3><p>{exercise || 'Write the smallest example, test a boundary input, and explain one limitation.'}</p>
    <p><strong>Checkpoint:</strong> {question || `Explain ${title}, give an example, and defend one trade-off.`}</p>
    <p><Link prefetch={false} href={buddyHref(`${title}: ${question || 'Explain the mechanism, a boundary case, and a trade-off.'}`)}>Practise this lesson with Tech Buddy →</Link></p>
    <label style={{ display: 'block' }}><input type="checkbox" disabled={!ready} checked={progress.completed.includes(id)} onChange={() => toggle('completed', id)} /> I completed this lesson and its self-check</label>
    <label style={{ display: 'block' }}><input type="checkbox" disabled={!ready} checked={progress.weak.includes(id)} onChange={() => toggle('weak', id)} /> I need another attempt at this lesson</label>
    <p role="status">{message}</p><Link prefetch={false} href="/learn">View my learning progress →</Link>
  </section>;
}
