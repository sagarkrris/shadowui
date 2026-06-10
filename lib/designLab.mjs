const PATTERN_GROUPS = {
  creational: [
    {
      id: "factory-method",
      name: "Factory Method",
      intent: "Create objects through a stable interface when callers should not know concrete classes.",
      whenToUse: [
        "Provider selection changes by configuration, tenant, region, or feature flag.",
        "Construction logic has validation or setup steps that should not leak into callers.",
      ],
      whenNotToUse: [
        "There is only one concrete type and no likely variation.",
        "A plain constructor or small function communicates the dependency more clearly.",
      ],
      javaExample: [
        "interface NotificationSender { void send(Message message); }",
        "class NotificationSenderFactory {",
        "  NotificationSender forChannel(Channel channel) {",
        "    return channel == Channel.EMAIL ? new EmailSender() : new PushSender();",
        "  }",
        "}",
      ].join("\n"),
      springBootExample: [
        "@Service",
        "class NotificationSenderRegistry {",
        "  private final Map<String, NotificationSender> senders;",
        "  NotificationSender get(String channel) { return senders.get(channel); }",
        "}",
      ].join("\n"),
      interviewTraps: [
        "Do not add a factory just to hide every constructor.",
        "Name the variation point: provider, channel, payment method, or tenant.",
      ],
      practicePrompt: "Refactor notification provider selection into Factory Method and explain the variation point.",
    },
    {
      id: "builder",
      name: "Builder",
      intent: "Assemble complex objects step by step while keeping construction readable.",
      whenToUse: [
        "A request or response has many optional fields.",
        "Construction order or validation matters.",
      ],
      whenNotToUse: [
        "The object has two or three required fields.",
        "Setters would create mutable objects with unclear validity.",
      ],
      javaExample: [
        "BookingSummary summary = BookingSummary.builder()",
        "  .reservation(reservation)",
        "  .payment(payment)",
        "  .tickets(tickets)",
        "  .build();",
      ].join("\n"),
      springBootExample: [
        "@Service",
        "class BookingSummaryAssembler {",
        "  BookingSummary assemble(Reservation reservation) {",
        "    return BookingSummary.builder().reservation(reservation).build();",
        "  }",
        "}",
      ].join("\n"),
      interviewTraps: [
        "A builder should protect readability or validity, not just add boilerplate.",
        "Call out whether the built object is immutable.",
      ],
      practicePrompt: "Design a BookingSummary builder for reservation, payment, tickets, policy, and receipt fields.",
    },
  ],
  structural: [
    {
      id: "adapter",
      name: "Adapter",
      intent: "Wrap an external API behind an internal contract.",
      whenToUse: [
        "Vendor APIs differ from your domain language.",
        "You need contract tests around a third-party dependency.",
      ],
      whenNotToUse: [
        "The external dependency is already a stable internal interface.",
        "The adapter becomes a pass-through with no translation or protection.",
      ],
      javaExample: [
        "interface PaymentGateway { PaymentResult authorize(PaymentRequest request); }",
        "class StripePaymentAdapter implements PaymentGateway {",
        "  public PaymentResult authorize(PaymentRequest request) {",
        "    return map(stripeClient.authorize(toStripe(request)));",
        "  }",
        "}",
      ].join("\n"),
      springBootExample: [
        "@Component",
        "class StripePaymentAdapter implements PaymentGateway {",
        "  private final StripeClient stripeClient;",
        "  public PaymentResult authorize(PaymentRequest request) { return map(stripeClient.authorize(request)); }",
        "}",
      ].join("\n"),
      interviewTraps: [
        "Do not let vendor objects leak into service or controller layers.",
        "Mention retries, timeouts, idempotency, and contract tests.",
      ],
      practicePrompt: "Wrap a payment provider API with an Adapter and explain error mapping.",
    },
    {
      id: "facade",
      name: "Facade",
      intent: "Expose one simple workflow over multiple subsystems.",
      whenToUse: [
        "A user action coordinates several services.",
        "You want a clear application-level entrypoint for a workflow.",
      ],
      whenNotToUse: [
        "It becomes a large god object.",
        "The facade hides important failure or consistency boundaries.",
      ],
      javaExample: [
        "class BookingFacade {",
        "  BookingResult book(BookingCommand command) {",
        "    var hold = inventory.hold(command.seats());",
        "    var payment = payments.capture(command.payment());",
        "    return tickets.issue(hold, payment);",
        "  }",
        "}",
      ].join("\n"),
      springBootExample: [
        "@Service",
        "class BookingFacade {",
        "  BookingResult book(BookingCommand command) { return reservationService.book(command); }",
        "}",
      ].join("\n"),
      interviewTraps: [
        "Separate orchestration from domain rules.",
        "Call out transaction and compensation boundaries.",
      ],
      practicePrompt: "Create a BookingFacade for hold, pay, confirm, notify, and rollback paths.",
    },
  ],
  behavioral: [
    {
      id: "strategy",
      name: "Strategy",
      intent: "Swap an algorithm or policy at runtime without changing the caller.",
      whenToUse: [
        "Pricing, ranking, allocation, retry, or validation varies by context.",
        "Large if/switch blocks keep growing with new cases.",
      ],
      whenNotToUse: [
        "There are only two simple branches that are unlikely to change.",
        "The abstraction hides a simple rule and makes debugging harder.",
      ],
      javaExample: [
        "interface PricingStrategy { Money price(BookingContext context); }",
        "class SurgePricing implements PricingStrategy {",
        "  public Money price(BookingContext context) { return context.base().multiply(1.25); }",
        "}",
      ].join("\n"),
      springBootExample: [
        "@Service",
        "class PricingService {",
        "  private final List<PricingStrategy> strategies;",
        "  Money quote(BookingContext context) { return select(context).price(context); }",
        "}",
      ].join("\n"),
      interviewTraps: [
        "Avoid overuse when a simple if statement is clearer.",
        "Explain how the strategy is selected and tested.",
      ],
      practicePrompt: "Use Strategy to support standard, surge, and early-bird ticket pricing.",
    },
    {
      id: "state",
      name: "State",
      intent: "Model allowed lifecycle transitions explicitly.",
      whenToUse: [
        "An entity moves through strict states with invalid transitions.",
        "Rules differ by current status.",
      ],
      whenNotToUse: [
        "The lifecycle is just a display label.",
        "A state machine would be heavier than a guarded enum transition.",
      ],
      javaExample: [
        "enum ReservationStatus { HELD, CONFIRMED, CANCELLED, EXPIRED }",
        "class ReservationStateMachine {",
        "  ReservationStatus confirm(ReservationStatus current) {",
        "    if (current != ReservationStatus.HELD) throw new InvalidTransitionException();",
        "    return ReservationStatus.CONFIRMED;",
        "  }",
        "}",
      ].join("\n"),
      springBootExample: [
        "@Service",
        "class ReservationWorkflow {",
        "  void confirm(UUID reservationId) { stateMachine.confirm(repository.getStatus(reservationId)); }",
        "}",
      ].join("\n"),
      interviewTraps: [
        "Name invalid transitions and compensation behavior.",
        "Mention concurrency control around transition writes.",
      ],
      practicePrompt: "Design reservation states for HELD, CONFIRMED, CANCELLED, and EXPIRED.",
    },
    {
      id: "observer",
      name: "Observer",
      intent: "Notify dependent workflows when a domain event happens.",
      whenToUse: [
        "Several workflows react to the same event.",
        "Side effects should not block the core transaction.",
      ],
      whenNotToUse: [
        "The side effect is required before the command can succeed.",
        "Unbounded listeners make behavior hard to trace.",
      ],
      javaExample: [
        "interface BookingEventListener { void on(BookingConfirmed event); }",
        "class NotificationListener implements BookingEventListener {",
        "  public void on(BookingConfirmed event) { notificationService.send(event); }",
        "}",
      ].join("\n"),
      springBootExample: [
        "@Component",
        "class BookingEvents {",
        "  @EventListener",
        "  void onBookingConfirmed(BookingConfirmed event) { notifications.send(event); }",
        "}",
      ].join("\n"),
      interviewTraps: [
        "Distinguish in-process events from durable queues.",
        "Mention retries, ordering, and idempotent consumers.",
      ],
      practicePrompt: "Fan out booking-confirmed events to tickets, email, analytics, and audit logging.",
    },
  ],
};

