import styles from '../../styles/DesignLibrary.module.css';
import { useEffect, useState } from 'react';

export default function TimedDesignPractice({ minutes, onStart }) {
  const [deadline, setDeadline] = useState(null);
  const [remaining, setRemaining] = useState(minutes * 60);
  const [finished, setFinished] = useState(false);
  const [scores, setScores] = useState({});
  useEffect(() => {
    if (!deadline) return;
    const tick = () => { const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000)); setRemaining(seconds); if (!seconds) { setFinished(true); setDeadline(null); } };
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [deadline]);
  const criteria = ['Explicit requirements and capacity assumptions', 'Request flow and data ownership', 'Failure handling and recovery', 'Trade-offs and alternatives', 'Verification and operational signals'];
  return <section aria-label="Timed design practice"><h2>Timed design practice</h2><p>Browser timer; reloading resets the clock. Your design notes below remain saved separately. Rubric scores are self-assessed.</p><p aria-label="Design time remaining">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</p><button className={styles.timerButton} type="button" disabled={Boolean(deadline)} onClick={() => { setRemaining(minutes * 60); setFinished(false); setScores({}); setDeadline(Date.now() + minutes * 60000); onStart(); }}>Start {minutes}-minute practice</button>{deadline && <button className={styles.timerButton} type="button" onClick={() => { setDeadline(null); setFinished(true); }}>Finish and review</button>}{finished && <div><p role="status">Attempt finished. Compare your notes with the reference, then score the evidence you supplied.</p>{criteria.map(label => <label key={label} style={{ display: 'block', margin: '8px 0' }}>{label}<select aria-label={`${label} score`} value={scores[label] ?? ''} onChange={event => setScores({ ...scores, [label]: Number(event.target.value) })}><option value="" disabled>Choose</option><option value="0">0 — missing</option><option value="1">1 — partly explained</option><option value="2">2 — defended with evidence</option></select></label>)}<p>Self-assessed score: {Object.values(scores).reduce((a,b) => a+b,0)} / 10 · {Object.keys(scores).length}/5 criteria reviewed.</p></div>}</section>;
}
