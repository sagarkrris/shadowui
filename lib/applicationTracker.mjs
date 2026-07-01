export const APPLICATION_STAGES = ["saved", "applied", "recruiter", "screen", "onsite", "offer", "rejected", "withdrawn"];

const clean = (value, max = 200) => String(value || "").trim().slice(0, max);

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
