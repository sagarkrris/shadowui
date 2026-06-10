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
    title: "System Design Primer Playbook",
    source: "donnemartin/system-design-primer",
    url: "https://github.com/donnemartin/system-design-primer",
    focus: "Large-scale design interviews with diagrams, sample solutions, and trade-off vocabulary.",
    drills: [
      "Clarify users, constraints, traffic, data volume, and read/write ratio.",
      "Sketch high-level components and connections before optimizing.",
      "Deep dive core components, schema, APIs, cache, queues, and bottlenecks.",
      "Scale with load balancing, caching, sharding, async work, and explicit trade-offs.",
    ],
  },
  {
    id: "build-your-own-x",
    title: "Build Your Own X Lab",
    source: "codecrafters-io/build-your-own-x",
    url: "https://github.com/codecrafters-io/build-your-own-x",
    focus: "Learn architecture by rebuilding real technologies from first principles.",
    drills: [
      "Pick one component: search engine, database, Docker-like runtime, shell, or network stack.",
      "Draw the smallest working internal loop before discussing scale.",
      "Name storage format, protocol, parser, scheduler, or indexing choices.",
      "Explain what changes when the toy version becomes production-grade.",
    ],
  },
  {
    id: "tech-interview-handbook",
    title: "Tech Interview Handbook Sprint",
    source: "yangshun/tech-interview-handbook",
    url: "https://github.com/yangshun/tech-interview-handbook",
    focus: "Busy-engineer prep structure for technical and behavioral interview signals.",
    drills: [
      "Keep answers crisp: problem, approach, trade-off, complexity, and risks.",
      "Pair system design practice with DSA pattern review and communication practice.",
      "Prepare common follow-ups and edge cases before mock rounds.",
      "Convert each practice session into one weakness, one fix, and one next drill.",
    ],
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
    source: "System Design Primer",
    url: "https://github.com/donnemartin/system-design-primer",
    usefulFor: "System design interviews, architecture diagrams, scale trade-offs, and senior-level design vocabulary.",
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
    practiceUse: "Turn each topic into a whiteboard box, arrow, bottleneck, or trade-off check during a system design answer.",
  },
  {
    source: "Build Your Own X",
    url: "https://github.com/codecrafters-io/build-your-own-x",
    usefulFor: "Learning internals by rebuilding small versions of real infrastructure and developer tools.",
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
    practiceUse: "Convert each build topic into a tiny implementation loop, then connect it to interview architecture decisions.",
  },
  {
    source: "Tech Interview Handbook",
    url: "https://github.com/yangshun/tech-interview-handbook",
    usefulFor: "A complete interview-prep route from applications through coding, behavioral rounds, and offer-stage readiness.",
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
    practiceUse: "Turn the topics into a daily checklist that balances DSA, communication, resume/story prep, and mock review.",
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
    label: "Reference Playbooks",
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
    topics: [...group.topics],
  }));
}

export function buildReferenceTopicImportPrompt() {
  const groups = listReferenceTopicCatalog();

  return [
    "Build an InterviewIQ practice plan from this imported main topic catalog.",
    "",
    ...groups.flatMap((group) => [
      `${group.source} (${group.url})`,
      `Useful for: ${group.usefulFor}`,
      `Topics: ${group.topics.join(", ")}`,
      `Practice use: ${group.practiceUse}`,
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
    `Run a reference-inspired interview practice round using: ${playbook.title}.`,
    `Source: ${playbook.source} (${playbook.url})`,
    `Focus: ${playbook.focus}`,
    "",
    "Practice drills:",
    ...playbook.drills.map((item) => `- ${item}`),
    "",
    "Build-from-scratch tracks to connect to system design:",
    ...buildTracks.map((track) => `- ${track.title}: ${track.buildLoop.join(" -> ")}; interview transfer: ${track.interviewTransfer}`),
    "",
    "Tech Interview Handbook sprint checkpoints:",
    ...handbook.map((checkpoint) => `- ${checkpoint.title}: ${checkpoint.actions.join(" -> ")}`),
    "",
    "Imported main topics by source:",
    ...topicCatalog.map((group) => `- ${group.source}: ${group.topics.join(", ")}`),
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
