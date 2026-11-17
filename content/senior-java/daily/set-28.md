**Set 28 · 12 November 2026 — Validation stages and copy boundaries**

Reference assumptions: **Java 21 without preview features; Jakarta Validation 3.0**. Primary references checked 12 November 2026, not latest-version claims. Stable IDs: **S28-Q01–S28-Q12**. Q1–Q10 are contextual teaching scenarios, not framework integrations. Q11–Q12 are runnable in the shared class below. Examples are original; spoken answers target 45–90 seconds.

---

**1. A checkout DTO passes Default validation but skips its payment constraints. Which group was requested?**

**Say aloud:** “A validation group is a named subset of constraints. Default validation checks Default constraints; it does not automatically run every group declared on the object. I would make the checkout boundary request the payment group explicitly and document whether Default must also run. This is different from validating whether configuration values exist at startup: the decision here is which business operation is being checked. Tests should submit a structurally valid draft with invalid payment fields to both draft and checkout boundaries. Separate request types can make the contract clearer when groups become difficult to follow. Validation still cannot prove that a concurrently changing balance remains sufficient; that decision needs transactional enforcement.”

**Example:** Contextual Jakarta Validation 3.0: `validator.validate(command, Default.class, Payment.class)` requests both groups.

**Deep dive / verification:** Cost depends on selected validators and graph size. Avoid remote side effects inside validators; constraint evaluation is not a transaction.

**Follow-ups:** Does declaring a group execute it? No; the invocation or integration must select it.

