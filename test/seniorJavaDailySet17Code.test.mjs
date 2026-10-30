import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("Set 17 published jump path matches explicit BFS including boundary inputs", async () => {
  const md = await readFile(new URL("../content/senior-java/daily/set-17.md", import.meta.url), "utf8");
  const blocks = [...md.matchAll(/```java\n([\s\S]*?)\n```/g)];
  assert.equal(blocks.length, 1);
  const checks = `
static int assertions;
static void check(boolean ok) { assertions++; if (!ok) throw new AssertionError("check "+assertions); }
static void verify(int[] a) {
  int[] before=a.clone(); List<Integer> got=jumpPath(a);
  int n=a.length; int[] d=new int[n]; Arrays.fill(d,-1);
  if(n>0) { ArrayDeque<Integer> q=new ArrayDeque<>(); q.add(0); d[0]=0;
    while(!q.isEmpty()) { int i=q.remove();
      for(int j=i+1;j<n && (long)j-i<=a[i];j++) if(d[j]<0) {d[j]=d[i]+1;q.add(j);}
    }
  }
  if(n==0 || d[n-1]<0) check(got.isEmpty());
  else { check(got.size()==d[n-1]+1); check(got.get(0)==0 && got.get(got.size()-1)==n-1);
    for(int i=1;i<got.size();i++) {int x=got.get(i-1),y=got.get(i);check(y>x && (long)y-x<=a[x]);}
  }
  check(Arrays.equals(a,before));
  try {got.add(99);throw new AssertionError("mutable");}catch(UnsupportedOperationException expected){assertions++;}
}
static void enumerate(int[] a,int at) {
  if(at==a.length) {verify(a);return;}
  for(int v=0;v<=3;v++){a[at]=v;enumerate(a,at+1);}
}
public static void main(String[] args) {
  for(int n=0;n<=8;n++) enumerate(new int[n],0);
  verify(new int[]{Integer.MAX_VALUE,0,0});verify(new int[]{2,3,0,0,0});
  try{jumpPath(null);throw new AssertionError();}catch(NullPointerException expected){assertions++;}
  try{jumpPath(new int[]{0,-1});throw new AssertionError();}catch(IllegalArgumentException expected){assertions++;}
  try{jumpPath(new int[1_000_001]);throw new AssertionError();}catch(IllegalArgumentException expected){assertions++;}
  int[] chain=new int[1_000_000];Arrays.fill(chain,1);List<Integer> p=jumpPath(chain);
  check(p.size()==chain.length);for(int i=0;i<p.size();i++)check(p.get(i)==i);
  System.out.println("assertions="+assertions);
}`;
  const dir = await mkdtemp(path.join(tmpdir(), "java-set17-"));
  const javaHome = process.env.JAVA_HOME || "/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home";
  try {
    await writeFile(path.join(dir, "Checks.java"), `import java.util.*; public class Checks {\n${blocks[0][1]}\n${checks}\n}`);
    execFileSync(path.join(javaHome, "bin/javac"), ["--release", "21", "Checks.java"], { cwd: dir, timeout: 30000 });
    const output = execFileSync(path.join(javaHome, "bin/java"), ["-cp", dir, "Checks"], { encoding: "utf8", timeout: 30000 });
    assert.match(output, /assertions=\d+/);
    console.log(output.trim());
  } finally { await rm(dir, { recursive: true, force: true }); }
});
