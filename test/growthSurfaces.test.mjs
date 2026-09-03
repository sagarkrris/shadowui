import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAnalyticsEvent } from "../lib/analytics.mjs";
import { createOAuthNonce, oauthState, verifyOAuthState } from "../lib/oauth.mjs";
import { PUBLIC_STACK_GUIDES, getStackGuide } from "../lib/seoGuides.mjs";
import { JAVA_TUTORIAL_CATALOG, slugifyJavaTutorial } from "../lib/javaDigest.mjs";

test("stack guide catalog covers non-Java acquisition topics", () => {
  assert.ok(PUBLIC_STACK_GUIDES.length >= 8);
  assert.ok(getStackGuide("react", "react-hooks-interview-questions"));
  assert.ok(getStackGuide("aws", "aws-system-design-interview").steps.length >= 3);
});

test("Java roadmap can link every tutorial to a stable tutorial route", () => {
  assert.ok(JAVA_TUTORIAL_CATALOG.length >= 100);
  assert.equal(new Set(JAVA_TUTORIAL_CATALOG.map((item) => slugifyJavaTutorial(item.title))).size, JAVA_TUTORIAL_CATALOG.length);
  assert.ok(JAVA_TUTORIAL_CATALOG.every((item) => item.category && item.level && item.summary));
});

test("every listicle deep-dive link resolves to a published guide", async () => {
  const { PUBLIC_VERTICAL_LISTICLES } = await import("../lib/verticalContent.mjs");
  const { getPublicArticle } = await import("../lib/publicContent.mjs");
  const { getStackGuide } = await import("../lib/seoGuides.mjs");
  for (const listicle of PUBLIC_VERTICAL_LISTICLES) {
    for (const item of listicle.questions) {
      if (!item.slug) continue;
      assert.ok(getPublicArticle(item.slug) || getStackGuide(listicle.vertical, item.slug), `${listicle.slug} links to missing ${item.slug}`);
    }
  }
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
