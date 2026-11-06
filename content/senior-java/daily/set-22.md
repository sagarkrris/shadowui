**Set 22 · 4 November 2026 — Numeric boundaries and computation lifecycles**

Reference assumptions: **Java 21 without preview features**. Primary Java API references checked 4 November 2026; no claim that this is the latest release. Examples are original illustrations. Q1–Q10 are contextual fragments and designs, not deployed integrations. Q11–Q12 are compiled behavioral exercises.

Stable IDs: **S22-Q01–S22-Q12**, in order. Spoken answers target 45–90 seconds.

---

**1. A completion ratio is stored as double but remains zero until every job finishes. Where was precision lost?**

**Say aloud:** “Integer division happens before assignment when both operands are integers. Assigning its result to double cannot restore the discarded fraction. For completed jobs divided by total jobs, I would widen an operand before dividing and define the zero-total case explicitly. A ratio is dimensionless, whereas a percentage multiplies that ratio by one hundred; confusing the two is a separate contract error.

For a progress display, floating point is generally adequate, but financial allocation needs a stated decimal rounding policy. I would validate nonnegative counts and decide whether completed may exceed total during reconciliation. Tests should include one of three jobs, all jobs, zero jobs and inconsistent counters. This is a language evaluation issue rather than a JVM optimization bug; changing the destination type alone cannot fix it.”

**Example:** Contextual Java: `(double) completed / total` after validating total; `1 / 3` is zero before widening.

**Deep dive / verification:** Constant arithmetic cost. Independent concurrent counter reads can still describe different instants; correct numeric conversion does not create a coherent snapshot.

**Follow-ups:** Would casting the final quotient help? No, truncation already occurred. Should zero jobs mean complete? That is a product decision, not a division rule.

**Primary reference:** [Java 21 specification](https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html).

---

**2. A nullable Boolean feature flag throws when used in an if statement. Which conversion was implicit?**

**Say aloud:** “Unboxing converts a wrapper object such as Boolean into its primitive value. A null reference has no primitive value, so using it directly as an if condition throws NullPointerException. I would first decide whether missing means disabled, inherited or invalid. That decision belongs at the configuration boundary rather than being accidentally chosen by a primitive conversion.

If missing deliberately means disabled, Boolean.TRUE.equals(flag) expresses that policy safely. If missing means inherit, collapsing it to false loses information and a separate resolution step is needed. I would test all three states and make serialization defaults explicit. Using a primitive after validation simplifies internal code, but changing a public nullable field into a primitive can silently change compatibility. A null-safe expression solves dereferencing; it does not decide the business meaning of absence.”

**Example:** Contextual Java: `Boolean.TRUE.equals(flag)` accepts only explicit true when absence means disabled.

**Deep dive / verification:** Constant comparison cost. Validate configuration once where possible; do not scatter inconsistent fallback policies across consumers.

**Follow-ups:** Does Optional itself allow null? A variable can be null, but that violates its intended usage. Is false equivalent to missing? Only under an explicit contract.

**Primary reference:** [Java 21 specification](https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html).

---

**3. Shifting an array right with a forward loop repeats its first element. How does arraycopy handle overlap?**

**Say aloud:** “An overlapping copy uses the same storage as both source and destination. A forward loop that writes into a later index can overwrite values before reading them. System.arraycopy specifies overlap behavior as though the source region were first copied to temporary storage, so it preserves the original range for that operation.

For shifting three values one position right, I would verify destination capacity and call arraycopy with the intended offsets and length. This is a shallow copy: object references move, but referenced objects are not cloned. It also does not make concurrent array access atomic or safe. Tests should cover overlap in both directions, zero length and invalid ranges. Reference-array type incompatibility can leave a partially copied destination, so the method should not be treated as a transaction with universal rollback on every exception.”

**Example:** Contextual Java: `System.arraycopy(a, 0, a, 1, 3)` changes `[1,2,3,4]` into `[1,1,2,3]`.

**Deep dive / verification:** Copying k entries takes O(k) work in this model; temporary-storage wording specifies observable semantics, not a required allocation strategy.

**Follow-ups:** Are elements cloned? No. Is a failed reference copy always unchanged? No; an incompatible element can fail after a prefix was copied.

**Primary reference:** [Java 21 specification](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/System.html).

