import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("Set 5 published graph methods match all-pairs oracles and reject invalid graphs", async () => {
  const markdown = await readFile(new URL("../content/senior-java/daily/set-05.md", import.meta.url), "utf8");
  const methods = [...markdown.matchAll(/```java\n([\s\S]*?)\n```/g)].map(match => match[1]);
  assert.equal(methods.length, 2);
  const checks = `
    static int assertions;
    static void check(boolean value) { assertions++; if (!value) throw new AssertionError(); }
    static void rejects(Class<? extends Throwable> type, Runnable action) {
      try { action.run(); } catch (Throwable failure) { check(type.isInstance(failure)); return; }
      throw new AssertionError("expected " + type);
    }
    // Independent all-pairs dynamic programming, not queue/heap traversal.
    static long[][] oracle(Road[][] roads) {
      int n = roads.length;
      long[][] d = new long[n][n];
      for (int i = 0; i < n; i++) {
        Arrays.fill(d[i], Long.MAX_VALUE); d[i][i] = 0;
        for (Road r : roads[i]) d[i][r.to()] = Math.min(d[i][r.to()], r.cost());
      }
      for (int k = 0; k < n; k++) for (int i = 0; i < n; i++) for (int j = 0; j < n; j++)
        if (d[i][k] != Long.MAX_VALUE && d[k][j] != Long.MAX_VALUE)
          d[i][j] = Math.min(d[i][j], d[i][k] + d[k][j]);
      return d;
    }
    static void verify(Road[][] roads, int[] depots) {
      int n = roads.length;
      String saved = Arrays.deepToString(roads);
      long[][] weighted = oracle(roads);
      int[][] edges = new int[n][];
      Road[][] unit = new Road[n][];
      for (int u = 0; u < n; u++) {
        edges[u] = new int[roads[u].length]; unit[u] = new Road[roads[u].length];
        for (int i = 0; i < roads[u].length; i++) {
          int v = roads[u][i].to(); edges[u][i] = v; unit[u][i] = new Road(v, 1);
        }
      }
      String savedEdges = Arrays.deepToString(edges);
      int[] savedDepots = depots.clone();
      long[][] hops = oracle(unit);
      int[] actual = nearestDepot(edges, depots);
      for (int v = 0; v < n; v++) {
        long expected = Long.MAX_VALUE;
        for (int s : depots) expected = Math.min(expected, hops[s][v]);
        check(actual[v] == (expected == Long.MAX_VALUE ? -1 : (int) expected));
      }
      for (int s = 0; s < n; s++) check(Arrays.equals(cheapestRoutes(roads, s), weighted[s]));
      check(saved.equals(Arrays.deepToString(roads)));
      check(savedEdges.equals(Arrays.deepToString(edges)));
      check(Arrays.equals(depots, savedDepots));
    }
    public static void main(String[] args) {
      verify(new Road[][]{}, new int[]{});
      verify(new Road[][]{{new Road(1,10),new Road(2,1)}, {}, {new Road(1,2)}, {}}, new int[]{0,2,2});
      verify(new Road[][]{{new Road(1,Integer.MAX_VALUE)}, {new Road(2,Integer.MAX_VALUE)}, {}}, new int[]{0});
      check(cheapestRoutes(new Road[][]{{new Road(1,Integer.MAX_VALUE)}, {new Road(2,Integer.MAX_VALUE)}, {}}, 0)[2] == 4294967294L);
      verify(new Road[][]{{new Road(0,0),new Road(1,7),new Road(1,0)}, {new Road(0,0)}, {}}, new int[]{});
      // Exhaust every directed 3-vertex graph, including self loops, and every source subset.
      for (int mask = 0; mask < 512; mask++) {
        Road[][] roads = new Road[3][];
        for (int u = 0; u < 3; u++) {
          List<Road> row = new ArrayList<>();
          for (int v = 0; v < 3; v++) if ((mask & (1 << (u * 3 + v))) != 0)
            row.add(new Road(v, (u * 3 + v) % 4));
          roads[u] = row.toArray(Road[]::new);
        }
        for (int subset = 0; subset < 8; subset++) {
          int[] sources = new int[Integer.bitCount(subset)]; int p = 0;
          for (int v = 0; v < 3; v++) if ((subset & (1 << v)) != 0) sources[p++] = v;
          verify(roads, sources);
        }
      }
      Random random = new Random(5005);
      for (int run = 0; run < 150; run++) {
        int n = 1 + random.nextInt(9);
        Road[][] roads = new Road[n][];
        for (int u = 0; u < n; u++) {
          roads[u] = new Road[random.nextInt(2 * n + 1)];
          for (int i = 0; i < roads[u].length; i++) roads[u][i] = new Road(random.nextInt(n), random.nextInt(30));
        }
        verify(roads, new int[]{random.nextInt(n), random.nextInt(n)});
      }
      rejects(NullPointerException.class, () -> nearestDepot(null, new int[]{}));
      rejects(NullPointerException.class, () -> nearestDepot(new int[][]{}, null));
      rejects(NullPointerException.class, () -> nearestDepot(new int[][]{null}, new int[]{}));
      rejects(IllegalArgumentException.class, () -> nearestDepot(new int[][]{{-1}}, new int[]{}));
      rejects(IllegalArgumentException.class, () -> nearestDepot(new int[][]{{1}}, new int[]{}));
      rejects(IllegalArgumentException.class, () -> nearestDepot(new int[][]{{}}, new int[]{-1}));
      rejects(IllegalArgumentException.class, () -> nearestDepot(new int[][]{}, new int[]{0}));
      rejects(NullPointerException.class, () -> cheapestRoutes(null, 0));
      rejects(IllegalArgumentException.class, () -> cheapestRoutes(new Road[][]{}, 0));
      rejects(IllegalArgumentException.class, () -> cheapestRoutes(new Road[][]{{}}, -1));
      rejects(NullPointerException.class, () -> cheapestRoutes(new Road[][]{null}, 0));
      rejects(NullPointerException.class, () -> cheapestRoutes(new Road[][]{{null}}, 0));
      rejects(IllegalArgumentException.class, () -> cheapestRoutes(new Road[][]{{new Road(-1,0)}}, 0));
      rejects(IllegalArgumentException.class, () -> cheapestRoutes(new Road[][]{{new Road(1,0)}}, 0));
      rejects(IllegalArgumentException.class, () -> cheapestRoutes(new Road[][]{{}, {new Road(1,-1)}}, 0));
      System.out.println(assertions + " assertions passed");
    }
  `;
  const directory = await mkdtemp(path.join(tmpdir(), "senior-java-set05-"));
  const javaHome = process.env.CONTENT_JAVA_HOME || process.env.JAVA_HOME;
  const bin = name => javaHome ? path.join(javaHome, "bin", name) : name;
  try {
    const file = path.join(directory, "DailyGraphChecks.java");
    await writeFile(file, `import java.util.*; public class DailyGraphChecks {\n${methods.join("\n")}\n${checks}\n}`);
    execFileSync(bin("javac"), ["--release", "21", "-d", directory, file], { timeout: 20000 });
    const output = execFileSync(bin("java"), ["-cp", directory, "DailyGraphChecks"], { timeout: 10000, encoding: "utf8" });
    assert.match(output, /\d+ assertions passed/);
    console.log(output.trim());
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
