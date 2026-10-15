import { useState } from 'react';
import Link from 'next/link';
import ReaderLayout from '../reader/ReaderLayout';
import UiIcon from '../reader/UiIcon';
import { designHref, filterDesignProblems } from '../../lib/designLibrary.mjs';
import useDesignProgress from './useDesignProgress';
import styles from '../../styles/DesignLibrary.module.css';

export default function DesignCatalog({ track, problems }) {
  const [filters, setFilters] = useState({ query: '', difficulty: 'All', topic: 'All', status: 'All' });
  const { progress, update, ready, storageError } = useDesignProgress();
  const hld = track === 'hld';
  const title = hld ? 'High-level design' : 'Low-level design';
  const visible = filterDesignProblems(problems, filters, progress);
  const completed = problems.filter(problem => progress[`${track}/${problem.slug}`]?.done).length;
  function filter(key, value) { setFilters(current => ({ ...current, [key]: value })); }
  return <ReaderLayout title={`${title} problems & solutions`} description="Original worked design problems with diagrams, trade-offs, boundary checks and saved practice notes.">
    <div className={styles.catalog}>
      <nav className={styles.trackNav} aria-label="Design tracks"><Link href="/hld" aria-current={hld ? 'page' : undefined}>HLD · System architecture</Link><Link href="/lld" aria-current={!hld ? 'page' : undefined}>LLD · Object design</Link><Link href="/system-design/visual-guide">Concept field guide <span aria-hidden="true">↗</span></Link></nav>
      <header className={styles.hero}>
        <div><p className={styles.eyebrow}>THE DESIGN WORKBOOK / {track.toUpperCase()}</p><h1>{title}.<br /><em>Decisions you can defend.</em></h1><p>{hld ? 'Go from a product brief to a system that survives scale, retries and partial failure.' : 'Turn requirements into clear objects, safe state transitions and maintainable code.'} Study the worked solution, then explain your own.</p></div>
        <aside className={styles.progressCard}><UiIcon name="layers" size={30} /><strong>{problems.length}<span>worked problems</span></strong><progress aria-label="Completed design problems" value={completed} max={problems.length} /><p>{completed} of {problems.length} completed</p><small>Every problem includes a solution.<br />Progress and notes stay in this browser.</small></aside>
      </header>
      <div className={styles.introBar}><span><UiIcon name="check" size={17} /> Original reference solutions</span><span><UiIcon name="layers" size={17} /> {hld ? 'Architecture diagrams' : 'Class responsibility diagrams'}</span><span><UiIcon name="code" size={17} /> {hld ? 'APIs, data & failure boundaries' : 'Java 17 core models & checks'}</span></div>
      <section className={styles.filters} aria-label="Filter design problems">
        <label className={styles.search}>Search problems<input type="search" value={filters.query} placeholder={hld ? 'Search caching, booking, messaging…' : 'Search parking, state, cache…'} onChange={event => filter('query', event.target.value)} /></label>
        <label>Difficulty<select aria-label="Difficulty" value={filters.difficulty} onChange={event => filter('difficulty', event.target.value)}><option value="All">All difficulties</option>{['Easy', 'Medium', 'Hard'].map(item => <option key={item}>{item}</option>)}</select></label>
        <label>Topic<select aria-label="Topic" value={filters.topic} onChange={event => filter('topic', event.target.value)}><option value="All">All topics</option>{[...new Set(problems.map(p => p.topic))].map(item => <option key={item}>{item}</option>)}</select></label>
        <label>Progress<select aria-label="Progress" value={filters.status} disabled={!ready} onChange={event => filter('status', event.target.value)}>{['All', 'Not completed', 'Completed', 'To revisit'].map(item => <option key={item}>{item}</option>)}</select></label>
      </section>
      <div className={styles.results}><p role="status">{visible.length} of {problems.length} problems</p><button type="button" onClick={() => setFilters({ query: '', difficulty: 'All', topic: 'All', status: 'All' })}>Clear filters</button></div>
      {storageError && <p role="status">Browser storage is unavailable. Your changes are visible this session but may not survive a reload.</p>}
      <div className={styles.grid}>
        {visible.map(problem => {
          const key = `${track}/${problem.slug}`;
          const state = progress[key] || {};
          return <article className={styles.card} key={problem.slug}>
            <div className={styles.cardTop}><span className={styles[problem.difficulty.toLowerCase()]}>{problem.difficulty}</span><button type="button" className={styles.star} aria-label={`Revisit: ${problem.title}`} aria-pressed={Boolean(state.starred)} disabled={!ready} onClick={() => update(key, { starred: !state.starred })}>{state.starred ? '★' : '☆'}</button></div>
            <p className={styles.topic}>{problem.topic}</p><h2><Link href={designHref(problem)}>{problem.title}</Link></h2><p>{problem.summary}</p>
            <div className={styles.cardMeta}><span>{problem.minutes} min practice</span><span>Solution included</span></div>
            <div className={styles.cardBottom}><Link href={designHref(problem)}>Open workspace <span aria-hidden="true">→</span></Link><label><input type="checkbox" checked={Boolean(state.done)} disabled={!ready} onChange={event => update(key, { done: event.target.checked })} aria-label={`Completed: ${problem.title}`} />Done</label></div>
          </article>;
        })}
      </div>
      {!visible.length && <div className={styles.empty}><h2>No matching problems</h2><p>Try another search or clear the filters to see the full track.</p></div>}
      <aside className={styles.catalogNote}><strong>Practise the reasoning, not a memorized diagram.</strong><p>These 24 original HLD and LLD references cover the listed problems. Each design makes assumptions and trade-offs explicit. Java examples are bounded core models; their limits and executable checks are included in the workspace.</p></aside>
    </div>
  </ReaderLayout>;
}
