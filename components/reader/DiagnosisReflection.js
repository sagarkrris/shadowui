import Link from 'next/link';
import { useEffect, useState } from 'react';
import { NOTEBOOK_KEY, normalizeNotebook, saveNote } from '../../lib/learningNotebook.mjs';
import styles from '../../styles/Reader.module.css';
export default function DiagnosisReflection({ id, title, href, explanation, evidence, tradeoff }) {
  const [note, setNote] = useState({ id, title, href, failure: '', evidence: '', repair: '', misconception: '', completed: false });
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [compare, setCompare] = useState(false);
  useEffect(() => {
    try { const saved = normalizeNotebook(JSON.parse(localStorage.getItem(NOTEBOOK_KEY) || '[]')).find(item => item.id === id); if (saved) setNote(saved); }
    catch { setMessage('Saved notes could not be read. You can still write here and copy your answers.'); }
    setReady(true);
  }, [id]);
  function save(completed) {
    const next = { ...note, completed };
    setNote(next);
    try { saveNote(localStorage, next); setMessage('Saved in your notebook on this browser.'); }
    catch { setMessage('Could not save. Copy your answers before leaving this page.'); }
  }
  return <section className={`${styles.card} ${styles.reflection}`} aria-label="Explain your diagnosis"><h2>Explain your diagnosis</h2><p>Build an explanation you could give a teammate. No AI score: compare your evidence and assumptions with the editorial explanation.</p>
    {[['failure', 'What failed?'], ['evidence', 'Which evidence supports your conclusion?'], ['repair', 'What would you change, and what could it break?'], ['misconception', 'What would change your mind?']].map(([field, label]) => <label key={field}>{label}<textarea aria-label={label} rows={3} maxLength={3000} disabled={!ready} value={note[field]} onChange={event => setNote({ ...note, [field]: event.target.value, completed: false })} /></label>)}
    <div className={styles.actions}><button disabled={!ready} onClick={() => save(false)}>Save draft</button><button disabled={!ready || !note.failure.trim() || !note.evidence.trim() || !note.repair.trim()} onClick={() => { save(true); setCompare(true); }}>Compare explanation</button><Link prefetch={false} href="/notebook">Open my notebook</Link></div><p role="status">{message}</p>
    {compare && <div><h3>Compare your reasoning</h3><p><strong>Mechanism:</strong> {explanation}</p><p><strong>Distinguishing evidence:</strong> {evidence}</p><p><strong>Trade-off:</strong> {tradeoff}</p><p>Check whether you named the mechanism, ruled out another explanation, and stated a risk. Revise your answers and save again. Completion records your reflection, not proof of correctness.</p></div>}
  </section>;
}
