import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BUILD_CHALLENGES, CHALLENGE_STORAGE_KEY, normalizeChallengeProgress } from '../../lib/buildChallenges.mjs';
import styles from '../../styles/Reader.module.css';
import practice from '../../styles/BuildPractice.module.css';

export default function ChallengeCatalog() {
  const [query,setQuery]=useState(''); const [track,setTrack]=useState('All'); const [difficulty,setDifficulty]=useState('All'); const [progress,setProgress]=useState({});
  useEffect(() => { try { setProgress(normalizeChallengeProgress(JSON.parse(localStorage.getItem(CHALLENGE_STORAGE_KEY)||'{}'))); } catch { /* Catalog works without storage. */ } },[]);
  const filtered=BUILD_CHALLENGES.filter(c => (track==='All'||c.track===track) && (difficulty==='All'||c.difficulty===difficulty) && `${c.title} ${c.contract}`.toLowerCase().includes(query.toLowerCase()));
  return <section aria-labelledby="challenge-catalog"><h2 id="challenge-catalog">Practice engineering in code</h2><p>{BUILD_CHALLENGES.length} original Java 17 challenges. Implement a contract, test its failure cases, then explain your design. Save your progress in this browser.</p>
    <div className={`${styles.actions} ${practice.filters}`}>
      <label>Search challenges<input type="search" value={query} onChange={e=>setQuery(e.target.value)} /></label>
      <div><label htmlFor="challenge-track">Track</label><select id="challenge-track" value={track} onChange={e=>setTrack(e.target.value)}>{['All','System components','Object design','Concurrency'].map(t=><option key={t}>{t}</option>)}</select></div>
      <div><label htmlFor="challenge-difficulty">Difficulty</label><select id="challenge-difficulty" value={difficulty} onChange={e=>setDifficulty(e.target.value)}>{['All','Easy','Medium','Hard'].map(t=><option key={t}>{t}</option>)}</select></div>
    </div><p role="status">{filtered.length} challenges shown</p>
    <div className={styles.grid}>{filtered.map(c=><article className={styles.card} key={c.id}><p>{c.track} · {c.difficulty}</p><h3><Link href={`/build/practice/${c.id}`}>{c.title}</Link></h3><p>{c.contract}</p><p>{progress[c.id]?.evidence === 'runner' ? 'Runner checks passed for saved draft' : progress[c.id]?.evidence === 'local' ? 'Local checks self-reported' : progress[c.id] ? 'Draft in progress' : 'Not started'}</p></article>)}</div>
    {!filtered.length && <p>No challenges match. Change the filters or search term.</p>}
  </section>;
}
