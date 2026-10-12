import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("Set 6 published connectivity and voucher methods match independent traversal oracles", async () => {
  const markdown = await readFile(new URL("../content/senior-java/daily/set-06.md", import.meta.url), "utf8");
  const methods = [...markdown.matchAll(/```java\n([\s\S]*?)\n```/g)].map(match => match[1]);
  assert.equal(methods.length, 2);
  const checks = `
    static int assertions;
    static void check(boolean value) { assertions++; if (!value) throw new AssertionError(); }
    static void rejects(Class<? extends Throwable> type, Runnable action) {
      try { action.run(); } catch (Throwable failure) { check(type.isInstance(failure)); return; }
      throw new AssertionError("expected " + type);
    }
    // Rebuild undirected adjacency and count components by traversal after every prefix.
    static void verifyLinks(int vertices, int[][] links) {
      String saved = Arrays.deepToString(links);
      int[] actual = componentsAfterLinks(vertices, links);
      check(actual.length == links.length);
      boolean[][] adjacent = new boolean[vertices][vertices];
      for (int i = 0; i < links.length; i++) {
        int a = links[i][0], b = links[i][1]; adjacent[a][b] = adjacent[b][a] = true;
        boolean[] seen = new boolean[vertices]; int count = 0;
        for (int v = 0; v < vertices; v++) if (!seen[v]) {
          count++; ArrayDeque<Integer> queue = new ArrayDeque<>(); queue.add(v); seen[v] = true;
          while (!queue.isEmpty()) {
            int u = queue.remove();
            for (int w = 0; w < vertices; w++) if (adjacent[u][w] && !seen[w]) {
              seen[w] = true; queue.add(w);
            }
          }
        }
        check(actual[i] == count);
      }
      check(saved.equals(Arrays.deepToString(links)));
    }
    // BFS on amounts: edges add one voucher, so first reach minimizes voucher count.
    static int voucherOracle(int amount, int[] values) {
      boolean[] seen = new boolean[amount + 1];
      ArrayDeque<int[]> queue = new ArrayDeque<>(); queue.add(new int[]{0,0}); seen[0] = true;
      while (!queue.isEmpty()) {
        int[] item = queue.remove(); if (item[0] == amount) return item[1];
        for (int value : values) {
          long next = (long) item[0] + value;
          if (next <= amount && !seen[(int) next]) {
            seen[(int) next] = true; queue.add(new int[]{(int) next, item[1] + 1});
          }
        }
      }
      return -1;
    }
    static void verifyVouchers(int amount, int[] values) {
      int[] saved = values.clone();
      check(fewestVouchers(amount, values) == voucherOracle(amount, values));
      check(Arrays.equals(saved, values));
    }
    public static void main(String[] args) {
      verifyLinks(0, new int[][]{}); verifyLinks(8, new int[][]{});
      verifyLinks(4, new int[][]{{0,1},{1,0},{2,2},{1,2}});
      check(Arrays.equals(componentsAfterLinks(4, new int[][]{{0,1},{1,0},{2,2},{1,2}}), new int[]{3,3,3,2}));
      // All four-link sequences on three vertices, with every orientation and self-link.
      for (int code = 0; code < 6561; code++) {
        int[][] links = new int[4][2]; int cursor = code;
        for (int i = 0; i < 4; i++) { int edge = cursor % 9; cursor /= 9; links[i][0] = edge / 3; links[i][1] = edge % 3; }
        verifyLinks(3, links);
      }
      Random random = new Random(6006);
      for (int run = 0; run < 100; run++) {
        int n = 1 + random.nextInt(30); int[][] links = new int[80][2];
        for (int[] edge : links) { edge[0] = random.nextInt(n); edge[1] = random.nextInt(n); }
        verifyLinks(n, links);
      }
      // Every subset of values 1..8, including no denominations, for amounts 0..40.
      for (int mask = 0; mask < 256; mask++) {
        int[] values = new int[Integer.bitCount(mask)]; int p = 0;
        for (int v = 1; v <= 8; v++) if ((mask & (1 << (v-1))) != 0) values[p++] = v;
        for (int amount = 0; amount <= 40; amount++) verifyVouchers(amount, values);
      }
      verifyVouchers(6, new int[]{1,3,4}); check(fewestVouchers(6, new int[]{1,3,4}) == 2);
      verifyVouchers(5, new int[]{4,6}); verifyVouchers(13, new int[]{7,7,3,1});
      verifyVouchers(4, new int[]{Integer.MAX_VALUE,2});
      check(fewestVouchers(0, new int[]{}) == 0);
      rejects(NullPointerException.class, () -> componentsAfterLinks(1, null));
      rejects(IllegalArgumentException.class, () -> componentsAfterLinks(-1, new int[][]{}));
      rejects(NullPointerException.class, () -> componentsAfterLinks(1, new int[][]{null}));
      rejects(IllegalArgumentException.class, () -> componentsAfterLinks(1, new int[][]{{}}));
      rejects(IllegalArgumentException.class, () -> componentsAfterLinks(1, new int[][]{{0,0,0}}));
      rejects(IllegalArgumentException.class, () -> componentsAfterLinks(1, new int[][]{{-1,0}}));
      rejects(IllegalArgumentException.class, () -> componentsAfterLinks(1, new int[][]{{0,1}}));
      rejects(IllegalArgumentException.class, () -> componentsAfterLinks(0, new int[][]{{0,0}}));
      rejects(NullPointerException.class, () -> fewestVouchers(0, null));
      rejects(IllegalArgumentException.class, () -> fewestVouchers(-1, new int[]{1}));
      rejects(IllegalArgumentException.class, () -> fewestVouchers(Integer.MAX_VALUE, new int[]{1}));
      rejects(IllegalArgumentException.class, () -> fewestVouchers(0, new int[]{0}));
      rejects(IllegalArgumentException.class, () -> fewestVouchers(5, new int[]{-1,2}));
      System.out.println(assertions + " assertions passed");
    }
  `;
  const directory = await mkdtemp(path.join(tmpdir(), "senior-java-set06-"));
  const javaHome = process.env.CONTENT_JAVA_HOME || process.env.JAVA_HOME;
  const bin = name => javaHome ? path.join(javaHome, "bin", name) : name;
  try {
    const file = path.join(directory, "DailySet06Checks.java");
    await writeFile(file, `import java.util.*; public class DailySet06Checks {\n${methods.join("\n")}\n${checks}\n}`);
    execFileSync(bin("javac"), ["--release", "21", "-d", directory, file], { timeout: 20000 });
    const output = execFileSync(bin("java"), ["-cp", directory, "DailySet06Checks"], { timeout: 15000, encoding: "utf8" });
    assert.match(output, /\d+ assertions passed/);
    console.log(output.trim());
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
