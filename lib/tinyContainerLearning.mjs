import { CHAPTERS, containerSource } from './tinyContainer.mjs';
export const LEARNING_KEY = 'interviewiq.tinyContainer.learning.v1';
export const CHECKPOINTS = [
  { question: 'An interface is registered to an existing Repo. What should get(Port.class) return?', options: ['A new Repo every time', 'The exact registered instance', 'The Port interface itself'], correct: 1, explanation: 'Registration stores the supplied object. Returning that same object preserves its identity and state.' },
  { question: 'Service needs Port, but Port has no registration. Can this container infer a concrete implementation?', options: ['Yes, from every class on the classpath', 'Yes, from the interface name', 'No, it needs an explicit binding'], correct: 2, explanation: 'An interface does not specify which implementation to construct. This container has no component scanning or binding inference.' },
  { question: 'When is it safe to place a newly constructed object in the singleton cache?', options: ['After its constructor returns successfully', 'Before resolving its dependencies', 'Even when its constructor throws'], correct: 0, explanation: 'Only completed objects enter the cache. Early publication exposes incomplete state; failed construction must remain retryable.' },
  { question: 'A constructor throws. What must happen to its active-path entry?', options: ['Keep it forever to remember the error', 'Clear the entire singleton cache', 'Remove it in finally'], correct: 2, explanation: 'The active path describes the current traversal, not historical failures. finally removes the entry on both success and failure.' },
];
export function normalizeLearning(value) {
  const safe = {};
  CHAPTERS.forEach((chapter, index) => {
    const item = value?.[chapter.id];
    if (!item || typeof item !== 'object') return;
    const next = {};
    if (typeof item.testedSource === 'string' && item.testedSource.length <= 20000) next.testedSource = item.testedSource;
    if (Number.isInteger(item.choice) && item.choice >= 0 && item.choice < CHECKPOINTS[index].options.length && [50, 75, 95].includes(item.confidence)) {
      next.choice = item.choice; next.confidence = item.confidence;
    }
    safe[chapter.id] = next;
  });
  return safe;
}
export function chapterTestReported(index, drafts, learning) {
  return learning?.[CHAPTERS[index].id]?.testedSource === (drafts[CHAPTERS[index].id] ?? containerSource(index));
}
export function calibrationFeedback(index, choice, confidence) {
  const correct = choice === CHECKPOINTS[index].correct;
  return { correct, revisit: !correct && confidence === 95, text: correct ? 'Your prediction matches this contract.' : confidence === 95 ? 'Worth revisiting: you were very confident about a different outcome.' : 'This is a useful gap to explore before moving on.' };
}
