# Part 22 - Micronaut and Spring Boot: Foundations to Internals (Q293-Q320)

Twenty-eight questions for a Spring Boot developer learning Micronaut, or a beginner choosing a first service framework. Read in order: vocabulary first, then bean creation, request handling, persistence and production decisions. Each question has the same four-tier ladder as Part 21.

| Tier | Purpose |
|---|---|
| 1. Foundation | Definition, vocabulary and a small concrete example |
| 2. Core answer | A spoken answer of about 30 seconds |
| 3. Follow-ups | Warm-up, applied and senior probes with expected reasoning |
| 4. Deep dive | Internals, a failure, a trade-off and verification |

**Comparison baseline:** Java 21, Micronaut Framework 4.x and Spring Boot 3.5 / Spring Framework 6.2. These are learning baselines, not recommendations to deploy a particular patch. Micronaut modules have independent versions; resolve them through the matching platform BOM. Current module guides may describe newer releases: verify APIs and defaults against the versions in your build. No claim here means Spring Boot lacks AOT or reactive HTTP support.

**Example scope:** the examples below are interview scenarios and annotation references, not runnable applications or measured benchmarks. No framework service, native executable, database or identity provider is deployed by this chapter. Verification prompts describe tests to run in a real project. Nulls, missing configuration, duplicate requests, concurrency, cancellation and ambiguous outcomes appear where they affect the decision.

| Learning stage | Questions | Continue from |
|---|---|---|
| Beginner: differences and vocabulary | Q293–Q296 | Start here |
| Intermediate: bean and HTTP contracts | Q297–Q302 | Constructor injection and basic REST |
| Advanced: data, security and testing | Q303–Q308 | Transactions and API contracts |
| Deep: builds, native images and migration | Q309–Q312 | Evidence from a working service |
| Framework mechanics and production extensions | Q313–Q320 | Revisit after the corresponding core topic |