---

**4. A delimited import loses its final empty column. What does String.split discard by default?**

**Say aloud:** “A delimiter separates fields, and an empty field can still carry positional meaning. The one-argument String.split uses a zero limit, which removes trailing empty strings. That can make a row with a missing final value look as though it has fewer columns. I would use a negative limit when the format requires preserving trailing fields and validate the resulting column count.

The delimiter is a regular expression, so a literal dot or vertical bar also requires correct escaping or Pattern.quote. This simple approach is appropriate only for a deliberately simple format. Quoted commas, escaped quotes and embedded line breaks need a parser for the actual format, not increasingly complicated splitting. Tests should distinguish empty input, interior empties, final empties and malformed records, with limits on record size to bound memory consumption.”

**Example:** Contextual Java: `"a,b,".split(",", -1)` preserves three fields; the final field is empty.

**Deep dive / verification:** Output storage grows with the input and number of fields. General regular-expression runtime depends on the pattern; do not promise universal linear performance.

**Follow-ups:** Is this a CSV parser? No, it lacks quoted-field handling. Should an empty field become null? Only when the schema defines that conversion.

**Primary reference:** [Java 21 specification](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html).

---

**5. A shard index becomes negative despite Math.abs on the hash. Which integer has no positive int counterpart?**

**Say aloud:** “Java int has one more negative value than positive values. The magnitude of Integer.MIN_VALUE is 2147483648, which does not fit in int. Math.abs therefore returns that same negative value for this input. Applying remainder afterward can still produce an invalid negative shard index.

For a positive shard count I would use Math.floorMod(hash, shardCount), which defines a nonnegative result for that divisor. I would validate the count and keep the placement rule stable across readers and writers. This fixes range correctness, not distribution quality or migration when shard count changes. Tests should include the minimum integer, negative hashes, zero and one shard. Widening before taking the absolute value is another valid numeric technique, but it defines a different placement rule and should not silently replace an existing distributed contract.”

**Example:** Contextual Java: `Math.floorMod(Integer.MIN_VALUE, 3)` is 1; require a positive shard count.

**Deep dive / verification:** Constant arithmetic cost. A valid index gives no security protection against deliberately colliding inputs.

**Follow-ups:** Can absExact detect the problem? Yes, it throws on overflow. Does floorMod make placement stable after adding shards? No; placement migration remains separate.

**Primary reference:** [Java 21 specification](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html).

---

**6. An executor is shut down and its output directory is immediately deleted. Why can workers still write there?**

**Say aloud:** “Shutdown closes admission to new tasks while permitting already submitted work to finish. It does not itself wait for termination. Deleting a resource immediately after shutdown can therefore race with tasks that still own that resource. I would make the executor owner also own the drain protocol and resource cleanup.

After stopping admission, wait for termination with a defined deadline, then apply the documented escalation policy if work remains. shutdownNow attempts interruption and returns queued work that never started; it does not forcibly stop every running task. Tasks must cooperate and external effects may already have occurred. I would test with latches controlling a blocked task rather than timing sleeps. A finite shutdown deadline may mean reporting incomplete work instead of claiming cleanup success. Shared executors must not be shut down by an individual borrower.”

**Example:** Contextual sequence: stop submissions, call shutdown, inspect awaitTermination, then release task-owned storage only when ownership permits.

**Deep dive / verification:** Termination depends on task behavior. Waiting has a deadline; interruption is a request rather than a transactional undo.

**Follow-ups:** Does isShutdown imply isTerminated? No. What about Java 21 close? It waits for termination and may be unsuitable for a strict finite drain budget.

**Primary reference:** [Java 21 specification](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html).

---

**7. An asynchronous lookup returns a future inside a future. Why did thenApply not wait for the second operation?**

**Say aloud:** “A completion stage represents an eventual outcome. thenApply transforms a successful value, so if its function returns a future, that future becomes the value of the outer stage. thenCompose instead connects the returned stage into the completion chain. I would use composition when operation two depends on operation one and callers need the final outcome.

For example, finding an account asynchronously and then fetching its permissions should expose one stage for permissions. I would propagate failures deliberately and avoid blocking join inside the transformation, which can consume scarce executor threads. Composition does not automatically propagate transport cancellation or impose a deadline. Tests should hold the second stage incomplete and assert the composed result remains incomplete, then verify success and failure. Executor ownership still matters because a non-async continuation can run on a completing thread.”

