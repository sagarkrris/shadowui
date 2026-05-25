import assert from "node:assert/strict";
import test from "node:test";

import {
  getPrepLabel,
  getRecommendedTopics,
} from "../lib/prepTopics.mjs";

test("returns Python-focused preparation topics for a Python stack", () => {
  const topics = getRecommendedTopics({
    position: "Backend Developer",
    stack: "Python, Django, PostgreSQL",
  });

  assert.equal(topics[0].cat, "Python Core");
  assert.equal(topics[0].icon, "ti-brand-python");
  assert.ok(topics.some((topic) => topic.cat === "Django & FastAPI"));
  assert.ok(topics.some((topic) => topic.subs.includes("Pytest")));
  assert.ok(topics.some((topic) => topic.subs.includes("DSA in Python")));
});

test("returns Java-focused preparation topics for a Java stack", () => {
  const topics = getRecommendedTopics({
    position: "Backend Developer",
    stack: "Java, Spring Boot, PostgreSQL",
  });

  assert.equal(topics[0].cat, "Java Core");
  assert.ok(topics.some((topic) => topic.cat === "Spring Boot"));
  assert.ok(topics.some((topic) => topic.subs.includes("JPA & Hibernate")));
});

test("returns neutral SQL topics for a generic SQL stack", () => {
  const topics = getRecommendedTopics({
    position: "Data-focused Software Engineer",
    stack: "SQL",
  });

  assert.equal(topics[0].cat, "SQL & Relational Databases");
  assert.ok(topics.some((topic) => topic.subs.includes("Joins & Aggregations")));
  assert.ok(topics.some((topic) => topic.subs.includes("Indexing & Query Plans")));
  assert.ok(!topics.some((topic) => topic.cat === "PostgreSQL"));
});

test("returns SAP-focused preparation topics for an SAP stack", () => {
  const topics = getRecommendedTopics({
    position: "SAP Developer",
    stack: "SAP ABAP, S/4HANA",
  });

  assert.equal(topics[0].cat, "SAP Core");
  assert.ok(topics.some((topic) => topic.subs.includes("ABAP")));
  assert.ok(topics.some((topic) => topic.subs.includes("S/4HANA")));
});

test("returns Ruby-focused preparation topics for a Ruby stack", () => {
  const topics = getRecommendedTopics({
    position: "Backend Developer",
    stack: "Ruby on Rails",
  });

  assert.equal(topics[0].cat, "Ruby Core");
  assert.ok(topics.some((topic) => topic.subs.includes("Rails MVC")));
  assert.ok(topics.some((topic) => topic.subs.includes("RSpec")));
});

test("returns Rust-focused preparation topics for a Rust stack", () => {
  const topics = getRecommendedTopics({
    position: "Systems Engineer",
    stack: "Rust, Tokio",
  });

  assert.equal(topics[0].cat, "Rust Core");
  assert.ok(topics.some((topic) => topic.subs.includes("Ownership & Borrowing")));
  assert.ok(topics.some((topic) => topic.subs.includes("Async Rust")));
});

test("keeps generic full-stack topics when no known stack is entered", () => {
  const topics = getRecommendedTopics({
    position: "Full Stack Developer",
    stack: "Internal legacy tools",
  });

  assert.equal(topics[0].cat, "Frontend");
  assert.ok(topics.some((topic) => topic.cat === "Backend"));
});

test("returns a readable prep label for known and fallback stacks", () => {
  assert.equal(getPrepLabel("Python, Django"), "Python Prep");
  assert.equal(getPrepLabel("SQL"), "SQL Prep");
  assert.equal(getPrepLabel("SAP ABAP"), "SAP Prep");
  assert.equal(getPrepLabel("Ruby on Rails"), "Ruby Prep");
  assert.equal(getPrepLabel("Rust"), "Rust Prep");
  assert.equal(getPrepLabel("Internal tools"), "Full Stack Prep");
});
