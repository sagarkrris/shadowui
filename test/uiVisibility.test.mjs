import assert from "node:assert/strict";
import test from "node:test";

import {
  canUseChatComposer,
  canUseInterviewTools,
  canUsePrepTopics,
  shouldShowCodeTools,
} from "../lib/uiVisibility.mjs";

test("hides the chat composer until a profile exists and chat is active", () => {
  assert.equal(canUseChatComposer({ activeTab: "chat", candidateProfile: null }), false);
  assert.equal(canUseChatComposer({ activeTab: "company", candidateProfile: { name: "Sagar" } }), false);
  assert.equal(canUseChatComposer({ activeTab: "chat", candidateProfile: { name: "Sagar" } }), true);
});

test("shows interview tools only inside the personalized chat workflow", () => {
  assert.equal(canUseInterviewTools({ activeTab: "chat", candidateProfile: { stack: "Python" } }), true);
  assert.equal(canUseInterviewTools({ activeTab: "company", candidateProfile: { stack: "Python" } }), false);
  assert.equal(canUseInterviewTools({ activeTab: "course", candidateProfile: { stack: "Python" } }), false);
});

test("shows code tools only for technical prep categories", () => {
  const profile = { stack: "Python" };

  assert.equal(shouldShowCodeTools({ activeTab: "chat", candidateProfile: profile, selectedCat: "Python Core" }), true);
  assert.equal(shouldShowCodeTools({ activeTab: "chat", candidateProfile: profile, selectedCat: "DSA" }), true);
  assert.equal(shouldShowCodeTools({ activeTab: "chat", candidateProfile: profile, selectedCat: "Behavioral" }), false);
  assert.equal(shouldShowCodeTools({ activeTab: "chat", candidateProfile: profile, selectedCat: "System Design" }), false);
  assert.equal(shouldShowCodeTools({ activeTab: "company", candidateProfile: profile, selectedCat: "Python Core" }), false);
});

test("locks prep topics until the profile setup is complete", () => {
  assert.equal(canUsePrepTopics({ candidateProfile: null }), false);
  assert.equal(canUsePrepTopics({ candidateProfile: { name: "Sagar", stack: "Python" } }), true);
});
