import test from 'node:test';
import assert from 'node:assert/strict';
import { JAVA_TUTORIAL_CATALOG, JAVA_CURATED_TUTORIAL_CATALOG as course } from '../lib/javaDigest.mjs';
import { getJavaChapterNavigation, getJavaCurriculumGroups, orderJavaTutorials } from '../lib/javaCurriculum.mjs';
import { resolveFlowArtwork } from '../lib/diagramArtwork.mjs';

test('following Next visits exactly the roadmap sequence, and Previous reverses it', () => {
  const expected = getJavaCurriculumGroups(course).flatMap(group => group.steps);
  let current = expected[0];
  const visited = [];
  while (current) {
    visited.push(current.id);
    assert.ok(visited.length <= expected.length, 'navigation must terminate');
    const { previous, next } = getJavaChapterNavigation(JAVA_TUTORIAL_CATALOG, current.id);
    assert.equal(previous?.id, expected[visited.length - 2]?.id);
    current = next;
  }
  assert.deepEqual(visited, expected.map(lesson => lesson.id));
  assert.deepEqual(getJavaChapterNavigation(course, 'removed'), { previous: null, next: null });
});

test('saved chapter identities survive curriculum reordering', () => {
  assert.equal(course.find(lesson => lesson.title === 'JDK vs JRE vs JVM').id, 'catalog-1');
  assert.equal(course.find(lesson => lesson.title === 'Java Memory Management').id, 'catalog-103');
  assert.equal(course.find(lesson => lesson.title === 'Generics').id, 'catalog-33');
  assert.deepEqual(orderJavaTutorials([...course].reverse()).map(lesson => lesson.id), course.map(lesson => lesson.id));
  assert.throws(() => orderJavaTutorials(course.slice(1)), /exactly once/);
});

test('beginner concepts precede examples that require them', () => {
  const position = title => course.findIndex(lesson => lesson.title === title);
  for (const [before, after] of [['Variables and assignment', 'Primitive types'], ['Classes and objects', 'Inheritance'], ['Null and references', 'Wrapper classes'], ['Generics', 'ArrayList'], ['Interfaces', 'Functional interfaces'], ['Functional interfaces', 'Lambda expressions'], ['Lambda expressions', 'Stream pipelines'], ['SQL foundations', 'JDBC basics'], ['JDBC basics', 'Spring Data JPA'], ['HTTP foundations', 'Spring MVC'], ['JUnit test design', 'Testing Spring applications']]) assert.ok(position(before) < position(after), `${before} before ${after}`);
  assert.doesNotMatch(course.find(lesson => lesson.title === 'Methods and parameters').runnableExample.source, /ArrayList|List</);
  assert.doesNotMatch(course.find(lesson => lesson.title === 'Generics').runnableExample.source, /stream\(|\? extends/);
});

test('each chapter teaches an actual answer and a drawable example trace', () => {
  for (const lesson of course) {
    assert.doesNotMatch(lesson.interviewAnswer, /A strong answer|mention trade-offs|Explain .* from first principles/);
    assert.ok(lesson.followUp.includes('?') && lesson.solution && lesson.beginner, lesson.title);
    const diagram = resolveFlowArtwork(lesson.diagram, lesson.title, lesson.diagramSteps);
    assert.ok(diagram.picture, lesson.title);
    if (lesson.diagramSteps) {
      assert.ok(lesson.diagramSteps.every(([label, detail]) => label && detail));
      if (lesson.title !== "JDK vs JRE vs JVM") assert.deepEqual(lesson.diagramSteps.map(([, detail]) => detail), lesson.traceSteps);
    }
    assert.ok(lesson.runnableExample || /Contextual/.test(lesson.exampleNote), lesson.title);
    assert.doesNotMatch(lesson.exampleNote, /undefined/);
  }
});
