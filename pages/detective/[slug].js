import Link from "next/link";
import { NOTEBOOK_KEY, normalizeNotebook, saveNote } from "../../lib/learningNotebook.mjs";
import DiagnosisReflection from "../../components/reader/DiagnosisReflection";
import InterviewTransfer from "../../components/reader/InterviewTransfer";
import { useEffect, useRef, useState } from "react";
import DetectiveLayout from "../../components/detective/DetectiveLayout";
import DetectiveLab from "../../components/detective/DetectiveLab";
import { DETECTIVE_CASES, DETECTIVE_REVIEWED_AT, DETECTIVE_STORAGE_PREFIX, initialInvestigation, normalizeInvestigation } from "../../lib/productionDetective.mjs";
import { trackEvent } from "../../lib/analytics.mjs";
import styles from "../../styles/ProductionDetective.module.css";

export default function CasePage({ incident }) { return <Investigation key={incident.slug} incident={incident} />; }
function Investigation({ incident }) {
  const [progress, setProgress] = useState(initialInvestigation);
  const [ready, setReady] = useState(false);
  const [storageMessage, setStorageMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [activeClue, setActiveClue] = useState("");
  const visited = useRef(false);
  const resolution = useRef(null);
  const key = DETECTIVE_STORAGE_PREFIX + incident.slug;
  useEffect(() => {
    try { setProgress(normalizeInvestigation(JSON.parse(localStorage.getItem(key)), incident)); }
    catch { setStorageMessage("Saved progress could not be read. You can still complete this case here."); }
    setReady(true);
    if (visited.current) return;
    visited.current = true;
    // Distinct case views in a tab session; return visits mean a later UTC calendar day.
    try {
      const seenKey = `interviewiq.detective.seen.${incident.slug}`;
      if (sessionStorage.getItem(seenKey)) return;
      sessionStorage.setItem(seenKey, "1");
      const dateKey = `interviewiq.detective.visit.${incident.slug}`;
      const previous = localStorage.getItem(dateKey);
      const today = new Date().toISOString().slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(previous || "") && previous < today) trackEvent("detective_returned", { value: incident.slug });
      localStorage.setItem(dateKey, today);
    } catch { /* Measurement is best effort and never gates the story. */ }
    trackEvent("detective_viewed", { value: incident.slug });
    if (new URLSearchParams(window.location.search).get("via") === "share") trackEvent("detective_share_visit", { value: incident.slug });
  }, [key, incident]);
  function update(next) {
    const valid = normalizeInvestigation(next, incident);
    setProgress(valid);
    try {
      const saved = normalizeNotebook(JSON.parse(localStorage.getItem(NOTEBOOK_KEY) || '[]')).find(item => item.id === `detective-${incident.slug}`);
      saveNote(localStorage, { ...saved, id: `detective-${incident.slug}`, title: incident.title, href: `/detective/${incident.slug}` });
    } catch { /* Investigation storage below remains independent of the notebook shortcut. */ }
    try { localStorage.setItem(key, JSON.stringify(valid)); setStorageMessage("Progress saved in this browser."); }
    catch { setStorageMessage("Progress could not be saved. Keep this tab open to finish; a reload may lose it."); }
  }
  function inspect(id) {
    setActiveClue(id);
    if (!progress.inspected.includes(id)) {
      if (!progress.inspected.length) trackEvent("detective_started", { value: incident.slug });
      update({ ...progress, inspected: [...progress.inspected, id] });
    }
  }
  function finish() {
    update({ ...progress, completed: true });
    trackEvent("detective_completed", { value: incident.slug });
    window.requestAnimationFrame(() => resolution.current?.focus());
  }
  async function share() {
    const url = new URL(`/detective/${incident.slug}`, window.location.origin);
    url.searchParams.set("via", "share");
    setShareUrl(url.href);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url.href);
      setShareMessage("Challenge link copied. It contains no answers or progress.");
      trackEvent("detective_shared", { value: incident.slug });
    } catch { setShareMessage("Copy was unavailable. Select and copy the challenge link below."); }
  }
  const clue = incident.evidence.find(item => item.id === activeClue);
  const diagnosis = incident.diagnoses.find(item => item.id === progress.diagnosis);
  const fix = incident.fixes.find(item => item.id === progress.fix);
  const next = DETECTIVE_CASES[(DETECTIVE_CASES.findIndex(item => item.slug === incident.slug) + 1) % DETECTIVE_CASES.length];
  const phase = progress.completed ? 3 : progress.diagnosis === incident.diagnosis ? 2 : progress.inspected.length >= 2 ? 1 : 0;
  return <DetectiveLayout title={incident.title} description={incident.description} path={`/detective/${incident.slug}`}>
    <Link href="/detective" className={styles.back}>← All case files</Link>
    <section className={styles.caseHero}><p className={styles.eyebrow}>CASE {incident.number} / {incident.topic.toUpperCase()} · ABOUT 5 MINUTES</p><h1>{incident.title}</h1><p className={styles.lead}>{incident.description}</p><div className={styles.meta}><span>{incident.environment}</span><button onClick={share}>Copy challenge link</button></div><p role="status" className={styles.small}>{shareMessage}</p>{shareUrl && <label className={styles.shareField}>Spoiler-free challenge URL<input readOnly value={shareUrl} onFocus={e => e.target.select()} /></label>}</section>
    <ol className={styles.steps} aria-label="Investigation progress">{["Evidence", "Diagnosis", "Repair", "Debrief"].map((step, index) => <li key={step} aria-current={phase === index ? "step" : undefined}><span>{index + 1}</span>{step}</li>)}</ol>
    <section className={styles.overview}><p className={styles.eyebrow}>2-MINUTE OVERVIEW</p><h2>The incident</h2><p>{incident.overview}</p><p className={styles.small}>Fictional case · No timer · Your work stays in this browser</p></section>
    <section className={styles.investigation} aria-labelledby="evidence-title"><div><p className={styles.eyebrow}>01 / FOLLOW THE EVIDENCE</p><h2 id="evidence-title">What would you inspect first?</h2><p>Open at least two clues before choosing a diagnosis. Every clue remains available throughout the case.</p><div className={styles.clues}>{incident.evidence.map((item, index) => <button key={item.id} disabled={!ready} className={activeClue === item.id ? styles.selected : ""} aria-pressed={activeClue === item.id} onClick={() => inspect(item.id)}><span>0{index + 1} / {item.title}</span><small>{progress.inspected.includes(item.id) ? "Inspected ✓" : "Inspect →"}</small></button>)}</div><p className={styles.small}>{progress.inspected.length} of {incident.evidence.length} clues inspected</p>{progress.inspected[0] && <p className={styles.small}>First inspection: {incident.evidence.find(item => item.id === progress.inspected[0])?.title}</p>}</div><div className={styles.evidence} aria-live="polite">{clue ? <><p className={styles.eyebrow}>EVIDENCE / {clue.title}</p><pre tabIndex={0} aria-label={clue.title}><code>{clue.body}</code></pre><p className={styles.clueInsight}>{clue.insight}</p></> : <div className={styles.empty}><span aria-hidden="true">⌕</span><h3>The evidence is waiting.</h3><p>Choose a file to inspect its contents.</p></div>}</div></section>
    {!progress.completed && <><section className={styles.panel}><p className={styles.eyebrow}>02 / BUILD A THEORY</p><h2>Which diagnosis fits the evidence?</h2><fieldset disabled={!ready || progress.inspected.length < 2 || progress.diagnosis === incident.diagnosis}><legend>{progress.inspected.length < 2 ? "Inspect two clues to unlock the diagnoses." : "Choose the explanation supported by this incident."}</legend>{incident.diagnoses.map(item => <label key={item.id} className={`${styles.option} ${progress.diagnosis === item.id ? styles.selected : ""}`}><input type="radio" name="diagnosis" value={item.id} checked={progress.diagnosis === item.id} onChange={() => update({ ...progress, diagnosis: item.id, fix: "" })} />{item.label}</label>)}</fieldset>{diagnosis && <p className={styles.feedback} role="status">{diagnosis.feedback}</p>}</section>
    {progress.diagnosis === incident.diagnosis && <section className={styles.panel}><p className={styles.eyebrow}>03 / MAKE A REPAIR</p><h2>What would you change?</h2><fieldset><legend>Choose a fix that addresses the cause.</legend>{incident.fixes.map(item => <label key={item.id} className={`${styles.option} ${progress.fix === item.id ? styles.selected : ""}`}><input type="radio" name="fix" value={item.id} checked={progress.fix === item.id} onChange={() => update({ ...progress, fix: item.id })} />{item.label}</label>)}</fieldset>{fix && <p className={styles.feedback} role="status">{fix.feedback}</p>}{progress.fix === incident.fix && <button className={styles.primary} onClick={finish}>Complete investigation</button>}</section>}</>}
    {progress.completed && <section className={styles.complete}><p className={styles.eyebrow}>CASE CLOSED</p><h2 tabIndex={-1} ref={resolution}>Investigation complete.</h2><p>You connected the evidence to a diagnosis and a repair. Read the trade-offs below, then try changing the conditions.</p><p><strong>Diagnosis:</strong> {diagnosis?.label}<br /><strong>Repair:</strong> {fix?.label}</p><Link href={`/detective/${next.slug}`}>Next case: {next.title} →</Link></section>}
    <p role="status" className={styles.small}>{storageMessage}</p>
    <details className={styles.debrief} open={progress.completed || undefined} key={progress.completed ? "completed" : "unrevealed"}><summary>{progress.completed ? "The debrief · explanation and experiment" : "Read the explanation & experiment (spoilers)"}</summary><div className={styles.debriefBody}><p className={styles.eyebrow}>THE EXPLANATION</p><h2>What actually happened</h2><p>{incident.explanation}</p><h3>Deep explanation</h3><p>{incident.deep}</p><h3>The fix and its trade-offs</h3><p>{incident.tradeoff}</p><h3>How to verify it</h3><p>{incident.verification}</p><DetectiveLab lab={incident.lab} /><h3>References & review</h3><p>By InterviewIQ Editorial · Individual reviewer not yet assigned. <Link href={`/corrections?article=/detective/${incident.slug}`}>Corrections and report a mistake</Link> · <Link href="/editorial">Editorial standards</Link></p><ul>{incident.references.map(reference => <li key={reference.url}><a href={reference.url}>{reference.label}</a></li>)}</ul><p className={styles.small}>Technical review / last content correction: <time dateTime={DETECTIVE_REVIEWED_AT}>{DETECTIVE_REVIEWED_AT}</time>. These are original fictional teaching cases; sources document the underlying mechanisms. Reading this explanation alone does not mark the investigation complete.</p></div></details>
    <div className="detective-reflection"><DiagnosisReflection id={`detective-${incident.slug}`} title={incident.title} href={`/detective/${incident.slug}`} explanation={incident.explanation} evidence={incident.evidence.map(item => item.insight).join(" ")} tradeoff={incident.tradeoff} /></div>
    {incident.slug === "the-rollback-that-never-happened" && <p><Link href="/learn/spring-transactions">Continue the Spring transaction journey →</Link></p>}
    {progress.completed && <InterviewTransfer incident={incident} />}
    <noscript><p>JavaScript enables interactive choices and saved progress. You can read the full explanation in the disclosure above without JavaScript.</p></noscript>
  </DetectiveLayout>;
}
export function getStaticPaths() { return { paths: DETECTIVE_CASES.map(incident => ({ params: { slug: incident.slug } })), fallback: false }; }
export function getStaticProps({ params }) {
  const incident = DETECTIVE_CASES.find(item => item.slug === params.slug);
  return incident ? { props: { incident } } : { notFound: true };
}
