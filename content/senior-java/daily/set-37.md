# Set 37 — Schema enforcement and operational repair

22 November 2026 · S37-Q01–S37-Q12

Assume Java 21 without preview features and PostgreSQL 17. These are reference versions, not latest-version claims. Examples are original conceptual protocols and contextual SQL/Java fragments, not executable courses. This set extends the Senior Java guide’s persistence, compatibility and authorization foundations.

**1. A positive-quantity CHECK accepts a null quantity. Which part of the domain rule was never encoded?**

**Say aloud:** “A database constraint is a rule enforced when data is written. In PostgreSQL, a CHECK passes when its expression is true or unknown; comparing null with zero produces unknown. Therefore quantity greater than zero does not also mean quantity must exist. I would express presence with NOT NULL and positivity with CHECK. The Java request validator should give a helpful message, but database enforcement protects imports and other writers too. Before tightening a populated table I would inspect missing quantities and agree on their meaning rather than replacing them with an arbitrary number. This adds migration work but preserves the business distinction between unknown and zero. I would test missing, null, zero, negative and positive inputs through both the API and direct SQL.”

**Example:**

```text
quantity integer NOT NULL CHECK (quantity > 0)
```

**Deep dive / verification:** Test explicit null separately from an omitted value with a default. Constraint checks add write work; migration validation may scan existing rows.

**Follow-ups:** Would DEFAULT 1 reject explicit null? No; a default supplies an omitted value, while explicit null still requires a presence constraint.

