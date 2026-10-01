// Original Java 17 exercises. Tests are visible practice checks, not a secure grading boundary.
const challenge = (id, title, track, difficulty, lesson, contract, signature, solution, cases, hints, explanation, followUp) => ({
  id, title, track, difficulty, lesson, contract, signature, solution, cases, hints, explanation, followUp, version: 1,
  starter: `import java.util.*;\nimport java.util.concurrent.*;\nimport java.util.concurrent.atomic.*;\n\nclass Solution {\n  ${signature} {\n    throw new UnsupportedOperationException("Implement ${id}");\n  }\n}\n`,
});
const check = (name, code, failure = false) => ({ name, code, failure });
export const BUILD_CHALLENGES = [
  challenge('downstream-timeout-budget', 'Derive a downstream timeout', 'System components', 'Easy', 'java-service-networking',
    'Given nonnegative now, deadline, response reserve, and a positive per-call cap in milliseconds, return the largest usable child timeout. It is the smaller of the cap and remaining time after the reserve. Return -1 when the deadline has expired or the reserve leaves no usable millisecond. Reject invalid inputs without overflowing.',
    'static long childTimeout(long now, long deadline, long reserve, long cap)',
    `static long childTimeout(long now, long deadline, long reserve, long cap) {
    if (now < 0 || deadline < 0 || reserve < 0 || cap < 1) throw new IllegalArgumentException();
    if (deadline <= now) return -1;
    long remaining = deadline - now;
    if (remaining <= reserve) return -1;
    return Math.min(remaining - reserve, cap);
  }`,
    [check('Cap a large budget', 'check(Solution.childTimeout(100,1000,100,500)==500);'), check('Exact boundaries', 'check(Solution.childTimeout(800,1000,100,500)==100); check(Solution.childTimeout(900,1000,100,500)==-1); check(Solution.childTimeout(1000,1000,0,1)==-1);', true), check('Large and invalid inputs', 'check(Solution.childTimeout(0,Long.MAX_VALUE,0,Long.MAX_VALUE)==Long.MAX_VALUE); reject(() -> Solution.childTimeout(-1,10,0,1)); reject(() -> Solution.childTimeout(0,10,0,0));', true)],
    ['Check expiry before subtracting now from the deadline.', 'Reserve response time before applying the child cap.'],
    'The calculation is O(1) and uses ordered subtraction to avoid overflow. It models a monotonic time domain; never compare wall-clock values from different machines. Production code must also propagate cancellation and classify whether a lost response left an unknown business outcome.',
    'How would retries share the same original deadline and operation identity?'),
  challenge('upload-byte-budget', 'Enforce an upload byte budget', 'System components', 'Easy', 'java-file-uploads-production',
    'Given a nonnegative current byte total, a nonnegative next chunk, and a nonnegative maximum, return the new total only when the chunk fits. Return -1 when it exceeds the remaining budget. Reject invalid inputs. The calculation must not overflow.',
    'static long acceptChunk(long written, int chunk, long maximum)',
    `static long acceptChunk(long written, int chunk, long maximum) {
    if (written < 0 || chunk < 0 || maximum < 0 || written > maximum) throw new IllegalArgumentException();
    return chunk > maximum - written ? -1 : written + chunk;
  }`,
    [check('Accept within budget', 'check(Solution.acceptChunk(7,3,10)==10);'), check('Reject without crossing the limit', 'check(Solution.acceptChunk(7,4,10)==-1); check(Solution.acceptChunk(10,0,10)==10);', true), check('Boundary and invalid inputs', 'check(Solution.acceptChunk(Long.MAX_VALUE,0,Long.MAX_VALUE)==Long.MAX_VALUE); reject(() -> Solution.acceptChunk(-1,0,1)); reject(() -> Solution.acceptChunk(2,0,1)); reject(() -> Solution.acceptChunk(0,-1,1));', true)],
    ['Validate the existing total before subtracting it from the maximum.', 'Compare the chunk with remaining capacity before adding it.'],
    'The check is O(1) and ordered to avoid addition overflow. It models one stream counter only; a real endpoint needs request, aggregate, concurrent-stream, storage, cancellation, and cleanup limits, plus streaming I/O that stops after rejection.',
    'How would you release a concurrent-upload permit exactly once when a client cancels mid-stream?'),
  challenge('window-rate-limiter', 'Enforce a rolling request limit', 'System components', 'Medium', 'java-rate-limiting',
    'Given nonnegative request times in ascending order, admit at most limit requests within (now-window, now]. Only admitted requests consume quota. Reject invalid limits, windows, and decreasing times. Return one boolean per request.',
    'static boolean[] admit(long[] times, int limit, long window)',
    `static boolean[] admit(long[] times, int limit, long window) {
    if (limit < 1 || window < 1) throw new IllegalArgumentException();
    Deque<Long> accepted = new ArrayDeque<>(); boolean[] result = new boolean[times.length];
    for (int i = 0; i < times.length; i++) {
      long now = times[i];
      if (now < 0 || (i > 0 && now < times[i-1])) throw new IllegalArgumentException();
      while (!accepted.isEmpty() && now - accepted.peekFirst() >= window) accepted.removeFirst();
      if (accepted.size() < limit) { accepted.addLast(now); result[i] = true; }
    }
    return result;
  }`,
    [check('Burst', 'check(Arrays.equals(Solution.admit(new long[]{0,0,0},2,10), new boolean[]{true,true,false}));'), check('Exact expiry', 'check(Arrays.equals(Solution.admit(new long[]{0,9,10,10},1,10), new boolean[]{true,false,true,false}));', true), check('Invalid time', 'reject(() -> Solution.admit(new long[]{2,1},1,10)); reject(() -> Solution.admit(new long[]{0},0,10));', true)],
    ['Retain admitted timestamps in a deque.', 'Expire timestamps whose age is at least the window before counting.'],
    'Each admitted timestamp enters and leaves the deque once: O(n) time and O(limit) space. A rejected request must not extend the window. This models one identity in one process; replicas need shared enforcement or an explicit overshoot budget.',
    'How would tenant quotas behave during a regional partition?'),
  challenge('cache-expiry', 'Expire a versioned cache entry', 'System components', 'Easy', 'caching-patterns-java',
    'Return the cached value only when now is before expiresAt and entryVersion is at least the required version floor. All times and versions are nonnegative. Null is a cache miss. Expiry is exclusive.',
    'static String read(String value, long entryVersion, long floor, long expiresAt, long now)',
    `static String read(String value, long entryVersion, long floor, long expiresAt, long now) {
    if (entryVersion < 0 || floor < 0 || expiresAt < 0 || now < 0) throw new IllegalArgumentException();
    return now < expiresAt && entryVersion >= floor ? value : null;
  }`,
    [check('Fresh hit', 'check("new".equals(Solution.read("new",3,2,100,99)));'), check('Expiry and stale fill', 'check(Solution.read("old",1,2,100,1)==null); check(Solution.read("v",2,2,100,100)==null);', true), check('Absent entry', 'check(Solution.read(null,0,0,100,0)==null); reject(() -> Solution.read("v",-1,0,10,0));', true)],
    ['Check freshness and version separately.', 'Keep the version floor even after evicting a value.'],
    'The predicate is O(1). A fresh TTL does not make an old version safe. The real cache must enforce the version comparison atomically with filling and keep the floor across invalidation races.',
    'Which values can safely be served stale during an outage?'),
  challenge('bounded-retry', 'Schedule a bounded retry', 'System components', 'Medium', 'java-background-jobs',
    'Attempts are numbered from 1. Retry only transient failures with a safe-to-repeat operation and attempt < maxAttempts. Delay is baseDelay doubled after each failed attempt, capped at maxDelay. Return -1 when no retry is permitted or the next due time is at/after deadline. Reject invalid inputs and arithmetic overflow.',
    'static long retryAt(long now, int attempt, int maxAttempts, long baseDelay, long maxDelay, long deadline, boolean transientFailure, boolean safe)',
    `static long retryAt(long now, int attempt, int maxAttempts, long baseDelay, long maxDelay, long deadline, boolean transientFailure, boolean safe) {
    if (now < 0 || attempt < 1 || maxAttempts < 1 || baseDelay < 1 || maxDelay < baseDelay || deadline < 0) throw new IllegalArgumentException();
    if (!transientFailure || !safe || attempt >= maxAttempts) return -1;
    long delay = baseDelay;
    for (int i=1; i<attempt && delay<maxDelay; i++) delay = delay > maxDelay/2 ? maxDelay : Math.min(maxDelay,delay*2);
    long due = Math.addExact(now, delay);
    return due < deadline ? due : -1;
  }`,
    [check('Backoff', 'check(Solution.retryAt(10,2,4,5,20,100,true,true)==20);'), check('Cap and budget', 'check(Solution.retryAt(0,5,8,5,20,100,true,true)==20); check(Solution.retryAt(0,1,3,5,20,5,true,true)==-1);', true), check('Unsafe and terminal', 'check(Solution.retryAt(0,1,3,5,20,100,true,false)==-1); check(Solution.retryAt(0,3,3,5,20,100,true,true)==-1); check(Solution.retryAt(0,1,3,5,20,100,false,true)==-1);', true)],
    ['Separate retry eligibility from delay calculation.', 'Saturate before doubling; check addition overflow separately.'],
    'The cap bounds the doubling loop to at most 63 iterations for long integers. Production retries also need jitter, stable idempotency keys, a single retry owner, and deadlines enforced by the remote client.',
    'What happens if a provider commits but loses its response?'),
  challenge('idempotent-consumer', 'Deduplicate a local event effect', 'System components', 'Medium', 'event-driven-java-reliability',
    'Implement synchronized apply(eventId, amount) on a running total. Return the total after applying a unique event. Repeating the same ID and amount returns the current total without another effect; changing its amount is an error. On overflow, neither the total nor the ID record may change. Blank IDs are invalid.',
    'synchronized long apply(String id, long amount)',
    `private long total;
  private final Map<String,Long> seen = new HashMap<>();
  synchronized long apply(String id, long amount) {
    if (id == null || id.isBlank()) throw new IllegalArgumentException();
    if (seen.containsKey(id)) {
      if (seen.get(id).longValue() != amount) throw new IllegalArgumentException();
      return total;
    }
    long next = Math.addExact(total, amount);
    seen.put(id,amount); total = next; return total;
  }`,
    [check('Apply and replay', 'Solution s=new Solution(); check(s.apply("a",10)==10); check(s.apply("a",10)==10); check(s.apply("b",-3)==7);'), check('Changed intent', 'Solution s=new Solution(); s.apply("a",10); reject(() -> s.apply("a",11)); check(s.apply("a",10)==10);', true), check('Overflow is atomic', 'Solution s=new Solution(); s.apply("a",Long.MAX_VALUE); try { s.apply("b",1); throw new AssertionError(); } catch(ArithmeticException expected) {} check(s.apply("b",0)==Long.MAX_VALUE);', true)],
    ['Store the original amount with each ID.', 'Calculate the next total before recording the event.'],
    'Synchronized protects the entire local state change, not just the collection. Lookup is expected O(1); memory grows with unique events. Restart loses this state: use one durable transaction and a retention contract in production.',
    'How would you deduplicate an effect owned by another service?'),
  challenge('pricing-policy', 'Compose an integer pricing policy', 'Object design', 'Easy', 'java-design-patterns-with-diagrams',
    'Implement quote(cents, policy) and a nested Policy interface with long apply(long cents). Reject negative input and negative policy output; reject null policy. Do not convert money to floating point. Delegate exactly once.',
    'static long quote(long cents, Policy policy)',
    `interface Policy { long apply(long cents); }
  static long quote(long cents, Policy policy) {
    Objects.requireNonNull(policy);
    if (cents < 0) throw new IllegalArgumentException();
    long quoted = policy.apply(cents);
    if (quoted < 0) throw new IllegalArgumentException();
    return quoted;
  }`,
    [check('Replace policy', 'check(Solution.quote(101, n -> n)==101); check(Solution.quote(101,n -> n-10)==91);'), check('Domain bounds', 'reject(() -> Solution.quote(-1,n -> n)); reject(() -> Solution.quote(10,n -> -1));', true), check('Single delegation', 'AtomicInteger calls=new AtomicInteger(); check(Solution.quote(0,n -> { calls.incrementAndGet(); return n; })==0); check(calls.get()==1);', true)],
    ['The policy varies; quote owns the common validation.', 'Use integer minor units and specify rounding inside each policy.'],
    'Strategy makes pricing replaceable without changing quote validation. For a single stable calculation, a direct function is simpler. Each policy must explicitly handle overflow and rounding for its own arithmetic.',
    'Where do currency, tax version, and rounding rules belong?'),
  challenge('notification-adapter', 'Adapt a notification provider result', 'Object design', 'Easy', 'java-design-patterns-with-diagrams',
    'Implement translate(status) returning ACCEPTED for 202, RETRYABLE for 429 or 503, REJECTED for 400/401/403, and UNKNOWN for every other status, including timeout sentinel -1. Declare the nested Result enum. This classifies results only; it does not authorize a retry.',
    'static Result translate(int status)',
    `enum Result { ACCEPTED, RETRYABLE, REJECTED, UNKNOWN }
  static Result translate(int status) {
    return switch(status) {
      case 202 -> Result.ACCEPTED;
      case 429,503 -> Result.RETRYABLE;
      case 400,401,403 -> Result.REJECTED;
      default -> Result.UNKNOWN;
    };
  }`,
    [check('Accepted and temporary', 'check(Solution.translate(202)==Solution.Result.ACCEPTED); check(Solution.translate(429)==Solution.Result.RETRYABLE);'), check('Timeout ambiguity', 'check(Solution.translate(-1)==Solution.Result.UNKNOWN); check(Solution.translate(599)==Solution.Result.UNKNOWN);', true), check('Permanent rejection', 'for(int status:new int[]{400,401,403}) check(Solution.translate(status)==Solution.Result.REJECTED);', true)],
    ['Map vendor vocabulary to domain vocabulary at one boundary.', 'Unknown is a first-class result, not success or failure.'],
    'The adapter preserves uncertainty and hides provider-specific numbers. Production needs an explicit provider contract: a retryable result still needs idempotency and a retry budget; accepted is not necessarily delivered.',
    'How would a second provider fit without leaking its status codes?'),
  challenge('order-transitions', 'Protect order lifecycle transitions', 'Object design', 'Medium', 'microservices-design-patterns',
    'Declare State NEW, RESERVED, PAID, SHIPPED, CANCELLED. Implement next(current,event): reserve, pay, ship, cancel. Cancel is allowed only from NEW or RESERVED. Every other state/event pair throws IllegalStateException. Null state or event is invalid. This API rejects duplicates; it does not deduplicate commands.',
    'static State next(State state, String event)',
    `enum State { NEW, RESERVED, PAID, SHIPPED, CANCELLED }
  static State next(State state, String event) {
    Objects.requireNonNull(state); Objects.requireNonNull(event);
    if (state==State.NEW && event.equals("reserve")) return State.RESERVED;
    if (state==State.RESERVED && event.equals("pay")) return State.PAID;
    if (state==State.PAID && event.equals("ship")) return State.SHIPPED;
    if ((state==State.NEW || state==State.RESERVED) && event.equals("cancel")) return State.CANCELLED;
    throw new IllegalStateException("illegal transition");
  }`,
    [check('Successful path', 'check(Solution.next(Solution.next(Solution.next(Solution.State.NEW,"reserve"),"pay"),"ship")==Solution.State.SHIPPED);'), check('No unpaid shipment', 'illegal(() -> Solution.next(Solution.State.RESERVED,"ship")); illegal(() -> Solution.next(Solution.State.PAID,"cancel"));', true), check('Terminal and duplicate', 'illegal(() -> Solution.next(Solution.State.CANCELLED,"reserve")); illegal(() -> Solution.next(Solution.State.RESERVED,"reserve"));', true)],
    ['Write the allowed transition table before implementing it.', 'Reject unspecified pairs instead of returning the old state.'],
    'Explicit state transitions expose illegal operations. For persisted orders, combine the transition with an optimistic version predicate so two concurrent commands cannot both update a stale state.',
    'How do command deduplication and optimistic locking interact?'),
  challenge('dependency-resolution', 'Resolve dependencies and reject cycles', 'Object design', 'Medium', 'java-design-patterns-with-diagrams',
    'Given a map of component to dependency names, return a dependencies-first order for a root. Each reachable component appears once. Preserve each dependency list order. Missing registrations and cycles throw IllegalArgumentException. Do not mutate the graph.',
    'static List<String> resolve(Map<String,List<String>> graph, String root)',
    `static List<String> resolve(Map<String,List<String>> graph, String root) {
    List<String> order=new ArrayList<>(); visit(graph,root,new HashSet<>(),new HashSet<>(),order); return order;
  }
  private static void visit(Map<String,List<String>> graph,String node,Set<String> active,Set<String> done,List<String> order) {
    if (done.contains(node)) return;
    if (!graph.containsKey(node) || !active.add(node)) throw new IllegalArgumentException("missing dependency or cycle");
    for(String dependency:graph.get(node)) visit(graph,dependency,active,done,order);
    active.remove(node); done.add(node); order.add(node);
  }`,
    [check('Shared dependency', 'check(Solution.resolve(Map.of("a",List.of("b","c"),"b",List.of("d"),"c",List.of("d"),"d",List.of()),"a").equals(List.of("d","b","c","a")));'), check('Cycle', 'reject(() -> Solution.resolve(Map.of("a",List.of("b"),"b",List.of("a")),"a"));', true), check('Missing registration', 'reject(() -> Solution.resolve(Map.of("a",List.of("missing")),"a"));', true)],
    ['Track nodes on the active path separately from completed nodes.', 'A shared completed dependency is not a cycle.'],
    'DFS costs O(V+E) time and O(V) state for the reachable graph. This models a construction plan rather than reflection or object creation. Deep graphs need an iterative traversal to avoid stack overflow.',
    'How do singleton scope and lifecycle cleanup change this plan?'),
  challenge('bounded-admission', 'Admit bounded concurrent work', 'Concurrency', 'Medium', 'java-background-jobs',
    'Provide a Solution(int capacity) constructor and synchronized boolean tryEnter(), synchronized void leave(). Track active slots. Reject capacity < 1 and leave when no slot is active. tryEnter returns false at capacity. This raw API requires exactly one leave per successful entry; a later exercise adds handles.',
    'synchronized boolean tryEnter()',
    `private final int capacity; private int active;
  Solution(int capacity) { if(capacity<1) throw new IllegalArgumentException(); this.capacity=capacity; }
  synchronized boolean tryEnter() { if(active==capacity) return false; active++; return true; }
  synchronized void leave() { if(active==0) throw new IllegalStateException(); active--; }`,
    [check('Capacity and release', 'Solution s=new Solution(2); check(s.tryEnter()); check(s.tryEnter()); check(!s.tryEnter()); s.leave(); check(s.tryEnter());'), check('Concurrent contention', 'Solution s=new Solution(1); AtomicInteger admitted=new AtomicInteger(); parallel(() -> { if(s.tryEnter()) admitted.incrementAndGet(); }); check(admitted.get()==1); s.leave();', true), check('Invalid release', 'Solution s=new Solution(1); illegal(s::leave); reject(() -> new Solution(0));', true)],
    ['The capacity check and increment must share one atomic boundary.', 'Hold admissions open until all contenders have attempted entry.'],
    'A synchronized constant-time critical section keeps active within [0,capacity]. This API cannot identify which caller owns a slot; handles are needed for duplicate callbacks. Limits remain process-local.',
    'How would you budget capacity across replicas and dependencies?'),
  challenge('duplicate-completion', 'Release a permit exactly once', 'Concurrency', 'Medium', 'java-background-jobs',
    'Provide Solution(Runnable release) and void close(). Invoke release exactly once across any number of concurrent close calls. Reject null callback. Mark closed before invoking the callback; even if it throws, later closes must not repeat it.',
    'void close()',
    `private final Runnable release; private final AtomicBoolean closed=new AtomicBoolean();
  Solution(Runnable release) { this.release=Objects.requireNonNull(release); }
  void close() { if(closed.compareAndSet(false,true)) release.run(); }`,
    [check('Duplicate callback', 'AtomicInteger n=new AtomicInteger(); Solution s=new Solution(n::incrementAndGet); s.close(); s.close(); check(n.get()==1);'), check('Concurrent completion', 'AtomicInteger n=new AtomicInteger(); Solution s=new Solution(n::incrementAndGet); parallel(s::close); check(n.get()==1);', true), check('Callback failure', 'AtomicInteger n=new AtomicInteger(); Solution s=new Solution(() -> { n.incrementAndGet(); throw new IllegalStateException(); }); illegal(s::close); s.close(); check(n.get()==1);', true)],
    ['A volatile boolean alone does not make check-then-set atomic.', 'Use one compare-and-set before calling the release callback.'],
    'CAS picks one release owner without holding a lock through arbitrary callback code. Production release callbacks should be simple and nonthrowing. Call close only after resource use has actually stopped.',
    'Why does cancelling a Future not prove that its worker released resources?'),
  challenge('connection-acquisition-budget', 'Budget a database connection checkout', 'System components', 'Easy', 'java-connection-pools',
    'Implement acquisitionTimeout(deadlineMillis, nowMillis, responseReserveMillis). Inputs are nonnegative monotonic-millis values. Return max(0, deadline-now-responseReserve) without overflow. A zero result means do not begin a pool wait. Reject a now value later than the deadline; a caller must not spend a fresh full timeout after its deadline has passed.',
    'static long acquisitionTimeout(long deadlineMillis, long nowMillis, long responseReserveMillis)',
    `static long acquisitionTimeout(long deadlineMillis, long nowMillis, long responseReserveMillis) {
    if (deadlineMillis < 0 || nowMillis < 0 || responseReserveMillis < 0 || nowMillis > deadlineMillis) throw new IllegalArgumentException();
    long remaining = deadlineMillis - nowMillis;
    return remaining <= responseReserveMillis ? 0 : remaining - responseReserveMillis;
  }`,
    [check('Reserve response time', 'check(Solution.acquisitionTimeout(500,100,80)==320);'), check('No wait at or inside reserve', 'check(Solution.acquisitionTimeout(500,420,80)==0); check(Solution.acquisitionTimeout(500,500,0)==0);', true), check('Invalid monotonic inputs', 'reject(() -> Solution.acquisitionTimeout(4,5,0)); reject(() -> Solution.acquisitionTimeout(-1,0,0));', true)],
    ['Calculate the remaining request budget first.', 'If the remaining time is no larger than the reserved response time, return zero before attempting checkout.'],
    'This O(1) boundary prevents a pool wait from outliving the caller budget. It does not cancel a driver already using a connection; the checkout owner must still commit, roll back, or close before returning it.',
    'How would you divide this one deadline between pool acquisition, statement execution, and response serialization?'),
  challenge('single-flight-cache', 'Coalesce concurrent cache misses', 'Concurrency', 'Hard', 'caching-patterns-java',
    'Implement CompletableFuture<String> load(String key, Supplier<String> loader, Executor executor). Concurrent callers for a key share one in-flight load. Return independent waiter futures: cancelling one must not cancel the shared load. Remove the entry after success, loader failure, or executor rejection. Do not retain completed values. Loaders return non-null values.',
    'CompletableFuture<String> load(String key, java.util.function.Supplier<String> loader, Executor executor)',
    `private final ConcurrentHashMap<String,CompletableFuture<String>> flights=new ConcurrentHashMap<>();
  CompletableFuture<String> load(String key, java.util.function.Supplier<String> loader, Executor executor) {
    Objects.requireNonNull(key); Objects.requireNonNull(loader); Objects.requireNonNull(executor);
    CompletableFuture<String> owner=new CompletableFuture<>();
    CompletableFuture<String> previous=flights.putIfAbsent(key,owner);
    if(previous!=null) return previous.thenApply(value -> value);
    try { executor.execute(() -> {
      try { String value=Objects.requireNonNull(loader.get()); flights.remove(key,owner); owner.complete(value); }
      catch(Throwable failure) { flights.remove(key,owner); owner.completeExceptionally(failure); }
    }); } catch(RuntimeException failure) { flights.remove(key,owner); owner.completeExceptionally(failure); }
    return owner.thenApply(value -> value);
  }`,
    [check('Shared load', 'Solution s=new Solution(); Queue<Runnable> q=new ArrayDeque<>(); AtomicInteger n=new AtomicInteger(); var a=s.load("k",() -> {n.incrementAndGet();return "v";},q::add); var b=s.load("k",() -> "wrong",q::add); check(q.size()==1); q.remove().run(); check(a.join().equals("v") && b.join().equals("v") && n.get()==1);'), check('Cancelled waiter', 'Solution s=new Solution(); Queue<Runnable> q=new ArrayDeque<>(); var a=s.load("k",() -> "v",q::add); var b=s.load("k",() -> "wrong",q::add); a.cancel(false); q.remove().run(); check(b.join().equals("v"));', true), check('Failure and rejection recovery', 'Solution s=new Solution(); var a=s.load("k",() -> {throw new IllegalStateException();},Runnable::run); check(a.isCompletedExceptionally()); var b=s.load("k",() -> "v",task -> {throw new RejectedExecutionException();}); check(b.isCompletedExceptionally()); check(s.load("k",() -> "recovered",Runnable::run).join().equals("recovered"));', true)],
    ['Publish a shared owner future atomically before scheduling.', 'Return dependent futures to waiters and clean up the owner before notifying callbacks.'],
    'putIfAbsent elects one owner per key. Removing before completion avoids a completed future being treated as a cached value and makes synchronous callbacks safe. Production needs bounds across distinct keys, timeouts, cache freshness, and observability.',
    'How would a maximum in-flight key limit behave under a cache stampede?'),
  challenge('graceful-shutdown', 'Preserve outcomes while draining', 'Concurrency', 'Easy', 'java-background-jobs',
    'Implement decide(effect, deadlineReached) with strings: NOT_DISPATCHED -> DEFERRED, CONFIRMED -> COMPLETE, UNKNOWN -> UNKNOWN, IN_FLIGHT -> DRAINING before the deadline and UNKNOWN after it. Reject unknown/null states. The owning worker must serialize dispatch with this decision.',
    'static String decide(String effect, boolean deadlineReached)',
    `static String decide(String effect, boolean deadlineReached) {
    if(effect==null) throw new IllegalArgumentException();
    return switch(effect) {
      case "NOT_DISPATCHED" -> "DEFERRED";
      case "CONFIRMED" -> "COMPLETE";
      case "UNKNOWN" -> "UNKNOWN";
      case "IN_FLIGHT" -> deadlineReached ? "UNKNOWN" : "DRAINING";
      default -> throw new IllegalArgumentException();
    };
  }`,
    [check('Unsent and confirmed', 'for(boolean expired:new boolean[]{false,true}) { check(Solution.decide("NOT_DISPATCHED",expired).equals("DEFERRED")); check(Solution.decide("CONFIRMED",expired).equals("COMPLETE")); }'), check('Dispatched is never deferred', 'check(Solution.decide("IN_FLIGHT",false).equals("DRAINING")); check(Solution.decide("IN_FLIGHT",true).equals("UNKNOWN"));', true), check('Ambiguity survives drain', 'for(boolean expired:new boolean[]{false,true}) check(Solution.decide("UNKNOWN",expired).equals("UNKNOWN")); reject(() -> Solution.decide("typo",false));', true)],
    ['Completion, dispatch, and deadline are different facts.', 'A shutdown deadline cannot undo a remote effect.'],
    'This pure decision table is O(1). A production worker stops new claims, retains the original operation key, and persists reconciliation state. It must still coordinate concurrent dispatch and enforce a bounded grace period.',
    'What does the replacement worker query after the old worker disappears?'),
];

