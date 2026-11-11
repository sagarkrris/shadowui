**Set 27 · 11 November 2026 — State, admission and interpretation**

Reference assumptions: **Java 21 without preview features**. Primary APIs checked 11 November 2026; no latest-version claim. Q1–Q10 are contextual illustrations, not complete integrations. Q11–Q12 share the standalone Java class below, tested from this source. Stable IDs: **S27-Q01–S27-Q12**. Examples are original; spoken answers target 45–90 seconds.

---

**1. A cached Matcher mixes two requests while its Pattern is shared safely. Which object owns matching state?**

**Say aloud:** “A Pattern is a compiled regular expression; a Matcher is a mutable cursor over one input. Sharing the immutable pattern is useful, but sharing a matcher lets requests overwrite its input, match positions and captured groups. I would cache only the pattern and create a matcher per operation. Synchronizing individual calls is insufficient if reset, find and group must form one operation; locking the entire sequence serializes requests. A test should deliberately interleave two inputs and check captured values, rather than merely check that no exception occurs. This is an ownership error even when the expression itself is correct. For large inputs I would also bound input size and review expression behavior separately; thread confinement does not make expensive matching cheap.”

**Example:** Contextual: `static final Pattern CODE = Pattern.compile("[A-Z]+")`; each request uses `CODE.matcher(input)`.

**Deep dive / verification:** Matching cost depends on the expression and input; no general linear-time promise. Per-call matcher allocation trades small object churn for clear ownership. Test empty input and concurrent distinct captures.

**Follow-ups:** Can match results escape? Capture an immutable result or copied values before advancing the matcher; its current state changes.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/regex/Pattern.html).

---

**2. A validator accepts junk surrounding a valid code because find succeeds. What boundary should validation check?**

**Say aloud:** “A search asks whether some substring fits a pattern; validation asks whether the entire allowed input fits. Matcher.find implements the first question, while matches checks the entire matcher region. For a whole-field validator I would create a fresh matcher over the complete string and use matches, after enforcing length and null policy. If code narrows the region first, matches validates only that region, so the caller must own that boundary too. I would test a valid value surrounded by punctuation, a newline and an empty string. Adding anchors without understanding their flags is less clear than choosing the operation that states the intent. This distinction matters for allowlists where accepting one good substring inside a bad identifier would broaden access unexpectedly.”

**Example:** `Pattern.compile("[A-Z]{3}").matcher("!ABC!").find()` is true; matches is false.

**Deep dive / verification:** Region size and expression determine work. A successful syntax check does not authorize access to the referenced object. Verify null handling before invoking the matcher.

**Follow-ups:** Does matches search for a later start? No; it requires the whole current region to match.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/regex/Matcher.html).

---

**3. A SynchronousQueue reports size zero while producers are blocked. Does that mean there is no overload?**

**Say aloud:** “A SynchronousQueue is a rendezvous: a producer transfers an item directly to a waiting consumer, without storing a queue of items. Its size therefore does not measure waiting demand. A blocked producer can retain its payload and request resources even though collection metrics show zero. I would measure active and waiting operations, use timed admission where appropriate, and bound the number of producers at the service boundary. When used by an executor, this queue also changes when new workers or rejection are needed, so I would review the executor configuration together with it. A deterministic test should attempt an offer without a consumer, then arrange a paired transfer. Zero internal capacity is a coordination choice, not evidence of zero memory pressure or unlimited safe throughput.”

**Example:** `new SynchronousQueue<String>().offer("job")` is false with no waiting consumer.

**Deep dive / verification:** Waiting time depends on a partner. Timed admission needs a clear rejected-result policy. Interruption and shutdown must release waiting callers; fairness is separate from capacity.

**Follow-ups:** Would a queue of capacity one behave identically? No; it can retain one item without a matching consumer.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/SynchronousQueue.html).

---

