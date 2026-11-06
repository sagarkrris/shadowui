**Set 24 · 6 November 2026 — Eligibility, representation and traversal contracts**

Reference assumptions: **Java 21 without preview features**. Primary documentation checked 6 November 2026; no latest-version claim. Q1–Q10 are contextual illustrations, not runnable integrations. Q11–Q12 are runnable exercises tested from the published source. Stable IDs: **S24-Q01–S24-Q12**. Spoken answers target 45–90 seconds.

---

**1. Removing index 1 from a `List<Integer>` deletes the wrong value. Which overload was selected?**

**Say aloud:** “A list supports both positional removal and removal by value. With an int argument, remove selects the index overload; boxing does not override that applicable primitive signature. I would make the intended operation explicit and check its return value. For removing the integer one, Integer.valueOf(1) selects removal by object equality, which removes the first matching occurrence. Removing every occurrence requires a different operation, such as removeIf. This matters when a valid index silently deletes an unrelated identifier rather than throwing an exception. I would test a list whose positions differ from its stored values, repeated values, absent values and invalid positions. The API choice also affects error handling: positional removal can throw for an invalid index, while value removal returns false when nothing matched. Neither operation alone establishes that a business identifier was unique.”

**Example:** `new java.util.ArrayList<>(java.util.List.of(9, 1, 1)).remove(Integer.valueOf(1))` removes the first value 1.

**Deep dive / verification:** ArrayList search and shifting can each be O(n); this is not a constant-time deletion guarantee.

**Follow-ups:** What about remove(1L)? It selects the object overload with a Long, which does not equal an Integer containing one.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html).

---

**2. A subList is retained after its parent is structurally changed. Is it an independent page?**

**Say aloud:** “A subList is a view: it addresses part of the original list rather than owning an independent page of data. Structural modification changes list size or arrangement in ways that can invalidate that view. The List contract says semantics become undefined when the backing list is structurally modified outside the view. I would create a new ArrayList from the selected range when the page must survive later parent edits. That copy owns its element references but still shares mutable element objects, so deeper isolation needs a separate decision. Copying also must happen under the source collection’s valid concurrency protocol. I would test modification through the view, modification through the parent and a copied page. Depending on a particular fail-fast exception is weaker than respecting the view lifetime, because exception detection is not a synchronization mechanism.”

**Example:** var page = new java.util.ArrayList<>(rows.subList(0, 2)); // contextual: rows has at least two entries

**Deep dive / verification:** Copying k references costs O(k) time and storage; retaining a view can retain its backing collection.

**Follow-ups:** Does set change size? No, replacing an element is distinct from structural modification; mutable elements still remain shared.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html).

---

**3. A search finds one duplicate in a sorted array. Can Arrays.binarySearch locate the first duplicate?**

**Say aloud:** “Binary search repeatedly discards a sorted range using comparisons. Arrays.binarySearch returns a matching position when a key exists, but does not promise which duplicate it chooses. I would not scan outward under the assumption that the initial hit is the first. If the requirement is the complete duplicate range, I would compute two boundaries: the first position whose value is at least the target and the first whose value is greater. Their difference is the occurrence count. For an absent value, the library’s negative result encodes an insertion point rather than an ordinary index. Tests should include all-equal arrays, empty arrays, missing targets and extreme integers. Sortedness and the same comparison rule used to sort are preconditions; a fast search cannot repair input that violates its ordering assumptions.”

**Example:** On [2, 2, 2], a successful binarySearch for 2 does not establish index 0.

**Deep dive / verification:** Library binary search is logarithmic; validating sortedness separately costs O(n). Do not subtract comparison operands.

**Follow-ups:** How is absence decoded? insertionPoint = -(result + 1), following the documented encoding.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html).

---

**4. Adding an enum constant changes an EnumSet.range authorization rule. Which ordering did the code trust?**