**Example:** Contextual Java: `findAccount(id).thenCompose(account -> fetchPermissions(account))` exposes the second operation’s result.

**Deep dive / verification:** One dependent stage per step; remote work dominates cost. Composition expresses dependency, not parallelism or distributed rollback.

**Follow-ups:** When is thenApply correct? When transforming to an ordinary value, or intentionally returning a nested stage. Does compose require another thread? No.

**Primary reference:** [Java 21 specification](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html).

---

**8. A stream is counted for logging and then collected for the response. Why is the second terminal operation invalid?**

**Say aloud:** “A stream is a single-use computation pipeline rather than a reusable collection. A terminal operation consumes that pipeline, so a second terminal operation on the same stream violates its lifecycle. I would choose whether to materialize one bounded result and derive both count and response from it, or create separate streams over a stable reusable source.

Those choices have different consistency and memory costs. Two queries over a changing source need not describe the same data, while collecting everything just for a count can exhaust memory. For resource-backed streams, creating another stream also creates another resource lifecycle that must be closed. Tests should exercise an empty source and a source changed between traversals. A supplier can create fresh streams, but merely returning the same consumed stream from a supplier does not make it reusable.”

**Example:** Contextual Java: collect a bounded page once and use its list size; do not call count then toList on the same stream.

**Deep dive / verification:** Materialization uses O(n) storage for n retained references. Fresh traversal can repeat I/O and does not create a snapshot.

**Follow-ups:** Can parallel make it reusable? No. Is detection guaranteed for every reuse? Implementations may detect reuse; code must obey single use regardless.

**Primary reference:** [Java 21 specification](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html).

---

**9. A negative cache puts null into ConcurrentHashMap and fails. How should absence be represented?**

**Say aloud:** “A negative cache remembers that a lookup found no value, reducing repeated misses. ConcurrentHashMap forbids null keys and values, so null cannot serve as a stored negative result. I would use an explicit outcome such as a non-null wrapper containing Optional.empty, with expiry and a distinction between authoritative absence and a temporary lookup failure.

If a timeout is cached as missing, users can lose access to a newly available object until expiry. Tenant and authorization scope must also be part of the key or checked separately. An empty result needs invalidation when creation occurs, and bounded retention to prevent arbitrary missing keys from filling memory. Tests should include create-after-miss, transient failures and cross-tenant lookups. A sentinel solves representation only; it does not define freshness, retry ownership or the authority of the underlying lookup.”

**Example:** Contextual type: `ConcurrentHashMap<Key, Optional<Value>>`; the map value itself must never be null.

**Deep dive / verification:** Expected constant-time lookup under suitable hashing; storage grows with retained keys. No expiry policy is supplied by this map.

**Follow-ups:** Does computeIfAbsent store null? No. Is every 404 safe to cache globally? No; scope and disclosure semantics must be defined.

**Primary reference:** [Java 21 specification](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html).

---

**10. A checked multiplication rejects an oversized request only after a reservation was recorded. Why did overflow detection not make the operation atomic?**

**Say aloud:** “Checked arithmetic detects a result outside the numeric type, but it does not roll back earlier side effects. Math.multiplyExact throws ArithmeticException for overflow; if code reserves stock first and computes the total second, the reservation may already exist when the exception occurs. I would validate and calculate all pure derived values before applying effects wherever possible.

When the calculation depends on mutable database state, the transaction must cover the read, validation and write under the appropriate concurrency rule. A remote reservation cannot be undone by a local Java exception without a separate protocol. Tests should put operands at exact safe boundaries and immediately beyond them, then assert that invalid requests created no reservation. Choosing long increases the range but does not remove the need to define maximum quantities, units and a safe failure response.”

**Example:** Contextual Java: calculate `Math.multiplyExact(unitMinor, quantity)` before invoking the reservation boundary; both operands here are long.

**Deep dive / verification:** Constant arithmetic cost. Checked arithmetic provides local detection, not isolation or compensation for already completed effects.

**Follow-ups:** Should overflow wrap for money? Usually reject under an explicit amount contract. Can BigInteger replace limits? It avoids fixed-width overflow but still needs business and resource bounds.

