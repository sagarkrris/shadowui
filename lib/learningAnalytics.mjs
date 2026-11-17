import { summarizeProductEvents } from './analytics.mjs';
const day = 86_400_000;
export function learningAnalytics(rows, { now = Date.now(), retentionDays = 30, truncated = false } = {}) {
  const valid = (Array.isArray(rows) ? rows : []).filter(row => Number.isFinite(Date.parse(row.created_at)) && Date.parse(row.created_at) <= now && Date.parse(row.created_at) >= now - retentionDays * day);
  const browsers = new Map();
  for (const row of valid) {
    if (!browsers.has(row.visitor_id)) browsers.set(row.visitor_id, []);
    browsers.get(row.visitor_id).push(row);
  }
  const retention = days => {
    if (retentionDays < days + 1) return { eligible:0, returned:0, rate:null, limitation:`Requires at least ${days + 1} days of retained observations.` };
    let eligible = 0, returned = 0;
    for (const events of browsers.values()) {
      const first = events.reduce((first,e)=>Math.min(first,Date.parse(e.created_at)),Infinity);
      const elapsed = Math.floor((now - first) / day);
      if (elapsed < days) continue;
      eligible++;
      if (events.some(e=>Math.floor((Date.parse(e.created_at)-first)/day)===days)) returned++;
    }
    return { eligible, returned, rate:eligible ? returned/eligible : null, limitation:'First observed within the retained window; browsers, not unique people or lifetime acquisition cohorts.' };
  };
  const converted = valid.map(row=>({name:row.name,sessionId:row.session_id,attemptId:row.attempt_id,value:row.value}));
  return { events:valid.length, selfReportedBrowserPathCompletions:new Set(valid.filter(e=>e.name==='path_completed').map(e=>`${e.visitor_id}:${e.value}`)).size, selfReportedCompletionActions:valid.filter(e=>e.name==='lesson_completed').length, reopenedLessonActions:valid.filter(e=>e.name==='lesson_reopened').length, diagnosticSubmissions:valid.filter(e=>e.name==='diagnostic_completed').length, diagnosticRetestSubmissions:valid.filter(e=>e.name==='diagnostic_retest_completed').length, observedBrowsers:browsers.size, truncated, ...summarizeProductEvents(converted), day7:retention(7), day30:retention(30), limitations:['Opt-in browser events are client-reported and may be incomplete, blocked, duplicated or fabricated.', 'Counts describe observed usage and comparable retest events; they do not prove learning or hiring readiness.', 'The report is capped at 100,000 retained rows; truncated reports must not be presented as complete.'] };
}