**Say aloud:** “EnumSet is a specialized set for values of one enum type. Its range factory includes every declared constant between two endpoints, inclusively, using declaration order. That ordering is a source-level arrangement, not a security hierarchy. If READ and ADMIN surround a newly inserted EXPORT constant, an old range expression can silently include EXPORT after recompilation. I would enumerate allowed capabilities explicitly or derive them from an independently reviewed policy, rather than encode permission meaning through ordinal positions. Tests should assert exact allowed membership for each role, including newly introduced permissions and deny-by-default behavior. An explicit set is more verbose but makes additions reviewable. The set is mutable unless protected, and exposing a shared policy set lets callers change authorization for other requests. Return a defensive copy or an appropriate unmodifiable view with controlled backing ownership.”

**Example:** Contextual enum order READ, EXPORT, ADMIN makes range(READ, ADMIN) include EXPORT.

**Deep dive / verification:** EnumSet uses a compact bit-vector representation. Set membership does not perform authorization by itself; validate subject, resource and context at the enforcement boundary.

**Follow-ups:** Is allOf safer? It deliberately includes every constant, so new capabilities also enter automatically; use it only when that is the intended policy.

**Primary reference:** [Java 21 EnumSet](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/EnumSet.html).

---

**5. A DelayQueue has size 5 but poll returns null. Which meaning of available was confused?**

**Say aloud:** “A DelayQueue stores delayed elements, meaning values with an expiration-based eligibility rule. Size includes entries whose delay has not expired, while poll removes only an expired head and otherwise returns null. A nonempty queue therefore does not imply runnable work. I would measure scheduled backlog separately from eligible backlog and define shutdown policy explicitly: wait for deadlines, cancel scheduled entries, or persist them for recovery. This queue is unbounded, so using it alone does not impose a memory or admission limit. I would bound accepted scheduled work outside the queue and ensure cancellation releases the matching obligation exactly once. Tests should control eligibility rather than sleep for precise wall-clock intervals. An iterator also does not promise deadline order, so exporting its traversal as an execution schedule would misrepresent the contract.”

**Example:** Contextual model: five jobs due tomorrow produce size 5 and no immediately eligible poll result.

**Deep dive / verification:** No capacity backpressure is supplied by this queue. Enforce both count and payload-size budgets when accepting work.

**Follow-ups:** Does peek remove an expired job? No; it can expose an unexpired head without making take immediately return.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/DelayQueue.html).

---

**6. Two unpark calls are followed by two parks. Why can the second park block?**

**Say aloud:** “LockSupport associates at most one permit with a thread. Unpark makes that permit available; repeated unparks do not accumulate a count of future wakeups. A park can consume the permit, return for interruption or return spuriously, so waking is not evidence that the business condition became true. I would use a higher-level synchronizer such as a semaphore when counting independent arrivals is the requirement. For a custom synchronizer, a volatile or atomic predicate and a carefully reviewed registration protocol must establish progress, with park only avoiding wasted spinning. Interruption must be handled deliberately because repeatedly parking an interrupted thread can create a busy loop. Verification should inspect the predicate and wakeup protocol under every ordering, including notification before waiting. Timing-only tests cannot prove the absence of a missed signal.”

**Example:** Contextual sequence: unpark(t), unpark(t), then t parks twice; only one stored permit exists.

**Deep dive / verification:** This is a per-thread wakeup primitive, not a durable queue or counted notification protocol.

**Follow-ups:** Does park clear interruption? No; the protocol must decide whether to propagate, clear or respond to that status.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/LockSupport.html).

---

**7. A bounded queue caller checks remainingCapacity and then adds. Why can add still fail?**

