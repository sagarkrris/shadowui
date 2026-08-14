export const SYSTEM_DESIGN_CANVAS_SECTIONS = [
  {
    key: "requirements",
    label: "Requirements",
    placeholder: "Users, core jobs, functional and non-functional requirements.",
  },
  {
    key: "constraints",
    label: "Constraints",
    placeholder: "Latency, consistency, privacy, budget, reliability, and launch scope.",
  },
  {
    key: "estimation",
    label: "Capacity",
    placeholder: "Traffic, storage, QPS, fanout, bandwidth, and growth assumptions.",
  },
  {
    key: "api",
    label: "API / Interfaces",
    placeholder: "Endpoints, events, contracts, request/response shapes, and error cases.",
  },
  {
    key: "data",
    label: "Data Model",
    placeholder: "Entities, indexes, partition keys, retention, and data ownership.",
  },
  {
    key: "architecture",
    label: "Architecture",
    placeholder: "Services, queues, caches, storage, dependencies, and request flow.",
  },
  {
    key: "scaling",
    label: "Scaling Plan",
    placeholder: "Bottlenecks, sharding, caching, backpressure, and failure handling.",
  },
  {
    key: "risks",
    label: "Risks / Trade-offs",
    placeholder: "Open questions, trade-offs, migrations, observability, and rollout risks.",
  },
];

const SECTION_KEYS = new Set(SYSTEM_DESIGN_CANVAS_SECTIONS.map((section) => section.key));

export const SYSTEM_DESIGN_PATTERN_LIBRARY = {
  creational: [
    {
      name: "Factory Method",
      intent: "Create domain objects without binding callers to concrete classes.",
      useCase: "Choose payment, notification, or ticket providers from configuration.",
      example: "PaymentProviderFactory returns StripePayment, WalletPayment, or CardPayment.",
    },
    {
      name: "Builder",
      intent: "Assemble complex request or response objects step by step.",
      useCase: "Build booking confirmations from seat, fare, user, and payment details.",
      example: "BookingSummaryBuilder.withSeat().withFare().withPolicy().build().",
    },
  ],
  structural: [
    {
      name: "Adapter",
      intent: "Wrap an external API behind an internal interface.",
      useCase: "Hide differences between payment gateways, email vendors, and seat-map providers.",
      example: "PaymentGatewayAdapter exposes authorize(), capture(), and refund().",
    },
    {
      name: "Facade",
      intent: "Expose a simple workflow over many subsystem calls.",
      useCase: "Create a single BookingFacade for reserve, pay, confirm, and notify.",
      example: "BookingFacade.book(request) coordinates inventory, pricing, payment, and notification services.",
    },
  ],
  behavioral: [
    {
      name: "Strategy",
      intent: "Swap algorithms behind the same interface.",
      useCase: "Apply pricing, seat allocation, retry, and cancellation policies by context.",
      example: "PricingStrategy can be SurgePricing, EarlyBirdPricing, or FlatPricing.",
    },
    {
      name: "State",
      intent: "Model lifecycle transitions explicitly.",
      useCase: "Prevent invalid booking transitions such as CONFIRMED to HELD without refund handling.",
      example: "ReservationState controls HELD -> CONFIRMED -> CANCELLED -> EXPIRED.",
    },
    {
      name: "Observer",
      intent: "Notify dependent workflows when domain events happen.",
      useCase: "Fan out booking-confirmed events to email, analytics, search indexing, and audit logs.",
      example: "BookingEventPublisher emits TicketConfirmed and PaymentFailed events.",
    },
  ],
};

export const SYSTEM_DESIGN_LEARNING_CATALOG = {
  systemDesign: {
    label: "System Design",
    coreConcepts: [
      "Clarify scope, users, traffic shape, read/write ratio, and success metrics before naming services.",
      "Estimate capacity, QPS, storage growth, p95 latency, and peak-to-average load.",
      "Choose consistency boundaries: strong writes for critical state, eventual consistency for derived views.",
      "Design reliability with idempotency, retries, backpressure, failover, and observability.",
    ],
    keyTechnologies: [
      "Load balancers and API gateways for routing, auth, rate limits, and request shaping.",
      "Relational databases for transactional integrity; document or wide-column stores for flexible/high-scale reads.",
      "Cache layers for hot reads, session state, distributed locks, and short-lived projections.",
      "Queues, streams, and outbox events for async workflows, retries, and fanout.",
      "Search indexes, object storage, metrics, logs, traces, and alerting for production operations.",
    ],
    commonPatterns: [
      "CQRS when write models and read views need different scaling paths.",
      "Outbox pattern to publish events reliably after a database transaction.",
      "Saga orchestration for multi-step workflows with compensating actions.",
      "Rate limiting, circuit breakers, bulkheads, and graceful degradation.",
    ],
    questionBreakdowns: [
      "Clarify requirements and explicitly separate must-have from nice-to-have features.",
      "Estimate load and identify the highest-contention write path.",
      "Draw APIs, storage, services, and request flows before optimization.",
      "Deep dive into bottlenecks, consistency, failure modes, and trade-offs.",
    ],
  },
  lowLevelDesign: {
    label: "Low-Level Design",
    coreConcepts: [
      "Translate HLD services into classes, interfaces, state machines, and domain aggregates.",
      "Keep invariants close to the domain model instead of scattering them across controllers.",
      "Model lifecycle transitions, validation rules, errors, and idempotency keys explicitly.",
      "Prefer small interfaces and dependency inversion around storage and external providers.",
    ],
    keyTechnologies: [
      "Class diagrams, sequence diagrams, state diagrams, and interface contracts.",
      "Repository, service, command handler, and adapter layers.",
      "Unit, contract, concurrency, and integration tests for domain behavior.",
      "Schema constraints, unique indexes, optimistic locking, and migration strategy.",
    ],
    commonPatterns: [
      "Strategy for pricing, allocation, ranking, and policy variation.",
      "State for reservation, payment, order, and workflow lifecycles.",
      "Adapter for payment, notification, storage, and vendor APIs.",
      "Factory Method and Builder for provider selection and complex response assembly.",
    ],
    practiceTasks: [
      "Define class responsibilities and interfaces for the core workflow.",
      "Write a sequence flow for the happy path and one failure path.",
      "List invariants, edge cases, and concurrency tests.",
      "Map each class back to one HLD service or boundary.",
    ],
  },
};

