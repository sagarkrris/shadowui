import { scoreValue } from './dailyPractice.mjs';

export const PRACTICE_DOMAINS = [
  { id: 'concurrency', title: 'Concurrency', pattern: /concurr|thread|lock|volatile|atomic/i, href: '/tech-blogs/java-multithreading-production' },
  { id: 'spring', title: 'Spring and data', pattern: /spring|hibernate|jpa|transaction/i, href: '/senior-java-interview/topics/spring-boot' },
  { id: 'dsa', title: 'DSA', pattern: /\bdsa\b|algorithm|array|binary search|linked list|dynamic programming/i, href: '/practice?workspace=dsaLab' },
  { id: 'design', title: 'System design', pattern: /system design|architect|distributed|microservice|reliability|scalab/i, href: '/learn/roadmaps/system-design' },
  { id: 'java', title: 'Java and JVM', pattern: /java|jvm|collection|hashmap|garbage|classload/i, href: '/java/roadmap' },
];
const average = values => values.length ? Math.round(values.reduce((sum, n) => sum + n, 0) / values.length * 10) / 10 : null;
export function comparableEvidencePair(previous, next) {
  if (!previous || !next || previous.id === next.id || next.parentId !== previous.id || next.assessmentOnly || previous.assessmentOnly || previous.assessmentReview?.exclude || next.assessmentReview?.exclude) return false;
  if (scoreValue(previous.score) === null || scoreValue(next.score) === null) return false;
  if (previous.question !== next.question || previous.difficulty !== next.difficulty || previous.round !== next.round || !previous.rubricVersion || previous.rubricVersion !== next.rubricVersion) return false;
  return ['model', 'promptVersion', 'contentVersion', 'settingsVersion'].every(key => typeof previous.assessmentMeta?.[key] === 'string' && previous.assessmentMeta[key].length > 0 && previous.assessmentMeta[key] === next.assessmentMeta?.[key]);
}
export function practiceEvidence(attempts = []) {
  const records = [...new Map((Array.isArray(attempts) ? attempts : []).filter(a => a && typeof a.id === 'string' && a.id).map(a => [a.id, a])).values()];
  const excluded = records.filter(a => a.assessmentOnly || a.assessmentReview?.exclude);
  const excludedIds = new Set(excluded.map(a=>a.id));
  const submitted = records.filter(a => !excludedIds.has(a.id) && typeof a.answer === 'string' && a.answer.trim());
  const assessed = submitted.filter(a => scoreValue(a.score) !== null && a.confidence !== 'insufficient-evidence');
  const domains = PRACTICE_DOMAINS.map(domain => {
    const matching = assessed.filter(a => PRACTICE_DOMAINS.find(d => d.pattern.test(String(a.topic || '')))?.id === domain.id);
    return { id: domain.id, title: domain.title, href: domain.href, assessed: matching.length, average: average(matching.map(a => scoreValue(a.score))) };
  });
  const byId = new Map(assessed.map(a => [a.id, a]));
  const comparisons = assessed.filter(a => comparableEvidencePair(byId.get(a.parentId), a)).map(a => ({ id: a.id, parentId: a.parentId, topic: String(a.topic || 'Unclassified'), delta: Math.round((scoreValue(a.score) - scoreValue(byId.get(a.parentId).score)) * 10) / 10 }));
  const versioned = assessed.filter(a => ['model', 'promptVersion', 'contentVersion', 'settingsVersion'].every(k => typeof a.assessmentMeta?.[k] === 'string' && a.assessmentMeta[k]));
  return { submitted: submitted.length, assessed: assessed.length, excluded: excluded.length, unassessed: submitted.length - assessed.length, versioned: versioned.length, unversioned: assessed.length - versioned.length, domains, covered: domains.filter(d => d.assessed > 0).length, average: average(assessed.map(a => scoreValue(a.score))), comparisons, improved: comparisons.filter(c => c.delta > 0).length,
    label: assessed.length ? 'Recorded practice evidence' : 'No assessed answer evidence yet',
    limitation: 'These are editable, device-held assessment records. AI scores and descriptive averages are not independently verified and do not predict interview or hiring outcomes.' };
}

export function sharedChecklist(query = {}) {
  const raw = typeof query.score === 'string' ? query.score : '';
  const score = /^(?:0|[1-9]\d?|100)(?:\.\d{1,2})?$/.test(raw) && Number(raw) <= 100 ? Number(raw) : null;
  return { score, label: typeof query.label === 'string' ? query.label.slice(0,80) : 'Preparation checklist', stack: typeof query.stack === 'string' ? query.stack.slice(0,80) : 'Software engineering', verified: false };
}
