import { useState } from 'react';
import styles from './CourseSketch.module.css';

export default function CourseSketch({ title, story, steps, layout = 'sequence', active, onFocus, compact = false }) {
  const [localActive, setLocalActive] = useState(0);
  const selected = active ?? localActive;
  const select = onFocus || setLocalActive;
  const comparison = layout === 'comparison';
  return <figure className={`${styles.paper} ${compact ? styles.compact : ''}`} aria-label={`Hand-drawn course diagram: ${title}`}>
    <figcaption className={styles.caption}>{comparison ? 'Compare the choices' : 'Follow the idea'} · Select a card to focus it <span aria-hidden="true">✎</span></figcaption>
    <h4 className={styles.title}>{title}</h4>
    <p className={styles.story}>{story}</p>
    <ol data-visual-steps className={`${styles.steps} ${comparison ? styles.comparison : ''}`}>
      {steps.map(([label, detail], index) => <li key={`${label}-${index}`}>
        <button type="button" aria-pressed={selected === index} onClick={() => select(index)}>
          <span className={styles.number}>{comparison ? String.fromCharCode(65 + index) : String(index + 1).padStart(2, '0')}</span>
          <strong>{label}</strong>
          <span className={styles.detail}>{detail}</span>
        </button>
        {!comparison && index < steps.length - 1 && <span className={styles.connector} aria-hidden="true">↓</span>}
      </li>)}
    </ol>
    <p className={styles.note}><span aria-hidden="true">↳</span> {comparison ? 'These are alternatives, not consecutive steps.' : 'Read each step in order; follow the evidence before trusting the result.'}</p>
  </figure>;
}
