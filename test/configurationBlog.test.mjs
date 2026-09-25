import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, delimiter } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { listTechBlogs } from "../lib/techBlogs.mjs";
import { getServerSideProps } from "../pages/sitemap.xml.js";

test("configuration course is discoverable and has chapter-specific guidance", () => {
  const blog = listTechBlogs().find(blog => blog.id === "spring-boot-configuration");
  assert.equal(new Set(blog.chapters.map(c => c.whenToUse)).size, 6);
  assert.equal(new Set(blog.chapters.map(c => c.avoid)).size, 6);
  let xml;
  getServerSideProps({ res: { setHeader() {}, write(body) { xml = body; }, end() {} } });
  assert.ok(xml.includes("/tech-blogs/spring-boot-configuration</loc>"));
  assert.equal((xml.match(/\/tech-blogs\/spring-boot-configuration<\/loc>/g) || []).length, 1);
});

test("published configuration examples bind through Spring and reject unsafe inputs", () => {
  const blog = listTechBlogs().find(blog => blog.id === "spring-boot-configuration");
  const fixture = fileURLToPath(new URL("./fixtures/spring-blog/", import.meta.url));
  const dir = mkdtempSync(join(tmpdir(), "configuration-blog-"));
  try {
    const cpFile = join(dir, "classpath.txt");
    execFileSync("mvn", ["-q", "-s", join(fixture, "settings.xml"), "-f", join(fixture, "pom.xml"),
      "org.apache.maven.plugins:maven-dependency-plugin:3.8.1:build-classpath",
      `-Dmdep.outputFile=${cpFile}`], { stdio: "pipe", timeout: 120000 });
    const classpath = readFileSync(cpFile, "utf8").trim();
    const sources = blog.chapters.map((chapter, i) => {
      const path = join(dir, i === 0 ? "PaymentApplication.java" : `Chapter${i}.java`);
      writeFileSync(path, chapter.example);
      return path;
    });
    execFileSync("javac", ["--release", "17", "-cp", classpath, "-d", dir,
      ...sources, join(fixture, "ConfigurationChecks.java")], { stdio: "pipe" });
    execFileSync("java", ["-cp", dir + delimiter + classpath, "ConfigurationChecks"],
      { stdio: "pipe", timeout: 30000 });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
