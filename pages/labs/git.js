import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import usePracticeGaps from '../../hooks/usePracticeGaps';
import PracticeRecommendations from '../../components/learning/PracticeRecommendations';
import useLabSession from '../../hooks/useLabSession';
import {GIT_SESSION_KEY,normalizeGitSession} from '../../lib/labSessions.mjs';
import {GIT_EXERCISES,gitExerciseRepo} from '../../lib/gitExercises.mjs';
import GitCommitGraph from '../../components/learning/GitCommitGraph';
import LabSessionControls from '../../components/learning/LabSessionControls';
import ReaderLayout from '../../components/reader/ReaderLayout';
import GuidedLesson from '../../components/learning/GuidedLesson';
import { abortGitMerge, gitCommand, gitHead, newGitRepo } from '../../lib/gitLab.mjs';
import styles from '../../styles/Reader.module.css';
import lab from '../../styles/EngineeringLabs.module.css';

const lesson = {
  title: 'Snapshots, branches and recovery',
  beginner: 'A commit is a saved snapshot with parent links. A branch is a movable name for a commit. HEAD refers to the current branch. The index is the staging area: committing saves the staged version, not every working edit.',
  mechanism: 'Edit note.txt, stage it, then commit. Branches share earlier commits. Merge preserves ancestry; rebase replays local changes as new commits. This deterministic simulator models one text file as a whole value. It runs no Git commands on your computer.',
  example: 'Create feature, commit a change, switch to main and merge feature: main fast-forwards. To see a conflict, create different changes on both branches, then merge. Resolve the displayed markers, stage the result and commit. Undo a single-parent HEAD with git revert HEAD.',
  deep: 'Real Git performs line-based three-way merging and supports many more states. This model treats any divergent whole-file edits as a conflict, supports linear rebases with equal-line-count nonconflicting edits when both sides changed and single-parent HEAD reverts, and blocks switching with uncommitted work. Reset replaces working and staged changes here. Reflog entries allow local tip recovery, but actual Git retention expires; do not treat it as a backup. Verify a real workflow in a disposable repository and inspect git log --graph and git status.',
  answer: 'I stage the exact changes I intend to commit, because the index can differ from my working tree. I use merge to preserve branch history and rebase to replay private work onto a new base. I avoid rewriting shared history. To undo a published change I usually prefer revert, which adds a new commit. Before destructive reset I preserve work and identify the intended commit; reflog can help recover a previous local tip.',
  followUp: 'Why does rebase change commit IDs? A commit includes its parent relationship. Replaying a change onto a different parent creates a different commit; collaborators using the original history need coordinated recovery if that history was shared.',
  challenge: 'Create feature, commit a changed note, merge it into main, then revert HEAD. Explain why the old commit still appears in the graph.',
};
const commands = ['git status', 'git add note.txt', 'git commit -m "update note"', 'git switch -c feature', 'git switch main', 'git switch feature', 'git merge feature', 'git rebase main', 'git revert HEAD', 'git reset --hard c0', 'git reflog', 'git restore note.txt'];
export default function GitLab() {
  const {gaps,record,message:gapMessage}=usePracticeGaps();
  const session=useLabSession(GIT_SESSION_KEY,normalizeGitSession);const {repo,history,done,exerciseId,exerciseStep,checkpoint}=session.value;
  const [command,setCommand]=useState('git status');const [message,setMessage]=useState('Edit the file, stage it and create your first commit.');
  const lastHead=useRef(null);const [previousHead,setPreviousHead]=useState(null);const head=gitHead(repo).id;
  useEffect(()=>{if(!session.ready)return;if(lastHead.current&&lastHead.current!==head)setPreviousHead(lastHead.current);lastHead.current=head;},[head,session.ready]);
  const exercise=GIT_EXERCISES.find(e=>e.id===exerciseId);const step=exercise?.steps[exerciseStep];
  const repair={id:`git-${exerciseId||'snapshots'}`,title:exercise?.title||'Git snapshots and staging',href:'/labs/git',detail:'',drill:exercise?.goal||'Edit a note, stage it, edit it again and compare the staged and working snapshots before committing.'};
  function run(event){event?.preventDefault();if(!session.ready)return;const result=gitCommand(repo,command);setMessage(result.message);if(result.error)record({...repair,detail:result.message});else if(!exercise||(step?.kind==='command'&&command.trim()===step.value&&exerciseStep===exercise.steps.length-1))record(repair,true);
    session.update(current=>({...current,repo:result.state,history:[`$ ${command}\n${result.message}`,...current.history].slice(0,12),done:result.error?current.done:{...current.done,[command.split(' ')[1]]:true},exerciseStep:!result.error&&step?.kind==='command'&&command.trim()===step.value?exerciseStep+1:exerciseStep}));
  }
  function setRepo(value){session.update(current=>({...current,repo:value}));}
  function loadExercise(id){const original=checkpoint||repo;session.update(current=>({...current,repo:gitExerciseRepo(id),checkpoint:original,exerciseId:id,exerciseStep:0,history:[],done:{}}));setPreviousHead(null);setMessage('Exercise loaded. Your previous repository is saved as a checkpoint.');}
  return <ReaderLayout title="Git Visual Lab" description="Practise staging, branching, merging, rebasing and recovery in a safe one-file simulation.">
    <p><Link href="/labs">← All labs</Link> · <Link href="/prepare">Preparation journey</Link></p><p className={styles.eyebrow}>EDIT · STAGE · COMMIT · RECOVER</p><h1>Git Visual Lab</h1><p className={styles.lead}>Watch the snapshots and branch pointers change.</p>
    <LabSessionControls session={session} name="git" /><p aria-live="polite">{gapMessage}</p><PracticeRecommendations gaps={gaps.filter(g=>g.id.startsWith('git-'))} />
    <section className={lab.panel} aria-label="Guided Git exercises"><h2>Practise a real recovery decision</h2><div className={lab.tabs}>{GIT_EXERCISES.map(item=><button disabled={!session.ready} key={item.id} onClick={()=>loadExercise(item.id)}>{item.title}</button>)}</div>{checkpoint&&<button onClick={()=>{session.update(current=>({...current,repo:checkpoint,checkpoint:null,exerciseId:'',exerciseStep:0}));setMessage('Your repository checkpoint was restored.');}}>Return to my repository</button>}{exercise&&<div><h3>{exercise.title}</h3><p>{exercise.goal}</p>{step?<><p>Step {exerciseStep+1} / {exercise.steps.length}: {step.instruction}</p>{step.kind==='command'?<button onClick={()=>setCommand(step.value)}>Load the next command</button>:<button onClick={()=>{if(repo.work===step.value){session.update(current=>({...current,exerciseStep:exerciseStep+1}));setMessage('Resolved edit checked. Stage it next.');}else {setMessage('Use the exact resolved text requested by this exercise.');record({...repair,detail:'The resolved file still differs from the exercise contract. Remove the conflict markers and choose the requested resolution.'});}}}>Check resolved file</button>}</>:<p role="status">Exercise complete. Explain the resulting graph before continuing.</p>}</div>}</section>
    <GuidedLesson id="git-lab-snapshots" lesson={lesson} source="https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository">
      <section className={lab.panel} aria-label="Repository simulator"><h3>Repository simulator</h3><p>HEAD → <strong>{repo.branch}</strong> → {gitHead(repo).id} · {repo.merge ? 'Merge conflict pending' : 'No merge pending'}</p>
        <div className={lab.columns}><div><label htmlFor="git-file">Working tree: note.txt</label><textarea className={lab.editor} id="git-file" disabled={!session.ready} maxLength={1000} value={repo.work} onChange={e => setRepo({...repo, work:e.target.value})} /></div><div><h4>Index: staged snapshot</h4><pre className={lab.snapshot}>{repo.stage ?? '(no staged change)'}</pre><h4>HEAD: committed snapshot</h4><pre className={lab.snapshot}>{gitHead(repo).text}</pre></div></div>
        <form onSubmit={run}><label htmlFor="git-command">Simulated Git command</label><input id="git-command" value={command} maxLength={150} onChange={e => setCommand(e.target.value)} /><div className={styles.actions}><button disabled={!session.ready} type="submit">Run command</button><button type="button" onClick={() => {session.update(current=>({...current,repo:newGitRepo(),history:[],done:{},exerciseId:'',exerciseStep:0}));setPreviousHead(null); setMessage('Experiment reset.');}}>Reset experiment</button>{repo.merge && <button type="button" onClick={() => {setRepo(abortGitMerge(repo)); setMessage('Merge aborted. Working text restored to HEAD.');}}>Abort merge</button>}</div></form>
        <details><summary>Supported commands</summary><div className={lab.tabs}>{commands.map(item => <button key={item} onClick={() => setCommand(item)}>{item}</button>)}</div><p>Select a command, then run it. These inputs affect only the simulation.</p></details>
        <p role="status" className={lab.status}>{message}</p><h3>Commit graph</h3><p>Each arrow points from a commit to its parents. Scroll horizontally to inspect additional branches. Commits retained only for recovery are also shown.</p>
        <GitCommitGraph repo={repo} previousHead={previousHead} />
        <ol className={lab.graph} aria-label="Commit graph">{repo.commits.toReversed().map(c => <li key={c.id}><code>{c.id} → {c.parents.join(' + ') || '(root)'}</code> · {c.message}<br /><strong>{Object.entries(repo.branches).filter(([,id]) => id === c.id).map(([name]) => name === repo.branch ? `${name} (HEAD)` : name).join(', ')}</strong></li>)}</ol>
        <h3>Session practice checklist</h3><p>{['add','commit','switch','merge','revert'].map(action => `${done[action] ? '✓' : '○'} ${action}`).join(' · ')}</p>
        <details><summary>Command replay</summary>{history.map((line,i) => <pre key={i} className={lab.snapshot}>{line}</pre>)}</details>
      </section>
      <p><a href="https://git-scm.com/docs/git-rebase">Git rebase mechanics</a> · <a href="https://git-scm.com/docs/git-merge">Git merge reference</a></p>
    </GuidedLesson>
  </ReaderLayout>;
}
