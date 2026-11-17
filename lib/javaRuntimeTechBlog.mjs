export const JAVA_RUNTIME_BLOG = {
  "id": "java-runtime-jdk-jvm-classloaders",
  "title": "Java Runtime Deep Dive: JDK, JRE, JVM, JIT, and Class Loaders",
  "category": "Java runtime foundations",
  "javaRelease": 17,
  "summary": "Eight detailed chapters from source compilation to HotSpot optimization, loader types, delegation, initialization, and plugin type identity.",
  "lessons": [
    "JDK, JRE, and JVM: tools, runtime, and execution",
    "From source to execution: bytecode and compatibility",
    "Inside the JVM: memory and execution responsibilities",
    "JIT compilation: interpreter, C1, C2, and deoptimization",
    "Class loader types: bootstrap, platform, application, and custom",
    "Parent delegation and defining versus initiating loaders",
    "Loading, linking, and initialization are separate events",
    "Type identity, plugin isolation, and safe unloading"
  ],
  "sections": [
    {
      "heading": "Scope and lab setup",
      "body": "Java 17+ classpath labs; architecture references use Java SE 21. HotSpot behavior is labeled separately from specification guarantees. Compile all examples together with javac --release 17, then run RuntimeClassLoadingChecks from the registered fixture. These are executable probes, not a production plugin container or a benchmark."
    },
    {
      "heading": "Troubleshooting workflow",
      "body": "Capture the exact java -version, artifact, launch flags and dependency graph. Distinguish ClassNotFoundException (explicit lookup), NoClassDefFoundError (definition/linkage or prior failed initialization), UnsupportedClassVersionError (runtime too old), NoSuchMethodError (binary mismatch), and ClassCastException (incompatible identities). Read the earliest cause, inspect javap -verbose and loader identities, and use HotSpot -Xlog:class+load=info or JFR where appropriate. Avoid logging secrets or collecting unbounded diagnostics."
    },
    {
      "heading": "Primary reference: JVM loading, linking, initialization",
      "body": "https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html"
    },
    {
      "heading": "Primary reference: ClassLoader API and built-in loader roles",
      "body": "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ClassLoader.html"
    },
    {
      "heading": "Primary reference: HotSpot tiered compilation and code cache",
      "body": "https://docs.oracle.com/en/java/javase/21/vm/java-hotspot-virtual-machine-performance-enhancements.html"
    },
    {
      "heading": "Primary reference: JVM runtime data areas",
      "body": "https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html"
    },
    {
      "heading": "Primary reference: JDK migration guide",
      "body": "https://docs.oracle.com/en/java/javase/21/migrate/removed-tools-and-components.html"
    }
  ],
  "interviewQuestions": [
    "Why can a runtime execute an application while being unable to compile its source?",
    "Why can changing the runtime fail even though compilation succeeded?",
    "Why is \u201call memory is the heap\u201d a misleading operational model?",
    "Why is timing one loop once insufficient to prove that JIT made it faster?",
    "What does a null result from Object.class.getClassLoader mean?",
    "Why prefer overriding findClass rather than replacing loadClass?",
    "Why might Class.forName behave differently from loader.loadClass?",
    "How can \u201cPluginValue cannot be cast to PluginValue\u201d be real?"
  ],
  "practice": "Package a host API once, load two private implementations, predict delegation and initialization, and explain how to stop and release each plugin. Verify class identities and missing-class outcomes before discussing performance.",
  "capstone": {
    "title": "Capstone: diagnose a plugin startup failure",
    "scenario": "A Java 17 host receives a plugin compiled on Java 21, then a rebuilt plugin duplicates the host API and starts a thread that retains its context loader.",
    "steps": [
      "Check class-file versions and rebuild against the supported release and dependencies.",
      "Move shared API ownership to the parent and verify casts across two plugin loaders.",
      "Stop plugin activity, restore context-loader references, close owned resources, and observe repeated reloads."
    ],
    "outcome": "Explain each failure with evidence and separate compatible packaging, type identity, resource cleanup, and eventual unloading."
  }
};

