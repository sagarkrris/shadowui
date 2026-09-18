import { useState } from 'react';
import Link from 'next/link';
import ReaderLayout from '../../components/reader/ReaderLayout';
import { PUBLIC_ARTICLES } from '../../lib/publicContent.mjs';
import { SCENARIO_SEEDS } from '../../lib/scenarioBank.mjs';
import { SYMPTOMS } from '../../lib/engineeringSymptoms.mjs';
import styles from '../../styles/Reader.module.css';
import lab from '../../styles/Symptoms.module.css';
export default function SymptomEntry({ entry, source, lessonTitle, scenarioTitle }) {
  const [lessonSlug, scenarioId, connection] = entry.learningPath;
  const command = entry.language === 'Java' ? `javac ${entry.fixture}\njava ${entry.fixture.replace('.java', '')}` : `python3 ${entry.fixture}`;
  const [notice, setNotice] = useState('');
  async function copyExample() {
    try { await navigator.clipboard.writeText(source); setNotice('Example copied. Run it locally using the displayed command.'); }
    catch { setNotice('Clipboard unavailable. Select the example below or download the file.'); }
  }
  return <ReaderLayout title={entry.title} description={entry.summary}><div className={lab.entry}>
    <p><Link href="/symptoms">← Search the Symptoms Atlas</Link></p>
    <section className={styles.hero}><p className={styles.eyebrow}>{entry.category} · ENGINEERING SYMPTOMS ATLAS</p><h1>{entry.title}</h1><p className={styles.lead}>{entry.summary}</p><p>{entry.applicability}</p><p className={styles.small}>Source and fixture review: {entry.reviewedAt}. Scope limits are recorded below.</p><p className={styles.small}>InterviewIQ Editorial · Updated September 18, 2026 · Individual reviewer unassigned.</p></section>
    <nav aria-label="Entry sections" className={styles.actions}><a href="#overview">2-minute overview</a><a href="#causes">Compare causes</a><a href="#reproduce">Try it yourself</a></nav>
    <section id="overview" className={lab.section}><h2>2-minute overview</h2><p>{entry.observations}</p><aside className={styles.card}><h3>Inspect this first</h3><p>{entry.firstStep}</p></aside></section>
    <section id="causes" className={lab.section}><h2>Evidence that separates plausible causes</h2><p>These are hypotheses to investigate, not diagnoses or an exhaustive list. A matching symptom alone is insufficient.</p>{entry.causes.map((cause, index) => <article className={lab.cause} key={cause.title}><h3>{index + 1}. {cause.title}</h3><dl><dt>Evidence that supports it</dt><dd>{cause.evidence}</dd><dt>Evidence that weakens it</dt><dd>{cause.against}</dd><dt>Next diagnostic step</dt><dd>{cause.next}</dd></dl></article>)}</section>
    <section id="reproduce" className={lab.section}><h2>Try it yourself: a minimal reproduction</h2><p>{entry.fixtureScope}</p><p>Verified with {entry.runtime}. Uses only the standard library and synthetic data. Nothing runs on the site.</p><div className={styles.actions}><button onClick={copyExample}>Copy example</button><a href={`/symptom-examples/${entry.fixture}`} download>Download {entry.fixture}</a></div><p role="status">{notice}</p><pre className={lab.code}><code>{command}</code></pre><details><summary>Read the complete runnable example</summary><pre className={lab.code} tabIndex={0} aria-label={`Runnable ${entry.language} example`}><code>{source}</code></pre></details><h3>Expected output</h3><pre className={lab.code}><code>{entry.expected}</code></pre><p>The script includes assertions. A failure means the example did not reproduce as expected in your environment; it does not diagnose your service.</p></section>
    <section className={lab.section}><h2>Learn → investigate → practice</h2><p>{connection}</p><ol><li><Link href={`/java/${lessonSlug}`}>Lesson: {lessonTitle}</Link></li><li><Link href={`/scenarios/${scenarioId}`}>Scenario: {scenarioTitle}</Link></li><li><Link href={`/scenarios/${scenarioId}#practice`}>Practice: work through the scenario and its rubric</Link></li></ol><h2>Continue the investigation</h2><ul>{entry.related.map(link => <li key={link.href}><Link href={link.href}>{link.title}</Link></li>)}</ul><h2>References and corrections</h2><ul>{entry.references.map(link => <li key={link.href}><a href={link.href}>{link.title}</a></li>)}</ul><Link href="/corrections">Report a correction</Link></section>
  </div></ReaderLayout>;
}
export function getStaticPaths() { return { paths: SYMPTOMS.map(entry => ({ params: { slug: entry.slug } })), fallback: false }; }
export async function getStaticProps({ params }) {
  const entry = SYMPTOMS.find(item => item.slug === params.slug);
  if (!entry) return { notFound: true };
  const { readFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const source = await readFile(join(process.cwd(), 'public', 'symptom-examples', entry.fixture), 'utf8');
  return { props: { entry, source, lessonTitle: PUBLIC_ARTICLES.find(item => item.slug === entry.learningPath[0]).title, scenarioTitle: SCENARIO_SEEDS.find(item => item.id === entry.learningPath[1]).title } };
}
