**Set 26 · 10 November 2026 — Representation, coordination and explicit contracts**

Reference assumptions: **Java 21 without preview features**. Primary Java API references checked 10 November 2026; no latest-version claim. Q1–Q10 are contextual illustrations, not runnable integrations. Q11–Q12 are standalone classes tested from this source. Stable IDs: **S26-Q01–S26-Q12**. Spoken answers target 45–90 seconds. Examples are original teaching scenarios.

---

**1. A nested array compares unequal after a round trip. Why does Arrays.equals stop too early?**

**Say aloud:** “An array is an object whose default equality is identity, meaning the same object reference. Arrays.equals on an object array compares its elements using their equality methods; if those elements are arrays, equal contents can still compare unequal. For a tree of nested arrays I would use Arrays.deepEquals and the corresponding deep hash when a content hash is required. I would first define whether row order and duplicate rows matter, because deep equality preserves both. This is suitable for bounded acyclic data, not arbitrary cyclic object graphs. A serialization test should construct fresh inner arrays so it cannot pass accidentally through shared references. For domain entities, I would define domain equality instead of silently treating their fields as array content.”

**Example:** `Arrays.deepEquals(new Object[]{new int[]{4}}, new Object[]{new int[]{4}})` is true.

**Deep dive / verification:** Work follows compared contents until a mismatch; recursive nesting consumes stack. Verify null rows, different lengths and changed row order. Self-containing arrays are outside this example.

**Follow-ups:** Can ordinary hashCode accompany deepEquals? No; use matching content hashing and prevent mutation while used as a key.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html).

---

**2. A completion latch reaches zero after failed tasks. Does that certify a successful batch?**

**Say aloud:** “A CountDownLatch is a one-time countdown gate, not a result collector. Awaiting zero tells the coordinator that enough countdown calls happened. It says nothing about whether their work succeeded. I would count down in finally so a failed worker cannot strand the coordinator, while recording each task result separately and propagating submission failures through the same accounting policy. After a successful await, writes before the corresponding countdowns are visible, but that visibility guarantee does not turn failures into successes. A batch response should distinguish successful, failed and unfinished items. I would test a worker that throws before producing output and a coordinator timeout, then verify that neither path publishes a success response merely because the counter changed.”

**Example:** Contextual: `try { results[index] = runTask(); } finally { done.countDown(); }` also needs failure capture around runTask.

**Deep dive / verification:** O(tasks) outcome storage if all results are retained. Timeout does not stop workers. One countdown per accepted task is an application invariant, not something the latch enforces.

**Follow-ups:** Can the latch be reset? No; create a new batch gate, or choose a reusable coordination mechanism.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CountDownLatch.html).

---

**3. An overload policy removes a queued FutureTask, but its caller waits forever. Who completes the dropped result?**

**Say aloud:** “Rejection policy is part of an executor’s result contract. DiscardOldestPolicy removes queued work to admit newer work, but silently dropping a FutureTask does not itself give its waiting caller a terminal outcome. I would use explicit rejection when losing work is unacceptable, or design a handler that cancels the dropped future and records the loss. New submissions also need a defined outcome during shutdown. A retrying handler must avoid unbounded recursion when admission remains impossible. For a request service, rejecting quickly can be better than returning a future that will never finish. I would fill the worker and queue deterministically, submit another task, and check both the displaced and incoming callers without using indefinite waits.”

**Example:** Contextual: a single busy worker plus one queued FutureTask; the next submission displaces the queued task under DiscardOldestPolicy.

**Deep dive / verification:** Queue capacity bounds retained tasks, not completion time. Validate shutdown, saturation and cancellation outcomes. Policy changes can alter caller-visible exceptions.

**Follow-ups:** Is oldest always least valuable? No; queue order and business priority differ, particularly with priority queues.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.DiscardOldestPolicy.html).

---

**4. Two buffer producers meet an Exchanger and swap full buffers. Where was the consumer role enforced?**

**Say aloud:** “An Exchanger pairs threads and swaps the references they present. It does not know that one participant should produce and the other consume. If several producers and consumers share it, two producers can pair and violate a full-versus-empty buffer protocol. I would restrict the topology to the intended pair or use typed queues whose direction expresses ownership. After a successful exchange, each participant must stop modifying its old buffer and use the received one. Visibility of earlier writes does not prevent later aliasing mistakes. I would test partner absence with a timeout and a deliberately wrong-role participant. Cancellation needs a shutdown protocol so the remaining partner does not wait indefinitely for a thread that has exited.”

**Example:** Contextual: producer A exchanges full buffer A with producer B’s full buffer B; neither receives an empty buffer.

**Deep dive / verification:** Pairwise handoff establishes visibility, not role validation. Buffer storage can be bounded by protocol; waiting time depends on the partner.

**Follow-ups:** Why use two queues instead? Full and empty queues make directions explicit and can support several workers, at additional coordination cost.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Exchanger.html).

---

