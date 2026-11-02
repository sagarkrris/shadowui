import { NOTEBOOK_KEY, normalizeNotebook } from './learningNotebook.mjs';
import { RESUME_KEY, normalizeResume } from './learningResume.mjs';
import { loadSessionSnapshot } from './sessionPersistence.mjs';
import { ACTIVE_PATH_KEY, HUB_PROGRESS_KEY, LEARNING_PATHS, learningPathProgress } from './learningHub.mjs';
import { BACKEND_ROADMAP_KEY, nextRoadmapActivity } from './javaBackendRoadmap.mjs';

function readStoredJson(storage, key, fallback) {
  try { return JSON.parse(storage.getItem(key) || 'null') ?? fallback; }
  catch { return fallback; }
}

function practiceResume(session) {
  const practice = session?.practice;
  const buddy = practice?.buddy;
  if (buddy && buddy.phase !== 'complete' && (buddy.current || buddy.pending || buddy.askDraft || buddy.draft)) {
    return { href: '/practice?resumeBuddy=1', title: `Resume Tech Buddy: ${buddy.topic || 'saved conversation'}`, section: buddy.pending ? 'Retry your saved request' : 'Continue your saved question and answer' };
  }
  if (!practice || !(practice.active || practice.pending || session.input || session.codeInput)) return null;
  const topic = String(practice.active?.topic || practice.active?.question || practice.pending?.question || '').trim().slice(0, 100);
  return {
    href: '/practice',
    title: topic ? `Resume practice: ${topic}` : 'Resume your unfinished practice',
    section: practice.pending ? 'A submitted request is waiting to be retried' : 'Your saved practice session is on this device',
  };
}

export function roadmapResume(storage) {
  const pathId = storage.getItem(ACTIVE_PATH_KEY);
  if (pathId === 'java-backend') {
    const next = nextRoadmapActivity(readStoredJson(storage, BACKEND_ROADMAP_KEY, []));
    return next ? { href: next.activity.href, title: `Continue Java Backend: ${next.stage.title}`, section: next.activity.label } : null;
  }
  const path = LEARNING_PATHS.find(item => item.id === pathId);
  if (!path) return null;
  const progress = readStoredJson(storage, HUB_PROGRESS_KEY, null);
  const next = learningPathProgress(path, progress).next;
  return next ? { href: next.href.startsWith('#') ? `/learn/roadmaps/${path.id}${next.href}` : next.href, title: `Continue ${path.title}: ${next.stage.title}`, section: next.review ? 'Review this stage' : next.label } : null;
}

export function continueLearningItems(storage) {
  // Each optional source fails independently so a damaged record cannot hide other work.
  const sources = [
    () => practiceResume(loadSessionSnapshot(storage)),
    () => roadmapResume(storage),
    () => normalizeNotebook(readStoredJson(storage, NOTEBOOK_KEY, [])).find(item => !item.completed),
    () => normalizeResume(readStoredJson(storage, RESUME_KEY, [])),
  ];
  const candidates = sources.flatMap(read => { try { return read() || []; } catch { return []; } });
  const seen = new Set();
  return candidates.filter(item => {
    const href = item.href.split('#')[0];
    if (seen.has(href)) return false;
    seen.add(href);
    return true;
  }).slice(0, 3);
}
