import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { BACKEND_FIELD_NOTES } from '../lib/backendFieldNotes.mjs';
import { listTechBlogs } from '../lib/techBlogs.mjs';
import { editorialCredit, readingItem } from '../lib/readerEditorial.mjs';

for (const blog of BACKEND_FIELD_NOTES) {
  test(`${blog.id}: runnable example matches its published output`, () => {
    const file = fileURLToPath(new URL(`../public/blog-examples/${blog.fixture}`, import.meta.url));
    const result = execFileSync('python3', [file], { encoding: 'utf8', timeout: 10000 });
    assert.equal(result.trim(), blog.expected);
  });
  test(`${blog.id}: public and workspace readers have compatible content and credits`, () => {
    const entry = listTechBlogs().find(item => item.id === blog.id);
    assert.ok(entry.sections.length && entry.lessons.length && entry.practice);
    assert.ok(entry.chapters.every(chapter => chapter.quiz && chapter.lesson && chapter.example));
    assert.ok(readingItem(`/tech-blogs/${blog.id}`));
    assert.match(editorialCredit(`/tech-blogs/${blog.id}`).runtime, /Python 3.13.5/);
    assert.ok(blog.misconception.options[blog.misconception.correct]);
    assert.equal(blog.misconception.feedback.length, blog.misconception.options.length);
    assert.equal(new Set(blog.related.map(link => link.href)).size, blog.related.length);
  });
}
