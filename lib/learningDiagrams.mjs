// Explicitly authored mechanisms. Symptom diagrams illustrate a candidate cause,
// not a diagnosis; the entry's evidence and executable fixture define the scope.
export const LEARNING_DIAGRAMS = {
  symptomWaiting: {
    title: 'A waiting worker can leave new work queued',
    description: 'In this one-worker teaching model, the first task waits on an event. A second task queues until the first can finish. Low aggregate CPU alone does not identify the wait or rule out a saturated core.',
    nodes: [['first',20,20,'Task A owns worker','Waiting on an event'],['queue',275,20,'Task B is queued','No free worker'],['signal',20,190,'Event is signalled','Task A can finish'],['next',275,190,'Task B starts','Worker becomes available']],
    edges: [['first','queue','capacity occupied'],['first','signal','wait ends'],['signal','next','then dispatch']],
  },
  symptomIndex: {
    title: 'Compare access paths for the same result',
    description: 'An index path can require fetching many rows before filtering; a scan reads rows directly and filters. Compare actual plans, row counts, and page work under equivalent conditions. The fixture forces paths and does not prove which plan a production optimizer will choose.',
    nodes: [['query',275,20,'Same query','Equivalent data + parameters'],['index',20,190,'Index path','Fetch candidate rows'],['scan',530,190,'Scan path','Read and filter rows'],['result',275,360,'Same result','Compare work, not just time']],
    edges: [['query','index','candidate plan'],['query','scan','alternative plan'],['index','result','filter matches'],['scan','result','filter matches']],
  },
  symptomDuplicate: {
    title: 'Commit before acknowledgement creates a replay window',
    description: 'A local database effect and its unique event marker commit together. If acknowledgement is lost, redelivery finds the marker and does not repeat the local effect. This boundary does not deduplicate an arbitrary external payment.',
    nodes: [['event',20,20,'Receive event E1','Stable event identity'],['commit',275,20,'Commit local transaction','Effect + unique marker'],['lost',530,20,'Acknowledgement lost','Broker may redeliver'],['replay',275,190,'Redeliver E1','Marker already committed'],['skip',530,190,'Skip duplicate effect','Then acknowledge']],
    edges: [['event','commit','apply once'],['commit','lost','response gap'],['lost','replay','retry delivery'],['replay','skip','duplicate found']],
  },
  symptomMutableKey: {
    title: 'A changed hash can send lookup to another bucket',
    description: 'Insertion stores an entry using the key hash at that time. Mutating a field used by hashCode can make lookup search a different bucket while iteration still sees the stored entry. Keep equality and hashing fields stable while a key is in the map.',
    nodes: [['put',20,20,'Insert key','Hash from original fields'],['stored',275,20,'Entry in bucket A','Insertion location'],['mutate',20,190,'Mutate key field','New hash may differ'],['lookup',275,190,'Lookup bucket B','May miss stored entry']],
    edges: [['put','stored','store'],['put','mutate','later mutation'],['mutate','lookup','recompute hash']],
  },
  symptomProxy: {
    title: 'Self-invocation bypasses the proxy boundary',
    description: 'In the proxy-based model, an external call through the proxy can run interception before the target method. A target calling its own method stays inside the object and bypasses that proxy. Actual transaction and async behavior requires framework integration tests.',
    nodes: [['caller',20,20,'External caller','Calls the managed proxy'],['proxy',275,20,'Proxy interception','Transaction or async advice'],['target',530,20,'Target method','Application code'],['self',530,190,'Internal method call','No new proxy entry']],
    edges: [['caller','proxy','external invocation'],['proxy','target','intercept then delegate'],['target','self','self-invocation']],
  },
  symptomContext: {
    title: 'A reused worker can retain the previous request context',
    description: 'Request A sets thread-local context on a pooled worker. If its owner does not remove the context in finally, a later request on that worker can observe A’s value. Cleanup must happen on the owning thread, including exceptional exits.',
    nodes: [['a',20,20,'Request A','Set synthetic tenant A'],['thread',275,20,'Pooled worker','ThreadLocal retains value'],['b',530,20,'Request B','Reuses the same worker'],['clear',275,190,'Owner finally block','Remove context before reuse']],
    edges: [['a','thread','set context'],['thread','b','uncleared reuse leaks'],['thread','clear','repair lifecycle']],
  },
  symptomIterator: {
    title: 'One thread can invalidate its own iterator',
    description: 'An iterator remembers collection modification state. A structural change through the list during traversal can make the next iterator operation throw. Use a supported iterator removal or collect changes separately; fail-fast detection is not a concurrency guarantee.',
    nodes: [['iterator',20,20,'Create iterator','Expected modification state'],['change',275,20,'Change list directly','Structural state changes'],['next',530,20,'Continue iteration','Mismatch may throw'],['safe',275,190,'Supported removal','Use iterator.remove']],
    edges: [['iterator','change','during traversal'],['change','next','next operation'],['iterator','safe','valid removal path']],
  },
  symptomRetention: {
    title: 'A live owner can keep completed request objects reachable',
    description: 'A long-lived collection retains request objects after requests finish. Removing those references releases this owner’s retention, but other references may remain and reclamation is not immediate. Confirm a leak using live-set and retaining-path evidence.',
    nodes: [['owner',20,20,'Long-lived collection','Still reachable'],['request',275,20,'Request objects','Retained by collection'],['finish',530,20,'Requests complete','References still exist'],['remove',275,190,'Remove owned references','Other owners may remain']],
    edges: [['owner','request','strong references'],['request','finish','completion alone'],['owner','remove','bound retention']],
  },
  symptomNull: {
    title: 'Unboxing requires a non-null wrapper',
    description: 'A Boolean can be true, false, or null. Unboxing null throws before the boolean branch executes. Validate required input or choose an explicit absence policy before unboxing; defaulting is a domain decision.',
    nodes: [['value',275,20,'Boolean input','true, false, or null'],['present',20,190,'Non-null wrapper','Unbox to boolean'],['absent',530,190,'Null wrapper','Unboxing throws'],['policy',275,360,'Explicit absence policy','Reject or documented default']],
    edges: [['value','present','value present'],['value','absent','value absent'],['absent','policy','repair boundary']],
  },
  buildRetry: {
    title: 'Retry scheduling keeps time and identity separate',
    description: 'The in-memory scheduler polls only due work. A failed attempt is rescheduled with the same ID and a bounded attempt count. A local set suppresses repeated model effects but is lost on restart and cannot protect an external effect.',
    nodes: [['queue',20,20,'Due-time queue','Future work stays queued'],['run',275,20,'Poll due task','Original task identity'],['effect',530,20,'Model effect set','One add per task ID'],['retry',275,190,'Bounded retry','10 then 20 ticks; 3 tries']],
    edges: [['queue','run','due <= now'],['run','effect','apply model effect'],['run','retry','retryable failure'],['retry','queue','same ID; later due']],
  },
  buildIndex: {
    title: 'An inverted index maps each term to document IDs',
    description: 'Document 1 contains java and maps; document 2 contains java and threads. An AND query for java maps intersects the two posting sets and returns only document 1. Replacement must remove the old document ID from obsolete postings.',
    nodes: [['docs',275,20,'Documents 1 and 2','Normalize ASCII terms'],['java',20,190,'java → {1, 2}','Posting set'],['maps',530,190,'maps → {1}','Posting set'],['result',275,360,'java AND maps → {1}','Intersect; return a copy']],
    edges: [['docs','java','index java'],['docs','maps','index maps'],['java','result','intersection'],['maps','result','intersection']],
  },
  buildPool: {
    title: 'Each borrowed resource belongs to an active lease',
    description: 'The teaching pool has two integer resources. Acquisition removes one available resource and records its lease. A valid return restores that resource once. Null, foreign, or already-returned leases cannot increase capacity; finally returns a valid lease after work fails.',
    nodes: [['free',20,20,'Available resources','Initially {1, 2}'],['lease',275,20,'Borrowed lease','Pool + resource identity'],['use',530,20,'Use resource','Success or exception'],['release',275,190,'Validate return','Must still be borrowed']],
    edges: [['free','lease','acquire'],['lease','use','exclusive model use'],['use','release','finally'],['release','free','return once']],
  },
  buildLog: {
    title: 'Only committed assignments participate in replay',
    description: 'This in-memory log model marks individual assignments committed before applying them. Recovery replays committed entries in log order and ignores uncommitted entries, including gaps. Repeated assignment replay produces the same state. Real write-ahead logging additionally requires storage ordering, durable flushes, torn-write handling, and crash testing.',
    nodes: [['append',20,20,'Append update','Log entry in memory'],['commit',275,20,'Mark entry committed','Before applying assignment'],['replay',530,20,'Replay committed entries','Rebuild model state'],['tail',275,190,'Uncommitted entries','Excluded from recovery']],
    edges: [['append','commit','commit selected entry'],['commit','replay','replay in log order'],['append','tail','not yet committed']],
  },
};

export const SYMPTOM_DIAGRAMS = {
  'low-cpu-slow-requests': 'symptomWaiting', 'query-slower-after-index': 'symptomIndex',
  'messages-processed-twice': 'symptomDuplicate', 'hashmap-entry-disappears': 'symptomMutableKey',
  'transaction-does-not-roll-back': 'symptomProxy', 'async-method-blocks-caller': 'symptomProxy',
  'request-sees-previous-user': 'symptomContext', 'concurrent-modification-single-thread': 'symptomIterator',
  'heap-grows-after-requests': 'symptomRetention', 'null-pointer-only-some-requests': 'symptomNull',
};
export const BUILD_DIAGRAMS = {
  'retry-scheduler': 'buildRetry', 'inverted-index': 'buildIndex',
  'connection-pool': 'buildPool', 'write-ahead-log': 'buildLog',
};
