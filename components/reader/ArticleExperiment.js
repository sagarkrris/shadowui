import { useEffect, useState } from 'react';
import { EXPERIMENTS, EXPERIMENT_KEY, normalizeExperiment, experimentResult } from '../../lib/articleExperiments.mjs';
import styles from '../../styles/BackendFieldNote.module.css';

export default function ArticleExperiment({ id }) {
  const model = EXPERIMENTS[id];
  const [draft, setDraft] = useState(() => normalizeExperiment(null));
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    try { setDraft(normalizeExperiment(JSON.parse(localStorage.getItem(EXPERIMENT_KEY + id)))); }
    catch { setMessage('Saved experiment is unavailable. You can still use the model.'); }
    setReady(true);
  }, [id]);
  function update(next) {
    setDraft(next);
    try { localStorage.setItem(EXPERIMENT_KEY + id, JSON.stringify(next)); setMessage('Experiment saved in this browser.'); }
    catch { setMessage('Could not save this experiment. Keep this tab open to retain your work.'); }
  }
  const result = experimentResult(id, draft.run);
  return <section id="experiment" className={styles.card} aria-label="Prediction experiment">
    <h2>Predict → Experiment → Explain</h2><p>{model.question}</p><p>{model.boundary}</p>
    <fieldset disabled={!ready}>
      <label>{model.condition}<select aria-label={model.condition} value={draft.condition} onChange={event => update({ ...draft, condition: Number(event.target.value), prediction: null, run: null, reflection: '' })}>{model.values.map((value, index) => <option value={index} key={value}>{value}</option>)}</select></label>
      <label>Your prediction<select aria-label="Your prediction" value={draft.prediction ?? ''} onChange={event => update({ ...draft, prediction: Number(event.target.value), run: null, reflection: '' })}><option value="" disabled>Choose an outcome</option>{model.answers.map((answer, index) => <option value={index} key={answer}>{answer}</option>)}</select></label>
      <label>Confidence<select aria-label="Confidence" value={draft.confidence} onChange={event => update({ ...draft, confidence: Number(event.target.value), run: null, reflection: '' })}>{[50, 75, 100].map(value => <option key={value} value={value}>{value}% confident</option>)}</select></label>
      <button className={styles.runButton} disabled={draft.prediction === null} onClick={() => update({ ...draft, run: { condition: draft.condition, prediction: draft.prediction, confidence: draft.confidence }, reflection: '' })}>Run experiment</button>
    </fieldset>
    {result && <div><p role="status"><strong>Observed: {result.answer}.</strong> {result.correct ? 'Your prediction matched.' : 'Your prediction differed.'} You recorded {draft.run.confidence}% confidence.</p><p>{result.explanation}</p>{!result.correct && draft.run.confidence === 100 && <p>You were certain of a different outcome. Identify the assumption the result challenged before trying again.</p>}<label>Why did your prediction hold or fail?<textarea rows={4} maxLength={2000} value={draft.reflection} onChange={event => update({ ...draft, reflection: event.target.value })} /></label><p>Now change one condition, make a new prediction, and compare the outcome. Changing inputs starts a new attempt.</p></div>}
    <p className={styles.saveStatus} role="status">{message}</p>
  </section>;
}
