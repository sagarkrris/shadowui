import { trackEvent } from '../../lib/analytics.mjs';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { LANDING_TRACKS } from '../../lib/landingTracks.mjs';
import home from '../../styles/Home.module.css';

export default function RoleOnboarding({ courses }) {
  const [selected, setSelected] = useState('backend');
  const [step, setStep] = useState(1);
  const dialog = useRef(null);
  const track = LANDING_TRACKS.find(item => item.id === selected);
  return <section className={home.onboarding} aria-label="Choose your target role">
    <h2>Where do you want to go next?</h2><p>Select your target track to preview a starting path.</p>
    <div className={home.roleButtons} role="group" aria-label="Target role">{LANDING_TRACKS.map(item => <button type="button" key={item.id} aria-pressed={selected === item.id} onClick={() => { setSelected(item.id); trackEvent("landing_role_selected", { value: item.id }); }}>{item.label}<small>{item.detail}</small></button>)}</div>
    <div className={home.pathPreview} aria-live="polite" aria-atomic="true"><h3>Recommended starting path for {track.label}</h3><ol>{track.modules.map(([kind, title, href]) => <li key={href}><span>{kind}</span><Link prefetch={false} href={href}>{title}</Link></li>)}</ol></div>
    <div className={home.heroActions}><Link prefetch={false} href={track.modules[0][2]} onClick={() => trackEvent("landing_path_started", { value: track.id })} className={home.primaryCta}>Start this path now →</Link><Link href="/learn">Explore all {courses} courses</Link></div>
    <p className={home.onboardingNote}>Public modules open immediately. No account or AI provider setup required.</p><p><Link href="/java/tutorial/jdk-vs-jre-vs-jvm">New to Java? Start with chapter 1 →</Link></p>
    <div className={home.mockEntry}><span>04 · Ready to explain what you learned?</span><button id="ai-mock-setup" type="button" onClick={() => { setStep(1); dialog.current.showModal(); }}>Set up AI mock drills</button></div>
    <dialog ref={dialog} className={home.setupDialog} aria-labelledby="mock-setup-title"><button type="button" className={home.closeDialog} aria-label="Close mock setup" onClick={() => dialog.current.close()}>×</button><p>Step {step} of 2</p><h2 id="mock-setup-title">{step === 1 ? 'Choose your practice context' : 'Check AI availability'}</h2>{step === 1 ? <><p>Your selected track is {track.label}. In the practice workspace, create or select a prep profile so drills match your experience.</p><button type="button" onClick={() => setStep(2)}>Next: AI setup →</button></> : <><p>AI drills use the provider configured by this site’s operator. Personal API key entry is not supported. If the provider is unavailable, use the self-check below and return when it is enabled.</p><Link href={`/practice?buddy=1&buddyMode=warmup&buddyTopic=${encodeURIComponent(track.topic)}`}>Open mock drill workspace →</Link><button type="button" onClick={() => setStep(1)}>Back</button></>}<details><summary>Practice without AI</summary><p>Explain the article aloud in one minute. Give a concrete example, name a failure boundary, and compare your answer with the article’s guidance. Repeat after changing one assumption.</p></details></dialog>
  </section>;
}
