import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('Set 22 published GCD and compaction match independent oracles', async () => {
  const markdown = await readFile(new URL('../content/senior-java/daily/set-22.md', import.meta.url), 'utf8');
  const blocks = [...markdown.matchAll(/```java\n([\s\S]*?)```/g)];
  assert.equal(blocks.length, 2);
  const directory = await mkdtemp(path.join(tmpdir(), 'java-set22-'));
  const javaHome = process.env.JAVA_HOME || '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home';
  try {
    await writeFile(path.join(directory, 'SignedGcd.java'), blocks[0][1]);
    await writeFile(path.join(directory, 'SortedCompact.java'), blocks[1][1]);
    await writeFile(path.join(directory, 'Checks.java'), `
import java.util.*;
import java.math.BigInteger;
public class Checks {
 static long checks;
 static void check(boolean v) { checks++; if(!v) throw new AssertionError(checks); }
 static void compact(int[] input) {
  Arrays.sort(input);
  int[] expected=Arrays.stream(input).distinct().toArray();
  int n=SortedCompact.unique(input);
  check(n==expected.length);
  check(Arrays.equals(Arrays.copyOf(input,n),expected));
 }
 static void enumerate(int[] a,int i) {
  if(i==a.length) { compact(a.clone()); return; }
  for(int v=-2;v<=2;v++) { a[i]=v; enumerate(a,i+1); }
 }
 static void gcd(int a,int b) {
  long expected=BigInteger.valueOf(a).gcd(BigInteger.valueOf(b)).longValueExact();
  check(SignedGcd.gcd(a,b)==expected);
 }
 public static void main(String[] args) {
  for(int n=0;n<=7;n++) enumerate(new int[n],0);
  int[] edges={Integer.MIN_VALUE,Integer.MAX_VALUE,-1,0,1,-18,24};
  for(int a:edges) for(int b:edges) gcd(a,b);
  Random random=new Random(22);
  for(int i=0;i<10000;i++) gcd(random.nextInt(),random.nextInt());
  compact(edges.clone());
  int[] invalid={1,1,2,0}; int[] before=invalid.clone();
  try { SortedCompact.unique(invalid); throw new AssertionError(); }
  catch(IllegalArgumentException expected) { check(Arrays.equals(invalid,before)); }
  try { SortedCompact.unique(null); throw new AssertionError(); }
  catch(NullPointerException expected) { check(true); }
  System.out.println(checks+" assertions");
 }
}`);
    execFileSync(path.join(javaHome, 'bin/javac'), ['--release', '21', 'SignedGcd.java', 'SortedCompact.java', 'Checks.java'], { cwd: directory, timeout: 30000 });
    const output = execFileSync(path.join(javaHome, 'bin/java'), ['-cp', directory, 'Checks'], { cwd: directory, timeout: 30000, encoding: 'utf8' });
    assert.match(output, /assertions/);
    console.log(output.trim());
  } finally { await rm(directory, { recursive: true, force: true }); }
});
