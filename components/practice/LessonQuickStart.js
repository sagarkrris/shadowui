import Link from 'next/link';
export default function LessonQuickStart({ context, onStart, onPersonalize }) {
  return <section className="practice-panel" aria-label="Lesson quick start">
    <h1>Practise this lesson</h1>
    <p>{context.title || context.topic}</p>
    <p>Start a five-question warm-up on this topic without completing a profile.</p>
    <p>Quick start uses the name “Learner”, a general software engineering focus, and no assumed experience. You can personalize these defaults later. AI practice requires an available provider and may require sign-in.</p>
    <div className="practice-actions"><button type="button" onClick={onStart}>Start lesson practice</button><button type="button" onClick={onPersonalize}>Personalize first</button>{context.href && <Link href={context.href}>Back to lesson</Link>}</div>
  </section>;
}
