export const PRACTICE_RUBRIC = Object.freeze([
  { key: 'correctness', label: 'Technical correctness', description: 'Accurate claims and a solution that satisfies the question, including boundary cases.' },
  { key: 'depth', label: 'Technical depth', description: 'Explains why the mechanism works and its limitations.' },
  { key: 'examples', label: 'Examples', description: 'Concrete examples or traces supporting the explanation.' },
  { key: 'tradeOffs', label: 'Trade-offs', description: 'Compares alternatives and justifies the chosen approach.' },
  { key: 'communication', label: 'Communication', description: 'Clear, ordered explanation with explicit assumptions.' },
]);
export const FEEDBACK_DEPTHS = ['Quick review', 'Detailed explanation', 'Strict interview'];
export const scoreValue = value => {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return null;
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 10 ? number : null;
};
const text = (value) => typeof value === 'string' ? value : '';
const objects = value => Array.isArray(value) ? value.filter(v => v && typeof v === 'object' && !Array.isArray(v)) : [];
const strings = value => Array.isArray(value) ? value.filter(v => typeof v === 'string') : [];
function designDraft(value = {}) {
  return { name: text(value.name) || 'Untitled design', requirements: text(value.requirements), decision: text(value.decision), tradeOff: text(value.tradeOff), defense: text(value.defense), scenario: text(value.scenario) || 'Dependency timeout', assumptions: { users: 0, requestsPerDay: 0, peakFactor: 1, bytesPerWrite: 0, writePercent: 0, retentionDays: 0, ...(value.assumptions && typeof value.assumptions === 'object' ? value.assumptions : {}) }, components: objects(value.components).map(c => ({ id: text(c.id), name: text(c.name), responsibility: text(c.responsibility) })), connections: objects(value.connections).map(c => ({ id: text(c.id), from: text(c.from), to: text(c.to), contract: text(c.contract) })) };
}
export function normalizePractice(value = {}) {
  value = value && typeof value === 'object' ? value : {};
  return {
    attempts: Array.isArray(value.attempts) ? [...new Map(value.attempts.filter(a => a && typeof a.id === 'string').map(a => [a.id, { ...a, question: text(a.question), answer: text(a.answer), topic: text(a.topic), difficulty: text(a.difficulty), round: text(a.round), feedback: text(a.feedback), score: scoreValue(a.score), strengths: strings(a.strengths), gaps: strings(a.gaps), recommendations: strings(a.recommendations), dimensions: objects(a.dimensions).map(d => ({ key: text(d.key), score: scoreValue(d.score), evidence: text(d.evidence), deduction: text(d.deduction) })) }])).values()] : [],
    selectedDesignId: text(value.selectedDesignId),
    exerciseNotes: text(value.exerciseNotes),
    active: value.active && typeof value.active.question === 'string' ? value.active : null,
    pending: value.pending && typeof value.pending.text === 'string' ? value.pending : null,
    feedbackDepth: FEEDBACK_DEPTHS.includes(value.feedbackDepth) ? value.feedbackDepth : FEEDBACK_DEPTHS[0],
    evidence: objects(value.evidence).filter(e => typeof e.id === 'string').map(e => Object.fromEntries(['id', 'project', 'responsibility', 'action', 'outcome', 'measurement', 'tradeOffs'].map(key => [key, text(e[key])]))),
    reports: objects(value.reports).filter(r => typeof r.id === 'string').map(r => Object.fromEntries(['id', 'context', 'description', 'createdAt', 'status', 'resolvedAt'].map(key => [key, text(r[key])]))),
    designs: objects(value.designs).filter(d => typeof d.id === 'string').map(d => ({ ...d, draft: designDraft(d.draft || {}), versions: objects(d.versions).map(v => ({ ...v, draft: designDraft(v.draft || {}) })) })),
  };
}
export function recordAttempt(state, attempt) {
  const current = normalizePractice(state);
  // Request identity survives retries. Completing it twice never creates two results.
  if (current.attempts.some(item => item.id === attempt.id)) return { ...current, pending: null, active: null };
  return normalizePractice({ ...current, attempts: [...current.attempts, { ...attempt, score: scoreValue(attempt.score) }], pending: null, active: null });
}
export function compareAttempts(previous, next) {
  if (!previous || !next || previous.rubricVersion !== next.rubricVersion || previous.difficulty !== next.difficulty || previous.round !== next.round || !Number.isFinite(previous.score) || !Number.isFinite(next.score)) return { status: 'Needs another review', delta: null };
  const delta = Math.round((next.score - previous.score) * 10) / 10;
  return { status: delta > 0 ? 'Improved' : 'Remains open', delta };
}
export function practiceSummary(attempts = []) {
  const scored = attempts.filter(a => Number.isFinite(a.score));
  const topics = [...new Set(scored.map(a => a.topic))];
  return { completed: attempts.length, average: scored.length ? Math.round(scored.reduce((sum, a) => sum + a.score, 0) / scored.length * 10) / 10 : null, topics: topics.map(topic => ({ topic, scores: scored.filter(a => a.topic === topic).map(a => a.score) })), readiness: scored.length < 5 || topics.length < 3 ? 'Too little evidence to estimate broad readiness. Practise at least five answers across three topics.' : 'Practice evidence only; these scores do not predict interview outcomes.' };
}
export function evaluationMarkdown(evaluation) {
  return [`Score: ${scoreValue(evaluation.score) ?? 'Not assessed'}${scoreValue(evaluation.score) === null ? '' : '/10'}`, `Strongest point: ${evaluation.strengths?.[0] || 'Not established'}`, `Biggest gap: ${evaluation.gaps?.[0] || 'No specific gap identified'}`, `Next action: ${evaluation.recommendations?.[0] || 'Try a comparable question.'}`].join('\n\n');
}
export function evidenceBullet(evidence = {}) {
  const fields = ['project', 'responsibility', 'action', 'outcome', 'measurement', 'tradeOffs'];
  const missing = fields.filter(key => !text(evidence[key]).trim());
  return { evidenceId: evidence.id, missing, status: missing.length ? 'Experience needing clearer evidence' : 'Demonstrated experience (self-reported)', bullet: `${text(evidence.action) || '[Action needed]'} on ${text(evidence.project) || '[Project needed]'}; ${text(evidence.outcome) || '[Outcome needed]'} (${text(evidence.measurement) || '[Measurement needed]'}).` };
}
export function capacityEstimate({ users = 0, requestsPerDay = 0, peakFactor = 1, bytesPerWrite = 0, writePercent = 0, retentionDays = 0 } = {}) {
  const numbers = [users, requestsPerDay, peakFactor, bytesPerWrite, writePercent, retentionDays].map(Number);
  if (numbers.some(n => !Number.isFinite(n) || n < 0) || Number(writePercent) > 100) return null;
  const daily = Number(users) * Number(requestsPerDay);
  return { averageQps: daily / 86400, peakQps: daily / 86400 * Number(peakFactor), storageBytes: daily * Number(writePercent) / 100 * Number(bytesPerWrite) * Number(retentionDays) };
}

