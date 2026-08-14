export const INCIDENT_SIMULATION = {
  title: "Checkout latency after a release",
  summary: "A checkout release is followed by rising p99 latency and payment timeouts during a peak sale.",
  stages: [
    { time: "09:02", dashboard: "p99 480ms → 4.8s; CPU 46%; request rate unchanged.", trace: "POST /checkout: inventory 42ms, payment 4.1s, notification 18ms.", log: "WARN payment-client timeout after 3500ms", deploy: "09:00: checkout 2026.08.14-rc2 enabled synchronous receipt enrichment.", runbook: "Confirm customer impact; compare by dependency and release; avoid increasing pools before saturation evidence." },
    { time: "09:07", dashboard: "checkout executor: 64/64 active, queue 9,400; payment pool wait 3.2s.", trace: "78% of traces wait on payment connection acquisition.", log: "RejectedExecutionException rate: 18/min", deploy: "Receipt enrichment calls notification synchronously after payment authorization.", runbook: "Protect checkout critical path; set a rollback or feature-flag decision with an owner and verification metric." },
    { time: "09:15", dashboard: "after feature flag off: p99 720ms; payment errors fall; notification lag grows.", trace: "payment 110ms; async notification backlog 12k.", log: "consumer rate 350/s, arrival 620/s", deploy: "Flag change propagated to all regions.", runbook: "Communicate customer impact, mitigation, owner, next update, and follow-up capacity work." },
  ],
  decisions: [
    { question: "Rollback now or mitigate?", strong: "Disable synchronous receipt enrichment first because the release is correlated, reversible, and preserves payment correctness. Roll back if the flag fails to recover the checkout SLO." },
    { question: "Page DB/on-call?", strong: "Page the checkout and payment owners immediately; do not page database on-call until pool wait, DB saturation, slow queries, or lock evidence points to it." },
    { question: "What do you communicate?", strong: "State scope, user impact, current mitigation, decision owner, next update time, and what is not yet known. Avoid claiming root cause before evidence." },
  ],
};

export function getIncidentStage(index = 0) {
  return INCIDENT_SIMULATION.stages[Math.max(0, Math.min(INCIDENT_SIMULATION.stages.length - 1, Number(index) || 0))];
}
