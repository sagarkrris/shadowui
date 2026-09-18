import Link from 'next/link';
import { useEffect, useState } from 'react';
import { NOTEBOOK_KEY, normalizeNotebook } from '../../lib/learningNotebook.mjs';
import styles from '../../styles/Reader.module.css';
import { RESUME_KEY, normalizeResume } from '../../lib/learningResume.mjs';
export default function ContinueLearning() {
  const [note, setNote] = useState(null);
  const [recent, setRecent] = useState([]);
  useEffect(() => { try { setRecent(normalizeResume(JSON.parse(localStorage.getItem(RESUME_KEY)))); } catch { /* Optional shortcut. */ } }, []);
  useEffect(() => { try { setNote(normalizeNotebook(JSON.parse(localStorage.getItem(NOTEBOOK_KEY) || '[]')).find(item => !item.completed) || null); } catch { /* Optional shortcut. */ } }, []);
  const items = [...recent, ...(note && !recent.some(item => item.href.split('#')[0] === note.href.split('#')[0]) ? [note] : [])].slice(0, 3);
  return <section className={styles.card}><h2>Continue where you left off</h2>{items.length ? <ul>{items.map(item => <li key={item.href}><Link prefetch={false} href={item.href}>{item.title} →</Link>{item.section && <p className={styles.small}>Resume: {item.section}</p>}</li>)}</ul> : <p>Start reading, investigate a case, or save a project draft. Return here to continue.</p>}<div className={styles.actions}><Link prefetch={false} href="/notebook">My learning notebook</Link><Link prefetch={false} href="/practice">Resume unfinished practice</Link></div><p className={styles.small}>Recent reading positions, experiments, and saved activity progress stay in this browser. No account required.</p></section>;
}
