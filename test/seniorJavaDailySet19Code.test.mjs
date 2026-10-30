import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('Set 19 published missing-positive placement agrees with independent membership oracle', async () => {
  const markdown = await readFile(new URL('../content/senior-java/daily/set-19.md', import.meta.url), 'utf8');
  const blocks = [...markdown.matchAll(/```java\n([\s\S]*?)```/g)];
  assert.equal(blocks.length, 1);
  const directory = await mkdtemp(path.join(tmpdir(), 'java-set19-'));
  const javaHome = process.env.JAVA_HOME || '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home';
  try {
    await writeFile(path.join(directory, 'MissingPositive.java'), blocks[0][1]);
    await writeFile(path.join(directory, 'Checks.java'), `
import java.util.*;
public class Checks {
 static long checks;
 static void check(boolean value) { checks++; if (!value) throw new AssertionError(checks); }
 static void verify(int[] input) {
  Set<Integer> present = new HashSet<>();
  for(int value: input) present.add(value);
  long expected=1;
  while(expected<=Integer.MAX_VALUE && present.contains((int)expected)) expected++;
  int[] copy=input.clone();
  check(MissingPositive.find(copy)==expected);
  int[] sorted=input.clone(); Arrays.sort(sorted); Arrays.sort(copy);
  check(Arrays.equals(sorted,copy));
 }
 static void enumerate(int[] a,int p) {
  if(p==a.length) { verify(a); return; }
  for(int v:new int[]{-1,0,1,2,3,4}) { a[p]=v; enumerate(a,p+1); }
 }
 public static void main(String[] args) {
  for(int n=0;n<=7;n++) enumerate(new int[n],0);
  verify(new int[]{Integer.MIN_VALUE,Integer.MAX_VALUE,1,1,2});
  Random random=new Random(19);
  for(int t=0;t<2000;t++) {
   int[] a=new int[random.nextInt(100)];
   for(int i=0;i<a.length;i++) a[i]=random.nextInt(130)-20;
   verify(a);
  }
  try { MissingPositive.find(null); throw new AssertionError(); }
  catch(NullPointerException expected) { checks++; }
  int[] chain=new int[1000000];
  for(int i=0;i<chain.length;i++) chain[i]=i+2;
  chain[chain.length-1]=1;
  check(MissingPositive.find(chain)==1000001L);
  for(int i=0;i<chain.length;i++) check(chain[i]==i+1);
  int[] raw={4,7};
  check(Arrays.asList(raw).size()==1);
  check(Arrays.stream(raw).boxed().toList().equals(List.of(4,7)));
  System.out.println(checks + " assertions");
 }
}`);
    execFileSync(path.join(javaHome, 'bin/javac'), ['--release', '21', 'MissingPositive.java', 'Checks.java'], { cwd: directory, timeout: 30000 });
    const output = execFileSync(path.join(javaHome, 'bin/java'), ['-cp', directory, 'Checks'], { cwd: directory, timeout: 30000, encoding: 'utf8' });
    assert.match(output, /assertions/);
    console.log(output.trim());
  } finally { await rm(directory, { recursive: true, force: true }); }
});
