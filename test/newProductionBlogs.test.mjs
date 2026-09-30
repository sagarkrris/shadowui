import assert from "node:assert/strict";
import test from "node:test";
import { listTechBlogs } from "../lib/techBlogs.mjs";
import { COURSE_DIAGRAMS } from "../lib/techBlogDiagrams.mjs";
import { readingItem } from '../lib/readerEditorial.mjs';
import { createProductionChapters } from '../lib/productionBlogFactory.mjs';

const ids = ["kubernetes-java-production", "postgres-zero-downtime-migrations", "opentelemetry-collector-production", "java-container-supply-chain-security", "production-llm-evals-guardrails"];

test("new production guides are full courses with visual coverage", () => {
  const blogs = new Map(listTechBlogs().map(blog => [blog.id, blog]));
  for (const id of ids) {
    const blog = blogs.get(id);
    assert.ok(blog, id);
    assert.ok(blog.sourceUrl && blog.capstone?.steps?.length >= 3);
    assert.equal(blog.chapters.length, 6);
    assert.equal(new Set(blog.chapters.map(chapter => chapter.diagramKey)).size, 6, `${id}: distinct chapter diagrams`);
    for (const chapter of blog.chapters) {
      assert.ok(chapter.lesson && chapter.example && chapter.exercise && chapter.answer);
      assert.ok(COURSE_DIAGRAMS[chapter.diagramKey], `${id}: ${chapter.title}`);
      assert.ok(chapter.walkthrough.length > 250, `${id}: worked reasoning`);
      assert.ok(chapter.example.includes('\n'), `${id}: worked trace or configuration`);
      assert.notEqual(chapter.answer, chapter.lesson);
      assert.doesNotMatch(chapter.exercise, /Practice set:|one recognition problem/);
      const visual = COURSE_DIAGRAMS[chapter.diagramKey];
      const nodeIds = new Set(visual.nodes.map(node => node[0]));
      for (const [from, to, label] of visual.edges) {
        assert.ok(nodeIds.has(from) && nodeIds.has(to) && label);
      }
    }
  }
});

test('PostgreSQL promotion and post-write rollback retain their safety gates', () => {
  const blog = listTechBlogs().find(item => item.id === ids[1]);
  const cutover = blog.chapters[3];
  assert.match(cutover.lesson, /Fence and drain all old writers/);
  assert.match(cutover.lesson, /schema DDL or sequence state/);
  assert.match(cutover.lesson, /zero downtime is not guaranteed/);
  const rollback = blog.chapters[5];
  assert.match(rollback.lesson, /After target commits, the source is stale/);
  assert.match(rollback.lesson, /reconcile or reverse-replicate/);
  assert.match(rollback.example, /901 disappears/);
  assert.match(blog.capstone.steps.join(' '), /do not independently backfill/);
  assert.match(COURSE_DIAGRAMS.postgresCutover.description, /routing back alone is unsafe/);
  assert.doesNotMatch(COURSE_DIAGRAMS.postgresCutover.description, /explicit and reversible/);
});

test('visual guide is discoverable and authored content cannot silently fall back', () => {
  assert.equal(readingItem('/system-design/visual-guide')?.title, '50 System Design Concepts, Seen Clearly');
  assert.throws(() => createProductionChapters([{ title: 'Missing workshop' }]), /Missing production workshop/);
});
