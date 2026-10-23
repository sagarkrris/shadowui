import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("Set 12 published code matches subset and assignment oracles; temporal and resource boundaries hold", async () => {
  const markdown = await readFile(new URL("../content/senior-java/daily/set-12.md", import.meta.url), "utf8");
  const members = [...markdown.matchAll(/```java\n([\s\S]*?)\n```/g)].map(match => match[1]);
  assert.equal(members.length, 2, "compile every published Java block");
  const checks = `
    static int assertions;
    static void check(boolean value) { assertions++; if (!value) throw new AssertionError("assertion " + assertions); }
    static void rejects(Class<? extends Throwable> type, Runnable action) {
      try { action.run(); } catch (Throwable error) { check(type.isInstance(error)); return; }
      throw new AssertionError("expected " + type);
    }
    static long subsetOracle(int[] costs, int[] values, int capacity) {
      long best = 0;
      for (int mask = 0; mask < (1 << costs.length); mask++) {
        long cost = 0, value = 0;
        for (int i = 0; i < costs.length; i++) if ((mask & (1 << i)) != 0) {
          cost += costs[i]; value += values[i];
        }
        if (cost <= capacity) best = Math.max(best,value);
      }
      return best;
    }
    static void verifyKnapsack(int[] costs, int[] values, int capacity) {
      int[] originalCosts = costs.clone(), originalValues = values.clone();
      check(bestImprovements(costs,values,capacity) == subsetOracle(costs,values,capacity));
      check(Arrays.equals(costs,originalCosts) && Arrays.equals(values,originalValues));
    }
    static int assignmentOracle(int[][] graph, int worker, boolean[] used) {
      if (worker == graph.length) return 0;
      int best = assignmentOracle(graph,worker+1,used);
      for (int task : graph[worker]) if (!used[task]) {
        used[task] = true;
        best = Math.max(best,1+assignmentOracle(graph,worker+1,used));
        used[task] = false;
      }
      return best;
    }
    static void verifyMatching(int tasks, int[][] graph) {
      int[][] original = Arrays.stream(graph).map(int[]::clone).toArray(int[][]::new);
      int[] assigned = assignTasks(tasks,graph);
      check(assigned.length == graph.length);
      boolean[] used = new boolean[tasks]; int count = 0;
      for (int worker = 0; worker < graph.length; worker++) {
        int task = assigned[worker]; check(task >= -1 && task < tasks);
        if (task == -1) continue;
        check(!used[task]); used[task] = true; count++;
        boolean edge = false;
        for (int possible : graph[worker]) if (possible == task) edge = true;
        check(edge);
      }
      check(count == assignmentOracle(graph,0,new boolean[tasks]));
      check(Arrays.deepEquals(graph,original));
    }
    static void await(java.util.concurrent.CountDownLatch latch) {
      try { if (!latch.await(5,java.util.concurrent.TimeUnit.SECONDS)) throw new AssertionError("latch timeout"); }
      catch (InterruptedException error) { Thread.currentThread().interrupt(); throw new AssertionError(error); }
    }
    public static void main(String[] args) throws Exception {
      int[] allCosts = {1,2,2,3,4,6}, allValues = {0,4,5,7,9,10};
      for (int mask = 0; mask < 64; mask++) {
        int[] costs = new int[Integer.bitCount(mask)], values = new int[costs.length];
        for (int i = 0, at = 0; i < 6; i++) if ((mask & (1 << i)) != 0) {
          costs[at] = allCosts[i]; values[at++] = allValues[i];
        }
        for (int cap = 0; cap <= 13; cap++) verifyKnapsack(costs,values,cap);
        for (int a = 0, b = costs.length-1; a < b; a++,b--) {
          int c = costs[a]; costs[a] = costs[b]; costs[b] = c;
          int v = values[a]; values[a] = values[b]; values[b] = v;
        }
        for (int cap = 0; cap <= 13; cap++) verifyKnapsack(costs,values,cap);
      }
      Random random = new Random(122026);
      for (int run = 0; run < 1000; run++) {
        int n = random.nextInt(11); int[] costs = new int[n], values = new int[n];
        for (int i = 0; i < n; i++) { costs[i] = 1+random.nextInt(15); values[i] = random.nextInt(25); }
        verifyKnapsack(costs,values,random.nextInt(30));
      }
      check(bestImprovements(new int[]{2},new int[]{4},4) == 4);
      check(bestImprovements(new int[]{1,1},new int[]{Integer.MAX_VALUE,Integer.MAX_VALUE},2) == 4294967294L);
      check(bestImprovements(new int[]{100001},new int[]{7},100000) == 0);
      rejects(NullPointerException.class, () -> bestImprovements(null,new int[0],0));
      rejects(NullPointerException.class, () -> bestImprovements(new int[0],null,0));
      rejects(IllegalArgumentException.class, () -> bestImprovements(new int[]{1},new int[0],0));
      rejects(IllegalArgumentException.class, () -> bestImprovements(new int[0],new int[0],-1));
      rejects(IllegalArgumentException.class, () -> bestImprovements(new int[0],new int[0],100001));
      rejects(IllegalArgumentException.class, () -> bestImprovements(new int[]{1,0},new int[]{1,1},0));
      rejects(IllegalArgumentException.class, () -> bestImprovements(new int[]{-1},new int[]{1},0));
      rejects(IllegalArgumentException.class, () -> bestImprovements(new int[]{1},new int[]{-1},0));
      rejects(IllegalArgumentException.class, () -> bestImprovements(new int[101],new int[101],100000));
      int[] boundaryCosts = new int[100], boundaryValues = new int[100];
      Arrays.fill(boundaryCosts,100000); Arrays.fill(boundaryValues,1);
      check(bestImprovements(boundaryCosts,boundaryValues,99999) == 0);
      for (int workers = 0; workers <= 4; workers++) for (int tasks = 0; tasks <= 3; tasks++) {
        for (int mask = 0; mask < (1 << (workers*tasks)); mask++) {
          int[][] graph = new int[workers][];
          for (int worker = 0; worker < workers; worker++) {
            List<Integer> neighbors = new ArrayList<>();
            for (int task = 0; task < tasks; task++)
              if ((mask & (1 << (worker*tasks+task))) != 0) neighbors.add(task);
            graph[worker] = neighbors.stream().mapToInt(Integer::intValue).toArray();
          }
          verifyMatching(tasks,graph);
        }
      }
      for (int run = 0; run < 1000; run++) {
        int tasks = 1+random.nextInt(5), workers = random.nextInt(7);
        int[][] graph = new int[workers][];
        for (int worker = 0; worker < workers; worker++) {
          graph[worker] = new int[random.nextInt(5)];
          for (int i = 0; i < graph[worker].length; i++) graph[worker][i] = random.nextInt(tasks);
        }
        verifyMatching(tasks,graph);
      }
      check(Arrays.equals(assignTasks(2,new int[][]{{0,1},{0}}),new int[]{1,0}));
      verifyMatching(3,new int[][]{{0,0,1},{0},{},{2,2}});
      rejects(NullPointerException.class, () -> assignTasks(0,null));
      rejects(IllegalArgumentException.class, () -> assignTasks(-1,new int[0][]));
      rejects(NullPointerException.class, () -> assignTasks(1,new int[][]{new int[0],null}));
      rejects(IllegalArgumentException.class, () -> assignTasks(1,new int[][]{{0},{0,1}}));
      rejects(IllegalArgumentException.class, () -> assignTasks(0,new int[][]{{0}}));
      rejects(IllegalArgumentException.class, () -> assignTasks(1,new int[][]{{-1}}));
      int n = 5000; int[][] chain = new int[n][];
      for (int i = 0; i < n-1; i++) chain[i] = new int[]{i,i+1};
      chain[n-1] = new int[]{0};
      int[] result = assignTasks(n,chain);
      for (int i = 0; i < n-1; i++) check(result[i] == i+1);
      check(result[n-1] == 0);
      var zone = java.time.ZoneId.of("Europe/Berlin");
      var gap = java.time.LocalDateTime.of(2026,3,29,2,30);
      var overlap = java.time.LocalDateTime.of(2026,10,25,2,30);
      check(zone.getRules().getValidOffsets(gap).isEmpty());
      var offsets = zone.getRules().getValidOffsets(overlap); check(offsets.size() == 2);
      var first = java.time.ZonedDateTime.ofStrict(overlap,offsets.get(0),zone).toInstant();
      var second = java.time.ZonedDateTime.ofStrict(overlap,offsets.get(1),zone).toInstant();
      check(java.time.Duration.between(first,second).toHours() == 1);
      rejects(java.time.DateTimeException.class, () -> java.time.ZonedDateTime.ofStrict(gap,java.time.ZoneOffset.ofHours(1),zone));
      rejects(java.time.DateTimeException.class, () -> java.time.ZonedDateTime.ofStrict(overlap,java.time.ZoneOffset.UTC,zone));
      var normal = java.time.LocalDateTime.of(2026,10,21,12,0);
      check(zone.getRules().getValidOffsets(normal).size() == 1);
      check(first.atZone(zone).toLocalDateTime().equals(overlap));
      check(second.atZone(zone).toLocalDateTime().equals(overlap));
      for (int mode = 0; mode < 3; mode++) {
        var closed = new java.util.concurrent.atomic.AtomicBoolean();
        try (var stream = java.util.stream.Stream.of("first","second").onClose(() -> closed.set(true))) {
          if (mode == 0) check(stream.findFirst().orElseThrow().equals("first"));
          if (mode == 1) check(stream.filter(s -> false).findFirst().isEmpty());
          if (mode == 2) rejects(IllegalArgumentException.class,
            () -> stream.forEach(s -> { throw new IllegalArgumentException(); }));
          check(!closed.get());
        }
        check(closed.get());
      }
      java.util.stream.Stream<String> escaped;
      try (var stream = java.util.stream.Stream.of("closed")) { escaped = stream; }
      rejects(IllegalStateException.class, escaped::count);
      var reference = new java.util.concurrent.atomic.AtomicReference<Integer>(0);
      var entered = new java.util.concurrent.CountDownLatch(1);
      var release = new java.util.concurrent.CountDownLatch(1);
      var evaluations = new java.util.concurrent.atomic.AtomicInteger();
      // Counting is diagnostic instrumentation; production update functions must be pure.
      try (var executor = java.util.concurrent.Executors.newSingleThreadExecutor()) {
        var future = executor.submit(() -> reference.updateAndGet(old -> {
          if (evaluations.incrementAndGet() == 1) { entered.countDown(); await(release); }
          return old+1;
        }));
        try { await(entered); reference.updateAndGet(old -> old+1); }
        finally { release.countDown(); }
        check(future.get(5,java.util.concurrent.TimeUnit.SECONDS) == 2);
        check(reference.get() == 2 && evaluations.get() >= 2);
      }
      System.out.println(assertions + " assertions passed");
    }
  `;
  const directory = await mkdtemp(path.join(tmpdir(), "senior-java-set12-"));
  const javaHome = process.env.CONTENT_JAVA_HOME || process.env.JAVA_HOME;
  const bin = name => javaHome ? path.join(javaHome, "bin", name) : name;
  try {
    const file = path.join(directory, "DailySet12Checks.java");
    await writeFile(file, `import java.util.*; public class DailySet12Checks {\n${members.join("\n")}\n${checks}\n}`);
    execFileSync(bin("javac"), ["--release", "21", "-d", directory, file], { timeout: 20000 });
    const output = execFileSync(bin("java"), ["-cp", directory, "DailySet12Checks"], { timeout: 30000, encoding: "utf8" });
    assert.match(output, /\d+ assertions passed/);
    console.log(output.trim());
  } finally { await rm(directory, { recursive: true, force: true }); }
});
