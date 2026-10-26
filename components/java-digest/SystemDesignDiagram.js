import IllustrationPanel from '../learning/IllustrationPanel';
import { artworkGraph } from '../../lib/diagramArtwork.mjs';

const DIAGRAMS = {
  javaTimeline: { label: 'Java evolution timeline', relation: 'timeline', nodes: [[22, 'Java 8', 'lambdas + streams'], [210, 'Java 11', 'modules + HttpClient'], [398, 'Java 17', 'records + sealed'], [570, 'Java 21+', 'virtual threads + JVM']] },
  java8: { label: 'Java 8 foundation', relation: 'comparison', nodes: [[22, 'Lambda', 'behavior as data'], [210, 'Stream', 'pipeline'], [398, 'Optional', 'absence explicit'], [570, 'Default method', 'evolve APIs']] },
  java911: { label: 'Java 9–11 platform', relation: 'timeline', nodes: [[22, 'Modules', 'explicit boundaries'], [210, 'var', 'local inference'], [398, 'HttpClient', 'modern HTTP'], [570, 'LTS', 'stable baseline']] },
  java1214: { label: 'Java 12–14 language clarity', relation: 'timeline', nodes: [[22, 'Switch expr', 'value + exhaustiveness'], [210, 'Text blocks', 'readable literals'], [398, 'Helpful NPE', 'faster diagnosis'], [570, 'Preview', 'incubate safely']] },
  java1517: { label: 'Java 15–17 data modeling', relation: 'timeline', nodes: [[22, 'Records', 'data shape'], [210, 'Sealed', 'closed hierarchy'], [398, 'Pattern match', 'less ceremony'], [570, 'LTS', 'strong baseline']] },
  java1820: { label: 'Java 18–20 concurrency runway', relation: 'timeline', nodes: [[22, 'UTF-8', 'predictable text'], [210, 'Virtual threads', 'cheap blocking'], [398, 'Structured', 'scoped tasks'], [570, 'Preview APIs', 'iterate']] },
  java21: { label: 'Java 21 LTS', relation: 'comparison', nodes: [[22, 'Virtual threads', 'scale waiting'], [210, 'Pattern switch', 'expressive flow'], [398, 'Sequenced', 'ordered APIs'], [570, 'LTS', 'production adoption']] },
  java2224: { label: 'Java 22–24 platform acceleration', relation: 'timeline', nodes: [[22, 'Unnamed', 'remove noise'], [210, 'Gatherers', 'stream shape'], [398, 'FFM', 'safe native calls'], [570, 'Class-file API', 'tooling']] },
  java2526: { label: 'Java 25–26 runtime evolution', relation: 'timeline', nodes: [[22, 'Scoped values', 'bounded context'], [210, 'AOT cache', 'faster start'], [398, 'HTTP/3', 'modern transport'], [570, 'JVM', 'less overhead']] },
  pattern: { label: 'Pattern collaboration', relation: 'sequence', nodes: [[22, 'Context', 'client'], [210, 'Abstraction', 'stable contract'], [398, 'Pattern', 'vary behavior'], [570, 'Test', 'prove seam']] },
  lld: { label: 'Low-level design loop', relation: 'sequence', nodes: [[22, 'Use case', 'requirements'], [210, 'Objects', 'responsibilities'], [398, 'Policy', 'invariant'], [570, 'Tests', 'evolution']] },
  dsa: { label: 'Algorithm reasoning', relation: 'sequence', nodes: [[22, 'Input', 'shape'], [210, 'Invariant', 'state'], [398, 'Transition', 'move'], [570, 'Proof', 'complexity']] },
  java: { label: 'Production Java boundary', relation: 'sequence', nodes: [[22, 'Request', 'validated'], [210, 'Domain', 'invariant'], [398, 'Resource', 'bounded'], [570, 'Telemetry', 'evidence']] },
  sql: { label: 'SQL optimization loop', relation: 'feedback', connections: [[0, 1, 'inspect plan'], [1, 2, 'choose index'], [2, 3, 'measure'], [3, 0, 'revise query']], nodes: [[22, 'Query', 'real params'], [210, 'Plan', 'explain'], [398, 'Index', 'selectivity'], [570, 'Benchmark', 'prove gain']] },
  distributed: { label: 'Distributed delivery', relation: 'sequence', nodes: [[22, 'Producer', 'local state'], [210, 'Network', 'delay / dupes'], [398, 'Consumer', 'idempotent'], [570, 'Converge', 'recovery']] },
  communication: { label: 'Interview answer structure', relation: 'sequence', nodes: [[22, 'Clarify', 'assumptions'], [210, 'Model', 'mechanism'], [398, 'Prove', 'example'], [570, 'Close', 'trade-off']] },
  behavioral: { label: 'Evidence-backed story', relation: 'sequence', nodes: [[22, 'Situation', 'context'], [210, 'Task', 'ownership'], [398, 'Action', 'judgement'], [570, 'Result', 'learning']] },
  api: { label: 'API boundary', relation: 'sequence', nodes: [[22, 'Client', 'request'], [291, 'Gateway', 'auth + limits'], [560, 'Service', 'domain work']] },
  cache: { label: 'Cache-aside read path', relation: 'topology', connections: [[0, 1, 'read'], [1, 2, 'miss'], [2, 3, 'load fresh value'], [3, 1, 'populate']], nodes: [[22, 'Client', 'read'], [210, 'Cache', 'fast / stale'], [398, 'Database', 'source of truth'], [570, 'Refresh', 'on miss']] },
  database: { label: 'Storage access path', relation: 'topology', connections: [[0, 1, 'uses access path'], [1, 2, 'locates rows'], [2, 3, 'replicates committed state']], nodes: [[22, 'Query', 'access pattern'], [210, 'Index', 'selective lookup'], [398, 'Primary', 'durable write'], [570, 'Replica', 'read scale']] },
  event: { label: 'Durable async path', relation: 'sequence', nodes: [[22, 'Request', 'commit'], [210, 'Outbox', 'same tx'], [398, 'Queue', 'replayable'], [570, 'Consumer', 'idempotent']] },
  network: { label: 'Request journey', relation: 'sequence', nodes: [[22, 'Client', 'browser / app'], [210, 'DNS', 'name → IP'], [398, 'Proxy', 'route + TLS'], [570, 'Service', 'HTTP handler']] },
  scale: { label: 'Scale-out path', relation: 'topology', connections: [[0, 1, 'routes traffic'], [1, 2, 'selects healthy instances'], [2, 3, 'reads and writes state']], nodes: [[22, 'Traffic', 'peak load'], [210, 'Load balancer', 'health checks'], [398, 'Instances', 'stateless'], [570, 'State', 'partitioned']] },
  reliability: { label: 'Failure-aware request', relation: 'topology', connections: [[0, 1, 'calls within deadline'], [1, 2, 'bounded dependency call'], [1, 3, 'degrades on failure']], nodes: [[22, 'Caller', 'deadline'], [210, 'Service', 'bounded work'], [398, 'Dependency', 'timeout'], [570, 'Fallback', 'degraded mode']] },
  cap: { label: 'CAP decision', relation: 'comparison', nodes: [[22, 'Partition', 'network split'], [210, 'Consistency', 'fresh data'], [398, 'Availability', 'respond now'], [570, 'Contract', 'choose per op']] },
  observe: { label: 'Operational feedback loop', relation: 'feedback', connections: [[0, 1, 'emits traces'], [1, 2, 'aggregates signals'], [2, 3, 'triggers response'], [3, 0, 'changes next observation']], nodes: [[22, 'Request', 'trace'], [210, 'Metrics', 'latency + errors'], [398, 'Alert', 'threshold'], [570, 'Action', 'mitigate']] },
  default: { label: 'System design reasoning loop', relation: 'sequence', nodes: [[22, 'Requirements', 'user + target'], [210, 'Components', 'boundaries'], [398, 'Trade-offs', 'cost + risk'], [570, 'Operate', 'measure + recover']] },
};