**Say aloud:** “Remaining capacity is an observation of the queue at one moment, not a reservation. Another producer can fill the space between checking and adding. I would make admission depend on the insertion operation itself: offer returns whether insertion succeeded, while a timed offer can wait within an explicitly chosen budget. Add may throw when a capacity-restricted queue is full, so using it after a separate check does not remove the failure path. I would define rejection handling before accepting ownership of the job, and avoid holding unrelated locks while waiting for space. Tests should coordinate two producers competing for one slot and verify that the loser retains responsibility for its job. Capacity counts elements, not bytes, and a per-process bound does not establish a service-wide resource limit.”

**Example:** Contextual Java: if (!queue.offer(job)) reject(job); rejection must not silently discard accepted work.

**Deep dive / verification:** Admission is atomic at insertion; total memory still depends on element size and outstanding work outside the queue.

**Follow-ups:** When use put? Only when indefinite waiting fits the lifecycle and interruption contract; request paths usually need a bound.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/BlockingQueue.html).

---

**8. A PriorityQueue iterator prints urgent jobs after ordinary jobs. Is the heap corrupt?**

**Say aloud:** “A priority queue is a heap, a structure that efficiently exposes a least element under its comparator. It does not keep every position in fully sorted order, and its iterator does not promise priority order. I would consume repeated polls when removal is intended, or copy the queue and poll the copy for an ordered diagnostic view. That copy requires a valid source concurrency protocol and still shares element references. Mutable priority fields are another hazard: changing an enqueued object does not automatically repair heap ordering. I would remove and reinsert under exclusive ownership or publish immutable queue entries with an explicit stale-entry policy. Tests should assert the sequence of removals rather than the iterator’s incidental layout. Equal priorities also need a secondary sequence if deterministic FIFO ties are part of the product contract.”

**Example:** Contextual model: iterate for inspection only; poll a private copied heap to obtain priority order.

**Deep dive / verification:** Repeated removal of n entries costs O(n log n); copying requires O(n) storage. PriorityQueue itself is not thread safe.

**Follow-ups:** Does a comparator imply stable ties? No; include a stable tie key when that ordering is required.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/PriorityQueue.html).

---

**9. A search filter uses Stream.ofNullable on a null collection and returns no matches. Was malformed input validated?**

**Say aloud:** “OfNullable creates a stream with one element when its argument is present and an empty stream when it is null. That is an adaptation rule, not a validation decision. If a required filter collection is missing, converting it to an empty stream can erase an error and make the request look like a valid no-match search. I would define whether null, an empty list and a list containing null elements have distinct meanings, then validate at the boundary before streaming. A stream containing a collection is also not yet a stream of its members; flattening requires a separate operation. Tests should cover each state and verify the actual authorization and query semantics of an empty filter. Concise pipelines help only when they preserve those domain distinctions; otherwise explicit validation is easier to audit.”

**Example:** Contextual Java: Stream.ofNullable(filters) has zero or one collection elements, not one element per filter.

**Deep dive / verification:** Container adaptation is constant work; flattening and processing n members generally adds O(n) traversal.

**Follow-ups:** Does ofNullable remove nulls inside a list? No; validate or filter members deliberately according to the input contract.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html).

---

**10. An import removes leading and trailing whitespace before checking a signature. Why can harmless cleanup invalidate evidence?**

**Say aloud:** “A signature authenticates a specified byte sequence or a precisely defined canonical representation. Trimming text before verification changes the message, so the system may verify different evidence from the bytes it received. I would identify the protocol’s signed representation, retain the original bounded bytes and verify exactly that representation before interpreting business fields. Canonicalization means converting equivalent representations into one prescribed form; it is safe only when both signer and verifier follow the same documented rules. Parsing and display cleanup can occur later under separate rules, without replacing the authenticated record. Tests should include trailing spaces, line endings, non-ASCII whitespace and equivalent-looking encodings. Signature verification also does not establish authorization or freshness. A valid old signed command can still be a replay unless the protocol checks its intended audience and replay policy.”

**Example:** Contextual model: bytes for "approve " differ from bytes for "approve"; preserve the signed input.

