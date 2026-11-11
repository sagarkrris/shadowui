export const LANDING_TRACKS = [
  { id: 'backend', label: 'Senior Backend', detail: 'Java / Spring', topic: 'Java backend production diagnostics', modules: [
    ['Read', 'Connection pool ownership and diagnostics', '/tech-blogs/connection-pool-full-is-database-slow'],
    ['Lab', 'LRU cache and capacity model', '/labs/cache'],
    ['Investigate', 'The rollback that never happened', '/detective/the-rollback-that-never-happened'],
  ] },
  { id: 'architect', label: 'System Architect', detail: 'Scale / reliability', topic: 'System design failure boundaries', modules: [
    ['Read', 'Designing reliable microservices', '/java/system-design-reliability'],
    ['Lab', 'Bounded queues and capacity', '/labs/queues'],
    ['Investigate', 'The service that drowned in retries', '/detective/the-service-that-drowned-in-retries'],
  ] },
  { id: 'fullstack', label: 'Full Stack', detail: 'Browser / API / data', topic: 'Full stack API and cache contracts', modules: [
    ['Read', 'React hooks interview guide', '/guides/react/react-hooks-interview-questions'],
    ['Lab', 'Cache reuse and eviction', '/labs/cache'],
    ['Investigate', 'The report from another tenant', '/detective/the-report-from-another-tenant'],
  ] },
  { id: 'ai', label: 'AI Engineer', detail: 'Models / tools / evaluation', topic: 'AI workflow budgets and failure handling', modules: [
    ['Read', 'AI engineering foundations', '/learn/ai-engineering'],
    ['Lab', 'Agent budget and approval model', '/labs/agents'],
    ['Investigate', 'Retry amplification across services', '/detective/the-service-that-drowned-in-retries'],
  ] },
];
