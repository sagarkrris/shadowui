import assert from "node:assert/strict";
import test from "node:test";

import { JAVA_DEBUGGING_LESSONS } from "../lib/javaDebuggingLessons.mjs";

test("Java debugging lessons cover fresher failure modes", () => {
  assert.ok(JAVA_DEBUGGING_LESSONS.length >= 8);
  assert.ok(JAVA_DEBUGGING_LESSONS.some((lesson) => /overflow/i.test(lesson.title)));
  assert.ok(JAVA_DEBUGGING_LESSONS.some((lesson) => /stack overflow/i.test(lesson.title)));
  assert.ok(JAVA_DEBUGGING_LESSONS.every((lesson) => lesson.symptom && lesson.rule && lesson.drill));
});
