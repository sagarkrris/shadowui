import { useEffect, useRef, useState } from 'react';
import { HUB_PROGRESS_KEY, normalizeHubProgress } from '../../lib/learningHub.mjs';
export default function useHubProgress() {
  const unsaved = useRef(false);
  const [progress, setProgress] = useState(normalizeHubProgress(null));
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const load = () => { try { setProgress(normalizeHubProgress(JSON.parse(localStorage.getItem(HUB_PROGRESS_KEY) || 'null'))); } catch { setMessage('Saved learning progress is unavailable. You can still practise.'); } setReady(true); };
    load(); window.addEventListener('storage', load); window.addEventListener('learning-hub-change', load);
    return () => { window.removeEventListener('storage', load); window.removeEventListener('learning-hub-change', load); };
  }, []);
  function update(transform) {
    let latest = progress;
    try { if (!unsaved.current) latest = normalizeHubProgress(JSON.parse(localStorage.getItem(HUB_PROGRESS_KEY) || 'null')); } catch { /* Keep this visit usable. */ }
    const next = normalizeHubProgress(transform(latest));
    setProgress(next);
    try { localStorage.setItem(HUB_PROGRESS_KEY, JSON.stringify(next)); unsaved.current = false; setMessage('Saved in this browser.'); window.dispatchEvent(new Event('learning-hub-change')); }
    catch { unsaved.current = true; setMessage('Could not save. Copy your notes before leaving; changes last only for this visit.'); }
  }
  function toggle(field, id) { update(current => ({ ...current, [field]: current[field].includes(id) ? current[field].filter(x => x !== id) : [...current[field], id] })); }
  return { progress, ready, message, update, toggle };
}