// Each entry supplies domain-specific decisions. The template builder turns those
// decisions into a complete, editable design brief for the canvas.
const practice = (id, title, level, focus, flow, data, risks) => ({ id, title, level, focus, flow, data, risks });

export const SYSTEM_DESIGN_INTERVIEW_PRACTICE_CATALOG = [
  practice("f-rate-limit", "Design a simple rate limiter", "Fresher", "Per-user/IP limits, burst handling, 429 responses, and a clear failure policy.", "Client -> gateway middleware -> Redis counter/window -> API service -> metrics", "rules, identity key, counter, expiry, abuse event", "window boundary, hot keys, spoofed identity, and fail-open versus fail-closed"),
  practice("f-notifications", "Design a basic notification system", "Fresher", "Create, preference-check, queue, deliver, and record notifications.", "Client -> notification API -> preferences -> queue -> channel worker -> delivery log", "notification, template, preference, attempt, provider receipt", "duplicate delivery, opt-out races, provider outage, retry exhaustion"),
  practice("f-url-shortener", "Design a URL shortening service", "Fresher", "Create short links, redirect at low latency, expire links, and collect analytics asynchronously.", "Client -> link API -> link service -> cache -> link DB -> analytics queue", "code, destination URL, owner, expiry, click event", "custom alias collision, hot links, malicious destination, code collision"),
  practice("f-polling", "Design a simple polling and voting app", "Fresher", "Create polls, accept one valid vote, show totals, and close polls safely.", "Client -> poll API -> vote service -> transactional DB -> aggregate cache", "poll, option, voter, vote, status", "double vote, concurrent tally update, abuse, stale totals"),
  practice("f-inventory", "Design a basic inventory management system", "Fresher", "Track stock, reservations, adjustments, and low-stock events with an audit trail.", "Client -> inventory API -> stock service -> DB ledger -> alert queue", "SKU, warehouse balance, reservation, adjustment ledger", "oversell, negative stock, duplicate adjustment, stale availability"),
  practice("f-expense-split", "Design a simple expense-splitting app like Splitwise", "Fresher", "Record group expenses, calculate balances, and settle with exact money arithmetic.", "Client -> expense API -> ledger service -> relational DB -> notification worker", "group, member, expense, split, immutable ledger", "rounding, duplicate expense, settlement edits, membership changes"),
  practice("f-job-board", "Design a basic job board", "Fresher", "Publish jobs, search listings, accept applications, and enforce employer ownership.", "Client -> job API -> job service -> DB -> search index -> application queue", "employer, job, candidate, application, status", "unauthorized edit, duplicate application, index lag, expired job"),
  practice("f-attendance", "Design a simple attendance tracking system", "Fresher", "Capture check-in/out, calculate attendance, and correct records through auditable events.", "Device -> attendance API -> policy service -> event store -> reporting model", "employee, shift, attendance event, correction, policy", "timezone, duplicate scan, offline device, override abuse"),
  practice("f-library", "Design a basic library management system", "Fresher", "Search, borrow, return, hold copies, and calculate overdue fees.", "Client -> library API -> circulation service -> DB -> reminder queue", "book, copy, member, loan, hold, fine", "double checkout, lost copy, hold expiry, overdue job"),
  practice("f-issue-tracker", "Design a simple bug and issue tracker", "Fresher", "Create, assign, comment, filter, and transition issues through a visible workflow.", "Client -> issue API -> workflow service -> DB -> notification queue", "project, issue, comment, assignee, status history", "invalid transition, concurrent edit, notification noise, slow filters"),
  practice("f-todo", "Design a to-do list application with reminders", "Fresher", "Manage tasks, recurrences, reminders, and completion history.", "Client -> task API -> scheduler -> task DB -> reminder queue -> worker", "task, recurrence, reminder, delivery attempt", "DST, duplicate reminder, missed retry, deleted task race"),
  practice("f-hotel", "Design a basic hotel booking system", "Fresher", "Search availability, hold rooms, confirm bookings, cancel, and notify guests.", "Client -> booking API -> availability service -> reservation DB -> payment adapter -> queue", "hotel, room type, nightly stock, hold, reservation", "overbooking, date-range lock, payment timeout, cancellation policy"),
  practice("f-leaderboard", "Design a simple game leaderboard", "Fresher", "Verify score submissions, rank players, and show global and nearby ranks.", "Game -> score API -> validation -> score store -> sorted-set cache", "player, season, score, submission, rank snapshot", "cheating, duplicate score, tie rule, season rollover"),
  practice("f-blog", "Design a basic blogging platform", "Fresher", "Publish drafts, posts, tags, comments, and reader feeds.", "Client -> content API -> publishing service -> DB -> index queue -> CDN", "author, post version, tag, comment, publication state", "draft exposure, abuse, cache invalidation, edit history"),
  practice("f-wallet", "Design a simple payment wallet", "Fresher", "Add funds, transfer balances, and expose correct transaction history.", "Client -> wallet API -> ledger service -> transactional DB -> notification queue", "wallet, immutable posting, transfer, idempotency key", "double spend, duplicate retry, balance drift, reconciliation"),
  practice("f-voting", "Design a basic online voting system", "Fresher", "Authenticate eligibility, submit exactly one secret ballot, and release results safely.", "Client -> voting API -> eligibility service -> ballot store -> tally worker", "election, eligibility, encrypted ballot, receipt", "ballot secrecy, double vote, auditability, premature results"),
  practice("f-gallery", "Design a simple image gallery with tagging", "Fresher", "Upload, tag, browse, search, process, and deliver images safely.", "Client -> upload API -> object store -> processing queue -> metadata DB -> CDN", "image, owner, tag, variant, moderation state", "large uploads, unsafe content, orphaned object, index lag"),
  practice("f-support", "Design a basic customer support ticketing system", "Fresher", "Create, route, prioritize, update, and resolve customer tickets.", "Client -> ticket API -> routing service -> DB -> agent notification queue", "customer, ticket, message, assignment, SLA event", "SLA breach, duplicate ticket, permission boundary, assignment race"),
  practice("f-carpool", "Design a simple carpooling system", "Fresher", "Offer rides, match riders, reserve seats, and track trip lifecycle.", "Client -> trip API -> matching service -> trip DB -> notification queue", "driver, vehicle, trip, route, seat reservation", "seat contention, cancellation, location privacy, route mismatch"),
  practice("f-reviews", "Design a rate-and-review system for products", "Fresher", "Accept verified reviews, moderate abuse, aggregate ratings, and serve product pages quickly.", "Client -> review API -> moderation -> DB -> aggregate queue -> product cache", "product, reviewer, rating, review, aggregate", "fraud, duplicate review, moderation lag, aggregate consistency"),
  practice("e-distributed-rate-limit", "Design a distributed rate limiter used across microservices", "Experienced", "Globally coherent tenant quotas with low edge latency and controlled regional overshoot.", "Client -> edge gateway -> local limiter -> quota lease store -> policy control plane -> telemetry", "policy version, quota lease, counter shard, identity", "clock skew, partition, hot tenant, quota overshoot, degraded policy"),
  practice("e-payments", "Design a payment processing system like Razorpay", "Experienced", "Authorize, capture, refund, reconcile, and audit payments across provider boundaries.", "Client -> payment API -> idempotency ledger -> provider adapters -> outbox -> reconciliation workers", "payment intent, ledger posting, provider ref, webhook, reconciliation break", "provider disagreement, webhook replay, PCI scope, duplicate charge, financial close"),
  practice("e-inventory", "Design a real-time inventory system for quick commerce", "Experienced", "Serve local availability while orders, pickers, and replenishment update stock continuously.", "Client -> availability API -> regional inventory -> reservation ledger -> stream -> warehouse projection", "store SKU balance, reservation, pick event, replenishment, version", "oversell, stale projection, hold expiry, store partition"),
  practice("e-scheduler", "Design a distributed job scheduler like Airflow", "Experienced", "Version DAGs, schedule durable runs, allocate workers, retry safely, and expose operations.", "control plane -> scheduler leader -> metadata DB -> work queue -> workers -> result store", "DAG version, run, task instance, lease, attempt", "leader election, duplicate execution, backfill storm, cycle, poison task"),
  practice("e-fraud", "Design a fraud detection pipeline for financial transactions", "Experienced", "Score transactions in real time and close the feedback loop for rules and models.", "payment stream -> feature service -> rules/model scorer -> decision API -> case queue -> feedback store", "transaction, feature vector, model version, decision, analyst outcome", "feature freshness, false positive, adversary, model drift, latency"),
  practice("e-notifications", "Design a notification service that fans out across push, SMS, and email", "Experienced", "Prioritize multi-channel delivery with preferences, provider isolation, and compliance.", "producer -> ingress -> preference service -> priority streams -> channel workers -> providers", "campaign, preference, message envelope, attempt, receipt", "burst, duplicate send, provider outage, quiet hour, retention"),
  practice("e-observability", "Design a distributed logging and monitoring system", "Experienced", "Ingest, correlate, retain, query, and alert on telemetry for many tenants.", "agents -> ingestion -> stream -> storage tiers -> query service -> alert engine", "metric series, log event, trace span, tenant, retention tier", "cardinality, sampling bias, alert noise, tenant isolation, query cost"),
  practice("e-order-tracking", "Design a live order tracking system like Swiggy or Zomato", "Experienced", "Match order/courier, stream location, and provide customer-visible ETA states.", "order API -> dispatch -> location stream -> ETA service -> websocket gateway -> app", "order state, location, assignment, route snapshot, ETA version", "GPS noise, offline courier, dispatch contention, fanout, ETA error"),
  practice("e-sso", "Design a scalable authentication system with SSO across services", "Experienced", "Federate identity with secure sessions, token lifecycle, tenant policy, and audit.", "client -> identity provider -> authorization server -> token service -> gateway -> audit stream", "tenant, identity, client, consent, session, signing key", "token theft, key rotation, logout propagation, takeover, tenant isolation"),
  practice("e-transactions", "Design a distributed transaction system for a banking application", "Experienced", "Move money through durable ledgers, idempotent commands, sagas, and reconciliation.", "transfer API -> saga -> account ledgers -> outbox streams -> reconciliation", "transfer, ledger posting, saga step, idempotency key, exception", "partial commit, duplicate message, compensation, audit, availability"),
  practice("e-search", "Design a search and ranking system for an e-commerce catalog like Flipkart", "Experienced", "Index changing catalog/inventory and rank results by relevance, availability, and policy.", "catalog stream -> indexing -> search API -> retrieval -> ranker -> cache -> feedback", "product document, inventory projection, query feature, ranking signal, click", "index freshness, relevance drift, facet cost, hot query, fairness"),
  practice("e-auction", "Design a real-time bidding and auction system", "Experienced", "Accept fair ordered bids, close deterministically, and settle winners.", "client -> bid gateway -> auction shard -> event journal -> close scheduler -> settlement", "auction, bid, sequence, reserve, close event", "late bid, clock fairness, hot auction, duplicate bid, settlement"),
  practice("e-config", "Design a distributed configuration management system", "Experienced", "Publish validated versioned configuration with staged rollout, acknowledgement, and rollback.", "control plane -> validation -> version store -> distribution stream -> agent cache -> SDK", "namespace, config version, target rule, rollout, acknowledgement", "bad-config blast radius, stale agent, secret, schema evolution, rollback"),
  practice("e-residency", "Design a multi-region deployment system with data residency constraints", "Experienced", "Serve globally while enforcing regional data placement and demonstrable residency boundaries.", "global edge -> residency router -> regional services -> regional stores -> control metadata", "tenant residency policy, replica, encryption key, migration record", "cross-region leak, constrained failover, migration, latency, audit"),
  practice("e-order-book", "Design a stock trading order matching engine", "Experienced", "Preserve price-time priority, match deterministically, and publish market data.", "gateway -> risk check -> partitioned order book -> trade journal -> settlement -> market data", "order, book level, execution, position, sequence", "ordering, burst, cancel race, recovery replay, regulation"),
  practice("e-api-gateway", "Design a distributed rate-limited API gateway", "Experienced", "Route, authenticate, shape, and protect traffic with tenant-aware policies.", "client -> edge POP -> gateway policy engine -> local cache/limiter -> services -> telemetry", "route policy, credential, quota, circuit state, trace", "policy consistency, overload, DDoS, downstream brownout, cost"),
  practice("e-feature-flags", "Design a scalable feature flag and experimentation platform", "Experienced", "Evaluate flags at low latency, experiment safely, and measure exposure/outcomes.", "control plane -> flag store -> stream distribution -> SDK cache -> exposure pipeline -> analytics", "flag, rule, segment, allocation, exposure, metric", "stale flag, bucketing, privacy, kill-switch latency, bias"),
  practice("e-cache-invalidation", "Design a distributed cache invalidation system", "Experienced", "Invalidate/version cached views across regions while preserving source-of-truth correctness.", "write service -> transaction/outbox -> invalidation stream -> regional consumers -> versioned cache", "cache key, version, invalidation, dependency map, TTL", "lost event, stale read, reorder, herd, replay"),
  practice("e-settlement", "Design a settlement and reconciliation system for payments", "Experienced", "Reconcile internal records with provider/bank files, resolve breaks, and close periods.", "ledger stream -> settlement orchestrator -> file import -> match engine -> exception workflow -> reports", "ledger posting, settlement batch, provider record, match, exception", "delayed file, rounding, duplicate record, unmatched fund, audit"),
  practice("e-queue-orders", "Design a fault-tolerant queue-based order processing system", "Experienced", "Process orders asynchronously with durable state, retries, idempotency, and visible progress.", "order API -> transactional store/outbox -> queue -> idempotent workers -> fulfillment -> projection", "order, outbox, attempt, idempotency key, fulfillment state", "poison message, duplicate fulfillment, lag, replay, compensation"),
];

