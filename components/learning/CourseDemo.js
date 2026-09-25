import { useEffect, useId, useState } from 'react';
import { COURSE_DEMOS, COURSE_DEMO_ASSIGNMENTS } from '../../lib/courseDemos.mjs';
import { routingFrames, hashingFrames, replayFrames, traceFrames } from '../../lib/courseDemoModels.mjs';
import styles from '../../styles/CourseDemo.module.css';

export default function CourseDemo({ courseId }) {
  const ids = COURSE_DEMO_ASSIGNMENTS[courseId];
  if (!ids?.length) return null;
  return <CourseDemoPicker key={courseId} courseId={courseId} ids={ids} />;
}

function CourseDemoPicker({ ids, courseId }) {
  const [selected, setSelected] = useState(ids[0]);
  return <section className={styles.panel} aria-label="Interactive course demo" data-course-demo>
    <h2 id={`course-demo-${courseId}`}>Explore the concept</h2>
    {ids.length > 1 && <label className={styles.field}>Demonstration
      <select value={selected} onChange={event => setSelected(event.target.value)}>
        {ids.map(id => <option key={id} value={id}>{COURSE_DEMOS[id].title}</option>)}
      </select>
    </label>}
    <DemoPlayer key={selected} demo={COURSE_DEMOS[selected]} />
  </section>;
}

function DemoPlayer({ demo }) {
  const titleId = useId();
  const [options, setOptions] = useState({ policy: 'round-robin', capacity: 2, offline: false, membership: 'add', hotKey: false, expired: false, scenario: 0 });
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1800);
  const frames = demo.kind === 'routing' ? routingFrames(options)
    : demo.kind === 'hashing' ? hashingFrames(options)
      : demo.kind === 'replay' ? replayFrames(options) : traceFrames(demo, options.scenario);
  const current = frames[step];
  const last = frames.length - 1;

  useEffect(() => {
    if (!playing || step >= last) return;
    const timer = window.setTimeout(() => {
      setStep(step + 1);
      if (step + 1 === last) setPlaying(false);
    }, speed);
    return () => window.clearTimeout(timer);
  }, [playing, step, last, speed]);

  useEffect(() => {
    const pauseWhenHidden = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, []);

  function update(patch) {
    setPlaying(false);
    setStep(0);
    setOptions(previous => ({ ...previous, ...patch }));
  }
  function move(next) { setPlaying(false); setStep(next); }

  return <div aria-labelledby={titleId} data-reader-transient>
    <h3 id={titleId}>{demo.title}</h3>
    <p className={styles.scope}>{demo.scope}</p>
    <div className={styles.inputs}>
      {demo.kind === 'trace' && <label className={styles.field}>Scenario
        <select value={options.scenario} onChange={e => update({ scenario: Number(e.target.value) })}>
          {demo.scenarios.map((scenario, i) => <option key={scenario.label} value={i}>{scenario.label}</option>)}
        </select>
      </label>}
      {demo.kind === 'routing' && <>
        <label className={styles.field}>Routing policy<select value={options.policy} onChange={e => update({ policy: e.target.value })}>
          <option value="round-robin">Round robin</option><option value="weighted-load">Weighted active load</option>
        </select></label>
        <label className={styles.field}>Server A capacity<select value={options.capacity} onChange={e => update({ capacity: Number(e.target.value) })}>
          {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}× relative capacity</option>)}
        </select></label>
        <label className={styles.check}><input type="checkbox" checked={options.offline} onChange={e => update({ offline: e.target.checked })} />Server C offline</label>
      </>}
      {demo.kind === 'hashing' && <>
        <label className={styles.field}>Membership change<select value={options.membership} onChange={e => update({ membership: e.target.value })}>
          <option value="add">Add server D</option><option value="remove">Remove server B</option>
        </select></label>
        <label className={styles.check}><input type="checkbox" checked={options.hotKey} onChange={e => update({ hotKey: e.target.checked })} />Make key 65 hot</label>
      </>}
      {demo.kind === 'replay' && <label className={styles.field}>History on reconnect<select value={String(options.expired)} onChange={e => update({ expired: e.target.value === 'true' })}>
        <option value="false">Missing event retained</option><option value="true">Replay history expired</option>
      </select></label>}
    </div>
    <div className={styles.controls} role="group" aria-label="Playback controls">
      <button type="button" disabled={step === 0} onClick={() => move(step - 1)}>Back</button>
      <button type="button" aria-pressed={playing} onClick={() => {
        if (playing) setPlaying(false);
        else { if (step === last) setStep(0); setPlaying(true); }
      }}>{playing ? 'Pause' : step === last ? 'Replay' : 'Play'}</button>
      <button type="button" disabled={step === last} onClick={() => move(step + 1)}>Next</button>
      <button type="button" onClick={() => move(0)}>Reset</button>
      <label className={styles.field}>Speed<select value={speed} onChange={e => setSpeed(Number(e.target.value))}>
        <option value={3000}>Slow</option><option value={1800}>Normal</option><option value={800}>Fast</option>
      </select></label>
    </div>
    <p className={styles.hint}>Starts paused. Reset returns to the first step with your selected inputs. Changing inputs starts a new run.</p>
    <progress aria-label="Demo progress" max={frames.length} value={step + 1} />
    <p className={styles.step}>Step {step + 1} of {frames.length}</p>
    <div className={styles.explanation} aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
      <h4>{current.title}</h4><p>{current.explanation}</p>
    </div>
    {demo.id === 'strategy' && <PricingFlow step={step} discounted={options.scenario === 1} />}
    <ol className={styles.stages} aria-label="Demo steps">
      {frames.map((entry, index) => <li key={index}>
        <button type="button" aria-current={index === step ? 'step' : undefined} onClick={() => move(index)}>
          {index + 1}. {entry.title}
        </button>
      </li>)}
    </ol>
    <div className={styles.state} role="group" aria-label="Current model state">
      {current.cells.map(item => <div key={item.label} className={`${styles.cell} ${item.active ? styles.changed : ''}`}>
        <strong>{item.label}</strong><span>{item.value}</span>
        <small>{step === 0 ? 'Initial state' : item.active ? 'Changed this step' : 'Unchanged'}</small>
        {item.active && <small>Before → after: {frames[step - 1].cells.find(previous => previous.label === item.label)?.value ?? 'not present'} → {item.value}</small>}
      </div>)}
    </div>
    <p><strong>Explain it:</strong> {demo.question}</p>
  </div>;
}

