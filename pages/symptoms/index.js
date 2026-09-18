import { useState } from 'react';
import Link from 'next/link';
import ReaderLayout from '../../components/reader/ReaderLayout';
import { searchSymptoms, SYMPTOMS, SYMPTOM_CATEGORIES } from '../../lib/engineeringSymptoms.mjs';
import lab from '../../styles/Symptoms.module.css';
import styles from '../../styles/Reader.module.css';
export default function SymptomsAtlas() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const results = searchSymptoms(query, category);
  return <ReaderLayout title="Engineering Symptoms Atlas" description="Search observed engineering symptoms, compare plausible causes, and find the next diagnostic step."><div className={lab.entry}>
    <section className={styles.hero}><p className={styles.eyebrow}>ENGINEERING SYMPTOMS ATLAS · 10 JAVA / SPRING SYMPTOMS</p><h1>Start with what you observe.</h1><p className={styles.lead}>A symptom is a starting point. Compare plausible causes, find evidence that separates them, and reproduce one mechanism in a small example.</p><p>Browse without signing in. Search stays in this page; no production logs or AI response required.</p></section>
    <section aria-label="Find a symptom"><label>Search symptoms<input type="search" maxLength={200} value={query} onChange={event => setQuery(event.target.value)} placeholder="Try low CPU, slow query, or duplicate messages" /></label>
      <div className={`${styles.actions} ${lab.filters}`} role="group" aria-label="Filter by area">{SYMPTOM_CATEGORIES.map(area => <button key={area} aria-pressed={category === area} onClick={() => setCategory(area)}>{area}</button>)}</div>
      <p role="status">{results.length} {results.length === 1 ? 'symptom' : 'symptoms'} found</p>
      {results.length ? <div className={styles.grid}>{results.map(entry => <article className={styles.card} key={entry.slug}><p className={styles.eyebrow}>{entry.category}</p><h2><Link href={`/symptoms/${entry.slug}`}>{entry.title}</Link></h2><p>{entry.summary}</p><p className={styles.small}>3 plausible causes · evidence to distinguish them · lesson → scenario → practice</p></article>)}</div> : <div className={styles.card}><h2>No matching entry yet</h2><p>Try fewer symptom words or clear the area filter. The atlas currently contains {SYMPTOMS.length} entries.</p><button onClick={() => { setQuery(''); setCategory('All'); }}>Clear search and filters</button><p><Link href="/requests">Suggest a symptom for the atlas</Link></p></div>}
    </section>
  </div></ReaderLayout>;
}
