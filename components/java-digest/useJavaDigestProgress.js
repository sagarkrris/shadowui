import { useEffect, useMemo, useState } from "react";

export const JAVA_REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30];

export function getJavaReviewIntervalDays(stage = 0) {
  const index = Math.max(0, Math.min(Number(stage) || 0, JAVA_REVIEW_INTERVALS_DAYS.length - 1));
  return JAVA_REVIEW_INTERVALS_DAYS[index];
}

export default function useJavaDigestProgress(progress = {}, onProgressChange) {
  const [reviewClock, setReviewClock] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setReviewClock(Date.now()), 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const learningProgress = useMemo(() => ({
    completedIds: new Set([
      ...(Array.isArray(progress.completedTutorials) ? progress.completedTutorials : []),
      ...(Array.isArray(progress.completedPrograms) ? progress.completedPrograms : []),
      ...(Array.isArray(progress.completedQuizzes) ? progress.completedQuizzes : []),
    ]),
    bookmarkedIds: new Set([
      ...(Array.isArray(progress.bookmarkedTutorials) ? progress.bookmarkedTutorials : []),
      ...(Array.isArray(progress.bookmarkedPrograms) ? progress.bookmarkedPrograms : []),
      ...(Array.isArray(progress.bookmarkedQuizzes) ? progress.bookmarkedQuizzes : []),
    ]),
  }), [progress.completedTutorials, progress.completedPrograms, progress.completedQuizzes, progress.bookmarkedTutorials, progress.bookmarkedPrograms, progress.bookmarkedQuizzes]);

  const dueReviewIds = useMemo(() => Object.entries(progress.reviewedAt || {}).filter(([id, timestamp]) => {
    const stage = progress.reviewStages?.[id] || 0;
    return reviewClock - Number(timestamp) >= getJavaReviewIntervalDays(stage) * 24 * 60 * 60 * 1000;
  }).map(([id]) => id), [progress.reviewedAt, progress.reviewStages, reviewClock]);
  const dueReviewCount = dueReviewIds.length;

  const toggleLearningStatus = (field, id) => {
    onProgressChange?.((previous = {}) => {
      const values = new Set(Array.isArray(previous[field]) ? previous[field] : []);
      const next = { ...previous, [field]: Array.from(values) };
      if (field === "completedTutorials") {
        const reviewStages = { ...(previous.reviewStages || {}) };
        const reviewedAt = { ...(previous.reviewedAt || {}) };
        const nextStage = values.has(id) ? Math.min((reviewStages[id] || 0) + 1, JAVA_REVIEW_INTERVALS_DAYS.length - 1) : 0;
        values.add(id);
        reviewStages[id] = nextStage;
        reviewedAt[id] = Date.now();
        next.reviewStages = reviewStages;
        next.reviewedAt = reviewedAt;
      } else if (values.has(id)) {
        values.delete(id);
      } else {
        values.add(id);
      }
      next[field] = Array.from(values);
      return next;
    });
  };

  return { learningProgress, dueReviewCount, dueReviewIds, toggleLearningStatus };
}
