import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildCanvasMockPrompt,
  buildCanvasReviewPrompt,
  buildSystemDesignDiagramBoard,
  buildSystemDesignDiagramEvaluationPrompt,
  buildSystemDesignReferenceRoadmap,
  buildSystemDesignStudioBlueprint,
  buildSystemDesignStudioPrompt,
  createSystemDesignCanvasState,
  exportSystemDesignCanvasMarkdown,
  SYSTEM_DESIGN_LEARNING_CATALOG,
  SYSTEM_DESIGN_PATTERN_LIBRARY,
  SYSTEM_DESIGN_CANVAS_SECTIONS,
  SYSTEM_DESIGN_INTERVIEW_PRACTICE_CATALOG,
  buildSystemDesignInterviewPracticeTemplate,
} from "../../lib/systemDesignCanvas.mjs";
import BeginnerGuideBanner from "../BeginnerGuideBanner";

const wrappingTextStyle = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const wrappingCodeStyle = {
  ...wrappingTextStyle,
  display: "block",
  maxWidth: "100%",
  whiteSpace: "pre-wrap",
};

const responsiveGrid = (minColumnWidth, gap = 9) => ({
  display: "grid",
  gap,
  gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minColumnWidth}px), 1fr))`,
  minWidth: 0,
});

const PLAYBACK_SPEEDS = [
  { label: "Slow", value: 1800 },
  { label: "Normal", value: 1200 },
  { label: "Fast", value: 700 },
];

function ActionButton({ icon, label, onClick, tone = "#8bd3ff" }) {
  return (
    <button
      type="button"
      className="glass-button"
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{
        alignItems: "center",
        border: `1px solid ${tone}55`,
        borderRadius: 7,
        color: "#f8fbff",
        display: "inline-flex",
        fontSize: 11,
        fontWeight: 700,
        gap: 6,
        lineHeight: 1,
        maxWidth: "100%",
        minHeight: 30,
        padding: "7px 10px",
        whiteSpace: "nowrap",
      }}
    >
      <i className={`ti ${icon}`} style={{ color: tone, fontSize: 14 }} />
      {label}
    </button>
  );
}

function ListPanel({ title, icon, items, accent, children }) {
  return (
    <section style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 11, background: "rgba(255,255,255,.035)", minWidth: 0, overflow: "hidden" }}>
      <h3 style={{ ...wrappingTextStyle, alignItems: "center", color: "#f8fbff", display: "flex", fontSize: 12.5, gap: 7, marginBottom: 8 }}>
        <i className={`ti ${icon}`} style={{ color: accent }} />
        {title}
      </h3>
      {children || (
        <ul style={{ ...wrappingTextStyle, color: "#9fb0c7", display: "grid", fontSize: 11.5, gap: 6, lineHeight: 1.45, margin: 0, paddingLeft: 17 }}>
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
    </section>
  );
}

const SYSTEM_SCENARIOS = [
  {
    id: "cache-hit",
    label: "Cache hit",
    path: ["client", "gateway", "controller", "service", "cache", "observability"],
    symptom: "The hot read returns from cache, so DB and MQ stay out of the synchronous path.",
    teaching: "Say the cache key, TTL, freshness tolerance, and the fallback path if the value is missing.",
    recovery: "Still emit metrics for hit rate and stale reads; a high hit rate is only useful if the data is safe to serve.",
  },
  {
    id: "cache-miss",
    label: "Cache miss",
    path: ["client", "gateway", "controller", "service", "cache", "index", "db", "cache", "observability"],
    symptom: "The cache has no value, so the service queries DB through the right index and refills cache.",
    teaching: "Explain cache-aside: read cache, miss, query source of truth, set value with TTL, return response.",
    recovery: "Protect the DB with request coalescing, short TTLs for negative results, and stampede prevention.",
  },
  {
    id: "db-slow",
    label: "DB slow",
    path: ["client", "gateway", "controller", "service", "index", "db", "observability"],
    symptom: "Latency spikes because the query scans too much data or waits on locks.",
    teaching: "Connect access pattern to index order, selectivity, pagination, and transaction duration.",
    recovery: "Inspect query plan, add or reshape composite index, move heavy reads to replicas, and alert on p95.",
  },
  {
    id: "queue-lag",
    label: "Queue lag",
    path: ["client", "gateway", "controller", "service", "db", "mq", "worker", "observability"],
    symptom: "The user gets a response, but async work falls behind and freshness drops.",
    teaching: "Separate request latency from background completion and name the user-visible consistency promise.",
    recovery: "Scale workers, tune batch size, add backoff, watch DLQ, and shed low-priority jobs if needed.",
  },
  {
    id: "worker-failure",
    label: "Worker failure",
    path: ["mq", "worker", "mq", "observability"],
    symptom: "Messages retry because the worker crashes or a downstream dependency fails.",
    teaching: "At-least-once delivery means the worker must be idempotent and safe to retry.",
    recovery: "Use retry budgets, poison-message isolation, DLQ replay, idempotency keys, and dependency alerts.",
  },
  {
    id: "duplicate-request",
    label: "Duplicate request",
    path: ["client", "gateway", "controller", "service", "db", "observability"],
    symptom: "The same command arrives twice from retries, double clicks, or network uncertainty.",
    teaching: "Use an idempotency key and unique constraint so the operation completes once.",
    recovery: "Return the stored result for repeated keys and make side effects publish only after the winning commit.",
  },
  {
    id: "rate-limited",
    label: "Rate limited",
    path: ["client", "gateway", "observability"],
    symptom: "The gateway rejects excess traffic before it consumes app, cache, or DB capacity.",
    teaching: "Rate limits protect shared systems; explain user key, IP key, burst size, and retry-after behavior.",
    recovery: "Return 429, log abuse signals, expose retry-after, and keep dashboards for limit saturation.",
  },
];

const FAILURE_RECOVERY_CASES = [
  {
    id: "retries",
    label: "Retries",
    steps: ["Detect transient failure", "Retry with exponential backoff", "Stop at retry budget", "Surface error or enqueue recovery"],
    lesson: "Retries help only when bounded; unbounded retries create traffic storms.",
  },
  {
    id: "idempotency",
    label: "Idempotency keys",
    steps: ["Client sends key", "Service checks prior result", "Unique DB constraint wins", "Duplicate returns stored response"],
    lesson: "Idempotency turns uncertain retries into one safe operation.",
  },
  {
    id: "outbox",
    label: "Outbox pattern",
    steps: ["Write business row", "Write outbox row in same transaction", "Publisher sends event", "Mark event delivered"],
    lesson: "Outbox prevents the classic DB commit succeeded but event publish failed gap.",
  },
  {
    id: "dlq",
    label: "DLQ",
    steps: ["Worker fails repeatedly", "Message exceeds retry budget", "Move to DLQ", "Alert and replay after fix"],
    lesson: "A dead-letter queue keeps poison messages from blocking healthy work.",
  },
  {
    id: "rollback",
    label: "Rollback",
    steps: ["Detect failed step", "Undo local transaction", "Run compensating action", "Record audit trail"],
    lesson: "Rollback is simple inside one DB transaction; distributed workflows often need compensation.",
  },
  {
    id: "cache-race",
    label: "Cache invalidation race",
    steps: ["Write DB", "Delete cache", "Concurrent reader refills stale value", "Use version or delayed double delete"],
    lesson: "Cache invalidation needs a race story, not just a delete call.",
  },
  {
    id: "eventual",
    label: "Eventual consistency",
    steps: ["Commit source of truth", "Publish event", "Read model catches up", "UI shows pending or stale state safely"],
    lesson: "Eventual consistency is acceptable when the user experience names the freshness promise.",
  },
];

const INDEX_QUERY_CASES = [
  {
    id: "works",
    label: "Works well",
    query: "WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
    index: "(user_id, created_at)",
    verdict: "Excellent fit",
    explanation: "The B-tree can jump to one user's range, then read newest rows in index order.",
    scan: ["Root: user_id range", "Branch: matching user_id", "Leaf: created_at descending", "Stop after LIMIT 20"],
  },
  {
    id: "partial",
    label: "Partial fit",
    query: "WHERE user_id = ? AND status = ? ORDER BY created_at DESC",
    index: "(user_id, created_at)",
    verdict: "Needs filtering",
    explanation: "The index finds the user quickly, but status is not in the index prefix, so extra rows are filtered.",
    scan: ["Root: user_id range", "Leaf: created_at order", "Filter: status", "Consider (user_id, status, created_at)"],
  },
  {
    id: "wrong-order",
    label: "Wrong order",
    query: "WHERE created_at > ? ORDER BY user_id",
    index: "(user_id, created_at)",
    verdict: "Poor fit",
    explanation: "The leading column is user_id, so a range only on created_at cannot use the index efficiently.",
    scan: ["Cannot seek by created_at first", "Many user_id ranges scanned", "Sort may be needed", "Consider (created_at, user_id)"],
  },
  {
    id: "write-cost",
    label: "Write trade-off",
    query: "INSERT new activity row",
    index: "(user_id, created_at)",
    verdict: "Read speed costs writes",
    explanation: "Every insert also updates the index, so each extra index improves reads but slows writes and uses storage.",
    scan: ["Insert table row", "Update B-tree leaf", "Maybe split page", "Replicate index change"],
  },
];

const SYSTEM_PRACTICE_TEMPLATES = [
  {
    id: "url-shortener",
    label: "URL shortener",
    problem: "Design URL Shortener",
    sections: {
      requirements: "Shorten long URLs, redirect quickly, support custom aliases, track basic analytics.",
      architecture: "Client -> Gateway -> Link Controller -> Link Service -> Cache -> Link DB -> Analytics Queue -> Worker.",
      data: "links(code, original_url, owner_id, expires_at, created_at), indexes on code and owner_id_created_at.",
      scaling: "Cache hot redirects, pre-generate codes, shard by code prefix, async analytics.",
      risks: "Hot links, malicious URLs, custom alias conflicts, cache staleness, analytics lag.",
    },
  },
  {
    id: "ticket-booking",
    label: "Ticket booking",
    problem: "Implement Ticket Booking System",
    sections: {
      requirements: "Search events, hold seats, reserve inventory, pay, confirm booking, notify user.",
      architecture: "Gateway -> Booking Controller -> Inventory Service -> Reservation DB -> Payment Adapter -> Notification Queue.",
      data: "seats(event_id, seat_id, status, hold_expires_at), reservations(user_id, event_id, status), unique index on event_id_seat_id.",
      scaling: "Use seat holds, optimistic locking, short TTL cache for seat maps, async notifications.",
      risks: "Double booking, payment timeout, hold expiry race, hot events, queue retry duplication.",
    },
  },
  {
    id: "chat",
    label: "Chat",
    problem: "Design Chat System",
    sections: {
      requirements: "Send messages, show conversation history, deliver realtime updates, support read receipts.",
      architecture: "Client -> Gateway -> Message Controller -> Chat Service -> Message DB -> Fanout Queue -> WebSocket Workers.",
      data: "messages(conversation_id, message_id, sender_id, created_at), index on conversation_id_created_at.",
      scaling: "Partition by conversation, cache recent messages, use queue fanout, track delivery separately.",
      risks: "Ordering, duplicate sends, offline delivery, hot group chats, eventual read receipts.",
    },
  },
  {
    id: "feed",
    label: "Social feed",
    problem: "Design Social Feed",
    sections: {
      requirements: "Post content, follow users, build home feed, rank recent items, notify followers.",
      architecture: "Post Controller -> Feed Service -> Post DB -> Fanout Queue -> Feed Cache -> Ranking Worker.",
      data: "posts(author_id, post_id, created_at), follows(follower_id, followee_id), feed_items(user_id, score, created_at).",
      scaling: "Fanout-on-write for normal users, fanout-on-read for celebrities, cache home timelines.",
      risks: "Celebrity accounts, ranking freshness, cache invalidation, queue lag, backfill correctness.",
    },
  },
  {
    id: "payment",
    label: "Payment",
    problem: "Design Payment Workflow",
    sections: {
      requirements: "Authorize payment, capture funds, handle retries, refunds, webhooks, and audit trails.",
      architecture: "Payment Controller -> Payment Service -> Idempotency Store -> Provider Adapter -> Payment DB -> Event Queue.",
      data: "payments(idempotency_key, user_id, status, amount, provider_ref), unique index on idempotency_key.",
      scaling: "Keep provider calls isolated, use outbox events, reconcile async webhooks, cache no critical money state.",
      risks: "Duplicate charge, provider timeout, webhook replay, partial failure, audit and compliance.",
    },
  },
  {
    id: "notification",
    label: "Notification",
    problem: "Design Notification System",
    sections: {
      requirements: "Send email, push, and in-app notifications with preferences and retries.",
      architecture: "Notification API -> Preference Service -> Template Service -> Queue -> Channel Workers -> Delivery Log DB.",
      data: "notification_jobs(user_id, channel, status, next_retry_at), index on status_next_retry_at.",
      scaling: "Queue by channel, batch sends, cache preferences, backoff failed providers.",
      risks: "Provider outage, duplicate sends, user opt-out race, queue backlog, template rollback.",
    },
  },
  {
    id: "search-autocomplete",
    label: "Search autocomplete",
    problem: "Design Search Autocomplete",
    sections: {
      requirements: "Return low-latency suggestions as users type, personalize lightly, update popular queries.",
      architecture: "Client -> Gateway -> Suggest Controller -> Suggest Service -> Prefix Cache -> Search Index -> Update Queue.",
      data: "suggestions(prefix, term, score, locale), index on prefix_score and locale_prefix.",
      scaling: "Cache top prefixes, precompute popular suggestions, async index refresh, regional replicas.",
      risks: "Stale suggestions, typo handling, hot prefixes, index rebuild lag, personalization privacy.",
    },
  },
];

function getPlaybackSpeedLabel(value) {
  return PLAYBACK_SPEEDS.find((item) => item.value === value)?.label || "Normal";
}

function buildImplementationTimeline(blueprint) {
  const classPrefix = buildJavaClassPrefix(blueprint);
  return [
    {
      id: "schema",
      title: "Schema creation",
      icon: "ti-database-plus",
      detail: "Define durable entities, ownership, statuses, timestamps, and transactional boundaries before writing service code.",
      artifact: `${classPrefix.toLowerCase()}_schema.sql`,
      output: "Source-of-truth tables and constraints exist before the request path starts using them.",
    },
    {
      id: "index",
      title: "Index selection",
      icon: "ti-list-search",
      detail: "Choose composite indexes from real read patterns, ordering needs, uniqueness, and expected write volume.",
      artifact: `CREATE INDEX idx_${classPrefix.toLowerCase()}_access_pattern`,
      output: "Hot reads use a predictable query plan instead of accidental full scans.",
    },
    {
      id: "endpoint",
      title: "Endpoint wiring",
      icon: "ti-api",
      detail: "Create routes, DTO validation, auth checks, idempotency keys, and consistent status/error mapping.",
      artifact: `${classPrefix}Controller.handle(requestDto)`,
      output: "External requests enter through a stable HTTP contract with safe validation.",
    },
    {
      id: "service",
      title: "Service orchestration",
      icon: "ti-server",
      detail: "Implement business invariants, transactions, repository calls, cache reads/writes, and sync-vs-async branching.",
      artifact: `${classPrefix}Service.execute(command)`,
      output: "Business rules run in one place with a clear transaction boundary.",
    },
    {
      id: "events",
      title: "Event flow",
      icon: "ti-messages",
      detail: "Publish durable outbox events, run workers, retry safely, dedupe messages, and update derived views or notifications.",
      artifact: `${classPrefix}EventPublisher.publishOutboxEvents()`,
      output: "Slow side effects leave the request path while staying reliable and replayable.",
    },
    {
      id: "runtime",
      title: "Deployment/runtime path",
      icon: "ti-rocket",
      detail: "Wire logs, metrics, traces, dashboards, health checks, rollout strategy, and operational alerts before production traffic.",
      artifact: "dashboards + alerts + rollout checklist",
      output: "The system is observable, operable, and safe to release under real traffic.",
    },
  ];
}

function scoreDrillAnswer(answer, expectedPoints) {
  const normalized = answer.toLowerCase();
  return expectedPoints.map((point) => ({
    ...point,
    matched: point.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())),
  }));
}

function mermaidLabel(value) {
  return String(value || "").replaceAll('"', "'");
}

function buildMermaidDiagram(blueprint, mode = "hld", scenario = SYSTEM_SCENARIOS[0]) {
  const serviceName = blueprint?.hld?.services?.[0]?.name || "Application Service";
  if (mode === "lld") {
    return [
      "flowchart LR",
      "  Controller[\"Controller\"] --> Service[\"Service\"]",
      "  Service --> CacheClient[\"CacheClient\"]",
      "  Service --> Repository[\"Repository\"]",
      "  Repository --> Index[\"DB Index\"]",
      "  Index --> Database[\"Database\"]",
      "  Service --> EventPublisher[\"EventPublisher\"]",
      "  EventPublisher --> Queue[\"Message Queue\"]",
      "  Queue --> Worker[\"Worker\"]",
      "  Worker --> Operations[\"Logs, Metrics, Traces\"]",
    ].join("\n");
  }

  const scenarioNodeMap = {
    client: "Client",
    gateway: "Gateway",
    controller: "Controller",
    service: "Service",
    cache: "Cache",
    index: "Index",
    db: "Database",
    mq: "Queue",
    worker: "Worker",
    invalidation: "Invalidation",
    observability: "Observability",
  };
  const scenarioEdges = scenario?.path?.length
    ? scenario.path.slice(0, -1).map((step, index) => `  ${scenarioNodeMap[step] || "Service"} -. "${mermaidLabel(scenario.label)}" .-> ${scenarioNodeMap[scenario.path[index + 1]] || "Service"}`)
    : [];

  return [
    "flowchart LR",
    "  Client[\"Client\"] --> Gateway[\"API Gateway\"]",
    "  Gateway --> Controller[\"Controller\"]",
    `  Controller --> Service["${mermaidLabel(serviceName)}"]`,
    "  Service --> Cache[\"Cache\"]",
    "  Cache --> Index[\"DB Index\"]",
    "  Index --> Database[\"Database\"]",
    "  Service --> Queue[\"Message Queue\"]",
    "  Queue --> Worker[\"Worker\"]",
    "  Service --> Invalidation[\"Cache Invalidation\"]",
    "  Worker --> Observability[\"Observability\"]",
    "  Service --> Observability",
    ...scenarioEdges,
  ].join("\n");
}

function buildJavaClassPrefix(blueprint) {
  const raw = blueprint?.problem || blueprint?.title || "Application";
  const cleaned = raw
    .replace(/\b(design|implement|system|workflow|service)\b/gi, " ")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean).slice(0, 3);
  return words.length
    ? words.map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`).join("")
    : "Application";
}

