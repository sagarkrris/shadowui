import { javaTool } from '../scripts/validation/java-runtime.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { JAVA_CURATED_TUTORIAL_CATALOG as course } from '../lib/javaDigest.mjs';

const execute = (command, args, cwd) => {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 300000 });
  assert.equal(result.status, 0, result.stderr || result.stdout || result.error?.message);
  return result.stdout.trim();
};

test('every published complete source compiles at its declared release and produces its shown output', { timeout: 420000 }, () => {
  execute(process.execPath, ['scripts/validation/check-java-content.mjs']);
});

const checks = {
  'Classes and objects': 'LessonExample.Counter a=new LessonExample.Counter(),b=new LessonExample.Counter(); a.increment(); if(a.value!=1 || b.value!=0)throw new AssertionError();',
  'Null and references': 'LessonExample.Counter a=new LessonExample.Counter(); LessonExample.Counter b=a; b.value=7; a=null; if(b.value!=7)throw new AssertionError();',
  'Topological sorting': 'if(!LessonExample.order(new int[][]{{1},{0},{}}).isEmpty())throw new AssertionError("partial cycle output"); java.util.List<Integer> order=LessonExample.order(new int[][]{{1},{},{}}); if(order.size()!=3 || order.indexOf(0)>order.indexOf(1))throw new AssertionError(); if(!LessonExample.order(new int[][]{}).isEmpty())throw new AssertionError();',
  'Union-find': 'LessonExample.DisjointSet d=new LessonExample.DisjointSet(3); d.union(0,1); d.union(0,1); if(!d.connected(0,1) || d.connected(0,2) || d.size[d.find(0)]!=2)throw new AssertionError();',
  'Builder pattern': 'LessonExample.Builder b=new LessonExample.Builder().title("Daily"); LessonExample.Report r=b.build(); b.title("Changed"); if(!r.title.equals("Daily"))throw new AssertionError(); try{new LessonExample.Builder().title(" ").build();throw new AssertionError();}catch(IllegalArgumentException expected){}',
  'Factory pattern': 'if(!LessonExample.forFormat("upper").format("java").equals("JAVA"))throw new AssertionError(); try{LessonExample.forFormat("unknown");throw new AssertionError();}catch(IllegalArgumentException expected){}',
  'Strategy pattern': 'if(new LessonExample.Seasonal().apply(Integer.MAX_VALUE)!=1932735282)throw new AssertionError("intermediate overflow"); try{new LessonExample.Seasonal().apply(-1);throw new AssertionError();}catch(IllegalArgumentException expected){}',
  'Methods and parameters': 'int caller=4; if(LessonExample.twice(caller)!=8 || caller!=4 || LessonExample.twice(-3)!=-6) throw new AssertionError();',
  'Constructors': 'for(int bad:new int[]{-1,0,65536}) { try { new LessonExample.Port(bad); throw new AssertionError(); } catch(IllegalArgumentException expected) {} } if(new LessonExample.Port(1).value!=1 || new LessonExample.Port(65535).value!=65535) throw new AssertionError();',
  'Inheritance': 'LessonExample.Account base=new LessonExample.Account(); LessonExample.Account child=new LessonExample.SavingsAccount(); if(base.fee()!=5 || child.fee()!=0) throw new AssertionError();',
  'Generics': 'LessonExample.Box<String> box=new LessonExample.Box<>(); box.put("java"); if(!box.get().equals("java")) throw new AssertionError();',
  'Two pointers': 'if(LessonExample.hasPair(new int[]{Integer.MAX_VALUE,Integer.MAX_VALUE},-2) || !LessonExample.hasPair(new int[]{-3,0,3},0) || LessonExample.hasPair(new int[]{},0)) throw new AssertionError();',
  'Binary search': 'if(LessonExample.firstAtLeast(new int[]{},2)!=0 || LessonExample.firstAtLeast(new int[]{2,2,2},2)!=0 || LessonExample.firstAtLeast(new int[]{1,3},4)!=2) throw new AssertionError();',
  'Sliding window': 'if(LessonExample.longestAtMostTwoDistinct("")!=0 || LessonExample.longestAtMostTwoDistinct("eceba")!=3) throw new AssertionError();',
  'Dynamic programming': 'if(LessonExample.fib(0)!=0 || LessonExample.fib(46)!=1836311903) throw new AssertionError(); try { LessonExample.fib(47); throw new AssertionError(); } catch(IllegalArgumentException expected) {}',
  'Regular expressions': '',
};
for (const [title, body] of Object.entries(checks)) test(`${title}: published implementation satisfies its boundary contract`, () => {
  const dir = mkdtempSync(join(tmpdir(), 'java-curriculum-boundary-'));
  try {
    const lesson = course.find(lesson => lesson.title === title);
    writeFileSync(join(dir, 'LessonExample.java'), lesson.runnableExample.source);
    // Exercise the actual published regex rather than a test-owned copy.
    const checkedBody = title === 'Regular expressions' ? lesson.example.split('\n')[0].replace('Pattern email', 'java.util.regex.Pattern email').replace('Pattern.compile', 'java.util.regex.Pattern.compile') + '\nif (!email.matcher("a@example.com").matches() || email.matcher("a b@example.com").matches() || email.matcher("a@example.com ").matches()) throw new AssertionError();' : body;
    writeFileSync(join(dir, 'Checks.java'), `public class Checks { public static void main(String[] args) { ${checkedBody} } }`);
    execute(javaTool('javac'), ['--release', String(lesson.runnableExample.release), '-d', dir, 'LessonExample.java', 'Checks.java'], dir);
    execute(javaTool('java'), ['-cp', dir, 'Checks'], dir);
    if (title === 'Generics') {
      writeFileSync(join(dir, 'Invalid.java'), 'class Invalid { void invalid() { LessonExample.Box<String> box=new LessonExample.Box<>(); box.put(42); } }');
      const invalid = spawnSync(javaTool('javac'), ['-cp', dir, 'Invalid.java'], { cwd: dir, encoding: 'utf8' });
      assert.notEqual(invalid.status, 0, 'wrong element type must fail before runtime');
      assert.match(invalid.stderr, /incompatible types/);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
