import { SITE_URL } from "../../lib/siteUrl.mjs";
import Head from "next/head";
import ReaderLayout from "../../components/reader/ReaderLayout";
import JavaBackendJourney from "../../components/reader/JavaBackendJourney";
import styles from "../../styles/Reader.module.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { JAVA_CURATED_TUTORIAL_CATALOG, slugifyJavaTutorial } from "../../lib/javaDigest.mjs";

const PROGRESS_KEY = "interviewiq.javaRoadmapProgress.v1";
const GROUPS = [
  ["Core Java", "Build the language mental model first: syntax, object design, collections, generics, exceptions, and modern Java.", ["Basics", "OOP", "Modern Java", "Strings", "Collections", "Generics", "Exceptions", "Java 8+", "Java 9+", "I/O"]],
  ["Concurrency and the JVM", "Learn what makes production Java different: threads, coordination, runtime behavior, and memory pressure.", ["Concurrency", "Java 21", "JVM"]],
  ["Spring Framework", "Turn language fundamentals into maintainable services with Spring’s core patterns and Spring Boot conventions.", ["Spring", "Spring Boot"]],
  ["Data and architecture", "Connect application decisions to persistence, algorithms, architecture boundaries, and system trade-offs.", ["Data", "Design", "Architecture"]],
  ["Testing and problem solving", "Make your reasoning visible through tests, complexity analysis, and interview-ready explanations.", ["Testing", "Algorithms"]],
];

function roadmapGroups() { let step = 0; return GROUPS.map(([title, description, categories]) => ({ title, description, steps: JAVA_CURATED_TUTORIAL_CATALOG.filter((tutorial) => categories.includes(tutorial.category)).map((tutorial) => ({ ...tutorial, step: ++step })) })).filter((group) => group.steps.length); }

export default function JavaRoadmap() {
  const groups = useMemo(() => roadmapGroups(), []); const steps = useMemo(() => groups.flatMap((group) => group.steps), [groups]); const [completed, setCompleted] = useState([]); const [chapterReady, setChapterReady] = useState(false); const [chapterMessage, setChapterMessage] = useState(""); const completedCount = completed.filter((id) => steps.some((step) => step.id === id)).length;
  useEffect(() => { try { const saved = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || "[]"); if (Array.isArray(saved)) setCompleted([...new Set(saved.filter(id => steps.some(step => step.id === id)))]); } catch { setChapterMessage("Saved chapter progress is unavailable."); } setChapterReady(true); }, [steps]);
  function toggleComplete(id) {
    const next = completed.includes(id) ? completed.filter(item => item !== id) : [...completed, id];
    setCompleted(next);
    try { window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)); setChapterMessage("Chapter progress saved in this browser."); }
    catch { setChapterMessage("Could not save chapter progress. Your checks will last only for this visit."); }
  }
  return <ReaderLayout title="Java Backend Engineer roadmap" description="A guided Java backend journey connecting lessons, investigations, build exercises, interview practice, and review.">
    <Head><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", name: "Complete Java Backend Learning Path", numberOfItems: steps.length, itemListElement: steps.map(tutorial => ({ "@type": "ListItem", position: tutorial.step, name: tutorial.title, url: `${SITE_URL}/java/tutorial/${slugifyJavaTutorial(tutorial.title)}` })) }) }} /></Head>
    <header className={styles.hero}><p className={styles.eyebrow}>JAVA BACKEND ENGINEER · SIX STAGES</p><h1>Java Backend Engineer roadmap</h1><p className={styles.lead}>Build understanding from Java fundamentals to reliable services, then practise explaining your decisions in an interview.</p><p>Use the guided stages below to connect learning with hands-on work. The complete chapter checklist remains available for deeper study.</p></header>
    <JavaBackendJourney />
    <section aria-label="Complete chapter checklist"><p role="status">{chapterMessage}</p><h2>Complete chapter checklist</h2><p>{completedCount} of {steps.length} chapters complete. Chapter progress is separate from the guided activities.</p>
      {groups.map(group => <details key={group.title} className={styles.card}><summary>{group.title} · {group.steps.length} chapters</summary><p>{group.description}</p><ol start={group.steps[0].step}>{group.steps.map(tutorial => <li key={tutorial.id}><label><input type="checkbox" disabled={!chapterReady} checked={completed.includes(tutorial.id)} onChange={() => toggleComplete(tutorial.id)} />{tutorial.title} complete</label><Link prefetch={false} href={`/java/tutorial/${slugifyJavaTutorial(tutorial.title)}`}>Read {tutorial.title} →</Link><p className={styles.small}>{tutorial.level} · {tutorial.summary}</p></li>)}</ol></details>)}
    </section><div className={styles.actions}><Link href="/java">Browse Java guides</Link><Link href="/practice?workspace=java-digest">Open Java Digest</Link></div>
  </ReaderLayout>;
}
