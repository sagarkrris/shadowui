import Link from 'next/link';
import { useState } from 'react';
import useDiscoveryCatalogue from '../../hooks/useDiscoveryCatalogue';
import { searchDiscovery } from '../../lib/publicNavigation.mjs';
import { canRetestRepair } from '../../lib/gapRepair.mjs';

export default function GapRepair({ attempt, repair, onChange, onRetest, loading }) {
  const { records, load, retry } = useDiscoveryCatalogue();
  const [query, setQuery] = useState(attempt.topic || '');
  const matches = searchDiscovery(records.filter(item => ['Course', 'Lesson', 'Article'].includes(item.type)), query, 'All', 6);
  const value = repair || { attemptId: attempt.id, href: '', title: '', studied: false, exercise: '', confirmed: false };
  const update = changes => onChange({ ...value, ...changes });
  return <section aria-label="Gap repair" className="practice-panel">
    <h3>Work on this gap</h3><p>{attempt.gaps?.[0] || 'Strengthen the mechanism, a boundary case, and a trade-off.'}</p>
    <p>Study → exercise → retest → compare evidence. Your original answer stays in history.</p>
    <label>Find an explanation for this gap<input type="search" value={query} maxLength={160} onChange={event => setQuery(event.target.value)} /></label>
    <p>Choose the explanation that addresses your gap. Suggestions are catalogue matches, not a verified diagnosis.</p>
    {load === 'error' && <p>Catalogue unavailable. <button type="button" onClick={retry}>Retry explanations</button></p>}
    <ul>{matches.map(item => <li key={`${item.type}:${item.href}`}><button type="button" disabled={loading} aria-pressed={value.href === item.href} onClick={() => update({ href: item.href, title: item.title, studied: false })}>{item.title}</button></li>)}</ul>
    {!matches.length && <p>Try a broader topic, or <Link href="/learn">browse the learning hub</Link>.</p>}
    {value.href && <p><Link href={value.href} target="_blank" rel="noopener noreferrer">Study {value.title} (opens a new tab)</Link></p>}
    <label><input type="checkbox" disabled={loading || !value.href} checked={value.studied} onChange={event => update({ studied: event.target.checked })} />I studied the selected explanation</label>
    <p><strong>Exercise:</strong> {attempt.exercise || 'Write a small example of the mechanism, test a boundary input, and explain one trade-off.'}</p>
    <label>Repair exercise and evidence<textarea rows={4} maxLength={4000} disabled={loading} value={value.exercise} onChange={event => update({ exercise: event.target.value, confirmed: false })} /></label>
    <label><input type="checkbox" disabled={loading || !value.exercise.trim()} checked={value.confirmed} onChange={event => update({ confirmed: event.target.checked })} />I completed the exercise and checked its failure case</label>
    <button type="button" disabled={loading || !canRetestRepair(value)} onClick={() => onRetest(attempt, false, value.exercise)}>Retest this gap</button>
    <p>The retest uses the original question and rubric. The new submitted answer is assessed separately. <Link href="/learn#progress">Review roadmap progress</Link>; completion remains your explicit self-assessment.</p>
  </section>;
}