**4. A PriorityBlockingQueue constructed with 100 accepts thousands of jobs. Where was the limit?**

**Say aloud:** “Initial capacity is storage sizing, not an admission limit. PriorityBlockingQueue is logically unbounded, so offer normally accepts more work until resources become a problem. I would place a bounded admission protocol around the workload or choose a queue with the needed capacity semantics. Priority chooses which eligible job is removed next; it does not guarantee that low-priority work ever runs under sustained higher-priority demand. Tests should submit more than the initial capacity and verify the actual policy at the service boundary. I would not infer sorted iteration from ordered removal either: a heap maintains enough order to select its next element, not a fully sorted representation. Operational metrics should include retained payload size and oldest waiting age, not just job count.”

**Example:** `new PriorityBlockingQueue<Integer>(100)` does not impose a maximum of 100 elements.

**Deep dive / verification:** Typical heap insertion/removal is O(log n); payload retention grows with admitted work. Immutable ordering keys avoid invalidating heap order; define equal-priority handling explicitly.

**Follow-ups:** Can we inspect jobs in priority order using its iterator? No guarantee; use a sorted snapshot or controlled removals.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/PriorityBlockingQueue.html).

---

**5. Two equal Optional values are used as locks. Why is value equality not a synchronization identity?**

**Say aloud:** “Optional describes presence or absence of a value, not ownership of a monitor. It is a value-based class: equal instances should be interchangeable, and its API explicitly discourages synchronization on instances. Two wrappers describing the same account need not be the same object, so locking them can leave the critical section unprotected. I would use a private stable lock for a local invariant, or a domain concurrency mechanism for cross-process updates. Choosing the lock requires defining which operations share the invariant and how long that identity lives. A test that happens to reuse one wrapper cannot prove the design safe. The remedy is to remove dependence on wrapper identity, rather than cache wrappers hoping that allocation behavior stays unchanged.”

**Example:** Contextual: `synchronized (Optional.of(accountId))` does not coordinate all updates to that account.

**Deep dive / verification:** A lock protects only cooperating accesses using that lock. A JVM monitor does not coordinate database writes made by another replica. Wrapper operations do not promise a stable identity.

**Follow-ups:** Is Optional.empty a documented singleton lock? No; do not rely on reference identity for it.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html).

---

**6. A UTF-8 properties file loads corrupted names through InputStream. Which encoding contract was selected?**

**Say aloud:** “Bytes do not carry an automatic agreement about character encoding. Properties.load with an InputStream uses ISO-8859-1 rules, whereas load with a Reader consumes characters decoded by that reader. For a file whose contract is UTF-8, I would create an explicit UTF-8 reader and pass it to load, while preserving the properties format escaping rules. I would test non-ASCII text, escapes and malformed input under the chosen decoder policy. Switching overloads can change historical file interpretation, so migration needs representative persisted files and a declared encoding. I would also close the reader in the owning layer. A successful parse only proves that some key-value text was read; it does not prove that its characters or required configuration values are correct.”

**Example:** Contextual: `try (var reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) { props.load(reader); }`.

**Deep dive / verification:** Text processing and retained configuration scale with file size. Bound external files. Validate required values after parsing; decoding and semantic validation are different boundaries.

**Follow-ups:** Does Java always use the platform default here? No; the InputStream properties overload has its own specified encoding.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Properties.html).

---

**7. A French resource bundle returns an English label without throwing. Did translation coverage pass?**

**Say aloud:** “A resource bundle can resolve missing keys through its parent bundle, so successful lookup does not prove that the requested locale supplied a translation. This fallback is useful for availability but can hide incomplete releases. I would keep a base bundle for safe rendering and separately validate required locale keys against the actual translation source files. The product must decide whether fallback is acceptable for ordinary labels and whether legally required text needs a stricter release check. Tests should include a deliberately absent localized key and an unsupported locale, not only known translated strings. I would use stable keys in code rather than compare displayed labels. Language selection and authorization must remain separate because a fallback string is presentation data, not a business identifier.”

