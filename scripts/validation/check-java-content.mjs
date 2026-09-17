import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { JAVA_TUTORIAL_CATALOG } from '../../lib/javaDigest.mjs';
const directory = await mkdtemp(join(tmpdir(), 'interviewiq-java-'));
const javaHome = process.env.CONTENT_JAVA_HOME || '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home';
const imports = 'import java.util.*; import java.util.regex.*; import java.util.concurrent.*; import java.util.concurrent.atomic.*; import java.time.*; import java.nio.file.*; import java.nio.charset.*; import java.io.*; import java.util.function.*;';
const direct = new Set(['Primitive types','Wrapper classes','Casting and promotion','Control flow','Enums','Records','String immutability','StringBuilder','Regular expressions','Arrays','ArrayList','LinkedList','HashSet','TreeSet','HashMap','TreeMap','PriorityQueue','ArrayDeque','equals and hashCode','Comparable and Comparator','Type erasure','Lambda expressions','Functional interfaces','Date and time API','Files and Paths','Threads','Atomics and CAS','CompletableFuture','Range queries']);
const methods = {
  'Two pointers': { test: 'if (hasPair(new int[]{Integer.MAX_VALUE,Integer.MAX_VALUE},-2)) throw new AssertionError("overflow"); if (!hasPair(new int[]{-3,0,3},0) || hasPair(new int[]{},0)) throw new AssertionError();', output: '' },
  'Binary search': { test: 'if (firstAtLeast(new int[]{},2)!=0 || firstAtLeast(new int[]{2,2,2},2)!=0 || firstAtLeast(new int[]{1,3},4)!=2) throw new AssertionError();', output: '' },
  'Sliding window': { test: 'if (longestAtMostTwoDistinct("")!=0 || longestAtMostTwoDistinct("eceba")!=3 || longestAtMostTwoDistinct("aa")!=2) throw new AssertionError();', output: '' },
  'Dynamic programming': { test: 'if (fib(0)!=0 || fib(46)!=1836311903) throw new AssertionError(); try { fib(47); throw new AssertionError(); } catch(IllegalArgumentException expected) {}', output: '' },
  'Big-O reasoning': { test: 'if (contains(new int[]{},1) || !contains(new int[]{1},1)) throw new AssertionError();', output: '' },
};
const report = { createdAt: new Date().toISOString(), entries: [] };
for (const lesson of JAVA_TUTORIAL_CATALOG) {
  const fields = ['walkthrough','example','output','diagram','javaVersions','references'];
  const missing = fields.filter(key => !lesson[key]?.length);
  if (missing.length) throw new Error(`${lesson.title}: missing ${missing.join(', ')}`);
  let source, className = 'Sample', expected = lesson.output;
  if (lesson.title === 'JDK vs JRE vs JVM') { source = lesson.example; className = 'Greeting'; }
  else if (lesson.title === 'Enums') source = `${imports} public class Sample { enum Status { NEW, PAID, CANCELLED } public static void main(String[] args) { ${lesson.example.split('\n').slice(1).join('\n')}\n } }`;
  else if (direct.has(lesson.title)) source = `${imports}\npublic class Sample { public static void main(String[] args) throws Exception {\n${lesson.example}\n} }`;
  else if (methods[lesson.title]) { source = `${imports}\npublic class Sample { ${lesson.example.replace(/^(boolean|int) /, 'static $1 ')}\n public static void main(String[] args) { ${methods[lesson.title].test} } }`; expected = methods[lesson.title].output; }
  else { report.entries.push({ title: lesson.title, status: 'contextual-snippet', note: 'Requires application types, infrastructure, a harness, or describes behavior rather than console output.' }); continue; }
  const file = join(directory, `${className}.java`);
  await writeFile(file, source);
  const release = /^\d+/.exec(lesson.javaVersions)?.[0] || '8';
  const compile = spawnSync(join(javaHome, 'bin/javac'), ['--release', release, '-d', directory, file], { encoding: 'utf8', timeout: 20000 });
  const run = compile.status === 0 ? spawnSync(join(javaHome, 'bin/java'), ['-cp', directory, className], { cwd: directory, encoding: 'utf8', timeout: 10000 }) : null;
  const passed = compile.status === 0 && run?.status === 0 && run.stdout.trim() === expected;
  report.entries.push({ title: lesson.title, status: passed ? 'executed' : 'failed', release, ...(passed ? {} : { error: compile.stderr || run?.stderr || `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(run?.stdout)}` }) });
}
report.executed = report.entries.filter(e => e.status === 'executed').length;
report.failed = report.entries.filter(e => e.status === 'failed');
await writeFile(process.argv[2] || '/private/tmp/shadow-content-audit.json', JSON.stringify(report, null, 2));
console.log(`${report.entries.length} chapters inventoried; ${report.executed} compiled/executed; ${report.failed.length} failed.`);
for (const failure of report.failed) console.log(failure.title, failure.error);
process.exitCode = report.failed.length ? 1 : 0;
