export default function PrepCommandCenter({ center, theme, onAction }) {
  return (
    <section style={{ width: "100%", maxWidth: 860, display: "grid", gap: 12, marginTop: 22, textAlign: "left" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            <i className="ti ti-gauge" />Readiness
          </div>
          <div style={{ display: "flex", alignItems: "end", gap: 7 }}>
            <span style={{ color: "#e8e8f0", fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{center.readinessScore ?? "-"}</span>
            {center.readinessScore !== null && <span style={{ color: "#6b7280", fontSize: 11, marginBottom: 4 }}>/100</span>}
          </div>
          <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.45, marginTop: 8 }}>{center.readinessLabel}</p>
        </div>

        <div className="glass-card" style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            <i className="ti ti-target-arrow" />Focus Signal
          </div>
          <strong style={{ display: "block", color: "#e8e8f0", fontSize: 14, marginBottom: 7 }}>{center.focusArea}</strong>
          <p style={{ color: "#6b7280", fontSize: 11.5, lineHeight: 1.45 }}>Use this as your next high-leverage interview rep.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        {center.dailyPlan.map((item) => (
          <article key={item.title} className="glass-card" style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 11 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
              <strong style={{ color: "#e8e8f0", fontSize: 12.5 }}>{item.title}</strong>
              <span style={{ color: theme.accentStrong, fontSize: 10.5, fontWeight: 700 }}>{item.minutes} min</span>
            </div>
            <p style={{ color: "#6b7280", fontSize: 11.5, lineHeight: 1.45 }}>{item.detail}</p>
          </article>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {center.actions.map((action) => (
          <button key={action.id} className="glass-button" onClick={() => onAction(action.prompt)} title={action.description} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 11px", borderRadius: 8, border: `1px solid ${theme.accentBorder}`, color: theme.accentText, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <i className={`ti ${action.icon}`} />{action.label}
          </button>
        ))}
      </div>
    </section>
  );
}
