// Explicit editions stay stable when a later challenge is published.
export const WEEKLY_CHALLENGES = [{
  slug: '2026-09-18-transaction-boundaries', date: '2026-09-18',
  title: 'The rollback that never happened',
  description: 'A transfer failed, yet one balance changed. Which boundary would you inspect first?',
  challenge: '/detective/the-rollback-that-never-happened',
  journey: '/learn/spring-transactions',
  takeaway: 'Trace the real call path before treating an annotation as evidence of a transaction.',
}];
