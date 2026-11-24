import { downloadText } from '../../lib/downloadText.mjs';
import { cloudRecoveryBackup } from '../../lib/practiceBackup.mjs';

const count = items => Array.isArray(items) ? items.length : 0;

function countLearning(snapshot, key, field) {
  try {
    const value = JSON.parse(snapshot.learningState?.[`interviewiq.${key}.v1`] ?? 'null');
    return count(field ? value?.[field] : value);
  } catch {
    return 'Unavailable';
  }
}

function DraftPreview({ label, value }) {
  if (typeof value !== 'string' || !value.trim()) return <><dt>{label}</dt><dd>None</dd></>;
  const draft = value.trim();
  return <><dt>{label}</dt><dd className="cloud-draft-preview">{draft.slice(0, 120)}{draft.length > 120 ? '…' : ''}</dd></>;
}

function CopySummary({ label, snapshot, consequence, children }) {
  const session = snapshot?.session ?? snapshot ?? {};
  const practice = session.practice;
  return (
    <section className="cloud-copy" aria-label={label}>
      <h3>{label}</h3>
      {snapshot ? <dl>
        <DraftPreview label="Answer draft" value={session.input} />
        <DraftPreview label="Code draft" value={session.codeInput} />
        <dt>Open question</dt><dd>{practice?.active?.topic || (practice?.active?.question ? 'Present' : 'None')}</dd>
        <dt>Unfinished request</dt><dd>{practice?.pending ? 'Present' : 'None'}</dd>
        <dt>Conversation messages</dt><dd>{count(session.messages)}</dd>
        <dt>Practice attempts</dt><dd>{count(practice?.attempts)}</dd>
        <dt>Saved prep sessions</dt><dd>{count(practice?.planHistory)}</dd>
        <dt>Saved designs</dt><dd>{count(practice?.designs)}</dd>
        <dt>Evidence records</dt><dd>{count(practice?.evidence)}</dd>
        <dt>Applications</dt><dd>{count(snapshot.applications)}</dd>
        <dt>Notebook notes</dt><dd>{countLearning(snapshot, 'learningNotebook')}</dd>
        <dt>Archived notes</dt><dd>{countLearning(snapshot, 'learningNotebookArchive')}</dd>
        <dt>Bookmarks</dt><dd>{countLearning(snapshot, 'readerBookmarks')}</dd>
        <dt>Reading positions</dt><dd>{countLearning(snapshot, 'learningResume')}</dd>
        <dt>Completed learning activities</dt><dd>{countLearning(snapshot, 'learningHub', 'completed')}</dd>
      </dl> : <p>No cloud save for this account.</p>}
      <p>{consequence}</p>
      {children}
    </section>
  );
}

function downloadCopy(snapshot, source) {
  if (snapshot) downloadText(cloudRecoveryBackup(snapshot), `interviewiq-${source}-recovery.json`, 'application/json');
}

export default function CloudCopyReview({ device, conflict, onChoose }) {
  const cloud = conflict.state;
  const importing = conflict.accountChanged || conflict.unownedDeviceWork;
  return (
    <section className="practice-sync-conflict" aria-label="Cloud save conflict">
      <details>
        <summary>Cloud saving paused · Review copies</summary>
        <h2>{importing ? 'Choose data for this signed-in account' : 'Work changed on another device'}</h2>
        {conflict.accountChanged && <p>This browser holds work from another account.</p>}
        {conflict.unownedDeviceWork && <p>The device copy has no account-owner record. It may be guest work or work from an older account.</p>}
        <p>Compare the copies below. Choosing a copy replaces the other copy’s synced work. Work is never merged.</p>
        <button type="button" onClick={() => { downloadCopy(device, 'device'); downloadCopy(cloud, 'cloud'); }}>
          {cloud ? 'Download both copies' : 'Download device copy'}
        </button>
        <div className="cloud-copy-grid">
          <CopySummary label="Device copy" snapshot={device} consequence={importing ? 'Import this browser’s work into the signed-in account and replace its cloud copy.' : 'Keep this browser’s work and replace the cloud copy.'}>
            <button type="button" onClick={() => { downloadCopy(cloud, 'cloud'); onChoose('device'); }}>Keep this device copy</button>
          </CopySummary>
          <CopySummary label="Cloud copy" snapshot={cloud} consequence={importing ? 'Use the signed-in account’s cloud data and clear the previous local workspaces.' : 'Replace this browser’s synced work with the cloud copy.'}>
            <button type="button" onClick={() => { downloadCopy(device, 'device'); onChoose('cloud'); }}>Use cloud copy</button>
          </CopySummary>
        </div>
      </details>
    </section>
  );
}
