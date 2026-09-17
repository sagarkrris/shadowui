import Link from "next/link";
import { useEffect, useState } from "react";
import DetectiveLayout from "../../components/detective/DetectiveLayout";
import { DETECTIVE_CASES, DETECTIVE_STORAGE_PREFIX, normalizeInvestigation } from "../../lib/productionDetective.mjs";
import styles from "../../styles/ProductionDetective.module.css";

export default function DetectiveIndex() {
  const [progress, setProgress] = useState({});
  useEffect(() => {
    const next = {};
    for (const incident of DETECTIVE_CASES) {
      try { next[incident.slug] = normalizeInvestigation(JSON.parse(localStorage.getItem(DETECTIVE_STORAGE_PREFIX + incident.slug)), incident); } catch { /* A damaged case must not hide other cases. */ }
    }
    setProgress(next);
  }, []);
  return <DetectiveLayout title="Five minutes. One production mystery." description="Investigate five interactive debugging cases. Inspect evidence, diagnose the failure, and choose a fix. Free, with no sign-in.">
    <section className={styles.hero}><div><p className={styles.eyebrow}>THE ON-CALL DESK · 5 OPEN CASES</p><h1>Something broke.<br /><em>Find out why.</em></h1><p className={styles.lead}>Short debugging stories for curious engineers. Follow the evidence, challenge your first theory, and leave with a lesson you can use at work.</p><Link className={styles.primary} href={`/detective/${DETECTIVE_CASES[0].slug}`}>Open your first case <span aria-hidden="true">→</span></Link><p className={styles.small}>About 5 minutes per case · No sign-in · Immediate explanations</p></div><aside className={styles.dossier} aria-label="How an investigation works"><span className={styles.stamp}>CASE FILE / 001</span><h2>A log is a clue.<br />A hunch isn’t a diagnosis.</h2><ol><li>Inspect the evidence</li><li>Choose a diagnosis</li><li>Propose a repair</li><li>Explore the trade-off</li></ol><span className={styles.small}>Your first inspection is your starting hypothesis.</span></aside></section>
    <section aria-labelledby="cases-title"><div className={styles.sectionHeading}><h2 id="cases-title">Pick an investigation</h2><span>5 cases · 5 engineering lessons</span></div><div className={styles.grid}>{DETECTIVE_CASES.map(incident => <Link key={incident.slug} href={`/detective/${incident.slug}`} className={styles.card}><div className={styles.cardTop}><span className={styles.caseNumber}>{incident.number}</span><span className={styles.tag}>{incident.topic}</span></div><h3>{incident.title}</h3><p>{incident.description}</p><div className={styles.cardBottom}><span>{progress[incident.slug]?.completed ? "Completed · revisit" : progress[incident.slug]?.inspected.length ? "In progress · resume" : "5 min · open case"}</span><span aria-hidden="true">↗</span></div></Link>)}</div></section>
    <section className={styles.note}><h2>Learn the mechanism, not just the answer.</h2><p>Every case includes a 2-minute overview, evidence, a deep explanation, a hands-on model, and technical references. All incidents and measurements are fictional. Progress stays in this browser; it is not an assessment or certification.</p><p>Pick one for your weekly team discussion. Share links contain the mystery, never your answers.</p></section>
  </DetectiveLayout>;
}
