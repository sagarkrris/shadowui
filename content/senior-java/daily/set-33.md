# Set 33 — Reflection and metadata contracts

18 November 2026 · S33-Q01–S33-Q12

Assume Java 21 without preview features. Reflection means inspecting or invoking program elements at runtime. These original scenarios extend the guide’s core Java and framework foundations into registry and schema tooling. Each answer supports 45–90 seconds of spoken practice. All examples are contextual fragments, not a runnable framework or a deployed service. Module examples assume named modules; classpath behavior must not be generalized to them.

**1. A runtime policy scanner cannot see a custom annotation that is visible in the class file. What is missing?**

**Say aloud:** “Retention describes how long annotation metadata survives compilation. The default is CLASS, which preserves metadata in the class file without promising runtime reflection visibility. For a runtime scanner I would declare RUNTIME retention explicitly and test the packaged class, rather than infer visibility from source or a bytecode viewer. SOURCE retention serves compile-time tools instead. This choice only makes metadata available; it does not execute a policy or enforce authorization. I would also check that the annotation targets the element being inspected. In an access-control scanner, absence should trigger the documented safe policy rather than silently allowing access. Compile-time generation can avoid a runtime scan, but it needs its own build contract.”

**Example:**

```text
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface ExportPolicy {}
```

**Deep dive / verification:** Test present and absent metadata in a compiled artifact; no latency guarantee follows from retention.

**Follow-ups:** Does RUNTIME enforce anything? No; a separate consumer must interpret the annotation.

**Primary reference:** [Java 21 Retention](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/annotation/Retention.html).

---

**2. An implementation class loses the policy annotation declared on its interface. Does @Inherited fix it?**

**Say aloud:** “Inherited is a narrowly defined annotation lookup rule. It allows certain class annotation queries to search superclasses; it does not copy interface annotations to implementing classes or inherit method annotations across overrides. I would first define whether the policy belongs to a service contract or an implementation. If interface policies are intended, the scanner must traverse those interfaces explicitly and resolve conflicts deterministically. Otherwise I would require the annotation on each concrete implementation and reject missing declarations at startup. Hidden traversal rules are especially dangerous for authorization. A framework may provide richer merged-annotation behavior, but I would verify that framework contract instead of attributing it to Java inheritance.”

**Example:**

```text
interface Contract marked with @Policy; implementation query must explicitly consult Contract if that is the policy.
```

**Deep dive / verification:** Traversal costs depend on hierarchy size; deduplicate visited interfaces and test conflicting parents.

**Follow-ups:** What about an overridden method? Define and test override precedence explicitly; @Inherited does not solve it.

**Primary reference:** [Java 21 Inherited](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/annotation/Inherited.html).

---

**3. Adding a second repeatable route annotation makes a single-annotation lookup return null. How should discovery change?**

**Say aloud:** “A repeatable annotation permits multiple declarations of the same annotation type. The compiler can represent repeated declarations inside a container annotation. A single getAnnotation query does not flatten that container into multiple results. I would use getAnnotationsByType when associated annotations, including applicable inheritance, are intended, or getDeclaredAnnotationsByType for the declarations on the current element. The route registry must then validate all discovered routes and reject duplicate identities. This is a discovery change with compatibility consequences: code that assumed one route must now handle zero, one or several. I would test both a lone annotation and repeated annotations so a source-level simplification does not hide the container case.”

**Example:**

```text
Route[] routes = method.getDeclaredAnnotationsByType(Route.class);
```

**Deep dive / verification:** Result processing is O(number of routes); reject conflicting routes before serving requests.

**Follow-ups:** Does getDeclaredAnnotations flatten containers? No; use the ByType API for that purpose.

**Primary reference:** [Java 21 AnnotatedElement](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/AnnotatedElement.html).

---

**4. A reflective command registry works until methods are reordered by a different compiler. What contract was assumed?**

**Say aloud:** “Reflection exposes members, but declared-method enumeration is not a source-order contract. I would never assign command numbers or choose a winning handler by its array position. Stable identifiers should come from an explicit annotation or an external schema, with duplicate identifiers treated as startup errors. Sorting by a documented signature can give deterministic presentation, but it cannot repair an ambiguous dispatch policy. The registry should distinguish instance, static and unsupported synthetic members before accepting entries. For a small fixed command set an explicit map is easier to audit than scanning. I would verify the registry against multiple declaration orders and overloads, asserting the same public command identities.”

**Example:**

```text
commands.putIfAbsent(explicitCommandId, validatedMethod); reject an existing mapping.
```

