import assert from "node:assert/strict";
import test from "node:test";
import { listTechBlogs } from "../lib/techBlogs.mjs";

test("production Tech Blogs include full-length courses for the highest-value gaps", () => {
  const blogs = new Map(listTechBlogs().map((blog) => [blog.id, blog]));
  const ids = [
    "java-observability-opentelemetry",
    "spring-transactions-data-access",
    "java-performance-clinic",
    "event-driven-java-reliability",
    "production-java-testing",
    "java-memory-management-evolution",
  ];

  for (const id of ids) {
    const blog = blogs.get(id);
    assert.ok(blog, id);
    assert.ok(blog.summary && blog.practice, `${id} has learner guidance`);
    assert.ok(blog.capstone?.title && blog.capstone.scenario && blog.capstone.steps.length >= 3 && blog.capstone.outcome, `${id} has an end-to-end capstone`);
    assert.ok(blog.chapters.length >= 6, `${id} has a full course`);
    assert.ok(blog.chapters.every((chapter) => chapter.lesson && chapter.example && chapter.exercise && chapter.quiz), `${id} chapters are actionable`);
  }
});