**Example:** Contextual: base bundle has `confirm=Confirm`; a French bundle omits confirm, so parent lookup can still return it.

**Deep dive / verification:** Bundle caching and parent search are library behavior; completeness is an application policy. Validate formatted placeholders as well as key presence to avoid runtime formatting failures.

**Follow-ups:** Should all missing translations crash requests? That is a product decision; fail release checks where required while retaining a deliberate runtime fallback.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ResourceBundle.html).

---

**8. Updating the original array after constructing AtomicReferenceArray has no effect. What was copied?**

**Say aloud:** “AtomicReferenceArray constructed from an array copies its element references into independent array storage. It does not remain a live wrapper over that array, and it does not deep-copy the objects referenced by its elements. Replacing an original slot therefore does not update the atomic array, while mutating a shared element object can still affect what readers observe. I would make element ownership explicit, preferably publishing immutable values and replacing references atomically when they change. A useful test separates slot replacement from mutation of the referenced object. Merely choosing an atomic container does not make every field of its payload thread-safe. It also does not make a multi-element snapshot atomic; readers can observe elements from different update moments unless a broader protocol supplies consistency.”

**Example:** Contextual: after `var atomic = new AtomicReferenceArray<>(source)`, assigning `source[0] = other` does not replace atomic slot zero.

**Deep dive / verification:** Construction copies O(n) references; indexed operations concern individual slots. Immutable aggregate replacement is an alternative when coherent multi-field snapshots matter, at copying cost.

**Follow-ups:** Is this a deep copy? No; the referenced objects are shared unless the application copies them.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicReferenceArray.html).

---

**9. Collections.disjoint disagrees when one set uses case-insensitive ordering. Which equality owns the question?**

**Say aloud:** “Disjoint asks whether collections have an element in common, but the participating collections must agree on what equality means. A sorted set can use a comparator that treats two strings as equivalent even when String.equals does not. Mixing that set with an ordinary collection can make a membership-based algorithm unsuitable; the API warns about incompatible equality tests. I would define the domain equivalence first and normalize both collections into a representation with that same rule, or implement an explicitly named comparison policy. For machine identifiers, normalization also needs a fixed locale and protocol rules. A test should include case variants and swap argument roles. I would not fix an inconsistent domain contract by depending on which collection the current implementation happens to iterate.”

**Example:** Contextual: a case-insensitive TreeSet containing "ABC" and an ordinary set containing "abc" use different membership equivalence.

**Deep dive / verification:** Normalization costs depend on text size; hash-based comparison is expected linear in element count after normalization. Keep original labels separately when display spelling matters.

**Follow-ups:** Can sorting both lists fix this automatically? Only if the chosen comparator actually expresses the same intended equivalence for both.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html).

---

**10. Malformed UTF-8 becomes a replacement character and passes identifier validation. What information was discarded?**

**Say aloud:** “Decoding turns bytes into characters; malformed input handling decides what happens when bytes are not valid in the chosen encoding. Replacement can turn different invalid byte sequences into the same visible character, hiding corruption before later validation runs. For a strict identifier protocol I would configure a CharsetDecoder to report malformed and unmappable input, reject decoding failure at the boundary, then validate the resulting characters. For human-readable best-effort logs a replacement policy may be deliberate, but that is a different contract. I would test malformed bytes, a genuine replacement character encoded correctly, and valid non-ASCII input. Rejecting malformed encoding alone does not define acceptable names, normalization or authorization; each remains an explicit subsequent step.”

**Example:** Contextual: `UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)` makes rejection policy explicit.

**Deep dive / verification:** Decoding costs scale with input and output; bound both. Decoder instances carry state and must have clear ownership. Replacement may be suitable for presentation but loses original-byte distinctions.

