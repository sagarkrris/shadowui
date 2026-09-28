import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import ReaderLayout from '../../../components/reader/ReaderLayout';
import { BUILD_CHALLENGES, CHALLENGE_CODE_LIMIT, CHALLENGE_STORAGE_KEY, normalizeChallengeProgress, exerciseSource, referenceSource, challengeReviewQuestion } from '../../../lib/buildChallenges.mjs';
import styles from '../../../styles/Reader.module.css';
import lab from '../../../styles/TinyContainer.module.css';

export default function ChallengePage({ challenge }) { return <Workshop key={challenge.id} c={challenge} />; }
function Workshop({c}) {
  const [code,setCode]=useState(c.starter), [notes,setNotes]=useState(''), [ready,setReady]=useState(false), [configured,setConfigured]=useState(false);
  const [message,setMessage]=useState(''), [result,setResult]=useState(null), [busy,setBusy]=useState(false), [review,setReview]=useState(null), [reviewBusy,setReviewBusy]=useState(false), [evidence,setEvidence]=useState(null);
  const current=useRef(code); const request=useRef(null); const reviewRequest=useRef(null);
  const currentNotes=useRef(notes);
  useEffect(() => {
    try { const saved=normalizeChallengeProgress(JSON.parse(localStorage.getItem(CHALLENGE_STORAGE_KEY)||'{}'))[c.id]; if(saved) {setCode(saved.code);current.current=saved.code;setNotes(saved.notes);currentNotes.current=saved.notes;setEvidence(saved.evidence);} }
    catch {setMessage('Storage unavailable. Download your draft before leaving.');}
    setReady(true);
    const controller=new AbortController();
    fetch('/api/build-challenge',{signal:controller.signal}).then(r=>r.json()).then(data=>setConfigured(data.configured===true)).catch(()=>{});
    return () => {controller.abort();request.current?.abort();reviewRequest.current?.abort();};
  },[c.id]);
  function save(nextCode=code,nextNotes=notes,nextEvidence=evidence) {
    try {
      const prior=normalizeChallengeProgress(JSON.parse(localStorage.getItem(CHALLENGE_STORAGE_KEY)||'{}'));
      prior[c.id]={version:c.version,code:nextCode,notes:nextNotes,evidence:nextEvidence,testedSource:nextEvidence?nextCode:null};
      localStorage.setItem(CHALLENGE_STORAGE_KEY,JSON.stringify(prior)); setMessage('Draft and progress saved in this browser.');
    } catch {setMessage('Could not save. Download your draft before leaving.');}
  }
  function edit(value) {current.current=value;setCode(value);setEvidence(null);setResult(null);setReview(null); request.current?.abort();reviewRequest.current?.abort();setBusy(false);setReviewBusy(false);}
  function download(source) {
    const url=URL.createObjectURL(new Blob([exerciseSource(c,source)],{type:'text/plain'})); const a=document.createElement('a');a.href=url;a.download='Main.java';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function run(mode) {
    const submitted=code;const controller=new AbortController();request.current=controller;setBusy(true);setResult(null);setEvidence(null);save(submitted,notes,null);
    const timer=setTimeout(()=>controller.abort(),35000);
    try {
      const response=await fetch('/api/build-challenge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:c.id,code:submitted,mode}),signal:controller.signal});const data=await response.json();
      if(controller.signal.aborted || current.current!==submitted) return;
      if(!response.ok) throw new Error(data.error||'Execution unavailable');
      setResult(data);
      if(data.passed===true && mode==='all') {setEvidence('runner');save(submitted,currentNotes.current,'runner');}
    } catch(error) {if(current.current===submitted && request.current===controller) setMessage(error.name==='AbortError'?'Run cancelled or timed out. No passing result recorded.':error.message);}
    finally {clearTimeout(timer);if(request.current===controller)setBusy(false);}
  }
  async function aiReview() {
    const submitted=code;const controller=new AbortController();reviewRequest.current=controller;setReviewBusy(true);setReview(null);
    const timer=setTimeout(()=>controller.abort(),60000);
    try {
      const response=await fetch('/api/evaluate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:challengeReviewQuestion(c),answer:submitted,round:'technical',feedbackDepth:'detailed'}),signal:controller.signal});const data=await response.json();
      if(controller.signal.aborted||current.current!==submitted)return;
      if(!response.ok) throw new Error(data.error||'AI review unavailable');
      setReview(data.evaluation);
    } catch(error) {if(reviewRequest.current===controller && current.current===submitted)setMessage(error.name==='AbortError'?'AI review timed out; your draft is safe.':error.message);}
    finally {clearTimeout(timer);if(reviewRequest.current===controller)setReviewBusy(false);}
  }
  return <ReaderLayout title={c.title} description={c.contract}>
    <p><Link href="/build#challenge-catalog">← All practice challenges</Link></p><p className={styles.eyebrow}>{c.track} · {c.difficulty} · JAVA 17</p><h1>{c.title}</h1>
    <p><Link href={`/tech-blogs/${c.lesson}`}>Learn the concept first →</Link></p><h2>The contract</h2><p>{c.contract}</p>
    <p>Use the supplied Solution class. Implement its contract without changing the test harness. These visible checks are learning feedback, not a certification of production safety.</p>
    <h2>Examples and test cases</h2>{c.cases.map(t=><details key={t.name} open={!t.failure}><summary>{t.failure?'Failure scenario: ':'Example: '}{t.name}</summary><pre className={lab.code}>{t.code}</pre><p>Expected: every check completes without an exception.</p></details>)}
    <label htmlFor="challenge-code">Java implementation</label><textarea id="challenge-code" className={lab.editor} rows={20} value={code} disabled={!ready} maxLength={CHALLENGE_CODE_LIMIT} spellCheck={false} onChange={e=>edit(e.target.value)} />
    <div className={styles.actions}><button disabled={!ready} onClick={()=>save()}>Save draft</button><button disabled={!ready} onClick={()=>download(code)}>Download code and tests</button><button disabled={!configured||busy||!ready} onClick={()=>run('basic')}>Run examples</button><button disabled={!configured||busy||!ready} onClick={()=>run('all')}>Run all failure checks</button>{busy&&<button onClick={()=>request.current?.abort()}>Cancel run</button>}</div>
    {!configured&&<p>Live tests are not configured yet. Download Main.java and run locally:</p>}<pre className={lab.code}>javac --release 17 Main.java{'\n'}java Main</pre>
    <p role="status">{busy?'Running isolated checks…':message}</p>
    {result&&<section aria-label="Test result"><h2>{result.passed?'Checks passed':'Checks failed'}</h2><p>{result.message} Suite: {result.mode}.</p><pre className={lab.code}>{result.output}</pre></section>}
    <p>Progress: {evidence==='runner'?'All runner checks passed for this draft':evidence==='local'?'Local checks passed (self-reported)':'Not verified'}. Editing invalidates previous results.</p>
    <label><input type="checkbox" checked={evidence==='local'} disabled={!ready} onChange={e=>{const value=e.target.checked?'local':null;setEvidence(value);save(code,notes,value);}} /> I ran all downloaded checks locally and they passed (self-reported)</label>
    <h2>Progressive hints</h2>{c.hints.map((hint,i)=><details key={hint}><summary>Hint {i+1}</summary><p>{hint}</p></details>)}
    <details className={lab.solution}><summary>Reference implementation and trade-offs</summary><pre className={lab.code}>{referenceSource(c)}</pre><p>{c.explanation}</p><button onClick={()=>download(referenceSource(c))}>Download reference and tests</button></details>
    <section><h2>Explain the design</h2><p>{c.followUp}</p><label>Your reasoning<textarea rows={5} maxLength={4000} value={notes} onChange={e=>{currentNotes.current=e.target.value;setNotes(e.target.value);}} /></label><button onClick={()=>save()}>Save reasoning</button><p><Link href="/?workspace=canvas">Explore the architecture in System Canvas →</Link></p><p>Discuss the invariant, one failure, the complexity, and what infrastructure a production implementation needs.</p></section>
    <section><h2>Optional AI review</h2><p>Sends your current code to the configured AI service. Feedback may be wrong and never marks tests as passed. Sign-in and AI configuration may be required.</p><button disabled={reviewBusy||!ready} onClick={aiReview}>{reviewBusy?'Reviewing…':'Review my implementation'}</button>{review&&<div><h3>Strengths</h3><ul>{review.strengths?.map((s,i)=><li key={i}>{s}</li>)}</ul><h3>Suggested improvements</h3><ul>{[...(review.gaps||[]),...(review.recommendations||[])].map((s,i)=><li key={i}>{s}</li>)}</ul><p>{review.followUp}</p></div>}</section>
  </ReaderLayout>;
}
export function getStaticPaths() { return {paths:BUILD_CHALLENGES.map(c=>({params:{slug:c.id}})),fallback:false}; }
export function getStaticProps({params}) { const challenge=BUILD_CHALLENGES.find(c=>c.id===params.slug);return challenge?{props:{challenge}}:{notFound:true}; }
