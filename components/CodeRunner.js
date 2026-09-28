import { useState } from "react";
import { CODE_RUNNER_FEATURE_STATE, JAVA_LANGUAGE, JAVA_VERSIONS } from "../lib/codeRunner.mjs";

export default function CodeRunner({ theme }) {
  const [code, setCode] = useState(JAVA_LANGUAGE.starter);
  const [stdin, setStdin] = useState("");
  const [javaVersion, setJavaVersion] = useState(21);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState("Choose a Java version, then run your program.");
  async function runCode() {
    setRunning(true); setResult("Compiling and running in an isolated container…");
    try {
      const response = await fetch("/api/run-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language: "java", javaVersion, code, stdin }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Code execution failed.");
      const output = [payload.stdout, payload.stderr].filter(Boolean).join("") || "Program finished with no output.";
      setResult(`${output}${output.endsWith("\n") ? "" : "\n"}[exit ${payload.exitCode}]${payload.timedOut ? " timed out" : ""}`);
    } catch (error) { setResult(`Error: ${error.message}`); } finally { setRunning(false); }
  }
  const inputStyle = { width: "100%", resize: "vertical", border: `1px solid ${theme.accentBorder}`, borderRadius: 8, background: "rgba(2,6,23,0.55)", color: "#e5e7eb", padding: 10, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 12, lineHeight: 1.55, outline: "none" };
  return <section style={{ width: "100%", maxWidth: 980, display: "grid", gap: 12, marginTop: 22, textAlign: "left" }}><div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}><div><div style={{ color: theme.accentText, fontSize: 12, fontWeight: 900 }}><i className="ti ti-terminal-2" /> Java Code Runner</div><p style={{ color: "#9ca3af", fontSize: 12 }}>{CODE_RUNNER_FEATURE_STATE.summary}</p></div><label style={{ color: theme.accentText, fontSize: 11, fontWeight: 800 }}>JDK <select aria-label="Java version" value={javaVersion} onChange={(event) => setJavaVersion(Number(event.target.value))}>{JAVA_VERSIONS.map((version) => <option key={version} value={version}>Java {version}</option>)}</select></label></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 10 }}><label style={{ display: "grid", gap: 6 }}><span style={{ color: "#8b949e", fontSize: 11, fontWeight: 850 }}>Main.java</span><textarea value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} rows={12} style={{ ...inputStyle, minHeight: 220 }} /></label><div style={{ display: "grid", gap: 10 }}><label style={{ display: "grid", gap: 6 }}><span style={{ color: "#8b949e", fontSize: 11, fontWeight: 850 }}>stdin</span><textarea value={stdin} onChange={(event) => setStdin(event.target.value)} rows={5} style={{ ...inputStyle, minHeight: 90 }} /></label><button className="glass-button" type="button" onClick={runCode} disabled={running} style={{ minHeight: 36, border: `1px solid ${theme.accentBorder}`, borderRadius: 8, color: theme.accentText, background: theme.accentMuted, fontSize: 12, fontWeight: 900, cursor: running ? "wait" : "pointer" }}><i className="ti ti-player-play" /> {running ? "Running…" : "Run Java"}</button><pre aria-live="polite" style={{ minHeight: 132, maxHeight: 260, overflow: "auto", whiteSpace: "pre-wrap", border: `1px solid ${theme.accentBorder}`, borderRadius: 8, background: "rgba(2,6,23,0.48)", color: "#d1d5db", padding: 10, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 11.5, lineHeight: 1.55 }}>{result}</pre></div></div></div></section>;
}
