import Link from 'next/link';
import { useRouter } from 'next/router';
import useLabSession from '../../hooks/useLabSession';
import usePracticeGaps from '../../hooks/usePracticeGaps';
import LabSessionControls from '../../components/learning/LabSessionControls';
import PracticeRecommendations from '../../components/learning/PracticeRecommendations';
import { SQL_SESSION_KEY, normalizeSqlSession } from '../../lib/labSessions.mjs';
import { useEffect, useRef, useState } from 'react';
import ReaderLayout from '../../components/reader/ReaderLayout';
import useHubProgress from '../../components/learning/useHubProgress';
import ui from '../../styles/SqlVisualLab.module.css';
import GuidedLesson from '../../components/learning/GuidedLesson';
import { SQL_LESSONS, SQL_SCHEMA, sqlLevel } from '../../lib/sqlLab.mjs';
import styles from '../../styles/Reader.module.css';
import lab from '../../styles/EngineeringLabs.module.css';

function ResultTable({ result, label }) {
  if (!result) return null;
  return <div className={lab.scroll}><table><caption>{label} · {result.rows.length} rows</caption><thead><tr>{result.columns.map((column, i) => <th key={i} scope="col">{column}</th>)}</tr></thead><tbody>{result.rows.map((row, i) => <tr key={i}>{row.map((value, j) => <td key={j}>{value === null ? 'NULL' : String(value)}</td>)}</tr>)}</tbody></table>{!result.rows.length && <p>No rows matched.</p>}</div>;
}
export default function SqlLab() {
  const router=useRouter(); const session=useLabSession(SQL_SESSION_KEY,normalizeSqlSession); const {gaps,record,message:gapMessage}=usePracticeGaps();
  const selectionReady=session.ready&&router.isReady&&(!SQL_LESSONS.some(l=>l.id===router.query.lesson)||session.value.selectedId===router.query.lesson);
  const selected=Math.max(0,SQL_LESSONS.findIndex(l=>l.id===session.value.selectedId)); const lesson=SQL_LESSONS[selected];
  const sql=session.value.drafts[lesson.id] ?? lesson.query; const [result, setResult] = useState(null); const [step, setStep] = useState(0); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const request = useRef(null);
  const { progress, ready, toggle } = useHubProgress();
  const [search, setSearch] = useState(''); const overview=session.value.overview; const setOverview=value=>session.update(current=>({...current,overview:value})); const [playing, setPlaying] = useState(false);
  const completed = SQL_LESSONS.filter(item => progress.completed.includes(`sql-lab-${item.id}`)).length;
  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const levelFor = index => sqlLevel(SQL_LESSONS[index]);
  const filtered = SQL_LESSONS.map((item, index) => ({...item, index, level:levelFor(index)})).filter(item => `${item.title} ${item.level}`.toLowerCase().includes(search.trim().toLowerCase()));
  useEffect(() => {
    if (!playing || !result?.steps.length) return;
    if (step >= result.steps.length - 1) { setPlaying(false); return; }
    const timer = setTimeout(() => setStep(step + 1), 1200);
    return () => clearTimeout(timer);
  }, [playing, result, step]);
  useEffect(() => () => request.current?.abort(), []);
  const updateSession=session.update;
  useEffect(()=>{if(session.ready && router.isReady && SQL_LESSONS.some(l=>l.id===router.query.lesson))updateSession(current=>({...current,selectedId:router.query.lesson,overview:false}));},[session.ready,router.isReady,router.query.lesson,updateSession]);
  useEffect(()=>{request.current?.abort();setBusy(false);setResult(null);setPlaying(false);setStep(0);},[sql,lesson.id]);
  function clearRun(){setPlaying(false);request.current?.abort();setBusy(false);setResult(null);setStep(0);setMessage('');}
  function edit(value) {clearRun();session.update(current=>({...current,drafts:{...current.drafts,[lesson.id]:value}}));}
  function choose(index) {clearRun();session.update(current=>({...current,selectedId:SQL_LESSONS[index].id,overview:false}));router.replace({pathname:'/labs/sql',query:{lesson:SQL_LESSONS[index].id}},undefined,{shallow:true,scroll:false});}

  async function run(check = false) {
    if(!selectionReady)return;
    setPlaying(false); request.current?.abort(); const controller = new AbortController(); request.current = controller; setBusy(true); setResult(null); setMessage('Running on a fresh practice database…');
    try {
      const response = await fetch('/api/sql-lab', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sql, lessonId: lesson.id, check }), signal: controller.signal });
      const data = await response.json(); if (controller.signal.aborted) return;
      if (!response.ok) throw new Error(data.error || 'SQL execution unavailable.');
      setResult(data); setStep(0); if(check)record(data.feedback||{id:`sql-${lesson.id}`,title:lesson.title,detail:'',drill:lesson.challenge,href:`/labs/sql?lesson=${lesson.id}`},data.passed); setMessage(check ? `${data.passed ? 'Challenge passed' : 'Challenge not yet passed'} on ${data.checks} datasets. Column names, values and row order must match the contract.` : data.steps.length ? 'Query completed. Explore its logical steps below.' : 'Query completed. Custom SQL shows results only; load the lesson example for a logical trace.');
    } catch (error) { if (!controller.signal.aborted) setMessage(error.message); }
    finally { if (request.current === controller) setBusy(false); }
  }
  return <ReaderLayout title="SQL Visual Lab" description="Run SQLite queries, inspect logical steps and practise joins, grouping and window functions.">
    <p><Link href="/labs">← All labs</Link> · <Link href="/prepare">Preparation journey</Link></p>
    <div className={ui.layout}>
      <aside className={ui.sidebar} aria-label="SQL curriculum">
        <h2>Your SQL course</h2><p>{ready ? `${completed} / ${SQL_LESSONS.length} lessons complete` : 'Loading progress…'}</p>
        <progress aria-label="SQL course progress" value={completed} max={SQL_LESSONS.length} />
        <label htmlFor="sql-search">Search lessons</label><input id="sql-search" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Try join or ranking" />
        <button className={ui.lessonButton} disabled={!selectionReady} aria-pressed={overview} onClick={() => { setOverview(true); setPlaying(false); }}>Course overview</button>
        <nav className={ui.lessonList} aria-label="SQL lessons">{levels.map(level => filtered.some(item => item.level === level) && <div key={level}><h3 className={ui.group}>{level}</h3>{filtered.filter(item => item.level === level).map(item => <button className={ui.lessonButton} key={item.id} disabled={!selectionReady} aria-pressed={!overview && item.index === selected} onClick={() => choose(item.index)}><span className={ui.number}>{progress.completed.includes(`sql-lab-${item.id}`) ? '✓' : String(item.index + 1).padStart(2, '0')}</span><span>{item.title}</span></button>)}</div>)}</nav>
        {!filtered.length && <p>No lessons match. Try another search.</p>}
        <p className={ui.shortcut}>Self-assessed progress is saved in this browser.</p>
      </aside>
      <div className={ui.main}>
        <LabSessionControls session={{...session,useSaved:()=>{clearRun();session.useSaved();router.replace({pathname:'/labs/sql',query:{lesson:session.getValue().selectedId}},undefined,{shallow:true,scroll:false});}}} name="sql" /><p aria-live="polite">{gapMessage}</p>
        <header className={ui.header}><div><p className={styles.eyebrow}>LEARN SQL THROUGH ITS RESULTS</p><h1>SQL Visual Lab</h1><p>Predict the rows. Run the query. Explain the result.</p></div><span className={ui.badge}>SQLite · Read-only practice</span></header>
        <div className={ui.metrics}><span><strong>{SQL_LESSONS.length}</strong> guided lessons</span><span><strong>3</strong> learning levels</span><span><strong>{SQL_LESSONS.length}</strong> checked challenges</span><span><strong>1</strong> practice database</span></div>
        {overview ? <section aria-label="Course overview"><h2>A clear path from rows to rankings</h2><p>Start with filters, combine related tables, aggregate groups and finally rank rows without losing detail. Each lesson pairs a runnable example with a challenge, a spoken interview answer and an explained follow-up.</p><div className={ui.cardGrid}>{SQL_LESSONS.map((item, index) => <article key={item.id} className={ui.card}><p className={styles.eyebrow}>{levelFor(index)} · Lesson {index + 1}</p><h3>{item.title}</h3><p>{item.beginner}</p><button onClick={() => choose(index)}>Open lesson {index + 1}</button></article>)}</div><p>Mark a lesson complete after its exercise and self-check. Completion is your own assessment; challenge checks are reported separately.</p></section> : <>
          <section className={ui.workspace} aria-label="SQL workspace">
            <div className={ui.bar}><h2>{String(selected + 1).padStart(2, '0')} · {lesson.title}</h2><button disabled={!ready||!selectionReady} aria-pressed={progress.completed.includes(`sql-lab-${lesson.id}`)} onClick={() => toggle('completed', `sql-lab-${lesson.id}`)}>{progress.completed.includes(`sql-lab-${lesson.id}`) ? 'Lesson complete ✓' : 'Mark lesson complete'}</button></div>
            <div className={ui.editorGrid}><div className={ui.editorPane}>
              <label htmlFor="sql-editor">SQL editor</label><textarea id="sql-editor" className={lab.editor} disabled={!selectionReady} maxLength={4000} value={sql} spellCheck={false} onChange={e => edit(e.target.value)} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (!busy) run(false); } }} />
              <div className={styles.actions}><button onClick={() => run(false)} disabled={busy||!selectionReady}>Run query</button><button onClick={() => edit(lesson.query)}>Reset example</button></div><p className={ui.shortcut}>Ctrl / ⌘ + Enter to run · Fresh data on each run</p>
            </div><section className={ui.resultPane} aria-label="Query output"><h3>Result</h3>{result ? <ResultTable result={result.result} label="Query result" /> : <div className={ui.empty}><p>Your query results will appear here.</p><p>Predict the output, then select Run query.</p></div>}</section></div>
            <p className={ui.status} role="status">{message}</p><PracticeRecommendations gaps={result?.feedback ? [result.feedback] : []} />
            {result?.steps.length > 0 && <section className={ui.execution} aria-label="Logical execution steps"><h3>Follow the rows</h3><p>These are logical teaching stages, rather than the database’s physical query plan.</p><nav className={ui.steps} aria-label="Query steps">{result.steps.map((item, i) => <button key={i} aria-pressed={i === step} onClick={() => {setPlaying(false);setStep(i);}}>{i + 1}. {item.title}</button>)}</nav><p>{result.steps[step].explanation}</p><ResultTable result={result.steps[step]} label={`Step ${step + 1}`} /><div className={ui.controls}><button disabled={step === 0} onClick={() => {setPlaying(false);setStep(step - 1);}}>Previous step</button><button aria-pressed={playing} onClick={() => {if (!playing && step === result.steps.length - 1) setStep(0);setPlaying(!playing);}}>{playing ? 'Pause steps' : 'Play steps'}</button><button disabled={step === result.steps.length - 1} onClick={() => {setPlaying(false);setStep(step + 1);}}>Next step</button><span>Step {step + 1} / {result.steps.length}</span></div></section>}
            <section className={ui.challenge} aria-label="Lesson challenge"><h3>Put it into practice</h3><p>{lesson.challenge}</p><div className={styles.actions}><button onClick={() => edit('SELECT name FROM engineers;')}>Start challenge</button><button disabled={busy||!selectionReady} onClick={() => run(true)}>Check challenge</button></div><p className={ui.shortcut}>Checked on two datasets. Completion remains self-assessed.</p></section>
          </section>
          <PracticeRecommendations gaps={gaps.filter(g=>g.id.startsWith('sql-') && g.id!==result?.feedback?.id)} />
          <details><summary>Practice database and execution limits</summary><p>Read-only SQLite on a fresh in-memory database per run. At most 100 rows and two seconds per query batch. SQL is sent to this app’s server; use only the supplied fictional data. Custom queries return results; load the lesson example to see logical steps.</p><pre className={lab.snapshot}>{SQL_SCHEMA}</pre></details>
          <GuidedLesson key={lesson.id} id={`sql-lab-${lesson.id}`} lesson={lesson} source={lesson.source || "https://www.sqlite.org/lang_select.html"} />
        </>}
      </div>
    </div>
  </ReaderLayout>;
}
