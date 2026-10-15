import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("Set 10 published stack and multiset window agree with exhaustive independent oracles", async () => {
  const markdown = await readFile(new URL("../content/senior-java/daily/set-10.md", import.meta.url), "utf8");
  const methods = [...markdown.matchAll(/```java\n([\s\S]*?)\n```/g)].map(match => match[1]);
  assert.equal(methods.length, 2);
  const checks = `
    static int assertions;
    static void check(boolean value) { assertions++; if (!value) throw new AssertionError(); }
    static void rejects(Class<? extends Throwable> type, Runnable action) {
      try { action.run(); } catch (Throwable error) { check(type.isInstance(error)); return; }
      throw new AssertionError("expected " + type);
    }
    static long rectangleOracle(int[] heights) {
      long best = 0;
      for (int left = 0; left < heights.length; left++) {
        int min = Integer.MAX_VALUE;
        for (int right = left; right < heights.length; right++) {
          min = Math.min(min, heights[right]);
          best = Math.max(best, (long) min * (right-left+1));
        }
      }
      return best;
    }
    // Enumerate substrings and count characters afresh, without a sliding-window invariant.
    static String coverOracle(String source, String target) {
      int[] required = new int[128];
      for (char c : target.toCharArray()) required[c]++;
      for (int length = 0; length <= source.length(); length++) {
        for (int left = 0; left + length <= source.length(); left++) {
          int[] counts = new int[128];
          for (int i = left; i < left + length; i++) counts[source.charAt(i)]++;
          boolean covers = true;
          for (int c = 0; c < 128; c++) if (counts[c] < required[c]) covers = false;
          if (covers) return source.substring(left, left+length);
        }
      }
      return "";
    }
    static List<String> words(int max) {
      List<String> all = new ArrayList<>(); all.add("");
      List<String> level = List.of("");
      for (int n = 1; n <= max; n++) {
        List<String> next = new ArrayList<>();
        for (String prefix : level) for (char c : new char[]{'A','B','C'}) next.add(prefix+c);
        all.addAll(next); level = next;
      }
      return all;
    }
    static class Broken {
      static int value = fail();
      static int fail() { throw new IllegalStateException("configuration unavailable"); }
    }
    public static void main(String[] args) {
      for (int n = 0; n <= 8; n++) {
        int count = 1 << (n*2);
        for (int code = 0; code < count; code++) {
          int[] input = new int[n]; int bits = code;
          for (int i = 0; i < n; i++) { input[i] = bits & 3; bits >>>= 2; }
          int[] copy = input.clone();
          check(largestRectangle(input) == rectangleOracle(input));
          check(Arrays.equals(input, copy));
        }
      }
      check(largestRectangle(new int[]{2,1,5,6,2,3}) == 10);
      check(largestRectangle(new int[]{Integer.MAX_VALUE,Integer.MAX_VALUE,Integer.MAX_VALUE}) == 6442450941L);
      int[] large = new int[100000]; Arrays.fill(large, 7);
      check(largestRectangle(large) == 700000L);
      for (int i = 0; i < large.length; i++) large[i] = i;
      check(largestRectangle(large) == 2500000000L);
      rejects(NullPointerException.class, () -> largestRectangle(null));
      rejects(IllegalArgumentException.class, () -> largestRectangle(new int[]{2,-1}));
      List<String> targets = words(3);
      for (String source : words(6)) for (String target : targets)
        check(minimumCover(source,target).equals(coverOracle(source,target)));
      check(minimumCover("ABAAC", "AAC").equals("AAC"));
      check(minimumCover("ADOBECODEBANC", "ABC").equals("BANC"));
      check(minimumCover("BACAB", "AB").equals("BA")); // earliest tied solution
      check(minimumCover("x\\u0000y\\u007f", "\\u0000\\u007f").equals("\\u0000y\\u007f"));
      check(minimumCover("A".repeat(100000)+"B", "AB").equals("AB"));
      rejects(NullPointerException.class, () -> minimumCover(null,"A"));
      rejects(NullPointerException.class, () -> minimumCover("A",null));
      rejects(IllegalArgumentException.class, () -> minimumCover("é",""));
      rejects(IllegalArgumentException.class, () -> minimumCover("","é"));
      rejects(IllegalArgumentException.class, () -> minimumCover("😀","A"));
      var listeners = new java.util.concurrent.CopyOnWriteArrayList<>(List.of("A","B"));
      Iterator<String> snapshot = listeners.iterator(); listeners.remove("B");
      List<String> observed = new ArrayList<>(); snapshot.forEachRemaining(observed::add);
      check(observed.equals(List.of("A","B"))); check(listeners.equals(List.of("A")));
      rejects(UnsupportedOperationException.class, snapshot::remove);
      rejects(ExceptionInInitializerError.class, () -> { int ignored = Broken.value; });
      rejects(NoClassDefFoundError.class, () -> { int ignored = Broken.value; });
      rejects(IllegalStateException.class, () -> List.of("SKU7","SKU7").stream().collect(
        java.util.stream.Collectors.toMap(key -> key, key -> 1)));
      record Offer(String sku, int version, int price) {}
      java.util.function.Function<List<Offer>,Offer> validatedNewest = rows -> {
        var versions = rows.stream().collect(java.util.stream.Collectors.groupingBy(Offer::version));
        for (var group : versions.values())
          if (group.stream().map(Offer::price).distinct().count() != 1) throw new IllegalArgumentException("conflict");
        return rows.stream().max(Comparator.comparingInt(Offer::version)).orElseThrow();
      };
      List<Offer> offers = List.of(new Offer("SKU7",2,8),new Offer("SKU7",5,9),new Offer("SKU7",3,7));
      for (List<Offer> input : List.of(offers,List.of(offers.get(2),offers.get(1),offers.get(0)))) {
        var groups = input.parallelStream().collect(java.util.stream.Collectors.groupingBy(Offer::sku));
        check(validatedNewest.apply(groups.get("SKU7")).version() == 5);
      }
      rejects(IllegalArgumentException.class, () -> validatedNewest.apply(List.of(
        new Offer("X",2,1),new Offer("X",7,3),new Offer("X",2,9))));
      check(validatedNewest.apply(List.of(new Offer("X",2,1),new Offer("X",2,1))).price() == 1);
      System.out.println(assertions + " assertions passed");
    }
  `;
  const directory = await mkdtemp(path.join(tmpdir(), "senior-java-set10-"));
  const javaHome = process.env.CONTENT_JAVA_HOME || process.env.JAVA_HOME;
  const bin = name => javaHome ? path.join(javaHome, "bin", name) : name;
  try {
    const file = path.join(directory, "DailySet10Checks.java");
    await writeFile(file, `import java.util.*; public class DailySet10Checks {\n${methods.join("\n")}\n${checks}\n}`);
    execFileSync(bin("javac"), ["--release", "21", "-d", directory, file], { timeout: 20000 });
    const output = execFileSync(bin("java"), ["-cp", directory, "DailySet10Checks"], { timeout: 20000, encoding: "utf8" });
    assert.match(output, /\d+ assertions passed/);
    console.log(output.trim());
  } finally { await rm(directory, { recursive: true, force: true }); }
});