**Deep dive / verification:** Building a sorted presentation costs O(m log m) for m members; no enumeration order guarantee.

**Follow-ups:** Can method names alone be IDs? Only if overloads and future renames are explicitly prohibited by the contract.

**Primary reference:** [Java 21 Class](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Class.html).

---

**5. A scanner sees a private child method but misses a public inherited method. Which lookup should it use?**

**Say aloud:** “Declared member lookup describes methods declared by that class, including nonpublic ones, and excludes inherited methods. Public member lookup includes public inherited methods. I would choose the API from the registry contract rather than combine both lists indiscriminately. A public extension-point scanner may want getMethods, while a serializer that deliberately inspects private declarations needs explicit hierarchy traversal and access rules. Discovering a member does not authorize invoking it. I would validate signatures, duplicate identities and accessible declaring types before registering anything. Tests should include a parent method, a child override and a private child helper; these distinguish discovery semantics much better than a class containing only one public method.”

**Example:**

```text
Public extension points: inspect type.getMethods(); local declarations: inspect type.getDeclaredMethods().
```

**Deep dive / verification:** Scan cost grows with discovered members; traversal and conflict rules must be explicit.

**Follow-ups:** Will getDeclaredMethods include constructors? No; constructors have separate reflection APIs.

**Primary reference:** [Java 21 Class](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Class.html).

---

**6. A generic implementation registers its handler twice because a bridge method appears. What is a bridge?**

**Say aloud:** “A bridge is a compiler-generated method that preserves overriding behavior after generic type erasure, which removes many source-level type distinctions from runtime signatures. A class implementing a generic handler can therefore expose both a concrete method and a bridge forwarding method. A naive scanner may interpret those as two business operations. I would inspect isBridge and define how logical handlers map to implementation methods. Filtering bridges is appropriate for this simple registry, but a general framework also needs deliberate annotation and override resolution. I would not blindly discard every synthetic member without understanding its purpose. A regression should use a real generic implementation and assert one registered logical operation.”

**Example:**

```text
Handler<String>.handle(String) may coexist with a bridge handle(Object); registry policy excludes isBridge().
```

**Deep dive / verification:** One pass is O(m) over methods; compiler artifacts are not independent business handlers.

**Follow-ups:** Why not key only by name? Overloads can be legitimate; validate the full intended contract.

**Primary reference:** [Java 21 Method](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Method.html).

---

**7. A reflective handler throws a domain exception, but the retry classifier sees InvocationTargetException. What should it inspect?**

**Say aloud:** “InvocationTargetException wraps a failure thrown by the target method or constructor. I would inspect its cause at the reflection boundary and translate it according to the application error contract. That differs from lookup, access or argument failures, which mean the invocation mechanism itself was misconfigured. Automatically retrying every wrapper can replay a permanent validation rejection and can duplicate side effects already performed before the target threw. I would preserve the cause for internal diagnosis while returning a safe public error. Fatal failures should not be indiscriminately converted into ordinary retryable responses. Tests should include a successful target, a domain rejection and an invalid invocation signature so classification follows the actual failure.”

**Example:**

```text
catch (InvocationTargetException failure) { classifyTargetFailure(failure.getCause()); }
```

**Deep dive / verification:** Unwrapping does not roll back target effects; retry safety remains an application decision.

**Follow-ups:** Can lookup failure be handled identically? No; it is configuration failure rather than evidence that business code ran.

**Primary reference:** [Java 21 InvocationTargetException](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/InvocationTargetException.html).

---

**8. A method accepting a String array rejects a reflective call with two strings. Why does varargs not adapt it?**

**Say aloud:** “Variable arity is a source-language calling convenience. Method.invoke itself accepts a variable number of Object arguments, while the target method still has its declared array parameter. Passing two strings supplies two reflective arguments to a target expecting one array. I would construct the target argument array deliberately and pass that array as one Object. Otherwise an Object-compatible array may be expanded at the invocation boundary. This is separate from overload resolution: the Method has already been selected. Reflection should be isolated behind a typed adapter so normal business code cannot repeatedly make this mistake. I would test empty arrays, one element and several elements, plus the distinct contract for a null array.”

**Example:**

```text
method.invoke(receiver, (Object) new String[]{"a", "b"}); // target takes String[]
```

**Deep dive / verification:** Argument packaging is O(k) for k elements; invocation cannot infer the intended target argument grouping.

**Follow-ups:** What about zero target arguments? An empty Object[] supplies zero arguments; an array-valued argument needs its own slot.

**Primary reference:** [Java 21 Method](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Method.html).

