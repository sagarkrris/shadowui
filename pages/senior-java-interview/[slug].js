import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import ReaderLayout from "../../components/reader/ReaderLayout";
import BookReader from "../../components/reader/BookReader";
import { SENIOR_JAVA_GUIDE_ITEMS, SENIOR_JAVA_GUIDE_CODE } from "../../lib/seniorJavaGuide.mjs";
import styles from "../../styles/Reader.module.css";

export default function SeniorJavaGuideSection({ item, content, isCode, previous, next }) {
  return <ReaderLayout title={`${item.title} · Senior Java interview guide`} description={item.description}>
    <nav aria-label="Guide breadcrumb" className={styles.guideBreadcrumb}><Link href="/senior-java-interview">Senior Java interview guide</Link> / {item.title}</nav>
    <p className={styles.eyebrow}>{isCode ? "COMPANION JAVA FILE" : item.label || `PART ${item.slug.slice(5)}`}</p>
    <h1>{item.title}</h1>
    <p className={styles.lead}>{item.description}</p>
    <GuidePagination previous={previous} next={next} label="Guide pages, top" />
    <BookReader key={item.slug} storageId={item.slug} title={item.title} previous={previous} next={next}>
      {isCode ? <pre className={styles.guideCode}><code>{content}</code></pre> : <article className={styles.guideArticle} dangerouslySetInnerHTML={{ __html: content }} />}
    </BookReader>
    <GuidePagination previous={previous} next={next} label="Guide pages, bottom" />
  </ReaderLayout>;
}

function GuidePagination({ previous, next, label }) {
  return <nav aria-label={label} className={styles.guideChapterNav}>{previous ? <Link href={`/senior-java-interview/${previous.slug}`}>← {previous.title}</Link> : <span>Start of guide</span>}<Link href="/senior-java-interview">All parts</Link>{next ? <Link href={`/senior-java-interview/${next.slug}`}>{next.title} →</Link> : <span>End of guide</span>}</nav>;
}

export function getStaticPaths() {
  return { paths: SENIOR_JAVA_GUIDE_ITEMS.map(item => ({ params: { slug: item.slug } })), fallback: false };
}

export async function getStaticProps({ params }) {
  const index = SENIOR_JAVA_GUIDE_ITEMS.findIndex(item => item.slug === params.slug);
  if (index === -1) return { notFound: true };
  const item = SENIOR_JAVA_GUIDE_ITEMS[index];
  const codeFile = SENIOR_JAVA_GUIDE_CODE.find(file => file.slug === item.slug);
  const filename = codeFile ? codeFile.filename : path.join("rendered", `${item.slug}.html`);
  const source = await readFile(path.join(process.cwd(), "content/senior-java", filename), "utf8");
  const content = codeFile ? source : source.replace(/<table>/g, '<table tabindex="0">');
  return { props: { item, content, isCode: Boolean(codeFile), previous: SENIOR_JAVA_GUIDE_ITEMS[index - 1] || null, next: SENIOR_JAVA_GUIDE_ITEMS[index + 1] || null } };
}
