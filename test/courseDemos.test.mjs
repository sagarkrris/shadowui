import assert from 'node:assert/strict';
import test from 'node:test';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import { COURSE_DEMOS, COURSE_DEMO_ASSIGNMENTS } from '../lib/courseDemos.mjs';
import { routingFrames, hashingFrames, replayFrames, traceFrames } from '../lib/courseDemoModels.mjs';

test('every published course has explicitly assigned, valid interactive demos', () => {
  const courses = listTechBlogs().map(blog => blog.id).sort();
  assert.deepEqual(Object.keys(COURSE_DEMO_ASSIGNMENTS).sort(), courses);
  const used = new Set();
  for (const ids of Object.values(COURSE_DEMO_ASSIGNMENTS)) {
    assert.ok(ids.length);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) { assert.ok(COURSE_DEMOS[id]); used.add(id); }
  }
  assert.equal(used.size, Object.keys(COURSE_DEMOS).length);
  for (const demo of Object.values(COURSE_DEMOS)) {
    assert.ok(demo.title && demo.scope && demo.question);
    if (demo.kind !== 'trace') continue;
    assert.equal(demo.scenarios.length, 2);
    assert.notDeepEqual(traceFrames(demo, 0), traceFrames(demo, 1));
    for (let scenario = 0; scenario < 2; scenario++) {
      const frames = traceFrames(demo, scenario);
      assert.ok(frames.length >= 3);
      for (const frame of frames) {
        assert.ok(frame.title && frame.explanation);
        assert.equal(frame.cells.length, demo.lanes.length);
        assert.ok(frame.cells.every(cell => cell.value && cell.value !== 'undefined'));
      }
    }
  }
});

test('routing excludes offline nodes and accounts for relative capacity', () => {
  const count = frame => frame.cells.map(cell => Number(cell.value.split(' ')[0]));
  assert.deepEqual(count(routingFrames().at(-1)), [3, 3, 2]);
  assert.deepEqual(count(routingFrames({ offline: true }).at(-1)), [4, 4, 0]);
  const weighted = count(routingFrames({ policy: 'weighted-load', capacity: 4 }).at(-1));
  assert.equal(weighted.reduce((a,b) => a+b, 0), 8);
  assert.ok(weighted[0] > weighted[1] && weighted[0] > weighted[2]);
  assert.deepEqual(routingFrames(), routingFrames());
});

test('ring changes move only the demonstrated interval, including wraparound', () => {
  const add = hashingFrames()[1].cells;
  assert.deepEqual(add.map(cell => cell.value), ['Owner A', 'Owner B', 'Owner D', 'Owner A']);
  assert.deepEqual(add.map(cell => cell.active), [false, false, true, false]);
  const remove = hashingFrames({ membership: 'remove' })[1].cells;
  assert.deepEqual(remove.map(cell => cell.value), ['Owner A', 'Owner C', 'Owner C', 'Owner A']);
  assert.deepEqual(remove.map(cell => cell.active), [false, true, false, false]);
  assert.match(hashingFrames({ hotKey: true })[2].explanation, /hot key/);
});

test('expired replay uses a consistent snapshot rather than skipping a missing range', () => {
  assert.equal(replayFrames().at(-1).cells[0].value, '72');
  assert.equal(replayFrames({ expired: true }).at(-1).cells[0].value, '81');
  assert.match(replayFrames({ expired: true })[2].explanation, /cannot replay/);
});

test('change indicators reflect consecutive state values across every scenario', () => {
  const runs = [routingFrames(), routingFrames({ offline: true, policy: 'weighted-load' }),
    hashingFrames(), hashingFrames({ membership: 'remove', hotKey: true }),
    replayFrames(), replayFrames({ expired: true }),
    ...Object.values(COURSE_DEMOS).filter(demo => demo.kind === 'trace')
      .flatMap(demo => demo.scenarios.map((_, index) => traceFrames(demo, index)))];
  for (const frames of runs) {
    assert.ok(frames[0].cells.every(cell => !cell.active));
    for (let i = 1; i < frames.length; i++) {
      for (const cell of frames[i].cells) {
        const previous = frames[i - 1].cells.find(item => item.label === cell.label);
        assert.equal(cell.active, cell.value !== previous.value, `${frames[i].title}: ${cell.label}`);
      }
    }
  }
});
