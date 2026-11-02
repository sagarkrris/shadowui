import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { searchDiscovery } from '../../lib/publicNavigation.mjs';
import useDiscoveryCatalogue from '../../hooks/useDiscoveryCatalogue';
import UiIcon from './UiIcon';
import styles from '../../styles/PublicUi.module.css';

export default function DiscoverySearch({ onClose }) {
  const dialog = useRef(null);
  const input = useRef(null);
  const { records, saved, load, retry } = useDiscoveryCatalogue();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All');
  const [limit, setLimit] = useState(30);
  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current;
    element.showModal();
    input.current.focus();
    return () => { element.close(); if (previous?.isConnected) previous.focus(); };
  }, []);
  const matches = useMemo(() => searchDiscovery([...records, ...saved], query, type, Infinity), [records, saved, query, type]);
  return <dialog ref={dialog} className={styles.searchDialog} aria-labelledby="discovery-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={styles.searchSurface}>
      <div className={styles.searchTop}><div><p className={styles.overline}>FIND YOUR NEXT STEP</p><h2 id="discovery-title">Search the learning library</h2></div><button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close search"><UiIcon name="close" /></button></div>
      <label className={styles.searchField}><UiIcon name="search" /><span className={styles.visuallyHidden}>Search all learning content</span><input ref={input} type="search" value={query} onChange={event => { setQuery(event.target.value); setLimit(30); }} placeholder="Try caching, Java, transactions…" maxLength={160} /></label>
      <div className={styles.filterRow} aria-label="Search result filters">{['All', 'Course', 'Lesson', 'Article', 'Lab', 'Challenge', 'Saved'].map(value => <button type="button" key={value} aria-pressed={type === value} onClick={() => { setType(value); setLimit(30); }}>{value === 'All' ? 'All' : `${value}${value === 'Saved' ? '' : 's'}`}</button>)}</div>
      <p className={styles.searchMeta} role="status">{load === 'loading' ? 'Loading the full library. Shortcuts are available below.' : load === 'error' ? 'The full library could not load. Navigation shortcuts and saved notes are still available.' : `Showing ${Math.min(limit, matches.length)} of ${matches.length} results${query ? ` for “${query}”` : ' · start anywhere'}`}</p>
      {load === 'error' && <button type="button" className={styles.retryButton} onClick={retry}>Retry loading library</button>}
      <ul className={styles.searchResults}>{matches.slice(0, limit).map((item, index) => <li key={`${item.type}:${item.href}:${index}`}><Link prefetch={false} href={item.href} onClick={onClose}><span className={styles.resultIcon}><UiIcon name={item.type === 'Saved' ? 'bookmark' : item.type === 'Challenge' ? 'code' : 'book'} /></span><span><small>{item.type}{item.category !== item.type && ` · ${item.category}`}</small><strong>{item.title}</strong><span>{item.description}</span></span><UiIcon name="arrow" /></Link></li>)}</ul>
      {matches.length > limit && <button type="button" onClick={() => setLimit(value => value + 30)}>Show more results</button>}
      {!matches.length && <div className={styles.emptyState}><UiIcon name="search" size={30} /><h3>No matches yet</h3><p>Try a broader topic or another content type.</p><button type="button" onClick={() => { setQuery(''); setType('All'); setLimit(30); input.current.focus(); }}>Clear filters</button></div>}
      <p className={styles.searchFooter}>Tab to a result · Enter to open · Esc to close<span>Saved notes stay in this browser.</span></p>
    </div>
  </dialog>;
}
