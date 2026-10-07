import Link from "next/link";
import ReaderLayout from "../../../components/reader/ReaderLayout";
import { SENIOR_JAVA_DAILY_SETS } from "../../../lib/seniorJavaDaily.mjs";
import styles from "../../../styles/Reader.module.css";

export default function SeniorJavaDailyIndex() {
  return <ReaderLayout title="Daily SDE-3 Java interview practice" description="Daily senior Java interview questions with speakable answers, examples, trade-offs, and follow-ups.">
    <nav aria-label="Guide breadcrumb" className={styles.guideBreadcrumb}><Link href="/senior-java-interview">Senior Java interview guide</Link> / Daily practice</nav>
    <p className={styles.eyebrow}>SENIOR JAVA · DAILY PRACTICE</p>
    <h1>Daily SDE-3 Java interview practice</h1>
    <p className={styles.lead}>Practise each answer aloud, then use the examples and follow-ups to test your reasoning. Sets are numbered in publication order; several may share a date.</p>
    <div className={styles.grid}>{SENIOR_JAVA_DAILY_SETS.map(set => <article className={styles.card} key={set.slug}>
      <p className={styles.eyebrow}>SET {set.number} · {set.date}</p>
      <h2><Link href={`/senior-java-interview/daily/${set.slug}`}>{set.title}</Link></h2>
      <p>{set.description}</p>
    </article>)}</div>
  </ReaderLayout>;
}
