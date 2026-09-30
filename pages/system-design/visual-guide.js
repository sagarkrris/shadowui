import Link from "next/link";
import ReaderLayout from "../../components/reader/ReaderLayout";
import VisualGuideDiagram from "../../components/system-design/VisualGuideDiagram";
import { SYSTEM_DESIGN_VISUAL_GUIDE } from "../../lib/systemDesignVisualGuide.mjs";
import styles from "../../styles/SystemDesignVisualGuide.module.css";

export default function SystemDesignVisualGuide() {
  const guide = SYSTEM_DESIGN_VISUAL_GUIDE;
  return <ReaderLayout title={guide.title} description={guide.description} url="/system-design/visual-guide">
    <article className={styles.article}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>VISUAL FIELD GUIDE · SYSTEM DESIGN</p>
        <h1>{guide.title}</h1>
        <p className={styles.lead}>{guide.description}</p>
        <p className={styles.intro}>Explore fifty connected concepts, grouped by the decisions they support. Follow the diagrams to connect service contracts, data ownership, scaling, reliability, and operational trade-offs.</p>
        <nav className={styles.contents} aria-label="Guide contents"><span>Jump to</span>{guide.sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}</nav>
      </header>
      {guide.sections.map((section, index) => <section key={section.id} id={section.id} className={styles.section}>
        <div className={styles.sectionCopy}>
          <p className={styles.eyebrow}>{section.eyebrow}</p>
          <h2><span>{String(index + 1).padStart(2, "0")}</span>{section.title}</h2>
          <p>{section.body}</p>
          <aside className={styles.takeaway}><strong>Interview move</strong>{section.takeaway}</aside>
        </div>
        <ol className={styles.concepts} start={index * 10 + 1}>{section.concepts.map(item => <li key={item.name}><h3>{item.name}</h3><p>{item.explanation}</p></li>)}</ol>
        <div className={styles.diagrams}>{section.diagrams.map(item => <VisualGuideDiagram key={item.title} diagram={item} />)}</div>
      </section>)}
      <section className={styles.finish}>
        <p className={styles.eyebrow}>PUT IT INTO PRACTICE</p>
        <h2>Now draw a system with these decisions visible.</h2>
        <p>Pick one product, state its contract, trace one request and one write, name the failure boundary, then describe the evidence that would justify the next change.</p>
        <Link className={styles.button} href="/?workspace=java-digest">Open the practice workspace</Link>
      </section>
    </article>
  </ReaderLayout>;
}
