const prompts = {
  'the-vanishing-map-entry': 'Why can a HashMap contain an entry that get() no longer finds, and how would you prove the cause?',
  'the-rollback-that-never-happened': 'Why was @Transactional present but the transaction did not activate? Explain the evidence and repair.',
  'the-service-that-drowned-in-retries': 'How can retries turn a brief slowdown into an outage? Explain a bounded recovery policy.',
  'the-cost-of-a-faster-query': 'When would you keep an index that accelerates reads but makes writes slower? Which measurements decide?',
  'the-report-from-another-tenant': 'How can authorization succeed while a cache returns another tenant’s data? Explain the boundary you would repair.',
};
export function interviewPrompt(slug) { return prompts[slug] || 'Explain the failure mechanism, supporting evidence, and repair trade-off to an interviewer.'; }
export const INTERVIEW_CHECKS = ['I named the failure mechanism.', 'I cited concrete evidence and ruled out an alternative.', 'I explained a repair and its trade-off.', 'I stated what would change my conclusion.'];
