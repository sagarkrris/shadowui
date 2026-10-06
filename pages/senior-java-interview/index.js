import Link from "next/link";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ReaderLayout from "../../components/reader/ReaderLayout";
import { SENIOR_JAVA_GUIDE_PARTS, SENIOR_JAVA_GUIDE_CODE } from "../../lib/seniorJavaGuide.mjs";
import styles from "../../styles/Reader.module.css";

export default function SeniorJavaInterviewGuide({ introduction }) {
  return <ReaderLayout title="Senior Java interview guide" description="A senior Java interview study path with a two-week plan, question banks, coding practice, system design prompts, and companion Java examples.">
    <p className={styles.eyebrow}>SENIOR JAVA · INTERVIEW STUDY PATH</p>
    <h1>Senior Java interview guide</h1>
    <p className={styles.lead}>Read the full guide in focused parts. Start with the two-week plan, use the question banks for targeted revision, and work through the coding track with the companion Java examples.</p>
    <p className={styles.small}>Prepared for experienced Java engineers. The source guide uses Java 21 for its new practice file; framework excerpts are teaching examples, and illustrative incident stories should be replaced with your own experience.</p>
    <div className={styles.actions}><Link className={styles.button} href="/senior-java-interview/part-1a">Start with the refresher</Link><Link href="/senior-java-interview/part-9">Go to coding practice →</Link></div>
    <details className={styles.guideNotes}><summary>Read the guide’s scope and verification notes</summary><div className={styles.guideArticle} dangerouslySetInnerHTML={{ __html: introduction }} /></details>
    <h2>Read the guide</h2>
    <div className={styles.grid}>{SENIOR_JAVA_GUIDE_PARTS.map(part => <article className={styles.card} key={part.slug}><p className={styles.eyebrow}>{part.label || `PART ${part.slug.slice(5)}`}</p><h3><Link href={`/senior-java-interview/${part.slug}`}>{part.title}</Link></h3><p>{part.description}</p></article>)}</div>
    <h2>Read the companion Java files</h2>
    <div className={styles.grid}>{SENIOR_JAVA_GUIDE_CODE.map(file => <article className={styles.card} key={file.slug}><h3><Link href={`/senior-java-interview/${file.slug}`}>{file.title}</Link></h3><p>{file.description}</p></article>)}</div>
  </ReaderLayout>;
}

export async function getStaticProps() {
  const introduction = await readFile(path.join(process.cwd(), "content/senior-java/rendered/introduction.html"), "utf8");
  return { props: { introduction } };
}
