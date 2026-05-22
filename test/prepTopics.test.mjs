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
  assert.equal(getPrepLabel("Internal tools"), "Full Stack Prep");
});
