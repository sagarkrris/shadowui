import CourseOverviewDiagram from "../java-digest/CourseOverviewDiagram";
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import styles from '../../styles/BackendFieldNote.module.css';
import ArticleExperiment from './ArticleExperiment';
import CourseDemo from '../learning/CourseDemo';

export default function BackendFieldNote({ blog }) {
  const [choice, setChoice] = useState(null);
  const path = `/tech-blogs/${blog.id}`;
  return <><Head><title>{`${blog.title} | InterviewIQ`}</title><meta name="description" content={blog.summary} /><link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://interviewiq.app'}${path}`} /></Head>
    <main className={styles.page}><article className={styles.article}>
      <nav aria-label="Article navigation"><Link href="/">Home</Link> / <Link href="/tech-blogs">Tech Blogs</Link> / <Link href="/series/backend-failure-boundaries">Backend failure boundaries</Link></nav>
      <header><p className={styles.eyebrow}>{blog.category} · {blog.minutes} MIN READ</p><h1>{blog.title}</h1><p className={styles.lead}>{blog.summary}</p></header>
      <nav className={styles.actions} aria-label="Article sections"><a href="#overview">2-minute overview</a><a href="#experiment">Predict and experiment</a><a href="#deep-explanation">Deep explanation</a><a href="#try-it">Try it yourself</a><a href="#misconception">Check your understanding</a></nav>
      <section id="overview"><h2>2-minute overview</h2><p>{blog.overview}</p></section>
      <CourseOverviewDiagram courseId={blog.id} /><CourseDemo courseId={blog.id} />
      <ArticleExperiment key={blog.id} id={blog.id} />
      <section><h2>Follow the annotated trace</h2><p>Fictional events chosen to isolate the mechanism; times and positions are illustrative.</p><ol className={styles.trace}>{blog.trace.map(([time, event, meaning]) => <li key={time}><strong>{time} — {event}</strong><p>{meaning}</p></li>)}</ol></section>
      <section id="deep-explanation"><h2>Deep explanation</h2>{blog.chapters.map(chapter => <section key={chapter.order} className={styles.card}><h3>{chapter.order}. {chapter.title}</h3><p>{chapter.lesson}</p><pre tabIndex={0} aria-label={`Trace for ${chapter.title}`}><code>{chapter.example}</code></pre><p><strong>Try reasoning through it:</strong> {chapter.exercise}</p></section>)}</section>
      <section id="try-it"><h2>Try it yourself</h2><p>{blog.scope}</p><p>Verified with {blog.runtime} on {blog.updated}. Download the complete example below and run <code>python3 {blog.fixture}</code>. It uses assertions and synthetic values only; it sends no network requests.</p><a href={`/blog-examples/${blog.fixture}`} download>Download runnable example</a><details><summary>Read the complete example</summary><pre tabIndex={0} aria-label="Runnable Python example"><code>{blog.exampleSource}</code></pre></details><h3>Expected output</h3><pre><code>{blog.expected}</code></pre></section>
      <section id="misconception" className={styles.card}><h2>Misconception check</h2><fieldset><legend>{blog.misconception.question}</legend>{blog.misconception.options.map((option, index) => <label key={option}><input type="radio" name="misconception" checked={choice === index} onChange={() => setChoice(index)} />{option}</label>)}</fieldset>{choice !== null && <p role="status">{blog.misconception.feedback[choice]}</p>}<details><summary>Read the correction</summary><p>{blog.misconception.feedback[blog.misconception.correct]}</p></details></section>
      <section><h2>Interview checkpoint</h2><ul>{blog.interviewQuestions.map(question => <li key={question}>{question}</li>)}</ul><p>Structure your answer around the observation, distinguishing evidence, repair, and remaining risk.</p></section>
      <section><h2>Continue learning</h2><ul>{blog.related.map(link => <li key={link.href}><Link prefetch={false} href={link.href}>{link.title}</Link></li>)}</ul></section>
      <section><h2>Sources and verification limits</h2><p>By InterviewIQ Editorial · Individual reviewer unassigned · Updated {blog.updated}. Sources were checked against the referenced documentation; provider contracts and configuration still need checking against your deployed version.</p><ul>{blog.references.map(reference => <li key={reference.href}><a href={reference.href}>{reference.title}</a></li>)}</ul><p>{blog.scope}</p><Link href={`/corrections?article=${path}`}>Report a correction</Link></section>
    </article></main>
  </>;
}
