import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const globalsSource = readFileSync(new URL("../styles/globals.css", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../pages/index.js", import.meta.url), "utf8");
const messageContentSource = readFileSync(new URL("../components/chat/MessageContent.js", import.meta.url), "utf8");
const careerToolkitSource = readFileSync(new URL("../components/welcome/CareerToolkit.js", import.meta.url), "utf8");
const profileSetupSource = readFileSync(new URL("../components/welcome/ProfileSetup.js", import.meta.url), "utf8");

test("assistant part-wise answers render with readable section styling", () => {
  assert.match(messageContentSource, /message-part-heading/);
  assert.match(messageContentSource, /isPartHeading/);
  assert.match(globalsSource, /\.assistant-message/);
  assert.match(globalsSource, /\.message-part-heading/);
});

test("chat and form controls expose accessibility hooks", () => {
  assert.match(indexSource, /role="log"/);
  assert.match(indexSource, /aria-live="polite"/);
  assert.match(indexSource, /aria-label="Conversation messages"/);
  assert.match(indexSource, /aria-label="Message composer"/);
  assert.match(careerToolkitSource, /aria-label="Upload resume file"/);
  assert.match(globalsSource, /:focus-visible/);
});

test("mobile glass styling is tuned for smoother scrolling", () => {
  assert.match(indexSource, /className="chat-scroll"/);
  assert.match(globalsSource, /@media \(max-width: 760px\)/);
  assert.match(globalsSource, /backdrop-filter: blur\(8px\)/);
  assert.match(globalsSource, /@media \(max-width: 760px\)[\s\S]*\.icon-btn[\s\S]*backdrop-filter: blur\(8px\)/);
  assert.match(globalsSource, /-webkit-overflow-scrolling: touch/);
  assert.match(globalsSource, /prefers-reduced-motion: reduce/);
});

test("mobile keyboard mode trims chrome around the composer", () => {
  assert.match(indexSource, /isKeyboardOpen/);
  assert.match(indexSource, /appShellHeight/);
  assert.match(indexSource, /isMobile && !isKeyboardOpen/);
  assert.match(indexSource, /interactive-widget=resizes-content/);
  assert.match(indexSource, /restorePageScroll/);
  assert.match(indexSource, /position:"fixed", inset:0/);
});

test("profile setup avoids oversized sticky iOS keyboard spacers", () => {
  assert.match(profileSetupSource, /keyboardOpen/);
  assert.match(indexSource, /<ProfileSetup[\s\S]*keyboardOpen=\{isKeyboardOpen\}/);
  assert.doesNotMatch(indexSource, /padding-bottom:\s*180px/);
  assert.doesNotMatch(profileSetupSource, /scrollPaddingBottom:\s*160/);
});

test("profile setup uses a corporate onboarding entry", () => {
  assert.match(profileSetupSource, /corporate-entry/);
  assert.match(profileSetupSource, /Corporate interview prep/);
  assert.match(profileSetupSource, /Product dashboard preview/);
  assert.match(profileSetupSource, /How it works/);
  assert.match(profileSetupSource, /DSA Visual Lab/);
  assert.match(profileSetupSource, /Progress Brain/);
  assert.match(profileSetupSource, /Scenario Bank/);
  assert.match(profileSetupSource, /Company Prep/);
  assert.match(profileSetupSource, /Corporate trust/);
  assert.match(profileSetupSource, /Mobile app preview/);
  assert.match(profileSetupSource, /Personalize Prep/);
});

test("resume analyzer explains why the score is not perfect", () => {
  assert.match(careerToolkitSource, /Why this score/);
  assert.match(careerToolkitSource, /weakestScoreAreas/);
});
