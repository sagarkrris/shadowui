**Set 29 · 13 November 2026 — Construction, comparison and numeric boundaries**

Reference assumptions: **Java 21 without preview features**. Primary API references checked 13 November 2026, not latest-version claims. Stable IDs: **S29-Q01–S29-Q12**. Q1–Q10 are contextual teaching scenarios; Q11–Q12 compile in the shared runnable class below. Examples are original, not personal experience. Spoken answers target 45–90 seconds.

---

**1. Computing a permission intersection changes the original BitSet. Where should ownership change?**

**Say aloud:** “An intersection contains only permissions present in both sets. BitSet.and updates its receiver rather than returning an independent result. I would clone the request-owned permission set before intersecting it with the policy snapshot, and prevent concurrent changes to that snapshot. Otherwise a read-like authorization calculation can permanently remove permissions from shared state and influence later requests. A clone isolates the bits at the time of copying; copying while another thread writes is not a synchronization protocol. For shared policy I prefer immutable published snapshots or a lock covering the copy and update. Tests should evaluate two different policies in succession and confirm that calculating the first result has not altered the input for the second. This is an ownership problem even in a single-threaded program.”

**Example:** BitSet result = (BitSet) granted.clone(); result.and(allowed);

**Deep dive / verification:** Work and storage depend on represented bit ranges; bound permission indices before allocation. Intersection does not validate tenant or policy freshness.

**Follow-ups:** Does clone make subsequent shared writes safe? No; access to mutable inputs still requires coordination.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/BitSet.html).

---

**2. Arrays.setAll fails halfway through generation. Can the old array still be published?**

**Say aloud:** “A generator computes one element from its index. Arrays.setAll writes those generated values into existing storage, and its exception contract leaves the array in an indeterminate state if generation fails. I would create a separate candidate array, fill it completely, then publish it only after success. This keeps the previously published configuration intact when one generated entry is invalid. The generator should avoid external side effects because discarding the array cannot undo those effects. For concurrent readers, publication also needs visibility, for example through a volatile reference to an otherwise unmodified array. Tests should deliberately throw from the generator and assert that the published reference still identifies the previous complete configuration, rather than depend on a particular partially written prefix.”

**Example:** Contextual: allocate candidate; Arrays.setAll(candidate, i -> buildRoute(i)); publish only after return.

**Deep dive / verification:** O(n) generated entries plus generator cost; O(n) extra storage for replacement. Atomic publication is separate from successful construction.

**Follow-ups:** Can parallelSetAll improve failure atomicity? No; parallel generation still does not promise rollback.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html).

---

**3. Arrays.mismatch returns the shorter length for two matching prefixes. Is that an index into both arrays?**

**Say aloud:** “A mismatch identifies the first difference, which can be that one array ends while the other continues. If all shared positions match but lengths differ, the returned index is the shorter length, so dereferencing both arrays at that index is invalid. I would first distinguish the equal result, then check whether the index lies inside both arrays before describing a value difference. This makes a diagnostic useful for truncated payloads as well as changed bytes. Tests need equal arrays, empty versus nonempty, strict prefixes and an interior difference. For authenticated data comparisons I would use a mechanism with the security properties required by the protocol; a diagnostic first-difference operation is not a promise of constant-time comparison.”

**Example:** Arrays.mismatch(new byte[]{4}, new byte[]{4, 8}) returns 1; equal arrays return -1.

**Deep dive / verification:** Worst-case linear comparison work. Range overloads report relative indices, so document the coordinate system.

**Follow-ups:** What does -1 mean? Same length and equal corresponding elements for the selected ranges.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html).

---

**4. Binary search sometimes misses an entry in an unsorted configuration array. Should the caller retry?**

**Say aloud:** “Binary search discards half of the candidate positions using sorted order. Without that precondition the result is undefined by the API, so retries do not repair the search. I would either preserve sorted order at construction or choose a lookup structure matching the update workload. Sorting a private copy is reasonable for a batch snapshot but changes position meanings; preserve an explicit association if callers need original positions. Tests should validate the construction invariant and compare searches against a linear oracle over sorted duplicate-containing data. A successful lookup on one unsorted example proves nothing. The production decision includes update cost and ownership, not just the logarithmic comparison count of a search on an already sorted array.”

**Example:** Contextual: int[] sorted = input.clone(); Arrays.sort(sorted); int found = Arrays.binarySearch(sorted, target);

**Deep dive / verification:** Search O(log n); preparation O(n log n) sorting and O(n) copied storage. Duplicate matches need not be the first.

**Follow-ups:** Does a negative result directly give the insertion index? Decode it as -result - 1.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html).

---

**5. Objects.compare accepts two nulls but throws for null versus a value. Is its comparator null-safe?**

