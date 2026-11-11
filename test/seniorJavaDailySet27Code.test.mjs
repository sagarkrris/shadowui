import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('Set 27 published sequence witnesses match exhaustive independent oracles', async () => {
 const source = await readFile(new URL('../content/senior-java/daily/set-27.md', import.meta.url), 'utf8');
 const blocks = [...source.matchAll(/```java\n([\s\S]*?)```/g)];
 assert.equal(blocks.length, 1);
 const dir = await mkdtemp(path.join(tmpdir(), 'java-set27-'));
 const jdk = process.env.JAVA_HOME || '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home';
 try {
  await writeFile(path.join(dir,'SequenceContracts.java'), blocks[0][1]);
  await writeFile(path.join(dir,'Checks.java'), `
import java.util.*;
public class Checks {
 static int checks;
 static void check(boolean ok) { checks++; if(!ok) throw new AssertionError(checks); }
 static void verify(int[] a) {
  int[] copy=a.clone();
  java.util.OptionalInt expected=java.util.OptionalInt.empty();
  for(int x:a) {int count=0; for(int y:a) if(x==y) count++; if(count==1) {expected=java.util.OptionalInt.of(x);break;}}
  check(SequenceContracts.firstUnique(a).equals(expected));
  int bestStart=0,bestEnd=0;
  for(int left=0;left<a.length;left++) for(int end=left+1;end<=a.length;end++) {
   boolean increasing=true; for(int i=left+1;i<end;i++) if(a[i]<=a[i-1]) increasing=false;
   if(increasing && end-left>bestEnd-bestStart) {bestStart=left;bestEnd=end;}
  }
  check(SequenceContracts.longestRun(a).equals(new SequenceContracts.Range(bestStart,bestEnd)));
  check(Arrays.equals(copy,a));

 }
 static void enumerate(int[] a,int at) { if(at==a.length) {verify(a);return;} for(int x=-2;x<=2;x++) {a[at]=x;enumerate(a,at+1);} }
 public static void main(String[] args) throws Exception {
  for(int n=0;n<=7;n++) enumerate(new int[n],0);
  verify(new int[]{Integer.MIN_VALUE,Integer.MAX_VALUE});
  verify(new int[]{Integer.MAX_VALUE,Integer.MIN_VALUE});
  try { SequenceContracts.firstUnique(null); throw new AssertionError(); } catch(NullPointerException expected) {check(true);}
  try { SequenceContracts.longestRun(null); throw new AssertionError(); } catch(NullPointerException expected) {check(true);}
  var q=new java.util.concurrent.SynchronousQueue<String>(); check(!q.offer("job") && q.size()==0);
  var priority=new java.util.concurrent.PriorityBlockingQueue<Integer>(1); priority.add(2); priority.add(1); check(priority.size()==2 && priority.remove()==1);
  var pattern=java.util.regex.Pattern.compile("[A-Z]{3}"); check(pattern.matcher("!ABC!").find()); check(!pattern.matcher("!ABC!").matches());
  String[] original={"old"}; var atomic=new java.util.concurrent.atomic.AtomicReferenceArray<>(original); original[0]="new";check(atomic.get(0).equals("old"));
  byte[] utf8={(byte)0xc3,(byte)0xa9}; var props=new Properties(); props.load(new java.io.ByteArrayInputStream(utf8));check(!props.containsKey("é"));
  var decoded=new Properties(); decoded.load(new java.io.InputStreamReader(new java.io.ByteArrayInputStream(utf8),java.nio.charset.StandardCharsets.UTF_8));check(decoded.containsKey("é"));
  try {java.nio.charset.StandardCharsets.UTF_8.newDecoder().decode(java.nio.ByteBuffer.wrap(new byte[]{(byte)0xff}));throw new AssertionError();} catch(java.nio.charset.CharacterCodingException expected) {check(true);}
  System.out.println(checks+" assertions");
 }
}`);
  execFileSync(path.join(jdk,'bin/javac'),['--release','21','SequenceContracts.java','Checks.java'],{cwd:dir,timeout:30000});
  const output=execFileSync(path.join(jdk,'bin/java'),['-cp',dir,'Checks'],{cwd:dir,encoding:'utf8',timeout:30000});
  assert.match(output,/assertions/); console.log(output.trim());
 } finally { await rm(dir,{recursive:true,force:true}); }
});
