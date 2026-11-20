# Set 36 — Artifact reconciliation and resumable ingestion

20 November 2026 · S36-Q01–S36-Q12

Assume Java 21 without preview features, HTTP semantics from RFC 9110 and PostgreSQL 17 where SQL behavior matters. These are explicit reference versions, not latest-version claims. Original conceptual designs and contextual pseudocode extend the guide’s I/O, security and distributed-system foundations; no runnable course is declared.

**1. A resumed artifact combines yesterday’s prefix with today’s suffix. How do you bind a range to one representation?**

**Say aloud:** “A representation is the particular sequence of bytes returned for a resource. A URL alone does not identify a permanent byte sequence. I would persist a strong entity tag with the partial download and send a range request with If-Range using that tag. A matching partial response must start at the expected offset; a full response means restarting into a new temporary file, not appending. I would validate the response range and finish with the expected artifact hash. This trades extra restarts for protection against mixed versions. Weak validators cannot safely establish byte identity here. I would test a resource replacement between attempts and a server that ignores Range, rather than assuming every successful response is appendable.”

**Example:**

```text
prefix length 4096; Range: bytes=4096-; If-Range: "v7"; 200 => replace temporary download, never append.
```

**Deep dive / verification:** Check 206 range start, total length policy, 416 handling and content-coding consistency. Network work is proportional to transferred bytes. Resume metadata must identify the exact encoded representation.

**Follow-ups:** Can Last-Modified always substitute? No; date validators have strength requirements and limited resolution. Prefer a strong entity tag when available.

**Primary reference:** [RFC 9110, If-Range](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.5).

---

**2. A manifest lists chunk hashes but reordering chunks still passes validation. What must the manifest bind?**

**Say aloud:** “A manifest is metadata describing the parts of an artifact. Verifying that every chunk belongs to an allowed set does not verify their order or multiplicity. I would define an ordered manifest containing an artifact format version, total byte length, and each chunk’s index, length and digest. The authenticated manifest becomes the reconstruction contract. After assembling in that order I would also verify the whole artifact digest where the format supplies one. Otherwise an attacker or a buggy scheduler can repeat valid chunks or omit a tail. Chunk verification allows localized retries but requires more metadata. I would test swaps, duplicate indexes, missing chunks and an empty artifact, and reject ambiguous manifests before downloading anything.”

**Example:**

```text
Expected [(0,3,H(abc)), (1,2,H(de))]; receiving [de,abc] fails positional validation.
```

**Deep dive / verification:** For k chunks and n bytes, verification is O(k+n) with bounded streaming buffers plus O(k) metadata. Define an unambiguous serialization before signing metadata; concatenating variable strings is insufficient.

**Follow-ups:** Why include lengths? They define boundaries and permit explicit truncation and total-size checks.

**Primary reference:** [Java 21 MessageDigest](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/MessageDigest.html).

---

**3. Two tenants upload identical bytes. Does a content hash authorize either tenant to download them?**

**Say aloud:** “Content addressing means locating bytes by a digest of their content. It is a storage identity, not a permission. I would separate an immutable shared blob from tenant-owned references and authorize every read through the reference or an explicitly authorized capability. Possessing or guessing a hash must not grant access. Even an existence endpoint can reveal that another tenant uploaded a sensitive document, so deduplication responses and timing deserve review. Sharing physical storage can save space but increases isolation and deletion complexity. For stronger isolation I might scope deduplication per tenant. My tests would upload the same payload as two tenants, revoke one reference and confirm that access decisions remain independent of physical blob existence.”

**Example:**

```text
Tenant A -> reference A7 -> blob H; Tenant B knowing H still needs an authorized B reference.
```

**Deep dive / verification:** Authorization work depends on the reference lookup, not artifact size. Test deleted references, expired links and enumeration responses. This is an original design scenario, not an assertion about a storage vendor.

**Follow-ups:** Does encryption solve authorization? No; keys and access policies still need tenant-scoped ownership.