export const JAVA_RUNTIME_CHAPTERS = [
  {
    "title": "1. JDK, JRE, and JVM: tools, runtime, and execution",
    "lesson": "A JDK is a development kit: it supplies tools such as javac and javap alongside a runtime. A JRE is the runtime concept: a JVM implementation plus libraries and supporting files needed to execute applications. The JVM is the abstract machine specified for class files; HotSpot is one implementation. These are different responsibilities, not three competing ways to run Java. Modern Java distributions need not ship a separate JRE download or a nested jre directory. Since Java 9, modular runtime images and jlink allow deliberately reduced runtimes.",
    "walkthrough": "Assume a command-line application targeting Java 17. Compile with javac --release 17 Hello.java, inspect javap -c Hello, then run java Hello on a compatible runtime. javac produces portable class-file instructions; the runtime supplies platform-specific execution. --release checks language, class format, and the supported platform API surface for that target; it does not bundle third-party dependencies or native libraries. A smaller linked image saves space but requires explicit module inventory and integration testing. Follow-up: Can every JDK create any target image? No. --release targets supported older compilation APIs, while jlink builds an image from the modules supplied to it. Cross-platform packaging and third-party modules have additional constraints; pin the build distribution and test the actual deployment image.",
    "quiz": "Why can a runtime execute an application while being unable to compile its source?",
    "answer": "The runtime provides execution and libraries; compiling source requires development tools. I build with a JDK, then deploy a compatible runtime image containing the required modules. I verify java -version and javac -version separately because PATH can select different installations. A custom image reduces footprint but can omit a dynamically discovered provider, so I test the packaged artifact, not only the developer machine.",
    "whenToUse": "Choose JDK tools for building and a tested runtime image for deployment.",
    "avoid": "Assuming every modern runtime contains javac, rt.jar, or a jre subdirectory.",
    "exercise": "Explain the published example aloud, predict its outcome, then verify it. Can every JDK create any target image? No. --release targets supported older compilation APIs, while jlink builds an image from the modules supplied to it. Cross-platform packaging and third-party modules have additional constraints; pin the build distribution and test the actual deployment image.",
    "practiceProblems": "Trace one successful case and one failure boundary; explain which guarantee comes from the JVM and which is an implementation choice.",
    "example": "final class RuntimeToolsExample {\n  static boolean hasCompiler() { return javax.tools.ToolProvider.getSystemJavaCompiler() != null; }\n}",
    "diagramKey": "runtime0",
    "authoredPractice": true
  },
  {
    "title": "2. From source to execution: bytecode and compatibility",
    "lesson": "Bytecode is the instruction set stored in a class file. javac translates source; the java launcher starts a JVM, which loads the entry class and invokes its entry point. The JVM validates class-file structure and bytecode constraints before execution. Java portability depends on compatible class versions, available APIs, dependencies, and any operating-system or native assumptions. A JAR is an archive, not a guarantee that every dependency is included.",
    "walkthrough": "Build a Java 17 artifact and run it on a Java 17-or-newer compatible environment with its dependencies. Run javap -verbose to inspect the major version; Java 17 class files use 61. A Java 21 class file uses 65 and cannot simply be run on Java 17. Our executable example checks a magic header without pretending to be a bytecode verifier. Verification of a header alone cannot establish that instructions, references, or access rules are valid. Follow-up: Does bytecode mean platform independence is absolute? No. Native libraries, file paths, encodings, architecture, external tools, and runtime configuration can constrain execution. Test the complete package on the supported platform.",
    "quiz": "Why can changing the runtime fail even though compilation succeeded?",
    "answer": "Compilation sees one API and dependency graph; deployment may supply another. A newer class format can produce UnsupportedClassVersionError, a missing type can prevent linkage, and a changed method descriptor can produce NoSuchMethodError. I reproduce with the exact artifact and runtime, inspect class versions and the resolved dependency graph, and rebuild for the supported target rather than changing a class-file version byte.",
    "whenToUse": "Diagnosing build/runtime mismatch and artifact packaging.",
    "avoid": "Editing class-file version bytes as a compatibility strategy.",
    "exercise": "Explain the published example aloud, predict its outcome, then verify it. Does bytecode mean platform independence is absolute? No. Native libraries, file paths, encodings, architecture, external tools, and runtime configuration can constrain execution. Test the complete package on the supported platform.",
    "practiceProblems": "Trace one successful case and one failure boundary; explain which guarantee comes from the JVM and which is an implementation choice.",
    "example": "final class BytecodeHeaderExample {\n  static boolean hasMagic(byte[] bytes) { return bytes != null && bytes.length >= 4 && (bytes[0] & 255) == 202 && (bytes[1] & 255) == 254 && (bytes[2] & 255) == 186 && (bytes[3] & 255) == 190; }\n}",
    "diagramKey": "runtime1",
    "authoredPractice": true
  },
  {
    "title": "3. Inside the JVM: memory and execution responsibilities",
    "lesson": "The JVM specification describes shared heap and method area, plus per-thread stacks, program counters, and native method stacks where used. A stack frame holds a method invocation\u2019s local variables and operand stack. The heap supports objects and arrays. The specification does not require one physical memory layout. In HotSpot, metaspace stores class metadata and the code cache stores generated native code; neither should be confused with the Java object heap.",
    "walkthrough": "Assume a recursive function and an allocated array. Deep recursion consumes frames and can overflow the stack; retaining arrays consumes heap. The model computes a sum with a widened arithmetic formula to avoid accidental recursion. Increasing -Xmx cannot by itself repair a class-loader retention leak or a runaway recursion. Object references may be local variables, but do not infer that all objects physically stay on the heap: an optimizing VM can eliminate allocations when observable behavior is preserved. Follow-up: Can GC collect a class loader? Potentially, when the loader and its classes are unreachable and unloading is supported and performed. Live instances, static registries, threads, and context loaders can retain it. Calling System.gc does not promise unloading.",
    "quiz": "Why is \u201call memory is the heap\u201d a misleading operational model?",
    "answer": "I distinguish object retention, thread stacks, class metadata, direct/native allocations, and generated code. They have different owners and limits. OutOfMemoryError has multiple causes; I read its detail and correlate heap, thread, and native-memory evidence before changing a limit. StackOverflowError instead often points to recursion or excessive invocation depth. The JVM specification defines logical regions, while HotSpot\u2019s allocation and optimization choices are implementation details.",
    "whenToUse": "Choosing evidence for heap, stack, metaspace, or native pressure.",
    "avoid": "Treating -Xmx as a total process memory limit.",
    "exercise": "Explain the published example aloud, predict its outcome, then verify it. Can GC collect a class loader? Potentially, when the loader and its classes are unreachable and unloading is supported and performed. Live instances, static registries, threads, and context loaders can retain it. Calling System.gc does not promise unloading.",
    "practiceProblems": "Trace one successful case and one failure boundary; explain which guarantee comes from the JVM and which is an implementation choice.",
    "example": "final class RuntimeMemoryExample {\n  static long sum(int count) { if (count < 0) throw new IllegalArgumentException(\"negative count\"); return (long) count * (count - 1) / 2; }\n}",
    "diagramKey": "runtime2",
    "authoredPractice": true
  },
  {
    "title": "4. JIT compilation: interpreter, C1, C2, and deoptimization",
    "lesson": "A just-in-time compiler generates native machine code during execution. In typical tiered HotSpot execution, interpretation and profiling feed cheaper C1 compilation and more optimizing C2 compilation. This is an implementation strategy, not a JVM specification requirement or a fixed progression every method must complete. Frequently executed methods or loops can become compilation candidates. The generated code lives in a bounded code cache and consumes CPU and memory to produce.",
    "walkthrough": "Assume a service repeatedly sums integer input. Inlining can remove call overhead, and profiling can support speculative optimization: optimize for observed types while guarding assumptions. If an assumption stops holding, deoptimization reconstructs less optimized execution state. On-stack replacement can move an already-running hot loop into compiled execution. Our sum example verifies semantics only; it cannot establish compilation level or throughput. Use HotSpot compilation logs or JFR for runtime evidence and a JMH harness with warmup, forks, and consumed results for benchmarking. Follow-up: Is javac the JIT? No. javac compiles source to class files before execution; the JIT compiles runtime code paths to machine instructions. Disabling compilation is an experiment with major performance consequences, not a default production fix.",
    "quiz": "Why is timing one loop once insufficient to prove that JIT made it faster?",
    "answer": "It mixes startup, class initialization, compilation, garbage collection, and measurement overhead. Dead-code elimination can remove unused work, and constant folding can precompute it. I use a benchmark harness, representative nonconstant input, independent forks, and a reported runtime configuration. I distinguish cold-start latency from steady-state throughput. JIT trades compilation cost and memory for potential speed; it does not guarantee every program becomes faster.",
    "whenToUse": "Explaining warmup, code-cache pressure, or performance experiments.",
    "avoid": "Claiming fixed compilation thresholds, timings, or optimizations across JVMs.",
    "exercise": "Explain the published example aloud, predict its outcome, then verify it. Is javac the JIT? No. javac compiles source to class files before execution; the JIT compiles runtime code paths to machine instructions. Disabling compilation is an experiment with major performance consequences, not a default production fix.",
    "practiceProblems": "Trace one successful case and one failure boundary; explain which guarantee comes from the JVM and which is an implementation choice.",
    "example": "final class JitWorkExample {\n  static long sum(int[] values) { java.util.Objects.requireNonNull(values); long result = 0; for (int value : values) result += value; return result; }\n}",
    "diagramKey": "runtime3",
    "authoredPractice": true
  },
  {
    "title": "5. Class loader types: bootstrap, platform, application, and custom",
    "lesson": "A class loader locates or generates class bytes and defines a type. On Java 9+, built-in roles are bootstrap, platform, and system/application loaders. Bootstrap defines core types such as Object; Java represents its defining loader as null in Class.getClassLoader. Platform supplies platform classes beyond the bootstrap subset. The application loader normally loads application classpath and module-path classes. Java 8 instead used an extension loader; its extension-directory mechanism was removed in Java 9. Not every platform API is defined by the platform loader: many are bootstrap-defined.",
    "walkthrough": "In a normal Java 17 classpath launch, Object.class.getClassLoader() is null, java.sql.Driver is platform-defined, and this example is application-defined. Inspect actual loaders; do not depend on internal implementation class names. URLClassLoader is a useful custom-loader API, but modern application loaders are not required to be URLClassLoader instances. Custom loaders support plugins, generated classes, and isolation. A custom loader is an extension technique, not a fourth universal built-in tier. Module readability and exports still constrain access. Follow-up: Is the thread context class loader another built-in tier? No. It is a mutable reference associated with a thread, often used by frameworks and service discovery to select a lookup loader. Restore it after scoped changes to prevent leakage into reused threads.",
    "quiz": "What does a null result from Object.class.getClassLoader mean?",
    "answer": "It represents bootstrap definition, not a missing class or error. I use the public platform and system loader APIs for modern Java, and inspect each Class object\u2019s defining loader when diagnosing visibility. I avoid assuming every JDK class uses one loader or casting the application loader to URLClassLoader. On Java 8 I explain the historical extension role separately, because the Java 9 module system changed runtime packaging and loader responsibilities.",
    "whenToUse": "Debugging platform, application, or plugin visibility.",
    "avoid": "Using Java 8 extension-directory recipes on modular JDKs.",
    "exercise": "Explain the published example aloud, predict its outcome, then verify it. Is the thread context class loader another built-in tier? No. It is a mutable reference associated with a thread, often used by frameworks and service discovery to select a lookup loader. Restore it after scoped changes to prevent leakage into reused threads.",
    "practiceProblems": "Trace one successful case and one failure boundary; explain which guarantee comes from the JVM and which is an implementation choice.",
    "example": "final class LoaderTypesExample {\n  static ClassLoader definingLoader(Class<?> type) { return java.util.Objects.requireNonNull(type).getClassLoader(); }\n}",
    "diagramKey": "runtime4",
    "authoredPractice": true
  },
  {
    "title": "6. Parent delegation and defining versus initiating loaders",
    "lesson": "The default ClassLoader.loadClass algorithm checks whether the class was already loaded, delegates to its parent (or bootstrap), then calls findClass if needed. A defining loader creates the type; an initiating loader may ask for a class ultimately defined elsewhere. The parent relationship is delegation, not Java inheritance. Loading Object through a plugin loader should normally reuse the parent\u2019s core type. Delegation reduces accidental duplicate definitions of shared contracts.",
    "walkthrough": "Our child loader overrides no methods, so loading java.lang.String delegates and returns String.class. It does not create a second String. For a custom source, override findClass and preserve loadClass\u2019s synchronization and delegation unless a deliberately reviewed isolation policy requires otherwise. Child-first loading can isolate plugin libraries, but can duplicate shared APIs or create linkage conflicts. Concurrent loading and cyclic delegation introduce lock/deadlock concerns; parallel-capable subclasses must register and satisfy their locking requirements. Follow-up: Can a parent always see a child\u2019s classes? No. Delegation usually goes upward. Frameworks may intentionally use a thread context loader or explicit plugin loader for discovery, with a scoped lifecycle and access checks.",
    "quiz": "Why prefer overriding findClass rather than replacing loadClass?",
    "answer": "findClass supplies bytes while the inherited loadClass preserves the established lookup, delegation, and locking contract. A parent-defined shared API lets host and plugins exchange values through one type identity. If child-first loading is required, I define exact package boundaries, preserve platform/shared APIs, and test duplicate classes and concurrent loading. A ClassNotFoundException is a lookup outcome; it does not justify silently creating another copy of a host contract.",
    "whenToUse": "Implementing plugin lookup with a shared host API.",
    "avoid": "Blanket child-first loading or bypassing class-loading locks.",
    "exercise": "Explain the published example aloud, predict its outcome, then verify it. Can a parent always see a child\u2019s classes? No. Delegation usually goes upward. Frameworks may intentionally use a thread context loader or explicit plugin loader for discovery, with a scoped lifecycle and access checks.",
    "practiceProblems": "Trace one successful case and one failure boundary; explain which guarantee comes from the JVM and which is an implementation choice.",
    "example": "final class DelegationExample {\n  static Class<?> throughChild(String name) throws ClassNotFoundException { return new ClassLoader(DelegationExample.class.getClassLoader()) {}.loadClass(name); }\n}",
    "diagramKey": "runtime5",
    "authoredPractice": true
  },
  {
    "title": "7. Loading, linking, and initialization are separate events",
    "lesson": "Loading creates the runtime representation from class bytes. Linking includes verification, preparation, and resolution. Preparation establishes static storage and specified initial values; initialization executes class initialization code such as static field initializers and static blocks. Resolution can be lazy, so do not picture every symbolic reference being resolved before the first application instruction. Active use, including constructing an instance or invoking a class\u2019s static method, can trigger initialization. Reading a compile-time constant may not.",
    "walkthrough": "Our probe loads a nested Target with Class.forName(name, false, loader), checks that a separate counter stays zero, then initializes it with true. Its static block increments once. Repeating true does not rerun the initializer. This lab must run in a fresh JVM because initialization is once per defined class. Initialization is synchronized by the VM: concurrent callers wait, and recursive/cyclic initialization requires care. A failing initializer can leave the class erroneous; later uses can fail with NoClassDefFoundError rather than retrying the block. Follow-up: Will reading static final always initialize the owner? No. A constant variable can be inlined into client bytecode. A static final object or a value computed by a method is not that same compile-time-constant case. Inspect bytecode to verify the access.",
    "quiz": "Why might Class.forName behave differently from loader.loadClass?",
    "answer": "The one-argument Class.forName normally requests initialization, while loadClass normally loads without initializing. I use the explicit boolean overload when initialization would cause side effects. I separate byte discovery, linkage errors, and initializer failures in diagnostics. Static initialization should avoid remote calls and cyclic cross-class dependencies because failure poisons that defined class and blocking can delay all waiting callers.",
    "whenToUse": "Controlling side effects during discovery and diagnosing startup failures.",
    "avoid": "Treating loading as equivalent to running static initializers.",
    "exercise": "Explain the published example aloud, predict its outcome, then verify it. Will reading static final always initialize the owner? No. A constant variable can be inlined into client bytecode. A static final object or a value computed by a method is not that same compile-time-constant case. Inspect bytecode to verify the access.",
    "practiceProblems": "Trace one successful case and one failure boundary; explain which guarantee comes from the JVM and which is an implementation choice.",
    "example": "final class InitializationExample {\n  static int initialized; static class Target { static { initialized++; } }\n  static Class<?> locate(boolean initialize) throws ClassNotFoundException { return Class.forName(InitializationExample.class.getName() + \"$Target\", initialize, InitializationExample.class.getClassLoader()); }\n}",
    "diagramKey": "runtime6",
    "authoredPractice": true
  },
  {
    "title": "8. Type identity, plugin isolation, and safe unloading",
    "lesson": "For ordinary reference types, runtime identity includes the binary name and defining loader. Two loaders can define identical bytes under the same name and still produce distinct types. Casting one to the other fails even if the error prints the same class name. A plugin architecture should keep its shared interface in a parent loader while loading implementation and private dependencies in the plugin loader. Module access rules remain additional constraints; a loader is not a security sandbox for untrusted code.",
    "walkthrough": "The example uses an empty-parent URLClassLoader pointing at the compiled lab directory twice. Each defines PluginValue independently. Equality is false, isInstance is false across definitions, and Class.cast throws ClassCastException. Both still inherit bootstrap Object. URLClassLoader.close releases resources such as open JAR handles; it does not immediately unload classes. Stop plugin threads, unregister callbacks and JDBC drivers where owned, clear ThreadLocal and context-loader references, and release instances before expecting collection. Execute untrusted plugins behind a stronger process boundary. Follow-up: Is child-first always better for plugins? No. It isolates private versions but increases duplicate API and split-package risk. Parent-first is simpler when dependency versions can align; narrowly scoped isolation needs integration tests and a documented reload lifecycle.",
    "quiz": "How can \u201cPluginValue cannot be cast to PluginValue\u201d be real?",
    "answer": "The names match but the defining loaders differ. I inspect both Class objects and their loaders, then ensure host and plugin share one parent-defined API instead of copying it into each isolated loader. Private dependencies may stay isolated, but values crossing the boundary must obey the shared contract. Closing a URLClassLoader is necessary resource cleanup, not proof of class unloading; I inspect reachability and class-loading metrics during repeated reloads.",
    "whenToUse": "Designing reloadable plugins and diagnosing same-name cast failures.",
    "avoid": "Treating custom loaders as a security boundary or close as forced unloading.",
    "exercise": "Explain the published example aloud, predict its outcome, then verify it. Is child-first always better for plugins? No. It isolates private versions but increases duplicate API and split-package risk. Parent-first is simpler when dependency versions can align; narrowly scoped isolation needs integration tests and a documented reload lifecycle.",
    "practiceProblems": "Trace one successful case and one failure boundary; explain which guarantee comes from the JVM and which is an implementation choice.",
    "example": "final class PluginIsolationExample {\n  static Class<?> load(java.net.URLClassLoader loader) throws ClassNotFoundException { return loader.loadClass(\"PluginValue\"); }\n}\nclass PluginValue {\n}",
    "diagramKey": "runtime7",
    "authoredPractice": true
  }
];
