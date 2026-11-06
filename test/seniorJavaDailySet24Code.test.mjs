import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('Set 24 published leaders and prefixes match independent exhaustive oracles', async () => {
 const source = await readFile(new URL('../content/senior-java/daily/set-24.md', import.meta.url), 'utf8');
 const blocks = [...source.matchAll(/```java\n([\s\S]*?)```/g)];
 assert.equal(blocks.length, 2);
 const dir = await mkdtemp(path.join(tmpdir(), 'java-set24-'));
 const jdk = process.env.JAVA_HOME || '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home';
 try {
  await writeFile(path.join(dir,'Leaders.java'), blocks[0][1]);
  await writeFile(path.join(dir,'CommonPrefix.java'), blocks[1][1]);
  await writeFile(path.join(dir,'Checks.java'), `
import java.util.*;
public class Checks {
 static int checks;
 static void check(boolean b) { checks++; if(!b) throw new AssertionError(checks); }
 static void leaders(int[] a) {
  int[] original=a.clone(); List<Integer> expected=new ArrayList<>();
  for(int i=0;i<a.length;i++) { boolean ok=true; for(int j=i+1;j<a.length;j++) if(a[j]>=a[i]) ok=false; if(ok) expected.add(a[i]); }
  check(Arrays.equals(Leaders.find(a),expected.stream().mapToInt(Integer::intValue).toArray())); check(Arrays.equals(a,original));
 }
 static void enumerate(int[] a,int at) { if(at==a.length) { leaders(a); return; } for(int x=-2;x<=2;x++) { a[at]=x; enumerate(a,at+1); } }
 static void prefix(String[] words) {
  String[] original=words.clone(); String expected="";
  if(words.length>0) for(int len=0;len<=words[0].length();len++) {
   String candidate=words[0].substring(0,len); boolean ok=true;
   for(String w:words) if(!w.startsWith(candidate)) ok=false;
   if(ok) expected=candidate;
  }
  check(CommonPrefix.find(words).equals(expected)); check(Arrays.equals(words,original));
 }
 static void missing(Runnable r) { try { r.run(); throw new AssertionError(); } catch(NullPointerException e) { check(true); } }
 public static void main(String[] args) {
  for(int n=0;n<=7;n++) enumerate(new int[n],0);
  leaders(new int[]{Integer.MIN_VALUE,Integer.MAX_VALUE,Integer.MIN_VALUE});
  String[] pool={"","a","b","aa","ab","aba","abc","\\uD83D\\uDE00","\\uD83D\\uDE01"};
  prefix(new String[0]);
  for(String a:pool) { prefix(new String[]{a}); for(String b:pool) for(String c:pool) prefix(new String[]{a,b,c}); }
  missing(()->Leaders.find(null)); missing(()->CommonPrefix.find(null)); missing(()->CommonPrefix.find(new String[]{"",null})); missing(()->CommonPrefix.find(new String[]{null,""}));
  System.out.println(checks+" assertions");
 }
}`);
  execFileSync(path.join(jdk,'bin/javac'),['--release','21','Leaders.java','CommonPrefix.java','Checks.java'],{cwd:dir,timeout:30000});
  const output=execFileSync(path.join(jdk,'bin/java'),['-cp',dir,'Checks'],{cwd:dir,encoding:'utf8',timeout:30000});
  assert.match(output,/assertions/); console.log(output.trim());
 } finally { await rm(dir,{recursive:true,force:true}); }
});
