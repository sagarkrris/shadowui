const REFRESHER_PDF_FILE = "java-senior-refresher-java-21-jvm-concurrency.pdf";
const REFRESHER_PDF_DIRECTORY = "pdf";

import { listJavaSeniorRefresherArticles } from "./javaDigest.mjs";

const CURATED_FALLBACK_ANSWERS = {
  "When would you choose a record over a class?": String.raw`Choose a **record** when the type is primarily an immutable data value: its identity is defined by its components, and callers should be able to see that state transparently.

- It gives you a constructor, accessors, \`equals\`, \`hashCode\`, and \`toString\` without boilerplate.
- Good examples: API DTOs, commands, events, money, coordinates, and search criteria.
\`\`\`java
public record UserId(UUID value) { }
public record SearchRequest(String query, int page) { }
\`\`\`

Choose a **class** when the object has identity, lifecycle, changing state, or substantial behavior: JPA entities, services, aggregates, caches, and workflow objects.

\`\`\`java
public final class ShoppingCart {
  private final List<Item> items = new ArrayList<>();
  public void add(Item item) { items.add(item); }
  public Money total() { /* domain behavior */ }
}
\`\`\`

A record can still enforce invariants in its compact constructor. Be careful with mutable components: a record is only shallowly immutable, so defensively copy lists or other mutable values. The practical rule is: **record for an immutable value; class for identity, behavior, lifecycle, or mutable state.**`,

  "How does PECS make a public API more flexible?": String.raw`PECS means **Producer Extends, Consumer Super**. It lets an API accept related generic types instead of requiring one exact type.

- Use \`? extends T\` when the method only **reads** T values. A \`List<? extends Number>\` accepts \`List<Integer>\`, \`List<Long>\`, or \`List<Number>\`.
- Use \`? super T\` when the method only **writes** T values. A \`List<? super Integer>\` accepts \`List<Integer>\`, \`List<Number>\`, or \`List<Object>\`.

\`\`\`java
static double sum(List<? extends Number> values) {
  return values.stream().mapToDouble(Number::doubleValue).sum();
}

static void addDefaults(List<? super Integer> target) {
  target.add(1);
  target.add(2);
}
\`\`\`

The trade-off is that an extends collection is safe to read as T but unsafe to add to, while a super collection is safe to add T to but can only be read as Object. Use wildcards at API boundaries when variance helps callers; do not add them merely to make a signature look advanced.`,

  "When is Optional the wrong modeling choice?": String.raw`Use \`Optional<T>\` mainly as a **return type** for an expected absence. It is usually the wrong choice for parameters, fields, collections, and failures.

- **Parameter:** \`send(Optional<String> note)\` forces callers to wrap values and still leaves an unclear null contract. Prefer overloads, a nullable parameter with documented semantics, or a request object.
- **Field/entity:** it adds indirection and works poorly with some serializers and ORMs. Keep an optional field nullable internally; expose an Optional from an accessor if it improves the public API.
- **Collection:** use an empty collection or omit a map entry, rather than \`List<Optional<T>>\`.
- **Failure:** Optional does not explain why work failed. Return a domain result type or throw a specific exception for an invalid state.
\`\`\`java
Optional<User> findByEmail(String email); // expected absence
void updateEmail(UserId id, String email); // not Optional<String>
\`\`\`

Do not call \`get()\` without a presence check. A strong interview answer separates normal “not found” from validation errors, authorization failures, and infrastructure failures.`,

  "Where do virtual threads help, and where do they not?": String.raw`Virtual threads help when an application spends most of its time **waiting on blocking I/O**: HTTP calls, JDBC calls, file I/O, or many independent request tasks. They let you use simple blocking code without tying up a scarce platform thread per wait.

They do **not** increase CPU cores, database connection count, downstream rate limits, or memory capacity. CPU-bound work still needs bounded parallelism near the number of available cores.

\`\`\`java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
  Future<Order> order = executor.submit(() -> client.fetchOrder(id));
  return order.get();
}
\`\`\`

Before migrating, measure request concurrency, latency, connection-pool saturation, and downstream limits. Native or foreign calls can pin a carrier thread; on JDK 21–23, blocking while holding a \`synchronized\` monitor can pin one too. JDK 24 removed monitor pinning, so evaluate the behavior of the JDK you actually deploy. The trade-off is simpler concurrency and high I/O fan-out, but you must add admission control around every finite dependency.`,

  "How can virtual threads reveal a database bottleneck?": String.raw`Virtual threads can remove application-thread scarcity, so they often expose the **next constrained resource**: the database connection pool or the database itself.

If request throughput stops improving while virtual-thread counts rise, inspect pool wait time, active connections, query latency, lock waits, CPU, and I/O. A common pattern is thousands of requests waiting for a pool with 20 connections; more virtual threads make waiting cheap, but they cannot create 21st connection capacity.

The fix is not to make the pool unbounded. First identify slow queries, missing indexes, lock contention, or excessive transaction scope. Then choose an explicit concurrency limit and backpressure policy around database work.

\`\`\`java
Semaphore dbPermits = new Semaphore(40);
// Acquire with a deadline before issuing a database-bound operation.
\`\`\`

The senior point is: virtual threads improve waiting scalability; they do not change downstream throughput.`,

  "What changes when a structured-concurrency API is preview?": String.raw`In Java 21, structured concurrency is a **preview API**. Its API and semantics can change between JDK releases, so using it is an explicit build, runtime, and upgrade decision.

- Compile and run with \`--enable-preview\` on the same JDK version.
- Pin the exact JDK in CI, containers, and developer tooling.
- Keep the preview API behind a small adapter so a future change is localized.
- Have tests for cancellation, timeout, failure propagation, and partial-result policy.

\`\`\`java
// Java 21 preview: isolate this usage behind an application service.
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
  var user = scope.fork(() -> loadUser(id));
  var orders = scope.fork(() -> loadOrders(id));
  scope.join().throwIfFailed();
  return new Profile(user.get(), orders.get());
}
\`\`\`

Structured concurrency improves ownership: child tasks belong to the request and are cancelled or joined with it. It remains a preview API in JDK 25, so the upgrade risk is still real; do not spread preview calls through core business code.`,

  "How do you investigate a suspected memory leak?": String.raw`Treat a suspected leak as a retention investigation, not a heap-size investigation.

1. Confirm the symptom under representative load: post-GC heap baseline rises across several cycles rather than forming a stable sawtooth.
2. Correlate allocation rate, GC pause time, request rate, latency, CPU, and open resources.
3. Capture a heap dump or JFR recording during growth and compare class histograms over time.
4. Use dominator trees and paths-to-GC-roots to find **why** the growing objects are retained.
5. Fix the owning lifecycle—cache bounds, listener deregistration, ThreadLocal cleanup, session expiry, or resource closure—then verify with a soak test.

Typical causes include unbounded maps, static collections, listener registries, ThreadLocal values in pooled threads, and caches without eviction. Do not tune heap size as the first “fix”; that only delays the failure if retention is real.`,

  "Why is a rising heap not enough evidence of a leak?": String.raw`A JVM normally grows its committed heap under load and may retain free memory for later reuse. A rising chart can therefore be healthy allocation behavior, a cache warming up, traffic growth, or delayed collection—not necessarily a leak.

Evidence of a leak is a **rising live-set baseline after full or major GC** under comparable workload, plus objects whose retained size and GC-root path keep growing. Compare several GC cycles and inspect allocation rate, survivor/old generation behavior, cache size, and traffic.

A practical test is a controlled load-and-idle cycle. After work stops and GC runs, a healthy service should converge near a stable baseline. If a specific object graph remains and grows each cycle, investigate its owner and retention path.`,

  "Which signals would you correlate with a p99 latency increase?": String.raw`Start with the request path and compare a healthy window to the degraded window. Correlate:

- traffic rate, request size, endpoint and tenant mix;
- application CPU, runnable threads, thread-pool queue depth, virtual-thread pinning, and GC pause/allocation rate;
- database pool wait, query latency, lock waits, slow plans, and replica lag;
- downstream dependency latency, timeout rate, retry volume, circuit-breaker state, and DNS/TLS errors;
- saturation signals such as queue age, connection usage, disk I/O, network errors, and container throttling.

Use traces to identify the slow span, then verify with metrics and logs. Do not blame GC or the database from one graph alone. The senior answer explains whether the issue is added work, waiting behind a saturated resource, or retry amplification.`,

  "Why does volatile not make a read-modify-write sequence atomic?": String.raw`\`volatile\` provides **visibility and ordering** for a single read or write. It does not turn several operations into one indivisible operation.

\`\`\`java
volatile int count;
count++; // read count, add one, write count: three steps
\`\`\`

Two threads can both read 10, both compute 11, and both write 11. No value is stale, but one increment is lost.

Use \`AtomicInteger.incrementAndGet()\` for a simple independent counter, or a lock when several fields must change together under one invariant.

\`\`\`java
AtomicInteger count = new AtomicInteger();
count.incrementAndGet();
\`\`\`

In an interview, name the invariant: for example, balance and reserved amount must change together. That tells you whether a single atomic operation is enough or a lock/transaction is clearer.`,

  "When is a lock clearer than CAS?": String.raw`A lock is clearer when correctness depends on a **multi-step or multi-field invariant**, or when the critical section includes branching that would make compare-and-set retries hard to reason about.

For example, transferring money needs to validate balance, debit one account, and credit another as one logical operation. A lock makes the invariant explicit and keeps the code readable.

\`\`\`java
lock.lock();
try {
  if (from.balance() < amount) throw new InsufficientFunds();
  from.debit(amount);
  to.credit(amount);
} finally {
  lock.unlock();
}
\`\`\`

CAS is excellent for small independent state transitions, counters, and immutable snapshots under low contention. Under contention it can spin, retry, and become less fair or less understandable. Prefer the mechanism that makes the invariant easiest to prove, then measure contention before optimizing.`,

  "What makes cancellation reliable rather than merely requested?": String.raw`Cancellation is reliable when it has an owner, deadline, propagation path, and cleanup behavior. Calling \`Future.cancel(true)\` is only a request: the task must cooperate.

- Propagate a deadline or cancellation token through every blocking call.
- Use timeout-aware I/O and stop accepting new work after cancellation.
- Check interruption at safe boundaries; do not swallow \`InterruptedException\`—restore the interrupt flag or exit.
- Close sockets, cursors, files, and child tasks that the cancelled operation owns.
- Make side effects idempotent or compensate them, because cancellation can occur after partial progress.

\`\`\`java
catch (InterruptedException exception) {
  Thread.currentThread().interrupt();
  return Result.cancelled();
}
\`\`\`

Test the unhappy path: cancel during queue wait, I/O wait, and after a partial write. Record cancellation latency and unfinished-work counts so operational failures are visible.`,

  "Why can get followed by put still be incorrect on ConcurrentHashMap?": String.raw`\`ConcurrentHashMap\` makes each individual operation thread-safe, but it does not make a sequence of operations atomic.

\`\`\`java
if (cache.get(key) == null) {
  cache.put(key, createValue());
}
\`\`\`

Two threads can both see null, both run the expensive creation, and then overwrite one another. If creation has side effects, the bug is worse than duplicate work.

Use a compound operation that matches the invariant:

\`\`\`java
Value value = cache.computeIfAbsent(key, this::createValue);
\`\`\`

Keep mapping functions short, deterministic, and free of slow external I/O where possible; they may run while coordinating the key. For multi-key invariants, a map helper may still be insufficient—use a lock or a database transaction.`,

  "What should happen when a work queue is full?": String.raw`A full queue is a capacity signal, so the system needs an explicit overload policy—not silent growth.

Choose based on the operation:

- reject quickly with a retryable response when work is optional or clients can retry;
- block only with a bounded deadline when backpressure is safe;
- shed low-priority work, coalesce duplicate work, or defer it to durable storage;
- route durable business work to a queue with a dead-letter and replay policy.

Define queue capacity from memory and latency budgets, not guesswork. Instrument depth, oldest-message age, enqueue rejection, worker utilization, processing latency, and retry rate. An unbounded queue hides overload until it becomes an out-of-memory incident.`,

  "Why does a queue move pressure instead of removing it?": String.raw`A queue separates producers from consumers, but it does not create consumer capacity. If arrivals exceed processing throughput for long enough, backlog, age, and user-visible latency all grow.

The useful equation is: **backlog growth = arrival rate - completion rate**. A queue buys time for bursts and smooths scheduling; it cannot fix a permanently slower database, provider, or worker pool.

A production design needs bounded capacity, backpressure, priorities, retry budgets, idempotent consumers, and observability. Decide which work can be delayed, dropped, or degraded. The senior trade-off is durability versus freshness: a durable queue protects work, but needs a clear lag SLO and recovery plan.`,

  "Why can a HashMap lookup fail after insertion?": String.raw`A HashMap lookup can fail when a key's equality or hash changes after it is inserted. The map uses the hash to choose a bucket; if a field used by \`hashCode\` is mutated, the key stays in the old bucket but future lookups search a different one.

\`\`\`java
final class CustomerKey {
  private final String tenant;
  private final String customerId;
  // equals and hashCode use both immutable fields
}
\`\`\`

Also verify the contract: equal objects must return the same hash code, and \`equals\` must be symmetric, transitive, and consistent. Prefer immutable key types or records for value-based keys. Add tests that insert with one equal instance and look up with another; then monitor cache hit rate and key-cardinality after rollout.`,

  "When would you avoid streams?": String.raw`Avoid streams when an explicit loop communicates the control flow better or is needed for correctness and operations.

Use a loop when you need early exit, retry/backoff, checked-exception handling, resource ownership, mutable state with a clear invariant, detailed logging, per-item metrics, or step-by-step debugging.

\`\`\`java
for (Order order : orders) {
  if (order.isCancelled()) continue;
  try {
    ship(order);
  } catch (TransientFailure failure) {
    scheduleRetry(order);
  }
}
\`\`\`

Streams are strong for pure, bounded transformations such as filtering, mapping, and aggregation. Avoid remote I/O, blocking calls, and external mutation inside stream operations; those hide failure handling and make ordering/concurrency surprises more likely. Choose readability and debuggability over a shorter line count.`,

  "Why is parallelStream not a general performance switch?": String.raw`\`parallelStream()\` uses the common ForkJoinPool by default, so it can contend with unrelated application work. Parallelism also adds splitting, scheduling, merging, synchronization, and cache costs; small tasks or skewed workloads often become slower.

It is a reasonable candidate for large, CPU-bound, independent, pure computations when you have measured a gain and can control the execution environment. It is a poor fit for blocking I/O, database calls, request-scoped work, side effects, ordered dependencies, or workloads needing a dedicated concurrency limit.

For server code, prefer an explicitly owned executor or virtual threads for blocking I/O, with timeouts and downstream limits. Benchmark with realistic input sizes and production-like contention before claiming a speedup.`,
};

