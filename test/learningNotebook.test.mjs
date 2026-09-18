import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNotebook, saveNote, notebookMarkdown, safeLearningHref } from '../lib/learningNotebook.mjs';
const note = { id: 'spring', href: '/learn/spring-transactions', title: 'Spring', evidence: 'trace' };
test('notebook rejects executable, external, and malformed links', () => {
  for (const href of ['javascript:alert(1)', '//evil.test', '/\\evil', '/learn?x=1', null]) assert.equal(safeLearningHref(href), null);
  assert.deepEqual(normalizeNotebook([null, { ...note, href: '//evil.test' }]), []);
});
test('notebook bounds fields and steps and deduplicates saved notes', () => {
  const result = normalizeNotebook([{ ...note, failure: 'a'.repeat(4000), steps: [0, 0, 4, 5, -1, '2'], completed: 'true' }, note]);
  assert.equal(result.length, 1); assert.equal(result[0].failure.length, 3000); assert.deepEqual(result[0].steps, [0, 4]); assert.equal(result[0].completed, false);
});
test('saving preserves other notes and replaces the edited record', () => {
  let value = JSON.stringify([{ ...note, id: 'other' }]); const storage = { getItem: () => value, setItem: (_, next) => { value = next; } };
  saveNote(storage, note); saveNote(storage, { ...note, completed: true });
  assert.equal(JSON.parse(value).length, 2); assert.equal(JSON.parse(value)[0].completed, true);
  assert.match(notebookMarkdown(JSON.parse(value)), /Evidence: trace/);
});
test('write failures propagate so UI cannot falsely promise persistence', () => {
  assert.throws(() => saveNote({ getItem: () => '[]', setItem: () => { throw new Error('quota'); } }, note), /quota/);
});

import { normalizeBookmarks } from '../lib/readerEditorial.mjs';
test('notebook preserves bookmarks for every supported reader subject', () => {
  for (const subject of ['java', 'tech-blogs', 'guides', 'spring', 'sql', 'python', 'aws', 'javascript', 'system-design']) {
    assert.equal(normalizeBookmarks([{ href: `/${subject}/example#read-evidence`, title: 'Evidence' }]).length, 1);
  }
  assert.deepEqual(normalizeBookmarks([{ href: '/api/private#token', title: 'Unsafe' }]), []);
});
