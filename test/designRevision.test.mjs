import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultRevision, normalizeRevision, normalizeGraph, challengeRevision, analyzeGraph, revisionChanges } from '../lib/designRevision.mjs';
import { createSystemDesignCanvasState, exportSystemDesignCanvasMarkdown } from '../lib/systemDesignCanvas.mjs';
import { createSessionSnapshot } from '../lib/sessionPersistence.mjs';

test('outage freezes the initial graph and a second challenge cannot overwrite it', () => {
  const initial = defaultRevision(), revised = challengeRevision(initial);
  assert.equal(initial.graph.nodes[3].available, true);
  assert.equal(revised.baseline.nodes[3].available, true);
  assert.equal(revised.graph.nodes[3].available, false);
  revised.graph.nodes[0].replicas = 2;
  assert.equal(revised.baseline.nodes[0].replicas, 1);
  assert.deepEqual(challengeRevision(revised), revised);
  assert.ok(revisionChanges(revised.baseline, revised.graph).some(line => line.includes('replicas')));
});
test('failure review propagates synchronous dependency risk but stops at an async boundary', () => {
  const state = challengeRevision(defaultRevision());
  state.graph.edges[2].timeout = 50;
  state.graph.edges[2].attempts = 3;
  state.graph.nodes[0].traffic = 500;
  const findings = analyzeGraph(state.graph);
  assert.ok(findings.some(f => f.node === 'node-2' && f.message.includes('propagate')));
  assert.ok(!findings.some(f => f.node === 'node-1' && f.message.includes('propagate')));
  assert.ok(findings.some(f => f.message.includes('timeout')));
  assert.ok(findings.some(f => f.message.includes('3 attempts')));
  assert.ok(findings.some(f => f.message.includes('bottleneck')));
});
test('normalization drops dangling edges, rejects invalid IDs and bounds imported fields', () => {
  const initial = defaultRevision().graph;
  const graph = normalizeGraph({ nodes: [...initial.nodes, initial.nodes[0], { id: '<script>' }], edges: [...initial.edges, { id: 'bad', from: 'missing', to: 'node-0' }] });
  assert.equal(graph.nodes.length, 4); assert.equal(graph.edges.length, 3);
  assert.deepEqual(normalizeGraph(null), { nodes: [], edges: [] });
  assert.equal(normalizeRevision({ notes: 'a'.repeat(5000) }).notes.length, 4000);
});
test('revision decisions, baseline and risks survive session round trips and export', () => {
  const revision = { ...challengeRevision(defaultRevision()), decisions: 'Bound retries and buffer durably', risks: 'Provider deduplication window', notes: 'Keep the API contract unchanged' };
  const canvas = createSystemDesignCanvasState({ problem: 'Existing brief', revision });
  const snapshot = createSessionSnapshot({ systemDesignCanvas: canvas });
  assert.deepEqual(snapshot.systemDesignCanvas.revision, revision);
  assert.match(exportSystemDesignCanvasMarkdown(canvas), /Provider deduplication window/);
  assert.equal(createSystemDesignCanvasState({}).revision, undefined);
});
