import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listTechBlogs } from '../../lib/techBlogs.mjs';
import { COURSE_DEMOS, COURSE_DEMO_ASSIGNMENTS } from '../../lib/courseDemos.mjs';
import { COURSE_DIAGRAMS, BLOG_OVERVIEW_DIAGRAMS, BLOG_OVERVIEW_KINDS } from '../../lib/techBlogDiagrams.mjs';
import { BUILD_CHALLENGES } from '../../lib/buildChallenges.mjs';

// Explicit fixtures, not a compilation-only fallback. A new javaRelease course must register here.
export const JAVA_BLOG_FIXTURES = {
  'java-background-jobs': 'BackgroundJobsChecks',
  'java-connection-pools': 'ConnectionPoolExampleChecks',
  'java-rate-limiting': 'RateLimitingExampleChecks',
  'java-service-networking': 'NetworkingExampleChecks',
  'java-multithreading-production': 'MultithreadingExampleChecks',
  'java-file-uploads-production': 'FileUploadsExampleChecks',
  'java-feature-flags-production': 'FeatureFlagsExampleChecks',
  'java-money-production': 'MoneyExampleChecks',
};

export function validateTechBlogCatalog(blogs = listTechBlogs(), assignments = COURSE_DEMO_ASSIGNMENTS, fixtures = JAVA_BLOG_FIXTURES) {
  assert.ok(blogs.length, 'Empty tech-blog catalog');
  const ids = blogs.map(blog => blog.id);
  assert.equal(new Set(ids).size, ids.length, 'Duplicate course ids');
  assert.deepEqual(Object.keys(assignments).sort(), [...ids].sort(), 'Every course needs an explicit demo assignment');
  assert.deepEqual(Object.keys(fixtures).sort(), blogs.filter(blog => blog.javaRelease).map(blog => blog.id).sort(),
    'Every declared Java course needs a behavioral fixture; fixture courses must declare javaRelease');
  for (const blog of blogs) {
    assert.match(blog.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(blog.title && blog.summary && blog.chapters?.length, `${blog.id}: incomplete catalog entry`);
    assert.ok(BLOG_OVERVIEW_KINDS[blog.id] || COURSE_DIAGRAMS[BLOG_OVERVIEW_DIAGRAMS[blog.id]], `${blog.id}: missing overview`);
    assert.ok(assignments[blog.id].length, `${blog.id}: empty demos`);
    for (const demo of assignments[blog.id]) assert.ok(COURSE_DEMOS[demo], `${blog.id}: unknown demo ${demo}`);
    assert.equal(new Set(blog.chapters.map(c => c.title)).size, blog.chapters.length, `${blog.id}: duplicate chapter titles`);
    for (const chapter of blog.chapters) {
      for (const field of ['title', 'lesson', 'example', 'exercise', 'quiz', 'whenToUse', ...(blog.format === 'field-note' ? [] : ['answer', 'avoid'])]) {
        assert.ok(typeof chapter[field] === 'string' && chapter[field].trim(), `${blog.id}/${chapter.title}: missing ${field}`);
      }
      assert.ok(chapter.diagram || chapter.diagramKey, `${blog.id}/${chapter.title}: no visual explanation`);
      if (chapter.diagramKey) assert.ok(COURSE_DIAGRAMS[chapter.diagramKey], `${blog.id}: unknown chapter diagram`);
    }
  }
  for (const challenge of BUILD_CHALLENGES) assert.ok(ids.includes(challenge.lesson), `${challenge.id}: broken lesson link`);
  return ids;
}

export function verifyPublishedJava(blogs = listTechBlogs()) {
  validateTechBlogCatalog(blogs);
  return blogs.filter(blog => blog.javaRelease).map(blog => {
    const directory = mkdtempSync(join(tmpdir(), 'tech-blog-java-'));
    try {
      const sources = blog.chapters.map((chapter, index) => {
        assert.ok(!chapter.exampleRuntime, `${blog.id}: mixed runtime requires a dedicated verifier`);
        const source = join(directory, `Chapter${index}.java`);
        writeFileSync(source, chapter.example);
        return source;
      });
      const main = JAVA_BLOG_FIXTURES[blog.id];
      const fixture = fileURLToPath(new URL(`../../test/fixtures/${main}.java`, import.meta.url));
      execFileSync('javac', ['--release', String(blog.javaRelease), '-d', directory, ...sources, fixture], { timeout: 30000, stdio: 'pipe' });
      const output = execFileSync('java', ['-cp', directory, main], { timeout: 15000, encoding: 'utf8' }).trim();
      console.log(`Verified ${blog.id}: ${sources.length} published examples, Java ${blog.javaRelease}, ${main}: ${output}`);
      return { courseId: blog.id, javaRelease: blog.javaRelease, publishedExamples: sources.length, fixture: main, output };
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
}
