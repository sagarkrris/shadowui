import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listTechBlogs } from '../lib/techBlogs.mjs';

function runPublishedExamples(mutate = source => source) {
  const course = listTechBlogs().find(blog => blog.id === 'java-webhooks-production');
  assert.ok(course); assert.equal(course.javaRelease, 17); assert.equal(course.chapters.length, 6);
  const directory = mkdtempSync(join(tmpdir(), 'webhook-blog-'));
  try {
    const sources = course.chapters.map((chapter, index) => { const file = join(directory, `Example${index}.java`); writeFileSync(file, mutate(chapter.example)); return file; });
    const fixture = fileURLToPath(new URL('./fixtures/WebhookExampleChecks.java', import.meta.url));
    execFileSync('javac', ['--release', '17', '-d', directory, ...sources, fixture], { stdio: 'pipe', timeout: 30_000 });
    try {
      const output = execFileSync('java', ['-cp', directory, 'WebhookExampleChecks'], { encoding: 'utf8', stdio: 'pipe', timeout: 15_000 });
      assert.match(output, /Webhook checks passed/);
      return true;
    } catch (error) {
      // Compilation errors/timeouts do not count as detecting a semantic mutation.
      assert.equal(error.status, 1);
      assert.match(String(error.stderr), /java.lang.AssertionError/);
      return false;
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
}

test('webhook published Java 17 examples enforce authenticated bytes and independent effect/ack states', () => {
  assert.equal(runPublishedExamples(), true);
});

for (const [name, before, after] of [
  ['unbound signature comparison', 'MessageDigest.isEqual(expected, supplied)', 'MessageDigest.isEqual(supplied, supplied)'],
  ['unsigned timestamp', 'mac.update((Long.toString(sentAt) + ".").getBytes(StandardCharsets.US_ASCII));', '// Timestamp omitted'],
  ['rollback permits unknown redispatch', 'case UNKNOWN -> Outcome.RECONCILE;', 'case UNKNOWN -> Outcome.RETRY_DELIVERY;'],
  ['lost inbound ack erases known result', 'terminalResultDurable ? Outcome.COMPLETE : Outcome.PERSIST_RESULT', 'terminalResultDurable && ack == Ack.RECEIVED ? Outcome.COMPLETE : Outcome.RECONCILE'],
]) {
  test(`webhook fixture rejects mutation: ${name}`, () => {
    let changed = false;
    assert.equal(runPublishedExamples(source => {
      if (!source.includes(before)) return source;
      changed = true;
      return source.replace(before, after);
    }), false);
    assert.equal(changed, true, 'mutation must change a published snippet');
  });
}