---

**9. A module exports a package, yet private reflection fails. What does opens change?**

**Say aloud:** “A Java module groups packages behind explicit boundaries. Exporting a package makes its public API accessible under the module rules; it does not generally authorize deep reflection into private members. Opening a package permits deeper reflective access to the permitted modules. I would prefer a public supported API, then a narrow qualified opens only when a framework genuinely requires it. trySetAccessible can report inability to enable access instead of the caller assuming success. Broad command-line openings weaken encapsulation and can hide deployment differences. I would test the packaged named modules because a classpath-only test can miss this boundary. Private access is also not a substitute for validating input or authorizing a business operation.”

**Example:**

```text
module domain { exports api; opens model to mapper.runtime; }
```

**Deep dive / verification:** Access is a capability boundary, not a speed optimization; handle a false trySetAccessible result deliberately.

**Follow-ups:** Does discovery imply access? No; obtaining a Field or Method and successfully using it are separate operations.

**Primary reference:** [Java 21 AccessibleObject](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/AccessibleObject.html).

---

**10. A request binder suddenly expects arg0 instead of customerId after a build change. What evidence should it check?**

**Say aloud:** “Parameter names are optional class-file metadata. Reflection can return a synthesized name such as arg0 when the real name was not retained. I would check isNamePresent and inspect compiler settings in the actual artifact. For javac, -parameters records method parameter names, but a public wire contract based on incidental Java names remains fragile under refactoring or bytecode transformation. An explicit stable binding annotation is preferable when the request field is part of an external API. Missing required binding metadata should fail validation during startup. I would compile or inspect an artifact without names as a negative case and verify that the application reports a configuration error instead of accepting a changed request schema.”

**Example:**

```text
if (!parameter.isNamePresent()) requireExplicitBindingName(parameter);
```

**Deep dive / verification:** Inspection is O(parameters); metadata retention does not make Java renames API-compatible.

**Follow-ups:** Are debug symbols enough? Do not assume so; verify isNamePresent in the distributed artifact.

**Primary reference:** [Java 21 Parameter](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Parameter.html).

---

**11. A schema generator casts List<String> metadata to Class and crashes. What shape can a reflected type have?**

**Say aloud:** “A reflected Type is a description that can represent more than a runtime Class. A parameterized declaration such as List<String> is represented through ParameterizedType; its raw type and actual type arguments are separate pieces. I would branch on the supported Type forms instead of casting every result to Class. Type variables, wildcard bounds and generic arrays require explicit handling or an understandable unsupported-schema error. A declaration containing T is not automatically resolved to String without the relevant substitution context. This metadata describes declarations; it does not inspect every value stored in a list. I would test nested parameterized types and unresolved variables before accepting the generator for public schemas.”

**Example:**

```text
For ParameterizedType p: inspect p.getRawType() and recursively inspect p.getActualTypeArguments().
```

**Deep dive / verification:** Traversal cost follows the type graph; recursive bounds require cycle protection and output limits.

**Follow-ups:** Can metadata prove list contents are strings? No; raw or unchecked operations can violate source-level expectations.

**Primary reference:** [Java 21 ParameterizedType](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/ParameterizedType.html).

---

**12. A primitive int.class check rejects an Integer object in a generic validator. Why?**

**Say aloud:** “A Class object can describe either a reference type or a primitive type, but those categories do not have identical runtime-instance semantics. An Integer object is a boxed reference value; it is not an instance of the primitive class token int.class. I would normalize primitive declarations to their wrapper types only if that matches the validator contract, and separately reject null for required primitive inputs. That normalization still does not implement all Java invocation conversions or numeric range checks. For example, accepting a Number does not establish that a long value fits into an int. I would define whether validation means exact type, assignability or safe conversion and test each boundary independently.”

**Example:**

```text
int.class.isInstance(Integer.valueOf(3)) is false; Integer.class.isInstance(Integer.valueOf(3)) is true.
```

**Deep dive / verification:** A fixed primitive-to-wrapper mapping uses constant space; overflow and null policy require additional checks.

**Follow-ups:** Should every Number be accepted? Only with an explicit conversion and range policy; narrowing can lose information.

**Primary reference:** [Java 21 Class](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Class.html).

---

**Topic coverage:** Runtime annotation discovery, inheritance, repeatable containers, member enumeration, bridge methods, failure classification, argument packaging, module access, parameter metadata, generic schemas and primitive tokens.

**Next set:** Build on explicit metadata contracts with generated registries and compatibility checks across application releases, then return to distributed ingestion recovery.