**Primary reference:** [Specified API or language contract](https://jakarta.ee/specifications/bean-validation/3.0/jakarta-bean-validation-spec-3.0.html#constraintdeclarationvalidationprocess-groupsequence).

---

**2. An expensive validation stage runs before basic checks. Does passing two groups specify their order?**

**Say aloud:** “A group sequence orders validation stages and stops later stages when an earlier stage has violations. Passing several groups alone does not establish that ordering. I would define a sequence for basic and detailed checks, then test that an invalid basic field prevents the detailed validator from running. This can reduce wasted work, but it does not make a remote eligibility result durable. That result may change immediately after validation. Cyclic sequences are invalid, so keep the dependency simple and visible. I would use explicit workflow code when the stages need retries, persistence or side effects; validation sequencing is best suited to deciding which constraints to evaluate.”

**Example:** Contextual: `@GroupSequence({Basic.class, Detailed.class}) interface CheckoutChecks {}`; validate CheckoutChecks.

**Deep dive / verification:** Count validator invocations in a provider integration test. No complexity bound independent of validator implementations applies.

**Follow-ups:** Are all violations always returned? Later stages are skipped after an earlier stage fails.

**Primary reference:** [Specified API or language contract](https://jakarta.ee/specifications/bean-validation/3.0/jakarta-bean-validation-spec-3.0.html#constraintdeclarationvalidationprocess-groupsequence).

---

**3. An arraycopy throws ArrayStoreException after changing the destination. Was the copy atomic?**

**Say aloud:** “Atomic here would mean all requested changes happen or none do. System.arraycopy does not provide that promise when reference elements fail the destination element-type check. A compatible prefix can already have been copied. I would not catch the exception and continue using the destination as though it were unchanged. If the operation needs replacement semantics, build and validate independent storage first, then publish the completed result using the appropriate ownership protocol. This is a runtime array-type issue, distinct from overlap handling. A deterministic test should place a compatible element before an incompatible one and inspect the destination after failure. Input validation can prevent expected failures, but publication still needs its own concurrency design.”

**Example:** Contextual: copy `new Object[]{"ok", 7}` into a two-element String array; its first slot can change before failure.

**Deep dive / verification:** Copy work scales with the copied prefix. A temporary destination costs extra storage; replacing a reference does not update aliases to the old array.

**Follow-ups:** Do invalid bounds also imply a partial copy? The API specifies no destination modification for its listed bounds failures; distinguish failure categories.

**Primary reference:** [Specified API or language contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/System.html).

---

**4. copyOfRange returns extra zeros when a requested range exceeds the input. Did it validate a complete frame?**

**Say aloud:** “An array-copy helper implements its specified range semantics, not a network framing policy. Arrays.copyOfRange can pad beyond the original end with default values. For a binary frame that must contain exactly the declared bytes, padding would invent data. I would validate the declared length against available bytes before copying, using subtraction-based bounds checks that avoid integer overflow. I would also impose a maximum frame size before allocation. Tests should include a truncated frame that would otherwise look valid after zero padding. Padding is useful for deliberate resizing, so changing the library call globally could break legitimate callers. The boundary must state whether missing bytes mean rejection or intentional defaults.”

**Example:** `Arrays.copyOfRange(new int[]{7}, 0, 3)` produces [7, 0, 0].

**Deep dive / verification:** O(requested length) output storage and copy/initialization work. Reject negative lengths and out-of-bounds start positions.

**Follow-ups:** Is an empty source always invalid? Not for copying; the protocol decides whether an empty frame is allowed.

**Primary reference:** [Specified API or language contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html).

---

**5. Collections.copy fails when the destination has enough capacity but size zero. What does it overwrite?**

**Say aloud:** “Capacity is allocated storage; size is the number of logical list elements. Collections.copy replaces existing destination elements and requires enough size, not merely reserved capacity. I would use a new ArrayList constructed from the source when I want an independent list, or deliberately create destination slots when replacement is the goal. A list copy is shallow: mutable payload objects remain shared unless copied separately. Tests should distinguish an empty preallocated list from one containing placeholder elements. This distinction matters in batch assembly where a mistaken copy can abort a request before any output is constructed. Choosing the operation by its intended contract is clearer than padding a list merely to silence an exception.”

**Example:** Contextual: `new ArrayList<String>(10)` has size zero; it is not a ten-slot destination for Collections.copy.

**Deep dive / verification:** Copying n entries takes linear traversal work; the destination must support set. Independence of list structure does not imply payload independence.

**Follow-ups:** Does copy append? No; use addAll when appending is intended.

**Primary reference:** [Specified API or language contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html).

---

**6. A checkedList wrapper accepts reads of a preexisting wrong-type value. Does wrapping sanitize old data?**

**Say aloud:** “A checked collection adds runtime type checks at insertion through that view. It does not inspect and repair historical contents, and another alias to the backing collection can still bypass the wrapper. I would validate or rebuild untrusted legacy contents first, then prevent mutation through unchecked aliases. Parameterized types remain the normal compile-time protection; checked views are useful at legacy boundaries where raw types can leak in. Tests should separately cover a bad insertion through the view and a bad value inserted before wrapping. This does not establish deep object validity: an object of the right class can still contain invalid fields. Ownership and business validation remain separate concerns.”

**Example:** Contextual: `Collections.checkedList(backing, String.class)` checks future insertions through that returned list.

**Deep dive / verification:** Wrapper checks add per-insertion type checks; an explicit cleanup scan is O(n). Null handling follows the backing collection and checked-view contract.

**Follow-ups:** Can a raw alias still corrupt the list? Yes; restrict access to the backing list.

**Primary reference:** [Specified API or language contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html).

---

**7. A test reads a ByteArrayInputStream after close and passes. Does it prove the parser respects resource lifetime?**

**Say aloud:** “Close behavior belongs to the concrete resource contract. ByteArrayInputStream has no external resource to release and closing it has no effect, so a read-after-close test using it cannot detect a file or socket lifetime bug. I would test parser ownership with a purpose-built stream that records closure and rejects later reads, then add an integration test for the real resource where useful. The parser should clearly state whether it owns or borrows its input. Closing a borrowed stream can break a caller that still needs it; failing to close an owned stream can leak resources. A convenient in-memory test double is useful for bytes, but its lifecycle semantics must match the property being tested.”

**Example:** Contextual: close an in-memory byte stream and then read its first byte; that operation remains permitted.

**Deep dive / verification:** In-memory content occupies O(n) storage. Avoid concluding that every InputStream can be reopened or reused after close.

**Follow-ups:** Should every parser close its argument? Only when the API transfers ownership; otherwise the owner closes it.

**Primary reference:** [Specified API or language contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ByteArrayInputStream.html).

---

**8. A parser marks a stream and resets successfully in memory but fails on production input. What capability was assumed?**

**Say aloud:** “Mark records a position for a later reset only when the stream supports that capability under its documented limits. InputStream is an abstraction over many resources; not all implementations support rewinding. I would check the parser contract and either require a suitable buffered stream, retain a bounded lookahead buffer myself, or redesign parsing to proceed forward. Even supported marks may become invalid after the read limit is exceeded. Tests should include an input with markSupported false and a bounded buffering implementation. Buffering everything would hide the issue for small tests while introducing memory risk for large uploads. The decision must include a maximum lookahead and clear behavior when that maximum is exceeded.”

**Example:** Contextual: inspect `input.markSupported()` before relying on mark/reset; a file stream is not a seek API.

**Deep dive / verification:** Bounded lookahead needs O(k) memory for k retained bytes. Mark support alone does not promise unlimited replay.

**Follow-ups:** Can reset recover any earlier position? No; it refers to a supported valid mark, not arbitrary seeking.

**Primary reference:** [Specified API or language contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/InputStream.html).

---

**9. Assigning a String array to Object[] compiles, but storing an Integer fails. Why?**

**Say aloud:** “Java reference arrays are covariant: a String array can be referenced as Object array. The actual array still knows its runtime component type and rejects an incompatible store. I would preserve the most precise type where possible and use generics for APIs that should prevent this mistake at compilation. A List of String is not a subtype of List of Object, precisely because allowing arbitrary Object insertion would be unsafe. Read-only generic interfaces can use bounded wildcards to express permitted access instead. Tests should exercise the store through the widened reference, because construction alone is legal. Catching ArrayStoreException is usually diagnosing an ownership or type-contract mistake, rather than implementing normal business branching.”

**Example:** Contextual: `Object[] values = new String[1]; values[0] = 42;` throws ArrayStoreException.

**Deep dive / verification:** Each store must respect the runtime element type. The type check is not validation of the stored object's business fields.

**Follow-ups:** Do primitive arrays widen to Object[]? No; an int array is an Object but not an Object array.

**Primary reference:** [Specified API or language contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ArrayStoreException.html).

---

**10. Cloning a matrix isolates its outer array but changing one cell affects both copies. Which dimension was copied?**

**Say aloud:** “A Java matrix is an array whose elements reference row arrays. Cloning the outer array copies those row references, so changing a cell still changes shared row storage. I would define whether the operation needs an outer structural copy, a copy of every row, or copies of mutable objects inside rows as well. For an int matrix, cloning each non-null row is sufficient for independent cell values; for object cells it still shares the cell objects. Tests should mutate both an outer row slot and an inner cell to expose the difference. Null rows and ragged shapes are legal array structures, so the copy policy must explicitly preserve or reject them.”

**Example:** Contextual: `int[][] copied = original.clone()` shares rows; replacing copied[0] differs from assigning copied[0][0].

**Deep dive / verification:** Outer cloning costs O(rows); copying all primitive cells costs O(rows + cells). Sharing may be intentional when rows are immutable by ownership.

**Follow-ups:** Is rectangular shape guaranteed? No; each row has its own length and may be null.

**Primary reference:** [Specified API or language contract](https://docs.oracle.com/javase/specs/jls/se21/html/jls-10.html).

---

**11. Count strict inversions without changing input. Why must equal values not count?**

**Say aloud:** “An inversion is a pair of positions i before j whose earlier value is greater. Equal values do not qualify. I would merge-sort a clone and count cross-half inversions while merging sorted halves. When the right value is smaller than the current left value, every remaining left value is larger, so I add the number of remaining left entries. On equality I take the left entry without adding a count. Each inversion belongs either inside one half or across the halves, which gives the recursive proof. I return long because the number of pairs can exceed int. I would compare short exhaustive arrays against a quadratic pair-counting oracle and verify the caller's array remains unchanged.”

**Example:** [3, 1, 1] has two strict inversions, not three.

**Deep dive / verification:** O(n log n) time, O(n) storage plus O(log n) recursion. Null is rejected; empty input has zero inversions. Array indices use an overflow-safe midpoint.

**Follow-ups:** Why long? There can be n(n-1)/2 pairs, exceeding int for moderately large arrays.

---

**12. Find the longest contiguous run of alternating parity. Why compare normalized parity rather than remainders?**

**Say aloud:** “Parity means even or odd, including for negative integers. Java remainder can give minus one for negative odd values, so comparing remainders directly can mistakenly treat negative odd and positive odd as different parities. I would use the low bit to represent parity as zero or one, then extend the current run only when adjacent parity differs. I record the best length while scanning; equal parity restarts a run at the current element. Empty input returns zero and null is rejected. A useful oracle enumerates every interval and checks its adjacent pairs independently. This is a contiguous-run problem, so skipping an inconvenient element would violate the contract even if it created a longer alternating subsequence.”

**Example:** [-3, 5, 2] has best length two; the first two values are both odd.

**Deep dive / verification:** O(n) time, O(1) extra storage, no input mutation. Bitwise parity works at Integer.MIN_VALUE and MAX_VALUE without absolute-value overflow.

**Follow-ups:** Can abs(value) fix negative remainders? It overflows for MIN_VALUE; low-bit normalization avoids that special case.

```java
public final class BoundaryAlgorithms {
    public static long inversions(int[] input) {
        java.util.Objects.requireNonNull(input);
        int[] a = input.clone();
        return count(a, new int[a.length], 0, a.length);
    }
    private static long count(int[] a, int[] tmp, int lo, int hi) {
        if (hi - lo < 2) return 0;
        int mid = lo + (hi - lo) / 2;
        long total = count(a, tmp, lo, mid) + count(a, tmp, mid, hi);
        int i = lo, j = mid, k = lo;
        while (i < mid && j < hi) {
            if (a[i] <= a[j]) tmp[k++] = a[i++];
            else { tmp[k++] = a[j++]; total += mid - i; }
        }
        while (i < mid) tmp[k++] = a[i++];
        while (j < hi) tmp[k++] = a[j++];
        System.arraycopy(tmp, lo, a, lo, hi - lo);
        return total;
    }
    public static int alternatingParity(int[] a) {
        java.util.Objects.requireNonNull(a);
        int run = 0, best = 0;
        for (int i = 0; i < a.length; i++) {
            run = i > 0 && ((a[i] & 1) != (a[i - 1] & 1)) ? run + 1 : 1;
            best = Math.max(best, run);
        }
        return best;
    }
}
```

# Topic coverage and next set

This set covers operation-specific validation and staged constraints, partial failure, padded copies, list size versus capacity, runtime type boundaries, resource-test fidelity, lookahead capabilities, nested array ownership, strict inversion counting and signed parity. Validation does not replace transactional business invariants. Copying storage does not automatically copy payload ownership.

Next set will build on these boundaries with framework request lifetimes and distributed replay contracts, selected after checking the full prior ledger to avoid repeating bulk refresh and circuit recovery scenarios already covered in Sets 4–5.