const ADDITIONAL_TRICKY_QA = [
  {
    section: "Generics: Type Safety and API Boundaries",
    question: "Why can heap pollution compile cleanly and still fail later?",
    answer: String.raw`Heap pollution occurs when a variable with a parameterized type refers to data that is not actually of that type. Type erasure means the JVM cannot fully check generic element types at runtime, so the mistake can be introduced in one place and fail later at an unrelated read.

\`\`\`java
static void pollute(List<String>... lists) {
  Object[] raw = lists;
  raw[0] = List.of(42);
  String value = lists[0].get(0); // ClassCastException
}
\`\`\`

Generic varargs are a common trap because the compiler creates an array whose component type is erased. Prefer a \`List<List<String>>\` parameter, avoid exposing a generic varargs array, and use \`@SafeVarargs\` only when the method neither writes into nor exposes that array. Do not “fix” the exception with a raw type or unchecked cast; locate the boundary where type information was discarded.`,
  },
  {
    section: "Generics: Type Safety and API Boundaries",
    question: "Why is List<Integer> not a subtype of List<Number>?",
    answer: String.raw`\`Integer\` is a subtype of \`Number\`, but mutable generic containers are invariant. If Java allowed \`List<Integer>\` where \`List<Number>\` is expected, the callee could add a \`Double\`, corrupting the original integer-only list.

\`\`\`java
List<Integer> integers = new ArrayList<>();
// List<Number> numbers = integers; // unsafe, therefore rejected

static double sum(List<? extends Number> values) {
  return values.stream().mapToDouble(Number::doubleValue).sum();
}
\`\`\`

Use \`? extends Number\` for a producer you only read, and \`? super Integer\` for a consumer you write integers into. Arrays behave differently because they are covariant and runtime-checked, which is why \`Number[] values = new Integer[1]; values[0] = 1.5;\` compiles but throws \`ArrayStoreException\`. Generics choose earlier, compile-time safety instead.`,
  },
  {
    section: "JVM: Class Loading, Memory, and Visibility",
    question: "Why can a static initializer cause a production outage that persists after the original failure?",
    answer: String.raw`Class initialization is synchronized by the JVM and runs once before active use of a class. If a static initializer throws, that initialization fails; later uses of the class can receive \`NoClassDefFoundError: Could not initialize class\` rather than retrying the original work.

\`\`\`java
final class Config {
  static final Client CLIENT = createClient(); // DNS or credentials fail here
}
\`\`\`

This is especially painful when initialization performs network I/O, reads mutable configuration, or starts background work. The first failure may be transient, but the process can be stuck until it is restarted. Keep static initialization deterministic and cheap: constants, validated local values, and pure construction only. Move external setup into a managed lifecycle with retries, timeouts, health reporting, and a deliberately defined degraded mode.`,
  },
  {
    section: "JVM: Class Loading, Memory, and Visibility",
    question: "Why is double-checked locking broken without volatile?",
    answer: String.raw`Without \`volatile\`, double-checked locking can publish a reference before another thread can safely observe its fully constructed state. Object construction has several low-level steps, and reordering can make the assignment visible before constructor writes are visible.

\`\`\`java
private static volatile Client instance;

static Client instance() {
  Client current = instance;
  if (current == null) {
    synchronized (ClientFactory.class) {
      if (instance == null) instance = new Client();
      current = instance;
    }
  }
  return current;
}
\`\`\`

\`volatile\` establishes the needed happens-before relationship: writes performed before publishing the reference become visible to a thread that subsequently reads it. Prefer an enum singleton, a static holder class, or dependency injection unless lazy construction is truly required. A passing stress test is not proof; this is a Java Memory Model correctness issue, not merely a timing issue.`,
  },
  {
    section: "Concurrency: Ordering, Liveness, and Coordination",
    question: "What is the lost-notification problem with wait and notify?",
    answer: String.raw`A notification is not stored for later. If one thread calls \`notify\` before another thread begins waiting, the future waiter can sleep forever unless it checks a condition protected by the same monitor.

\`\`\`java
synchronized (lock) {
  while (!ready) {
    lock.wait();
  }
  consume();
}

// Producer, under the same lock: ready = true; lock.notifyAll();
\`\`\`

Always use a \`while\` loop, not \`if\`: waits may return spuriously, and another thread may consume the condition before this thread reacquires the monitor. Prefer \`CountDownLatch\`, \`BlockingQueue\`, \`CompletableFuture\`, or \`Condition\` when they express the ownership and lifecycle more directly. Also define timeout and interruption behavior; an unbounded wait turns a coordination bug into a hung request.`,
  },
  {
    section: "Concurrency: Ordering, Liveness, and Coordination",
    question: "Why can CompletableFuture make a thread-pool starvation deadlock easier to create?",
    answer: String.raw`A common failure is submitting dependent, blocking tasks to the same small executor. If every worker runs a task that calls \`join()\` or \`get()\` for another task queued behind it, no worker is free to run the dependency.

\`\`\`java
CompletableFuture<String> outer = CompletableFuture.supplyAsync(() ->
  CompletableFuture.supplyAsync(this::load, executor).join(), executor);
\`\`\`

Compose asynchronous stages instead: \`supplyAsync(...).thenApply(...)\` or \`thenCompose(...)\`, and avoid blocking inside tasks that share constrained workers. Size and separate executors by workload—CPU, blocking I/O, scheduled work—not by convenience. The common pool is not a neutral default for server workloads. Instrument active threads, queue depth, task age, and timeout rates so starvation is distinguishable from a slow downstream dependency.`,
  },
  {
    section: "Streams: Semantics and Side Effects",
    question: "Why is modifying a collection while streaming it a correctness bug even when it appears to work?",
    answer: String.raw`Most collection streams are backed by an iterator or spliterator that assumes the source is not structurally modified during traversal. Mutation can throw \`ConcurrentModificationException\`, skip elements, process elements twice, or produce implementation-dependent behavior.

\`\`\`java
// Do not do this.
orders.stream().filter(Order::isExpired).forEach(orders::remove);

orders.removeIf(Order::isExpired); // one clear, supported operation

List<Order> active = orders.stream()
  .filter(order -> !order.isExpired())
  .toList();
\`\`\`

Thread-safe collections change the failure mode, not the design question: a weakly consistent traversal may see some concurrent changes and miss others. Choose one owner for mutation, use a purpose-built bulk method, or collect a new result. Never use stream side effects as a compact substitute for an explicit state transition.`,
  },
  {
    section: "Streams: Semantics and Side Effects",
    question: "Why can groupingByConcurrent still be unsafe for a parallel stream?",
    answer: String.raw`\`groupingByConcurrent\` is a concurrent, unordered collector, but that guarantee applies to the collection operation—not to arbitrary side effects in the pipeline or to later mutation of the returned values. In the no-downstream form, the returned per-key \`List\` values are not promised to be thread-safe.

\`\`\`java
Map<String, Long> counts = events.parallelStream().collect(
  Collectors.groupingByConcurrent(Event::type, Collectors.counting()));
\`\`\`

The example is safe because \`counting()\` has controlled collector semantics; the downstream collector need not itself be concurrent for the framework to collect correctly. It is not permission to append to a shared \`ArrayList\`, call a non-thread-safe client, or mutate request state from the pipeline. For modest data, sequential collection is often clearer and faster. For large CPU-bound workloads, verify collector characteristics, ordering requirements, contention, memory cost, and a benchmark before selecting parallel execution.`,
  },
  {
    section: "Exceptions: Contracts and Resource Ownership",
    question: "Why is catching Exception and wrapping it in RuntimeException often an API regression?",
    answer: String.raw`A blanket catch erases the caller's ability to distinguish expected business outcomes, validation failures, transient infrastructure faults, interruption, and programming bugs. It can also accidentally swallow an interrupt and prevent cancellation from propagating.

\`\`\`java
try {
  return gateway.fetch(id);
} catch (InterruptedException exception) {
  Thread.currentThread().interrupt();
  throw new RequestCancelledException(exception);
} catch (IOException exception) {
  throw new CustomerGatewayException(id, exception);
}
\`\`\`

Translate exceptions only at a boundary where you add useful domain context and preserve the cause. Let unchecked programming errors surface unless you have a specific recovery policy. Decide explicitly which failures are retryable and which HTTP or message outcome they map to. “Everything is a runtime exception” is not simpler when operations can no longer observe, classify, or safely recover from failures.`,
  },
  {
    section: "Exceptions: Contracts and Resource Ownership",
    question: "What happens when both the try block and close() throw in try-with-resources?",
    answer: String.raw`The exception from the \`try\` body remains the primary exception. An exception thrown while closing a resource is attached as a suppressed exception, preserving both failures without hiding the operation that first failed.

\`\`\`java
try (InputStream input = openInput(); OutputStream output = openOutput()) {
  copy(input, output); // throws IOException A
} // close throws IOException B; A.getSuppressed() contains B
\`\`\`

Resources close in reverse declaration order, which matters when one wraps another. Do not replace this with a \`finally\` block that can overwrite the original exception. When logging or mapping an error, retain the cause and inspect suppressed exceptions for diagnostics—especially for transactions, sockets, compression streams, and file writes. This behavior does not make closure optional: ownership should still be clear, local, and tested on both the success and failure paths.`,
  },
  {
    section: "Spring and JPA: Proxies, Transactions, and Persistence",
    question: "Why can @Transactional appear to do nothing on self-invocation?",
    answer: String.raw`Spring's usual declarative transactions are applied by a proxy. A call from one method to another method on the same object uses \`this\`, so it bypasses that proxy and therefore bypasses the transactional interceptor.

\`\`\`java
public void importBatch() {
  importOne(); // self-invocation: @Transactional on importOne is not applied
}

@Transactional
public void importOne() { /* ... */ }
\`\`\`

Put the transaction boundary on a public operation in a separate service bean whose invocation crosses the proxy, or redesign the use case so one service method owns the business consistency boundary. Do not blindly enable proxy exposure or call through the application context; those hide coupling. Also verify propagation, rollback rules, visibility, and whether the actual exception type triggers rollback. A transaction annotation is metadata, not a guarantee that every call path passes through Spring.`,
  },
  {
    section: "Spring and JPA: Proxies, Transactions, and Persistence",
    question: "Why can a fetch join with pagination return incomplete or misleading pages?",
    answer: String.raw`A collection fetch join multiplies parent rows by child rows. SQL-level \`LIMIT\` and \`OFFSET\` then operate on those joined rows rather than reliably on distinct parents, so Hibernate may paginate in memory, return fewer parents, or produce unstable results.

\`\`\`java
// Risky when Order.items is a collection:
select o from Order o left join fetch o.items order by o.createdAt desc
\`\`\`

Page parent IDs first with a stable sort, then fetch the parent graph in a second query; preserve the first query's order in application code if necessary. Alternatively, use a projection or batch fetching based on the page size. Test with parents that have uneven child counts, not only one child each. The correct choice depends on page semantics, consistency needs, query volume, and whether the endpoint really requires the full child collection.`,
  },
  {
    section: "Interviewer Expectations: Production Diagnosis",
    question: "A Java endpoint has a p99 latency spike but normal CPU. How would you investigate it?",
    answer: "Compare a healthy and degraded window for the same endpoint and traffic shape. Normal CPU does not rule out waiting: requests can block on a database connection, lock, DNS, downstream HTTP call, queue, or rate limit. Use traces to locate the slow span, then correlate request rate, pool wait time, executor queue age, connection use, lock waits, retry volume, GC pauses, and downstream latency. State a hypothesis only after deciding whether the added time is work or waiting. Check recent deploys, configuration changes, data skew, and retry amplification. An interviewer expects this evidence-led path, then one safe mitigation such as a timeout, admission limit, rollback, or targeted query fix and a metric that proves it worked.",
  },
  {
    section: "Interviewer Expectations: Production Diagnosis",
    question: "How would you test concurrent code without relying on sleep?",
    answer: "Make the interleaving controllable instead of hoping the scheduler creates it. Use CountDownLatch or Phaser to hold workers at a known point, release them together, and wait with a bounded deadline. Assert an invariant after completion: a balance is conserved, initialization occurs once, or no task observes partial state. Use deterministic fakes for external calls and test cancellation, timeout, interruption, and executor shutdown as well as success. Repeat inexpensive scenarios, but do not describe repetition as proof. An interviewer expects you to identify the shared state and the happens-before relationship the test establishes. A sleep-based test measures timing on one machine; it does not reliably test the concurrency contract.",
  },
  {
    section: "Interviewer Expectations: Distributed Work and Idempotency",
    question: "How do you make a Java message consumer safe when delivery is at least once?",
    answer: "Assume a message can arrive again after its side effect succeeded but before acknowledgement. Give the business operation a stable idempotency key, record the completed outcome durably with the state change when possible, and make retries return that result rather than repeat the effect. An in-memory set is insufficient because it disappears on restart and cannot coordinate instances. Define key scope, retention, conflict behavior, retry budget, dead-letter policy, and metrics. For a payment-like operation, a unique database constraint or transactional inbox or outbox is safer than check then insert. An interviewer expects you to separate transport deduplication from business idempotency; exactly once is not a broker guarantee alone.",
  },
  {
    section: "Interviewer Expectations: API and Compatibility",
    question: "How would you evolve a Java API response without breaking existing clients?",
    answer: "Identify the actual contract: method signatures, JSON fields, null and omission behavior, enum values, ordering, validation, generated clients, and consumers with strict parsers. Adding an optional field is often compatible, but changing meaning, type, default, or an enum can break a client even when compilation succeeds. Prefer additive changes with documented defaults. Introduce a version only when semantics cannot coexist, retain the old behavior through a measured deprecation period, add contract tests, observe adoption, publish migration guidance, and plan rollback. An interviewer expects you to distinguish source, binary, wire, and behavioral compatibility. A coordinated backend and web deployment does not protect older mobile, partner, or asynchronous clients.",
  },
  {
    section: "Database Consistency: Isolation and Locking",
    question: "How would you choose between optimistic locking, pessimistic locking, and a transaction isolation level?",
    answer: "Begin with the invariant and the contention pattern. Optimistic locking is useful when conflicts are uncommon and a rejected update can be retried or shown to the user; it detects a conflicting version rather than preventing it. Pessimistic locking is appropriate only when the protected work is short and conflicts are costly, because it reduces concurrency and can create lock waits or deadlocks. Transaction isolation controls anomalies across reads and writes, but stronger isolation is not automatically safer if it causes unacceptable blocking or serialization failures. An interviewer expects you to name the concrete lost update, double booking, or stale read risk, define retry behavior, keep transactions small, and instrument conflict and lock-wait rates.",
  },
  {
    section: "Resilience: HTTP Clients and Downstream Capacity",
    question: "What makes an outbound HTTP client resilient instead of merely retrying failures?",
    answer: "Every call needs a bounded deadline that fits the caller deadline, plus separate connection and read timeouts where the client supports them. Retry only failures that are transient and only operations that are idempotent or carry an idempotency key; use a small budget, jittered backoff, and stop retrying when the remaining deadline is too short. Apply concurrency limits or circuit breaking around finite downstream capacity, and define a fallback only when stale or partial data is genuinely safe. Record latency, status classes, timeout counts, retries, open connections, and rejection rates. An interviewer expects failure semantics and capacity control, not a generic retry annotation that can turn a short outage into amplified traffic.",
  },
  {
    section: "Memory and Execution Context",
    question: "Why can ThreadLocal become a memory or data-isolation bug in server code?",
    answer: "Server workers are reused, so a ThreadLocal value can outlive the request that created it and be observed by a later task if cleanup is missed. It may retain large request objects, security context, logging context, or tenant data far longer than intended. Set context only at a clearly owned boundary and remove it in a finally block. Propagate context deliberately to asynchronous work rather than assuming it follows execution, and inspect executors, scheduled tasks, and libraries that cache per-thread state. Virtual threads reduce some pooling behavior but do not replace clear ownership. An interviewer expects object lifetime and cleanup, plus how a heap dump or cross-request test would prove the issue.",
  },
  {
    section: "Spring and JPA: Entity Identity",
    question: "Why are equals and hashCode difficult for JPA entities?",
    answer: "An entity can be transient before it receives a generated identifier, managed in one persistence context, detached, or represented by a Hibernate proxy. A hash code based on a generated identifier can change after insertion and break HashSet or HashMap membership. Equality based on mutable fields has the same problem and can trigger lazy loading or expensive comparisons. Prefer a stable immutable business key only when the domain truly has one; otherwise avoid relying on transient entities as map keys or set members and account for proxies when comparing types. An interviewer expects lifecycle awareness rather than one universal recipe, including tests that cover persist, detach, merge, and proxy-backed lookup.",
  },
  {
    section: "Security: Serialization and Input Boundaries",
    question: "What would you review before accepting polymorphic JSON into a Java service?",
    answer: "Treat type selection as an untrusted input boundary. Prefer explicit request DTOs and an allowlisted discriminator that maps to a small known set of business variants. Validate fields, payload size, nesting depth, and authorization before the result reaches application logic. Do not enable broad default typing just to make a payload convenient, and do not bind untrusted input directly to persistence entities or framework types. Keep the serialization library patched and return errors without internal class names or stack traces. Apply the same caution to Java native serialization. An interviewer expects a concrete allowed-type policy, validation location, error behavior, and tests that reject unknown types and malformed or oversized payloads.",
  },
  {
    section: "Testing Strategy: Confidence at the Right Boundary",
    question: "How do you decide what belongs in unit, integration, and contract tests for a Java service?",
    answer: "Use unit tests for deterministic domain rules, validation, branching, and error mapping because they are fast and local. Use integration tests for behavior that depends on a real boundary: SQL shape, transactions, ORM mappings, serialization, security filters, and client configuration. Use contract tests where independently deployed consumers rely on request and response compatibility. Keep end-to-end tests focused on a few critical workflows rather than trying to prove every branch through the browser. Choose test data that exposes real edge cases, and make failures diagnosable. An interviewer expects a risk-based portfolio, not a percentage target: the test should exercise the boundary where the failure can actually occur.",
  },
  {
    section: "Code Review: Senior Risk Detection",
    question: "What do you look for first when reviewing a Java backend change?",
    answer: "Start with the behavioral contract and changed data or control flow. Then inspect input validation, authorization, error mapping, null and empty behavior, transaction ownership, retries, timeouts, resource closure, concurrency, and backwards compatibility. Look for database or HTTP calls inside loops, N plus one queries, unbounded collections or queues, blocking work on shared executors, mutable shared state, unsafe logging, and changes that silently alter API defaults or ordering. Confirm focused tests cover the new behavior and its failure path. An interviewer expects prioritized findings tied to impact and evidence, not a cosmetic list. Explain the likely failure, affected users, and the smallest safe correction.",
  },
  {
    section: "Design Principles: Patterns, SOLID, KISS, and DRY",
    question: "How do design patterns, SOLID, KISS, and DRY guide a Java refactor without causing over-engineering?",
    answer: "Start with the concrete pain: duplicated policy, a changing algorithm, an unclear lifecycle, a violated invariant, or a dependency that prevents testing. Use a pattern only when it fits that shape: Strategy for genuinely interchangeable algorithms, State for lifecycle-dependent behavior, and a small adapter for an external boundary. SOLID helps keep responsibilities cohesive and dependencies directed toward stable abstractions, but it does not require an interface for every class. KISS favors the smallest readable design that explains the behavior. DRY means one source of truth for meaningful knowledge, not forcing unrelated code into a fragile generic helper. An interviewer expects you to compare the simple option, explain costs, and show how tests and callers improve.",
  },
];