**Follow-ups:** Can we reject every replacement character afterward? That also rejects a legitimately encoded character and cannot reconstruct discarded bytes.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/charset/CharsetDecoder.html).

---

**11. Return the first integer occurring exactly once. Why does discovering a value once not establish uniqueness?**

**Say aloud:** “Unique here means a total frequency of one, and first means earliest input position. I cannot return on the first encounter because a later element may repeat it. I count every value in a hash map, then scan the original array again and return the first value with count one. This separates the evidence for uniqueness from the ordering decision. I use OptionalInt for absence because every int, including minus one, can be a valid result. Empty input returns empty, null is rejected and the input is preserved. I would compare against a simple oracle that counts each candidate by scanning the whole array. A streaming version that must finalize answers before end of input needs a stronger contract; future duplicates can invalidate an early answer.”

**Example:** [8, 3, 8, -1, 3] returns -1 as a present value; [2, 2] has no result.

**Deep dive / verification:** Expected O(n) time with hash-map operations, O(d) space for d distinct values. Frequency cannot exceed the Java array length and fits int. Adversarial key behavior can change generic map performance; these keys are integers.

**Follow-ups:** Can one pass of counting alone return the answer? Not from an unordered map; retain input order or track first positions as well. Two scans keep the implementation clear.

---

**12. Return the earliest longest strictly increasing contiguous run. Why does a subsequence algorithm solve a different problem?**

**Say aloud:** “A contiguous run uses adjacent input positions without skipping. A subsequence may skip values, so it can produce a longer result that violates this requirement. I track the start of the current run and the best start and length. Whenever the next value is no greater than its predecessor, a new run starts there. After each position, I update the best only for a strictly greater length; that preserves the earliest answer on ties. I return a half-open range, whose end is excluded, so empty input has the natural range zero to zero. Comparisons use relational operators rather than subtraction to avoid overflow at extreme values. I would enumerate all contiguous ranges independently and compare both length and tie-breaking with the linear scan.”

**Example:** [1, 4, 2, 3] returns [0, 2), not the noncontiguous subsequence [1, 2, 3]. Equal adjacent values break a strictly increasing run.

**Deep dive / verification:** O(n) time and O(1) extra space. The range is a witness: callers can verify its bounds and adjacent comparisons. Null is rejected and input remains unchanged. Returning indices avoids allocating a copied run.

**Follow-ups:** How does nondecreasing change it? Break only when the next value is smaller; equality then extends the run. Keep the tie rule unchanged.

```java
public final class SequenceContracts {
    public record Range(int start, int end) {}
    public static java.util.OptionalInt firstUnique(int[] values) {
        java.util.Objects.requireNonNull(values);
        var counts = new java.util.HashMap<Integer, Integer>();
        for (int value : values) counts.merge(value, 1, Integer::sum);
        for (int value : values)
            if (counts.get(value) == 1) return java.util.OptionalInt.of(value);
        return java.util.OptionalInt.empty();
    }
    public static Range longestRun(int[] values) {
        java.util.Objects.requireNonNull(values);
        int start = 0, bestStart = 0, bestLength = 0;
        for (int i = 0; i < values.length; i++) {
            if (i > 0 && values[i] <= values[i - 1]) start = i;
            int length = i - start + 1;
            if (length > bestLength) { bestStart = start; bestLength = length; }
        }
        return new Range(bestStart, bestStart + bestLength);
    }
}
```

# Topic coverage and next set

This set covers regex state and validation scope, rendezvous admission, priority capacity, synchronization identity, configuration encoding, translation fallback, atomic slot ownership, equality consistency, strict decoding and two coding witnesses. It builds on earlier ownership and representation lessons through distinct API contracts. Primary references support API behavior; the two algorithms are justified by the counting and run invariants above.

Next set will return to Spring validation boundaries, persistence refresh after bulk operations, and distributed recovery admission. Inspect earlier questions before selecting scenarios; do not repeat this set's decisions.
