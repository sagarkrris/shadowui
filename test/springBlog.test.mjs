import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, delimiter } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { listTechBlogs } from "../lib/techBlogs.mjs";

test("published Spring resource server rejects invalid tokens and unauthorized requests", () => {
  const examples = listTechBlogs().flatMap(blog => blog.chapters)
    .filter(chapter => chapter.exampleRuntime === "spring-security");
  assert.equal(examples.length, 1);
  const fixture = fileURLToPath(new URL("./fixtures/spring-blog/", import.meta.url));
  const dir = mkdtempSync(join(tmpdir(), "spring-blog-test-"));
  try {
    const cpFile = join(dir, "classpath.txt");
    execFileSync("mvn", ["-q", "-s", join(fixture, "settings.xml"), "-f", join(fixture, "pom.xml"),
      "org.apache.maven.plugins:maven-dependency-plugin:3.8.1:build-classpath",
      `-Dmdep.outputFile=${cpFile}`], { stdio: "pipe", timeout: 120000 });
    const classpath = readFileSync(cpFile, "utf8").trim();
    const source = join(dir, "OrdersSecurity.java");
    writeFileSync(source, examples[0].example);
    execFileSync("javac", ["--release", "17", "-cp", classpath, "-d", dir,
      source, join(fixture, "SpringSecurityChecks.java")], { stdio: "pipe" });
    execFileSync("java", ["-cp", dir + delimiter + classpath, "SpringSecurityChecks"],
      { stdio: "pipe", timeout: 30000 });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
