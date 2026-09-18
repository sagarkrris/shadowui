import { useState } from 'react';
import { CHECKPOINTS, calibrationFeedback } from '../../lib/tinyContainerLearning.mjs';
import styles from '../../styles/TinyContainer.module.css';
export default function ContainerCheckpoint({ stage, saved, onSave, disabled }) {
  const checkpoint = CHECKPOINTS[stage];
  const [choice, setChoice] = useState('');
  const [confidence, setConfidence] = useState('');
  const feedback = saved?.choice !== undefined ? calibrationFeedback(stage, saved.choice, saved.confidence) : null;
  return <div className={styles.checkpoint}>
    <h3>Predict, then check your confidence</h3>
    {feedback ? <div><p>You chose: <strong>{checkpoint.options[saved.choice]}</strong> · {saved.confidence}% confidence.</p><p role="status">{feedback.text}</p><p>{checkpoint.explanation}</p><p>This checks your understanding of the contract, not your Java implementation.</p><button disabled={disabled} onClick={() => { setChoice(''); setConfidence(''); onSave({}); }}>Try the prediction again</button></div> : <form onSubmit={event => { event.preventDefault(); onSave({ choice: Number(choice), confidence: Number(confidence) }); }}>
      <fieldset disabled={disabled}><legend>{checkpoint.question}</legend>{checkpoint.options.map((option, index) => <label key={option}><input type="radio" name={`prediction-${stage}`} required value={index} checked={choice === String(index)} onChange={event => setChoice(event.target.value)} /> {option}</label>)}</fieldset>
      <fieldset disabled={disabled}><legend>How confident are you?</legend>{[[50, 'Unsure — 50%'], [75, 'Fairly sure — 75%'], [95, 'Very sure — 95%']].map(([value, label]) => <label key={value}><input type="radio" name={`confidence-${stage}`} required value={value} checked={confidence === String(value)} onChange={event => setConfidence(event.target.value)} /> {label}</label>)}</fieldset>
      <button disabled={disabled || choice === '' || confidence === ''}>Check my prediction</button>
    </form>}
  </div>;
}
