const architecture = ['Microsoft microservices pattern guide', 'https://learn.microsoft.com/en-us/azure/architecture/microservices/design/patterns'];
const http = ['HTTP Semantics (RFC 9110)', 'https://www.rfc-editor.org/rfc/rfc9110.html'];
const saga = ['Saga pattern', 'https://microservices.io/patterns/data/saga.html'];
const outbox = ['Transactional Outbox pattern', 'https://microservices.io/patterns/data/transactional-outbox'];
const inbox = ['Idempotent Consumer pattern', 'https://microservices.io/patterns/communication-style/idempotent-consumer.html'];
const cqrs = ['Microsoft CQRS pattern', 'https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs'];

export const MICROSERVICES_PATH = [
  { heading: 'Start here: chapters 1–4', body: 'You need basic Java, HTTP requests and responses, and the idea of a database transaction (writes that commit together). Trace one checkout from a modular monolith, an application with clear internal boundaries and one deployment, to independently deployed services. Practice drawing who owns each decision before choosing infrastructure.' },
  { heading: 'Design for failure: chapters 5–7', body: 'Follow the same checkout through lost replies, repeated requests, overloaded dependencies, and rolling releases. For each design, state what the customer sees and name the record that settles an uncertain outcome.' },
  { heading: 'Experienced track: chapters 8–12 and the Java capstone', body: 'Compare database ownership, inbox deduplication, CQRS, event sourcing, migration, and mesh policies. Run the failure drills in the capstone, then explain which guarantees require production infrastructure and how you would verify them.' },
];

function lesson(walkthrough, whenToUse, avoid, advantages, disadvantages, failure, verify, exercise, quiz, answer, followUp, followUpAnswer, sources) {
  return { walkthrough, whenToUse, avoid, advantages, disadvantages, failure, verify, exercise, quiz, answer, followUp, followUpAnswer, sources, authoredPractice: true, practiceProblems: exercise };
}

