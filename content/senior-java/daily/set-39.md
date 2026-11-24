# Set 39 — Privilege boundaries and trustworthy audit evidence

24 November 2026 · S39-Q01–S39-Q12

Assume Java 21 without preview features, PostgreSQL 17, Spring Boot 3.5 with Spring Security 6.5 in servlet proxy mode, and Kafka 4.0 where relevant. These are reference versions, not claims about the latest releases. Examples are original contextual SQL, configuration and protocol sketches, not runnable courses or deployed integrations. This set extends the Senior Java guide's Spring, persistence, microservices and security foundations. Practise each complete spoken answer in 45–90 seconds, then explain its verification and follow-up.

A database role is a named database identity or group used to assign authority. A runtime identity is the account used by the running application; a migration identity changes database structure during controlled releases. A proxy is a wrapper that intercepts a call before forwarding it to the actual object.

**1. A service can DROP its own tables even after DELETE is revoked. Which privilege boundary was missed?**

**Say aloud:** “Database ownership is authority over an object's definition, while DELETE is permission to remove rows. Revoking one data permission does not remove ownership or prevent an owner from restoring ordinary privileges. If the application's runtime account creates and owns production tables, a compromised service can have much more authority than its business operations require. I would separate a controlled migration identity from the runtime identity and grant only the operations the running service needs. The runtime role must also lack a path to assume the owner role. This adds credential and deployment management, but makes accidental destructive changes harder. I would verify the boundary using the actual runtime login, testing required operations and rejected schema changes in an isolated database.”

**Example:**

```text
schema_owner: owns billing objects; migration job can assume it.
billing_runtime: selected row operations; cannot assume schema_owner or alter its tables.
```

**Deep dive / verification:** Inventory ownership, inherited memberships, role-assumption rights and PUBLIC grants. PUBLIC means every database role. A successful normal request proves usability, not least privilege. Denial tests must include DROP, ALTER, TRUNCATE and granting privileges onward; ordinary data grants do not inherently authorize all four. Ownership is a security guarantee boundary, not an algorithmic complexity issue.

**Follow-ups:** Could the runtime still cause damage through UPDATE? Yes; least privilege limits authority, while business validation, scoped writes, backups and recovery still matter.