function buildArchitectureFlow(blueprint) {
  const serviceNames = (blueprint?.hld?.services || []).map((service) => service.name);
  const storage = (blueprint?.lld?.schema || []).length ? "Primary DB" : "Storage";
  const service = serviceNames[0] || "Application Service";
  return [
    {
      id: "client",
      label: "Client",
      icon: "ti-device-laptop",
      phase: "entry",
      detail: "User action creates a request with headers, auth token, payload, timeout, and retry behavior.",
      teacher: "Start by saying who calls the system, what they send, and what answer they expect.",
      interviewCue: "Define request shape, idempotency key, timeout, and mobile/web retry behavior.",
      drillPoints: [
        { label: "Request shape", keywords: ["request", "payload", "headers"] },
        { label: "Timeout/retry behavior", keywords: ["timeout", "retry"] },
        { label: "Idempotency when needed", keywords: ["idempotency", "idempotent", "duplicate"] },
      ],
    },
    {
      id: "gateway",
      label: "API Gateway",
      icon: "ti-shield-lock",
      phase: "edge",
      detail: "Terminates TLS, authenticates, rate limits, routes, applies request size limits, and adds trace IDs.",
      teacher: "The gateway protects the inside of the system before business logic runs.",
      interviewCue: "Mention auth, throttling, routing, versioning, request correlation, and edge caching when useful.",
      drillPoints: [
        { label: "Auth and routing", keywords: ["auth", "route", "routing"] },
        { label: "Rate limiting", keywords: ["rate", "limit", "throttle"] },
        { label: "Trace ID", keywords: ["trace", "correlation"] },
      ],
    },
    {
      id: "controller",
      label: "Controller",
      icon: "ti-route",
      phase: "api",
      detail: "Parses the route, validates DTOs, maps errors, and delegates to services without owning business rules.",
      teacher: "The controller is a traffic director; it should not become the place where all decisions live.",
      interviewCue: "Call out validation, status codes, request DTOs, response DTOs, and consistent error handling.",
      drillPoints: [
        { label: "DTO validation", keywords: ["dto", "validate", "validation"] },
        { label: "Thin controller", keywords: ["thin", "delegate", "service"] },
        { label: "Status/error mapping", keywords: ["status", "error", "response"] },
      ],
    },
    {
      id: "service",
      label: service,
      icon: "ti-server",
      phase: "business",
      detail: "Owns business rules, permissions, orchestration, transactions, and calls cache, repository, or MQ clients.",
      teacher: "The service answers: what must be true before this operation is allowed to happen?",
      interviewCue: "Explain invariants, transaction boundary, retries, circuit breakers, and dependency order.",
      drillPoints: [
        { label: "Business invariants", keywords: ["invariant", "rule", "permission"] },
        { label: "Transaction boundary", keywords: ["transaction", "commit"] },
        { label: "Dependency order", keywords: ["order", "orchestrate", "dependency"] },
      ],
    },
    {
      id: "cache",
      label: "Cache",
      icon: "ti-bolt",
      phase: "speed",
      detail: "Checks hot keys, TTLs, read-through/cache-aside behavior, negative caching, and stampede protection.",
      teacher: "Cache is a speed layer, not the source of truth. Always say how it refreshes or expires.",
      interviewCue: "Name cache key, TTL, hit/miss path, eviction, invalidation, and stale-read tolerance.",
      drillPoints: [
        { label: "Cache key and TTL", keywords: ["key", "ttl"] },
        { label: "Hit/miss path", keywords: ["hit", "miss"] },
        { label: "Invalidation/staleness", keywords: ["invalidate", "stale", "fresh"] },
      ],
    },
    {
      id: "index",
      label: "DB Index",
      icon: "ti-list-search",
      phase: "lookup",
      detail: "Narrows the scan using equality/range columns, sort order, selectivity, and query-plan awareness.",
      teacher: "Indexes are how the database avoids searching every row when the request needs one slice of data.",
      interviewCue: "Connect access pattern to composite index order, write overhead, cardinality, and pagination.",
      drillPoints: [
        { label: "Access pattern", keywords: ["access", "query", "filter"] },
        { label: "Composite index order", keywords: ["composite", "order", "prefix"] },
        { label: "Write overhead", keywords: ["write", "storage", "overhead"] },
      ],
    },
    {
      id: "db",
      label: storage,
      icon: "ti-database",
      phase: "truth",
      detail: "Persists durable state with constraints, transactions, isolation level, replication, and backup strategy.",
      teacher: "This is the source of truth. If cache and DB disagree, the DB usually wins.",
      interviewCue: "Discuss schema, constraints, transactions, consistency, replicas, sharding, and migration safety.",
      drillPoints: [
        { label: "Source of truth", keywords: ["truth", "durable", "persist"] },
        { label: "Constraints/transactions", keywords: ["constraint", "transaction", "isolation"] },
        { label: "Scale choice", keywords: ["replica", "shard", "migration"] },
      ],
    },
    {
      id: "mq",
      label: "Message Queue",
      icon: "ti-messages",
      phase: "async",
      detail: "Stores side-effect work for email, notifications, search indexing, analytics, or downstream fanout.",
      teacher: "Queues keep the user request fast by moving slow work to a reliable background path.",
      interviewCue: "Mention outbox, delivery semantics, ordering, retries, backoff, dead-letter queue, and lag.",
      drillPoints: [
        { label: "Async side effects", keywords: ["async", "side effect", "fanout"] },
        { label: "Delivery semantics", keywords: ["at-least-once", "delivery", "ordering"] },
        { label: "Retries and DLQ", keywords: ["retry", "dlq", "dead-letter"] },
      ],
    },
    {
      id: "worker",
      label: "Worker",
      icon: "ti-settings-automation",
      phase: "background",
      detail: "Consumes messages, performs side effects, deduplicates jobs, retries safely, and records progress.",
      teacher: "A worker must be safe to run twice because real systems retry when networks fail.",
      interviewCue: "Call out idempotency, poison messages, batch size, concurrency, and operational ownership.",
      drillPoints: [
        { label: "Idempotent processing", keywords: ["idempotent", "idempotency", "dedupe"] },
        { label: "Retry safety", keywords: ["retry", "poison", "dlq"] },
        { label: "Concurrency/batch tuning", keywords: ["batch", "concurrency", "parallel"] },
      ],
    },
    {
      id: "invalidation",
      label: "Cache Invalidation",
      icon: "ti-refresh",
      phase: "freshness",
      detail: "Deletes or refreshes affected keys after writes so future reads do not serve stale data forever.",
      teacher: "Every write path needs a freshness answer: update cache, delete cache, or accept staleness.",
      interviewCue: "Explain write-through vs cache-aside, event-based invalidation, TTL fallback, and race handling.",
      drillPoints: [
        { label: "Freshness strategy", keywords: ["fresh", "stale", "ttl"] },
        { label: "Delete/update cache", keywords: ["delete", "update", "invalidate"] },
        { label: "Race handling", keywords: ["race", "version", "double delete"] },
      ],
    },
    {
      id: "observability",
      label: "Observability",
      icon: "ti-activity",
      phase: "operate",
      detail: "Traces the request, logs structured events, emits metrics, alerts on latency, errors, cache misses, and queue lag.",
      teacher: "If production breaks, observability is how the team finds the failing hop quickly.",
      interviewCue: "Add trace IDs, RED metrics, SLOs, dashboards, alarms, slow-query logs, and DLQ monitoring.",
      drillPoints: [
        { label: "Trace/log/metrics", keywords: ["trace", "log", "metric"] },
        { label: "SLO and alerts", keywords: ["slo", "alert", "dashboard"] },
        { label: "Failure signals", keywords: ["latency", "queue lag", "slow query", "error"] },
      ],
    },
  ];
}

