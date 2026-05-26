import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  AGENTIC_UI_COURSE,
  PRODUCT_TAGLINE,
} from "../lib/agenticCourse.mjs";

test("uses the premium InterviewIQ tagline", () => {
  assert.equal(PRODUCT_TAGLINE, "AI-powered interview intelligence for modern software engineers");
});

test("defines a compact agentic UI basics course with visual lessons", () => {
  assert.equal(AGENTIC_UI_COURSE.title, "Agentic UI Engineering Course");
  assert.ok(AGENTIC_UI_COURSE.summary.includes("agent"));
  assert.ok(AGENTIC_UI_COURSE.findings.length >= 4);
  assert.ok(AGENTIC_UI_COURSE.lessons.length >= 4);
  assert.ok(AGENTIC_UI_COURSE.modules.length >= 6);

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

test("course exposes stack-aware implementation tracks", () => {
  assert.ok(Array.isArray(AGENTIC_UI_COURSE.stackTracks));
  assert.ok(AGENTIC_UI_COURSE.stackTracks.length >= 4);

  const trackIds = AGENTIC_UI_COURSE.stackTracks.map((track) => track.id);
  assert.ok(trackIds.includes("java-spring"));
  assert.ok(trackIds.includes("react-next"));
  assert.ok(trackIds.includes("node-python"));
  assert.ok(trackIds.includes("ruby-rust-sap"));

  AGENTIC_UI_COURSE.stackTracks.forEach((track) => {
    assert.ok(track.title.length > 8);
    assert.ok(track.bestFor.length > 20);
    assert.ok(track.labs.length >= 3);
    assert.ok(track.labs.every((lab) => lab.title && lab.deliverable && lab.steps.length >= 3));
  });
});

test("java track teaches a concrete Spring Boot agent backend path", () => {
  const javaTrack = AGENTIC_UI_COURSE.stackTracks.find((track) => track.id === "java-spring");
  assert.ok(javaTrack);
  assert.ok(javaTrack.labs.length >= 5);

  const text = JSON.stringify(javaTrack);
  assert.match(text, /Spring Boot/);
  assert.match(text, /Spring AI/);
  assert.match(text, /ChatClient/);
  assert.match(text, /@RestController/);
  assert.match(text, /approval/i);
  assert.match(text, /trace/i);
});

test("course includes a capstone that builds an InterviewIQ agent", () => {
  assert.ok(AGENTIC_UI_COURSE.capstone);
  assert.match(AGENTIC_UI_COURSE.capstone.title, /InterviewIQ Agent/i);
  assert.ok(AGENTIC_UI_COURSE.capstone.milestones.length >= 5);
  assert.ok(AGENTIC_UI_COURSE.capstone.acceptanceCriteria.length >= 5);
});

test("course UI renders stack tracks and capstone sections", () => {
  const source = readFileSync(new URL("../components/course/AgenticUICourse.js", import.meta.url), "utf8");

  assert.match(source, /Stack Implementation Tracks/);
  assert.match(source, /Java \/ Spring Boot/);
  assert.match(source, /TrackLabList/);
  assert.match(source, /Capstone/);
  assert.match(source, /codeSnippet/);
});
