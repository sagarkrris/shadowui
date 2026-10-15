import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { INTERVIEW_TOPICS, INTERVIEW_STAGES, selectInterviewQuestions, interviewQuestionId } from '../lib/interviewTopics.mjs';
import { readInterviewTopic } from '../lib/interviewTopicContent.mjs';
import { SENIOR_JAVA_GUIDE_PARTS } from '../lib/seniorJavaGuide.mjs';
import { discoveryCatalogue } from '../lib/discoveryCatalog.mjs';

for (const topic of INTERVIEW_TOPICS) {
  test(`${topic.title} has real distinct answers, complete learning stages and stable identities`, async () => {
    const { groups } = await readInterviewTopic(topic.slug);
    const entries = selectInterviewQuestions(groups);
    assert.equal(entries.length, topic.count);
    assert.ok(entries.length >= topic.minimum);
    const questions = groups.flatMap(group => group.questions);
    assert.equal(new Set(questions.map(item => item.question.toLowerCase())).size, questions.length, 'Primary questions must be distinct');
    assert.equal(new Set(questions.map(item => item.answer)).size, questions.length, 'No stock answers may be repeated to inflate counts');
    const ids = entries.map(item => interviewQuestionId(topic.slug, item.groupIndex, item.questionIndex));
    assert.equal(new Set(ids).size, ids.length);
    for (const stage of INTERVIEW_STAGES) assert.equal(selectInterviewQuestions(groups, { stage: stage.id }).length, groups.length);
    for (const group of groups) {
      assert.equal(group.questions.length, 5);
      assert.ok(group.title.length >= 3);
      assert.ok(['annotation', 'concept'].includes(group.kind));
      for (const field of ['mechanism', 'tradeOff', 'verify']) assert.ok(group[field]?.length > 12);
      for (const entry of group.questions) {
        assert.ok(entry.question.endsWith('?'), entry.question);
        assert.ok(entry.answer.length >= 45, entry.question);
        assert.doesNotMatch(entry.answer, /\b(?:TODO|TBD|lorem ipsum|answer goes here)\b/i);
      }
    }
  });
}

test('filters search actual answers, combine stages and annotations, and recover from no matches', async () => {
  const { groups } = await readInterviewTopic('spring-framework');
  const all = selectInterviewQuestions(groups);
  const annotations = selectInterviewQuestions(groups, { annotations: true });
  assert.ok(annotations.length >= 40);
  assert.ok(annotations.every(item => groups[item.groupIndex].kind === 'annotation'));
  const found = selectInterviewQuestions(groups, { stage: 'foundations', annotations: true, query: 'BeanDefinition' });
  assert.ok(found.length > 0);
  assert.ok(found.every(item => item.questionIndex === 0));
  assert.equal(selectInterviewQuestions(groups, { query: 'there-is-no-such-question' }).length, 0);
  assert.equal(selectInterviewQuestions(groups, { query: '   ' }).length, all.length);
  assert.equal(await readInterviewTopic('../../secrets'), null);
  assert.equal(interviewQuestionId('java', 2, 4), 'java-015');
});

test('all original guide sections retain resolving bookmarks and an explicit place in topic or additional subjects', async () => {
  const entries = JSON.parse(await readFile(new URL('../content/interview-topics/legacy-index.json', import.meta.url)));
  const expected = [];
  for (const part of SENIOR_JAVA_GUIDE_PARTS) {
    const html = await readFile(new URL(`../content/senior-java/rendered/${part.slug}.html`, import.meta.url), 'utf8');
    for (const match of html.matchAll(/<h([2-6]) id="([^"]+)">/g)) expected.push(`/senior-java-interview/${part.slug}#${match[2]}`);
  }
  assert.deepEqual(entries.map(entry => entry.href), expected, 'Regenerate the topic index after modifying guide headings');
  assert.equal(new Set(entries.map(entry => entry.href)).size, entries.length);
  const known = new Set(INTERVIEW_TOPICS.map(topic => topic.slug));
  for (const entry of entries) assert.ok(entry.topics.every(topic => known.has(topic)));
  for (const topic of INTERVIEW_TOPICS) assert.ok(entries.some(entry => entry.topics.includes(topic.slug)), topic.slug);
  const records = discoveryCatalogue();
  for (const topic of INTERVIEW_TOPICS) assert.ok(records.some(item => item.href === `/senior-java-interview/topics/${topic.slug}`));
});
