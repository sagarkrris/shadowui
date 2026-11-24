import Link from 'next/link';
import LessonPractice from '../../../components/learning/LessonPractice';
import ReaderLayout from '../../../components/reader/ReaderLayout';
import { STANDALONE_JAVA_COURSE, standaloneJavaLessonId } from '../../../lib/standaloneJavaCourse.mjs';
import styles from '../../../styles/Reader.module.css';

const levels = ['Core Java', 'Advanced Java', 'Experienced Java'];
const foundations = [
  ['variables-and-assignment', 'Variables and assignment'],
  ['control-flow', 'Control flow'],
  ['methods-and-parameters', 'Methods and parameters'],
  ['arrays', 'Arrays'],
  ['classes-and-objects', 'Classes and objects'],
  ['constructors', 'Constructors'],
  ['interfaces', 'Interfaces'],
];

export default function StandaloneJavaCourse() {
  const { title, outcome, prerequisites, href, lessons } = STANDALONE_JAVA_COURSE;
  return <ReaderLayout title={title} description={outcome}>
    <p><Link href="/learn#courses">Learning catalog</Link></p>
    <h1>{title}</h1>
    <p className={styles.lead}>{outcome}</p>
    <p>{prerequisites}</p>
    <p><Link href="/learn/java/capstone">Get the indexer and run the labs</Link> · <Link href="/senior-java-interview/topics/java">Java interview question bank</Link></p>
    <details>
      <summary>Start here if Java is new to you</summary>
      <p>Work through these existing lessons in order, then apply them in the course’s first three checkpoints.</p>
      <ol>{foundations.map(([slug, label]) => <li key={slug}><Link href={`/java/tutorial/${slug}`}>{label}</Link></li>)}</ol>
    </details>
    <nav aria-label="Standalone Java course contents">
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
      <h3>How it works</h3><p>{item.mechanism}</p>
      <h3>Worked example</h3><p>{item.example}</p>
      <h3>Interview answer</h3><blockquote><p>{item.answer}</p></blockquote>
      <details><summary>Edge cases and interview follow-up</summary><p>{item.edge}</p><p>{item.followUp}</p></details>
      <LessonPractice id={standaloneJavaLessonId(item.id)} title={item.title} lessonHref={href + '#' + item.id}
        exercise={item.exercise} question={item.followUp.split('?')[0] + '?'} />
      <p><Link href={item.earlier}>Related Java lesson</Link> · <a href={item.source}>Primary reference</a></p>
    </section>)}
    <p><Link href="/learn/java/capstone">Build, test and diagnose the packaged indexer</Link></p>
    <p><Link href="/java/releases">Explore Java releases, including opt-in preview labs</Link></p>
  </ReaderLayout>;
}
