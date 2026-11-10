**Set 25 · 10 November 2026 — Completion, consumption and ownership**

Reference assumptions: **Java 21 without preview features**, Spring Framework 7.0 scope contracts and Jakarta Persistence 3.2. Primary references checked 10 November 2026; these are reference versions, not latest-version claims. Q1–Q10 are contextual illustrations, not runnable integrations. Q11–Q12 are runnable classes tested from this source. Stable IDs: **S25-Q01–S25-Q12**. Spoken answers target 45–90 seconds.

---

**1. A successful future becomes failed after a whenComplete cleanup callback. Is observation harmless?**

**Say aloud:** “A completion stage represents an eventual result or failure. whenComplete creates another stage and runs an observation callback, but that callback can itself fail. If the original operation succeeded and cleanup throws, the returned stage fails. If both fail, the original failure takes precedence. I would decide whether cleanup is required for business success or is best-effort telemetry, then expose the corresponding returned stage to callers. Ignoring it hides cleanup failures; returning it without considering policy can turn completed work into an apparent retryable failure. For a charged payment, retrying because a metrics callback failed could duplicate an external effect. I would keep essential resource cleanup explicit, contain optional telemetry errors, and test every combination of operation success and callback failure.”

**Example:** Contextual: `var observed = operation.whenComplete((value, error) -> releaseOwnedResource());` Callers must observe `observed`.

**Deep dive / verification:** No rollback is implied. Callback execution and resource ownership need separate contracts. Verify all four success/failure combinations and avoid throwing from diagnostics.

**Follow-ups:** Would handle preserve the same outcome? No; handle computes a replacement value or throws, so it can intentionally recover or transform failures.

**Primary reference:** [Reference documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html).

---

**2. A failed replica wins CompletableFuture.anyOf while a healthy replica is still running. Is this first success?**

**Say aloud:** “anyOf means first completion, including exceptional completion; it does not mean first useful result. A replica that fails quickly can therefore complete the aggregate exceptionally before a slower replica succeeds. I would first define whether this request needs any completion, the first successful response, or every response. For first success, an explicit coordinator must count failures and complete successfully only when an acceptable result arrives, failing only when all candidates fail or the request deadline expires. Its state changes must be atomic because completions race. Losing requests still need owned cancellation and bounded resource use. I would test failure-before-success, simultaneous successes, all failures and an empty candidate collection rather than assuming a racing primitive implements the business policy.”

**Example:** Contextual: `anyOf(fastFailure, slowSuccess)` can fail. Java 21 `anyOf()` with no arguments returns an incomplete future.

**Deep dive / verification:** Coordinator bookkeeping is O(r) for r replicas; hedged requests amplify load. Empty input needs explicit validation. Cancellation of a future does not prove transport termination.

**Follow-ups:** Can applyToEither replace the coordinator? Do not rely on it for all failure policies; specify and test exceptional completion behavior explicitly.

**Primary reference:** [Reference documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html).

---

**3. A decoder treats a short InputStream.read as the end of a message. What boundary was assumed?**

**Say aloud:** “An input stream provides bytes, while a message frame is a protocol-defined unit. A read into a buffer may return fewer bytes than requested without reaching end of stream. I would read the required bounded frame length using readNBytes or a correct loop, then reject premature end of stream before parsing. A length prefix must be validated before allocating memory, and network reads need transport deadlines so a peer cannot hold the request forever. Buffer reuse also means downstream work must not outlive ownership of its bytes. Tests should use a stream that returns one byte per read and a truncated payload, because a byte-array test that fills the buffer in one call can conceal the bug.”

**Example:** Contextual: `byte[] body = input.readNBytes(length); if (body.length != length) throw new java.io.EOFException();` Validate length first.

**Deep dive / verification:** O(length) bytes/time plus transport waiting; readNBytes does not close the stream or establish an application deadline.

**Follow-ups:** Can available give the complete frame length? No; it estimates bytes readable without blocking and can be zero before EOF.

**Primary reference:** [Reference documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/InputStream.html).

