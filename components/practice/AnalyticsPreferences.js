import { useEffect, useState } from 'react';
import { ANALYTICS_CONSENT_KEY, PRODUCT_EVENTS_KEY, analyticsConsent } from '../../lib/analytics.mjs';

export default function AnalyticsPreferences() {
  const [consent, setConsent] = useState(null);
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { const refresh = () => { try { setConsent(analyticsConsent(localStorage)); setStorageAvailable(true); } catch { setConsent(null); setStorageAvailable(false); setMessage('Browser storage is unavailable. Optional measurements remain off.'); } finally { setReady(true); } }; refresh(); window.addEventListener('storage', refresh); window.addEventListener('interviewiq:analytics-consent', refresh); return () => { window.removeEventListener('storage', refresh); window.removeEventListener('interviewiq:analytics-consent', refresh); }; }, []);
  function change(enabled) {
    try {
      const latest = analyticsConsent(localStorage);
      const next = { version: 1, enabled, visitorId: latest?.visitorId || crypto.randomUUID() };
      localStorage.setItem(ANALYTICS_CONSENT_KEY, JSON.stringify(enabled ? next : {version:1,visitorId:next.visitorId}));
      setConsent(next); window.dispatchEvent(new Event('interviewiq:analytics-consent'));
      setMessage(enabled ? 'Optional measurements enabled for this browser. Collection also requires the operator’s configured service.' : 'Optional measurements stopped for this browser. Previously stored rows are not deleted by this switch.');
    } catch { setMessage('This preference could not be saved. Optional measurements remain off when consent cannot be read.'); }
  }
  async function removeRemote() {
    if (busy) return;
    setBusy(true); setMessage('Requesting deletion…');
    try {
      const target = analyticsConsent(localStorage);
      if (!target?.visitorId) throw new Error('No current browser measurement identifier is available.');
      localStorage.setItem(ANALYTICS_CONSENT_KEY,JSON.stringify({version:1,visitorId:target.visitorId}));
      window.dispatchEvent(new Event('interviewiq:analytics-consent'));
      const response = await fetch('/api/analytics', {method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitorId:target.visitorId})});
      const payload = await response.json();
      if (!response.ok || payload.deleted !== true) throw new Error(payload.error || 'Deletion was not confirmed.');
      const current = analyticsConsent(localStorage);
      if (current?.visitorId !== target.visitorId) { setConsent(current); setMessage('Deletion confirmed for the previous identifier. Newer browser preferences were preserved; delete again to remove the current identifier’s rows.'); return; }
      localStorage.removeItem(PRODUCT_EVENTS_KEY);
      // Keep the previous identifier until deletion is confirmed. A new identifier
      // prevents a later opt-in from reviving the deleted browser cohort.
      const next = { version:1, enabled:false, visitorId:crypto.randomUUID() };
      localStorage.setItem(ANALYTICS_CONSENT_KEY,JSON.stringify(next)); setConsent(next); window.dispatchEvent(new Event('interviewiq:analytics-consent'));
      setMessage('Server deletion confirmed for this browser’s measurement identifier. Local measurements cleared; optional collection is off.');
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <section aria-label="Optional measurement preferences"><h3>Optional measurement preferences</h3><p>Off by default. Opting in permits a pseudonymous browser identifier, predefined usage events and bounded values. Your answers, profile and query strings are not product measurements.</p><p>Delete collected measurements before clearing browser storage if you want server deletion. Clearing the identifier removes this browser’s ability to request that deletion; the server does not link it to your account.</p><label><input type="checkbox" checked={Boolean(consent?.enabled)} disabled={!ready || !storageAvailable || busy} onChange={e=>change(e.target.checked)} /> Allow optional product measurements on this browser</label><div><button type="button" disabled={!ready || !storageAvailable || busy} onClick={()=>{try {localStorage.removeItem(PRODUCT_EVENTS_KEY);setMessage('Measurements cleared on this device. Server copies were not deleted.');} catch {setMessage('Local measurements could not be cleared.');}}}>Clear measurements on this device</button><button type="button" disabled={!ready || !storageAvailable || busy || !consent?.visitorId} onClick={removeRemote}>Delete collected browser measurements</button></div><p role="status">{message}</p></section>;
}