**Say aloud:** “A comparator defines an ordering between two values. Objects.compare returns zero when its arguments are the identical reference; otherwise it delegates to the supplied comparator. Two nulls can therefore pass without exercising the comparator at all. I would define null placement explicitly with Comparator.nullsFirst or nullsLast if null is valid, or reject null at the input boundary when it indicates missing required data. Tests must include null on each side and nonidentical equal values. A shortcut observed with identical inputs does not establish a general comparator contract. For a sorted collection I would also ensure that the chosen ordering has the intended relationship to equality, since comparison zero may control whether a new key is retained.”

**Example:** Objects.compare(null, "a", Comparator.nullsFirst(Comparator.naturalOrder())) is negative.

**Deep dive / verification:** One identity check plus delegated comparison cost. Null placement is a domain choice, not automatically missing-data validation.

**Follow-ups:** Do two equal but separate objects skip comparison? No; the shortcut uses reference identity.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Objects.html).

---

**6. A fallback supplier returns null from requireNonNullElseGet. Why does the helper throw?**

**Say aloud:** “A fallback supplier is code invoked to produce an alternative value when the primary value is null. Objects.requireNonNullElseGet promises a nonnull result, so a null fallback result violates its contract. I would decide whether absence is valid before selecting this helper. If both sources may legitimately be absent, return an Optional or an explicitly nullable result instead. If absence is a configuration error, fail with useful context at the owning boundary. The supplier is lazy, but laziness does not make it a cache or guarantee one invocation across separate calls. Tests should distinguish a present primary value, an absent primary with a good fallback, and a fallback that returns null or throws. External effects in the fallback need their own failure policy.”

**Example:** Objects.requireNonNullElseGet(null, () -> null) throws NullPointerException.

**Deep dive / verification:** Constant helper overhead plus supplier work when needed. Repeated calls may repeat expensive fallback work.

**Follow-ups:** Is a null supplier always rejected? A nonnull primary is returned without needing the supplier.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Objects.html).

---

**7. Casting a long row count to int produces a negative page count. How should the boundary fail?**

**Say aloud:** “Narrowing converts a wider numeric representation into a smaller one. A Java long-to-int cast can discard high bits, so it does not validate whether the original count fits. I would keep totals as long where possible and use Math.toIntExact only at an API boundary that truly requires int. It throws when the value is outside the int range. That is still only a representation check: a negative count fits in int but is invalid for pagination. I would validate the domain first and impose a practical maximum before allocation. Tests should cover both int endpoints, one value beyond each, and valid but operationally excessive sizes. Silently clamping a count would change the meaning of the response and hide missing data.”

**Example:** Math.toIntExact(2147483648L) throws ArithmeticException; casting yields a negative int.

**Deep dive / verification:** O(1) check; no allocation budget or nonnegativity guarantee. Use an understandable boundary error rather than exposing an internal stack trace.

**Follow-ups:** Does widening later recover the original number? No; discarded information is already lost.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html).

---

**8. A pixel-buffer allocation uses width times height and gets a tiny array. What must be checked before allocation?**

**Say aloud:** “Integer overflow occurs when a mathematical result does not fit the chosen numeric type. For attacker-controlled dimensions I would validate positivity and configured dimension limits, compute the product with Math.multiplyExact, and enforce a total byte budget before allocating. If each pixel consumes four bytes, both the pixel product and the byte product matter. Exact arithmetic detects overflow but does not make a large representable allocation safe. I would reject the request with a controlled error rather than catch an out-of-memory failure as normal validation. Tests should include zero, negative, multiplication overflow and a product that fits int but exceeds the application budget. Streaming or tiled processing can reduce memory requirements when rejecting large images is unsuitable.”

**Example:** Contextual: int pixels = Math.multiplyExact(width, height); int bytes = Math.multiplyExact(pixels, 4); then check budget.

**Deep dive / verification:** O(1) numeric checks; actual buffer costs O(bytes). Domain limits and resource admission remain separate.

**Follow-ups:** Would long multiplication alone solve it? It extends range but still needs exact conversion and a resource budget.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html).

---

**9. A rounding change turns 2.5 from three into two. Which tie rule changed?**

**Say aloud:** “A tie occurs exactly halfway between two representable integer choices. Math.round and Math.rint implement different rules: round selects the closest integer with ties toward positive infinity, while rint selects a closest integer with ties toward the even integer. I would name the business rounding policy rather than treat these functions as interchangeable. For binary floating point, a decimal-looking input may not be an exact tie, so tests should use exactly representable halves and values near them. Money typically needs decimal arithmetic with an explicit scale and rounding mode. I would also reject unsupported nonfinite values at the boundary. A migration can change stored aggregates, so compare affected records and coordinate readers and writers before recomputing historical results.”

**Example:** Math.round(2.5) is 3L; Math.rint(2.5) is 2.0; Math.round(-2.5) is -2L.

**Deep dive / verification:** Constant work; round returns an integral type whereas rint returns double. Neither defines a currency policy.

**Follow-ups:** Does ties-to-even always round downward? No; 3.5 rounds to 4.0.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html).