const HLD_TRACK = {
  label: "HLD",
  workflowDiagram: {
    title: "High-Level Request Workflow",
    summary: "Follow the request from user entrypoint through edge, services, data, async work, and observability.",
    stages: [
      {
        title: "Client Entry",
        icon: "ti-device-laptop",
        nodes: ["Web / Mobile", "Partner API"],
        signal: "User action or external request",
      },
      {
        title: "Edge Layer",
        icon: "ti-shield-check",
        nodes: ["API Gateway", "Load Balancer", "Rate Limit"],
        signal: "Auth, routing, throttling",
      },
      {
        title: "Core Services",
        icon: "ti-box-multiple",
        nodes: ["Domain Service", "Read Service", "Worker Service"],
        signal: "Business workflow boundary",
      },
      {
        title: "Data Layer",
        icon: "ti-database",
        nodes: ["Primary DB", "Cache", "Search Index"],
        signal: "Consistency and query path",
      },
      {
        title: "Async + Ops",
        icon: "ti-activity",
        nodes: ["Queue / Stream", "Notifications", "Metrics / Traces"],
        signal: "Fanout, retries, monitoring",
      },
    ],
  },
  coreConcepts: [
    "Clarify users, core use cases, traffic shape, read/write ratio, and success metrics.",
    "Estimate QPS, storage, peak load, latency targets, and availability requirements.",
    "Choose consistency boundaries before choosing databases or caches.",
    "Discuss failure modes, observability, rollout, and trade-offs.",
  ],
  keyTechnologies: [
    "API gateway and load balancer",
    "Relational database, document store, wide-column store, and search index",
    "Redis or equivalent cache for hot reads, locks, and sessions",
    "Queues, streams, outbox events, and async workers",
    "Metrics, logs, traces, dashboards, and alerts",
  ],
  commonPatterns: [
    "CQRS for separating write models from read projections.",
    "Outbox for publishing events after a database commit.",
    "Saga for multi-step workflows with compensating actions.",
    "Rate limiting and circuit breakers for protecting dependencies.",
  ],
  questionBreakdowns: [
    "Clarify scope and constraints before drawing boxes.",
    "Estimate load and identify bottlenecks.",
    "Define APIs, storage, services, and request flow.",
    "Deep dive into consistency, scale, reliability, and trade-offs.",
  ],
};

