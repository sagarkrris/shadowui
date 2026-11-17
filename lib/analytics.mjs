const ALLOWED_EVENTS = new Set(["path_completed", "lesson_completed", "lesson_reopened", "diagnostic_completed", "diagnostic_retest_completed", "landing_role_selected", "landing_path_started", "detective_viewed", "detective_started", "detective_completed", "detective_returned", "detective_shared", "detective_share_visit", "explain_log_viewed", "explain_log_started", "explain_log_completed", "explain_log_returned", "unfinished_session_available", "ai_completed", "result_save_failed", "content_resolved", "result_recorded", "retest_completed", "ai_failed", "session_resumed", "draft_recovered", "answer_submitted", "content_reported", "page_view", "auth_started", "practice_started", "mock_completed", "readiness_shared", "guide_opened", "demo_answered", "demo_completed", "demo_skipped", "product_tour_scene", "product_tour_playback"]);
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,96}$/;
export const ANALYTICS_CONSENT_KEY = "interviewiq.analyticsConsent.v1";
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function analyticsConsent(storage) {
  try { const value = JSON.parse(storage.getItem(ANALYTICS_CONSENT_KEY) || 'null'); return value?.version === 1 && UUID.test(value.visitorId || '') ? { ...value, enabled: value.enabled === true } : null; } catch { return null; }
}
export function analyticsRoute(value = '/') {
  const path = String(value).split(/[?#]/)[0];
  if (path === '/') return '/';
  const segment = path.split('/')[1];
  return ['practice','learn','java','tech-blogs','guides','labs','build','assessments','diagnostic','progress','detective','explain-log','senior-java-interview','notebook','prepare','privacy','capabilities','editorial','share','sign-in','sign-up'].includes(segment) ? `/${segment}` : '/other';
}
function analyticsValue(name, value) {
  const text = String(value ?? '');
  if (/^(?:ai_completed|content_resolved|practice_started|mock_completed|readiness_shared|product_tour_scene)$/.test(name)) return /^(?:0|[1-9]\d{0,8})(?:\.\d{1,3})?$/.test(text) ? text : '';
  if (name === 'path_completed') return ['java-backend','system-design','full-stack','ai-engineering'].includes(text) ? text : '';
  if (name === 'product_tour_playback') return ['paused','played'].includes(text) ? text : '';
  if (name === 'landing_role_selected' || name === 'landing_path_started') return ['backend','architect','fullstack','ai'].includes(text) ? text : '';
  if (name === 'retest_completed') return /^(?:Improved|Remains open|Needs another review|Separate reassessment of the same answer):(?:-?\d{1,2}(?:\.\d)?|unassessed)$/.test(text) ? text : '';
  if (/^(?:detective|explain_log)_/.test(name)) return /^[a-z0-9-]{1,80}$/.test(text) ? text : '';
  return '';
}
export const PRODUCT_EVENTS_KEY = "interviewiq.productEvents.v1";
export function normalizeAnalyticsEvent(event = {}) {
  const name = String(event?.name || "");
  if (!ALLOWED_EVENTS.has(name)) return null;
  const result = { name, path: analyticsRoute(event.path), value: analyticsValue(name, event.value) };
  for (const field of ["sessionId", "attemptId", "eventId"]) if (typeof event[field] === "string" && ID_PATTERN.test(event[field])) result[field] = event[field];
  return result;
}
export function summarizeProductEvents(events = []) {
  const valid = events.map(normalizeAnalyticsEvent).filter(Boolean);
  const sessions = name => new Set(valid.filter(e => e.name === name && e.sessionId).map(e => e.sessionId));
  const intersection = (a, b) => [...a].filter(id => b.has(id)).length;
  const started = sessions("practice_started");
  const available = sessions("unfinished_session_available");
  const completed = valid.filter(e => e.name === "ai_completed");
  const failed = valid.filter(e => e.name === "ai_failed");
  const latency = completed.filter(e => e.value !== '').map(e => Number(e.value)).filter(Number.isFinite).sort((a,b) => a-b);
  return {
    startedSessions: started.size,
    sessionsWithAnswers: intersection(started, sessions("answer_submitted")),
    unfinishedSessionsAvailable: available.size,
    unfinishedSessionsResumed: intersection(available, sessions("session_resumed")),
    aiCompletions: completed.length, aiFailures: failed.length,
    medianAiLatencyMs: latency.length ? (latency[Math.floor((latency.length-1)/2)] + latency[Math.floor(latency.length/2)]) / 2 : null,
    savedResults: new Set(valid.filter(e => e.name === "result_recorded" && e.attemptId).map(e => e.attemptId)).size,
    saveFailures: valid.filter(e => e.name === "result_save_failed").length,
    improvedRetests: new Set(valid.filter(e => e.name === "retest_completed" && String(e.value || "").toLowerCase().startsWith("improved:") && e.attemptId).map(e => e.attemptId)).size,
  };
}
export function trackEvent(name, data = {}) {
  if (typeof window === "undefined") return;
  let storage;
  try { storage = window.localStorage; } catch { return; }
  const consent = analyticsConsent(storage);
  if (!consent?.enabled) return;
  let sessionId;
  try {
    sessionId = sessionStorage.getItem("interviewiq.analyticsSession");
    if (!ID_PATTERN.test(sessionId || "")) { sessionId = crypto.randomUUID(); sessionStorage.setItem("interviewiq.analyticsSession", sessionId); }
  } catch { /* Analytics must never block practice when storage is unavailable. */ }
  let event;
  try { event = normalizeAnalyticsEvent({ name, path: window.location.pathname, ...data, sessionId, eventId: crypto.randomUUID() }); } catch { return; }
  if (!event) return;
  try {
    const saved = JSON.parse(localStorage.getItem(PRODUCT_EVENTS_KEY) || "[]");
    const events = Array.isArray(saved) ? saved.filter(e => normalizeAnalyticsEvent(e)).slice(-1999) : [];
    localStorage.setItem(PRODUCT_EVENTS_KEY, JSON.stringify([...events, { ...event, createdAt: new Date().toISOString() }]));
  } catch { /* Best-effort measurements are separate from saved work. */ }
  const body = JSON.stringify({ consent: true, visitorId: consent.visitorId, event });
  try { if (navigator.sendBeacon?.("/api/analytics", new Blob([body], { type: "application/json" }))) return; } catch { /* A blocked beacon must not block the learner action. */ }
  try { fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {}); } catch { /* Optional measurements stay best effort. */ }
}

/** Counts case/session pairs, not people. A copied link is not a confirmed share. */
export function summarizeDetectiveEvents(events = []) {
  const valid = events.map(normalizeAnalyticsEvent).filter(e => e?.sessionId);
  const pairs = name => new Set(valid.filter(e => e.name === name).map(e => `${e.sessionId}:${e.value}`));
  const viewed = pairs("detective_viewed");
  const started = pairs("detective_started");
  const completed = pairs("detective_completed");
  return {
    caseViews: viewed.size,
    startedInvestigations: started.size,
    completedInvestigations: completed.size,
    sameSessionCompletionRate: started.size ? [...started].filter(id => completed.has(id)).length / started.size : null,
    laterDayReturns: pairs("detective_returned").size,
    copiedChallengeLinks: pairs("detective_shared").size,
    shareReferredVisits: pairs("detective_share_visit").size,
  };
}

/** Counts artifact/session pairs; completion means all published lines were inspected. */
export function summarizeExplainLogEvents(events = []) {
  const valid = events.map(normalizeAnalyticsEvent).filter(e => e?.sessionId);
  const pairs = name => new Set(valid.filter(e => e.name === name).map(e => `${e.sessionId}:${e.value}`));
  const viewed = pairs("explain_log_viewed");
  const started = pairs("explain_log_started");
  const completed = pairs("explain_log_completed");
  return {
    artifactViews: viewed.size,
    startedReadings: started.size,
    completedReadings: completed.size,
    sameSessionCompletionRate: started.size ? [...started].filter(id => completed.has(id)).length / started.size : null,
    laterDayReturns: pairs("explain_log_returned").size,
  };
}
