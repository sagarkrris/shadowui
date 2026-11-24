# Set 38 — Java compatibility across rolling upgrades

23 November 2026 · S38-Q01–S38-Q12

Assume Java 21 without preview features, ordinary class-path libraries and independently deployed clients unless a question states otherwise. Versions are reference assumptions, not latest-version claims. All examples are original contextual API-evolution sketches, not runnable courses or deployed integrations. This set extends the Senior Java guide’s core Java, JVM and service evolution foundations.

**1. A library replaces send(String) with send(CharSequence). Why does an old client fail although its source still compiles?**

**Say aloud:** “Binary compatibility means already compiled clients can continue linking against a replacement library. Source compatibility asks whether their source still compiles, which is a separate promise. A compiled invocation records a method descriptor, including parameter types; it does not rerun overload selection when the process starts. Replacing the String parameter removes the method the old client references, even though recompilation can select CharSequence. I would retain the original overload as a delegating adapter and add the broader overload separately. That increases the supported API surface but permits staged upgrades. I would compile the client against version one, retain its class files, and run those exact files against version two. A clean rebuild alone would conceal this deployment failure.”

**Example:**

```text
v1: send(String); unsafe v2 replacement: send(CharSequence); compatible transition: retain both.
```

**Deep dive / verification:** Inspect descriptors with javap -s. Test null arguments and ensure delegation does not recurse between overloads.

**Follow-ups:** Can a catch-and-retry fix NoSuchMethodError? No; deploy compatible artifacts or restore the missing method.

**Primary reference:** [Java 21 specification or tool reference](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html).

---

**2. A library changes a method return from Collection to List. Why can a precompiled caller break?**

**Say aloud:** “A JVM method descriptor includes the return type as well as parameter types. Narrowing a declared return from Collection to List looks convenient to source callers, but replacing that declaration can remove the descriptor recorded by an existing binary. I would preserve the original public method contract or introduce a differently named method for the narrower result. This differs from a subclass overriding a superclass method with a covariant return, where Java compilation can generate a bridge method. I would not assume such a bridge exists for an arbitrary edited library declaration. The verification is to inspect the actual shipped class and execute an unrecompiled client. Retaining the broader contract sacrifices some compile-time convenience while protecting independently deployed consumers.”

**Example:**

```text
Old descriptor: ()Ljava/util/Collection; new descriptor: ()Ljava/util/List;
```

**Deep dive / verification:** Compare javap -s -p output for both artifacts. This is a linkage contract, not an algorithmic complexity change.

**Follow-ups:** What is a covariant return? An overriding method may return a subtype of the overridden result, subject to language rules.

**Primary reference:** [Java 21 specification or tool reference](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html).

---

**3. Adding quote(String) beside quote(Object) changes behavior only after recompilation. Why?**

**Say aloud:** “Overloading means several methods share a name with different parameter types. The compiler chooses an overload using the declared argument types and applicable-method rules. Runtime dispatch then chooses an override of that selected instance method; it does not choose again among every overload using the runtime argument class. An old client compiled when only quote(Object) existed keeps that descriptor after a library upgrade. Recompiling a call with a String expression can instead select the new String overload. Both versions can link successfully yet produce different prices if the overloads disagree. I would make overload semantics consistent or use an explicit new operation name. I would test old binaries and recompiled sources separately because neither test substitutes for the other.”

**Example:**

```text
quote("x") selects Object in the old compilation and String after rebuilding against the added overload.
```

**Deep dive / verification:** Include an Object variable holding a String: its declared type still affects overload selection. Keep pricing expectations deterministic.

**Follow-ups:** What about quote(null)? With Object and String, String is more specific; unrelated parameter types can make null ambiguous.

**Primary reference:** [Java 21 specification or tool reference](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12).

---

**4. Two unrelated reference overloads make a formerly valid null call fail to compile. How should an API evolve?**

**Say aloud:** “Null can be passed to any reference parameter, so it does not identify an intended domain type by itself. If an API originally offered find(String), adding find(UUID) can make find(null) ambiguous because neither parameter type is more specific than the other. Existing compiled calls still reference the String method, so binary compatibility does not imply source compatibility. I would prefer distinct domain names such as findByName and findById when the operations represent different identities. A typed cast can disambiguate an individual caller, but spreading casts makes the API harder to use. I would include null literals, typed null variables and method references in compilation checks, while separately defining whether null should be rejected at runtime.”

**Example:**

```text
find((String) null) selects a method; it does not establish that null is a valid business input.
```

**Deep dive / verification:** Compile a tiny consumer against each API version. A source ambiguity has no meaningful runtime cost because compilation fails.

**Follow-ups:** Does Optional fix overload ambiguity automatically? No; redesigning parameter types still requires clear operation names and null policy.

**Primary reference:** [Java 21 specification or tool reference](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12).