const LLD_TRACK = {
  label: "LLD",
  workflowDiagram: {
    title: "Low-Level Collaboration Workflow",
    summary: "Map one HLD service into concrete classes, interfaces, state transitions, persistence, and tests.",
    stages: [
      {
        title: "API Contract",
        icon: "ti-file-code",
        nodes: ["Request DTO", "Controller", "Validator"],
        signal: "Shape input and reject bad requests early",
      },
      {
        title: "Application Layer",
        icon: "ti-route",
        nodes: ["Command Handler", "Service Facade", "Transaction Boundary"],
        signal: "Coordinate the use case",
      },
      {
        title: "Domain Layer",
        icon: "ti-cube",
        nodes: ["Aggregate", "State Machine", "Policy / Strategy"],
        signal: "Protect invariants and decisions",
      },
      {
        title: "Ports + Adapters",
        icon: "ti-plug-connected",
        nodes: ["Repository Port", "Payment Adapter", "Event Publisher"],
        signal: "Hide infrastructure behind contracts",
      },
      {
        title: "Verification",
        icon: "ti-test-pipe",
        nodes: ["Unit Tests", "Contract Tests", "Concurrency Tests"],
        signal: "Prove behavior and edge cases",
      },
    ],
  },
  coreConcepts: [
    "Translate HLD services into classes, interfaces, state machines, and aggregates.",
    "Keep invariants inside the domain layer instead of controllers.",
    "Model lifecycle transitions, validation rules, idempotency, and error paths explicitly.",
    "Use dependency inversion around repositories and external providers.",
  ],
  keyTechnologies: [
    "Class diagrams, sequence diagrams, and state diagrams",
    "Service, repository, adapter, command handler, and event publisher layers",
    "Unique indexes, optimistic locking, and schema constraints",
    "Unit, contract, concurrency, and integration tests",
  ],
  commonPatterns: [
    "Strategy for pricing, allocation, ranking, and policy choices.",
    "State for orders, reservations, payments, and workflow lifecycles.",
    "Adapter for payment, notification, search, and storage providers.",
    "Factory Method and Builder for provider selection and object assembly.",
  ],
  practiceTasks: [
    "Define class responsibilities and interfaces for the core workflow.",
    "Write a sequence flow for the happy path and one failure path.",
    "List invariants, edge cases, and concurrency tests.",
    "Map each class back to one HLD service boundary.",
  ],
};

const PRACTICE_SYSTEMS = [
  {
    id: "ticket-booking",
    title: "Ticket Booking System",
    difficulty: "Senior",
    focus: "Inventory consistency, payment idempotency, reservation lifecycle, and event fanout.",
    hldAngles: ["Seat inventory service", "Reservation service", "Payment service", "Ticket service", "Async notifications"],
    lldAngles: ["ReservationStateMachine", "PaymentGateway adapter", "PricingStrategy", "SeatInventoryRepository"],
    patterns: ["State", "Strategy", "Adapter", "Observer"],
  },
  {
    id: "rate-limiter",
    title: "Distributed Rate Limiter",
    difficulty: "Mid-Senior",
    focus: "Quotas, token buckets, hot keys, edge enforcement, and graceful degradation.",
    hldAngles: ["API gateway integration", "Redis-backed counters", "Quota config service", "Metrics pipeline"],
    lldAngles: ["RateLimitPolicy", "TokenBucket", "QuotaRepository", "DecisionResult"],
    patterns: ["Strategy", "Factory Method", "Adapter"],
  },
  {
    id: "chat-system",
    title: "Realtime Chat System",
    difficulty: "Senior",
    focus: "Message fanout, ordering, presence, offline delivery, and moderation hooks.",
    hldAngles: ["WebSocket gateway", "Message service", "Presence service", "Push notification workers"],
    lldAngles: ["MessageRouter", "DeliveryStrategy", "ConversationRepository", "EventPublisher"],
    patterns: ["Observer", "Strategy", "Facade"],
  },
  {
    id: "news-feed",
    title: "Personalized News Feed",
    difficulty: "Staff",
    focus: "Ranking, fanout, caching, freshness, and explainable trade-offs.",
    hldAngles: ["Feed generation", "Ranking service", "Cache strategy", "Event ingestion"],
    lldAngles: ["RankingStrategy", "FeedMixer", "CandidateRepository", "ExperimentPolicy"],
    patterns: ["Strategy", "Builder", "Adapter"],
  },
];

const UML_CLASS_PRACTICE = [
  {
    id: "reservation-domain",
    title: "Reservation Domain UML",
    system: "Ticket Booking System",
    classes: [
      { name: "Reservation", fields: "id, userId, eventId, status, expiresAt", methods: "confirm(), cancel(), expire()" },
      { name: "SeatHold", fields: "eventId, seatId, status, price", methods: "hold(), release(), markSold()" },
      { name: "PaymentGateway", fields: "provider, timeoutPolicy", methods: "authorize(), capture(), refund()" },
      { name: "ReservationStateMachine", fields: "allowedTransitions", methods: "canMove(), move()" },
    ],
    relationships: [
      "Reservation owns one or more SeatHold records.",
      "ReservationService depends on PaymentGateway through an interface.",
      "ReservationStateMachine protects valid lifecycle transitions.",
    ],
    sequence: [
      "Controller receives POST /reservations.",
      "ReservationService checks idempotency and asks SeatInventoryRepository to hold seats.",
      "PaymentGateway authorizes payment.",
      "ReservationStateMachine moves HELD to CONFIRMED and publishes TicketIssued.",
    ],
  },
  {
    id: "rate-limit-domain",
    title: "Rate Limiter UML",
    system: "Distributed Rate Limiter",
    classes: [
      { name: "RateLimitPolicy", fields: "limit, window, algorithm", methods: "allows(request)" },
      { name: "TokenBucket", fields: "capacity, refillRate, tokens", methods: "tryConsume(), refill()" },
      { name: "QuotaRepository", fields: "tenantId, key", methods: "loadPolicy(), saveDecision()" },
      { name: "RateLimitDecision", fields: "allowed, remaining, resetAt", methods: "toHeaders()" },
    ],
    relationships: [
      "RateLimiter chooses a RateLimitPolicy by tenant and route.",
      "TokenBucket implements the policy algorithm.",
      "QuotaRepository hides Redis or storage details.",
    ],
    sequence: [
      "Gateway receives request and creates a rate-limit key.",
      "RateLimiter loads policy and bucket state.",
      "TokenBucket returns an allow or deny decision.",
      "Gateway returns headers and emits metrics.",
    ],
  },
];

