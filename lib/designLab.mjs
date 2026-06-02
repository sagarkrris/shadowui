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
