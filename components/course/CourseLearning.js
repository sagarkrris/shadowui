import { useState } from 'react';

const block = { border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: 14, minWidth: 0 };
const copy = { color: '#cbd5e1', fontSize: 13, lineHeight: 1.7, overflowWrap: 'anywhere' };

export function ClassroomSession({ session, theme }) {
  return <section aria-label={`Classroom: ${session.title}`} style={{ ...block, ...copy, display: 'grid', gap: 12 }}>
    <h3 style={{ color: theme.accentText }}>90-minute teaching plan</h3>
    <ol>{session.agenda.map(item => <li key={item.activity}>{item.minutes} min · {item.activity}</li>)}</ol>
    <div><strong>Teacher brief</strong><p>{session.teacherBrief}</p></div>
    <div><strong>Worked example</strong><p>{session.workedExample}</p></div>
    <div><strong>Classroom dialogue</strong>{session.dialogue.map(([role, line], index) => <p key={index}><b>{role}:</b> {line}</p>)}</div>
    <div><strong>Guided exercise · project stage {session.stage}</strong><p>{session.studentActivity}</p><ol>{session.steps.map(step => <li key={step}>{step}</li>)}</ol></div>
    <p><strong>Failure case:</strong> {session.failure}</p>
    <details><summary style={{ cursor: 'pointer', color: theme.accentText }}>Compare with the expected solution</summary><p>{session.solution}</p></details>
    <p><strong>Common misconception:</strong> {session.misconception}</p>
    <p><strong>Class debrief:</strong> {session.debrief}</p>
    <p><strong>Homework:</strong> {session.homework}</p>
  </section>;
}

function InterviewQuestion({ item, theme }) {
  const [attempt, setAttempt] = useState('');
  const [revealed, setRevealed] = useState(false);
  return <article aria-label={item.question} style={{ ...block, ...copy }}>
    <p style={{ color: theme.accentText }}>{item.level} · {item.category}</p>
    <h3>{item.question}</h3>
    <label htmlFor={`attempt-${item.id}`}>Your attempt</label>
    <textarea id={`attempt-${item.id}`} value={attempt} onChange={event => { setAttempt(event.target.value); setRevealed(false); }} rows={4} placeholder="Explain your decision, trade-off, and evidence…" style={{ display: 'block', width: '100%', boxSizing: 'border-box', margin: '8px 0', padding: 10, background: 'rgba(127,127,127,.08)', color: '#e5e7eb', border: '1px solid #64748b', borderRadius: 6 }} />
    <button type="button" className="glass-button" disabled={!attempt.trim()} onClick={() => setRevealed(value => !value)} aria-expanded={revealed} aria-controls={`answer-${item.id}`} style={{ padding: '8px 12px', color: theme.accentText, opacity: attempt.trim() ? 1 : 0.5 }}>{revealed ? 'Hide answer' : 'Reveal answer and follow-up'}</button>
    {revealed && <div id={`answer-${item.id}`}>
      <p><strong>Strong answer:</strong> {item.strongAnswer}</p>
      <p><strong>Interviewer follow-up:</strong> {item.followUp}</p>
      <p><strong>Explained follow-up:</strong> {item.followUpAnswer}</p>
      <strong>Self-assessment rubric</strong><ul>{item.rubric.map(criterion => <li key={criterion}>{criterion}</li>)}</ul>
    </div>}
  </article>;
}

export function InterviewStudio({ questions, theme }) {
  const [level, setLevel] = useState('All');
  return <section aria-label="Interview studio" className="glass-card" style={{ ...block, ...copy }}>
    <h2>Interview studio</h2>
    <p>Attempt a question before revealing the answer. Compare your reasoning with the rubric. Attempts stay in this view only and reset when you leave or change level; nothing is sent to an AI service.</p>
    <label htmlFor="interview-level">Experience level </label>
    <select id="interview-level" value={level} onChange={event => setLevel(event.target.value)} style={{ background: 'rgba(127,127,127,.08)', color: '#e5e7eb', padding: 8, marginBottom: 12 }}>
      {['All', 'Beginner', 'Intermediate', 'Senior'].map(value => <option key={value}>{value}</option>)}
    </select>
    <div key={level} style={{ display: 'grid', gap: 12 }}>{questions.filter(item => level === 'All' || item.level === level).map(item => <InterviewQuestion key={item.id} item={item} theme={theme} />)}</div>
  </section>;
}

export function CourseProject({ sessions, references, theme }) {
  return <section aria-label="Progressive project" className="glass-card" style={{ ...block, ...copy }}>
    <h2>Build one project: InterviewIQ study assistant</h2>
    <p>Prerequisites: basic JavaScript, JSON, terminal use, and Node.js 20 or later. Budget six teaching sessions plus homework. Start here, complete modules in order, then use the optional stack tracks to port the contract.</p>
    <a href="/course/interviewiq-lab.mjs" download style={{ color: theme.accentText }}>Download the complete lab (one JavaScript file)</a>
    <p>Save the file as interviewiq-lab.mjs in an empty folder. No install, account, or API key is needed. The source includes a fictional learner profile and Java/SQL notes, plus a private adversarial note owned by another tenant.</p>
    <pre style={{ overflowX: 'auto', padding: 12, background: 'rgba(127,127,127,.08)' }}><code>{'node --version\nnode interviewiq-lab.mjs 1\nnode interviewiq-lab.mjs 6'}</code></pre>
    <p>This runnable reference uses fake model responses and lexical retrieval. It demonstrates the complete local retrieve–draft–validate–approve–save flow. It does not call an LLM, compute semantic embeddings, persist data, or establish production security. Each stage exposes the next component; edit the same file as you work through the exercises.</p>
    <ol>{sessions.map(session => <li key={session.id}><a href={`#module-${session.id}`} style={{ color: theme.accentText }}>Stage {session.stage}: {session.title}</a> — {session.failure}</li>)}</ol>
    <p><strong>Final expected result:</strong> stage 6 reports 5/5 deterministic checks, a saved plan citing java-1, then a duplicate replay with savedCount: 1. With --unknown it abstains and saves nothing. Failure exercises exit with a readable error.</p>
    <p><strong>Optional live extension:</strong> replace generatePlan behind the same contract with a server-side provider adapter; keep credentials out of browser code, add timeouts and bounded retries, record actual usage, and run held-out quality and injection evaluations. The deterministic suite alone cannot assess model behavior.</p>
    <h3>Architecture readings</h3><ul>{references.map(ref => <li key={ref.url}><a href={ref.url} target="_blank" rel="noreferrer" style={{ color: theme.accentText }}>{ref.title}</a></li>)}</ul>
  </section>;
}
