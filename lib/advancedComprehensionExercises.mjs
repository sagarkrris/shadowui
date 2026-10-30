// Runnable Java 17 models; behavioral fixtures compile these exact published strings.
export const ADVANCED_COMPREHENSION_EXERCISES = [
  {
    "id": "request-path",
    "title": "Why does a request return another tenant’s account?",
    "level": "Advanced comprehension",
    "javaRelease": 17,
    "goal": "Follow a controller, service and repository without trusting method names.",
    "question": "Trace controller(\"north\", \"7\") through all three collaborators. Both tenants have account 7. Identify where tenant identity disappears and repair that boundary.",
    "contract": "This is a runnable in-memory model, not Spring or a database. Inputs are non-null, case-sensitive strings. Return only the account matching both tenant and id, or Optional.empty(). List order must not affect isolation; tenant identity is supplied by a trusted caller.",
    "vocabulary": [
      [
        "Tenant",
        "An organization whose data must remain separate."
      ],
      [
        "Optional",
        "A container representing a present or absent result."
      ],
      [
        "Repository",
        "The collaborator that looks up stored records."
      ]
    ],
    "explanation": [
      "Controller. Receives north and 7; forwards both unchanged.",
      "Service. The starter ignores tenant and asks the repository for id alone.",
      "Repository. The first id 7 belongs to south, so the wrong account is returned.",
      "Correct path. Match both tenant and id; north now receives its own account."
    ],
    "sample": "Exercise.controller(\"north\", \"7\")",
    "expected": "Optional containing Account[tenant=north, id=7]",
    "actual": "Optional containing Account[tenant=south, id=7]",
    "trace": [
      [
        "1",
        "Controller",
        "Receives north and 7; forwards both unchanged."
      ],
      [
        "2",
        "Service",
        "The starter ignores tenant and asks the repository for id alone."
      ],
      [
        "3",
        "Repository",
        "The first id 7 belongs to south, so the wrong account is returned."
      ],
      [
        "4",
        "Correct path",
        "Match both tenant and id; north now receives its own account."
      ]
    ],
    "flow": [
      [
        "Controller",
        "Receives north and 7; forwards both unchanged."
      ],
      [
        "Service",
        "The starter ignores tenant and asks the repository for id alone."
      ],
      [
        "Repository",
        "The first id 7 belongs to south, so the wrong account is returned."
      ],
      [
        "Correct path",
        "Match both tenant and id; north now receives its own account."
      ]
    ],
    "fix": "Pass the tenant into repository and apply both predicates there. Changing list order only conceals the defect.",
    "tests": [
      "Both tenants share an id; each receives its own record.",
      "Unknown tenant/id returns empty; reverse repository order.",
      "Null inputs are rejected before lookup."
    ],
    "spoken": "I would follow the actual arguments across the three layers. The controller preserves tenant identity, but the service drops it. Since ids are only unique inside a tenant, the repository returns the first matching record from another tenant. I would include tenant in the repository contract and predicate, then test shared ids, missing records and reordered storage. This protects this lookup only; authentication and trusted tenant derivation still need their own boundary.",
    "followUp": [
      "Can we filter in the controller instead?",
      "That can hide a wrong result without finding the correct one, and other callers remain exposed. Constrain the lookup itself. A database implementation should use a bound composite predicate and appropriate index, with separate authorization checks."
    ],
    "deepDive": "The list scan takes O(n) time and O(1) auxiliary space. A composite-key map trades memory for lookup speed but is unnecessary for the repair. Duplicate identical keys are outside this model; a real store needs an explicit uniqueness rule. There are no asynchronous writes or cancellation in this synchronous fixture.",
    "aiTrap": "An AI patch may filter the single returned Optional by tenant. With south first, that returns empty for north even though north’s record exists. Test expected identity, not merely absence of a cross-tenant result.",
    "sources": [
      [
        "Stream filtering",
        "https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/stream/Stream.html#filter(java.util.function.Predicate)"
      ]
    ],
    "starter": "import java.util.*;\n\npublic class Exercise {\n  public record Account(String tenant, String id) {}\n  static final List<Account> rows = List.of(new Account(\"south\", \"7\"), new Account(\"north\", \"7\"));\n  public static Optional<Account> controller(String tenant, String id) {\n    return service(Objects.requireNonNull(tenant), Objects.requireNonNull(id));\n  }\n  static Optional<Account> service(String tenant, String id) { return repository(id); }\n  static Optional<Account> repository(String id) {\n    return rows.stream().filter(a -> a.id().equals(id)).findFirst();\n  }\n}",
    "reference": "import java.util.*;\n\npublic class Exercise {\n  public record Account(String tenant, String id) {}\n  static final List<Account> rows = List.of(new Account(\"south\", \"7\"), new Account(\"north\", \"7\"));\n  public static Optional<Account> controller(String tenant, String id) {\n    return service(Objects.requireNonNull(tenant), Objects.requireNonNull(id));\n  }\n  static Optional<Account> service(String tenant, String id) { return repository(tenant, id); }\n  static Optional<Account> repository(String tenant, String id) {\n    return rows.stream().filter(a -> a.tenant().equals(tenant) && a.id().equals(id)).findFirst();\n  }\n}",
    "mock": false,
    "projectFiles": {
      "starter": [
        {
          "name": "Exercise.java",
          "source": "public class Exercise {\n  public record Account(String tenant, String id) {}\n  public static java.util.Optional<Account> controller(String tenant, String id) {\n    return new Controller().get(tenant, id);\n  }\n  public static void main(String[] args) { System.out.println(controller(\"north\", \"7\")); }\n}"
        },
        {
          "name": "Controller.java",
          "source": "import java.util.*;\npublic class Controller {\n  Optional<Exercise.Account> get(String tenant, String id) {\n    return new Service().find(Objects.requireNonNull(tenant), Objects.requireNonNull(id));\n  }\n}"
        },
        {
          "name": "Service.java",
          "source": "import java.util.*;\npublic class Service {\n  Optional<Exercise.Account> find(String tenant, String id) {\n    return new Repository().find(id);\n  }\n}"
        },
        {
          "name": "Repository.java",
          "source": "import java.util.*;\npublic class Repository {\n  static final List<Exercise.Account> rows = List.of(new Exercise.Account(\"south\", \"7\"), new Exercise.Account(\"north\", \"7\"));\n  Optional<Exercise.Account> find(String id) {\n    return rows.stream().filter(a -> a.id().equals(id)).findFirst();\n  }\n}"
        }
      ],
      "reference": [
        {
          "name": "Exercise.java",
          "source": "public class Exercise {\n  public record Account(String tenant, String id) {}\n  public static java.util.Optional<Account> controller(String tenant, String id) {\n    return new Controller().get(tenant, id);\n  }\n  public static void main(String[] args) { System.out.println(controller(\"north\", \"7\")); }\n}"
        },
        {
          "name": "Controller.java",
          "source": "import java.util.*;\npublic class Controller {\n  Optional<Exercise.Account> get(String tenant, String id) {\n    return new Service().find(Objects.requireNonNull(tenant), Objects.requireNonNull(id));\n  }\n}"
        },
        {
          "name": "Service.java",
          "source": "import java.util.*;\npublic class Service {\n  Optional<Exercise.Account> find(String tenant, String id) {\n    return new Repository().find(tenant, id);\n  }\n}"
        },
        {
          "name": "Repository.java",
          "source": "import java.util.*;\npublic class Repository {\n  static final List<Exercise.Account> rows = List.of(new Exercise.Account(\"south\", \"7\"), new Exercise.Account(\"north\", \"7\"));\n  Optional<Exercise.Account> find(String tenant, String id) {\n    return rows.stream().filter(a -> a.tenant().equals(tenant) && a.id().equals(id)).findFirst();\n  }\n}"
        }
      ]
    }
  },
  {
    "id": "lookup-cost",
    "title": "Why does this membership lookup slow down as inputs grow?",
    "level": "Advanced comprehension",
    "javaRelease": 17,
    "goal": "Optimize a scan while preserving order and duplicate results.",
    "question": "Trace allowed([b, a, b, c], [a, b]). Explain why a list membership check repeats work, replace it, and predict what happens to duplicate b values.",
    "contract": "Non-null lists of non-null strings, no concurrent mutation. Return requested values present in approved, preserving request order and duplicates. Do not mutate either input. The starter is functionally correct; its defect is repeated linear membership work.",
    "vocabulary": [
      [
        "Membership",
        "Whether a value belongs to a collection."
      ],
      [
        "O(n × m)",
        "Work can grow as the product of two input sizes."
      ],
      [
        "Hash set",
        "A collection optimized for membership; it does not promise iteration order."
      ]
    ],
    "explanation": [
      "Read request b. The approved list is scanned until b is found.",
      "Read a then b again. Each request starts another membership scan.",
      "Build membership set. Read approved once into a HashSet.",
      "Keep request traversal. Append b, a, b in that order; never iterate the set for output."
    ],
    "sample": "Exercise.allowed(List.of(\"b\", \"a\", \"b\", \"c\"), List.of(\"a\", \"b\"))",
    "expected": "[b, a, b] with one approved traversal for indexing",
    "actual": "[b, a, b], but approved.contains is called for each request",
    "trace": [
      [
        "1",
        "Read request b",
        "The approved list is scanned until b is found."
      ],
      [
        "2",
        "Read a then b again",
        "Each request starts another membership scan."
      ],
      [
        "3",
        "Build membership set",
        "Read approved once into a HashSet."
      ],
      [
        "4",
        "Keep request traversal",
        "Append b, a, b in that order; never iterate the set for output."
      ]
    ],
    "flow": [
      [
        "Read request b",
        "The approved list is scanned until b is found."
      ],
      [
        "Read a then b again",
        "Each request starts another membership scan."
      ],
      [
        "Build membership set",
        "Read approved once into a HashSet."
      ],
      [
        "Keep request traversal",
        "Append b, a, b in that order; never iterate the set for output."
      ]
    ],
    "fix": "Build one HashSet from approved before the loop, then check it while traversing requested. The output list still owns ordering and multiplicity.",
    "tests": [
      "Preserve repeated requests and request order; empty inputs produce empty output.",
      "Count approved-list contains calls with a test double; the reference must not repeatedly scan it.",
      "Compare against a simple oracle on many deterministic small inputs; input lists stay unchanged."
    ],
    "spoken": "The output is currently correct, but every requested item performs a list lookup that may scan all approved items. For n requests and m approvals, the worst case is O(n times m). I would construct one membership set in O(m), then walk requests in order, keeping repeated matches. Under normal hash dispersion this is expected O(n plus m) work with O(m) extra indexing space, plus the output. I would verify duplicates and ordering and measure representative workloads before claiming a wall-clock speedup.",
    "followUp": [
      "Why not convert the result to a set?",
      "The contract preserves duplicate requests and request order. A result set changes those semantics. Only the approved membership index should be a set."
    ],
    "deepDive": "HashSet basic operations have constant time under suitable hash dispersion, not an unconditional worst-case promise. For tiny approvals the allocation may cost more than scanning. Immutable String keys avoid mutable-key lookup surprises. The test measures structural work, not production latency or a benchmark.",
    "aiTrap": "An assistant may return new ArrayList<>(new HashSet<>(requested)). That loses duplicates and does not even filter approvals. Another trap is building the approved set inside the request loop, which retains repeated O(m) work.",
    "sources": [
      [
        "HashSet performance and ordering",
        "https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/HashSet.html"
      ]
    ],
    "starter": "import java.util.*;\n\npublic class Exercise {\n  public static List<String> allowed(List<String> requested, List<String> approved) {\n    Objects.requireNonNull(requested); Objects.requireNonNull(approved);\n    List<String> result = new ArrayList<>();\n    for (String value : requested) if (approved.contains(value)) result.add(value);\n    return result;\n  }\n}",
    "reference": "import java.util.*;\n\npublic class Exercise {\n  public static List<String> allowed(List<String> requested, List<String> approved) {\n    Objects.requireNonNull(requested); Objects.requireNonNull(approved);\n    Set<String> membership = new HashSet<>(approved);\n    List<String> result = new ArrayList<>();\n    for (String value : requested) if (membership.contains(value)) result.add(value);\n    return result;\n  }\n}",
    "mock": false
  },
  {
    "id": "ai-patch-contract",
    "title": "Which AI patch preserves a cached zero and its expiry?",
    "level": "Advanced comprehension",
    "javaRelease": 17,
    "goal": "Compare two plausible suggestions against one explicit contract.",
    "question": "The starter is AI proposal A: replace cache reading with getOrDefault. Proposal B checks presence and the exact expiry boundary. Which is valid? Construct a counterexample before opening the corrected implementation.",
    "contract": "Java 17 synchronous model. A cache maps non-null string keys to non-null Entry records. Entry.value is an int, including zero and negatives. A read returns OptionalInt.empty() for missing or expired entries; now >= expiresAt means expired. All times use the same clock and units; reads do not mutate entries.",
    "vocabulary": [
      [
        "OptionalInt",
        "An explicit present-or-absent integer result, so zero remains valid."
      ],
      [
        "Expiry",
        "The first time an entry is no longer usable."
      ],
      [
        "Counterexample",
        "A concrete input showing that a proposed rule fails."
      ]
    ],
    "explanation": [
      "Live zero at time 9. Entry(0, 10) must return a present zero.",
      "Missing key. Proposal A fabricates Entry(0, 0) and returns a present zero.",
      "Exact expiry at 10. Proposal A returns a stored value without checking time.",
      "Proposal B. Check entry presence and now < expiresAt, then return its value."
    ],
    "sample": "var cache = Map.of(\"zero\", new Exercise.Entry(0, 10));\nExercise.read(cache, \"missing\", 9)\nExercise.read(cache, \"zero\", 10)",
    "expected": "Both reads return OptionalInt.empty",
    "actual": "Both reads return OptionalInt[0]",
    "trace": [
      [
        "1",
        "Live zero at time 9",
        "Entry(0, 10) must return a present zero."
      ],
      [
        "2",
        "Missing key",
        "Proposal A fabricates Entry(0, 0) and returns a present zero."
      ],
      [
        "3",
        "Exact expiry at 10",
        "Proposal A returns a stored value without checking time."
      ],
      [
        "4",
        "Proposal B",
        "Check entry presence and now < expiresAt, then return its value."
      ]
    ],
    "flow": [
      [
        "Live zero at time 9",
        "Entry(0, 10) must return a present zero."
      ],
      [
        "Missing key",
        "Proposal A fabricates Entry(0, 0) and returns a present zero."
      ],
      [
        "Exact expiry at 10",
        "Proposal A returns a stored value without checking time."
      ],
      [
        "Proposal B",
        "Check entry presence and now < expiresAt, then return its value."
      ]
    ],
    "fix": "Accept proposal B: represent a miss separately, then enforce expiry. Shortening code with a default value changes the contract.",
    "tests": [
      "Present zero and negative values before expiry are preserved.",
      "Missing, exact expiry and after expiry return empty; one unit before expiry hits.",
      "Reading neither removes nor changes an entry."
    ],
    "spoken": "I would reject proposal A even though its output looks reasonable for a live positive value. A missing key becomes a present zero, and expired entries are returned because the time check disappeared. Proposal B checks the Entry and its deadline before returning OptionalInt.of(value), so it preserves zero without confusing it with absence. I would test missing, zero, negative and exact-boundary inputs and confirm no mutation. The assistant’s explanation is a hypothesis; the contract and counterexamples decide whether its patch is acceptable.",
    "followUp": [
      "Should we use a fallback zero instead of OptionalInt?",
      "Only if callers explicitly accept zero as the missing result. Here zero is real data, so collapsing the distinction changes observable behavior. Keep presence explicit."
    ],
    "deepDive": "This model does not load, evict or coordinate updates. It performs one map lookup and fixed additional work; map implementation controls lookup complexity. Backward clock adjustments and asynchronous stale loads require separate clock and ownership contracts. The fixed-time fixture does not test a live cache.",
    "aiTrap": "Prompt: “Compare proposals A and B against presence, zero and expiry; give expected and actual results before editing.” Reject a suggestion to use value > 0 as presence or to catch every exception and return empty, because both hide valid behavior or defects.",
    "sources": [
      [
        "OptionalInt",
        "https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/OptionalInt.html"
      ],
      [
        "Map lookup contract",
        "https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Map.html#getOrDefault(java.lang.Object,V)"
      ]
    ],
    "starter": "import java.util.*;\n\npublic class Exercise {\n  public record Entry(int value, long expiresAt) {}\n  public static OptionalInt read(Map<String, Entry> cache, String key, long now) {\n    Objects.requireNonNull(cache); Objects.requireNonNull(key);\n    return OptionalInt.of(cache.getOrDefault(key, new Entry(0, 0)).value());\n  }\n}",
    "reference": "import java.util.*;\n\npublic class Exercise {\n  public record Entry(int value, long expiresAt) {}\n  public static OptionalInt read(Map<String, Entry> cache, String key, long now) {\n    Objects.requireNonNull(cache); Objects.requireNonNull(key);\n    Entry entry = cache.get(key);\n    return entry != null && now < entry.expiresAt()\n        ? OptionalInt.of(entry.value()) : OptionalInt.empty();\n  }\n}",
    "mock": false
  },
  {
    "id": "async-ownership",
    "title": "Why does an older response overwrite the newer search?",
    "level": "Advanced comprehension",
    "javaRelease": 17,
    "goal": "Separate request order from completion order and invalidate stale ownership.",
    "question": "Request old, request new, complete new, then complete old. Predict the visible result. Repeat with cancellation between request and completion.",
    "contract": "A runnable single-process search-display model. Latest requested future alone may publish on successful completion. Failed/cancelled futures publish nothing. cancel() invalidates pending display updates and retains the previous display; it does not stop upstream work. Callers supply non-null futures with non-null successful strings. A failed latest request does not restore ownership to older requests.",
    "vocabulary": [
      [
        "Future",
        "A result that can complete later, successfully or exceptionally."
      ],
      [
        "Ownership token",
        "A unique object identifying the request currently allowed to publish."
      ],
      [
        "Synchronized",
        "Uses the same object monitor to serialize access to shared state."
      ]
    ],
    "explanation": [
      "Request old then new. Two callbacks capture different tokens; current belongs to new.",
      "Complete new. Its token matches; display becomes new.",
      "Complete old. Starter ignores token and changes display back to old.",
      "Guard publication. Compare and update under the same lock; obsolete callbacks do nothing."
    ],
    "sample": "var display = new Exercise();\nvar old = new java.util.concurrent.CompletableFuture<String>();\nvar recent = new java.util.concurrent.CompletableFuture<String>();\ndisplay.request(old);\ndisplay.request(recent);\nrecent.complete(\"new\");\nold.complete(\"old\");\ndisplay.value()",
    "expected": "new",
    "actual": "old",
    "trace": [
      [
        "1",
        "Request old then new",
        "Two callbacks capture different tokens; current belongs to new."
      ],
      [
        "2",
        "Complete new",
        "Its token matches; display becomes new."
      ],
      [
        "3",
        "Complete old",
        "Starter ignores token and changes display back to old."
      ],
      [
        "4",
        "Guard publication",
        "Compare and update under the same lock; obsolete callbacks do nothing."
      ]
    ],
    "flow": [
      [
        "Request old then new",
        "Two callbacks capture different tokens; current belongs to new."
      ],
      [
        "Complete new",
        "Its token matches; display becomes new."
      ],
      [
        "Complete old",
        "Starter ignores token and changes display back to old."
      ],
      [
        "Guard publication",
        "Compare and update under the same lock; obsolete callbacks do nothing."
      ]
    ],
    "fix": "Publish only when current == token inside the synchronized method. cancel() rotates the token so a late result cannot publish. Visibility and the ownership decision use the same lock.",
    "tests": [
      "New completes before old: final display remains new.",
      "Cancel before completion: late success is ignored; a later new request can succeed.",
      "Exceptional/cancelled latest future leaves display unchanged and does not revive old work.",
      "Already-completed futures and concurrent completion are safe under the shared monitor."
    ],
    "spoken": "I would distinguish which request started last from which completed last. The old request’s callback currently writes unconditionally, so it can replace the new result. I would assign each request a unique token and publish only while it owns the current token. The check and write must share one lock with request and cancel. Tests should control completion order directly instead of sleeping. Cancellation here revokes display ownership; it does not guarantee that network or background work has stopped.",
    "followUp": [
      "Would volatile value alone fix this?",
      "No. Visibility does not establish which callback may write. Even a volatile generation check followed by an unprotected write can race with a newer request. Serialize the ownership check and update, or confine both to a single event loop."
    ],
    "deepDive": "Each request allocates a token and callback, with constant state in the display. In-flight futures still retain callbacks until completion, so callers need timeout and workload limits. Non-async CompletableFuture callbacks can run on the completing thread; synchronized methods also handle an already-completed future reentrantly. This model deliberately omits UI-thread dispatch and real I/O.",
    "aiTrap": "An assistant may cancel only the old future and assume work cannot complete. CompletableFuture cancellation is exceptional completion, not proof of upstream interruption. Keep the publication guard even if cancellation is attempted.",
    "sources": [
      [
        "CompletableFuture completion and cancellation",
        "https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/CompletableFuture.html"
      ],
      [
        "Java monitor synchronization",
        "https://docs.oracle.com/javase/specs/jls/se17/html/jls-17.html#jls-17.1"
      ]
    ],
    "starter": "import java.util.*;\n\npublic class Exercise {\n  private Object current = new Object();\n  private String value = \"\";\n  public synchronized void request(java.util.concurrent.CompletableFuture<String> result) {\n    Objects.requireNonNull(result);\n    Object token = new Object();\n    current = token;\n    result.thenAccept(next -> publish(token, next));\n  }\n  private synchronized void publish(Object token, String next) {\n    value = next;\n  }\n  public synchronized void cancel() { current = new Object(); }\n  public synchronized String value() { return value; }\n}",
    "reference": "import java.util.*;\n\npublic class Exercise {\n  private Object current = new Object();\n  private String value = \"\";\n  public synchronized void request(java.util.concurrent.CompletableFuture<String> result) {\n    Objects.requireNonNull(result);\n    Object token = new Object();\n    current = token;\n    result.thenAccept(next -> publish(token, next));\n  }\n  private synchronized void publish(Object token, String next) {\n    if (current == token) value = next;\n  }\n  public synchronized void cancel() { current = new Object(); }\n  public synchronized String value() { return value; }\n}",
    "mock": false
  },
  {
    "id": "graph-visited",
    "title": "Why does dependency traversal repeat work or never finish?",
    "level": "Advanced comprehension",
    "javaRelease": 17,
    "goal": "Trace a queue and discover why visited state must govern expansion.",
    "question": "Trace A → B,C and B → C. Then consider C → A. Explain the duplicate and how the same defect causes a cycle to run forever.",
    "contract": "Finite, stable adjacency map with non-null nodes and adjacency lists. Missing adjacency means a leaf. Return every reachable node once in breadth-first encounter order, including root. Duplicate edges are allowed; do not mutate the graph. This discovers reachability, not a dependency execution order or cycle report.",
    "vocabulary": [
      [
        "Graph",
        "Nodes joined by edges representing relationships."
      ],
      [
        "Queue",
        "A first-in, first-out collection."
      ],
      [
        "Visited set",
        "Records nodes already expanded so each is processed once."
      ]
    ],
    "explanation": [
      "Start A. Queue contains A; output is empty.",
      "Expand A then B. A adds B,C; B adds another C.",
      "Starter expands C twice. Output becomes A,B,C,C; a back edge would keep adding work.",
      "Correct dequeue. seen.add returns false for repeats; skip both output and expansion."
    ],
    "sample": "Exercise.reachable(Map.of(\"A\", List.of(\"B\", \"C\"), \"B\", List.of(\"C\")), \"A\")",
    "expected": "[A, B, C]",
    "actual": "[A, B, C, C]",
    "trace": [
      [
        "1",
        "Start A",
        "Queue contains A; output is empty."
      ],
      [
        "2",
        "Expand A then B",
        "A adds B,C; B adds another C."
      ],
      [
        "3",
        "Starter expands C twice",
        "Output becomes A,B,C,C; a back edge would keep adding work."
      ],
      [
        "4",
        "Correct dequeue",
        "seen.add returns false for repeats; skip both output and expansion."
      ]
    ],
    "flow": [
      [
        "Start A",
        "Queue contains A; output is empty."
      ],
      [
        "Expand A then B",
        "A adds B,C; B adds another C."
      ],
      [
        "Starter expands C twice",
        "Output becomes A,B,C,C; a back edge would keep adding work."
      ],
      [
        "Correct dequeue",
        "seen.add returns false for repeats; skip both output and expansion."
      ]
    ],
    "fix": "Before output or expansion, continue when !seen.add(node). The finite graph then expands each reachable node at most once.",
    "tests": [
      "Diamond, duplicate edges, self-loop and multi-node cycle terminate with each node once.",
      "Missing root adjacency returns [root]; disconnected nodes are excluded.",
      "Neighbor encounter order is preserved and input data is unchanged."
    ],
    "spoken": "The queue contains paths, so two paths can enqueue the same node. The starter treats each queue entry as new work, producing duplicate C and failing to terminate on a cycle. I would use a visited set before expanding a dequeued node, so repeated paths do not expand it again. This gives expected O(V plus E) work under normal hash behavior. I would test a diamond and cycles as well as a straight chain. The result is breadth-first reachability; it does not prove a valid dependency execution order.",
    "followUp": [
      "Does this detect a circular build dependency?",
      "No. Skipping a visited node guarantees traversal termination but conflates shared dependencies with cycles. To report cycles use an active-path DFS state or a topological-sort algorithm with an explicit cycle condition."
    ],
    "deepDive": "V is reachable nodes and E is their outgoing edge count, including duplicate edges. The queue can use O(E) space here because duplicates are filtered on dequeue. Marking on enqueue reduces queued duplicates while retaining first-encounter order, but changes the implementation. Iteration avoids recursive stack overflow on a deep chain. Cancellation and concurrent mutation are outside this synchronous contract.",
    "aiTrap": "An AI patch may deduplicate only the final output. That still expands repeated nodes and never reaches the return on a cycle. Place the visited check before neighbor expansion.",
    "sources": [
      [
        "Deque queue operations",
        "https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Deque.html"
      ],
      [
        "Set.add result",
        "https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Set.html#add(E)"
      ]
    ],
    "starter": "import java.util.*;\n\npublic class Exercise {\n  public static List<String> reachable(Map<String, List<String>> graph, String root) {\n    Objects.requireNonNull(graph); Objects.requireNonNull(root);\n    List<String> result = new ArrayList<>();\n    Set<String> seen = new HashSet<>();\n    Deque<String> pending = new ArrayDeque<>();\n    pending.add(root);\n    while (!pending.isEmpty()) {\n      String node = pending.remove();\n      // Missing visited guard.\n      result.add(node);\n      pending.addAll(graph.getOrDefault(node, List.of()));\n    }\n    return result;\n  }\n}",
    "reference": "import java.util.*;\n\npublic class Exercise {\n  public static List<String> reachable(Map<String, List<String>> graph, String root) {\n    Objects.requireNonNull(graph); Objects.requireNonNull(root);\n    List<String> result = new ArrayList<>();\n    Set<String> seen = new HashSet<>();\n    Deque<String> pending = new ArrayDeque<>();\n    pending.add(root);\n    while (!pending.isEmpty()) {\n      String node = pending.remove();\n      if (!seen.add(node)) continue;\n      result.add(node);\n      pending.addAll(graph.getOrDefault(node, List.of()));\n    }\n    return result;\n  }\n}",
    "mock": false
  },
  {
    "id": "pagination-boundary",
    "title": "Why do passing pagination tests hide missing records?",
    "level": "Advanced comprehension",
    "javaRelease": 17,
    "goal": "Find a weak test oracle and enforce one total ordering for sorting and cursors.",
    "question": "Three rows have (rank,id) = (1,a),(1,b),(2,c). Read one row per page. Why does a test that checks only page size miss b?",
    "contract": "Static in-memory snapshot, unique non-null string ids, non-null rows, positive limit. Ascending order is rank then id using String.compareTo. Null cursor starts at the beginning. A cursor is exclusive and may be a tuple absent from the snapshot. No writes between pages; no input mutation.",
    "vocabulary": [
      [
        "Cursor",
        "The last ordering tuple from the previous page."
      ],
      [
        "Total order",
        "A comparison that breaks ties so each distinct row has a definite position."
      ],
      [
        "Test oracle",
        "The independent expected result used to judge behavior."
      ]
    ],
    "explanation": [
      "First page. Sorted first row is (1,a).",
      "Starter next filter. rank > 1 discards both a and b.",
      "Observed next page. Returns (2,c); a size-only assertion still passes.",
      "Correct tuple comparison. (1,b) is greater than (1,a), so b is retained."
    ],
    "sample": "Exercise.page(List.of(new Exercise.Row(1, \"a\"), new Exercise.Row(1, \"b\"), new Exercise.Row(2, \"c\")), new Exercise.Row(1, \"a\"), 1)",
    "expected": "[Row[rank=1, id=b]]",
    "actual": "[Row[rank=2, id=c]]",
    "trace": [
      [
        "1",
        "First page",
        "Sorted first row is (1,a)."
      ],
      [
        "2",
        "Starter next filter",
        "rank > 1 discards both a and b."
      ],
      [
        "3",
        "Observed next page",
        "Returns (2,c); a size-only assertion still passes."
      ],
      [
        "4",
        "Correct tuple comparison",
        "(1,b) is greater than (1,a), so b is retained."
      ]
    ],
    "flow": [
      [
        "First page",
        "Sorted first row is (1,a)."
      ],
      [
        "Starter next filter",
        "rank > 1 discards both a and b."
      ],
      [
        "Observed next page",
        "Returns (2,c); a size-only assertion still passes."
      ],
      [
        "Correct tuple comparison",
        "(1,b) is greater than (1,a), so b is retained."
      ]
    ],
    "fix": "Use ORDER.compare(row, after) > 0 in the filter, matching the sorting comparator. Test the concatenated ids of all pages against an independently specified sequence.",
    "tests": [
      "Walk all pages at limits 1 and 2; exact ids are a,b,c with no loss or repetition.",
      "Empty data, final page, absent cursor tuple and tied ranks.",
      "Unsorted inputs, negative/extreme ranks and invalid limit; input remains unchanged."
    ],
    "spoken": "The sort already breaks rank ties by id, but the cursor filter compares rank alone. After a, that filter removes b even though it should be next. The test only counts rows, so it accepts c as a plausible one-row page. I would apply the same lexicographic comparator to both filtering and sorting and verify complete identities across pages. The example assumes a static snapshot; stable cursor ordering alone cannot guarantee a consistent result set while records change.",
    "followUp": [
      "Is this efficient database keyset pagination?",
      "It models the semantics, not the query plan. This implementation scans and sorts in memory for each page. A real query needs the same composite predicate, compatible collation and an appropriate index, plus a snapshot or mutation policy."
    ],
    "deepDive": "For n rows, each call is O(n log n) worst-case time and O(n) sort storage, in addition to output; filtering may reduce the sorted count. Unique ids make tied ranks deterministic. Java string ordering must match any backing-store collation before transferring this predicate. Concurrent writes, deleted cursor records and retention need a separately stated snapshot contract.",
    "aiTrap": "An assistant may change > to >=. That repeats the prior rank and can return a forever at limit 1. Compare exact concatenated identities and impose a maximum page count so a broken test cannot hang.",
    "sources": [
      [
        "Comparator composition",
        "https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Comparator.html#thenComparing(java.util.function.Function)"
      ]
    ],
    "starter": "import java.util.*;\n\npublic class Exercise {\n  public record Row(int rank, String id) {}\n  private static final Comparator<Row> ORDER = Comparator.comparingInt(Row::rank).thenComparing(Row::id);\n  public static List<Row> page(List<Row> rows, Row after, int limit) {\n    Objects.requireNonNull(rows);\n    if (limit < 1) throw new IllegalArgumentException(\"limit\");\n    return rows.stream().filter(row -> after == null || row.rank() > after.rank())\n        .sorted(ORDER).limit(limit).toList();\n  }\n}",
    "reference": "import java.util.*;\n\npublic class Exercise {\n  public record Row(int rank, String id) {}\n  private static final Comparator<Row> ORDER = Comparator.comparingInt(Row::rank).thenComparing(Row::id);\n  public static List<Row> page(List<Row> rows, Row after, int limit) {\n    Objects.requireNonNull(rows);\n    if (limit < 1) throw new IllegalArgumentException(\"limit\");\n    return rows.stream().filter(row -> after == null || ORDER.compare(row, after) > 0)\n        .sorted(ORDER).limit(limit).toList();\n  }\n}",
    "mock": false
  },
  {
    "id": "mock-event-service",
    "title": "Mock project: repair an account snapshot service",
    "level": "Integrated mock project",
    "javaRelease": 17,
    "goal": "Combine collaborator tracing, tenant isolation and out-of-order replay in one investigation.",
    "question": "Spend 60 practice minutes: 10 mapping Service → Repository → data; 15 tracing demo(); 15 repairing two independent defects; 10 challenging an AI patch; 10 presenting evidence. Explain why fixing only one defect is insufficient.",
    "contract": "Runnable single-file project model with nested collaborators, not a deployed service. Non-null event fields; id uniqueness is tenant-scoped. Events are complete snapshots with nonnegative versions; equal versions carry the same payload. Reads and writes are single-threaded. Keep the highest version per tenant/id; a missing amount returns 0. No monetary arithmetic or external side effects.",
    "vocabulary": [
      [
        "Snapshot",
        "The complete state at a version, rather than an amount to add."
      ],
      [
        "Replay",
        "Delivering events again or out of original order."
      ],
      [
        "Composite key",
        "A key containing both tenant and id."
      ]
    ],
    "explanation": [
      "north v2 amount20. Starter stores under id alone.",
      "south v1 amount90. Overwrites north because both share id7.",
      "north v1 amount10. Unconditional assignment replaces newer state.",
      "Correct repository. Separate composite keys and accept only a strictly newer snapshot; north remains20."
    ],
    "sample": "Exercise.demo()",
    "expected": "20",
    "actual": "10",
    "trace": [
      [
        "1",
        "north v2 amount20",
        "Starter stores under id alone."
      ],
      [
        "2",
        "south v1 amount90",
        "Overwrites north because both share id7."
      ],
      [
        "3",
        "north v1 amount10",
        "Unconditional assignment replaces newer state."
      ],
      [
        "4",
        "Correct repository",
        "Separate composite keys and accept only a strictly newer snapshot; north remains20."
      ]
    ],
    "flow": [
      [
        "north v2 amount20",
        "Starter stores under id alone."
      ],
      [
        "south v1 amount90",
        "Overwrites north because both share id7."
      ],
      [
        "north v1 amount10",
        "Unconditional assignment replaces newer state."
      ],
      [
        "Correct repository",
        "Separate composite keys and accept only a strictly newer snapshot; north remains20."
      ]
    ],
    "fix": "Use a Key record with tenant and id, and replace only when no prior snapshot exists or incoming version is greater. Both changes are required. A read uses exactly the same key definition.",
    "tests": [
      "Replay north v2 then v1 and duplicate v2: amount remains20.",
      "Insert south with shared id and check both tenants independently.",
      "Repeat with different arrival orders; missing reads return0."
    ],
    "spoken": "I found two independent contract violations. The repository keys by id alone, so another tenant can overwrite the account, and unconditional save lets an older snapshot replace the latest version. I would introduce one composite key used for both read and write and compare versions before replacement. Then I would replay older and duplicate events and interleave another tenant with the same id. This is a single-threaded snapshot model: it does not prove atomic database updates or safe handling of delta events.",
    "followUp": [
      "Would ConcurrentHashMap alone make the fix concurrent?",
      "No. A get-compare-put sequence can race even in a concurrent map. Use an atomic per-key operation with its documented contract or a conditional database update. Separately define durability and equal-version conflicts."
    ],
    "deepDive": "Expected map operations are constant time under normal hashing; storage grows with distinct account keys. A record preserves key component boundaries without delimiter collisions. Snapshot ordering is valid because each newer event contains the complete state. Delta events need ordered accumulation or gap recovery. Deletion/tombstones and historical retention are outside this model. A production repository requires transactional and restart tests.",
    "aiTrap": "An assistant may suggest sorting all events before saving. Streaming arrivals cannot be globally sorted without a bounded window, and sorting does not fix tenant identity. Ask it for the failing trace after each proposed single fix.",
    "sources": [
      [
        "Records and generated equality",
        "https://docs.oracle.com/javase/specs/jls/se17/html/jls-8.html#jls-8.10"
      ],
      [
        "Map operations",
        "https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Map.html"
      ]
    ],
    "starter": "import java.util.*;\n\npublic class Exercise {\n  record Key(String tenant, String id) {}\n  public record Event(String tenant, String id, int version, int amount) {}\n  static class Repository {\n    final Map<Key, Event> data = new HashMap<>();\n    Key key(Event e) { return new Key(\"\", e.id()); }\n    void save(Event e) {\n      Key key = key(e);\n      Event old = data.get(key);\n      data.put(key, e);\n    }\n    int amount(String tenant, String id) {\n      Event e = data.get(new Key(\"\", id));\n      return e == null ? 0 : e.amount();\n    }\n  }\n  public static class Service {\n    final Repository repository = new Repository();\n    public void apply(Event event) { repository.save(Objects.requireNonNull(event)); }\n    public int read(String tenant, String id) { return repository.amount(tenant, id); }\n  }\n  public static int demo() {\n    Service service = new Service();\n    service.apply(new Event(\"north\", \"7\", 2, 20));\n    service.apply(new Event(\"south\", \"7\", 1, 90));\n    service.apply(new Event(\"north\", \"7\", 1, 10));\n    return service.read(\"north\", \"7\");\n  }\n}",
    "reference": "import java.util.*;\n\npublic class Exercise {\n  record Key(String tenant, String id) {}\n  public record Event(String tenant, String id, int version, int amount) {}\n  static class Repository {\n    final Map<Key, Event> data = new HashMap<>();\n    Key key(Event e) { return new Key(e.tenant(), e.id()); }\n    void save(Event e) {\n      Key key = key(e);\n      Event old = data.get(key);\n      if (old == null || e.version() > old.version()) data.put(key, e);\n    }\n    int amount(String tenant, String id) {\n      Event e = data.get(new Key(tenant, id));\n      return e == null ? 0 : e.amount();\n    }\n  }\n  public static class Service {\n    final Repository repository = new Repository();\n    public void apply(Event event) { repository.save(Objects.requireNonNull(event)); }\n    public int read(String tenant, String id) { return repository.amount(tenant, id); }\n  }\n  public static int demo() {\n    Service service = new Service();\n    service.apply(new Event(\"north\", \"7\", 2, 20));\n    service.apply(new Event(\"south\", \"7\", 1, 90));\n    service.apply(new Event(\"north\", \"7\", 1, 10));\n    return service.read(\"north\", \"7\");\n  }\n}",
    "mock": true,
    "projectFiles": {
      "starter": [
        {
          "name": "Exercise.java",
          "source": "import java.util.*;\n\npublic class Exercise {\n  record Key(String tenant, String id) {}\n  public record Event(String tenant, String id, int version, int amount) {}\n\n\n  public static int demo() {\n    Service service = new Service();\n    service.apply(new Event(\"north\", \"7\", 2, 20));\n    service.apply(new Event(\"south\", \"7\", 1, 90));\n    service.apply(new Event(\"north\", \"7\", 1, 10));\n    return service.read(\"north\", \"7\");\n  }\n  public static void main(String[] args) { System.out.println(demo()); }\n}"
        },
        {
          "name": "Service.java",
          "source": "import java.util.*;\npublic class Service {\n    final Repository repository = new Repository();\n    public void apply(Exercise.Event event) { repository.save(Objects.requireNonNull(event)); }\n    public int read(String tenant, String id) { return repository.amount(tenant, id); }\n  }"
        },
        {
          "name": "Repository.java",
          "source": "import java.util.*;\npublic class Repository {\n    final Map<Exercise.Key, Exercise.Event> data = new HashMap<>();\n    Exercise.Key key(Exercise.Event e) { return new Exercise.Key(\"\", e.id()); }\n    void save(Exercise.Event e) {\n      Exercise.Key key = key(e);\n      Exercise.Event old = data.get(key);\n      data.put(key, e);\n    }\n    int amount(String tenant, String id) {\n      Exercise.Event e = data.get(new Exercise.Key(\"\", id));\n      return e == null ? 0 : e.amount();\n    }\n  }"
        }
      ],
      "reference": [
        {
          "name": "Exercise.java",
          "source": "import java.util.*;\n\npublic class Exercise {\n  record Key(String tenant, String id) {}\n  public record Event(String tenant, String id, int version, int amount) {}\n\n\n  public static int demo() {\n    Service service = new Service();\n    service.apply(new Event(\"north\", \"7\", 2, 20));\n    service.apply(new Event(\"south\", \"7\", 1, 90));\n    service.apply(new Event(\"north\", \"7\", 1, 10));\n    return service.read(\"north\", \"7\");\n  }\n  public static void main(String[] args) { System.out.println(demo()); }\n}"
        },
        {
          "name": "Service.java",
          "source": "import java.util.*;\npublic class Service {\n    final Repository repository = new Repository();\n    public void apply(Exercise.Event event) { repository.save(Objects.requireNonNull(event)); }\n    public int read(String tenant, String id) { return repository.amount(tenant, id); }\n  }"
        },
        {
          "name": "Repository.java",
          "source": "import java.util.*;\npublic class Repository {\n    final Map<Exercise.Key, Exercise.Event> data = new HashMap<>();\n    Exercise.Key key(Exercise.Event e) { return new Exercise.Key(e.tenant(), e.id()); }\n    void save(Exercise.Event e) {\n      Exercise.Key key = key(e);\n      Exercise.Event old = data.get(key);\n      if (old == null || e.version() > old.version()) data.put(key, e);\n    }\n    int amount(String tenant, String id) {\n      Exercise.Event e = data.get(new Exercise.Key(tenant, id));\n      return e == null ? 0 : e.amount();\n    }\n  }"
        }
      ]
    }
  },
  {
    "id": "mock-export-service",
    "title": "Mock project: repair a filtered paginated export",
    "level": "Integrated mock project",
    "javaRelease": 17,
    "goal": "Follow repository pages through filtering and prove progress independently of visible output.",
    "question": "Use a 60-minute mock: map Repository → ExportService, trace demo(), repair page ordering and cursor ownership, challenge an AI patch, then present regressions. The first row is not approved. Explain why using the last emitted row as cursor can stall.",
    "contract": "Runnable single-file project model with nested collaborators. Static snapshot, unique non-null ids and rows, non-null approved set, positive limit. Export approved ids exactly once in rank/id order. Filtering happens after fetching. Cursor progress follows the last fetched row even if none were emitted. Inputs are unchanged. No network, database or concurrent mutation.",
    "vocabulary": [
      [
        "Batch",
        "One fetched page of rows."
      ],
      [
        "Progress invariant",
        "A rule ensuring each loop moves toward termination."
      ],
      [
        "Fetched versus emitted",
        "Fetched rows advance scanning; emitted rows satisfy the filter."
      ]
    ],
    "explanation": [
      "Fetch a. a is not approved, so output stays empty.",
      "Starter cursor. Uses the first fetched row; at page size1 the rank-only predicate also skips b.",
      "Starter result. Next fetch c; output is [c], silently losing b.",
      "Correct progress. Compare full tuples and move cursor to the last fetched row; export becomes [b,c]."
    ],
    "sample": "Exercise.demo()",
    "expected": "[b, c]",
    "actual": "[c]",
    "trace": [
      [
        "1",
        "Fetch a",
        "a is not approved, so output stays empty."
      ],
      [
        "2",
        "Starter cursor",
        "Uses the first fetched row; at page size1 the rank-only predicate also skips b."
      ],
      [
        "3",
        "Starter result",
        "Next fetch c; output is [c], silently losing b."
      ],
      [
        "4",
        "Correct progress",
        "Compare full tuples and move cursor to the last fetched row; export becomes [b,c]."
      ]
    ],
    "flow": [
      [
        "Fetch a",
        "a is not approved, so output stays empty."
      ],
      [
        "Starter cursor",
        "Uses the first fetched row; at page size1 the rank-only predicate also skips b."
      ],
      [
        "Starter result",
        "Next fetch c; output is [c], silently losing b."
      ],
      [
        "Correct progress",
        "Compare full tuples and move cursor to the last fetched row; export becomes [b,c]."
      ]
    ],
    "fix": "Use the full rank/id comparator for paging and the last fetched row as cursor. The first-row cursor causes overlapping batches for limits greater than1; a cursor derived from approved output could fail to advance after a fully filtered page.",
    "tests": [
      "Check exact export at limits1,2,3; never accept count alone.",
      "All rows filtered must terminate with empty output.",
      "Tied ranks, empty input, final short page and input permutation preserve exact ids."
    ],
    "spoken": "I would trace fetched rows separately from emitted rows. The repository skips equal-rank rows, and the service advances to the first fetched row, which overlaps pages when the limit is larger than one. I would compare the complete ordering tuple and always advance to the last fetched row. Filtering cannot own the cursor because a page can emit nothing. I would assert exact exported ids at several page sizes, including all-filtered data, and bound the test runtime to detect non-progress. This proves only a static in-memory export.",
    "followUp": [
      "Can we move approval filtering into the repository?",
      "Yes, with a documented query and cursor contract. That can reduce scanning but requires compatible ordering and authorization semantics. Do not silently change the cursor domain halfway through an export."
    ],
    "deepDive": "Each page scans and sorts at most n rows; with p pages this is O(p n log n) worst-case time and O(n) transient sort storage plus output. It is intentionally a comprehension model, not an efficient database export. A real export needs bounded output, stable snapshot semantics and indexed keyset queries; retries and partially delivered files need their own recovery contract.",
    "aiTrap": "An assistant may propose cursor = last approved row. A fully rejected page then has no cursor advancement. Another patch may deduplicate final ids, hiding overlapping reads without fixing the work or termination invariant.",
    "sources": [
      [
        "Stream sorted and limit",
        "https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/stream/Stream.html"
      ],
      [
        "Comparator ordering",
        "https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Comparator.html"
      ]
    ],
    "starter": "import java.util.*;\n\npublic class Exercise {\n  public record Row(int rank, String id) {}\n  static class Repository {\n    final List<Row> rows;\n    Repository(List<Row> rows) { this.rows = List.copyOf(rows); }\n    List<Row> page(Row after, int limit) {\n      if (limit < 1) throw new IllegalArgumentException(\"limit\");\n      Comparator<Row> order = Comparator.comparingInt(Row::rank).thenComparing(Row::id);\n      return rows.stream().filter(row -> after == null || row.rank() > after.rank())\n          .sorted(order).limit(limit).toList();\n    }\n  }\n  public static class ExportService {\n    final Repository repository;\n    public ExportService(List<Row> rows) { repository = new Repository(rows); }\n    public List<String> export(Set<String> approved, int limit) {\n      Objects.requireNonNull(approved);\n      List<String> result = new ArrayList<>();\n      Row cursor = null;\n      while (true) {\n        List<Row> batch = repository.page(cursor, limit);\n        if (batch.isEmpty()) return result;\n        for (Row row : batch) if (approved.contains(row.id())) result.add(row.id());\n        cursor = batch.get(0);\n      }\n    }\n  }\n  public static List<String> demo() {\n    return new ExportService(List.of(new Row(1, \"a\"), new Row(1, \"b\"), new Row(2, \"c\")))\n        .export(Set.of(\"b\", \"c\"), 1);\n  }\n}",
    "reference": "import java.util.*;\n\npublic class Exercise {\n  public record Row(int rank, String id) {}\n  static class Repository {\n    final List<Row> rows;\n    Repository(List<Row> rows) { this.rows = List.copyOf(rows); }\n    List<Row> page(Row after, int limit) {\n      if (limit < 1) throw new IllegalArgumentException(\"limit\");\n      Comparator<Row> order = Comparator.comparingInt(Row::rank).thenComparing(Row::id);\n      return rows.stream().filter(row -> after == null || order.compare(row, after) > 0)\n          .sorted(order).limit(limit).toList();\n    }\n  }\n  public static class ExportService {\n    final Repository repository;\n    public ExportService(List<Row> rows) { repository = new Repository(rows); }\n    public List<String> export(Set<String> approved, int limit) {\n      Objects.requireNonNull(approved);\n      List<String> result = new ArrayList<>();\n      Row cursor = null;\n      while (true) {\n        List<Row> batch = repository.page(cursor, limit);\n        if (batch.isEmpty()) return result;\n        for (Row row : batch) if (approved.contains(row.id())) result.add(row.id());\n        cursor = batch.get(batch.size() - 1);\n      }\n    }\n  }\n  public static List<String> demo() {\n    return new ExportService(List.of(new Row(1, \"a\"), new Row(1, \"b\"), new Row(2, \"c\")))\n        .export(Set.of(\"b\", \"c\"), 1);\n  }\n}",
    "mock": true,
    "projectFiles": {
      "starter": [
        {
          "name": "Exercise.java",
          "source": "import java.util.*;\n\npublic class Exercise {\n  public record Row(int rank, String id) {}\n\n\n  public static List<String> demo() {\n    return new ExportService(List.of(new Row(1, \"a\"), new Row(1, \"b\"), new Row(2, \"c\")))\n        .export(Set.of(\"b\", \"c\"), 1);\n  }\n  public static void main(String[] args) { System.out.println(demo()); }\n}"
        },
        {
          "name": "ExportService.java",
          "source": "import java.util.*;\npublic class ExportService {\n    final Repository repository;\n    public ExportService(List<Exercise.Row> rows) { repository = new Repository(rows); }\n    public List<String> export(Set<String> approved, int limit) {\n      Objects.requireNonNull(approved);\n      List<String> result = new ArrayList<>();\n      Exercise.Row cursor = null;\n      while (true) {\n        List<Exercise.Row> batch = repository.page(cursor, limit);\n        if (batch.isEmpty()) return result;\n        for (Exercise.Row row : batch) if (approved.contains(row.id())) result.add(row.id());\n        cursor = batch.get(0);\n      }\n    }\n  }"
        },
        {
          "name": "Repository.java",
          "source": "import java.util.*;\npublic class Repository {\n    final List<Exercise.Row> rows;\n    Repository(List<Exercise.Row> rows) { this.rows = List.copyOf(rows); }\n    List<Exercise.Row> page(Exercise.Row after, int limit) {\n      if (limit < 1) throw new IllegalArgumentException(\"limit\");\n      Comparator<Exercise.Row> order = Comparator.comparingInt(Exercise.Row::rank).thenComparing(Exercise.Row::id);\n      return rows.stream().filter(row -> after == null || row.rank() > after.rank())\n          .sorted(order).limit(limit).toList();\n    }\n  }"
        }
      ],
      "reference": [
        {
          "name": "Exercise.java",
          "source": "import java.util.*;\n\npublic class Exercise {\n  public record Row(int rank, String id) {}\n\n\n  public static List<String> demo() {\n    return new ExportService(List.of(new Row(1, \"a\"), new Row(1, \"b\"), new Row(2, \"c\")))\n        .export(Set.of(\"b\", \"c\"), 1);\n  }\n  public static void main(String[] args) { System.out.println(demo()); }\n}"
        },
        {
          "name": "ExportService.java",
          "source": "import java.util.*;\npublic class ExportService {\n    final Repository repository;\n    public ExportService(List<Exercise.Row> rows) { repository = new Repository(rows); }\n    public List<String> export(Set<String> approved, int limit) {\n      Objects.requireNonNull(approved);\n      List<String> result = new ArrayList<>();\n      Exercise.Row cursor = null;\n      while (true) {\n        List<Exercise.Row> batch = repository.page(cursor, limit);\n        if (batch.isEmpty()) return result;\n        for (Exercise.Row row : batch) if (approved.contains(row.id())) result.add(row.id());\n        cursor = batch.get(batch.size() - 1);\n      }\n    }\n  }"
        },
        {
          "name": "Repository.java",
          "source": "import java.util.*;\npublic class Repository {\n    final List<Exercise.Row> rows;\n    Repository(List<Exercise.Row> rows) { this.rows = List.copyOf(rows); }\n    List<Exercise.Row> page(Exercise.Row after, int limit) {\n      if (limit < 1) throw new IllegalArgumentException(\"limit\");\n      Comparator<Exercise.Row> order = Comparator.comparingInt(Exercise.Row::rank).thenComparing(Exercise.Row::id);\n      return rows.stream().filter(row -> after == null || order.compare(row, after) > 0)\n          .sorted(order).limit(limit).toList();\n    }\n  }"
        }
      ]
    }
  }
];