**5. A diagnostic ID uses System.identityHashCode as a permanent unique key. Why can unrelated objects collide?**

**Say aloud:** “An identity hash is a hash based on object identity rather than an overridden hashCode method. It is still an integer hash, not a globally unique identifier or a memory address. Distinct objects may have the same value, and persisting it cannot establish identity across process restarts. I would use it only as a diagnostic hint, with other context, and use explicitly allocated stable IDs for durable records. Within one process, an identity-based map can distinguish references without pretending their hashes are unique. I would review the design rather than wait for a collision to appear in a small test: absence of observed collisions is not a proof of uniqueness. Logs should also avoid exposing sensitive object contents merely to resolve ambiguity.”

**Example:** Contextual: `Map<Integer, Object> byIdentityHash` can overwrite an unrelated entry; the integer is an insufficient key.

**Deep dive / verification:** Hash generation has no uniqueness guarantee. Durable ID allocation needs its own scope and collision policy.

**Follow-ups:** Does overriding hashCode fix identityHashCode? No; this API deliberately uses the default identity-style hash behavior.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/System.html).

---

**6. A time bucket before the epoch is assigned to bucket zero. Why does integer division disagree with floor division?**

**Say aloud:** “Java integer division truncates toward zero. A bucket index for signed timestamps often instead needs mathematical floor, the greatest integer no larger than the quotient. With ten-second buckets, minus one second belongs in bucket minus one, not bucket zero. I would use Math.floorDiv for the index and define a positive bucket width at the boundary. The associated floorMod gives a nonnegative offset for that positive width. I would keep timestamp units explicit and test immediately before, at and after zero and every bucket boundary. Changing division silently can alter persisted bucket identities, so a migration must coordinate readers and writers rather than mixing old and new partition rules.”

**Example:** `Math.floorDiv(-1, 10)` is -1; `-1 / 10` is 0; `Math.floorMod(-1, 10)` is 9.

**Deep dive / verification:** O(1) arithmetic. Reject zero and negative widths in the domain API. General signed division has an overflow corner at MIN_VALUE divided by -1.

**Follow-ups:** Would casting the result to double help? No; lost information must be avoided before division, and floating point introduces different precision limits.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html).

---

**7. A BitSet-based feature vector loses trailing false flags in storage. What length did it preserve?**

**Say aloud:** “A BitSet stores indexed boolean values, but its logical length ends just after the highest set bit. That is different from the declared number of features in a schema. If the last flags are false, length cannot recover the original vector width; an all-false vector has logical length zero. I would store the schema version and expected width separately, then validate decoded indices against that width. Capacity is also different from width and should not become a wire contract. This representation is compact for dense bounded indices, but a very large sparse index can be costly. I would test all-false vectors, a final true bit and unknown future feature indices before accepting a stored payload.”

**Example:** `new BitSet(128).length()` is zero, not 128. Capacity is not an assertion that 128 features exist.

**Deep dive / verification:** Storage follows the highest represented bit in typical implementations. BitSet is mutable and needs external synchronization for shared access.

**Follow-ups:** Can byte serialization restore width? Not reliably for trailing zeros; carry the logical schema width independently.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/BitSet.html).

---

**8. An API accepts two Base64 spellings for one token. Can raw text safely identify decoded credentials?**

**Say aloud:** “Base64 is a reversible byte encoding, not encryption or proof of authenticity. Java’s decoder can accept final units without padding, so different textual forms can represent the same bytes. If rate limits or deduplication use raw spelling while authentication uses decoded bytes, equivalent inputs may be counted separately. I would define the protocol’s accepted alphabet and canonical representation, bound encoded length before decoding, and consistently identify the credential using a safe server-side identifier. Secrets should not be placed directly into logs or cache keys. A signature protocol must specify exactly which bytes are signed; normalization after signing can invalidate that contract. I would test padded, unpadded, malformed and oversized inputs against the explicit acceptance policy.”

**Example:** `getDecoder().decode("YQ")` and `getDecoder().decode("YQ==")` both produce the byte for a.

**Deep dive / verification:** O(encoded length) decoding with allocated output. A successful decode does not authenticate the sender. Apply authorization separately.

**Follow-ups:** Should every protocol accept both? No; a stricter protocol can reject noncanonical input even when the library decoder accepts it.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Base64.Decoder.html).

---

**9. Three mutable rows initialized with Collections.nCopies all change together. Were three objects allocated?**

**Say aloud:** “nCopies repeats one reference rather than invoking a constructor repeatedly. Wrapping that list in an ArrayList makes the outer structure mutable, but the elements still refer to the same object. For a matrix of mutable rows, editing one row therefore edits every position that aliases it. I would allocate each row independently, or use genuinely immutable row values when sharing is intentional. A shallow copy of the outer list does not repair inner aliasing. The important contract is ownership of the elements, not only whether add and remove are allowed. Tests should modify one row and assert that another remains unchanged, and should include zero rows so the initialization policy remains clear at the boundary.”

