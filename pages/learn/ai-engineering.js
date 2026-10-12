import Link from 'next/link';
import ReaderLayout from '../../components/reader/ReaderLayout';
import LessonPractice from '../../components/learning/LessonPractice';
import { AGENTIC_UI_COURSE } from '../../lib/agenticCourse.mjs';
import styles from '../../styles/Reader.module.css';
export default function AICourse({ sessions, references }) {
  return <ReaderLayout title="AI for Software Engineers" description="Six ordered lessons connecting model contracts, retrieval, evaluation, and agent workflows to exercises and interview practice."><p><Link href="/learn">Learning hub</Link> · <Link href="/learn/roadmaps/ai-engineering">AI Engineering roadmap</Link></p><h1>AI for Software Engineers</h1><p>Prerequisites: JavaScript, JSON, terminal use, Node.js 20+, and basic tests. Follow these six sessions in order. Worked examples are illustrative; the connected workspace contains the progressive build exercises.</p><ol>{sessions.map(s => <li key={s.id}><a href={`#lesson-${s.id}`}>{s.title}</a></li>)}</ol>
    {sessions.map(s => <section className={styles.card} key={s.id} id={`lesson-${s.id}`}><p className={styles.eyebrow}>Session {s.stage}</p><h2>{s.title}</h2><p>{s.description}</p><h3>Understand the mechanism</h3><p>{s.plainMeaning}</p><h3>Worked example</h3><p>{s.workedExample}</p><h3>Build and test</h3><p>{s.studentActivity}</p><p><strong>Failure to investigate:</strong> {s.failure}</p><details><summary>Compare the worked reasoning</summary><p>{s.solution}</p></details><p><Link href="/practice?workspace=agentic-ui">Open the progressive course build workspace →</Link></p><LessonPractice id={`ai-lesson-${s.id}`} title={s.title} question={s.homework} exercise={s.studentActivity} /></section>)}
    <section><h2>Course references</h2>{references.map((ref, i) => <p key={i}><a href={ref.url}>{ref.title || ref.label || ref.url}</a></p>)}</section>
  </ReaderLayout>;
}
export function getStaticProps() { return { props: { sessions: AGENTIC_UI_COURSE.classroomSessions, references: AGENTIC_UI_COURSE.references } }; }
