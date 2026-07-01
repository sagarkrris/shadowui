export const APPLICATION_STAGES = ["saved", "applied", "recruiter", "screen", "onsite", "offer", "rejected", "withdrawn"];

const clean = (value, max = 200) => String(value || "").trim().slice(0, max);

function average(values = []) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function createApplication(value = {}) {
  const stage = APPLICATION_STAGES.includes(value.stage) ? value.stage : "saved";
  const salary = Number(value.offer?.salary);
  return {
    id: clean(value.id) || `application-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    company: clean(value.company),
    role: clean(value.role),
    stage,
    recruiter: { name: clean(value.recruiter?.name), email: clean(value.recruiter?.email, 254).toLowerCase() },
    followUpAt: clean(value.followUpAt, 40),
    offer: { salary: Number.isFinite(salary) && salary >= 0 ? salary : null },
    calendarEventId: clean(value.calendarEventId),
  };
}

export function buildApplicationTracker(applications = [], { now = new Date() } = {}) {
  const normalized = applications.map(createApplication);
  const byStage = Object.fromEntries(APPLICATION_STAGES.map((stage) => [stage, 0]));
  normalized.forEach((application) => { byStage[application.stage] += 1; });
  const nowTime = now.getTime();
  return {
    applications: normalized,
    byStage,
    followUpsDue: normalized.filter((application) => {
      const due = Date.parse(application.followUpAt);
      return Number.isFinite(due) && due <= nowTime && !["offer", "rejected", "withdrawn"].includes(application.stage);
    }),
  };
}

export function buildCalendarFollowUpEvent(application, { defaultDurationMinutes = 30 } = {}) {
  const normalized = createApplication(application);
  const startAt = Date.parse(normalized.followUpAt);

  if (!Number.isFinite(startAt)) return null;

  return {
    id: normalized.calendarEventId || `calendar-${normalized.id}`,
    title: `${normalized.company || "Company"} follow-up`,
    startsAt: new Date(startAt).toISOString(),
    endsAt: new Date(startAt + defaultDurationMinutes * 60000).toISOString(),
    description: `Follow up on ${normalized.role || "application"}${normalized.recruiter.name ? ` with ${normalized.recruiter.name}` : ""}.`,
  };
}

export function buildApplicationBenchmarkComparison(applications = []) {
  const tracker = buildApplicationTracker(applications);
  const total = tracker.applications.length;
  const activeCount = total - tracker.byStage.rejected - tracker.byStage.withdrawn;
  const offerRate = total ? tracker.byStage.offer / total : 0;
  const responseCount = tracker.byStage.recruiter + tracker.byStage.screen + tracker.byStage.onsite + tracker.byStage.offer;
  const responseRate = total ? responseCount / total : 0;
  const onsiteCount = tracker.byStage.onsite + tracker.byStage.offer;
  const onsiteRate = total ? onsiteCount / total : 0;
  const benchmarkOfferRate = 0.08;
  const benchmarkResponseRate = 0.25;
  const benchmarkOnsiteRate = 0.12;
  const benchmarkFollowUps = Math.max(1, Math.ceil(activeCount * 0.2));
  const salaries = tracker.applications
    .filter((application) => application.stage === "offer")
    .map((application) => application.offer.salary)
    .filter((salary) => typeof salary === "number" && Number.isFinite(salary));
  const averageOfferSalary = Math.round(average(salaries));
  const stageWeights = {
    saved: 5,
    applied: 15,
    recruiter: 35,
    screen: 55,
    onsite: 75,
    offer: 100,
    rejected: 0,
    withdrawn: 0,
  };
  const pipelineScore = Math.round(average(tracker.applications.map((application) => stageWeights[application.stage] || 0)));

  return {
    total,
    activeCount,
    offerRate,
    responseRate,
    onsiteRate,
    benchmarkOfferRate,
    benchmarkResponseRate,
    benchmarkOnsiteRate,
    followUpsDue: tracker.followUpsDue.length,
    benchmarkFollowUps,
    averageOfferSalary,
    pipelineScore,
    insights: [
      {
        label: "Response rate",
        value: `${Math.round(responseRate * 100)}%`,
        benchmark: `${Math.round(benchmarkResponseRate * 100)}%`,
        status: responseRate >= benchmarkResponseRate ? "ahead" : "behind",
      },
      {
        label: "Onsite conversion",
        value: `${Math.round(onsiteRate * 100)}%`,
        benchmark: `${Math.round(benchmarkOnsiteRate * 100)}%`,
        status: onsiteRate >= benchmarkOnsiteRate ? "ahead" : "behind",
      },
      {
        label: "Pipeline health score",
        value: `${pipelineScore}/100`,
        benchmark: "60/100",
        status: pipelineScore >= 60 ? "healthy" : "building",
      },
      {
        label: "Average offer salary",
        value: averageOfferSalary ? `$${averageOfferSalary.toLocaleString("en-US")}` : "No offers yet",
        benchmark: "Track trend",
        status: averageOfferSalary ? "visible" : "waiting",
      },
    ],
    comparison: [
      {
        label: "Offer conversion",
        current: `${Math.round(offerRate * 100)}%`,
        benchmark: `${Math.round(benchmarkOfferRate * 100)}%`,
        status: offerRate >= benchmarkOfferRate ? "ahead" : "behind",
      },
      {
        label: "Follow-up coverage",
        current: tracker.followUpsDue.length,
        benchmark: benchmarkFollowUps,
        status: tracker.followUpsDue.length <= benchmarkFollowUps ? "healthy" : "attention",
      },
    ],
  };
}
