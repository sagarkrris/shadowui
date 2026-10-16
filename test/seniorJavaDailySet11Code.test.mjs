import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("Set 11 published reconstruction and graph code match exhaustive independent oracles", async () => {
  const markdown = await readFile(new URL("../content/senior-java/daily/set-11.md", import.meta.url), "utf8");
  const members = [...markdown.matchAll(/```java\n([\s\S]*?)\n```/g)].map(match => match[1]);
  assert.equal(members.length, 2);
  const checks = `
    static int assertions;
    static void check(boolean value) { assertions++; if (!value) throw new AssertionError("assertion " + assertions); }
    static void rejects(Class<? extends Throwable> type, Runnable action) {
      try { action.run(); } catch (Throwable error) { check(type.isInstance(error)); return; }
      throw new AssertionError("expected " + type);
    }
    static boolean compatible(Job a, Job b) {
      return a.end() <= b.start() || b.end() <= a.start();
    }
    static long scheduleOracle(List<Job> jobs) {
      long best = 0;
      for (int mask = 0; mask < (1 << jobs.size()); mask++) {
        long value = 0; boolean valid = true;
        for (int i = 0; i < jobs.size(); i++) if ((mask & (1 << i)) != 0) {
          value += jobs.get(i).value();
          for (int j = 0; j < i; j++) if ((mask & (1 << j)) != 0)
            valid &= compatible(jobs.get(i), jobs.get(j));
        }
        if (valid) best = Math.max(best, value);
      }
      return best;
    }
    static void verifyPlan(List<Job> jobs) {
      List<Job> original = new ArrayList<>(jobs);
      Plan plan = bestSchedule(jobs);
      check(jobs.equals(original));
      check(plan.value() == scheduleOracle(jobs));
      Set<Integer> ids = new HashSet<>(); long sum = 0;
      for (int i = 0; i < plan.jobs().size(); i++) {
        Job job = plan.jobs().get(i);
        check(jobs.contains(job) && ids.add(job.id())); sum += job.value();
        if (i > 0) check(plan.jobs().get(i-1).end() <= job.start());
      }
      check(sum == plan.value());
    }
    static boolean graphOracle(int n, int[][] edges) {
      for (int labels = 0; labels < (1 << n); labels++) {
        boolean valid = true;
        for (int[] edge : edges)
          if (((labels >>> edge[0]) & 1) == ((labels >>> edge[1]) & 1)) { valid = false; break; }
        if (valid) return true;
      }
      return false;
    }
    static void verifyGraph(int n, int[][] edges) {
      int[][] original = Arrays.stream(edges).map(int[]::clone).toArray(int[][]::new);
      Optional<int[]> result = twoGroups(n, edges);
      check(result.isPresent() == graphOracle(n,edges));
      check(Arrays.deepEquals(edges, original));
      if (result.isPresent()) {
        int[] group = result.get(); check(group.length == n);
        for (int label : group) check(label == 0 || label == 1);
        for (int[] edge : edges) check(group[edge[0]] != group[edge[1]]);
      }
    }
    public static void main(String[] args) {
      List<Job> universe = new ArrayList<>();
      for (int start = 0; start < 3; start++) for (int end = start+1; end <= 3; end++)
        for (int value : new int[]{0,5}) universe.add(new Job(universe.size(),start,end,value));
      for (int mask = 0; mask < (1 << universe.size()); mask++) {
        List<Job> jobs = new ArrayList<>();
        for (int i = 0; i < universe.size(); i++) if ((mask & (1 << i)) != 0) jobs.add(universe.get(i));
        verifyPlan(jobs);
        Collections.reverse(jobs); verifyPlan(jobs);
      }
      Random random = new Random(11016);
      for (int run = 0; run < 1000; run++) {
        List<Job> jobs = new ArrayList<>();
        for (int i = 0, n = random.nextInt(10); i < n; i++) {
          int start = random.nextInt(16)-8;
          jobs.add(new Job(i,start,start+1+random.nextInt(8),random.nextInt(30)));
        }
        verifyPlan(jobs);
      }
      check(bestSchedule(List.of(new Job(1,0,2,4),new Job(2,2,4,4),new Job(3,0,4,11))).value() == 11);
      check(bestSchedule(List.of(new Job(1,Integer.MIN_VALUE,0,Integer.MAX_VALUE),
        new Job(2,0,Integer.MAX_VALUE,Integer.MAX_VALUE))).value() == 4294967294L);
      Plan tied = bestSchedule(List.of(new Job(2,0,1,5),new Job(1,0,1,5)));
      check(tied.jobs().get(0).id() == 1);
      rejects(UnsupportedOperationException.class, () -> tied.jobs().clear());
      rejects(NullPointerException.class, () -> bestSchedule(null));
      rejects(NullPointerException.class, () -> bestSchedule(Arrays.asList((Job)null)));
      rejects(IllegalArgumentException.class, () -> bestSchedule(List.of(new Job(1,2,2,1))));
      rejects(IllegalArgumentException.class, () -> bestSchedule(List.of(new Job(1,3,2,1))));
      rejects(IllegalArgumentException.class, () -> bestSchedule(List.of(new Job(1,0,1,-1))));
      rejects(IllegalArgumentException.class, () -> bestSchedule(List.of(new Job(1,0,1,1),new Job(1,2,3,1))));
      List<Job> large = new ArrayList<>();
      for (int i = 0; i < 20000; i++) large.add(new Job(i,i,i+1,1));
      Plan largePlan = bestSchedule(large); check(largePlan.value() == 20000 && largePlan.jobs().size() == 20000);
      for (int n = 0; n <= 6; n++) {
        List<int[]> possible = new ArrayList<>();
        for (int a = 0; a < n; a++) for (int b = a+1; b < n; b++) possible.add(new int[]{a,b});
        for (int mask = 0; mask < (1 << possible.size()); mask++) {
          List<int[]> edges = new ArrayList<>();
          for (int i = 0; i < possible.size(); i++) if ((mask & (1 << i)) != 0) edges.add(possible.get(i));
          verifyGraph(n, edges.toArray(int[][]::new));
        }
      }
      verifyGraph(1,new int[][]{{0,0}});
      verifyGraph(3,new int[][]{{0,1},{0,1},{2,1}});
      verifyGraph(6,new int[][]{{0,1},{3,4},{4,5},{5,3}});
      rejects(IllegalArgumentException.class, () -> twoGroups(-1,new int[0][]));
      rejects(NullPointerException.class, () -> twoGroups(0,null));
      rejects(NullPointerException.class, () -> twoGroups(1,new int[][]{null}));
      rejects(IllegalArgumentException.class, () -> twoGroups(1,new int[][]{{0}}));
      rejects(IllegalArgumentException.class, () -> twoGroups(1,new int[][]{{0,0,0}}));
      rejects(IllegalArgumentException.class, () -> twoGroups(1,new int[][]{{0,0},{0,1}}));
      rejects(IllegalArgumentException.class, () -> twoGroups(1,new int[][]{{-1,0}}));
      rejects(IllegalArgumentException.class, () -> twoGroups(0,new int[][]{{0,0}}));
      int[][] chain = new int[19999][2];
      for (int i = 0; i < chain.length; i++) chain[i] = new int[]{i,i+1};
      int[] colors = twoGroups(20000,chain).orElseThrow();
      for (int i = 0; i < colors.length; i++) check(colors[i] == i%2);
      var x = new java.math.BigDecimal("2.0"); var y = new java.math.BigDecimal("2.00");
      check(!x.equals(y) && x.compareTo(y) == 0);
      check(new HashSet<>(List.of(x,y)).size() == 2 && new TreeSet<>(List.of(x,y)).size() == 1);
      check(new java.math.BigDecimal("1000").stripTrailingZeros().scale() == -3);
      rejects(ArithmeticException.class, () -> new java.math.BigDecimal("2.001").setScale(2,java.math.RoundingMode.UNNECESSARY));
      for (boolean reverse : new boolean[]{false,true}) {
        var a = new java.util.concurrent.CompletableFuture<String>();
        var b = new java.util.concurrent.CompletableFuture<String>();
        var c = new java.util.concurrent.CompletableFuture<String>();
        record Outcome(String id, String value, Throwable error) {}
        var reports = List.of(a.handle((v,e) -> new Outcome("A",v,e)),
          b.handle((v,e) -> new Outcome("B",v,e)),c.handle((v,e) -> new Outcome("C",v,e)));
        var barrier = java.util.concurrent.CompletableFuture.allOf(a,b,c);
        var reported = java.util.concurrent.CompletableFuture.allOf(reports.toArray(java.util.concurrent.CompletableFuture[]::new));
        if (reverse) { b.cancel(false); a.completeExceptionally(new IllegalArgumentException()); }
        else { a.completeExceptionally(new IllegalArgumentException()); b.cancel(false); }
        check(!barrier.isDone() && !reported.isDone() && !c.isCancelled());
        c.complete(null); rejects(java.util.concurrent.CompletionException.class, barrier::join);
        reported.join(); check(reports.get(0).join().error() instanceof IllegalArgumentException);
        check(reports.get(1).join().error() instanceof java.util.concurrent.CancellationException);
        check(reports.get(2).join().error() == null && reports.get(2).join().value() == null);
      }
      check(java.util.concurrent.CompletableFuture.allOf().isDone());
      var lock = new java.util.concurrent.locks.StampedLock();
      int[] pair = {1,1}; long stamp = lock.tryOptimisticRead(); int first = pair[0];
      long write = lock.writeLock(); pair[0] = pair[1] = 2; lock.unlockWrite(write);
      int second = pair[1]; check(first != second && !lock.validate(stamp));
      long read = lock.readLock();
      try { first = pair[0]; second = pair[1]; } finally { lock.unlockRead(read); }
      check(first == 2 && second == 2);
      stamp = lock.tryOptimisticRead(); first = pair[0]; second = pair[1]; check(lock.validate(stamp));
      write = lock.writeLock(); pair[0] = pair[1] = 3; lock.unlockWrite(write);
      check(first == 2 && second == 2 && pair[0] == 3);
      System.out.println(assertions + " assertions passed");
    }
  `;
  const directory = await mkdtemp(path.join(tmpdir(), "senior-java-set11-"));
  const javaHome = process.env.CONTENT_JAVA_HOME || process.env.JAVA_HOME;
  const bin = name => javaHome ? path.join(javaHome, "bin", name) : name;
  try {
    const file = path.join(directory, "DailySet11Checks.java");
    await writeFile(file, `import java.util.*; public class DailySet11Checks {\n${members.join("\n")}\n${checks}\n}`);
    execFileSync(bin("javac"), ["--release", "21", "-d", directory, file], { timeout: 20000 });
    const output = execFileSync(bin("java"), ["-cp", directory, "DailySet11Checks"], { timeout: 20000, encoding: "utf8" });
    assert.match(output, /\d+ assertions passed/);
    console.log(output.trim());
  } finally { await rm(directory, { recursive: true, force: true }); }
});
