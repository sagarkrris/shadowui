import assert from "node:assert/strict";
import test from "node:test";
import { SYSTEM_DESIGN_VISUAL_GUIDE } from "../lib/systemDesignVisualGuide.mjs";
import { CONCEPT_SOURCES, SYSTEM_DESIGN_CONCEPT_LESSONS } from '../lib/systemDesignConceptLessons.mjs';

test("visual system design guide groups fifty concepts with diagrams throughout", () => {
  assert.equal(SYSTEM_DESIGN_VISUAL_GUIDE.sections.length, 5);
  const ids = new Set(SYSTEM_DESIGN_VISUAL_GUIDE.sections.map(section => section.id));
  assert.equal(ids.size, SYSTEM_DESIGN_VISUAL_GUIDE.sections.length);
  for (const section of SYSTEM_DESIGN_VISUAL_GUIDE.sections) {
    assert.ok(section.takeaway);
    assert.equal(section.concepts.length, 10);
    assert.equal(section.diagrams.length, 2);
    for (const diagram of section.diagrams) {
      assert.ok(diagram.title && diagram.description);
      assert.ok(diagram.nodes.length >= 4);
      assert.equal(diagram.edges.length, diagram.nodes.length - 1);
    }
  }
  assert.equal(SYSTEM_DESIGN_VISUAL_GUIDE.sections.flatMap(section => section.concepts).length, 50);
});

test('every concept has a complete, distinct beginner-to-deep interview lesson', () => {
  const concepts = SYSTEM_DESIGN_VISUAL_GUIDE.sections.flatMap(section => section.concepts);
  assert.deepEqual(new Set(concepts.map(item => item.name)), new Set(Object.keys(SYSTEM_DESIGN_CONCEPT_LESSONS)));
  for (const item of concepts) {
    const stages = ['beginner', 'mechanism', 'example', 'deepDive', 'interviewAnswer'];
    assert.equal(new Set(stages.map(stage => item[stage])).size, stages.length, item.name);
    for (const stage of stages) assert.ok(typeof item[stage] === 'string' && item[stage].trim().length > 100, `${item.name}: missing substantive ${stage}`);
    assert.ok(item.followUp.question.endsWith('?'), item.name);
    assert.ok(item.followUp.answer.length > 100, item.name);
    assert.ok(item.sources.length > 0, item.name);
    for (const key of item.sources) assert.equal(new URL(CONCEPT_SOURCES[key][1]).protocol, 'https:');
  }
});

test('worked examples retain units and distinguish coordination guarantees', () => {
  const lessons = SYSTEM_DESIGN_CONCEPT_LESSONS;
  assert.match(lessons['Error budget'].mechanism, /1,000 bad events/);
  assert.match(lessons['Error budget'].example, /ten times/);
  assert.match(lessons.Throughput.example, /20 requests in progress/);
  assert.match(lessons['Retry policy'].example, /27 leaf attempts/);
  for (const term of ['atomicity', 'consistency', 'isolation', 'durability']) assert.ok(lessons['ACID transaction'].beginner.includes(term));
  assert.match(lessons.Saga.beginner, /Distributed transactions are not impossible/);
  assert.match(lessons['Delivery guarantee'].deepDive, /outside that scope/);
});
