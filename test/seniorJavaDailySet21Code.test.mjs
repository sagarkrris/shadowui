import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('Set 21 published searches and grid counts match independent oracles', async () => {
  const markdown = await readFile(new URL('../content/senior-java/daily/set-21.md', import.meta.url), 'utf8');
  const blocks = [...markdown.matchAll(/```java\n([\s\S]*?)```/g)];
  assert.equal(blocks.length, 2);
  const directory = await mkdtemp(path.join(tmpdir(), 'java-set21-'));
  const javaHome = process.env.JAVA_HOME || '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home';
  try {
    await writeFile(path.join(directory, 'LowerBound.java'), blocks[0][1]);
    await writeFile(path.join(directory, 'GridPaths.java'), blocks[1][1]);
    await writeFile(path.join(directory, 'Checks.java'), `
import java.util.*;
import java.math.BigInteger;
public class Checks {
 static long checks;
 static void check(boolean v) { checks++; if(!v) throw new AssertionError(checks); }
 static void search(int[] a) {
  Arrays.sort(a); int[] copy=a.clone();
  for(int target:new int[]{Integer.MIN_VALUE,-3,-2,-1,0,1,2,3,Integer.MAX_VALUE}) {
   int expected=0; while(expected<a.length && a[expected]<target) expected++;
   check(LowerBound.firstAtLeast(a,target)==expected);
  }
  check(Arrays.equals(a,copy));
 }
 static void enumerate(int[] a,int i) {
  if(i==a.length) { search(a); return; }
  for(int v=-2;v<=2;v++) { a[i]=v; enumerate(a,i+1); }
 }
 static long walk(boolean[][] a,int r,int c) {
  if(r==a.length || c==a[0].length || a[r][c]) return 0;
  if(r==a.length-1 && c==a[0].length-1) return 1;
  return walk(a,r+1,c)+walk(a,r,c+1);
 }
 static void failure(Class<? extends Throwable> type,Runnable action) {
  try { action.run(); throw new AssertionError("missing failure"); }
  catch(Throwable t) { check(type.isInstance(t)); }
 }
 public static void main(String[] args) {
  for(int n=0;n<=6;n++) enumerate(new int[n],0);
  search(new int[]{Integer.MAX_VALUE,Integer.MIN_VALUE,0,Integer.MAX_VALUE});
  for(int r=1;r<=4;r++) for(int c=1;c<=4;c++) {
   for(int mask=0;mask<(1<<(r*c));mask++) {
    boolean[][] a=new boolean[r][c];
    for(int i=0;i<r*c;i++) a[i/c][i%c]=(mask&(1<<i))!=0;
    String before=Arrays.deepToString(a);
    check(GridPaths.count(a)==walk(a,0,0));
    check(before.equals(Arrays.deepToString(a)));
   }
  }
  BigInteger binomial=BigInteger.ONE;
  for(int i=1;i<=99;i++) binomial=binomial.multiply(BigInteger.valueOf(99+i)).divide(BigInteger.valueOf(i));
  check(GridPaths.count(new boolean[100][100])==binomial.mod(BigInteger.valueOf(1000000007)).intValue());
  check(GridPaths.count(new boolean[0][])==0);
  check(GridPaths.count(new boolean[2][0])==0);
  failure(NullPointerException.class,()->LowerBound.firstAtLeast(null,0));
  failure(NullPointerException.class,()->GridPaths.count(null));
  failure(NullPointerException.class,()->GridPaths.count(new boolean[][]{null}));
  failure(NullPointerException.class,()->GridPaths.count(new boolean[][]{{},null}));
  failure(IllegalArgumentException.class,()->GridPaths.count(new boolean[][]{{},{true}}));
  System.out.println(checks+" assertions");
 }
}`);
    execFileSync(path.join(javaHome, 'bin/javac'), ['--release', '21', 'LowerBound.java', 'GridPaths.java', 'Checks.java'], { cwd: directory, timeout: 30000 });
    const output = execFileSync(path.join(javaHome, 'bin/java'), ['-cp', directory, 'Checks'], { cwd: directory, timeout: 30000, encoding: 'utf8' });
    assert.match(output, /assertions/);
    console.log(output.trim());
  } finally { await rm(directory, { recursive: true, force: true }); }
});
