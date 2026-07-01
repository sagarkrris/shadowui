import assert from "node:assert/strict";
import test from "node:test";
import { buildApplicationBenchmarkComparison, buildApplicationTracker, buildCalendarFollowUpEvent, createApplication } from "../lib/applicationTracker.mjs";

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

test("builds a calendar adapter event for follow-up reminders", () => {
  const event = buildCalendarFollowUpEvent(createApplication({
    company: "Acme",
    role: "Senior Java Engineer",
    followUpAt: "2026-07-05T09:30:00.000Z",
  }));

  assert.equal(event.title, "Acme follow-up");
  assert.equal(event.startsAt, "2026-07-05T09:30:00.000Z");
  assert.equal(event.endsAt, "2026-07-05T10:00:00.000Z");
});

test("compares tracker outcomes against lightweight benchmarks", () => {
  const comparison = buildApplicationBenchmarkComparison([
    createApplication({ company: "Acme", role: "Java", stage: "applied", followUpAt: "2026-07-01T10:00:00.000Z" }),
    createApplication({ company: "Globex", role: "Java", stage: "offer" }),
  ]);

  assert.equal(comparison.total, 2);
  assert.ok(comparison.comparison.some((item) => item.label === "Offer conversion"));
  assert.ok(comparison.comparison.some((item) => item.label === "Follow-up coverage"));
});

test("builds richer dashboard analytics for response rate pipeline health and offers", () => {
  const comparison = buildApplicationBenchmarkComparison([
    createApplication({ company: "Acme", role: "Java", stage: "recruiter", followUpAt: "2026-07-01T10:00:00.000Z" }),
    createApplication({ company: "Globex", role: "Java", stage: "onsite" }),
    createApplication({ company: "Initech", role: "Java", stage: "offer", offer: { salary: 180000 } }),
  ]);

  assert.equal(comparison.responseRate, 1);
  assert.equal(comparison.onsiteRate, 2 / 3);
  assert.equal(comparison.averageOfferSalary, 180000);
  assert.ok(comparison.pipelineScore > 0);
  assert.ok(comparison.insights.some((item) => item.label === "Response rate"));
  assert.ok(comparison.insights.some((item) => item.label === "Onsite conversion"));
  assert.ok(comparison.insights.some((item) => item.label === "Pipeline health score"));
  assert.ok(comparison.insights.some((item) => item.label === "Average offer salary"));
});
