import Link from 'next/link';
import LessonPractice from '../../../components/learning/LessonPractice';
import ReaderLayout from '../../../components/reader/ReaderLayout';
import { MICRONAUT_COURSE, micronautLessonId } from '../../../lib/micronautCourse.mjs';
import styles from '../../../styles/Reader.module.css';

const levels = ['Beginner', 'Intermediate', 'Experienced'];
const javaBridge = [
  ['jdk-vs-jre-vs-jvm', 'Install a JDK and understand what runs the program'],
  ['constructors', 'Build objects with explicit dependencies'],
  ['records', 'Model data and check invariants in constructors'],
  ['unchecked-exceptions', 'Trace failures across method boundaries'],
  ['junit-test-design', 'Write a focused test for a contract'],
  ['jdbc-basics', 'Follow a JDBC call to the database'],
  ['executors', 'Reason about threads, tasks and saturation'],
];

export default function MicronautCourse() {
  const { title, outcome, prerequisites, href, lessons } = MICRONAUT_COURSE;
  return <ReaderLayout title={title} description={outcome}>
    <p><Link href="/learn#courses">Learning catalog</Link></p>
    <h1>{title}</h1>
    <p className={styles.lead}>{outcome}</p>
    <p>{prerequisites} The lab pins Micronaut Platform 4.10.25 and runs on local H2.</p>
    <p><Link href="/learn/micronaut/capstone">Get the project and run the labs</Link> · <Link href="/senior-java-interview/topics/micronaut">Micronaut interview question bank</Link></p>
    <details>
      <summary>Java bridge</summary>
      <p>Read the topics you need, then apply them in the Java policy lab. The <Link href="/java/roadmap">full Java roadmap</Link> covers the language and JVM in depth.</p>
      <ol>{javaBridge.map(([slug, label]) => <li key={slug}><Link href={`/java/tutorial/${slug}`}>{label}</Link></li>)}</ol>
    </details>
    <nav aria-label="Micronaut course contents">
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
      <h3>How the code and annotations work</h3><p>{item.internals}</p>
      <h3>Worked example</h3><p>{item.example}</p>
      <h3>Interview answer</h3><blockquote><p>{item.answer}</p></blockquote>
      <details><summary>Edge cases and interview follow-up</summary>
        <p>{item.edge}</p><p>{item.followUp}</p>
      </details>
      <LessonPractice id={micronautLessonId(item.id)} title={item.title} lessonHref={href + '#' + item.id}
        exercise={item.exercise} question={item.followUp.split('?')[0] + '?'} />
      <p><Link href={item.prior}>Related explanation</Link> · <a href={item.reference}>Primary reference</a></p>
    </section>)}
    <p><Link href="/learn/micronaut/capstone">Build and verify the reservation API</Link></p>
  </ReaderLayout>;
}
