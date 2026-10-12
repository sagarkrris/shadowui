import test from 'node:test';
import assert from 'node:assert/strict';
import { LEARNING_PATHS, normalizeHubProgress, learningPathProgress, pathActivityId } from '../lib/learningHub.mjs';
import { learningCatalogue } from '../lib/learningCatalog.mjs';
import { HUB_LABS, labResult } from '../lib/hubLabs.mjs';
test('roadmaps contain distinct stages, five activities, and encoded topic handoffs', () => {
  assert.equal(LEARNING_PATHS.length, 4);
  for (const path of LEARNING_PATHS) {
    assert.equal(new Set(path.stages.map(s => s.id)).size, path.stages.length);
    for (const s of path.stages) { assert.deepEqual(s.activities.map(a => a.label), ['Learn','Experiment','Build','Interview','Review']); const url = new URL(s.activities[3].href, 'https://test.invalid'); assert.equal(url.searchParams.get('buddyMode'), 'warmup'); }
  }
});
test('invalid persisted progress cannot create counts; duplicates do not inflate completion', () => {
  assert.deepEqual(normalizeHubProgress(null), { completed: [], weak: [], notes: {} });
  const path = LEARNING_PATHS[1]; const id = pathActivityId(path.id, path.stages[0].id, 'Learn');
  const result = learningPathProgress(path, { completed: [id,id,'obsolete'], weak: [null], notes: { '__proto__': 'bad' } });
  assert.equal(result.completed, 1); assert.equal(result.next.label, 'Experiment');
});
test('a weak stage is recommended before new work; removing it returns to the earliest gap', () => {
  const path = LEARNING_PATHS[2]; const weak = `stage-${path.id}-${path.stages[2].id}`;
  assert.equal(learningPathProgress(path, {weak:[weak]}).next.stage.id, path.stages[2].id);
  assert.equal(learningPathProgress(path, {weak:[]}).next.stage.id, path.stages[0].id);
  const all = path.stages.flatMap(s => s.activities.map(a => pathActivityId(path.id,s.id,a.label)));
  assert.equal(learningPathProgress(path,{completed:all}).next,null);
});
test('legacy backend activities are imported without double counting', () => {
  const path=LEARNING_PATHS[0]; const id=pathActivityId(path.id,'foundations','Learn');
  assert.equal(learningPathProgress(path,{completed:[id]},['foundations:Learn','foundations:Learn','obsolete']).completed,1);
});
test('catalogue identities are unique and every existing course has ordered lesson handoffs', () => {
  const courses=learningCatalogue(); const ids=courses.flatMap(c=>c.lessons.map(l=>l.id));
  assert.equal(new Set(ids).size,ids.length); assert.ok(courses.length>=54);
  for(const c of courses) { assert.ok(c.prerequisites); assert.ok(c.lessons.length); for(const l of c.lessons) assert.ok(l.href.startsWith('/')); }
});
test('cache capacity changes eviction and reuse', () => {
  assert.equal(labResult('cache',{value:1}).summary,'1 hits; 6 misses');
  assert.equal(labResult('cache',{value:3}).summary,'4 hits; 3 misses');
});
test('interleaving loses an increment; serialization retains both', () => { assert.match(labResult('concurrency').summary,/: 1$/); assert.match(labResult('concurrency',{enabled:true}).summary,/: 2$/); });
test('absent index target terminates, with distinct search costs', () => {
  assert.equal(labResult('indexes',{value:65}).summary,'Absent: linear 64 comparisons; binary 7');
  assert.equal(labResult('indexes',{value:1}).summary,'Found: linear 1 comparisons; binary 6');
});
test('bounded queue preserves arrivals as served, queued or rejected, including zero demand', () => {
  assert.equal(labResult('queues',{value:0}).summary,'0 served; 0 queued; 0 rejected');
  assert.equal(labResult('queues',{value:8}).summary,'6 served; 6 queued; 20 rejected');
});
test('agent writes never occur without approval or beyond the step budget', () => {
  assert.match(labResult('agents',{value:3}).summary,/approval required/);
  assert.equal(labResult('agents',{value:2,enabled:true}).lines.length,2);
  assert.equal(labResult('agents',{value:0,enabled:true}).lines.length,0);
  assert.equal(labResult('agents',{value:3,enabled:true}).lines.length,3);
  for(const lab of HUB_LABS) assert.ok(labResult(lab.id,{value:Infinity}).summary);
  assert.throws(()=>labResult('unknown'));
});
