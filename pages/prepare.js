import Link from 'next/link';
import usePracticeGaps from '../hooks/usePracticeGaps';
import PracticeRecommendations from '../components/learning/PracticeRecommendations';
import ReaderLayout from '../components/reader/ReaderLayout';
import useHubProgress from '../components/learning/useHubProgress';
import { journeyNext, PREPARATION_PHASES } from '../lib/preparationJourney.mjs';
import styles from '../styles/Reader.module.css';
import lab from '../styles/EngineeringLabs.module.css';
export default function Prepare() {
  const {gaps,message:gapMessage}=usePracticeGaps();
  const {progress,ready,message,toggle}=useHubProgress();const next=gaps[0]?{...gaps[0],phase:'Targeted practice from your checks'}:journeyNext(progress);const total=PREPARATION_PHASES.flatMap(p=>p.items);const count=total.filter(([id])=>progress.completed.includes(id)).length;
  return <ReaderLayout title="Your preparation journey" description="Five connected phases from engineering fundamentals to final interview preparation."><p className={styles.eyebrow}>FOUNDATIONS → CODING → DESIGN → REHEARSAL → INTERVIEW DAY</p><h1>A clear next step for your preparation.</h1><p className={styles.lead}>Use the tools as one learning journey. Revisit a weak area before moving on.</p><p>Public lessons, SQL, Git and downloads need no sign-in. Workspace tools may need a prep profile; AI and live Java checks need configured services. Completion is self-assessed and saved in this browser.</p>{ready&&<section className={lab.panel}><h2>Your next step</h2><p>{count}/{total.length} activities complete</p><progress aria-label="Preparation journey progress" value={count} max={total.length}/>{next?<p><Link href={next.href}>{gaps[0]||progress.weak.includes(next.id)?'Review':'Continue'}: {next.title} →</Link><br/>{next.phase}</p>:<p>All activities complete. Revisit a weak area or run another mock.</p>}</section>}
    <p aria-live="polite">{gapMessage}</p><PracticeRecommendations gaps={gaps} />
    <nav className={lab.tabs} aria-label="Preparation phases">{PREPARATION_PHASES.map(p=><Link key={p.id} href={`#${p.id}`}>{p.title}</Link>)}</nav>{PREPARATION_PHASES.map(phase=><section className={`${lab.panel} ${lab.phase}`} id={phase.id} key={phase.id}><h2>{phase.title}</h2><p>{phase.goal}</p>{phase.items.map(([id,title,href])=><div key={id}><h3><Link href={href}>{title} →</Link></h3><label><input type="checkbox" disabled={!ready} checked={progress.completed.includes(id)} onChange={()=>toggle('completed',id)}/>Completed the exercise and explained the result</label><label><input type="checkbox" disabled={!ready} checked={progress.weak.includes(id)} onChange={()=>toggle('weak',id)}/>Revisit this activity</label></div>)}</section>)}<p role="status">{message}</p>
  </ReaderLayout>;
}
