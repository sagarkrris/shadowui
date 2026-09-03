import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAnalyticsEvent } from "../lib/analytics.mjs";
import { createOAuthNonce, oauthState, verifyOAuthState } from "../lib/oauth.mjs";
import { PUBLIC_STACK_GUIDES, getStackGuide } from "../lib/seoGuides.mjs";

test("stack guide catalog covers non-Java acquisition topics", () => {
  assert.ok(PUBLIC_STACK_GUIDES.length >= 8);
  assert.ok(getStackGuide("react", "react-hooks-interview-questions"));
  assert.ok(getStackGuide("aws", "aws-system-design-interview").steps.length >= 3);
});

test("analytics accepts only bounded product events", () => {
  assert.deepEqual(normalizeAnalyticsEvent({ name: "mock_completed", path: "/", value: "8" }), { name: "mock_completed", path: "/", value: "8" });
  assert.equal(normalizeAnalyticsEvent({ name: "email_address", path: "/" }), null);
});

test("oauth state is signed and rejects tampering", () => {
  const previousSecret = process.env.SESSION_SECRET;
  const previousClient = process.env.GITHUB_CLIENT_ID;
  const previousProviderSecret = process.env.GITHUB_CLIENT_SECRET;
  process.env.SESSION_SECRET = "test-secret"; process.env.GITHUB_CLIENT_ID = "client"; process.env.GITHUB_CLIENT_SECRET = "secret";
  const state = oauthState("github", createOAuthNonce());
  assert.equal(verifyOAuthState(state), "github");
  assert.equal(verifyOAuthState(`${state}x`), null);
  if (previousSecret === undefined) delete process.env.SESSION_SECRET; else process.env.SESSION_SECRET = previousSecret;
  if (previousClient === undefined) delete process.env.GITHUB_CLIENT_ID; else process.env.GITHUB_CLIENT_ID = previousClient;
  if (previousProviderSecret === undefined) delete process.env.GITHUB_CLIENT_SECRET; else process.env.GITHUB_CLIENT_SECRET = previousProviderSecret;
});
