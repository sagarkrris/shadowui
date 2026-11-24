import Link from 'next/link';
import LessonPractice from '../../../components/learning/LessonPractice';
import ReaderLayout from '../../../components/reader/ReaderLayout';
import { SPRING_COURSES, springCourseHref, springLessonId } from '../../../lib/springCourses.mjs';
import styles from '../../../styles/Reader.module.css';

const levels = ['Beginner', 'Intermediate', 'Experienced'];
const annotationSections = {
  wiring: 'inject', beans: 'scope-lifecycle', mvc: 'mvc-mappings',
  transactions: 'transaction-cases', concurrency: 'transaction-cases', execution: 'async',
  startup: 'boot-application', configuration: 'binding', security: 'security',
  testing: 'spring-tests', 'auto-config': 'conditions', operations: 'boot-application',
};

export function getStaticPaths() {
  return { paths: SPRING_COURSES.map(({ id }) => ({ params: { course: id } })), fallback: false };
}

export function getStaticProps({ params }) {
  return { props: { course: SPRING_COURSES.find(({ id }) => id === params.course) } };
}

export default function SpringCourse({ course }) {
  const next = SPRING_COURSES.find(({ id }) => id !== course.id);
  return <ReaderLayout title={course.title} description={course.outcome}>
    <p><Link href="/learn#courses">Learning catalog</Link></p>
    <h1>{course.title}</h1>
    <p className={styles.lead}>{course.outcome}</p>
    <p>{course.prerequisites}</p>
    <p>The labs use Java 21, Boot 4.0.0 and its managed Spring Framework 7 dependencies. The linked interview banks retain the Framework 6.2 and Boot 3.5 baselines. Use the lab’s pinned versions to reproduce its behavior locally.</p>
    <p><Link href="/learn/spring/capstone">Get the project and run the labs</Link></p>
    <p><Link href="/learn/spring/annotation-internals">Study annotation internals and transaction edge cases</Link></p>
    <nav aria-label="Course contents">
      <h2>Course contents</h2>
      {levels.map(level => <div key={level}>
        <h3>{level}</h3>
        <ol>{course.lessons.filter(item => item.level === level).map(item =>
          <li key={item.id}><a href={`#${item.id}`}>{item.title}</a></li>)}</ol>
      </div>)}
    </nav>
    {course.lessons.map(item => <section key={item.id} className={styles.card} aria-labelledby={item.id}>
      <p className={styles.eyebrow}>{item.level}</p>
      <h2 id={item.id}>{item.title}</h2>
      <p>{item.foundation}</p>
      <h3>How it works</h3><p>{item.mechanism}</p>
      <h3>Worked example</h3><p>{item.example}</p>
      <h3>Interview answer</h3><blockquote><p>{item.answer}</p></blockquote>
      <details><summary>Failure cases and interview follow-up</summary>
        <p>{item.failure}</p><p>{item.followUp}</p>
      </details>
      <LessonPractice id={springLessonId(course.id, item.id)} title={item.title} lessonHref={springCourseHref(course.id) + "#" + item.id} exercise={item.exercise} question={item.followUp.split("?")[0] + "?"} />
      <p><Link href={`/learn/spring/annotation-internals#${annotationSections[item.id]}`}>Annotation internals for this lesson</Link></p>
      <p><Link href={item.revisit[0]}>{item.revisit[1]}</Link> · <a href={item.source}>Spring reference</a></p>
    </section>)}
    <nav aria-label="Continue learning">
      <p><Link href={springCourseHref(next.id)}>{next.title}</Link></p>
      <p><Link href="/learn/spring/capstone">Run the order API capstone</Link></p>
      <p><Link href={`/senior-java-interview/topics/${course.id}`}>Practice the full interview question bank</Link></p>
    </nav>
  </ReaderLayout>;
}
