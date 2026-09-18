import LessonVisual from './LessonVisual';
import { useEffect, useState } from 'react';
import { ADVANCED_WORKSHOPS, ADVANCED_READINGS, INTERVIEW_SCENARIOS, remainingInterviewSeconds, interviewSelfAssessment } from '../../lib/aiAdvancedCourse.mjs';

const card = { border: '1px solid rgba(127,127,127,.25)', borderRadius: 8, padding: 16, minWidth: 0, color: '#cbd5e1', fontSize: 13, lineHeight: 1.7, overflowWrap: 'anywhere' };
const field = { background: 'rgba(127,127,127,.08)', color: 'inherit', border: '1px solid #64748b', borderRadius: 6, padding: 10, maxWidth: '100%', boxSizing: 'border-box' };
const button = { padding: '8px 12px', margin: '6px 8px 6px 0' };

export function AdvancedWorkshops({ theme }) {
  const [selected, setSelected] = useState(ADVANCED_WORKSHOPS[0].id);
  const workshop = ADVANCED_WORKSHOPS.find(item => item.id === selected);
  return <section id="advanced-workshops" aria-label="Advanced AI engineering workshops" className="glass-card" style={card}>
    <h2 style={{ color: theme.accentText }}>Go deeper: advanced AI engineering</h2>
    <p>Six advanced workshops after the six core modules. Each is a suggested two-hour study block: 30 minutes of concepts, 20 of worked examples, 40 of exercises, and 30 of review. Homework is additional. These design and coding exercises extend the core project; they are not deployed integrations.</p>
    <label htmlFor="advanced-workshop">Choose a workshop </label>
    <select id="advanced-workshop" value={selected} onChange={event => setSelected(event.target.value)} style={{ ...field, width: '100%' }}>
      {ADVANCED_WORKSHOPS.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
    </select>
    <article key={workshop.id} aria-label={workshop.title}>
      <h3>{workshop.title}</h3><p>{workshop.level}</p>
      <p><strong>Prerequisites:</strong> {workshop.prerequisite}</p>
      <p><strong>Learning objective:</strong> {workshop.objective}</p>
      <LessonVisual lessonId={workshop.id} />
      {workshop.concepts.map(concept => <div key={concept.title}><h4>{concept.title}</h4><p>{concept.text}</p></div>)}
      <h4>Worked example</h4><p>{workshop.workedExample}</p>
      {workshop.dialogue.map(([role, line]) => <p key={role}><strong>{role}:</strong> {line}</p>)}
      <h4>Guided exercise</h4><p>{workshop.exercise}</p>
      <pre style={{ ...field, overflowX: 'auto' }}><code>{workshop.starter}</code></pre>
      <details><summary style={{ cursor: 'pointer', color: theme.accentText }}>Reveal workshop solution and acceptance checks</summary><p>{workshop.solution}</p><ul>{workshop.acceptance.map(item => <li key={item}>{item}</li>)}</ul></details>
      <p><strong>Misconception to avoid:</strong> {workshop.misconception}</p>
      <p><strong>Homework:</strong> {workshop.homework}</p>
    </article>
    <details><summary>Further reading · reviewed September 18, 2026</summary><ul>{ADVANCED_READINGS.map(item => <li key={item.url}><a href={item.url} target="_blank" rel="noreferrer" style={{ color: theme.accentText }}>{item.title}</a><p>{item.note}</p></li>)}</ul></details>
  </section>;
}

function InterviewRound({ scenario, theme }) {
  const [phase, setPhase] = useState('ready');
  const [duration, setDuration] = useState(scenario.minutes * 60);
  const [seconds, setSeconds] = useState(scenario.minutes * 60);
  const [deadline, setDeadline] = useState(null);
  const [attempt, setAttempt] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [checked, setChecked] = useState([]);
  const [revision, setRevision] = useState('');
  const [round, setRound] = useState(1);
  const assessment = interviewSelfAssessment(scenario.rubric, checked);

  useEffect(() => {
    if (deadline === null) return undefined;
    const tick = () => {
      const left = remainingInterviewSeconds(deadline, Date.now());
      setSeconds(left);
      if (left === 0) setDeadline(null);
    };
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [deadline]);

  const stopClock = () => {
    if (deadline !== null) setSeconds(remainingInterviewSeconds(deadline, Date.now()));
    setDeadline(null);
  };
  const start = () => {
    setPhase('answer');
    setSeconds(duration);
    if (duration > 0) setDeadline(Date.now() + duration * 1000);
  };
  const restart = () => {
    setPhase('ready'); setDeadline(null); setSeconds(duration);
    setAttempt(''); setFollowUp(''); setChecked([]); setRevision('');
    setRound(value => value + 1);
  };
  const downloadReview = () => {
    const text = [
      `# ${scenario.title}`, `Round ${round} · self-assessed, not AI graded`,
      '## Main question', scenario.prompt, '## My attempt', attempt,
      '## Follow-up', scenario.followUp, '## My follow-up', followUp,
      '## Reference answer', scenario.conciseAnswer, ...scenario.reasoning,
      '## Reference follow-up', scenario.followUpAnswer,
      `## Self-assessment: ${assessment.covered}/${assessment.total} criteria marked`,
      ...scenario.rubric.map((item, index) => `- [${checked.includes(index) ? 'x' : ' '}] ${item}`),
      '## My improved answer', revision,
    ].join('\n\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${scenario.id}-interview-review.md`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <article aria-label="Current interview round" style={{ marginTop: 16 }}>
    <p style={{ color: theme.accentText }}>{scenario.level} · Round {round}</p>
    <h3>{scenario.title}</h3>
    {phase === 'ready' ? <>
      <p>Set a total time budget for the main question and follow-up. Start to see the scenario. Answers remain hidden until you submit both attempts.</p>
      <label htmlFor="round-duration">Time budget </label>
      <select id="round-duration" value={duration} onChange={event => { const value = Number(event.target.value); setDuration(value); setSeconds(value); }} style={field}>
        <option value={300}>5 minutes</option><option value={600}>10 minutes</option><option value={0}>Untimed</option>
      </select>
      <button type="button" className="glass-button" style={button} onClick={start}>Start interview</button>
    </> : <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <span role="timer" aria-label="Time remaining">{duration === 0 ? 'Untimed round' : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} remaining`}</span>
        {duration > 0 && seconds > 0 && phase !== 'review' && <button type="button" className="glass-button" style={button} onClick={() => deadline === null ? setDeadline(Date.now() + seconds * 1000) : stopClock()}>{deadline === null ? 'Resume timer' : 'Pause timer'}</button>}
        {phase === 'review' && <span>Round complete</span>}
      </div>
      {duration > 0 && seconds === 0 && phase !== 'review' && <p role="status">Time is up. Finish your attempt at your own pace; answers are still hidden.</p>}
      <h4>Main question</h4><p>{scenario.prompt}</p>
      <details><summary>Practice hint: useful clarifying questions</summary><ul>{scenario.clarifications.map(item => <li key={item}>{item}</li>)}</ul></details>
      <label htmlFor="mock-attempt">Your main answer</label>
      <textarea id="mock-attempt" value={attempt} readOnly={phase !== 'answer'} onChange={event => setAttempt(event.target.value)} rows={6} style={{ ...field, display: 'block', width: '100%' }} />
      {phase === 'answer' && <button type="button" className="glass-button" style={button} disabled={!attempt.trim()} onClick={() => setPhase('followup')}>Submit answer and get follow-up</button>}
      {(phase === 'followup' || phase === 'review') && <>
        <h4>Interviewer follow-up · changed constraint</h4><p>{scenario.followUp}</p>
        <label htmlFor="mock-followup">Your follow-up answer</label>
        <textarea id="mock-followup" value={followUp} readOnly={phase === 'review'} onChange={event => setFollowUp(event.target.value)} rows={5} style={{ ...field, display: 'block', width: '100%' }} />
        {phase === 'followup' && <button type="button" className="glass-button" style={button} disabled={!followUp.trim()} onClick={() => { stopClock(); setPhase('review'); }}>Finish round and review answers</button>}
      </>}
      {phase === 'review' && <section aria-label="Interview answer review">
        <h4>Strong reference answer · 60–90 second structure</h4><p>{scenario.conciseAnswer}</p>
        <h4>Expand your reasoning</h4><ol>{scenario.reasoning.map(item => <li key={item}>{item}</li>)}</ol>
        <h4>Follow-up answer explained</h4><p>{scenario.followUpAnswer}</p>
        <h4>Common weak answers</h4><ul>{scenario.pitfalls.map(item => <li key={item}>{item}</li>)}</ul>
        <fieldset style={card}><legend>Self-assessment · mark only points you demonstrated</legend>
          {scenario.rubric.map((item, index) => <label key={item} style={{ display: 'block', marginBottom: 8 }}><input type="checkbox" checked={checked.includes(index)} onChange={event => setChecked(values => event.target.checked ? [...values, index] : values.filter(value => value !== index))} /> {item}</label>)}
        </fieldset>
        <p role="status">{assessment.covered}/{assessment.total} criteria marked by you. This is not an automated grade or hiring prediction.</p>
        {assessment.revisit.length > 0 && <><strong>Revisit these points</strong><ul>{assessment.revisit.map(item => <li key={item}>{item}</li>)}</ul></>}
        <p>Remediation workshop: {ADVANCED_WORKSHOPS.find(item => item.id === scenario.workshopId).title}. Choose it in <a href="#advanced-workshops" style={{ color: theme.accentText }}>advanced AI engineering</a>.</p>
        <label htmlFor="mock-revision">Rewrite your answer after review</label>
        <textarea id="mock-revision" value={revision} onChange={event => setRevision(event.target.value)} rows={5} style={{ ...field, display: 'block', width: '100%' }} />
        <button type="button" className="glass-button" style={button} onClick={downloadReview}>Download my interview review</button>
        <button type="button" className="glass-button" style={button} onClick={restart}>Try this scenario again</button>
      </section>}
    </>}
  </article>;
}

export function ScenarioInterviews({ theme }) {
  const [selected, setSelected] = useState(INTERVIEW_SCENARIOS[0].id);
  const scenario = INTERVIEW_SCENARIOS.find(item => item.id === selected);
  return <section id="scenario-interviews" aria-label="Timed scenario interviews" className="glass-card" style={card}>
    <h2 style={{ color: theme.accentText }}>Real-world interview simulator</h2>
    <p>Six original scenarios with timed main questions, follow-up constraints, and explained reference answers. This is a local practice simulation, not a live interviewer, AI grading service, or a feed of company interview questions. Strong answers depend on the stated assumptions; there is no universal perfect answer.</p>
    <p>Choosing another scenario resets this round. Drafts stay in memory and disappear when you leave; download your review to keep it. Nothing you type here is sent to an AI service.</p>
    <label htmlFor="interview-scenario">Interview scenario </label>
    <select id="interview-scenario" value={selected} onChange={event => setSelected(event.target.value)} style={{ ...field, width: '100%' }}>
      {INTERVIEW_SCENARIOS.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}
    </select>
    <InterviewRound key={scenario.id} scenario={scenario} theme={theme} />
  </section>;
}