function PricingFlow({ step, discounted }) {
  const policy = discounted ? 'TenPercentOff' : 'Standard';
  const calculation = discounted ? '$100 − (10% × $100) = $90' : '$100 − $0 = $100';
  return <figure className={styles.pricing} aria-label="Pricing call flow">
    <figcaption><strong>Follow one $100 order</strong></figcaption>
    <p>Setup: inject {policy} as the PricingPolicy. Checkout uses the same price(subtotal) call in both scenarios.</p>
    <ol className={styles.flow}>
      <li aria-current={step === 0 ? 'step' : undefined}><strong>1. Checkout receives $100</strong><span>The order subtotal is input, not yet a quote.</span></li>
      <li aria-current={step === 1 ? 'step' : undefined}><strong>2. Checkout → {policy}</strong><span>price($100): {calculation}</span></li>
      <li aria-current={step === 2 ? 'step' : undefined}><strong>3. {policy} → Checkout</strong><span>{step === 2 ? `Returned quote: ${discounted ? '$90' : '$100'}` : 'Quote not returned yet.'}</span></li>
    </ol>
    <p><strong>What changes?</strong> The injected pricing rule and the result. <strong>What stays the same?</strong> Checkout and its interface call. Choose the other scenario to compare. This illustration excludes tax, shipping, and currency rounding.</p>
  </figure>;
}
