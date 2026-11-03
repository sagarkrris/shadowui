import {newGitRepo,gitCommand} from './gitLab.mjs';
const cmd=(value,instruction)=>({kind:'command',value,instruction});
export const GIT_EXERCISES=[
 {id:'conflict',title:'Resolve a divergent merge',goal:'Preserve both parents while choosing a resolved file.',steps:[cmd('git merge feature','Merge feature into main and inspect the conflict markers.'),{kind:'edit',value:'resolved note',instruction:'Replace all conflict markers with exactly: resolved note. Then check your edit.'},cmd('git add note.txt','Stage the resolved snapshot.'),cmd('git commit -m "resolve"','Commit the resolution; inspect its two parent arrows.')]},
 {id:'recovery',title:'Recover a reset branch',goal:'Use local tip history to recover c2 after a reset.',steps:[cmd('git reset --hard c0','Reset the simulated branch to its root. The file changes disappear from the working tree.'),cmd('git reflog','Inspect the previous tip c2 in the local tip history.'),cmd('git reset --hard c2','Recover c2 and inspect the restored file and HEAD.')]},
 {id:'rebase',title:'Follow a rebased commit',goal:'Observe a new commit identity while the original remains available.',steps:[cmd('git rebase main','Replay feature onto main. The branches changed separate existing lines, so this bounded model can replay while preserving both edits.')]},
];
export function gitExerciseRepo(id){
 let s=newGitRepo();const run=command=>{const next=gitCommand(s,command);if(next.error)throw Error(next.message);s=next.state;};
 const edit=text=>{s={...s,work:text};run('git add note.txt');run('git commit -m "example"');};
 if(id==='conflict'){edit('main change');run('git reset --hard c0');run('git switch -c feature');edit('feature change');run('git switch main');run('git reset --hard c1');}
 else if(id==='recovery'){edit('first note');edit('second note');}
 else if(id==='rebase'){edit('greeting=hello\nanchor=1\nanchor=2\nanchor=3\nanchor=4\nanchor=5\nstatus=draft');run('git switch -c feature');edit('greeting=hello\nanchor=1\nanchor=2\nanchor=3\nanchor=4\nanchor=5\nstatus=ready');run('git switch main');edit('greeting=hi\nanchor=1\nanchor=2\nanchor=3\nanchor=4\nanchor=5\nstatus=draft');run('git switch feature');}
 else throw Error('Unknown Git exercise');
 return s;
}
export function gitGraphLayout(repo){
 const lanes=new Map();let lane=0;const commits=new Map(repo.commits.map(c=>[c.id,c]));
 for(const [,tip] of Object.entries(repo.branches)){let id=tip;while(id&&!lanes.has(id)){lanes.set(id,lane);id=commits.get(id)?.parents[0];}lane++;}
 for(const c of repo.commits)if(!lanes.has(c.id))lanes.set(c.id,lane++);
 const nodes=repo.commits.map((c,i)=>({...c,x:65+lanes.get(c.id)*250,y:55+i*78,labels:Object.entries(repo.branches).filter(([,id])=>id===c.id).map(([name])=>name)}));
 return {nodes,width:Math.max(520,140+lane*250),height:Math.max(160,repo.commits.length*78+50)};
}