const AGENTIC_AI_DESIGN_PROBLEMS = [
  {
    id: "coding-interview-agent",
    title: "Coding Interview Coach Agent",
    difficulty: "Senior",
    goal: "Design an agent that observes a candidate answer, gives hints, runs code, and evaluates explanation quality.",
    architecture: ["Planner", "Rubric Evaluator", "Code Runner Tool", "Hint Policy", "Memory Store", "Human Approval Gate"],
    guardrails: ["Never reveal full answer before hint budget is used.", "Sandbox code execution.", "Log tool calls and scoring rationale.", "Escalate unsafe or personal-data requests."],
    evaluation: ["Correctness feedback", "Reasoning trace", "Tool-use safety", "Beginner-friendly next step"],
  },
  {
    id: "enterprise-support-agent",
    title: "Enterprise Support Triage Agent",
    difficulty: "Staff",
    goal: "Design an agent that triages tickets, searches docs, proposes fixes, and asks for approval before customer-visible actions.",
    architecture: ["Intent Classifier", "Retrieval Tool", "Runbook Planner", "Risk Checker", "Draft Reply Tool", "Audit Timeline"],
    guardrails: ["No external send without approval.", "Cite source docs.", "Mask secrets in logs.", "Use confidence thresholds for escalation."],
    evaluation: ["Source grounding", "Approval correctness", "Risk classification", "Resolution time"],
  },
];

const REFERENCE_PLAYBOOKS = [
  {
    id: "system-design-primer",
    title: "System Design Foundations",
    focus: "Large-scale design interviews with diagrams, sample solutions, and trade-off vocabulary.",
    drills: [
      "Clarify users, constraints, traffic, data volume, and read/write ratio.",
      "Sketch high-level components and connections before optimizing.",
      "Deep dive core components, schema, APIs, cache, queues, and bottlenecks.",
      "Scale with load balancing, caching, sharding, async work, and explicit trade-offs.",
    ],
    outcomes: ["A clean architecture board", "A bottleneck and trade-off narrative", "A senior-level 90-second summary"],
  },
  {
    id: "build-your-own-x",
    title: "Build Internals Lab",
    focus: "Learn architecture by rebuilding real technologies from first principles.",
    drills: [
      "Pick one component: search engine, database, Docker-like runtime, shell, or network stack.",
      "Draw the smallest working internal loop before discussing scale.",
      "Name storage format, protocol, parser, scheduler, or indexing choices.",
      "Explain what changes when the toy version becomes production-grade.",
    ],
    outcomes: ["A small implementation plan", "A clear internal loop diagram", "A production-hardening checklist"],
  },
  {
    id: "tech-interview-handbook",
    title: "Interview Readiness Sprint",
    focus: "Busy-engineer prep structure for technical and behavioral interview signals.",
    drills: [
      "Keep answers crisp: problem, approach, trade-off, complexity, and risks.",
      "Pair system design practice with DSA pattern review and communication practice.",
      "Prepare common follow-ups and edge cases before mock rounds.",
      "Convert each practice session into one weakness, one fix, and one next drill.",
    ],
    outcomes: ["A balanced daily plan", "A sharper communication habit", "A review loop for weak spots"],
  },
];

const BUILD_YOUR_OWN_TRACKS = [
  {
    title: "Search Engine",
    buildLoop: ["Crawler", "Parser", "Inverted index", "Ranking", "Query API"],
    interviewTransfer: "Explains indexing, ranking, caching, freshness, and query latency with concrete internals.",
  },
  {
    title: "Database",
    buildLoop: ["Storage pages", "B-tree / LSM index", "Query planner", "Transactions", "Replication"],
    interviewTransfer: "Turns database trade-offs into visible choices around consistency, indexes, compaction, and recovery.",
  },
  {
    title: "Docker-like Runtime",
    buildLoop: ["Image layers", "Namespaces", "Process isolation", "Networking", "Logs"],
    interviewTransfer: "Connects deployment diagrams to isolation, resource limits, image distribution, and observability.",
  },
  {
    title: "Network Stack",
    buildLoop: ["Packets", "Routing", "TCP handshake", "Retries", "Backpressure"],
    interviewTransfer: "Makes latency, throughput, protocol choice, and failure handling easier to explain.",
  },
  {
    title: "Web Server",
    buildLoop: ["Socket accept", "HTTP parser", "Router", "Static files", "Worker pool"],
    interviewTransfer: "Grounds load balancers, reverse proxies, request routing, and concurrency models.",
  },
  {
    title: "Shell",
    buildLoop: ["Tokenizer", "Parser", "Process spawn", "Pipes", "Exit status"],
    interviewTransfer: "Builds intuition for command execution, process management, streams, and error propagation.",
  },
  {
    title: "Neural Network",
    buildLoop: ["Tensor", "Forward pass", "Loss", "Backpropagation", "Training loop"],
    interviewTransfer: "Supports agentic AI design discussions around model calls, evaluation, latency, and feedback loops.",
  },
];

