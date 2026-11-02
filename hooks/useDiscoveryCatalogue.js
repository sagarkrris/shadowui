import { useEffect, useState } from 'react';
import { DISCOVERY_SHORTCUTS } from '../lib/publicNavigation.mjs';
import { savedLearningRecords } from '../lib/savedLearningRecords.mjs';

// Only public metadata is requested. Saved work is read and searched on this device.
export default function useDiscoveryCatalogue() {
  const [records, setRecords] = useState(DISCOVERY_SHORTCUTS);
  const [saved, setSaved] = useState([]);
  const [load, setLoad] = useState('loading');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const read = () => { try { setSaved(savedLearningRecords(localStorage)); } catch { setSaved([]); } };
    read();
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoad('loading');
    fetch('/api/discovery', { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Catalogue unavailable');
      return response.json();
    }).then(data => {
      if (!Array.isArray(data.items)) throw new Error('Invalid catalogue');
      setRecords(data.items); setLoad('ready');
    }).catch(() => { if (!controller.signal.aborted) setLoad('error'); });
    return () => controller.abort();
  }, [retry]);
  return { records, saved, load, retry: () => setRetry(value => value + 1) };
}
