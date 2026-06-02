import { useMemo, useState } from "react";
import {
  CODE_RUNNER_FEATURE_STATE,
  SUPPORTED_CODE_LANGUAGES,
} from "../lib/codeRunner.mjs";

const JAVA_LANGUAGE = SUPPORTED_CODE_LANGUAGES.find((item) => item.id === "java");

export default function CodeRunner({ theme }) {
  const [code, setCode] = useState(JAVA_LANGUAGE?.starter || "");
  const [stdin, setStdin] = useState("");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  const outputText = useMemo(() => {
    if (!result) return "Run Java to see output.";
    if (result.error) return result.error;
    return [
      result.stdout ? `stdout\n${result.stdout}` : "",
      result.stderr ? `stderr\n${result.stderr}` : "",
      `exit code: ${Number.isInteger(result.exitCode) ? result.exitCode : 0}`,
    ].filter(Boolean).join("\n\n");
  }, [result]);

  async function runCode() {
    if (!code.trim() || running) return;

    setRunning(true);
    setResult(null);

    try {
      const response = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: "java",
          code,
          stdin,
        }),
      });
      const data = await response.json().catch(() => ({}));
      setResult({
        ...data,
        error: response.ok ? data.error : (data.error || "Code runner failed."),
      });
    } catch (error) {
      setResult({ error: error?.message || "Code runner failed." });
    } finally {
      setRunning(false);
    }
  }

  return (
    <section style={{ width: "100%", maxWidth: 980, display: "grid", gap: 12, marginTop: 22, textAlign: "left" }}>
      <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ minWidth: 0, flex: "1 1 260px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 900, marginBottom: 4 }}>
              <i className="ti ti-terminal-2" />Live Java Runner
            </div>
            <p style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.5 }}>
              {CODE_RUNNER_FEATURE_STATE.summary}
            </p>
          </div>
          <span style={{ border: `1px solid ${theme.accentBorder}`, background: theme.accentMuted, color: theme.accentText, borderRadius: 999, padding: "5px 9px", fontSize: 10.8, fontWeight: 900, whiteSpace: "nowrap" }}>
            {CODE_RUNNER_FEATURE_STATE.title}
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
              onClick={runCode}
              disabled={running || !code.trim()}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 36, border: `1px solid ${theme.accentBorder}`, borderRadius: 8, color: theme.accentText, background: theme.accentMuted, fontSize: 12, fontWeight: 900, cursor: running || !code.trim() ? "not-allowed" : "pointer", opacity: running || !code.trim() ? 0.62 : 1 }}
            >
              <i className={running ? "ti ti-loader-2" : "ti ti-player-play"} />
              {running ? "Running..." : "Run Java"}
            </button>

            <pre aria-live="polite" style={{ minHeight: 132, maxHeight: 260, overflow: "auto", whiteSpace: "pre-wrap", border: `1px solid ${theme.accentBorder}`, borderRadius: 8, background: "rgba(2,6,23,0.48)", color: result?.error ? "#fecaca" : "#d1d5db", padding: 10, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 11.5, lineHeight: 1.55 }}>
              {outputText}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