---

**10. Byte identifiers sort differently after migrating from an unsigned protocol. Which comparison is appropriate?**

**Say aloud:** “Java byte is signed, meaning its range includes negative values. A protocol octet instead often represents values from zero to 255. Arrays.compare on byte arrays uses signed ordering, while compareUnsigned uses unsigned byte ordering. I would specify the protocol ordering and use the matching comparator consistently in indexes, cursors and tests. Both are lexicographic: the first differing component decides, and a matching shorter prefix sorts first. Changing the comparator can invalidate stored page cursors even though the underlying bytes have not changed. Tests should cross the 127-to-128 boundary, include prefixes and verify old cursor handling. Unsigned byte order is still not a locale-aware text order or automatically the order of a signed multibyte numeric encoding.”

**Example:** Arrays.compareUnsigned(new byte[]{(byte)128}, new byte[]{127}) is positive; signed compare is negative.

**Deep dive / verification:** Worst-case O(minimum length) comparison; no copying. Persistent ordering changes need versioned cursors or coordinated rebuilding.

**Follow-ups:** Does unsigned comparison decode a number? No; it compares octets lexicographically.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html).

---

**11. Delete exactly one element from a binary array to maximize the remaining consecutive ones. Why is all-ones input special?**

**Say aloud:** “A binary array contains only zero and one. I maintain a window containing at most one zero, moving its left edge until that condition holds. Deleting one element from such a window leaves a run of ones of length window size minus one. The subtraction is required even if the window has no zero, because the contract says exactly one deletion. An all-ones array of length five therefore yields four, rather than five. Empty input returns zero by our explicit API convention; invalid nonbinary entries are rejected. Each endpoint moves forward at most n times, making the algorithm linear with constant auxiliary storage. I would compare it against a brute-force oracle that deletes each possible element, including first and last positions, before relying on the sliding-window invariant.”

**Example:** [1, 1, 0, 1] yields 3; [1, 1, 1] yields 2. Runnable implementation below.

**Deep dive / verification:** O(n) time, O(1) extra space; input unchanged. Generalizing to at most one deletion changes the all-ones answer.

**Follow-ups:** Why shrink after two zeros? One deletion cannot remove both, so that window cannot become a single all-ones run.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Objects.html).

---

**12. Count all nondecreasing contiguous subarrays. Why does counting only maximal runs miss most answers?**

**Say aloud:** “A nondecreasing run allows adjacent equal values and never steps downward. For each ending index, I maintain the length of the longest valid suffix. Every shorter suffix ending there is valid, so that length is exactly the number of new subarrays contributed by the position. A downward step resets the suffix length to one. Adding these contributions counts every nonempty contiguous subarray once without listing them. I use long for the sum because n equal entries contribute n times n plus one divided by two, which can exceed int. Empty input yields zero and null is rejected. I would test duplicates, descending input and integer extremes, comparing adjacent values directly rather than subtracting and risking overflow. This solves contiguous ranges, not arbitrary subsequences.”

**Example:** [2, 2, 1] contributes 1 + 2 + 1 = 4. Runnable implementation below.

**Deep dive / verification:** O(n) time and O(1) extra space. For an int-indexed array the maximum total fits long; input remains unchanged.

**Follow-ups:** What changes for strictly increasing ranges? Reset also when adjacent values are equal.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Objects.html).


### Shared runnable coding examples

```java
import java.util.Objects;
public final class ConstructionAlgorithms {
    public static int afterOneDeletion(int[] bits) {
        Objects.requireNonNull(bits);
        int left = 0, zeros = 0, best = 0;
        for (int right = 0; right < bits.length; right++) {
            if (bits[right] != 0 && bits[right] != 1)
                throw new IllegalArgumentException("binary input required");
            if (bits[right] == 0) zeros++;
            while (zeros > 1) if (bits[left++] == 0) zeros--;
            best = Math.max(best, right - left);
        }
        return best;
    }
    public static long nondecreasingRanges(int[] values) {
        Objects.requireNonNull(values);
        long suffix = 0, total = 0;
        for (int i = 0; i < values.length; i++) {
            suffix = i == 0 || values[i] < values[i - 1] ? 1 : suffix + 1;
            total += suffix;
        }
        return total;
    }
}
```

**Topic coverage:** S29-Q01 mutable intersection ownership; Q02 failed construction and publication; Q03 mismatch coordinates; Q04 search preconditions; Q05 comparator delegation; Q06 fallback contract; Q07 exact narrowing; Q08 allocation arithmetic; Q09 tie rules; Q10 unsigned ordering; Q11 exact-deletion window; Q12 counting contiguous ranges. Cumulative coverage: **364 questions across 29 sets**.

**Next set builds on:** framework and distributed contract evolution, distinguishing configuration acceptance from runtime readiness and validating compatibility during staggered rollout. Recheck the ledger before selecting exact scenarios.
