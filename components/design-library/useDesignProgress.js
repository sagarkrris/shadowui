import { useEffect, useState } from 'react';
import { DESIGN_PROGRESS_KEY, parseDesignProgress } from '../../lib/designLibrary.mjs';

export default function useDesignProgress() {
  const [progress, setProgress] = useState({});
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    function load() {
      try { setProgress(parseDesignProgress(localStorage.getItem(DESIGN_PROGRESS_KEY))); }
      catch { setStorageError(true); }
      setReady(true);
    }
    load();
    function changed(event) { if (event.key === DESIGN_PROGRESS_KEY || event.key === null) load(); }
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);
  function update(key, patch) {
    let current = progress;
    try { if (!storageError) current = parseDesignProgress(localStorage.getItem(DESIGN_PROGRESS_KEY)); }
    catch { /* Keep this session usable when browser storage is unavailable. */ }
    const next = { ...current, [key]: { ...current[key], ...patch } };
    setProgress(next);
    try { localStorage.setItem(DESIGN_PROGRESS_KEY, JSON.stringify(next)); setStorageError(false); }
    catch { setStorageError(true); }
  }
  return { progress, update, ready, storageError };
}
