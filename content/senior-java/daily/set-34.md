# Set 34 — Compile-time registries and provider boundaries

19 November 2026 · S34-Q01–S34-Q12

Assume Java 21 without preview features unless a scenario explicitly distinguishes the compiler host from its target. These original build and plugin scenarios extend Set 33 without repeating runtime reflection discovery. Each spoken answer supports roughly 45–90 seconds of practice. Examples are contextual pseudocode or fragments, not runnable courses or a tested processor implementation.

**1. A generated command registry omits handlers created by another processor. Why is a single pass insufficient?**

**Say aloud:** “An annotation processor is a compiler extension that reads program declarations and can generate files. Processing proceeds in rounds, so another processor can introduce handlers after my first invocation. I would collect stable handler identities across rounds, deduplicate repeated observations, and choose an explicit emission point. For an aggregate registry I can emit after collection finishes, provided that output does not require another processing round. If generated source itself needs processing, I must design an earlier emission protocol or separate compilation stage. I would not rely on processor discovery order. Generation moves discovery failures into the build, but adds build lifecycle complexity. My acceptance test compiles a handler generator and registry generator together and checks the resulting registry.”

**Example:**

```text
Round 1: input handler A; round 2: generated handler B; aggregate must include A and B.
```

**Deep dive / verification:** Collection needs O(h) retained identities for h handlers. A final-round generated source will not receive another annotation-processing round; avoid depending on that.

**Follow-ups:** Can I reset state every process call? No; that loses earlier-round contributions. Keep state scoped to this compilation.

**Primary reference:** [Java 21 documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/annotation/processing/Processor.html).

---

**2. A processor throws FilerException on its second round. Should it overwrite the generated file?**

**Say aloud:** “Filer is the compiler service that creates generated source, classes and resources. Within one processing run, a pathname can be created only once. Reopening the same output in each round is therefore a lifecycle bug, not an invitation to bypass Filer with direct filesystem writes. I would collect inputs first and generate the output once, or generate independently named outputs for independently owned inputs. I would close the writer so the compiler can observe the completed source. Suppressing the exception can conceal conflicting generators or an incomplete registry. I would test repeated rounds and deliberate name collisions and ensure the build fails with a useful diagnostic for a real conflict. Clean builds and incremental builds should produce equivalent public registrations.”

**Example:**

```text
Collect A and B, then create generated.CommandIndex once; never append by recreating it in round 2.
```

**Deep dive / verification:** Output construction is O(output size). Originating elements are dependency hints, not a portable promise that every incremental build tool deletes obsolete files.

**Follow-ups:** Why pass originating elements? They identify source contributors so build tooling can track dependencies more accurately.

**Primary reference:** [Java 21 documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/annotation/processing/Filer.html).

---

**3. An audit processor returns true and a second processor stops receiving the same annotation. What changed?**

**Say aloud:** “The boolean result of process means whether a processor claims the annotations it was asked to process. It is not a success flag. A processor that only audits metadata should normally avoid claiming annotations needed by other processors. I would define ownership explicitly and return false when collaboration is intended. Successful validation is communicated by the absence of errors, and invalid input through compiler diagnostics. Depending on one processor running before another creates a fragile build contract. I would run both processors together and assert that validation and generation both occur. For stronger isolation I could split validation and generation into explicit build stages, at the cost of more build wiring and potentially slower feedback.”

**Example:**

```text
Policy auditor observes @Command and returns false; registry generator can also process @Command.
```

**Deep dive / verification:** No processor-order guarantee should underpin correctness. Test overlapping supported annotation types and an input with no matching annotations.

**Follow-ups:** Does false mean retry this processor? No; it leaves annotations unclaimed for other processors in the current discovery protocol.