function normalizeCuratedFallbackAnswer(answer) {
  // Template literals escape Markdown fences/backticks so the source remains
  // valid JavaScript. Restore the Markdown before the UI renders it.
  if (answer) return String(answer).split(String.fromCharCode(92, 96)).join(String.fromCharCode(96));
  return String(answer || "").replace(/\\\\`/g, "`");
}

function normalizedLines(text) {
  return String(text || "")
    .replace(/Java Senior Refresher - Java 21, JVM, Concurrency, Collections, Streams Page \d+/g, "")
    .replace(/-- \d+ of \d+ --/g, "")
    .replace(/Senior answer\s+(?=[A-Z])/g, "Senior answer\n")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("Java Senior Refresher -") && !/^Page \d+$/.test(line));
}

function isSectionHeading(line) {
  return /^\d+\.\s/.test(line) || /senior-level interview answers$/i.test(line);
}

/**
 * Preserves every question immediately followed by its "Senior answer" block.
 * The PDF is the source of truth; this function deliberately does not summarize or rewrite it.
 */
export function parseJavaSeniorRefresherQa(text) {
  const lines = normalizedLines(text);
  const entries = [];
  let section = "Java Senior Refresher";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (isSectionHeading(line)) section = line;
    if (lines[index + 1] !== "Senior answer") continue;

    const answerLines = [];
    let cursor = index + 2;
    while (cursor < lines.length && lines[cursor + 1] !== "Senior answer") {
      if (isSectionHeading(lines[cursor])) break;
      answerLines.push(lines[cursor]);
      cursor += 1;
    }

    const answer = answerLines.join(" ").trim();
    if (line && answer) {
      entries.push({
        id: `refresher-qa-${entries.length + 1}`,
        section,
        question: line,
        answer,
      });
    }
  }

  return entries;
}

