import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('Set 26 published squares and equilibrium match exhaustive independent oracles', async () => {
 const source = await readFile(new URL('../content/senior-java/daily/set-26.md', import.meta.url), 'utf8');
 const blocks = [...source.matchAll(/```java\n([\s\S]*?)```/g)];
 assert.equal(blocks.length, 2);
 const dir = await mkdtemp(path.join(tmpdir(), 'java-set26-'));
 const jdk = process.env.JAVA_HOME || '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home';
 try {
  await writeFile(path.join(dir,'SortedSquares.java'), blocks[0][1]);
  await writeFile(path.join(dir,'Equilibrium.java'), blocks[1][1]);
  await writeFile(path.join(dir,'Checks.java'), `
import java.util.*;
public class Checks {
 static int checks;
 static void check(boolean ok) { checks++; if(!ok) throw new AssertionError(checks); }
 static void verify(int[] a) {
  int[] copy=a.clone();
  long[] expected=new long[a.length];
  for(int i=0;i<a.length;i++) expected[i]=(long)a[i]*a[i];
  Arrays.sort(expected); int[] sorted=a.clone(); Arrays.sort(sorted);
  check(Arrays.equals(SortedSquares.of(sorted),expected));
  int pivot=-1;
  for(int i=0;i<a.length;i++) {long l=0,r=0; for(int j=0;j<i;j++) l+=a[j]; for(int j=i+1;j<a.length;j++) r+=a[j]; if(l==r) {pivot=i;break;}}
  check(Equilibrium.first(a)==pivot); check(Arrays.equals(copy,a));

 }
 static void enumerate(int[] a,int at) { if(at==a.length) {verify(a);return;} for(int x=-2;x<=2;x++) {a[at]=x;enumerate(a,at+1);} }
 public static void main(String[] args) throws Exception {
  for(int n=0;n<=7;n++) enumerate(new int[n],0);
  verify(new int[]{Integer.MIN_VALUE,Integer.MAX_VALUE});
  verify(new int[]{Integer.MAX_VALUE,Integer.MIN_VALUE});
  try { SortedSquares.of(null); throw new AssertionError(); } catch(NullPointerException expected) {check(true);}
  try { Equilibrium.first(null); throw new AssertionError(); } catch(NullPointerException expected) {check(true);}
  check(Arrays.deepEquals(new Object[]{new int[]{4}},new Object[]{new int[]{4}}));
  var bits=new BitSet(128); check(bits.length()==0); bits.set(127); check(bits.length()==128);
  check(Math.floorDiv(-1,10)==-1 && Math.floorMod(-1,10)==9);
  check(Arrays.equals(Base64.getDecoder().decode("YQ"),Base64.getDecoder().decode("YQ==")));
  var rows=new ArrayList<>(Collections.nCopies(3,new ArrayList<Integer>())); rows.get(0).add(4); check(rows.get(1).equals(List.of(4)));
  var latch=new java.util.concurrent.CountDownLatch(1); latch.countDown(); check(latch.await(0,java.util.concurrent.TimeUnit.SECONDS));
  System.out.println(checks+" assertions");
 }
}`);
  execFileSync(path.join(jdk,'bin/javac'),['--release','21','SortedSquares.java','Equilibrium.java','Checks.java'],{cwd:dir,timeout:30000});
  const output=execFileSync(path.join(jdk,'bin/java'),['-cp',dir,'Checks'],{cwd:dir,encoding:'utf8',timeout:30000});
  assert.match(output,/assertions/); console.log(output.trim());
 } finally { await rm(dir,{recursive:true,force:true}); }
});
