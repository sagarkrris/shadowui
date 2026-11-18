# Set 32 — JDBC ingestion and execution boundaries

18 November 2026 · S32-Q01–S32-Q12

Assume Java 21 JDBC, without preview features, in a service that imports bounded chunks into a relational database. Database and driver versions must be pinned by the implementing service; no vendor-specific streaming, warning or batch behavior is assumed. Each original answer is intended for 45–90 seconds of practice. Examples are contextual pseudocode, not a runnable database application. These scenarios build on the guide’s JDBC, transaction and resource-ownership foundations.

**1. A nullable SQL quantity becomes zero in Java and an unknown stock level is sold. Where was nullness lost?**

**Say aloud:** “A JDBC result set is a cursor over database rows. Primitive getters cannot represent SQL NULL, so getInt returns zero for that case. I would call wasNull immediately after that getter and map the result to an explicit nullable value or domain state. Reading another column first changes which getter wasNull describes. Unknown stock must then follow a deliberate business policy rather than accidentally becoming available or empty. A typed getObject can be clearer where the driver supports the requested conversion. Neither technique validates the business meaning of a non-null quantity. I would test SQL NULL separately from a genuine zero and from a positive value.”

**Example:**

```text
Integer quantity = rs.getInt("quantity");
if (rs.wasNull()) quantity = null;
```

**Deep dive / verification:** Constant mapping state per column. Test null, zero and negative domain values against the production driver.

**Follow-ups:** Why not default null to zero? That is a business conversion which must be intentional and documented.

**Primary reference:** [Java 21 ResultSet](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/ResultSet.html).

---

**2. A reused prepared statement assigns the previous customer’s discount to the next row. How can a missing setter succeed?**

**Say aloud:** “A prepared statement holds parameter values as mutable execution state. Its values remain set until replaced or cleared, so omitting one setter on the next iteration can reuse an earlier value. I would bind every parameter for every row, including an explicit typed SQL null where appropriate. Clearing parameters can expose omissions, but it is not a substitute for complete binding. I would keep a statement confined to its operation instead of sharing it across requests. This issue differs from SQL injection: parameterization separates values from SQL syntax, but does not guarantee that the correct values were supplied. A regression should process a populated discount followed by an absent discount and inspect both stored rows.”

**Example:**

```text
For every row: set customer_id, then either set discount or setNull(discount, DECIMAL), then execute.
```

**Deep dive / verification:** O(parameters) binding per row. Test transitions between present and absent values in both directions.

**Follow-ups:** Does addBatch clear bindings? Do not depend on that; bind the complete parameter set before each addBatch.

**Primary reference:** [Java 21 PreparedStatement](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/PreparedStatement.html).

---

**3. An import loop executes a lookup using its scanning Statement and the outer ResultSet closes. Who invalidated it?**

**Say aloud:** “A statement owns the result set it produced. JDBC execution methods implicitly close an open current result set of that same statement, so reusing it for a nested lookup destroys the outer scan. I would use separate statements with explicit lifetimes, or preferably reshape the query to avoid a lookup for every row. Separate statements avoid this ownership error but do not remove the latency of many round trips. Driver and database limits on concurrent results still need verification. Materializing all rows first is another option only when the input is bounded. I would reproduce the failure with two outer rows so the test actually advances the cursor after the nested query.”

**Example:**

```text
Scan through scanStatement; perform a bounded lookup through lookupStatement, or replace both with a join.
```

**Deep dive / verification:** A join trades database work for fewer round trips; compare query plans and peak memory rather than assuming improvement.

**Follow-ups:** Would two references to the same Statement help? No; ownership follows the underlying object.

**Primary reference:** [Java 21 Statement](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Statement.html).

---

**4. A successful batch returns SUCCESS_NO_INFO and the importer reports a negative number of inserted rows. What does the count mean?**

**Say aloud:** “A JDBC batch returns execution outcomes, not always exact row counts. SUCCESS_NO_INFO means the command succeeded but its affected-row count is unavailable. I would preserve that distinction instead of adding the negative sentinel to an inserted-row metric or treating it as failure. If the business requires exactly one changed row per command, an unknown count is insufficient evidence; I would use a supported exact-count path or verify outcomes by durable keys. Zero can also be a valid update count, depending on the SQL and business contract. Batch success alone does not establish transaction commit. Metrics should distinguish attempted commands, known affected rows, unknown counts and committed outcomes.”

**Example:**

```text
Counts [1, SUCCESS_NO_INFO, 0] mean one known row, one successful unknown count, and one zero-row command.
```