---

**4. A stream pipeline validates rows in peek, then count returns without validation. Why?**

**Say aloud:** “A stream is a declarative computation whose implementation may omit stages that cannot affect its result. peek is useful for observation, but its side effects are not a reliable validation contract. For a sized source, count may determine the size without traversing elements at all. I would make validation an explicit required traversal and only report acceptance after it succeeds. If validation produces normalized values or errors, represent those results directly rather than hiding them inside debug callbacks. Tests should include both sized lists and sources whose size is unknown, plus invalid rows early and late in the input. A sequential pipeline does not repair this semantic problem: the optimization permission exists independently of parallel execution.”

**Example:** Contextual: `rows.stream().peek(this::validate).count()` must not be the acceptance gate. Use an explicit validation loop.

**Deep dive / verification:** An explicit full validation is O(n) plus validation cost. Side effects before a later failure are not automatically undone.

**Follow-ups:** Is filter a suitable hidden validator? Prefer explicit results; short-circuit operations can still stop before every row is examined.

**Primary reference:** [Reference documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html).

---

**5. A JPA query uses AUTO flush and fails on an unrelated pending insert. Why did reading execute a write?**

**Say aloud:** “A persistence context tracks managed entities and pending changes. Flushing synchronizes those changes with the database; it is distinct from committing the transaction. With AUTO flush, the provider must ensure pending changes that could affect a query are visible to that query, and may flush before executing it. An invalid pending insert can therefore surface during a seemingly read-only lookup. I would examine the entire transaction and preceding entity modifications instead of blaming only the SELECT. Validate commands before changing managed state, keep transaction scope deliberate, and treat persistence failures according to their rollback contract. Switching flush mode to hide the error risks stale query results rather than fixing invalid data. Integration tests need the actual provider and database constraints.”

**Example:** Contextual: persist an invalid entity, then execute an overlapping JPQL query in the same transaction; inspect emitted SQL and the first exception.

**Deep dive / verification:** Assumption: Jakarta Persistence 3.2, AUTO mode, joined active transaction. Exact SQL timing depends on provider; flushing is not durable commit.

**Follow-ups:** Will COMMIT mode guarantee read-your-pending-writes for JPQL? The effect of updates on queries in that mode is unspecified; do not assume it.

**Primary reference:** [Reference documentation](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html).

---

**6. A prototype Spring bean owns a temporary file, but container shutdown never closes it. Who owns destruction?**

**Say aloud:** “A prototype bean is a new instance obtained through the container rather than a shared singleton. Spring initializes it but does not retain responsibility for its complete lifecycle after handing it to the caller. Destruction callbacks for prototype instances are therefore not automatically invoked at container shutdown. I would assign explicit ownership to the component that obtains each resource-bearing instance and close it at the operation boundary, including exceptions and cancellation. A factory returning an owned closeable handle can make that obligation visible. Merely changing scope does not solve resource management, and retaining every instance in a cleanup registry can itself leak memory. I would test repeated operations, early failures and shutdown with in-flight work, checking actual file descriptors and temporary files.”

**Example:** Contextual: obtain one prototype builder per report, then close that owned builder in finally. Do not close borrowed shared dependencies.

**Deep dive / verification:** Assumption: Spring Framework 7.0 bean scope contract. Cleanup cost depends on resources; prototype creation does not imply thread safety.

**Follow-ups:** What if consumers forget to close? Centralize acquisition and release in an operation template, or choose a lifecycle-aware custom scope with explicit semantics.

**Primary reference:** [Reference documentation](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html).

---

**7. A ConcurrentHashMap computeIfAbsent loader recursively updates the same map. Why can atomic loading fail?**

**Say aloud:** “computeIfAbsent atomically computes an absent mapping for a key, but its callback is not an unrestricted transaction. ConcurrentHashMap requires the computation to be short and simple and not update other mappings of that map. A recursive dependency can violate this restriction, and detectable recursive updates that would otherwise never complete can throw IllegalStateException. I would keep dependency discovery outside the atomic map callback and explicitly detect cycles in any loading graph. If expensive asynchronous work is shared, publish an owned future with a carefully designed failure and eviction policy rather than doing network calls inside a map computation. Tests should include direct recursion, two-key cycles, loader exceptions and null results. A null return installs no mapping, so later calls may retry.”

