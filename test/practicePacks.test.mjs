import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildPracticeMockPrompt,
  getPracticePack,
} from "../lib/practicePacks.mjs";

const practicePackSource = readFileSync(new URL("../components/welcome/PracticePack.js", import.meta.url), "utf8");

test("returns Spring Boot practice cards for a Java Spring profile", () => {
  const pack = getPracticePack({
    profile: {
      name: "Sagar",
      position: "Backend Developer",
      experience: "4 years",
      stack: "Java, Spring Boot, PostgreSQL",
    },
    selectedCat: "Spring Boot",
    selectedSub: "Spring Security",
    difficulty: "Senior",
    seed: "spring-security-round-1",
  });

  assert.equal(pack.source, "local-curated");
  assert.match(pack.title, /Spring Boot/i);
  assert.equal(pack.difficulty, "Senior");
  assert.equal(pack.bankSize, 50);
  assert.equal(pack.cards.length, 5);
  assert.ok(pack.cards.some((card) => /JWT|Security|secure/i.test(card.question)));
  assert.ok(pack.cards.every((card) => card.answerPoints.length >= 3));
  assert.ok(pack.cards.every((card) => card.followUps.length >= 2));
  assert.ok(pack.cards.every((card) => card.experienceLevel === "Senior"));
});

test("prioritizes React cards for React and Next.js stacks", () => {
  const pack = getPracticePack({
    profile: {
      name: "Maya",
      position: "Frontend Engineer",
      experience: "3 years",
      stack: "React, Next.js, TypeScript",
    },
    selectedCat: "React Core",
    selectedSub: "Performance",
    difficulty: "Mid",
    seed: "react-performance-round-1",
  });

  assert.equal(pack.bankSize, 50);
  assert.match(pack.title, /React/i);
  assert.ok(pack.cards.some((card) => /render|performance|memo/i.test(card.question)));
  assert.ok(pack.cards.some((card) => card.tags.includes("Performance")));
});

test("falls back to selected DSA topic when stack is unknown", () => {
  const pack = getPracticePack({
    profile: {
      name: "Ravi",
      position: "Software Engineer",
      experience: "2 years",
      stack: "Internal tools",
    },
    selectedCat: "DSA",
    selectedSub: "Trees & Graphs",
    difficulty: "Entry",
    seed: "dsa-graphs-round-1",
  });

  assert.equal(pack.bankSize, 50);
  assert.match(pack.title, /DSA/i);
  assert.ok(pack.cards.some((card) => /tree|graph|travers/i.test(card.question)));
  assert.ok(pack.cards.every((card) => card.experienceLevel === "Entry"));
});

test("routes generic SQL stacks to the database practice pack", () => {
  const pack = getPracticePack({
    profile: {
      name: "Sagar",
      position: "Software Engineer",
      experience: "5 years",
      stack: "SQL",
    },
    selectedCat: "SQL & Relational Databases",
    selectedSub: "Indexing & Query Plans",
    difficulty: "Mid",
    seed: "sql-round-1",
  });

  assert.equal(pack.id, "databases");
  assert.equal(pack.bankSize, 50);
  assert.ok(pack.cards.some((card) => /sql|query|index/i.test(card.question)));
});

test("routes SAP, Ruby, and Rust stacks to useful local practice packs", () => {
  const sap = getPracticePack({
    profile: { stack: "SAP ABAP, S/4HANA" },
    selectedCat: "SAP Core",
    selectedSub: "OData Services",
    seed: "sap-round-1",
  });
  const ruby = getPracticePack({
    profile: { stack: "Ruby on Rails" },
    selectedCat: "Ruby Core",
    selectedSub: "Rails MVC",
    seed: "ruby-round-1",
  });
  const rust = getPracticePack({
    profile: { stack: "Rust, Tokio" },
    selectedCat: "Rust Core",
    selectedSub: "Ownership & Borrowing",
    seed: "rust-round-1",
  });

  assert.equal(sap.id, "backend-api");
  assert.equal(ruby.id, "backend-api");
  assert.equal(rust.id, "backend-api");
});

