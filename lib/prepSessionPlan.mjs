export const PREP_SESSION_STEPS = {
  5: ['Recall one question', 'Review the explanation'],
  15: ['Study one gap', 'Complete a small exercise', 'Retest the question'],
  30: ['Practise a topic', 'Complete a small exercise', 'Record remaining gaps'],
};
export function normalizePrepSessionPlan(value) {
  const minutes = [5, 15, 30].includes(value?.minutes) ? value.minutes : 15;
  return { minutes, ...(Array.isArray(value?.baselineAttemptIds) ? { baselineAttemptIds: value.baselineAttemptIds.filter(id => typeof id === 'string') } : {}), completed: [...new Set(Array.isArray(value?.completed) ? value.completed.filter(i => Number.isInteger(i) && i >= 0 && i < PREP_SESSION_STEPS[minutes].length) : [])], reflection: typeof value?.reflection === 'string' ? value.reflection.slice(0, 4000) : '', finished: value?.finished === true };
}
export function canFinishPrepSession(value) {
  const plan = normalizePrepSessionPlan(value);
  return plan.completed.length === PREP_SESSION_STEPS[plan.minutes].length && (plan.minutes !== 30 || Boolean(plan.reflection.trim()));
}

export function archivePrepSession(plan, attempts = [], now = new Date()) {
  const value = normalizePrepSessionPlan(plan);
  return { ...value, id: `prep-${now.getTime()}-${crypto.randomUUID()}`, completedAt: now.toISOString(), attemptIds: Array.isArray(value.baselineAttemptIds) ? attempts.map(item => item.id).filter(id => typeof id === 'string' && !value.baselineAttemptIds.includes(id)) : [] };
}
export function normalizePrepSessionHistory(value) {
  return Array.isArray(value) ? value.filter(item => item && typeof item.id === 'string').map(item => ({ ...normalizePrepSessionPlan(item), id: item.id, completedAt: typeof item.completedAt === 'string' ? item.completedAt : '', attemptIds: Array.isArray(item.attemptIds) ? item.attemptIds.filter(id => typeof id === 'string') : [] })) : [];
}
