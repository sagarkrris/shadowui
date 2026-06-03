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

const GENERIC_TECHNOLOGIES = [
  "API gateway",
  "Relational database for transactional records",
  "Redis for locks, sessions, and hot reads",
  "Message queue for asynchronous workflows",
  "Object storage for invoices, exports, and audit artifacts",
  "Metrics, logs, traces, and alerting",
];

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
