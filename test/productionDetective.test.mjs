import test from "node:test";
import assert from "node:assert/strict";
import { DETECTIVE_CASES, detectiveCase, normalizeInvestigation, retryWork, indexWork, tenantCacheKey, replayTenantCache } from "../lib/productionDetective.mjs";
import { normalizeAnalyticsEvent, summarizeDetectiveEvents } from "../lib/analytics.mjs";

for (const incident of DETECTIVE_CASES) {
  test(`${incident.slug}: valid published case and reachable completion`, () => {
    assert.equal(detectiveCase(incident.slug), incident);
    assert.match(incident.slug, /^[a-z0-9-]+$/);
    assert.equal(incident.evidence.length, 3);
    assert.equal(new Set(incident.evidence.map(e => e.id)).size, 3);
    assert.equal(incident.diagnoses.filter(d => d.id === incident.diagnosis).length, 1);
    assert.equal(incident.fixes.filter(f => f.id === incident.fix).length, 1);
    assert.ok(incident.explanation && incident.deep && incident.verification && incident.tradeoff);
    assert.ok(incident.references.every(r => new URL(r.url).protocol === "https:"));
    const complete = normalizeInvestigation({ inspected: incident.evidence.map(e => e.id), diagnosis: incident.diagnosis, fix: incident.fix, completed: true }, incident);
    assert.equal(complete.completed, true);
    assert.equal(normalizeInvestigation({ ...complete, inspected: [] }, incident).completed, false);
    assert.equal(normalizeInvestigation({ ...complete, diagnosis: "not-real" }, incident).completed, false);
    assert.equal(normalizeInvestigation({ ...complete, fix: "not-real" }, incident).completed, false);
  });
}
test("damaged progress cannot unlock diagnosis, fix, or completion", () => {
  const incident = DETECTIVE_CASES[0];
  for (const raw of [null, false, [], "bad", 22, { inspected: "code", completed: true }]) {
    assert.deepEqual(normalizeInvestigation(raw, incident), { inspected: [], diagnosis: "", fix: "", completed: false });
  }
  assert.deepEqual(normalizeInvestigation({ inspected: ["code", "code", "fake"], diagnosis: "mutation", fix: "immutable", completed: true }, incident), { inspected: ["code"], diagnosis: "", fix: "", completed: false });
  assert.equal(detectiveCase("unknown"), undefined);
  assert.equal(new Set(DETECTIVE_CASES.map(c => c.slug)).size, 5);
});
test("retry model includes original attempt and handles boundaries", () => {
  assert.deepEqual(retryWork(3, 3), { perRequest: 27, nested: 2700, singleOwner: 300 });
  assert.deepEqual(retryWork(1, 3), { perRequest: 1, nested: 100, singleOwner: 100 });
  assert.deepEqual(retryWork(5, 3, 0), { perRequest: 125, nested: 0, singleOwner: 0 });
  assert.deepEqual(retryWork(-2, "bad", -1), { perRequest: 1, nested: 0, singleOwner: 0 });
  assert.equal(retryWork(100, 100).perRequest, 125);
});
test("index model shows both sides of workload trade-off", () => {
  assert.deepEqual(indexWork(0), { without: 100, with: 200 });
  assert.deepEqual(indexWork(100), { without: 1000, with: 100 });
  assert.deepEqual(indexWork(10), { without: 190, with: 190 });
  assert.deepEqual(indexWork(-5), indexWork(0));
  assert.deepEqual(indexWork(105), indexWork(100));
});
test("tenant-scoped key prevents cross-tenant and delimiter collisions", () => {
  assert.equal(replayTenantCache(false).returned, "Alder report");
  assert.equal(replayTenantCache(true).returned, "Birch report");
  assert.equal(replayTenantCache(true).hit, false);
  assert.notEqual(tenantCacheKey("a:b", "c"), tenantCacheKey("a", "b:c"));
  assert.notEqual(tenantCacheKey("alder", 42), tenantCacheKey("birch", 42));
});
test("detective metrics count case/session pairs and resumed completions honestly", () => {
  const event = (name, sessionId = "s1", value = "case1") => ({ name: `detective_${name}`, sessionId, value });
  const events = [event("viewed"), event("viewed"), event("started"), event("completed"), event("completed"), event("completed", "s2"), event("started", "s1", "case2"), event("returned", "s2"), event("shared"), event("share_visit", "s2")];
  assert.deepEqual(summarizeDetectiveEvents(events), { caseViews: 1, startedInvestigations: 2, completedInvestigations: 2, sameSessionCompletionRate: .5, laterDayReturns: 1, copiedChallengeLinks: 1, shareReferredVisits: 1 });
  assert.equal(summarizeDetectiveEvents([]).sameSessionCompletionRate, null);
  assert.equal(normalizeAnalyticsEvent(event("viewed")).name, "detective_viewed");
  assert.equal(normalizeAnalyticsEvent({ name: "detective_arbitrary" }), null);
});
