import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("Set 16 published Java finds multigraph bridges and length-constrained optima", async () => {
  const markdown = await readFile(new URL("../content/senior-java/daily/set-16.md", import.meta.url), "utf8");
  const members = [...markdown.matchAll(/```java\n([\s\S]*?)\n```/g)].map(match => match[1]);
  assert.equal(members.length, 2, "compile every published Java block");
  const checks = `
    static int assertions;
    static void check(boolean value) { assertions++; if (!value) throw new AssertionError("assertion " + assertions); }
    static void rejects(Class<? extends Throwable> type, Runnable action) {
      try { action.run(); } catch (Throwable error) { check(type.isInstance(error)); return; }
      throw new AssertionError("expected " + type);
    }
    // Independent repeated label propagation, with one edge omitted. No DFS low values.
    static int components(int n, List<Link> links, int removed) {
      int[] labels=new int[n]; for(int i=0;i<n;i++) labels[i]=i;
      boolean changed;
      do {
        changed=false;
        for(int i=0;i<links.size();i++) if(i!=removed) {
          Link e=links.get(i); int label=Math.min(labels[e.u()],labels[e.v()]);
          if(labels[e.u()]!=label || labels[e.v()]!=label) changed=true;
          labels[e.u()]=labels[e.v()]=label;
        }
      } while(changed);
      Set<Integer> distinct=new HashSet<>(); for(int x:labels) distinct.add(x);
      return distinct.size();
    }
    static void verifyGraph(int n, List<Link> links) {
      List<Link> before=new ArrayList<>(links);
      int base=components(n,links,-1); List<Integer> expected=new ArrayList<>();
      for(int i=0;i<links.size();i++) if(components(n,links,i)>base) expected.add(i);
      check(bridges(n,links).equals(expected)); check(links.equals(before));
    }
    // Direct sums of every legal segment, with explicit contract tie comparison.
    static Segment segmentOracle(int[] a,int l,int r) {
      long best=Long.MIN_VALUE; int start=-1,end=-1;
      for(int i=0;i<a.length;i++) for(int j=i+l;j<=a.length && j<=i+r;j++) {
        long sum=0; for(int k=i;k<j;k++) sum+=a[k];
        if(sum>best || (sum==best && (i<start || (i==start && j<end)))) {
          best=sum;start=i;end=j;
        }
      }
      return new Segment(best,start,end);
    }
    static void verifyArray(int[] a) {
      int[] before=a.clone();
      for(int l=1;l<=a.length;l++) for(int r=l;r<=a.length;r++) {
        Segment actual=bestSegment(a,l,r);
        check(actual.equals(segmentOracle(a,l,r)));
        check(actual.end()-actual.start()>=l && actual.end()-actual.start()<=r);
      }
      check(Arrays.equals(a,before));
    }
    static void arrays(int[] a,int i) {
      if(i==a.length) { verifyArray(a);return; }
      for(int value:new int[]{-2,0,3}) { a[i]=value;arrays(a,i+1); }
    }
    public static void main(String[] args) throws Exception {
      verifyGraph(0,List.of());
      for(int n=1;n<=6;n++) {
        List<Link> possible=new ArrayList<>();
        for(int u=0;u<n;u++) for(int v=u+1;v<n;v++) possible.add(new Link(u,v));
        for(int mask=0;mask<(1<<possible.size());mask++) {
          List<Link> edges=new ArrayList<>();
          for(int i=0;i<possible.size();i++) if((mask&(1<<i))!=0) edges.add(possible.get(i));
          verifyGraph(n,edges);
        }
      }
      Random random=new Random(20261027);
      for(int trial=0;trial<3000;trial++) {
        int n=1+random.nextInt(9); List<Link> edges=new LinkedList<>();
        for(int i=0,m=random.nextInt(25);i<m;i++) edges.add(new Link(random.nextInt(n),random.nextInt(n)));
        verifyGraph(n,edges);
      }
      verifyGraph(4,List.of(new Link(0,1),new Link(1,2),new Link(2,0),new Link(2,3)));
      verifyGraph(4,List.of(new Link(0,0),new Link(1,2),new Link(1,2),new Link(2,3)));
      rejects(UnsupportedOperationException.class,()->bridges(2,List.of(new Link(0,1))).add(0));
      rejects(UnsupportedOperationException.class,()->bridges(0,List.of()).add(0));
      List<Link> chain=new ArrayList<>();
      for(int i=1;i<200000;i++) chain.add(new Link(i-1,i));
      var result=bridges(200000,chain); check(result.size()==199999);
      for(int i=0;i<result.size();i++) check(result.get(i)==i);
      chain.add(new Link(199999,0));check(bridges(200000,chain).isEmpty());
      check(bridges(2,Collections.nCopies(400000,new Link(0,1))).isEmpty());
      rejects(NullPointerException.class,()->bridges(1,null));
      rejects(NullPointerException.class,()->bridges(1,Arrays.asList((Link)null)));
      rejects(IllegalArgumentException.class,()->bridges(-1,List.of()));
      rejects(IllegalArgumentException.class,()->bridges(200001,List.of()));
      rejects(IllegalArgumentException.class,()->bridges(1,Collections.nCopies(400001,new Link(0,0))));
      rejects(IllegalArgumentException.class,()->bridges(0,List.of(new Link(0,0))));
      rejects(IllegalArgumentException.class,()->bridges(1,List.of(new Link(-1,0))));
      rejects(IllegalArgumentException.class,()->bridges(1,List.of(new Link(0,1))));
      for(int n=1;n<=8;n++) arrays(new int[n],0);
      for(int trial=0;trial<1000;trial++) {
        int[] a=new int[1+random.nextInt(16)];
        for(int i=0;i<a.length;i++) a[i]=random.nextInt();
        verifyArray(a);
      }
      verifyArray(new int[]{4,-10,7,3,-2}); verifyArray(new int[]{-5,-2,-9});
      verifyArray(new int[]{Integer.MIN_VALUE,Integer.MIN_VALUE,Integer.MAX_VALUE,Integer.MAX_VALUE});
      check(bestSegment(new int[1000000],1,1000000).equals(new Segment(0,0,1)));
      int[] huge=new int[1000000]; Arrays.fill(huge,Integer.MAX_VALUE);
      check(bestSegment(huge,1,huge.length).equals(new Segment(2147483647000000L,0,1000000)));
      Arrays.fill(huge,Integer.MIN_VALUE);
      check(bestSegment(huge,999999,1000000).equals(new Segment(-2147481500516352L,0,999999)));
      rejects(NullPointerException.class,()->bestSegment(null,1,1));
      rejects(IllegalArgumentException.class,()->bestSegment(new int[0],1,1));
      rejects(IllegalArgumentException.class,()->bestSegment(new int[1],0,1));
      rejects(IllegalArgumentException.class,()->bestSegment(new int[2],2,1));
      rejects(IllegalArgumentException.class,()->bestSegment(new int[2],1,3));
      rejects(IllegalArgumentException.class,()->bestSegment(new int[1000001],1,1));
      // Lock mode contract without hanging a thread or relying on scheduler timing.
      var lock=new java.util.concurrent.locks.ReentrantReadWriteLock();
      lock.readLock().lock();
      try { check(!lock.writeLock().tryLock()); }
      finally { lock.readLock().unlock(); }
      check(lock.writeLock().tryLock());
      lock.readLock().lock(); lock.writeLock().unlock();
      check(lock.getReadHoldCount()==1); lock.readLock().unlock();
      System.out.println(assertions + " assertions passed");
    }
  `;
  const directory = await mkdtemp(path.join(tmpdir(), "senior-java-set16-"));
  const javaHome = process.env.CONTENT_JAVA_HOME || process.env.JAVA_HOME;
  const bin = name => javaHome ? path.join(javaHome, "bin", name) : name;
  try {
    const file = path.join(directory, "DailySet16Checks.java");
    await writeFile(file, `import java.util.*; public class DailySet16Checks {\n${members.join("\n")}\n${checks}\n}`);
    execFileSync(bin("javac"), ["--release", "21", "-d", directory, file], { timeout: 20000 });
    const output = execFileSync(bin("java"), ["-cp", directory, "DailySet16Checks"], { timeout: 60000, encoding: "utf8" });
    assert.match(output, /\d+ assertions passed/);
    console.log(output.trim());
  } finally { await rm(directory, { recursive: true, force: true }); }
});