**Example:** Contextual anti-example: `cache.computeIfAbsent(key, k -> cache.computeIfAbsent(k, loader))` recursively loads its own key.

**Deep dive / verification:** Other updates may block during computation; atomic installation does not make external side effects exactly once across retries or evictions.

**Follow-ups:** Is this restriction identical for every Map implementation? No; use the concrete implementation contract rather than assuming all compute methods share concurrency guarantees.

**Primary reference:** [Reference documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html).

---

**8. An InputStream parser casts read() to byte before checking for EOF. Why does a valid 255 disappear?**

**Say aloud:** “read returns an int so it can represent every unsigned byte from zero through 255 plus the distinct EOF sentinel minus one. Casting to byte first collapses 255 to minus one because Java byte is signed. I would preserve the int until checking for EOF, then convert or mask according to the binary protocol. This is a representation boundary, not a character-decoding decision: textual input additionally needs an explicit charset and malformed-input policy. Tests must include zero, 127, 128, 255 and EOF, since ASCII-only fixtures hide the error. A parser must also distinguish truncation halfway through a field from clean end of a record stream; silently returning partial records can turn corrupt input into plausible business data.”

**Example:** Contextual: `int next = input.read(); if (next == -1) return; int unsigned = next;` Only cast after deciding how signed storage is interpreted.

**Deep dive / verification:** Constant work per byte; reading n bytes costs O(n) excluding waiting. Do not treat any negative signed byte as EOF.

**Follow-ups:** How is a stored byte recovered as unsigned? `Byte.toUnsignedInt(value)` yields 0 through 255; it cannot recover an EOF distinction already discarded.

**Primary reference:** [Reference documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/InputStream.html).

---

**9. An infinite stream is sorted before limit(10). Why does requesting ten results never finish?**

**Say aloud:** “Sorting is a stateful stream operation: to establish the smallest values of an arbitrary unsorted source, it needs to see the source end. An infinite stream has no such end, so a downstream limit does not necessarily bound upstream work. I would decide whether the requirement is the first ten generated values, the ten smallest values of a finite batch, or a continuously maintained summary. Moving limit before sorted changes the meaning to sorting only a prefix. For a bounded batch, a size-ten heap can reduce retained memory, but it still needs the complete batch before claiming a final top ten. Tests should include a large finite source and count consumed elements instead of relying on timing alone.”

**Example:** Contextual: `Stream.iterate(0, n -> n + 1).sorted().limit(10)` cannot establish a finite sorted result from that unbounded source.

**Deep dive / verification:** Finite full sort generally costs O(n log n) time and O(n) storage; top-k heap O(n log k), O(k) storage. Stream APIs do not promise these implementation bounds universally.

**Follow-ups:** What about an already sorted source? Exploit an explicit source ordering guarantee; arbitrary generated encounter order does not declare sortedness.

**Primary reference:** [Reference documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html).

---

**10. A stream is traversed twice to count and then export. Why does caching its variable not cache its rows?**

**Say aloud:** “A stream is a consumable computation, not a reusable collection. Once a terminal operation consumes it, using it again violates the stream contract and may throw IllegalStateException. I would either materialize a bounded immutable result once, obtain a fresh stream for each traversal, or compute the required outputs in one pass. Those options have different consistency guarantees: two fresh database queries can observe different rows, while materialization retains memory proportional to the snapshot. For a large export, combining counting with writing can avoid a second traversal but cannot know the final count before finishing. I would make the response protocol fit that constraint and close I/O-backed streams. Tests should exercise an empty source, failure halfway through export and changing data between fresh traversals.”

**Example:** Contextual: `long size = rows.count(); rows.forEach(writer);` reuses a consumed stream. A Supplier of streams creates traversals, not a shared snapshot.

