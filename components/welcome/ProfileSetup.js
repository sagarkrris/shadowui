import { scrollFocusedControlIntoView } from "../../lib/focusViewport.mjs";

const FIELD_LIMITS = {
  name: 80,
  position: 120,
  stack: 160,
};

function getValidationMessages(draft) {
  const messages = [];

  if (!draft.name.trim() || !draft.position.trim() || !draft.experience.trim() || !draft.stack.trim()) {
    messages.push("Complete name, position, experience, and tech stack to continue.");
  }
  if (draft.name.length > FIELD_LIMITS.name) {
    messages.push(`Name must be ${FIELD_LIMITS.name} characters or fewer.`);
  }
  if (draft.position.length > FIELD_LIMITS.position) {
    messages.push(`Position must be ${FIELD_LIMITS.position} characters or fewer.`);
  }
  if (draft.stack.length > FIELD_LIMITS.stack) {
    messages.push(`Tech stack must be ${FIELD_LIMITS.stack} characters or fewer.`);
  }

  return messages;
}

export default function ProfileSetup({ draft, onChange, onSubmit, theme, keyboardOpen = false }) {
  const validationMessages = getValidationMessages(draft);
  const canContinue = validationMessages.length === 0;
  const unlockCards = [
    ["ti-list-check", "Stack Topics", "Sidebar topics change to match Java, Python, React, and more."],
    ["ti-building", "Company Prep", "Search a company and start mocks from reported interview patterns."],
    ["ti-message-circle", "Mock Rounds", "Practice interview or learning mode with calibrated difficulty."],
    ["ti-target-arrow", "Weak Spots", "Feedback gaps are tracked automatically after mock answers."],
  ];
  const fieldStyle = {
    width: "100%",
    border: "1px solid rgba(255,255,255,.09)",
    borderRadius: 9,
    padding: "10px 12px",
    fontSize: 13,
    color: "#e8e8f0",
    outline: "none",
  };
  const handleFieldFocus = (event) => {
    scrollFocusedControlIntoView(event.currentTarget);
  };

  return (
    <div className={`welcome-screen profile-setup-screen${keyboardOpen ? " keyboard-active" : ""}`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: keyboardOpen ? "flex-start" : "center", padding: keyboardOpen ? "12px 20px 24px" : "28px 20px", textAlign: "center", overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", scrollPaddingTop: 18, scrollPaddingBottom: keyboardOpen ? 32 : 48 }}>
      <div className="welcome-logo" style={{ width: 60, height: 60, borderRadius: "50%", background: theme.accentSoft, border: `1px solid ${theme.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
        <i className={`ti ${theme.icon}`} style={{ fontSize: 26, color: theme.accentStrong }} />
      </div>
      <h1 className="welcome-title" style={{ fontSize: 20, fontWeight: 600, color: "#e8e8f0", marginBottom: 8 }}>Tell me your interview target</h1>
      <p className="welcome-copy" style={{ fontSize: 13.5, color: "#6b7280", marginBottom: 22, maxWidth: 380, lineHeight: 1.65 }}>
        I will tailor sections and questions to your role, experience, and stack.
      </p>

      <div style={{ width: "100%", maxWidth: 430, display: "grid", gap: 10, textAlign: "left" }}>
        <label style={{ display: "grid", gap: 5, fontSize: 12, color: "#9ca3af" }}>
          Name
          <input className="glass-input" value={draft.name} onFocus={handleFieldFocus} onChange={(event) => onChange({ ...draft, name: event.target.value })} placeholder="e.g. Sagar" style={fieldStyle} />
        </label>
        <label style={{ display: "grid", gap: 5, fontSize: 12, color: "#9ca3af" }}>
          Position
          <input className="glass-input" value={draft.position} onFocus={handleFieldFocus} onChange={(event) => onChange({ ...draft, position: event.target.value })} placeholder="e.g. Full Stack Developer, Frontend Developer" style={fieldStyle} />
        </label>
        <label style={{ display: "grid", gap: 5, fontSize: 12, color: "#9ca3af" }}>
          Years of experience
          <select className="glass-input" value={draft.experience} onFocus={handleFieldFocus} onChange={(event) => onChange({ ...draft, experience: event.target.value })} style={fieldStyle}>
            <option value="">Select experience</option>
            <option>0-1 years</option>
            <option>2-4 years</option>
            <option>5-7 years</option>
            <option>8+ years</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: 5, fontSize: 12, color: "#9ca3af" }}>
          Tech stack
          <input className="glass-input" value={draft.stack} onFocus={handleFieldFocus} onChange={(event) => onChange({ ...draft, stack: event.target.value })} placeholder="e.g. Java, React, SQL, SAP, Ruby, Rust, AWS" style={fieldStyle} />
        </label>
        <button className="glass-button" onClick={onSubmit} disabled={!canContinue} style={{ marginTop: 4, padding: "10px 14px", borderRadius: 9, border: `1px solid ${theme.accentBorder}`, color: canContinue ? theme.accentText : "#4b5563", fontSize: 13, fontWeight: 600, cursor: canContinue ? "pointer" : "not-allowed" }}>
          Personalize Prep
        </button>
        {validationMessages.length ? (
          <div role="alert" aria-live="polite" style={{ display: "grid", gap: 3, color: "#fca5a5", fontSize: 11.5, lineHeight: 1.4 }}>
            {validationMessages.map((message) => <span key={message}>{message}</span>)}
          </div>
        ) : null}
      </div>

      <div style={{ width: "100%", maxWidth: 720, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 20, textAlign: "left" }}>
        {unlockCards.map(([icon, title, copy]) => (
          <div key={title} className="glass-card" style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 11, minHeight: 96 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              <i className={`ti ${icon}`} style={{ color: theme.accentStrong }} />{title}
            </div>
            <p style={{ color: "#6b7280", fontSize: 11.5, lineHeight: 1.45 }}>{copy}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
