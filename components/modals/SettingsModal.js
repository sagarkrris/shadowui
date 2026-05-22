export default function SettingsModal({ onClose, theme }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.7)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        backdropFilter: "blur(4px)"
      }}
    >
      <div
        className="glass-chrome"
        onClick={(event) => event.stopPropagation()}
        style={{
          border: `1px solid ${theme.accentBorder}`,
          borderRadius: "16px 16px 0 0",
          padding: 20,
          width: "100%",
          maxWidth: 480
        }}
      >
        <div style={{ width: 36, height: 4, background: "rgba(255,255,255,.1)", borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#e8e8f0" }}>
            <i className={`ti ${theme.icon}`} style={{ color: theme.accentStrong, marginRight: 7 }} />
            About
          </span>
          <button className="icon-btn" onClick={onClose} style={{ color: "#6b7280", fontSize: 22, cursor: "pointer" }}>x</button>
        </div>

        <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.8 }}>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: theme.accentText }}>Full Stack Interview Assistant</strong>
          </p>
          <p style={{ marginBottom: 12 }}>
            Designed & Developed by
            <strong style={{ color: "#ffffff" }}> Sagar Krishna</strong>
          </p>
          <p style={{ marginBottom: 12 }}>
            AI-powered full stack developer interview preparation platform with:
          </p>
          <ul style={{ paddingLeft: 18 }}>
            <li>Mock Interviews</li>
            <li>Frontend, Backend & Database Practice</li>
            <li>DSA Practice</li>
            <li>System Design Preparation</li>
            <li>Voice Input</li>
            <li>Screen Analysis</li>
            <li>Code Review</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
