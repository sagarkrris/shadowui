import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DISCOVERY_SHORTCUTS, searchDiscovery } from '../../lib/publicNavigation.mjs';
import { NOTEBOOK_KEY, normalizeNotebook } from '../../lib/learningNotebook.mjs';
import UiIcon from './UiIcon';
import styles from '../../styles/PublicUi.module.css';

export default function DiscoverySearch({ onClose }) {
  const dialog = useRef(null);
  const input = useRef(null);
  const [records, setRecords] = useState(DISCOVERY_SHORTCUTS);
  const [saved, setSaved] = useState([]);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All');
  const [load, setLoad] = useState('loading');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current;
    element.showModal();
    input.current.focus();
    try { setSaved(normalizeNotebook(JSON.parse(localStorage.getItem(NOTEBOOK_KEY) || '[]')).map(note => ({ title: note.title, href: note.href, description: note.evidence || note.failure || 'Saved in this browser', type: 'Saved', category: 'My notebook' }))); } catch { /* Public discovery remains usable without browser storage. */ }
    return () => { element.close(); if (previous?.isConnected) previous.focus(); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoad('loading');
    fetch('/api/discovery', { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Catalogue unavailable');
      return response.json();
    }).then(data => {
      if (!Array.isArray(data.items)) throw new Error('Invalid catalogue');
      setRecords(data.items); setLoad('ready');
    }).catch(() => { if (!controller.signal.aborted) setLoad('error'); });
    return () => controller.abort();
  }, [retry]);
  const matches = useMemo(() => searchDiscovery([...records, ...saved], query, type), [records, saved, query, type]);
  return <dialog ref={dialog} className={styles.searchDialog} aria-labelledby="discovery-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={styles.searchSurface}>
      <div className={styles.searchTop}><div><p className={styles.overline}>FIND YOUR NEXT STEP</p><h2 id="discovery-title">Search the learning library</h2></div><button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close search"><UiIcon name="close" /></button></div>
      <label className={styles.searchField}><UiIcon name="search" /><span className={styles.visuallyHidden}>Search all learning content</span><input ref={input} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try caching, Java, transactions…" maxLength={160} /></label>
      <div className={styles.filterRow} aria-label="Search result filters">{['All', 'Course', 'Lesson', 'Article', 'Lab', 'Challenge', 'Saved'].map(value => <button type="button" key={value} aria-pressed={type === value} onClick={() => setType(value)}>{value === 'All' ? 'All' : `${value}${value === 'Saved' ? '' : 's'}`}</button>)}</div>
      <p className={styles.searchMeta} role="status">{load === 'loading' ? 'Loading the full library. Shortcuts are available below.' : load === 'error' ? 'The full library could not load. Navigation shortcuts and saved notes are still available.' : `${matches.length}${matches.length === 30 ? '+' : ''} results${query ? ` for “${query}”` : ' · start anywhere'}`}</p>
      {load === 'error' && <button type="button" className={styles.retryButton} onClick={() => setRetry(value => value + 1)}>Retry loading library</button>}
      <ul className={styles.searchResults}>{matches.map((item, index) => <li key={`${item.type}:${item.href}:${index}`}><Link prefetch={false} href={item.href} onClick={onClose}><span className={styles.resultIcon}><UiIcon name={item.type === 'Saved' ? 'bookmark' : item.type === 'Challenge' ? 'code' : 'book'} /></span><span><small>{item.type}{item.category !== item.type && ` · ${item.category}`}</small><strong>{item.title}</strong><span>{item.description}</span></span><UiIcon name="arrow" /></Link></li>)}</ul>
      {!matches.length && <div className={styles.emptyState}><UiIcon name="search" size={30} /><h3>No matches yet</h3><p>Try a broader topic or another content type.</p><button type="button" onClick={() => { setQuery(''); setType('All'); input.current.focus(); }}>Clear filters</button></div>}
      <p className={styles.searchFooter}>Tab to a result · Enter to open · Esc to close<span>Saved notes stay in this browser.</span></p>
    </div>
  </dialog>;
}
