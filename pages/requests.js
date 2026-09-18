import { useEffect, useState } from "react";
import ReaderLayout from "../components/reader/ReaderLayout";
import ReaderSubmissionForm from "../components/reader/ReaderSubmissionForm";
import { EDITORIAL_REQUESTS } from "../lib/readerCommunity.mjs";
import styles from "../styles/Reader.module.css";
export default function Requests() {
  const [items, setItems] = useState(EDITORIAL_REQUESTS);
  const [available, setAvailable] = useState(false);
  const [message, setMessage] = useState("Loading the shared board…");
  const [busy, setBusy] = useState("");
  useEffect(() => { let active = true; fetch("/api/reader-community").then(r => r.json()).then(data => { if (active) { if (Array.isArray(data.items)) setItems(data.items); setAvailable(data.available === true); setMessage(data.available ? "One vote per topic per browser. Clearing browser cookies can reset that limit." : data.error || "The shared board is temporarily unavailable."); } }).catch(() => { if (active) setMessage("The shared board is temporarily unavailable."); }); return () => { active = false; }; }, []);
  async function vote(id) {
    setBusy(id);
    try { const response = await fetch("/api/reader-community", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "vote", id }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Vote failed."); setItems(data.items); setMessage("Vote recorded on the shared board."); } catch (error) { setMessage(error.message); } finally { setBusy(""); }
  }
  return <ReaderLayout title="Reader request board" description="Suggest confusing topics and help choose the next engineering investigation."><h1>What should we explain next?</h1><p className={styles.lead}>Vote for a useful investigation or suggest the question you keep getting stuck on. Votes inform editorial choices; they do not promise a publication date.</p><p role="status">{message}</p><div className={styles.grid}>{items.map(item => <article className={styles.card} key={item.id}><p className={styles.eyebrow}>{item.origin}</p><h2>{item.title}</h2><p>{item.details}</p><p>{available ? `${item.votes} votes` : "Live vote count unavailable"}</p><button disabled={!available || Boolean(busy) || item.voted} onClick={() => vote(item.id)}>{busy === item.id ? "Recording…" : item.voted ? "Voted ✓" : "Vote for this topic"}</button></article>)}</div><ReaderSubmissionForm /></ReaderLayout>;
}
