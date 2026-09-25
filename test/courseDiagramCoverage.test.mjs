import assert from 'node:assert/strict';
import test from 'node:test';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import { COURSE_DIAGRAMS, BLOG_OVERVIEW_DIAGRAMS } from '../lib/techBlogDiagrams.mjs';
import { PATTERN_DIAGRAMS } from '../lib/techBlogSupplementalDiagrams.mjs';

test('every published course has an authored graphical overview', () => {
  for (const blog of listTechBlogs()) {
    assert.ok(COURSE_DIAGRAMS[BLOG_OVERVIEW_DIAGRAMS[blog.id]], blog.id);
    for (const pattern of blog.patterns || []) assert.ok(COURSE_DIAGRAMS[PATTERN_DIAGRAMS[pattern.name]], pattern.name);
    if (['design-patterns-in-18-minutes', 'java-design-patterns-with-diagrams'].includes(blog.id)) {
      for (const chapter of blog.chapters) assert.ok(COURSE_DIAGRAMS[chapter.diagramKey], chapter.title);
    }
  }
});

test('all diagram edges resolve and nodes fit the shared canvas', () => {
  for (const [key, diagram] of Object.entries(COURSE_DIAGRAMS)) {
    assert.ok(diagram.title && diagram.description, key);
    const ids = new Set(diagram.nodes.map(node => node[0]));
    assert.equal(ids.size, diagram.nodes.length, key);
    for (const [id, x, y, label, detail] of diagram.nodes) {
      assert.ok(x >= 0 && x + 200 <= 750 && y >= 0 && label && detail, key + ':' + id);
    }
    for (const [from, to, label] of diagram.edges) assert.ok(ids.has(from) && ids.has(to) && label, key);
  }
});
