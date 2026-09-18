import { saveNote } from "../../lib/learningNotebook.mjs";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ReaderLayout from '../../components/reader/ReaderLayout';
import { CHAPTERS, TINY_CONTAINER_KEY, containerSource, javaExercise, runContainerModel } from '../../lib/tinyContainer.mjs';
import styles from '../../styles/Reader.module.css';
import ContainerCheckpoint from '../../components/build/ContainerCheckpoint';
import { LEARNING_KEY, normalizeLearning, chapterTestReported, calibrationFeedback } from '../../lib/tinyContainerLearning.mjs';
import lab from '../../styles/TinyContainer.module.css';

export default function TinyContainer() {
  const notebookTouched = useRef(false);
  const [drafts, setDrafts] = useState({});
  const [learning, setLearning] = useState({});
  const [undo, setUndo] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState('');
  const [cache, setCache] = useState(false);
  const [cycle, setCycle] = useState(false);
  const [detectCycles, setDetectCycles] = useState(false);
  const [result, setResult] = useState(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(TINY_CONTAINER_KEY) || '{}');
      const safe = {};
      CHAPTERS.forEach(chapter => {
        if (typeof saved?.[chapter.id] === 'string' && saved[chapter.id].length <= 20000) safe[chapter.id] = saved[chapter.id];
      });
      setDrafts(safe);
    } catch { setNotice('Saved drafts could not be loaded. You can still edit and download.'); }
    try { setLearning(normalizeLearning(JSON.parse(localStorage.getItem(LEARNING_KEY) || '{}'))); }
    catch { setNotice('Learning progress could not be loaded. Your Java drafts are separate.'); }
    setLoaded(true);
  }, []);
  function edit(id, value) {
    const next = { ...drafts, [id]: value };
    setDrafts(next);
    if (!notebookTouched.current) {
      try { saveNote(localStorage, { id: 'tiny-container', title: 'Build a tiny Java container', href: '/build/java-dependency-injection', evidence: 'Return to the build to inspect your Java draft and local test checklist.', completed: false }); notebookTouched.current = true; } catch { /* Primary code storage is independent. */ }
    }
    if (learning[id]?.testedSource !== undefined) updateLearning(id, { testedSource: undefined });
    try { localStorage.setItem(TINY_CONTAINER_KEY, JSON.stringify(next)); setNotice('Draft saved in this browser.'); }
    catch { setNotice('Browser storage unavailable. Download your draft to keep it.'); }
  }
  function updateLearning(id, patch) {
    const next = { ...learning, [id]: { ...learning[id], ...patch } };
    setLearning(next);
    try { const completed = CHAPTERS.every((_, index) => chapterTestReported(index, drafts, next)); saveNote(localStorage, { id: 'tiny-container', title: 'Build a tiny Java container', href: '/build/java-dependency-injection', evidence: 'Chapter checks are self-reported; open the build to inspect code and progress.', completed }); notebookTouched.current = !completed; } catch { /* Learning progress has its own persistence below. */ }
    try { localStorage.setItem(LEARNING_KEY, JSON.stringify(next)); setNotice('Learning progress saved in this browser.'); }
    catch { setNotice('Progress could not be saved in this browser. Keep a downloaded copy of your code.'); }
  }
  function carryForward(stage) {
    const id = CHAPTERS[stage].id;
    setUndo(previous => ({ ...previous, [id]: drafts[id] ?? containerSource(stage) }));
    edit(id, drafts[CHAPTERS[stage - 1].id] ?? containerSource(stage - 1));
    updateLearning(id, { testedSource: undefined });
  }
  const reported = CHAPTERS.filter((_, index) => chapterTestReported(index, drafts, learning)).length;
  const nextChapter = CHAPTERS.find((_, index) => !chapterTestReported(index, drafts, learning));
  const revisit = CHAPTERS.filter((chapter, index) => learning[chapter.id]?.choice !== undefined && calibrationFeedback(index, learning[chapter.id].choice, learning[chapter.id].confidence).revisit);
  function download(stage) {
    const source = javaExercise(stage, drafts[CHAPTERS[stage].id] ?? containerSource(stage));
    const url = URL.createObjectURL(new Blob([source], { type: 'text/plain' }));
    const link = document.createElement('a'); link.href = url; link.download = 'Main.java'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('Downloaded Main.java with your implementation and chapter tests.');
  }
  return <ReaderLayout title="Build a small Java dependency-injection container" description="Four hands-on chapters: registration, constructor injection, singleton identity, and cycle detection.">
    <section className={styles.hero}><p className={styles.eyebrow}>BUILD A TINY SYSTEM · 4 CHAPTERS · ABOUT 45 MINUTES</p><h1>Build a small Java dependency-injection container.</h1><p className={styles.lead}>Make objects work together. Then break your design with a new requirement, one chapter at a time.</p><p>Prerequisites: Java classes, constructors, interfaces, maps, and exceptions. No account needed.</p><p className={styles.small}>InterviewIQ Editorial · Updated September 18, 2026 · Individual reviewer unassigned. Reference implementations tested with OpenJDK 21.0.9 using the Java 8 API/language baseline.</p></section>
    <section><h2>2-minute overview</h2><p>A container owns a map from types to objects. Constructor injection turns object creation into a dependency-graph traversal. Caching preserves identity; tracking the active path exposes cycles.</p><nav aria-label="Build chapters"><ol>{CHAPTERS.map(chapter => <li key={chapter.id}><a href={`#${chapter.id}`}>{chapter.title}</a></li>)}</ol></nav><p>Java execution is deferred on this site. Edit here, then download each chapter’s <code>Main.java</code> and run its real assertions locally with a JDK. The model below does not compile or assess your Java.</p><pre className={lab.code}>javac Main.java{ '\n' }java Main</pre><p>Use a separate directory per chapter. A failing check throws an AssertionError; a passing run ends with “All chapter checks passed”. Drafts are stored only in this browser.</p><p role="status">{notice}</p></section>
    <section className={styles.card} aria-label="Your build progress"><h2>Your build progress</h2><p>{reported} of 4 chapters reported tested locally. These are your confirmations, not server-verified results.</p><progress aria-label="Chapters reported tested locally" value={reported} max={4} />{nextChapter ? <p><a href={`#${nextChapter.id}`}>Continue: {nextChapter.title}</a></p> : <p>All four chapters reported tested. Try the transfer exercise below to check what carries over.</p>}{revisit.length > 0 && <div><h3>Revisit these confident predictions</h3><ul>{revisit.map(chapter => <li key={chapter.id}><a href={`#${chapter.id}`}>{chapter.title}</a></li>)}</ul></div>}</section>
    {CHAPTERS.map((chapter, stage) => <section className={lab.chapter} key={chapter.id} id={chapter.id}>
      <h2>{chapter.title}</h2><p><strong>New requirement:</strong> {chapter.requirement}</p>
      <ContainerCheckpoint stage={stage} saved={learning[chapter.id]} disabled={!loaded} onSave={prediction => updateLearning(chapter.id, { choice: undefined, confidence: undefined, ...prediction })} />
      <h3>Deep explanation</h3><p>{chapter.explanation}</p>
      <details><summary>Predict before building: {chapter.prediction}</summary><p>{chapter.answer}</p></details>
      <h3>Try it yourself</h3><p>Start from the scaffold, or copy your previous chapter’s implementation into this editor and extend it.</p>
      {stage > 0 && <div className={styles.actions}><button disabled={!loaded} onClick={() => carryForward(stage)}>Start chapter {stage + 1} from my previous code</button><span>This replaces this editor; you can undo it.</span>{undo[chapter.id] !== undefined && <button onClick={() => { edit(chapter.id, undo[chapter.id]); setUndo(previous => { const next = { ...previous }; delete next[chapter.id]; return next; }); }}>Undo code transfer</button>}</div>}
      <label htmlFor={`code-${chapter.id}`}>Java implementation — {chapter.title}</label><textarea id={`code-${chapter.id}`} className={lab.editor} value={drafts[chapter.id] ?? containerSource(stage)} disabled={!loaded} onChange={event => edit(chapter.id, event.target.value)} maxLength={20000} spellCheck={false} rows={18} />
      <p><strong>Tests included:</strong> {chapter.test}</p><button type="button" disabled={!loaded} onClick={() => download(stage)}>Download chapter {stage + 1} code + tests</button>
      <label><input type="checkbox" disabled={!loaded} checked={chapterTestReported(stage, drafts, learning)} onChange={event => updateLearning(chapter.id, { testedSource: event.target.checked ? (drafts[chapter.id] ?? containerSource(stage)) : undefined })} />I ran chapter {stage + 1} locally and all checks passed</label><p className={styles.small}>Self-reported. Editing this code clears its test confirmation.</p>
      <details className={lab.solution}><summary>Compare with the reference implementation</summary><pre className={lab.code}>{containerSource(stage, true)}</pre><p>Copy the implementation into the editor to run it with the same downloaded tests. Viewing a solution does not mark a chapter as tested.</p></details>
      <aside className={styles.card}><strong>{stage === 3 ? 'Where the tiny version stops' : 'The next requirement breaks this design'}</strong><p>{chapter.limitation}</p></aside><a href={`#${chapter.id}`}>Permanent link to this chapter</a>
    </section>)}
    <section className={lab.chapter}><h2>Explore the construction graph</h2><p>Fixed browser model: Service → Repo. Enable a cycle to add Repo → Service. Toggle the design choices and inspect the resulting construction trace.</p>
      <label><input type="checkbox" checked={cache} onChange={e => { setCache(e.target.checked); setResult(null); }} />Cache completed instances</label>
      <label><input type="checkbox" checked={cycle} onChange={e => { setCycle(e.target.checked); setResult(null); }} />Add a circular dependency</label>
      <label><input type="checkbox" checked={detectCycles} onChange={e => { setDetectCycles(e.target.checked); setResult(null); }} />Detect active-path cycles</label>
      <button onClick={() => setResult(runContainerModel({ cache, cycle, detectCycles }))}>Run graph model</button>
      {result && <div role="status"><p>{result.error || (result.same ? 'Both lookups share one Service.' : 'Each lookup gets a different Service.')}</p><ol>{result.trace.map((step, index) => <li key={index}>{step}</li>)}</ol></div>}
    </section>
    <section><h2>Transfer the concept</h2><p>A build tool also walks a dependency graph. Which state tells you an artifact is already built, and which state detects a cycle? What changes when independent builds run concurrently?</p><details><summary>Compare your reasoning</summary><p>A completed-result cache and an active traversal path serve different purposes. Concurrent execution additionally needs ownership and coordination for in-flight work; this single-threaded container has neither.</p></details>
      <h2>What this teaches about Spring</h2><p>Constructor dependencies and object identity are a starting point. This exercise is not a Spring replacement: it has no bean lifecycle management, qualifiers, configurable scopes, interception, or thread-safety guarantees. Avoid using it in production.</p><p><a href="https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html">Spring reference: dependency injection and circular dependencies</a></p><div className={styles.actions}><Link href="/detective/the-rollback-that-never-happened">Investigate a Spring transaction</Link><Link href="/series/debug-spring-applications">Continue the Spring reading path</Link><Link href="/corrections">Report a correction</Link></div>
    </section>
  </ReaderLayout>;
}
