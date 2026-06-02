import { useState } from "react";
import {
  CODE_RUNNER_FEATURE_STATE,
  SUPPORTED_CODE_LANGUAGES,
} from "../lib/codeRunner.mjs";

const JAVA_LANGUAGE = SUPPORTED_CODE_LANGUAGES.find((item) => item.id === "java");

export default function CodeRunner({ theme }) {
  const [code, setCode] = useState(JAVA_LANGUAGE?.starter || "");
  const [stdin, setStdin] = useState("");

  return (
    <section style={{ width: "100%", maxWidth: 980, display: "grid", gap: 12, marginTop: 22, textAlign: "left" }}>
      <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ minWidth: 0, flex: "1 1 260px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 900, marginBottom: 4 }}>
              <i className="ti ti-terminal-2" />Java Code Runner
            </div>
            <p style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.5 }}>
              {CODE_RUNNER_FEATURE_STATE.summary}
            </p>
          </div>
          <span style={{ border: `1px solid ${theme.accentBorder}`, background: theme.accentMuted, color: theme.accentText, borderRadius: 999, padding: "5px 9px", fontSize: 10.8, fontWeight: 900, whiteSpace: "nowrap" }}>
            Upcoming Feature
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 10 }}>
          <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
            <span style={{ color: "#8b949e", fontSize: 11, fontWeight: 850 }}>Main.java</span>
            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              spellCheck={false}
              rows={12}
              style={{ width: "100%", minHeight: 220, resize: "vertical", border: `1px solid ${theme.accentBorder}`, borderRadius: 8, background: "rgba(2,6,23,0.55)", color: "#e5e7eb", padding: 10, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 12, lineHeight: 1.55, outline: "none" }}
            />
          </label>

          <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
            <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
              <span style={{ color: "#8b949e", fontSize: 11, fontWeight: 850 }}>stdin</span>
              <textarea
                value={stdin}
                onChange={(event) => setStdin(event.target.value)}
                rows={5}
                style={{ width: "100%", minHeight: 90, resize: "vertical", border: `1px solid ${theme.accentBorder}`, borderRadius: 8, background: "rgba(2,6,23,0.42)", color: "#e5e7eb", padding: 9, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 12, lineHeight: 1.5, outline: "none" }}
              />
            </label>

            <button
              className="glass-button"
              type="button"
              disabled={true}
              aria-disabled="true"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 36, border: `1px solid ${theme.accentBorder}`, borderRadius: 8, color: theme.accentText, background: theme.accentMuted, fontSize: 12, fontWeight: 900, cursor: "not-allowed", opacity: 0.62 }}
            >
              <i className="ti ti-clock-code" />
              Coming Soon
            </button>

            <pre aria-live="polite" style={{ minHeight: 132, maxHeight: 260, overflow: "auto", whiteSpace: "pre-wrap", border: `1px solid ${theme.accentBorder}`, borderRadius: 8, background: "rgba(2,6,23,0.48)", color: "#d1d5db", padding: 10, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 11.5, lineHeight: 1.55 }}>
              Code Runner is coming soon. For now, paste your solution into chat for AI review, dry-run feedback, complexity checks, and edge-case coaching.
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
