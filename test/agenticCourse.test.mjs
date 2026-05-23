import assert from "node:assert/strict";
import test from "node:test";

import {
  AGENTIC_UI_COURSE,
  PRODUCT_TAGLINE,
} from "../lib/agenticCourse.mjs";

test("uses the premium InterviewIQ tagline", () => {
  assert.equal(PRODUCT_TAGLINE, "AI-powered interview intelligence for modern software engineers");
});

test("defines a compact agentic UI basics course with visual lessons", () => {
  assert.equal(AGENTIC_UI_COURSE.title, "Agentic UI Basics");
  assert.ok(AGENTIC_UI_COURSE.summary.includes("agent"));
  assert.ok(AGENTIC_UI_COURSE.findings.length >= 4);
  assert.ok(AGENTIC_UI_COURSE.lessons.length >= 4);
  assert.ok(AGENTIC_UI_COURSE.modules.length >= 4);

  AGENTIC_UI_COURSE.lessons.forEach((lesson) => {
    assert.ok(lesson.title);
    assert.ok(lesson.visual);
    assert.ok(lesson.description.length > 30);
    assert.ok(lesson.plainMeaning.length > 20);
    assert.ok(lesson.buildThis.length > 20);
    assert.ok(lesson.takeaways.length >= 3);
  });

  AGENTIC_UI_COURSE.modules.forEach((module) => {
    assert.ok(module.image.title);
    assert.ok(module.image.caption.length > 20);
    assert.ok(module.video.title);
    assert.ok(module.video.duration);
    assert.match(module.video.embedUrl, /^https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]+/);
    assert.match(module.video.watchUrl, /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]+/);
    assert.ok(module.video.chapters.length >= 3);
  });
});

test("course covers core agentic UI safety and trust patterns", () => {
  const text = JSON.stringify(AGENTIC_UI_COURSE).toLowerCase();

  assert.match(text, /human approval|approval/);
  assert.match(text, /autonomy/);
  assert.match(text, /trace|timeline/);
  assert.match(text, /guardrail/);
});
