import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildSkillGraph } from "../lib/skillGraph.mjs";

const profile = {
  position: "Backend Engineer",
  stack: "Java, Spring Boot, PostgreSQL, Kafka",
};

const topics = [
  { cat: "Java Core", subs: ["Collections", "Concurrency"] },
  { cat: "Spring Boot", subs: ["REST Controllers", "Security"] },
  { cat: "SQL", subs: ["Indexes", "Transactions"] },
  { cat: "System Design", subs: ["Caching", "Queues"] },
  { cat: "Behavioral", subs: ["STAR", "Leadership"] },
  { cat: "DSA", subs: ["Arrays", "Graphs"] },
];

test("builds the core skill graph with stack-specific nodes", () => {
  const graph = buildSkillGraph({
    profile,
    topics,
    weakSpots: ["SQL indexes need more depth", { topic: "Behavioral", detail: "STAR results are thin" }],
    mockScores: [
      { topic: "Java Core", score: 9 },
      { topic: "Java Core", score: 8 },
      { topic: "Spring Boot", score: 8 },
      { topic: "System Design", score: 6 },
    ],
    questionMemory: {
      questions: {
        "dsa-arrays": { topic: "DSA", attempts: [{ score: 6 }] },
      },
    },
  });

  const byLabel = Object.fromEntries(graph.nodes.map((node) => [node.label, node]));

  for (const label of ["Java Core", "Spring Boot", "SQL", "System Design", "Behavioral", "DSA", "Kafka"]) {
    assert.ok(byLabel[label], `${label} node should exist`);
  }

  assert.equal(byLabel["Java Core"].status, "Mastered");
  assert.equal(byLabel["SQL"].status, "Weak");
  assert.equal(byLabel["DSA"].status, "Improving");
  assert.equal(byLabel["Spring Boot"].status, "Strong");
  assert.equal(byLabel.Kafka.status, "New");
  assert.equal(graph.summary.byStatus.Weak, 2);
  assert.match(graph.focusPrompt, /SQL/);
});

test("maps local evidence into New, Weak, Improving, Strong, and Mastered statuses", () => {
  const graph = buildSkillGraph({
    profile: { stack: "Java" },
    topics: [
      { cat: "New Skill" },
      { cat: "Weak Skill" },
      { cat: "Improving Skill" },
      { cat: "Strong Skill" },
      { cat: "Mastered Skill" },
    ],
    weakSpots: ["Weak Skill"],
    mockScores: [
      { topic: "Improving Skill", score: 6 },
      { topic: "Strong Skill", score: 8 },
      { topic: "Mastered Skill", score: 9 },
      { topic: "Mastered Skill", score: 8 },
    ],
  });

  assert.deepEqual(
    ["New Skill", "Weak Skill", "Improving Skill", "Strong Skill", "Mastered Skill"].map(
      (label) => graph.nodes.find((node) => node.label === label)?.status,
    ),
    ["New", "Weak", "Improving", "Strong", "Mastered"],
  );
});

test("SkillGraphPanel renders the expected status vocabulary", () => {
  const source = readFileSync(new URL("../components/welcome/SkillGraphPanel.js", import.meta.url), "utf8");

  assert.match(source, /Skill Graph/);
  assert.match(source, /Weak/);
  assert.match(source, /Improving/);
  assert.match(source, /Mastered/);
});