test("uses seeded random selection so repeated rounds can avoid shown questions", () => {
  const baseArgs = {
    profile: {
      name: "Sagar",
      position: "Backend Developer",
      experience: "4 years",
      stack: "Java, Spring Boot, PostgreSQL",
    },
    selectedCat: "Spring Boot",
    selectedSub: "JPA & Hibernate",
    difficulty: "Senior",
  };

  const first = getPracticePack({ ...baseArgs, seed: "round-1" });
  const firstIds = first.cards.map((card) => card.id);
  const repeated = getPracticePack({ ...baseArgs, seed: "round-1" });
  const second = getPracticePack({ ...baseArgs, seed: "round-2", excludeIds: firstIds });
  const secondIds = second.cards.map((card) => card.id);

  assert.deepEqual(repeated.cards.map((card) => card.id), firstIds);
  assert.equal(new Set(firstIds).size, firstIds.length);
  assert.equal(new Set(secondIds).size, secondIds.length);
  assert.ok(secondIds.every((id) => !firstIds.includes(id)));
});

test("builds a mock prompt from a practice card without requiring generation", () => {
  const card = {
    question: "How do you tune a slow SQL query?",
    answerPoints: ["Read the query plan", "Check indexes", "Measure before changing"],
    followUps: ["What can make an index harmful?"],
    tags: ["Databases", "Performance"],
  };

  const prompt = buildPracticeMockPrompt({
    profile: { name: "Sagar", stack: "Java, Spring Boot" },
    topic: "SQL Design",
    difficulty: "Lead",
    card,
  });

  assert.match(prompt, /Sagar/);
  assert.match(prompt, /Lead/);
  assert.match(prompt, /SQL Design/);
  assert.match(prompt, /How do you tune/);
  assert.match(prompt, /Score:/);
});

test("orders practice cards with question memory and exposes mastery labels", () => {
  const baseline = getPracticePack({
    profile: { stack: "React, Next.js, TypeScript" },
    selectedCat: "React Core",
    selectedSub: "Performance",
    difficulty: "Mid",
    seed: "memory-aware-round",
  });
  const [mastered, needsReview] = baseline.cards;

  const pack = getPracticePack({
    profile: { stack: "React, Next.js, TypeScript" },
    selectedCat: "React Core",
    selectedSub: "Performance",
    difficulty: "Mid",
    seed: "memory-aware-round",
    questionMemory: {
      questions: {
        [mastered.id]: {
          questionId: mastered.id,
          attempts: [
            { score: 9, attemptedAt: "2026-05-28T08:00:00.000Z" },
            { score: 9, attemptedAt: "2026-05-29T08:00:00.000Z" },
          ],
        },
        [needsReview.id]: {
          questionId: needsReview.id,
          attempts: [{ score: 4, attemptedAt: "2026-05-29T08:00:00.000Z" }],
        },
      },
    },
    now: "2026-05-29T12:00:00.000Z",
  });

  assert.equal(pack.cards[0].id, needsReview.id);
  assert.equal(pack.cards[0].masteryStatus, "Needs Review");
  assert.equal(pack.cards.at(-1).id, mastered.id);
  assert.equal(pack.cards.at(-1).masteryStatus, "Mastered");
});

test("practice pack UI renders visible mastery status labels", () => {
  assert.match(practicePackSource, /masteryStatus/);
  assert.match(practicePackSource, /recordQuestionAttempt/);
  assert.match(practicePackSource, /Needs Review/);
  assert.match(practicePackSource, /Mastered/);
  assert.match(practicePackSource, /Beginner Explanation/);
  assert.match(practicePackSource, /What is this\?/);
  assert.match(practicePackSource, /Why does it matter\?/);
  assert.match(practicePackSource, /Where is it used\?/);
  assert.match(practicePackSource, /Interview-ready answer/);
  assert.match(practicePackSource, /Practice example/);
  assert.match(practicePackSource, /Common confusion/);
  assert.match(practicePackSource, /Full Guide Shown/);
  assert.doesNotMatch(practicePackSource, /Show Guide/);
});
