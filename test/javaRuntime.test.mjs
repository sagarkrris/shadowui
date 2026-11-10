import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { javaTool } from '../scripts/validation/java-runtime.mjs';

const executable = name => process.platform === 'win32' ? `${name}.exe` : name;
test('Java validation uses the JDK provided by setup-java when no content override exists', () => {
  const home = join('ci tools', 'jdk-21');
  for (const name of ['java', 'javac']) assert.equal(javaTool(name, { JAVA_HOME: home }), join(home, 'bin', executable(name)));
});
test('an explicit content JDK wins, and an unconfigured environment uses PATH', () => {
  assert.equal(javaTool('javac', { CONTENT_JAVA_HOME: 'content-jdk', JAVA_HOME: 'other-jdk' }), join('content-jdk', 'bin', executable('javac')));
  assert.equal(javaTool('javac', {}), 'javac');
  assert.equal(javaTool('java', { CONTENT_JAVA_HOME: '', JAVA_HOME: '' }), 'java');
});
test('newer release labs select the separately installed Java 26 toolchain', () => {
  const environment = { JAVA_HOME: 'ci-jdk21', CONTENT_JAVA26_HOME: 'ci-jdk26' };
  assert.equal(javaTool('javac', environment, 21), join('ci-jdk21', 'bin', executable('javac')));
  assert.equal(javaTool('javac', environment, 26), join('ci-jdk26', 'bin', executable('javac')));
  assert.equal(javaTool('java', { JAVA_HOME: 'default-jdk26' }, 26), join('default-jdk26', 'bin', executable('java')));
});
