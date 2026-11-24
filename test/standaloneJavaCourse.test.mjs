import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, isAbsolute, join } from 'node:path';
import test from 'node:test';
import { readInterviewTopic } from '../lib/interviewTopicContent.mjs';
import { STANDALONE_JAVA_COURSE } from '../lib/standaloneJavaCourse.mjs';
import { javaTool } from '../scripts/validation/java-runtime.mjs';

test('expanded standalone Java answers point to actual course checkpoints', async () => {
  const { groups } = await readInterviewTopic('java');
  const expanded = groups.flatMap(group => group.questions)
    .filter(question => question.course?.startsWith(STANDALONE_JAVA_COURSE.href + '#'));
  const anchors = new Set(STANDALONE_JAVA_COURSE.lessons.map(lesson => STANDALONE_JAVA_COURSE.href + '#' + lesson.id));
  assert.equal(expanded.length, 35);
  for (const question of expanded) {
    assert.ok(anchors.has(question.course), question.question);
    assert.ok(question.answer.split(/\s+/).length >= 35, question.question);
  }
});

test('published JDK-only labs and packaged indexer run with persisted results and JFR', () => {
  const project = mkdtempSync(join(tmpdir(), 'java-indexer-course-test-'));
  try {
    cpSync(new URL('../public/java-indexer-lab/', import.meta.url), project, { recursive: true });
    const java = javaTool('java');
    const env = isAbsolute(java)
      ? { ...process.env, PATH: dirname(java) + delimiter + process.env.PATH }
      : process.env;
    const output = execFileSync('sh', ['verify.sh'], { cwd: project, env, encoding: 'utf8', timeout: 120_000 });
    for (const proof of ['Language lab passed', 'Concurrency lab passed', 'Indexer lab passed', 'JVM lab passed', 'Packaged CLI passed']) {
      assert.match(output, new RegExp(proof));
    }
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});