const INTERVIEW_HANDBOOK_CHECKPOINTS = [
  {
    title: "Coding Interview Patterns",
    actions: ["Review common patterns", "Explain complexity", "Dry run edge cases", "Practice concise trade-offs"],
  },
  {
    title: "System Design Communication",
    actions: ["Clarify requirements", "Draw before optimizing", "State assumptions", "Close with risks and follow-ups"],
  },
  {
    title: "Behavioral Story Bank",
    actions: ["Prepare STAR stories", "Map stories to leadership signals", "Quantify impact", "Practice concise endings"],
  },
  {
    title: "Resume and Recruiter Screen",
    actions: ["Tighten project bullets", "Surface role keywords", "Prepare project deep dives", "Connect stack to outcomes"],
  },
  {
    title: "Final Week Sprint",
    actions: ["Pick high-yield questions", "Mock under time pressure", "Review mistakes", "Sleep and logistics check"],
  },
];

const REFERENCE_TOPIC_CATALOG = [
  {
    title: "Architecture Practice Map",
    focus: "System design interviews, architecture diagrams, scale trade-offs, and senior-level design vocabulary.",
    practiceContext: "Use this map when you need to explain a system end to end: requirements, request path, storage, scale, reliability, and trade-offs.",
    startHere: [
      "Start with the user request and draw the simplest path from client to database.",
      "Add scale pressure: traffic, latency target, storage size, and failure tolerance.",
      "Add one production feature at a time: cache, queue, shard, monitor, and secure.",
    ],
    beginnerExplainers: [
      {
        topic: "CAP theorem",
        what: "A shortcut for thinking about what happens when distributed systems cannot perfectly stay connected.",
        why: "It helps you explain why some systems choose always-available reads while others protect correctness first.",
        whereUsed: "Databases, caches, replicated services, and multi-region designs.",
      },
      {
        topic: "Cache-aside",
        what: "The app checks cache first, falls back to the database on a miss, then stores the result back in cache.",
        why: "It makes repeated reads faster without making the cache the source of truth.",
        whereUsed: "Profile pages, product catalogs, feeds, dashboards, and hot lookup APIs.",
      },
      {
        topic: "Message queues",
        what: "A queue stores work so another worker can process it later instead of blocking the user request.",
        why: "It keeps the app responsive and gives failed work a place to retry safely.",
        whereUsed: "Emails, notifications, video processing, search indexing, payments, and analytics events.",
      },
    ],
    visualFlow: ["Client", "Gateway", "Service", "Cache / DB", "Queue", "Worker", "Metrics"],
    difficultyPath: [
      { level: "Beginner", goal: "Explain each box in plain language and draw one request path." },
      { level: "Intermediate", goal: "Add cache, queue, storage choice, and one failure path." },
      { level: "Interview-ready", goal: "Defend trade-offs for consistency, availability, scale, cost, and operations." },
    ],
    guidedPractice: {
      title: "Design a URL shortener visually",
      steps: [
        "Draw client, API, URL service, database, and redirect path.",
        "Add cache for hot short links.",
        "Add queue for analytics events.",
        "Explain how you handle duplicate aliases, expired links, and traffic spikes.",
      ],
    },
    commonConfusions: [
      "Load balancer vs reverse proxy: both sit in front, but load balancers distribute traffic while reverse proxies often hide and protect backend services.",
      "Cache vs database: cache is fast and disposable; database is the durable source of truth.",
      "Queue vs stream: queues usually distribute jobs to workers; streams preserve event history for multiple consumers.",
    ],
    topics: [
      "Performance vs scalability",
      "Latency vs throughput",
      "Availability vs consistency",
      "CAP theorem",
      "Consistency patterns",
      "Availability patterns",
      "DNS",
      "CDN",
      "Load balancer",
      "Reverse proxy",
      "Application layer",
      "Microservices",
      "Service discovery",
      "RDBMS replication",
      "Sharding",
      "Denormalization",
      "SQL tuning",
      "NoSQL stores",
      "Cache-aside",
      "Write-through cache",
      "Write-behind cache",
      "Refresh-ahead cache",
      "Message queues",
      "Task queues",
      "Back pressure",
      "TCP vs UDP",
      "RPC vs REST",
      "Security",
      "Back-of-the-envelope calculations",
      "Latency numbers",
      "URL shortener",
      "Social feed and search",
      "Web crawler",
      "Key-value store",
      "Analytics ranking",
      "Cloud scaling",
      "Object-oriented design questions",
    ],
    practiceDrills: [
      "Draw the request path and mark where latency, throughput, and availability are affected.",
      "Choose one storage and cache strategy, then explain consistency and invalidation.",
      "Add one queue or stream and show retry, idempotency, back pressure, and monitoring.",
      "Close with a trade-off between simplicity, cost, correctness, and scale.",
    ],
    outcomes: ["Whiteboard confidence", "Trade-off vocabulary", "Bottleneck diagnosis", "Production-readiness thinking"],
  },
  {
    title: "Build Internals Practice Map",
    focus: "Learning internals by rebuilding small versions of real infrastructure and developer tools.",
    practiceContext: "Use this map when a topic feels abstract: rebuild a tiny working loop, then connect the internals to architecture decisions.",
    startHere: [
      "Start with the smallest input and output you can run locally.",
      "Draw the internal loop before adding features.",
      "Name the production concerns only after the tiny version works.",
    ],
    beginnerExplainers: [
      {
        topic: "Docker",
        what: "A way to package and run an app with its dependencies in an isolated environment.",
        why: "It makes deployment more predictable because the runtime looks the same across machines.",
        whereUsed: "Local development, CI, cloud deployments, microservices, and job workers.",
      },
      {
        topic: "Search Engine",
        what: "A system that crawls or receives documents, builds an index, and answers queries quickly.",
        why: "It teaches indexing, ranking, freshness, and query latency with concrete moving parts.",
        whereUsed: "Product search, docs search, log search, social search, and support knowledge bases.",
      },
      {
        topic: "Web Browser",
        what: "A client that requests pages, parses HTML/CSS/JavaScript, lays out content, and reacts to user input.",
        why: "It connects networking, parsing, rendering, performance, caching, and security.",
        whereUsed: "Frontend performance debugging, web platform interviews, and full-stack architecture reasoning.",
      },
    ],
    visualFlow: ["Input", "Parser", "Core Engine", "Storage / State", "Output", "Error Path", "Observability"],
    difficultyPath: [
      { level: "Beginner", goal: "Build the smallest working loop and explain every line of the flow." },
      { level: "Intermediate", goal: "Add persistence, concurrency, parsing, or protocol behavior." },
      { level: "Interview-ready", goal: "Explain how the toy version changes for reliability, security, and scale." },
    ],
    guidedPractice: {
      title: "Build a tiny search engine loop",
      steps: [
        "Accept three documents as input.",
        "Tokenize words and build an inverted index.",
        "Query one word and return matching document ids.",
        "Explain how ranking, caching, and incremental indexing would change the design.",
      ],
    },
    commonConfusions: [
      "Parser vs engine: parser understands input shape; engine performs the core behavior.",
      "Toy implementation vs production system: the toy proves the concept; production adds concurrency, durability, monitoring, and safety.",
      "Protocol vs storage format: protocol is how components talk; storage format is how data is kept.",
    ],
    topics: [
      "Distributed Systems",
      "3D Renderer",
      "AI Model",
      "Augmented Reality",
      "BitTorrent Client",
      "Blockchain",
      "Bot",
      "Command-Line Tool",
      "Database",
      "Docker",
      "Emulator / Virtual Machine",
      "Front-end Framework",
      "Game",
      "Interpreter",
      "Compiler",
      "Regex Engine",
      "Search Engine",
      "Shell",
      "Template Engine",
      "Text Editor",
      "Visual Recognition System",
      "Voxel Engine",
      "Web Browser",
      "Web Server",
      "Hash Table",
      "MQTT Broker",
      "Video Player",
    ],
    practiceDrills: [
      "Pick a tiny component and define input, processing loop, storage, and output.",
      "Draw the internal modules before writing the first implementation step.",
      "Name what breaks at production scale: concurrency, memory, persistence, latency, or recovery.",
      "Convert the build into a system design talking point with one diagram and one trade-off.",
    ],
    outcomes: ["Internals intuition", "Implementation-first learning", "Clearer architecture explanations", "Production-hardening instincts"],
  },
  {
    title: "Interview Readiness Practice Map",
    focus: "A complete interview-prep route from applications through coding, behavioral rounds, and offer-stage readiness.",
    practiceContext: "Use this map to turn broad preparation into a daily rhythm: DSA, communication, resume stories, mock review, and follow-up planning.",
    startHere: [
      "Start with one DSA pattern and one communication habit per day.",
      "Add one behavioral story and one resume project deep dive.",
      "Review mistakes into a next-day plan instead of collecting more random questions.",
    ],
    beginnerExplainers: [
      {
        topic: "Grind 75",
        what: "A focused problem set that covers common coding interview patterns without trying to solve everything.",
        why: "It gives beginners a structured path through high-yield DSA ideas.",
        whereUsed: "Daily DSA practice, mock interviews, and final-week review.",
      },
      {
        topic: "Behavioral questions",
        what: "Questions about how you worked, made decisions, handled conflict, and learned from outcomes.",
        why: "They show maturity, ownership, communication, and teamwork beyond code.",
        whereUsed: "Recruiter screens, hiring manager rounds, onsite loops, and leadership interviews.",
      },
      {
        topic: "Resume guide",
        what: "A way to turn project history into short, impact-focused bullets and deep-dive stories.",
        why: "It helps interviewers understand your scope, decisions, and measurable results quickly.",
        whereUsed: "Applications, recruiter calls, project deep dives, and compensation conversations.",
      },
    ],
    visualFlow: ["Profile", "DSA Pattern", "Mock Answer", "Behavioral Story", "Resume Deep Dive", "Review", "Next Plan"],
    difficultyPath: [
      { level: "Beginner", goal: "Practice one pattern or story slowly with a clear structure." },
      { level: "Intermediate", goal: "Add timing, edge cases, trade-offs, and follow-up questions." },
      { level: "Interview-ready", goal: "Run mixed mock sessions and convert feedback into a daily readiness plan." },
    ],
    guidedPractice: {
      title: "Run a balanced 45-minute prep block",
      steps: [
        "Solve one pattern question and say the approach out loud.",
        "Write one STAR story with measurable impact.",
        "Explain one resume project as problem, design, trade-off, and result.",
        "Record one mistake and choose tomorrow's first drill.",
      ],
    },
    commonConfusions: [
      "Memorizing answers vs practicing structure: structure helps you adapt when the question changes.",
      "Complexity vs correctness: a correct brute force is a starting point, then you improve it with trade-offs.",
      "Behavioral story vs status report: a story needs decision, action, impact, and reflection.",
    ],
    topics: [
      "Best practice questions",
      "Grind 75",
      "How to prepare",
      "Coding best practices",
      "Algorithm cheatsheets",
      "Data structure patterns",
      "Complexity analysis",
      "Resume guide",
      "Behavioral questions",
      "Front end interview preparation",
      "Application strategy",
      "Recruiter screen",
      "Technical phone screen",
      "Onsite loop",
      "Offer negotiation",
      "Communication habits",
      "Edge-case review",
      "Mock interview review",
    ],
    practiceDrills: [
      "Choose one DSA pattern and explain approach, complexity, edge cases, and trade-offs.",
      "Prepare one behavioral story with situation, action, measurable impact, and reflection.",
      "Run one timed mock and convert mistakes into a next-day practice target.",
      "Tighten one resume project into a technical deep-dive story.",
    ],
    outcomes: ["Balanced prep coverage", "Sharper answer structure", "Stronger behavioral stories", "Mock-review discipline"],
  },
];

