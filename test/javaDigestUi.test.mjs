import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const componentUrl = new URL("../components/java-digest/JavaDigest.js", import.meta.url);
const componentSource = existsSync(componentUrl) ? readFileSync(componentUrl, "utf8") : "";
const indexSource = readFileSync(new URL("../pages/index.js", import.meta.url), "utf8");
const workspaceSource = readFileSync(new URL("../lib/workspaces.mjs", import.meta.url), "utf8");

test("java digest component renders topic, article, and roadmap sections", () => {
  assert.match(componentSource, /JAVA_DIGEST_TRACKS/);
  assert.match(componentSource, /CSES_JAVA_PARTS/);
  assert.match(componentSource, /Java Digest/);
  assert.match(componentSource, /Handbook Java/);
  assert.match(componentSource, /Competitive Programmer&apos;s Handbook for Java/);
  assert.match(componentSource, /Search Interview Topic/);
  assert.match(componentSource, /buildJavaDigestGeneratedTopicPrompt/);
  assert.match(componentSource, /\/api\/chat/);
  assert.match(componentSource, /AI Interview Explainer/);
  assert.match(componentSource, /CsesChapterCard/);
  assert.match(componentSource, /CsesPartSection/);
  assert.match(componentSource, /Book-style table of contents/);
  assert.match(componentSource, /Detailed Explanation/);
  assert.match(componentSource, /How To Think About It/);
  assert.match(componentSource, /Java Implementation Notes/);
  assert.match(componentSource, /Worked Example/);
  assert.match(componentSource, /Java Sketch/);
  assert.match(componentSource, /Deep Study Path/);
  assert.match(componentSource, /Interview Answer/);
  assert.match(componentSource, /Common Mistakes/);
  assert.match(componentSource, /Practice Tasks/);
  assert.match(componentSource, /Explain More/);
  assert.match(componentSource, /Show Less/);
  assert.doesNotMatch(componentSource, /Java Implementation Checkpoint/);
  assert.match(componentSource, /Study Chapter in Java/);
  assert.match(componentSource, /buildCsesJavaPracticePrompt/);
  assert.match(componentSource, /searchDraft/);
  assert.match(componentSource, /submitSearch/);
  assert.match(componentSource, /interface/);
  assert.match(componentSource, /segment tree/);
  assert.match(componentSource, /Articles/);
  assert.match(componentSource, /Article Filters/);
  assert.match(componentSource, /All Articles/);
  assert.match(componentSource, /Roadmaps/);
  assert.match(componentSource, /Coach Me/);
  assert.match(componentSource, /Mock Drill/);
  assert.match(componentSource, /Build My Plan/);
  assert.match(componentSource, /buildJavaDigestCoachPrompt/);
  assert.match(componentSource, /buildJavaDigestMockPrompt/);
});

test("java digest is wired as a first-class workspace", () => {
  assert.match(indexSource, /JavaDigest/);
  assert.match(indexSource, /activeTab==="javaDigest"/);
  assert.match(indexSource, /startJavaDigestAction/);
  assert.match(workspaceSource, /javaDigest/);
  assert.match(workspaceSource, /Java Digest/);
  assert.match(workspaceSource, /ti-news/);
});
