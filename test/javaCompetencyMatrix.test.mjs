import assert from "node:assert/strict";
import test from "node:test";

import {
  JAVA_COMPETENCY_LEVELS,
  buildJavaCompetencyMatrix,
} from "../lib/javaCompetencyMatrix.mjs";

test("builds a Java competency matrix from Junior through Staff with current release coverage", () => {
  const matrix = buildJavaCompetencyMatrix();

  assert.deepEqual(JAVA_COMPETENCY_LEVELS, ["Junior", "Mid", "Senior", "Staff"]);
  assert.equal(matrix.latestRelease.version, 26);
  assert.ok(matrix.releases.some((release) => release.version === 8));
  assert.ok(matrix.releases.some((release) => release.version === 26));
  assert.deepEqual(matrix.levels.map((level) => level.name), JAVA_COMPETENCY_LEVELS);
});

test("assigns the requested Java backend competencies to appropriate interview levels", () => {
  const matrix = buildJavaCompetencyMatrix();
  const competencies = matrix.levels.flatMap((level) => level.competencies.map((competency) => ({ ...competency, level: level.name })));

  for (const name of [
    "JVM and Garbage Collection",
    "Virtual Threads",
    "Spring Security and OAuth2",
    "JPA Performance",
    "Testing with JUnit, Mockito, and Testcontainers",
    "Kafka",
    "Redis",
    "Docker and Kubernetes",
    "Observability",
    "Cloud Architecture",
  ]) {
    assert.ok(competencies.some((competency) => competency.name === name), `Missing ${name}`);
  }

  assert.equal(competencies.find((competency) => competency.name === "Virtual Threads")?.level, "Senior");
  assert.equal(competencies.find((competency) => competency.name === "Cloud Architecture")?.level, "Staff");
});
