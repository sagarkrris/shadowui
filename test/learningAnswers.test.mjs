import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { tokenizeJava } from '../lib/learningCode.mjs';
import { JAVA_FOUNDATION_CHAPTERS, JAVA_EXAMPLE_OVERRIDES } from '../lib/javaBeginnerExamples.mjs';
import { JAVA_TUTORIAL_CATALOG, JAVA_EDITORIAL_CHAPTERS, getJavaTutorialBySlug } from '../lib/javaDigest.mjs';

test('every tutorial uses authored glance detail without inheriting category filler', () => {
  for (const tutorial of JAVA_TUTORIAL_CATALOG) {
    const authored = { ...(JAVA_EDITORIAL_CHAPTERS[tutorial.title] || JAVA_FOUNDATION_CHAPTERS[tutorial.title]), ...(JAVA_EXAMPLE_OVERRIDES[tutorial.title] || {}) };
    assert.ok(tutorial.atAGlance.takeaway.trim(), tutorial.title);
    assert.ok(tutorial.atAGlance.takeaway.split(/\s+/).length <= 90, tutorial.title);
    for (const field of ['why', 'failure', 'complexity', 'edgeCases']) {
      assert.equal(tutorial.atAGlance[field], authored[field] || null, `${tutorial.title}: ${field}`);
    }
    assert.equal(tutorial.atAGlance.example, authored.workedExample || null);
  }
});

test('JDK lesson separates runnable source, shell commands, packaging and follow-up', () => {
  const lesson = getJavaTutorialBySlug('jdk-vs-jre-vs-jvm');
  assert.match(lesson.example, /public class Greeting/);
  assert.doesNotMatch(lesson.example, /javac Greeting|java Greeting|Expected behavior:/);
  assert.deepEqual(lesson.exampleCommands.map(command => command.code), ['javac Greeting.java', 'java Greeting']);
  assert.equal(lesson.output, 'Hello from the JVM');
  assert.match(lesson.atAGlance.note, /Oracle.*JDK 11/);
  assert.match(lesson.atAGlance.followUp, /--release.*Third-party dependencies/s);
  assert.equal(lesson.atAGlance.why, null);
  assert.equal(lesson.atAGlance.edgeCases, null);
});

test('Java highlighting preserves whitespace and treats strings/comments as opaque text', () => {
  const source = 'public class Greeting {\n  String s = "<script>class 42</script>"; // return 10\n  /* static 99 */ int n = 12;\n}\n';
  const tokens = tokenizeJava(source);
  assert.equal(tokens.map(token => token.text).join(''), source);
  assert.deepEqual(tokens.filter(token => token.kind === 'keyword').map(token => token.text), ['public', 'class', 'int']);
  assert.deepEqual(tokens.filter(token => token.kind === 'number').map(token => token.text), ['12']);
  assert.equal(tokens.find(token => token.kind === 'string').text, '"<script>class 42</script>"');
  for (const text of ['', '// final comment', 'String s = "escaped \\" quote";', 'String s = """\nclass 42\n""";']) {
    assert.equal(tokenizeJava(text).map(token => token.text).join(''), text);
  }
});


test('published JDK source compiles and runs using the displayed commands', () => {
  const lesson = getJavaTutorialBySlug('jdk-vs-jre-vs-jvm');
  const directory = mkdtempSync(join(tmpdir(), 'learning-jdk-'));
  const javaHome = process.env.CONTENT_JAVA_HOME || process.env.JAVA_HOME;
  try {
    writeFileSync(join(directory, 'Greeting.java'), lesson.example);
    for (const [index, command] of lesson.exampleCommands.entries()) {
      const [binary, ...args] = command.code.split(' ');
      const result = execFileSync(javaHome ? join(javaHome, 'bin', binary) : binary, args, { cwd: directory, encoding: 'utf8', timeout: 20000 });
      assert.equal(result.trim(), index === 0 ? '' : lesson.output);
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
