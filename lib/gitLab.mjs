export function newGitRepo() {
  return { commits: [{ id: 'c0', parents: [], text: 'hello', message: 'Initial snapshot' }], branches: { main: 'c0' }, branch: 'main', work: 'hello', stage: null, merge: null, reflog: ['c0'], next: 1 };
}
const commitAt = (s, id) => s.commits.find(c => c.id === id);
export function gitHead(s) { return commitAt(s, s.branches[s.branch]); }
function ancestors(s, id, found = new Set()) { if (found.has(id)) return found; found.add(id); for (const parent of commitAt(s, id)?.parents || []) ancestors(s, parent, found); return found; }
// A bounded line patch model: no insert/delete alignment or rename detection.
function replayText(before,after,onto) {
  if(onto===before)return after;
  if(onto===after||before===after)return onto;
  const oldLines=before.split('\n'),newLines=after.split('\n'),target=onto.split('\n');
  if(oldLines.length!==newLines.length||target.length!==oldLines.length)throw new Error('This rebase model requires equal line counts when both branches changed the file.');
  for(let i=0;i<oldLines.length;i++)if(oldLines[i]!==newLines[i]){
    if(target[i]!==oldLines[i]&&target[i]!==newLines[i])throw new Error('Rebase would conflict on a changed line. History is unchanged; resolve with merge instead.');
    target[i]=newLines[i];
  }
  return target.join('\n');
}
export function gitCommand(state, input) {
  const s = structuredClone(state);
  const head = () => gitHead(s);
  const clean = () => { if (s.merge || s.stage !== null || s.work !== head().text) throw new Error('Commit or restore your changes before this command.'); };
  const move = id => { s.reflog.unshift(s.branches[s.branch]); s.reflog = s.reflog.slice(0, 40); s.branches[s.branch] = id; s.work = commitAt(s, id).text; s.stage = null; };
  const commit = (text, parents, message) => { const id = `c${s.next++}`; s.commits.push({ id, text, parents, message }); move(id); };
  const branchName = name => { if (!/^[a-z][a-z0-9-]{0,24}$/.test(name || '') || ['constructor', 'prototype'].includes(name)) throw new Error('Use a branch name starting with a lowercase letter (up to 25 letters, digits or hyphens).'); };
  const target = name => { const id = Object.hasOwn(s.branches, name) ? s.branches[name] : name; if (!commitAt(s, id)) throw new Error('Unknown branch or commit.'); return id; };
  const command = String(input || '').trim(); let message = '';
  try {
    if (command === 'git status') message = s.merge ? 'Merge conflict: edit note.txt, git add note.txt, then git commit -m "resolve".' : s.stage !== null ? 'note.txt staged. Later working edits remain unstaged.' : s.work === head().text ? 'Working tree clean.' : 'note.txt modified, not staged.';
    else if (command === 'git add note.txt') { s.stage = s.work; message = 'Copied the current file into the index (staging area).'; }
    else if (/^git commit -m "[^"\n]{1,80}"$/.test(command)) {
      if (s.stage === null) throw new Error('Stage note.txt first.');
      if (!s.merge && s.stage === head().text) throw new Error('No staged change to commit.');
      const work = s.work; commit(s.stage, s.merge ? [head().id, s.merge] : [head().id], command.slice(15, -1)); s.work = work; s.merge = null; message = 'Created a snapshot from the index; moved the current branch.';
    } else if (command.startsWith('git switch -c ')) {
      clean(); const name = command.slice(14); branchName(name); if (Object.hasOwn(s.branches, name)) throw new Error('Branch already exists.'); s.branches[name] = head().id; s.branch = name; message = `Created and switched to ${name}.`;
    } else if (command.startsWith('git switch ')) {
      clean(); const name = command.slice(11); if (!Object.hasOwn(s.branches, name)) throw new Error('Unknown branch.'); s.branch = name; s.work = head().text; message = `HEAD now refers to ${name}.`;
    } else if (command === 'git merge --abort') {
      if (!s.merge) throw new Error('No merge is pending.');
      s.merge = null; s.stage = null; s.work = head().text; message = 'Merge aborted.';
    } else if (command.startsWith('git merge ')) {
      clean(); const id = target(command.slice(10));
      if (ancestors(s, head().id).has(id)) message = 'Already up to date.';
      else if (ancestors(s, id).has(head().id)) { move(id); message = 'Fast-forward: moved the branch pointer without a merge commit.'; }
      else {
        const theirs = commitAt(s, id); const ours = head(); const base = s.commits.toReversed().find(c => ancestors(s, ours.id).has(c.id) && ancestors(s, id).has(c.id));
        if (ours.text !== theirs.text && ours.text !== base.text && theirs.text !== base.text) { s.merge = id; s.work = `<<<<<<< ${s.branch}\n${ours.text}\n=======\n${theirs.text}\n>>>>>>> incoming`; message = 'Conflict in note.txt. Resolve the text, stage it, then commit.'; }
        else { commit(ours.text === base.text ? theirs.text : ours.text, [ours.id, id], 'Merge'); message = 'Created a two-parent merge commit.'; }
      }
    } else if (command.startsWith('git rebase ')) {
      clean(); const id = target(command.slice(11)); const old = head();
      if (ancestors(s, old.id).has(id)) message = 'Already based on that history.';
      else if (ancestors(s, id).has(old.id)) { move(id); message = 'Fast-forwarded to the target.'; }
      else {
        const chain = []; let cursor = old;
        while (!ancestors(s, id).has(cursor.id)) { if (cursor.parents.length !== 1) throw new Error('This model rebases only linear history.'); chain.unshift(cursor); cursor = commitAt(s, cursor.parents[0]); }
        let text = commitAt(s, id).text; const replay=[];
        for(const item of chain){const next=replayText(commitAt(s,item.parents[0]).text,item.text,text);if(next!==text)replay.push({text:next,message:item.message});text=next;}
        move(id);
        for(const item of replay)commit(item.text,[head().id],`Replay: ${item.message}`);
        message = `Replayed ${replay.length} local changes with new commit IDs; skipped ${chain.length-replay.length} already-applied changes. Original commits remain available for recovery.`;
      }
    } else if (command === 'git revert HEAD') {
      clean(); if (head().parents.length !== 1) throw new Error('This model reverts only a single-parent HEAD commit.'); const old = head(); commit(commitAt(s, old.parents[0]).text, [old.id], `Revert ${old.id}`); message = 'Added an inverse snapshot; earlier history is retained.';
    } else if (command.startsWith('git reset --hard ')) {
      if (s.merge) throw new Error('Abort the merge first.'); const id = target(command.slice(17)); move(id); message = 'Moved the branch and replaced the index and working text. The old commit is listed in the reflog.';
    } else if (command === 'git restore note.txt') { if (s.merge) throw new Error('Resolve or abort the merge first.'); s.work = s.stage ?? head().text; message = 'Restored working text from the index (or HEAD when nothing is staged).'; }
    else if (command === 'git reflog') message = `Previous branch tips, newest first: ${s.reflog.join(', ')}`;
    else throw new Error('Unsupported command. Choose a supported example below.');
    if (s.commits.length > 80) throw new Error('This model is limited to 80 commits. Reset the experiment to continue.');
    return { state: s, message };
  } catch (error) { return { state, message: error.message, error: true }; }
}
export function abortGitMerge(state) { return { ...state, merge: null, stage: null, work: gitHead(state).text }; }
