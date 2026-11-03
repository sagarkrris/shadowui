import LessonPractice from './LessonPractice';
import styles from '../../styles/Reader.module.css';

// A shared lesson sequence: explanation, mechanism, worked example, experiment,
// pitfalls, spoken answer, follow-up and a recorded self-check.
export default function GuidedLesson({ id, lesson, source, children }) {
  return <section aria-label={`Lesson: ${lesson.title}`}>
    <h2>{lesson.title}</h2>
    <h3>Start here</h3><p>{lesson.beginner}</p>
    <h3>How it works</h3><p>{lesson.mechanism}</p>
    <h3>Worked example and assumptions</h3><p>{lesson.example}</p>
    {children}
    <details><summary>Deep dive, trade-offs and verification</summary><p>{lesson.deep}</p></details>
    <section className={styles.card}><h3>An answer you can say aloud</h3><p>{lesson.answer}</p></section>
    <details><summary>Interviewer follow-up and explained answer</summary><p>{lesson.followUp}</p></details>
    <p><a href={source}>Primary reference</a></p>
    <LessonPractice id={id} title={lesson.title} exercise={lesson.challenge} question={lesson.followUp} />
  </section>;
}
