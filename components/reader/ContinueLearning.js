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
  return <section className={styles.card}><h2>Continue where you left off</h2>{items.length ? <ul>{items.map(item => <li key={item.href}><Link prefetch={false} href={item.href}>{item.title} →</Link>{item.section && <p className={styles.small}>Resume: {item.section}</p>}</li>)}</ul> : <p>Start reading, investigate a case, or save a project draft. Return here to continue.</p>}<div className={styles.actions}><Link prefetch={false} href="/notebook">My learning notebook</Link><Link prefetch={false} href="/practice">Open practice workspace</Link></div><p className={styles.small}>Reading, roadmap, notebook, and practice shortcuts are read from this browser. No account required.</p></section>;
}
