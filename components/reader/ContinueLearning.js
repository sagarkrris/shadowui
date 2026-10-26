import Link from 'next/link';
import { useEffect, useState } from 'react';
import { NOTEBOOK_KEY, normalizeNotebook } from '../../lib/learningNotebook.mjs';
import { RESUME_KEY, normalizeResume } from '../../lib/learningResume.mjs';
import { loadSessionSnapshot } from '../../lib/sessionPersistence.mjs';
import { ACTIVE_PATH_KEY, HUB_PROGRESS_KEY, LEARNING_PATHS, learningPathProgress } from '../../lib/learningHub.mjs';
import { BACKEND_ROADMAP_KEY, nextRoadmapActivity } from '../../lib/javaBackendRoadmap.mjs';
import styles from '../../styles/Reader.module.css';

function readStoredJson(storage, key, fallback) {
  try { return JSON.parse(storage.getItem(key) || 'null') ?? fallback; }
  catch { return fallback; }
}

function practiceResume(session) {
  const practice = session?.practice;
  if (!practice || !(practice.active || practice.pending || session.input || session.codeInput)) return null;
  const topic = String(practice.active?.topic || practice.active?.question || practice.pending?.question || '').trim().slice(0, 100);
  return {
    href: '/practice',
    title: topic ? `Resume practice: ${topic}` : 'Resume your unfinished practice',
    section: practice.pending ? 'A submitted request is waiting to be retried' : 'Your saved practice session is on this device',
  };
}

function roadmapResume(storage) {
  const pathId = storage.getItem(ACTIVE_PATH_KEY);
  if (pathId === 'java-backend') {
    const next = nextRoadmapActivity(readStoredJson(storage, BACKEND_ROADMAP_KEY, []));
    return next ? { href: next.activity.href, title: `Continue Java Backend: ${next.stage.title}`, section: next.activity.label } : null;
  }
  const path = LEARNING_PATHS.find(item => item.id === pathId);
  if (!path) return null;
  const progress = readStoredJson(storage, HUB_PROGRESS_KEY, null);
  const next = learningPathProgress(path, progress).next;
  return next ? { href: next.activity.href, title: `Continue ${path.title}: ${next.stage.title}`, section: next.activity.label } : null;
}

export default function ContinueLearning() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    try {
      const storage = window.localStorage;
      const session = loadSessionSnapshot(storage);
      const notebook = normalizeNotebook(readStoredJson(storage, NOTEBOOK_KEY, []));
      const recent = normalizeResume(readStoredJson(storage, RESUME_KEY, []));
      const candidates = [
        practiceResume(session),
        roadmapResume(storage),
        notebook.find(item => !item.completed) || null,
        ...recent,
      ].filter(Boolean);
      const seen = new Set();
      setItems(candidates.filter(item => {
        const baseHref = item.href.split('#')[0];
        if (seen.has(baseHref)) return false;
        seen.add(baseHref);
        return true;
      }).slice(0, 3));
    } catch {
      setItems([]);
    }
  }, []);

  return <section className={styles.card}><h2>Continue where you left off</h2>{items.length ? <ul>{items.map(item => <li key={item.href}><Link prefetch={false} href={item.href}>{item.title} →</Link>{item.section && <p className={styles.small}>Resume: {item.section}</p>}</li>)}</ul> : <p>Start reading, investigate a case, or save a project draft. Return here to continue.</p>}<div className={styles.actions}><Link prefetch={false} href="/notebook">My learning notebook</Link><Link prefetch={false} href="/practice">Open practice workspace</Link></div><p className={styles.small}>Reading, roadmap, notebook, and practice shortcuts are read from this browser. No account required.</p></section>;
}
