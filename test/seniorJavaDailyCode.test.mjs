import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("Set 4 published Java methods satisfy boundary and exhaustive small-input oracles", async () => {
  const markdown = await readFile(new URL("../content/senior-java/daily/set-04.md", import.meta.url), "utf8");
  const methods = [...markdown.matchAll(/```java\n([\s\S]*?)\n```/g)].map(match => match[1]);
  assert.equal(methods.length, 3);
  const checks = `
    static int assertions;
    static void check(boolean value) { assertions++; if (!value) throw new AssertionError(); }
    static void rejects(Class<? extends Throwable> type, Runnable action) {
      try { action.run(); } catch (Throwable failure) { check(type.isInstance(failure)); return; }
      throw new AssertionError("expected " + type);
    }
    // Independent oracle: enumerate all contiguous partitions using cut masks.
    static long capacityOracle(int[] a, int days) {
      if (a.length == 0) return 0;
      long best = Long.MAX_VALUE;
      for (int cuts = 0; cuts < (1 << (a.length - 1)); cuts++) {
        if (Integer.bitCount(cuts) + 1 > days) continue;
        long max = 0, load = 0;
        for (int i = 0; i < a.length; i++) {
          load += a[i];
          if (i == a.length - 1 || (cuts & (1 << i)) != 0) {
            max = Math.max(max, load); load = 0;
          }
        }
        best = Math.min(best, max);
      }
      return best;
    }
    static int[] maximaOracle(int[] a, int k) {
      int[] result = new int[a.length - k + 1];
      for (int i = 0; i < result.length; i++) {
        result[i] = Integer.MIN_VALUE;
        for (int j = i; j < i + k; j++) result[i] = Math.max(result[i], a[j]);
      }
      return result;
    }
    public static void main(String[] args) {
      List<Integer> source = List.of(2,5);
      List<Number> numbers = new ArrayList<>();
      appendAll(source, numbers); check(numbers.equals(List.of(2,5)));
      List<Object> objects = new ArrayList<>();
      appendAll(numbers, objects); check(objects.equals(numbers));
      appendAll(List.<Integer>of(), numbers); check(numbers.size() == 2);
      rejects(IllegalArgumentException.class, () -> appendAll(numbers, numbers));
      rejects(NullPointerException.class, () -> appendAll(null, numbers));
      rejects(NullPointerException.class, () -> appendAll(source, null));
      rejects(UnsupportedOperationException.class, () -> appendAll(source, List.<Number>of()));
      check(minimumCapacity(new int[]{4,2,5,3}, 2) == 8);
      check(minimumCapacity(new int[]{Integer.MAX_VALUE,Integer.MAX_VALUE}, 1) == 4294967294L);
      check(minimumCapacity(new int[]{Integer.MAX_VALUE,Integer.MAX_VALUE}, 2) == Integer.MAX_VALUE);
      rejects(NullPointerException.class, () -> minimumCapacity(null, 1));
      rejects(IllegalArgumentException.class, () -> minimumCapacity(new int[]{}, 0));
      rejects(IllegalArgumentException.class, () -> minimumCapacity(new int[]{-1}, 1));
      rejects(NullPointerException.class, () -> windowMaxima(null, 1));
      rejects(IllegalArgumentException.class, () -> windowMaxima(new int[]{}, 1));
      rejects(IllegalArgumentException.class, () -> windowMaxima(new int[]{1}, 0));
      rejects(IllegalArgumentException.class, () -> windowMaxima(new int[]{1}, 2));
      check(Arrays.equals(windowMaxima(new int[]{5,5,-2,4,1}, 3), new int[]{5,5,4}));
      check(Arrays.equals(windowMaxima(new int[]{Integer.MIN_VALUE, Integer.MAX_VALUE}, 1), new int[]{Integer.MIN_VALUE, Integer.MAX_VALUE}));
      for (int n = 0; n <= 6; n++) {
        int combinations = (int) Math.pow(3, n);
        for (int encoded = 0; encoded < combinations; encoded++) {
          int[] weights = new int[n], values = new int[n];
          int digits = encoded;
          for (int i = 0; i < n; i++) { weights[i] = digits % 3; values[i] = digits % 3 - 1; digits /= 3; }
          int[] savedWeights = weights.clone(), savedValues = values.clone();
          for (int days = 1; days <= n + 1; days++) check(minimumCapacity(weights, days) == capacityOracle(weights, days));
          for (int k = 1; k <= n; k++) check(Arrays.equals(windowMaxima(values, k), maximaOracle(values, k)));
          check(Arrays.equals(weights, savedWeights)); check(Arrays.equals(values, savedValues));
        }
      }
      System.out.println(assertions + " assertions passed");
    }
  `;
  const directory = await mkdtemp(path.join(tmpdir(), "senior-java-daily-"));
  const javaHome = process.env.CONTENT_JAVA_HOME || process.env.JAVA_HOME;
  const bin = name => javaHome ? path.join(javaHome, "bin", name) : name;
  try {
    const file = path.join(directory, "DailyChecks.java");
    await writeFile(file, `import java.util.*; public class DailyChecks {\n${methods.join("\n")}\n${checks}\n}`);
    execFileSync(bin("javac"), ["--release", "21", "-d", directory, file], { timeout: 20000 });
    const output = execFileSync(bin("java"), ["-cp", directory, "DailyChecks"], { timeout: 10000, encoding: "utf8" });
    assert.match(output, /\d+ assertions passed/);
    console.log(output.trim());
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
