import { useState } from 'react';
import { PRACTICE_RUBRIC, compareAttempts, practiceSummary } from '../../lib/dailyPractice.mjs';

export default function PracticeReview({ practice, onExercise, onRetest, onDelete, loading }) {
  const [query, setQuery] = useState('');
  const exercise = practice.exerciseNotes || '';
  const setExercise = onExercise;
  const attempts = practice.attempts;
  const latest = attempts.at(-1);
  const summary = practiceSummary(attempts);
  if (!latest) return null;
  const previous = attempts.find(a => a.id === latest.parentId);
  const comparison = previous ? compareAttempts(previous, latest) : null;
  return <section className="practice-panel" aria-label="Practice review">
    <h2>Review your practice</h2>
    <p role="status">{latest.score === null ? 'Not assessed' : `${latest.score}/10`} · {latest.topic} · {latest.difficulty} · {latest.round}</p>
    <p><strong>Strongest point:</strong> {latest.strengths?.[0] || 'Not established'}</p>
    <p><strong>Biggest gap:</strong> {latest.gaps?.[0] || 'No specific gap identified'}</p>
    <p><strong>Next action:</strong> {latest.exercise || latest.recommendations?.[0] || 'Explain the mechanism with one concrete example.'}</p>
    {comparison && <p role="status">{comparison.status}{comparison.delta !== null ? ` · ${previous.score}/10 → ${latest.score}/10 (${comparison.delta > 0 ? '+' : ''}${comparison.delta})` : ''}. Same rubric; AI assessment, not proof of broad mastery.</p>}
    <details open={practice.feedbackDepth === 'Detailed explanation'}><summary>Rubric, evidence and deductions</summary>
      <p>AI-generated assessment · Rubric v1. Technical dimensions and communication are assessed separately.</p>
      {PRACTICE_RUBRIC.map(d => { const result = latest.dimensions?.find(v => v.key === d.key); const verified = result?.evidence && latest.answer.includes(result.evidence); return <div key={d.key} className="practice-rubric"><strong>{d.label}: {result?.score ?? 'Not assessed'}</strong><p>{d.description}</p>{verified && <blockquote>{result.evidence}</blockquote>}<p>{result?.deduction || 'No evidence-backed deduction provided.'}</p>{result?.evidence && !verified && <p>Evidence quote could not be verified against your answer.</p>}</div>; })}
    </details>
    <label>Targeted exercise notes<textarea value={exercise} onChange={e => setExercise(e.target.value)} placeholder="Work through the exercise, then attempt the retest in your own words." /></label>
    <div className="practice-actions"><button disabled={loading} onClick={() => { onRetest(latest, false, exercise); setExercise(''); }}>Explain it again · 60 seconds</button><button disabled={loading || !exercise.trim() || !latest.followUp} onClick={() => { onRetest(latest, true, exercise); setExercise(''); }}>Complete drill and retest</button></div>
    <p>Both actions create a new attempt. Only your submitted answer counts toward improvement.</p>
    <details><summary>Attempt history and topic trends · {summary.completed} completed</summary>
      <p>{summary.readiness}</p>
      {summary.topics.map(t => <p key={t.topic}>{t.topic}: {t.scores.join(' → ')} /10 · Different difficulties are not directly comparable.</p>)}
      <label>Search saved attempts<input value={query} onChange={e => setQuery(e.target.value)} /></label>
      {attempts.filter(a => `${a.question} ${a.topic}`.toLowerCase().includes(query.toLowerCase())).slice().reverse().map(a => <details key={a.id}><summary>{a.topic} · {a.score ?? 'Not assessed'} · {a.difficulty} · {a.completedAt ? new Date(a.completedAt).toLocaleString() : "Imported · date unavailable"}</summary><p>{a.question}</p><blockquote>{a.answer}</blockquote><p>{a.feedback}</p><button disabled={loading} onClick={() => onDelete(a.id)}>Remove this practice record</button></details>)}
    </details>
  </section>;
}
