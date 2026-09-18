/** Curated fictional artifacts only. No user log upload or storage is supported. */
export const EXPLAIN_LOG_REVIEWED_AT = "2026-09-18";

export const EXPLAIN_LOGS = [
  {
    slug: "null-profile-stack-trace",
    number: "01",
    kind: "Java stack trace",
    title: "The null profile that looked like a database failure",
    description: "Read a short Java stack trace without mistaking its first visible frame for the root cause.",
    artifact: [
      { text: "java.lang.NullPointerException: Cannot invoke \"Profile.email()\" because \"profile\" is null", meaning: "The JVM observed a null receiver at the call to Profile.email(). It identifies the immediate failure, not why profile became null." },
      { text: "  at com.example.notify.EmailComposer.compose(EmailComposer.java:42)", meaning: "The throw site is line 42 in compose(). Open this exact source revision and inspect how profile arrived there." },
      { text: "  at com.example.notify.NotificationService.sendWelcome(NotificationService.java:88)", meaning: "This caller passed control into the composer. The frame does not prove it created the null value." },
      { text: "  at com.example.web.SignupController.create(SignupController.java:61)", meaning: "The request boundary is visible, but request fields, logs, and the database outcome still need inspection." },
    ],
    proves: "A null Profile receiver reached EmailComposer.compose() on this request, and the exception escaped through the shown synchronous call path.",
    doesNotProve: "It does not prove the database returned null, the client omitted a field, or the notification service is the root cause. It also does not show asynchronous work or an exception that was caught earlier.",
    next: ["Open EmailComposer.java:42 at the deployed commit.", "Add a correlation ID to the request and inspect the preceding structured events.", "Check the contract for Profile lookup: absent result, nullable value, or invariant violation?", "Add a focused test for the missing-profile path before deciding whether to reject, retry, or default."],
    reference: { label: "Java Throwable API", url: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Throwable.html" },
  },
  {
    slug: "slow-orders-query-plan",
    number: "02",
    kind: "PostgreSQL execution plan",
    title: "The query plan that explains a slow orders search",
    description: "Decode a plan node by node before deciding that an index is missing.",
    artifact: [
      { text: "Seq Scan on orders  (cost=0.00..18420.00 rows=412000 width=72)", meaning: "The planner expects a sequential scan of orders and estimates 412,000 output rows. Cost is a planner comparison unit, not milliseconds." },
      { text: "  Filter: ((tenant_id = $1) AND (status = 'COMPLETED'::text))", meaning: "The filter is applied during the scan. This line alone does not show how many rows were removed or whether an index exists." },
      { text: "  Rows Removed by Filter: 381000", meaning: "With EXPLAIN ANALYZE, this indicates rows visited but rejected at this node for this execution. It is evidence of work, not automatically evidence that an index would win." },
      { text: "Planning Time: 0.412 ms", meaning: "Planning was small in this sampled execution. Do not conflate it with execution time." },
      { text: "Execution Time: 286.734 ms", meaning: "This sampled statement completed in about 287 ms under the test conditions. Compare workload, cache state, parameters, and concurrency before generalizing." },
    ],
    proves: "For this execution, PostgreSQL chose a sequential scan, applied the displayed filter, and spent the reported execution time inside the server.",
    doesNotProve: "It does not prove an index is absent or would be faster, that the result is slow for users end-to-end, or that this parameter distribution matches production traffic.",
    next: ["Compare estimated and actual rows for every relevant node.", "Capture the exact parameter shape and realistic data distribution in a safe environment.", "Inspect existing indexes and their selectivity before proposing a new one.", "Measure read and write cost after a candidate change; an index changes both."],
    reference: { label: "PostgreSQL: Using EXPLAIN", url: "https://www.postgresql.org/docs/current/using-explain.html" },
  },
  {
    slug: "blocked-pool-thread-dump",
    number: "03",
    kind: "Java thread dump",
    title: "The pool threads waiting on one monitor",
    description: "A BLOCKED thread is a precise clue about a monitor—not a complete CPU diagnosis.",
    artifact: [
      { text: "\"orders-worker-17\" #71 prio=5 os_prio=0 cpu=17.22ms elapsed=89.41s tid=0x... nid=0x... waiting for monitor entry", meaning: "This sampled Java thread was waiting to enter a monitor. Its small accumulated CPU time is not a system-wide CPU conclusion." },
      { text: "   java.lang.Thread.State: BLOCKED (on object monitor)", meaning: "BLOCKED specifically means waiting for a monitor lock in the Java thread-state model; it is distinct from WAITING and TIMED_WAITING." },
      { text: "    at com.example.pricing.TaxTable.lookup(TaxTable.java:57)", meaning: "The thread was blocked while trying to reach lookup(). Inspect this line for synchronized methods or blocks and the work performed while holding the monitor." },
      { text: "    - waiting to lock <0x000000076b4a9c90> (a com.example.pricing.TaxTable)", meaning: "The contested object is this TaxTable instance in this JVM. It does not identify the lock holder in this excerpt." },
    ],
    proves: "At capture time, this worker could not enter the monitor associated with one TaxTable instance.",
    doesNotProve: "It does not prove a deadlock, identify the holder, show lock duration, or prove the monitor is the largest latency contributor. One dump is a point-in-time sample.",
    next: ["Take several dumps during the incident and find the owner of the same monitor.", "Measure time spent blocked and the number of affected workers.", "Inspect the synchronized region for I/O, database calls, or large loops.", "Make a narrow change only after preserving the object’s thread-safety invariant."],
    reference: { label: "Java Thread.State API", url: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.State.html" },
  },
  {
    slug: "retrying-http-exchange",
    number: "04",
    kind: "HTTP exchange",
    title: "The timeout response that made a retry unsafe",
    description: "Separate an unknown outcome from a failed write when reading an HTTP exchange.",
    artifact: [
      { text: "POST /v1/orders HTTP/1.1", meaning: "The client attempted an order-creation request. HTTP method choice alone does not make the operation safe to repeat." },
      { text: "Idempotency-Key: order-7f3c", meaning: "The client supplied a key that can support replay safety—but only if the server persists and scopes it correctly." },
      { text: "Content-Length: 184", meaning: "A request body was sent. It says nothing about whether the server committed the command." },
      { text: "client error: context deadline exceeded (Client.Timeout exceeded while awaiting headers)", meaning: "The client did not receive response headers before its deadline. The server may have failed before processing, may still be processing, or may have committed successfully." },
    ],
    proves: "The client timed out while awaiting response headers for a request carrying an idempotency key.",
    doesNotProve: "It does not prove the server received, rejected, or failed the request. It does not prove a retry is safe unless the server's idempotency contract is verified.",
    next: ["Search server logs and durable command records using the idempotency key, never payment details.", "Inspect the server's duplicate-key behavior for matching and mismatched request fingerprints.", "Check retry count, deadline budget, and whether another layer retried too.", "If outcome remains unknown, use a status lookup or reconciliation flow instead of creating a new command."],
    reference: { label: "RFC 9110: HTTP Semantics", url: "https://www.rfc-editor.org/rfc/rfc9110.html" },
  },
];

export function explainLog(slug) { return EXPLAIN_LOGS.find((item) => item.slug === String(slug || "").toLowerCase()) || null; }