**Deep dive / verification:** Verification cost depends on message length and algorithm; bound input before retaining or parsing it.

**Follow-ups:** Can canonical JSON solve this automatically? Only with an agreed canonicalization specification and matching implementations.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/Signature.html).

---

**11. Return all leaders in an array: values strictly larger than every value to their right. Can this be linear?**

**Say aloud:** “A leader is defined here by a strict comparison with every later value. The rightmost value is always a leader because there are no later values. I would scan from right to left, retaining the greatest value seen in that suffix. A value is selected only when it exceeds that maximum, after which the maximum is updated. Equality must not select an earlier duplicate, which is a common boundary error. The collected result is reversed to restore original order. I would use a separate boolean for whether a maximum exists rather than a numeric sentinel that collides with Integer.MIN_VALUE. This preserves the caller’s array and handles negative values naturally. Verification can compare every candidate against all later positions using a slow independent oracle on exhaustive small arrays, including empty and all-equal inputs.”

**Example:** [7, 4, 4, 2] returns [7, 4, 2], selecting only the later 4.

```java
public class Leaders {
 public static int[] find(int[] a) {
  java.util.Objects.requireNonNull(a);
  int[] out = new int[a.length]; int count = 0, max = 0;
  boolean seen = false;
  for (int i = a.length - 1; i >= 0; i--) {
   if (!seen || a[i] > max) { out[count++] = a[i]; max = a[i]; seen = true; }
  }
  int[] result = new int[count];
  for (int i = 0; i < count; i++) result[i] = out[count - 1 - i];
  return result;
 }
}
```

**Deep dive / verification:** O(n) time and O(n) worst-case output storage; no input mutation. Null is rejected; empty returns an empty array.

**Follow-ups:** What if leaders use greater-or-equal? Change the selection comparison and duplicate expectations; that is a different contract.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html).

---

**12. Find the longest common prefix of several strings. What does the empty collection mean?**

**Say aloud:** “A common prefix is a sequence at the start of every input string. I would explicitly define this exercise over Java UTF-16 code units, rather than user-perceived characters, and return an empty string for an empty collection. Starting with the first string’s length, each later string can only shorten the candidate prefix. We compare up to that current limit and retain the first mismatch position. A null collection or null member is rejected, even if an earlier empty string already proves the output empty; validation should not depend on input order. The algorithm does not mutate its input. Tests should include one string, repeated strings, an empty member and a mismatch at the first position. If the output is displayed as human text, splitting a surrogate pair may be unacceptable, and a code-point or grapheme-based contract should replace this exercise.”

**Example:** ["transmit", "transfer", "transit"] returns "trans"; [] returns "".

```java
public class CommonPrefix {
 public static String find(String[] words) {
  java.util.Objects.requireNonNull(words);
  for (String word : words) java.util.Objects.requireNonNull(word);
  if (words.length == 0) return "";
  int limit = words[0].length();
  for (int i = 1; i < words.length && limit > 0; i++) {
   limit = Math.min(limit, words[i].length());
   int j = 0;
   while (j < limit && words[0].charAt(j) == words[i].charAt(j)) j++;
   limit = j;
  }
  return words[0].substring(0, limit);
 }
}
```

**Deep dive / verification:** O(S) comparison work for total input code units S, plus O(k) member validation; output O(p) for prefix length p.

**Follow-ups:** Does case-insensitive matching work by lowercasing? Only after specifying locale, Unicode behavior and whether returned text preserves original spelling.

**Primary reference:** [Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html).

# Topic coverage and next set

Coverage: collection overloads and views, binary search contracts, enum policy membership, delayed eligibility, wakeup permits, atomic admission, heap traversal, validation state, signed representations, suffix invariants and UTF-16 prefix coding. These focus on new decisions rather than repeating prior prompts.

Next set will build on explicit contracts with framework request validation, distributed recovery evidence and multi-stage asynchronous cleanup.
