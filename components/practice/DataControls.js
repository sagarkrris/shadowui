import PracticeMeasurements from "./PracticeMeasurements";
import { useState } from "react";
import {
  exportPracticeBackup,
  previewPracticeBackup,
  restorePracticeBackup,
  summarizePracticeBackup,
} from "../../lib/practiceBackup.mjs";
import { downloadText } from '../../lib/downloadText.mjs';

export default function DataControls({ busy = false, onRestored, showMeasurements = true }) {
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState("");
  const download = () => {
    try {
      downloadText(exportPracticeBackup(localStorage), 'interviewiq-practice-backup.json', 'application/json');
      setStatus("Downloaded a backup containing personal practice data.");
    } catch (e) {
      setStatus(e.message);
    }
  };
  return (
    <details className="practice-panel">
      <summary>Your data · Backup and restore</summary>
      <p>
        Drafts, attempts, evidence, content reports and workspace progress are
        stored on this device. When signed in, the session and supported
        workspace state also sync to your account. Local-only workspace keys are
        included in this backup, but are not all cloud synced. Exports contain
        your answers and profile; keep them private.
      </p>
      <p>
        Recording audio stays in the recording dialog and is released when it
        closes. A submitted transcript is sent for AI review and may be retained
        in the conversation. Remove the corresponding record/message or clear
        the conversation to remove that local transcript.
      </p>
      <button onClick={download}>Download full practice backup</button>
      <label>
        Preview backup to restore
        <input
          type="file"
          accept="application/json,.json"
          disabled={busy}
          onChange={async (e) => {
            setPreview(null);
            try {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 10000000)
                throw new Error("Backup must be under 10 MB.");
              setPreview(previewPracticeBackup(await file.text()));
              setStatus("Preview ready; nothing has changed.");
            } catch (error) {
              setStatus(error.message);
            }
          }}
        />
      </label>
      {preview && (
        <div>
          <p>Backup date: {typeof preview.exportedAt === 'string' && !Number.isNaN(Date.parse(preview.exportedAt)) ? new Date(preview.exportedAt).toLocaleString() : 'Date unavailable'}</p>
          <p>
            Restore will replace these saved workspaces; other keys remain
            unchanged. Download a backup first.
          </p>
          <ul>
            {summarizePracticeBackup(preview).map((item, index) => (
              <li key={index}>
                {item.label}: {item.detail}
              </li>
            ))}
          </ul>
          <button
            disabled={busy}
            onClick={() => {
              try {
                restorePracticeBackup(localStorage, preview);
                sessionStorage.setItem("interviewiq.restoreLocal", "1");
                if (onRestored) { onRestored(); setPreview(null); setStatus('Backup restored on this device.'); }
                else location.reload();
              } catch (error) {
                setStatus(error.message);
              }
            }}
          >
            Restore previewed backup
          </button>
          <button onClick={() => setPreview(null)}>Cancel restore</button>
        </div>
      )}
      {showMeasurements && <PracticeMeasurements />}
      <p role="status">{status}</p>
    </details>
  );
}
