import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("Set 15 published Java returns verifiable negative cycles and every overlapping match", async () => {
  const markdown = await readFile(new URL("../content/senior-java/daily/set-15.md", import.meta.url), "utf8");
  const members = [...markdown.matchAll(/```java\n([\s\S]*?)\n```/g)].map(match => match[1]);
  assert.equal(members.length, 2, "compile every published Java block");
  const checks = `
    static int assertions;
    static void check(boolean value) { assertions++; if (!value) throw new AssertionError("assertion " + assertions); }
    static void rejects(Class<? extends Throwable> type, Runnable action) {
      try { action.run(); } catch (Throwable error) { check(type.isInstance(error)); return; }
      throw new AssertionError("expected " + type);
    }
    // Independent all-pairs dynamic programming; no predecessor or pass-n detection.
    static boolean cycleOracle(int n, List<RouteEdge> edges, int source) {
      long inf=Long.MAX_VALUE/4;
      long[][] d=new long[n][n];
      for(int i=0;i<n;i++) { Arrays.fill(d[i],inf); d[i][i]=0; }
      for(var e:edges) d[e.from()][e.to()]=Math.min(d[e.from()][e.to()],e.cost());
      for(int k=0;k<n;k++) for(int i=0;i<n;i++) for(int j=0;j<n;j++)
        if(d[i][k]!=inf && d[k][j]!=inf) d[i][j]=Math.min(d[i][j],d[i][k]+d[k][j]);
      for(int i=0;i<n;i++) if(d[source][i]!=inf && d[i][i]<0) return true;
      return false;
    }
    static void verifyCycle(int n, List<RouteEdge> edges, int source) {
      var before=List.copyOf(edges);
      var cycle=negativeCycle(n,edges,source);
      check(edges.equals(before));
      check(!cycle.isEmpty()==cycleOracle(n,edges,source));
      if(cycle.isEmpty()) return;
      check(cycle.size()<=n);
      Set<Integer> vertices=new HashSet<>(); long sum=0;
      for(int i=0;i<cycle.size();i++) {
        int id=cycle.get(i); check(id>=0 && id<edges.size());
        var e=edges.get(id); var next=edges.get(cycle.get((i+1)%cycle.size()));
        check(e.to()==next.from()); check(vertices.add(e.from())); sum+=e.cost();
      }
      check(sum<0);
      // Independent graph reachability, ignoring all weights.
      boolean[] reached=new boolean[n]; reached[source]=true;
      for(int i=0;i<n;i++) for(var e:edges) if(reached[e.from()]) reached[e.to()]=true;
      check(reached[edges.get(cycle.get(0)).from()]);
    }
    static void enumerateGraphs(int n, int cell, List<RouteEdge> edges) {
      if(cell==n*n) { for(int s=0;s<n;s++) verifyCycle(n,edges,s); return; }
      enumerateGraphs(n,cell+1,edges);
      for(int cost:new int[]{-1,0,1}) {
        edges.add(new RouteEdge(cell/n,cell%n,cost));
        enumerateGraphs(n,cell+1,edges); edges.remove(edges.size()-1);
      }
    }
    static List<Integer> matchOracle(String text, String pattern) {
      List<Integer> out=new ArrayList<>();
      for(int i=0;i+pattern.length()<=text.length();i++) {
        boolean same=true;
        for(int j=0;j<pattern.length();j++) if(text.charAt(i+j)!=pattern.charAt(j)) { same=false; break; }
        if(same) out.add(i);
      }
      return out;
    }
    static void verifyMatches(String text, String pattern) {
      var result=occurrences(text,pattern);
      check(result.equals(matchOracle(text,pattern)));
    }
    static List<String> words(int maximum) {
      List<String> result=new ArrayList<>(); result.add("");
      for(int n=1;n<=maximum;n++) for(int bits=0;bits<(1<<n);bits++) {
        StringBuilder s=new StringBuilder();
        for(int i=0;i<n;i++) s.append(((bits>>i)&1)==0?'a':'b');
        result.add(s.toString());
      }
      return result;
    }
    public static void main(String[] args) {
      rejects(UnsupportedOperationException.class,()->negativeCycle(1,List.of(),0).add(0));
      rejects(UnsupportedOperationException.class,()->negativeCycle(1,List.of(new RouteEdge(0,0,-1)),0).add(0));
      rejects(UnsupportedOperationException.class,()->occurrences("a","a").add(0));
      rejects(UnsupportedOperationException.class,()->occurrences("a","b").add(0));
      enumerateGraphs(1,0,new ArrayList<>());
      enumerateGraphs(2,0,new ArrayList<>());
      enumerateGraphs(3,0,new ArrayList<>());
      Random random=new Random(20261026);
      for(int trial=0;trial<2000;trial++) {
        int n=1+random.nextInt(7); List<RouteEdge> edges=new ArrayList<>();
        for(int i=0,m=random.nextInt(25);i<m;i++) edges.add(new RouteEdge(random.nextInt(n),random.nextInt(n),random.nextInt(21)-10));
        for(int s=0;s<n;s++) verifyCycle(n,edges,s);
      }
      verifyCycle(3,List.of(new RouteEdge(0,1,0),new RouteEdge(1,2,Integer.MIN_VALUE),new RouteEdge(2,1,Integer.MAX_VALUE)),0);
      verifyCycle(2,List.of(new RouteEdge(0,1,Integer.MIN_VALUE),new RouteEdge(1,0,Integer.MIN_VALUE)),0);
      verifyCycle(2,List.of(new RouteEdge(0,1,Integer.MAX_VALUE),new RouteEdge(1,0,Integer.MAX_VALUE)),0);
      verifyCycle(2,List.of(new RouteEdge(1,1,-1)),0);
      verifyCycle(2,List.of(new RouteEdge(0,1,5),new RouteEdge(0,1,-3),new RouteEdge(1,0,1)),0);
      List<RouteEdge> chain=new ArrayList<>();
      // Reverse edge order forces propagation across many complete passes.
      for(int i=198;i>=0;i--) chain.add(new RouteEdge(i,i+1,Integer.MAX_VALUE));
      check(negativeCycle(200,chain,0).isEmpty());
      chain.add(new RouteEdge(199,199,-1));
      check(negativeCycle(200,chain,0).equals(List.of(199)));
      List<RouteEdge> dense=new ArrayList<>();
      for(int i=0;i<10000;i++) dense.add(new RouteEdge(i%200,(i+1)%200,Integer.MIN_VALUE));
      var witness=negativeCycle(200,dense,0); long total=0;
      check(!witness.isEmpty());
      for(int i=0;i<witness.size();i++) {
        var e=dense.get(witness.get(i)); total+=e.cost();
        check(e.to()==dense.get(witness.get((i+1)%witness.size())).from());
      }
      check(total<0);
      rejects(NullPointerException.class,()->negativeCycle(1,null,0));
      rejects(NullPointerException.class,()->negativeCycle(1,Arrays.asList((RouteEdge)null),0));
      rejects(IllegalArgumentException.class,()->negativeCycle(0,List.of(),0));
      rejects(IllegalArgumentException.class,()->negativeCycle(201,List.of(),0));
      rejects(IllegalArgumentException.class,()->negativeCycle(1,List.of(),-1));
      rejects(IllegalArgumentException.class,()->negativeCycle(1,List.of(),1));
      rejects(IllegalArgumentException.class,()->negativeCycle(1,List.of(new RouteEdge(-1,0,0)),0));
      rejects(IllegalArgumentException.class,()->negativeCycle(1,List.of(new RouteEdge(0,1,0)),0));
      rejects(IllegalArgumentException.class,()->negativeCycle(1,Collections.nCopies(10001,new RouteEdge(0,0,0)),0));
      var texts=words(9); var patterns=words(6);
      for(String text:texts) for(String pattern:patterns) if(!pattern.isEmpty()) verifyMatches(text,pattern);
      verifyMatches("aaaaa","aaa"); verifyMatches("ababababacababaca","ababaca");
      // Unicode surrogate code units are intentionally allowed and indexed literally.
      String face=new String(Character.toChars(0x1f600));
      verifyMatches(face+face,face);
      verifyMatches(face+face,String.valueOf(face.charAt(1)));
      for(int trial=0;trial<2000;trial++) {
        StringBuilder text=new StringBuilder(), pattern=new StringBuilder();
        for(int i=0,n=random.nextInt(100);i<n;i++) text.append((char)random.nextInt(8));
        for(int i=0,n=1+random.nextInt(15);i<n;i++) pattern.append((char)random.nextInt(8));
        verifyMatches(text.toString(),pattern.toString());
      }
      String million="a".repeat(1000000);
      check(occurrences(million,million).equals(List.of(0)));
      var many=occurrences(million,"a");
      check(many.size()==1000000 && many.get(0)==0 && many.get(999999)==999999);
      rejects(NullPointerException.class,()->occurrences(null,"a"));
      rejects(NullPointerException.class,()->occurrences("a",null));
      rejects(IllegalArgumentException.class,()->occurrences("a",""));
      rejects(IllegalArgumentException.class,()->occurrences(million+"a","a"));
      rejects(IllegalArgumentException.class,()->occurrences("a",million+"a"));
      // Published buffer example: read-only views share bytes but not cursor state.
      var producer=java.nio.ByteBuffer.wrap(new byte[]{10,20});
      var view=producer.slice().asReadOnlyBuffer(); byte[] snapshot=new byte[view.remaining()];
      view.duplicate().get(snapshot); producer.put(0,(byte)99);
      check(view.get(0)==99 && snapshot[0]==10); view.position(1); check(producer.position()==0);
      rejects(java.nio.ReadOnlyBufferException.class,()->view.put(0,(byte)1));
      System.out.println(assertions + " assertions passed");
    }
  `;
  const directory = await mkdtemp(path.join(tmpdir(), "senior-java-set15-"));
  const javaHome = process.env.CONTENT_JAVA_HOME || process.env.JAVA_HOME;
  const bin = name => javaHome ? path.join(javaHome, "bin", name) : name;
  try {
    const file = path.join(directory, "DailySet15Checks.java");
    await writeFile(file, `import java.util.*; public class DailySet15Checks {\n${members.join("\n")}\n${checks}\n}`);
    execFileSync(bin("javac"), ["--release", "21", "-d", directory, file], { timeout: 20000 });
    const output = execFileSync(bin("java"), ["-cp", directory, "DailySet15Checks"], { timeout: 60000, encoding: "utf8" });
    assert.match(output, /\d+ assertions passed/);
    console.log(output.trim());
  } finally { await rm(directory, { recursive: true, force: true }); }
});
