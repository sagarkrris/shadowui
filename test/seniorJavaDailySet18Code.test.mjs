import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('Set 18 published permutation matches independently enumerated distinct orderings', async () => {
  const markdown = await readFile(new URL('../content/senior-java/daily/set-18.md', import.meta.url), 'utf8');
  const blocks = [...markdown.matchAll(/```java\n([\s\S]*?)```/g)];
  assert.equal(blocks.length, 1);
  const directory = await mkdtemp(path.join(tmpdir(), 'java-set18-'));
  const javaHome = process.env.JAVA_HOME || '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home';
  try {
    await writeFile(path.join(directory, 'NextPermutation.java'), blocks[0][1]);
    await writeFile(path.join(directory, 'Checks.java'), `
import java.util.*;
public class Checks {
 static long checks;
 static void check(boolean value) { checks++; if (!value) throw new AssertionError(checks); }
 static final Map<String, TreeSet<int[]>> groups = new HashMap<>();
 static void enumerate(int[] a, int position) {
  if(position == a.length) {
   int[] sorted = a.clone(); Arrays.sort(sorted);
   groups.computeIfAbsent(Arrays.toString(sorted), k -> new TreeSet<>(Arrays::compare)).add(a.clone());
   return;
  }
  for(int value : new int[]{Integer.MIN_VALUE, 0, Integer.MAX_VALUE}) {
   a[position] = value; enumerate(a, position + 1);
  }
 }
 public static void main(String[] args) {
  for(int length=0; length<=8; length++) enumerate(new int[length],0);
  for(TreeSet<int[]> group : groups.values()) {
   List<int[]> ordered = new ArrayList<>(group);
   for(int i=0; i<ordered.size(); i++) {
    int[] actual = ordered.get(i).clone();
    check(NextPermutation.advance(actual) == (i+1<ordered.size()));
    check(Arrays.equals(actual, ordered.get((i+1)%ordered.size())));
   }
  }
  try { NextPermutation.advance(null); throw new AssertionError(); }
  catch(NullPointerException expected) { checks++; }
  int[] descending = new int[1000000];
  for(int i=0;i<descending.length;i++) descending[i]=descending.length-i;
  check(!NextPermutation.advance(descending));
  for(int i=0;i<descending.length;i++) check(descending[i]==i+1);
  System.out.println(checks + " assertions");
 }
}`);
    execFileSync(path.join(javaHome, 'bin/javac'), ['--release', '21', 'NextPermutation.java', 'Checks.java'], { cwd: directory, timeout: 30000 });
    const output = execFileSync(path.join(javaHome, 'bin/java'), ['-cp', directory, 'Checks'], { cwd: directory, timeout: 30000, encoding: 'utf8' });
    assert.match(output, /assertions/);
    console.log(output.trim());
  } finally { await rm(directory, { recursive: true, force: true }); }
});
