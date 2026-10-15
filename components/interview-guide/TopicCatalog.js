import Link from 'next/link';
import { INTERVIEW_TOPICS, topicHref } from '../../lib/interviewTopics.mjs';
import styles from '../../styles/Reader.module.css';

export default function TopicCatalog() {
  const total = INTERVIEW_TOPICS.reduce((sum, topic) => sum + topic.count, 0);
  return <section aria-labelledby="interview-topics-title">
    <h2 id="interview-topics-title">Study by topic</h2>
    <p>{total.toLocaleString('en')} primary questions with answers, answered follow-ups and deep dives. Work from foundations through applied reasoning, internals, failure scenarios and verification.</p>
    <div className={styles.grid}>{INTERVIEW_TOPICS.map(topic => <article className={styles.card} key={topic.slug}>
      <p className={styles.eyebrow}>{topic.count} questions · 5 stages</p>
      <h3><Link href={topicHref(topic.slug)}>{topic.title}</Link></h3>
      <p>{topic.description}</p>
      <Link href={`${topicHref(topic.slug)}#coverage`}>See coverage and start learning →</Link>
    </article>)}</div>
  </section>;
}
