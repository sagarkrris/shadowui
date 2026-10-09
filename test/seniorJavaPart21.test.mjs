import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { SENIOR_JAVA_GUIDE_PARTS } from "../lib/seniorJavaGuide.mjs";

const chapterUrl = new URL("../content/senior-java/part-21.md", import.meta.url);

test("Part 21 is catalogued, safely rendered and preserves all twenty learning ladders", async () => {
  const chapter = await readFile(chapterUrl, "utf8");
  const html = await readFile(new URL("../content/senior-java/rendered/part-21.html", import.meta.url), "utf8");
  assert.equal(SENIOR_JAVA_GUIDE_PARTS.at(-1).slug, "part-21");
  const masterUrl = new URL("../content/senior-java/Senior-Java-Interview-Master-Guide-Corrected.md", import.meta.url);
  const master = await readFile(masterUrl, "utf8");
  const target = master.match(/\[Part 21:[^\]]+\]\(([^)]+)\)/)?.[1];
  assert.ok(target, "Master contents must link to the supplemental chapter");
  const [file, anchor] = target.split("#");
  const linkedChapter = await readFile(new URL(file, masterUrl), "utf8");
  assert.equal(linkedChapter, chapter);
  assert.equal(anchor, chapter.split("\n")[0].slice(2).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, ""));
  const blocks = chapter.split(/^### Q/gm).slice(1);
  assert.deepEqual(blocks.map(block => Number(block.slice(0, 3))), Array.from({ length: 20 }, (_, i) => i + 273));
  for (const block of blocks) {
    for (let tier = 1; tier <= 4; tier++) assert.equal((block.match(new RegExp(`^\\*\\*Tier ${tier} -`, "gm")) || []).length, 1);
    for (let probe = 1; probe <= 3; probe++) assert.equal((block.match(new RegExp(`^\\*\\*Probe ${probe} `, "gm")) || []).length, 1);
  }
  assert.deepEqual([...html.matchAll(/<h4 id="q(\d+)-/g)].map(match => Number(match[1])), Array.from({ length: 20 }, (_, i) => i + 273));
  assert.doesNotMatch(html, /<(?:script|iframe|style|img)\b|href="(?:javascript:|data:)/i);
  const introduction = await readFile(new URL("../content/senior-java/rendered/introduction.html", import.meta.url), "utf8");
  assert.match(introduction, /href="\/senior-java-interview\/part-21#part-21-production-resilience-delivery-and-jvm-operations-q273-q292"/);
});

test("published Part 21 Java fragments handle coalescing, cleanup and cooperative scope termination", async () => {
  const chapter = await readFile(chapterUrl, "utf8");
  const snippets = [...chapter.matchAll(/```java\n([\s\S]*?)\n```/g)].map(match => match[1]);
  assert.equal(snippets.length, 2, "All published Java fragments must be selected by the fixture");
  const template = await readFile(new URL("fixtures/Part21Checks.java", import.meta.url), "utf8");
  const source = template.replace("// PUBLISHED_SINGLE_FLIGHT", snippets[0]).replace("// PUBLISHED_STRUCTURED_SCOPE", snippets[1]);
  const directory = await mkdtemp(path.join(tmpdir(), "senior-java-part21-"));
  const javaHome = process.env.CONTENT_JAVA_HOME || process.env.JAVA_HOME;
  const javac = javaHome ? path.join(javaHome, "bin/javac") : "javac";
  const java = javaHome ? path.join(javaHome, "bin/java") : "java";
  try {
    const file = path.join(directory, "Part21Checks.java");
    await writeFile(file, source);
    execFileSync(javac, ["--release", "21", "--enable-preview", "-d", directory, file], { stdio: "pipe", timeout: 30000 });
    const output = execFileSync(java, ["--enable-preview", "-cp", directory, "Part21Checks"], { encoding: "utf8", timeout: 15000 });
    assert.match(output, /PASS: single-flight, scope shutdown, close termination, scoped binding and mutable object checks/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