function mermaidSafeLabel(value) {
  return String(value || "").replace(/["\\]/g, "").replace(/\s+/g, " ").trim();
}

function javaTypeName(title) {
  const words = String(title || "")
    .replace(/\b(design|a|an|system|service|like|for|with|used|across)\b/gi, " ")
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .slice(0, 3);
  return words.map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`).join("") || "Domain";
}

function buildJavaImplementationSketch(entry) {
  const type = javaTypeName(entry.title);
  return `// Java 8+ service slice: transaction + idempotency + outbox\npublic final class ${type}CommandService {\n  private final ${type}Repository repository;\n  private final IdempotencyStore idempotencyStore;\n  private final OutboxPublisher outboxPublisher;\n\n  public ${type}CommandService(${type}Repository repository,\n      IdempotencyStore idempotencyStore, OutboxPublisher outboxPublisher) {\n    this.repository = repository;\n    this.idempotencyStore = idempotencyStore;\n    this.outboxPublisher = outboxPublisher;\n  }\n\n  public ${type}Result execute(${type}Command command) {\n    command.validate();\n    ${type}Result prior = idempotencyStore.find(command.idempotencyKey());\n    if (prior != null) return prior;\n\n    return repository.inTransaction(() -> {\n      ${type}Result result = repository.apply(command);\n      idempotencyStore.save(command.idempotencyKey(), result);\n      outboxPublisher.append(${type}Event.completed(result));\n      return result;\n    });\n  }\n}`;
}

export function buildSystemDesignInterviewAnswer(entry) {
  if (!entry?.id || !entry?.title) throw new Error("A complete interview practice entry is required.");
  const flow = String(entry.flow).split("->").map((step) => step.trim()).filter(Boolean);
  const risks = String(entry.risks).split(",").map((risk) => risk.trim()).filter(Boolean);
  const dataModel = String(entry.data).split(",").map((item) => item.trim()).filter(Boolean);
  const mermaid = ["flowchart LR", ...flow.slice(0, 8).map((step, index) => {
    const node = `N${index}`;
    const next = index < flow.length - 1 ? ` --> N${index + 1}` : "";
    return `  ${node}[\"${mermaidSafeLabel(step)}\"]${next}`;
  })].join("\n");

  return {
    title: entry.title,
    summary: entry.focus,
    flow,
    dataModel,
    mermaid,
    javaFocus: "Show one correctness-critical command: validate at the boundary, deduplicate retries, commit domain state and an outbox event atomically, then publish asynchronously.",
    javaCode: buildJavaImplementationSketch(entry),
    answer: [
      `Start by confirming the product boundary: ${entry.focus}`,
      `The synchronous path is ${flow.slice(0, 4).join(" -> ")}. Make the source-of-truth write transactional; publish downstream work through an outbox so a committed write cannot lose its event.`,
      `Model ${dataModel.slice(0, 4).join(", ")}. Use stable IDs, lifecycle states, ownership boundaries, unique constraints, and indexes that match the highest-volume lookup.`,
      "Use idempotency keys on externally retried commands. Workers must deduplicate, retry with bounded exponential backoff, and send poison work to a DLQ with a replay runbook.",
      "Measure p95/p99 latency, error rate, saturation, queue lag, cache hit rate, duplicate suppression, and business correctness signals. Roll out behind a flag, observe a small cohort, then expand with a rollback path.",
    ],
    tradeOffs: risks.map((risk) => `Address ${risk} with an explicit invariant, failure signal, and recovery operation.`),
  };
}

export function buildSystemDesignInterviewPracticeTemplate(entry) {
  if (!entry?.id || !entry?.title) throw new Error("A complete interview practice entry is required.");
  return {
    id: entry.id,
    label: entry.title.replace(/^Design (a |an )?/i, ""),
    level: entry.level,
    focus: entry.focus,
    answer: buildSystemDesignInterviewAnswer(entry),
    problem: entry.title,
    sections: {
      requirements: `${entry.focus} Define launch scope, measurable SLOs, authorization boundaries, and explicit non-goals before decomposing services.`,
      architecture: `${entry.flow}. Keep the correctness-critical command synchronous; use a transactional outbox and idempotent workers for slow side effects.`,
      data: `${entry.data}. Name the source of truth, lifecycle states, ownership, unique constraints, and indexes driven by the hot access pattern.`,
      scaling: "Estimate peak QPS and storage first. Partition hot keys, cache only derived reads, enforce backpressure, and plan capacity with queue lag, p95 latency, and error-budget metrics.",
      risks: `${entry.risks}. Explain the consistency boundary, retry/deduplication strategy, observable failure signal, rollout, and rollback path.`,
    },
  };
}

const GENERIC_TECHNOLOGIES = [
  "API gateway",
  "Relational database for transactional records",
  "Redis for locks, sessions, and hot reads",
  "Message queue for asynchronous workflows",
  "Object storage for invoices, exports, and audit artifacts",
  "Metrics, logs, traces, and alerting",
];

export const SYSTEM_DESIGN_REFERENCE_PLAYBOOK = [
  {
    source: "System Design Primer",
    url: "https://github.com/donnemartin/system-design-primer",
    moves: ["Clarify use cases and constraints", "Draw high-level components", "Deep dive core components", "Scale bottlenecks with trade-offs"],
  },
  {
    source: "Build Your Own X",
    url: "https://github.com/codecrafters-io/build-your-own-x",
    moves: ["Rebuild one primitive", "Trace real internals", "Name the storage and protocol choices", "Ship a tiny working version"],
  },
  {
    source: "Tech Interview Handbook",
    url: "https://github.com/yangshun/tech-interview-handbook",
    moves: ["Use a busy-engineer checklist", "Prioritize common interview signals", "Practice concise explanations", "Review behavioral and technical trade-offs"],
  },
];

export const SYSTEM_DESIGN_PRIMER_TOPIC_GROUPS = [
  {
    title: "Scalability Foundations",
    concepts: ["Performance vs scalability", "Latency vs throughput", "Availability vs consistency", "CAP trade-offs"],
    diagramCue: "Draw the request path, then annotate latency, throughput, and availability pressure points.",
  },
  {
    title: "Edge and Networking",
    concepts: ["DNS", "CDN", "Load balancer", "Reverse proxy", "Layer 4 vs Layer 7 routing"],
    diagramCue: "Place DNS, CDN, load balancer, gateway, and app tier in the first visible lane.",
  },
  {
    title: "Application Architecture",
    concepts: ["Application layer", "Microservices", "Service discovery", "RPC", "REST"],
    diagramCue: "Split responsibilities into services only after the use cases and scale justify the split.",
  },
  {
    title: "Data Architecture",
    concepts: ["Relational database", "Replication", "Sharding", "Denormalization", "SQL tuning", "NoSQL stores"],
    diagramCue: "Mark the source of truth, indexes, partitions, replicas, and derived read models.",
  },
  {
    title: "Caching and Async",
    concepts: ["Cache-aside", "Write-through", "Write-behind", "Refresh-ahead", "Message queues", "Back pressure"],
    diagramCue: "Show what is cached, how it is invalidated, and which work moves to queues.",
  },
  {
    title: "Operations and Security",
    concepts: ["Observability", "Rate limiting", "Retries", "Failover", "Security boundaries"],
    diagramCue: "Add metrics, logs, traces, alerts, secrets, abuse controls, and rollback points.",
  },
];

export const SYSTEM_DESIGN_PRIMER_EXERCISES = [
  {
    title: "Pastebin / Bitly / URL Shortener",
    diagramFocus: ["API gateway", "URL hash", "Metadata store", "Cache", "Redirect read path"],
    deepDive: "Hash collisions, custom aliases, TTL, analytics, and hot-link caching.",
  },
  {
    title: "Twitter / Social Feed and Search",
    diagramFocus: ["Post service", "Timeline fanout", "Feed cache", "Search index", "Notification queue"],
    deepDive: "Fanout-on-write versus fanout-on-read, ranking freshness, celebrity accounts, and search indexing.",
  },
  {
    title: "Web Crawler",
    diagramFocus: ["URL frontier", "Fetcher workers", "Parser", "Dedup store", "Index pipeline"],
    deepDive: "Politeness, robots rules, duplicate detection, scheduling, and failure recovery.",
  },
  {
    title: "Key-Value Store for Search",
    diagramFocus: ["Client library", "Router", "Partitioned storage", "Replication", "Compaction"],
    deepDive: "Consistent hashing, replication factor, read repair, compaction, and hot partitions.",
  },
  {
    title: "Sales Ranking / Analytics",
    diagramFocus: ["Event ingestion", "Stream processor", "Aggregate store", "Ranking service", "Dashboard"],
    deepDive: "Windowing, late events, idempotent ingestion, approximate counts, and freshness.",
  },
  {
    title: "System Scaling on Cloud",
    diagramFocus: ["Load balancer", "Auto-scaled app tier", "Managed database", "Object storage", "Queue workers"],
    deepDive: "Horizontal scaling, regional failover, observability, cost controls, and rollout strategy.",
  },
];

export function buildSystemDesignReferenceRoadmap(problem = "") {
  const label = titleCaseWords(problem) || "Current System";

  return {
    title: `${label} Reference Roadmap`,
    topicGroups: SYSTEM_DESIGN_PRIMER_TOPIC_GROUPS.map((group) => ({
      ...group,
      concepts: [...group.concepts],
    })),
    sampleBoards: SYSTEM_DESIGN_PRIMER_EXERCISES.map((exercise) => ({
      ...exercise,
      diagramFocus: [...exercise.diagramFocus],
    })),
    practicePrompt: `Use a primer-style loop for ${label}: clarify scope and constraints, draw the high-level design, deep dive the riskiest core component, then scale with bottlenecks and trade-offs.`,
  };
}

function cleanText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function editableText(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function titleCaseWords(value) {
  return cleanText(value)
    .replace(/^(design|implement|build|create)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function slug(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function inferDomain(problem) {
  const text = cleanText(problem).toLowerCase();
  if (/ticket|booking|reservation|seat|event|movie|train|flight|bus/.test(text)) return "ticketBooking";
  if (/chat|message|messenger|whatsapp|slack/.test(text)) return "chat";
  if (/url|shortener|tinyurl|link/.test(text)) return "urlShortener";
  if (/rate.?limit|throttle|quota/.test(text)) return "rateLimiter";
  return "generic";
}

function genericBlueprint(problem) {
  const title = titleCaseWords(problem) || "System Design Problem";
  const entity = title.replace(/\s+System$/i, "");

  return {
    requirements: [
      `Users can create, view, update, and cancel ${entity.toLowerCase()} workflows.`,
      "System validates requests, permissions, quotas, and duplicate actions.",
      "Critical state changes are durable, auditable, and idempotent.",
      "Operators can inspect health, errors, and business metrics.",
    ],
    nonFunctional: [
      "Keep p95 read latency under 200 ms for common views.",
      "Protect write paths with idempotency keys and retry-safe APIs.",
      "Design for horizontal scale and graceful degradation.",
      "Capture audit logs for sensitive or revenue-impacting changes.",
    ],
    APIs: [
      { method: "POST", path: `/${slug(entity) || "resources"}`, purpose: `Create a ${entity.toLowerCase()} request.` },
      { method: "GET", path: `/${slug(entity) || "resources"}/{id}`, purpose: "Read current state and derived details." },
      { method: "POST", path: `/${slug(entity) || "resources"}/{id}/actions`, purpose: "Execute a validated domain action." },
    ],
    services: [
      { name: "API Service", responsibility: "Validation, auth, idempotency, and request orchestration." },
      { name: "Domain Service", responsibility: "Business rules, lifecycle transitions, and consistency boundaries." },
      { name: "Worker Service", responsibility: "Async retries, notifications, indexing, and reconciliation." },
    ],
    dataModel: [
      { entity: "User", fields: "id, identity, role, status" },
      { entity, fields: "id, ownerId, status, version, createdAt, updatedAt" },
      { entity: "DomainEvent", fields: "id, aggregateId, type, payload, createdAt" },
    ],
    flows: [
      "Client submits a request with an idempotency key.",
      "API service validates auth and forwards to the domain service.",
      "Domain service writes the state transition and outbox event in one transaction.",
      "Workers publish events to downstream systems and retry safely on failures.",
    ],
    scaling: [
      "Cache read-heavy projections and invalidate from domain events.",
      "Partition high-volume records by tenant, region, or aggregate id.",
      "Use queues for slow side effects and backpressure.",
    ],
    risks: [
      "Duplicate writes during retries.",
      "Partial failure after database commit but before notification.",
      "Unbounded hot partitions for popular resources.",
    ],
    lldClasses: [
      { name: `${entity.replace(/\s+/g, "")}Service`, responsibility: "Owns command validation and workflow orchestration." },
      { name: `${entity.replace(/\s+/g, "")}Repository`, responsibility: "Persists aggregate state and optimistic versions." },
      { name: "DomainEventPublisher", responsibility: "Publishes durable events to async consumers." },
    ],
    patterns: [
      { pattern: "Facade", reason: "Expose one simple workflow over multiple subsystems." },
      { pattern: "State", reason: "Keep lifecycle transitions explicit and testable." },
      { pattern: "Adapter", reason: "Shield the domain from external vendor APIs." },
    ],
    schema: [
      `CREATE TABLE ${slug(entity).replace(/-/g, "_") || "resource"} (id, owner_id, status, version, created_at, updated_at);`,
      "CREATE TABLE domain_events (id, aggregate_id, event_type, payload_json, created_at);",
    ],
    questions: [
      "What consistency guarantee matters most for the main write path?",
      "Where would you put idempotency and retry boundaries?",
      "Which read views can be eventually consistent?",
    ],
  };
}

function ticketBookingBlueprint() {
  return {
    requirements: [
      "Customers search events, view seat availability, create bookings, pay, and receive tickets.",
      "A seat can be held by only one customer during the reservation window.",
      "Expired holds return seats to inventory automatically.",
      "Admins can create venues, events, seating maps, pricing tiers, and cancellation policies.",
    ],
    nonFunctional: [
      "Prevent overselling under high concurrency.",
      "Keep seat-map reads fast during traffic spikes.",
      "Make payment confirmation idempotent and auditable.",
      "Support regional failover for browsing while protecting the primary write path.",
    ],
    APIs: [
      { method: "GET", path: "/events?city=&date=", purpose: "Search and filter events." },
      { method: "GET", path: "/events/{eventId}/seat-map", purpose: "Return available, held, and sold seats." },
      { method: "POST", path: "/reservations", purpose: "Hold selected seats with an idempotency key." },
      { method: "POST", path: "/reservations/{id}/payments", purpose: "Authorize or capture payment for a hold." },
      { method: "POST", path: "/reservations/{id}/confirm", purpose: "Issue tickets after payment succeeds." },
    ],
    services: [
      { name: "Search Service", responsibility: "Indexes events, venues, and public metadata for fast discovery." },
      { name: "Inventory Service", responsibility: "Owns seat availability, holds, expiry, and anti-oversell checks." },
      { name: "Reservation Service", responsibility: "Coordinates hold lifecycle, idempotency, and confirmation." },
      { name: "Payment Service", responsibility: "Wraps payment providers and reconciles authorization/capture state." },
      { name: "Ticket Service", responsibility: "Issues QR/barcode tickets and manages ticket status." },
      { name: "Notification Service", responsibility: "Sends confirmations, reminders, and cancellation messages." },
    ],
    dataModel: [
      { entity: "Venue", fields: "id, name, city, seatingMapVersion" },
      { entity: "Event", fields: "id, venueId, name, startsAt, status" },
      { entity: "Seat", fields: "id, venueId, section, row, number, type" },
      { entity: "Reservation", fields: "id, userId, eventId, status, expiresAt, idempotencyKey" },
      { entity: "ReservationSeat", fields: "reservationId, seatId, price, status" },
      { entity: "Payment", fields: "id, reservationId, provider, providerRef, status, amount" },
      { entity: "Ticket", fields: "id, reservationId, seatId, codeHash, status" },
    ],
    flows: [
      "Customer opens the seat map; reads come from cache backed by Inventory Service.",
      "Customer requests a hold; Inventory Service locks selected event-seat rows or uses conditional writes.",
      "Reservation Service creates a HELD reservation with expiry and emits ReservationHeld.",
      "Payment Service authorizes payment through a provider adapter.",
      "Reservation Service confirms the reservation, marks seats SOLD, and asks Ticket Service to issue tickets.",
      "Expiry worker releases HELD seats when payment is not completed in time.",
    ],
    scaling: [
      "Shard inventory by eventId because contention is event-local.",
      "Use Redis for short-lived seat-map cache, but keep database constraints as the source of truth.",
      "Use queues and outbox events for ticket issuance, email, analytics, and search indexing.",
      "Apply waiting rooms or rate limits for extremely popular events.",
    ],
    risks: [
      "Race conditions when two users hold the same seat.",
      "Payment succeeds but confirmation worker fails.",
      "Seat-map cache shows stale availability under traffic spikes.",
      "Hot event partitions can overload one database shard.",
    ],
    lldClasses: [
      { name: "ReservationService", responsibility: "Creates holds, confirms bookings, cancels or expires reservations." },
      { name: "SeatInventoryRepository", responsibility: "Executes conditional seat hold and release operations." },
      { name: "ReservationStateMachine", responsibility: "Allows HELD, CONFIRMED, CANCELLED, and EXPIRED transitions." },
      { name: "PaymentGateway", responsibility: "Interface for authorize, capture, refund, and webhook handling." },
      { name: "TicketIssuer", responsibility: "Generates ticket records and secure redeemable codes." },
      { name: "BookingEventPublisher", responsibility: "Publishes ReservationHeld, PaymentCaptured, and TicketIssued events." },
    ],
    patterns: [
      { pattern: "State", reason: "Reservation lifecycle rules are central and must reject invalid transitions." },
      { pattern: "Strategy", reason: "Pricing, cancellation, and seat allocation policies vary by event." },
      { pattern: "Adapter", reason: "Payment providers and notification vendors should not leak into core booking logic." },
      { pattern: "Observer", reason: "Ticket issuance, notifications, and analytics react to booking events." },
    ],
    schema: [
      "CREATE TABLE reservations (id, user_id, event_id, status, expires_at, idempotency_key, version);",
      "CREATE UNIQUE INDEX reservation_idempotency ON reservations(user_id, idempotency_key);",
      "CREATE TABLE reservation_seats (reservation_id, event_id, seat_id, price, status);",
      "CREATE UNIQUE INDEX sold_or_held_seat ON reservation_seats(event_id, seat_id) WHERE status IN ('HELD','SOLD');",
      "CREATE TABLE payments (id, reservation_id, provider, provider_ref, status, amount);",
      "CREATE TABLE tickets (id, reservation_id, seat_id, code_hash, status);",
    ],
    questions: [
      "How do you prevent two customers from booking the same seat during a flash sale?",
      "What happens if payment succeeds but ticket issuance fails?",
      "Which parts of the seat map can be cached, and what is the invalidation strategy?",
      "How would you split HLD services from LLD classes for this problem?",
      "What is your plan for expired holds, refunds, and payment webhooks?",
    ],
  };
}

function normalizeSections(value = {}) {
  const input = value && typeof value === "object" ? value : {};

  return SYSTEM_DESIGN_CANVAS_SECTIONS.reduce((sections, section) => {
    sections[section.key] = editableText(input[section.key]);
    return sections;
  }, {});
}

export function createSystemDesignCanvasState(value = {}) {
  const input = value && typeof value === "object" ? value : {};
  const sections = normalizeSections(input.sections || input);

  return {
    problem: editableText(input.problem ?? input.title),
    sections,
  };
}

export function buildSystemDesignStudioBlueprint(value = {}) {
  const input = typeof value === "string" ? { problem: value } : (value || {});
  const state = createSystemDesignCanvasState(input);
  const problem = cleanText(state.problem) || "Design a scalable product system";
  const title = titleCaseWords(problem) || "Scalable Product System";
  const domain = inferDomain(problem);
  const blueprint = domain === "ticketBooking" ? ticketBookingBlueprint() : genericBlueprint(problem);

  return {
    problem,
    title,
    domain,
    hld: {
      requirements: blueprint.requirements,
      nonFunctional: blueprint.nonFunctional,
      apis: blueprint.APIs,
      services: blueprint.services,
      dataModel: blueprint.dataModel,
      flows: blueprint.flows,
      scaling: blueprint.scaling,
      risks: blueprint.risks,
      technologies: GENERIC_TECHNOLOGIES,
    },
    lld: {
      classes: blueprint.lldClasses,
      patterns: blueprint.patterns,
      schema: blueprint.schema,
      interfaces: [
        "Repository interfaces hide persistence details from domain services.",
        "Provider interfaces wrap external payment, notification, search, and storage vendors.",
        "Command handlers validate inputs and call domain services with idempotency context.",
      ],
      testing: [
        "Unit test lifecycle transitions and invalid state moves.",
        "Concurrency test duplicate hold or duplicate write scenarios.",
        "Contract test provider adapters and webhook handlers.",
        "Integration test idempotency and outbox retry behavior.",
      ],
    },
    interviewBreakdown: {
      clarify: [
        "Confirm users, scale, geography, write/read ratio, and strongest consistency requirement.",
        "State assumptions before drawing services or choosing storage.",
      ],
      deepDives: [
        "Data consistency and race conditions",
        "API and idempotency design",
        "Storage schema and indexes",
        "Caching and invalidation",
        "Failure recovery and observability",
      ],
      questions: blueprint.questions,
    },
  };
}

export function buildSystemDesignDiagramBoard(value = {}) {
  const blueprint = buildSystemDesignStudioBlueprint(value);
  const primaryServices = blueprint.hld.services.slice(0, 4).map((service) => service.name);
  const primaryEntities = blueprint.hld.dataModel.slice(0, 4).map((entity) => entity.entity);
  const patterns = blueprint.lld.patterns.slice(0, 3).map((pattern) => pattern.pattern);

  return {
    title: `${blueprint.title} Diagram Board`,
    lanes: [
      {
        title: "Users + Edge",
        intent: "Show who enters the system and where request protection starts.",
        nodes: ["Web / Mobile Client", "API Gateway", "Rate Limit / Auth"],
      },
      {
        title: "Core Services",
        intent: "Keep major responsibilities separated before deep diving.",
        nodes: primaryServices.length ? primaryServices : ["API Service", "Domain Service", "Worker Service"],
      },
      {
        title: "Data + Async",
        intent: "Make consistency, caching, and delayed work visible.",
        nodes: ["Cache", ...primaryEntities.slice(0, 2), "Queue / Stream"].slice(0, 4),
      },
      {
        title: "Reliability",
        intent: "Connect the design to production-grade failure handling.",
        nodes: ["Metrics / Logs / Traces", "Retry + Idempotency", "Alerts / Runbooks"],
      },
    ],
    edges: [
      "Client -> API Gateway -> Core Service",
      "Core Service -> Cache / Database",
      "Core Service -> Queue -> Worker",
      "Worker -> Notifications / Search / Analytics",
    ],
    evaluationRubric: [
      { label: "Scope", check: blueprint.hld.requirements[0] || "Functional requirements are explicit." },
      { label: "Scale", check: blueprint.hld.nonFunctional[0] || "Traffic, storage, and latency targets are named." },
      { label: "Consistency", check: blueprint.hld.risks[0] || "The highest-risk consistency path is called out." },
      { label: "LLD Mapping", check: patterns.length ? `Patterns mapped: ${patterns.join(", ")}.` : "Classes and patterns map to HLD services." },
    ],
    whiteboardPrompts: [
      "Draw the request path first, then annotate the bottleneck.",
      "Circle the source of truth and mark every cache as derived.",
      "Add one failure path: retry, timeout, duplicate request, or stale read.",
      "Map one HLD service to classes, interfaces, and tests.",
    ],
    referenceMoves: SYSTEM_DESIGN_REFERENCE_PLAYBOOK,
  };
}

export function buildSystemDesignDiagramEvaluationPrompt(value = {}) {
  const state = createSystemDesignCanvasState(value);
  const board = buildSystemDesignDiagramBoard(state);

  return [
    "Evaluate this system design diagram board like a senior interviewer.",
    `Problem: ${cleanText(state.problem) || board.title}`,
    "",
    "Diagram lanes:",
    ...board.lanes.map((lane) => `- ${lane.title}: ${lane.nodes.join(" -> ")}`),
    "",
    "Expected edges:",
    ...board.edges.map((edge) => `- ${edge}`),
    "",
    "Rubric:",
    ...board.evaluationRubric.map((item) => `- ${item.label}: ${item.check}`),
    "",
    "Reference-inspired checks:",
    ...SYSTEM_DESIGN_REFERENCE_PLAYBOOK.map((item) => `- ${item.source}: ${item.moves.join(" -> ")}`),
    "",
    ...sectionLines(state),
    "",
    "Return: diagram clarity score, missing boxes, missing arrows, weak trade-offs, one improved diagram in Mermaid, and the next three practice steps.",
  ].join("\n");
}

export function buildSystemDesignStudioPrompt(value = {}) {
  const blueprint = buildSystemDesignStudioBlueprint(value);

  return [
    "Generate an interview-ready system design answer with both HLD and LLD.",
    `Problem: ${blueprint.problem}`,
    "",
    "Cover HLD:",
    "- Requirements and non-functional requirements",
    "- APIs and service architecture",
    "- Data model, storage choices, scaling, reliability, and trade-offs",
    "",
    "Cover LLD:",
    "- Classes, interfaces, design patterns, sequence flow, database schema, and edge cases",
    "- Explain how the LLD maps back to the HLD services",
    "",
    "Use these local blueprint hints:",
    `Services: ${blueprint.hld.services.map((service) => service.name).join(", ")}`,
    `Entities: ${blueprint.hld.dataModel.map((entity) => entity.entity).join(", ")}`,
    `Patterns: ${blueprint.lld.patterns.map((pattern) => pattern.pattern).join(", ")}`,
    "",
    "End with likely interviewer follow-up questions and concise model answers.",
  ].join("\n");
}

function sectionLines(state) {
  return SYSTEM_DESIGN_CANVAS_SECTIONS.map((section) => {
    const content = cleanText(state.sections[section.key]) || "Not captured yet.";
    return `${section.label}: ${content}`;
  });
}

export function buildSystemDesignReviewPrompt(value = {}) {
  const state = createSystemDesignCanvasState(value);
  const problem = cleanText(state.problem) || "the current system design problem";

  return [
    "Review this system design canvas like a senior interviewer.",
    `Problem: ${problem}`,
    "",
    ...sectionLines(state),
    "",
    "Give a concise score, strongest decisions, missing depth, risky assumptions, and the next three improvements.",
  ].join("\n");
}

export function buildSystemDesignMockPrompt(value = {}) {
  const state = createSystemDesignCanvasState(value);
  const problem = cleanText(state.problem) || "the current system design problem";

  return [
    "Run a system design mock interview from this canvas.",
    `Problem: ${problem}`,
    "",
    ...sectionLines(state),
    "",
    "Ask one question at a time. Push on vague areas, require trade-offs, and wait for my answer before moving on.",
  ].join("\n");
}

export const buildCanvasReviewPrompt = buildSystemDesignReviewPrompt;
export const buildCanvasMockPrompt = buildSystemDesignMockPrompt;

export function exportSystemDesignCanvasMarkdown(value = {}) {
  const state = createSystemDesignCanvasState(value);
  const problem = cleanText(state.problem) || "Untitled";
  const body = SYSTEM_DESIGN_CANVAS_SECTIONS.map((section) => {
    const content = cleanText(state.sections[section.key]) || "_Not captured yet._";
    return `## ${section.label}\n\n${content}`;
  });

  return [`# System Design Canvas: ${problem}`, "", ...body].join("\n\n");
}

export function isSystemDesignCanvasSection(key) {
  return SECTION_KEYS.has(key);
}