---

**5. A public static final timeout changes, but upgraded clients still use the old value. Why?**

**Say aloud:** “A constant variable is a final primitive or String initialized with a constant expression. Java clients can embed its value into their own class files. Replacing only the library therefore need not update the value observed by already compiled clients. I would avoid public compile-time constants for operational policy that must change independently, and expose a method or validated configuration instead. Existing clients may still require rebuilding because changing the library cannot retrieve values already copied into their bytecode. This trades trivial constant access for an explicit evolution boundary. I would compile one client against the original timeout, upgrade only the library, then compare its result with a newly compiled client. Security limits deserve particular attention because stale policy can remain silently active.”

**Example:**

```text
public static final int TIMEOUT_MS = 500; changing 500 to 900 does not rewrite old clients.
```

**Deep dive / verification:** Inspect client bytecode with javap -c. Distinguish constant expressions from values initialized by a method call.

**Follow-ups:** Is every static final field inlined this way? No; an object reference or nonconstant initializer is not a constant variable.

**Primary reference:** [Java 21 specification or tool reference](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html).

---

**6. Removing a no-argument constructor breaks a dependency after adding an explicit constructor. What happened?**

**Say aloud:** “A constructor initializes a new instance, and callers compile references to its particular parameter descriptor. Java supplies a default constructor only when a class declares no constructors. Adding an explicit constructor that accepts configuration removes that implicit no-argument constructor from the newly compiled class. Old callers can then fail when creating the object, while source consumers fail to compile. I would preserve a deliberate no-argument constructor only if a safe default remains meaningful, otherwise treat the change as a coordinated breaking release. A default that silently disables validation is worse than a clear migration requirement. I would test direct construction and relevant framework creation paths against the packaged artifact, because dependency injection may use a different constructor from ordinary application code.”

**Example:**

```text
v1: class Client {} ; v2: Client(Config c) {} removes the formerly implicit Client().
```

**Deep dive / verification:** Check public constructor descriptors and reject missing configuration explicitly. Constructor compatibility does not prove framework wiring compatibility.

**Follow-ups:** Can a factory help? It can stabilize future creation contracts, but old constructor callers still need a supported migration.

**Primary reference:** [Java 21 specification or tool reference](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html).

---

**7. An interface gains an abstract method and a new caller invokes it on an old implementation. What fails?**

**Say aloud:** “An abstract interface method declares a required operation without supplying its implementation. An old implementation binary may load with the evolved interface, but it cannot perform the newly required operation merely because the interface declares it. A new caller invoking that method can encounter AbstractMethodError. I would introduce a capability interface, coordinate implementation upgrades, or provide a default only when a universally safe behavior exists. Returning success from a placeholder would hide unsupported functionality. For a payment plugin, absence of refund support should be explicit rather than silently treated as a completed refund. I would test a newly compiled caller with an old implementation artifact and the new interface, including the unsupported path. Testing only freshly compiled implementations misses the upgrade boundary.”

**Example:**

```text
New Payments.refund(); old Provider implements only charge(); invoke refund on old Provider -> unsupported implementation boundary.
```

**Deep dive / verification:** Use a mixed-version artifact test. Capability negotiation adds branching but avoids pretending every provider supports the feature.

**Follow-ups:** Is loading the implementation enough? No; execute the newly added operation and verify its user-visible outcome.

**Primary reference:** [Java 21 specification or tool reference](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html).

---

**8. Two plugin interfaces independently add the same default method. Why can an old implementation become unsafe?**

**Say aloud:** “A default method is an interface method with an implementation that eligible implementing classes can inherit. It can ease interface evolution, but unrelated defaults with the same signature can conflict. An old class implementing both interfaces may have no override to choose between newly introduced competing defaults. Source recompilation can reject the conflict, and mixed binaries can fail when the conflicting method is invoked. I would inspect the entire implemented-interface graph and add an explicit implementation that resolves the intended policy, or avoid introducing the competing shared name. This costs coordination across plugin owners. I would compile each interface version separately and execute the old implementation with the new pair, rather than assuming one interface tested in isolation proves ecosystem compatibility.”

**Example:**

```text
Interfaces Audit and Metrics both acquire default reset(); old Adapter implements both without reset().
```

**Deep dive / verification:** Include a class-provided override as a control and test unrelated defaults explicitly. There is no universal safe default for a destructive reset.

**Follow-ups:** Does a concrete class method change selection? An applicable class implementation generally takes precedence over interface defaults.

**Primary reference:** [Java 21 specification or tool reference](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html).

---

**9. A public method becomes package-private and only a rarely used plugin fails. What does a successful startup miss?**

