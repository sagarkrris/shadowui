import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { HIBERNATE_COURSE } from '../lib/hibernateCourse.mjs';
import { readInterviewTopic } from '../lib/interviewTopicContent.mjs';

test('expanded Hibernate answers resolve to course checkpoints', async () => {
  const { groups } = await readInterviewTopic('hibernate');
  const lessons = new Set(HIBERNATE_COURSE.lessons.map(item => HIBERNATE_COURSE.href + '#' + item.id));
  for (const { questions } of groups) {
    assert.ok(lessons.has(questions[0].course), questions[0].course);
    assert.ok(questions[0].answer.split(/\s+/).length >= 35, questions[0].question);
  }
});

test('published Hibernate labs and command-line capstone run against real Hibernate and H2', () => {
  const project = mkdtempSync(join(tmpdir(), 'hibernate-course-test-'));
  try {
    cpSync(new URL('../public/hibernate-lab/', import.meta.url), project, { recursive: true });
    const settings = fileURLToPath(new URL('./fixtures/spring-blog/settings.xml', import.meta.url));
    let result;
    try {
      result = execFileSync('mvn', ['-B', '-s', settings, 'test', 'exec:java'], {
        cwd: project, encoding: 'utf8', stdio: 'pipe', timeout: 180_000,
      });
    } catch (error) {
      assert.fail([error.message, error.stdout, error.stderr].filter(Boolean).join('\n'));
    }
    assert.match(result, /Tests run: 10, Failures: 0, Errors: 0, Skipped: 0/);
    assert.match(result, /Page statements: 2/);
    assert.match(result, /Stale update rejected/);
    assert.match(result, /Committed page: .*Confirmed order.*Empty order/);
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});
