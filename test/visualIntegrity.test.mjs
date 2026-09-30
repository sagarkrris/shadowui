import test from 'node:test';
import assert from 'node:assert/strict';
import { flowModel, wrapDiagramLabel } from '../lib/visualModels.mjs';
import { COURSE_DIAGRAMS } from '../lib/techBlogDiagrams.mjs';
import { SYMPTOM_DIAGRAMS, BUILD_DIAGRAMS } from '../lib/learningDiagrams.mjs';
import { SYMPTOMS } from '../lib/engineeringSymptoms.mjs';
import { TINY_SYSTEMS } from '../lib/tinySystems.mjs';
import { JAVA_TUTORIAL_CATALOG } from '../lib/javaDigest.mjs';
import { COURSE_VISUAL_GUIDES } from '../lib/courseVisualGuides.mjs';

test('flows retain branches, reverse arrows, separate paths and full source', () => {
  assert.deepEqual(flowModel('acquire → use → close').steps, ['acquire', 'use', 'close']);
  for (const source of ['consumer → port ← adapter', 'consumer -> port <- adapter', 'source ↔ target', 'a → b\nc → d', 'root\n ├─ left\n └─ right', 'objects → heap; calls → stack']) {
    assert.equal(flowModel(source).kind, 'source');
    assert.equal(flowModel(source).source, source);
  }
  assert.equal(flowModel(null).kind, 'empty');
  assert.equal(flowModel('').kind, 'empty');
  const graph = flowModel('flowchart LR\n A["Service"] --> B["Cache"]\n A --> C["Database"]');
  assert.equal(graph.kind, 'graph');
  assert.deepEqual(graph.edges, [['A','B'], ['A','C']]);
  assert.deepEqual(graph.nodes.map(node => node.label), ['Service', 'Cache', 'Database']);
  assert.equal(flowModel('flowchart LR\n A -->|hit| B').kind, 'source', 'unsupported syntax remains intact');
  assert.equal(flowModel('flowchart LR A --> B\n C --> D').kind, 'source', 'inline header content must not disappear');
});

test('all tutorial flows preserve the authored source, including memory semantics', () => {
  for (const lesson of JAVA_TUTORIAL_CATALOG) {
    const model = flowModel(lesson.diagram);
    assert.notEqual(model.kind, 'empty', lesson.title);
    assert.equal(model.source, lesson.diagram.trim());
  }
  assert.match(JAVA_TUTORIAL_CATALOG.find(lesson => lesson.title === 'Garbage collection').diagram, /retain reachable.*reclaim unreachable/);
});

test('diagram labels wrap without lost words and fit the allocated line counts', () => {
  for (const [key, diagram] of Object.entries(COURSE_DIAGRAMS)) {
    for (const node of diagram.nodes) {
      for (const [text, limit] of [[node[3],23], [node[4],27]]) {
        const lines = wrapDiagramLabel(text, limit);
        assert.equal(lines.join(' '), text, `${key}: ${text}`);
        assert.ok(lines.length <= 2, `${key}: ${text} exceeds the node height`);
        assert.ok(lines.every(line => line.length <= limit));
      }
    }
  }
  assert.equal(wrapDiagramLabel('averylongidentifierwithoutspaces', 8).join(''), 'averylongidentifierwithoutspaces');
});

test('every symptom and small-system project has an explicit mechanism illustration', () => {
  assert.deepEqual(Object.keys(SYMPTOM_DIAGRAMS).sort(), SYMPTOMS.map(s => s.slug).sort());
  assert.deepEqual(Object.keys(BUILD_DIAGRAMS).sort(), TINY_SYSTEMS.map(s => s.slug).sort());
  for (const key of [...Object.values(SYMPTOM_DIAGRAMS), ...Object.values(BUILD_DIAGRAMS)]) assert.ok(COURSE_DIAGRAMS[key]);
  assert.match(COURSE_DIAGRAMS.buildLog.description, /ignores uncommitted entries, including gaps/);
  assert.match(COURSE_DIAGRAMS.symptomDuplicate.description, /does not deduplicate an arbitrary external payment/);
});

test('alternative AI choices do not imply execution order or successful completion', () => {
  for (const id of ['choose-pattern', 'prompt-basics', 'rag-vectors', 'advanced-adaptation']) assert.equal(COURSE_VISUAL_GUIDES[id].layout, 'comparison');
});

test('resource and outcome diagrams preserve the failure boundaries', () => {
  assert.ok(COURSE_DIAGRAMS.poolOwnership.edges.some(([a,b]) => a === 'release' && b === 'remote'));
  assert.ok(!COURSE_DIAGRAMS.poolOwnership.edges.some(([a,b]) => a === 'transaction' && b === 'remote'));
  assert.ok(COURSE_DIAGRAMS.saga.edges.some(([a,b,label]) => a === 'capture' && b === 'unknown' && label.includes('ambiguous')));
  assert.ok(!COURSE_DIAGRAMS.saga.edges.some(([a,b]) => a === 'unknown' && b === 'release'));
  assert.ok(COURSE_DIAGRAMS.rateLimit.edges.some(([a,b,label]) => a === 'authority' && b === 'rejected' && label === 'no quota'));
});
