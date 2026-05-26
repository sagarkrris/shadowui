import assert from "node:assert/strict";
import test from "node:test";

import { createHomeNavigationState } from "../lib/homeNavigation.mjs";

test("home navigation returns to personalized home without clearing profile details", () => {
  const profile = {
    name: "Sagar",
    position: "Software Engineer",
    experience: "5-7 years",
    stack: "Java, Spring Boot, React",
  };

  const nextState = createHomeNavigationState({
    candidateProfile: profile,
    profileDraft: profile,
    messages: [{ role: "user", content: "Explain Spring beans" }],
    activeTab: "course",
    loading: true,
  });

  assert.equal(nextState.activeTab, "chat");
  assert.deepEqual(nextState.messages, []);
  assert.equal(nextState.loading, false);
  assert.equal(nextState.candidateProfile, profile);
  assert.equal(nextState.profileDraft, profile);
});

test("topic selection from a secondary workspace returns to the chat workspace", async () => {
  const navigation = await import("../lib/homeNavigation.mjs");

  assert.equal(typeof navigation.createTopicSelectionNavigationState, "function");

  const nextState = navigation.createTopicSelectionNavigationState({
    activeTab: "company",
    messages: [{ role: "user", content: "mock me" }],
    loading: false,
  });

  assert.equal(nextState.activeTab, "chat");
  assert.deepEqual(nextState.messages, [{ role: "user", content: "mock me" }]);
  assert.equal(nextState.loading, false);
});
