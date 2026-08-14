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

Before migrating, measure request concurrency, latency, connection-pool saturation, and downstream limits. Watch for long synchronized or native calls that can pin a carrier thread. The trade-off is simpler concurrency and high I/O fan-out, but you must add admission control around every finite dependency.`,

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

Structured concurrency improves ownership: child tasks belong to the request and are cancelled or joined with it. The trade-off is upgrade risk, so do not spread preview calls through core business code.`,

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
  return listJavaSeniorRefresherArticles().flatMap((article) => (
    (article.questions || []).map((question, index) => ({
      id: `refresher-fallback-${article.id}-${index + 1}`,
      section: article.title,
      question,
      answer: CURATED_FALLBACK_ANSWERS[question]
        ? normalizeCuratedFallbackAnswer(CURATED_FALLBACK_ANSWERS[question])
        : [article.summary, ...(article.learn || [])].filter(Boolean).join(" "),
    }))
  ));
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