**Deep dive / verification:** O(batch size) classification. Test each sentinel and zero; use large-count APIs when integer counts could overflow.

**Follow-ups:** Can an unknown count prove one insert? No; the count itself does not provide that evidence.

**Primary reference:** [Java 21 Statement](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Statement.html).

---

**5. A batch throws after its fourth command. Can recovery replay only commands five onward?**

**Say aloud:** “A BatchUpdateException carries counts, but a driver may stop at failure or continue processing later commands. I would inspect the returned outcomes and the configured transaction boundary rather than infer a successful prefix from the exception alone. Even a successful execution count does not prove that its transaction committed. For an all-or-nothing chunk, I would roll back the owned transaction and retry the whole chunk under a duplicate-safe contract. If partial acceptance is intentional, I would persist per-item outcomes and reconcile uncertain results. Retrying an assumed suffix risks both lost work and duplicates. Integration tests must include a constraint failure in the middle, then examine the database after the chosen rollback or commit policy.”

**Example:**

```text
For a five-command batch, test both a short count array and a full array containing EXECUTE_FAILED.
```

**Deep dive / verification:** Outcome inspection is O(batch size). Larger chunks reduce round trips but increase rollback and retry work.

**Follow-ups:** Are update counts a checkpoint? No; checkpoint only a durably established business outcome.

**Primary reference:** [Java 21 BatchUpdateException](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/BatchUpdateException.html).

---

**6. A cleanup finally block sets autoCommit to true and accidentally commits a failed import. Why?**

**Say aloud:** “Auto-commit means statements are committed individually when complete; disabling it groups work into an explicit transaction. Changing a connection from manual commit to auto-commit commits its current transaction. I would therefore finish the owned transaction with commit or rollback before restoring connection state. A generic finally block that resets auto-commit can otherwise publish partial work after an exception. In a Spring-managed transaction I would let the transaction manager own this lifecycle instead of manually changing its connection. For a raw JDBC example, ownership must be explicit and rollback failure must be preserved as diagnostic evidence. I would test a failure after the first write and verify that cleanup leaves no committed prefix.”

**Example:**

```text
Owned transaction: disable auto-commit → work → commit on success; rollback on failure → restore state after completion.
```

**Deep dive / verification:** One transaction may retain locks across the chunk. State-reset tests must inspect persisted rows, not merely mock setter calls.

**Follow-ups:** Does close guarantee rollback? Resolve the active transaction explicitly; closing with one active has implementation-defined results.

**Primary reference:** [Java 21 Connection](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Connection.html).

---

**7. Rolling back to a savepoint removes one bad row, yet the remaining import disappears on disconnect. What was missing?**

**Say aloud:** “A savepoint marks an intermediate position inside a transaction. Rolling back to it undoes later work but does not commit earlier work or finish the transaction. I would explicitly commit the retained work only after the entire chunk satisfies its acceptance policy. Savepoints can support intentionally partial acceptance, but database errors differ in whether continued work is possible. I would check driver support and test the exact failure category before building recovery around them. In a framework application I would use its supported transaction model rather than mix unmanaged savepoints into an owned transaction. Holding a large transaction open can still retain locks and resources even when individual rows are rolled back.”

**Example:**

```text
Write A → savepoint → write invalid B → rollback to savepoint → validate → commit A.
```

**Deep dive / verification:** Savepoint overhead and resource release depend on the database. Verify visibility from a separate connection after commit.

**Follow-ups:** Is releaseSavepoint a commit? No; it releases the marker, not the transaction.

**Primary reference:** [Java 21 Connection](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Connection.html).

---

**8. Setting fetchSize to 100 still lets a JDBC export exhaust heap. What guarantee was assumed?**

**Say aloud:** “Fetch size is a driver hint about how many rows to fetch when more rows are needed. It is not a portable maximum result size or heap bound. I would consult the actual driver requirements for cursor-based retrieval, then consume rows incrementally without collecting the entire export. An application queue, serializer or framework layer can retain everything even if the driver fetches incrementally. I would measure heap and connection occupancy with a production-sized result and a deliberately slow consumer. A long-lived database cursor also has operational costs, so bounded pages or an asynchronous export may be better. The acceptance criterion is bounded end-to-end resource usage, not merely a setter call.”

**Example:**

```text
fetchSize=100 plus collecting ten million mapped objects still retains ten million objects.
```

**Deep dive / verification:** O(n) traversal; memory depends on driver buffering and downstream retention. Test cancellation and connection return as well.

**Follow-ups:** Does setMaxRows solve every export limit? It caps exposed rows, but still requires a clear truncation contract and resource testing.

**Primary reference:** [Java 21 Statement](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Statement.html).

