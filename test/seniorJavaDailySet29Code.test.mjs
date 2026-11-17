import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('Set 29 published boundary algorithms match exhaustive independent oracles', async () => {
 const source = await readFile(new URL('../content/senior-java/daily/set-29.md', import.meta.url), 'utf8');
 const blocks = [...source.matchAll(/```java\n([\s\S]*?)```/g)];
 assert.equal(blocks.length, 1);
 const dir = await mkdtemp(path.join(tmpdir(), 'java-set29-'));
 const jdk = process.env.JAVA_HOME || '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home';
 try {
  await writeFile(path.join(dir,'ConstructionAlgorithms.java'), blocks[0][1]);
  await writeFile(path.join(dir,'Checks.java'), `
import java.util.*;
public class Checks {
 static int checks;
 static void check(boolean ok) { checks++; if(!ok) throw new AssertionError(checks); }
 static void verify(int[] a) {
  int[] copy=a.clone();
  long expected=0;
  for(int lo=0;lo<a.length;lo++) for(int hi=lo;hi<a.length;hi++) {
   boolean valid=true;for(int i=lo+1;i<=hi;i++) if(a[i]<a[i-1]) valid=false;
   if(valid) expected++;
  }
  check(ConstructionAlgorithms.nondecreasingRanges(a)==expected);
  int[] bits=new int[a.length];for(int i=0;i<a.length;i++) bits[i]=Math.floorMod(a[i],2);
  int best=0;
  for(int deleted=0;deleted<bits.length;deleted++) {
   int run=0;for(int i=0;i<bits.length;i++) if(i!=deleted) {run=bits[i]==1?run+1:0;best=Math.max(best,run);}
  }
  check(ConstructionAlgorithms.afterOneDeletion(bits)==best);
  check(Arrays.equals(copy,a));

 }
 static void enumerate(int[] a,int at) { if(at==a.length) {verify(a);return;} for(int x=-2;x<=2;x++) {a[at]=x;enumerate(a,at+1);} }
 public static void main(String[] args) throws Exception {
  for(int n=0;n<=7;n++) enumerate(new int[n],0);
  verify(new int[]{Integer.MIN_VALUE,Integer.MAX_VALUE});
  verify(new int[]{Integer.MAX_VALUE,Integer.MIN_VALUE});
  try {ConstructionAlgorithms.afterOneDeletion(null);throw new AssertionError();}catch(NullPointerException ok){check(true);}
  try {ConstructionAlgorithms.nondecreasingRanges(null);throw new AssertionError();}catch(NullPointerException ok){check(true);}
  try {ConstructionAlgorithms.afterOneDeletion(new int[]{1,2});throw new AssertionError();}catch(IllegalArgumentException ok){check(true);}
  check(ConstructionAlgorithms.nondecreasingRanges(new int[100000])==5000050000L);
  BitSet granted=new BitSet();granted.set(1);granted.set(2);BitSet allowed=new BitSet();allowed.set(1);
  BitSet result=(BitSet)granted.clone();result.and(allowed);check(granted.cardinality()==2 && result.cardinality()==1);
  check(Arrays.mismatch(new byte[]{4},new byte[]{4,8})==1);
  check(Arrays.mismatch(new byte[]{4},new byte[]{4})==-1);
  check(Objects.compare(null,null,Comparator.<String>naturalOrder())==0);
  try {Objects.compare(null,"a",Comparator.<String>naturalOrder());throw new AssertionError();}catch(NullPointerException ok){check(true);}
  try {Objects.requireNonNullElseGet(null,()->null);throw new AssertionError();}catch(NullPointerException ok){check(true);}
  check(Objects.requireNonNullElseGet("x",null).equals("x"));
  try {Math.toIntExact(2147483648L);throw new AssertionError();}catch(ArithmeticException ok){check(true);}
  try {Math.multiplyExact(65536,65536);throw new AssertionError();}catch(ArithmeticException ok){check(true);}
  check(Math.round(2.5)==3 && Math.rint(2.5)==2 && Math.round(-2.5)==-2 && Math.rint(3.5)==4);
  check(Arrays.compareUnsigned(new byte[]{(byte)128},new byte[]{127})>0);
  check(Arrays.compare(new byte[]{(byte)128},new byte[]{127})<0);
  System.out.println(checks+" assertions");
 }
}`);
  execFileSync(path.join(jdk,'bin/javac'),['--release','21','ConstructionAlgorithms.java','Checks.java'],{cwd:dir,timeout:30000});
  const output=execFileSync(path.join(jdk,'bin/java'),['-cp',dir,'Checks'],{cwd:dir,encoding:'utf8',timeout:30000});
  assert.match(output,/assertions/); console.log(output.trim());
 } finally { await rm(dir,{recursive:true,force:true}); }
});
