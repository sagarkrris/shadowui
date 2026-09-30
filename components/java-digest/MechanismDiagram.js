import styles from '../../styles/ConceptFlow.module.css';

export default function MechanismDiagram({ steps, title = 'Mechanism at a glance' }) {
  if (!Array.isArray(steps) || steps.length < 2) return null;
  return <figure data-mechanism-diagram className={styles.figure}>
    <figcaption className={styles.caption}>{title}</figcaption>
    <ol aria-label={title} className={styles.steps}>
      {steps.map((step, index) => <li key={index} className={styles.step}>
        <span className={styles.number}>Step {index + 1}{index < steps.length - 1 ? ' →' : ''}</span>{step}
      </li>)}
    </ol>
  </figure>;
}
