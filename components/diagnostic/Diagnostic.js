import { trackEvent } from '../../lib/analytics.mjs';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DIAGNOSTIC_KEY, DIAGNOSTIC_BUDGETS, DIAGNOSTIC_QUESTIONS, diagnosticEvidence, diagnosticPlan, diagnosticExport, newDiagnostic, normalizeDiagnostic } from '../../lib/diagnostic.mjs';
import { saveNote, notebookSaveMessage } from '../../lib/learningNotebook.mjs';
import { downloadText } from '../../lib/downloadText.mjs';
import InterviewQuestionAnswer from '../public/InterviewQuestionAnswer';
import styles from '../../styles/Diagnostic.module.css';

function Question({ question, answer, onChange }) {
  return <fieldset className={styles.question}><legend>{question.prompt}</legend>
    {question.choices.map((choice, index) => <label className={styles.choice} key={choice}><input type="radio" name={question.id} value={index} checked={answer?.choice === index} onChange={() => onChange({ ...answer, choice: index })} /><span>{choice}</span></label>)}
    <label className={styles.choice}><input type="radio" name={question.id} checked={answer?.choice === null} onChange={() => onChange({ ...answer, choice: null })} /><span>Not sure — leave this unobserved</span></label>
    <label className={styles.note}>Your reasoning (optional; saved locally only when you choose Save progress)<textarea maxLength={1200} value={answer?.note || ''} onChange={event => onChange({ choice: answer?.choice ?? null, note: event.target.value })} /></label>
  </fieldset>;
}

