import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { completePublicListicle, completePublicStackGuide } from '../lib/publicQuestionContent.mjs';
import { PUBLIC_VERTICAL_LISTICLES } from '../lib/verticalContent.mjs';
import { PUBLIC_STACK_GUIDES } from '../lib/seoGuides.mjs';
import { getPracticePack } from '../lib/practicePacks.mjs';
import { JAVA_INTERVIEW_QA } from '../lib/javaDigest.mjs';

function assertLesson(item) {
  for (const key of ['answer', 'example', 'tradeOff', 'verification']) {
    assert.ok(typeof item[key] === 'string' && item[key].length > 20, `${item.question}: missing ${key}`);
  }
  assert.ok(item.followUp?.question && item.followUp?.answer.length > 20, item.question);
  assert.ok(item.sources.length > 0);
  for (const [title, url] of item.sources) {
    assert.ok(title);
    assert.equal(new URL(url).protocol, 'https:');
  }
}

test('all seven advertised question counts resolve to distinct, worked lessons', async () => {
  for (const seed of PUBLIC_VERTICAL_LISTICLES) {
    const result = await completePublicListicle(seed);
    const expected = Number(seed.title.match(/Top (\d+)/)[1]);
    assert.equal(result.questions.length, expected, seed.vertical);
    assert.equal(new Set(result.questions.map(item => item.question)).size, expected);
    result.questions.forEach(assertLesson);
    if (seed.vertical === 'java' || seed.vertical === 'spring' || seed.vertical === 'sql') {
      for (const original of seed.questions.filter(item => item.slug)) {
        assert.ok(result.questions.some(item => item.slug === original.slug && item.question === original.question));
      }
    }
  }
  assert.equal(await completePublicListicle(null), null);
});

test('all nine public guides provide worked answers and explained follow-ups', async () => {
  assert.equal(PUBLIC_STACK_GUIDES.length, 9);
  for (const seed of PUBLIC_STACK_GUIDES) {
    const result = await completePublicStackGuide(seed);
    assert.ok(result.questions.length >= 3, seed.stack);
    result.questions.forEach(assertLesson);
    assert.equal(new Set(result.questions.map(item => item.id)).size, result.questions.length);
  }
  const node = await completePublicStackGuide(PUBLIC_STACK_GUIDES.find(item => item.stack === 'nodejs'));
  assert.match(JSON.stringify(node.questions), /cancel|abort/i);
  const react = await completePublicStackGuide(PUBLIC_STACK_GUIDES.find(item => item.stack === 'react'));
  assert.match(JSON.stringify(react.questions), /cleanup/i);
  assert.equal(await completePublicStackGuide(null), null);
});

test('Microservices selection supplies an actual answer and generated cards remain explicit outlines', () => {
  const pack = getPracticePack({ selectedCat: 'System Design', selectedSub: 'Microservices', profile: { stack: 'Node.js' }, seed: 'audit' });
  assert.equal(pack.id, 'backend-api');
  const card = pack.cards.find(item => item.id === 'api-microservices-boundaries');
  assert.ok(card, 'selected Microservices topic should surface its curated answer');
  assert.match(card.interviewAnswer, /independently deployable/);
  assert.match(card.interviewAnswer, /modular monolith/);
  assert.match(card.example, /payment times out/);
  assert.match(card.verification, /duplicate delivery/);
  assert.equal(card.followUpAnswers.length, card.followUps.length);
  const rounds = Array.from({ length: 15 }, (_, i) => getPracticePack({ selectedSub: 'Microservices', seed: `outline-${i}` }));
  const generated = rounds.flatMap(item => item.cards).filter(item => item.answerKind === 'outline');
  assert.ok(generated.length);
  assert.ok(generated.every(item => !item.interviewAnswer && !item.tags.includes('Most Asked')));
  const ui = readFileSync(new URL('../components/welcome/PracticePack.js', import.meta.url), 'utf8');
  assert.match(ui, /card.interviewAnswer \? "Interview-ready answer" : "Answer outline/);
});

test('HashMap teaching distinguishes tree shape from worst-case lookup work', () => {
  const lesson = JAVA_INTERVIEW_QA.find(item => item.id === 'hashmap-internals-interview');
  assert.match(lesson.answer, /Equal-hash keys/);
  assert.match(lesson.answer, /both subtrees/);
  assert.match(lesson.answer, /operation-specific/);
  assert.doesNotMatch(lesson.answer, /O\(log n\) once treeified|reverts to a list once it drops to 6/);
  const result = spawnSync('java', ['--source', '21', 'test/fixtures/HashMapCollisionChecks.java'], { encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /treeified equal-hash lookup checked/);
});