const core = [
  lesson(
    'Trace checkout in one deployable application first. Orders decides whether an order can be placed, Inventory decides whether a unit can be reserved, and Payment records capture. Keep those modules behind interfaces. If Inventory subsequently needs independent releases, extract it behind a reservation API. Compare the number of teams and deploys needed for a reservation rule change before and after the split.',
    'Use a capability boundary when one team can own its rules, data, and release cadence and there is evidence that independent deployment or scaling helps.',
    'Keep a modular monolith when the same team changes the capabilities together and a single transaction protects a shared rule.',
    'Clear ownership keeps each business decision and the data that supports it together. A well-chosen boundary can allow independent releases.',
    'Extraction adds network latency, partial failure, coordination, and operational ownership.',
    'Splitting Order Header from Order Line around tables creates synchronous calls for every checkout and makes simple rule changes require coordinated releases.',
    'Change a stock rule and deploy Inventory alone against the existing Orders contract. Confirm that two customers cannot reserve the last unit.',
    'Draw Checkout before and after extraction. Mark the owner of the last inventory unit, then identify one rule that would justify keeping modules together.',
    'How would you choose a service boundary?',
    'I start from the business decision and the data needed to enforce it. Inventory owns the last-unit reservation, so Orders asks Inventory to reserve stock instead of updating its tables. I keep the modules in one deployable application until scaling or release evidence justifies extraction. Then I verify that a reservation rule can ship independently and that competing orders still cannot oversell.',
    'Is every bounded context a separately deployed service?',
    'No. A bounded context defines where language and rules have one meaning. Deployment boundaries also depend on ownership, runtime coupling, and whether independent release is valuable.',
    [architecture]),
  lesson(
    'A gateway is the entry point for clients. A Backend for Frontend (BFF) adapts responses for a particular client. A mobile order screen needs order status and optionally recommendations. With a 200 ms total budget, let the BFF request both in parallel, cap optional work at 60 ms, and omit recommendations on timeout. Orders still checks whether the caller can see that order. The Java model only routes normalized paths and does not apply edge or BFF policies.',
    'Use a gateway for shared ingress policy and add a BFF when clients have meaningfully different response shapes or call patterns.',
    'Use ordinary routing when there is one backend call. Keep pricing, payment, and authorization of specific orders in their owning services.',
    'Reduces client round trips and centralizes selected edge controls while giving each client a stable response contract.',
    'Adds a hop and a shared failure point. BFFs can duplicate composition logic and increase backend fan-out.',
    'An optional recommendation call can exhaust the shared request pool. An edge token check alone also cannot tell whether an authenticated user owns a specific order.',
    'Delay recommendations past 60 ms and verify a usable response under 200 ms in the lab. Make a request as a different customer and verify Orders denies it.',
    'Sketch mobile and desktop responses and mark required fields. Decide whether one gateway route is enough before adding separate BFFs.',
    'How do gateway and BFF responsibilities differ?',
    'I use the gateway for routing and shared edge policy. I use a BFF when a client needs its own composition, such as combining order status with optional recommendations. The BFF bounds its fan-out and returns an explicit partial result when optional data runs late. Orders still owns its resource authorization and business rules.',
    'Should checkout confirmation use a fallback?', 'A cached product description may be fine for browsing. A cached payment status cannot confirm a new capture. Return pending until the authoritative record resolves it.',
    [['Microsoft Gateway Aggregation pattern', 'https://learn.microsoft.com/en-us/azure/architecture/patterns/gateway-aggregation'], architecture]),
  lesson(
    'Discovery maps a stable service name to changing endpoints. Suppose Inventory has two instances and one starts draining. A platform service can stop sending new traffic to that endpoint after readiness changes propagate. Existing connections and cached endpoints can live longer. Set connection and request deadlines and validate required configuration at startup. The Java registry is a local lookup model with no readiness or load balancing.',
    'Use platform discovery when deployments replace or scale instances under a stable service name. Use a simple static address for a fixed local exercise.',
    'Avoid building a custom registry if the platform already provides routing and readiness integration.',
    'Callers use a stable name while operators replace instances and change routing without rebuilding callers.',
    'Health updates propagate asynchronously and long-lived connections can skew traffic. External configuration needs validation and change control.',
    'All endpoints may be unavailable, or stale routing may send traffic to a draining instance. Fail fast within the deadline and report an unavailable result.',
    'During a rollout observe new requests and existing connections separately. Validate a missing required endpoint setting and an empty ready endpoint set.',
    'Draw a deployment timeline for two Inventory instances. Mark readiness withdrawal, traffic propagation, connection drain, and termination.',
    'How does service discovery differ from load balancing?',
    'Discovery answers which endpoints can serve a name. Load balancing selects among those endpoints. During replacement I assume readiness changes take time to propagate and existing connections may survive. I use a controlled drain and verify both fresh and reused connections before setting termination timing.',
    'Why keep liveness separate from readiness?', 'Readiness controls whether a pod should receive service traffic. Liveness can trigger a restart. Restarting all healthy processes because a shared database is briefly unavailable can prolong the outage.',
    [['Kubernetes Services', 'https://kubernetes.io/docs/concepts/services-networking/service/'], ['Kubernetes probes', 'https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/']]),
  lesson(
    'For a query that must answer before the screen renders, call Orders synchronously. For checkout, persist an order and return 202 Accepted with a status URL if final confirmation is deferred. Publish OrderAccepted for downstream work. A command requests an action such as ReserveStock. An event records a fact such as StockReserved. Give each message an ID and each order a correlation ID. The Java queue illustrates deferred consumption in one process. It loses messages on restart and supplies no broker acknowledgements.',
    'Use synchronous calls when the caller needs the answer now. Use asynchronous messages when the workflow can expose a pending state and absorb backlog.',
    'Avoid deferring decisions that the caller must have immediately. Avoid inserting a broker for a simple local module call.',
    'Synchronous calls make immediate outcomes easy to interpret. Asynchronous processing can absorb bursts and isolate the caller from worker latency.',
    'Synchronous chains share latency and availability. Asynchronous work adds queue lag, delivery semantics, and recovery responsibility.',
    'The client loses the response after Orders accepts checkout. A repeat with the same request identity must find the same operation instead of creating a new order.',
    'Inject slow workers and a lost response. Verify the status URL remains correct, repeated submission returns the same order, and queue age is visible.',
    'Define the 202 response and status transitions. Mark what the user sees if notification is delayed and if inventory is rejected.',
    'When would you choose a message over a synchronous API call?',
    'I choose based on the result the caller needs now. A catalog lookup can answer synchronously within a deadline. Checkout can return an accepted order and a status URL if the product supports pending. The worker processes messages with stable IDs, and I measure backlog age and test redelivery before relying on the asynchronous design.',
    'Does 202 mean checkout succeeded?', 'It means the request was accepted for processing. The order status must show whether it later confirms, cancels, or needs attention.',
    [http, ['Microsoft event-driven architecture guide', 'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven']]),
  lesson(
    'A saga coordinates local transactions. A compensation is a new business action that counteracts a completed step. Orders commits RESERVING and a ReserveStock outbox record together. Inventory reserves one unit, Payment attempts capture, and Orders confirms on success. On a definitive decline, release stock and wait for the release to commit before marking CANCELLED. Compare orchestration, where Orders directs the workflow, with choreography, where services advance it by reacting to events.',
    'Use a saga when independent owners must coordinate a business workflow and the domain can tolerate visible intermediate states. Use an outbox when database changes must trigger messages reliably.',
    'Prefer one local transaction if one owner can enforce the whole rule. Redesign the flow if compensation cannot restore an acceptable outcome.',
    'An outbox preserves publication intent on local commit. A saga gives partial progress, compensations, and manual recovery explicit states.',
    'A relay can publish duplicates. Sagas add coordination, intermediate states, ordering rules, and stuck workflow recovery.',
    'A payment timeout is ambiguous. Payment may have committed, so releasing stock could leave a paid order with no reservation. Reconcile using the same payment operation key. Keep compensation pending if stock release fails.',
    'Stop the relay after publication and before acknowledgement, then rerun it. Verify stable event identity, one consumer effect, and truthful order status through a failed release.',
    'Draw successful, declined, and unknown payment paths. Assign a stable command ID and terminal evidence for each transition.',
    'How do Saga and Transactional Outbox solve different problems?',
    'I use a saga to decide how a business process advances or compensates across owners. The outbox is local to an owner and commits its state change with the intent to publish. The relay can redeliver, so consumers deduplicate within their own transaction. If payment times out I reconcile before compensating, because a missing reply cannot tell me whether capture committed.',
    'When would you prefer choreography?', 'A short flow with independently useful events may work without a coordinator. For checkout with timers, compensation, and manual recovery, orchestration gives a clear owner for deadlines and pending state.',
    [saga, outbox, inbox]),
  lesson(
    'Assume 250 ms end to end for a catalog read. Reserve 50 ms for local work, give the dependency a 200 ms shared budget, and retry at most once if enough time remains after a jittered delay. A breaker stops admitting calls after failures and later allows limited probes. A bulkhead caps concurrent work for a dependency so another workload keeps capacity.',
    'Use deadlines at remote calls. Add retries for safe transient failures, breakers for sustained failure, and bulkheads where shared resources can be exhausted.',
    'Avoid retries at several layers. Avoid falling back to fabricated business success or waiting in a queue past the request deadline.',
    'Bounded policies preserve useful throughput and contain dependency failure. Limited recovery probes gradually restore traffic.',
    'Retries spend capacity and latency. Limits may reject otherwise valid work, and thresholds need tuning and monitoring.',
    'Three attempts at each of three layers can make 27 final calls. A breaker also cannot interrupt a call already in progress.',
    'Inject slow and failing dependencies. Count attempts, measure remaining deadline, and confirm a separate workload completes while the failing pool is full.',
    'Allocate the 250 ms budget between acquisition, calls, backoff, and response. Decide what happens if only 15 ms remains.',
    'How do retries, breakers, and bulkheads work together?',
    'I start with one deadline and one retry owner. I retry only safely repeatable transient failures with a small cap and jitter. A breaker rejects new work while a dependency is unhealthy, and a bulkhead limits concurrent damage even before the breaker opens. I verify the effect with attempt counts, saturation, and user-visible results under failure.',
    'Can a retry after a timeout duplicate an effect?', 'Yes. The server may have committed before the response was lost. Replay needs the same operation identity and a durable idempotency contract.',
    [['AWS retry guidance', 'https://docs.aws.amazon.com/wellarchitected/2022-03-31/framework/rel_mitigate_interaction_failure_limit_retries.html'], http]),
  lesson(
    'A gateway strips client-supplied identity headers before passing verified identity on an authenticated internal path. Orders applies resource-level permissions. The Java example only models metadata shape and does no identity verification. Across HTTP and messages, a trace helps diagnose the execution path, while an order ID connects multiple attempts for the same business operation. Add an optional delivery estimate to an event, ship tolerant readers, then ship writers. Make it required only after the supported old readers are retired or a new contract is introduced.',
    'Use service identity, tracing, and compatible contracts as soon as services release independently.',
    'Avoid trusting client-supplied identity headers or using order IDs as metric labels. Avoid a breaking schema change in a rolling release.',
    'Clear identity boundaries protect resource ownership. Traces show latency and causal paths, and compatible schemas make gradual rollout possible.',
    'Telemetry costs storage and can expose sensitive data. Supporting old and new versions together requires explicit tests.',
    'A rollback may restore old binaries while compatibility is still broken because newer writers stored data or emitted events old readers reject.',
    'Run old readers with new writers and new readers with old writers. Verify unauthorized requests fail and traces follow a synthetic order without collecting bearer tokens.',
    'Define measures for checkout acceptance, confirmation latency, and oldest pending order. Write one rollback stop condition based on business outcomes.',
    'How would you roll out a new event field?',
    'I agree on optional semantics, test the actual old consumer against the new payload, and deploy compatible readers before new writes. I trace a checkout through the mixed versions, check failures and pending orders, and keep old readers working during rollback. If the meaning changes incompatibly, I version the contract and coordinate consumer migration.',
    'Why keep both trace and operation IDs?', 'A trace describes one diagnostic execution. A durable order or command identity survives new traces, redelivery, and reconciliation.',
    [['OpenTelemetry context propagation', 'https://opentelemetry.io/docs/concepts/context-propagation/'], architecture]),
];

