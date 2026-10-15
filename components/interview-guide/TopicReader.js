import { useState } from 'react';
import Link from 'next/link';
import ReaderLayout from '../reader/ReaderLayout';
import BookReader from '../reader/BookReader';
import { INTERVIEW_STAGES, INTERVIEW_TOPICS, interviewQuestionId, selectInterviewQuestions, topicHref } from '../../lib/interviewTopics.mjs';
import styles from '../../styles/Reader.module.css';
import topicStyles from '../../styles/InterviewTopics.module.css';

export default function TopicReader({ topic, groups, legacy }) {
  const [stage, setStage] = useState('all');
  const [query, setQuery] = useState('');
  const [annotations, setAnnotations] = useState(false);
  const visible = selectInterviewQuestions(groups, { stage, query, annotations });
  const hasAnnotations = groups.some(group => group.kind === 'annotation');
  const reset = () => { setStage('all'); setQuery(''); setAnnotations(false); };
  const index = INTERVIEW_TOPICS.findIndex(item => item.slug === topic.slug);
  const previous = INTERVIEW_TOPICS[index - 1] || null;
  const next = INTERVIEW_TOPICS[index + 1] || null;
  const questionLink = (groupIndex, questionIndex) => `#${interviewQuestionId(topic.slug, groupIndex, questionIndex)}`;
  function jumpToGroup(groupIndex) {
    reset();
    // Native hash navigation runs after the complete bank has been restored.
    requestAnimationFrame(() => document.getElementById(interviewQuestionId(topic.slug, groupIndex, 0))?.scrollIntoView());
  }
  return <ReaderLayout title={`${topic.title} interview questions`} description={topic.description}>
    <nav aria-label="Guide breadcrumb" className={styles.guideBreadcrumb}><Link href="/senior-java-interview">Senior Java interview guide</Link> / <Link href="/senior-java-interview/topics">Topics</Link> / {topic.title}</nav>
    <p className={styles.eyebrow}>TOPIC STUDY PATH · {topic.count} PRIMARY QUESTIONS</p>
    <h1>{topic.title} interview questions</h1>
    <p className={styles.lead}>{topic.description}</p>
    <p className={styles.small}>{topic.baseline} These are conceptual answers and verification scenarios. Runnable examples remain in the linked guide; no live framework, database or cloud test is implied.</p>
    <section id="coverage" aria-labelledby="coverage-title">
      <h2 id="coverage-title">Coverage and reading order</h2>
      <p>Start with the foundation question for each subject, then revisit it at later stages. Every primary question has a direct answer, two answered follow-ups, internals, a trade-off and a verification prompt.</p>
      <ul className={topicStyles.coverage}>{groups.map((group, groupIndex) => <li key={group.title}><a href={questionLink(groupIndex, 0)} onClick={() => jumpToGroup(groupIndex)}>{group.title}</a></li>)}</ul>
    </section>
    <section className={topicStyles.filters} aria-label="Question filters">
      <label htmlFor="topic-question-search">Search questions and answers<input id="topic-question-search" value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${topic.title}…`} type="search" /></label>
      <label htmlFor="topic-stage">Learning stage<select id="topic-stage" aria-label="Learning stage" value={stage} onChange={event => setStage(event.target.value)}><option value="all">All stages</option>{INTERVIEW_STAGES.map(level => <option key={level.id} value={level.id}>{level.title}</option>)}</select></label>
      {hasAnnotations && <label className={topicStyles.checkbox}><input type="checkbox" checked={annotations} onChange={event => setAnnotations(event.target.checked)} />Annotation internals only</label>}
      <button type="button" onClick={reset}>Reset filters</button>
    </section>
    <p role="status" aria-live="polite">{visible.length} of {topic.count} primary questions shown</p>
    {visible.length === 0 && <p>No matching questions. Change the search or reset the filters to return to the full topic.</p>}
    <BookReader key={topic.slug} storageId={`interview-topic-${topic.slug}`} title={`${topic.title} questions`} contentsHref="/senior-java-interview/topics">
      <article className={styles.guideArticle} aria-label={`${topic.title} question bank`}>
        {INTERVIEW_STAGES.map(level => {
          const items = visible.filter(item => item.stage === level.id);
          if (!items.length) return null;
          return <section key={level.id} aria-labelledby={`stage-${level.id}`}>
            <h2 id={`stage-${level.id}`}>{level.title}</h2><p>{level.description}</p>
            {items.map(({ groupIndex, questionIndex }) => {
              const group = groups[groupIndex];
              const entry = group.questions[questionIndex];
              const id = interviewQuestionId(topic.slug, groupIndex, questionIndex);
              const followUps = [1, 2].map(offset => group.questions[(questionIndex + offset) % group.questions.length]);
              return <section key={id} className={topicStyles.question} aria-labelledby={id} data-interview-question>
                <p className={styles.eyebrow}>{id.toUpperCase()} · {group.title}</p>
                <h3 id={id}><a href={`#${id}`} aria-label={`Bookmark ${id}`}>#</a> {entry.question}</h3>
                <p><strong>Tier 1 · Foundation:</strong> {group.questions[0].answer}</p>
                <blockquote><p><strong>{questionIndex === 0 ? 'Tier 2 · How it works:' : 'Tier 2 · Direct answer:'}</strong> {questionIndex === 0 ? group.mechanism : entry.answer}</p></blockquote>
                <details><summary>Tier 3 · Answered follow-ups</summary>{followUps.map(followUp => <div key={followUp.question}><h4>{followUp.question}</h4><p>{followUp.answer}</p></div>)}</details>
                <details><summary>Tier 4 · Deep dive and verification</summary>{questionIndex !== 0 && <p><strong>Internals:</strong> {group.mechanism}</p>}<p><strong>Trade-off:</strong> {group.tradeOff}</p><p><strong>How to verify:</strong> {group.verify}</p></details>
              </section>;
            })}
          </section>;
        })}
      </article>
    </BookReader>
    <section aria-labelledby="topic-sources"><h2 id="topic-sources">Primary references</h2><p>Baselines and source scope are explicit above. Check exact version defaults before applying an answer to a deployed system.</p><ul>{topic.sources.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul></section>
    <details className={styles.guideNotes}><summary>Existing guide material by topic ({legacy.length} sections)</summary><p>Original explanations, numbered questions, code and bookmarks remain available at their source locations.</p><ul>{legacy.map(entry => <li key={entry.href}><Link href={entry.href}>{entry.title}</Link> <span className={styles.small}>· {entry.part}</span></li>)}</ul></details>
    <nav aria-label="Topic navigation" className={styles.guideChapterNav}>{previous ? <Link href={topicHref(previous.slug)}>← {previous.title}</Link> : <span>First topic</span>}<Link href="/senior-java-interview/topics">All topics</Link>{next ? <Link href={topicHref(next.slug)}>{next.title} →</Link> : <span>Last topic</span>}</nav>
  </ReaderLayout>;
}
