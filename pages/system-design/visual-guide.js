import Link from "next/link";
import { useRef } from "react";
import ReaderLayout from "../../components/reader/ReaderLayout";
import VisualGuideDiagram from "../../components/system-design/VisualGuideDiagram";
import { SYSTEM_DESIGN_VISUAL_GUIDE } from "../../lib/systemDesignVisualGuide.mjs";
import { CONCEPT_SOURCES } from "../../lib/systemDesignConceptLessons.mjs";
import styles from "../../styles/SystemDesignVisualGuide.module.css";

export default function SystemDesignVisualGuide() {
  const guide = SYSTEM_DESIGN_VISUAL_GUIDE;
  const article = useRef(null);
  const setLearningLevels = open => article.current?.querySelectorAll('[data-concept-level]').forEach(element => { element.open = open; });
  return <ReaderLayout title={guide.title} description={guide.description} url="/system-design/visual-guide">
    <article className={styles.article} ref={article}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>VISUAL FIELD GUIDE · SYSTEM DESIGN</p>
        <h1>{guide.title}</h1>
        <p className={styles.lead}>{guide.description}</p>
        <p className={styles.intro}>Study all fifty concepts from beginner to deep dive. Each lesson includes how it works, a worked scenario, failure modes and trade-offs, a complete interview answer, and an explained follow-up. Open the learning levels as you need them; the beginner explanation and interview answer are always visible.</p>
        <p className={styles.intro}>Examples and numbers are illustrative design scenarios, not measured benchmarks or deployed systems. Primary references are linked with each lesson. Reviewed 15 October 2026.</p>
        <div className={styles.levelControls} aria-label="Learning level controls"><button type="button" onClick={() => setLearningLevels(true)}>Expand all learning levels</button><button type="button" onClick={() => setLearningLevels(false)}>Collapse all learning levels</button></div>
        <nav className={styles.contents} aria-label="Guide contents"><span>Jump to</span>{guide.sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}</nav>
      </header>
      {guide.sections.map((section, index) => <section key={section.id} id={section.id} className={styles.section}>
        <div className={styles.sectionCopy}>
          <p className={styles.eyebrow}>{section.eyebrow}</p>
          <h2><span>{String(index + 1).padStart(2, "0")}</span>{section.title}</h2>
          <p>{section.body}</p>
          <aside className={styles.takeaway}><strong>Interview move</strong>{section.takeaway}</aside>
        </div>
        <ol className={styles.concepts} start={index * 10 + 1}>{section.concepts.map(item => <li key={item.name} data-concept={item.name}>
          <header className={styles.conceptHeading}><h3>{item.name}</h3></header>
          <div className={styles.level}><h4>1 · Beginner — the idea in plain language</h4><p>{item.beginner}</p></div>
          <details data-concept-level className={styles.learningLevel}><summary>2 · Intermediate — how it works</summary><p>{item.mechanism}</p></details>
          <details data-concept-level className={styles.learningLevel}><summary>3 · Applied design — worked example</summary><p>{item.example}</p></details>
          <details data-concept-level className={styles.learningLevel}><summary>4 · Deep dive — trade-offs, failures and verification</summary><p>{item.deepDive}</p></details>
          <section className={styles.interviewAnswer} aria-label={`${item.name} interview answer`}><h4>How to answer in an interview</h4><p>{item.interviewAnswer}</p></section>
          <details data-concept-level className={styles.learningLevel}><summary>Interviewer follow-up: {item.followUp.question}</summary><p>{item.followUp.answer}</p></details>
          <ul className={styles.references} aria-label={`${item.name} primary references`}>{item.sources.map(key => <li key={key}><a href={CONCEPT_SOURCES[key][1]}>{CONCEPT_SOURCES[key][0]}</a></li>)}</ul>
        </li>)}</ol>
        <div className={styles.diagrams}>{section.diagrams.map(item => <VisualGuideDiagram key={item.title} diagram={item} />)}</div>
      </section>)}
      <section className={styles.finish}>
        <p className={styles.eyebrow}>PUT IT INTO PRACTICE</p>
        <h2>Now draw a system with these decisions visible.</h2>
        <p>Pick one product, state its contract, trace one request and one write, name the failure boundary, then describe the evidence that would justify the next change.</p>
        <Link className={styles.button} href="/practice?workspace=java-digest">Open the practice workspace</Link>
      </section>
    </article>
  </ReaderLayout>;
}
