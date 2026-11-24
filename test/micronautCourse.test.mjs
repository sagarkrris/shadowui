import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { MICRONAUT_COURSE } from '../lib/micronautCourse.mjs';
import { readInterviewTopic } from '../lib/interviewTopicContent.mjs';

test('expanded Java and Micronaut answers link to the course checkpoint they teach', async () => {
  const anchors = new Set(MICRONAUT_COURSE.lessons.map(lesson => MICRONAUT_COURSE.href + '#' + lesson.id));
  const [micronaut, java] = await Promise.all([readInterviewTopic('micronaut'), readInterviewTopic('java')]);
  const expanded = [
    ...micronaut.groups.map(group => group.questions[0]),
    ...java.groups.flatMap(group => group.questions).filter(entry => entry.course?.startsWith(MICRONAUT_COURSE.href)),
  ];
  assert.ok(expanded.length > micronaut.groups.length, 'Java bridge answers must be discoverable');
  for (const entry of expanded) {
    assert.ok(anchors.has(entry.course), entry.question);
    assert.ok(entry.answer.split(/\s+/).length >= 35, entry.question);
  }
});

test('the published Java and Micronaut labs run generated beans, HTTP and real JDBC', () => {
  const project = mkdtempSync(join(tmpdir(), 'micronaut-course-test-'));
  try {
    cpSync(new URL('../public/micronaut-lab/', import.meta.url), project, { recursive: true });
    const settings = fileURLToPath(new URL('./fixtures/spring-blog/settings.xml', import.meta.url));
    let result;
    try {
      result = execFileSync('mvn', ['-B', '-s', settings, 'test'], {
        cwd: project, encoding: 'utf8', stdio: 'pipe', timeout: 180_000,
      });
    } catch (error) {
      assert.fail([error.message, error.stdout, error.stderr].filter(Boolean).join('\n'));
    }
    assert.match(result, /Tests run: 7, Failures: 0, Errors: 0, Skipped: 0/);
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});
