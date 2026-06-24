import assert from "node:assert/strict";
import test from "node:test";

import {
  getWorkspaceById,
  getWorkspaceTitle,
  listDesktopWorkspaces,
  listMobileWorkspaces,
  normalizeWorkspaceTab,
} from "../lib/workspaces.mjs";

test("workspace registry exposes all non-chat workspaces in navigation order", () => {
  assert.deepEqual(listDesktopWorkspaces().map((workspace) => workspace.id), [
    "collabMock",
    "offerWarRoom",
    "interviewReady",
    "company",
    "canvas",
    "designLab",
    "scenarioBank",
    "javaDigest",
    "dsaLab",
    "course",
  ]);
  assert.deepEqual(listMobileWorkspaces().map((workspace) => workspace.id), [
    "collabMock",
    "offerWarRoom",
    "interviewReady",
    "company",
    "canvas",
    "designLab",
    "scenarioBank",
    "javaDigest",
    "dsaLab",
    "course",
  ]);
  assert.equal(getWorkspaceById("scenarioBank").icon, "ti-database-search");
  assert.equal(getWorkspaceById("javaDigest").icon, "ti-news");
  assert.equal(getWorkspaceById("collabMock").icon, "ti-users");
});

test("workspace title logic is centralized and handles chat/company fallbacks", () => {
  const stackGreeting = { salutation: "Good morning, Sagar" };

  assert.equal(getWorkspaceTitle({ activeTab: "scenarioBank" }), "Scenario Bank");
  assert.equal(getWorkspaceTitle({ activeTab: "javaDigest" }), "Java Digest");
  assert.equal(getWorkspaceTitle({ activeTab: "collabMock", candidateProfile: { name: "Sagar" }, displayName: "Sagar" }), "Collaborative Mock for Sagar");
  assert.equal(getWorkspaceTitle({ activeTab: "company", candidateProfile: { name: "Sagar" }, displayName: "Sagar" }), "Company Prep for Sagar");
  assert.equal(getWorkspaceTitle({ activeTab: "chat", candidateProfile: { name: "Sagar" }, currentLabel: "Java", stackGreeting }), "Good morning, Sagar · Java");
  assert.equal(getWorkspaceTitle({ activeTab: "chat", candidateProfile: null }), "Tell us your target role");
});

test("workspace normalization accepts known tabs and falls back to chat", () => {
  assert.equal(normalizeWorkspaceTab("canvas"), "canvas");
  assert.equal(normalizeWorkspaceTab("collabMock"), "collabMock");
  assert.equal(normalizeWorkspaceTab("scenarioBank"), "scenarioBank");
  assert.equal(normalizeWorkspaceTab("javaDigest"), "javaDigest");
  assert.equal(normalizeWorkspaceTab("unknown"), "chat");
});
