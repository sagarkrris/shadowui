import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('Set 28 published boundary algorithms match exhaustive independent oracles', async () => {
 const source = await readFile(new URL('../content/senior-java/daily/set-28.md', import.meta.url), 'utf8');
 const blocks = [...source.matchAll(/```java\n([\s\S]*?)```/g)];
 assert.equal(blocks.length, 1);
 const dir = await mkdtemp(path.join(tmpdir(), 'java-set28-'));
 const jdk = process.env.JAVA_HOME || '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home';
 try {
  await writeFile(path.join(dir,'BoundaryAlgorithms.java'), blocks[0][1]);
  await writeFile(path.join(dir,'Checks.java'), `
import java.util.*;
public class Checks {
 static int checks;
 static void check(boolean ok) { checks++; if(!ok) throw new AssertionError(checks); }
 static void verify(int[] a) {
  int[] copy=a.clone();
  long expected=0;
  for(int i=0;i<a.length;i++) for(int j=i+1;j<a.length;j++) if(a[i]>a[j]) expected++;
  check(BoundaryAlgorithms.inversions(a)==expected);
  int best=0;
  for(int lo=0;lo<a.length;lo++) for(int hi=lo+1;hi<=a.length;hi++) {
   boolean valid=true;
   for(int i=lo+1;i<hi;i++) if(Math.floorMod(a[i],2)==Math.floorMod(a[i-1],2)) valid=false;
   if(valid) best=Math.max(best,hi-lo);
  }
  check(BoundaryAlgorithms.alternatingParity(a)==best);
  check(Arrays.equals(copy,a));

 }
 static void enumerate(int[] a,int at) { if(at==a.length) {verify(a);return;} for(int x=-2;x<=2;x++) {a[at]=x;enumerate(a,at+1);} }
 public static void main(String[] args) throws Exception {
  for(int n=0;n<=7;n++) enumerate(new int[n],0);
  verify(new int[]{Integer.MIN_VALUE,Integer.MAX_VALUE});
  verify(new int[]{Integer.MAX_VALUE,Integer.MIN_VALUE});
  try { BoundaryAlgorithms.inversions(null); throw new AssertionError(); } catch(NullPointerException expected) {check(true);}
  try { BoundaryAlgorithms.alternatingParity(null); throw new AssertionError(); } catch(NullPointerException expected) {check(true);}
  int[] descending=new int[100000];for(int i=0;i<descending.length;i++) descending[i]=descending.length-i;
  check(BoundaryAlgorithms.inversions(descending)==4999950000L);
  String[] dst={"old","old"};
  try {System.arraycopy(new Object[]{"ok",7},0,dst,0,2);throw new AssertionError();} catch(ArrayStoreException expected) {check(dst[0].equals("ok") && dst[1].equals("old"));}
  check(Arrays.equals(Arrays.copyOfRange(new int[]{7},0,3),new int[]{7,0,0}));
  try {Collections.copy(new ArrayList<String>(10),List.of("x"));throw new AssertionError();} catch(IndexOutOfBoundsException expected) {check(true);}
  var bytes=new java.io.ByteArrayInputStream(new byte[]{7});bytes.close();check(bytes.read()==7);
  java.io.InputStream forward=new java.io.InputStream(){public int read(){return -1;}};check(!forward.markSupported());
  try {forward.reset();throw new AssertionError();}catch(java.io.IOException expected){check(true);}
  int[][] matrix={{1}};int[][] cloned=matrix.clone();cloned[0][0]=9;check(matrix[0][0]==9);
  System.out.println(checks+" assertions");
 }
}`);
  execFileSync(path.join(jdk,'bin/javac'),['--release','21','BoundaryAlgorithms.java','Checks.java'],{cwd:dir,timeout:30000});
  const output=execFileSync(path.join(jdk,'bin/java'),['-cp',dir,'Checks'],{cwd:dir,encoding:'utf8',timeout:30000});
  assert.match(output,/assertions/); console.log(output.trim());
 } finally { await rm(dir,{recursive:true,force:true}); }
});
