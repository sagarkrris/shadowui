import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("Set 7 published trie and edit distance match set scans and exhaustive edit search", async () => {
  const markdown = await readFile(new URL("../content/senior-java/daily/set-07.md", import.meta.url), "utf8");
  const methods = [...markdown.matchAll(/```java\n([\s\S]*?)\n```/g)].map(match => match[1]);
  assert.equal(methods.length, 2);
  const checks = `
    static int assertions;
    static void check(boolean value) { assertions++; if (!value) throw new AssertionError(); }
    static void rejects(Class<? extends Throwable> type, Runnable action) {
      try { action.run(); } catch (Throwable failure) { check(type.isInstance(failure)); return; }
      throw new AssertionError("expected " + type);
    }
    static List<String> words(int max) {
      List<String> result = new ArrayList<>(); result.add("");
      for (int length = 1; length <= max; length++)
        for (int bits = 0; bits < (1 << length); bits++) {
          StringBuilder word = new StringBuilder();
          for (int i = 0; i < length; i++) word.append(((bits >> i) & 1) == 0 ? 'a' : 'b');
          result.add(word.toString());
        }
      return result;
    }
    // BFS explores actual insert/delete/substitute edits, not a DP recurrence.
    static int editOracle(String source, String target) {
      ArrayDeque<String> queue = new ArrayDeque<>(); queue.add(source);
      Map<String,Integer> depth = new HashMap<>(); depth.put(source,0);
      int bound = Math.max(source.length(), target.length());
      while (!queue.isEmpty()) {
        String s = queue.remove(); int d = depth.get(s);
        if (s.equals(target)) return d;
        List<String> next = new ArrayList<>();
        for (int i = 0; i < s.length(); i++) {
          next.add(s.substring(0,i) + s.substring(i+1));
          for (char c : new char[]{'a','b'}) next.add(s.substring(0,i) + c + s.substring(i+1));
        }
        if (s.length() < bound)
          for (int i = 0; i <= s.length(); i++)
            for (char c : new char[]{'a','b'}) next.add(s.substring(0,i) + c + s.substring(i));
        for (String candidate : next) if (!depth.containsKey(candidate)) {
          depth.put(candidate,d+1); queue.add(candidate);
        }
      }
      throw new AssertionError();
    }
    static void verifyTrie(PrefixWords trie, Set<String> stored, List<String> prefixes) {
      for (String prefix : prefixes)
        check(trie.countPrefix(prefix) == stored.stream().filter(w -> w.startsWith(prefix)).count());
    }
    public static void main(String[] args) {
      List<String> all = words(4); List<String> prefixes = words(5); prefixes.add("z");
      PrefixWords trie = new PrefixWords(); Set<String> stored = new HashSet<>();
      verifyTrie(trie,stored,prefixes);
      Random random = new Random(7007);
      for (int run = 0; run < 400; run++) {
        String word = all.get(random.nextInt(all.size()));
        check(trie.add(word) == stored.add(word)); verifyTrie(trie,stored,prefixes);
      }
      for (String bad : new String[]{"abC","a-","é","😀"}) {
        rejects(IllegalArgumentException.class, () -> trie.add(bad));
        rejects(IllegalArgumentException.class, () -> trie.countPrefix(bad));
        verifyTrie(trie,stored,prefixes);
      }
      rejects(NullPointerException.class, () -> trie.add(null));
      rejects(NullPointerException.class, () -> trie.countPrefix(null));
      check(trie.add("zebra")); check(trie.countPrefix("z") == 1);
      List<String> small = words(3);
      for (String a : small) for (String b : small) {
        check(editDistance(a,b) == editOracle(a,b));
        check(editDistance(a,b) == editDistance(b,a));
      }
      check(editDistance("kitten","sitting") == 3);
      check(editDistance("ab","ba") == 2);
      check(editDistance("😀","") == 2);
      check(editDistance("😀","😁") == 1);
      check(editDistance("e\\u0301","é") == 2);
      check(editDistance("a".repeat(200),"a".repeat(180)) == 20);
      rejects(NullPointerException.class, () -> editDistance(null,""));
      rejects(NullPointerException.class, () -> editDistance("",null));
      // Deterministic API boundaries: lazy fallback and stamped stale-state rejection.
      int[] calls = {0};
      java.util.function.Supplier<String> fallback = () -> { calls[0]++; return "new"; };
      check(Optional.of("old").orElseGet(fallback).equals("old")); check(calls[0] == 0);
      check(Optional.<String>empty().orElseGet(fallback).equals("new")); check(calls[0] == 1);
      check(Optional.of("old").orElse(fallback.get()).equals("old")); check(calls[0] == 2);
      Object a = new Object(), b = new Object();
      var slot = new java.util.concurrent.atomic.AtomicStampedReference<Object>(a,7);
      check(slot.compareAndSet(a,b,7,8)); check(slot.compareAndSet(b,a,8,9));
      check(!slot.compareAndSet(a,b,7,10));
      System.out.println(assertions + " assertions passed");
    }
  `;
  const directory = await mkdtemp(path.join(tmpdir(), "senior-java-set07-"));
  const javaHome = process.env.CONTENT_JAVA_HOME || process.env.JAVA_HOME;
  const bin = name => javaHome ? path.join(javaHome, "bin", name) : name;
  try {
    const file = path.join(directory, "DailySet07Checks.java");
    await writeFile(file, `import java.util.*; public class DailySet07Checks {\n${methods.join("\n")}\n${checks}\n}`);
    execFileSync(bin("javac"), ["--release", "21", "-d", directory, file], { timeout: 20000 });
    const output = execFileSync(bin("java"), ["-cp", directory, "DailySet07Checks"], { timeout: 15000, encoding: "utf8" });
    assert.match(output, /\d+ assertions passed/); console.log(output.trim());
  } finally { await rm(directory, { recursive: true, force: true }); }
});