// The PDF remains the preferred source. This bundled fallback keeps the
// refresher usable in serverless environments that do not expose public files
// to the runtime filesystem.
export function buildJavaSeniorRefresherFallbackQa() {
  const articleQuestions = listJavaSeniorRefresherArticles().flatMap((article) => (
    (article.questions || []).map((question, index) => ({
      id: `refresher-fallback-${article.id}-${index + 1}`,
      section: article.title,
      question,
      answer: CURATED_FALLBACK_ANSWERS[question]
        ? normalizeCuratedFallbackAnswer(CURATED_FALLBACK_ANSWERS[question])
        : [article.summary, ...(article.learn || [])].filter(Boolean).join(" "),
    }))
  ));

  return appendAdditionalTrickyQa(articleQuestions);
}

export function appendAdditionalTrickyQa(questions) {
  const existingQuestions = new Set((questions || []).map((entry) => entry.question));
  const additions = ADDITIONAL_TRICKY_QA
    .filter((entry) => !existingQuestions.has(entry.question))
    .map((entry, index) => ({
      id: `refresher-curated-tricky-${index + 1}`,
      ...entry,
      answer: normalizeCuratedFallbackAnswer(entry.answer),
    }));

  return [...(questions || []), ...additions];
}

export async function loadJavaSeniorRefresherQa() {
  const [{ readFile }, path, { extractResumeTextFromBuffer }] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
    import("./resumeExtract.mjs"),
  ]);
  const filePath = path.join(process.cwd(), REFRESHER_PDF_DIRECTORY, REFRESHER_PDF_FILE);
  const buffer = await readFile(filePath);
  const text = await extractResumeTextFromBuffer({
    buffer,
    fileName: REFRESHER_PDF_FILE,
    mimeType: "application/pdf",
  });

  return parseJavaSeniorRefresherQa(text);
}