**Deep dive / verification:** O(n) retained rows for materialization; streaming can bound memory but still requires resource and output-failure handling.

**Follow-ups:** Can parallel make a stream reusable? No; parallel changes execution strategy, not the single-use lifecycle contract.

**Primary reference:** [Reference documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html).

---

**11. Find an integer appearing more than half the time, or report none. Why must a voting candidate be verified?**

**Say aloud:** “A majority means strictly more than half of all array positions, not simply the most frequent value. Boyer-Moore voting cancels pairs of different values while retaining one candidate and a balance. A real majority survives those cancellations, but without one the process can still leave an arbitrary candidate. I would therefore count that candidate in a second pass and return it only if its frequency exceeds half the input length. The empty array returns no result, and negative integers are ordinary values rather than absence sentinels. This uses constant auxiliary storage and linear time over a replayable array. Tests should compare against a frequency-map oracle for all small arrays, particularly exact-half cases and arrays with several equally common values.”

**Example:** For [2, 1, 2], return 2; for [1, 2], return empty. The published class below preserves the input.

**Deep dive / verification:** Pair cancellation preserves existence of a strict majority. Two passes require replayable input; a non-replayable source needs storage or a different contract.

**Follow-ups:** Can the second pass be omitted? Only when existence is guaranteed by a trusted precondition; the function here promises detection of absence.

**Primary reference:** [Reference documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/OptionalInt.html).

```java
public final class Majority {
    public static java.util.OptionalInt find(int[] values) {
        java.util.Objects.requireNonNull(values);
        int candidate = 0, balance = 0;
        for (int value : values) {
            if (balance == 0) candidate = value;
            balance += value == candidate ? 1 : -1;
        }
        int count = 0;
        for (int value : values) if (value == candidate) count++;
        return count > values.length / 2
            ? java.util.OptionalInt.of(candidate) : java.util.OptionalInt.empty();
    }
}
```

---

**12. Choose one buy followed by one sell for maximum profit. Why is the global minimum alone insufficient?**

**Say aloud:** “The order constraint means the purchase must occur before the sale. Selecting the global minimum and global maximum independently can invent a trade that runs backward in time. I would scan prices once, keeping the minimum among earlier positions and the best legal profit seen so far. For each new price, compare its difference from that earlier minimum before updating the minimum. We allow no trade, so decreasing or empty inputs return zero. The example accepts any integer readings to stress arithmetic; real price validation belongs at the domain boundary. I would subtract using long because two valid int readings can differ by more than Integer.MAX_VALUE. Verification compares every legal index pair against the scan, including extreme values and unchanged input.”

**Example:** For [9, 2, 7, 1], return 5 from buying at 2 and selling at 7, not 8 from an illegal reverse trade.

**Deep dive / verification:** O(n) time, O(1) auxiliary storage. One completed transaction, no fees, no short-selling. This does not solve multiple-trade optimization.

**Follow-ups:** How do fees change it? For a fixed fee on one trade, subtract it from each candidate profit and keep the no-trade option; multiple trades need different state.

**Primary reference:** [Reference documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html).

```java
public final class OneTrade {
    public static long profit(int[] prices) {
        java.util.Objects.requireNonNull(prices);
        if (prices.length == 0) return 0;
        int minimum = prices[0];
        long best = 0;
        for (int i = 1; i < prices.length; i++) {
            best = Math.max(best, (long) prices[i] - minimum);
            minimum = Math.min(minimum, prices[i]);
        }
        return best;
    }
}
```

# Topic coverage and next set

This set covers async outcome policy, bounded binary framing, stream optimization and consumption, persistence synchronization, prototype cleanup, recursive map loading, majority proof and temporal optimization. Verify framework examples against the deployed provider and resource lifecycle; no live infrastructure integration is claimed.

Next set will build on explicit completion contracts with distributed task handoffs, schema validation and recovery-time admission, then introduce coding problems with reconstructed witnesses. Earlier concurrency, security, JVM and Kafka sets remain available in the daily index.
