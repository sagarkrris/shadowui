import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { contentInventory, INVENTORY_DEFINITIONS } from '../lib/contentInventory.mjs';
import { learningCatalogue } from '../lib/learningCatalog.mjs';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import { listBlind75Problems } from '../lib/blind75VisualTrack.mjs';
import { BUILD_CHALLENGES } from '../lib/buildChallenges.mjs';
import { INTERVIEW_TOPICS } from '../lib/interviewTopics.mjs';
import { articleProvenance, contentRevision } from '../lib/editorialWorkflow.mjs';
import { PRODUCT_CAPABILITIES, PRODUCT_IDENTITY } from '../lib/productIdentity.mjs';

test('registered inventory separates field notes, courses, collections and mirrored coding views', async () => {
  const { counts } = await contentInventory();
  assert.equal(counts.catalogEntries, learningCatalogue().length);
  assert.equal(counts.courses, listTechBlogs().filter(course => course.format !== 'field-note').length + 1);
  assert.ok(counts.courses < counts.catalogEntries);
  assert.equal(counts.collections, 1);
  assert.equal(counts.codingProblems, listBlind75Problems().length);
  assert.equal(counts.challenges, BUILD_CHALLENGES.length);
  assert.equal(INVENTORY_DEFINITIONS.length, 8);
  const buildDoc = readFileSync(new URL('../docs/build-practice.md', import.meta.url), 'utf8');
  assert.ok(buildDoc.includes(`includes ${counts.challenges} original Java 17 challenges`));
});
test('question inventory reads actual entries and excludes duplicate question views within each topic', async () => {
  const { counts } = await contentInventory({ readTopic: async () => ({ groups: [{ questions: [{ question: ' Why this contract? ' }, { question: 'WHY   THIS CONTRACT?' }] }, { questions: [{ question: 'What fails?' }] }] }) });
  assert.equal(counts.questions, INTERVIEW_TOPICS.length * 2);
});
test('missing question-bank data fails the build rather than publishing an understated count', async () => {
  await assert.rejects(contentInventory({ readTopic: async () => { throw new Error('bank unavailable'); } }), /bank unavailable/);
});
test('provenance revisions change on body edits and do not invent reviewer or execution evidence', () => {
  assert.notEqual(contentRevision({ title: 'Same title', body: 'old' }), contentRevision({ title: 'Same title', body: 'corrected' }));
  assert.equal(contentRevision({ body: 'unchanged' }), contentRevision({ body: 'unchanged' }));
  const records = articleProvenance();
  assert.equal(records.length, new Set(records.map(record => record.href)).size);
  for (const record of records) {
    assert.match(record.revision, /^sha256:[a-f0-9]{64}$/);
    assert.equal(record.reviewer, null);
    assert.equal(record.lastExecution, null);
    assert.match(record.reviewStatus, /not recorded/);
    assert.ok(record.source && record.evidence);
  }
  const fieldNote = records.find(record => record.href === '/tech-blogs/request-timed-out-did-payment-happen');
  assert.match(fieldNote.evidence, /public\/blog-examples\/payment-timeout.py/);
  assert.ok(existsSync('public/blog-examples/payment-timeout.py'));
  assert.ok(records.some(record => record.href === '/learn/ai-engineering'));
});
test('capability requirements distinguish local profile, account sync, AI and runner dependencies', () => {
  assert.equal(PRODUCT_IDENTITY.name, 'InterviewIQ');
  assert.equal(PRODUCT_IDENTITY.host, 'elevateprep.vercel.app');
  const rows = Object.fromEntries(PRODUCT_CAPABILITIES.map(row => [row.id, row]));
  assert.match(rows.local.limit, /not an account/);
  assert.match(rows.sync.requirement, /Signed-in account/);
  assert.match(rows.ai.requirement, /configured AI provider/);
  assert.match(rows.runner.requirement, /available code runner/);
  assert.match(rows.learning.requirement, /No account/);
});
