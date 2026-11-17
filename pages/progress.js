import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ReaderLayout from '../components/reader/ReaderLayout';
import { loadSessionSnapshot } from '../lib/sessionPersistence.mjs';
import { practiceEvidence } from '../lib/practiceEvidence.mjs';
import styles from '../styles/Reader.module.css';

export default function Progress() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  function refresh() {
    try { setReport(practiceEvidence(loadSessionSnapshot(localStorage)?.practice?.attempts)); setError(''); }
    catch { setReport(null); setError('Practice evidence could not be read. Your saved work has not changed.'); }
  }
  useEffect(() => { refresh(); }, []);
  return <ReaderLayout title="Your practice evidence" description="Review topic coverage, comparable retests, and the limits of your recorded assessment evidence."><Head><meta name="robots" content="noindex, nofollow" /></Head><h1>Your practice evidence</h1><p>Review what you have demonstrated, then choose the next gap to practise. This page reads the current browser’s saved practice records. Open the practice workspace to sync an account before refreshing here.</p><div className={styles.actions}><Link href="/diagnostic">Take the optional baseline diagnostic</Link><Link href="/practice">Continue practice</Link><button type="button" onClick={refresh}>Refresh evidence</button></div>{error && <p role="alert">{error}</p>}{!report && !error && <p role="status">Loading saved evidence…</p>}{report && <><section className={styles.card} aria-label="Evidence summary"><h2>{report.label}</h2><p>{report.limitation}</p><dl><dt>Submitted answers</dt><dd>{report.submitted}</dd><dt>Assessed answers</dt><dd>{report.assessed}</dd><dt>Topics represented</dt><dd>{report.covered} / {report.domains.length}</dd><dt>Descriptive score average</dt><dd>{report.average === null ? 'Not assessed' : `${report.average}/10`}</dd><dt>Unassessed / excluded or separate reassessments</dt><dd>{report.unassessed} / {report.excluded}</dd><dt>Records with model, prompt, question and settings versions</dt><dd>{report.versioned}</dd><dt>Historical records without complete version metadata</dt><dd>{report.unversioned}</dd></dl><p>Different questions and difficulties are not interchangeable measurements. Historical records remain visible but do not establish a version-matched improvement.</p></section><section><h2>Choose the next topic</h2><div className={styles.grid}>{report.domains.map(domain => <article key={domain.id} className={styles.card}><h3>{domain.title}</h3><p>{domain.assessed} assessed answers · descriptive average {domain.average === null ? 'not assessed' : `${domain.average}/10`}</p><Link href={domain.href}>{domain.assessed ? 'Strengthen this topic' : 'Start this topic'} →</Link></article>)}</div></section><section className={styles.card}><h2>Comparable retests</h2><p>{report.comparisons.length} comparable pairs · {report.improved} improved scores. A pair needs a fresh answer to the same question, matching difficulty, round, rubric, model, prompt, question and settings version. Disputed results and separate reassessments do not count.</p>{report.comparisons.map(pair => <p key={pair.id}>{pair.topic}: {pair.delta > 0 ? '+' : ''}{pair.delta}/10 compared with its original attempt.</p>)}<p>AI confidence labels describe the model’s assessment; they are not a measured probability of correctness. Review rubric evidence and flag incorrect feedback in the practice workspace.</p></section></>}</ReaderLayout>;
}
