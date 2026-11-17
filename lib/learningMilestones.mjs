import { LEARNING_PATHS, learningPathProgress } from './learningHub.mjs';
export function completedPathMilestones(before, after) {
  return LEARNING_PATHS.filter(path=>{
    const previous=learningPathProgress(path,before), next=learningPathProgress(path,after);
    return next.total > 0 && previous.completed < previous.total && next.completed === next.total;
  }).map(path=>path.id);
}