**Primary reference:** [Java 21 documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/annotation/processing/Processor.html#process(java.util.Set,javax.annotation.processing.RoundEnvironment)).

---

**4. A processor cannot load a class named in an annotation even though the source compiles. Should it use Class.forName?**

**Say aloud:** “The compiler type model describes the program being compiled; the processor runtime contains the code executing the compiler extension. Those are different environments. A class being compiled need not already be loadable by the processor. I would inspect annotation mirrors and their annotation values, representing class-valued entries as compiler type metadata rather than loading application classes. This also avoids accidentally running application initialization during a build. A reflective shortcut may appear to work when an old compiled class is on the processor path, then silently inspect stale code. I would verify behavior in a clean compilation where the referenced class exists only as source. Runtime execution, if needed, belongs in a separate controlled validation stage.”

**Example:**

```text
@Codec(payload = NewMessage.class): inspect the annotation value as type metadata while NewMessage is still source.
```

**Deep dive / verification:** Walk only required metadata; loading application classes is neither necessary nor evidence that the source model is current.

**Follow-ups:** Are mirror objects stable identity keys? Do not rely on reference identity; use the model contracts and stable qualified identifiers.

**Primary reference:** [Java 21 documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/lang/model/element/AnnotationMirror.html).

---

**5. An omitted annotation option is absent from getElementValues. How should defaults be applied?**

**Say aloud:** “An annotation member can have a declared default, so an omitted value and an explicitly supplied value can have the same effective meaning. AnnotationMirror.getElementValues reports explicitly present entries. For effective configuration I would use Elements.getElementValuesWithDefaults and validate that completed view. If provenance matters, I would retain the explicit view too, so diagnostics can explain whether a value came from a default. Hand-copying defaults into the processor creates drift when the annotation API changes. I would test omitted, explicit-default and explicit-nondefault values against the same validation rules. Defaults are part of compatibility: changing one can alter newly compiled registries even when annotated application source has not changed.”

**Example:**

```text
@Command defaults timeoutMs to 500; omitted and explicit 500 validate equally, but retain distinct provenance.
```

**Deep dive / verification:** Resolution costs scale with annotation members. Compare clean build outputs when changing defaults; do not assume old generated artifacts update themselves.

**Follow-ups:** When should omission fail? When policy requires an explicit declaration; enforce that separately from effective-value validation.

**Primary reference:** [Java 21 documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/lang/model/util/Elements.html).

---

**6. A processor accepts List<Integer> where List<Number> is required because it compares erased names. What is wrong?**

**Say aloud:** “Erasure removes generic type arguments for parts of Java runtime representation. That makes it unsuitable for proving source-level assignment compatibility. List of Integer and List of Number share an erased name but are not interchangeable mutable lists. In a compiler extension I would use Types.isAssignable for the actual source types and define whether wildcards or raw types are supported. For an exact contract, I would reject unchecked raw inputs explicitly rather than let permissive conversion rules weaken validation. String comparison of type names also loses structure and can misread nested generics. I would test accepted subtype values, rejected invariant collections, wildcard bounds and raw declarations. The compiler model provides semantic operations; the generator still owns its supported API contract.”

**Example:**

```text
Required List<Number>; supplied List<Integer>: reject. Required List<? extends Number>: evaluate the actual wildcard contract.
```

**Deep dive / verification:** Type-checking cost depends on type structure; no constant-time claim. Erasure can intentionally identify an invocation family, but cannot prove generic safety.

**Follow-ups:** What about a method inherited through a generic parent? Resolve its member type in the concrete containing type with asMemberOf.

**Primary reference:** [Java 21 documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/lang/model/util/Types.html).

---

**7. A generated type appears unresolved in an early round. Should the processor immediately declare it invalid?**

**Say aloud:** “An error type is compiler metadata for a class or interface that cannot currently be resolved. During generation, that can mean a collaborator has not produced the declaration yet; it can also mean a genuinely missing dependency. I would defer only cases my generation protocol expects, retaining enough stable information to look them up again later. At processing completion, unresolved required types must produce a clear error instead of silently disappearing from the registry. Repeatedly casting every type to a declared class hides arrays, primitives and type variables as well. I would branch on the supported type kinds and reject unsupported forms deliberately. Verification needs both a type generated in a later round and a permanently missing type.”

**Example:**

```text
Handler references GeneratedPayload: defer while generation is pending; fail if no resolvable payload exists at completion.
```

**Deep dive / verification:** Bound deferred state by compilation inputs; avoid infinite custom polling. A later compiler round, rather than elapsed wall time, is the relevant progress event.

**Follow-ups:** Can ERROR always be ignored? No; that would publish incomplete output for broken dependencies.

**Primary reference:** [Java 21 documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/lang/model/type/TypeKind.html).

---

**8. Two source handlers use the same external command ID. Should generation warn and choose one?**

**Say aloud:** “A registry maps external identities to behavior, so duplicate identities make dispatch ambiguous. I would report a compiler error attached to each conflicting declaration and avoid publishing a usable ambiguous registry. A warning is appropriate only when the product contract explicitly permits the condition; arbitrary first-wins behavior changes with build inputs. Messager is the processor API for compiler diagnostics, including element location hints. The message should identify the conflicting ID and remediation without dumping confidential source values unnecessarily. I would test that duplicate input fails compilation, while distinct IDs succeed and resolve to the intended handlers. Moving the check into generation catches mistakes earlier, although runtime plugins still need equivalent validation when they join later.”

**Example:**

```text
@Command("ship") on A and B: ERROR naming both declarations; developer assigns one a distinct public ID.
```

**Deep dive / verification:** A map gives expected O(h) duplicate detection and O(h) memory. Compiler location hints can be approximate; include enough context in the message.

**Follow-ups:** Does logging an error to stderr fail compilation? Use Diagnostic.Kind.ERROR through Messager instead of relying on console parsing.

**Primary reference:** [Java 21 documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/annotation/processing/Messager.html).

---

**9. A registry finalizer checks errorRaised and assumes the current round is valid. Is that sufficient?**

**Say aloud:** “RoundEnvironment supplies information about the current processing round, but errorRaised reports whether an error was raised in the prior round. It is not a complete live view of every error another processor might report now. I would track my own validation failures and avoid emitting output that assumes invalid inputs are safe. More importantly, the build must publish generated artifacts only after the whole compilation succeeds. A generated file existing on disk is not proof of a successful build. I would test a collaborator that reports an error in the same round and ensure the failed compilation cannot replace the previously accepted application artifact. This separates generation from release acceptance and prevents partial outputs leaking into packaging.”

**Example:**

```text
Processor A writes an index; processor B reports ERROR this round; packaging must reject the compilation as a whole.
```

**Deep dive / verification:** processingOver signals the final round, not a successful deployment or an error-free build. Release atomicity belongs to the build pipeline.

**Follow-ups:** Should partial output be used for IDE assistance? It may be useful provisionally, but never treat it as a release artifact.

**Primary reference:** [Java 21 documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/annotation/processing/RoundEnvironment.html).

---

**10. A generated Java 21 application calls a newer JDK API after the build host is upgraded. How do you prevent it?**

**Say aloud:** “The host JDK runs the compiler and processor; the target release describes the application platform being produced. They need not be the same. I would compile generated application sources with an explicit release setting so unsupported language constructs and platform APIs are rejected for that target. I would also keep processor dependencies separate from application runtime dependencies. A processor built for a newer host may require that host even while generating older-compatible source, so both requirements must be documented. Source and target flags alone do not provide the same platform API restriction as release. I would compile on the supported build host and execute representative generated output on the minimum supported runtime before accepting the toolchain upgrade.”

**Example:**

```text
Build on an approved newer host, generate Java 21 source, compile application with --release 21, run compatibility smoke tests on Java 21.
```

**Deep dive / verification:** This is a compatibility check, not a performance guarantee. It does not certify third-party library compatibility or reflection-only calls.

**Follow-ups:** Does --release restrict the processor runtime? No; its own bytecode and dependencies must work on the compiler host.

**Primary reference:** [Java 21 documentation](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html).

---

**11. Provider inspection unexpectedly creates every expensive plugin. How can selection precede construction?**

**Say aloud:** “A service provider implements an extension contract, such as an export codec. ServiceLoader.stream exposes provider descriptors so selection can inspect provider type metadata before asking for an instance. I would filter descriptors and call get only for selected candidates, while avoiding metadata policies that themselves trigger expensive work. For named-module providers created through a provider factory, type returns the factory method return type, which may not identify the implementation class I expected. Therefore the selection metadata contract must be explicit and tested with factory providers too. Deferring construction reduces unnecessary startup work, but it also defers constructor failures until selection. I would test instance counts and failure reporting rather than assume descriptors eliminate all class-loading costs.”

**Example:**

```text
Inspect loader.stream() descriptors; select a supported codec; invoke selected.get() only after policy accepts it.
```

**Deep dive / verification:** Scanning p descriptors costs O(p) policy evaluations; construction cost remains provider-defined. No claim of zero class loading follows.

**Follow-ups:** Can I reflectively call a no-arg constructor on type()? No; use Provider.get because module factories need not follow that construction shape.

**Primary reference:** [Java 21 documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ServiceLoader.Provider.html).

---

**12. A malformed optional provider crashes startup despite catch(Exception). What failure policy is needed?**

**Say aloud:** “ServiceConfigurationError is an Error used when service-provider location, loading or instantiation fails, so catch Exception does not cover it. I would establish whether the extension is required before choosing recovery. A required payment provider should prevent readiness with a clear diagnostic. An optional export plugin may be disabled through a narrowly scoped discovery boundary, with visible degraded capability and a recorded cause. I would not catch every Error around all startup, because that could hide unrelated serious failures. Lazy discovery means failure may occur during iteration or instantiation rather than when the loader object is created. I would test both boundaries with a malformed provider and verify the advertised capabilities match the providers actually accepted.”

**Example:**

```text
Optional CSV plugin fails discovery: record its failure, disable CSV, and keep required capabilities subject to their own startup checks.
```

**Deep dive / verification:** Isolation is an application policy, not a ServiceLoader availability guarantee. Do not assume iteration can safely recover past every malformed descriptor.

**Follow-ups:** Why not silently skip it? Users would see advertised operations fail later; degraded capabilities must be explicit and observable.

**Primary reference:** [Java 21 documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ServiceConfigurationError.html).

---

**Topic coverage and next steps**

Covered compiler rounds, output ownership, annotation cooperation, source metadata, defaults, generic compatibility, deferred types, diagnostics, artifact acceptance, target releases, lazy providers and optional-extension failures. Next set: distributed ingestion recovery and durable artifact reconciliation, returning to database and messaging boundaries with concrete failure timelines.