---

**9. A query timeout fires, and the service returns the connection without resolving its transaction. Is the transaction automatically rolled back?**

**Say aloud:** “A statement timeout limits statement execution according to the JDBC and driver contract. It is not an application transaction policy. On timeout the driver has at least attempted cancellation, but I would not infer that every earlier statement was rolled back or that remote work stopped at the desired instant. The transaction owner must resolve its transaction and handle a broken connection through the pool’s supported lifecycle. Network timeouts and request deadlines protect different boundaries. I would allocate time for rollback and cleanup inside the overall request budget. A database integration test should block a statement deliberately, trigger the timeout, and verify both persisted state and the usability of the next borrowed connection.”

**Example:**

```text
Write A in a transaction → second statement times out → transaction owner rolls back before releasing the connection.
```

**Deep dive / verification:** Timeout resolution adds cleanup latency; the configured seconds value is not a complete request deadline.

**Follow-ups:** Can cancel roll back an earlier commit? No; cancellation cannot undo a completed transaction.

**Primary reference:** [Java 21 Statement](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Statement.html).

---

**10. An insert succeeds, but getGeneratedKeys is empty on another driver. Can the importer assume every insert returns an ID?**

**Say aloud:** “Generated keys are values assigned during insertion, such as an identity column. JDBC provides a request for returning them, but support and eligible statements depend on the driver and database. I would request keys explicitly, check support during compatibility testing, advance the returned result set and validate the expected cardinality. I would not silently substitute zero when no key appears. For multi-row operations, I would verify how returned keys map to inputs rather than assume portable ordering. An application-generated identifier can simplify correlation, but it changes the schema and collision-management contract. Tests need the actual deployed driver version because a mock returning one convenient key does not establish portability.”

**Example:**

```text
prepareStatement(insertSql, RETURN_GENERATED_KEYS); executeUpdate(); then inspect getGeneratedKeys in its own resource scope.
```

**Deep dive / verification:** Key retrieval may add buffering or protocol work. Verify single-row, batch and trigger behavior independently.

**Follow-ups:** Does receiving a key prove commit? No; transaction completion is separate from key allocation.

**Primary reference:** [Java 21 Statement](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Statement.html).

---

**11. A database silently truncates imported text with a warning, while the application sees no SQLException. Where should diagnostics be checked?**

**Say aloud:** “A SQL warning reports a database access warning without necessarily throwing an exception. JDBC exposes warning chains on connections, statements and result sets. I would inspect relevant warnings at a deliberate boundary before later operations clear or replace them, then classify them according to the import contract. A warning about lossy conversion might fail a strict import, while an informational warning might only require a metric. Logging every warning with raw row values can leak sensitive data and overwhelm operations. I would retain safe identifiers and codes instead. Tests should use the supported database configuration because some engines or modes reject the same conversion that another setup merely warns about.”

**Example:**

```text
After execution, traverse statement.getWarnings() through getNextWarning(); apply an explicit strict-import policy.
```

**Deep dive / verification:** O(warnings) inspection. Bound diagnostic volume and test both warning and exception paths.

**Follow-ups:** Should all warnings be ignored after success? No; successful execution may still violate the application’s data-quality contract.

**Primary reference:** [Java 21 Statement](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Statement.html).

---

**12. Statement.execute returns false after a successful update and the service reports failure. What does the boolean represent?**

**Say aloud:** “The boolean returned by execute describes the kind of the first result: true means a result set, while false means an update count or no result. It is not a success flag. For a known update I would prefer executeUpdate and interpret its count according to the business rule. For a stored procedure that can return several results I would iterate through result sets and update counts until the documented termination condition, closing results deliberately. Exceptions report execution failures, but successful execution can still affect zero rows and need domain-level handling. I would test an update, a query and an operation with no result so the adapter cannot equate false with failure.”

**Example:**

```text
After false: inspect getUpdateCount(); -1 means no update count, not that a negative number of rows changed.
```

**Deep dive / verification:** O(number of results) traversal. Multiple-result support is driver-specific; test the intended procedure contract.

**Follow-ups:** Is getMoreResults returning false the end? Only when the update count is also -1; false can describe another update count.

**Primary reference:** [Java 21 Statement](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Statement.html).

---

**Topic coverage and next set**

Nullable mappings, parameter state, cursor ownership, batch outcomes, rollback policy, connection state, savepoints, fetch hints, timeout cleanup, key correlation, warning diagnostics and result protocols. Next: test these contracts against a pinned database and Spring transaction manager, then connect chunk acceptance to durable artifact catalogs and restart reconciliation.
