import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('Set 23 published array transformations match independent output oracles', async () => {
  const markdown = await readFile(new URL('../content/senior-java/daily/set-23.md', import.meta.url), 'utf8');
  const blocks = [...markdown.matchAll(/```java\n([\s\S]*?)```/g)];
  assert.equal(blocks.length, 2);
  const directory = await mkdtemp(path.join(tmpdir(), 'java-set23-'));
  const javaHome = process.env.JAVA_HOME || '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home';
  try {
    await writeFile(path.join(directory, 'MoveZeros.java'), blocks[0][1]);
    await writeFile(path.join(directory, 'RotateRight.java'), blocks[1][1]);
    await writeFile(path.join(directory, 'Checks.java'), `
import java.util.*;
public class Checks {
 static long checks;
 static void check(boolean v) { checks++; if(!v) throw new AssertionError(checks); }
 static void verify(int[] input) {
  List<Integer> expected=new ArrayList<>();
  for(int x:input) if(x!=0) expected.add(x);
  while(expected.size()<input.length) expected.add(0);
  int[] moved=input.clone(); MoveZeros.move(moved);
  check(Arrays.equals(moved,expected.stream().mapToInt(Integer::intValue).toArray()));
  for(long d:new long[]{0,1,2,7,100,Long.MAX_VALUE}) {
   int[] rotated=input.clone(), oracle=new int[input.length];
   if(input.length>0) for(int i=0;i<input.length;i++)
    oracle[(int)((i+d%input.length)%input.length)]=input[i];
   RotateRight.rotate(rotated,d); check(Arrays.equals(rotated,oracle));
  }
  int[] invalid=input.clone();
  try { RotateRight.rotate(invalid,-1); throw new AssertionError(); }
  catch(IllegalArgumentException e) { check(Arrays.equals(invalid,input)); }
 }
 static void enumerate(int[] a,int i) {
  if(i==a.length) { verify(a); return; }
  for(int v=-2;v<=2;v++) { a[i]=v; enumerate(a,i+1); }
 }
 public static void main(String[] args) {
  for(int n=0;n<=6;n++) enumerate(new int[n],0);
  verify(new int[]{Integer.MIN_VALUE,0,Integer.MAX_VALUE,0});
  try { MoveZeros.move(null); throw new AssertionError(); } catch(NullPointerException e) { check(true); }
  try { RotateRight.rotate(null,0); throw new AssertionError(); } catch(NullPointerException e) { check(true); }
  System.out.println(checks+" assertions");
 }
}`);
    execFileSync(path.join(javaHome, 'bin/javac'), ['--release', '21', 'MoveZeros.java', 'RotateRight.java', 'Checks.java'], { cwd: directory, timeout: 30000 });
    const output = execFileSync(path.join(javaHome, 'bin/java'), ['-cp', directory, 'Checks'], { cwd: directory, timeout: 30000, encoding: 'utf8' });
    assert.match(output, /assertions/);
    console.log(output.trim());
  } finally { await rm(directory, { recursive: true, force: true }); }
});
