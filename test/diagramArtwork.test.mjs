import test from 'node:test';
import assert from 'node:assert/strict';
import { arrowArtworkModel, artworkGraph, courseArtworkModel, layoutArtwork, sequenceArtworkModel } from '../lib/diagramArtwork.mjs';
import { COURSE_DIAGRAMS } from '../lib/techBlogDiagrams.mjs';
import { COURSE_VISUAL_GUIDES } from '../lib/courseVisualGuides.mjs';

test('every authored course keeps its exact nodes, directed edges and full relationship labels', () => {
  for (const [key, diagram] of Object.entries(COURSE_DIAGRAMS)) {
    const model = courseArtworkModel(diagram);
    assert.ok(model, key);
    assert.deepEqual(model.nodes.map(node => [node.id,node.label,node.detail]), diagram.nodes.map(([id,,,label,detail]) => [id,label,detail]));
    assert.deepEqual(model.edges.map(({from,to,label}) => [from,to,label]), diagram.edges);
    const layout = layoutArtwork(model);
    for (const node of layout.nodes) {
      assert.ok(node.x >= 0 && node.x + 280 <= layout.width && node.y >= 0 && node.y + layout.nodeHeight <= layout.height, key);
      assert.equal(node.labelLines.join(' '), node.label, key);
      assert.equal(node.detailLines.join(' '), node.detail, key);
    }
    assert.equal(layout.routes.length, diagram.edges.length, key);
    for (const route of layout.routes) {
      assert.equal((route.path.match(/M/g) || []).length, 1, `${key}: individual marker path`);
      assert.ok(route.labelX >= 12 && route.labelY >= 12 && route.labelX <= layout.width - 12 && route.labelY <= layout.height - 12, key);
    }
  }
});

test('AI comparisons have no invented arrows and selection IDs remain stable', () => {
  for (const guide of Object.values(COURSE_VISUAL_GUIDES)) {
    const model = sequenceArtworkModel(guide.steps, guide.title, guide.layout === 'comparison');
    assert.ok(model, guide.title);
    assert.equal(model.edges.length, guide.layout === 'comparison' ? 0 : guide.steps.length - 1);
    assert.deepEqual(model.nodes.map(node => node.detail), guide.steps.map(step => step[1]));
  }
});

test('reverse and bidirectional arrows preserve ownership; separate paths stay separate', () => {
  const model = arrowArtworkModel('policy → owned port ← infrastructure adapter; caller ↔ peer', 'Responsibilities');
  const labels = new Map(model.nodes.map(node => [node.id,node.label]));
  assert.deepEqual(model.edges.map(edge => [labels.get(edge.from),labels.get(edge.to)]), [
    ['policy','owned port'], ['infrastructure adapter','owned port'], ['caller','peer'], ['peer','caller'],
  ]);
  for (const source of ['root\n ├─ left\n └─ right', 'A -->|hit| B', 'flowchart LR\n A --> B', 'a → b; unclear standalone statement']) assert.equal(arrowArtworkModel(source, 'Unsupported'), null);
});

test('invalid and duplicate IDs or dangling edges return no artwork', () => {
  const a = {id:'a',label:'A',detail:''}, b = {id:'b',label:'B',detail:''};
  for (const nodes of [null, [], [null], [a,a], [{...a,label:null}]]) assert.equal(artworkGraph(nodes, [], 'Invalid'), null);
  assert.equal(artworkGraph([a,b], [{from:'a',to:'missing',label:'x'}], 'Invalid'), null);
  assert.equal(artworkGraph([a,b], [null], 'Invalid'), null);
  assert.equal(courseArtworkModel({nodes:[null],edges:[]}), null);
  assert.equal(layoutArtwork(null), null);
});

test('long text grows nodes and export height; cycles and isolated nodes are retained', () => {
  const short = sequenceArtworkModel(['Read','Write'], 'Short');
  const long = sequenceArtworkModel(['A long explanation '.repeat(70),'Write'], 'Long');
  assert.ok(layoutArtwork(long).nodeHeight > layoutArtwork(short).nodeHeight);
  const nodes = ['a','b','c'].map(id => ({id,label:id,detail:'',x:0,y:id.charCodeAt(0)}));
  const model = artworkGraph(nodes, [{from:'c',to:'a',label:'return'}, {from:'a',to:'a',label:'self'}], 'Cycle');
  const layout = layoutArtwork(model);
  assert.equal(layout.nodes.length, 3);
  assert.equal(layout.routes.length, 2);
  assert.equal((layout.routes[0].path.match(/M/g) || []).length, 1);
  assert.ok(layout.legend.some(edge => edge.lines.join(' ').includes('self')));
});
