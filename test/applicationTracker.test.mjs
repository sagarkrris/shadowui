import assert from "node:assert/strict";
import test from "node:test";
import { createApplication, buildApplicationTracker } from "../lib/applicationTracker.mjs";

test("creates a validated application with recruiter, follow-up, offer, and calendar fields", () => {
  const application = createApplication({
    company: "Acme", role: "Senior Java Engineer", recruiter: { name: "Ava", email: "ava@acme.test" },
    stage: "onsite", followUpAt: "2026-07-10T09:00:00.000Z", offer: { salary: 200000 }, calendarEventId: "cal-1",
  });
  assert.equal(application.company, "Acme");
  assert.equal(application.recruiter.email, "ava@acme.test");
  assert.equal(application.stage, "onsite");
  assert.equal(application.calendarEventId, "cal-1");
  assert.equal(application.offer.salary, 200000);
});

test("summarizes application stages and due follow-ups", () => {
  const tracker = buildApplicationTracker([
    createApplication({ company: "Acme", role: "Java", stage: "applied", followUpAt: "2026-07-01T10:00:00.000Z" }),
    createApplication({ company: "Globex", role: "Java", stage: "offer" }),
  ], { now: new Date("2026-07-01T12:00:00.000Z") });
  assert.equal(tracker.byStage.applied, 1);
  assert.equal(tracker.byStage.offer, 1);
  assert.equal(tracker.followUpsDue.length, 1);
});