**Primary reference:** [Java 21 specification](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html).

---

**11. Compute the greatest common divisor of two signed int values. Why must widening precede absolute value?**

**Say aloud:** “The greatest common divisor is the largest positive integer dividing both magnitudes. I define gcd of zero and zero as zero for this API. Euclid's algorithm repeatedly replaces the pair with the second number and the remainder until the second becomes zero. A divisor common to both inputs also divides their remainder, which preserves the answer at each step.

I widen int inputs to long before taking absolute values, because the magnitude of Integer.MIN_VALUE does not fit in int. The result must also be long for that boundary. This implementation neither mutates external state nor requires recursion. I would compare against BigInteger.gcd for signed extremes and generated pairs, including zeros. For arbitrary long inputs the same widening trick is unavailable; a separate representation or explicit rejection contract is needed. This is arithmetic normalization, not cryptographic constant-time computation.”

**Example:** Complete Java 21 class; gcd(-18, 24) is 6, and gcd(MIN_VALUE, 0) is 2147483648.

```java
public final class SignedGcd {
  public static long gcd(int a, int b) {
    long x = Math.abs((long) a), y = Math.abs((long) b);
    while (y != 0) {
      long remainder = x % y;
      x = y;
      y = remainder;
    }
    return x;
  }
}
```

**Deep dive / verification:** O(log(max(1, |a|, |b|))) remainder steps, O(1) auxiliary storage for fixed-width inputs. Each nonzero remainder is smaller than the divisor. Check symmetry, zero identity and the independent BigInteger oracle.

**Follow-ups:** Why does casting after abs fail? The int overflow has already happened. Can gcd be negative? This API always returns a nonnegative magnitude.

**Primary reference:** [Math absolute-value boundary](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html). Algorithm and complexity follow the decreasing-remainder invariant above.

---

**12. Compact a sorted integer array to one copy of each value in place. What does the returned length own?**

**Say aloud:** “Compaction writes retained values into a prefix of an existing buffer. I return the logical length of that prefix, because Java arrays cannot shrink. The caller must ignore the remaining suffix. The input must be sorted in nondecreasing order; equal values are then adjacent, so comparing each value with the last retained value is enough.

I keep a write count and scan each input value once. The write count never exceeds the number of values read, so writing the prefix cannot corrupt an unread value. For a checked public API I validate sortedness before any mutation, giving invalid input an unchanged-array contract. I would test empty arrays, all-equal values, negative values and integer extremes against an independent sorted-set oracle. If input ownership is shared, in-place mutation is inappropriate; returning an independent copy trades storage for simpler ownership.”

**Example:** Complete Java 21 class; [2,2,5,5,9] returns 3 with prefix [2,5,9]. Suffix contents are unspecified.

```java
public final class SortedCompact {
  public static int unique(int[] a) {
    java.util.Objects.requireNonNull(a, "a");
    for (int i = 1; i < a.length; i++)
      if (a[i] < a[i - 1]) throw new IllegalArgumentException("sorted input required");
    int used = 0;
    for (int value : a)
      if (used == 0 || value != a[used - 1]) a[used++] = value;
    return used;
  }
}
```

**Deep dive / verification:** Two linear passes remain O(n) time, O(1) auxiliary storage. The retained prefix equals the distinct values of the already scanned prefix. Do not test or depend on a particular suffix. Validation precedes mutation, including a late descending pair.

**Follow-ups:** What if input is unsorted? Reject here; sorting would change the contract and cost. Can this retain at most two copies? Compare against the element two retained positions back and adjust the invariant.

**Primary reference:** [Java arrays and sorting contracts](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html). Compaction is the explicit algorithm above, not a library guarantee.

---

**Topic coverage:** S22-Q01 integer evaluation; Q02 nullable flags; Q03 overlapping copies; Q04 parsing field boundaries; Q05 signed modular placement; Q06 executor resource ownership; Q07 asynchronous composition; Q08 stream lifecycle; Q09 negative caching; Q10 arithmetic before effects; Q11 Euclidean invariant; Q12 logical buffer length.

**Next set:** Build on these local invariants with multi-stage validation, asynchronous resource cleanup, and algorithms that preserve witnesses while transforming owned buffers. Resume framework and distributed scenarios through new decisions rather than repeating earlier prompts.
