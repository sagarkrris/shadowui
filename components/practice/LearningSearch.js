import Link from 'next/link';
import useDiscoveryCatalogue from '../../hooks/useDiscoveryCatalogue';
import { searchDiscovery } from '../../lib/publicNavigation.mjs';
import { useMemo, useState } from 'react';
import { JAVA_CURATED_TUTORIAL_CATALOG, JAVA_INTERVIEW_QA, JAVA_PRODUCTION_SCENARIOS, slugifyJavaTutorial } from '../../lib/javaDigest.mjs';
export default function LearningSearch({ attempts, designs, onQuestion, onSaved, onDesign }) {
  const { records: catalogue, saved, load, retry } = useDiscoveryCatalogue();
  const [limit, setLimit] = useState(30);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All');
  const records = useMemo(() => [
    ...catalogue.map((item, index) => ({ ...item, id: `catalogue-${index}`, label: item.title })),
    ...saved.map((item, index) => ({ ...item, id: `saved-${index}`, label: item.title })),
    ...JAVA_CURATED_TUTORIAL_CATALOG.map(t => ({ id: t.id, type: 'Lesson', label: t.title, href: `/java/tutorial/${slugifyJavaTutorial(t.title)}` })),
    ...JAVA_INTERVIEW_QA.map(q => ({ id: q.id, type: 'Question', label: q.question, question: q.question })),
    ...JAVA_PRODUCTION_SCENARIOS.map(s => ({ id: s.id, type: 'Scenario', label: s.title, question: s.prompt })),
    ...attempts.map(a => ({ id: a.id, type: 'Saved attempt', label: `${a.topic}: ${a.question}`, attempt: a })),
    ...designs.map(d => ({ id: d.id, type: 'Saved design', label: d.draft.name })),
  ].map(item => ({ ...item, title: item.label })), [attempts, designs, catalogue, saved]);
  const results = query.trim() ? searchDiscovery(records, query, type, Infinity) : [];
  return <details className="practice-panel"><summary>Explore lessons, questions, scenarios and saved work</summary><label>Search learning and saved work<input value={query} onChange={e => { setQuery(e.target.value); setLimit(30); }} /></label><label>Result type<select value={type} onChange={e => { setType(e.target.value); setLimit(30); }}>{['All', 'Course', 'Article', 'Lab', 'Challenge', 'Saved', 'Lesson', 'Question', 'Scenario', 'Saved attempt', 'Saved design'].map(t => <option key={t}>{t}</option>)}</select></label><p role="status">{load === 'loading' ? 'Loading the full library. Saved work and Java shortcuts remain available.' : load === 'error' ? 'The full library could not load. Saved work and Java shortcuts remain available.' : `Showing ${Math.min(limit, results.length)} of ${results.length} results`}</p>{load === 'error' && <button type="button" onClick={retry}>Retry loading library</button>}<ul>{results.slice(0, limit).map(r => <li key={`${r.type}:${r.id}`}><strong>{r.type}</strong> · {r.href ? <Link prefetch={false} href={r.href}>{r.label}</Link> : <button onClick={() => r.attempt ? onSaved(r.attempt) : r.type === 'Saved design' ? onDesign(r.id) : onQuestion(r.question, r.type)}>{r.label}</button>}</li>)}</ul>{results.length > limit && <button type="button" onClick={() => setLimit(value => value + 30)}>Show more results</button>}{query && !results.length && <p role="status">No matching results. Try a broader topic or another result type.</p>}</details>;
}
