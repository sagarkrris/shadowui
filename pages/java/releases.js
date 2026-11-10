import Head from 'next/head';
import Link from 'next/link';
import ReaderLayout from '../../components/reader/ReaderLayout';
import styles from '../../styles/Reader.module.css';
import { JAVA_RELEASE_PATH } from '../../lib/javaReleasePath.mjs';
import { getJavaTutorialBySlug, slugifyJavaTutorial } from '../../lib/javaDigest.mjs';

export default function JavaReleasePath() {
  return <ReaderLayout title="Java 8–26 release learning path" description="Detailed Java release lessons with tested examples, explicit targets, and separate preview and incubator labs.">
    <Head><title>Java 8–26 release learning path | InterviewIQ</title><link rel="canonical" href="/java/releases" /></Head>
    <header className={styles.hero}>
      <p className={styles.eyebrow}>JAVA · RELEASE BY RELEASE</p><h1>Java 8–26 release learning path</h1>
      <p className={styles.lead}>Learn the permanent features, understand their release history, and choose preview or incubator labs deliberately.</p>
      <p>New to Java? Start with the <Link href="/java/roadmap">numbered foundation course</Link>. This path reuses those chapters and adds detailed modern-language, library and runtime lessons. A release card can link to a later permanent form; the chapter always states the JDK its example requires.</p>
      <p><strong>Before running examples:</strong> check java -version and javac -version. Java 26 preview labs require JDK 26 and --enable-preview at compilation and launch. The Vector lab instead requires its named incubator module. A lesson running successfully proves its stated fixture, not a live network, native-library integration or application benchmark.</p>
    </header>
    <section aria-label="Release chapters" className={styles.grid}>{JAVA_RELEASE_PATH.map(release => <article key={release.release} id={`java-${release.release}`} className={styles.card}>
      <h2>Java {release.release}: {release.title}</h2><p>{release.context}</p>
      <ul>{release.lessons.map(title => {
        const slug = slugifyJavaTutorial(title);
        const lesson = getJavaTutorialBySlug(slug);
        return <li key={title}><Link prefetch={false} href={`/java/tutorial/${slug}`}>{title}</Link><p className={styles.small}>Example target: Java {lesson.javaVersions}{lesson.releaseInfo && <> · {lesson.releaseInfo.status === 'permanent' ? 'Permanent feature' : lesson.releaseInfo.status === 'preview' ? 'Preview lab — JDK 26 only' : 'Incubator module — JDK 26 only'}</>}</p></li>;
      })}</ul>
    </article>)}</section>
    <p>Technical history: <a href="https://docs.oracle.com/en/java/javase/26/language/java-language-changes-summary.html">Oracle language changes</a> and <a href="https://docs.oracle.com/en/java/javase/26/migrate/significant-changes-jdk-26-release.html">JDK 26 migration guide</a>. Each chapter also links its primary API or language reference.</p>
  </ReaderLayout>;
}
