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

function getPrimaryStack(stack = "") {
  return String(stack).split(/[,+/|]/).map((part) => part.trim()).filter(Boolean)[0] || "Stack";
}

export default function ProfileSetup({ draft, onChange, onSubmit, onSignIn, isSignedIn = false, theme, keyboardOpen = false }) {
  const validationMessages = getValidationMessages(draft);
  const canContinue = validationMessages.length === 0;
  const stackPreviewLabel = getPrimaryStack(draft.stack);
  const rolePreviewLabel = draft.position.trim() || "Target role";
  const readinessStats = [
    ["Role-aware plan", "5 paths"],
    ["Practice signals", "12 checks"],
    ["Beginner flow", "5 steps"],
  ];
  const prepWorkflow = ["Profile", "Plan", "Practice", "Review"];
  const previewTracks = [
    [stackPreviewLabel, "Personalized", "ti-stack-2", "#1f6feb"],
    ["DSA Visual Lab", "Next lesson", "ti-binary-tree", "#0f766e"],
    [rolePreviewLabel, "Mock focus", "ti-user-check", "#b45309"],
  ];
  const howItWorks = [
    ["01", "Set the target", "Enter role, level, and stack so the prep path starts from your real interview goal."],
    ["02", "Train visually", "Use animated DSA, scenario prompts, and workspace practice instead of static notes."],
    ["03", "Track progress", "Progress Brain turns activity into current step, weak spots, and a daily plan."],
    ["04", "Review like a pro", "Mocks, answer rewrites, and company prep keep the final run focused."],
  ];
  const featureCards = [
    ["ti-binary-tree", "DSA Visual Lab", "Watch algorithms move through reel-style diagrams, then predict and practice the next step."],
    ["ti-brain", "Progress Brain", "Unified progress events convert activity into readiness, beginner state, and daily prep plans."],
    ["ti-stack-2", "Scenario Bank", "Practice production-style situations with prompts for debugging, design, and stakeholder tradeoffs."],
    ["ti-building-skyscraper", "Company Prep", "Build company-specific mock rounds from role context, likely questions, and final-day checklists."],
  ];
  const trustSignals = [
    ["ti-shield-check", "Profile-first personalization", "Your landing setup drives recommendations before any workspace noise appears."],
    ["ti-lock", "Focused private practice", "Prep tools are built around local state and explicit actions rather than public social feeds."],
    ["ti-briefcase", "Corporate-ready flow", "A calmer landing page builds trust before the darker, high-energy practice console opens."],
  ];
  const mobilePreviewItems = [
    ["Watch", "Animated lesson", "done"],
    ["Predict", "Choose next move", "active"],
    ["Explain", "Say the why", "idle"],
    ["Practice", "Run the drill", "idle"],
    ["Review", "Log the signal", "idle"],
  ];
  const fieldStyle = {
    width: "100%",
    border: "1px solid #d8e2ef",
    borderRadius: 8,
    padding: "11px 12px",
    fontSize: 13,
    color: "#172033",
    background: "#ffffff",
    outline: "none",
    boxShadow: "0 1px 0 rgba(15,23,42,.03)",
  };
  const labelStyle = { display: "grid", gap: 6, fontSize: 12, color: "#475569", fontWeight: 700 };
  const handleFieldFocus = (event) => {
    scrollFocusedControlIntoView(event.currentTarget);
  };
  const focusProfileForm = () => {
    if (typeof document === "undefined") return;
    document.getElementById("profile-name")?.focus();
  };

  return (
    <div className={`welcome-screen profile-setup-screen corporate-entry${keyboardOpen ? " keyboard-active" : ""}`} style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: keyboardOpen ? "12px 16px 24px" : "20px", overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", scrollPaddingTop: 18, scrollPaddingBottom: keyboardOpen ? 32 : 48, background: "linear-gradient(180deg, #f7f9fc 0%, #eef4fb 48%, #e7eef8 100%)", color: "#172033" }}>
      <main style={{ width: "100%", maxWidth: 1180, display: "grid", gap: 22, textAlign: "left" }}>
        <section style={{ minHeight: keyboardOpen ? "auto" : "min(720px, calc(100vh - 40px))", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 342px), 1fr))", gap: 18, alignItems: "center" }}>
          <div style={{ display: "grid", gap: 18, padding: "clamp(4px, 1.8vw, 16px)", minWidth: 0 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 9, justifySelf: "start", minHeight: 34, padding: "6px 10px", border: "1px solid #cad7e6", borderRadius: 8, background: "#ffffff", color: "#1e3a5f", fontSize: 12, fontWeight: 800 }}>
              <span style={{ width: 21, height: 21, borderRadius: 6, background: "#123252", color: "#ffffff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <i className={`ti ${theme.icon}`} style={{ fontSize: 13 }} />
              </span>
              InterviewIQ
            </div>
            <div>
              <h1 style={{ maxWidth: 620, fontSize: "clamp(42px, 7vw, 78px)", lineHeight: .96, fontWeight: 900, color: "#0f2035", marginBottom: 12 }}>
                InterviewIQ
              </h1>
              <p style={{ maxWidth: 610, fontSize: "clamp(18px, 2.3vw, 26px)", color: "#26384f", lineHeight: 1.28, fontWeight: 800, marginBottom: 13 }}>
                Corporate interview prep that turns practice into a guided readiness system.
              </p>
              <p style={{ maxWidth: 580, fontSize: 15, color: "#516173", lineHeight: 1.65 }}>
                Build a polished first impression, then move into a darker focused workspace for visual DSA, mock rounds, company prep, and measurable progress.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={focusProfileForm} style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 42, padding: "10px 15px", borderRadius: 8, border: "1px solid #123252", background: "#123252", color: "#ffffff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                <i className="ti ti-arrow-right" />Build my plan
              </button>
              <button type="button" onClick={focusProfileForm} style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 42, padding: "10px 15px", borderRadius: 8, border: "1px solid #cbd8e8", background: "#ffffff", color: "#123252", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                <i className="ti ti-layout-dashboard" />Open workspace preview
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(116px, 1fr))", gap: 10, maxWidth: 520 }}>
              {readinessStats.map(([label, value]) => (
                <div key={label} style={{ border: "1px solid #d5e0ed", borderRadius: 8, background: "rgba(255,255,255,.78)", padding: "12px 13px" }}>
                  <div style={{ color: "#0f2844", fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{value}</div>
                  <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, marginTop: 6 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ border: "1px solid #ccd9e8", borderRadius: 8, background: "#ffffff", boxShadow: "0 18px 42px rgba(31,48,71,.12)", padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
                <div>
                  <div style={{ color: "#0f2844", fontSize: 13, fontWeight: 800 }}>Product dashboard preview</div>
                  <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>Sample plan generated from your profile inputs</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#e8f0fb", color: "#1f6feb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="ti ti-chart-line" style={{ fontSize: 18 }} />
                </div>
              </div>
              <div style={{ display: "grid", gap: 9 }}>
                {previewTracks.map(([label, value, icon, color]) => (
                  <div key={label} style={{ alignItems: "center", border: "1px solid #e1e8f0", borderRadius: 8, background: "#fbfdff", display: "grid", gridTemplateColumns: "30px minmax(0, 1fr) auto", gap: 9, minHeight: 44, padding: "8px 9px" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}16`, color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className={`ti ${icon}`} style={{ fontSize: 15 }} />
                    </div>
                    <span style={{ color: "#102033", fontSize: 12, fontWeight: 850, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
                    <span style={{ border: "1px solid #d9e4f1", borderRadius: 999, color: "#475569", fontSize: 10.5, fontWeight: 850, padding: "4px 7px", whiteSpace: "nowrap" }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 7, marginTop: 16 }}>
                {prepWorkflow.map((step, index) => (
                  <div key={step} style={{ minHeight: 54, border: "1px solid #e1e8f0", borderRadius: 8, padding: 8, background: index === 0 ? "#f0f6ff" : "#fbfdff" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 6, background: index === 0 ? "#1f6feb" : "#dbe5f1", color: index === 0 ? "#ffffff" : "#475569", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>{index + 1}</div>
                    <div style={{ color: "#334155", fontSize: 10.5, fontWeight: 800, marginTop: 7, overflowWrap: "anywhere" }}>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
            <div style={{ width: "100%", border: "1px solid #cbd8e8", borderRadius: 8, background: "#ffffff", boxShadow: "0 22px 52px rgba(31,48,71,.14)", padding: "clamp(18px, 3.2vw, 30px)", textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 18 }}>
                <div>
                  <div style={{ color: "#1f6feb", fontSize: 11, fontWeight: 800, letterSpacing: 0, textTransform: "uppercase", marginBottom: 7 }}>Profile setup</div>
                  <h2 style={{ color: "#102033", fontSize: 24, lineHeight: 1.15, fontWeight: 800, marginBottom: 8 }}>Tell me your interview target</h2>
                  <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.55 }}>I will tailor sections and questions to your role, experience, and stack.</p>
                </div>
                <div style={{ width: 42, height: 42, borderRadius: 8, background: "#123252", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
                  <i className="ti ti-user-check" style={{ fontSize: 20 }} />
                </div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <label style={labelStyle}>
                  Name
                  <input id="profile-name" value={draft.name} onFocus={handleFieldFocus} onChange={(event) => onChange({ ...draft, name: event.target.value })} placeholder="e.g. Sagar" style={fieldStyle} />
                </label>
                <label style={labelStyle}>
                  Position
                  <input id="profile-position" value={draft.position} onFocus={handleFieldFocus} onChange={(event) => onChange({ ...draft, position: event.target.value })} placeholder="e.g. Full Stack Developer, Frontend Developer" style={fieldStyle} />
                </label>
                <label style={labelStyle}>
                  Years of experience
                  <select id="profile-experience" value={draft.experience} onFocus={handleFieldFocus} onChange={(event) => onChange({ ...draft, experience: event.target.value })} style={fieldStyle}>
                    <option value="">Select experience</option>
                    <option>0-1 years</option>
                    <option>2-4 years</option>
                    <option>5-7 years</option>
                    <option>8+ years</option>
                  </select>
                </label>
                <label style={labelStyle}>
                  Tech stack
                  <input id="profile-stack" value={draft.stack} onFocus={handleFieldFocus} onChange={(event) => onChange({ ...draft, stack: event.target.value })} placeholder="e.g. Java, React, SQL, SAP, Ruby, Rust, AWS" style={fieldStyle} />
                </label>
                <button onClick={onSubmit} disabled={!canContinue} style={{ marginTop: 2, minHeight: 44, padding: "11px 14px", borderRadius: 8, border: "1px solid #123252", background: canContinue ? "#123252" : "#e5ebf3", color: canContinue ? "#ffffff" : "#64748b", fontSize: 13, fontWeight: 800, cursor: canContinue ? "pointer" : "not-allowed" }}>
                  Personalize Prep
                </button>
                {!isSignedIn && onSignIn ? (
                  <button type="button" onClick={onSignIn} style={{ minHeight: 40, padding: "9px 14px", borderRadius: 8, border: "1px solid #cbd8e8", background: "#ffffff", color: "#123252", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>
                    <i className="ti ti-cloud-upload" style={{ marginRight: 7 }} />Sign in and sync
                  </button>
                ) : null}
                {validationMessages.length ? (
                  <div role="alert" aria-live="polite" style={{ display: "grid", gap: 3, color: "#b42318", fontSize: 11.5, lineHeight: 1.4 }}>
                    {validationMessages.map((message) => <span key={message}>{message}</span>)}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section style={{ borderTop: "1px solid #d8e2ef", paddingTop: 22 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <p style={{ color: "#1f6feb", fontSize: 11, fontWeight: 900, textTransform: "uppercase", marginBottom: 7 }}>How it works</p>
              <h2 style={{ color: "#102033", fontSize: "clamp(24px, 3.2vw, 36px)", lineHeight: 1.1, fontWeight: 900 }}>From first profile to final review.</h2>
            </div>
            <button type="button" onClick={focusProfileForm} style={{ minHeight: 40, padding: "9px 13px", borderRadius: 8, border: "1px solid #cbd8e8", background: "#ffffff", color: "#123252", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
              Start setup
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 205px), 1fr))", gap: 10 }}>
            {howItWorks.map(([step, title, copy]) => (
              <div key={title} style={{ border: "1px solid #d6e1ee", borderRadius: 8, background: "#ffffff", padding: 14, minHeight: 150 }}>
                <div style={{ color: "#1f6feb", fontSize: 12, fontWeight: 900, marginBottom: 18 }}>{step}</div>
                <h3 style={{ color: "#102033", fontSize: 14, lineHeight: 1.25, fontWeight: 900, marginBottom: 8 }}>{title}</h3>
                <p style={{ color: "#64748b", fontSize: 12, lineHeight: 1.5 }}>{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p style={{ color: "#1f6feb", fontSize: 11, fontWeight: 900, textTransform: "uppercase", marginBottom: 7 }}>Feature grid</p>
          <h2 style={{ color: "#102033", fontSize: "clamp(24px, 3.2vw, 36px)", lineHeight: 1.1, fontWeight: 900, marginBottom: 14 }}>Everything needed for a modern interview loop.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 10 }}>
            {featureCards.map(([icon, title, copy]) => (
              <div key={title} style={{ border: "1px solid #d6e1ee", borderRadius: 8, background: "#ffffff", padding: 15, minHeight: 150 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "#eef5ff", color: "#1f6feb", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <i className={`ti ${icon}`} style={{ fontSize: 18 }} />
                </div>
                <h3 style={{ color: "#102033", fontSize: 15, fontWeight: 900, marginBottom: 8 }}>{title}</h3>
                <p style={{ color: "#64748b", fontSize: 12.5, lineHeight: 1.5 }}>{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 310px), 1fr))", gap: 14, alignItems: "stretch" }}>
          <div style={{ border: "1px solid #d6e1ee", borderRadius: 8, background: "#ffffff", padding: 18 }}>
            <p style={{ color: "#1f6feb", fontSize: 11, fontWeight: 900, textTransform: "uppercase", marginBottom: 7 }}>Corporate trust</p>
            <h2 style={{ color: "#102033", fontSize: 24, lineHeight: 1.15, fontWeight: 900, marginBottom: 14 }}>A calmer first impression before intense practice.</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {trustSignals.map(([icon, title, copy]) => (
                <div key={title} style={{ display: "grid", gridTemplateColumns: "34px 1fr", gap: 10, alignItems: "start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f0f6ff", color: "#1f6feb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className={`ti ${icon}`} />
                  </div>
                  <div>
                    <h3 style={{ color: "#102033", fontSize: 13, fontWeight: 900, marginBottom: 4 }}>{title}</h3>
                    <p style={{ color: "#64748b", fontSize: 12, lineHeight: 1.45 }}>{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ border: "1px solid #d6e1ee", borderRadius: 8, background: "#ffffff", color: "#102033", padding: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))", gap: 16, alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: "#1f6feb", fontSize: 11, fontWeight: 900, textTransform: "uppercase", marginBottom: 7 }}>Mobile app preview</p>
              <h2 style={{ color: "#102033", fontSize: 24, lineHeight: 1.15, fontWeight: 900, marginBottom: 10 }}>A clean guided flow for phone screens.</h2>
              <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.55 }}>Beginner Mode is shown as a compact stepper, so learners always know the current step without reading a dense panel.</p>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
                {["Current step", "Practice cue", "Review signal"].map((label) => (
                  <span key={label} style={{ border: "1px solid #d9e4f1", borderRadius: 999, color: "#475569", fontSize: 10.5, fontWeight: 850, padding: "5px 8px" }}>{label}</span>
                ))}
              </div>
            </div>
            <div style={{ border: "1px solid #cbd8e8", borderRadius: 8, background: "#102033", boxShadow: "0 18px 38px rgba(31,48,71,.16)", justifySelf: "center", maxWidth: 236, padding: 10, width: "100%" }}>
              <div style={{ height: 18, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 9 }}>
                <span style={{ width: 44, height: 5, borderRadius: 8, background: "rgba(255,255,255,.25)" }} />
              </div>
              <div style={{ background: "#f8fbff", borderRadius: 8, padding: 10 }}>
                <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                  <div>
                    <strong style={{ color: "#102033", display: "block", fontSize: 12 }}>Beginner Mode</strong>
                    <span style={{ color: "#64748b", display: "block", fontSize: 10.5, marginTop: 2 }}>Step 2 of 5</span>
                  </div>
                  <span style={{ background: "#eaf3ff", borderRadius: 999, color: "#1f6feb", fontSize: 10, fontWeight: 900, padding: "4px 7px" }}>Predict</span>
                </div>
                <div style={{ display: "grid", gap: 7 }}>
                  {mobilePreviewItems.map(([title, copy, state], index) => {
                    const active = state === "active";
                    const done = state === "done";
                    return (
                      <div key={title} style={{ alignItems: "center", border: `1px solid ${active ? "#bfdbfe" : "#e1e8f0"}`, borderRadius: 8, background: active ? "#eff6ff" : "#ffffff", display: "grid", gridTemplateColumns: "24px minmax(0, 1fr)", gap: 8, padding: 8 }}>
                        <span style={{ width: 22, height: 22, borderRadius: 7, background: active ? "#1f6feb" : done ? "#0f766e" : "#e2e8f0", color: active || done ? "#ffffff" : "#64748b", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>{done ? <i className="ti ti-check" /> : index + 1}</span>
                        <span style={{ minWidth: 0 }}>
                          <strong style={{ color: "#102033", display: "block", fontSize: 11.5, lineHeight: 1.2 }}>{title}</strong>
                          <span style={{ color: "#64748b", display: "block", fontSize: 10.3, lineHeight: 1.25, marginTop: 2 }}>{copy}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ border: "1px solid #cbd8e8", borderRadius: 8, background: "#ffffff", padding: "clamp(18px, 3vw, 28px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 4 }}>
          <div>
            <h2 style={{ color: "#102033", fontSize: 24, lineHeight: 1.2, fontWeight: 900, marginBottom: 7 }}>Ready to personalize InterviewIQ?</h2>
            <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>Start with your target role and the internal prep workspace will stay focused around it.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={focusProfileForm} style={{ minHeight: 42, padding: "10px 15px", borderRadius: 8, border: "1px solid #123252", background: "#123252", color: "#ffffff", fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
              Create prep profile
            </button>
            <button type="button" onClick={focusProfileForm} style={{ minHeight: 42, padding: "10px 15px", borderRadius: 8, border: "1px solid #cbd8e8", background: "#f8fbff", color: "#123252", fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
              View guided flow
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
