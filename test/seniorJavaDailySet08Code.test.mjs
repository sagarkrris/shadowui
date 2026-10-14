import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("Set 8 published reconstruction and rotated search match independent exhaustive oracles", async () => {
  const markdown = await readFile(new URL("../content/senior-java/daily/set-08.md", import.meta.url), "utf8");
  const methods = [...markdown.matchAll(/```java\n([\s\S]*?)\n```/g)].map(match => match[1]);
  assert.equal(methods.length, 2);
  const checks = `
    static int assertions;
    static void check(boolean value) { assertions++; if (!value) throw new AssertionError(); }
    static void rejects(Class<? extends Throwable> type, Runnable action) {
      try { action.run(); } catch (Throwable failure) { check(type.isInstance(failure)); return; }
      throw new AssertionError("expected " + type);
    }
    // Enumerate subsequences directly: no tails or dynamic-programming recurrence.
    static int longestOracle(int[] input) {
      int best = 0;
      for (int mask = 0; mask < (1 << input.length); mask++) {
        int count = 0, last = 0; boolean valid = true;
        for (int i = 0; i < input.length; i++) if ((mask & (1 << i)) != 0) {
          if (count > 0 && last >= input[i]) { valid = false; break; }
          last = input[i]; count++;
        }
        if (valid) best = Math.max(best, count);
      }
      return best;
    }
    static void verifySequence(int[] input) {
      int[] copy = input.clone(), result = increasingIndices(input);
      check(result.length == longestOracle(input));
      check(Arrays.equals(input, copy));
      for (int i = 0; i < result.length; i++) {
        check(result[i] >= 0 && result[i] < input.length);
        if (i > 0) { check(result[i-1] < result[i]); check(input[result[i-1]] < input[result[i]]); }
      }
    }
    static void verifySearch(int[] sorted) {
      for (int rotation = 0; rotation < Math.max(1, sorted.length); rotation++) {
        int[] input = new int[sorted.length];
        for (int i = 0; i < input.length; i++) input[i] = sorted[(i + rotation) % sorted.length];
        int[] copy = input.clone();
        for (int target : new int[]{Integer.MIN_VALUE,-2,-1,0,1,2,3,Integer.MAX_VALUE}) {
          boolean present = false;
          for (int value : input) if (value == target) present = true;
          int index = rotatedIndex(input, target);
          check(present ? index >= 0 && index < input.length && input[index] == target : index == -1);
          check(Arrays.equals(input, copy));
        }
      }
    }
    record Job(int priority, long id) {}
    public static void main(String[] args) throws Exception {
      for (int length = 0; length <= 8; length++) {
        int count = 1; for (int i = 0; i < length; i++) count *= 3;
        for (int code = 0; code < count; code++) {
          int[] input = new int[length]; int remaining = code;
          for (int i = 0; i < length; i++) { input[i] = remaining % 3 - 1; remaining /= 3; }
          verifySequence(input);
          // Each nondecreasing multiset appears once before enumerating every rotation.
          boolean sorted = true;
          for (int i = 1; i < length; i++) if (input[i-1] > input[i]) sorted = false;
          if (sorted) verifySearch(input);
        }
      }
      verifySequence(new int[]{3,4,1,2,5});
      verifySequence(new int[]{Integer.MIN_VALUE,0,Integer.MAX_VALUE,Integer.MIN_VALUE});
      verifySearch(new int[]{Integer.MIN_VALUE,-1,0,0,Integer.MAX_VALUE});
      verifySearch(new int[]{1,1,1,1,1});
      int[] large = new int[20000];
      for (int i = 0; i < large.length; i++) large[i] = i;
      int[] indices = increasingIndices(large); check(indices.length == large.length);
      for (int i = 0; i < indices.length; i++) check(indices[i] == i);
      rejects(NullPointerException.class, () -> increasingIndices(null));
      rejects(NullPointerException.class, () -> rotatedIndex(null,0));
      var comparator = Comparator.comparingInt(Job::priority).thenComparingLong(Job::id);
      Set<Job> ordered = new TreeSet<>(comparator);
      check(ordered.add(new Job(7,1))); check(ordered.add(new Job(7,2)));
      check(!ordered.add(new Job(7,1))); check(ordered.size() == 2);
      check(comparator.compare(new Job(Integer.MIN_VALUE,1),new Job(Integer.MAX_VALUE,1)) < 0);
      Set<Job> collapsed = new TreeSet<>(Comparator.comparingInt(Job::priority));
      collapsed.add(new Job(7,1)); check(!collapsed.add(new Job(7,2)));
      var executor = java.util.concurrent.Executors.newSingleThreadExecutor();
      try {
        var failed = executor.submit(() -> { throw new IllegalStateException("invalid job"); });
        try { failed.get(5, java.util.concurrent.TimeUnit.SECONDS); throw new AssertionError(); }
        catch (java.util.concurrent.ExecutionException failure) { check(failure.getCause() instanceof IllegalStateException); }
        check(executor.submit(() -> 42).get(5, java.util.concurrent.TimeUnit.SECONDS) == 42);
      } finally { executor.shutdownNow(); }
      var scheduler = java.util.concurrent.Executors.newSingleThreadScheduledExecutor();
      try {
        var calls = new java.util.concurrent.atomic.AtomicInteger();
        var failed = scheduler.scheduleAtFixedRate(() -> {
          calls.incrementAndGet(); throw new IllegalArgumentException("heartbeat failure");
        },0,1,java.util.concurrent.TimeUnit.MILLISECONDS);
        try { failed.get(5,java.util.concurrent.TimeUnit.SECONDS); throw new AssertionError(); }
        catch (java.util.concurrent.ExecutionException failure) { check(failure.getCause() instanceof IllegalArgumentException); }
        check(failed.isDone()); check(calls.get() == 1);
      } finally { scheduler.shutdownNow(); }
      System.out.println(assertions + " assertions passed");
    }
  `;
  const directory = await mkdtemp(path.join(tmpdir(), "senior-java-set08-"));
  const javaHome = process.env.CONTENT_JAVA_HOME || process.env.JAVA_HOME;
  const bin = name => javaHome ? path.join(javaHome, "bin", name) : name;
  try {
    const file = path.join(directory, "DailySet08Checks.java");
    await writeFile(file, `import java.util.*; public class DailySet08Checks {\n${methods.join("\n")}\n${checks}\n}`);
    execFileSync(bin("javac"), ["--release", "21", "-d", directory, file], { timeout: 20000 });
    const output = execFileSync(bin("java"), ["-cp", directory, "DailySet08Checks"], { timeout: 20000, encoding: "utf8" });
    assert.match(output, /\d+ assertions passed/); console.log(output.trim());
  } finally { await rm(directory, { recursive: true, force: true }); }
});
