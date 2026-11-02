import test from 'node:test';
import assert from 'node:assert/strict';
import { continueLearningItems, roadmapResume } from '../lib/continueLearning.mjs';
import { LEARNING_PATHS, HUB_PROGRESS_KEY, ACTIVE_PATH_KEY, pathActivityId, buddyHref } from '../lib/learningHub.mjs';
import { NOTEBOOK_KEY, removeNotebookNote, undoNotebookRemoval, normalizeNotebook } from '../lib/learningNotebook.mjs';
import { READER_BOOKMARK_KEY } from '../lib/readerEditorial.mjs';
import { savedLearningRecords } from '../lib/savedLearningRecords.mjs';
import { searchDiscovery } from '../lib/publicNavigation.mjs';
import { lessonPracticeContext, LESSON_PRACTICE_PROFILE } from '../lib/lessonQuickStart.mjs';
import { exportPracticeBackup, previewPracticeBackup, summarizePracticeBackup, restorePracticeBackup } from '../lib/practiceBackup.mjs';
import { saveSessionSnapshot } from '../lib/sessionPersistence.mjs';
const note = { id: 'diagnosis', href: '/labs/cache', title: 'My cache diagnosis', evidence: 'private evidence', completed: false };
function storage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return { get length() { return values.size; }, key: i => [...values.keys()][i], getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
for (const path of LEARNING_PATHS.filter(p => p.id !== 'java-backend')) {
  test(`${path.id} resumes new work, weak stages, and completed paths`, () => {
    const store = storage({ [ACTIVE_PATH_KEY]: path.id });
    assert.equal(roadmapResume(store).href, path.stages[0].activities[0].href);
    store.setItem(HUB_PROGRESS_KEY, JSON.stringify({ weak: [`stage-${path.id}-${path.stages[1].id}`] }));
    assert.equal(roadmapResume(store).href, path.stages[1].activities[0].href);
    const all = path.stages.flatMap(stage => stage.activities.map(a => pathActivityId(path.id, stage.id, a.label)));
    store.setItem(HUB_PROGRESS_KEY, JSON.stringify({ completed: all }));
    assert.equal(roadmapResume(store), null);
  });
}
test('review activity resumes at its roadmap, not a hash on the homepage', () => {
  const path = LEARNING_PATHS[1], stage = path.stages[0];
  const store = storage({ [ACTIVE_PATH_KEY]: path.id, [HUB_PROGRESS_KEY]: JSON.stringify({ completed: stage.activities.slice(0, 4).map(a => pathActivityId(path.id, stage.id, a.label)) }) });
  assert.equal(roadmapResume(store).href, `/learn/roadmaps/${path.id}#review-${stage.id}`);
});
test('a blocked roadmap does not hide notebook or recent reading', () => {
  const store = storage({ [NOTEBOOK_KEY]: JSON.stringify([note]), 'interviewiq.learningResume.v1': JSON.stringify([{ title: 'Other reading', href: '/labs/queues' }]) });
  const read = store.getItem;
  store.getItem = key => { if (key === ACTIVE_PATH_KEY) throw new Error('blocked'); return read(key); };
  assert.deepEqual(continueLearningItems(store).map(i => i.href), ['/labs/cache', '/labs/queues']);
});
test('undo restores the removed note and preserves newer notes and edits', () => {
  const store = storage({ [NOTEBOOK_KEY]: JSON.stringify([note]) });
  const result = removeNotebookNote(store, note.id);
  assert.equal(result.notes.length, 0);
  store.setItem(NOTEBOOK_KEY, JSON.stringify([{ ...note, id: 'new-note' }]));
  assert.equal(undoNotebookRemoval(store, result.removed).length, 2);
  assert.throws(() => undoNotebookRemoval(store, result.removed), /newer version/);
  assert.equal(normalizeNotebook(JSON.parse(store.getItem(NOTEBOOK_KEY))).length, 2);
});
test('local search retains bookmarks when notebook JSON is damaged and supports paging', () => {
  const store = storage({ [NOTEBOOK_KEY]: '{bad', [READER_BOOKMARK_KEY]: JSON.stringify([{ title: 'Cache ownership', href: '/java/cache#ownership' }]) });
  assert.equal(savedLearningRecords(store)[0].title, 'Cache ownership');
  const records = Array.from({ length: 65 }, (_, i) => ({ title: `Cache lesson ${i}`, type: 'Lesson' }));
  assert.equal(searchDiscovery(records, 'cache').length, 30);
  assert.equal(searchDiscovery(records, 'cache', 'All', Infinity).length, 65);
});
test('lesson handoffs preserve context and reject external return URLs', () => {
  const query = Object.fromEntries(new URL(buddyHref('SQL transactions', { href: '/sql/transactions#isolation', title: 'SQL isolation' }), 'https://example.test').searchParams);
  assert.deepEqual(lessonPracticeContext(query), { topic: 'SQL transactions', href: '/sql/transactions#isolation', title: 'SQL isolation' });
  assert.equal(lessonPracticeContext({ ...query, lessonHref: '//evil.test' }).href, null);
  assert.equal(lessonPracticeContext({ buddy: '1', buddyTopic: [] }), null);
  assert.equal(LESSON_PRACTICE_PROFILE.experience, 'Not specified');
});
test('backup summaries are readable and notebook backup restores across devices', () => {
  const store = storage({ [NOTEBOOK_KEY]: JSON.stringify([note]), [READER_BOOKMARK_KEY]: JSON.stringify([{ title: 'Cache', href: '/java/cache#ownership' }]) });
  saveSessionSnapshot(store, { messages: [], practice: { attempts: [], designs: [] } });
  const backup = previewPracticeBackup(exportPracticeBackup(store));
  const summaries = summarizePracticeBackup(backup);
  assert.ok(summaries.some(s => s.label === 'Learning notebook' && s.detail === '1 notes'));
  assert.ok(summaries.some(s => s.detail.includes('0 practice attempts')));
  assert.ok(!JSON.stringify(summaries).includes('private evidence'));
  const destination = storage(); restorePracticeBackup(destination, backup);
  assert.equal(JSON.parse(destination.getItem(NOTEBOOK_KEY))[0].evidence, note.evidence);
});

test('an empty session entry is rejected before preview or restore', () => {
  assert.throws(() => previewPracticeBackup(JSON.stringify({ format: 'interviewiq-practice', version: 1, entries: { 'interviewprep.session.v1': '' } })), /Session is malformed/);
});