export default function Diagnostic({ domains, rubric }) {
  const [state, setState] = useState(newDiagnostic);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [message, setMessage] = useState('');
  const [canSave, setCanSave] = useState(true);
  const [retestDomain, setRetestDomain] = useState(null);
  const [retestDraft, setRetestDraft] = useState(null);
  const [exported, setExported] = useState('');
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DIAGNOSTIC_KEY);
      if (raw) {
        const restored = normalizeDiagnostic(JSON.parse(raw));
        if (!restored) throw new Error('unsupported');
        setState(restored); setStarted(restored.completed || Object.keys(restored.answers).length > 0);
        setMessage('Saved diagnostic restored from this browser. No lesson completion has been inferred.');
      }
    } catch { setCanSave(false); setMessage('Saved diagnostic is unavailable or uses an unsupported format. It has been kept unchanged. You can continue without saving, export this session, or clear only the diagnostic to start saving again.'); }
    setReady(true);
  }, []);
  const evidence = diagnosticEvidence(state);
  const plan = diagnosticPlan(state);
  function answer(id, value) { setState(current => ({ ...current, answers: { ...current.answers, [id]: value } })); }
  function saveProgress() {
    try { localStorage.setItem(DIAGNOSTIC_KEY, JSON.stringify(normalizeDiagnostic(state))); setMessage('Diagnostic saved in this browser. Changes after this save need another save.'); }
    catch { setMessage('Could not save diagnostic. Your current answers remain available here; export them before leaving.'); }
  }
  function clearProgress() {
    try { localStorage.removeItem(DIAGNOSTIC_KEY); setState(newDiagnostic()); setStarted(false); setRetestDomain(null); setExported(''); setCanSave(true); setMessage('Diagnostic progress cleared. Other learning notes and progress were kept.'); }
    catch { setMessage('Could not clear diagnostic storage. Existing data was kept.'); }
  }
  function exportProgress() {
    const text = diagnosticExport(state); setExported(text);
    try { downloadText(text, 'interviewiq-diagnostic.json', 'application/json'); setMessage('Diagnostic export prepared. A copy is available below.'); }
    catch { setMessage('Download unavailable. Copy the export below before leaving.'); }
  }
  function saveJourney() {
    try {
      saveNote(localStorage, { id: 'diagnostic-learning-journey', href: '/diagnostic#journey', title: 'My diagnostic learning journey', failure: evidence.filter(item => item.retestStatus !== 'Retest correct' && (item.status !== 'Baseline correct' || item.retestStatus === 'Review again')).map(item => `${item.title}: ${item.status} — ${item.gap}`).join('\n'), evidence: evidence.map(item => `${item.title}: ${item.status}; ${item.retestStatus}. Selected: ${item.answer.choice === null ? 'Not sure / skipped' : item.question.choices[item.answer.choice]}`).join('\n'), repair: plan.milestones.map(item => { const domain = domains.find(d => d.id === item.domain); return `${domain.title}: ${domain.lesson.href} → ${domain.exerciseHref} → /diagnostic#${domain.id}; ${item.minutes} illustrative minutes.`; }).join('\n'), misconception: 'A five-question local sample is a starting point, not verified mastery or a hiring prediction.', interviewAnswer: '', completed: false });
      setMessage('Journey saved to My notebook. Diagnostic answers are saved separately with Save progress.');
    } catch (error) { setMessage(notebookSaveMessage(error, 'Could not save journey to your notebook. Existing notes were kept; export your diagnostic instead.')); }
  }
  function startRetest(domain) { setRetestDomain(domain.id); setRetestDraft({ choice: null, note: '' }); }
  const completed = state.completed;
  return <div className={styles.page}>
    <header><p>Optional learning baseline · about 5–10 minutes</p><h1>Find your next learning step</h1><p className={styles.lede}>Sample Java/JVM, concurrency, Spring, DSA and system design. Use the evidence to choose a lesson, try an exercise, then check a different question.</p><p>This deterministic quiz checks five selected concepts. It does not measure all engineering skills, predict hiring outcomes, or verify your written reasoning. No account or AI service is required.</p></header>
    <div role="status" aria-live="polite">{message && <p className={styles.status}>{message}</p>}</div>
    {!ready ? <p>Loading optional saved progress…</p> : <>
      <div className={styles.actions}><button type="button" onClick={saveProgress} disabled={!canSave}>Save progress</button><button type="button" onClick={exportProgress}>Export diagnostic JSON</button><button type="button" onClick={clearProgress}>Clear diagnostic progress</button><Link href="/learn">Skip to learning catalog</Link><Link href="/notebook">My notebook</Link></div>
      {!started && !completed && <section className={styles.card}><h2>A small starting point</h2><p>Choose an answer or “Not sure” for each scenario. You may leave any question blank; skipped answers remain unobserved, rather than being treated as failures. Your optional reasoning is for your own review.</p><button type="button" onClick={() => setStarted(true)}>Start optional baseline</button><p>Saving is optional and local to this browser. Export a copy if you want to keep it elsewhere.</p><h3>Prefer a direct route?</h3><div className={styles.grid}>{domains.map(domain => <p key={domain.id}><Link href={domain.lesson.href}>{domain.title}: {domain.lesson.title}</Link></p>)}</div></section>}
      {started && !completed && <form onSubmit={event => { event.preventDefault(); trackEvent('diagnostic_completed'); setState(current => ({ ...current, completed: true })); setMessage('Baseline reviewed. Results reflect only your selected options; written reasoning is not automatically scored.'); }}>
        <h2>Five baseline scenarios</h2><p>{DIAGNOSTIC_QUESTIONS.filter(question => state.answers[question.id]?.choice !== undefined && state.answers[question.id]?.choice !== null).length} of 5 options selected. Blank and “Not sure” responses remain unobserved.</p>
        {DIAGNOSTIC_QUESTIONS.map(question => <section key={question.id}><h3>{domains.find(domain => domain.id === question.domain).title}</h3><Question question={question} answer={state.answers[question.id]} onChange={value => answer(question.id, value)} /></section>)}
        <button type="submit">Review evidence and build my plan</button>
      </form>}
      {completed && <>
        <section id="journey" className={styles.card}><h2>Your connected learning journey</h2><p>Review suggested means the selected option missed this concept. Baseline correct is evidence from one multiple-choice response, not proof of depth. Not observed means there is no scored answer.</p>
          <label>Time per study session <select value={state.minutes} onChange={event => setState(current => ({ ...current, minutes: Number(event.target.value) }))}>{DIAGNOSTIC_BUDGETS.map(minutes => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label>
          <p><strong>{plan.sessions} illustrative sessions at {plan.dailyMinutes} minutes</strong> for {plan.totalMinutes} minutes of planned work. Adjust for prerequisites, exercise difficulty and your own pace; these are planning estimates, not completion promises.</p>
          <ol className={styles.steps}>{plan.milestones.map(item => { const domain = domains.find(d => d.id === item.domain); return <li key={item.domain}><a href={`#${item.domain}`}>{item.title}</a> — sessions {item.startSession}–{item.endSession}: learn 15 min, exercise 20 min, retest and explain 10 min.</li>; })}</ol>
          <div className={styles.actions}><button type="button" onClick={saveJourney}>Save journey to notebook</button><button type="button" onClick={() => { setState(current => ({ ...current, completed: false })); setRetestDomain(null); }}>Revisit baseline answers</button></div>
        </section>
        {evidence.map(item => { const domain = domains.find(d => d.id === item.id); return <section key={item.id} id={item.id} className={styles.card} aria-labelledby={`heading-${item.id}`}>
          <h2 id={`heading-${item.id}`}>{item.title}</h2><span className={styles.badge}>{item.status}</span><p><strong>Concept sampled:</strong> {item.gap}</p><p><strong>Question:</strong> {item.question.prompt}</p><p><strong>Your evidence:</strong> {item.answer.choice === null ? 'No selected answer. This domain remains unobserved.' : item.question.choices[item.answer.choice]}</p>{item.answer.note && <p><strong>Your reasoning (not scored):</strong> {item.answer.note}</p>}<p><strong>Why:</strong> {item.question.rationale}</p>
          <h3>Next: learn → exercise → retest</h3><ol className={styles.steps}><li><Link href={domain.lesson.href}>Learn: {domain.lesson.title}</Link></li><li><Link href={domain.exerciseHref}>Open the focused exercise</Link><p>{domain.exercise}</p></li><li>Return here for a different question, then explain the mechanism aloud using the rubric below.</li></ol><p><Link href={domain.path.href}>Continue the {domain.path.title} path</Link></p>
          <details><summary>Read the complete explanation and primary references</summary><InterviewQuestionAnswer item={domain.feedback} /></details>
          <p><strong>Retest:</strong> {item.retestStatus}. {item.retestStatus === 'Retest correct' ? 'The second selected option supports this concept. Explain the failure boundary aloud and use the linked path for broader practice.' : 'Use the lesson and exercise before checking the comparable question.'}</p>
          {item.retestAnswer && <div><p><strong>Retest question:</strong> {item.retest.prompt}</p><p><strong>Retest selection:</strong> {item.retestAnswer.choice === null ? 'Not sure' : item.retest.choices[item.retestAnswer.choice]}</p><p>{item.retest.rationale}</p>{item.retestAnswer.note && <p><strong>Your retest reasoning (not scored):</strong> {item.retestAnswer.note}</p>}</div>}
          {retestDomain === item.id ? <div><Question question={item.retest} answer={retestDraft} onChange={setRetestDraft} /><div className={styles.actions}><button type="button" disabled={retestDraft?.choice === null} onClick={() => { answer(item.retest.id, retestDraft); trackEvent('diagnostic_retest_completed'); setRetestDomain(null); setMessage(`${item.title} retest checked. Save progress to keep this result.`); }}>Check retest</button><button type="button" onClick={() => setRetestDomain(null)}>Cancel retest</button></div></div> : <button type="button" onClick={() => startRetest(item)}>Retest {item.title}</button>}
        </section>; })}
        <section className={styles.card}><h2>Explain it aloud: the practice rubric</h2><p>The quiz checks option correctness only. Use the same dimensions as the practice workspace for a self-review; no rubric scores are inferred from your selections.</p><ul>{rubric.map(item => <li key={item.key}><strong>{item.label}:</strong> {item.description}</li>)}</ul><Link href="/practice?workspace=chat">Open interview practice</Link><p>AI feedback in the practice workspace requires a saved profile and an available AI service.</p></section>
      </>}
      {exported && <details open><summary>Diagnostic export copy</summary><label>Copy your diagnostic JSON<textarea readOnly value={exported} rows={12} /></label></details>}
    </>}
  </div>;
}
