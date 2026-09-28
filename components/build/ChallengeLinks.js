import Link from 'next/link';
import { BUILD_CHALLENGES } from '../../lib/buildChallenges.mjs';

export default function ChallengeLinks({ courseId }) {
  const challenges = BUILD_CHALLENGES.filter(c => c.lesson === courseId);
  if (!challenges.length) return null;
  return <section aria-label="Related coding challenges"><h2>Put this lesson into practice</h2><ul>{challenges.map(c => <li key={c.id}><Link href={`/build/practice/${c.id}`}>{c.title}</Link> · {c.difficulty}</li>)}</ul><p>Java 17 · editable starters, failure checks, hints, and reference solutions.</p></section>;
}