const RELATION_DESCRIPTIONS = {
  sequence: 'Arrows show the stated step order.',
  timeline: 'Arrows show chronological progression.',
  topology: 'Each labeled arrow shows an explicit dependency or interaction.',
  feedback: 'Follow the labeled connections around the feedback loop.',
  comparison: 'Compare the items; their placement does not imply execution order or dependency.',
};

function connectionsFor(diagram) {
  if (Array.isArray(diagram.connections)) return diagram.connections;
  if (diagram.relation !== 'sequence' && diagram.relation !== 'timeline') return [];
  const label = diagram.relation === 'timeline' ? 'chronological progression' : 'next step';
  return diagram.nodes.slice(1).map((_, index) => [index, index + 1, label]);
}

export default function SystemDesignDiagram({ kind = 'default', concept }) {
  const diagram = DIAGRAMS[kind] || DIAGRAMS.default;
  const nodes = diagram.nodes.map(([, label, detail], index) => ({ id: `node-${index}`, label, detail, symbol: 'component' }));
  const edges = connectionsFor(diagram).map(([from, to, label]) => ({ from: nodes[from].id, to: nodes[to].id, label }));
  const description = [RELATION_DESCRIPTIONS[diagram.relation], concept].filter(Boolean).join(' ');
  const model = artworkGraph(nodes, edges, diagram.label, description, diagram.relation);
  return <figure className="system-design-diagram" style={{ minWidth: 0, margin: '16px 0' }}>
    <figcaption>{diagram.label}</figcaption>
    <IllustrationPanel model={model} artworkKey="system-design-overview" />
  </figure>;
}
