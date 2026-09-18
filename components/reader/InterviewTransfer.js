import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { NOTEBOOK_KEY, normalizeNotebook, saveNote } from '../../lib/learningNotebook.mjs';
import { interviewPrompt, INTERVIEW_CHECKS } from '../../lib/interviewTransfer.mjs';
import styles from '../../styles/Reader.module.css';

export default function InterviewTransfer({ incident }) {
  const section = useRef(null);
  const [answer, setAnswer] = useState(''); const [checks, setChecks] = useState([]);
  const [ready, setReady] = useState(false); const [compare, setCompare] = useState(false); const [message, setMessage] = useState('');
  const id = `interview-${incident.slug}`;
  useEffect(() => {
    try { const note = normalizeNotebook(JSON.parse(localStorage.getItem(NOTEBOOK_KEY) || '[]')).find(item => item.id === id); if (note) { setAnswer(note.interviewAnswer); setChecks(note.interviewChecks); } }
    catch { setMessage('Saved answers could not be loaded. You can still write and copy your answer.'); }
    setReady(true);
    const frame = requestAnimationFrame(() => { if (window.location.hash === '#interview-answer') section.current?.scrollIntoView({ block: 'start' }); });
    return () => cancelAnimationFrame(frame);
  }, [id]);
  function save() {
    try { saveNote(localStorage, { id, title: `Interview: ${incident.title}`, href: `/detective/${incident.slug}#interview-answer`, interviewAnswer: answer, interviewChecks: checks, completed: answer.trim().length > 0 && checks.length === 4 }); setMessage('Interview answer saved in your notebook.'); }
    catch { setMessage('Could not save. Copy your answer before leaving.'); }
  }
  return <section ref={section} id="interview-answer" className={`${styles.card} ${styles.reflection}`} aria-label="Interview practice"><h2>Turn this investigation into an interview answer</h2><p>{interviewPrompt(incident.slug)}</p><p>Aim for a concise answer you could say in about 90 seconds. State the mechanism, cite evidence, then describe the repair and its limits.</p>
    <label>Your interview answer<textarea aria-label="Your interview answer" rows={6} maxLength={4000} disabled={!ready} value={answer} onChange={event => { setAnswer(event.target.value); setChecks([]); }} /></label>
    <fieldset disabled={!ready}><legend>Check your reasoning — self-assessment</legend>{INTERVIEW_CHECKS.map((label, index) => <label key={label}><input type="checkbox" checked={checks.includes(index)} onChange={event => setChecks(event.target.checked ? [...checks, index] : checks.filter(item => item !== index))} />{label}</label>)}</fieldset>
    <div className={styles.actions}><button disabled={!ready} onClick={save}>Save interview answer</button><button disabled={!answer.trim()} onClick={() => setCompare(true)}>Compare with answer guide</button><Link href="/notebook">Review saved answers</Link></div><p role="status">{message}</p>
    {compare && <div><h3>Answer guide</h3><p>{incident.explanation}</p><p><strong>Evidence to cite:</strong> {incident.evidence.map(item => item.insight).join(' ')}</p><p><strong>Trade-off:</strong> {incident.tradeoff}</p><p><strong>Follow-up:</strong> {incident.verification}</p><p>Your checklist records your assessment. It is not an automated grade or proof of interview readiness.</p></div>}
  </section>;
}
