import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('Set 31 published write helper preserves bytes through short writes and fails on stalled or broken channels', async () => {
  const source = await readFile(new URL('../content/senior-java/daily/set-31.md', import.meta.url), 'utf8');
  const dir = await mkdtemp(path.join(tmpdir(), 'set31-'));
  const jdk = process.env.CONTENT_JAVA_HOME || process.env.JAVA_HOME;
  assert.ok(jdk, 'Set JAVA_HOME or CONTENT_JAVA_HOME to JDK 21+');
  try {
    await writeFile(path.join(dir, 'WriteProgress.java'), source.match(/```java\n([\s\S]*?)```/)[1]);
    await writeFile(path.join(dir, 'Checks.java'), `
import java.io.*;
import java.nio.*;
import java.nio.channels.*;
import java.util.*;
public class Checks {
 static int checks;
 static void check(boolean value){if(!value)throw new AssertionError();checks++;}
 static class Sink implements WritableByteChannel {
  final ByteArrayOutputStream out=new ByteArrayOutputStream();
  final int chunk; final int failAt; int calls; boolean open=true;
  Sink(int chunk,int failAt){this.chunk=chunk;this.failAt=failAt;}
  public int write(ByteBuffer b)throws IOException {
   calls++; if(out.size()>=failAt)throw new IOException("injected");
   int n=Math.min(chunk,Math.min(b.remaining(),failAt-out.size()));
   for(int i=0;i<n;i++)out.write(b.get()); return n;
  }
  public boolean isOpen(){return open;}
  public void close(){open=false;}
 }
 public static void main(String[] args)throws Exception {
  for(int size=0;size<=256;size++)for(int chunk=1;chunk<=17;chunk++) {
   byte[] payload=new byte[size];for(int i=0;i<size;i++)payload[i]=(byte)i;
   Sink sink=new Sink(chunk,Integer.MAX_VALUE);
   ByteBuffer b=ByteBuffer.wrap(payload);
   WriteProgress.writeFully(sink,b);
   check(Arrays.equals(payload,sink.out.toByteArray()));check(!b.hasRemaining());check(sink.open);
   check(sink.calls==(size+chunk-1)/chunk);
  }
  Sink zero=new Sink(0,Integer.MAX_VALUE);
  try{WriteProgress.writeFully(zero,ByteBuffer.wrap(new byte[1]));throw new AssertionError();}
  catch(IOException expected){check(zero.calls==1);check(zero.open);}
  Sink broken=new Sink(2,3);ByteBuffer b=ByteBuffer.wrap(new byte[]{1,2,3,4,5});
  try{WriteProgress.writeFully(broken,b);throw new AssertionError();}
  catch(IOException expected){check(Arrays.equals(broken.out.toByteArray(),new byte[]{1,2,3}));check(b.position()==3);check(broken.open);}
  Sink slice=new Sink(1,Integer.MAX_VALUE);ByteBuffer range=ByteBuffer.wrap(new byte[]{9,1,2,9});range.position(1);range.limit(3);
  WriteProgress.writeFully(slice,range);check(Arrays.equals(slice.out.toByteArray(),new byte[]{1,2}));
  try{WriteProgress.writeFully(null,ByteBuffer.allocate(0));throw new AssertionError();}catch(NullPointerException expected){checks++;}
  try{WriteProgress.writeFully(slice,null);throw new AssertionError();}catch(NullPointerException expected){checks++;}
  System.out.println(checks+" progress assertions passed");
 }
}`);
    execFileSync(path.join(jdk, 'bin/javac'), ['--release', '21', 'WriteProgress.java', 'Checks.java'], { cwd: dir, timeout: 30000 });
    const output = execFileSync(path.join(jdk, 'bin/java'), ['-cp', dir, 'Checks'], { cwd: dir, encoding: 'utf8', timeout: 30000 });
    assert.match(output, /progress assertions passed/);
    console.log(output.trim());
  } finally { await rm(dir, { recursive: true, force: true }); }
});