**Primary reference:** [PostgreSQL 17 privileges and ownership](https://www.postgresql.org/docs/17/ddl-priv.html).

---

**2. A restricted account can read orders but cannot insert into a serial-ID table. Why is granting INSERT insufficient?**

**Say aloud:** “A PostgreSQL serial column uses a separate sequence, an object that supplies successive numbers through a default expression. Table privileges and sequence privileges are separate. The account also needs permission to use the containing schema, which allows object lookup without granting every operation on its contents. I would inspect the failing operation and grant only the missing schema and sequence access, rather than promote the service to an owner. In this example the runtime needs INSERT on the table and USAGE on the sequence used by nextval. If the insert returns other columns, those require suitable SELECT access too. I would test the complete generated insert because an object-relational mapper, which translates objects into database operations, can request returned identifiers or issue extra queries that a simplified manual test misses.”

**Example:**

```sql
-- Context: existing billing schema, serial-backed orders.id and billing_runtime role.
GRANT USAGE ON SCHEMA billing TO billing_runtime;
GRANT INSERT ON billing.orders TO billing_runtime;
GRANT USAGE ON SEQUENCE billing.orders_id_seq TO billing_runtime;
-- Add SELECT only on columns actually read or returned by the operation.
```

**Deep dive / verification:** Inspect the real column default and sequence name instead of guessing naming conventions. This scenario specifically assumes serial/explicit nextval, not every identity-generation strategy. Schema USAGE differs from schema CREATE. Test an allowed insert, forbidden updates, and forbidden sequence resets; USAGE alone does not grant setval.

**Follow-ups:** Should all sequences be writable? No; grant access to the ones used by the runtime's supported operations and include future-object policy deliberately.

**Primary reference:** [PostgreSQL 17 GRANT](https://www.postgresql.org/docs/17/sql-grant.html).

---

**3. Existing tables work, but tomorrow's migration creates an inaccessible table. Why did the default grant miss it?**

**Say aloud:** “Default privileges are a template applied when future database objects are created; they do not repair existing objects. The important identity is the role actually creating the object. A default configured for a developer or group role does not automatically become the default for every member creating objects under its own identity. I would standardize the migration creator and configure that role's future-object grants in the intended schema. Existing objects need a separate, reviewed grant. This makes deployments predictable but requires discipline when migration tooling changes credentials or assumes roles. I would run a representative migration using the exact production role transition, then connect as the runtime account to verify both intended access and forbidden operations on the newly created object.”

**Example:**

```sql
-- Executed by an administrator authorized to configure schema_owner's defaults.
ALTER DEFAULT PRIVILEGES FOR ROLE schema_owner IN SCHEMA billing
  GRANT SELECT ON TABLES TO reporting_runtime;
-- A migration creating as migration_login instead needs that creator's defaults,
-- or must deliberately SET ROLE schema_owner before creation.
```

**Deep dive / verification:** Table defaults do not also configure sequences or functions. Test a new object and an old object separately. A per-schema REVOKE cannot undo a grant established by global default privileges; inspect both scopes. Avoid blanket grants solely to silence deployment errors.

**Follow-ups:** Does changing the default revoke an existing table's access? No; modify existing object grants explicitly and assess active consumers first.

**Primary reference:** [PostgreSQL 17 ALTER DEFAULT PRIVILEGES](https://www.postgresql.org/docs/17/sql-alterdefaultprivileges.html).

---

**4. A tenant-isolation policy passes owner-run tests but production returns every tenant's rows. What should the test identity expose?**

**Say aloud:** “Row-level security adds database policies controlling which rows a role can read or modify. Enabling it does not mean every identity is constrained equally. PostgreSQL table owners normally bypass these policies, and superusers or roles with BYPASSRLS bypass them. I would investigate the application's effective role before rewriting the predicate. The runtime should use a constrained identity; FORCE ROW LEVEL SECURITY can subject an owner to policies but does not constrain a superuser or BYPASSRLS role. I would test both allowed and denied tenant reads and writes under the real runtime login. The benefit is another enforcement layer, but a policy can still be wrong or skipped through privileged access, so owner-only tests provide misleading evidence.”

**Example:**

```text
Test identities: tenant runtime A, tenant runtime B, migration owner.
Assert: A cannot read B; A cannot insert or move a row into B; owner behavior is tested separately.
```

**Deep dive / verification:** Check USING for eligible existing rows and WITH CHECK for proposed row values. Missing policies after enabling row security default to denial for ordinary constrained access. Whole-table operations such as TRUNCATE are outside row security, so withhold those privileges. Policy evaluation can affect query plans; inspect realistic plans rather than promising zero overhead.

**Follow-ups:** Is FORCE enough if runtime can alter the table? No; an owner can change policy configuration, reinforcing the need for separated runtime authority.

**Primary reference:** [PostgreSQL 17 row security policies](https://www.postgresql.org/docs/17/ddl-rowsecurity.html).

---

**5. A connection pool reuses yesterday's tenant setting. How can transaction scope help without turning context into authentication?**

**Say aloud:** “A pooled connection is a reused database session, so committed session settings can survive beyond one request. If tenant policies read a session parameter, leaving the previous tenant there can misroute later work. I would derive tenant identity from authenticated, authorized context and establish it locally inside each explicit transaction before any tenant query. A transaction-local setting ends on commit or rollback, reducing cleanup dependence. This requires every tenant access path to follow the same transaction contract and reject missing context. It also does not make a freely settable parameter a trusted identity against arbitrary SQL execution. I would test connection reuse, exceptions and rollback with a pool of one connection, including a request that omits context entirely.”

**Example:**

```text
Begin transaction -> set_config('app.tenant_id', boundTenant, true)
-> tenant-scoped SQL -> commit/rollback. The final true requests transaction-local scope.
Use a bound value through JDBC, Java's database access API; derive it from trusted membership, not request JSON alone.
```

**Deep dive / verification:** Start with a clean pool/session baseline; a pre-existing session value can reappear after the local override ends. Make absent, blank and invalid context fail closed. Savepoint rollback to before the setting also removes it, so nested transaction behavior matters. Keep context establishment and queries on the same physical transaction. Autocommit setup followed by a separate query loses the intended scope.

**Follow-ups:** Does this defend against a compromised runtime issuing arbitrary SQL? Not by itself; a settable parameter is a context mechanism, and stronger identity isolation needs a different trust boundary.

**Primary reference:** [PostgreSQL 17 SET and SET LOCAL](https://www.postgresql.org/docs/17/sql-set.html), [transaction-local set_config](https://www.postgresql.org/docs/17/functions-admin.html#FUNCTIONS-ADMIN-SET).

---

**6. A privileged database helper reads an attacker's temporary table. Why can a correct parameterized query still be unsafe?**

**Say aloud:** “A SECURITY DEFINER function runs with its owner's database privileges rather than only its caller's privileges. Parameter binding protects values from becoming SQL syntax, but it does not decide which object an unqualified name resolves to. An unsafe search path can let an attacker substitute an object, including a temporary table, for the intended one. I would qualify sensitive object names, set a function-local search path containing only trusted schemas with the temporary schema last, and keep the function owner's authority narrow. I would also restrict who can execute the function. This can offer a small privileged operation without broad table access, but the helper becomes security-sensitive code requiring adversarial tests, not merely a convenient shared query.”

**Example:**

```text
Function option: SECURITY DEFINER SET search_path = pg_catalog, billing_private, pg_temp
Precondition: untrusted roles cannot CREATE objects in billing_private.
Create helper, revoke PUBLIC execution, and grant intended execution in one transaction.
```

**Deep dive / verification:** Grant schema USAGE where needed for callers to reach the helper. Review operator/function resolution and any dynamic SQL as well as tables. Explicitly listing pg_temp last matters; simply omitting it can permit temporary-table masking. Verify rejection with attacker-created same-name objects and unauthorized callers. Path hardening does not replace business authorization inside the helper.

**Follow-ups:** Why revoke PUBLIC immediately? New functions normally allow execution by PUBLIC; doing creation and grants atomically avoids an unintended exposure window.

**Primary reference:** [PostgreSQL 17 safe SECURITY DEFINER functions](https://www.postgresql.org/docs/17/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY).

---

**7. An annotated Spring repair operation runs for an unauthorized caller. Why is seeing PreAuthorize in source insufficient?**

**Say aloud:** “Method authorization checks permission when an operation is invoked, rather than relying only on the HTTP route. In Spring Security's default proxy approach, an interceptor around the managed bean performs that check. An annotation is not proof that the interceptor is active or that the call traverses it. I would enable method security explicitly, identify the actual bean and call path, and place the protected operation behind a managed service boundary used by all entry points. A plain object created with new or a same-object call can avoid that proxy boundary. I would test an unauthorized invocation through the application context and assert that no repair effect occurs. This adds configuration and test work but protects alternative callers such as jobs or message handlers.”

**Example:**

```text
Controller or scheduled adapter -> injected secured repair service proxy -> operation.
Test principal without repair authority: denied before the first database mutation.
Explicitly define authenticated system authority for jobs; do not silently bypass checks.
```

**Deep dive / verification:** Boot's security starter alone does not enable method security. Include authorized and denied tests, and invoke the real context-managed bean rather than a hand-built test object. Review proxyability and all alternate entry points. Method permission still needs tenant and object scope; a broad repair authority is not permission to mutate every tenant.

**Follow-ups:** Is post-authorization suitable for preventing a destructive write? Prefer a precondition before the effect; denying a returned result after execution does not inherently undo the write.

**Primary references:** [Spring Security 6.5 method security](https://docs.spring.io/spring-security/reference/6.5/servlet/authorization/method-security.html), [Spring proxy self-invocation semantics](https://docs.spring.io/spring-framework/reference/6.2/core/aop/proxying.html).

---

**8. Adding a custom web security chain unexpectedly exposes an Actuator endpoint. Which assumptions should be retested?**

**Say aloud:** “Actuator provides operational endpoints such as health and configuration inspection. Exposure decides whether an endpoint is remotely available; authorization decides who may use it. In Spring Boot 3.5, adding a custom SecurityFilterChain makes the automatic web security configuration back off, so I must deliberately secure the operational surface as well as the business API. I would expose only needed endpoints, define ordered matching rules for management and application requests, and test the effective deployment ports and paths. A separate management port can help network isolation but is not an authorization policy by itself. The trade-off is more explicit configuration, with the benefit that operators' access and public health access become intentional contracts instead of assumptions about defaults.”

**Example:**

```text
Required outcomes: anonymous minimal health allowed if policy permits;
anonymous configuration inspection denied; authorized operator access narrowly allowed;
unmatched application paths still receive an explicit security rule.
```

**Deep dive / verification:** Test endpoint availability and permission separately; a 404 from a disabled endpoint does not prove authorization for an enabled one. Include changed base paths, management ports, chain ordering and public ingress routing. Keep sensitive values minimized even for operators. Do not disable browser security controls merely to make a management POST pass.

**Follow-ups:** Does an Actuator-only chain secure everything else? No; configure a chain covering the remaining application surface as well.

**Primary reference:** [Spring Boot 3.5 endpoint exposure and security](https://docs.spring.io/spring-boot/3.5/reference/actuator/endpoints.html).

---

**9. A Kafka consumer can read its topic but fails when joining a new group. Why should the fix avoid wildcard permissions?**

**Say aloud:** “An access-control list, or ACL, maps a principal, the caller's authenticated identity, to permitted operations on particular Kafka resources. A topic and a consumer group are different resources. Reading topic data does not automatically authorize joining a group or committing its progress. If a deployment changes the group ID, existing topic permissions may be correct while group authorization fails. I would inspect the exact principal, group ID, resource pattern and denied operation, then grant the narrow group access required by the intended deployment. A broad wildcard can hide the error while allowing the service to interfere with unrelated workloads. I would test real consumer startup, fetching and offset commits with the production permission shape, plus a negative test against an unrelated group.”

**Example:**

```text
Principal shipment_reader: READ on topic shipments;
READ on group shipment_projection_v2, with required describe access.
A rename to shipment_projection_v3 is a reviewed permission and replay transition.
```

**Deep dive / verification:** Inspect effective literal, prefixed and wildcard ACLs, including denies and configured superusers. Some permissions imply others; validate the actual broker rules rather than inventing a generic role hierarchy. Group authorization protects group operations, not tenant fields inside records. Changing the group can also change replay position, independently of whether authorization succeeds.

**Follow-ups:** Why test commits after successful fetch? Different protocol operations exercise different resource checks; a socket connection or metadata request is insufficient evidence.

**Primary reference:** [Kafka 4.0 authorization and ACL resource checks](https://kafka.apache.org/40/security/authorization-and-acls/).

---

**10. An invoice API accepts a correctly signed token intended for a calendar API. What is missing from validation?**

**Say aloud:** “A token signature establishes integrity under a trusted signing key; it does not establish that this service is the intended recipient. The audience identifies the resource server a token targets. An invoice service must reject a calendar-only token even when the issuer and signature are valid. For a signed JSON access token following the OAuth authorization protocol, I would validate the expected token type, issuer, permitted signing algorithms, signature, time constraints and audience, then enforce operation scope and resource ownership. I would obtain a properly targeted downstream token instead of forwarding a token merely because another service accepts its issuer. The trade-off is token issuance and configuration complexity, but audience separation limits cross-service replay and prevents trust in one API from silently granting entry to another.”

**Example:**

```text
Token: trusted issuer, aud = calendar-api, scope = read.
Invoice API: reject wrong audience; a generic read string does not change the recipient.
A correctly targeted invoice token still needs invoice-specific authorization.
```

**Deep dive / verification:** Test a validly signed wrong-audience token, an identity token (login evidence) substituted for an access token (API authority), expired tokens, and insufficient scope. Configure exact accepted identifiers; do not use substring matching. Tests should inspect denial before data access. Resource indicators help clients request tokens for intended resources when supported by the authorization server.

**Follow-ups:** Does audience restriction stop theft and replay at the intended API? No; bearer-token protection, transport security and appropriate lifetime or sender constraints remain separate concerns.

**Primary references:** [RFC 9068 access-token validation](https://www.rfc-editor.org/rfc/rfc9068.html#section-4), [RFC 8707 resource indicators](https://www.rfc-editor.org/rfc/rfc8707.html).

---

**11. A repair commits but its success audit message disappears during a crash. Which evidence should commit with the change?**

**Say aloud:** “A success audit record is durable evidence of a committed action, while a normal application log is often buffered and independently delivered. Logging success after commit leaves a crash window where the data changed but the evidence is absent. For a repair whose audit completeness is mandatory, I would insert the operation's audit fact in the same database transaction as the mutation. Either both commit or neither does. An external reporting pipeline can later copy that fact using a stable operation ID, accepting replay and deduplicating there. This couples repair availability to audit storage, which is appropriate only when the requirement demands it. I would inject failure before commit and after commit, then reconcile database state and evidence rather than trust the HTTP response.”

**Example:**

```text
Transaction: validate approved operation -> conditional repair -> insert audit fact -> commit.
Audit fact: operation ID, trusted actor, tenant, approved change reference, actual outcome.
Reporter: copies committed facts; retries use the same event identity.
```

**Deep dive / verification:** A timeout after commit remains ambiguous to the caller; recover the stored outcome using the operation ID. An audit insertion failure must abort the repair instead of being caught and ignored. This guarantees local atomicity, not instant delivery or permanent immutability in another store. Bound retained audit data and monitor reporting backlog; avoid putting full secrets or sensitive payloads into the fact.

**Follow-ups:** Where do denied attempts belong? A separate security-event path, since a transaction rolled back with the attempted mutation cannot preserve its own inserted denial record.

**Primary reference:** [PostgreSQL 17 transaction atomicity](https://www.postgresql.org/docs/17/tutorial-transactions.html). The audit protocol is an illustrative application design built on that local guarantee.

---

**12. The same administrator can edit repairs and erase their audit trail. Does append-only application code make the evidence trustworthy?**

**Say aloud:** “Append-only means the normal writer adds records instead of changing prior ones. That is useful behavior, but it does not prevent a more privileged identity from deleting or rewriting the storage. I would define the threat model: which administrators, service credentials and storage failures must the evidence withstand? Then I would separate audit administration from repair execution, restrict mutation and deletion rights, export to independently controlled retention, and monitor gaps or delivery failures. Cryptographic linking can reveal some modifications only if a trusted checkpoint survives outside the attacker's control; it does not make deletion impossible. These controls cost storage and operational coordination. I would verify them with deletion-denial tests and a recovery drill that proves retained evidence is still readable and attributable.”

**Example:**

```text
Repair operator: requests approved operations, cannot delete retained audit objects.
Audit writer: append authority only; retention administration is a separate identity.
Independent monitor: checks delivery lag, expected operation coverage and retention failures.
```

**Deep dive / verification:** Minimize personal data, define retention and authorized deletion policy, and exclude credentials. Record stable operation IDs and trusted actor identity; timestamps alone cannot correlate every concurrent event. Reconcile committed operations against facts rather than assume an unbroken counter proves completeness. A denied-attempt logging outage needs an explicit availability policy and alerting; it must not silently authorize the denied operation.

**Follow-ups:** Does hashing each record prove completeness? No; without an independent expected inventory or trusted checkpoint, missing records or a replaced history can remain undetected.

**Primary reference:** [OWASP logging protection and verification guidance](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html). Separation and reconciliation above are illustrative design choices, not a claim of compliance certification.

---

### Topic coverage

S39-Q01–Q03: runtime ownership, serial sequences and future-object grants. Q04–Q06: row policies, pooled session scope and privileged helpers. Q07–Q08: Spring method and operational endpoint boundaries. Q09–Q10: Kafka resource permissions and OAuth audiences. Q11–Q12: crash-safe audit facts, independent retention and evidence limits. These are authorization and protocol guarantees; algorithmic big-O is not the governing cost. Evaluate policy query plans, authorization latency, audit storage and reporting backlog under realistic load.

### Next set

Build on these boundaries with authorization changes during long-running work, revocation timing, service-to-service delegation and policy rollout testing. Return to concurrency and coding through new scenarios rather than repeating tenant-context cleanup, repair replay or Java linkage questions.