export function expandMicroservicesChapters(chapters) {
  return [...chapters.map((chapter, index) => ({ ...chapter, ...core[index] })), ...advanced];
}

const advanced = [
  {
    title: '8. Database per service and the transactional inbox',
    lesson: 'Database per service means each owner controls its schema and writes. Separate credentials or schemas can enforce ownership even on a shared server. An inbox records consumed message IDs beside the business effect so a redelivery can return the original result.',
    diagram: 'Orders outbox → deliver ReserveStock → Inventory transaction (inbox + reservation)',
    example: `final class InboxExample {
  // Single-process model of a unique inbox row plus the stock decision.
  private int available = 1;
  private final java.util.Map<String, Boolean> decisions = new java.util.HashMap<>();
  synchronized boolean reserve(String commandId) {
    if (commandId == null || commandId.isBlank()) throw new IllegalArgumentException("command ID");
    return decisions.computeIfAbsent(commandId, id -> {
      if (available == 0) return false;
      available--;
      return true;
    });
  }
}`,
    ...lesson(
      'Two deliveries of ReserveStock for order A carry the same command ID. The first reserves the single unit and records the result. The second returns the recorded success. A new command for order B fails. In a database, enforce uniqueness on consumer plus message ID and commit this decision and inventory mutation in one transaction. Require the same payload for the same ID.',
      'Use owned storage when teams release independently. Add a transactional inbox when at-least-once delivery can repeat a nontrivial local effect.',
      'Skip an inbox when a naturally idempotent update already enforces the same contract. A local inbox cannot deduplicate effects at an external provider.',
      'Ownership protects invariants and schema evolution. Transactional deduplication makes redelivery safe within the retained window.',
      'Cross-service joins require a different query path. Inbox rows cost storage and must cover redelivery and operational replay horizons.',
      'Acknowledge before committing and a crash can lose the reservation. Commit before acknowledging and a crash can cause redelivery. The inbox makes the second case recoverable.',
      'Run concurrent deliveries of the same command, then a different command. Assert two returns for the duplicate but only one unit reserved. Verify behavior after deduplication retention expires.',
      'Choose keys, acknowledgment timing, and a retention policy for a seven-day replay window. Explain how a payment provider would participate.',
      'How do you get one business effect with at-least-once delivery?',
      'I give each command a stable ID, persist the deduplication record with the effect, and acknowledge after commit. On redelivery I return the prior result. That guarantee covers my local transaction and retention horizon. For an external payment I also need provider idempotency and reconciliation.',
      'Can two different message IDs represent the same purchase?', 'Yes. Message deduplication protects a delivery identity. Use a separate domain or request key when multiple commands can represent one logical purchase.',
      [inbox, architecture]),
  },
  {
    title: '9. API composition and CQRS read models',
    lesson: 'API composition joins results at request time. Command Query Responsibility Segregation (CQRS) gives writes and reads distinct models. A projection turns incoming changes into the data a query needs.',
    diagram: 'Order update → versioned change → projection → order history query',
    example: `final class OrderProjectionExample {
  record Snapshot(long version, String status) {}
  private Snapshot current = new Snapshot(0, "UNKNOWN");
  // Each update is a whole status snapshot for this order, not a delta.
  void apply(Snapshot update) {
    if (update.version() > current.version()) current = update;
  }
  Snapshot current() { return current; }
}`,
    ...lesson(
      'Start with Orders and Shipping composed on demand for a low-traffic order detail screen. If an order history endpoint needs many item and shipping joins under a 100 ms target, try a precomputed read model. Apply order version 3 before version 2. Since these updates carry complete status snapshots, ignore the older update. With deltas, track gaps and recover missing events instead.',
      'Use CQRS when the write rules and read shape differ enough that independent optimization justifies the extra model.',
      'Use an indexed owner query or small bounded composition when it meets the target and callers need fresh state.',
      'Fast reads can scale separately, and write models can focus on invariants.',
      'Asynchronous views can be stale. Rebuilds, checkpoints and schema changes add operational work.',
      'Immediately after checkout the read view can still show the previous status. Return the authoritative accepted version from the command and show the view is catching up.',
      'Replay whole snapshots out of order, then rebuild from a known source and compare final totals and versions. Measure view lag and query latency separately.',
      'Choose synchronous composition or a projection for order details and for order history. Give each query a latency and freshness target.',
      'When would you choose CQRS over API composition?',
      'I start with the simpler query or bounded composition and measure it. For a read-heavy history page whose joins cannot meet latency, I use a projection designed for that query. I state its freshness contract, measure lag, and verify rebuild and duplicate handling. I can use separate read and write models with a conventional database.',
      'Does CQRS require separate databases or event sourcing?', 'No. The separation is between the read and write models. A shared database can host both and events need not be the write-side source of truth.',
      [cqrs, architecture]),
  },
  {
    title: '10. Event sourcing and safe replay',
    lesson: 'Event sourcing persists an ordered history as the source of truth for an entity. Replaying its events reconstructs state. Integration events from a conventional order table can coexist with a system that is not event sourced.',
    diagram: 'OrderPlaced → OrderConfirmed → replay into CONFIRMED state',
    example: `final class OrderReplayExample {
  enum State { NEW, PLACED, CONFIRMED }
  enum Event { PLACED, CONFIRMED }
  static State replay(java.util.List<Event> events) {
    State state = State.NEW;
    for (Event event : events) {
      state = switch (event) {
        case PLACED -> {
          if (state != State.NEW) throw new IllegalStateException("order already placed");
          yield State.PLACED;
        }
        case CONFIRMED -> {
          if (state != State.PLACED) throw new IllegalStateException("order not placed");
          yield State.CONFIRMED;
        }
      };
    }
    return state;
  }
}`,
    ...lesson(
      'Reconstruct an order from OrderPlaced and OrderConfirmed. The replay changes state without calling Payment. Two writers both expecting version 1 must compete through a conditional append so only one can claim version 2. A snapshot at version 100 can speed up reconstruction by replaying later events while retaining the history required by policy.',
      'Use event sourcing when reconstructing state at a point in time is a core domain need and the team can own replay and event evolution.',
      'Use conventional state plus a purpose-built audit trail when history is mainly for inspection and full reconstruction has little value.',
      'Preserves the sequence of domain decisions and lets teams rebuild new projections from retained history.',
      'Introduces versioning, concurrency control, replay costs and retention or privacy constraints.',
      'A replay handler that sends emails or charges customers repeats external effects during a rebuild. Treat reconstruction as a pure state transition and route live effects separately.',
      'Replay a known history twice and get the same result. Reject out-of-order transitions, and in a real event store race two writes with the same expected version.',
      'Define the first three checkout events and an expected-version rule. Show how you would evolve a historical event without rerunning payment.',
      'What makes an event store different from a broker?',
      'In an event-sourced service, the authoritative record for an order is its ordered event stream. I append with an expected version and reconstruct state deterministically. A broker can carry integration notifications in either architecture. I choose event sourcing only if history and reconstruction justify maintaining old schemas and replay procedures.',
      'Do snapshots replace the event log?', 'Snapshots accelerate reconstruction from a known version. Retain the history required for replay, migration and audit under your own retention policy.',
      [cqrs, architecture]),
  },
  {
    title: '11. Strangler Fig, anti-corruption layer and cutover',
    lesson: 'Strangler Fig moves capabilities incrementally through a routing boundary. An anti-corruption layer translates legacy terms into the new model. Change data capture (CDC) streams committed changes after a backfill checkpoint.',
    diagram: 'Legacy authority → snapshot + CDC → compare → transfer write ownership',
    example: `final class HistoryCutoverExample {
  enum Owner { LEGACY, PAUSED, NEW }
  static Owner selectWriteOwner(boolean legacyFenced, boolean caughtUp, boolean reconciled) {
    if (!legacyFenced) return Owner.LEGACY;
    return caughtUp && reconciled ? Owner.NEW : Owner.PAUSED;
  }
}`,
    ...lesson(
      'Extract order history reads first. Translate legacy status P into the documented new meaning, backfill from a known checkpoint, then stream later changes. Compare counts and totals by customer and day before sending 5% of reads to the new owner. For writes, stop legacy writes, catch up to the fence, reconcile, and only then switch authority. The example models the selection predicate, not a distributed lock.',
      'Use incremental migration when a capability can be isolated and mixed-version operation is safer than an all-at-once switch.',
      'Avoid independent dual writes without a recovery protocol. Keep writes paused if authority cannot transfer safely.',
      'Small cutovers produce evidence and limit user impact. Translation protects the new model from legacy meanings.',
      'Temporary routes, data replication and compatibility add operational complexity. Data rollback is harder after new writes.',
      'A route rollback can send callers to stale legacy data after new writes begin. Restore coherent write authority before routing back.',
      'Shadow reads without side effects. Compare per-key results and completeness at the write fence, then exercise both pre-cutover and post-write rollback plans.',
      'Write a cutover checklist with a last legacy write checkpoint, a maximum lag, zero unexplained divergence, and a decision about writes during reversal.',
      'How would you move a capability out of a monolith safely?',
      'I route a narrow capability through a facade, translate legacy terms, and backfill then stream changes from a known checkpoint. I compare and canary reads first. When transferring writes I fence the old writer, wait for catch-up and reconciliation, and establish one authority at a time. My rollback plan accounts for writes already accepted by the new owner.',
      'Why is matching record count insufficient?', 'Missing and duplicated rows can offset each other. Compare keys, versions and invariant totals, then inspect mismatches before transferring authority.',
      [architecture]),
  },
  {
    title: '12. Sidecars and service mesh',
    lesson: 'A sidecar runs alongside a service. A service mesh applies transport policy across workloads, often with proxies. Decisions such as whether a timed-out capture should be retried remain business concerns.',
    diagram: 'Orders → local proxy → authenticated transport → peer proxy → Inventory',
    example: `final class RetryOwnershipExample {
  static long worstCaseAttempts(int appAttempts, int proxyAttempts) {
    if (appAttempts < 1 || proxyAttempts < 1) throw new IllegalArgumentException("attempts must be positive");
    return (long) appAttempts * proxyAttempts;
  }
}`,
    ...lesson(
      'Two application attempts multiplied by three proxy attempts can make six Inventory calls if all are retried within their deadlines. Give retry ownership to one layer and confirm observed attempts in traces. Mutual TLS authenticates workloads and protects transport. Inventory still checks whether Orders may reserve the requested resource.',
      'Use a mesh when many services need consistent workload identity, traffic policy or telemetry and the platform team can operate it.',
      'Use straightforward platform routing and client instrumentation for a small system when the extra data plane provides little benefit.',
      'Shared transport controls can reduce duplicated policy and support gradual traffic changes.',
      'Proxies add latency, capacity needs and another place to diagnose routing or policy errors.',
      'An accidental proxy retry can duplicate a command or overload a recovering backend. Identity on a connection also cannot replace authorization of the business action.',
      'Disable proxy retries on an unsafe route. Inject a lost reply, count backend attempts and check that resource authorization still runs with a valid workload identity.',
      'Draw which layer owns identity, deadline, retry and resource authorization in an Orders-to-Inventory call.',
      'When is service mesh worth its complexity?',
      'I use one when workload identity and consistent traffic policy across many services pay for the extra operational surface. I assign exactly one retry owner and verify real attempt counts and latency. The service still owns authorization and idempotent business effects because a proxy cannot infer the meaning of a command.',
      'Can mesh mutual TLS replace resource authorization?', 'No. It identifies the calling workload. Resource authorization still decides whether that identity may perform this action on this resource.',
      [['Istio traffic management', 'https://istio.io/latest/docs/concepts/traffic-management/'], architecture]),
  },
];

