import Link from 'next/link';
import { useEffect, useState } from 'react';
import ReaderLayout from '../../components/reader/ReaderLayout';
import { TINY_SYSTEMS, normalizeSystemDrafts, systemExercise } from '../../lib/tinySystems.mjs';
import { saveNote } from '../../lib/learningNotebook.mjs';
import styles from '../../styles/Reader.module.css';
import lab from '../../styles/TinyContainer.module.css';

export default function SystemPage({ project }) { return <SystemWorkshop key={project.slug} project={project} />; }
function SystemWorkshop({ project }) {
  const [drafts, setDrafts] = useState({});
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const key = `interviewiq.tinySystem.v1.${project.slug}`;
  useEffect(() => {
    try { setDrafts(normalizeSystemDrafts(JSON.parse(localStorage.getItem(key) || '{}'))); }
    catch { setMessage('Draft storage is unavailable. Download your work before leaving.'); }
    setReady(true);
  }, [key]);
  const codeFor = stage => drafts[stage]?.code ?? systemExercise(project, stage);
  const passed = stage => drafts[stage]?.testedSource === codeFor(stage);
  function persist(next) {
    setDrafts(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setMessage('Draft and self-reported checks saved in this browser.');
    } catch { setMessage('Could not save. Download your Java before leaving.'); return; }
    try {
      const count = project.chapters.filter((_, index) => next[index]?.testedSource === (next[index]?.code ?? systemExercise(project, index))).length;
      saveNote(localStorage, { id: `build-${project.slug}`, title: project.title, href: `/build/${project.slug}`, evidence: `${count}/3 chapter checks self-reported. Return to the project for code and verification details.`, completed: count === 3 });
    } catch { setMessage('Project saved, but the notebook shortcut could not be updated.'); }
  }
  function download(source) {
    const url = URL.createObjectURL(new Blob([source], { type: 'text/plain' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'Main.java'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <ReaderLayout title={project.title} description={project.description}>
    <p><Link href="/build">← All tiny systems</Link></p><p className={styles.eyebrow}>THREE CHAPTERS · ABOUT {project.minutes} MINUTES</p>
    <h1>{project.title}</h1><p className={styles.lead}>{project.description}</p><p>Before you start: Java methods, collections, and exceptions. Each chapter starts with the earlier reference methods already implemented; your saved edits remain in their own chapter.</p>
    <aside className={styles.card}><h2>Model boundaries</h2><p>{project.scope}</p><p>Java 8 source compatibility. Reference chapters and failing starters checked locally on Temurin 21, September 18, 2026. No reader code executes on this site.</p><p>By InterviewIQ Editorial · Individual reviewer unassigned · Updated September 18, 2026.</p></aside>
    <p role="status">{message}</p><p>{project.chapters.filter((_, stage) => passed(stage)).length}/3 checks self-reported · <Link href="/notebook">My notebook</Link></p>
    <nav aria-label="Project chapters" className={styles.actions}>{project.chapters.map((chapter, stage) => <a href={`#chapter-${stage + 1}`} key={chapter.title}>Chapter {stage + 1}</a>)}</nav>
    {project.chapters.map((chapter, stage) => <section className={lab.chapter} id={`chapter-${stage + 1}`} key={chapter.title}>
      <h2>{stage + 1}. {chapter.title}</h2><p><strong>Requirement:</strong> {chapter.requirement}</p>
      <label>Java implementation — chapter {stage + 1}<textarea className={lab.editor} aria-label={`Java implementation — chapter ${stage + 1}`} spellCheck={false} rows={16} maxLength={30000} disabled={!ready} value={codeFor(stage)} onChange={event => setDrafts({ ...drafts, [stage]: { code: event.target.value, testedSource: null } })} /></label>
      <div className={styles.actions}><button disabled={!ready} onClick={() => persist({ ...drafts, [stage]: { ...drafts[stage], code: codeFor(stage) } })}>Save chapter {stage + 1} draft</button><button onClick={() => download(codeFor(stage))}>Download chapter {stage + 1} code and tests</button></div>
      <pre className={styles.code}>javac Main.java{'\n'}java Main{'\n\n'}Expected after implementation: Chapter {stage + 1}: all checks passed</pre>
      <p>The starter intentionally throws UnsupportedOperationException at this chapter. Implement the required method, then rerun all included checks. Reading the reference does not mark this chapter complete.</p>
      <label><input type="checkbox" disabled={!ready} checked={passed(stage)} onChange={event => persist({ ...drafts, [stage]: { code: codeFor(stage), testedSource: event.target.checked ? codeFor(stage) : null } })} />I ran chapter {stage + 1} locally and its checks passed</label>
      <details><summary>Chapter {stage + 1} reference implementation</summary><pre className={styles.code}><code>{chapter.solution}</code></pre><button onClick={() => download(systemExercise(project, stage, true))}>Download chapter {stage + 1} reference</button></details>
      <p><strong>What this design still cannot do:</strong> {chapter.limitation}</p>
    </section>)}
    <h2>Transfer the idea</h2><p><Link prefetch={false} href={project.related}>Connect this mechanism to an existing lesson or investigation →</Link></p>{project.article && <p><Link prefetch={false} href={project.article}>Read the companion engineering article →</Link></p>}<p><a href={project.source}>Primary reference</a> · <Link href={`/corrections?article=/build/${project.slug}`}>Report a correction</Link></p>
  </ReaderLayout>;
}
export function getStaticPaths() { return { paths: TINY_SYSTEMS.map(project => ({ params: { slug: project.slug } })), fallback: false }; }
export function getStaticProps({ params }) { const project = TINY_SYSTEMS.find(item => item.slug === params.slug); return project ? { props: { project } } : { notFound: true }; }
