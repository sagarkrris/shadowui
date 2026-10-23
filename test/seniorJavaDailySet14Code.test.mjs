import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("Set 14 published Java matches exhaustive assignment and inversion oracles", async () => {
  const markdown = await readFile(new URL("../content/senior-java/daily/set-14.md", import.meta.url), "utf8");
  const members = [...markdown.matchAll(/```java\n([\s\S]*?)\n```/g)].map(match => match[1]);
  assert.equal(members.length, 2, "compile every published Java block");
  const checks = `
    static int assertions;
    static void check(boolean value) { assertions++; if (!value) throw new AssertionError("assertion " + assertions); }
    static void rejects(Class<? extends Throwable> type, Runnable action) {
      try { action.run(); } catch (Throwable error) { check(type.isInstance(error)); return; }
      throw new AssertionError("expected " + type);
    }
    // Enumerate permutations with independent mutable occupancy, no masks or DP.
    static long assignmentOracle(int[][] costs, int worker, boolean[] used) {
      if (worker == costs.length) return 0;
      long best = Long.MAX_VALUE;
      for (int task=0; task<used.length; task++) if (!used[task]) {
        used[task]=true;
        best=Math.min(best, (long)costs[worker][task]+assignmentOracle(costs,worker+1,used));
        used[task]=false;
      }
      return best;
    }
    static void verifyAssignment(int[][] costs) {
      int[][] original=Arrays.stream(costs).map(int[]::clone).toArray(int[][]::new);
      Assignment result=cheapestAssignment(costs);
      check(result.taskByWorker().size()==costs.length);
      boolean[] seen=new boolean[costs.length]; long total=0;
      for (int worker=0; worker<costs.length; worker++) {
        int task=result.taskByWorker().get(worker);
        check(task>=0 && task<costs.length && !seen[task]);
        seen[task]=true; total+=costs[worker][task];
      }
      check(result.cost()==total);
      check(result.cost()==assignmentOracle(costs,0,new boolean[costs.length]));
      check(Arrays.deepEquals(costs,original));
      rejects(UnsupportedOperationException.class, () -> result.taskByWorker().add(0));
    }
    static void verifyInversions(int[] values) {
      int[] original=values.clone(); long expected=0;
      for(int i=0;i<values.length;i++)
        for(int j=i+1;j<values.length;j++) if(values[i]>values[j]) expected++;
      check(inversionCount(values)==expected);
      check(Arrays.equals(values,original));
    }
    public static void main(String[] args) throws Exception {
      verifyAssignment(new int[0][0]);
      verifyAssignment(new int[][]{{1,2},{1,100}});
      check(cheapestAssignment(new int[][]{{1,2},{1,100}}).cost()==3);
      // Every square binary-cost matrix through n=4, including ties and zero costs.
      for(int n=1;n<=4;n++) {
        int combinations=1 << (n*n);
        for(int code=0;code<combinations;code++) {
          int[][] costs=new int[n][n];
          for(int i=0;i<n;i++) for(int j=0;j<n;j++) costs[i][j]=(code >>> (i*n+j)) & 1;
          verifyAssignment(costs);
        }
      }
      Random random=new Random(142026);
      for(int trial=0;trial<200;trial++) {
        int n=1+random.nextInt(7); int[][] costs=new int[n][n];
        for(int[] row:costs) for(int j=0;j<n;j++) row[j]=random.nextInt(1000);
        verifyAssignment(costs);
      }
      int[][] large=new int[16][16];
      for(int[] row:large) Arrays.fill(row,Integer.MAX_VALUE);
      Assignment maximum=cheapestAssignment(large);
      check(maximum.cost()==16L*Integer.MAX_VALUE);
      check(new HashSet<>(maximum.taskByWorker()).size()==16);
      // A unique known full-size optimum, with a non-identity permutation.
      for(int i=0;i<16;i++) large[i][(i+3)%16]=i;
      Assignment rotated=cheapestAssignment(large);
      check(rotated.cost()==120);
      for(int i=0;i<16;i++) check(rotated.taskByWorker().get(i)==(i+3)%16);
      rejects(NullPointerException.class,()->cheapestAssignment(null));
      rejects(NullPointerException.class,()->cheapestAssignment(new int[][]{{1,2},null}));
      rejects(IllegalArgumentException.class,()->cheapestAssignment(new int[][]{{1,2},{3}}));
      rejects(IllegalArgumentException.class,()->cheapestAssignment(new int[][]{{1,2},{3,-1}}));
      rejects(IllegalArgumentException.class,()->cheapestAssignment(new int[17][17]));
      for(int length=0;length<=8;length++) {
        int combinations=(int)Math.pow(4,length);
        for(int code=0;code<combinations;code++) {
          int[] values=new int[length]; int rest=code;
          for(int i=0;i<length;i++){values[i]=rest%4-2;rest/=4;}
          verifyInversions(values);
        }
      }
      for(int trial=0;trial<2000;trial++) {
        int[] values=new int[random.nextInt(100)];
        for(int i=0;i<values.length;i++) values[i]=random.nextInt();
        verifyInversions(values);
      }
      verifyInversions(new int[]{Integer.MAX_VALUE,Integer.MIN_VALUE,Integer.MAX_VALUE,Integer.MIN_VALUE});
      int[] descending=new int[100000];
      for(int i=0;i<descending.length;i++) descending[i]=descending.length-i;
      check(inversionCount(descending)==4999950000L);
      check(descending[0]==100000 && descending[99999]==1);
      int[] million=new int[1000000];
      for(int i=0;i<million.length;i++) million[i]=million.length-i;
      check(inversionCount(million)==499999500000L);
      rejects(NullPointerException.class,()->inversionCount(null));
      rejects(IllegalArgumentException.class,()->inversionCount(new int[1000001]));
      // Deterministic Java ownership contracts used in the non-framework answers.
      List<String> parent=new ArrayList<>(List.of("A","B","C"));
      List<String> view=parent.subList(0,1), copy=new ArrayList<>(view);
      parent.set(0,"D"); check(view.get(0).equals("D")); check(copy.get(0).equals("A"));
      view.set(0,"E"); check(parent.get(0).equals("E"));
      var permits=new java.util.concurrent.Semaphore(1);
      check(permits.tryAcquire()); check(!permits.tryAcquire());
      permits.release(); check(permits.availablePermits()==1);
      // Semaphore intentionally does not enforce an application maximum.
      permits.release(); check(permits.availablePermits()==2);
      System.out.println(assertions + " assertions passed");
    }
  `;
  const directory = await mkdtemp(path.join(tmpdir(), "senior-java-set14-"));
  const javaHome = process.env.CONTENT_JAVA_HOME || process.env.JAVA_HOME;
  const bin = name => javaHome ? path.join(javaHome, "bin", name) : name;
  try {
    const file = path.join(directory, "DailySet14Checks.java");
    await writeFile(file, `import java.util.*; public class DailySet14Checks {\n${members.join("\n")}\n${checks}\n}`);
    execFileSync(bin("javac"), ["--release", "21", "-d", directory, file], { timeout: 20000 });
    const output = execFileSync(bin("java"), ["-cp", directory, "DailySet14Checks"], { timeout: 30000, encoding: "utf8" });
    assert.match(output, /\d+ assertions passed/);
    console.log(output.trim());
  } finally { await rm(directory, { recursive: true, force: true }); }
});