export const MICROSERVICES_CAPSTONE = {
  title: 'Capstone: Split and operate an order platform',
  scenario: 'Run a Java 17 checkout lab with separate Orders, Inventory, and Payment checkpoints. The workflow reserves one unit, captures payment, and releases stock on a definitive decline. Each command starts a new process and reads the saved state.',
  download: { href: '/microservices-lab/CheckoutLab.java', label: 'Download CheckoutLab.java' },
  steps: [
    'Save CheckoutLab.java to an empty folder and open a terminal there. Run javac --release 17 CheckoutLab.java. Each data directory below represents one order. Use fresh names to repeat the drill.',
    'Run the approval drill. The first lost reply leaves Orders at RESERVING while Inventory has RESERVED. Repeating the step advances Orders without reserving again.',
    'Lose the payment reply. The payment checkpoint says CAPTURED while Orders still says PAYING. Run the next step to reconcile and confirm. Inventory stays RESERVED.',
    'Run the decline drill in a separate directory. The failed release keeps the order COMPENSATING and stock RESERVED. Retry to reach CANCELLED with stock RELEASED.',
    'Read the three checkpoint files and trace where each owner commits. Extend the design on paper to multiple orders with a database transaction, an outbox row, a broker, and a unique consumer inbox key. Identify the exact commits and acknowledgements you would test.',
  ],
  commands: [
    { label: 'Approval and lost replies', code: `java CheckoutLab approved place APPROVE
java CheckoutLab approved step LOSE_REPLY
java CheckoutLab approved step
java CheckoutLab approved step LOSE_REPLY
java CheckoutLab approved status
java CheckoutLab approved step
# order=CONFIRMED stock=RESERVED payment=CAPTURED` },
    { label: 'Decline and failed compensation', code: `java CheckoutLab declined place DECLINE
java CheckoutLab declined step
java CheckoutLab declined step
java CheckoutLab declined step FAIL_RELEASE
java CheckoutLab declined status
java CheckoutLab declined step
# order=CANCELLED stock=RELEASED payment=DECLINED` },
  ],
  extension: {
    title: 'Spring Boot capstone with PostgreSQL and Kafka',
    download: { href: '/microservices-spring-lab.zip', label: 'Download the Spring Boot capstone' },
    guide: { href: '/microservices-spring-lab/README.md', label: 'Open the full walkthrough and failure drills' },
    steps: [
      'Unzip the project, open a terminal inside it, and start Docker with Compose v2. Run the startup commands below. Orders listens on port 8081, Inventory on 8082, and Payment on 8083.',
      'Place one order and poll its status. Follow the reservation and capture across three Spring Boot processes, each with a separate PostgreSQL database. Kafka carries the commands and replies.',
      'Use the walkthrough to repeat a publish after Kafka accepted it, restart Payment after its database commit, fail a release, and stop and restart Kafka. Inspect the inbox, outbox, and business rows to confirm what each owner committed.',
      'Run bash scripts/verify.sh on a fresh stack. The script checks duplicate delivery, payment redelivery, pending compensation, recovery, and stock exhaustion.',
    ],
    commands: [
      { label: 'Start Compose and check stock', code: `docker compose config --quiet
docker compose up --build -d
docker compose ps
curl -fsS http://127.0.0.1:8082/stock` },
      { label: 'Place an order and trace the outcome', code: `ORDER=$(uuidgen | tr '[:upper:]' '[:lower:]')
curl -i -X PUT "http://127.0.0.1:8081/orders/$ORDER?decision=APPROVE"
curl -fsS "http://127.0.0.1:8081/orders/$ORDER"
curl -fsS "http://127.0.0.1:8082/reservations/$ORDER"
curl -fsS "http://127.0.0.1:8083/payments/$ORDER"` },
    ],
  },
  outcome: 'Explain why a missing response differs from a decline and show that a repeated command preserves the prior owner effect. This local lab uses a filesystem that supports atomic replacement, one order per directory, a file lock, and a simulated payment provider. It exercises process restart and injected lost replies. A real deployment needs a durable database, broker acknowledgements, provider idempotency, and failure tests for concurrency and storage outages.',
};
