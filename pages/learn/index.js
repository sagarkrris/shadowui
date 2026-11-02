import { loadSessionEnvelope } from "../../lib/sessionPersistence.mjs";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ReaderLayout from '../../components/reader/ReaderLayout';
import useHubProgress from '../../components/learning/useHubProgress';
import { LEARNING_PATHS, learningPathProgress, BACKEND_ROADMAP_KEY, ACTIVE_PATH_KEY, recommendLearningPath } from '../../lib/learningHub.mjs';
import { learningCatalogue } from '../../lib/learningCatalog.mjs';
import { loadQuestionMemory } from '../../lib/questionMemory.mjs';
import styles from '../../styles/Reader.module.css';
export default function LearningHub({ courses }) {
  const { progress, ready, message } = useHubProgress();
  const [attempts, setAttempts] = useState([]); const [query, setQuery] = useState(''); const [backend, setBackend] = useState([]); const [legacy, setLegacy] = useState([]); const [reviews, setReviews] = useState([]);
  const [activePathId, setActivePathId] = useState('');
  const [category, setCategory] = useState('All');
  const [showAllCourses, setShowAllCourses] = useState(false);
  useEffect(() => {
    try { setActivePathId(localStorage.getItem(ACTIVE_PATH_KEY) || ''); } catch { /* Selection is optional. */ }
    try { const saved = JSON.parse(localStorage.getItem(BACKEND_ROADMAP_KEY) || '[]'); setBackend(Array.isArray(saved) ? saved : []); } catch { /* Optional legacy source. */ }
    try { const envelope = JSON.parse(localStorage.getItem('interviewiq.javaDigestProgress.v1') || 'null'); const state = envelope?.version === 1 ? envelope.state : null; setLegacy(Array.isArray(state?.completedTutorials) ? state.completedTutorials.filter(id => typeof id === 'string') : []); } catch { /* Optional legacy source. */ }
    setAttempts(loadSessionEnvelope(localStorage)?.snapshot?.practice?.attempts || []);
    setReviews(Object.values(loadQuestionMemory(localStorage).questions).filter(question => question.status === 'Needs Review' || question.dueForReview));
  }, []);
  const done = new Set([...progress.completed, ...legacy]);
  const lessons = courses.flatMap(course => course.lessons);
  const known = new Map(lessons.map(lesson => [lesson.id, lesson]));
  const weakLessons = progress.weak.filter(id => known.has(id)).map(id => known.get(id));
  const paths = LEARNING_PATHS.map(path => ({ ...path, result: learningPathProgress(path, progress, backend) }));
  const nextLesson = weakLessons[0] || lessons.find(lesson => !done.has(lesson.id));
  const { path: next, reason: recommendationReason } = recommendLearningPath(paths, activePathId);
  const categories = [...new Set(courses.map(course => course.category))].sort();
  const visible = courses.filter(c => (category === 'All' || c.category === category) && `${c.title} ${c.category} ${c.lessons.map(l => l.title).join(' ')}`.toLowerCase().includes(query.toLowerCase().trim()));
  const narrowed = Boolean(query.trim() || category !== 'All');
  const displayedCourses = showAllCourses || narrowed ? visible : visible.slice(0, 6);
  return <ReaderLayout title="Connected learning hub" description="Four roadmaps, structured courses, interactive labs, practice, and a shared learning progress map.">
    <header className={styles.hero}><p className={styles.eyebrow}>LEARN · EXPERIMENT · BUILD · INTERVIEW · REVIEW</p><h1>Your connected learning hub</h1><p className={styles.lead}>Choose a role, follow its prerequisites, build something small, and practise explaining the decisions. No sign-in is needed to read courses or use the teaching labs.</p><div className={styles.actions}><Link className={styles.button} href="/labs">Explore interactive labs</Link><Link href="#courses">Browse structured courses</Link><Link href="#progress">View progress and weak areas</Link></div></header>
    <section id="progress" className={styles.featuredGuide}><h2>Your progress map</h2>{ready ? <><p>{lessons.filter(l => done.has(l.id)).length} of {lessons.length} catalogue lessons complete · {weakLessons.length} lessons marked for another attempt</p>{next ? <p>{recommendationReason}: <Link href={next.id === 'java-backend' ? next.href : `/learn/roadmaps/${next.id}`}>{next.result.weak.length ? 'Review a weak area' : 'Continue learning'}: {next.title} →</Link></p> : <p>All roadmap activities complete. Revisit weak lessons or try a fresh mock.</p>}</> : <p>Loading browser progress…</p>}{ready && !activePathId && nextLesson && <p><Link href={nextLesson.href}>Next recommended lesson: {nextLesson.title} →</Link>{weakLessons.length ? " — revisit your marked gap" : " — first unfinished catalogue lesson"}</p>}<p className={styles.small}>Completion and marked gaps are self-assessed. Existing Java Digest chapter progress is included; scored question reviews are listed separately. These are practice records, not predictions of interview success. Progress is stored in this browser.</p><p role="status">{message}</p>
      {weakLessons.length > 0 && <ul>{weakLessons.map(l => <li key={l.id}><Link href={l.href}>Revisit {l.title}</Link></li>)}</ul>}
      {reviews.length > 0 && <><h3>Questions needing review</h3><ul>{reviews.slice(0, 20).map(q => <li key={q.questionId}><Link href={`/practice?reviewQuestion=${encodeURIComponent(q.questionId)}`}>{q.question || q.topic || 'Review a saved question'}</Link> — {q.dueForReview ? 'due for spaced review' : 'needs another assessed attempt'}</li>)}</ul></>}
      <p>{attempts.filter(a => Number.isFinite(a.score)).length} saved assessed practice attempts. Keep working on explanations you cannot yet defend.</p>
    </section>
    <section><h2>Choose a learning roadmap</h2><p className={styles.lead}>Pick the kind of work you want to prepare for. Compare the starting prerequisites and path size before choosing.</p><div className={styles.grid}>{paths.map(path => <article className={styles.card} key={path.id}><h3><Link href={path.id === 'java-backend' ? path.href : `/learn/roadmaps/${path.id}`}>{path.title}</Link></h3><p>{path.description}</p><p><strong>Starting prerequisites:</strong> {path.stages[0]?.prerequisites}</p><p>{path.stages.length} stages · {path.result.total} activities</p><p>{path.result.completed}/{path.result.total} activities complete · {path.result.weak.length} weak stages</p><progress aria-label={`${path.title} progress`} value={path.result.completed} max={path.result.total} /><p className={styles.small}>{path.result.next ? `Next: ${path.result.next.stage.title}` : 'Activities complete'}</p></article>)}</div></section>
    <section id="courses"><h2>Structured courses and lesson library</h2><p className={styles.lead}>Follow a roadmap for a sequenced start, or search the full library if you already have a topic in mind.</p><div className={styles.catalogToolbar}><label>Search courses and lessons<input type="search" value={query} onChange={e => { setQuery(e.target.value); setShowAllCourses(false); }} placeholder="Try caching, Java, AI, or SQL" /></label><label htmlFor="course-category">Course category</label><select id="course-category" value={category} onChange={event => { setCategory(event.target.value); setShowAllCourses(false); }}><option>All</option>{categories.map(value => <option key={value}>{value}</option>)}</select></div><p role="status">{visible.length} courses and collections{!narrowed && !showAllCourses && visible.length > displayedCourses.length ? ` · showing ${displayedCourses.length}` : ''}</p><div className={styles.grid}>{displayedCourses.map(course => <article key={course.id} className={`${styles.card} ${styles.courseCard}`}><p className={styles.eyebrow}>{course.category}</p><h3><Link href={course.href}>{course.title}</Link></h3><p><strong>Prerequisites:</strong> {course.prerequisites}</p><p>{course.lessons.filter(l => done.has(l.id)).length}/{course.lessons.length} lessons complete</p><details><summary>Ordered lessons and checkpoints</summary><ol>{course.lessons.map(l => <li key={l.id}><Link href={l.href}>{l.title}</Link>{done.has(l.id) ? ' · complete' : ''}{progress.weak.includes(l.id) ? ' · revisit' : ''}</li>)}</ol><p>Each lesson includes an exercise or worked example, a self-check, and a Tech Buddy practice handoff. Complete these before checking off the lesson.</p></details></article>)}</div>{!visible.length && <p>No matching course. Try a broader topic.</p>}{!narrowed && visible.length > 6 && <p><button type="button" className={styles.button} aria-expanded={showAllCourses} onClick={() => setShowAllCourses(value => !value)}>{showAllCourses ? 'Show the first 6 courses' : `Browse all ${visible.length} courses and collections`}</button></p>}</section>
  </ReaderLayout>;
}
export function getStaticProps() { return { props: { courses: learningCatalogue() } }; }
