import { safeLearningHref } from './learningNotebook.mjs';
export function lessonPracticeContext(query = {}) {
  if (query.buddy !== '1' || typeof query.buddyTopic !== 'string' || !query.buddyTopic.trim()) return null;
  return {
    topic: query.buddyTopic.trim().slice(0, 180),
    href: safeLearningHref(query.lessonHref),
    title: typeof query.lessonTitle === 'string' ? query.lessonTitle.trim().slice(0, 200) : '',
  };
}
// These are disclosed practice defaults, not claims about the learner's identity or experience.
export const LESSON_PRACTICE_PROFILE = Object.freeze({ name: 'Learner', position: 'Software engineer', experience: 'Not specified', stack: 'General software engineering' });
