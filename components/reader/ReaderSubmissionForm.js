import { useEffect, useState } from "react";
export default function ReaderSubmissionForm({ kind = "request", initialPath = "" }) {
  const [available, setAvailable] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [path, setPath] = useState(initialPath);
  const [message, setMessage] = useState("Checking submission availability…");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setPath(initialPath); }, [initialPath]);
  useEffect(() => { let active = true; fetch("/api/reader-community").then(r => r.json()).then(data => { if (active) { setAvailable(data.available === true); setMessage(data.available ? "Reviewed before publication. Do not include private data." : data.error || "Submissions are currently unavailable."); } }).catch(() => { if (active) setMessage("Submissions are currently unavailable. Please try later."); }); return () => { active = false; }; }, []);
  async function submit(event) {
    event.preventDefault(); setBusy(true);
    try {
      const response = await fetch("/api/reader-community", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, title, details, path }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Submission failed.");
      setMessage(`${result.message} Reference: ${result.receipt}`); setTitle(""); setDetails("");
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  return <form onSubmit={submit}><h2>{kind === "correction" ? "Report a mistake" : "Suggest a confusing topic"}</h2>{kind === "correction" && <label>Affected page path<input required maxLength={300} value={path} onChange={e => setPath(e.target.value)} placeholder="/java/hashmap-internals" /></label>}<label>Short title<input required minLength={8} maxLength={160} value={title} onChange={e => setTitle(e.target.value)} /></label><label>{kind === "correction" ? "What seems wrong, and what evidence should we check?" : "What is confusing? What would a useful explanation help you do?"}<textarea required minLength={20} maxLength={2000} rows={5} value={details} onChange={e => setDetails(e.target.value)} /></label><p role="status">{message}</p><button disabled={!available || busy}>{busy ? "Submitting…" : "Submit for review"}</button></form>;
}
