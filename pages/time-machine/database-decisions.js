import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ReaderLayout from '../../components/reader/ReaderLayout';
import { ERAS, TIME_MACHINE_KEY, TIME_MACHINE_PATH, normalizeTimeline, timelineFromShare, sharePath, inheritedContext, decisionMarkdown } from '../../lib/engineeringTimeMachine.mjs';
import styles from '../../styles/Reader.module.css';
import DesignChange from '../../components/time-machine/DesignChange';
import lab from '../../styles/TimeMachine.module.css';

function Timeline({ timeline }) {
  return <ol className={lab.timeline}>{timeline.map((item, index) => {
    const era = ERAS[index], option = era.options.find(candidate => candidate.id === item.choice);
    return <li key={era.id}><h3>{era.title}</h3><p><strong>{option.title}</strong></p><p>{option.outcome}</p><p><strong>Trade-off:</strong> {option.cost}</p><p><strong>Keep:</strong> {era.keep}</p>{item.reason && <p><strong>Your reasoning:</strong> {item.reason}</p>}<details><summary>Explore the before/after design</summary><DesignChange timeline={timeline} index={index} /></details></li>;
  })}</ol>;
}
export default function DatabaseDecisions() {
  const router = useRouter();
  const moveFocus = useRef(false);
  const [timeline, setTimeline] = useState([]);
  const [ready, setReady] = useState(false);
  const [choice, setChoice] = useState('');
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  const [copyFallback, setCopyFallback] = useState('');
  const [undo, setUndo] = useState(null);
  useEffect(() => {
    try { setTimeline(normalizeTimeline(JSON.parse(localStorage.getItem(TIME_MACHINE_KEY) || '[]'))); }
    catch { setNotice('Saved decisions could not be loaded. You can still explore and download a summary.'); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    const target = document.getElementById('decision-review') || document.getElementById('turning-point');
    target?.focus();
    target?.scrollIntoView({ block: 'start' });
  }, [timeline]);
  function save(next) {
    moveFocus.current = true;
    setTimeline(next); setChoice(''); setReason(''); setCopyFallback('');
    try { localStorage.setItem(TIME_MACHINE_KEY, JSON.stringify(next)); setNotice('Decisions saved in this browser.'); }
    catch { setNotice('Browser storage is unavailable. Download your summary to keep it.'); }
  }
  async function share() {
    const url = `${window.location.origin}${sharePath(timeline)}`;
    try { await navigator.clipboard.writeText(url); setNotice('Decision link copied. Your written reasoning is not included.'); }
    catch { setCopyFallback(url); setNotice('Copy the decision link below. Your written reasoning is not included.'); }
  }
  function download() {
    const text = decisionMarkdown(timeline, `${window.location.origin}${TIME_MACHINE_PATH}`);
    const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'database-decision-timeline.md'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('Summary downloaded, including your written reasoning.');
  }
  const era = ERAS[timeline.length];
  const shared = router.isReady ? timelineFromShare(router.query.path) : [];
  return <ReaderLayout title="Engineering Time Machine: database decisions" description="Revisit a database design as traffic, regional recovery, and deletion requirements change.">
    <section className={styles.hero}><p className={styles.eyebrow}>ENGINEERING TIME MACHINE · PILOT · 10 MINUTES</p><h1>Your database choice was reasonable. Then the constraints changed.</h1><p className={styles.lead}>Keep what still works. Change what the new evidence requires. Follow a small store through three turning points.</p><p>No account or AI response needed. Fictional constraints, qualitative consequences, and multiple defensible trade-offs—not a performance simulation.</p><p className={styles.small}>InterviewIQ Editorial · Updated September 18, 2026 · Individual reviewer unassigned.</p></section>
    {router.isReady && router.query.path !== undefined && <section className={styles.card} aria-label="Shared decision timeline"><h2>A shared decision path</h2>{shared.length ? <><p>This read-only comparison does not replace your saved decisions. Written reasoning is never included in shared URLs.</p><Timeline timeline={shared} /></> : <p>This shared path is invalid or uses an unsupported version. You can still start your own below.</p>}</section>}
    <section><h2>The starting design</h2><p>One region, one relational database, a small catalogue, and transactional order/inventory updates. You have two engineers and tested backups. No cache or remote standby yet.</p><p>The exercise asks what to change, what to preserve, and which evidence to gather. It does not award a universal architecture score.</p></section>
    <section aria-label="Your decision timeline"><h2>Your timeline</h2><p>{timeline.length} of 3 decisions recorded</p><progress aria-label="Decisions recorded" value={timeline.length} max={3} /><Timeline timeline={timeline} />
      {timeline.length > 0 && <div className={styles.actions}><button onClick={() => { setUndo(timeline); save(timeline.slice(0, -1)); }}>Rewind the last decision</button><button onClick={share}>Copy decision link</button><button onClick={download}>Download summary with my reasoning</button></div>}
      {undo && <button onClick={() => { save(undo); setUndo(null); }}>Undo rewind</button>}
      <p role="status">{notice}</p>{copyFallback && <label>Decision link<input readOnly value={copyFallback} onFocus={event => event.target.select()} /></label>}
    </section>
    {timeline.length > 0 && <section><h2 id="decision-review" tabIndex={-1}>See the consequences of your latest decision</h2><DesignChange timeline={timeline} index={timeline.length - 1} /><h3>Compare the latest alternatives</h3><p>These consequences are editorial reasoning for the stated constraints. They are not measured results or guarantees.</p><div className={styles.grid}>{ERAS[timeline.length - 1].options.map(option => <article key={option.id} className={styles.card}><h3>{option.title}</h3><p>{option.outcome}</p><p><strong>Cost:</strong> {option.cost}</p><p><strong>Evidence to gather:</strong> {option.next}</p></article>)}</div></section>}
    {era ? <section className={lab.era} aria-label="Current turning point"><p className={styles.eyebrow}>TURNING POINT {timeline.length + 1}</p><h2 id="turning-point" tabIndex={-1}>{era.title}</h2><p><strong>Changed constraints:</strong> {era.constraint}</p><aside className={styles.card}><strong>What can stay?</strong><p>{era.keep}</p></aside>
      {era.id === 'deletion' && <div><h3>Your earlier decisions added these obligations</h3><ul>{inheritedContext(timeline).map(item => <li key={item}>{item}</li>)}</ul></div>}
      <form onSubmit={event => { event.preventDefault(); if (!era.options.some(option => option.id === choice)) return; setUndo(null); save([...timeline, { choice, reason: reason.trim() }]); }}>
        <fieldset disabled={!ready}><legend>What would you change now?</legend>{era.options.map(option => <label key={option.id} className={lab.option}><input type="radio" name="decision" value={option.id} required checked={choice === option.id} onChange={event => setChoice(event.target.value)} />{option.title}</label>)}</fieldset>
        <label>Your reasoning (optional, saved only in this browser)<textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={800} rows={3} /></label><button disabled={!ready || !choice}>Record decision and move forward</button>
      </form>
    </section> : <section className={styles.card}><h2 id="turning-point" tabIndex={-1}>A design evolves; its invariants survive.</h2><p>You reached the final turning point. Rewind to explore another path, or share a summary with a teammate. The next useful step is testing the assumptions in each decision.</p><Link href="/series/understand-database-performance">Explore database performance →</Link></section>}
    <section><h2>Mechanisms and references</h2><p>The fictional workload and deletion policy belong to this exercise. Technical references support the database mechanisms; they do not prescribe the decisions.</p><ul><li><a href="https://www.postgresql.org/docs/18/using-explain.html">PostgreSQL 18: inspecting query plans</a></li><li><a href="https://www.postgresql.org/docs/18/warm-standby.html">PostgreSQL 18: standby servers and replication trade-offs</a></li></ul><Link href="/corrections">Report a correction</Link></section>
  </ReaderLayout>;
}
