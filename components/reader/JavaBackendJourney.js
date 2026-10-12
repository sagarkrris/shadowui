import useHubProgress from "../learning/useHubProgress";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BACKEND_ROADMAP_KEY, JAVA_BACKEND_STAGES, normalizeRoadmapProgress, nextRoadmapActivity, roadmapActivityId } from '../../lib/javaBackendRoadmap.mjs';
import { NOTEBOOK_KEY, normalizeNotebook, saveNote } from '../../lib/learningNotebook.mjs';
import styles from '../../styles/Reader.module.css';

export default function JavaBackendJourney() {
  const hub = useHubProgress();
  const [done, setDone] = useState([]);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    try { setDone(normalizeRoadmapProgress(JSON.parse(localStorage.getItem(BACKEND_ROADMAP_KEY) || '[]'))); }
    catch { setMessage('Saved progress is unavailable. You can still follow the roadmap.'); }
    setReady(true);
  }, []);
  function toggle(id) {
    const next = done.includes(id) ? done.filter(item => item !== id) : [...done, id];
    setDone(next);
    try { localStorage.setItem(BACKEND_ROADMAP_KEY, JSON.stringify(next)); setMessage('Progress saved in this browser.'); }
    catch { setMessage('Could not save progress. Your checks will last only for this visit.'); }
  }
  const next = nextRoadmapActivity(done);
  const total = JAVA_BACKEND_STAGES.reduce((count, stage) => count + stage.activities.length, 0);
  return <section aria-label="Guided backend journey">
    <div className={styles.featuredGuide}>
      <h2>Your next step</h2>
      <p>Learn → Experiment → Build → Interview → Review</p>
      <p>Start with the first stage, or revisit a stage that exposes a gap. Check an activity after completing it; opening a link does not mark it complete.</p>
      {ready ? <><p>{done.length} of {total} activities complete · {JAVA_BACKEND_STAGES.filter(s => s.activities.every(a => done.includes(roadmapActivityId(s.id, a.label)))).length} of {JAVA_BACKEND_STAGES.length} stages complete</p>
        <progress aria-label="Backend journey completion" value={done.length} max={total} />
        {next ? <p><Link prefetch={false} className={styles.button} href={next.activity.href}>Continue: {next.stage.title} · {next.activity.label} →</Link></p> : <p>Roadmap complete. Revisit a weak stage or try another interview warm-up.</p>}</> : <p>Loading saved progress…</p>}
      <p className={styles.small}>Completion is self-reported, not a readiness score. Progress stays in this browser. Build exercises state their runtime and limits; follow their local test instructions. Tech Buddy requires a prep profile and an available AI provider.</p>
      <p role="status">{message}</p>
    </div>
    <div className={styles.grid}>{JAVA_BACKEND_STAGES.map((stage, index) => <article className={styles.card} key={stage.id} id={`stage-${stage.id}`}>
      <p className={styles.eyebrow}>Stage {index + 1}</p><h2>{stage.title}</h2>
      <p><strong>Before you start:</strong> {stage.prerequisites}</p>
      <p><strong>Your checkpoint:</strong> {stage.outcome}</p>
      <ol className={styles.list}>{stage.activities.map(activity => {
        const id = roadmapActivityId(stage.id, activity.label);
        return <li key={id}><strong>{activity.label}</strong><p><Link prefetch={false} href={activity.href}>{activity.title}</Link></p><label><input type="checkbox" disabled={!ready} checked={done.includes(id)} onChange={() => toggle(id)} />Completed {stage.title}: {activity.label}</label></li>;
      })}</ol>
      <label><input type="checkbox" disabled={!hub.ready} checked={hub.progress.weak.includes(`stage-java-backend-${stage.id}`)} onChange={() => hub.toggle("weak", `stage-java-backend-${stage.id}`)} />I need to revisit {stage.title}</label><p role="status">{hub.message}</p><StageReflection stage={stage} />
    </article>)}</div>
  </section>;
}

function StageReflection({ stage }) {
  const id = `backend-roadmap-${stage.id}`;
  const [text, setText] = useState('');
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    try { setText(normalizeNotebook(JSON.parse(localStorage.getItem(NOTEBOOK_KEY) || '[]')).find(note => note.id === id)?.interviewAnswer || ''); }
    catch { setMessage('Saved notes are unavailable. You can still write and copy your reflection.'); }
    setReady(true);
  }, [id]);
  function save() {
    try {
      saveNote(localStorage, { id, title: `Backend roadmap: ${stage.title}`, href: `/java/roadmap#review-${stage.id}`, interviewAnswer: text });
      setMessage('Reflection saved in your notebook on this browser.');
    } catch { setMessage('Could not save reflection. Copy your notes before leaving.'); }
  }
  return <details id={`review-${stage.id}`}><summary>Write your stage reflection</summary><label>Review notes for {stage.title}<textarea disabled={!ready} maxLength={4000} rows={5} value={text} onChange={event => setText(event.target.value)} /></label><button type="button" disabled={!ready || !text.trim()} onClick={save}>Save {stage.title} reflection</button><p role="status">{message}</p><Link prefetch={false} href="/notebook">Open my notebook →</Link></details>;
}