**Primary reference:** [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

---

**4. A sweeper deletes a blob between an uploader’s existence check and reference creation. How do you close the race?**

**Say aloud:** “A sweeper is a background process that removes unused data. An existence check followed by a reference insert leaves a window where cleanup can invalidate the decision. I would coordinate reference acquisition with a blob lifecycle record: live, retiring and deleted, with a generation number. A transaction or conditional operation must acquire a reference only while the blob is live, and retirement must exclude new acquisitions. Physical deletion happens after that decision, with a retryable recovery record. A grace period reduces accidents but alone does not prove safety. This adds coordination and may delay cleanup. I would interleave acquisition and retirement in tests and require either a valid reference or an explicit retry, never a successful dangling reference.”

**Example:**

```text
LIVE generation 8 -> RETIRING generation 9; acquire requiring LIVE/8 must fail after retirement.
```

**Deep dive / verification:** Coordination protects metadata only; object deletion needs idempotent retries and generation-specific keys so delayed cleanup cannot delete a replacement. Measure oldest retiring age and dangling references.

**Follow-ups:** Why not just count references? A count read races with new inserts unless both operations share an enforced protocol.

**Primary reference:** [PostgreSQL 17 transaction isolation](https://www.postgresql.org/docs/17/transaction-iso.html).

---

**5. A restore brings back blob references but excludes the corresponding object-store backup. What should reconciliation prove?**

**Say aloud:** “Reconciliation compares intended durable state with observed durable state and repairs differences. Restoring database rows is insufficient when they point into a separately backed-up object store. I would define a recovery point covering both systems, inventory referenced object generations and verify presence, size and digest before exposing restored artifacts as healthy. Missing content should become a visible unavailable state with a repair workflow, rather than an endless download retry. Orphan objects are a different class and should not be deleted during an uncertain restore. Full hashing is expensive, so I would prioritize user-critical references and retain progress while eventually checking all required objects. A restore drill must include missing, corrupt and unexpected objects, not just row counts.”

**Example:**

```text
Restored reference R9 expects object H/version3; only version2 exists => unavailable, queued for recovery.
```

**Deep dive / verification:** Inventory is O(references + objects); reading all bytes costs O(total bytes). Establish retention and ownership before cleanup. This is a conceptual cross-store protocol with no assumed vendor snapshot guarantee.

**Follow-ups:** Is matching size enough? No; equal-length corrupt bytes still require integrity verification.

**Primary reference:** [Java 21 MessageDigest](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/MessageDigest.html).

---

**6. A reconciliation job compares two inventories taken an hour apart and reports false data loss. What is missing?**

**Say aloud:** “An inventory is an observation at a particular time, not necessarily a consistent snapshot. Comparing a fresh database reference list with an older object list can label legitimate new uploads as missing. I would record observation boundaries and distinguish confirmed absence from an object that may fall outside the inventory window. Repairs should recheck the authoritative store before changing state, and destructive cleanup needs a stronger coordinated protocol. Repeated observations can reduce noise but do not alone create a transaction across stores. Snapshot inventories simplify reasoning when supported; live scans cost less coordination but require conservative decisions. I would test objects created and deleted during a scan and make the report explain uncertainty instead of declaring every mismatch corruption.”

**Example:**

```text
Object inventory ends at 10:00; reference committed at 10:20 => recheck, not immediate loss alert.
```

**Deep dive / verification:** Scan cost is O(items); bounded rechecks prevent a mismatch storm from overloading the store. Report observation times and unresolved age. No cross-system snapshot is assumed.

**Follow-ups:** Can a database repeatable-read snapshot fix both sides? No; it stabilizes database reads, not an independent object-store inventory.

**Primary reference:** [PostgreSQL 17 transaction isolation](https://www.postgresql.org/docs/17/transaction-iso.html).

---

**7. A duplicate upload should not consume quota twice. Where should logical and physical accounting diverge?**

**Say aloud:** “Logical usage measures what a tenant owns under the product’s billing policy; physical usage measures bytes stored after deduplication. They answer different questions. I would explicitly choose whether two references to one blob count once or twice for that tenant, then enforce that rule with a unique ownership or charge record in the same transaction as reference creation. Storage savings must not accidentally bypass upload admission. Concurrent uploads require atomic quota reservation, followed by settlement or expiry tied to an upload identity. This adds state but avoids both overspending and permanent leaked reservations. I would test duplicate retries, simultaneous uploads near quota and failed finalization, checking that tenant charges remain explainable even when global physical usage is shared.”

**Example:**

```text
Policy: distinct tenant blob ownership counts once; UNIQUE(tenant_id, blob_id) guards the charge transition.
```

**Deep dive / verification:** Indexed ownership lookup is typically logarithmic; quota correctness depends on transaction design and constraints. Reconcile reservations separately from committed usage. Avoid charging by transient object count.

**Follow-ups:** What if the transaction aborts after bytes arrive? Leave a tracked unreferenced upload for later cleanup; do not charge a nonexistent reference.

**Primary reference:** [PostgreSQL 17 transaction isolation](https://www.postgresql.org/docs/17/transaction-iso.html).

---

**8. A worker verifies a file, then another process replaces it before ingestion. Which bytes were actually trusted?**

**Say aloud:** “This is a time-of-check to time-of-use race: the object checked can differ from the object later consumed. A digest proves something about the bytes read during verification, not every future read of the same path. I would keep ownership of a private staging object and consume that verified immutable generation, preventing writes or replacement through the storage protocol. Where feasible I would verify and ingest from one controlled stream, staging effects until verification succeeds. A path string is insufficient identity. Restricting writers and using immutable object versions simplifies reasoning but requires lifecycle discipline. I would test replacement during verification and between verification and consumption, and ensure the published result always refers to the exact bytes that passed verification.”

**Example:**

```text
verify staging/version7; ingest staging/version7; never reopen mutable alias "latest".
```

**Deep dive / verification:** Hashing is O(bytes). A retained file handle alone does not prevent another writer mutating its contents; the ownership protocol must prohibit writes. Reject effects from unverified streams or stage them transactionally.

**Follow-ups:** Can checking the hash again solve it? Only if the consumed bytes and resulting effects are bound to that successful verification.

**Primary reference:** [CWE-367: check/use races](https://cwe.mitre.org/data/definitions/367.html).

---

**9. An import has one million valid rows followed by a bad checksum. How can streaming avoid publishing invalid data?**

**Say aloud:** “Streaming processes data incrementally with bounded memory, but an integrity check may only finish at the end. I would separate parsing progress from business visibility. Parsed rows go into an import-specific staging area; after byte integrity and semantic checks succeed, a durable activation step makes that import visible. Readers must consistently apply the activation rule. Failure discards or expires staging data. This costs extra writes and cleanup but avoids a huge in-memory buffer or an extremely long transaction. If each row is independently authenticated, a different partial-success contract is possible, but it must be explicit. I would truncate the last chunk in a test and confirm that no staged row appears in normal business queries.”

**Example:**

```text
Rows carry import_id=I7; normal reads include only imports with status ACTIVE; failed digest leaves I7 FAILED.
```

**Deep dive / verification:** O(n) staging writes with bounded parser memory. Activation must be atomic in the chosen metadata store, and readers cannot bypass it. Index by import identity to keep cleanup bounded.

**Follow-ups:** Can we send notifications while staging? Only if consumers understand provisional state; otherwise defer side effects until activation.

**Primary reference:** [PostgreSQL 17 transaction isolation](https://www.postgresql.org/docs/17/transaction-iso.html).

---

**10. A checksum matches a value supplied beside an untrusted download. What threat did verification actually address?**

**Say aloud:** “A checksum is a compact value computed from bytes. Comparing a strong digest catches accidental corruption when the expected value is trustworthy. If an attacker can replace both the artifact and its expected digest, the comparison authenticates nothing about the publisher. I would obtain expected metadata through an authenticated channel or verify a signed manifest against an independently trusted key, then bind the artifact identity and version to that metadata. Signature verification still needs key rotation and rollback policy; an old valid artifact may be unacceptable. This adds trust management beyond hashing. I would test modified bytes, substituted metadata, unknown signing keys and an older correctly signed release, and distinguish integrity failure from authorization or version-policy failure.”

**Example:**

```text
Untrusted server returns payload P plus H(P): self-consistent, not proof that approved publisher chose P.
```

**Deep dive / verification:** Hashing is O(bytes); signature verification usually operates on bounded metadata. Trust anchors must come from outside the attacker-controlled bundle. These are conceptual controls, not a cryptographic implementation.

**Follow-ups:** Why reject old valid signatures? Authentic origin does not imply freshness or permission to downgrade.

**Primary reference:** [Java 21 Signature](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/Signature.html).

---

**11. Two sorted chunk inventories are too large for sets in memory. How do you find missing and unexpected IDs?**

**Say aloud:** “I would use a merge scan, comparing the smallest unconsumed identifier from each sorted inventory. Equal identifiers advance both streams. A smaller expected identifier is missing from observed storage; a smaller observed identifier is unexpected. When one stream ends, the other stream supplies the remaining differences. This uses constant auxiliary memory when we stream outputs, and linear time in the combined inventory lengths. The precondition matters: both inputs must use the same stable ordering and identifier normalization. I would reject or separately handle duplicate IDs according to the inventory contract. Unlike building a hash set, this works with bounded memory, but it requires sorted inputs or an external sorting phase. Tests include empty inputs, identical lists and differences at both ends.”

**Example:**

```text
expected [a,c,f], observed [b,c,e] => missing [a,f], unexpected [b,e].
```

**Deep dive / verification:** Pseudocode: while both exist, compare; advance smaller and emit its side, or advance both on equality; drain tails. O(n+m) comparisons, O(1) working memory excluding outputs. External sorting adds I/O and O(n log n + m log m) comparison work.

**Follow-ups:** What if duplicate counts matter? Compare run lengths for equal IDs and emit count differences; set-style advancement would lose multiplicity.

**Primary reference:** [Java 21 Iterator contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Iterator.html).

---

**12. An artifact has a million chunks and only a few differ. When does a Merkle tree beat a flat comparison?**

**Say aloud:** “A Merkle tree is a tree whose leaves commit to chunk contents and whose parent hashes commit to their ordered children. If trusted roots match, we can skip comparing all the descendants under the collision-resistance assumption. If roots differ, we descend only into differing subtrees until locating changed chunks. For a balanced tree with one changed leaf, comparison needs a path proportional to the logarithm of the chunk count, assuming both sides already have compatible trees. Building the trees still reads all content. This saves repeated network comparisons but adds persistent metadata and a canonical layout contract. I would test changes at the first and last leaves, different chunk boundaries and malformed proofs, rather than presenting root equality as unconditional mathematical identity.”

**Example:**

```text
8 leaves: compare root, then differing half, quarter and leaf; matching sibling subtrees need no byte transfer.
```

**Deep dive / verification:** Initial construction O(n) bytes plus O(k) tree nodes for k chunks; repeated sparse comparison can be much smaller, worst case O(k). Domain-separate leaf and parent encodings and bind positions, lengths and format version.

**Follow-ups:** Can ordinary SHA-256 of the whole file replace the tree? It detects a whole-file difference but does not locate which chunks differ.

**Primary reference:** [RFC 9162 tree hashing example](https://www.rfc-editor.org/rfc/rfc9162.html#section-2.1).

---

### Topic coverage and next progression

Twelve new scenarios cover representation-bound resume, ordered manifests, tenant ownership, garbage-collection races, cross-store restore, inventory observation windows, quota accounting, verified-byte ownership, staged activation, publisher trust, streaming inventory differences and Merkle comparison. Next set will build on reconciliation with schema evolution and operational repair approval, rather than repeat these artifact protocols.
