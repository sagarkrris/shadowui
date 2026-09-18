import test from 'node:test';
import assert from 'node:assert/strict';
import { ERAS } from '../lib/engineeringTimeMachine.mjs';
import { designTransition } from '../lib/timeMachineDesign.mjs';
const path = (...choices) => choices.map(choice => ({ choice }));
test('cache adds a read path while preserving transactional checkout', () => {
  const result = designTransition(path('cache'), 0);
  assert.equal(result.before.nodes.some(node => node.id === 'cache'), false);
  assert.equal(result.after.nodes.find(node => node.id === 'cache').status, 'Added');
  assert.equal(result.after.nodes.find(node => node.id === 'db').status, 'Unchanged');
  assert.deepEqual(result.after.links.find(link => link.id === 'writes'), { id: 'writes', from: 'app', to: 'db', label: 'Order and inventory transactions', status: 'Unchanged' });
  assert.deepEqual(result.removedLinks.map(link => link.id), ['reads']);
});
test('deletion diagrams attribute inherited obligations and include all relevant copies', () => {
  const result = designTransition(path('cache', 'sync', 'purge'), 2);
  assert.deepEqual(result.after.obligations.map(item => item.stage), [0, 1, 2]);
  assert.equal(result.after.nodes.find(node => node.id === 'remote').status, 'Unchanged');
  assert.equal(result.after.nodes.find(node => node.id === 'deletion').status, 'Added');
  assert.deepEqual(result.after.links.filter(link => link.from === 'deletion').map(link => link.to).sort(), ['backup', 'cache', 'db', 'remote']);
  assert.match(result.after.links.find(link => link.to === 'backup' && link.from === 'deletion').label, /before restored data is served/);
});
test('sharded replication covers every owner and a replacement does not erase existing duties', () => {
  const result = designTransition(path('shard', 'async', 'rewrite'), 2);
  assert.ok(result.after.links.some(link => link.id === 'shard-replication'));
  assert.match(result.after.nodes.find(node => node.id === 'remote').detail, /each order shard/);
  assert.equal(result.after.nodes.find(node => node.id === 'replacement').status, 'Added');
  assert.ok(result.after.nodes.some(node => node.id === 'db'));
  assert.equal(result.after.obligations.length, 3);
  assert.match(result.after.nodes.find(node => node.id === 'shards').detail, /unresolved/);
});
test('every branch has valid endpoints, stable prior snapshots and nonempty consequences', () => {
  for (const first of ERAS[0].options) for (const second of ERAS[1].options) for (const third of ERAS[2].options) {
    const timeline = path(first.id, second.id, third.id);
    for (let index = 0; index < 3; index++) {
      const { before, after } = designTransition(timeline, index);
      assert.ok(after.nodes.some(node => node.status !== 'Unchanged'));
      assert.equal(after.obligations.length, index + 1);
      for (const design of [before, after]) {
        const ids = new Set(design.nodes.map(node => node.id));
        assert.equal(ids.size, design.nodes.length);
        design.links.forEach(link => { assert.ok(ids.has(link.from)); assert.ok(ids.has(link.to)); });
      }
      if (index > 0) {
        const prior = designTransition(timeline, index - 1).after;
        assert.deepEqual(before.nodes, prior.nodes.map(({ status: _status, ...node }) => node));
      }
    }
  }
  assert.equal(designTransition([], 0), null);
  assert.equal(designTransition(path('cache'), 2), null);
});
