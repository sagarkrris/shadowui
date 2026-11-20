# Set 35 — HTTP ingestion and artifact verification

20 November 2026 · S35-Q01–S35-Q12

Assume Java 21 without preview features. These original scenarios extend the guide's Java I/O and service-boundary foundations. Examples are contextual fragments or pseudocode, not runnable courses. Spoken answers support approximately 45–90 seconds of practice; verification notes supply the deeper discussion.

**1. A download future completes normally with a 503 error page. Why did the Java client report success?**

**Say aloud:** “Transport success means an HTTP response arrived; it does not mean the application accepted the request. A status code describes that application outcome. I would classify the status before treating the payload as an artifact, accepting only the statuses our download protocol permits. A 503 body might contain diagnostic HTML, even when the requested resource was a binary archive. I would retain a bounded diagnostic sample, record the status and correlation identifier, and keep the artifact unpublished. Exceptions remain useful for connection and transport failures, but cannot replace status handling. Automatically retrying every non-success status would also be wrong: authentication and invalid requests need different action. My test server would return both a valid artifact and a normal 503 response.”

**Example:**

```text
GET /artifact -> 503 text/html -> classify failure; never rename error.html to artifact.zip.
```

**Deep dive / verification:** Classification is constant work; body handling costs depend on bytes received. Test unexpected redirects, empty error bodies and oversized diagnostics. Do not log credentials or unrestricted response bodies.

**Follow-ups:** Does ofFile validate status? No; predefined body handlers accept bodies independently of status. Select the handler or publication decision explicitly.

**Primary reference:** [Java 21 BodyHandlers](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpResponse.BodyHandlers.html).

---

**2. A streaming response is available, but the download takes another minute. Which completion did the timer measure?**

**Say aloud:** “A response contains headers and a body, but body handlers define when that body becomes available. With an input-stream handler, receiving the response gives me a stream from which bytes can still arrive. It does not prove that the artifact is complete. I would separately measure response availability and complete consumption, then mark success only after reading, verification and publication finish. The component receiving the stream owns closing it on success and failure. Streaming bounds retained memory, but transfers lifecycle and error handling to the consumer. A truncated connection can therefore fail after send has already returned. I would test a server that sends headers immediately, pauses between chunks, and disconnects before the expected payload is complete.”

**Example:**

```text
headers at 40 ms; last body byte at 60 s; verified publication at 61 s.
```

**Deep dive / verification:** With a fixed buffer, memory is O(buffer size), while processing is O(n) bytes. Closing an unread stream can sacrifice connection reuse; correctness and bounded cleanup take priority.

**Follow-ups:** Which latency belongs in a download SLO? The user-visible completed operation, with phase metrics to explain it.

**Primary reference:** [Java 21 HttpResponse](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpResponse.html).

---

**3. Concurrent tenants share an HttpRequest.Builder and occasionally send the wrong authorization header. What should be shared?**

**Say aloud:** “A builder is mutable construction state. An immutable request is the value produced after construction. I would create a request builder inside each operation and attach that operation's identity there. Sharing a builder lets one request overwrite or append state while another is building, so even individually valid credentials can go to the wrong destination. Synchronizing a shared builder is possible, but makes complete reset and ownership much harder to reason about. I would instead share an appropriately configured client and keep request construction local. Reusing a built request is only appropriate when its URI, credentials and body semantics remain valid. I would test interleaved requests for two tenants and assert the headers observed at the receiving endpoints.”

**Example:**

```java
var request = HttpRequest.newBuilder(uri)
    .setHeader("Authorization", operationCredential).GET().build();
```

**Deep dive / verification:** Construction cost grows with request metadata. Test repeated header addition as well as replacement; header appending is not equivalent to setting one authoritative value.

**Follow-ups:** Can copy fix a concurrently mutated template? No; copying still requires safe access to a stable template.

**Primary reference:** [Java 21 HttpRequest.Builder](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpRequest.Builder.html).

---

**4. Every artifact fetch creates and closes its own HttpClient. Why can TLS connection counts grow sharply?**

**Say aloud:** “A connection pool retains reusable connections so later requests can avoid creating another transport session. Java's HTTP client typically owns its pool, and different client instances generally do not share those connections. Creating one client for each download therefore defeats much of that reuse. I would give a client an application or policy-scoped lifecycle, reuse it across suitable requests, and close it when its owner shuts down. Separate clients can still be justified for different trust, proxy or authentication policies. Reuse does not mean unlimited concurrency: I would independently cap active downloads and monitor connection churn. I would compare equivalent workloads using connection and TLS metrics, rather than assume that fewer client objects alone proves a throughput improvement.”

**Example:**

```text
Application owns client; download owns response stream; shutdown closes application client.
```

**Deep dive / verification:** Pool behavior depends on origin, protocol and server policy. An unread streaming body can interfere with shutdown; test cleanup before attributing all delays to networking.

**Follow-ups:** Is one global client always correct? No; incompatible security or network policies justify separate owners.

