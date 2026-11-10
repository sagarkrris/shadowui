import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('Set 25 published majority and profit match exhaustive independent oracles', async () => {
 const source = await readFile(new URL('../content/senior-java/daily/set-25.md', import.meta.url), 'utf8');
 const blocks = [...source.matchAll(/```java\n([\s\S]*?)```/g)];
 assert.equal(blocks.length, 2);
 const dir = await mkdtemp(path.join(tmpdir(), 'java-set25-'));
 const jdk = process.env.JAVA_HOME || '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home';
 try {
  await writeFile(path.join(dir,'Majority.java'), blocks[0][1]);
  await writeFile(path.join(dir,'OneTrade.java'), blocks[1][1]);
  await writeFile(path.join(dir,'Checks.java'), `
import java.util.*;
public class Checks {
 static int checks;
 static void check(boolean ok) { checks++; if(!ok) throw new AssertionError(checks); }
 static void verify(int[] a) {
  int[] copy=a.clone(); Map<Integer,Integer> counts=new HashMap<>();
  for(int x:a) counts.merge(x,1,Integer::sum);
  OptionalInt expected=OptionalInt.empty();
  for(var e:counts.entrySet()) if(e.getValue()>a.length/2) expected=OptionalInt.of(e.getKey());
  check(Majority.find(a).equals(expected));
  long best=0;
  for(int i=0;i<a.length;i++) for(int j=i+1;j<a.length;j++) best=Math.max(best,(long)a[j]-a[i]);
  check(OneTrade.profit(a)==best); check(Arrays.equals(copy,a));
 }
 static void enumerate(int[] a,int at) { if(at==a.length) {verify(a);return;} for(int x=-2;x<=2;x++) {a[at]=x;enumerate(a,at+1);} }
 public static void main(String[] args) {
  for(int n=0;n<=7;n++) enumerate(new int[n],0);
  verify(new int[]{Integer.MIN_VALUE,Integer.MAX_VALUE});
  verify(new int[]{Integer.MAX_VALUE,Integer.MIN_VALUE});
  try { Majority.find(null); throw new AssertionError(); } catch(NullPointerException expected) {check(true);}
  try { OneTrade.profit(null); throw new AssertionError(); } catch(NullPointerException expected) {check(true);}
  var original=java.util.concurrent.CompletableFuture.completedFuture(3);
  var observed=original.whenComplete((v,e)->{throw new IllegalStateException("cleanup");});
  check(original.join()==3); check(observed.isCompletedExceptionally());
  var failed=new java.util.concurrent.CompletableFuture<Integer>();
  var pending=new java.util.concurrent.CompletableFuture<Integer>();
  var race=java.util.concurrent.CompletableFuture.anyOf(failed,pending);
  failed.completeExceptionally(new IllegalArgumentException());
  check(race.isCompletedExceptionally()); check(!pending.isDone());
  check(!java.util.concurrent.CompletableFuture.anyOf().isDone());
  System.out.println(checks+" assertions");
 }
}`);
  execFileSync(path.join(jdk,'bin/javac'),['--release','21','Majority.java','OneTrade.java','Checks.java'],{cwd:dir,timeout:30000});
  const output=execFileSync(path.join(jdk,'bin/java'),['-cp',dir,'Checks'],{cwd:dir,encoding:'utf8',timeout:30000});
  assert.match(output,/assertions/); console.log(output.trim());
 } finally { await rm(dir,{recursive:true,force:true}); }
});
