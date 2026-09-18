export const TIME_MACHINE_PATH = '/time-machine/database-decisions';
export const TIME_MACHINE_KEY = 'interviewiq.timeMachine.database.v1';
export const ERAS = [
  {
    id: 'growth', title: 'Month 6: reads grow twentyfold',
    constraint: 'The fictional store now serves 2,000 catalogue reads/s and 50 orders/s. Catalogue pages may be 30 seconds stale; checkout must use current inventory. A trace attributes most database time to one catalogue query. Two engineers operate the system.',
    keep: 'Keep relational transactions for order and inventory updates. Traffic growth alone does not prove the data model is wrong.',
    options: [
      { id: 'tune', title: 'Tune the query and index first', outcome: 'A focused experiment addresses the measured hotspot without adding another data store. It might still leave insufficient capacity.', cost: 'Indexes consume storage and add write maintenance. Validate representative read and write plans before rollout.', next: 'Replay peak traffic and measure query time, write overhead, and connection saturation.' },
      { id: 'cache', title: 'Cache catalogue reads', outcome: 'A cache can reduce repeated reads within the 30-second freshness budget. Checkout still reads the authoritative database.', cost: 'You now own invalidation, cache misses, and another copy of product data. A cache does not repair a slow miss path.', next: 'Measure hit rate and test cold-cache load, invalidation, and stale catalogue behavior.' },
      { id: 'shard', title: 'Shard orders across databases', outcome: 'Sharding can distribute some work, but the evidence points to a catalogue query. This intervention may not address the observed bottleneck.', cost: 'Routing, cross-shard operations, and resharding add substantial work for two operators.', next: 'Identify a measured single-node limit and a viable partition key before committing to migration.' },
    ],
  },
  {
    id: 'outage', title: 'Month 12: the primary region goes dark',
    constraint: 'The business proposes recovery within 15 minutes and no loss of acknowledged orders. The inter-region round trip is 90 ms. Those are requirements to validate, not achieved guarantees.',
    keep: 'Keep order IDs, transaction boundaries, and an explicit source of truth. Failover must prevent two writable primaries.',
    options: [
      { id: 'async', title: 'Use an asynchronous remote standby', outcome: 'A remote standby can support recovery, but acknowledged writes not yet replicated may be lost. This does not meet the stated zero-loss requirement.', cost: 'The business must accept a nonzero recovery-point objective or change the design. Promotion, fencing, and routing still need rehearsals.', next: 'Measure replication lag and run a failure drill that accounts for every acknowledged order.' },
      { id: 'sync', title: 'Require remote durable acknowledgement', outcome: 'Waiting for the chosen remote durability boundary can protect acknowledged commits against loss of the primary region, under the tested failure model.', cost: 'Commit latency includes remote coordination; losing that acknowledgement path can stop writes. Configuration alone does not prove the 15-minute recovery target.', next: 'Define the acknowledgement boundary, test network partitions, and measure commit latency and failover time.' },
      { id: 'pause', title: 'Pause orders and renegotiate the recovery target', outcome: 'A controlled pause avoids pretending the existing design provides regional recovery. It is defensible only if stakeholders accept the changed service target.', cost: 'Availability and revenue suffer. Backups still require restore tests and may omit recent acknowledged writes.', next: 'Agree recovery time and acceptable data loss explicitly, then rehearse restoration.' },
    ],
  },
  {
    id: 'deletion', title: 'Month 18: deletion becomes a product requirement',
    constraint: 'For this exercise, customer profile data must disappear from live serving systems within 24 hours. Accounting records follow a separately agreed retention policy. Backups must not reintroduce deleted profiles when restored. These are fictional product constraints, not legal advice.',
    keep: 'Keep the transactional order model. Separate customer profile identifiers from retained accounting records rather than treating every record as equally deletable.',
    options: [
      { id: 'row', title: 'Delete only the primary profile row', outcome: 'The primary lookup stops returning that row, but this does not establish removal from derived data or prevent resurrection after restoration.', cost: 'Copies, in-flight updates, exports, and restore procedures remain outside the deletion boundary.', next: 'Inventory every place profile data travels and test a deletion through a restore.' },
      { id: 'purge', title: 'Track deletion across copies and restores', outcome: 'A durable deletion workflow can track acknowledgements from serving copies and apply deletion records before a restored system resumes serving.', cost: 'Retries, ordering, retention boundaries, and failure alerts need explicit ownership. The 24-hour goal must be measured.', next: 'Test partial failure, stale writers, idempotent retries, and restoration without resurrecting profiles.' },
      { id: 'rewrite', title: 'Replace the relational database', outcome: 'A new storage engine does not by itself remove old exports, caches, replicas, or restored data.', cost: 'Migration adds another period of duplicate data and still requires a deletion workflow.', next: 'Write an end-to-end deletion contract before evaluating a replacement engine.' },
    ],
  },
];
export function normalizeTimeline(value) {
  if (!Array.isArray(value)) return [];
  const result = [];
  for (let index = 0; index < Math.min(value.length, ERAS.length); index++) {
    const item = value[index];
    if (!ERAS[index].options.some(option => option.id === item?.choice)) break;
    result.push({ choice: item.choice, reason: typeof item.reason === 'string' ? item.reason.slice(0, 800) : '' });
  }
  return result;
}
export function timelineFromShare(value) {
  if (typeof value !== 'string' || value.length > 100 || !value.startsWith('v1.')) return [];
  const parts = value.slice(3).split('.');
  const timeline = normalizeTimeline(parts.map(choice => ({ choice })));
  return timeline.length === parts.length ? timeline : [];
}
export function sharePath(value) {
  const timeline = normalizeTimeline(value);
  return timeline.length ? `${TIME_MACHINE_PATH}?path=v1.${timeline.map(item => item.choice).join('.')}` : TIME_MACHINE_PATH;
}
export function inheritedContext(value) {
  const timeline = normalizeTimeline(value);
  const items = ['Primary relational database and its backup/restore path'];
  if (timeline[0]?.choice === 'cache') items.push('Catalogue cache: check whether it contains profile fields or identifiers before deciding its deletion scope');
  if (timeline[0]?.choice === 'shard') items.push('Sharded databases: route deletions to every partition that contains the profile');
  if (['sync', 'async'].includes(timeline[1]?.choice)) items.push('Remote standby: verify deletion replay and prevent stale promotion');
  return items;
}
export function decisionMarkdown(value, lessonUrl) {
  const timeline = normalizeTimeline(value);
  return ['# Engineering Time Machine: database decisions', '', 'Fictional teaching scenario. Outcomes are qualitative, not benchmark results.', '', 'Baseline: one relational database; transactional orders and inventory.', ...timeline.flatMap((item, index) => {
    const era = ERAS[index], option = era.options.find(candidate => candidate.id === item.choice);
    return ['', `## ${era.title}`, `Constraint: ${era.constraint}`, `Decision: ${option.title}`, `My reasoning: ${item.reason || '(not recorded)'}`, `Consequence: ${option.outcome}`, `Trade-off: ${option.cost}`, `Keep: ${era.keep}`, `Next evidence: ${option.next}`];
  }), '', `Original lesson: ${lessonUrl}`, ''].join('\n');
}
