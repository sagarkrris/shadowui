import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { listTechBlogs } from "../lib/techBlogs.mjs";
import { TECH_BLOG_GUIDANCE } from "../lib/techBlogGuidance.mjs";
import { COURSE_DIAGRAMS } from "../lib/techBlogDiagrams.mjs";

test("older course self-checks have authored answers and subject guidance", () => {
  const courses = listTechBlogs().filter(blog => blog.format !== "field-note");
  for (const blog of courses) {
    for (const chapter of blog.chapters) {
      assert.ok(chapter.answer, `${blog.id}: ${chapter.title} answer`);
      assert.ok(chapter.avoid, `${blog.id}: ${chapter.title} avoidance`);
      assert.doesNotMatch(chapter.whenToUse, /brute-force/);
      if (chapter.diagramKey) assert.ok(COURSE_DIAGRAMS[chapter.diagramKey]);
    }
    if (TECH_BLOG_GUIDANCE[blog.id]) {
      assert.deepEqual(Object.keys(TECH_BLOG_GUIDANCE[blog.id].answers).sort(),
        blog.chapters.map(chapter => chapter.title).sort());
    }
  }
  for (const diagram of Object.values(COURSE_DIAGRAMS)) {
    const nodes = new Set(diagram.nodes.map(node => node[0]));
    for (const [from, to] of diagram.edges) {
      assert.ok(nodes.has(from) && nodes.has(to));
    }
    assert.ok(diagram.description && diagram.title);
  }
});

test("production Tech Blogs include full-length courses for the highest-value gaps", () => {
  const blogs = new Map(listTechBlogs().map((blog) => [blog.id, blog]));
  const ids = [
    "java-observability-opentelemetry",
    "spring-transactions-data-access",
    "java-performance-clinic",
    "event-driven-java-reliability",
    "production-java-testing",
    "java-memory-management-evolution",
    "java-design-patterns-with-diagrams",
    "microservices-design-patterns",
    "distributed-transactions-data-consistency",
    "caching-patterns-java",
    "spring-boot-security",
    "resilience-engineering",
    "microservices-migration-patterns",
    "java-api-evolution-contracts",
  ];

  for (const id of ids) {
    const blog = blogs.get(id);
    assert.ok(blog, id);
    assert.ok(blog.summary && blog.practice, `${id} has learner guidance`);
    assert.ok(blog.capstone?.title && blog.capstone.scenario && blog.capstone.steps.length >= 3 && blog.capstone.outcome, `${id} has an end-to-end capstone`);
    assert.ok(blog.chapters.length >= 6, `${id} has a full course`);
    assert.ok(blog.chapters.every((chapter) => chapter.lesson && chapter.example && chapter.exercise && chapter.quiz), `${id} chapters are actionable`);
  }

  const patterns = blogs.get("java-design-patterns-with-diagrams");
  assert.equal(patterns.category, "Java design patterns");
  assert.equal(patterns.chapters.length, 7);
  assert.ok(patterns.chapters.every(chapter => chapter.diagram.includes("→") && chapter.example && chapter.quiz));
  assert.ok(patterns.chapters.every(chapter => chapter.whenToUse && chapter.avoid && chapter.answer));

  for (const chapter of patterns.chapters) {
    assert.ok(chapter.lesson.includes(chapter.whenToUse));
    assert.doesNotMatch(chapter.lesson, /brute-force/);
    assert.doesNotMatch(chapter.example, /Walkthrough prompt:/);
  }

  const microservices = blogs.get("microservices-design-patterns");
  assert.equal(microservices.category, "Microservices architecture");
  assert.equal(microservices.chapters.length, 7);
  assert.ok(microservices.chapters.every(chapter => chapter.diagram.includes("→") && chapter.whenToUse && chapter.avoid && chapter.answer));
  assert.ok(microservices.chapters.every(chapter => chapter.lesson.includes(chapter.whenToUse)));

  for (const id of [
    "distributed-transactions-data-consistency",
    "caching-patterns-java",
    "spring-boot-security",
    "resilience-engineering",
    "microservices-migration-patterns",
    "java-api-evolution-contracts",
  ]) {
    const course = blogs.get(id);
    assert.equal(course.chapters.length, 6);
    assert.ok(course.chapters.every(chapter => chapter.diagram.includes("→") && chapter.whenToUse && chapter.avoid && chapter.answer));
    assert.ok(course.chapters.every(chapter => chapter.lesson.includes(chapter.whenToUse)));
  }
});

test("standalone examples compile against Java 17 and distributed behavior checks pass", () => {
  const blogs = listTechBlogs().filter(blog => [
    "java-design-patterns-with-diagrams",
    "microservices-design-patterns",
    "distributed-transactions-data-consistency",
    "caching-patterns-java",
    "spring-boot-security",
    "resilience-engineering",
    "microservices-migration-patterns",
  ].includes(blog.id));
  const chapters = blogs.flatMap(blog => blog.chapters).filter(chapter => !chapter.exampleRuntime);
  const dir = mkdtempSync(join(tmpdir(), "pattern-test-"));
  try {
    const files = chapters.map((chapter, index) => {
      const path = join(dir, `Chapter${index + 1}.java`);
      writeFileSync(path, chapter.example);
      return path;
    });
    const checks = fileURLToPath(new URL("./fixtures/MicroservicesExampleChecks.java", import.meta.url));
    const bitExample = listTechBlogs().find(blog => blog.id === "leetcode-patterns")
      .chapters.find(chapter => chapter.title === "Bit Manipulation").example;
    const bitExpression = bitExample.split(" checks ")[0];
    const bitChecks = join(dir, "PowerOfTwoChecks.java");
    writeFileSync(bitChecks, `class PowerOfTwoChecks {
      static boolean check(int n) { return ${bitExpression}; }
      public static void main(String[] args) {
        for (int n : new int[]{0, -1, Integer.MIN_VALUE, 3, Integer.MAX_VALUE})
          if (check(n)) throw new AssertionError("not a power: " + n);
        for (int n : new int[]{1, 2, 4, 1024, 1 << 30})
          if (!check(n)) throw new AssertionError("power rejected: " + n);
      }
    }`);
    const additionalChecks = fileURLToPath(new URL("./fixtures/AdditionalBlogChecks.java", import.meta.url));
    execFileSync("javac", ["--release", "17", "-d", dir, ...files, checks, additionalChecks, bitChecks], { stdio: "pipe" });
    execFileSync("java", ["-cp", dir, "MicroservicesExampleChecks"], { stdio: "pipe", timeout: 10000 });
    execFileSync("java", ["-cp", dir, "AdditionalBlogChecks"], { stdio: "pipe", timeout: 10000 });
    execFileSync("java", ["-cp", dir, "PowerOfTwoChecks"], { stdio: "pipe", timeout: 10000 });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