export function migrateLegacyPractice(messages = [], session = {}) {
  const attempts = [];
  const turns = session?.turns || [];
  for (const turn of turns) {
    if (!turn.answer || !turn.score) continue;
    attempts.push({ ...turn.score, id: `legacy-${session.id}-${turn.id}`, question: turn.question, answer: turn.answer, score: scoreValue(turn.score.value), topic: 'Imported practice', difficulty: 'Unspecified', round: session.round || 'coding', rubricVersion: 0, completedAt: turn.createdAt, feedback: turn.review?.notes || '', legacy: true });
  }
  (Array.isArray(messages) ? messages : []).forEach((message, index) => {
    if (message?.role !== 'assistant' || message.streaming || message.interrupted || message.replay) return;
    const score = text(message.content).match(/(?:overall\s*)?score\s*:?\s*(\d+(?:\.\d+)?)\s*\/\s*10/i);
    const user = messages.slice(0, index).reverse().find(m => m.role === 'user');
    if (!score || !user || /^start (?:a |an )?.*(?:interview|mock)/i.test(text(user.content)) || attempts.some(a => a.answer === user.content)) return;
    attempts.push({ id: `legacy-message-${index}`, question: messages.slice(0, index - 1).reverse().find(m => m.role === 'assistant')?.content || 'Imported practice', answer: user.content, score: Number(score[1]), topic: 'Imported practice', difficulty: 'Unspecified', round: 'Unspecified', rubricVersion: 0, completedAt: null, feedback: message.content, legacy: true });
  });
  return normalizePractice({ attempts });
}