**Say aloud:** “Access control determines whether a caller may use a type or member. Narrowing a public method to package access removes permission from callers outside the runtime package, even if its name and descriptor remain unchanged. An already compiled plugin can encounter IllegalAccessError when the reference is resolved. Starting the service successfully does not prove every optional path has linked and executed. I would restore the supported access level or release a coordinated API migration, then exercise the affected plugin operation. Broad reflective access flags are not a sound replacement for a public contract. My verification would retain the plugin binary from the previous release and invoke its rare path against the replacement library, with a negative test for callers that should remain unauthorized.”

**Example:**

```text
Public Api.refresh() becomes package-private; external precompiled Plugin still invokes Api.refresh().
```

**Deep dive / verification:** Use the actual artifact and class-loader arrangement. A source tree test in the same package can hide the problem.

**Follow-ups:** Is IllegalAccessException the same failure? No; reflective APIs can report a checked exception, while bytecode linkage uses an Error.

**Primary reference:** [Java 21 specification or tool reference](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html).

---

**10. A library adds a checked exception and old clients still run. Is the change safe?**

**Say aloud:** “A checked exception is one the Java compiler requires callers to catch or declare. The throws clause is not part of a JVM method descriptor, so adding a checked exception need not prevent an old binary from linking. Recompiled callers may now fail compilation, and existing callers can receive an exception their code was never designed to handle. I would evaluate binary, source and behavioral compatibility separately. If a new failure is unavoidable, I would document it and choose a deliberate migration rather than treating successful linkage as sufficient evidence. For a settlement operation, an unexpected exception must not turn an uncertain outcome into an automatic duplicate retry. Tests should execute the new failure path with both old and rebuilt clients and verify ownership of recovery.”

**Example:**

```text
void settle() becomes void settle() throws IOException; descriptor stays ()V, while caller obligations change.
```

**Deep dive / verification:** Test failure semantics and cleanup, not just signatures. Recovery cost depends on the operation; no constant-time safety claim applies.

**Follow-ups:** Can an old binary receive the checked exception? Yes; compile-time checking does not impose a runtime catch requirement.

**Primary reference:** [Java 21 specification or tool reference](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html).

---

**11. A Java 21 service rejects a library built on a newer JDK. Why is changing source syntax insufficient?**

**Say aloud:** “Class files have a version that the runtime must support. Writing conservative Java syntax does not guarantee that a newer compiler emits a class file or API usage compatible with an older runtime. I would compile the library using the intended release target and test the packaged result on the minimum supported runtime. The javac release option constrains language rules, class-file target and the documented platform API available to compilation for that release. Merely setting source and target can still permit accidental references to newer platform APIs when compiling on a newer JDK. Dependencies need the same scrutiny because compatible application classes cannot make an incompatible dependency load. The trade-off is losing newer APIs until the supported runtime baseline changes deliberately.”

**Example:**

```text
Build with javac --release 21 where supported; execute the final dependency closure on Java 21.
```

**Deep dive / verification:** Include transitive dependencies and generated classes. Record actual java and javac versions; a build-tool launcher version is not necessarily the compiler toolchain.

**Follow-ups:** Does release targeting prove runtime behavior? No; native libraries, reflection, configuration and behavior still require runtime tests.

**Primary reference:** [Java 21 specification or tool reference](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html).

---

**12. A clean build passes, but rolling back only one JAR fails. How would you design a compatibility test matrix?**

**Say aloud:** “A compatibility matrix records which independently released artifacts must work together. A clean build tests a coherent new world and can erase the evidence needed to simulate a rolling deployment or rollback. I would archive small old consumer and provider binaries, then run old caller with new provider and new caller with old provider wherever the rollout contract requires those directions. I would also rebuild old source against the new API to expose source-only failures. Each fixture should invoke meaningful operations and assert outcomes, not just load classes. This adds artifact maintenance and bounded matrix growth, so I would tie combinations to supported deployment windows. A rollback is safe only when the selected combination and any external data contracts are still supported.”

**Example:**

```text
Matrix: old/old baseline, old/new upgrade, new/old rollback if promised, new/new baseline; keep old class files unchanged.
```

**Deep dive / verification:** Use javap -s -c to diagnose descriptor differences. Separate linkage assertions from domain outcomes and from HTTP/schema compatibility.

**Follow-ups:** How do you limit matrix cost? Test supported version windows and explicit contracts; retire combinations only with an agreed support-policy change.

**Primary reference:** [Java 21 specification or tool reference](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javap.html).

---

### Topic coverage

S38-Q01–Q02: binary descriptors. Q03–Q04: overload selection and source evolution. Q05–Q06: constants and construction. Q07–Q09: plugin implementation, defaults and access. Q10–Q12: exception contracts, release targeting and mixed-version verification. These are compatibility decisions, so algorithmic complexity is not the relevant guarantee.

### Next set

Extend the operational-repair thread with database privilege separation and audit evidence. Revisit Spring and Kafka through deployment authorization boundaries rather than repeating Java linkage scenarios.