For Spring prerequisites, read [Spring annotation foundations](/senior-java-interview/part-13#spring-boot-annotations-usage-to-internals-to-senior-diagnosis). For persistence, read [Hibernate and SQL](/senior-java-interview/part-16).

**Suggested second pass:** after DI read [Q313](#q313-how-do-named-primary-replaces-and-factory-solve-different-problems) and [Q314](#q314-when-should-you-use-eachproperty-and-eachbean); after HTTP read [Q315](#q315-how-do-micronaut-http-filters-differ-from-spring-servlet-filters-and-interceptors) and [Q316](#q316-how-do-reactive-demand-and-java-virtual-threads-change-the-execution-model); after clients read [Q317](#q317-how-are-retries-circuit-breakers-bulkheads-and-fallbacks-different); after lifecycle read [Q318](#q318-are-application-events-and-scheduled-jobs-durable-or-cluster-wide); after data read [Q319](#q319-what-changes-when-migrating-spring-cache-annotations-to-micronaut-cache) and [Q320](#q320-how-do-kafka-listener-acknowledgments-interact-with-database-commits).

## Beginner: understand the differences

### Q293 What is Micronaut and how does it differ from Spring Boot

**Tier 1 - Foundation**

A framework supplies application plumbing such as dependency injection (DI), HTTP routing and configuration. Micronaut emphasizes generated metadata at compilation. Spring Boot configures an application built on Spring. For example, both can expose a product lookup backed by an injected service.

**Tier 2 - Core answer (30-second version)**

> Compare when framework work happens, available integrations and operational fit. Micronaut moves much discovery work into compilation. Conventional Spring applications do more at startup, while Spring also supports AOT. Neither framework choice alone establishes better latency or lower total cost. [Micronaut core](https://docs.micronaut.io/5.2.x/core/), [Spring AOT](https://docs.spring.io/spring-framework/reference/core/aot.html).

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Is Boot a replacement JVM?**

*Expected reasoning:* no; an ordinary Boot or Micronaut artifact runs on a JVM. Native packaging is a separate choice.

**Probe 2 (applied): Your service spends most time waiting for SQL. Will switching fix latency?**

*Expected reasoning:* first measure query time, connection waits and network latency; framework startup changes may not affect the bottleneck.

**Probe 3 (senior): What would justify a migration?**

*Expected reasoning:* a measured deployment constraint and a credible migration benefit after integration, training and support costs.

**Tier 4 - Deep dive**

**Internals:** separate build work, startup work and work on every request in your explanation. Use this comparison to open an interview answer, then defend it with a concrete workload:

| Dimension | Micronaut | Spring Boot |
|---|---|---|
| DI and AOP | Generated definitions and interception machinery are central to the design | Conventional runtime discovery/proxies, with a supported AOT path |
| HTTP execution | Common Netty setup makes event-loop discipline important | Distinguish servlet MVC from reactive WebFlux before comparing |
| Persistence | Choose Data JDBC, JPA or R2DBC deliberately | Choose Spring Data module and persistence backend deliberately |
| Native packaging | Requires compatible libraries and a tested native build | Requires compatible libraries, Spring AOT and a tested native build |
| Decision evidence | Equivalent readiness, memory, throughput and failure tests | The same measurements and acceptance criteria |

The table compares architectural choices; it does not rank frameworks or imply that all applications use these defaults.

**Realistic failure:** a team replaces its framework while retaining an unindexed query, then sees the same slow requests.

**Trade-off:** potential footprint improvements must pay for migration and ecosystem costs.

**How to verify:** profile equivalent services with the same database, payloads, JVM flags and resource limits.

### Q294 Does compile-time DI mean every dependency is resolved during compilation

**Tier 1 - Foundation**

DI means the container supplies a collaborator instead of application code constructing it everywhere. Metadata describes how to create a bean. An instance is the actual object. Generating the recipe does not create the production database connection during compilation.

**Tier 2 - Core answer (30-second version)**

> Micronaut generates bean metadata, then creates objects in an application context. Environment-dependent availability and external resources still matter at runtime. Compilation is one validation boundary, not proof that production can start. [DI guide](https://guides.micronaut.io/latest/micronaut-dependency-injection-types.html).

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Why prefer constructor injection?**

*Expected reasoning:* it makes required collaborators explicit and supports direct unit construction.

**Probe 2 (applied): Two implementations satisfy the same interface. What happens?**

*Expected reasoning:* define the intended selection with qualifiers or an appropriate primary bean; do not depend on discovery order.

**Probe 3 (senior): How would you diagnose a missing production bean?**

*Expected reasoning:* inspect generated metadata, packaging, conditions and effective configuration before adding arbitrary scanning settings.

**Tier 4 - Deep dive**

**Internals:** generated definitions and runtime object creation are different phases. A Micronaut `BeanDefinition` describes constructor arguments, injected members, qualifiers, scope and lifecycle methods. When a bean is requested, the context uses eligible definitions to resolve its collaborators and construct the scoped object. A definition is not the object itself. See the [BeanDefinition API](https://docs.micronaut.io/4.9.7/api/io/micronaut/inject/BeanDefinition.html).

**Walkthrough:** an order service needs a payment gateway. Compilation can generate the service's construction metadata without knowing the production endpoint or credentials. At runtime, conditions select the eligible gateway, configuration supplies its endpoint, and construction may still fail. If gateway creation requires the order service in return, there is a dependency cycle; a provider can defer a lookup but does not remove a cycle that is immediately traversed. Prefer moving shared policy into a third dependency over disguising the cycle.

**Realistic failure:** an IDE build misses annotation processing and the packaged artifact cannot obtain a collaborator.

**Trade-off:** earlier metadata generation makes compiler configuration part of application correctness.

**How to verify:** clean-build the artifact in CI and start its context with both valid and deliberately missing dependencies.

### Q295 How do the common Spring and Micronaut annotations map

**Tier 1 - Foundation**

An annotation declares intent to a framework. Similar intent does not imply identical behavior or interchangeable imports.

| Intent | Spring / Boot | Micronaut |
|---|---|---|
| Register a typical service | `@Service` | `jakarta.inject.Singleton` |
| Select a collaborator | `@Qualifier` | `jakarta.inject.Named` or a qualifier |
| Construct third-party objects | `@Configuration` and `@Bean` | `@Factory` and a scoped producer |
| Handle an HTTP route | `@RestController`, `@GetMapping` | `@Controller`, `@Get` |
| Bind a configuration group | `@ConfigurationProperties` | `@ConfigurationProperties` from Micronaut |
| Conditional availability | Boot `@ConditionalOnProperty` | `@Requires` |
| Start an integration test context | `@SpringBootTest` | `@MicronautTest` |

**Tier 2 - Core answer (30-second version)**

> Translate the contract, not just the annotation name. Check scope, imports, route behavior, validation and test lifecycle. A compiler accepting an annotation is not proof the selected framework processes it. [Micronaut core reference](https://docs.micronaut.io/5.2.x/core/).

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Are the two ConfigurationProperties annotations the same type?**

*Expected reasoning:* no; the simple names match but the packages and binding contracts differ.

**Probe 2 (applied): A factory creates a vendor SDK client. Who closes it?**

*Expected reasoning:* specify ownership and the supported destruction hook; avoid leaked pools and duplicate clients.

**Probe 3 (senior): How do you review a bulk annotation conversion?**

*Expected reasoning:* inventory observable contracts and migrate one tested boundary at a time.

**Tier 4 - Deep dive**

**Internals:** annotations only work when their supporting processor or runtime integration recognizes them.

**Realistic failure:** an imported Spring stereotype remains in a module without compatible Spring annotation support.

**Trade-off:** compatibility modules can ease transition but expand the behavior matrix to verify.

**How to verify:** assert bean selection, lifecycle and HTTP results through the actual context, rather than checking annotation text.

### Q296 Is Micronaut always faster and smaller than Spring Boot

**Tier 1 - Foundation**

Startup time, readiness time, resident memory, allocation rate, throughput and tail latency measure different things. A service can start quickly but be slower at its first database query.

**Tier 2 - Core answer (30-second version)**

> There is no universal winner. Benchmark the actual workload, including dependencies, warm-up, container limits and JVM versus native mode. Use repeated measurements and an explicit target such as time to the first successful business request. Framework labels are not benchmark results.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Is a startup log line a readiness measurement?**

*Expected reasoning:* not necessarily; required pools, migrations or remote dependencies may still be unavailable.

**Probe 2 (applied): One service has security enabled and the other does not. Is the comparison fair?**

*Expected reasoning:* no; equalize behavior and dependencies before interpreting results.

**Probe 3 (senior): How do you compare scale-to-zero economics?**

*Expected reasoning:* include cold starts, build cost, minimum instances, burst behavior and cost per successful request.

**Tier 4 - Deep dive**

**Internals:** class loading, initialization, JIT compilation and dependency setup affect different phases.

**Realistic failure:** an attractive idle-memory result hides worse p99 latency under sustained load.

**Trade-off:** optimize for the workload's constraints rather than one headline number.

**How to verify:** publish a reproducible workload, error rate, repetitions and confidence range alongside resource usage.

## Intermediate: beans and request execution

### Q297 How do scopes and lifecycle differ from thread safety

**Tier 1 - Foundation**

A scope controls object lifetime and sharing. Micronaut offers singleton and prototype scopes; Spring offers corresponding scope choices. A singleton shared by concurrent requests must still protect mutable state. [Micronaut DI types](https://guides.micronaut.io/latest/micronaut-dependency-injection-types.html).

**Tier 2 - Core answer (30-second version)**

> Scope is not synchronization. Keep shared services stateless when practical, and make request identity explicit. A prototype injected once into a singleton does not automatically become a fresh object on each method call; use an appropriate provider or scope boundary.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Can a singleton hold the current customer's ID?**

*Expected reasoning:* a mutable field would mix concurrent users; pass identity explicitly or use supported request context.

**Probe 2 (applied): Why did a lazy dependency fail only on the first request?**

*Expected reasoning:* context creation did not exercise its construction path; readiness needs deliberate coverage.

**Probe 3 (senior): What changes during shutdown with requests in flight?**

*Expected reasoning:* coordinate admission, bounded draining and resource closure; cancellation may be cooperative.

**Tier 4 - Deep dive**

**Internals:** the container manages object ownership; the application manages safe state transitions. In the baseline Micronaut container, singleton definitions are normally lazy; `@Context` requests initialization with the context. Application builders or generated application configuration can enable eager initialization, so inspect the actual startup configuration. Conventional Spring singleton startup is typically eager unless lazy behavior is configured. [Micronaut Context scope](https://docs.micronaut.io/4.8.9/api/io/micronaut/context/annotation/Context.html).

Construction, dependency injection, `@PostConstruct` and eventual `@PreDestroy` represent different lifecycle stages. Keep initialization bounded and define what must succeed before readiness. For example, validate a required endpoint before traffic, but avoid making every optional cache warm-up a reason to restart the service. Do not assume shutdown callbacks run after an abrupt process kill; durable work needs recovery on the next start.

**Realistic failure:** one singleton's customer field leaks data between requests.

**Trade-off:** shared reusable clients reduce allocations but require correct lifecycle and concurrent use.

**How to verify:** overlap requests for different identities, then close the context while work is pending and assert bounded cleanup.

### Q298 How do conditions and configuration replace Boot auto-configuration

**Tier 1 - Foundation**

A conditional bean is available only when requirements hold. Micronaut `@Requires` can express properties, environments and bean availability. Boot has conditional auto-configuration. Neither means every production choice is fixed by Java compilation. [Requires API](https://docs.micronaut.io/4.9.1/api/io/micronaut/context/annotation/Requires.html).

**Tier 2 - Core answer (30-second version)**

> Define explicit defaults and typed configuration, then validate invariants before accepting traffic. Test missing, empty and conflicting settings. Treat feature-off and integration-misconfigured as separate states; silently falling back can send traffic to the wrong destination.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Is a missing value equivalent to an empty string?**

*Expected reasoning:* not generally; binding, defaults and validation determine the result.

**Probe 2 (applied): Why does a test obtain a fake gateway in production mode?**

*Expected reasoning:* inspect environment activation, conditions and replacement rules; ensure the fake cannot satisfy production wiring.

**Probe 3 (senior): Does changing a property refresh every existing singleton?**

*Expected reasoning:* do not assume dynamic rebinding; define supported refresh scope and in-flight behavior explicitly.

**Tier 4 - Deep dive**

**Internals:** conditional availability and value binding are separate checks. Diagnose configuration in order: which sources are present, which source wins for a key, whether conversion succeeds, whether validation succeeds, and which beans become eligible. A property name copied from Boot has no effect unless Micronaut or application code binds it.

**Walkthrough:** a packaged default says the gateway is disabled, but deployment configuration enables it and supplies a blank endpoint. The correct result is an explicit invalid-configuration failure before traffic, not silent fallback to a fake implementation. Record the selected mode and safe source information in diagnostics without logging credentials. Prove precedence with an isolated test containing two conflicting values; avoid memorizing one framework's source order and applying it to the other.

**Realistic failure:** a typo disables the real gateway and accidentally activates a permissive fallback.

**Trade-off:** flexible defaults reduce setup effort but can hide unsafe deployment states.

**How to verify:** start contexts with a configuration matrix and assert the selected implementation and failure message without exposing secrets.

### Q299 How does Micronaut AOP differ from Spring proxy AOP

**Tier 1 - Foundation**

Aspect-oriented programming adds behavior around calls, such as timing or transactions. Micronaut generates interception machinery during compilation. Spring AOP commonly uses runtime proxies. Both require an eligible method and a supported invocation path. [Micronaut Around API](https://docs.micronaut.io/4.9.1/api/io/micronaut/aop/Around.html), [Spring proxying](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html).

**Tier 2 - Core answer (30-second version)**

> Spring proxy self-invocation normally bypasses advice. Micronaut's default subclass-based around advice can intercept eligible calls from within the class, while proxy-target configurations differ. Avoid copying either rule universally. Verify the concrete advice, method visibility and generated proxy mode.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Does manually constructing the service preserve advice?**

*Expected reasoning:* ordinary direct construction bypasses container-provided interception.

**Probe 2 (applied): Does a private helper become transactional just by adding an annotation?**

*Expected reasoning:* private methods cannot be overridden by a subclass proxy; put the boundary on a supported entry point.

**Probe 3 (senior): Why can retry and transaction ordering change outcomes?**

*Expected reasoning:* retries inside a failed transaction differ from fresh transactions per attempt; determine interceptor order and prove rollback behavior.

**Tier 4 - Deep dive**

**Internals:** default Micronaut around advice subclasses the target and invokes the original method through a super call; proxy-target mode delegates differently. The interceptor chain is selected from advice metadata, and each interceptor can proceed, alter the result or fail the call. Private methods cannot be overridden; final classes or methods constrain subclass advice. Constructor execution is not an ordinary advised method call.

**Call-path exercise:** with supported default subclass advice, an external call to an advised method and an eligible virtual self-call can enter the interception chain. With ordinary Spring proxy AOP, a self-call on the target bypasses the external proxy. Neither statement grants advice to an object created with `new`, and neither replaces checking the actual annotation's proxy configuration. For a retrying transaction, sketch the chain explicitly: retry outside transaction can create a fresh transaction per attempt; transaction outside retry can reuse a transaction already marked rollback-only.

**Realistic failure:** a migration assumes every self-call bypasses advice and introduces an unnecessary second transaction boundary.

**Trade-off:** generated interception shifts constraints to compilation but does not remove invocation semantics.

**How to verify:** call through the container, count actual interceptor executions for external and internal calls, and test the selected mode.

### Q300 Why must blocking work leave the HTTP event loop

**Tier 1 - Foundation**

An event loop multiplexes network work. A blocking JDBC call occupies its thread while waiting. Micronaut's common Netty server setup requires deliberate execution placement; Spring MVC and WebFlux have different execution models. [Micronaut HTTP](https://docs.micronaut.io/5.2.x/http/), [Boot reactive web](https://docs.spring.io/spring-boot/3.5/reference/web/reactive.html).

**Tier 2 - Core answer (30-second version)**

> In Micronaut, use an appropriate executor boundary such as ExecuteOn for blocking work and confirm the configured thread-selection policy. Moving work off the event loop still needs bounded concurrency, timeouts and rejection behavior. A reactive return type alone does not make JDBC nonblocking.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Is Thread.sleep safe on an event loop?**

*Expected reasoning:* it blocks that thread and delays unrelated connections.

**Probe 2 (applied): Does wrapping a blocking call in a publisher fix it?**

*Expected reasoning:* only if execution actually moves to an appropriate scheduler; creation and subscription location matter.

**Probe 3 (senior): Will an unlimited worker pool solve overload?**

*Expected reasoning:* it can amplify pressure on the database; align admission and concurrency with downstream capacity.

**Tier 4 - Deep dive**

**Internals:** distinguish request dispatch, blocking execution and response completion threads. `@ExecuteOn` selects a named executor boundary; it does not turn the underlying database driver into a nonblocking driver. Also inspect filters and client callbacks: moving a controller does not automatically make unrelated earlier or later blocking work safe.

**Capacity exercise:** a service has a pool of 20 database connections. Offloading 2,000 requests to workers or virtual threads cannot produce 2,000 simultaneous database operations. Most requests wait for a connection. Limit admitted work, bound acquisition time and leave enough end-to-end budget to execute the query and return the response. Otherwise the event loop remains responsive while user requests still expire in a hidden queue.

**Realistic failure:** a slow SQL query on an event loop delays an otherwise cheap health endpoint.

**Trade-off:** offloading protects multiplexing but introduces queues and context propagation boundaries.

**How to verify:** inject database latency and inspect event-loop stacks, queue depth, health latency and rejected requests.

### Q301 How do you migrate REST binding, validation and errors

**Tier 1 - Foundation**

An HTTP contract includes route, method, body, media type, validation, response status and error shape. Matching a controller method signature is only part of the migration.

**Tier 2 - Core answer (30-second version)**

> Preserve observable behavior with request fixtures. Test missing fields, explicit null, malformed JSON and unsupported content types. Use framework validation and error handling intentionally, and expose stable safe error codes rather than exception internals. [Micronaut HTTP reference](https://docs.micronaut.io/5.2.x/http/).

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Is an absent request body the same as an empty object?**

*Expected reasoning:* no; binding and validation can reject them at different stages.

**Probe 2 (applied): An entity is absent. Should the API return an empty successful object?**

*Expected reasoning:* follow the published absence contract, commonly a deliberate 404; do not let framework defaults decide accidentally.

**Probe 3 (senior): How do you avoid leaking SQL details on failure?**

*Expected reasoning:* map exceptions to safe errors, log restricted diagnostics with correlation IDs, and test negative responses.

**Tier 4 - Deep dive**

**Internals:** binding failures can occur before the service or its local error-handling code runs.

**Realistic failure:** a migrated API returns 500 for invalid input that previously produced 400.

**Trade-off:** centralized mapping improves consistency but must preserve domain-specific distinctions.

**How to verify:** replay a golden set of valid and invalid requests against both implementations and compare status, headers and JSON.

### Q302 How do declarative clients, retries and cancellation interact

**Tier 1 - Foundation**

A declarative client describes an HTTP call as an interface. Micronaut's client annotations are not interchangeable with Spring HTTP interfaces or a third-party Feign integration. [Micronaut HTTP clients](https://docs.micronaut.io/5.2.x/http/).

**Tier 2 - Core answer (30-second version)**

> Specify deadlines, connection limits, retryable failures and idempotency independently of client syntax. A lost response can leave the remote action committed. Local cancellation or a timeout does not prove the remote work stopped. Reconcile unknown outcomes before retrying writes.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Is every 500 safe to retry?**

*Expected reasoning:* no; determine operation semantics and whether side effects may already have occurred.

**Probe 2 (applied): A payment times out after submission. What next?**

*Expected reasoning:* reuse an idempotency key and query the operation state according to the provider contract.

**Probe 3 (senior): How do nested retries amplify traffic?**

*Expected reasoning:* attempts multiply across layers; allocate one end-to-end deadline and a controlled retry budget.

**Tier 4 - Deep dive**

**Internals:** connection acquisition, connection establishment and response waiting consume different portions of the budget.

**Realistic failure:** timed-out callers retry while original writes continue, creating duplicates.

**Trade-off:** retries improve transient availability while increasing load and outcome ambiguity.

**How to verify:** delay a response after the server commits, cancel the caller and repeat the key; assert one business effect.

## Advanced: persistence, security and tests

### Q303 How does Micronaut Data differ from Spring Data

**Tier 1 - Foundation**

A repository presents persistence operations through an interface. Micronaut Data precomputes repository queries during compilation, but database I/O still happens at runtime. Compile-time checking cannot guarantee the deployed schema is correct. [Micronaut Data](https://micronaut-projects.github.io/micronaut-data/latest/guide/).

**Tier 2 - Core answer (30-second version)**

> Compare repository generation separately from the storage backend. Micronaut Data JDBC, JPA and R2DBC have different persistence and execution models. Porting a repository method name does not establish equivalent SQL, pagination, transaction or locking behavior.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Can compilation detect every bad production query?**

*Expected reasoning:* no; permissions, schema drift, data distribution and vendor behavior remain runtime concerns.

**Probe 2 (applied): Why does pagination become unstable?**

*Expected reasoning:* missing deterministic ordering or concurrent changes can repeat or omit rows; define stable ordering and pagination semantics.

**Probe 3 (senior): How do you review a dialect migration?**

*Expected reasoning:* inspect generated SQL and real query plans with production-like volumes and the intended database version.

**Tier 4 - Deep dive**

**Internals:** query generation, parameter binding, execution and result mapping are separate stages.

**Realistic failure:** a compiled repository deploys before its required schema migration.

**Trade-off:** earlier repository validation improves feedback without replacing database integration tests.

**How to verify:** run migrations and repository tests on the target database, including empty results, duplicates and boundary pages.

### Q304 Can you replace Hibernate with JDBC by changing a dependency

**Tier 1 - Foundation**

An ORM manages entity state and relationships. Direct JDBC-style repositories do not supply the same persistence context, lazy loading or dirty checking. Micronaut Data supports distinct backends, so select the desired semantics. [Data backend choices](https://micronaut-projects.github.io/micronaut-data/latest/guide/).

**Tier 2 - Core answer (30-second version)**

> A JPA-to-JDBC migration changes the persistence model. Make writes and relationship fetching explicit, preserve optimistic locking and test aggregate boundaries. Keeping Micronaut Data JPA initially can reduce the number of simultaneous changes.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Does modifying a loaded object necessarily update a JDBC row?**

*Expected reasoning:* no; issue an explicit supported update rather than assuming dirty checking.

**Probe 2 (applied): How can an endpoint lose nested data?**

*Expected reasoning:* previous lazy access or fetch configuration may no longer apply; define the required projection or join.

**Probe 3 (senior): Two requests update the same version. What must remain true?**

*Expected reasoning:* use an atomic version predicate and surface a conflict instead of silently losing one update.

**Tier 4 - Deep dive**

**Internals:** object identity inside a persistence context is different from repeated row mapping.

**Realistic failure:** an update mutates an in-memory object and returns success without persisting it.

**Trade-off:** explicit SQL behavior can improve predictability but increases responsibility for aggregate persistence.

**How to verify:** reload from a separate transaction, test competing writers and assert query counts for relationships.

### Q305 What must you verify about transactions and async boundaries

**Tier 1 - Foundation**

A transaction groups database operations under a consistency boundary. An annotation selects interception behavior; it does not make remote HTTP calls atomic with the database. [Micronaut Data transactions](https://micronaut-projects.github.io/micronaut-data/latest/guide/#transactions).

**Tier 2 - Core answer (30-second version)**

> Verify manager selection, propagation, rollback rules and the real interception path. Do not assume an arbitrary executor task inherits a thread-bound transaction. For reactive access, use supported reactive transaction context rather than transferring a JDBC connection across threads.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): If an exception is caught, will rollback always happen?**

*Expected reasoning:* no; inspect rollback-only state and the actual transaction contract, including checked exceptions.

**Probe 2 (applied): The database commits but event publication fails. What now?**

*Expected reasoning:* use an outbox or another explicit recovery protocol, with duplicate-safe consumption.

**Probe 3 (senior): Can retrying a transaction repeat external effects?**

*Expected reasoning:* yes; exclude irreversible effects from retried transaction bodies or give them durable idempotency semantics.

**Tier 4 - Deep dive**

**Internals:** transaction ownership and completion must follow the chosen imperative or reactive execution model. For an imperative transaction, identify the manager and connection that own the work. For a reactive transaction, identify the subscription and supported context carrying it. Merely returning a future or publisher does not establish that all deferred work is enclosed in the transaction.

**Failure walkthrough:** an order transaction inserts an order and publishes an HTTP notification. If the notification succeeds and the database rolls back, the receiver has observed an order that does not exist. Reversing the order leaves the opposite gap after commit. An outbox stores the order and publication intent atomically in one database transaction, then publishes with retries. The publisher can crash after sending but before marking completion, so consumers must tolerate duplicates; the annotation cannot provide cross-system exactly-once behavior.

**Realistic failure:** background work runs after the initiating transaction closes and partially applies changes.

**Trade-off:** short transactions reduce locking but require deliberate coordination with external effects.

**How to verify:** force failures before and after commit, inspect durable rows, and redeliver events concurrently.

### Q306 What is the difference between introspection and serialization

**Tier 1 - Foundation**

Introspection exposes bean metadata; serialization converts values to a wire representation. Micronaut Serialization is a separate integration with opt-in types such as Serdeable. Introspected alone is not a universal JSON serialization contract. [Serialization guide](https://micronaut-projects.github.io/micronaut-serialization/latest/guide/).

**Tier 2 - Core answer (30-second version)**

> Identify whether the service uses Micronaut Serialization or Jackson Databind, then configure DTO support for that integration. Preserve field names, null rules, date formats and allowed inputs. Avoid exposing persistence entities as accidental public schemas.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Does a Java field rename preserve its JSON name?**

*Expected reasoning:* only if the explicit mapping or serializer contract preserves it.

**Probe 2 (applied): What if an older caller omits a newly required field?**

*Expected reasoning:* define compatibility behavior; avoid silently assigning a value that changes business meaning.

**Probe 3 (senior): How do you prevent a request from setting administrative fields?**

*Expected reasoning:* use explicit input DTOs and authorization; serializer configuration alone is not an access-control boundary.

**Tier 4 - Deep dive**

**Internals:** generated metadata and wire-format policy solve different problems.

**Realistic failure:** a migration changes omitted-versus-null output and breaks a client that distinguishes them.

**Trade-off:** compile-time serialization constrains dynamic use but can make supported types explicit.

**How to verify:** test golden JSON, unknown fields, omitted fields, nulls and round trips through the selected serializer.

### Q307 How do you migrate authentication and authorization safely

**Tier 1 - Foundation**

Authentication establishes identity; authorization checks whether that identity may perform this operation on this resource. Micronaut Security and Spring Security have different configuration and extension points. [Micronaut Security](https://micronaut-projects.github.io/micronaut-security/latest/guide/).

**Tier 2 - Core answer (30-second version)**

> Recreate security requirements explicitly instead of copying filter configuration. Validate trusted token issuer, audience, signature and time claims, then enforce resource ownership and tenant boundaries. Preserve public-route exceptions deliberately and protect operational endpoints.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Does decoding a JWT authenticate the caller?**

*Expected reasoning:* no; parsing claims does not verify trust or validity.

**Probe 2 (applied): An authenticated user requests another customer's order. Is a role enough?**

*Expected reasoning:* check resource ownership and tenant isolation in addition to coarse roles.

**Probe 3 (senior): What happens during signing-key rotation?**

*Expected reasoning:* test trusted-key refresh, overlap and unknown key behavior; never accept arbitrary token-provided key URLs.

**Tier 4 - Deep dive**

**Internals:** route matching, identity validation and resource policy are separate decisions.

**Realistic failure:** a migrated wildcard route unintentionally exposes an administrative endpoint.

**Trade-off:** centralized policies simplify audit but can miss object-level rules without explicit service checks.

**How to verify:** exercise anonymous, expired, wrong-audience, wrong-tenant and insufficient-role requests, including error paths.

### Q308 How does MicronautTest differ from a plain unit test

**Tier 1 - Foundation**

A unit test can construct a service directly. MicronautTest starts framework context support for integration testing. Bean replacements and transaction behavior are features to configure and understand, not substitutes for testing the packaged application. [Micronaut Test](https://micronaut-projects.github.io/micronaut-test/latest/guide/).

**Tier 2 - Core answer (30-second version)**

> Use unit tests for business decisions, context tests for wiring and advice, HTTP tests for the API, and real database tests for persistence. A test-managed transaction does not imply a separately executed server request shares it. Verify cleanup and commit behavior explicitly.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Can direct construction test AOP?**

*Expected reasoning:* it tests the object logic but bypasses container interception.

**Probe 2 (applied): Why does a mocked repository hide a transaction bug?**

*Expected reasoning:* it may return values without enforcing actual commit, locking or constraint semantics.

**Probe 3 (senior): How do you prevent test configuration masking production wiring?**

*Expected reasoning:* keep a packaged-artifact smoke test with production-like conditions and assert which integrations are selected.

**Tier 4 - Deep dive**

**Internals:** test context, server request and database transaction can have different lifetimes.

**Realistic failure:** rollback in the test thread leaves committed HTTP-created rows behind.

**Trade-off:** isolation improves repeatability, while realistic integrations reveal more boundary failures.

**How to verify:** run tests independently and in parallel, assert committed state from another connection, and use deterministic cleanup.

## Deep: generated artifacts and production decisions

### Q309 What can go wrong with annotation processing and multi-module builds

**Tier 1 - Foundation**

Annotation processors inspect code during compilation and generate supporting artifacts. A library module that declares Micronaut beans must produce the required metadata; downstream applications cannot assume missing artifacts will be reconstructed automatically. [Micronaut compiler configuration](https://docs.micronaut.io/5.2.x/core/).

**Tier 2 - Core answer (30-second version)**

> Treat processors, generated resources and platform alignment as build inputs. Reproduce failures with a clean command-line build, inspect the published library, and compare IDE and CI configuration. Compile success without the needed processor can still produce an unusable application artifact.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Why can incremental compilation hide a problem?**

*Expected reasoning:* old generated files can survive and satisfy a local run.

**Probe 2 (applied): A bean works in its module but disappears after publication. What do you inspect?**

*Expected reasoning:* inspect the actual JAR, metadata, package processing rules and dependency scopes.

**Probe 3 (senior): How do you keep processors compatible with runtime libraries?**

*Expected reasoning:* use the matching platform and build plugins, inspect the resolved graph and avoid independent arbitrary version overrides.

**Tier 4 - Deep dive**

**Internals:** generation, compilation and packaging are distinct stages; each can drop required outputs.

**Realistic failure:** CI packages a library without metadata that an IDE had generated locally.

**Trade-off:** compile-time work reduces discovery overhead but makes artifact provenance essential.

**How to verify:** consume the published library in a minimal clean application and start its context without local build outputs.

### Q310 How do Micronaut and Spring Boot compare for GraalVM native images

**Tier 1 - Foundation**

A native image is built ahead of time under closed-world assumptions. Both frameworks support native applications; compile-time DI does not mean every third-party library automatically works in a native executable. [Boot native images](https://docs.spring.io/spring-boot/3.5/reference/packaging/native-image/introducing-graalvm-native-images.html).

**Tier 2 - Core answer (30-second version)**

> Treat JVM and native packaging as separate targets. Check reflection, resources, proxies, initialization and library support. Compare cold readiness, memory and warmed throughput against longer builds and different diagnostics. Run the actual native executable before approving it.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Does a passing JVM test prove native behavior?**

*Expected reasoning:* no; reachability and initialization constraints differ.

**Probe 2 (applied): A class loaded by name works on the JVM but fails natively. Why?**

*Expected reasoning:* dynamic access may need explicit reachability metadata or a different supported integration.

**Probe 3 (senior): What configuration must be varied during verification?**

*Expected reasoning:* distinguish decisions fixed during AOT processing from supported runtime inputs and test every deployment mode you intend to ship.

**Tier 4 - Deep dive**

**Internals:** framework AOT generation and the native-image compiler are related but separate build stages.

**Realistic failure:** a rarely used document endpoint lacks a packaged resource and fails only in native production.

**Trade-off:** startup or memory gains can be offset by build cost and observability limitations.

**How to verify:** exercise security, serialization, TLS, resource loading and database paths in the native artifact under target container limits.

### Q311 How do you diagnose a Micronaut service that is healthy but slow

**Tier 1 - Foundation**

A successful health check does not establish acceptable user latency. Trace time across admission, execution queues, connection pools, database work and downstream calls before blaming the framework.

**Tier 2 - Core answer (30-second version)**

> Start with the user-visible SLO and a latency breakdown. Correlate traces with event-loop stalls, worker queues, connection waits, GC and downstream timing. Check that request identity survives executor changes. Keep metric labels bounded and exclude secrets from logs.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Why can average latency hide a problem?**

*Expected reasoning:* a small fraction of very slow requests can violate a p99 target while the average looks acceptable.

**Probe 2 (applied): Should readiness fail whenever an optional dependency slows down?**

*Expected reasoning:* define capability and dependency policy; removing every instance may worsen an outage.

**Probe 3 (senior): What happens when clients disconnect but expensive work continues?**

*Expected reasoning:* cancellation may not stop I/O; bound server work with deadlines and admission, and observe abandoned operations.

**Tier 4 - Deep dive**

**Internals:** a thread transition can separate logging or tracing context from the request unless supported propagation is used.

**Realistic failure:** large worker queues mask overload until deadlines expire in bulk.

**Trade-off:** richer diagnostics cost CPU, memory and storage; sample with sufficient error visibility.

**How to verify:** inject latency and pool exhaustion, cancel requests, then confirm traces explain queue time and resources return to baseline.

### Q312 How would you decide whether to migrate a Spring Boot service to Micronaut

**Tier 1 - Foundation**

A migration is a change to operational and behavioral contracts, not a search-and-replace exercise. A credible decision starts with the service's problem, supported integrations and measurable acceptance criteria.

**Tier 2 - Core answer (30-second version)**

> Keep the framework if it meets the requirements economically. Prototype a representative slice if startup, memory or deployment density is a measured constraint. Preserve API, security, data and failure semantics, compare equivalent workloads, and migrate gradually with a tested rollback path.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): What belongs in the first prototype?**

*Expected reasoning:* a realistic authenticated endpoint with serialization, database access and one downstream call, not only hello-world.

**Probe 2 (applied): Can shadow traffic safely include write requests?**

*Expected reasoning:* not against shared side-effecting systems; isolate writes or replay sanitized fixtures into controlled dependencies.

**Probe 3 (senior): How can rollback fail despite routing traffic back?**

*Expected reasoning:* incompatible schema changes, new persisted states or emitted events may remain; use expand-contract changes and backward-compatible readers.

**Tier 4 - Deep dive**

**Internals:** build an evidence matrix for bean selection, advice, HTTP errors, JSON, transactions, security, deadlines and shutdown.

**Realistic failure:** the replacement passes happy-path tests but mishandles retry-after-commit and duplicates orders.

**Trade-off:** migration benefits compete with engineering effort, ecosystem gaps and long-term ownership.

**How to verify:** run contract fixtures and failure injection on both artifacts, canary with explicit stop thresholds, and rehearse rollback before expanding traffic.

## Framework mechanics and production extensions

### Q313 How do Named, Primary, Replaces and Factory solve different problems

**Tier 1 - Foundation**

Suppose `PaymentGateway` has sandbox and live implementations. A **qualifier** identifies which collaborator an injection point needs. A **primary** bean supplies a preferred candidate when several match. A **replacement** intentionally removes a targeted bean from consideration. A **factory** describes how the container obtains an object, especially one from a third-party library. These are different operations.

**Tier 2 - Core answer (30-second version)**

> Use a qualifier for explicit selection, Primary for a deliberate default, Replaces for an intentional implementation substitution, and Factory for construction. Do not use Primary to hide two accidentally active production gateways. A replacement must target the correct type, qualifier and factory where relevant. [Primary API](https://docs.micronaut.io/4.9.7/api/io/micronaut/context/annotation/Primary.html), [Replaces API](https://docs.micronaut.io/4.9.7/api/io/micronaut/context/annotation/Replaces.html), [Factory API](https://docs.micronaut.io/4.9.7/api/io/micronaut/context/annotation/Factory.html).

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Does Primary delete the other implementation?**

*Expected reasoning:* no; it expresses selection preference. Another qualified injection can still use the other bean. Multiple primary candidates can still be ambiguous.

**Probe 2 (applied): A test replaces the default gateway, but requests still reach the live gateway. Why?**

*Expected reasoning:* inspect the injection qualifier and the replacement target. A named factory-produced bean may not match the replacement you intended. Confirm which object the controller actually receives and prevent external traffic in the test environment.

**Probe 3 (senior): Should production fallback use the sandbox gateway when the live bean is unavailable?**

*Expected reasoning:* no, unless that is a deliberately safe business contract. Missing required production wiring should fail clearly. Fallback is a runtime business decision, not merely a convenient way to satisfy DI.

**Tier 4 - Deep dive**

**Internals:** registration, conditional eligibility, replacement and candidate selection jointly determine the result. Describe them as separate concerns without depending on undocumented implementation order. The factory's own lifetime is not a substitute for specifying the produced client's scope and cleanup. Returning a newly allocated client on each lookup can create extra connection pools even when its factory is shared.

**Realistic failure:** a broad test replacement disables all qualified gateways, masking a missing tenant-specific configuration. The production artifact then resolves a different graph.

**Trade-off:** defaults reduce injection annotations but can obscure intent. Explicit qualifiers improve auditability at the cost of a more visible wiring contract.

**How to verify:** resolve default and named gateways in separate production-like and test contexts. Assert exact candidate counts, selected identities and client closure, including missing and conflicting configurations.

### Q314 When should you use EachProperty and EachBean

**Tier 1 - Foundation**

One typed configuration object is suitable for one integration. `@EachProperty` creates a family of configuration beans from entries beneath a prefix. `@EachBean` can create a corresponding family of clients from those beans. For example, `gateways.europe` and `gateways.asia` can describe two independently configured clients. [EachProperty API](https://docs.micronaut.io/4.9.4/api/io/micronaut/context/annotation/EachProperty.html), [EachBean API](https://docs.micronaut.io/4.9.7/api/io/micronaut/context/annotation/EachBean.html).

**Tier 2 - Core answer (30-second version)**

> EachProperty models repeated typed configuration, while EachBean derives another bean for each matching parent. Named qualification links each configured entry to its client. Validate every entry and budget total resources. This is useful for a bounded set of integrations, but it is not automatically a dynamic tenant provisioning system.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): How do you choose the Europe client?**

*Expected reasoning:* use its explicit qualifier or a controlled selection layer; do not take the first element of an unordered collection.

**Probe 2 (applied): One of three entries has a blank endpoint. Should the other two make the deployment look healthy?**

*Expected reasoning:* decide whether all configured entries are required. If they are, validate the whole family before readiness rather than discovering one invalid lazy client on its first request.

**Probe 3 (senior): What happens if 500 entries each create a pool of 20 connections?**

*Expected reasoning:* that permits up to 10,000 connections. Budget resources across all clients, consider shared transport where supported, and bound the configured set.

**Tier 4 - Deep dive**

**Internals:** map entry names normally become named qualifiers; the derived bean inherits the parent's qualifier. List binding is a separate option and requires its own identity reasoning. A deployment configuration update is not proof that existing singleton clients are replaced safely or that old resources are closed.

**Realistic failure:** tenant routing selects a client using untrusted arbitrary configuration names, or a new entry silently multiplies connection usage until the database refuses connections.

**Trade-off:** generated families remove repetitive factories but make configuration cardinality an operational concern. Large, frequently changing tenant populations may need an explicit registry with admission and lifecycle management.

**How to verify:** test zero, one and multiple entries; unknown names; invalid entries; exact qualifier-to-client mapping; and total resource limits. On shutdown, verify every initialized client is closed once.

### Q315 How do Micronaut HTTP filters differ from Spring servlet filters and interceptors

**Tier 1 - Foundation**

A server filter performs cross-cutting HTTP work, such as correlation metadata or request rejection. Micronaut 4 provides `@ServerFilter` with request and response filter methods. A Spring servlet Filter, an MVC HandlerInterceptor and a WebFlux WebFilter occupy different pipelines; there is no universal one-to-one replacement. [ServerFilter API](https://docs.micronaut.io/4.9.7/api/io/micronaut/http/annotation/ServerFilter.html).

**Tier 2 - Core answer (30-second version)**

> Port the filter's purpose, matching rules, ordering and execution model. Define whether it continues or short-circuits the request and which response paths it observes. A blocking continuation requires appropriate offloading. Route-specific parameters can also change which requests match the filter. [RequestFilter API](https://docs.micronaut.io/4.9.7/api/io/micronaut/http/annotation/RequestFilter.html).

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): If a filter returns an unauthorized response, should it also call the continuation?**

*Expected reasoning:* no; choose rejection or downstream execution for that request. Accidentally doing both can run side effects despite a rejected response.

**Probe 2 (applied): Why does the correlation header disappear on a 404?**

*Expected reasoning:* inspect route-dependent parameters and matching. A filter that requires a route match may not run for unmatched routes. Test 404, preflight, static-resource and exception paths explicitly.

**Probe 3 (senior): Is logging the entire request body safe?**

*Expected reasoning:* body access can buffer large streams, alter consumption behavior or expose secrets. Prefer bounded metadata and redact sensitive fields; do not copy authentication headers into logs.

**Tier 4 - Deep dive**

**Internals:** the continuation represents downstream work. Calling a blocking continuation can occupy an event-loop thread; asynchronous return types have different continuation and subscription semantics. The HTTP filter chain is distinct from method AOP, so a controller annotation does not establish the behavior of an earlier filter.

**Realistic failure:** a migrated servlet-style audit filter performs a blocking database write on every request before the controller's executor boundary.

**Trade-off:** centralized request policy improves consistency, but ordering and short-circuit behavior can affect security, diagnostics and latency simultaneously.

**How to verify:** record controller invocation count for allowed and rejected requests, test every response path, inject audit latency, and assert headers and safe errors without reading unbounded bodies.

### Q316 How do reactive demand and Java virtual threads change the execution model

**Tier 1 - Foundation**

Reactive Streams coordinates asynchronous data through a publisher, subscriber and demand. Virtual threads allow many blocking-style tasks to wait without dedicating a platform thread to each wait. Neither makes a slow dependency faster or increases its capacity. [Reactive Streams](https://www.reactive-streams.org/), [Java 21 virtual threads](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html).

**Tier 2 - Core answer (30-second version)**

> Choose one understandable execution model per boundary. Reactive demand can regulate compatible streams, while virtual threads simplify high-concurrency blocking code. Both still need bounded admission, connection limits and deadlines. In Micronaut, inspect the actual executor behind the blocking boundary rather than assuming every request uses virtual threads.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Does subscribing twice to a cold operation necessarily reuse one result?**

*Expected reasoning:* no; a cold publisher can execute its source work for each subscription. Repeated subscriptions to a write can repeat side effects unless the operation or sharing strategy prevents that.

**Probe 2 (applied): A stream requests ten rows but the source loads a million into a list. Is memory bounded?**

*Expected reasoning:* not by downstream demand alone. Source materialization, buffering, prefetch and concurrent mapping must also be bounded.

**Probe 3 (senior): Do virtual threads eliminate Java 21 pinning and ThreadLocal risks?**

*Expected reasoning:* no. Blocking inside certain synchronized or native operations can pin carriers in Java 21, and per-thread objects can become expensive at high concurrency. Check the exact JDK; newer versions change pinning behavior.

**Tier 4 - Deep dive**

**Internals:** a virtual thread still runs on a carrier when executing CPU work. It can unmount during supported waits, which improves concurrency rather than speeding up instructions. Reactive subscription controls when deferred work begins; cancellation requests termination but does not undo a committed effect. TaskExecutors.BLOCKING can use virtual threads when available, with a fallback described by the selected Micronaut version. [TaskExecutors API](https://docs.micronaut.io/4.8.2/api/io/micronaut/scheduling/TaskExecutors.html).

**Realistic failure:** an application replaces a bounded worker pool with virtual threads and admits unlimited work that waits on the same small database pool.

**Trade-off:** virtual threads favor familiar sequential code; reactive pipelines can express streaming demand well but require careful operator and context reasoning.

**How to verify:** use slow consumers, duplicate subscriptions and cancellation; inspect active database work, buffered data and retained tasks. For virtual threads, measure pinning and memory under the actual Java 21 runtime.

### Q317 How are retries, circuit breakers, bulkheads and fallbacks different

**Tier 1 - Foundation**

A retry repeats an operation. A circuit breaker temporarily rejects calls after a failure policy is met. A bulkhead limits concurrent work or isolates resources. A fallback returns a deliberate degraded outcome. For an inventory service, a cached availability estimate may be acceptable for browsing but unsafe for committing an order.

**Tier 2 - Core answer (30-second version)**

> Give each mechanism a separate contract. Micronaut CircuitBreaker builds on Retryable and maintains circuit state; it does not replace transport deadlines, concurrency limits or idempotency. Define retryable exceptions, recovery behavior and the business meaning of fallback data. [CircuitBreaker API](https://docs.micronaut.io/4.9.7/api/io/micronaut/retry/annotation/CircuitBreaker.html).

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Does an open circuit stop calls already executing?**

*Expected reasoning:* do not assume it cancels in-flight work. Existing calls still need their own deadlines and cleanup; new calls follow the open-circuit policy.

**Probe 2 (applied): Three layers each allow one initial call and two retries. What is the worst-case amplification?**

*Expected reasoning:* three attempts per layer can produce 27 downstream attempts for one original request. Count total attempts explicitly rather than ambiguously saying “three retries.”

**Probe 3 (senior): Should a fallback report successful payment when the provider is unreachable?**

*Expected reasoning:* no. Return a truthful unavailable or pending/unknown outcome according to the payment contract, then reconcile. A fallback must not manufacture business success.

**Tier 4 - Deep dive**

**Internals:** distinguish closed, open and recovery-probe behavior. In the cited Micronaut API, reset controls transition to half-open for a retry. Circuit state is not automatically a cluster-wide signal. With many instances, simultaneous recovery attempts can still load the dependency. A retry delay is also not a substitute for a hard timeout on one stuck network call.

**Realistic failure:** a timeout leads to retries, a fallback hides the errors, and dashboards report success while a queue of unresolved orders grows.

**Trade-off:** resilience improves availability only when it preserves business truth and fits the downstream's recovery capacity.

**How to verify:** deterministically trigger selected failures and recovery, count actual attempts and concurrent calls, and assert fallback semantics. Include a hung call, an excluded error and an ambiguous committed write.

### Q318 Are application events and Scheduled jobs durable or cluster-wide

**Tier 1 - Foundation**

An application event coordinates components inside an application. A scheduled method runs according to a local scheduling configuration. Neither alone is a durable message queue or a guarantee that only one replica performs a business job. Micronaut's scheduling API supports fixed delay, fixed rate and cron with a configurable time zone. [Scheduled API](https://docs.micronaut.io/4.9.5/api/io/micronaut/scheduling/annotation/Scheduled.html).

**Tier 2 - Core answer (30-second version)**

> Separate in-process notification from durable work. A scheduled invoice job on three replicas can execute three times. Use durable job identity, idempotent effects and an appropriate ownership protocol when completion must survive crashes. Specify time zone, overlap policy, deadlines and failure reporting.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): What is the difference between fixed delay and fixed rate?**

*Expected reasoning:* fixed delay measures the gap after completion; fixed rate targets a cadence. Do not infer overlap guarantees for work that the method hands off asynchronously. Scheduling invocation completion is not necessarily business-work completion.

**Probe 2 (applied): You begin publishing an in-process event after committing an order, then crash before listeners finish. Is delivery guaranteed?**

*Expected reasoning:* no durable delivery follows from publication alone. Persist an outbox or job record with the order when notification must survive failure. For synchronous listeners, also consider whether listener failure propagates to the publisher; asynchronous listeners change where failure is observed.

**Probe 3 (senior): A lease expires while the old worker is still running. Is the new worker the only writer?**

*Expected reasoning:* no; the old worker may continue. Use a fencing token or another storage-enforced ownership check where needed, plus an idempotency constraint on the business effect.

**Tier 4 - Deep dive**

**Internals:** `publishEvent` publishes synchronously; `publishEventAsync` returns a future for asynchronous publication. Listener-level asynchronous work can add another completion boundary. Neither API persists the event for replay after process loss. [ApplicationEventPublisher API](https://docs.micronaut.io/4.9.1/api/io/micronaut/context/event/ApplicationEventPublisher.html).

For scheduling, there are three different completions: the scheduler invokes a method, that method may submit work, and the work later commits an effect. Track the right one. Cron evaluated in a local default time zone can behave unexpectedly around daylight-saving changes; define the zone and the treatment of repeated or missing business periods.

**Realistic failure:** an invoice task is moved to asynchronous execution, returns immediately, and the next trigger overlaps while the previous run is still charging accounts.

**Trade-off:** local scheduling is simple for best-effort housekeeping. Durable orchestration adds storage and coordination but makes ownership and recovery explicit.

**How to verify:** run two instances, interrupt a run before and after the effect, expire ownership and restart. Assert one business effect per durable job key and recoverable status for unfinished work.

### Q319 What changes when migrating Spring cache annotations to Micronaut Cache

**Tier 1 - Foundation**

A cache annotation describes interception around a method, while the provider determines storage, expiry, eviction and sharing. Micronaut Cache supplies its own annotations and provider integrations. Matching annotation names across frameworks does not establish matching keys or invalidation behavior. [Micronaut Cache](https://micronaut-projects.github.io/micronaut-cache/latest/guide/).

**Tier 2 - Core answer (30-second version)**

> Preserve the cache contract: key, value shape, tenant boundary, expiry, maximum size, negative-result policy and invalidation timing. Determine whether storage is local or shared and whether calls actually cross the advice boundary. Never treat a cache hit as authorization by itself.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): Is product ID alone a safe key for tenant-specific prices?**

*Expected reasoning:* no. Include every input affecting the result, such as tenant, currency and applicable pricing version, or separate the caches deliberately.

**Probe 2 (applied): A database update rolls back after the cache was updated. What does the next reader see?**

*Expected reasoning:* potentially uncommitted data. Coordinate cache change with successful commit and define recovery for failed invalidation. Local transaction rollback does not automatically undo a separate cache write.

**Probe 3 (senior): Does a local single-flight loader prevent a stampede across 50 replicas?**

*Expected reasoning:* not necessarily; each replica can perform its own load. Decide whether that aggregate load is acceptable before adding shared coordination, and keep loaders safe to repeat.

**Tier 4 - Deep dive**

**Internals:** cache correctness combines interception with key generation and provider semantics. An absent value, a cached “not found” result and a failed load are different states. A short negative TTL can reduce repeated misses, but long retention can hide newly created data. For bounded age, distinguish expiry after write from expiry after access: a frequently accessed stale value can survive indefinitely under access-based expiry alone. Even write-based expiry needs a policy for stale reloads and post-commit invalidation races. Memory bounds additionally require size or weight limits. [Caffeine eviction policies](https://github.com/ben-manes/caffeine/wiki/Eviction).

**Realistic failure:** an annotation migration drops the tenant component of a custom key and returns another tenant's negotiated price.

**Trade-off:** caching reduces dependency load while introducing staleness and invalidation work. Distributed caches share state but add network and availability concerns.

**How to verify:** compare cross-tenant keys, missing-versus-created records, concurrent misses, rollback and post-commit invalidation failures. Measure both stale-read duration and actual backend load, with two instances when sharing matters.

### Q320 How do Kafka listener acknowledgments interact with database commits

**Tier 1 - Foundation**

A listener receives records; an offset records consumer progress. Micronaut Kafka offers KafkaClient and KafkaListener integrations, but listener execution, offset strategy and external database transactions remain separate concerns. Choose and test the module's supported acknowledgment configuration. [Micronaut Kafka](https://micronaut-projects.github.io/micronaut-kafka/latest/guide/).

**Tier 2 - Core answer (30-second version)**

> Acknowledge according to the durable effect you promise, not merely receipt or task submission. Committing progress before the database effect risks loss; committing after the effect leaves a duplicate window. Make the effect idempotent and verify partition ordering, redelivery and rebalance behavior. Kafka transactions alone do not make an external database write atomic with the offset.

**Tier 3 - Follow-ups**

**Probe 1 (warm-up): The listener submits work to an executor and returns. Has the record been processed?**

*Expected reasoning:* only submission completed. Depending on the configured strategy, returning can allow progress before the task's durable effect. Track completion through the supported acknowledgment model.

**Probe 2 (applied): Record 11 finishes before record 10 in the same partition. Can you commit past both?**

*Expected reasoning:* not safely if 10 is unfinished. A committed position describes a prefix of progress; advancing it can skip unfinished earlier work after restart. Preserve ordering or track a contiguous completed prefix through a supported design.

**Probe 3 (senior): A rebalance happens after a database commit but before acknowledgment. What prevents a double charge?**

*Expected reasoning:* a durable unique operation key checked in the same database transaction as the charge. A process-local set is insufficient after restart or reassignment, and the key's retention must cover the redelivery horizon.

**Tier 4 - Deep dive**

**Internals:** subscription ownership, handler completion, database commit and offset commit are four distinct events. For database idempotency, atomically record the operation key and apply the effect. Redelivery can then recognize the committed operation. Poison records need an explicit retry/quarantine policy; moving a record aside is itself an operation whose failure and acknowledgment ordering must be handled.

**Realistic failure:** asynchronous handlers complete out of order, progress advances past an unfinished record, and a crash permanently loses that record's effect.

**Trade-off:** ordered processing simplifies progress reasoning but can let a slow record block a partition. Parallel processing requires stronger completion tracking and resource limits.

**How to verify:** stop the consumer before the effect, after commit and before acknowledgment; force reassignment; redeliver duplicates concurrently; and inject a poison record. Verify durable effects and committed progress using a real broker/database integration test.

## Practice: turn comparisons into evidence

Choose one question from each stage. Give its core answer aloud, answer the three probes without looking, then write the experiment that would disprove your claim. For a migration exercise, compare missing configuration, null input, an absent row, concurrent updates, a timed-out committed write, a cancelled request and restart during work. Record observed behavior separately from predictions.

There is no universal requirement to migrate. A strong answer explains the execution model, names a concrete failure, and proposes a test that distinguishes the alternatives.
