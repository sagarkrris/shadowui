import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ReaderLayout from './ReaderLayout';
import ContinueLearning from './ContinueLearning';
import UiIcon from './UiIcon';
import { labResult } from '../../lib/hubLabs.mjs';
import home from '../../styles/Home.module.css';

const paths = [
  { title: 'Java & Backend', href: '/java/roadmap', icon: 'code', color: 'mint', tag: 'FROM FOUNDATIONS TO PRODUCTION', description: 'Connect Java, Spring, SQL and concurrency to the systems you build.', topics: ['Java', 'Spring', 'SQL'], mark: '{ }' },
  { title: 'System Design', href: '/learn/roadmaps/system-design', icon: 'layers', color: 'blue', tag: 'THINK IN SYSTEMS', description: 'Explore capacity, consistency and failure. Defend your design decisions.', topics: ['Scale', 'Data', 'Reliability'], mark: '↗' },
  { title: 'Full Stack', href: '/learn/roadmaps/full-stack', icon: 'route', color: 'peach', tag: 'CONNECT THE WHOLE PICTURE', description: 'Follow browser, API and data contracts from one end to the other.', topics: ['React', 'Node.js', 'APIs'], mark: '</>' },
  { title: 'AI Engineering', href: '/learn/roadmaps/ai-engineering', icon: 'lab', color: 'lavender', tag: 'BUILD BEYOND THE PROMPT', description: 'Work through retrieval, model contracts, evaluations and agent workflows.', topics: ['RAG', 'Agents', 'Evals'], mark: '✳' },
];

function CachePreview() {
  const [capacity, setCapacity] = useState(2);
  const result = labResult('cache', { value: capacity });
  return <div className={home.preview}>
    <div className={home.previewBar}><span>Interactive lab</span><UiIcon name="lab" size={16} /></div>
    <div className={home.previewBody}>
      <div className={home.previewLabel}>Cache behaviour</div>
      <h2>What fits in your cache?</h2><p>Same requests. Different capacity.<br />See which work you can reuse.</p>
      <div className={home.requestLine} aria-label="Request sequence A, A, B, A, B, C, A">{['A', 'A', 'B', 'A', 'B', 'C', 'A'].map((value, index) => <span key={index} className={value === 'C' ? home.requestNew : ''}>{value}</span>)}</div>
      <div className={home.cacheControls}><span>Cache capacity</span><div>{[1, 2, 3].map(value => <button key={value} type="button" aria-label={`Preview cache capacity ${value}`} aria-pressed={value === capacity} onClick={() => setCapacity(value)}>{value}</button>)}</div></div>
      <div className={home.cacheResult} role="status" aria-label="Cache preview result"><span><UiIcon name="check" size={18} />{result.summary}</span><code>oldest → newest: {result.lines.at(-1).split('oldest → newest: ')[1]}</code></div>
      <p className={home.previewNote}>Try another capacity. This is a fixed LRU teaching model.</p>
      <Link prefetch={false} href="/labs/cache" className={home.previewLink}>Open the full experiment<UiIcon name="arrow" size={17} /></Link>
    </div>
    <div className={home.previewBottom}><span>01 Observe</span><span>02 Experiment</span><span>03 Explain</span></div>
  </div>;
}

