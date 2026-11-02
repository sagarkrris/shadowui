import Link from 'next/link';
import { PREP_SESSION_STEPS, normalizePrepSessionPlan, canFinishPrepSession } from '../../lib/prepSessionPlan.mjs';
export default function PrepSessionPlan({ plan, onChange, onRecall, onRepair, hasAttempt, history = [], onNewSession }) {
  const value = normalizePrepSessionPlan(plan);
  const update = changes => onChange({ ...value, ...changes, finished: false });
  return <section aria-label="Your prep session" className="practice-panel">
    <h2>A session that fits your time</h2>
    <label>Available study time<select value={value.minutes} onChange={event => onChange({ minutes: Number(event.target.value), completed: [], reflection: '', finished: false })}>{[5, 15, 30].map(minutes => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label>
    <p>This is a suggested time budget. Stop and resume when you need to.</p>
    <ol>{PREP_SESSION_STEPS[value.minutes].map((step, index) => <li key={step}><label><input type="checkbox" checked={value.completed.includes(index)} onChange={event => update({ completed: event.target.checked ? [...value.completed, index] : value.completed.filter(i => i !== index) })} />{step}</label></li>)}</ol>
    <div className="practice-actions"><button type="button" onClick={onRecall}>{value.minutes === 5 ? 'Recall one question' : 'Practise this topic'}</button>{hasAttempt && <button type="button" onClick={onRepair}>Repair my last gap</button>}<Link href="/learn">Study an explanation</Link></div>
    <label>Session reflection and remaining gaps<textarea rows={3} maxLength={4000} value={value.reflection} onChange={event => update({ reflection: event.target.value })} /></label>
    <button type="button" disabled={!canFinishPrepSession(value) || value.finished} onClick={() => onChange({ ...value, finished: true })}>Complete prep session</button>
    <p role="status">{value.finished ? 'Session complete. Your reflection is saved with your practice workspace.' : `${value.completed.length} of ${PREP_SESSION_STEPS[value.minutes].length} steps checked${value.minutes === 30 ? ' · add a reflection to finish' : ''}`}</p>
    <button type="button" onClick={onNewSession}>Start a new prep session</button>
    <details><summary>Session history ({history.length})</summary>{history.slice().reverse().map(session => <article key={session.id}><h3>{session.minutes} minutes · {session.completedAt ? new Date(session.completedAt).toLocaleString() : 'Date unavailable'}</h3><p>{session.finished ? 'Completed' : 'Saved before starting again'} · {session.attemptIds.length} linked attempts</p><p>{session.reflection}</p></article>)}</details>
    <p>Steps are self-reported. Assessed attempts and test results remain separate evidence.</p>
  </section>;
}
