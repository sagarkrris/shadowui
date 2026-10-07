import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("published Part 15 algorithms compile on Java 21 and handle boundaries", async () => {
  const guide = await readFile(new URL("../content/senior-java/Senior-Java-Interview-Master-Guide-Corrected.md", import.meta.url), "utf8");
  const part = guide.split("# Part 15 Full System Design Walkthroughs", 2)[1]?.split("# Part 16 Hibernate and SQL Questions", 1)[0];
  assert.ok(part, "Part 15 exists in the published guide");
  const snippets = [...part.matchAll(/```java\n([\s\S]*?)\n```/g)].map(match => match[1]);
  assert.equal(snippets.length, 6);
  const methods = snippets.map(code => code.replace(/^(int\[\]|int|boolean) (\w+\()/gm, "static $1 $2"));
  const checks = `
    static void check(boolean value) { if (!value) throw new AssertionError(); }
    public static void main(String[] args) {
      check(lengthOfLIS(new int[]{}) == 0);
      check(lengthOfLIS(new int[]{2,2,2}) == 1);
      check(lengthOfLIS(new int[]{3,1,2}) == 2);
      check(canPartition(new int[]{1,5,11,5}));
      check(!canPartition(new int[]{1,2,5}));
      try { canPartition(new int[]{-1,1}); throw new AssertionError(); }
      catch (IllegalArgumentException expected) { }
      check(longestCommonSubsequence("abcde", "ace") == 3);
      check(longestCommonSubsequence("", "ace") == 0);
      check(ladderLength("hit", "cog", java.util.List.of("hot","dot","dog","lot","log","cog")) == 5);
      check(ladderLength("hit", "hit", java.util.List.of()) == 1);
      int[][] flights = {{0,1,100},{1,2,100},{0,2,500}};
      check(findCheapestPrice(3, flights, 0, 2, 1) == 200);
      check(findCheapestPrice(3, flights, 0, 2, 0) == 500);
      check(java.util.Arrays.equals(findRedundantConnection(new int[][]{{1,2},{1,3},{2,3}}), new int[]{2,3}));
    }
  `;
  const directory = await mkdtemp(path.join(tmpdir(), "senior-java-part15-"));
  const javaHome = process.env.CONTENT_JAVA_HOME || process.env.JAVA_HOME;
  const javac = javaHome ? path.join(javaHome, "bin/javac") : "javac";
  const java = javaHome ? path.join(javaHome, "bin/java") : "java";
  try {
    const file = path.join(directory, "Part15Checks.java");
    await writeFile(file, `import java.util.*; public class Part15Checks {\n${methods.join("\n")}\n${checks}\n}`);
    execFileSync(javac, ["--release", "21", "-d", directory, file], { stdio: "pipe", timeout: 20000 });
    execFileSync(java, ["-cp", directory, "Part15Checks"], { stdio: "pipe", timeout: 10000 });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