export default function LandingHome({ catalogue, promise, counts }) {
  const router = useRouter();
  useEffect(() => { if (router.isReady && typeof router.query.workspace === 'string') router.replace({ pathname: '/practice', query: router.query }); }, [router]);
  const [query, setQuery] = useState('');
  const articles = catalogue.filter(article => `${article.title} ${article.description} ${article.category}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <ReaderLayout title="Understand engineering. Build interview confidence." description={promise}>
    <section className={home.hero}>
      <div className={home.heroCopy}><p className={home.heroBadge}><span /> TECHNICAL LEARNING AND INTERVIEW PRACTICE</p><h1>Prepare for your next engineering role.</h1><p className={home.heroLead}>Study the fundamentals, work through practical problems, and practise explaining your decisions. All in one place.</p><div className={home.heroActions}><Link prefetch={false} href="/learn" className={home.primaryCta}>Find your learning path<UiIcon name="arrow" /></Link><Link prefetch={false} href="/labs" className={home.secondaryCta}><UiIcon name="lab" size={18} />Try an interactive lab</Link></div><div className={home.heroTrust}><span><UiIcon name="check" size={16} />Public lessons, no sign-in</span><span><UiIcon name="check" size={16} />Learn at your pace</span></div></div>
      <CachePreview />
    </section>
    <div className={home.valueStrip}><p>A complete<br /><strong>preparation workspace</strong></p><div><strong>{counts.courses}</strong><span>structured courses</span></div><div><strong>{counts.labs}</strong><span>interactive labs</span></div><div><strong>{counts.challenges}</strong><span>original Java challenges</span></div><div><strong>4</strong><span>connected learning paths</span></div></div>
    <section className={home.section} aria-labelledby="choose-path"><div className={home.sectionHeading}><div><p className={home.eyebrow}>CURRICULUM</p><h2 id="choose-path">Learning paths</h2><p>Choose a track based on the work you want to do.</p></div><Link prefetch={false} href="/learn">Explore all courses<UiIcon name="arrow" size={17} /></Link></div>
      <div className={home.pathGrid}>{paths.map(path => <Link prefetch={false} href={path.href} className={home.pathCard} key={path.href}><div className={home.pathArt} aria-hidden="true"><UiIcon name={path.icon} size={28} /></div><div className={home.pathBody}><p>{path.tag}</p><h3>{path.title}<UiIcon name="arrow" size={20} /></h3><span>{path.description}</span><div className={home.pathTopics}>{path.topics.map(topic => <small key={topic}>{topic}</small>)}</div></div></Link>)}</div>
    </section>
    <section className={home.spotlight} aria-labelledby="senior-java-guide-title"><div><p className={home.eyebrow}>THE EXPERIENCED ENGINEER’S STUDY PATH</p><h2 id="senior-java-guide-title">Senior Java interview guide</h2><p>Work through the senior Java interview guide, follow the two-week plan, and practise explaining code, architecture and trade-offs.</p><div className={home.heroActions}><Link prefetch={false} className={home.lightCta} href="/senior-java-interview">Read the full guide<UiIcon name="arrow" size={18} /></Link><Link prefetch={false} href="/senior-java-interview/part-9" className={home.spotlightTextLink}>Explore the coding track →</Link></div></div><aside className={home.guideContents}><p>In this guide</p><ul><li>Java and JVM fundamentals</li><li>Concurrency and production systems</li><li>Architecture and coding practice</li></ul><Link prefetch={false} href="/senior-java-interview">View the study plan →</Link></aside></section>
    <section className={home.section}><div className={home.sectionHeading}><div><p className={home.eyebrow}>HOW IT WORKS</p><h2>A practical learning workflow</h2></div></div><div className={home.steps}>{[
      ['01', 'Understand', 'Read a clear explanation with examples, assumptions and sources.', 'book', '/series'],
      ['02', 'Experiment', 'Change a constraint and follow what happens in a visual lab.', 'lab', '/labs'],
      ['03', 'Build', 'Write a small implementation and test its failure cases.', 'code', '/build'],
      ['04', 'Explain', 'Practise your answer, discover gaps and come back stronger.', 'chat', '/practice'],
    ].map(([number, title, text, icon, href]) => <article key={title}><div><span>{number}</span><UiIcon name={icon} size={23} /></div><h3><Link prefetch={false} href={href}>{title}</Link></h3><p>{text}</p></article>)}</div></section>
    <section className={home.section}><div className={home.sectionHeading}><div><p className={home.eyebrow}>PRACTICE</p><h2>Practice with engineering problems</h2><p>Pick a quick investigation or go deep on a build.</p></div><Link prefetch={false} href="/build">Browse challenges<UiIcon name="arrow" size={17} /></Link></div><div className={home.practiceGrid}>{[
      ['pulse', 'PRODUCTION DETECTIVE · ABOUT 5 MINUTES', 'The rollback that never happened', 'A transfer failed, but one balance changed. Follow the evidence and choose your repair.', '/weekly/2026-09-18-transaction-boundaries', 'Investigate the failure'],
      ['code', 'BUILD · JAVA 17', 'Apply only a newer webhook version', 'Implement a version contract. Test what happens when updates arrive twice or out of order.', '/build/practice/webhook-version-gate', 'Take the coding challenge'],
      ['layers', 'READ THE EVIDENCE', 'The pool threads waiting on one monitor', 'Inspect a fictional thread dump and separate your observations from your conclusions.', '/explain-log/blocked-pool-thread-dump', 'Follow the thread dump'],
    ].map(([icon, tag, title, description, href, action]) => <article className={home.practiceCard} key={href}><span className={home.featureIcon}><UiIcon name={icon} size={25} /></span><p className={home.eyebrow}>{tag}</p><h3><Link prefetch={false} href={href}>{title}</Link></h3><p>{description}</p><Link prefetch={false} href={href} className={home.cardAction}>{action}<UiIcon name="arrow" size={17} /></Link></article>)}</div><p className={home.practiceFollowup}>Go deeper: <Link prefetch={false} href="/tech-blogs/java-money-production">Java Money: Minor Units, Rounding, FX, and Reconciliation</Link></p></section>
    <section className={home.symptomBanner}><div><UiIcon name="pulse" size={30} /><h2>Slow, stuck, or happening twice?</h2><p>Start with your symptom. Find the next thing to inspect.</p></div><form action="/symptoms"><label htmlFor="home-symptom">Search engineering symptoms</label><div><input id="home-symptom" type="search" name="q" placeholder="Try slow requests or rollback" /><button type="submit" aria-label="Find diagnostic steps"><UiIcon name="arrow" /></button></div></form></section>
    <section className={home.section} aria-labelledby="article-library"><div className={home.sectionHeading}><div><p className={home.eyebrow}>THE ENGINEERING LIBRARY</p><h2 id="article-library">Engineering library</h2></div><Link prefetch={false} href="/explore">View the complete library<UiIcon name="arrow" size={17} /></Link></div><label className={home.librarySearch}><UiIcon name="search" size={20} /><span className={home.srOnly}>Search articles</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search transactions, SQL, memory…" /></label><p className={home.searchCount} role="status">{articles.length} articles</p><div className={home.articleGrid}>{articles.slice(0, query ? 12 : 3).map(article => <article className={home.articleCard} key={article.href}><p className={home.eyebrow}>{article.category} <span>· {article.minutes} min read</span></p><h3><Link prefetch={false} href={article.href}>{article.title}</Link></h3><p>{article.description}</p><Link prefetch={false} href={article.href} className={home.cardAction}>Read the explanation<UiIcon name="arrow" size={16} /></Link></article>)}</div>{!articles.length && <div className={home.noResults}><h3>No articles found</h3><p>Try a broader topic, or explore the learning paths.</p><button type="button" onClick={() => setQuery('')}>Clear search</button></div>}</section>
    <div className={home.continue}><ContinueLearning /></div>
    <section className={home.closing}><p className={home.eyebrow}>CONTINUE LEARNING</p><h2>Keep your preparation moving.</h2><p>Choose a course, complete an exercise, or return to your saved work.</p><Link prefetch={false} href="/learn" className={home.primaryCta}>Start learning<UiIcon name="arrow" /></Link><div><Link prefetch={false} href="/editorial">Our editorial standards</Link><span>·</span><Link prefetch={false} href="/corrections">Public corrections</Link></div></section>
  </ReaderLayout>;
}
