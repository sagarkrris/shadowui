import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { SENIOR_JAVA_GUIDE_PARTS, SENIOR_JAVA_GUIDE_CODE } from "../lib/seniorJavaGuide.mjs";

const contentRoot = new URL("../content/senior-java/", import.meta.url);

test("the complete guide is available as safe reading pages with both companion files", async () => {
  const source = await readFile(new URL("Senior-Java-Interview-Master-Guide-Corrected.md", contentRoot), "utf8");
  assert.equal((source.match(/^<!-- ===== Part [1-8]:/gm) || []).length, 8);
  assert.equal((source.match(/^# Part (?:9|10|11|12|13|14|15|16) /gm) || []).length, 8);
  assert.equal(SENIOR_JAVA_GUIDE_PARTS.length, 18); // Part 1 is split; supplemental Part 21 follows Part 16.
  const introduction = await readFile(new URL("rendered/introduction.html", contentRoot), "utf8");
  assert.match(introduction, /Revised 9 October 2026/);
  assert.match(introduction, /Framework, database, cloud and Kubernetes examples are not integration-tested/);

  const pages = await Promise.all(SENIOR_JAVA_GUIDE_PARTS.map(part => readFile(new URL(`rendered/${part.slug}.html`, contentRoot), "utf8")));
  const idsBySlug = new Map(SENIOR_JAVA_GUIDE_PARTS.map((part, index) => [part.slug, [...pages[index].matchAll(/id="([^"]+)"/g)].map(match => match[1])]));
  for (const [index, html] of pages.entries()) {
    assert.match(html, /<h[2-6] id="[^"]+">/);
    assert.doesNotMatch(html, /<(?:script|iframe|style|img)\b|href="(?:javascript:|data:)/i);
    const localIds = idsBySlug.get(SENIOR_JAVA_GUIDE_PARTS[index].slug);
    assert.equal(localIds.length, new Set(localIds).size, "heading IDs must be unique within a page");
    for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(localIds.includes(target), `Missing local target ${target}`);
    for (const [, slug, target] of html.matchAll(/href="\/senior-java-interview\/(part-[^#"]+)#([^"]+)"/g)) {
      assert.ok(idsBySlug.get(slug)?.includes(target), `Missing cross-page target ${slug}#${target}`);
    }
  }
  assert.match(pages[0], /2-Week Plan/);
  assert.match(pages[1], /Module 5: Maven/);
  assert.match(pages[9], /Coding interview practice track/);
  assert.match(pages[11], /SDE-3 Terminology and Follow-up Audit/);
  for (const [offset, first, last] of [[12, 154, 173], [13, 174, 193], [14, 194, 213]]) {
    const html = pages[offset];
    const questionNumbers = [...html.matchAll(/<h4 id="q(\d+)-/g)].map(match => Number(match[1]));
    assert.deepEqual(questionNumbers, Array.from({ length: 20 }, (_, index) => first + index));
    assert.equal(questionNumbers.at(-1), last);
  }
  for (const [offset, first, last] of [[15, 214, 222], [16, 223, 244]]) {
    const html = pages[offset];
    const questionNumbers = [...html.matchAll(/<h4 id="q(\d+)-/g)].map(match => Number(match[1]));
    assert.deepEqual([...questionNumbers].sort((a, b) => a - b), Array.from({ length: last - first + 1 }, (_, index) => first + index));
  }

  for (const file of SENIOR_JAVA_GUIDE_CODE) {
    const code = await readFile(new URL(file.filename, contentRoot), "utf8");
    assert.match(code, new RegExp(`public final class ${file.filename.replace(".java", "")}`));
    assert.match(code, /public static void main\(String\[\] args\)/);
  }
});


test("persistence reading order starts at connections and preserves advanced question bookmarks", async () => {
  const html = await readFile(new URL("rendered/part-16.html", contentRoot), "utf8");
  const headings = [...html.matchAll(/<h4 id="([^"]+)">([^<]+)<\/h4>/g)];
  assert.match(headings[0][2], /^H1 How do we make a connection/);
  const tracks = headings.map(([, , title]) => title.match(/^(H\d+|D\d+|Q\d+)/)?.[1]);
  assert.deepEqual(tracks, ["H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8", "Q226", "Q224", "Q225", "Q223", "Q229", "Q228", "Q230", "Q231", "Q232", "Q227", "Q233", "Q234", "D1", "D2", "Q238", "Q235", "Q236", "Q237", "Q239", "Q240", "Q241", "Q242", "Q243", "Q244"]);
  // Saved question links must still resolve after moving the question blocks.
  assert.ok(headings.some(([, id]) => id === "q223-what-goes-wrong-with-elementcollection-on-a-list"));
  assert.ok(headings.some(([, id]) => id === "q228-what-does-transactional-readonly-true-really-do"));
});

test("Spring annotation ladder precedes the retained numbered internals questions", async () => {
  const html = await readFile(new URL("rendered/part-13.html", contentRoot), "utf8");
  const headings = [...html.matchAll(/<h4 id="([^"]+)">([\s\S]*?)<\/h4>/g)];
  assert.deepEqual(headings.slice(0, 9).map(([, , title]) => title.match(/^S\d+/)?.[0]), Array.from({ length: 9 }, (_, i) => `S${i + 1}`));
  assert.match(headings[9][2], /^Q174 /);
  assert.equal(new Set(headings.map(([, id]) => id)).size, headings.length);
});


test("multithreading ladder teaches lifecycle before synchronization and advanced concurrency", async () => {
  const html = await readFile(new URL("rendered/part-1a.html", contentRoot), "utf8");
  const titles = [...html.matchAll(/<h4 id="t(\d+)-[^"]+">([\s\S]*?)<\/h4>/g)];
  assert.deepEqual(titles.map(([, number]) => Number(number)), Array.from({ length: 16 }, (_, i) => i + 1));
  assert.ok(html.indexOf('id="multithreading-questions-foundations-to-senior-follow-ups"') < html.indexOf('id="multithreading-deep-dives-after-the-foundations"'));
  // Earlier banks must route to the same canonical lesson, rather than duplicate it.
  for (const slug of ["part-2", "part-10", "part-12"]) {
    const bank = await readFile(new URL(`rendered/${slug}.html`, contentRoot), "utf8");
    assert.match(bank, /href="\/senior-java-interview\/part-1a#multithreading-questions-foundations-to-senior-follow-ups"/);
  }
});

test("topic map routes all sixteen subjects to their foundational question", async () => {
  const html = await readFile(new URL("rendered/part-1a.html", contentRoot), "utf8");
  const table = html.split('<h3 id="topic-learning-order-start-with-the-foundations">')[1]?.split("</table>")[0];
  assert.ok(table);
  assert.equal((table.match(/<tr>/g) || []).length, 17);
  for (const target of ["c1-what-should-you-explain-before-collection-internals", "j1-what-do-the-jdk-jvm-heap-and-thread-stacks-do", "multithreading-questions-foundations-to-senior-follow-ups", "spring-boot-annotations-usage-to-internals-to-senior-diagnosis", "start-here-database-connections-and-session-management", "f1-what-is-a-microservice-and-how-does-one-request-cross-services", "k1-how-do-producers-brokers-and-consumers-fit-together", "a1-how-do-authentication-and-authorization-fit-into-a-request", "b1-how-does-maven-build-a-java-application", "g1-what-must-you-understand-before-choosing-a-cloud-runtime", "d1-how-do-an-image-container-pod-and-deployment-differ"]) {
    assert.ok(table.includes(`#${target}"`), target);
  }
});

test("remaining banks expose prerequisites before their advanced follow-ups", async () => {
  const modern = await readFile(new URL("rendered/part-5.html", contentRoot), "utf8");
  const infrastructure = await readFile(new URL("rendered/part-7.html", contentRoot), "utf8");
  for (const [html, prefix, question] of [[modern, "st", "Q75."], [modern, "ca", "Q91."], [modern, "qe", "Q92."], [infrastructure, "tf", "Q106."], [infrastructure, "api", "Q109."]]) {
    const ids = [...html.matchAll(new RegExp(`<h4 id="(${prefix}\\d+-[^"\\n]+)"`, "g"))].map(match => match[1]);
    assert.equal(ids.length, 2, `${prefix} has a foundation and follow-up`);
    assert.ok(html.indexOf(`id="${ids[0]}"`) < html.indexOf(`id="${ids[1]}"`));
    assert.ok(html.indexOf(`id="${ids[1]}"`) < html.indexOf(question), `${prefix} precedes ${question}`);
  }
  const reactive = await readFile(new URL("rendered/part-8.html", contentRoot), "utf8");
  assert.match(reactive, /href="\/senior-java-interview\/part-7#api-questions-before-protocol-choices"/);
  for (const slug of ["part-4", "part-6", "part-8", "part-14", "part-15"]) {
    const html = await readFile(new URL(`rendered/${slug}.html`, contentRoot), "utf8");
    assert.match(html, /href="\/senior-java-interview\/part-1b#module-7-system-design-prompts-practice-45-min-each"/);
  }
});

test("every legacy answer has a distinct learning explanation and answered follow-up", async () => {
  const source = await readFile(new URL("Senior-Java-Interview-Master-Guide-Corrected.md", contentRoot), "utf8");
  const questions = [...source.matchAll(/^\*\*((?:M\d+\.\d+|Q\d+\.)[\s\S]*?)\*\*\n/gm)];
  assert.equal(questions.length, 170);
  const explanations = [];
  const followUps = [];
  for (const [index, question] of questions.entries()) {
    const id = question[1].split(/\s/)[0].replace(/\.$/, "");
    if (["M1.1", "M1.2", "M1.3"].includes(id)) continue; // Existing step-by-step deep dives.
    const block = source.slice(question.index, questions[index + 1]?.index ?? source.indexOf("# AE."));
    const explanation = block.match(/\*\*Worked explanation:\*\* ([^\n]+)/)?.[1];
    const followUp = block.match(/\*\*Follow-up with expected reasoning:\*\* ([^\n]+)/)?.[1];
    assert.ok(explanation, `${id}: missing learning explanation`);
    assert.ok(followUp, `${id}: missing answered follow-up`);
    assert.match(block, /### 30-second version\n\n>/, `${id}: retain the spoken opening`);
    explanations.push(explanation);
    followUps.push(followUp);
  }
  assert.equal(new Set(explanations).size, 167, "Do not replace distinct lessons with repeated boilerplate");
  assert.equal(new Set(followUps).size, 167);
  assert.doesNotMatch(source, /\*\*Plain-English starting point:\*\*|\*\*What is the core mechanism\?\*\*/);
  const numbered = [...source.matchAll(/^(?:\*\*Q(\d+)\.|### Q(\d+) )/gm)].map(match => Number(match[1] || match[2])).sort((a, b) => a - b);
  assert.deepEqual(numbered, Array.from({ length: 244 }, (_, i) => i + 1));
});
