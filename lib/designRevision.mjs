const text = (value, limit = 2000) => typeof value === 'string' ? value.slice(0, limit) : '';
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Math.max(0, Math.min(1000000000, Number(value))) : fallback;
export function normalizeGraph(value = {}) {
  const seen = new Set();
  const nodes = (Array.isArray(value?.nodes) ? value.nodes : []).filter(n => n && /^[a-z0-9-]{1,50}$/.test(n.id) && !seen.has(n.id) && seen.add(n.id)).slice(0, 12).map(n => ({ id: n.id, name: text(n.name, 80), traffic: number(n.traffic), capacity: number(n.capacity), latency: number(n.latency), storage: text(n.storage, 300), consistency: text(n.consistency, 300), replicas: Math.max(1, Math.floor(number(n.replicas, 1))), available: n.available !== false }));
  const ids = new Set(nodes.map(n => n.id));
  const edgeIds = new Set();
  const edges = (Array.isArray(value?.edges) ? value.edges : []).filter(e => e && /^[a-z0-9-]{1,50}$/.test(e.id) && !edgeIds.has(e.id) && edgeIds.add(e.id) && ids.has(e.from) && ids.has(e.to) && e.from !== e.to).slice(0, 24).map(e => ({ id: e.id, from: e.from, to: e.to, protocol: text(e.protocol, 80), data: text(e.data, 200), mode: e.mode === 'async' ? 'async' : 'sync', timeout: number(e.timeout), attempts: Math.max(1, Math.min(10, Math.floor(number(e.attempts, 1)))) }));
  return { nodes, edges };
}
export function defaultRevision() {
  const nodes = ['API', 'Queue', 'Worker', 'Provider'].map((name, index) => ({ id: `node-${index}`, name, traffic: 100, capacity: index === 3 ? 100 : 200, latency: index === 3 ? 150 : 20, storage: name === 'Queue' ? 'Durable jobs; retain 7 days' : 'No durable state specified', consistency: name === 'Queue' ? 'At-least-once delivery' : 'Specify the consistency boundary', replicas: 1, available: true }));
  const edges = [0, 1, 2].map(index => ({ id: `edge-${index}`, from: `node-${index}`, to: `node-${index + 1}`, protocol: index === 2 ? 'HTTPS' : 'AMQP', data: index === 2 ? 'Notification + operation ID' : 'Delivery job', mode: index === 2 ? 'sync' : 'async', timeout: 200, attempts: 1 }));
  return { title: 'Notification delivery under provider failure', requirements: 'Accept 100 notifications/second. Acknowledge durable acceptance within 200 ms p95. Deliver accepted notifications eventually; track their status.', constraints: 'Retain pending jobs for 7 days. Do not promise exactly-once external delivery. Respect opt-outs at delivery time. Budget allows at most one additional worker replica.', graph: { nodes, edges }, baseline: null, change: '', decisions: '', risks: '', notes: '' };
}
export function normalizeRevision(value) {
  if (!value || typeof value !== 'object') return defaultRevision();
  return { title: text(value.title, 200), requirements: text(value.requirements), constraints: text(value.constraints), graph: normalizeGraph(value.graph), baseline: value.baseline ? normalizeGraph(value.baseline) : null, change: text(value.change), decisions: text(value.decisions, 4000), risks: text(value.risks, 4000), notes: text(value.notes, 4000) };
}
export function challengeRevision(value) {
  const state = normalizeRevision(value);
  if (state.baseline) return state;
  return { ...state, baseline: normalizeGraph(state.graph), change: 'The delivery provider is unavailable for 10 minutes. Incoming traffic remains 100 jobs/second: 60,000 jobs arrive during the outage. Preserve accepted jobs and prevent a retry storm; explain how you drain the backlog within the original budget.', graph: { ...state.graph, nodes: state.graph.nodes.map(n => n.id === 'node-3' ? { ...n, available: false } : n) } };
}
export function analyzeGraph(value) {
  const graph = normalizeGraph(value);
  const findings = [];
  const failed = new Set(graph.nodes.filter(n => !n.available).map(n => n.id));
  for (let i = 0; i < graph.nodes.length; i++) for (const e of graph.edges) if (e.mode === 'sync' && failed.has(e.to)) failed.add(e.from);
  for (const n of graph.nodes) {
    if (!n.available) findings.push({ node: n.id, message: `${n.name}: unavailable.` });
    else if (failed.has(n.id)) findings.push({ node: n.id, message: `${n.name}: synchronous dependency failure can propagate here; verify fallback or isolation.` });
    if (n.replicas === 1) findings.push({ node: n.id, message: `${n.name}: single-instance risk; replication and failover are not demonstrated.` });
    if (n.traffic > n.capacity * n.replicas) findings.push({ node: n.id, message: `${n.name}: assumed traffic exceeds aggregate per-replica capacity; investigate a bottleneck.` });
  }
  for (const e of graph.edges) {
    const target = graph.nodes.find(n => n.id === e.to);
    if (failed.has(e.to)) findings.push({ edge: e.id, message: `${e.protocol || 'Connection'} to ${target.name}: ${e.mode === 'sync' ? 'failure may reach caller' : 'delivery stalled; verify durable buffering, retention and recovery'}.` });
    if (e.mode === 'sync' && e.timeout && target.latency > e.timeout) findings.push({ edge: e.id, message: `${target.name}: assumed latency exceeds this connection's timeout.` });
    if (e.attempts > 1) findings.push({ edge: e.id, message: `${target.name}: up to ${e.attempts} attempts per operation; bound retry load, use backoff and verify idempotency.` });
  }
  return findings;
}
export function revisionChanges(before, after) {
  if (!before) return [];
  const changes = [];
  for (const kind of ['nodes', 'edges']) {
    const previous = normalizeGraph(before)[kind], current = normalizeGraph(after)[kind];
    for (const item of current) {
      const old = previous.find(n => n.id === item.id);
      if (!old) changes.push(`Added ${kind === 'nodes' ? item.name : `${item.from} → ${item.to}`}.`);
      else for (const key of Object.keys(item)) if (item[key] !== old[key]) changes.push(`${item.name || item.id}: ${key} changed from “${old[key]}” to “${item[key]}”.`);
    }
    for (const item of previous) if (!current.some(n => n.id === item.id)) changes.push(`Removed ${item.name || item.id}.`);
  }
  return changes;
}