function ArchitectureFlow({ blueprint, activeIndex, accent, onSelectStep, selectedScenarioId, onScenarioSelect }) {
  const [drillAnswer, setDrillAnswer] = useState("");
  const [scenarioCursor, setScenarioCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(PLAYBACK_SPEEDS[1].value);
  const steps = buildArchitectureFlow(blueprint);
  const activePosition = activeIndex % steps.length;
  const active = steps[activePosition] || steps[0];
  const selectedScenario = SYSTEM_SCENARIOS.find((scenario) => scenario.id === selectedScenarioId) || SYSTEM_SCENARIOS[0];
  const scenarioStepSet = new Set(selectedScenario.path);
  const drillScore = scoreDrillAnswer(drillAnswer, active.drillPoints || []);
  const bottleneck = blueprint?.hld?.risks?.[0] || "Watch the highest-contention write path.";
  const tradeoff = blueprint?.hld?.scaling?.[0] || "Use cache and queues carefully; keep critical writes durable.";
  const failurePaths = [
    "Cache miss: go to DB through the right DB index, then refill the cache with a bounded TTL.",
    "Slow query: inspect query plan, composite index order, pagination, and whether the read belongs on a replica.",
    "Queue lag: autoscale workers, tune batch size, watch retries, and move poison messages to a DLQ.",
  ];
  const moveScenarioStep = useCallback((direction, wrap = true) => {
    const nextCursor = (scenarioCursor + direction + selectedScenario.path.length) % selectedScenario.path.length;
    if (!wrap) {
      if (direction > 0 && scenarioCursor >= selectedScenario.path.length - 1) return false;
      if (direction < 0 && scenarioCursor <= 0) return false;
    }
    const nextStepId = selectedScenario.path[nextCursor];
    const nextStepIndex = steps.findIndex((step) => step.id === nextStepId);
    setScenarioCursor(nextCursor);
    if (nextStepIndex >= 0) onSelectStep?.(nextStepIndex);
    return true;
  }, [onSelectStep, scenarioCursor, selectedScenario.path, steps]);
  const rewindScenario = () => {
    setPlaying(false);
    setScenarioCursor(0);
    const firstStepIndex = steps.findIndex((step) => step.id === selectedScenario.path[0]);
    if (firstStepIndex >= 0) onSelectStep?.(firstStepIndex);
  };
  const scenarioEvents = selectedScenario.path.map((stepId, index) => {
    const step = steps.find((item) => item.id === stepId);
    return {
      id: `${selectedScenario.id}-${stepId}-${index}`,
      label: step?.label || stepId,
      detail: step?.detail || selectedScenario.teaching,
      active: index === scenarioCursor,
      complete: index < scenarioCursor,
    };
  });

  useEffect(() => {
    setDrillAnswer("");
  }, [active.id]);

  useEffect(() => {
    setScenarioCursor(0);
    setPlaying(false);
  }, [selectedScenario.id]);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      const advanced = moveScenarioStep(1, false);
      if (!advanced) setPlaying(false);
    }, speed);
    return () => window.clearInterval(timer);
  }, [moveScenarioStep, playing, speed]);

  return (
    <section style={{ border: `1px solid ${accent}30`, borderRadius: 8, background: "rgba(0,0,0,.16)", display: "grid", gap: 11, padding: 11 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Request Lifecycle Studio</div>
          <p style={{ color: "#9fb0c7", fontSize: 11.4, lineHeight: 1.45, marginTop: 4 }}>Client to API Gateway, Controller, Service, Cache, DB Index, Database, MQ, Worker, Cache Invalidation, Observability.</p>
        </div>
        <span style={{ color: "#a7f3d0", fontSize: 10.8, fontWeight: 900 }}>{activePosition + 1}/{steps.length} {active.label}</span>
      </div>

      <div style={{ background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 9, padding: 10 }}>
        <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <strong style={{ color: "#f8fbff", fontSize: 12 }}>HLD Request Playback</strong>
            <p style={{ color: "#9fb0c7", fontSize: 11.1, lineHeight: 1.4, marginTop: 3 }}>{selectedScenario.symptom}</p>
          </div>
          <span style={{ color: "#fde68a", fontSize: 10.8, fontWeight: 900 }}>{selectedScenario.label}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SYSTEM_SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => {
                onScenarioSelect?.(scenario.id);
                setScenarioCursor(0);
                const firstStep = steps.findIndex((step) => step.id === scenario.path[0]);
                if (firstStep >= 0) onSelectStep?.(firstStep);
              }}
              style={{
                background: selectedScenario.id === scenario.id ? `${accent}18` : "rgba(0,0,0,.16)",
                border: `1px solid ${selectedScenario.id === scenario.id ? accent : "rgba(255,255,255,.08)"}`,
                borderRadius: 999,
                color: selectedScenario.id === scenario.id ? "#f8fbff" : "#9fb0c7",
                cursor: "pointer",
                fontSize: 10.5,
                fontWeight: 850,
                padding: "6px 9px",
              }}
            >
              {scenario.label}
            </button>
          ))}
        </div>
        <div style={{ alignItems: "center", display: "flex", gap: 6, flexWrap: "wrap" }}>
          <ActionButton icon={playing ? "ti-player-pause" : "ti-player-play"} label={playing ? "Pause Playback" : "Play Playback"} onClick={() => setPlaying((value) => !value)} tone={accent} />
          <ActionButton icon="ti-player-track-prev-filled" label="Rewind Playback" onClick={rewindScenario} tone="#c4b5fd" />
          <ActionButton icon="ti-chevron-left" label="Previous Scenario Step" onClick={() => { setPlaying(false); moveScenarioStep(-1); }} tone="#a7f3d0" />
          <span style={{ color: "#a7f3d0", fontSize: 10.8, fontWeight: 900 }}>{scenarioCursor + 1}/{selectedScenario.path.length} {selectedScenario.path[scenarioCursor]}</span>
          <ActionButton icon="ti-chevron-right" label="Next Scenario Step" onClick={() => { setPlaying(false); moveScenarioStep(1); }} tone="#a7f3d0" />
          <label style={{ alignItems: "center", color: "#dbeafe", display: "flex", gap: 7, fontSize: 10.5, fontWeight: 850 }}>
            Speed control
            <input
              aria-label="HLD playback speed"
              type="range"
              min="0"
              max={PLAYBACK_SPEEDS.length - 1}
              value={PLAYBACK_SPEEDS.findIndex((item) => item.value === speed)}
              onChange={(event) => setSpeed(PLAYBACK_SPEEDS[Number(event.target.value)]?.value || PLAYBACK_SPEEDS[1].value)}
              style={{ accentColor: accent, flex: "1 1 110px" }}
            />
            <span style={{ color: accent }}>{getPlaybackSpeedLabel(speed)}</span>
          </label>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {selectedScenario.path.map((stepId, index) => (
            <span key={`${stepId}-${index}`} style={{ background: index === scenarioCursor ? "rgba(167,243,208,.16)" : "rgba(0,0,0,.16)", border: `1px solid ${index === scenarioCursor ? "rgba(167,243,208,.38)" : "rgba(255,255,255,.08)"}`, borderRadius: 999, color: index === scenarioCursor ? "#d1fae5" : "#9fb0c7", fontSize: 10.1, fontWeight: 850, padding: "4px 7px" }}>
              {index + 1}. {stepId}
            </span>
          ))}
        </div>
        <div style={responsiveGrid(230, 8)}>
          <div style={{ color: "#dbeafe", fontSize: 11.2, lineHeight: 1.45 }}><strong style={{ color: "#f8fbff" }}>Teaching path:</strong> {selectedScenario.teaching}</div>
          <div style={{ color: "#d1fae5", fontSize: 11.2, lineHeight: 1.45 }}><strong style={{ color: "#f8fbff" }}>Recovery move:</strong> {selectedScenario.recovery}</div>
        </div>
        <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))" }}>
          {scenarioEvents.map((event) => (
            <div key={event.id} style={{ background: event.active ? `${accent}14` : event.complete ? "rgba(167,243,208,.08)" : "rgba(0,0,0,.16)", border: `1px solid ${event.active ? accent : event.complete ? "rgba(167,243,208,.28)" : "rgba(255,255,255,.08)"}`, borderRadius: 8, display: "grid", gap: 5, minHeight: 82, padding: 8 }}>
              <strong style={{ color: event.active ? "#f8fbff" : event.complete ? "#d1fae5" : "#dbeafe", fontSize: 11.1 }}>{event.label}</strong>
              <span style={{ color: event.active ? "#dbeafe" : "#9fb0c7", fontSize: 10.7, lineHeight: 1.4 }}>{event.detail}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ alignItems: "stretch", display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))" }}>
        {steps.map((step, index) => {
          const isActive = index === activePosition;
          const isInScenario = scenarioStepSet.has(step.id);
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelectStep?.(index)}
              style={{ background: isActive ? `${accent}18` : isInScenario ? "rgba(167,243,208,.055)" : "rgba(255,255,255,.035)", border: `1px solid ${isActive ? accent : isInScenario ? "rgba(167,243,208,.3)" : "rgba(255,255,255,.075)"}`, borderRadius: 8, cursor: "pointer", display: "grid", gap: 6, minHeight: 112, padding: 9, textAlign: "left", transform: isActive ? "translateY(-3px)" : "translateY(0)", transition: "transform .25s ease, border-color .25s ease, background .25s ease" }}
            >
              <i className={`ti ${step.icon}`} style={{ color: isActive ? accent : "#9fb0c7", fontSize: 17 }} />
              <strong style={{ color: "#f8fbff", fontSize: 11.5, lineHeight: 1.3 }}>{step.label}</strong>
              <span style={{ color: isActive ? "#d1fae5" : "#7f91aa", fontSize: 9.8, fontWeight: 900, textTransform: "uppercase" }}>{step.phase}</span>
              {isInScenario && <span style={{ color: "#a7f3d0", fontSize: 9.7, fontWeight: 900, textTransform: "uppercase" }}>Scenario path</span>}
              <span style={{ color: "#9fb0c7", fontSize: 10.5, lineHeight: 1.35 }}>{step.detail}</span>
            </button>
          );
        })}
      </div>

      <div style={{ background: `${accent}0f`, border: `1px solid ${accent}28`, borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
        <div style={{ alignItems: "center", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <i className={`ti ${active.icon}`} style={{ color: accent, fontSize: 17 }} />
          <strong style={{ color: "#f8fbff", fontSize: 13 }}>{active.label}</strong>
          <span style={{ color: "#a7f3d0", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{active.phase}</span>
        </div>
        <p style={{ color: "#dbeafe", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}><strong style={{ color: "#f8fbff" }}>Teacher narration:</strong> {active.teacher}</p>
        <p style={{ color: "#bfdbfe", fontSize: 11.3, lineHeight: 1.5, margin: 0 }}><strong style={{ color: "#f8fbff" }}>Interview cue:</strong> {active.interviewCue}</p>
      </div>

      <section style={{ border: "1px solid rgba(196,181,253,.22)", borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
        <div>
          <strong style={{ color: "#ddd6fe", display: "block", fontSize: 11, textTransform: "uppercase" }}>Interview Drill Mode</strong>
          <p style={{ color: "#c4b5fd", fontSize: 11.2, lineHeight: 1.45, marginTop: 4 }}>What would you say to the interviewer about <strong style={{ color: "#f8fbff" }}>{active.label}</strong>?</p>
        </div>
        <textarea
          value={drillAnswer}
          onChange={(event) => setDrillAnswer(event.target.value)}
          placeholder="Type your explanation, then compare the covered points below."
          rows={3}
          style={{ background: "rgba(0,0,0,.18)", border: "1px solid rgba(196,181,253,.22)", borderRadius: 7, color: "#f8fbff", fontSize: 11.5, lineHeight: 1.45, minWidth: 0, outline: "none", padding: 9, resize: "vertical", width: "100%" }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {drillScore.map((point) => (
            <span key={point.label} style={{ background: point.matched ? "rgba(167,243,208,.12)" : "rgba(248,113,113,.1)", border: `1px solid ${point.matched ? "rgba(167,243,208,.28)" : "rgba(248,113,113,.25)"}`, borderRadius: 999, color: point.matched ? "#d1fae5" : "#fecaca", fontSize: 10.3, fontWeight: 850, padding: "5px 8px" }}>
              {point.matched ? "Covered" : "Missing"}: {point.label}
            </span>
          ))}
        </div>
      </section>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" }}>
        <div style={{ border: "1px solid rgba(250,204,21,.22)", borderRadius: 8, color: "#fde68a", fontSize: 11.2, lineHeight: 1.45, padding: 9 }}>
          <strong style={{ display: "block", fontSize: 10.5, marginBottom: 4, textTransform: "uppercase" }}>Bottleneck</strong>
          {bottleneck}
        </div>
        <div style={{ border: "1px solid rgba(167,243,208,.22)", borderRadius: 8, color: "#d1fae5", fontSize: 11.2, lineHeight: 1.45, padding: 9 }}>
          <strong style={{ display: "block", fontSize: 10.5, marginBottom: 4, textTransform: "uppercase" }}>Trade-off</strong>
          {tradeoff}
        </div>
      </div>

      <div style={{ border: "1px solid rgba(248,113,113,.2)", borderRadius: 8, display: "grid", gap: 7, padding: 9 }}>
        <strong style={{ color: "#fecaca", fontSize: 10.8, textTransform: "uppercase" }}>Failure paths to practice</strong>
        {failurePaths.map((path) => (
          <div key={path} style={{ color: "#fca5a5", fontSize: 11.1, lineHeight: 1.45 }}>{path}</div>
        ))}
      </div>
    </section>
  );
}

function RequestLifecycleDeepDive({ blueprint, accent }) {
  const [activeSliceIndex, setActiveSliceIndex] = useState(0);
  const [drillAnswer, setDrillAnswer] = useState("");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(PLAYBACK_SPEEDS[1].value);
  const serviceName = blueprint?.hld?.services?.[0]?.name || "Application Service";
  const schemaLine = blueprint?.lld?.schema?.[0] || "Entity(id, owner_id, status, created_at) with indexes for the highest-volume reads";
  const implementationSlices = [
    {
      id: "controller",
      title: "Controller / API Layer",
      icon: "ti-route",
      detail: "Validate path params and request body, reject bad input early, call one service method, and translate domain errors into clear HTTP responses.",
      input: "HTTP request, auth principal, headers, body DTO",
      output: "Validated command/query object or 4xx response",
      trace: "Request enters route handler -> DTO validation runs -> auth principal is attached -> service method is called.",
      say: "I keep controllers thin so validation and transport concerns stay separate from business rules.",
      drillPoints: [
        { label: "Thin controller", keywords: ["thin", "delegate", "service"] },
        { label: "DTO validation", keywords: ["dto", "validate", "validation"] },
        { label: "Error mapping", keywords: ["error", "status", "response"] },
      ],
      checks: ["DTO validation", "Auth principal", "Idempotency key", "Error mapping"],
    },
    {
      id: "service",
      title: `${serviceName} / Business Rules`,
      icon: "ti-server",
      detail: "Load the required state, enforce invariants, choose sync vs async work, keep the transaction boundary small, and return a stable response model.",
      input: "Validated command/query plus caller context",
      output: "Domain decision, persisted state request, events to publish",
      trace: "Service checks permissions -> loads required records -> applies invariants -> decides cache, DB, and async work.",
      say: "I put transaction and invariant decisions here because this is the layer that understands the use case.",
      drillPoints: [
        { label: "Invariants", keywords: ["invariant", "rule"] },
        { label: "Transaction scope", keywords: ["transaction", "commit"] },
        { label: "Dependency orchestration", keywords: ["orchestrate", "cache", "repository", "queue"] },
      ],
      checks: ["Permissions", "Invariants", "Transaction scope", "Retry policy"],
    },
    {
      id: "repository",
      title: "Repository + DB Index and Query Plan",
      icon: "ti-list-search",
      detail: `Model the data around access patterns. Example schema cue: ${schemaLine}. Use indexes for common filters, ordering, joins, uniqueness, and pagination.`,
      input: "Repository method with filters, sort, limit, and consistency needs",
      output: "Rows/entities loaded through the intended index",
      trace: "Repository builds query -> query planner picks index -> DB scans the smallest useful range -> results map back to domain objects.",
      say: "I explain indexes from access patterns first, then mention write cost and slow-query monitoring.",
      drillPoints: [
        { label: "Access pattern", keywords: ["access", "query", "filter"] },
        { label: "Composite index", keywords: ["composite", "index", "prefix"] },
        { label: "Query plan", keywords: ["plan", "scan", "selectivity"] },
      ],
      checks: ["Composite index order", "Uniqueness", "Cursor pagination", "Slow-query log"],
    },
    {
      id: "cache",
      title: "Cache Strategy",
      icon: "ti-bolt",
      detail: "Use cache-aside for hot reads, choose stable keys, prevent stampedes, and define what happens after writes before you claim the system is fast.",
      input: "Cache key, freshness requirement, and fallback query",
      output: "Cached value, cache miss decision, or invalidation event",
      trace: "Service computes key -> cache hit returns quickly, miss calls repository -> value is stored with TTL -> write path deletes or refreshes affected keys.",
      say: "I always pair cache with an invalidation or TTL story so the design does not hide stale-data bugs.",
      drillPoints: [
        { label: "Cache key", keywords: ["key"] },
        { label: "TTL and miss path", keywords: ["ttl", "miss"] },
        { label: "Invalidation", keywords: ["invalidate", "stale", "fresh"] },
      ],
      checks: ["Key format", "TTL", "Hit/miss path", "Invalidation"],
    },
    {
      id: "queue-worker",
      title: "Message Queue + Worker",
      icon: "ti-messages",
      detail: "Publish durable events after the DB commit, then let workers handle slow side effects with retries, idempotency, and DLQ monitoring.",
      input: "Durable event or outbox row after commit",
      output: "Side effect completed, retry scheduled, or DLQ item",
      trace: "Outbox records event -> publisher sends message -> worker consumes -> idempotency check runs -> side effect commits -> offset/ack is saved.",
      say: "I move slow side effects off the request path and make workers safe for at-least-once delivery.",
      drillPoints: [
        { label: "Outbox after commit", keywords: ["outbox", "commit"] },
        { label: "At-least-once delivery", keywords: ["at-least-once", "delivery", "retry"] },
        { label: "Idempotent worker", keywords: ["idempotent", "idempotency", "dedupe"] },
      ],
      checks: ["Outbox", "At-least-once", "Worker idempotency", "DLQ"],
    },
    {
      id: "ops",
      title: "Observability + Operations",
      icon: "ti-activity",
      detail: "Attach the same trace ID from gateway to worker, then monitor latency, error rate, cache misses, DB slow queries, queue lag, and worker failures.",
      input: "Logs, metrics, traces, audit events, and health checks",
      output: "Dashboards, alerts, SLO burn-rate signals, incident breadcrumbs",
      trace: "Trace ID follows each hop -> metrics record latency/error/cache miss/queue lag -> alerts fire before users report the incident.",
      say: "I include operations because a design is incomplete if the team cannot debug it in production.",
      drillPoints: [
        { label: "Trace ID", keywords: ["trace", "correlation"] },
        { label: "Metrics and SLO", keywords: ["metric", "slo", "latency"] },
        { label: "Alerts", keywords: ["alert", "dashboard", "error"] },
      ],
      checks: ["Trace ID", "SLO", "Dashboard", "Alert"],
    },
  ];
  const activeSlice = implementationSlices[activeSliceIndex] || implementationSlices[0];
  const drillScore = scoreDrillAnswer(drillAnswer, activeSlice.drillPoints || []);
  const previousSlice = () => setActiveSliceIndex((value) => (value - 1 + implementationSlices.length) % implementationSlices.length);
  const nextSlice = () => setActiveSliceIndex((value) => (value + 1) % implementationSlices.length);
  const rewindSlices = () => {
    setPlaying(false);
    setActiveSliceIndex(0);
  };
  const codeFlowEvents = implementationSlices.map((slice, index) => ({
    id: slice.id,
    label: slice.title,
    detail: slice.trace,
    active: index === activeSliceIndex,
    complete: index < activeSliceIndex,
  }));

  useEffect(() => {
    setDrillAnswer("");
  }, [activeSlice.id]);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setActiveSliceIndex((value) => {
        if (value >= implementationSlices.length - 1) {
          setPlaying(false);
          return value;
        }
        return value + 1;
      });
    }, speed);
    return () => window.clearInterval(timer);
  }, [playing, speed, implementationSlices.length]);

  return (
    <section style={{ border: `1px solid ${accent}30`, borderRadius: 8, background: "rgba(0,0,0,.15)", display: "grid", gap: 10, padding: 11 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>LLD Code-to-Flow Playback</div>
          <p style={{ color: "#9fb0c7", fontSize: 11.4, lineHeight: 1.45, marginTop: 4 }}>Step through how code executes: controller method called, service rules applied, repository query executed, cache invalidated, event published, worker retries/idempotency path.</p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <ActionButton icon={playing ? "ti-player-pause" : "ti-player-play"} label={playing ? "Pause LLD Playback" : "Play LLD Playback"} onClick={() => setPlaying((value) => !value)} tone={accent} />
          <ActionButton icon="ti-player-track-prev-filled" label="Rewind LLD Playback" onClick={rewindSlices} tone="#c4b5fd" />
          <ActionButton icon="ti-chevron-left" label="Previous LLD Step" onClick={previousSlice} tone={accent} />
          <ActionButton icon="ti-chevron-right" label="Next LLD Step" onClick={nextSlice} tone={accent} />
        </div>
      </div>
      <label style={{ alignItems: "center", color: "#dbeafe", display: "flex", gap: 7, fontSize: 10.7, fontWeight: 850, flexWrap: "wrap" }}>
        Speed control
        <input
          aria-label="LLD playback speed"
          type="range"
          min="0"
          max={PLAYBACK_SPEEDS.length - 1}
          value={PLAYBACK_SPEEDS.findIndex((item) => item.value === speed)}
          onChange={(event) => setSpeed(PLAYBACK_SPEEDS[Number(event.target.value)]?.value || PLAYBACK_SPEEDS[1].value)}
          style={{ accentColor: accent, flex: "1 1 120px" }}
        />
        <span style={{ color: accent }}>{getPlaybackSpeedLabel(speed)}</span>
      </label>

      <section style={{ background: `${accent}0f`, border: `1px solid ${accent}30`, borderRadius: 8, display: "grid", gap: 9, padding: 10 }}>
        <div style={{ alignItems: "center", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ alignItems: "center", background: `${accent}18`, border: `1px solid ${accent}44`, borderRadius: 8, color: accent, display: "inline-flex", fontSize: 11, fontWeight: 950, height: 30, justifyContent: "center", width: 30 }}>{activeSliceIndex + 1}</span>
          <i className={`ti ${activeSlice.icon}`} style={{ color: accent, fontSize: 16 }} />
          <strong style={{ color: "#f8fbff", fontSize: 13 }}>{activeSlice.title}</strong>
        </div>
        <p style={{ color: "#dbeafe", fontSize: 11.4, lineHeight: 1.5, margin: 0 }}>{activeSlice.detail}</p>
        <div style={responsiveGrid(190, 8)}>
          <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 8 }}>
            <strong style={{ color: "#a7f3d0", display: "block", fontSize: 10.5, marginBottom: 4, textTransform: "uppercase" }}>Input</strong>
            <span style={{ color: "#d1fae5", fontSize: 11.1, lineHeight: 1.45 }}>{activeSlice.input}</span>
          </div>
          <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 8 }}>
            <strong style={{ color: "#bfdbfe", display: "block", fontSize: 10.5, marginBottom: 4, textTransform: "uppercase" }}>Execution Trace</strong>
            <span style={{ color: "#dbeafe", fontSize: 11.1, lineHeight: 1.45 }}>{activeSlice.trace}</span>
          </div>
          <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 8 }}>
            <strong style={{ color: "#fde68a", display: "block", fontSize: 10.5, marginBottom: 4, textTransform: "uppercase" }}>Output</strong>
            <span style={{ color: "#fef3c7", fontSize: 11.1, lineHeight: 1.45 }}>{activeSlice.output}</span>
          </div>
        </div>
        <div style={{ border: "1px solid rgba(167,243,208,.2)", borderRadius: 8, color: "#d1fae5", fontSize: 11.2, lineHeight: 1.45, padding: 8 }}>
          <strong style={{ color: "#f8fbff" }}>What to say in interview:</strong> {activeSlice.say}
        </div>
        <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))" }}>
          {codeFlowEvents.map((event) => (
            <div key={event.id} style={{ background: event.active ? `${accent}14` : event.complete ? "rgba(167,243,208,.08)" : "rgba(0,0,0,.16)", border: `1px solid ${event.active ? accent : event.complete ? "rgba(167,243,208,.28)" : "rgba(255,255,255,.08)"}`, borderRadius: 8, display: "grid", gap: 5, minHeight: 88, padding: 8 }}>
              <strong style={{ color: event.active ? "#f8fbff" : event.complete ? "#d1fae5" : "#dbeafe", fontSize: 11.1 }}>{event.label}</strong>
              <span style={{ color: event.active ? "#dbeafe" : "#9fb0c7", fontSize: 10.7, lineHeight: 1.4 }}>{event.detail}</span>
            </div>
          ))}
        </div>
        <div style={{ border: "1px solid rgba(196,181,253,.22)", borderRadius: 8, display: "grid", gap: 8, padding: 8 }}>
          <strong style={{ color: "#ddd6fe", fontSize: 10.8, textTransform: "uppercase" }}>Interview Drill Mode</strong>
          <textarea
            value={drillAnswer}
            onChange={(event) => setDrillAnswer(event.target.value)}
            placeholder={`Explain ${activeSlice.title} like you are answering an interviewer.`}
            rows={3}
            style={{ background: "rgba(0,0,0,.18)", border: "1px solid rgba(196,181,253,.22)", borderRadius: 7, color: "#f8fbff", fontSize: 11.5, lineHeight: 1.45, minWidth: 0, outline: "none", padding: 9, resize: "vertical", width: "100%" }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {drillScore.map((point) => (
              <span key={point.label} style={{ background: point.matched ? "rgba(167,243,208,.12)" : "rgba(248,113,113,.1)", border: `1px solid ${point.matched ? "rgba(167,243,208,.28)" : "rgba(248,113,113,.25)"}`, borderRadius: 999, color: point.matched ? "#d1fae5" : "#fecaca", fontSize: 10.3, fontWeight: 850, padding: "5px 8px" }}>
                {point.matched ? "Covered" : "Missing"}: {point.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div style={responsiveGrid(230, 8)}>
        {implementationSlices.map((slice, index) => {
          const isActive = index === activeSliceIndex;
          return (
          <button key={slice.id} type="button" onClick={() => setActiveSliceIndex(index)} style={{ background: isActive ? `${accent}18` : "rgba(255,255,255,.04)", border: `1px solid ${isActive ? accent : "rgba(255,255,255,.08)"}`, borderRadius: 8, cursor: "pointer", display: "grid", gap: 8, padding: 10, textAlign: "left" }}>
            <div style={{ alignItems: "center", display: "flex", gap: 7 }}>
              <i className={`ti ${slice.icon}`} style={{ color: accent, fontSize: 15 }} />
              <strong style={{ color: "#f8fbff", fontSize: 12.3, lineHeight: 1.25 }}>{slice.title}</strong>
            </div>
            <p style={{ color: "#9fb0c7", fontSize: 11.2, lineHeight: 1.45, margin: 0 }}>{slice.detail}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {slice.checks.map((check) => (
                <span key={check} style={{ background: `${accent}12`, border: `1px solid ${accent}28`, borderRadius: 999, color: "#dbeafe", fontSize: 10.2, fontWeight: 800, padding: "4px 7px" }}>{check}</span>
              ))}
            </div>
          </button>
          );
        })}
      </div>
    </section>
  );
}

function MermaidExportPanel({ title, mermaid, accent }) {
  const [copied, setCopied] = useState(false);
  const copyMermaid = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(mermaid);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1300);
    }
  };

  return (
    <section style={{ border: `1px solid ${accent}30`, borderRadius: 8, background: "rgba(0,0,0,.15)", display: "grid", gap: 9, padding: 11 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Mermaid/System Diagram Export</div>
          <p style={{ color: "#9fb0c7", fontSize: 11.3, lineHeight: 1.45, marginTop: 4 }}>{title}</p>
        </div>
        <ActionButton icon={copied ? "ti-check" : "ti-copy"} label={copied ? "Copied Mermaid" : "Copy Mermaid"} onClick={copyMermaid} tone={accent} />
      </div>
      <pre style={{ ...wrappingCodeStyle, background: "rgba(0,0,0,.24)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "#d1fae5", fontSize: 10.8, lineHeight: 1.45, margin: 0, padding: 10 }}>{mermaid}</pre>
    </section>
  );
}

function FailureRecoverySimulator({ accent }) {
  const [caseId, setCaseId] = useState(FAILURE_RECOVERY_CASES[0].id);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(PLAYBACK_SPEEDS[1].value);
  const selectedCase = FAILURE_RECOVERY_CASES.find((item) => item.id === caseId) || FAILURE_RECOVERY_CASES[0];
  const activeStep = selectedCase.steps[Math.min(stepIndex, selectedCase.steps.length - 1)] || selectedCase.steps[0];

  useEffect(() => {
    setStepIndex(0);
    setPlaying(false);
  }, [selectedCase.id]);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setStepIndex((value) => {
        if (value >= selectedCase.steps.length - 1) {
          setPlaying(false);
          return value;
        }
        return value + 1;
      });
    }, speed);
    return () => window.clearInterval(timer);
  }, [playing, speed, selectedCase.steps.length]);

  return (
    <section style={{ border: "1px solid rgba(248,113,113,.22)", borderRadius: 8, background: "rgba(127,29,29,.08)", display: "grid", gap: 10, padding: 11 }}>
      <div>
        <div style={{ color: "#fca5a5", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Failure Mode Playback</div>
        <p style={{ color: "#fecaca", fontSize: 11.3, lineHeight: 1.45, marginTop: 4 }}>Practice retries, idempotency keys, outbox, DLQ, rollback, cache invalidation race, and eventual consistency.</p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {FAILURE_RECOVERY_CASES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCaseId(item.id)}
            style={{ background: item.id === selectedCase.id ? "rgba(248,113,113,.18)" : "rgba(0,0,0,.16)", border: `1px solid ${item.id === selectedCase.id ? "rgba(248,113,113,.55)" : "rgba(255,255,255,.08)"}`, borderRadius: 999, color: item.id === selectedCase.id ? "#fff1f2" : "#fca5a5", cursor: "pointer", fontSize: 10.5, fontWeight: 850, padding: "6px 9px" }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div style={{ alignItems: "center", display: "flex", gap: 6, flexWrap: "wrap" }}>
        <ActionButton icon={playing ? "ti-player-pause" : "ti-player-play"} label={playing ? "Pause Failure Playback" : "Play Failure Playback"} onClick={() => setPlaying((value) => !value)} tone="#fca5a5" />
        <ActionButton icon="ti-player-track-prev-filled" label="Rewind Failure Playback" onClick={() => { setPlaying(false); setStepIndex(0); }} tone="#c4b5fd" />
        <ActionButton icon="ti-chevron-left" label="Previous Failure Step" onClick={() => { setPlaying(false); setStepIndex((value) => Math.max(0, value - 1)); }} tone="#fca5a5" />
        <span style={{ color: "#fff1f2", fontSize: 10.8, fontWeight: 900 }}>{stepIndex + 1}/{selectedCase.steps.length} {activeStep}</span>
        <ActionButton icon="ti-chevron-right" label="Next Failure Step" onClick={() => { setPlaying(false); setStepIndex((value) => Math.min(selectedCase.steps.length - 1, value + 1)); }} tone="#fca5a5" />
        <label style={{ alignItems: "center", color: "#fecaca", display: "flex", gap: 7, fontSize: 10.5, fontWeight: 850 }}>
          Speed control
          <input
            aria-label="Failure playback speed"
            type="range"
            min="0"
            max={PLAYBACK_SPEEDS.length - 1}
            value={PLAYBACK_SPEEDS.findIndex((item) => item.value === speed)}
            onChange={(event) => setSpeed(PLAYBACK_SPEEDS[Number(event.target.value)]?.value || PLAYBACK_SPEEDS[1].value)}
            style={{ accentColor: "#fca5a5", flex: "1 1 110px" }}
          />
          <span style={{ color: "#fff1f2" }}>{getPlaybackSpeedLabel(speed)}</span>
        </label>
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))" }}>
        {selectedCase.steps.map((step, index) => (
          <div key={step} style={{ background: index === stepIndex ? "rgba(248,113,113,.18)" : index < stepIndex ? "rgba(248,113,113,.10)" : "rgba(255,255,255,.04)", border: "1px solid rgba(248,113,113,.18)", borderRadius: 8, display: "grid", gap: 6, padding: 9 }}>
            <span style={{ color: "#fecaca", fontSize: 10, fontWeight: 950, textTransform: "uppercase" }}>Step {index + 1}</span>
            <span style={{ color: "#fff1f2", fontSize: 11.2, lineHeight: 1.4 }}>{step}</span>
          </div>
        ))}
      </div>
      <div style={{ border: "1px solid rgba(248,113,113,.25)", borderRadius: 8, color: "#fecaca", fontSize: 11.3, lineHeight: 1.45, padding: 9 }}>
        <strong style={{ color: "#fff1f2" }}>Recovery lesson:</strong> {selectedCase.lesson}
      </div>
    </section>
  );
}

function DbIndexVisualizer({ accent }) {
  const [queryId, setQueryId] = useState(INDEX_QUERY_CASES[0].id);
  const selectedQuery = INDEX_QUERY_CASES.find((item) => item.id === queryId) || INDEX_QUERY_CASES[0];

  return (
    <section style={{ border: `1px solid ${accent}30`, borderRadius: 8, background: "rgba(0,0,0,.15)", display: "grid", gap: 10, padding: 11 }}>
      <div>
        <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>DB Index Visualizer</div>
        <p style={{ color: "#9fb0c7", fontSize: 11.3, lineHeight: 1.45, marginTop: 4 }}>See why a composite B-tree index like <code style={{ color: "#d1fae5" }}>(user_id, created_at)</code> works for one query but not another.</p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {INDEX_QUERY_CASES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setQueryId(item.id)}
            style={{ background: item.id === selectedQuery.id ? `${accent}18` : "rgba(0,0,0,.16)", border: `1px solid ${item.id === selectedQuery.id ? accent : "rgba(255,255,255,.08)"}`, borderRadius: 999, color: item.id === selectedQuery.id ? "#f8fbff" : "#9fb0c7", cursor: "pointer", fontSize: 10.5, fontWeight: 850, padding: "6px 9px" }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div style={responsiveGrid(230, 8)}>
        <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 6, padding: 9 }}>
          <strong style={{ color: "#f8fbff", fontSize: 11 }}>Query</strong>
          <code style={{ ...wrappingCodeStyle, color: "#d1fae5", fontSize: 11 }}>{selectedQuery.query}</code>
          <span style={{ color: "#9fb0c7", fontSize: 11 }}>Index: <code style={{ color: "#bfdbfe" }}>{selectedQuery.index}</code></span>
        </div>
        <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 6, padding: 9 }}>
          <strong style={{ color: "#f8fbff", fontSize: 11 }}>Verdict</strong>
          <span style={{ color: selectedQuery.id === "wrong-order" ? "#fecaca" : "#d1fae5", fontSize: 12, fontWeight: 900 }}>{selectedQuery.verdict}</span>
          <span style={{ color: "#9fb0c7", fontSize: 11.2, lineHeight: 1.45 }}>{selectedQuery.explanation}</span>
        </div>
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 130px), 1fr))" }}>
        {selectedQuery.scan.map((step, index) => (
          <div key={step} style={{ background: `${accent}${index === 0 ? "18" : "0f"}`, border: `1px solid ${accent}28`, borderRadius: 8, color: "#dbeafe", fontSize: 11.1, lineHeight: 1.4, minHeight: 64, padding: 9 }}>
            <strong style={{ color: accent, display: "block", fontSize: 10.2, marginBottom: 5, textTransform: "uppercase" }}>B-tree hop {index + 1}</strong>
            {step}
          </div>
        ))}
      </div>
    </section>
  );
}