function cleanSearchText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function normalizeDesignSystemSearchQuery(value) {
  return cleanSearchText(value).slice(0, 120);
}

export const DESIGN_LAB_CATALOG = {
  patterns: {
    label: "Design Patterns",
    groups: PATTERN_GROUPS,
  },
  hld: HLD_TRACK,
  lld: LLD_TRACK,
  practice: {
    label: "Practice Studio",
    systems: PRACTICE_SYSTEMS,
  },
  ood: {
    label: "OOD / UML",
    systems: UML_CLASS_PRACTICE,
  },
  agenticAi: {
    label: "Agentic AI",
    problems: AGENTIC_AI_DESIGN_PROBLEMS,
  },
  references: {
    label: "Practice Curriculum",
    playbooks: REFERENCE_PLAYBOOKS,
    topicCatalog: REFERENCE_TOPIC_CATALOG,
  },
};

export function getDesignLabPattern(id) {
  const patternId = String(id || "").trim().toLowerCase();
  const allPatterns = Object.values(PATTERN_GROUPS).flat();
  return allPatterns.find((pattern) => pattern.id === patternId || pattern.name.toLowerCase() === patternId) || allPatterns[0];
}

export function listDesignLabPracticeSystems() {
  return PRACTICE_SYSTEMS.map((system) => ({
    ...system,
    hldAngles: [...system.hldAngles],
    lldAngles: [...system.lldAngles],
    patterns: [...system.patterns],
  }));
}

