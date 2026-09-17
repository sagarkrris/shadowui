import { useMemo, useState } from 'react';
import { JAVA_CURATED_TUTORIAL_CATALOG, JAVA_INTERVIEW_QA, JAVA_PRODUCTION_SCENARIOS, slugifyJavaTutorial } from '../../lib/javaDigest.mjs';
export default function LearningSearch({ attempts, designs, onQuestion, onSaved, onDesign }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All');
  const records = useMemo(() => [
    ...JAVA_CURATED_TUTORIAL_CATALOG.map(t => ({ id: t.id, type: 'Lesson', label: t.title, href: `/java/tutorial/${slugifyJavaTutorial(t.title)}` })),
    ...JAVA_INTERVIEW_QA.map(q => ({ id: q.id, type: 'Question', label: q.question, question: q.question })),
    ...JAVA_PRODUCTION_SCENARIOS.map(s => ({ id: s.id, type: 'Scenario', label: s.title, question: s.prompt })),
    ...attempts.map(a => ({ id: a.id, type: 'Saved attempt', label: `${a.topic}: ${a.question}`, attempt: a })),
    ...designs.map(d => ({ id: d.id, type: 'Saved design', label: d.draft.name })),
  ], [attempts, designs]);
  const results = query.trim() ? records.filter(r => (type === 'All' || r.type === type) && r.label.toLowerCase().includes(query.toLowerCase())).slice(0, 30) : [];
  return <details className="practice-panel"><summary>Explore lessons, questions, scenarios and saved work</summary><label>Search learning and saved work<input value={query} onChange={e => setQuery(e.target.value)} /></label><label>Result type<select value={type} onChange={e => setType(e.target.value)}>{['All', 'Lesson', 'Question', 'Scenario', 'Saved attempt', 'Saved design'].map(t => <option key={t}>{t}</option>)}</select></label><ul>{results.map(r => <li key={`${r.type}:${r.id}`}><strong>{r.type}</strong> · {r.href ? <a href={r.href}>{r.label}</a> : <button onClick={() => r.attempt ? onSaved(r.attempt) : r.type === 'Saved design' ? onDesign(r.id) : onQuestion(r.question, r.type)}>{r.label}</button>}</li>)}</ul>{query && !results.length && <p role="status">No matching results in the indexed Java lessons, questions, scenarios or your saved work.</p>}</details>;
}