**Primary reference:** [Reference documentation](https://www.postgresql.org/docs/17/ddl-constraints.html).

---

**2. A deleted username is reused, then restoring the original account fails. Which lifecycle rule needs a decision?**

**Say aloud:** “Soft deletion means retaining a row while marking it inactive. A partial unique index can reserve a username only among active rows, allowing another account to reuse it after deletion. Restoring the original then becomes a new uniqueness decision rather than simply clearing a flag. I would decide whether names remain reserved forever, may be reused with restoration requiring a rename, or require a reviewed transfer. The database should enforce the chosen active-row rule under concurrent creation and restoration. An application availability check alone races with another writer. Reuse improves convenience but can confuse identity and recovery, so immutable account IDs must remain separate from usernames. I would test delete, reuse, restore, and simultaneous restore attempts with clear conflict messages.”

**Example:**

```text
CREATE UNIQUE INDEX active_username ON account (tenant_id, username) WHERE deleted_at IS NULL;
```

**Deep dive / verification:** Assume non-null tenant and username plus an explicitly defined normalization policy. Restoration is an UPDATE that must satisfy index uniqueness. Index maintenance adds write and storage cost; scope includes active rows only.

**Follow-ups:** Should a restore silently merge accounts sharing a name? No; a reused display/login name does not establish shared identity or authorize a transfer.

**Primary reference:** [PostgreSQL 17 partial indexes](https://www.postgresql.org/docs/17/indexes-partial.html).

---

**3. Deleting one parent scans millions of child rows although the foreign key is valid. Which index may be missing?**

**Say aloud:** “A foreign key ensures that a child reference points to an allowed parent. It does not automatically create an index on the referencing columns in PostgreSQL. When deleting a parent, the database must find referencing children to enforce the selected action. I would inspect the child-side access path and add an appropriate index if the workload justifies it. The parent already needs an eligible referenced key, which is a different direction of lookup. An index can accelerate these checks but consumes storage and adds work to every child write. I would measure a representative deletion inside a reversible test transaction and inspect its plan and lock behavior. Cascading deletion still has to modify every affected child; indexing cannot eliminate that work.”

**Example:**

```text
child(parent_id) needs its own workload-appropriate index; parent(id) indexing does not serve the reverse lookup.
```

**Deep dive / verification:** Consider composite tenant keys and matching leading index columns. Verify restrict versus cascade semantics, not only latency.

**Follow-ups:** Does adding the index make a huge cascade cheap? No; row changes, logging and downstream effects still scale with affected children.

**Primary reference:** [Reference documentation](https://www.postgresql.org/docs/17/ddl-constraints.html).

---

**4. A NOT VALID foreign key was added to a dirty table. Can new invalid rows still be inserted?**

**Say aloud:** “NOT VALID separates checking historical data from enforcing a newly added rule. For a PostgreSQL foreign key, new inserts and relevant updates are checked even though the existing table has not yet been fully validated. I would add the rule in a short migration, repair old violations, then run VALIDATE CONSTRAINT. This makes progress possible without requiring one long initial scan while holding the stronger addition lock. It does not make the operation lock-free or eliminate the later validation work. I would verify constraint state from database metadata, inject a new invalid insert, and retain an old violating fixture until repair. Completion means validation succeeds, not merely that the migration file ran successfully or that one sampled query found no violations.”

**Example:**

```text
ADD CONSTRAINT child_parent_fk FOREIGN KEY (parent_id) REFERENCES parent(id) NOT VALID; then repair; then VALIDATE CONSTRAINT.
```

**Deep dive / verification:** Bound lock waits; validate on realistic volume. This staging applies to supported foreign-key/check constraints, not arbitrary UNIQUE constraints.

**Follow-ups:** Can validation fail later? Yes; historical violations remain possible until repaired and validation succeeds.

**Primary reference:** [Reference documentation](https://www.postgresql.org/docs/17/sql-altertable.html).

---

**5. A concurrent unique-index build fails, yet later writes still report uniqueness errors. What state must operations inspect?**

**Say aloud:** “Concurrent index construction allows ordinary writes to continue during much of the build, but it is a staged operation rather than an all-or-nothing promise of useful index availability. PostgreSQL can leave an invalid index after failure. A failed concurrent unique build can still impose uniqueness enforcement depending on the phase reached. I would inspect index validity and the original error before choosing documented cleanup and retry. Blindly retrying with IF NOT EXISTS can preserve the unusable object because its name already exists. Concurrent construction trades stronger write availability for extra scans, waits and recovery work. I would rehearse duplicate data, cancellation and a long-running transaction, and keep this command outside the migration tool transaction block because PostgreSQL disallows that wrapping.”

**Example:**

```text
Build fails -> inspect pg_index validity and failure cause -> deliberate cleanup -> corrected retry.
```

**Deep dive / verification:** Check query usability separately from enforcement. Two scans and snapshot waits make runtime dependent on workload, not just row count.

**Follow-ups:** Does concurrent mean no waiting? No; transactions and conflicting maintenance can still delay construction.

**Primary reference:** [Reference documentation](https://www.postgresql.org/docs/17/sql-createindex.html).

---

**6. An UPDATE FROM repair joins each target to two correction rows. Which correction wins?**

**Say aloud:** “A joined update needs an unambiguous mapping from every target row to its intended new value. PostgreSQL warns that if the join produces multiple rows for one target, the selected source row is not predictably determined. I would reject ambiguous correction input before execution and enforce uniqueness on the repair staging key, including tenant scope where applicable. Choosing the latest row is acceptable only if latest has a complete business ordering with a tie policy. DISTINCT without a decision rule hides the defect. The extra staging validation costs time and storage but turns a risky repair into an auditable transformation. I would test duplicate corrections with different values, duplicate identical corrections and missing targets, and compare actual updated identifiers with the approved target manifest.”

**Example:**

```text
Corrections [(tenant A,id 7,value X),(tenant A,id 7,value Y)] -> reject before UPDATE FROM.
```

**Deep dive / verification:** Index staging keys and reconcile target IDs, not just row counts. A scalar subquery can expose multiplicity as an error but still needs missing-row policy.

**Follow-ups:** Are two identical corrections harmless? Their values agree, but rejecting or explicitly deduplicating them keeps input accounting unambiguous.

**Primary reference:** [Reference documentation](https://www.postgresql.org/docs/17/sql-update.html).

---

**7. An approved repair changes after review but retains the same job ID. How should execution bind approval to the operation?**

**Say aloud:** “Approval is permission for a particular operation, not merely recognition of a job name. I would bind the approval record to immutable repair content: target environment and tenant, ordered target identities, proposed changes, expected versions and expiry. The executor must verify that binding and current authority before applying anything. Editing any significant input creates a new revision requiring the corresponding approval. This original protocol adds review latency and artifact storage, but prevents a harmless preview from authorizing a broader production change. A content digest can detect substitution; it does not itself establish who was allowed to approve. I would test changed amounts, another environment, expiry and replay, with execution records tied to both the approved revision and actual results.”

**Example:**

```text
Approve revision 4 for tenant A; revision 5 or tenant B must fail authorization even under the same job ID.
```

**Deep dive / verification:** Protect approval records and verify permissions server-side. Digest construction must use an unambiguous encoding. Cost scales with manifest size.

**Follow-ups:** Can an administrator edit the approved manifest in place? The design should make that a new revision and preserve evidence of the earlier decision.

**Primary reference:** [Reference documentation](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html).

---

**8. A repair preview was correct yesterday, but a customer edited the row today. Should approval overwrite the change?**

**Say aloud:** “A preview is an observation at a past moment. I would include an expected version in each approved repair item and make the write conditional on that version and tenant. A mismatch becomes a conflict requiring review, not an automatic overwrite. The change and durable outcome record should commit in the same local transaction. This preserves the customer edit but can leave a partially completed batch, so the operator needs explicit applied, conflicted and unresolved outcomes. Approval does not imply that future state is interchangeable with reviewed state. I would pause execution between preview and apply, perform a normal customer update, and verify the repair reports conflict without changing the row. A retry must reconcile prior committed results rather than interpreting every mismatch as fresh failure.”

**Example:**

```text
UPDATE account SET label = :new, version = version + 1 WHERE tenant_id = :tenant AND id = :id AND version = :approvedVersion;
```

**Deep dive / verification:** Expect exactly one matched row for an unapplied item. All writers must maintain the version; atomically record item identity and outcome to resolve replay.

**Follow-ups:** What if the connection drops after commit? Query the durable per-item outcome before retrying; an ambiguous response is not proof of rollback.

**Primary reference:** [Reference documentation](https://www.postgresql.org/docs/17/sql-update.html).

---

**9. A repair rollback restores the old value and erases a later legitimate edit. What should reversal require?**

**Say aloud:** “Rollback of an operational repair is usually a new business operation rather than a time machine. I would store the before and after values and the resulting version, then make reversal conditional on the row still representing that repair result. If a later edit advanced the version, reversal must stop for review. Restoring a whole database backup would discard unrelated progress, while an unconditional inverse update can silently erase customer changes. This approach costs audit storage and may require manual conflict resolution, but preserves later work. I would test immediate reversal, a subsequent legitimate update, repeated reversal and a deleted target. External effects such as a sent notification need a separate compensating action; changing a row cannot retract a message already delivered.”

**Example:**

```text
Repair v8 -> v9; customer writes v10; reversal expecting v9 must report conflict.
```

**Deep dive / verification:** Original protocol: keep repair/item identity and reversal outcome transactionally. No cross-service atomicity is implied; retention must cover the promised reversal window.

**Follow-ups:** Can subtracting the previous delta always undo a repair? No; intervening business rules and irreversible effects require a domain-specific compensation.

**Primary reference:** [Reference documentation](https://www.postgresql.org/docs/17/sql-update.html).

---

**10. Two migration reports show the same row count. Does that prove the transformed datasets match?**

**Say aloud:** “Counts measure cardinality, which is the number of rows, rather than identity or value correctness. Losing one row and duplicating another can preserve the count. I would define a reconciliation contract over stable keys, transformed values and the time boundary of comparison. For a small repair I can compare the complete approved item outcomes; for a large migration I would partition by stable key and reconcile exact mismatches. Checksums help detect differences but need a defined encoding, null policy and collision assumptions. Sampling is useful for diagnosis, not proof that every row matches. This adds read and comparison load, so I would throttle it and use a stable snapshot or an explicit change-capture boundary. Tests should preserve counts while deliberately swapping, omitting and duplicating identities.”

**Example:**

```text
Expected keys [A,B,C]; actual [A,A,C] -> both count 3, reconciliation fails.
```

**Deep dive / verification:** An exact keyed comparison is O(n) after ordering/index preparation; sorting unsorted inputs typically adds O(n log n). Define treatment of duplicate keys.

**Follow-ups:** Can a live source be compared with yesterday’s target? Only against an explicit temporal contract; otherwise ordinary updates create misleading discrepancies.

**Primary reference:** [Reference documentation](https://www.postgresql.org/docs/17/sql-select.html).

---

**11. Keeping serialVersionUID unchanged lets an old Java object deserialize. Does that prove the new invariant holds?**

**Say aloud:** “SerialVersionUID is a compatibility identifier used by Java object serialization, not a certificate of business validity. Keeping it stable can permit compatible field evolution, but an older serialized object may lack a newly added field and receive its default value. I would test historical serialized fixtures against the new class and explicitly validate the reconstructed state where this mechanism is retained. A newly required positive limit cannot safely assume old bytes passed the current constructor checks. Changing the identifier rejects old streams but creates a deliberate migration problem instead. For durable application contracts I would consider a versioned data format with explicit conversion rules. I would also avoid accepting untrusted native serialized objects: class compatibility and deserialization security are separate concerns requiring their own controls.”

**Example:**

```text
Old object has no retryLimit; new primitive int field can deserialize as 0 despite a new constructor requiring a positive limit.
```

**Deep dive / verification:** Contextual Java 21 scenario, not runnable course code. Test real old bytes and invalid reconstructed states; an explicit UID does not make incompatible type changes safe.

**Follow-ups:** Does normal Serializable reconstruction call the serializable class constructor? No; do not rely on its normal construction validation to establish all restored invariants.

**Primary reference:** [Reference documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/Serializable.html).

---

**12. Renaming a Java enum constant breaks old serialized sessions even though its numeric position stayed the same. Why?**

**Say aloud:** “Java native serialization stores an enum constant by its name. Deserialization resolves that name in the enum type, so retaining the same ordinal position does not preserve a renamed constant. I would treat the name as part of this persisted format and test old session bytes before deploying a rename. Options include keeping the old constant during migration, expiring sessions under an agreed policy, or moving durable data to explicit stable external codes. Keeping a deprecated constant preserves readability but requires deliberate mapping so it does not reappear as an active business choice. An enum-specific serialVersionUID cannot override these rules. I would test removed names, mixed application versions and both forward and rollback behavior rather than checking only newly serialized values against the same build.”

**Example:**

```text
Old enum name WAITING -> renamed PENDING at the same ordinal -> old serialized name still requests WAITING.
```

**Deep dive / verification:** Java 21 native enum serialization; JSON libraries and JPA mappings have separate contracts. Conversion must distinguish retired codes from malformed data.

**Follow-ups:** Would overriding readObject on the enum remap the old name? No; enum serialization has special fixed behavior, so migrate outside that hook.

**Primary reference:** [Reference documentation](https://docs.oracle.com/en/java/javase/21/docs/specs/serialization/serial-arch.html#serialization-of-enum-constants).

---

### Topic coverage

S37-Q01–Q03: presence, uniqueness and referential access paths. Q04–Q06: staged enforcement and deterministic repair input. Q07–Q10: approval binding, stale-state conflicts, reversal and reconciliation. Q11–Q12: historical Java serialization compatibility.

### Next set

Build on these boundaries with database privilege separation, repair observability and Java compatibility testing, avoiding another column-rename or artifact-reconciliation scenario.
