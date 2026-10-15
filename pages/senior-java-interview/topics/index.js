import Link from 'next/link';
import ReaderLayout from '../../../components/reader/ReaderLayout';
import TopicCatalog from '../../../components/interview-guide/TopicCatalog';
import legacyIndex from '../../../content/interview-topics/legacy-index.json';
import styles from '../../../styles/Reader.module.css';

export default function InterviewTopicIndex() {
  const additional = legacyIndex.filter(entry => entry.topics.length === 0);
  return <ReaderLayout title="Interview questions by topic" description="Java, Spring Framework, Spring Boot, Microservices, Hibernate, SQL, Micronaut, GCP, Redis and Kafka questions from foundations to deep dives.">
    <nav className={styles.guideBreadcrumb}><Link href="/senior-java-interview">Senior Java interview guide</Link> / Topics</nav>
    <h1>Interview questions by topic</h1>
    <p className={styles.lead}>Choose a topic, study its foundations, then explain mechanisms, failure cases and design trade-offs. Keep the original parts for worked code and broader interview practice.</p>
    <TopicCatalog />
    <details className={styles.guideNotes}><summary>Additional guide subjects and practice ({additional.length} sections)</summary><p>Coding, system design, infrastructure, build tools, leadership and study guidance retain their original reading locations.</p><ul>{additional.map(entry => <li key={entry.href}><Link href={entry.href}>{entry.title}</Link> <span className={styles.small}>· {entry.part}</span></li>)}</ul></details>
    <Link href="/senior-java-interview#original-parts">Browse the original guide parts →</Link>
  </ReaderLayout>;
}
