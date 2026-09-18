import test from "node:test";
import assert from "node:assert/strict";
import { READING_SERIES, readingItem, normalizeBookmarks, sectionId, editorialCredit, PUBLIC_CORRECTIONS } from "../lib/readerEditorial.mjs";
import { digestSignup, sameOriginJson, validateReaderSubmission } from "../lib/readerCommunity.mjs";
import { readerIdentity } from "../lib/readerCommunityStore.mjs";
import { createReaderCommunityHandler } from "../pages/api/reader-community.js";
import { createDigestHandler } from "../pages/api/digest-subscription.js";
const response = () => ({ code: 200, headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(code) { this.code=code; return this; }, json(body) { this.body=body; return this; } });
const request = body => ({ method: "POST", headers: { host: "example.test", origin: "https://example.test", "content-type": "application/json" }, body, cookies: {} });
test("reading paths resolve to published pages with useful prerequisites and time estimates", () => {
  for (const path of READING_SERIES) { assert.ok(path.prerequisites); for (const href of path.items) { const item = readingItem(href); assert.ok(item?.title); assert.ok(item.minutes > 0); } }
  assert.ok(PUBLIC_CORRECTIONS[0].verification.includes("Deployment has not been verified"));
  assert.match(editorialCredit("/java/slow-sql-query").runtime, /not yet recorded/);
  assert.match(editorialCredit("/detective/the-vanishing-map-entry").runtime, /Temurin 21/);
});
test("bookmarks allow only supported local article anchors and normalize damaged data", () => {
  assert.deepEqual(normalizeBookmarks(null), []);
  assert.deepEqual(normalizeBookmarks([{ href: "javascript:alert(1)", title: "x" }, { href: "//evil.test/x#x", title: "x" }]), []);
  assert.equal(normalizeBookmarks([{ href: "/java/hashmap-internals#answer", title: "Answer" }, { href: "/java/hashmap-internals#answer", title: "duplicate" }]).length, 1);
  assert.equal(sectionId("How does it work?"), "read-how-does-it-work");
  assert.equal(sectionId("How does it work?", 2), "read-how-does-it-work-2");
});
test("reader submissions are bounded and correction links cannot leave the site", () => {
  assert.throws(() => validateReaderSubmission({ kind: "request", title: "short", details: "x" }));
  assert.throws(() => validateReaderSubmission({ kind: "correction", title: "Wrong example", details: "This example does not compile correctly.", path: "//evil.test" }));
  assert.equal(validateReaderSubmission({ kind: "request", title: "  Explain timeouts  ", details: "Why can a timeout still have a side effect?" }).title, "Explain timeouts");
  assert.equal(sameOriginJson(request({})), true);
  assert.equal(sameOriginJson({ headers: { host: "example.test", origin: "https://other.test", "content-type": "application/json" } }), false);
});
test("anonymous voting identity rejects tampered cookies", () => {
  const first = readerIdentity("", "test-secret");
  assert.equal(readerIdentity(first.cookie, "test-secret").id, first.id);
  assert.notEqual(readerIdentity(first.cookie.replace(/.$/, "x"), "test-secret").id, first.id);
  assert.notEqual(readerIdentity(first.cookie, "another-secret").id, first.id);
});
test("community handler acknowledges moderation and rejects cross-origin writes", async () => {
  let submitted;
  const store = { readerCommunityConfigured: () => true, readerIdentity: () => ({ id: "browser", cookie: "signed" }), submitReaderRequest: async (data, id) => { submitted = { data, id }; return "receipt-1"; }, listReaderRequests: async () => [], voteReaderRequest: async () => false };
  const handler = createReaderCommunityHandler({ store, env: { SESSION_SECRET: "test" }, rateLimit: async () => ({ ok: true }) });
  const req = request({ kind: "request", title: "Explain timeouts", details: "Why can a timeout still have a side effect?" });
  let res = response(); await handler(req, res); assert.equal(res.code, 202); assert.equal(res.body.status, "pending"); assert.equal(submitted.id, "browser");
  res = response(); await handler({ ...req, headers: { ...req.headers, origin: "https://evil.test" } }, res); assert.equal(res.code, 403);
  res = response(); await handler(request({ action: "vote", id: "11111111-1111-4111-8111-111111111111" }), res); assert.equal(res.code, 404);
  res = response(); await createReaderCommunityHandler({ store, rateLimit: async () => ({ ok: false }) })(req, res); assert.equal(res.code, 429);
});
test("unconfigured board fails closed without pretending votes are live", async () => {
  const handler = createReaderCommunityHandler({ store: { readerCommunityConfigured: () => false } });
  let res = response(); await handler({ method: "GET", headers: {} }, res); assert.equal(res.body.available, false);
  res = response(); await handler(request({}), res); assert.equal(res.code, 503);
});
test("digest requires explicit consent and valid email", () => {
  assert.throws(() => digestSignup({ email: "a@example.test", consent: false }));
  assert.throws(() => digestSignup({ email: "bad", consent: true }));
  assert.equal(digestSignup({ email: " A@Example.test ", consent: true }).email, "a@example.test");
});
test("digest uses confirmation contract; never claims an immediate subscription", async () => {
  const env = { DIGEST_SUBSCRIPTION_WEBHOOK: "https://provider.example/subscribe", DIGEST_SUBSCRIPTION_TOKEN: "secret", DIGEST_POSTAL_ADDRESS: "Configured address" };
  let delivered;
  const handler = createDigestHandler({ env, rateLimit: async () => ({ ok: true }), fetchImpl: async (_, options) => { delivered = JSON.parse(options.body); return { ok: true, json: async () => ({ status: "pending_confirmation" }) }; } });
  let res = response(); await handler(request({ email: "a@example.test", consent: true }), res); assert.equal(res.code, 202); assert.match(res.body.message, /not subscribed until/); assert.equal(delivered.consentVersion, "weekly-digest-v1");
  res = response(); await createDigestHandler({ env: {} })(request({ email: "a@example.test", consent: true }), res); assert.equal(res.code, 503);
  res = response(); await createDigestHandler({ env, rateLimit: async () => ({ ok: true }), fetchImpl: async () => ({ ok: true, json: async () => ({ status: "subscribed" }) }) })(request({ email: "a@example.test", consent: true }), res); assert.equal(res.code, 503);
});
