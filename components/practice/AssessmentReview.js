import { useState } from 'react';
export default function AssessmentReview({ attempt, onChange, onReassess, busy }) {
  const [reason, setReason] = useState(attempt.assessmentReview?.reason || '');
  const [reference, setReference] = useState(attempt.assessmentReview?.reference || '');
  if (!onChange) return null;
  return <details><summary>Review this assessment</summary><p>Your original answer and assessment stay in history. Excluded assessments do not contribute to practice scores and recommendations.</p>
    <label>Why do you question this assessment?<textarea rows={3} maxLength={3000} value={reason} onChange={event => setReason(event.target.value)} /></label>
    <label>Reference or verification notes<textarea rows={2} maxLength={3000} value={reference} onChange={event => setReference(event.target.value)} /></label>
    <button type="button" disabled={busy || !reason.trim()} onClick={() => onChange(attempt.id, { reason, reference, exclude: true, status: 'disputed' })}>Save dispute and exclude score</button>
    <button type="button" disabled={busy} onClick={() => onChange(attempt.id, { reason, reference, exclude: false, status: 'checked' })}>Keep assessment after checking</button>
    {onReassess && <button type="button" disabled={busy || !reason.trim()} onClick={() => { onChange(attempt.id, { reason, reference, exclude: true, status: 'disputed' }); onReassess(attempt); }}>Request a separate reassessment</button>}
    <p role="status">{attempt.assessmentReview?.exclude ? 'Assessment excluded while disputed.' : attempt.assessmentReview?.status === 'checked' ? 'Assessment retained after your check.' : 'No dispute recorded.'}</p>
  </details>;
}
