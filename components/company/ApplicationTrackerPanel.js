import { useMemo, useState } from "react";
import {
  APPLICATION_STAGES,
  buildApplicationBenchmarkComparison,
  buildApplicationTracker,
  buildCalendarFollowUpEvent,
  createApplication,
} from "../../lib/applicationTracker.mjs";

const DRAFT = {
  company: "",
  role: "",
  stage: "saved",
  followUpAt: "",
  recruiterName: "",
  recruiterEmail: "",
};

export default function ApplicationTrackerPanel({ applications = [], onChange, theme }) {
  const [draft, setDraft] = useState(DRAFT);
  const tracker = useMemo(() => buildApplicationTracker(applications), [applications]);
  const benchmark = useMemo(() => buildApplicationBenchmarkComparison(applications), [applications]);

  const addApplication = () => {
    if (!draft.company.trim() || !draft.role.trim()) return;

    const next = createApplication({
      company: draft.company,
      role: draft.role,
      stage: draft.stage,
      followUpAt: draft.followUpAt,
      recruiter: {
        name: draft.recruiterName,
        email: draft.recruiterEmail,
      },
    });

    onChange?.([...applications, next]);
    setDraft(DRAFT);
  };

  return (
    <section className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, display: "grid", gap: 12, padding: 12 }}>
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div>
          <h2 style={{ color: theme.accentText, display: "flex", fontSize: 14, gap: 7, marginBottom: 4 }}>
            <i className="ti ti-briefcase" />Application Tracker
          </h2>
          <p style={{ color: "#9ca3af", fontSize: 11.4, lineHeight: 1.45 }}>
            Track stages, follow-up deadlines, calendar-ready reminders, and benchmark comparison.
          </p>
        </div>
        <span style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 999, color: theme.accentStrong, fontSize: 10.5, fontWeight: 900, padding: "5px 8px" }}>
          {tracker.applications.length} apps
        </span>
      </div>

      <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 120px), 1fr))" }}>
        <input className="glass-input" value={draft.company} onChange={(event) => setDraft((current) => ({ ...current, company: event.target.value }))} placeholder="Company" maxLength={80} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "#e2e8f0", padding: 8 }} />
        <input className="glass-input" value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))} placeholder="Role" maxLength={100} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "#e2e8f0", padding: 8 }} />
        <select className="glass-input" value={draft.stage} onChange={(event) => setDraft((current) => ({ ...current, stage: event.target.value }))} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "#cbd5e1", padding: 8 }}>
          {APPLICATION_STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
        </select>
        <input className="glass-input" type="datetime-local" value={draft.followUpAt} onChange={(event) => setDraft((current) => ({ ...current, followUpAt: event.target.value }))} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "#cbd5e1", padding: 8 }} />
        <input className="glass-input" value={draft.recruiterName} onChange={(event) => setDraft((current) => ({ ...current, recruiterName: event.target.value }))} placeholder="Recruiter" maxLength={80} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "#e2e8f0", padding: 8 }} />
        <input className="glass-input" value={draft.recruiterEmail} onChange={(event) => setDraft((current) => ({ ...current, recruiterEmail: event.target.value }))} placeholder="Recruiter email" maxLength={254} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "#e2e8f0", padding: 8 }} />
      </div>

      <button type="button" className="glass-button" onClick={addApplication} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, color: theme.accentText, cursor: "pointer", fontSize: 11.2, fontWeight: 900, justifySelf: "start", padding: "7px 10px" }}>
        <i className="ti ti-plus" style={{ marginRight: 6 }} />
        Add application
      </button>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))" }}>
        {benchmark.comparison.map((item) => (
          <article key={item.label} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 10 }}>
            <div style={{ color: theme.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{item.label}</div>
            <div style={{ color: "#f8fbff", fontSize: 17, fontWeight: 900, marginTop: 4 }}>{item.current}</div>
            <div style={{ color: "#94a3b8", fontSize: 10.8, marginTop: 2 }}>Benchmark {item.benchmark}</div>
            <div style={{ color: item.status === "ahead" || item.status === "healthy" ? "#86efac" : "#fda4af", fontSize: 10.8, fontWeight: 900, marginTop: 4, textTransform: "uppercase" }}>{item.status}</div>
          </article>
        ))}
      </div>

      <section style={{ display: "grid", gap: 8 }}>
        <div style={{ color: theme.accentText, fontSize: 11.2, fontWeight: 900, textTransform: "uppercase" }}>
          Richer Benchmark Analytics
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))" }}>
          {benchmark.insights.map((item) => (
            <article key={item.label} style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 10 }}>
              <div style={{ color: theme.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{item.label}</div>
              <div style={{ color: "#f8fbff", fontSize: 16, fontWeight: 900, marginTop: 4 }}>{item.value}</div>
              <div style={{ color: "#94a3b8", fontSize: 10.8, marginTop: 2 }}>Benchmark {item.benchmark}</div>
              <div style={{ color: item.status === "ahead" || item.status === "healthy" || item.status === "visible" ? "#86efac" : item.status === "waiting" ? "#94a3b8" : "#fda4af", fontSize: 10.8, fontWeight: 900, marginTop: 4, textTransform: "uppercase" }}>{item.status}</div>
            </article>
          ))}
        </div>
      </section>

      <div style={{ display: "grid", gap: 8 }}>
        {tracker.applications.slice(0, 6).map((application) => {
          const event = buildCalendarFollowUpEvent(application);
          return (
            <article key={application.id} style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 6, padding: 10 }}>
              <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
                <strong style={{ color: "#f8fbff", fontSize: 12.2 }}>{application.company} · {application.role}</strong>
                <span style={{ color: theme.accentStrong, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{application.stage}</span>
              </div>
              <div style={{ color: "#94a3b8", fontSize: 11 }}>
                {application.followUpAt ? `Follow-up: ${application.followUpAt}` : "No follow-up scheduled yet."}
              </div>
              {event && (
                <div style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 7, color: "#cbd5e1", fontSize: 10.8, lineHeight: 1.45, padding: 8 }}>
                  <strong style={{ color: theme.accentText }}>Calendar Adapter</strong>
                  <div>{event.title}</div>
                  <div>{event.startsAt} → {event.endsAt}</div>
                </div>
              )}
            </article>
          );
        })}
        {!tracker.applications.length && (
          <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "#94a3b8", fontSize: 11.4, padding: 10 }}>
            Add a few applications to unlock stage counts, due follow-ups, and calendar-ready reminders.
          </div>
        )}
      </div>
    </section>
  );
}
