/** Original, fictional incidents. Sources support mechanisms, not the invented measurements. */
export const DETECTIVE_REVIEWED_AT = "2026-09-17";
export const DETECTIVE_CASES = [
  {
    slug: "the-vanishing-map-entry", number: "01", topic: "Java", title: "The entry that vanished",
    description: "The map says it has one entry. The lookup says it has none. Where did the reservation go?",
    environment: "Java 17+ · HashMap · one thread",
    overview: "A reservation worker inserts a customer key, enriches the customer, then cannot retrieve the reservation. No other thread touches the map. Investigate before replacing the collection.",
    evidence: [
      { id: "logs", title: "Worker log", body: "10:14:01 put customer.id=1 -> reservation R-71\n10:14:02 enrichment customer.id=2\n10:14:03 map.size=1\n10:14:03 map.get(customer)=null\n10:14:03 key iteration: [id=2]", insight: "The entry remains in the map. A failed lookup is not evidence of a removal." },
      { id: "code", title: "Key implementation", body: "final class CustomerKey {\n  int id;\n  CustomerKey(int id) { this.id = id; }\n  public int hashCode() { return id; }\n  public boolean equals(Object other) {\n    return other instanceof CustomerKey k && id == k.id;\n  }\n}\nvar customer = new CustomerKey(1);\nmap.put(customer, \"R-71\");\ncustomer.id = 2;\nSystem.out.println(map.get(customer));", insight: "The field used for hashing and equality changes after insertion." },
      { id: "timeline", title: "Execution timeline", body: "Worker: single-threaded\nMap: new HashMap<CustomerKey, String>()\nEntries inserted: 1\nremove / clear calls: 0\nEnrichment changes the existing key object", insight: "There is no competing writer to explain a lost update." },
    ],
    diagnoses: [
      { id: "race", label: "A concurrent writer removed the entry", feedback: "The timeline excludes other writers, and iteration still sees the entry." },
      { id: "mutation", label: "The key changed after insertion", feedback: "Yes. Lookup computes the new hash, while the stored node retains the insertion hash." },
      { id: "collision", label: "A hash collision overwrote the entry", feedback: "There was only one insertion. HashMap also resolves collisions using equality; a collision alone does not overwrite an unequal key." },
    ], diagnosis: "mutation",
    fixes: [
      { id: "concurrent", label: "Switch to ConcurrentHashMap", feedback: "Thread safety does not make mutable equality fields safe as keys." },
      { id: "immutable", label: "Use an immutable reservation identity as the key", feedback: "Correct. Keep enrichment fields out of key equality and hashing." },
      { id: "capacity", label: "Increase the initial capacity", feedback: "Capacity does not restore the insertion hash when the key changes." },
    ], fix: "immutable",
    explanation: "Nothing was deleted. The key's hash changed from 1 to 2 after insertion. In this HashMap example, lookup misses the stored node even though iteration sees it. Use a stable identifier for the map key.",
    deep: "HashMap stores a hash with each entry and uses the lookup key's current hash to search. Mutating equality-relevant state while a key is stored violates the Map usage contract: the API does not specify general behavior for that situation. The exact failure shown here is a reproducible HashMap example, not a guarantee for every Map implementation.",
    tradeoff: "An immutable ID separates identity from editable customer details. If identity really must change, perform an explicit remove with the old key and insert with the new key; coordinate that transition when concurrent readers exist.",
    verification: "Add a regression test that changes customer details and can still find the reservation by its immutable ID. A Java 17+ executable fixture covers both the failure and the repair.",
    lab: { kind: "map", title: "Predict before you run", prompt: "What does this program print? Predict both lines, then run the trace.", code: "// After the insertion and mutation shown in the evidence:\nSystem.out.println(map.get(customer));\nSystem.out.println(map.size());", output: "null\n1", trace: "insert: hash 1 → stored node\nmutate: id 1 → 2\nlookup: hash 2 → no matching stored hash\nsize: still 1" },
    references: [{ label: "Java 21 Map contract: mutable keys", url: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html" }],
  },
  {
    slug: "the-rollback-that-never-happened", number: "02", topic: "Spring", title: "The rollback that never happened",
    description: "An exception escapes a payment transfer. One balance changed anyway. Follow the transaction boundary.",
    environment: "Spring Framework 6.2 · proxy transactions · JDBC",
    overview: "A transfer debits one account, throws an unchecked exception, and never credits the other. The method has @Transactional. The on-call engineer expects a rollback but sees a committed debit.",
    evidence: [
      { id: "trace", title: "Request trace", body: "Controller → TransferService proxy → submit()\nsubmit() → this.transfer()\ntransfer() → JDBC debit\ntransfer() → IllegalStateException (escapes to controller)", insight: "The annotated method is called inside the target object, not through its proxy." },
      { id: "code", title: "Service excerpt", body: "// Spring-managed bean; submit has no transaction annotation.\npublic void submit() { this.transfer(); }\n\n@Transactional\npublic void transfer() {\n  jdbc.update(DEBIT_SQL, amount, sourceId);\n  throw new IllegalStateException(\"injected failure\");\n}\n// DEBIT_SQL uses bound parameters.\n// No outer transaction; no custom rollback rules.", insight: "The exception type would trigger the default rollback rule if a transaction existed." },
      { id: "database", title: "Connection and transaction log", body: "Transaction management enabled: true\nAdvice mode: proxy\nAt transfer entry: actualTransactionActive=false\nConnection autoCommit=true\nDebit: committed\nLock wait: 0 ms", insight: "There was no active transaction around the debit to roll back." },
    ],
    diagnoses: [
      { id: "checked", label: "A checked exception avoided the rollback rule", feedback: "IllegalStateException is unchecked, and the trace says it escaped." },
      { id: "lock", label: "A database lock prevented rollback", feedback: "The log reports no lock wait and no active transaction." },
      { id: "proxy", label: "Self-invocation bypassed transaction advice", feedback: "Correct. In proxy mode, the internal call does not pass through the transaction interceptor." },
    ], diagnosis: "proxy",
    fixes: [
      { id: "boundary", label: "Move the transfer into a separate transactional bean and call it through injection", feedback: "Correct. The call crosses the proxy and starts the intended transaction." },
      { id: "public", label: "Make transfer public", feedback: "It is already public. Visibility does not reroute an internal call through the proxy." },
      { id: "catch", label: "Catch the exception and return success", feedback: "That hides the failure and still does not create the missing transaction." },
    ], fix: "boundary",
    explanation: "The annotation was present, but the call never crossed its transaction proxy. With no outer transaction, JDBC used auto-commit. Calling an injected transactional collaborator establishes the intended boundary.",
    deep: "In Spring's default proxy mode, self-invocation does not activate advice on the called method. If the outer method already has a transaction, an internal call can still execute within it; that is explicitly excluded here. AspectJ transaction weaving behaves differently. The chosen fix assumes a Spring-managed collaborator, enabled transaction management, and an unchecked exception escaping the transactional method.",
    tradeoff: "A separate service makes the boundary explicit but adds a collaborator. Keep remote calls outside long database transactions where possible. Database rollback cannot undo a charge already accepted by an external payment provider; that requires an idempotent workflow and compensation strategy.",
    verification: "In a Spring integration test, call the real injected service, inject the failure after debit, and assert both balances are unchanged. The interactive trace below is a teaching model, not a running Spring container.",
    lab: { kind: "transaction", title: "Trace the boundary", prompt: "Compare the two call paths. Assume no outer transaction and an escaping unchecked exception." },
    references: [{ label: "Spring 6.2: Using @Transactional", url: "https://docs.spring.io/spring/reference/6.2/data-access/transaction/declarative/annotations.html" }],
  },
  {
    slug: "the-service-that-drowned-in-retries", number: "03", topic: "Reliability", title: "The service that drowned in retries",
    description: "Traffic is flat. Downstream calls are not. Find what turned a short slowdown into an outage.",
    environment: "HTTP services · three retrying layers",
    overview: "A brief network slowdown clears, but the inventory service remains overloaded. Incoming user traffic is unchanged. The team is about to add replicas; first reconstruct how much work one request can create.",
    evidence: [
      { id: "metrics", title: "Traffic dashboard", body: "User arrivals: 100 requests/s (unchanged)\nInventory attempts: up to 2,700/s during sustained failures\nCPU before incident: 38%\nTimeouts: elevated\nOriginal network slowdown: cleared", insight: "The amplification occurs inside the request path, after users enter the system." },
      { id: "policy", title: "Retry policy", body: "Gateway → Orders → Inventory client → Inventory\nEach of the 3 calling layers:\n  maximum attempts = 3 (includes the first call)\n  retries immediately on timeout\n  no shared end-to-end budget\n  no jitter", insight: "Nested attempts multiply when every attempt fails and all budgets are exhausted." },
      { id: "trace", title: "One logical request", body: "request R-88\nGateway attempt 1 → Orders attempts 1,2,3\nEach Orders attempt → client attempts 1,2,3\nGateway repeats the whole tree twice more\nLeaf calls: 3 × 3 × 3 = 27", insight: "Repeated work keeps the service busy after the initiating fault clears." },
    ],
    diagnoses: [
      { id: "traffic", label: "A sudden increase in user traffic", feedback: "The edge arrival rate did not change." },
      { id: "amplification", label: "Retries multiplied across the call stack", feedback: "Correct. One request can exhaust 27 leaf attempts under the stated policy." },
      { id: "leak", label: "A memory leak caused all of the extra calls", feedback: "No heap evidence supports that explanation; the trace directly accounts for the calls." },
    ], diagnosis: "amplification",
    fixes: [
      { id: "timeout", label: "Double every timeout and keep all retries", feedback: "That can retain work longer while leaving amplification intact." },
      { id: "replicas", label: "Add replicas and leave retry policy unchanged", feedback: "Capacity may mitigate impact temporarily but does not bound per-request work." },
      { id: "budget", label: "Assign one retry owner, cap attempts, and add backoff with jitter", feedback: "Correct. Bound retries within the caller's deadline and stop retrying unsuitable failures." },
    ], fix: "budget",
    explanation: "Three attempts at each of three layers can produce 27 inventory calls. A timeout does not guarantee the original work stopped. Retry limits, backoff, jitter, and a single retry owner reduce the positive feedback loop.",
    deep: "The calculation is a worst-case attempt count, not a latency prediction. It assumes every attempt reaches the leaf, every call fails, no circuit breaker opens, and there is enough time to exhaust every budget. Real deadlines and partial successes can reduce the count. Jitter spreads attempts in time; it does not itself reduce the configured maximum number.",
    tradeoff: "Fewer retries can expose a transient failure to a user sooner, but preserve capacity for recovery. Retry only suitable failures within a deadline. For operations with side effects, use an idempotency contract because the first timed-out attempt may already have succeeded.",
    verification: "Fault-inject timeouts and count downstream attempts for one logical request. Verify the cap, deadline, and idempotency behavior. The calculator is deterministic and uses a worst-case model.",
    lab: { kind: "retry", title: "Turn the retry knobs", prompt: "Change total attempts per layer, including the original request. Compare nested retries with one retry owner." },
    references: [{ label: "AWS: control and limit retry calls", url: "https://docs.aws.amazon.com/wellarchitected/2023-04-10/framework/rel_mitigate_interaction_failure_limit_retries.html" }],
  },
  {
    slug: "the-cost-of-a-faster-query", number: "04", topic: "PostgreSQL", title: "The cost of a faster query",
    description: "The dashboard query is ten times faster. Order ingestion is slower. Both changes began together.",
    environment: "PostgreSQL 17 · write-heavy orders table",
    overview: "A team adds an index to fix a dashboard query. Reads improve, but ingestion misses its latency target. The index finished building yesterday; today's slowdown persists in steady state.",
    evidence: [
      { id: "metrics", title: "Before and after", body: "Synthetic replay, same workload:\nDashboard query p95: 240 ms → 24 ms\nInsert p95: 8 ms → 18 ms\nReads: 5/s; inserts: 500/s\nWAL bytes/s and storage writes increased", insight: "A win on an infrequent read can coexist with a cost on every insert. These are fictional incident measurements." },
      { id: "schema", title: "Migration and query", body: "CREATE INDEX orders_dashboard_idx\n  ON orders (tenant_id, status, created_at)\n  INCLUDE (total_cents);\n\nSELECT created_at, total_cents FROM orders\nWHERE tenant_id = $1 AND status = $2\nORDER BY created_at DESC LIMIT 50;", insight: "New rows must also be represented in the index; this is additional work beyond updating the table." },
      { id: "experiment", title: "Controlled replay", body: "Index build: completed 24 hours ago\nBlocking lock waits now: 0\nSame data, hardware, and arrival pattern\nWith index: insert p95 18 ms\nWithout index: insert p95 8 ms\nWithout index: dashboard p95 returns to 240 ms", insight: "The replay isolates steady-state index maintenance, rather than an ongoing build lock." },
    ],
    diagnoses: [
      { id: "maintenance", label: "Index maintenance added work to the write path", feedback: "Correct. The controlled replay and increased writes support this trade-off." },
      { id: "build", label: "The index build is still blocking inserts", feedback: "It completed yesterday and current blocking lock waits are zero." },
      { id: "unused", label: "PostgreSQL stopped using the index for reads", feedback: "The dashboard remains faster with the index; that does not explain the measured insert cost." },
    ], diagnosis: "maintenance",
    fixes: [
      { id: "more", label: "Index every column to make inserts faster", feedback: "Additional indexes generally add more maintenance to inserts." },
      { id: "measure", label: "Benchmark a narrower index or read-side alternative against both latency targets", feedback: "Correct. Preserve the useful query improvement only if its write cost fits the workload." },
      { id: "drop", label: "Drop all indexes immediately", feedback: "That can break constraints and unrelated query performance. Scope changes to the measured index and validate the regression." },
    ], fix: "measure",
    explanation: "The index accelerated the selected query and added maintenance to inserts. Those outcomes are compatible. Index decisions need the read/write workload and both service-level targets, not just one query plan.",
    deep: "PostgreSQL maintains indexes as table data changes. The incident's replay isolates that ongoing cost from build-time locking. A narrower or partial index may help only if it supports the actual query predicates. Validate with representative data and EXPLAIN (ANALYZE, BUFFERS) in a safe test environment; ANALYZE executes the statement.",
    tradeoff: "A read replica or materialized read model moves some read work but adds operations, lag, and possibly refresh cost; a physical replica still replays index changes. A smaller index saves space but may sacrifice covering-query benefits. Measure rather than assuming an alternative wins.",
    verification: "Replay the mixed workload and compare read p95, insert p95, WAL, and index size before changing production. The experiment below uses invented work units, not database timings or a PostgreSQL benchmark.",
    lab: { kind: "index", title: "Explore the workload", prompt: "An illustrative model: without the index, each read costs 10 work units and each write costs 1. With it, reads cost 1 and writes cost 2." },
    references: [{ label: "PostgreSQL 17: Introduction to indexes", url: "https://www.postgresql.org/docs/17/indexes-intro.html" }],
  },
  {
    slug: "the-report-from-another-tenant", number: "05", topic: "Caching", title: "The report from another tenant",
    description: "Two authorized customers open their own report. One sees the other's result. Trace the cache hit.",
    environment: "Shared cache · tenant-local report IDs",
    overview: "A support ticket reports the wrong organization name on a report. Authorization passed for both requests. The database query is tenant-scoped. The second request did not reach the database.",
    evidence: [
      { id: "trace", title: "Two request traces", body: "Tenant alder / report 42: authorized\n  GET report:42 → MISS\n  SELECT scoped to alder → Alder report\n  SET report:42 → Alder report\nTenant birch / report 42: authorized\n  GET report:42 → HIT → Alder report", insight: "Authorization allowed access to Birch's report, but the cache supplied a different tenant's data." },
      { id: "code", title: "Cache lookup", body: "const tenant = authenticatedIdentity.tenantId;\nawait authorizeReport(tenant, reportId);\nconst key = `report:${reportId}`;\nconst cached = await cache.get(key);\nif (cached) return cached;\nreturn loadAndCache(tenant, reportId, key);", insight: "Tenant identity reaches authorization and the database but not the cache key." },
      { id: "database", title: "Data and cache inventory", body: "Database keys: (tenant_id, report_id)\n(alder, 42) → Alder report\n(birch, 42) → Birch report\nShared cache namespace: report:<report_id>\nBrowser cache: disabled in reproduction", insight: "Report IDs are unique only within a tenant. The shared namespace collapses those distinct identities." },
    ],
    diagnoses: [
      { id: "browser", label: "The browser reused its last page", feedback: "The reproduction disables browser caching and records a server-side cache hit." },
      { id: "sql", label: "The second SQL query forgot the tenant predicate", feedback: "The second request never reached SQL." },
      { id: "namespace", label: "The cache key omitted tenant identity", feedback: "Correct. Both authorized requests use report:42 even though they refer to different resources." },
    ], diagnosis: "namespace",
    fixes: [
      { id: "ttl", label: "Reduce the cache TTL to one second", feedback: "That shortens exposure but still permits a cross-tenant hit." },
      { id: "scope", label: "Authorize each request and key the cache by trusted tenant plus report ID", feedback: "Correct. Use an unambiguous encoding and invalidate the old namespace during rollout." },
      { id: "query", label: "Accept tenant ID from an unverified query parameter", feedback: "That lets callers select someone else's namespace. Derive tenant identity from the authenticated, authorized context." },
    ], fix: "scope",
    explanation: "The database was scoped correctly; the cache was not. Include the trusted tenant identity in the cache key and authorize before every return, including hits. A unique key is not an authorization check.",
    deep: "An unambiguous tuple encoding such as JSON.stringify([tenantId, reportId]) avoids both missing tenant scope and delimiter collisions. Keep value serialization, expiry, invalidation, and tenant-specific authorization aligned with that identity. If report content varies by permission level, the cache design must account for that variation too.",
    tradeoff: "Tenant-scoped keys increase the number of entries. Separate caches provide stronger operational isolation at higher cost. Contain this fictional incident by disabling the unsafe cache path, invalidating old entries, and reviewing exposure; a key change does not retract data already returned.",
    verification: "Warm report 42 as Alder, fetch it as Birch, and assert a miss followed by Birch's value. Test unauthorized requests on warm caches and adversarial IDs with delimiters. The lab uses fictional data held only in memory.",
    lab: { kind: "cache", title: "Replay the two requests", prompt: "Choose a cache design. Alder warms report 42, then Birch requests its own report 42. Both requests are authorized in this model." },
    references: [{ label: "Microsoft: multitenant shared-cache isolation", url: "https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/service/managed-redis" }],
  },
];
export const DETECTIVE_STORAGE_PREFIX = "interviewiq.detective.v1.";
export function detectiveCase(slug) { return DETECTIVE_CASES.find(item => item.slug === slug); }
export function initialInvestigation() { return { inspected: [], diagnosis: "", fix: "", completed: false }; }
export function normalizeInvestigation(value, incident) {
  const data = value && typeof value === "object" ? value : {};
  const inspected = [...new Set(Array.isArray(data.inspected) ? data.inspected : [])].filter(id => incident.evidence.some(e => e.id === id));
  const diagnosis = inspected.length >= 2 && incident.diagnoses.some(d => d.id === data.diagnosis) ? data.diagnosis : "";
  const fix = diagnosis === incident.diagnosis && incident.fixes.some(f => f.id === data.fix) ? data.fix : "";
  return { inspected, diagnosis, fix, completed: data.completed === true && fix === incident.fix };
}
export function retryWork(attempts, layers, arrivals = 100) {
  const bounded = (value, max, min = 1) => Math.min(max, Math.max(min, Math.floor(Number(value) || min)));
  const a = bounded(attempts, 5); const l = bounded(layers, 3); const r = bounded(arrivals, 10000, 0);
  return { perRequest: a ** l, nested: r * a ** l, singleOwner: r * a };
}
export function indexWork(readPercent) {
  const reads = Math.min(100, Math.max(0, Number(readPercent) || 0)); const writes = 100 - reads;
  return { without: reads * 10 + writes, with: reads + writes * 2 };
}
export function tenantCacheKey(tenantId, reportId) { return JSON.stringify([String(tenantId), String(reportId)]); }
export function replayTenantCache(scoped) {
  const cache = new Map();
  const key = tenant => scoped ? tenantCacheKey(tenant, "42") : "report:42";
  cache.set(key("alder"), "Alder report");
  const hit = cache.has(key("birch"));
  return { hit, returned: hit ? cache.get(key("birch")) : "Birch report", alderKey: key("alder"), birchKey: key("birch") };
}
