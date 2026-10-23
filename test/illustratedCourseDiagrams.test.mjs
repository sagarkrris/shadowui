import test from 'node:test';
import assert from 'node:assert/strict';
import { canIllustrateCourseDiagram, ILLUSTRATED_DIAGRAM_CONTRACTS } from '../lib/illustratedCourseDiagrams.mjs';
import { COURSE_DIAGRAMS } from '../lib/techBlogDiagrams.mjs';

for (const key of Object.keys(ILLUSTRATED_DIAGRAM_CONTRACTS)) {
  test(`${key}: artwork accepts authored data and node/edge reordering`, () => {
    const diagram = structuredClone(COURSE_DIAGRAMS[key]);
    assert.equal(canIllustrateCourseDiagram(key, diagram), true);
    diagram.nodes.reverse();
    diagram.edges.reverse();
    assert.equal(canIllustrateCourseDiagram(key, diagram), true);
  });

  test(`${key}: missing, duplicate and malformed data cannot crash the artwork`, () => {
    for (const mutate of [
      diagram => diagram.nodes.pop(),
      diagram => { diagram.nodes[0] = null; },
      diagram => { diagram.nodes[0][3] = null; },
      diagram => { diagram.nodes[0][4] = {}; },
      diagram => { diagram.nodes[0] = diagram.nodes[1]; },
      diagram => { diagram.edges = null; },
      diagram => { diagram.edges[0] = null; },
      diagram => { diagram.edges[0][2] = undefined; },
      diagram => { diagram.edges[0][1] = 'missing'; },
      diagram => { diagram.edges[0] = diagram.edges[1]; },
    ]) {
      const diagram = structuredClone(COURSE_DIAGRAMS[key]);
      mutate(diagram);
      assert.equal(canIllustrateCourseDiagram(key, diagram), false);
    }
  });

  test(`${key}: topology changes require data-driven rendering rather than stale artwork`, () => {
    const diagram = structuredClone(COURSE_DIAGRAMS[key]);
    diagram.edges[0] = [diagram.edges[0][1], diagram.edges[0][0], 'reversed'];
    assert.equal(canIllustrateCourseDiagram(key, diagram), false);
  });
}

test('unknown diagrams and absent data are not assigned an illustration', () => {
  for (const key of ['unknown', 'toString', '__proto__']) assert.equal(canIllustrateCourseDiagram(key, COURSE_DIAGRAMS.memory), false);
  for (const diagram of [null, undefined, {}, { nodes: [], edges: [] }]) assert.equal(canIllustrateCourseDiagram('memory', diagram), false);
});
