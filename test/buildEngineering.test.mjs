import assert from "node:assert/strict";
import test from "node:test";
import { analyzeBuildSnippet } from "../lib/buildEngineering.mjs";

test("build snippet analyzer extracts Maven and Gradle dependencies without evaluating input", () => {
  const maven = analyzeBuildSnippet("<dependency><groupId>org.junit.jupiter</groupId><artifactId>junit-jupiter</artifactId><version>5.11.0</version></dependency>");
  const gradle = analyzeBuildSnippet('implementation("org.springframework.boot:spring-boot-starter-web:3.4.0")', "gradle");
  assert.deepEqual(maven.dependencies[0], { group: "org.junit.jupiter", artifact: "junit-jupiter", version: "5.11.0" });
  assert.deepEqual(gradle.dependencies[0], { group: "org.springframework.boot", artifact: "spring-boot-starter-web", version: "3.4.0" });
});
