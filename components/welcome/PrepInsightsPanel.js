import { buildInterviewRoadmap, deriveMistakeBank } from "../../lib/prepInsights.mjs";

export default function PrepInsightsPanel({ profile, topics, weakSpots, mockScores, messages, theme, onAction }) {
  const mistakeBank = deriveMistakeBank(messages);
  const roadmap = buildInterviewRoadmap({ profile, topics, weakSpots, mockScores });

  return (
    <section style={{ width: "100%", maxWidth: 860, display: "grid", gap: 12, marginTop: 22, textAlign: "left" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 10 }}>
        <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 800, marginBottom: 7 }}>
            <i className="ti ti-route" />{roadmap.title}
          </div>
          <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.5, marginBottom: 10 }}>{roadmap.summary}</p>
          <div style={{ display: "grid", gap: 7 }}>
            {roadmap.days.slice(0, 4).map((day) => (
              <button key={day.day} className="glass-button" onClick={() => onAction(day.prompt)} title={`Start day ${day.day}`} style={{ display: "grid", gridTemplateColumns: "30px 1fr auto", alignItems: "center", gap: 8, border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 8, textAlign: "left", cursor: "pointer" }}>
                <span style={{ width: 24, height: 24, borderRadius: 7, display: "inline-flex", alignItems: "center", justifyContent: "center", background: theme.accentMuted, color: theme.accentStrong, fontSize: 11, fontWeight: 900 }}>{day.day}</span>
                <span style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", color: "#e8e8f0", fontSize: 11.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{day.title}</strong>
                  <span style={{ display: "block", color: "#6b7280", fontSize: 10.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{day.focus}</span>
                </span>
                <span style={{ color: theme.accentStrong, fontSize: 10.5, fontWeight: 800 }}>{day.minutes}m</span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 800, marginBottom: 7 }}>
            <i className="ti ti-bug" />Mistake Bank
          </div>
          {mistakeBank.length ? (
            <div style={{ display: "grid", gap: 8 }}>
              {mistakeBank.slice(0, 4).map((item) => (
                <article key={item.id} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 9 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                    <strong style={{ color: "#e8e8f0", fontSize: 11.8 }}>{item.topic}</strong>
                    <button className="glass-button" onClick={() => onAction(item.retryPrompt)} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 7, padding: "4px 7px", color: theme.accentText, fontSize: 10.5, fontWeight: 800, cursor: "pointer" }}>
                      Retry
                    </button>
                  </div>
                  <p style={{ color: "#9ca3af", fontSize: 11, lineHeight: 1.45 }}>{item.correction}</p>
                </article>
              ))}
            </div>
          ) : (
            <div style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 11, background: theme.accentMuted }}>
              <strong style={{ display: "block", color: theme.accentText, fontSize: 12, marginBottom: 5 }}>No mistakes captured yet</strong>
              <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.45 }}>Complete a scored mock and InterviewIQ will collect repeatable gaps here.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