// Supply declared collaborator types in starters while leaving the behavior unimplemented.
for (const c of BUILD_CHALLENGES) {
  const support = {
    'pricing-policy': 'interface Policy { long apply(long cents); }',
    'notification-adapter': 'enum Result { ACCEPTED, RETRYABLE, REJECTED, UNKNOWN }',
    'order-transitions': 'enum State { NEW, RESERVED, PAID, SHIPPED, CANCELLED }',
    'bounded-admission': 'Solution(int capacity) { }\n  void leave() { throw new UnsupportedOperationException("Implement leave"); }',
    'duplicate-completion': 'Solution(Runnable release) { }',
  }[c.id];
  if (support) c.starter = c.starter.replace('class Solution {', `class Solution {\n  ${support}`);
}
export const CHALLENGE_CODE_LIMIT = 12000;
export const CHALLENGE_STORAGE_KEY = 'interviewiq.buildChallenges.v1';
export function findChallenge(id) { return BUILD_CHALLENGES.find(c => c.id === id); }
export function referenceSource(c) { return `import java.util.*;\nimport java.util.concurrent.*;\nimport java.util.concurrent.atomic.*;\nclass Solution {\n  ${c.solution}\n}\n`; }
export function exerciseSource(c, source, mode = 'all') {
  if (typeof source !== 'string' || source.length > CHALLENGE_CODE_LIMIT || !['all', 'basic'].includes(mode)) throw new Error('Invalid exercise source or mode');
  const cases = c.cases.filter(t => mode === 'all' || !t.failure);
  const imports = source.match(/^\s*import\s+[^;]+;/gm) || [];
  const body = source.replace(/^\s*import\s+[^;]+;/gm, '');
  return `${imports.join('\n')}\nimport java.util.*;\nimport java.util.concurrent.*;\nimport java.util.concurrent.atomic.*;\npublic class Main {
  static void check(boolean ok) { if(!ok) throw new AssertionError("contract failed"); }
  static void reject(Runnable r) { try { r.run(); throw new AssertionError("invalid input accepted"); } catch(IllegalArgumentException expected) {} }
  static void illegal(Runnable r) { try { r.run(); throw new AssertionError("illegal action accepted"); } catch(IllegalStateException expected) {} }
  static void parallel(Runnable work) throws Exception {
    ExecutorService pool=Executors.newFixedThreadPool(4); CountDownLatch start=new CountDownLatch(1);
    try { List<Future<?>> tasks=new ArrayList<>(); for(int i=0;i<4;i++) tasks.add(pool.submit(() -> { start.await(); work.run(); return null; }));
      start.countDown(); for(Future<?> task:tasks) task.get(3,TimeUnit.SECONDS);
    } finally { pool.shutdownNow(); }
  }
  public static void main(String[] args) throws Exception {
    ${cases.map((t,i) => `{ // ${t.name}\n      ${t.code}\n      System.out.println("PASS ${i + 1}: ${t.name}");\n    }`).join('\n    ')}
    System.out.println("CHECKS PASSED: ${c.id} v${c.version} ${mode}");
  }
}
${body}`;
}
export function normalizeChallengeProgress(value) {
  const result = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  for (const c of BUILD_CHALLENGES) {
    const item = value[c.id];
    if (!item || item.version !== c.version || typeof item.code !== 'string' || item.code.length > CHALLENGE_CODE_LIMIT) continue;
    result[c.id] = { version: c.version, code: item.code, notes: typeof item.notes === 'string' ? item.notes.slice(0,4000) : '',
      testedSource: item.testedSource === item.code ? item.code : null,
      evidence: ['local', 'runner'].includes(item.evidence) && item.testedSource === item.code ? item.evidence : null };
  }
  return result;
}
export function challengeReviewQuestion(c) {
  return `Review this Java 17 practice implementation of ${c.title}. Contract: ${c.contract}\nDiscuss correctness, failure boundaries, complexity, ownership, and production limitations. Do not claim to have executed code. Tests and AI review are separate. Follow-up: ${c.followUp}`;
}