**Primary reference:** [Java 21 HttpClient](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpClient.html).

---

**5. A two-second connect timeout is configured, yet an established connection stalls much longer. Why?**

**Say aloud:** “A connection timeout bounds establishing a new connection. It is not a deadline for an entire ingestion operation, and does not take effect when an existing connection is reused. I would distinguish connection establishment, obtaining the response, consuming a streaming body, and local verification. Each phase needs a defined owner and cancellation policy under an overall operation budget. A request timeout can help bound waiting for a response, but I would not assume it fully governs later application reads from an already returned stream. Increasing the connect timeout would not solve a server that accepts connections and then stops producing data. I would test new and reused connections separately, including a server that sends headers and then stalls.”

**Example:**

```text
connect budget 2 s; operation budget 30 s; stalled body must trigger owned stream cleanup.
```

**Deep dive / verification:** These are time budgets, not complexity guarantees. Enforce the overall budget with a mechanism that actually closes or cancels owned I/O; a timer that only records failure leaves resource consumption behind.

**Follow-ups:** Does a healthy handshake prove the remote application is healthy? No; it proves only one phase progressed.

**Primary reference:** [Java 21 client connectTimeout](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpClient.Builder.html#connectTimeout(java.time.Duration)).

---

**6. Resolving child against https://example.test/api returns an unexpected path. What does the missing slash mean?**

**Say aloud:** “URI resolution combines a base identifier with a reference according to hierarchical path rules. It is not string concatenation. A base ending in api treats that final segment differently from a directory-like base ending in api slash. Resolving child against the first gives a sibling path, while the second places it below api. I would define whether configuration represents a resource or a collection, validate that contract at startup, and test exact resolved identifiers. A leading slash in the child replaces the base path, and an absolute child can replace much more. Normalizing dot segments is useful syntax processing, but does not establish authorization or destination safety. My API would avoid silently repairing ambiguous configuration.”

**Example:**

```text
https://example.test/api  + child -> https://example.test/child
https://example.test/api/ + child -> https://example.test/api/child
```

**Deep dive / verification:** Resolution costs scale with identifier length. Include empty references, leading slash, query and fragment tests; explicitly reject reference forms outside the configuration contract.

**Follow-ups:** Is resolve a sandbox? No; allowed scheme, authority and path policy require separate validation.

**Primary reference:** [Java 21 URI resolution](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/URI.html#resolve(java.net.URI)).

---

**7. A filename containing a space becomes a literal plus in an HTTP path. Was URLEncoder the right tool?**

**Say aloud:** “Encoding converts data into a representation appropriate for a particular syntax. URLEncoder implements HTML form encoding, where a space becomes plus. A path segment follows a different contract, and a server need not interpret plus there as a space. I would use a URI construction approach designed for path components, with a separate policy for values that must remain exactly one segment. Encoding an entire URL also corrupts structural separators, while encoding already escaped data can double-escape percent signs. I would keep raw domain values separate from their encoded form and encode at the boundary once. My tests would inspect the actual requested path for spaces, plus signs, percent signs, non-ASCII text and embedded slashes.”

**Example:**

```java
URLEncoder.encode("a b+c", StandardCharsets.UTF_8); // form value: a+b%2Bc
```

**Deep dive / verification:** Encoding is O(n) input characters/bytes with representation expansion. Component-aware construction alone does not decide whether slash is data or a separator; that belongs in the endpoint contract.

**Follow-ups:** Can I decode repeatedly until unchanged? No; repeated decoding changes interpretation and can bypass validation.

**Primary reference:** [Java 21 URLEncoder](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/URLEncoder.html).

---

**8. A digesting stream skips an ignored header, and the whole-file checksum never matches. Why?**

**Say aloud:** “A message digest is a fixed-size fingerprint calculated from a specific byte sequence. DigestInputStream updates its digest as bytes are read through it; skipped bytes do not contribute. If the expected checksum covers the whole file, skipping the header means I calculated a different sequence. I would define the checksum domain first: compressed bytes, decompressed bytes, or an explicitly selected payload. For a whole-file checksum I would read every byte through the digesting layer, even if the parser discards some data. Buffer placement matters too, because read-ahead can include bytes the parser has not logically consumed yet. I would verify against a small independently computed fixture before testing large files.”

**Example:**

```text
expected hash = H(header || payload); skip(header), read(payload) computes H(payload).
```

**Deep dive / verification:** Streaming hashing is O(n) time and fixed working memory. Mark/reset and rereading can count bytes again; do not treat parser position as digest state.

**Follow-ups:** Where should the digest wrapper sit around decompression? Outside the decompressor's input for compressed bytes; around the decompressed input stream for decompressed bytes.

**Primary reference:** [Java 21 DigestInputStream](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/DigestInputStream.html).

---

**9. A progress logger calls digest halfway through a download, then the final hash changes. What state was consumed?**

**Say aloud:** “MessageDigest is a stateful computation. Calling digest finalizes the current accumulated input and resets the object; it is not a read-only accessor for progress. Continuing updates afterward starts a new digest rather than continuing the old prefix. I would log byte counts for progress and finalize only after the complete intended byte sequence has been processed. If an intermediate fingerprint is a real requirement, I can use a separately maintained computation or clone the digest only when that provider supports cloning. I would keep each download's digest exclusively owned so concurrent jobs cannot interleave updates. Tests should compare single-pass, chunked and empty inputs, and deliberately exercise the accidental halfway-finalization path.”

**Example:**

```text
update(A); digest(); update(B); digest() -> second result is H(B), not H(A || B).
```

**Deep dive / verification:** For a fixed algorithm, processing is O(n); independent parallel files need independent state. Clone support is optional, so a portable design must handle its absence.

**Follow-ups:** Can I concatenate hashes to obtain the full-file hash? No; ordinary SHA-256 digests do not expose that composition operation.

**Primary reference:** [Java 21 MessageDigest](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/MessageDigest.html).

---

**10. Reading a ZipInputStream stops at minus one after the first document. Is the archive exhausted?**

**Say aloud:** “A ZIP archive contains entries, each with its own byte stream. ZipInputStream reads the current entry, so end-of-entry is not necessarily end-of-archive. I would use an outer loop that obtains each next entry and an inner loop that consumes that entry. Only a null next entry means there are no more entries. Closing the entire ZIP stream inside the inner loop accidentally closes the remaining archive as well. I would keep ownership at the archive level and decide how directories and unwanted entries are handled. Streaming avoids loading an entire archive, but the importer must still enforce resource limits and detect corrupt or incomplete input. My fixture would include two nonempty entries with an empty entry between them.”

**Example:**

```text
while next entry exists:
    while read current entry != -1: process that chunk
```

**Deep dive / verification:** Traversal is O(total processed bytes + entries). Test corruption in a later entry so a successful first entry cannot incorrectly mark the whole job complete.

**Follow-ups:** Should partial entry success publish the batch? Only if the product explicitly supports partial acceptance and records it; otherwise stage until complete verification.

**Primary reference:** [Java 21 ZipInputStream](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/zip/ZipInputStream.html).

---

**11. A ZIP producer flushes after writing entries, but consumers reject the archive. What is missing?**

**Say aloud:** “Flush moves buffered output onward; it does not necessarily complete a structured file format. A ZIP archive needs final format records as well as entry data. I would close each entry and finish the ZIP stream before declaring the artifact complete. Finish completes ZIP output without closing the underlying stream, while close also releases the owned stream. That difference matters when another framing layer owns the destination. Publishing after flush alone risks exposing an archive whose entries appear present but whose final directory is missing. I would verify with an independent ZIP reader that enumerates and reads every expected entry. A failure during finalization must fail publication even if all application writes previously returned successfully.”

**Example:**

```text
put entry -> write -> closeEntry -> finish -> owner finalizes destination -> publish.
```

**Deep dive / verification:** Completion includes metadata proportional to entry count. Format completion does not prove crash durability; the destination's persistence and publication protocol remain separate concerns.

**Follow-ups:** Should I finish after each entry? No; closeEntry ends an entry, while finish ends the archive structure.

**Primary reference:** [Java 21 ZipOutputStream](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/zip/ZipOutputStream.html).

---

**12. A ZIP entry reports unknown size, and the importer rejects a legitimate streamed archive. What should drive accounting?**

**Say aloud:** “Entry metadata is information about an entry, and some fields are not known when its header is first read. ZipEntry can report minus one for an unknown size. Treating that as a negative actual length confuses absence of metadata with malformed payload. I would count bytes actually produced while reading, enforce the configured entry and archive budgets on those counts, and use available metadata only as an early check. I would avoid allocating arrays from an untrusted declared size. When the stream finishes, I would verify whatever completeness checks our format and business protocol require before publishing. A valid unknown-size archive should succeed within limits; a known-size archive exceeding those same limits should fail.”

**Example:**

```text
declared size = -1; actual chunks = 4 KiB + 2 KiB; accounted output = 6 KiB.
```

**Deep dive / verification:** Actual-byte accounting is O(n), with O(1) counters plus the buffer. Check overflow before adding a chunk. Test zero-length entries, missing size, early termination and exact-limit boundaries. This complements, rather than replaces, the earlier archive security controls.

**Follow-ups:** Is a known size enough to preallocate safely? No; it is untrusted and still must satisfy application limits and actual-read validation.

**Primary reference:** [Java 21 ZipEntry size contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/zip/ZipEntry.html#getSize()).

---

**Topic coverage and next progression**

Covered HTTP status and stream completion, request isolation, client lifecycle, phase budgets, URI resolution and encoding, digest byte domains and lifecycle, and ZIP traversal/finalization/unknown metadata. Next set will build on these boundaries with content-addressed artifact reconciliation and resumable ingestion protocols. Practice naming the exact success boundary and the failure fixture for each answer.
