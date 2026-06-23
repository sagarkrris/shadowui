import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componentSource = readFileSync(new URL("../components/interview-ready/InterviewReadyQA.js", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../pages/index.js", import.meta.url), "utf8");
const workspaceSource = readFileSync(new URL("../lib/workspaces.mjs", import.meta.url), "utf8");

test("interview ready Q&A workspace is wired into the app shell", () => {
  assert.match(componentSource, /Interview Ready Q&A/);
  assert.match(componentSource, /Ace-the-interview checklist/);
  assert.match(componentSource, /Question-first mode/);
  assert.match(componentSource, /Reveal polished answer/);
  assert.match(componentSource, /Practice studio/);
  assert.match(componentSource, /Save my answer/);
  assert.match(componentSource, /Interview answer score/);
  assert.match(componentSource, /Too robotic\?/);
  assert.match(componentSource, /Too vague\?/);
  assert.match(componentSource, /Company-wise packs/);
  assert.match(componentSource, /Question bank/);
  assert.match(componentSource, /Show/);
  assert.match(componentSource, /Hide/);
  assert.match(componentSource, /interview-ready-answer-input/);
  assert.match(componentSource, /Target company/);
  assert.match(componentSource, /Answer timer/);
  assert.match(componentSource, /Tailor with AI/);
  assert.match(componentSource, /Mock follow-up/);
  assert.match(pageSource, /InterviewReadyQA/);
  assert.match(pageSource, /startInterviewReadyAction/);
  assert.match(pageSource, /activeTab==="interviewReady"/);
  assert.match(workspaceSource, /id: "interviewReady"/);
  assert.match(workspaceSource, /label: "Interview Ready Q&A"/);
});
