import { ERAS, normalizeTimeline } from './engineeringTimeMachine.mjs';

const BASE_NODES = [
  { id: 'app', label: 'Store application', detail: 'Catalogue reads and transactional checkout' },
  { id: 'db', label: 'Primary relational database', detail: 'Catalogue, profiles, orders, and inventory' },
  { id: 'backup', label: 'Backup and restore', detail: 'Recovery copy; restore procedure must be tested' },
];
const BASE_LINKS = [
  { id: 'reads', from: 'app', to: 'db', label: 'Catalogue reads' },
  { id: 'writes', from: 'app', to: 'db', label: 'Order and inventory transactions' },
  { id: 'backup-copy', from: 'db', to: 'backup', label: 'Backup copies' },
];
function snapshot(timeline) {
  const nodes = BASE_NODES.map(node => ({ ...node }));
  let links = BASE_LINKS.map(link => ({ ...link }));
  const obligations = [];
  const add = (id, label, detail) => nodes.push({ id, label, detail });
  const connect = (id, from, to, label) => links.push({ id, from, to, label });
  const obligation = (stage, text) => obligations.push({ origin: ERAS[stage].title, stage, text });
  const change = (id, patch) => Object.assign(nodes.find(node => node.id === id), patch);
  timeline.forEach(({ choice }, stage) => {
    if (choice === 'tune') {
      change('db', { detail: 'Catalogue query/index tuned; same relational data ownership' });
      obligation(stage, 'Measure read improvement and added index write/storage cost.');
    }
    if (choice === 'cache') {
      add('cache', 'Catalogue cache', 'Reads may be up to 30 seconds stale; checkout bypasses it');
      links = links.filter(link => link.id !== 'reads');
      connect('cache-read', 'app', 'cache', 'Catalogue reads');
      connect('cache-miss', 'cache', 'db', 'Misses fetch authoritative catalogue data');
      obligation(stage, 'Own cache invalidation and cold misses. At deletion time, check whether cached data includes profile fields or identifiers.');
    }
    if (choice === 'shard') {
      change('db', { detail: 'Catalogue and profiles remain here; order placement now needs routing' });
      add('shards', 'Order shards', 'Proposed partitioning; cross-shard inventory consistency is unresolved');
      links = links.filter(link => link.id !== 'writes');
      connect('shard-write', 'app', 'shards', 'Route orders by a partition key');
      connect('shard-backup', 'shards', 'backup', 'Coordinate backup and restoration across shards');
      obligation(stage, 'Preserve order/inventory consistency across the chosen partition boundary. Route deletions to every partition containing profile data.');
    }
    if (choice === 'async' || choice === 'sync') {
      add('remote', 'Remote standby', choice === 'sync' ? 'Remote durability acknowledgement required before commit success' : 'Asynchronous replay; recent acknowledged writes can be lost');
      connect('replication', 'db', 'remote', choice === 'sync' ? 'Wait for selected remote durability boundary' : 'Replicate after local commit');
      if (nodes.some(node => node.id === 'shards')) {
        change('remote', { detail: 'Standby set required for primary and each order shard; policy applied per owner' });
        connect('shard-replication', 'shards', 'remote', 'Apply the selected replication policy to every shard');
      }
      obligation(stage, choice === 'sync' ? 'Measure remote commit latency and write unavailability during a partition; rehearse fenced promotion and deletion replay.' : 'Resolve the mismatch with zero-loss requirements; measure lag, rehearse fenced promotion, and verify deletion replay.');
    }
    if (choice === 'pause') {
      change('app', { detail: 'Order intake paused during outage; recovery target must be renegotiated' });
      obligation(stage, 'Agree the availability/data-loss trade-off and rehearse restoration before resuming orders.');
    }
    if (choice === 'row') {
      change('db', { detail: `${nodes.find(node => node.id === 'db').detail}; primary profile row deleted` });
      obligation(stage, 'Deletion is incomplete until other serving copies and restoration behavior are accounted for.');
    }
    if (choice === 'purge') {
      add('deletion', 'Deletion workflow', 'Durable requests, retries, acknowledgements, and restore-time replay');
      for (const target of nodes.filter(node => ['db', 'cache', 'shards', 'remote', 'backup'].includes(node.id))) {
        connect(`delete-${target.id}`, 'deletion', target.id, target.id === 'backup' ? 'Apply deletion records before restored data is served' : 'Verify deletion for data in scope');
      }
      obligation(stage, 'Measure the 24-hour serving-data target; prevent stale writers and restores from resurrecting deleted profiles.');
    }
    if (choice === 'rewrite') {
      add('replacement', 'Proposed replacement store', 'Engine undecided; migration does not establish deletion guarantees');
      connect('migration', 'db', 'replacement', 'Migration adds a temporary data copy');
      obligation(stage, 'Define deletion across old and new copies before migration; existing cache, replica, and backup duties remain.');
    }
  });
  return { nodes, links, obligations };
}
export function designTransition(value, index) {
  const timeline = normalizeTimeline(value);
  if (!Number.isInteger(index) || index < 0 || index >= timeline.length) return null;
  const before = snapshot(timeline.slice(0, index));
  const after = snapshot(timeline.slice(0, index + 1));
  const previousNodes = new Map(before.nodes.map(node => [node.id, node]));
  const previousLinks = new Map(before.links.map(link => [link.id, link]));
  return {
    before,
    after: { ...after,
      nodes: after.nodes.map(node => ({ ...node, status: !previousNodes.has(node.id) ? 'Added' : JSON.stringify(previousNodes.get(node.id)) === JSON.stringify(node) ? 'Unchanged' : 'Changed' })),
      links: after.links.map(link => ({ ...link, status: !previousLinks.has(link.id) ? 'Added' : JSON.stringify(previousLinks.get(link.id)) === JSON.stringify(link) ? 'Unchanged' : 'Changed' })),
    },
    removedLinks: before.links.filter(link => !after.links.some(next => next.id === link.id)),
    keep: ERAS[index].keep,
  };
}
