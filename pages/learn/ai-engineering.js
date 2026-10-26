import Link from 'next/link';
import ReaderLayout from '../../components/reader/ReaderLayout';
import LessonPractice from '../../components/learning/LessonPractice';
import LessonVisual from '../../components/course/LessonVisual';
import { AGENTIC_UI_COURSE } from '../../lib/agenticCourse.mjs';
import styles from '../../styles/Reader.module.css';

export default function AICourse({ sessions, references }) {
  return <ReaderLayout title="AI for Software Engineers" description="A detailed course connecting model contracts, retrieval, evaluation, and bounded agent workflows to worked examples, classroom activities, and interview practice.">
    <p><Link href="/learn">Learning hub</Link> · <Link href="/learn/roadmaps/ai-engineering">AI Engineering roadmap</Link></p>
    <header className={styles.featuredGuide}>
      <p className={styles.eyebrow}>AI ENGINEERING · SIX CORE SESSIONS</p>
      <h1>AI for Software Engineers</h1>
      <p className={styles.lead}>Build a study assistant one safe capability at a time. Follow how an application budgets context, validates model output, retrieves evidence, evaluates quality, and controls actions.</p>
      <p><strong>Prerequisites:</strong> JavaScript, JSON, terminal use, Node.js 20+, and basic testing. No model account or API key is needed for the deterministic teaching lab.</p>
      <nav aria-label="Core course sessions">
        <ol>{sessions.map(session => <li key={session.id}><a href={`#lesson-${session.id}`}>{session.title}</a></li>)}</ol>
      </nav>
    </header>

    {sessions.map(session => <article className={`${styles.card} ${styles.guideArticle}`} key={session.id} id={`lesson-${session.id}`} aria-labelledby={`title-${session.id}`}>
      <p className={styles.eyebrow}>Session {session.stage} · 90 minute class</p>
      <h2 id={`title-${session.id}`}>{session.title}</h2>
      <p>{session.description}</p>

      <section aria-label={`${session.title} visual guide`}>
        <LessonVisual lessonId={session.id} tone="light" />
      </section>

      <section>
        <h3>Understand the mechanism</h3>
        <p>{session.plainMeaning}</p>
        <details>
          <summary>Teacher notes and deeper explanation</summary>
          <p>{session.teacherBrief}</p>
        </details>
      </section>

      <section>
        <h3>Worked example</h3>
        <p>{session.workedExample}</p>
        <h4>Failure to investigate</h4>
        <p>{session.failure}</p>
      </section>

      <section>
        <h3>Guided build</h3>
        <p>{session.studentActivity}</p>
        <ol>{session.steps.map((step, index) => <li key={`${session.id}-step-${index}`}>{step}</li>)}</ol>
        <details>
          <summary>Compare the worked reasoning</summary>
          <p>{session.solution}</p>
        </details>
      </section>

      <section>
        <h3>Class discussion</h3>
        <div className={styles.guideNotes}>
          {session.dialogue.map(([speaker, line], index) => <p key={`${session.id}-dialogue-${index}`}><strong>{speaker}:</strong> {line}</p>)}
        </div>
        <h4>Common misconception</h4>
        <p>{session.misconception}</p>
        <h4>Takeaways</h4>
        <ul>{session.takeaways.map(item => <li key={item}>{item}</li>)}</ul>
      </section>

      <details>
        <summary>Suggested 90-minute session plan</summary>
        <ol>{session.agenda.map(item => <li key={`${session.id}-${item.activity}`}><strong>{item.minutes} min:</strong> {item.activity}</li>)}</ol>
      </details>
      <p><strong>Debrief:</strong> {session.debrief}</p>
      <p><strong>Homework:</strong> {session.homework}</p>

      <p><Link href="/practice?workspace=agentic-ui">Open the progressive course build workspace →</Link></p>
      <LessonPractice id={`ai-lesson-${session.id}`} title={session.title} question={session.homework} exercise={session.studentActivity} />
    </article>)}

    <section className={styles.card} aria-labelledby="course-references">
      <h2 id="course-references">Course references</h2>
      <ul>{references.map(reference => <li key={reference.url}><a href={reference.url} target="_blank" rel="noreferrer">{reference.title || reference.label || reference.url}</a></li>)}</ul>
    </section>
  </ReaderLayout>;
}

export function getStaticProps() {
  return { props: { sessions: AGENTIC_UI_COURSE.classroomSessions, references: AGENTIC_UI_COURSE.references } };
}
