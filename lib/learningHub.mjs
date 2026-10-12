import { JAVA_BACKEND_STAGES, BACKEND_ROADMAP_KEY } from './javaBackendRoadmap.mjs';
export const HUB_PROGRESS_KEY = 'interviewiq.learningHub.v1';
export const FLOW = ['Learn', 'Experiment', 'Build', 'Interview', 'Review'];
export const buddyHref = topic => `/practice?buddy=1&buddyMode=warmup&buddyTopic=${encodeURIComponent(topic)}`;
const phase = (id, title, prerequisite, learn, lab, build, checkpoint) => ({ id, title, prerequisites: prerequisite, outcome: checkpoint,
  activities: [
    { label: 'Learn', title: `Study ${title}`, href: learn },
    { label: 'Experiment', title: 'Explore the interactive lab', href: `/labs/${lab}` },
    { label: 'Build', title: 'Complete the build exercise', href: build },
    { label: 'Interview', title: `Defend your understanding of ${title}`, href: buddyHref(`${title}: ${checkpoint}`) },
    { label: 'Review', title: 'Record your explanation and remaining gaps', href: `#review-${id}` },
  ] });
export const LEARNING_PATHS = [
  { id: 'java-backend', title: 'Java Backend Engineer', description: 'Java, Spring, data, concurrency, reliability, and interview readiness.', stages: JAVA_BACKEND_STAGES, href: '/java/roadmap' },
  { id: 'full-stack', title: 'Full Stack Engineer', description: 'Browser contracts, APIs, persistence, delivery, and secure end-to-end behavior.', stages: [
    phase('web-contracts', 'Web and API contracts', 'Basic JavaScript, HTML, HTTP, and one server language.', '/guides/react/react-hooks-interview-questions', 'cache', '/guides/react/react-hooks-interview-questions', 'Build a client/server interaction with validated requests, explicit states, and understandable failures.'),
    phase('server', 'Node.js service contracts', 'JavaScript promises, HTTP, and browser/server boundaries.', '/guides/nodejs/nodejs-backend-interview-questions', 'queues', '/learn/ai-engineering#lesson-prompt-contracts', 'Validate input and demonstrate cancellation and failure handling in a Node.js service.'),
    phase('realtime', 'Real-time interfaces', 'HTTP request/response and browser event handling.', '/tech-blogs/real-time-communication-patterns', 'queues', '/tech-blogs/real-time-communication-patterns#lesson-2', 'Compare polling, SSE, and WebSockets; demonstrate reconnect and duplicate-message behavior.'),
    phase('data', 'Persistence and caching', 'SQL basics and API contracts.', '/tech-blogs/sql-performance-interviews', 'indexes', '/build/inverted-index', 'Explain a query plan and compare a data lookup with an in-memory teaching index.'),
    phase('security', 'Security and delivery', 'Authentication, service boundaries, and basic tests.', '/tech-blogs/spring-boot-security', 'cache', '/build/practice/notification-adapter', 'Explain authorization boundaries and test a provider adapter without inventing delivery guarantees.'),
  ] },
  { id: 'system-design', title: 'System Design', description: 'Requirements, capacity, consistency, failure policies, and design defense.', stages: [
    phase('requirements', 'Requirements and capacity', 'HTTP, basic databases, and arithmetic.', '/tech-blogs/system-design-fundamentals-roadmap', 'queues', '/practice?workspace=canvas', 'State workload assumptions and identify the first bottleneck.'),
    phase('storage', 'Storage and consistency', 'Data modeling and transaction boundaries.', '/tech-blogs/distributed-transactions-data-consistency', 'indexes', '/build/write-ahead-log', 'Distinguish local transaction atomicity from recovery across services.'),
    phase('scaling', 'Caching and concurrency', 'Capacity estimates and shared-state reasoning.', '/tech-blogs/caching-patterns-java', 'cache', '/build/practice/single-flight-cache', 'Explain cache-miss coalescing, ownership, and failure cleanup.'),
    phase('recovery', 'Failure and recovery', 'Timeouts, retries, and event identities.', '/tech-blogs/resilience-engineering', 'concurrency', '/build/retry-scheduler', 'Defend a bounded retry policy and its persistence limitations.'),
  ] },
  { id: 'ai-engineering', title: 'AI Engineering', description: 'Model contracts, retrieval, evaluation, tool authority, and observable agent workflows.', stages: [
    phase('contracts', 'Model and output contracts', 'JavaScript, JSON, Node.js 20+, and software testing.', '/learn/ai-engineering#lesson-llm-foundations', 'agents', '/learn/ai-engineering#lesson-prompt-contracts', 'Complete the course model-contract exercise and distinguish schema validity from answer quality.'),
    phase('retrieval', 'Retrieval and evidence', 'Model contracts and collections.', '/learn/ai-engineering#lesson-retrieval-rag', 'indexes', '/build/inverted-index', 'Build a small search index and explain why retrieval alone does not establish truth.'),
    phase('evaluation', 'Evaluation and guardrails', 'Test fixtures, failure cases, and evidence review.', '/tech-blogs/production-llm-evals-guardrails', 'agents', '/learn/ai-engineering#lesson-evaluation-cost', 'Create a held-out evaluation plan and keep authorization outside model-generated content.'),
    phase('operations', 'Agent operations', 'Evaluation, permissions, and bounded work.', '/tech-blogs/java-background-jobs', 'queues', '/build/practice/bounded-retry', 'Bound work and retries, expose uncertainty, and define when human approval is required.'),
  ] },
];
export const pathActivityId = (path, stage, label) => `path-${path}-${stage}-${label.toLowerCase()}`;
export function normalizeHubProgress(value) {
  const result = { completed: [], weak: [], notes: {} };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  for (const field of ['completed', 'weak']) result[field] = [...new Set(Array.isArray(value[field]) ? value[field].filter(id => typeof id === 'string' && /^[a-z0-9-]{1,180}$/.test(id)).slice(0, 3000) : [])];
  if (value.notes && typeof value.notes === 'object' && !Array.isArray(value.notes)) for (const [id, note] of Object.entries(value.notes).slice(0, 500)) if (/^[a-z0-9-]{1,180}$/.test(id) && typeof note === 'string') result.notes[id] = note.slice(0, 4000);
  return result;
}
export function learningPathProgress(path, value, backend = []) {
  const progress = normalizeHubProgress(value);
  const completed = new Set(progress.completed);
  if (path.id === 'java-backend') for (const stage of path.stages) for (const activity of stage.activities) if (Array.isArray(backend) && backend.includes(`${stage.id}:${activity.label}`)) completed.add(pathActivityId(path.id, stage.id, activity.label));
  const activities = path.stages.flatMap(stage => stage.activities.map(activity => ({ ...activity, stage, id: pathActivityId(path.id, stage.id, activity.label) })));
  const weak = path.stages.filter(stage => progress.weak.includes(`stage-${path.id}-${stage.id}`));
  return { total: activities.length, completed: activities.filter(a => completed.has(a.id)).length, weak, next: weak.length ? { stage: weak[0], href: weak[0].activities[0].href, review: true } : activities.find(a => !completed.has(a.id)) || null };
}
export { BACKEND_ROADMAP_KEY };
