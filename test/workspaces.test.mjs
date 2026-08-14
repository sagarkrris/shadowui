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
    "buildEngineering",
    "paths",
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
    "buildEngineering",
    "paths",
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
  assert.equal(getWorkspaceById("offerWarRoom").icon, "ti-target-arrow");
  assert.equal(getWorkspaceById("paths").icon, "ti-signpost");
  assert.equal(getWorkspaceById("buildEngineering").icon, "ti-package");
});

test("workspace title logic is centralized and handles chat/company fallbacks", () => {
  const stackGreeting = { salutation: "Good morning, Sagar" };

  assert.equal(getWorkspaceTitle({ activeTab: "scenarioBank" }), "Scenario Bank");
  assert.equal(getWorkspaceTitle({ activeTab: "javaDigest" }), "Java Digest");
  assert.equal(getWorkspaceTitle({ activeTab: "paths" }), "Career Paths");
  assert.equal(getWorkspaceTitle({ activeTab: "buildEngineering" }), "Build Engineering");
  assert.equal(getWorkspaceTitle({ activeTab: "offerWarRoom", candidateProfile: { name: "Sagar" }, displayName: "Sagar" }), "Offer War Room for Sagar");
  assert.equal(getWorkspaceTitle({ activeTab: "company", candidateProfile: { name: "Sagar" }, displayName: "Sagar" }), "Company Prep for Sagar");
  assert.equal(getWorkspaceTitle({ activeTab: "chat", candidateProfile: { name: "Sagar" }, currentLabel: "Java", stackGreeting }), "Good morning, Sagar · Java");
  assert.equal(getWorkspaceTitle({ activeTab: "chat", candidateProfile: null }), "Tell us your target role");
});

test("workspace normalization accepts known tabs and falls back to chat", () => {
  assert.equal(normalizeWorkspaceTab("canvas"), "canvas");
  assert.equal(normalizeWorkspaceTab("offerWarRoom"), "offerWarRoom");
  assert.equal(normalizeWorkspaceTab("scenarioBank"), "scenarioBank");
  assert.equal(normalizeWorkspaceTab("javaDigest"), "javaDigest");
  assert.equal(normalizeWorkspaceTab("paths"), "paths");
  assert.equal(normalizeWorkspaceTab("buildEngineering"), "buildEngineering");
  assert.equal(normalizeWorkspaceTab("unknown"), "chat");
});
