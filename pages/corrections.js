import Link from "next/link";
import { useRouter } from "next/router";
import ReaderLayout from "../components/reader/ReaderLayout";
import ReaderSubmissionForm from "../components/reader/ReaderSubmissionForm";
import { PUBLIC_CORRECTIONS } from "../lib/readerEditorial.mjs";
import styles from "../styles/Reader.module.css";
export default function Corrections() {
  const router = useRouter(); const path = typeof router.query.article === "string" ? router.query.article : "";
  return <ReaderLayout title="Public corrections" description="Reported issues, acknowledged mistakes, fixes, and validation limits."><h1>Good explanations can be corrected.</h1><p className={styles.lead}>This log records real issues and what changed. Unreviewed submissions stay private until an editor checks them.</p>{PUBLIC_CORRECTIONS.map(entry => <article key={entry.id} id={entry.id} className={styles.card}><p className={styles.eyebrow}>{entry.date} · {entry.status}</p><h2>{entry.title}</h2><p><strong>Reported:</strong> {entry.report}</p><p><strong>Correction:</strong> {entry.resolution}</p><p><strong>Verification:</strong> {entry.verification}</p><Link href={entry.affected}>Affected page →</Link></article>)}<ReaderSubmissionForm kind="correction" initialPath={path} /></ReaderLayout>;
}
