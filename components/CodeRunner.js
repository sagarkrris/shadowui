import { useMemo, useRef, useState } from "react";
import { SUPPORTED_CODE_LANGUAGES } from "../lib/codeRunner.mjs";

function pickInitialLanguage(profile, selectedCat, selectedSub) {
  const text = `${profile?.stack || ""} ${selectedCat || ""} ${selectedSub || ""}`.toLowerCase();

  if (/\b(java|spring)\b/.test(text)) return "java";
  if (/\bpython|django|fastapi|flask\b/.test(text)) return "python";
  if (/\brust|tokio|axum\b/.test(text)) return "rust";
  if (/\bgo|golang\b/.test(text)) return "go";
  if (/\bc\+\+|cpp\b/.test(text)) return "cpp";
  if (/\btypescript|ts\b/.test(text)) return "typescript";
  return "javascript";
}

function outputText(output) {
  if (!output) return "";
  const stdout = output.stdout ? output.stdout.trimEnd() : "";
  const stderr = output.stderr ? output.stderr.trimEnd() : "";
  if (stdout && stderr) return `${stdout}\n${stderr}`;
  return stdout || stderr || "(no output)";
}

export default function CodeRunner({ profile, selectedCat, selectedSub, theme }) {
  const initialLanguage = useMemo(
    () => pickInitialLanguage(profile, selectedCat, selectedSub),
    [profile, selectedCat, selectedSub],
  );
  const initialConfig = SUPPORTED_CODE_LANGUAGES.find((item) => item.id === initialLanguage) || SUPPORTED_CODE_LANGUAGES[0];
  const [language, setLanguage] = useState(initialConfig.id);
  const [code, setCode] = useState(initialConfig.starter);
  const [stdin, setStdin] = useState("");
  const [showStdin, setShowStdin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState(null);
  const editorRef = useRef(null);
  const selectedLanguage = SUPPORTED_CODE_LANGUAGES.find((item) => item.id === language) || SUPPORTED_CODE_LANGUAGES[0];

  const changeLanguage = (event) => {
    const nextLanguage = SUPPORTED_CODE_LANGUAGES.find((item) => item.id === event.target.value) || SUPPORTED_CODE_LANGUAGES[0];
    setLanguage(nextLanguage.id);
    setCode(nextLanguage.starter);
    setOutput(null);
  };

  const handleEditorKeyDown = (event) => {
    if (event.key !== "Tab") return;
    event.preventDefault();

    const editor = editorRef.current;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const next = `${code.slice(0, start)}  ${code.slice(end)}`;

    setCode(next);
    requestAnimationFrame(() => {
      editor.selectionStart = start + 2;
      editor.selectionEnd = start + 2;
    });
  };

  const runCode = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setOutput(null);

    try {
      const response = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, stdin }),
      });
      const data = await response.json();

      if (!response.ok) {
        setOutput({ stdout: "", stderr: data.error || "Code execution failed.", exitCode: 1 });
      } else {
        setOutput(data);
      }
    } catch (error) {
      setOutput({ stdout: "", stderr: error.message || "Code execution failed.", exitCode: 1 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ width: "100%", maxWidth: 980, display: "grid", gap: 12, marginTop: 22, textAlign: "left" }}>
      <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 900 }}>
              <i className="ti ti-terminal-2" />Live Code Runner
            </div>
            <p style={{ color: "#6b7280", fontSize: 11.5, lineHeight: 1.45, marginTop: 4 }}>
              Runs short practice snippets in a public sandbox when you click Run. Do not paste secrets, tokens, or private code.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <select
              className="glass-input"
              value={language}
              onChange={changeLanguage}
              style={{ border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, padding: "7px 9px", color: "#9ca3af", fontSize: 11.5, outline: "none" }}
            >
              {SUPPORTED_CODE_LANGUAGES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <button className="glass-button" onClick={() => setShowStdin((value) => !value)} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: "7px 9px", color: "#9ca3af", fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}>
              stdin
            </button>
            <button className="glass-button" onClick={() => { setCode(selectedLanguage.starter); setOutput(null); }} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: "7px 9px", color: "#9ca3af", fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}>
              Reset
            </button>
            <button className="glass-button" onClick={runCode} disabled={loading || !code.trim()} style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: "7px 12px", color: theme.accentText, fontSize: 11.5, fontWeight: 900, cursor: loading || !code.trim() ? "not-allowed" : "pointer", opacity: loading || !code.trim() ? .5 : 1 }}>
              <i className="ti ti-player-play" /> {loading ? "Running..." : "Run"}
            </button>
          </div>
        </div>

        {showStdin && (
          <textarea
            className="glass-input"
            value={stdin}
            onChange={(event) => setStdin(event.target.value)}
            rows={2}
            placeholder="stdin input, optional"
            style={{ width: "100%", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 9, color: "#e8e8f0", fontSize: 12, outline: "none", lineHeight: 1.45, marginBottom: 8 }}
          />
        )}

        <textarea
          ref={editorRef}
          className="glass-input"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          onKeyDown={handleEditorKeyDown}
          spellCheck={false}
          rows={10}
          style={{ width: "100%", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 10, color: "#e8e8f0", fontSize: 12.5, outline: "none", lineHeight: 1.55, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace', resize: "vertical" }}
        />

        {output && (
          <div style={{ marginTop: 10, border: `1px solid ${output.exitCode === 0 ? "rgba(34,197,94,.35)" : "rgba(239,68,68,.35)"}`, borderRadius: 8, padding: 10, background: "rgba(0,0,0,.22)" }}>
            <div style={{ color: output.exitCode === 0 ? "#86efac" : "#fca5a5", fontSize: 11, fontWeight: 900, marginBottom: 6 }}>
              Exit {output.exitCode}
            </div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", color: output.exitCode === 0 ? "#bbf7d0" : "#fecaca", fontSize: 12, lineHeight: 1.55 }}>
              {outputText(output)}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
