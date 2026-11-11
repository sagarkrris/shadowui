import Link from 'next/link';
import { useRef, useState } from 'react';
import { downloadText } from '../../lib/downloadText.mjs';

export default function CommunityPrototype({ title }) {
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState('');
  const dialog = useRef(null);
  return <section aria-label="Community preview" style={{ padding: 16, borderTop: '1px solid #cbd5e1' }}><h2>Share what you learned</h2><p>Local prototype: exports are self-reported practice records, not verified certificates or public posts.</p><button type="button" onClick={() => downloadText(`InterviewIQ practice record\nTopic: ${title}\nStatus: self-reported completion\nThis is not an assessed credential.\n`, 'interviewiq-practice-record.txt')}>Download practice record</button><details><summary>Debate a design trade-off — draft locally</summary><label>Your alternative and the evidence that would change your mind<textarea rows={4} maxLength={3000} value={draft} onChange={event => setDraft(event.target.value)} /></label><p>Draft stays in this tab until exported. Public discussions are not enabled.</p><button type="button" disabled={!draft.trim()} onClick={() => downloadText(`${title}\n\n${draft}`, 'interviewiq-discussion-draft.txt')}>Export discussion draft</button></details><button type="button" onClick={() => dialog.current.showModal()}>Get the engineering digest</button><dialog ref={dialog} aria-labelledby="digest-preview-title"><h2 id="digest-preview-title">One system design breakdown per week — when delivery is ready</h2><p>Read the preview and check signup availability before entering an email address.</p><Link href="/digest">Preview the digest and check availability →</Link><button type="button" onClick={() => { dialog.current.close(); setMessage('Digest preview closed.'); }}>Close</button></dialog><p role="status">{message}</p></section>;
}
