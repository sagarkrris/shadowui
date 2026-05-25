import {
  CODE_RUNNER_FEATURE_STATE,
  SUPPORTED_CODE_LANGUAGES,
} from "../lib/codeRunner.mjs";

export default function CodeRunner({ theme }) {
  const languages = SUPPORTED_CODE_LANGUAGES.map((item) => item.label).join(", ");

  return (
    <section style={{ width: "100%", maxWidth: 980, display: "grid", gap: 12, marginTop: 22, textAlign: "left" }}>
      <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0, flex: "1 1 260px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 900, marginBottom: 4 }}>
              <i className="ti ti-terminal-2" />Live Code Runner
            </div>
            <p style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
              {CODE_RUNNER_FEATURE_STATE.summary}
            </p>
            <p style={{ color: "#6b7280", fontSize: 11.2, lineHeight: 1.45 }}>
              Planned support: {languages}. Until then, use InterviewIQ code review prompts for walkthroughs, debugging, and interview feedback.
            </p>
          </div>
          <span style={{ border: `1px solid ${theme.accentBorder}`, background: theme.accentMuted, color: theme.accentText, borderRadius: 999, padding: "5px 9px", fontSize: 10.8, fontWeight: 900, whiteSpace: "nowrap" }}>
            {CODE_RUNNER_FEATURE_STATE.title}
          </span>
        </div>
      </div>
    </section>
  );
}