export function listUmlClassPracticeSystems() {
  return UML_CLASS_PRACTICE.map((system) => ({
    ...system,
    classes: system.classes.map((item) => ({ ...item })),
    relationships: [...system.relationships],
    sequence: [...system.sequence],
  }));
}

export function listAgenticAiDesignProblems() {
  return AGENTIC_AI_DESIGN_PROBLEMS.map((problem) => ({
    ...problem,
    architecture: [...problem.architecture],
    guardrails: [...problem.guardrails],
    evaluation: [...problem.evaluation],
  }));
}

export function listReferencePlaybooks() {
  return REFERENCE_PLAYBOOKS.map((playbook) => ({
    ...playbook,
    drills: [...playbook.drills],
    outcomes: [...playbook.outcomes],
  }));
}

export function listBuildYourOwnTracks() {
  return BUILD_YOUR_OWN_TRACKS.map((track) => ({
    ...track,
    buildLoop: [...track.buildLoop],
  }));
}

export function listInterviewHandbookCheckpoints() {
  return INTERVIEW_HANDBOOK_CHECKPOINTS.map((checkpoint) => ({
    ...checkpoint,
    actions: [...checkpoint.actions],
  }));
}

export function listReferenceTopicCatalog() {
  return REFERENCE_TOPIC_CATALOG.map((group) => ({
    ...group,
    startHere: [...group.startHere],
    beginnerExplainers: group.beginnerExplainers.map((item) => ({ ...item })),
    visualFlow: [...group.visualFlow],
    difficultyPath: group.difficultyPath.map((item) => ({ ...item })),
    guidedPractice: {
      ...group.guidedPractice,
      steps: [...group.guidedPractice.steps],
    },
    commonConfusions: [...group.commonConfusions],
    topics: [...group.topics],
    practiceDrills: [...group.practiceDrills],
    outcomes: [...group.outcomes],
  }));
}

export function buildReferenceTopicImportPrompt() {
  const groups = listReferenceTopicCatalog();

  return [
    "Build an InterviewIQ practice plan from this Practice topic catalog.",
    "",
    ...groups.flatMap((group) => [
      group.title,
      `Focus: ${group.focus}`,
      `Context: ${group.practiceContext}`,
      "Start here:",
      ...group.startHere.map((item) => `- ${item}`),
      "Beginner explanation:",
      ...group.beginnerExplainers.map((item) => `- ${item.topic}: ${item.what} Why it matters: ${item.why} Used in: ${item.whereUsed}`),
      `Visual flow: ${group.visualFlow.join(" -> ")}`,
      "Difficulty path:",
      ...group.difficultyPath.map((item) => `- ${item.level}: ${item.goal}`),
      `Topics: ${group.topics.join(", ")}`,
      "Practice drills:",
      ...group.practiceDrills.map((item) => `- ${item}`),
      `Try this practice: ${group.guidedPractice.title}`,
      ...group.guidedPractice.steps.map((item) => `- ${item}`),
      "Common confusions:",
      ...group.commonConfusions.map((item) => `- ${item}`),
      `Outcomes: ${group.outcomes.join(", ")}`,
      "",
    ]),
    "Return a diagrammatic weekly plan with: system design boards, build-from-scratch labs, DSA checkpoints, behavioral story work, and review signals.",
  ].join("\n");
}