**Example:** Contextual: `new ArrayList<>(Collections.nCopies(3, new ArrayList<Integer>()))` repeats one inner list.

**Deep dive / verification:** The nCopies representation is compact; materializing an outer ArrayList costs O(n) references. Independent rows require their own allocations.

**Follow-ups:** Is sharing always wrong? No; sharing immutable values is useful. The failure is claiming independent mutable ownership.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html).

---

**10. A CSV export uses StringJoiner and breaks when a field contains a comma. Which contract is missing?**

**Say aloud:** “StringJoiner places delimiters between strings; it is not a serializer for a structured format. CSV needs a defined policy for commas, quotes, line breaks and empty fields. Joining raw values with commas can turn one field into several or inject extra records. I would use the application’s CSV writer with an explicit dialect, then verify output with an independent parser. A blank string as an added element is also different from no elements, which matters for empty records. If spreadsheet consumers are involved, formula interpretation needs a separate export policy; CSV quoting alone does not settle it. I would test embedded delimiters, doubled quotes, line breaks and the difference between zero columns and one empty column.”

**Example:** Contextual: joining `"north,west"` and `"active"` with a comma loses the intended two-field structure without escaping.

**Deep dive / verification:** Output storage grows with total text. Define null handling before joining; textual null is not automatically an absent field.

**Follow-ups:** Can a different delimiter solve it? Only with a protocol forbidding or escaping that delimiter; arbitrary data still needs serialization rules.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/StringJoiner.html).

---

**11. Return sorted squares of a sorted signed integer array. Why can squaring destroy the existing order?**

**Say aloud:** “Squaring reverses the order of negative values by magnitude, so squaring a sorted array does not leave it sorted. The largest remaining square must come from one of the two ends. I compare their squares, write the larger into the last free output position, and move that endpoint inward. This preserves the invariant that the output suffix is final and sorted. I widen each value to long before multiplication because even a valid int square can overflow int. Empty input produces empty output, and null is rejected. The input must already be sorted; this implementation trusts that precondition. I would compare with independently squaring and sorting all elements, including extreme values, duplicates and arrays containing only negative numbers.”

**Example:** [-4, -1, 2] becomes [1, 4, 16].

**Deep dive / verification:** O(n) time and O(n) output storage, O(1) extra working state. Every int square fits in long. Unsorted input violates the contract; validate separately if untrusted.

**Follow-ups:** Can this be done by sorting squares? Yes, with a simpler O(n log n) comparison-sort approach that does not need the input-order precondition.

```java
public final class SortedSquares {
    public static long[] of(int[] a) {
        java.util.Objects.requireNonNull(a);
        long[] out = new long[a.length];
        int left = 0, right = a.length - 1;
        for (int at = out.length - 1; at >= 0; at--) {
            long x = (long) a[left] * a[left];
            long y = (long) a[right] * a[right];
            if (x > y) { out[at] = x; left++; }
            else { out[at] = y; right--; }
        }
        return out;
    }
}
```

---

**12. Find the first position whose left and right sums match. Why should the current value belong to neither side?**

**Say aloud:** “An equilibrium index has equal sums strictly before and strictly after it. I first compute the total sum in long. During a second pass I keep the sum strictly to the left; the right sum is total minus left minus the current element. I compare before adding the current element to left, which prevents counting it on the wrong side. Returning the first match defines a deterministic answer when several indices qualify. Empty input has no index, while a single element qualifies because both sides are empty and sum to zero. Negative values are allowed, so a two-pointer approach based on monotonically growing sums is inappropriate. I would verify against a quadratic oracle that sums both sides independently.”

**Example:** [2, -1, 0, 1] returns index 2; [0, 0] returns 0. Absence is -1, an index sentinel rather than a value sentinel.

**Deep dive / verification:** O(n) time, O(1) working space. A Java int array’s length and element bounds make its total fit in long. Input remains unchanged. Null is rejected.

**Follow-ups:** Can we return every equilibrium? Yes; collect each match during the same scan, adding O(k) output storage for k results.

```java
public final class Equilibrium {
    public static int first(int[] a) {
        java.util.Objects.requireNonNull(a);
        long total = 0, left = 0;
        for (int value : a) total += value;
        for (int i = 0; i < a.length; i++) {
            if (left == total - left - a[i]) return i;
            left += a[i];
        }
        return -1;
    }
}
```

# Topic coverage and next set

This set covers nested equality, completion versus success, dropped task outcomes, pairwise buffer roles, identity hashes, signed buckets, feature-vector width, credential encoding, mutable aliases, format serialization, endpoint selection and prefix accounting. The coding invariants above explain the algorithms; API claims link to primary Java 21 references. Framework and distributed-system scenarios in earlier sets remain available through the daily index.

Next set will build on these explicit contracts with framework validation groups, distributed admission during recovery and reconstruction of coding witnesses. Inspect the cumulative ledger first to avoid repeating earlier decisions.
