import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { SITE_URL } from '../../lib/siteUrl.mjs';
import { designHref, exportDesignSolution } from '../../lib/designLibrary.mjs';
import DesignDiagram, { downloadText } from './DesignDiagram';
import useDesignProgress from './useDesignProgress';
import styles from '../../styles/DesignLibrary.module.css';

export default function DesignWorkspace({ problem, nextProblem }) {
  const [solution, setSolution] = useState(true);
  const [section, setSection] = useState('Diagram');
  const { progress, update, ready, storageError } = useDesignProgress();
  const key = `${problem.track}/${problem.slug}`;
  const state = progress[key] || {};
  const tabs = ['Diagram', 'Walkthrough', 'Interfaces & data', ...(problem.java ? ['Java model'] : []), 'Checks'];
  return <div className={styles.workspaceShell} data-reader-scroll>
    <Head><title>{problem.title} · {problem.track.toUpperCase()} solution · InterviewIQ</title><meta name="description" content={problem.summary} /><link rel="canonical" href={`${SITE_URL}${designHref(problem)}`} /></Head>
    <a href="#design-main" className={styles.skip}>Skip to design workspace</a>
    <header className={styles.workspaceHeader}><div><Link href={`/${problem.track}`}>← All {problem.track.toUpperCase()} problems</Link><h1>{problem.title}</h1></div><div className={styles.workspaceActions}><button type="button" aria-pressed={solution} onClick={() => setSolution(value => !value)}>{solution ? 'Close solution' : 'View solution'}</button><button type="button" className={styles.secondary} disabled={!ready} aria-pressed={Boolean(state.done)} onClick={() => update(key, { done: !state.done })}>{state.done ? '✓ Completed' : 'Mark completed'}</button><button type="button" className={styles.secondary} onClick={() => downloadText(exportDesignSolution(problem), `${problem.slug}-solution.md`)}>Download solution</button></div></header>
    <main id="design-main" tabIndex={-1} className={styles.workspace}>
      <aside className={styles.description}><div className={styles.panelLabel}>THE BRIEF</div><div className={styles.panelBody}><div className={styles.badges}><span className={styles[problem.difficulty.toLowerCase()]}>{problem.difficulty}</span><span>{problem.track.toUpperCase()} · {problem.minutes} min</span></div><p className={styles.summary}>{problem.summary}</p><section><h2>Functional requirements</h2><ul>{problem.requirements.map(item => <li key={item}>{item}</li>)}</ul></section>{problem.nonFunctional && <section><h2>Non-functional requirements</h2><ul>{problem.nonFunctional.map(item => <li key={item}>{item}</li>)}</ul></section>}<section><h2>{problem.track === 'hld' ? 'Scale & constraints' : 'Design contract'}</h2><p>{problem.constraint}</p></section><button type="button" className={styles.revisit} disabled={!ready} aria-pressed={Boolean(state.starred)} onClick={() => update(key, { starred: !state.starred })}>{state.starred ? '★ Saved to revisit' : '☆ Save to revisit'}</button><p className={styles.small}>Completion, revisit flags and notes are local to this browser; no account or cloud sync.</p></div></aside>
      <section className={styles.center} aria-label={solution ? 'Reference solution' : 'Your design notes'}>
        <div className={styles.solutionBanner}><span>{solution ? 'REFERENCE SOLUTION · READ ONLY' : 'YOUR PRACTICE · PRIVATE TO THIS BROWSER'}</span><Link href={problem.track === 'hld' ? '/lld' : '/hld'}>Explore {problem.track === 'hld' ? 'LLD' : 'HLD'} →</Link></div>
        {solution ? <><div className={styles.tabs} role="tablist" aria-label="Solution sections">{tabs.map(tab => <button type="button" role="tab" id={`tab-${tab.replace(/\W/g,'')}`} aria-controls="solution-panel" tabIndex={section === tab ? 0 : -1} aria-selected={section === tab} key={tab} onClick={() => setSection(tab)} onKeyDown={event => {
          const index = tabs.indexOf(tab); let next;
          if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
          if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
          if (event.key === 'Home') next = 0;
          if (event.key === 'End') next = tabs.length - 1;
          if (next !== undefined) { event.preventDefault(); setSection(tabs[next]); event.currentTarget.parentElement.children[next].focus(); }
        }}>{tab}</button>)}</div>
          <div role="tabpanel" id="solution-panel" aria-labelledby={`tab-${section.replace(/\W/g,'')}`} tabIndex={0} className={styles.solutionBody}>
            {section === 'Diagram' && <DesignDiagram problem={problem} />}
            {section === 'Walkthrough' && <><p className={styles.eyebrow}>FROM REQUIREMENT TO DECISION</p><h2>A worked design, step by step</h2><ol className={styles.steps}>{problem.steps.map((step,index) => <li key={step}><span>{String(index + 1).padStart(2,'0')}</span><p>{step}</p></li>)}</ol></>}
            {section === 'Interfaces & data' && <><h2>{problem.track === 'hld' ? 'API contracts' : 'Public interfaces'}</h2><pre tabIndex={0} className={styles.code}><code>{problem.api}</code></pre><h2>Data & ownership</h2><p>{problem.data}</p><h2>Responsibilities</h2><dl className={styles.responsibilities}>{problem.nodes.map(([title,detail]) => <div key={title}><dt>{title}</dt><dd>{detail}</dd></div>)}</dl></>}
            {section === 'Java model' && problem.java && <><p className={styles.eyebrow}>JAVA 17 · STANDALONE CORE MODEL</p><h2>{problem.java.name}</h2><p>{problem.java.limits}</p><button type="button" className={styles.inlineButton} onClick={() => downloadText(problem.java.source, `${problem.java.name}.java`)}>Download Java source</button><pre tabIndex={0} className={styles.code}><code>{problem.java.source}</code></pre><p>The published source is compiled with <code>javac --release 17</code> and exercised by repository behavioral tests. These tests do not validate physical hardware, payment providers or distributed infrastructure.</p></>}
            {section === 'Checks' && <><h2>Challenge the design</h2><ul className={styles.checks}>{problem.checks.map(check => <li key={check}>{check}</li>)}</ul><h2>Reference scope</h2><p>{problem.scope}</p>{problem.java && <><h3>Executable core checks</h3><p>The repository runs these checks against the exact Java source shown in this workspace. Helpers assert outcomes and expected exceptions.</p><pre tabIndex={0} className={styles.code}><code>{problem.java.checks}</code></pre></>}<h2>Primary references</h2><ul>{problem.sources.map(([label,url]) => <li key={url}><a href={url} target="_blank" rel="noreferrer">{label} ↗</a></li>)}</ul></>}
          </div></> : <div className={styles.practice}><p className={styles.eyebrow}>EXPLAIN IT IN YOUR OWN WORDS</p><h2>Your design notes</h2><p>State the invariant, trace one command, then explain a failure and its recovery. Compare your answer with the reference when you are ready.</p><label htmlFor="design-notes">Requirements, diagram outline & trade-offs</label><textarea id="design-notes" disabled={!ready} maxLength={20000} value={state.notes || ''} placeholder="My assumptions…\n\nRequest flow…\n\nOwnership and failure handling…" onChange={event => update(key, { notes: event.target.value })} /><p role="status">{!ready ? 'Loading local notes…' : storageError ? 'Storage unavailable: notes are only kept for this session.' : 'Saved automatically in this browser.'} {(state.notes || '').length}/20,000 characters</p><button type="button" disabled={!state.notes} onClick={() => downloadText(state.notes, `${problem.slug}-my-design.txt`)}>Download my notes</button></div>}
      </section>
      <aside className={styles.insights}><div className={styles.panelLabel}>KEY DESIGN DECISIONS</div><div className={styles.panelBody}>{problem.insights.map((insight,index) => <div className={styles.insight} key={insight}><span>0{index+1}</span><p>{insight}</p></div>)}<div className={styles.nextProblem}><p>KEEP PRACTISING</p><Link href={designHref(nextProblem)}>{nextProblem.title} →</Link><Link href={`/${problem.track}`}>Browse the full {problem.track.toUpperCase()} track</Link></div>{storageError && <p role="status">Progress could not be saved. Browser storage may be blocked or full.</p>}</div></aside>
    </main>
  </div>;
}
