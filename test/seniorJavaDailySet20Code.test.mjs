import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('Set 20 published two-worker schedule agrees with exhaustive assignment oracle', async () => {
  const markdown = await readFile(new URL('../content/senior-java/daily/set-20.md', import.meta.url), 'utf8');
  const blocks = [...markdown.matchAll(/```java\n([\s\S]*?)```/g)];
  assert.equal(blocks.length, 1);
  const directory = await mkdtemp(path.join(tmpdir(), 'java-set20-'));
  const javaHome = process.env.JAVA_HOME || '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home';
  try {
    await writeFile(path.join(directory, 'TwoWorkers.java'), blocks[0][1]);
    await writeFile(path.join(directory, 'Checks.java'), `
import java.util.*;
public class Checks {
 static long checks;
 static void check(boolean v) { checks++; if(!v) throw new AssertionError(checks); }
 static void verify(int[] a) {
  int sum=Arrays.stream(a).sum(), expected=Integer.MAX_VALUE;
  for(int mask=0;mask<(1<<a.length);mask++) {
   int first=0;
   for(int i=0;i<a.length;i++) if((mask&(1<<i))!=0) first+=a[i];
   expected=Math.min(expected,Math.max(first,sum-first));
  }
  int[] copy=a.clone();
  check(TwoWorkers.minimumFinish(a)==expected);
  check(Arrays.equals(a,copy));
 }
 static void enumerate(int[] a,int i) {
  if(i==a.length) { verify(a); return; }
  for(int v=0;v<4;v++) { a[i]=v; enumerate(a,i+1); }
 }
 public static void main(String[] args) {
  for(int n=0;n<=7;n++) enumerate(new int[n],0);
  verify(new int[]{8,7,6,5,4});
  Random r=new Random(20);
  for(int t=0;t<1000;t++) {
   int[] a=new int[r.nextInt(12)];
   for(int i=0;i<a.length;i++) a[i]=r.nextInt(100);
   verify(a);
  }
  check(TwoWorkers.minimumFinish(new int[]{1000000})==1000000);
  check(TwoWorkers.minimumFinish(new int[]{500000,500000})==500000);
  for(int[] a:new int[][]{{-1},{1000001},{Integer.MAX_VALUE}}) {
   try { TwoWorkers.minimumFinish(a); throw new AssertionError(); }
   catch(IllegalArgumentException expected) { checks++; }
  }
  try { TwoWorkers.minimumFinish(null); throw new AssertionError(); }
  catch(NullPointerException expected) { checks++; }
  System.out.println(checks+" assertions");
 }
}`);
    execFileSync(path.join(javaHome, 'bin/javac'), ['--release', '21', 'TwoWorkers.java', 'Checks.java'], { cwd: directory, timeout: 30000 });
    const output = execFileSync(path.join(javaHome, 'bin/java'), ['-cp', directory, 'Checks'], { cwd: directory, timeout: 30000, encoding: 'utf8' });
    assert.match(output, /assertions/);
    console.log(output.trim());
  } finally { await rm(directory, { recursive: true, force: true }); }
});
