import Link from 'next/link';
import { useEffect, useState } from 'react';
import { continueLearningItems } from '../../lib/continueLearning.mjs';
import styles from '../../styles/Reader.module.css';

export default function ContinueLearning({ hideWhenEmpty = false }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    try { setItems(continueLearningItems(window.localStorage)); }
    catch { setItems([]); }
  }, []);

  if (hideWhenEmpty && !items.length) return null;
  const resumeItem = item => <li key={item.href}><Link prefetch={false} href={item.href}>{item.title} →</Link>{item.section && <p className={styles.small}>Resume: {item.section}</p>}</li>;
  return <section className={`${styles.card} ${styles.continueCard}`} aria-label="Continue learning"><h2>Continue where you left off</h2>{items.length ? <ul>{items.slice(0, 1).map(resumeItem)}</ul> : <p>Start reading, investigate a case, or save a project draft. Return here to continue.</p>}<details><summary>More saved work and shortcuts{items.length > 1 ? ` (${items.length - 1})` : ''}</summary>{items.length > 1 && <ul>{items.slice(1).map(resumeItem)}</ul>}<div className={styles.actions}><Link prefetch={false} href="/notebook">My learning notebook</Link><Link prefetch={false} href="/practice">Open practice workspace</Link></div><p className={styles.small}>Reading, roadmap, notebook, and practice shortcuts are read from this browser. No account required.</p></details></section>;
}