function ImplementationMode({ blueprint, accent }) {
  const steps = buildImplementationTimeline(blueprint);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(PLAYBACK_SPEEDS[1].value);
  const activeStep = steps[Math.min(stepIndex, steps.length - 1)] || steps[0];

  useEffect(() => {
    setStepIndex(0);
    setPlaying(false);
  }, [blueprint?.problem, blueprint?.title]);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setStepIndex((value) => {
        if (value >= steps.length - 1) {
          setPlaying(false);
          return value;
        }
        return value + 1;
      });
    }, speed);
    return () => window.clearInterval(timer);
  }, [playing, speed, steps.length]);

  return (
    <section style={{ border: `1px solid ${accent}30`, borderRadius: 8, background: "rgba(0,0,0,.15)", display: "grid", gap: 10, padding: 11 }}>
      <div>
        <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Implementation Mode</div>
        <p style={{ color: "#9fb0c7", fontSize: 11.3, lineHeight: 1.45, marginTop: 4 }}>Guided construction timeline for schema creation, index selection, endpoint wiring, service orchestration, event flow, and deployment/runtime path.</p>
      </div>
      <div style={{ alignItems: "center", display: "flex", gap: 6, flexWrap: "wrap" }}>
        <ActionButton icon={playing ? "ti-player-pause" : "ti-player-play"} label={playing ? "Pause Implementation Mode" : "Play Implementation Mode"} onClick={() => setPlaying((value) => !value)} tone={accent} />
        <ActionButton icon="ti-player-track-prev-filled" label="Rewind Implementation Mode" onClick={() => { setPlaying(false); setStepIndex(0); }} tone="#c4b5fd" />
        <ActionButton icon="ti-chevron-left" label="Previous Build Step" onClick={() => { setPlaying(false); setStepIndex((value) => Math.max(0, value - 1)); }} tone={accent} />
        <span style={{ color: "#dbeafe", fontSize: 10.8, fontWeight: 900 }}>{stepIndex + 1}/{steps.length} {activeStep.title}</span>
        <ActionButton icon="ti-chevron-right" label="Next Build Step" onClick={() => { setPlaying(false); setStepIndex((value) => Math.min(steps.length - 1, value + 1)); }} tone={accent} />
        <label style={{ alignItems: "center", color: "#dbeafe", display: "flex", gap: 7, fontSize: 10.5, fontWeight: 850 }}>
          Speed control
          <input
            aria-label="Implementation playback speed"
            type="range"
            min="0"
            max={PLAYBACK_SPEEDS.length - 1}
            value={PLAYBACK_SPEEDS.findIndex((item) => item.value === speed)}
            onChange={(event) => setSpeed(PLAYBACK_SPEEDS[Number(event.target.value)]?.value || PLAYBACK_SPEEDS[1].value)}
            style={{ accentColor: accent, flex: "1 1 110px" }}
          />
          <span style={{ color: accent }}>{getPlaybackSpeedLabel(speed)}</span>
        </label>
      </div>
      <div style={{ background: `${accent}10`, border: `1px solid ${accent}28`, borderRadius: 8, display: "grid", gap: 7, padding: 9 }}>
        <div style={{ alignItems: "center", display: "flex", gap: 7, flexWrap: "wrap" }}>
          <i className={`ti ${activeStep.icon}`} style={{ color: accent, fontSize: 16 }} />
          <strong style={{ color: "#f8fbff", fontSize: 12.5 }}>{activeStep.title}</strong>
        </div>
        <p style={{ color: "#dbeafe", fontSize: 11.3, lineHeight: 1.45, margin: 0 }}>{activeStep.detail}</p>
        <code style={{ ...wrappingCodeStyle, color: "#d1fae5", fontSize: 11 }}>{activeStep.artifact}</code>
        <div style={{ color: "#a7f3d0", fontSize: 11.1, lineHeight: 1.45 }}><strong style={{ color: "#f8fbff" }}>Working outcome:</strong> {activeStep.output}</div>
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))" }}>
        {steps.map((step, index) => (
          <div key={step.id} style={{ background: index === stepIndex ? `${accent}16` : "rgba(255,255,255,.04)", border: `1px solid ${index === stepIndex ? accent : "rgba(255,255,255,.08)"}`, borderRadius: 8, display: "grid", gap: 5, minHeight: 92, padding: 8 }}>
            <strong style={{ color: index === stepIndex ? "#f8fbff" : "#dbeafe", fontSize: 11.1 }}>{step.title}</strong>
            <span style={{ color: "#9fb0c7", fontSize: 10.6, lineHeight: 1.35 }}>{step.output}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CodeMappingView({ blueprint, accent }) {
  const classPrefix = buildJavaClassPrefix(blueprint);
  const mappings = [
    { layer: "Controller", className: `${classPrefix}Controller`, method: "handle(request)", purpose: "Accept HTTP request, validate DTO, call service." },
    { layer: "Service", className: `${classPrefix}Service`, method: "execute(command)", purpose: "Apply business rules, transaction scope, idempotency." },
    { layer: "Repository", className: `${classPrefix}Repository`, method: "findByAccessPattern(query)", purpose: "Run indexed queries and persist domain state." },
    { layer: "CacheClient", className: `${classPrefix}CacheClient`, method: "getOrLoad(cacheKey)", purpose: "Handle cache hit, miss, TTL, and invalidation." },
    { layer: "EventPublisher", className: `${classPrefix}EventPublisher`, method: "publishOutboxEvents()", purpose: "Publish durable events after DB commit." },
    { layer: "Worker", className: `${classPrefix}Worker`, method: "handle(message)", purpose: "Consume messages, dedupe, retry, and record progress." },
  ];

  return (
    <section style={{ border: `1px solid ${accent}30`, borderRadius: 8, background: "rgba(0,0,0,.15)", display: "grid", gap: 10, padding: 11 }}>
      <div>
        <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Code Mapping View</div>
        <p style={{ color: "#9fb0c7", fontSize: 11.3, lineHeight: 1.45, marginTop: 4 }}>Map each LLD simulator node to Java-style classes so the diagram turns into code responsibilities.</p>
      </div>
      <div style={responsiveGrid(220, 8)}>
        {mappings.map((item) => (
          <article key={item.layer} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 6, padding: 9 }}>
            <strong style={{ color: "#f8fbff", fontSize: 12 }}>{item.layer}</strong>
            <code style={{ ...wrappingCodeStyle, color: "#d1fae5", fontSize: 11 }}>{item.className}.{item.method}</code>
            <span style={{ color: "#9fb0c7", fontSize: 11.1, lineHeight: 1.4 }}>{item.purpose}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function PracticeTemplateLauncher({ templates, activeTemplateId, onApply, accent }) {
  const templatesByLevel = templates.reduce((groups, template) => {
    const level = template.level || "Core";
    if (!groups[level]) groups[level] = [];
    groups[level].push(template);
    return groups;
  }, {});
  return (
    <section style={{ border: `1px solid ${accent}24`, borderRadius: 8, background: "rgba(255,255,255,.035)", display: "grid", gap: 8, padding: 10 }}>
      <div>
        <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Practice Templates</div>
        <p style={{ color: "#9fb0c7", fontSize: 11.2, lineHeight: 1.45, marginTop: 3 }}>Load a complete design brief with implementation scope, architecture, data, scaling, reliability, and trade-off prompts.</p>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {Object.entries(templatesByLevel).map(([level, levelTemplates]) => (
          <div key={level} style={{ display: "grid", gap: 5 }}>
            <strong style={{ color: level === "Experienced" ? "#fbbf24" : accent, fontSize: 10.5, letterSpacing: ".05em", textTransform: "uppercase" }}>{level} level · {levelTemplates.length}</strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {levelTemplates.map((template) => <button key={template.id} type="button" title={template.focus || template.label} onClick={() => onApply(template)} style={{ background: template.id === activeTemplateId ? `${accent}18` : "rgba(0,0,0,.16)", border: `1px solid ${template.id === activeTemplateId ? accent : "rgba(255,255,255,.08)"}`, borderRadius: 999, color: template.id === activeTemplateId ? "#f8fbff" : "#9fb0c7", cursor: "pointer", fontSize: 10.6, fontWeight: 850, padding: "6px 9px" }}>{template.label}</button>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function InterviewAnswerPanel({ answer, accent }) {
  if (!answer) return null;
  return (
    <section style={{ border: `1px solid ${accent}35`, borderRadius: 8, background: "rgba(0,0,0,.16)", display: "grid", gap: 10, padding: 11 }}>
      <div>
        <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Interview-ready answer</div>
        <h3 style={{ color: "#f8fbff", fontSize: 15, lineHeight: 1.3, marginTop: 3 }}>{answer.title}</h3>
        <p style={{ color: "#9fb0c7", fontSize: 11.4, lineHeight: 1.5, marginTop: 4 }}>{answer.summary}</p>
      </div>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 6 }} aria-label="Architecture diagram">
        {answer.flow.map((step, index) => <div key={step} style={{ alignItems: "center", display: "flex", gap: 6 }}>
          <span style={{ background: index === 0 ? `${accent}18` : "rgba(255,255,255,.05)", border: `1px solid ${index === 0 ? `${accent}55` : "rgba(255,255,255,.1)"}`, borderRadius: 7, color: "#eaf2ff", fontSize: 10.8, fontWeight: 750, maxWidth: 170, padding: "7px 8px" }}>{step}</span>
          {index < answer.flow.length - 1 ? <i className="ti ti-arrow-right" aria-hidden="true" style={{ color: accent }} /> : null}
        </div>)}
      </div>
      <div style={responsiveGrid(280)}>
        <ListPanel title="Model answer" icon="ti-message-2" items={answer.answer} accent={accent} />
        <ListPanel title="Senior trade-offs" icon="ti-scale" items={answer.tradeOffs} accent={accent} />
      </div>
      <section style={{ border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, display: "grid", gap: 7, padding: 10 }}>
        <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Java implementation slice</div>
        <p style={{ color: "#9fb0c7", fontSize: 11.3, lineHeight: 1.45, margin: 0 }}>{answer.javaFocus}</p>
        <pre style={{ ...wrappingCodeStyle, background: "rgba(0,0,0,.24)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "#d1fae5", fontSize: 10.8, lineHeight: 1.45, margin: 0, padding: 10 }}>{answer.javaCode}</pre>
      </section>
      <MermaidExportPanel title="Mermaid architecture diagram" mermaid={answer.mermaid} accent={accent} />
    </section>
  );
}

function DiagramBoard({ board, roadmap, accent, onEvaluate }) {
  if (!board?.lanes?.length) return null;

  return (
    <section style={{ border: `1px solid ${accent}34`, borderRadius: 8, background: "rgba(0,0,0,.16)", display: "grid", gap: 12, padding: 12 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 9, justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={wrappingTextStyle}>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Interactive Whiteboard</div>
          <h3 style={{ ...wrappingTextStyle, color: "#f8fbff", fontSize: 16, lineHeight: 1.25, marginTop: 4 }}>{board.title}</h3>
          <p style={{ ...wrappingTextStyle, color: "#9fb0c7", fontSize: 11.5, lineHeight: 1.45, marginTop: 5 }}>Diagram the system in layers, then ask for AI evaluation on missing boxes, arrows, and trade-offs.</p>
        </div>
        <ActionButton icon="ti-sparkles" label="Evaluate Diagram" onClick={onEvaluate} tone={accent} />
      </div>

      <section style={{ ...wrappingTextStyle, background: `${accent}10`, border: `1px solid ${accent}2f`, borderRadius: 8, display: "grid", gap: 6, padding: 10 }}>
        <div style={{ color: accent, fontSize: 10.8, fontWeight: 900, textTransform: "uppercase" }}>Beginner System Design Context</div>
        <p style={{ color: "#dbeafe", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}><strong style={{ color: "#f8fbff" }}>What is this?</strong> A system design board is a visual explanation of how users, services, data, async work, and operations connect.</p>
        <p style={{ color: "#dbeafe", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}><strong style={{ color: "#f8fbff" }}>Why does it matter?</strong> Interviewers use it to see whether you can reason about scale, reliability, correctness, and trade-offs before writing code.</p>
        <p style={{ color: "#dbeafe", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}><strong style={{ color: "#f8fbff" }}>Where is it used?</strong> Architecture reviews, incident planning, backend design, migrations, and senior engineering interviews.</p>
      </section>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))", minWidth: 0 }}>
        {board.lanes.map((lane, laneIndex) => (
          <article key={lane.title} style={{ ...wrappingTextStyle, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.085)", borderRadius: 8, display: "grid", gap: 9, minHeight: 210, padding: 10 }}>
            <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
              <span style={{ alignItems: "center", background: `${accent}18`, border: `1px solid ${accent}44`, borderRadius: 8, color: accent, display: "inline-flex", flexShrink: 0, fontSize: 11, fontWeight: 950, height: 30, justifyContent: "center", width: 30 }}>
                {laneIndex + 1}
              </span>
              <div style={wrappingTextStyle}>
                <h4 style={{ color: "#f8fbff", fontSize: 12.5, lineHeight: 1.25 }}>{lane.title}</h4>
                <p style={{ color: "#9fb0c7", fontSize: 10.7, lineHeight: 1.35, marginTop: 2 }}>{lane.intent}</p>
              </div>
            </div>
            <div style={{ display: "grid", gap: 7 }}>
              {lane.nodes.map((node, index) => (
                <div key={`${lane.title}-${node}`} style={{ ...wrappingTextStyle, alignItems: "center", background: index === 0 ? `${accent}12` : "rgba(0,0,0,.16)", border: `1px solid ${index === 0 ? `${accent}44` : "rgba(255,255,255,.075)"}`, borderRadius: 8, color: "#eaf2ff", display: "flex", fontSize: 11.3, fontWeight: 850, gap: 7, justifyContent: "space-between", lineHeight: 1.3, minHeight: 34, padding: "7px 8px" }}>
                  <span>{node}</span>
                  {index < lane.nodes.length - 1 && <i className="ti ti-arrow-down" style={{ color: accent, flexShrink: 0, fontSize: 14 }} />}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div style={responsiveGrid(220)}>
        <ListPanel title="Diagram Edges" icon="ti-route" items={board.edges} accent={accent} />
        <ListPanel title="AI Evaluation Rubric" icon="ti-clipboard-check" accent={accent}>
          <div style={{ display: "grid", gap: 7 }}>
            {board.evaluationRubric.map((item) => (
              <div key={item.label} style={{ color: "#9fb0c7", fontSize: 11.3, lineHeight: 1.45 }}>
                <strong style={{ color: "#eaf2ff" }}>{item.label}</strong>: {item.check}
              </div>
            ))}
          </div>
        </ListPanel>
        <ListPanel title="Whiteboard Prompts" icon="ti-chalkboard" items={board.whiteboardPrompts} accent={accent} />
        <ListPanel title="Practice Moves" icon="ti-book-2" accent={accent}>
          <div style={{ display: "grid", gap: 8 }}>
            {board.referenceMoves.map((item, index) => (
              <div key={`${index}-${item.moves.join("-")}`} style={{ color: "#9fb0c7", fontSize: 11.2, lineHeight: 1.45 }}>
                <strong style={{ color: "#eaf2ff" }}>Practice move {index + 1}</strong>: {item.moves.join(" -> ")}
              </div>
            ))}
          </div>
        </ListPanel>
      </div>

      <div style={responsiveGrid(230)}>
        <ListPanel title="Primer Topic Map" icon="ti-map" accent={accent}>
          <div style={{ display: "grid", gap: 8 }}>
            {roadmap.topicGroups.map((group) => (
              <div key={group.title} style={{ color: "#9fb0c7", fontSize: 11.2, lineHeight: 1.45 }}>
                <strong style={{ color: "#eaf2ff" }}>{group.title}</strong>
                <div>{group.concepts.join(", ")}</div>
                <div style={{ color: "#a7f3d0", marginTop: 2 }}>{group.diagramCue}</div>
              </div>
            ))}
          </div>
        </ListPanel>
        <ListPanel title="Sample Design Boards" icon="ti-layout-board" accent={accent}>
          <div style={{ display: "grid", gap: 8 }}>
            {roadmap.sampleBoards.slice(0, 4).map((boardItem) => (
              <div key={boardItem.title} style={{ color: "#9fb0c7", fontSize: 11.2, lineHeight: 1.45 }}>
                <strong style={{ color: "#eaf2ff" }}>{boardItem.title}</strong>
                <div>{boardItem.diagramFocus.join(" -> ")}</div>
              </div>
            ))}
          </div>
        </ListPanel>
      </div>
    </section>
  );
}

export default function SystemDesignCanvas({
  initialState,
  onChange,
  onReview,
  onMock,
  onExport,
  onAction,
  theme = {},
  beginnerMode = false,
  beginnerStep = "watch",
  onBeginnerStepChange,
}) {
  const normalizedInitialState = useMemo(
    () => createSystemDesignCanvasState(initialState),
    [initialState],
  );
  const [canvasState, setCanvasState] = useState(normalizedInitialState);
  const [blueprint, setBlueprint] = useState(() => buildSystemDesignStudioBlueprint(normalizedInitialState));
  const [studioTab, setStudioTab] = useState("Diagram");
  const [flowIndex, setFlowIndex] = useState(0);
  const [selectedScenarioId, setSelectedScenarioId] = useState(SYSTEM_SCENARIOS[0].id);
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [activeInterviewAnswer, setActiveInterviewAnswer] = useState(null);
  const accent = theme.accentStrong || "#8bd3ff";
  const accentBorder = theme.accentBorder || "rgba(139, 211, 255, .26)";
  const diagramBoard = useMemo(() => buildSystemDesignDiagramBoard(canvasState), [canvasState]);
  const referenceRoadmap = useMemo(() => buildSystemDesignReferenceRoadmap(canvasState.problem), [canvasState.problem]);
  const selectedScenario = SYSTEM_SCENARIOS.find((scenario) => scenario.id === selectedScenarioId) || SYSTEM_SCENARIOS[0];
  const hldMermaid = useMemo(() => buildMermaidDiagram(blueprint, "hld", selectedScenario), [blueprint, selectedScenario]);
  const lldMermaid = useMemo(() => buildMermaidDiagram(blueprint, "lld", selectedScenario), [blueprint, selectedScenario]);

  useEffect(() => {
    setCanvasState(normalizedInitialState);
    setBlueprint(buildSystemDesignStudioBlueprint(normalizedInitialState));
  }, [normalizedInitialState]);

  const commitState = (nextState) => {
    const normalized = createSystemDesignCanvasState(nextState);
    setCanvasState(normalized);
    onChange?.(normalized);
  };

  const updateProblem = (event) => {
    commitState({ ...canvasState, problem: event.target.value });
  };

  const generateStudio = () => {
    const nextBlueprint = buildSystemDesignStudioBlueprint(canvasState);
    setBlueprint(nextBlueprint);
    setStudioTab("Diagram");
  };

  const applyPracticeTemplate = (template) => {
    const nextState = createSystemDesignCanvasState({
      problem: template.problem,
      sections: template.sections,
    });
    setCanvasState(nextState);
    setBlueprint(buildSystemDesignStudioBlueprint(nextState));
    setActiveTemplateId(template.id);
    setActiveInterviewAnswer(template.answer || null);
    setStudioTab("HLD");
    onChange?.(nextState);
  };

  const askStudioAI = () => {
    const prompt = buildSystemDesignStudioPrompt(canvasState);
    onAction?.(prompt, { type: "studio", canvasState, blueprint });
  };

  const evaluateDiagram = () => {
    const prompt = buildSystemDesignDiagramEvaluationPrompt(canvasState);
    onAction?.(prompt, { type: "diagramEvaluation", canvasState, diagramBoard });
  };

  const updateSection = (key, value) => {
    commitState({
      ...canvasState,
      sections: {
        ...canvasState.sections,
        [key]: value,
      },
    });
  };

  const reviewCanvas = () => {
    const prompt = buildCanvasReviewPrompt(canvasState);
    onReview?.(prompt, canvasState);
    onAction?.(prompt, { type: "review", canvasState });
  };

  const mockCanvas = () => {
    const prompt = buildCanvasMockPrompt(canvasState);
    onMock?.(prompt, canvasState);
    onAction?.(prompt, { type: "mock", canvasState });
  };

  const exportCanvas = async () => {
    const markdown = exportSystemDesignCanvasMarkdown(canvasState);
    onExport?.(markdown, canvasState);

    if (!onExport && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(markdown);
    }
  };

  return (
    <section
      className="glass-card system-design-canvas"
      style={{
        background: "linear-gradient(180deg, rgba(14,18,30,.82), rgba(7,10,18,.74))",
        backdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,.1)",
        borderRadius: 8,
        boxShadow: "0 18px 46px rgba(0,0,0,.24)",
        color: "#eef4ff",
        display: "grid",
        flexShrink: 0,
        gap: 12,
        minWidth: 0,
        padding: 14,
        width: "100%",
      }}
    >
      <BeginnerGuideBanner
        enabled={beginnerMode}
        accent={accent}
        currentStep={beginnerStep}
        onStepSelect={onBeginnerStepChange}
        detail="For system design: capture requirements, predict the request flow, explain one trade-off, practice a mock question, then review missing scale and failure details."
      />

      <header
        style={{
          alignItems: "start",
          ...responsiveGrid(260, 10),
        }}
      >
        <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
          <span style={{ color: "#9fb0c7", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
            System Design Canvas + Studio
          </span>
          <textarea
            value={canvasState.problem}
            onChange={updateProblem}
            placeholder="Problem, e.g. Implement Ticket Booking System"
            rows={2}
            style={{
              background: "rgba(255,255,255,.06)",
              border: `1px solid ${accentBorder}`,
              borderRadius: 7,
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.45,
              minHeight: 56,
              outline: "none",
              padding: "8px 10px",
              resize: "vertical",
              minWidth: 0,
              width: "100%",
            }}
          />
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "flex-start", minWidth: 0 }}>
          <ActionButton icon="ti-wand" label="Generate HLD + LLD" onClick={generateStudio} tone="#a7f3d0" />
          <ActionButton icon="ti-robot" label="Ask AI for full design" onClick={askStudioAI} tone="#c4b5fd" />
          <ActionButton icon="ti-sparkles" label="Review" onClick={reviewCanvas} tone={accent} />
          <ActionButton icon="ti-player-play" label="Mock" onClick={mockCanvas} tone="#a7f3d0" />
          <ActionButton icon="ti-download" label="Export" onClick={exportCanvas} tone="#facc15" />
        </div>
      </header>

      <section style={{ border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 11, minWidth: 0, padding: 12, background: "rgba(139,211,255,.045)" }}>
        <PracticeTemplateLauncher templates={[...SYSTEM_PRACTICE_TEMPLATES, ...SYSTEM_DESIGN_INTERVIEW_PRACTICE_CATALOG.map(buildSystemDesignInterviewPracticeTemplate)]} activeTemplateId={activeTemplateId} onApply={applyPracticeTemplate} accent={accent} />
        <InterviewAnswerPanel answer={activeInterviewAnswer} accent={accent} />

        <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ ...wrappingTextStyle }}>
            <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>HLD / LLD Blueprint</div>
            <h2 style={{ ...wrappingTextStyle, color: "#f8fbff", fontSize: 18, lineHeight: 1.25, marginTop: 4 }}>{blueprint.title}</h2>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
            {["Diagram", "HLD", "LLD", "Guide", "Patterns", "Interview"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={studioTab === tab ? "glass-button" : ""}
                onClick={() => setStudioTab(tab)}
                style={{
                  border: `1px solid ${studioTab === tab ? accent : "rgba(255,255,255,.08)"}`,
                  borderRadius: 7,
                  color: studioTab === tab ? "#f8fbff" : "#9fb0c7",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "7px 10px",
                  background: studioTab === tab ? "rgba(139,211,255,.12)" : "rgba(0,0,0,.14)",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {studioTab === "Diagram" && (
          <DiagramBoard board={diagramBoard} roadmap={referenceRoadmap} accent={accent} onEvaluate={evaluateDiagram} />
        )}

        {studioTab === "HLD" && (
          <div style={{ display: "grid", gap: 11 }}>
            <ArchitectureFlow
              blueprint={blueprint}
              activeIndex={flowIndex}
              accent={accent}
              onSelectStep={setFlowIndex}
              selectedScenarioId={selectedScenarioId}
              onScenarioSelect={setSelectedScenarioId}
            />
            <MermaidExportPanel title="Export the active HLD scenario as a clean Mermaid flowchart." mermaid={hldMermaid} accent={accent} />
            <FailureRecoverySimulator accent={accent} />
            <div style={responsiveGrid(220)}>
              <ListPanel title="Functional Requirements" icon="ti-list-check" items={blueprint.hld.requirements} accent={accent} />
              <ListPanel title="Non-Functional Requirements" icon="ti-gauge" items={blueprint.hld.nonFunctional} accent={accent} />
              <ListPanel title="Services" icon="ti-topology-star" accent={accent}>
                <div style={{ display: "grid", gap: 7 }}>
                  {blueprint.hld.services.map((service) => (
                    <div key={service.name} style={{ color: "#9fb0c7", fontSize: 11.4, lineHeight: 1.45 }}>
                      <strong style={{ color: "#eaf2ff" }}>{service.name}</strong>: {service.responsibility}
                    </div>
                  ))}
                </div>
              </ListPanel>
              <ListPanel title="APIs" icon="ti-api" accent={accent}>
                <div style={{ display: "grid", gap: 7 }}>
                  {blueprint.hld.apis.map((api) => (
                    <div key={`${api.method}-${api.path}`} style={{ color: "#9fb0c7", fontSize: 11.4, lineHeight: 1.45 }}>
                      <strong style={{ color: "#a7f3d0" }}>{api.method}</strong> <span style={{ color: "#eaf2ff" }}>{api.path}</span> - {api.purpose}
                    </div>
                  ))}
                </div>
              </ListPanel>
              <ListPanel title="Scaling & Reliability" icon="ti-chart-arrows" items={blueprint.hld.scaling} accent={accent} />
              <ListPanel title="Risks / Trade-offs" icon="ti-alert-triangle" items={blueprint.hld.risks} accent={accent} />
            </div>
          </div>
        )}

        {studioTab === "LLD" && (
          <div style={{ display: "grid", gap: 11 }}>
            <RequestLifecycleDeepDive blueprint={blueprint} accent={accent} />
            <MermaidExportPanel title="Export the LLD code-layer simulator as a Mermaid sequence-style flowchart." mermaid={lldMermaid} accent={accent} />
            <DbIndexVisualizer accent={accent} />
            <ImplementationMode blueprint={blueprint} accent={accent} />
            <CodeMappingView blueprint={blueprint} accent={accent} />
            <div style={responsiveGrid(230)}>
              <ListPanel title="Classes / Components" icon="ti-box" accent={accent}>
                <div style={{ display: "grid", gap: 7 }}>
                  {blueprint.lld.classes.map((item) => (
                    <div key={item.name} style={{ color: "#9fb0c7", fontSize: 11.4, lineHeight: 1.45 }}>
                      <strong style={{ color: "#eaf2ff" }}>{item.name}</strong>: {item.responsibility}
                    </div>
                  ))}
                </div>
              </ListPanel>
              <ListPanel title="Interfaces" icon="ti-plug-connected" items={blueprint.lld.interfaces} accent={accent} />
              <ListPanel title="Schema / Indexes" icon="ti-database" accent={accent}>
                <div style={{ display: "grid", gap: 7 }}>
                  {blueprint.lld.schema.map((line) => (
                    <code key={line} style={{ ...wrappingCodeStyle, color: "#d1fae5", fontSize: 11, lineHeight: 1.45 }}>{line}</code>
                  ))}
                </div>
              </ListPanel>
              <ListPanel title="Testing Strategy" icon="ti-test-pipe" items={blueprint.lld.testing} accent={accent} />
            </div>
          </div>
        )}

        {studioTab === "Guide" && (
          <div style={responsiveGrid(240)}>
            {Object.values(SYSTEM_DESIGN_LEARNING_CATALOG).map((track) => (
              <ListPanel key={track.label} title={track.label} icon={track.label === "System Design" ? "ti-sitemap" : "ti-code"} accent={accent}>
                <div style={{ display: "grid", gap: 10 }}>
                  <div>
                    <div style={{ color: "#eaf2ff", fontSize: 11, fontWeight: 900, marginBottom: 5, textTransform: "uppercase" }}>Core Concepts</div>
                    <ul style={{ color: "#9fb0c7", display: "grid", fontSize: 11.3, gap: 5, lineHeight: 1.45, margin: 0, paddingLeft: 16 }}>
                      {track.coreConcepts.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div style={{ color: "#eaf2ff", fontSize: 11, fontWeight: 900, marginBottom: 5, textTransform: "uppercase" }}>Key Technologies</div>
                    <ul style={{ color: "#9fb0c7", display: "grid", fontSize: 11.3, gap: 5, lineHeight: 1.45, margin: 0, paddingLeft: 16 }}>
                      {track.keyTechnologies.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div style={{ color: "#eaf2ff", fontSize: 11, fontWeight: 900, marginBottom: 5, textTransform: "uppercase" }}>Common Patterns</div>
                    <ul style={{ color: "#9fb0c7", display: "grid", fontSize: 11.3, gap: 5, lineHeight: 1.45, margin: 0, paddingLeft: 16 }}>
                      {track.commonPatterns.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div style={{ color: "#eaf2ff", fontSize: 11, fontWeight: 900, marginBottom: 5, textTransform: "uppercase" }}>
                      {track.questionBreakdowns ? "Question Breakdowns" : "Practice Tasks"}
                    </div>
                    <ul style={{ color: "#9fb0c7", display: "grid", fontSize: 11.3, gap: 5, lineHeight: 1.45, margin: 0, paddingLeft: 16 }}>
                      {(track.questionBreakdowns || track.practiceTasks).map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </ListPanel>
            ))}
          </div>
        )}

        {studioTab === "Patterns" && (
          <div style={responsiveGrid(220)}>
            {Object.entries(SYSTEM_DESIGN_PATTERN_LIBRARY).map(([intent, patterns]) => (
              <ListPanel key={intent} title={`${intent.charAt(0).toUpperCase()}${intent.slice(1)} Patterns`} icon="ti-puzzle" accent={accent}>
                <div style={{ display: "grid", gap: 9 }}>
                  {patterns.map((pattern) => (
                    <div key={pattern.name} style={{ ...wrappingTextStyle, color: "#9fb0c7", fontSize: 11.3, lineHeight: 1.45 }}>
                      <strong style={{ color: "#eaf2ff" }}>{pattern.name}</strong>
                      <div>{pattern.intent}</div>
                      <div style={{ color: "#a7f3d0", marginTop: 3 }}>{pattern.useCase}</div>
                      <code style={{ ...wrappingCodeStyle, color: "#d1fae5", marginTop: 3 }}>{pattern.example}</code>
                    </div>
                  ))}
                </div>
              </ListPanel>
            ))}
            <ListPanel title="Recommended For This System" icon="ti-target-arrow" accent={accent}>
              <div style={{ display: "grid", gap: 7 }}>
                {blueprint.lld.patterns.map((pattern) => (
                  <div key={pattern.pattern} style={{ color: "#9fb0c7", fontSize: 11.4, lineHeight: 1.45 }}>
                    <strong style={{ color: "#eaf2ff" }}>{pattern.pattern}</strong>: {pattern.reason}
                  </div>
                ))}
              </div>
            </ListPanel>
          </div>
        )}

        {studioTab === "Interview" && (
          <div style={responsiveGrid(230)}>
            <ListPanel title="Clarify First" icon="ti-message-question" items={blueprint.interviewBreakdown.clarify} accent={accent} />
            <ListPanel title="Deep-Dive Map" icon="ti-route" items={blueprint.interviewBreakdown.deepDives} accent={accent} />
            <ListPanel title="Likely Follow-ups" icon="ti-messages" items={blueprint.interviewBreakdown.questions} accent={accent} />
          </div>
        )}
      </section>

      <div
        style={{
          ...responsiveGrid(210),
        }}
      >
        {SYSTEM_DESIGN_CANVAS_SECTIONS.map((section) => (
          <label
            key={section.key}
            style={{
              background: "rgba(255,255,255,.045)",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 8,
              display: "grid",
              gap: 7,
              minHeight: 146,
              minWidth: 0,
              padding: 10,
            }}
          >
            <span style={{ alignItems: "center", color: "#eaf2ff", display: "flex", fontSize: 12, fontWeight: 800, gap: 6 }}>
              <i className="ti ti-layout-kanban" style={{ color: accent, fontSize: 13 }} />
              {section.label}
            </span>
            <textarea
              value={canvasState.sections[section.key]}
              onChange={(event) => updateSection(section.key, event.target.value)}
              placeholder={section.placeholder}
              rows={4}
              style={{
                background: "rgba(0,0,0,.16)",
                border: "1px solid rgba(255,255,255,.07)",
                borderRadius: 7,
                color: "#f7fbff",
                fontSize: 12,
                lineHeight: 1.45,
                minHeight: 92,
                minWidth: 0,
                outline: "none",
                padding: 9,
                resize: "vertical",
                width: "100%",
              }}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
