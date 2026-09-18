import { useEffect, useState } from 'react';
import Link from 'next/link';
import ReaderLayout from '../../components/reader/ReaderLayout';
import { SCENARIO_SEEDS } from '../../lib/scenarioBank.mjs';
import styles from '../../styles/Reader.module.css';
function ScenarioExercise({ scenario }) {
  const [answer, setAnswer] = useState('');
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  const key = `interviewiq.publicScenario.${scenario.id}.v1`;
  useEffect(() => {
    try { setAnswer((localStorage.getItem(key) || '').slice(0, 6000)); }
    catch { setNotice('Saved practice could not be loaded. You can still write and review an answer.'); }
    setReady(true);
  }, [key]);
  function edit(value) {
    setAnswer(value);
    try { localStorage.setItem(key, value); setNotice('Draft saved in this browser.'); }
    catch { setNotice('Draft is not saved: browser storage is unavailable. Copy it before leaving.'); }
  }
  return <section id="practice" style={{ scrollMarginTop: 20 }}><h2>Practice the existing scenario</h2><p>Write your diagnosis, the evidence you need, and a repair with a validation plan. This reuses the Scenario Bank prompt and rubric; there is no automated correctness score.</p><label>Your scenario response<textarea rows={8} maxLength={6000} disabled={!ready} value={answer} onChange={event => edit(event.target.value)} /></label><p role="status">{notice}</p><details><summary>Compare with the existing answer outline and rubric</summary><h3>Answer outline</h3><ul>{scenario.answerOutline.map(item => <li key={item}>{item}</li>)}</ul><p>{scenario.deepDive}</p><h3>Self-review rubric</h3><ul>{scenario.rubric.map(item => <li key={item}>{item}</li>)}</ul><h3>Traps</h3><ul>{scenario.traps.map(item => <li key={item}>{item}</li>)}</ul></details><h3>Follow-up exercises</h3><ol>{scenario.followUps.map(item => <li key={item}>{item}</li>)}</ol></section>;
}
export default function PublicScenario({ scenario }) {
  return <ReaderLayout title={scenario.title} description={scenario.prompt}><p><Link href="/symptoms">← Find a symptom</Link></p><section className={styles.hero}><p className={styles.eyebrow}>EXISTING SCENARIO BANK · {scenario.difficulty}</p><h1>{scenario.title}</h1><p className={styles.lead}>{scenario.prompt}</p><p>{scenario.interviewerIntent}</p><a href="#practice">Work through the exercise →</a></section><ScenarioExercise key={scenario.id} scenario={scenario} /><p><Link href="/practice?workspace=scenarioBank">Browse the full Scenario Bank workspace</Link></p></ReaderLayout>;
}
export function getStaticPaths() { return { paths: SCENARIO_SEEDS.map(scenario => ({ params: { id: scenario.id } })), fallback: false }; }
export function getStaticProps({ params }) {
  const scenario = SCENARIO_SEEDS.find(item => item.id === params.id);
  return scenario ? { props: { scenario } } : { notFound: true };
}
