import Link from 'next/link';
import LessonPractice from '../../../components/learning/LessonPractice';
import ReaderLayout from '../../../components/reader/ReaderLayout';
import { HIBERNATE_COURSE, hibernateLessonId } from '../../../lib/hibernateCourse.mjs';
import styles from '../../../styles/Reader.module.css';

const levels = ['Beginner', 'Intermediate', 'Experienced'];

export default function HibernateCourse() {
  const { title, outcome, prerequisites, href, lessons } = HIBERNATE_COURSE;
  return <ReaderLayout title={title} description={outcome}>
    <p><Link href="/learn#courses">Learning catalog</Link></p>
    <h1>{title}</h1>
    <p className={styles.lead}>{outcome}</p>
    <p>{prerequisites}</p>
    <p>The runnable work uses Hibernate ORM 6.6.59.Final, Jakarta Persistence 3.1 and an embedded H2 database. The guide labels exercises that require a different database or configuration.</p>
    <p><Link href="/learn/hibernate/capstone">Get the project and run the labs</Link> · <Link href="/senior-java-interview/topics/hibernate">Hibernate interview question bank</Link></p>
    <nav aria-label="Hibernate course contents">
      <h2>Course contents</h2>
      {levels.map(level => <div key={level}>
        <h3>{level}</h3>
        <ol>{lessons.filter(item => item.level === level).map(item =>
          <li key={item.id}><a href={`#${item.id}`}>{item.title}</a></li>)}</ol>
      </div>)}
    </nav>
    {lessons.map(item => <section key={item.id} className={styles.card} aria-labelledby={item.id}>
      <p className={styles.eyebrow}>{item.level}</p>
      <h2 id={item.id}>{item.title}</h2>
      <p>{item.foundation}</p>
      <h3>Annotation internals and runtime behavior</h3><p>{item.internals}</p>
      <h3>Worked example</h3><p>{item.example}</p>
      <h3>Interview answer</h3><blockquote><p>{item.answer}</p></blockquote>
      <details><summary>Edge cases and interview follow-up</summary>
        <p>{item.edgeCases}</p><p>{item.followUp}</p>
      </details>
      <LessonPractice id={hibernateLessonId(item.id)} title={item.title} lessonHref={href + '#' + item.id}
        exercise={item.exercise} question={item.followUp.split('?')[0] + '?'} />
      <p><Link href={item.prior}>Related senior Java explanation</Link> · <a href={item.reference}>Primary reference</a></p>
    </section>)}
    <p><Link href="/learn/hibernate/capstone">Build and verify the order catalog</Link></p>
  </ReaderLayout>;
}
