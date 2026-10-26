import test from 'node:test';
import assert from 'node:assert/strict';
import { arrowArtworkModel, artworkGraph, courseArtworkModel, layoutArtwork, resolveFlowArtwork, sequenceArtworkModel } from '../lib/diagramArtwork.mjs';
import { COURSE_DIAGRAMS } from '../lib/techBlogDiagrams.mjs';
import { COURSE_VISUAL_GUIDES } from '../lib/courseVisualGuides.mjs';
import { getJavaTutorialBySlug, JAVA_TUTORIAL_CATALOG } from '../lib/javaDigest.mjs';
import { buildSystemDesignInterviewAnswer, SYSTEM_DESIGN_INTERVIEW_PRACTICE_CATALOG } from '../lib/systemDesignCanvas.mjs';

test('every Java tutorial resolves to actual nodes and edges, including labels containing graph', () => {
  for (const tutorial of JAVA_TUTORIAL_CATALOG) {
    const { picture, source } = resolveFlowArtwork(tutorial.diagram, tutorial.title, tutorial.diagramSteps);
    assert.ok(picture?.nodes.length, tutorial.title);
    assert.ok(picture.edges.length, tutorial.title);
    assert.equal(source, tutorial.diagram.trim());
  }
  for (const slug of ['modules', 'spring-profiles', 'java-memory-management']) {
    const tutorial = getJavaTutorialBySlug(slug);
    assert.ok(resolveFlowArtwork(tutorial.diagram, tutorial.title).picture, slug);
  }
  const { picture } = resolveFlowArtwork('input → reachability graph → result; retained objects → evidence', 'Separate paths');
  const labels = new Map(picture.nodes.map(node => [node.id, node.label]));
  assert.deepEqual(picture.edges.map(edge => [labels.get(edge.from), labels.get(edge.to)]), [
    ['input', 'reachability graph'], ['reachability graph', 'result'], ['retained objects', 'evidence'],
  ]);
});

test('all authored system-design interview exports retain exact flow labels and directions', () => {
  for (const entry of SYSTEM_DESIGN_INTERVIEW_PRACTICE_CATALOG) {
    const answer = buildSystemDesignInterviewAnswer(entry);
    const { picture } = resolveFlowArtwork(answer.mermaid, answer.title);
    assert.ok(picture, answer.title);
    assert.deepEqual(picture.nodes.map(node => node.label), answer.flow.slice(0, 8), answer.title);
    assert.deepEqual(picture.edges.map(edge => [edge.from, edge.to]), answer.flow.slice(1, 8).map((_, index) => [`N${index}`, `N${index + 1}`]), answer.title);
  }
});

test('ambiguous notation remains exact source instead of inventing picture connections', () => {
  for (const source of ['root\n ├─ left\n └─ right', 'flowchart LR\n A -->|hit| B', 'graph LR A --> B', 'flowchart unsupported → B']) {
    const resolved = resolveFlowArtwork(source, 'Unrecognized relationships');
    assert.equal(resolved.source, source);
    assert.equal(resolved.picture, null);
  }
  const empty = resolveFlowArtwork(null);
  assert.equal(empty.source, '');
  assert.equal(empty.picture, null);
});

test('JDK tutorial renders an authored compile-and-run graph with complete readable stages', () => {
  const tutorial = getJavaTutorialBySlug('jdk-vs-jre-vs-jvm');
  const model = sequenceArtworkModel(tutorial.diagramSteps, 'Compile and run');
  assert.equal(model.nodes.length, 6);
  assert.equal(model.edges.length, 5);
  assert.deepEqual(model.nodes.map(node => node.label), ['Greeting.java', 'javac · JDK compiler', 'Greeting.class', 'java · runtime launcher', 'JVM executes bytecode', 'Program output']);
  assert.deepEqual(model.edges.map(edge => [edge.from, edge.to]), Array.from({ length: 5 }, (_, i) => [`step-${i}`, `step-${i + 1}`]));
  const layout = layoutArtwork(model);
  for (const node of layout.nodes) {
    assert.equal(node.labelLines.join(' '), node.label);
    assert.equal(node.detailLines.join(' '), node.detail);
  }
});

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
