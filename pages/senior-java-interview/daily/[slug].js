import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import ReaderLayout from "../../../components/reader/ReaderLayout";
import { SENIOR_JAVA_DAILY_SETS } from "../../../lib/seniorJavaDaily.mjs";
import styles from "../../../styles/Reader.module.css";

export default function SeniorJavaDailySet({ set, content, previous, next }) {
  return <ReaderLayout title={`Set ${set.number}: ${set.title} · Senior Java practice`} description={set.description}>
    <nav aria-label="Guide breadcrumb" className={styles.guideBreadcrumb}><Link href="/senior-java-interview">Senior Java interview guide</Link> / <Link href="/senior-java-interview/daily">Daily practice</Link> / Set {set.number}</nav>
    <p className={styles.eyebrow}>SET {set.number} · {set.date} · 12 QUESTIONS</p>
    <h1>{set.title}</h1>
    <p className={styles.lead}>{set.description}</p>
    <nav aria-label="Practice sets" className={styles.guideChapterNav}>{previous ? <Link href={`/senior-java-interview/daily/${previous.slug}`}>← Set {previous.number}</Link> : <span>First set</span>}<Link href="/senior-java-interview/daily">All sets</Link>{next ? <Link href={`/senior-java-interview/daily/${next.slug}`}>Set {next.number} →</Link> : <span>Latest set</span>}</nav>
    <article className={styles.guideArticle} dangerouslySetInnerHTML={{ __html: content }} />
    <nav aria-label="Practice sets, bottom" className={styles.guideChapterNav}>{previous ? <Link href={`/senior-java-interview/daily/${previous.slug}`}>← Set {previous.number}</Link> : <span>First set</span>}<Link href="/senior-java-interview/daily">All sets</Link>{next ? <Link href={`/senior-java-interview/daily/${next.slug}`}>Set {next.number} →</Link> : <span>Latest set</span>}</nav>
  </ReaderLayout>;
}

export function getStaticPaths() {
  return { paths: SENIOR_JAVA_DAILY_SETS.map(set => ({ params: { slug: set.slug } })), fallback: false };
}

export async function getStaticProps({ params }) {
  const index = SENIOR_JAVA_DAILY_SETS.findIndex(set => set.slug === params.slug);
  if (index === -1) return { notFound: true };
  const set = SENIOR_JAVA_DAILY_SETS[index];
  const content = await readFile(path.join(process.cwd(), "content/senior-java/daily/rendered", `${set.file}.html`), "utf8");
  return { props: { set, content, previous: SENIOR_JAVA_DAILY_SETS[index - 1] || null, next: SENIOR_JAVA_DAILY_SETS[index + 1] || null } };
}