export function buildDesignLabPracticePrompt(systemId) {
  const system = listDesignLabPracticeSystems().find((item) => item.id === systemId) || listDesignLabPracticeSystems()[0];

  return [
    `Run a guided Design Lab practice round for: ${system.title}.`,
    `Difficulty: ${system.difficulty}.`,
    `Focus: ${system.focus}`,
    "",
    "Cover HLD:",
    `- ${system.hldAngles.join("\n- ")}`,
    "",
    "Cover LLD:",
    `- ${system.lldAngles.join("\n- ")}`,
    "",
    `Design patterns to discuss: ${system.patterns.join(", ")}.`,
    "Ask one clarifying question first, then walk through an interview-ready solution with trade-offs and likely follow-up questions.",
  ].join("\n");
}

export function buildUmlClassDesignPrompt(systemId) {
  const system = listUmlClassPracticeSystems().find((item) => item.id === systemId) || listUmlClassPracticeSystems()[0];

  return [
    `Run an Object-Oriented Design and UML practice round for: ${system.system}.`,
    `Focus board: ${system.title}.`,
    "",
    "Class diagram candidates:",
    ...system.classes.map((item) => `- ${item.name}: fields(${item.fields}); methods(${item.methods})`),
    "",
    "Relationships:",
    ...system.relationships.map((item) => `- ${item}`),
    "",
    "Sequence flow:",
    ...system.sequence.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Ask me to explain responsibilities first. Then evaluate cohesion, coupling, SOLID, missing interfaces, state handling, and testability. Include a clean UML-style Mermaid class diagram.",
  ].join("\n");
}

export function buildAgenticAiDesignPrompt(problemId) {
  const problem = listAgenticAiDesignProblems().find((item) => item.id === problemId) || listAgenticAiDesignProblems()[0];

  return [
    `Run an Agentic AI system design interview for: ${problem.title}.`,
    `Difficulty: ${problem.difficulty}.`,
    `Goal: ${problem.goal}`,
    "",
    "Architecture nodes:",
    ...problem.architecture.map((item) => `- ${item}`),
    "",
    "Required guardrails:",
    ...problem.guardrails.map((item) => `- ${item}`),
    "",
    "Evaluation dimensions:",
    ...problem.evaluation.map((item) => `- ${item}`),
    "",
    "Ask one clarifying question, then guide me through agent loop, tools, memory, approvals, safety, observability, failure modes, and evaluation. Include a readable architecture diagram.",
  ].join("\n");
}

export function buildReferencePlaybookPrompt(playbookId) {
  const playbook = listReferencePlaybooks().find((item) => item.id === playbookId) || listReferencePlaybooks()[0];
  const buildTracks = listBuildYourOwnTracks();
  const handbook = listInterviewHandbookCheckpoints();
  const topicCatalog = listReferenceTopicCatalog();

  return [
    `Run a full-context interview practice round using: ${playbook.title}.`,
    `Focus: ${playbook.focus}`,
    "",
    "Practice drills:",
    ...playbook.drills.map((item) => `- ${item}`),
    "",
    "Expected outcomes:",
    ...playbook.outcomes.map((item) => `- ${item}`),
    "",
    "Build-from-scratch tracks to connect to system design:",
    ...buildTracks.map((track) => `- ${track.title}: ${track.buildLoop.join(" -> ")}; interview transfer: ${track.interviewTransfer}`),
    "",
    "Tech Interview Handbook sprint checkpoints:",
    ...handbook.map((checkpoint) => `- ${checkpoint.title}: ${checkpoint.actions.join(" -> ")}`),
    "",
    "Practice topic maps:",
    ...topicCatalog.map((group) => `- ${group.title}: ${group.topics.join(", ")}`),
    "",
    "Turn this into a diagrammatic coaching session: ask one prompt, make me draw or explain the board, evaluate missing boxes/arrows/trade-offs, then give one build-from-scratch exercise and one concise interview answer.",
  ].join("\n");
}

export function buildDesignSystemSearchPrompt(query) {
  const systemName = normalizeDesignSystemSearchQuery(query) || "a new interview system";

  return [
    `Create a polished interview-ready system design answer for: ${systemName}.`,
    "If the name is broad or ambiguous, state one clear assumption before answering.",
    "",
    "Return a complete HLD + LLD answer with these sections:",
    "1. Clarifying assumptions and scoped requirements.",
    "2. Functional and non-functional requirements with interview-level estimates.",
    "3. High-level architecture and request/data flow.",
    "4. Architecture diagram in a fenced text or mermaid-style code block that is readable in chat.",
    "5. API contracts and important payloads.",
    "6. Data model, storage choices, indexes, cache keys, and consistency boundaries.",
    "7. Low-level design with key classes, interfaces, responsibilities, and design patterns.",
    "8. Critical flows, failure paths, retries, idempotency, and concurrency controls.",
    "9. Scaling, availability, observability, security, and rollout plan.",
    "10. Trade-offs, common interviewer traps, follow-up questions, and a 90-second summary.",
    "",
    "Make the answer crisp, senior, and usable in an interview. Prefer concrete names over generic boxes.",
  ].join("\n");
}
