# Senior Java Interview Master Guide - SDE-3

**Java 21 baseline | Reviewed edition v23 | 7 October 2026**

Java, Spring Boot, Hibernate/JPA, microservices, Maven, GCP and Kubernetes.

272 numbered Q&As, core module questions, 36 daily scenarios and 24 interview simulations across 20 parts. Java examples use Java 21 without preview features unless explicitly labeled as a later-version comparison. Framework snippets may require their named dependencies and application types; they are not complete applications.

This edition repairs the v22 Markdown extraction and PDF using the matching editable source where recoverable, retains the later questions and simulations, and corrects confirmed content and code defects. Historical test claims are not evidence for this edition: see the validation notes and included runnable code.

## How to use the guide

Explain the mechanism, why it exists, a realistic failure, the trade-off and how to verify it. A definition-only answer is a starting point. Work toward a decision supported by constraints and evidence. Treat all example incidents and metrics as illustrative, and substitute your own experience.

| Score | What the answer demonstrates |
|---|---|
| 1 | Definition only |
| 2 | Correct mechanism, limited reasoning |
| 3 | Mechanism, purpose and common pitfall |
| 4 | Trade-offs, alternatives and failure handling |
| 5 | A defensible decision and production evidence |

## Contents

1. [Part 01: Course and core modules](#part-1)
2. [Part 02: Question Bank Vol. 1 - Java, Spring, JPA and microservices](#part-2)
3. [Part 03: Question Bank Vol. 2 - Kafka, security, Maven, GCP and Kubernetes](#part-3)
4. [Part 04: Question Bank Vol. 3 - Scenarios, design and coding](#part-4)
5. [Part 05: Question Bank Vol. 4 - Modern Java and the Spring ecosystem](#part-5)
6. [Part 06: Question Bank Vol. 5 - Rapid-fire, puzzles and harder coding](#part-6)
7. [Part 07: Question Bank Vol. 6 - Kubernetes, Terraform, APIs and leadership](#part-7)
8. [Part 08: Question Bank Vol. 7 - Streams, WebFlux and interview practice](#part-8)
9. [Part 09: Coding interview practice track](#part-9)
10. [Part 10: Web sourced questions and strong answer rubrics](#part-10)
11. [Part 11: Decision walkthroughs for the full practice roadmap](#part-11)
12. [Part 12: More Senior-Level Questions (Q154-Q173)](#part-12)
13. [Part 13: Spring Boot Internals, Coding-Style and Leadership Questions (Q174-Q193)](#part-13)
14. [Part 14: System Design, Data Internals, JVM and Coding Questions (Q194-Q213)](#part-14)
15. [Part 15: Full System Design Walkthroughs and DP/Graph Problems (Q214-Q222)](#part-15)
16. [Part 16: Hibernate and SQL Questions (Q223-Q244)](#part-16)
17. [Part 17: More Hibernate and SQL Questions (Q245-Q272)](#part-17)
18. [Part 18: SDE-3 Interview Simulation Lab](#part-18)
19. [Part 19: 30-Minute SDE-3 Mock Interview Protocol](#part-19)
20. [Part 20: Interviewer Follow-Up Rules](#part-20)

[Appendix A: complete producer-consumer example](#appendix-a) · [Appendix B: review and validation](#validation)

<a id="senior-java-interview-refresher-9-years"></a>
<a id="part-1"></a>
## Part 01 - Course and core modules

**Stack:** Java · Spring Boot · Hibernate/JPA · Microservices · Maven ·
GCP

**Companion volumes:** Vol. 1 (Q1-Q30), Vol. 2 (Q31-Q58), Vol. 3
(Q59-Q74 + designs + programs).

**What interviewers want at 9+ yrs:** not definitions, but *trade-offs,
failure modes, production war stories*. Answer pattern: **Concept → Why
it exists → Pitfall → What I did in production.**

### 2-Week Plan

| Days  | Focus                                                                                  |
|-------|----------------------------------------------------------------------------------------|
| 1-3   | Arrays, hashing, two pointers, sliding windows; Java collections and complexity        |
| 4-5   | Binary search, intervals, stacks, linked lists; one timed coding round                 |
| 6-7   | Trees, BFS/DFS, heaps; Java equality, ordering, overflow and generics                  |
| 8-9   | Graphs, topological sort, union-find and shortest paths; concurrency exercise          |
| 10-11 | Backtracking and dynamic programming; one backend design deep dive                     |
| 12-14 | Two full coding mocks, one machine-coding round, failed-problem revision, STAR stories |

Use Part 9 for a daily schedule and readiness criteria. Treat cloud and
framework chapters as a lookup reference unless the role explicitly
emphasizes them.

---


*Detailed answers. More in Vols. 1-3 (Q1-Q74).*

### Module 1: Core Java, Concurrency, JVM

#### M1.1 How does HashMap work internally?

**Strong answer:**

`HashMap` stores key-value pairs in an internal array of buckets. Java
uses the key's `hashCode()` and spreads the hash bits to choose a bucket
index. If multiple keys land in the same bucket, that is a
**collision**; the bucket starts as a linked structure and can be
converted to a red-black tree when the implementation's collision and
table-capacity thresholds are met. With a good hash distribution,
`get()` and `put()` are expected O(1), while resizing is occasional O(n)
work, so insertion is amortized O(1).

#### First: what does "bin" mean?

**Bin** is OpenJDK implementation terminology for the entries associated
with one position in the internal hash-table array. In an interview, it
is perfectly fine to say **bucket**.

Think of it like:

```text
HashMap table

index 0  → null
index 1  → entry
index 2  → null
index 3  → entry → entry
index 4  → null
```

So, for this discussion:

```text
bucket ≈ bin
```

#### What happens during `put()`?

Conceptually:

```text
key
 ↓
hashCode()
 ↓
hash spreading
 ↓
bucket index
 ↓
find entry / insert entry
```

If another key is already in that bucket, Java compares keys using
`equals()` to determine whether it is the same mapping or a collision.

#### Why are `hashCode()` and `equals()` both needed?

`hashCode()` helps find the **bucket**.

`equals()` helps find the **actual key** inside that bucket.

That is why the `equals()` / `hashCode()` contract is critical.

#### What happens when there are many collisions?

A bucket can initially contain a linked chain of entries. When the
relevant collision threshold is reached, Java may treeify that bucket.
However, treeification is not simply "8 entries means tree": the table
also needs to be large enough; otherwise resizing may happen first.

The tree is a red-black tree, which is self-balancing. This can reduce collision-search cost when hashes or useful key comparisons
guide the search; equal-hash keys without useful ordering can still require
a linear scan of the tree bin.

#### What happens during resizing?

`HashMap` grows its table when the number of mappings crosses the
threshold derived from capacity and load factor. The default load factor
is `0.75`.

For example:

```text
capacity = 16
load factor = 0.75
threshold ≈ 12
```

When the table grows, entries are redistributed. The stored hash can be
reused, so Java does not need to call the user's `hashCode()` again
simply because the table resized.

#### Why is lookup normally O(1)?

With a good hash distribution, entries are spread across buckets, so
each lookup examines only a small number of entries.

Therefore:

```text
get()    → expected O(1)
put()    → expected O(1)
remove() → expected O(1)
```

But do **not** say "HashMap is always O(1)". Collisions and resizing
matter.

#### Important production pitfall: mutable keys

If a key changes after insertion and the changed fields participate in
`equals()` or `hashCode()`, the map may no longer find the entry using
the mutated key.

So keys should normally be immutable with respect to fields used by
`equals()` and `hashCode()`.

#### SDE-3 takeaway

A strong answer connects four things:

```text
hashCode() → bucket selection
equals()   → key identity
collisions → linked structure / possible treeification
resize     → capacity + load factor + amortized cost
```

The Java 19+ `HashMap.newHashMap(expectedMappings)` API expresses an
expected mapping count; older constructors interpret the argument as
initial capacity. If calculating capacity manually, remember Java
integer arithmetic when writing expressions such as
`expected / 0.75 + 1`.

#### 30-second version

> "`HashMap` uses an internal array of buckets. It uses the key's hash
> to select a bucket, and `equals()` to identify the exact key when
> collisions occur. Collided entries start in a linked structure and can
> be treeified under the implementation's thresholds. With good hash
> distribution, lookup and insertion are expected O(1); resizing is
> occasional O(n) work, so insertion is amortized O(1). Mutable keys are
> dangerous because changing a key's hash-related state after insertion
> can make the entry unreachable."

### M1.1.1 Red-Black Tree Deep Dive  -  HashMap Follow-up

If the interviewer asks, **“You said a HashMap bucket can become a
red-black tree. Explain the tree.”**, do not jump straight into
implementation cases. Start with the purpose.

**Strong answer:**

> A red-black tree is a self-balancing binary search tree. Each node has
> a red or black color, and the tree maintains balancing invariants that
> keep its height O(log n). With a useful search ordering, search,
> insertion and deletion are O(log n). HashMap uses tree bins to improve
> collision handling, but equal-hash keys without useful comparison
> ordering can still require O(n) lookup.

#### What problem does it solve?

A normal binary search tree can become skewed:

```text
10
  \
   20
     \
      30
        \
         40
```

This is effectively a linked list, so search can become O(n).

A balanced tree keeps the height logarithmic:

```text
       20
      /  \
    10    30
            \
             40
```

The exact shape varies, but the important property is:

```text
height = O(log n)
search = O(log n)
insert = O(log n)
delete = O(log n)
```

#### What does “red-black” mean?

Every node has one extra piece of state:

```text
RED
BLACK
```

The tree maintains these core properties:

1.  Every node is either red or black.
2.  The root is black.
3.  `null` leaves are treated as black.
4.  A red node cannot have a red child.
5.  Every path from a node to its descendant `null` leaves has the same
    number of black nodes (black height).

These rules prevent the tree from becoming arbitrarily skewed.

#### How does it stay balanced?

Two operations are fundamental:

```text
1. Recoloring
2. Rotation
```

There are two rotations:

```text
Left rotation
Right rotation
```

A rotation changes the tree structure while preserving the
binary-search-tree ordering.

For example:

```text
Before:

    10
      \
       20
         \
          30
```

After a left rotation around `10`:

```text
      20
     /  \
   10    30
```

The ordering is still:

```text
10 < 20 < 30
```

but the height is improved.

#### Why are new nodes generally inserted as red?

Inserting a black node can immediately increase the black-node count on
paths through that node.

Inserting red avoids changing black height immediately, although it can
create another violation:

```text
red parent
    +
red child
```

The tree then repairs the violation using recoloring and/or rotations.

#### What happens during insertion?

At a high level:

```text
1. Insert as a normal BST node.
2. Color the new node red.
3. Check the red-black invariants.
4. If a red-red violation exists:
      - recolor when the surrounding structure allows it
      - otherwise rotate and recolor
5. Ensure the root is black.
```

You do not need to memorize every insertion case unless the interviewer
explicitly asks you to implement a red-black tree.

#### Why does HashMap need this?

Suppose many different keys collide into the same bucket:

```text
bucket 7

A → B → C → D → E → F → G → H
```

A linked structure makes lookup increasingly expensive as the collision
chain grows.

Treeification changes the structure conceptually to:

```text
          D
        /   \
       B     F
      / \   / \
     A   C E   G
                \
                 H
```

The exact tree shape depends on the implementation and keys, but the key
idea is:

```text
linked collision chain → balanced tree
O(n) chain search → O(log n) tree search when ordering distinguishes keys
Equal hashes without useful key ordering → lookup may still be O(n)
```

#### Important: the entire HashMap does NOT become a tree

This is a common interview mistake.

`HashMap` still has its array of buckets:

```text
HashMap
  |
  +-- table[0] → entry/list
  +-- table[1] → null
  +-- table[2] → entry/list
  +-- table[3] → tree
  +-- table[4] → null
  +-- ...
```

Only a heavily-collided bucket can be treeified.

#### When does HashMap treeify?

For the OpenJDK implementation relevant to Java 8+ discussions, the
commonly discussed constants are:

```text
TREEIFY_THRESHOLD     = 8
UNTREEIFY_THRESHOLD    = 6
MIN_TREEIFY_CAPACITY   = 64
```

But do **not** say:

> “At exactly eight entries it always becomes a tree.”

The correct interview explanation is:

> When a bucket becomes sufficiently populated, HashMap can treeify it,
> but it first checks the table capacity. If the table is still small,
> resizing is preferred because spreading entries across more buckets
> may solve the collision problem more cheaply.

The implementation details are version-sensitive, so use the target
JDK's OpenJDK source if an interviewer asks for exact thresholds.

#### Can a treeified bucket become a list again?

Yes.

If the number of entries in that bucket falls sufficiently, the
implementation can **untreeify** it.

That avoids keeping tree-management overhead for a bucket that is no
longer heavily populated.

#### Why red-black tree instead of AVL?

A good senior-level answer is:

> Both AVL and red-black trees provide O(log n) operations. AVL is more
> strictly balanced and can provide slightly shorter search paths, but
> it generally performs more rebalancing during updates. Red-black trees
> permit more imbalance while still guaranteeing logarithmic height,
> which is a useful trade-off for workloads involving both lookup and
> updates.

Do not claim one is universally faster; workload and implementation
matter.

#### What about `hashCode()` and `equals()`?

Another common follow-up is:

**“If the bucket is a tree, does HashMap only use hashCode?”**

No.

Conceptually:

```text
hashCode()
    ↓
find bucket
    ↓
find candidate entries
    ↓
equals()
    ↓
identify the actual key
```

`hashCode()` narrows the search. It does not uniquely identify a key.

When tree bins need ordering/tie-breaking beyond hash values, the
OpenJDK implementation has additional comparison logic. The important
interview point is that **HashMap's correctness still depends on the
`equals()`/`hashCode()` contract**.

#### Why can a bad hashCode be dangerous?

If unrelated keys produce the same hash:

```text
A → hash 42
B → hash 42
C → hash 42
D → hash 42
```

they are forced into the same bucket.

A well-designed `hashCode()` distributes keys across buckets and reduces
collisions.

But:

> Good hashing gives expected performance; it is not a correctness
> replacement for `equals()`.

#### What should you say about complexity?

Be precise:

```text
Normal HashMap:
get/put/remove → expected O(1)

Treeified bucket:
search/update → O(log n) when hashes or useful comparisons distinguish keys
equal hashes without useful comparison ordering → lookup may still be O(n)

Resize:
O(n) work for the resize operation

Overall put:
expected amortized O(1)
```

Do **not** say:

> “After Java 8 HashMap is O(log n).”

The tree is a defensive mechanism for pathological collision behavior,
not the normal complexity of the whole map.

#### Why can a balanced HashMap bin still need linear lookup?

A red-black tree has logarithmic height. That bounds search only when the
query can choose a branch at each comparison. OpenJDK HashMap may search
both subtrees for equal-hash keys without a useful comparison ordering.
An absent non-comparable key whose hash matches every stored key can
therefore require O(n) equality checks even in a treeified bin.

[OpenJDK HashMap implementation notes and TreeNode search](https://raw.githubusercontent.com/openjdk/jdk21u/master/src/java.base/share/classes/java/util/HashMap.java).

#### SDE-3 follow-up questions

**Q: Why not keep the linked list?**

> Because a heavily-collided bucket could degrade lookup toward O(n). A
> balanced tree can provide logarithmic lookup when hashes or useful key
> comparisons guide the search. Equal-hash, non-orderable keys can still
> require O(n) lookup.

**Q: Why not treeify immediately?**

> Trees have more structural and memory overhead. For small tables,
> resizing often distributes entries more cheaply.

**Q: Why insert a red node?**

> It avoids immediately increasing black height; any red-red violation
> can then be repaired.

**Q: What are the two rotation types?**

> Left rotation and right rotation.

**Q: What are the two main balancing mechanisms?**

> Recoloring and rotations.

**Q: Does a treeified bucket make every HashMap lookup O(log n)?**

> No. Only that bucket uses the tree structure; normal HashMap lookup
> remains expected O(1).

**Q: Red-black tree vs AVL?**

> Both are O(log n); AVL is more strictly balanced, while red-black
> generally trades some balance for fewer update rebalancing operations.

#### 30-second interview answer

> “A red-black tree is a self-balancing BST that maintains color-based
> invariants so its height stays O(log n). HashMap uses it defensively
> when a particular bucket has too many collisions. Instead of searching
> a long linked collision chain, the bucket can be represented as a
> balanced tree. Lookup can be O(log n) when hashes or useful comparisons
> distinguish keys, but can remain O(n) for equal-hash keys without useful
> ordering. Recoloring and rotations keep the tree height logarithmic;
> they do not guarantee that every lookup follows only one branch.
> Importantly, only the heavily-collided bucket becomes a tree; HashMap
> as a whole still provides expected O(1) lookup with a good hash
> distribution.”

#### What you should know for SDE-3

**Must know:** purpose, five properties, rotations, recoloring, O(log
n), relationship to HashMap.

**Should know:** treeification, untreeification, capacity threshold, why
resizing may happen first, and red-black vs AVL.

**Only if drilled further:** individual insertion/deletion cases, exact
OpenJDK `TreeNode` implementation details, and tie-breaking logic.

#### M1.2 `volatile` vs `synchronized` vs atomics vs `ReentrantLock`?

**Strong answer:**

`volatile` provides visibility and ordering between threads, but it does
**not** make compound operations such as `count++` atomic.
`synchronized` provides both mutual exclusion and the memory-visibility
guarantees associated with monitor locking. `ReentrantLock` provides
explicit locking with features such as `tryLock`, timed/interruptible
acquisition, fairness and multiple `Condition`s.
`AtomicInteger`/`AtomicLong` provide atomic single-variable operations
using CAS, while `LongAdder` is optimized for high-contention counters
where an exact instantaneous snapshot is not required.

#### Think of the choices like this

```text
Need only visibility?
        ↓
     volatile

Need one shared value updated atomically?
        ↓
   AtomicInteger / AtomicLong

Need very high-throughput counter under contention?
        ↓
     LongAdder

Need mutual exclusion around multiple operations/state?
        ↓
 synchronized / ReentrantLock
```

#### Why isn't `volatile` enough for `count++`?

This:

```java
volatile int count;
count++;
```

looks like one operation, but conceptually it is:

```text
read count
   ↓
add 1
   ↓
write count
```

Two threads can read the same old value and overwrite each other's
update.

So `volatile` is appropriate for things such as:

```java
volatile boolean shutdown;
```

where one thread publishes a new value and other threads need to see it.

#### `synchronized` vs `ReentrantLock`

`synchronized` is usually the simplest choice:

```java
synchronized (lock) {
    // critical section
}
```

Use `ReentrantLock` when you genuinely need capabilities such as:

- `tryLock()`
- timed acquisition
- interruptible lock acquisition
- fairness policy
- multiple `Condition`s

With `ReentrantLock`, ownership is manual, so always unlock in
`finally`.

#### AtomicInteger vs LongAdder

`AtomicInteger` is useful when you need an exact atomic value update
such as:

```java
counter.incrementAndGet();
```

`LongAdder` spreads contention across multiple internal cells. Under
heavy concurrent writes, this can provide better throughput than
repeatedly updating one atomic variable.

The trade-off is that `sum()` is not an instantaneous transactionally
consistent snapshot.

#### SDE-3 decision rule

Start with the **simplest primitive that gives the required
correctness**.

Do not choose a sophisticated concurrency primitive because it sounds
faster. First establish:

1.  What state is shared?
2.  Is the operation single-variable or multi-variable?
3.  Do we need atomicity, visibility, ordering, or all three?
4.  Is contention actually high?
5.  Do we need a consistent snapshot?

Then measure before optimizing.

#### 30-second version

> "`volatile` gives visibility but not atomicity. `synchronized` gives
> mutual exclusion plus visibility and is my default when I need to
> protect a critical section. `ReentrantLock` is useful when I need
> advanced lock features such as `tryLock` or interruptible acquisition.
> Atomics are good for atomic single-variable operations, while
> `LongAdder` is useful for highly contended counters. I choose the
> simplest primitive that satisfies the correctness requirement and
> optimize only after measuring contention."

#### M1.3 Explain the Java Memory Model and happens-before.

**Strong answer:**

The **Java Memory Model (JMM)** defines the rules for how threads
interact through memory. The key idea is **happens-before**: if action A
happens-before action B, the Java memory model guarantees that B can
observe the relevant effects of A and constrains reordering between
them.

Important happens-before relationships include:

```text
monitor unlock  → subsequent lock of the same monitor
volatile write  → subsequent read of that volatile variable
Thread.start()  → actions in the started thread
actions in a thread → successful Thread.join() return
```

There are also special initialization guarantees for properly
constructed objects with `final` fields, but those are not a general
replacement for safe publication.

#### Why does this matter?

Without the required synchronization, two threads can have a data race.
The compiler, JIT and CPU are allowed to reorder operations as permitted
by the JMM, and another thread is not automatically guaranteed to
observe ordinary writes in the order you expected.

The common example is double-checked locking:

```java
class Singleton {
    private static Singleton instance;

    static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

Without `volatile` on `instance`, this pattern is not safely published.

The safer form is:

```java
private static volatile Singleton instance;
```

because the volatile write that publishes the reference establishes the
required visibility/order relationship for readers.

#### Happens-before is not "execution order"

This is a common interview trap.

Happens-before does **not** simply mean:

> "This line always executes before that line."

It is a memory-model guarantee about visibility and ordering between
actions in different threads.

#### SDE-3 takeaway

When debugging concurrency, ask:

```text
What state is shared?
        ↓
What synchronization establishes visibility?
        ↓
What establishes atomicity?
        ↓
Is there a happens-before relationship?
        ↓
Could the code have a data race?
```

Do not solve a visibility problem with a random lock, and do not assume
`volatile` makes a multi-step operation atomic.

#### 30-second version

> "The Java Memory Model defines what visibility and ordering guarantees
> exist between threads. Happens-before is the key relationship: for
> example, an unlock happens-before a subsequent lock on the same
> monitor, and a volatile write happens-before a subsequent volatile
> read of that variable. Without an appropriate happens-before
> relationship, ordinary shared mutable state can have visibility and
> ordering problems. A classic example is double-checked locking, where
> the instance reference must be volatile for safe publication."

#### M1.4 How do you detect, prevent and fix deadlocks?

**Strong answer:**

For a resource deadlock, look for mutual exclusion, hold-and-wait,
no preemption and circular wait. Prevent cycles with a global lock order,
short critical sections and careful resource ownership. Avoid calling
foreign code while holding a lock. Timed `tryLock` with a bounded retry
policy, or message passing, can help when appropriate.

For platform-thread monitor/ownable-synchronizer deadlocks, inspect
`jstack`, `jcmd <pid> Thread.print` and
`ThreadMXBean.findDeadlockedThreads()`. Java 21's `ThreadMXBean` does not
monitor virtual threads: a null result does not rule out their deadlocks.
Use `jcmd <pid> Thread.dump_to_file -format=json <file>` or its text form
to inspect virtual-thread stacks, alongside JFR and application state.
These dumps do not provide the same lock/ownership information as
traditional dumps and are not an automatic virtual-thread deadlock detector.
Trace the actual wait/resource dependency cycle.

#### How to understand it

A deadlock is a dependency cycle with no progress path. A livelock
keeps doing work without useful progress; starvation repeatedly denies
one task the resources it needs. Select diagnostic tools that cover the
thread types and resources involved before treating a clean result as
evidence of safety.

#### Key terms you should know

- **Deadlock**  -  Tasks cannot progress because they wait on a cyclic set of dependencies.
- **Livelock**  -  Tasks react repeatedly without making useful progress.
- **Starvation**  -  A task repeatedly loses access to needed resources.

#### SDE-3 interview checkpoints

- Draw the lock/resource acquisition order and identify cycles.
- Identify whether the affected tasks use platform or virtual threads.
- Distinguish blocked tasks from CPU saturation, livelock and starvation.

#### 30-second version

> Prevent deadlocks with consistent resource order and short critical sections.
> Traditional deadlock detection covers platform-thread monitors and ownable
> synchronizers. For Java 21 virtual threads, inspect thread dumps and actual
> wait dependencies; ThreadMXBean cannot rule out a deadlock.

[Java 21 ThreadMXBean](https://docs.oracle.com/en/java/javase/21/docs/api/java.management/java/lang/management/ThreadMXBean.html), [virtual-thread diagnostics](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html).

#### M1.5 How do you size and configure a thread pool?

**Strong answer:**

Execution order: new tasks use core threads, then fill the queue, then
spawn threads up to max, then hit the rejection policy. Sizing:
CPU-bound ≈ cores + 1; IO-bound ≈ cores × (1 + wait/compute), measured
under load. Always use a **bounded queue** and a deliberate rejection
policy (`CallerRunsPolicy` gives back-pressure);
`Executors.newFixedThreadPool` has an unbounded queue and
`newCachedThreadPool` an unbounded thread count, and both can take down
production. Give threads meaningful names, isolate pools per dependency
(bulkhead), expose queue size and active count as metrics, and shut down
gracefully (`shutdown` → `awaitTermination` → `shutdownNow`).

#### How to understand it

Treat this as a decision/problem-solving question: explain the mechanism
or approach first, then the failure modes, trade-offs, and how you would
verify the result.

**Plain-English starting point:** Execution order: new tasks use core
threads, then fill the queue, then spawn threads up to max, then hit the
rejection policy. Sizing: CPU-bound ≈ cores + 1; IO-bound ≈ cores × (1 +
wait/compute), measured under load.

#### Key terms you should know

- **back-pressure**  -  A mechanism that prevents an upstream producer
  from overwhelming a downstream consumer.
- **bulkhead**  -  A resilience pattern that isolates resources such as
  threads or connections so one overloaded dependency does not exhaust
  the whole service.


#### 30-second version

> Execution order: new tasks use core threads, then fill the queue, then
> spawn threads up to max, then hit the rejection policy. Sizing:
> CPU-bound ≈ cores + 1; IO-bound ≈ cores × (1 + wait/compute), measured
> under load.

#### M1.6 CompletableFuture vs virtual threads: when do you use which?

**Strong answer:**

Virtual threads are final in Java 21 and fit workloads that spend much
of their time waiting. They do not accelerate CPU-bound work or enlarge
a database connection pool. Use one virtual thread per task and
separately bound admission and scarce resources. On JDK 21-23, blocking
while holding `synchronized` monitors can pin carriers; JDK 24 removes
this monitor-related pinning, so do not mechanically replace locks on
newer JDKs. Native/foreign calls still deserve attention.
`CompletableFuture` models composition; configure actual I/O deadlines
and cancellation as well as future timeouts. [Virtual threads in JDK
24](https://docs.oracle.com/en/java/javase/24/core/virtual-threads.html).


#### Key terms you should know

- **CompletableFuture**  -  A Java API for representing and composing
  asynchronous results and their success/failure stages.
- **virtual thread**  -  A lightweight Java thread managed by the JVM,
  designed to make high-concurrency blocking I/O easier to scale.


#### 30-second version

> Virtual threads are final in Java 21 and fit workloads that spend much
> of their time waiting. They do not accelerate CPU-bound work or
> enlarge a database connection pool.

#### M1.7 Explain garbage collection and how you tune it.

**Strong answer:**

Generational heap: young (eden + survivors) collected frequently, old
collected rarely; objects that survive enough cycles are promoted. G1
(default) is region-based and works to a pause target
(`-XX:MaxGCPauseMillis`); ZGC and Shenandoah target low pauses using
concurrent work; actual latency depends on the collector, JDK and
workload; Parallel maximises throughput for batch. Tuning approach:
define a goal (latency or throughput), enable GC logs (`-Xlog:gc*`),
look at pause time, allocation rate, promotion rate and heap after full
GC; fix allocation hot spots first and only then change flags. Premature
flag-tweaking is a red flag; reducing garbage is usually the best
optimisation.

#### How to understand it

First understand the core concept, then explain why it exists, how it
behaves in production, and what trade-off you would make.

**Plain-English starting point:** Generational heap: young (eden +
survivors) collected frequently, old collected rarely; objects that
survive enough cycles are promoted. G1 (default) is region-based and
works to a pause target (`-XX:MaxGCPauseMillis`); ZGC and Shenandoah
target low pauses using concurrent work; actual latency depends on the
collector, JDK and workload; Parallel maximises throughput for batch.

#### Key terms you should know

- **G1**  -  A region-based garbage collector with a pause-time target.
- **GC**  -  Reclaiming heap storage no longer needed by reachable objects.
- **Tuning goal**  -  The workload objective, such as throughput or tail latency.
- **Heap**  -  JVM storage used for object allocation.


#### 30-second version

> Generational heap: young (eden + survivors) collected frequently, old
> collected rarely; objects that survive enough cycles are promoted. G1
> (default) is region-based and works to a pause target
> (`-XX:MaxGCPauseMillis`); ZGC and Shenandoah target low pauses using
> concurrent work; actual latency depends on the collector, JDK and
> workload; Parallel maximises throughput for batch.

---


*More in Q11-Q19, Q37-Q42.*

### Module 2: Spring & Spring Boot

#### M2.1 How does Spring Boot auto-configuration work?

**Strong answer:**

`@SpringBootApplication` combines `@Configuration`, `@ComponentScan` and
`@EnableAutoConfiguration`. The latter loads candidate classes listed in
`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`
from every jar on the classpath, and each is guarded by conditions
(`@ConditionalOnClass`, `@ConditionalOnMissingBean`,
`@ConditionalOnProperty`). Many auto-configurations back off when a
matching user bean exists; check the actual conditions and bean types
rather than assuming every default is overridable this way. To debug,
run with `--debug` or use the Actuator `conditions` endpoint. To build
your own starter: an autoconfigure module plus a thin starter POM and
`@ConfigurationProperties` for settings.

#### How to understand it

Treat this as a decision/problem-solving question: explain the mechanism
or approach first, then the failure modes, trade-offs, and how you would
verify the result.

**Plain-English starting point:** `@SpringBootApplication` combines
`@Configuration`, `@ComponentScan` and `@EnableAutoConfiguration`. The
latter loads candidate classes listed in
`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`
from every jar on the classpath, and each is guarded by conditions
(`@ConditionalOnClass`, `@ConditionalOnMissingBean`,
`@ConditionalOnProperty`).

#### Key terms you should know

- **bean**  -  An object managed by the Spring IoC container.


#### 30-second version

> `@SpringBootApplication` combines `@Configuration`, `@ComponentScan`
> and `@EnableAutoConfiguration`. The latter loads candidate classes
> listed in
> `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`
> from every jar on the classpath, and each is guarded by conditions
> (`@ConditionalOnClass`, `@ConditionalOnMissingBean`,
> `@ConditionalOnProperty`).

#### M2.2 Describe the bean lifecycle and scopes.

**Strong answer:**

Instantiate (constructor) → inject dependencies → `Aware` callbacks →
`BeanPostProcessor.postProcessBeforeInitialization` → `@PostConstruct` /
`InitializingBean` / `init-method` → `postProcessAfterInitialization`
(where AOP proxies and `@Transactional` wrappers are created) → in use →
`@PreDestroy` on shutdown. Scopes: singleton (default, one per
container, so it must be stateless or thread-safe), prototype, and web
scopes (request, session). A singleton holding a prototype gets only one
instance, so use `ObjectProvider` or a scoped proxy.

#### How to understand it

Treat this as a decision/problem-solving question: explain the mechanism
or approach first, then the failure modes, trade-offs, and how you would
verify the result.

**Plain-English starting point:** Instantiate (constructor) → inject
dependencies → `Aware` callbacks →
`BeanPostProcessor.postProcessBeforeInitialization` → `@PostConstruct` /
`InitializingBean` / `init-method` → `postProcessAfterInitialization`
(where AOP proxies and `@Transactional` wrappers are created) → in use →
`@PreDestroy` on shutdown. Scopes: singleton (default, one per
container, so it must be stateless or thread-safe), prototype, and web
scopes (request, session).

#### Key terms you should know

- **AOP**  -  Aspect-oriented programming: applying cross-cutting behavior
  such as transactions, logging or security around method execution.
- **proxy**  -  An object that wraps another object and intercepts method
  calls, commonly used by Spring for transactions, security and AOP.


#### 30-second version

> Instantiate (constructor) → inject dependencies → `Aware` callbacks →
> `BeanPostProcessor.postProcessBeforeInitialization` → `@PostConstruct`
> / `InitializingBean` / `init-method` →
> `postProcessAfterInitialization` (where AOP proxies and
> `@Transactional` wrappers are created) → in use → `@PreDestroy` on
> shutdown. Scopes: singleton (default, one per container, so it must be
> stateless or thread-safe), prototype, and web scopes (request,
> session).

#### M2.3 Why prefer constructor injection?

**Strong answer:**

Dependencies are explicit and `final`, the object is never half-built,
it can be unit-tested with `new` and mocks, and an excess of constructor
parameters exposes a class doing too much (Single Responsibility). Field
injection hides dependencies, needs reflection in tests, and encourages
cycles. Use setter injection only for genuinely optional dependencies.

#### How to understand it

First understand the core concept, then explain why it exists, how it
behaves in production, and what trade-off you would make.

**Plain-English starting point:** Dependencies are explicit and `final`,
the object is never half-built, it can be unit-tested with `new` and
mocks, and an excess of constructor parameters exposes a class doing too
much (Single Responsibility). Field injection hides dependencies, needs
reflection in tests, and encourages cycles.


#### 30-second version

> Dependencies are explicit and `final`, the object is never half-built,
> it can be unit-tested with `new` and mocks, and an excess of
> constructor parameters exposes a class doing too much (Single
> Responsibility). Field injection hides dependencies, needs reflection
> in tests, and encourages cycles.

#### M2.4 How does `@Transactional` work and what are its pitfalls?

**Strong answer:**

A call through a Spring transaction proxy is intercepted by the
configured transaction manager. With ordinary JDBC/JPA, work usually
participates in a thread-bound transaction. The default rollback rule
covers unchecked exceptions and errors; configure checked-exception
handling deliberately. Self-invocation bypasses proxy advice. Spring 6
class-based proxies can also intercept eligible
protected/package-visible methods; interface proxies require public
interface methods. Swallowing an exception does not clear rollback-only
state. `REQUIRES_NEW` needs independent resources; `NESTED` depends on
savepoint support. An async task does not inherit its caller's
transaction, but can start its own by calling a transactional service
through its proxy. Keep transaction scope short; `readOnly=true` is not
portable write prevention. [Spring transaction
annotations](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html),
[transaction
implementation](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-decl-explained.html).

#### How to understand it

Treat this as a decision/problem-solving question: explain the mechanism
or approach first, then the failure modes, trade-offs, and how you would
verify the result.

**Plain-English starting point:** A call through a Spring transaction
proxy is intercepted by the configured transaction manager. With
ordinary JDBC/JPA, work usually participates in a thread-bound
transaction.

#### Key terms you should know

- **proxy**  -  An object that wraps another object and intercepts method
  calls, commonly used by Spring for transactions, security and AOP.
- **Application service**  -  A component coordinating a business use case;
  it may be a Spring-managed bean and is not a Kubernetes Service.
- **transaction**  -  A unit of database work treated as one logical
  operation with defined commit/rollback behavior.


#### 30-second version

> A call through a Spring transaction proxy is intercepted by the
> configured transaction manager. With ordinary JDBC/JPA, work usually
> participates in a thread-bound transaction.

#### M2.5 How do you secure a REST API with JWT?

**Strong answer:**

Configure a stateless `SecurityFilterChain` with OAuth2 resource-server JWT support.
Set `spring.security.oauth2.resourceserver.jwt.issuer-uri` to the trusted
issuer, or configure an equivalent issuer validator on a custom decoder.
An explicit `jwk-set-uri` supplies verification keys; that URL alone does
not validate the token's `iss` claim. Validate the signature with allowed
algorithms, `exp`/`nbf`, issuer and audience. Use Boot's `audiences`
property where supported, or an explicit audience validator.

Map scopes/roles using `JwtAuthenticationConverter`; enable method
security with `@EnableMethodSecurity` and enforce domain authorization
with `@PreAuthorize`. Keep access tokens short-lived, rotate refresh
tokens at the authorization server, store passwords with an appropriate
adaptive hash where the application owns credentials, and never log
tokens. Return 401 for invalid/missing authentication and 403 for denied
authorization.

#### How to understand it

A valid signature proves that a trusted key signed the token. It does
not by itself prove that the token has the expected issuer or was issued
for this API. This distinction matters when multiple issuers or
applications share signing infrastructure. Test each claim independently.

#### Key terms you should know

- **JWKS**  -  A set of keys used here to verify JWT signatures.
- **Issuer (`iss`)**  -  The token issuer this API explicitly trusts.
- **Audience (`aud`)**  -  The intended recipient or recipients of a token.

#### SDE-3 interview checkpoints

- Reject a validly signed token with the wrong issuer or audience.
- Test expired/not-yet-valid tokens and signing-key rotation.
- Verify both endpoint authorization and object ownership.

#### 30-second version

> A JWT resource server needs signature, time, issuer and audience validation.
> Configure issuer-uri or an explicit issuer validator; a JWKS URL alone only
> supplies keys. Map authorities, enable method security, and test wrong-issuer
> and wrong-audience tokens even when their signatures are valid.

[Spring Security JWT configuration](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html).

#### M2.6 What does "production-ready" mean for a Boot service?

**Strong answer:**

Observability (Actuator health/readiness/liveness, Micrometer metrics to
Prometheus/Cloud Monitoring, structured logs with trace IDs,
OpenTelemetry), resilience (timeouts, circuit breakers, bounded pools,
graceful shutdown), configuration (externalised, validated
`@ConfigurationProperties`, secrets from a vault), data safety (Flyway
migrations, `ddl-auto=validate`), security (HTTPS, headers, dependency
scanning), plus tests, CI/CD and runbooks with SLOs and alerts.


#### Key terms you should know

- **observability**  -  The ability to understand internal system behavior
  from telemetry such as logs, metrics and traces.
- **trace**  -  A representation of one request's path through distributed
  services.


#### 30-second version

> Observability (Actuator health/readiness/liveness, Micrometer metrics
> to Prometheus/Cloud Monitoring, structured logs with trace IDs,
> OpenTelemetry), resilience (timeouts, circuit breakers, bounded pools,
> graceful shutdown), configuration (externalised, validated
> `@ConfigurationProperties`, secrets from a vault), data safety (Flyway
> migrations, `ddl-auto=validate`), security (HTTPS, headers, dependency
> scanning), plus tests, CI/CD and runbooks with SLOs and alerts.

---


*More in Q20-Q25.*

### Module 3: Hibernate / JPA

#### M3.1 What is the N+1 problem and how do you fix it?

**Strong answer:**

One query loads N parents and then lazily triggers one query per parent
for a child association, giving N+1 round-trips that look fine in dev
and collapse under production data. Detect it with SQL logging,
Hibernate statistics, or tests asserting a query count
(datasource-proxy). Fixes: `JOIN FETCH` or `@EntityGraph` for the use
case, `@BatchSize` / `hibernate.default_batch_fetch_size` to load
children in batches of IN-lists, or DTO projections selecting only
needed columns. Caveats: joining multiple to-many associations can
multiply rows; fetching multiple bag mappings can additionally trigger
`MultipleBagFetchException`, and collection fetch with pagination is
applied in memory, so paginate parent IDs first and fetch children
second.

#### How to understand it

First understand the core concept, then explain why it exists, how it
behaves in production, and what trade-off you would make.

**Plain-English starting point:** One query loads N parents and then
lazily triggers one query per parent for a child association, giving N+1
round-trips that look fine in dev and collapse under production data.
Detect it with SQL logging, Hibernate statistics, or tests asserting a
query count (datasource-proxy).

#### Key terms you should know

- **N+1**  -  A query pattern where one query loads N parent rows and then
  N additional queries load related data, causing excessive database
  round trips.
- **proxy**  -  An object that wraps another object and intercepts method
  calls, commonly used by Spring for transactions, security and AOP.


#### 30-second version

> One query loads N parents and then lazily triggers one query per
> parent for a child association, giving N+1 round-trips that look fine
> in dev and collapse under production data. Detect it with SQL logging,
> Hibernate statistics, or tests asserting a query count
> (datasource-proxy).

#### M3.2 Explain entity states and the persistence context.

**Strong answer:**

An entity is *transient* (new), *managed* (tracked by the session),
*detached* (session closed) or *removed*. The persistence context is a
first-level cache and unit of work: reading the same ID twice returns
the same instance, and at flush Hibernate compares loaded snapshots to
current state (**dirty checking**) and issues UPDATEs automatically, so
calling `save()` on a managed entity is unnecessary. Flush happens
before queries (auto mode) and at commit. Long-lived contexts or bulk
loads grow memory, so use `clear()` or batching.

#### How to understand it

First understand the core concept, then explain why it exists, how it
behaves in production, and what trade-off you would make.

**Plain-English starting point:** An entity is *transient* (new),
*managed* (tracked by the session), *detached* (session closed) or
*removed*. The persistence context is a first-level cache and unit of
work: reading the same ID twice returns the same instance, and at flush
Hibernate compares loaded snapshots to current state (**dirty
checking**) and issues UPDATEs automatically, so calling `save()` on a
managed entity is unnecessary.

#### Key terms you should know

- **dirty checking**  -  Hibernate/JPA's mechanism for detecting changes
  to managed entities and generating updates during flush.
- **persistence context**  -  JPA/Hibernate's managed set of entity
  instances whose changes are tracked and synchronized with the
  database.


#### 30-second version

> An entity is *transient* (new), *managed* (tracked by the session),
> *detached* (session closed) or *removed*. The persistence context is a
> first-level cache and unit of work: reading the same ID twice returns
> the same instance, and at flush Hibernate compares loaded snapshots to
> current state (**dirty checking**) and issues UPDATEs automatically,
> so calling `save()` on a managed entity is unnecessary.

#### M3.3 Lazy vs eager, and `LazyInitializationException`?

**Strong answer:**

Make associations LAZY by default; JPA's defaults for
`@ManyToOne`/`@OneToOne` are EAGER, so set `fetch = LAZY` explicitly.
The exception occurs when a proxy is touched after the session closed.
Open-Session-In-View keeps the persistence context available through web
rendering and can hide uncontrolled queries; connection retention
depends on acquisition/release settings. For service APIs, consider
disabling `spring.jpa.open-in-view` and defining explicit fetch
boundaries. The right fixes: fetch what you need in the service layer
(`EntityGraph`/join fetch) or return DTOs.


#### Key terms you should know

- **persistence context**  -  JPA/Hibernate's managed set of entity
  instances whose changes are tracked and synchronized with the
  database.
- **proxy**  -  An object that wraps another object and intercepts method
  calls, commonly used by Spring for transactions, security and AOP.
- **Application service**  -  A component coordinating a business use case;
  it may be a Spring-managed bean and is not a Kubernetes Service.


#### 30-second version

> Make associations LAZY by default; JPA's defaults for
> `@ManyToOne`/`@OneToOne` are EAGER, so set `fetch = LAZY` explicitly.
> The exception occurs when a proxy is touched after the session closed.

#### M3.4 Optimistic vs pessimistic locking?

**Strong answer:**

Optimistic uses a `@Version` column:
`UPDATE … WHERE id=? AND version=?`; zero rows updated throws
`OptimisticLockException`, which you retry or surface as 409. It avoids
a pessimistic read lock; the eventual UPDATE still takes database locks
until transaction completion. Pessimistic (`PESSIMISTIC_WRITE` →
`SELECT … FOR UPDATE`) blocks competing writers, suitable for high
contention or scarce resources like inventory; always set lock timeouts
and keep transactions short to avoid deadlocks (and use `SKIP LOCKED`
for queue-like tables).


#### Key terms you should know

- **transaction**  -  A unit of database work treated as one logical
  operation with defined commit/rollback behavior.


#### 30-second version

> Optimistic uses a `@Version` column:
> `UPDATE … WHERE id=? AND version=?`; zero rows updated throws
> `OptimisticLockException`, which you retry or surface as 409.

#### M3.5 How do you tune Hibernate performance?

**Strong answer:**

Measure first (slow-query log, `pg_stat_statements`, p6spy). Then: fix
N+1; project to DTOs for read paths; add proper indexes (check
`EXPLAIN`); enable JDBC batching (`hibernate.jdbc.batch_size`,
`order_inserts/updates`); use SEQUENCE generators with pooled optimisers
because IDENTITY disables insert batching; use second-level/query caches
only for read-mostly data; paginate with keyset; avoid huge `IN` lists;
keep transactions short; and use Flyway to manage schema and index
changes.

#### How to understand it

Treat this as a decision/problem-solving question: explain the mechanism
or approach first, then the failure modes, trade-offs, and how you would
verify the result.

**Plain-English starting point:** Measure first (slow-query log,
`pg_stat_statements`, p6spy). Then: fix N+1; project to DTOs for read
paths; add proper indexes (check `EXPLAIN`); enable JDBC batching
(`hibernate.jdbc.batch_size`, `order_inserts/updates`); use SEQUENCE
generators with pooled optimisers because IDENTITY disables insert
batching; use second-level/query caches only for read-mostly data;
paginate with keyset; avoid huge `IN` lists; keep transactions short;
and use Flyway to manage schema and index changes.

#### Key terms you should know

- **N+1**  -  A query pattern where one query loads N parent rows and then
  N additional queries load related data, causing excessive database
  round trips.


#### 30-second version

> Measure first (slow-query log, `pg_stat_statements`, p6spy). Then: fix
> N+1; project to DTOs for read paths; add proper indexes (check
> `EXPLAIN`); enable JDBC batching (`hibernate.jdbc.batch_size`,
> `order_inserts/updates`); use SEQUENCE generators with pooled
> optimisers because IDENTITY disables insert batching; use
> second-level/query caches only for read-mostly data; paginate with
> keyset; avoid huge `IN` lists; keep transactions short; and use Flyway
> to manage schema and index changes.

---


*More in Q26-Q30, Q59-Q74.*

### Module 4: Microservices

#### M4.1 How do you split a monolith into microservices?

**Strong answer:**

Use the **strangler fig** pattern: put a routing layer (gateway) in
front, carve out one bounded context at a time (often the highest-change
or most independently scalable, not the shared core), and migrate its
data so each service owns its database, with an anti-corruption layer
where models differ. Identify boundaries with DDD (event storming), not
technical layers, and avoid a *distributed monolith* where services must
deploy together. Ensure CI/CD, observability and team ownership exist
*before* splitting.

#### How to understand it

Treat this as a decision/problem-solving question: explain the mechanism
or approach first, then the failure modes, trade-offs, and how you would
verify the result.

**Plain-English starting point:** Use the **strangler fig** pattern: put
a routing layer (gateway) in front, carve out one bounded context at a
time (often the highest-change or most independently scalable, not the
shared core), and migrate its data so each service owns its database,
with an anti-corruption layer where models differ. Identify boundaries
with DDD (event storming), not technical layers, and avoid a
*distributed monolith* where services must deploy together.

#### Key terms you should know

- **DDD**  -  Domain-Driven Design: modeling software around business
  domains, boundaries and domain concepts.
- **observability**  -  The ability to understand internal system behavior
  from telemetry such as logs, metrics and traces.
- **Service**  -  An application or platform capability exposed through a
  defined interface; a Kubernetes Service is a specific networking resource.


#### 30-second version

> Use the **strangler fig** pattern: put a routing layer (gateway) in
> front, carve out one bounded context at a time (often the
> highest-change or most independently scalable, not the shared core),
> and migrate its data so each service owns its database, with an
> anti-corruption layer where models differ. Identify boundaries with
> DDD (event storming), not technical layers, and avoid a *distributed
> monolith* where services must deploy together.

#### M4.2 How do you handle transactions across services?

**Strong answer:**

Two-phase commit coordinates atomic commit but can block under failures
and couples availability. When that trade-off is unsuitable, consider a
**Saga**: a sequence of local transactions, each followed by an event,
with compensating actions on failure. *Choreography* (services react to
events) is simple for 2-3 steps; *orchestration* (a coordinator holds
the state machine) is clearer for complex flows. Use the **transactional
outbox** to atomically save state and the event, then publish via a
relay or CDC. Design compensations carefully (a refund is not an undo),
and make every step idempotent.

#### How to understand it

Treat this as a decision/problem-solving question: explain the mechanism
or approach first, then the failure modes, trade-offs, and how you would
verify the result.

**Plain-English starting point:** Two-phase commit coordinates atomic
commit but can block under failures and couples availability. When that
trade-off is unsuitable, consider a **Saga**: a sequence of local
transactions, each followed by an event, with compensating actions on
failure.

#### Key terms you should know

- **CDC**  -  Change Data Capture: publishing database changes by reading
  the database's change log or transaction log.
- **outbox**  -  A database table used to store events in the same
  transaction as business data so publication can happen reliably
  afterward.
- **Two-phase commit**  -  A protocol separating preparation from a
  coordinated commit or abort decision.
- **Saga**  -  A distributed transaction pattern that coordinates a
  sequence of local transactions and compensating actions instead of one
  global database transaction.


#### 30-second version

> Two-phase commit coordinates atomic commit but can block under
> failures and couples availability. When that trade-off is unsuitable,
> consider a **Saga**: a sequence of local transactions, each followed
> by an event, with compensating actions on failure.

#### M4.3 What delivery guarantees exist and how do you cope?

**Strong answer:**

Brokers provide at-most-once, at-least-once (most common) or
exactly-once within narrow scopes. Real systems use at-least-once plus
**idempotent consumers** (dedupe on event ID in the same transaction as
the business change) so duplicates are harmless. Also handle
out-of-order delivery with versions or timestamps, and poison messages
through retries and dead-letter queues.


#### Key terms you should know

- **transaction**  -  A unit of database work treated as one logical
  operation with defined commit/rollback behavior.


#### 30-second version

> Brokers provide at-most-once, at-least-once (most common) or
> exactly-once within narrow scopes. Real systems use at-least-once plus
> **idempotent consumers** (dedupe on event ID in the same transaction
> as the business change) so duplicates are harmless.

#### M4.4 Which resilience patterns do you apply?

**Strong answer:**

Timeouts on every remote call (shorter than the caller's budget),
retries only for idempotent and transient failures with exponential
backoff + jitter and a retry budget, **circuit breaker** (closed → open
→ half-open) to fail fast and give the dependency time to recover,
**bulkhead** (separate pools per dependency), rate limiting and load
shedding, fallbacks/caches for degraded mode, and health-based routing.
Verify with chaos or fault-injection tests. Naive retries amplify
outages (retry storms).


#### Key terms you should know

- **bulkhead**  -  A resilience pattern that isolates resources such as
  threads or connections so one overloaded dependency does not exhaust
  the whole service.


#### 30-second version

> Timeouts on every remote call (shorter than the caller's budget),
> retries only for idempotent and transient failures with exponential
> backoff + jitter and a retry budget, **circuit breaker** (closed →
> open → half-open) to fail fast and give the dependency time to
> recover, **bulkhead** (separate pools per dependency), rate limiting
> and load shedding, fallbacks/caches for degraded mode, and
> health-based routing. Verify with chaos or fault-injection tests.

#### M4.5 Explain CAP and how it influences design.

**Strong answer:**

During a network partition you must choose consistency (reject or block
requests to stay correct) or availability (answer with possibly stale
data). Banking ledgers lean CP; product catalogues and feeds lean AP
with eventual consistency. Mention PACELC (even without partitions there
is a latency-vs-consistency trade-off), and techniques such as quorum
reads/writes, read-your-writes, and conflict resolution.

#### How to understand it

First understand the core concept, then explain why it exists, how it
behaves in production, and what trade-off you would make.

**Plain-English starting point:** During a network partition you must
choose consistency (reject or block requests to stay correct) or
availability (answer with possibly stale data). Banking ledgers lean CP;
product catalogues and feeds lean AP with eventual consistency.


#### 30-second version

> During a network partition you must choose consistency (reject or
> block requests to stay correct) or availability (answer with possibly
> stale data). Banking ledgers lean CP; product catalogues and feeds
> lean AP with eventual consistency.

#### M4.6 How do you observe a distributed system?

**Strong answer:**

Logs (structured JSON, correlation/trace IDs propagated across HTTP and
messaging), metrics (RED for services, USE for resources, plus business
KPIs), and traces (OpenTelemetry, sampling, spans for DB and remote
calls). Define SLIs/SLOs, alert on symptoms (error-budget burn rate)
rather than causes, and maintain dashboards and runbooks. Tracing is
what turns "it's slow somewhere" into a specific span.

#### How to understand it

Treat this as a decision/problem-solving question: explain the mechanism
or approach first, then the failure modes, trade-offs, and how you would
verify the result.

**Plain-English starting point:** Logs (structured JSON,
correlation/trace IDs propagated across HTTP and messaging), metrics
(RED for services, USE for resources, plus business KPIs), and traces
(OpenTelemetry, sampling, spans for DB and remote calls). Define
SLIs/SLOs, alert on symptoms (error-budget burn rate) rather than
causes, and maintain dashboards and runbooks.

#### Key terms you should know

- **span**  -  One timed operation within a distributed trace, such as an
  HTTP call or database query.
- **trace**  -  A representation of one request's path through distributed
  services.


#### 30-second version

> Logs (structured JSON, correlation/trace IDs propagated across HTTP
> and messaging), metrics (RED for services, USE for resources, plus
> business KPIs), and traces (OpenTelemetry, sampling, spans for DB and
> remote calls). Define SLIs/SLOs, alert on symptoms (error-budget burn
> rate) rather than causes, and maintain dashboards and runbooks.

---


*More in Q43-Q46.*

### Module 5: Maven

#### M5.1 Explain the Maven lifecycle, phases, goals and plugins.

**Strong answer:**

Maven has three built-in lifecycles: `clean`, `default` (build) and
`site`. The default lifecycle runs ordered **phases**:
`validate → compile → test → package → verify → install → deploy`;
running a phase runs every earlier phase. A phase does nothing by
itself: **plugin goals** are bound to phases (`compiler:compile` to
`compile`, `surefire:test` to `test`, `jar:jar` to `package`) and you
can attach more through `<executions>`. `install` copies the artifact to
the local `~/.m2`, `deploy` publishes it to a remote repository. Invoke
a goal directly with `mvn dependency:tree`, or a phase with
`mvn verify`.

#### How to understand it

First understand the core concept, then explain why it exists, how it
behaves in production, and what trade-off you would make.

**Plain-English starting point:** Maven has three built-in lifecycles:
`clean`, `default` (build) and `site`. The default lifecycle runs
ordered **phases**:
`validate → compile → test → package → verify → install → deploy`;
running a phase runs every earlier phase.

#### Key terms you should know

- **goal**  -  A specific action provided by a Maven plugin, such as
  compiling code or running tests.
- **phase**  -  A lifecycle stage in Maven, such as compile, test, package
  or verify.
- **plugin**  -  A Maven component that provides build functionality such
  as compilation, testing or packaging.


#### 30-second version

> Maven has three built-in lifecycles: `clean`, `default` (build) and
> `site`. The default lifecycle runs ordered **phases**:
> `validate → compile → test → package → verify → install → deploy`;
> running a phase runs every earlier phase.

#### M5.2 `dependencyManagement` vs `dependencies`, and parent vs BOM vs aggregator?

**Strong answer:**

`<dependencies>` declares project dependencies, whose scopes determine
their classpaths and transitivity. `<dependencyManagement>` centralizes
dependency metadata and controls versions of matching transitive project
dependencies as well as defaults for direct declarations. Management
alone does not add an artifact, but a child need not explicitly declare
every artifact whose transitive version it manages. An explicit version
on a direct dependency in that project takes precedence over its managed
default. Project dependency management does not manage plugin dependencies.

A **parent POM** supplies inheritance, including properties, plugin
configuration and management sections. A **BOM** is imported with
`<scope>import</scope><type>pom</type>` inside `dependencyManagement` to
align library versions, useful when the project cannot inherit a platform's
parent. An **aggregator** lists `<modules>` for a reactor build. One POM
may be both parent and aggregator; these roles are distinct.

#### How to understand it

If the application declares A and A depends on B, managing B's
version in the application's effective POM can select B's version even
without a direct dependency declaration for B. By contrast, managing C
does not include C when no dependency path brings C into the project.

#### Key terms you should know

- **BOM**  -  A POM supplying a compatible set of managed dependency versions.
- **Transitive dependency**  -  An artifact introduced through another dependency.
- **Aggregator**  -  A POM listing modules built together by the reactor.

#### SDE-3 interview checkpoints

- Explain management versus adding a dependency with an A → B example.
- Inspect `mvn help:effective-pom` and `mvn dependency:tree`.
- Distinguish project dependency versions from plugin dependency versions.

#### 30-second version

> Dependencies add artifacts; dependencyManagement supplies defaults and can
> control transitive project dependency versions without explicit child
> declarations for each artifact. It does not add artifacts by itself. Parent
> means inheritance, BOM means managed library alignment, and aggregator means
> reactor modules.

[Maven dependency mechanism](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html).

#### M5.3 What are the dependency scopes and how are transitive scopes resolved?

**Strong answer:**

`compile` (default: all classpaths, transitive), `provided` (needed to
compile, supplied by the container, not packaged, e.g. servlet API),
`runtime` (not needed to compile, e.g. JDBC driver), `test`, `system`
(avoid) and `import` (BOM only). A `test`-scoped dependency is not
transitive; a `compile` dependency of a `runtime` dependency becomes
`runtime`. Use `<optional>true</optional>` so a dependency isn't pulled
in by consumers. Common production bug: a library accidentally on the
`compile` scope causes version clashes or bloated jars; run
`mvn dependency:analyze` to find unused-declared and used-undeclared
dependencies.

#### How to understand it

First understand the core concept, then explain why it exists, how it
behaves in production, and what trade-off you would make.

**Plain-English starting point:** `compile` (default: all classpaths,
transitive), `provided` (needed to compile, supplied by the container,
not packaged, e.g. servlet API), `runtime` (not needed to compile, e.g.

#### Key terms you should know

- **BOM**  -  Bill of Materials: a dependency-management document that
  centralizes compatible library versions.


#### 30-second version

> `compile` (default: all classpaths, transitive), `provided` (needed to
> compile, supplied by the container, not packaged, e.g. servlet API),
> `runtime` (not needed to compile, e.g.

#### M5.4 How do you handle dependency conflicts and vulnerabilities?

**Strong answer:**

Maven picks the *nearest* version in the tree (first declared on ties),
which can silently downgrade a library. Diagnose with
`mvn dependency:tree -Dverbose`, fix by pinning in
`dependencyManagement`, importing the right BOM, or excluding the
transitive artifact, and enforce with `maven-enforcer-plugin`
(`dependencyConvergence`, `requireUpperBoundDeps`,
`banDuplicatePomDependencyVersions`). For vulnerabilities, run OWASP
Dependency-Check or Dependabot/Renovate in CI, fail the build on high
CVEs, and generate an SBOM (CycloneDX).

#### How to understand it

Treat this as a decision/problem-solving question: explain the mechanism
or approach first, then the failure modes, trade-offs, and how you would
verify the result.

**Plain-English starting point:** Maven picks the *nearest* version in
the tree (first declared on ties), which can silently downgrade a
library. Diagnose with `mvn dependency:tree -Dverbose`, fix by pinning
in `dependencyManagement`, importing the right BOM, or excluding the
transitive artifact, and enforce with `maven-enforcer-plugin`
(`dependencyConvergence`, `requireUpperBoundDeps`,
`banDuplicatePomDependencyVersions`).

#### Key terms you should know

- **BOM**  -  Bill of Materials: a dependency-management document that
  centralizes compatible library versions.
- **OWASP**  -  An organization that publishes widely used
  application-security guidance, including the OWASP Top 10.
- **plugin**  -  A Maven component that provides build functionality such
  as compilation, testing or packaging.


#### 30-second version

> Maven picks the *nearest* version in the tree (first declared on
> ties), which can silently downgrade a library. Diagnose with
> `mvn dependency:tree -Dverbose`, fix by pinning in
> `dependencyManagement`, importing the right BOM, or excluding the
> transitive artifact, and enforce with `maven-enforcer-plugin`
> (`dependencyConvergence`, `requireUpperBoundDeps`,
> `banDuplicatePomDependencyVersions`).

#### M5.5 Surefire vs Failsafe, and how do you organise tests in the build?

**Strong answer:**

Surefire runs unit tests (`*Test`) in the `test` phase; failing tests
stop the build immediately. Failsafe runs integration tests (`*IT`)
across `integration-test` and `verify`, so the build can still run
`post-integration-test` (e.g., shut down containers) before failing at
`verify`. Add JaCoCo for coverage gates, Checkstyle/SpotBugs/Sonar for
static analysis, and Testcontainers for real dependencies. Keep fast
tests on every commit and slower suites on the pipeline.


#### Key terms you should know

- **phase**  -  A lifecycle stage in Maven, such as compile, test, package
  or verify.


#### 30-second version

> Surefire runs unit tests (`*Test`) in the `test` phase; failing tests
> stop the build immediately. Failsafe runs integration tests (`*IT`)
> across `integration-test` and `verify`, so the build can still run
> `post-integration-test` (e.g., shut down containers) before failing at
> `verify`.

#### M5.6 How do you release and publish artifacts?

**Strong answer:**

`-SNAPSHOT` versions are mutable and resolved to the latest build;
releases are immutable and must never be overwritten. Use CI-friendly
versions (`${revision}` with `flatten-maven-plugin`) or the release
plugin, tag the commit, and deploy to a repository manager (Artifact
Registry, Nexus, Artifactory) configured through
`distributionManagement` and credentials in `settings.xml` (`<servers>`,
`<mirrors>`) injected from CI secrets, never committed. For services,
the deliverable is a container image tagged with the commit SHA, not
just the jar.

#### How to understand it

Treat this as a decision/problem-solving question: explain the mechanism
or approach first, then the failure modes, trade-offs, and how you would
verify the result.

**Plain-English starting point:** `-SNAPSHOT` versions are mutable and
resolved to the latest build; releases are immutable and must never be
overwritten. Use CI-friendly versions (`${revision}` with
`flatten-maven-plugin`) or the release plugin, tag the commit, and
deploy to a repository manager (Artifact Registry, Nexus, Artifactory)
configured through `distributionManagement` and credentials in
`settings.xml` (`<servers>`, `<mirrors>`) injected from CI secrets,
never committed.

#### Key terms you should know

- **plugin**  -  A Maven component that provides build functionality such
  as compilation, testing or packaging.


#### 30-second version

> `-SNAPSHOT` versions are mutable and resolved to the latest build;
> releases are immutable and must never be overwritten. Use CI-friendly
> versions (`${revision}` with `flatten-maven-plugin`) or the release
> plugin, tag the commit, and deploy to a repository manager (Artifact
> Registry, Nexus, Artifactory) configured through
> `distributionManagement` and credentials in `settings.xml`
> (`<servers>`, `<mirrors>`) injected from CI secrets, never committed.

#### M5.7 How do you speed up and harden a Maven build?

**Strong answer:**

Use the wrapper (`mvnw`) and pinned plugin versions, parallel builds
(`-T 1C`), incremental module builds (`-pl :svc -am`), CI caching of
`.m2`, avoid `clean` when not needed, remote build cache
(Develocity/Maven build cache extension), and Jib/Buildpacks to build
images without a Docker daemon. For reproducibility set
`project.build.outputTimestamp`; for security use signed artifacts,
trusted mirrors and checksum verification.

#### How to understand it

Treat this as a decision/problem-solving question: explain the mechanism
or approach first, then the failure modes, trade-offs, and how you would
verify the result.

**Plain-English starting point:** Use the wrapper (`mvnw`) and pinned
plugin versions, parallel builds (`-T 1C`), incremental module builds
(`-pl :svc -am`), CI caching of `.m2`, avoid `clean` when not needed,
remote build cache (Develocity/Maven build cache extension), and
Jib/Buildpacks to build images without a Docker daemon. For
reproducibility set `project.build.outputTimestamp`; for security use
signed artifacts, trusted mirrors and checksum verification.

#### Key terms you should know

- **plugin**  -  A Maven component that provides build functionality such
  as compilation, testing or packaging.


#### 30-second version

> Use the wrapper (`mvnw`) and pinned plugin versions, parallel builds
> (`-T 1C`), incremental module builds (`-pl :svc -am`), CI caching of
> `.m2`, avoid `clean` when not needed, remote build cache
> (Develocity/Maven build cache extension), and Jib/Buildpacks to build
> images without a Docker daemon. For reproducibility set
> `project.build.outputTimestamp`; for security use signed artifacts,
> trusted mirrors and checksum verification.

---


*More in Q47-Q54.*

### Module 6: Google Cloud Platform

#### M6.1 Which compute option do you choose: Cloud Run, GKE, Compute Engine or Cloud Functions?

**Strong answer:**

Choose from workload requirements and operational cost. Cloud Run
services fit request-serving applications; Cloud Run also has jobs and
worker pools, so a background worker does not automatically require
Kubernetes. Check the selected resource's scaling, networking, hardware
and regional capabilities. GKE fits workloads needing Kubernetes APIs,
scheduling and platform controls. Compute Engine fits VM-level control
or specialized legacy requirements. Compare cold starts, steady load,
cost, portability and team expertise. [Cloud Run resource
types](https://docs.cloud.google.com/run/docs/overview/what-is-cloud-run).


#### Key terms you should know

- **Cloud Run**  -  GCP's managed container execution platform where the
  platform handles servers and scales container instances.
- **GKE**  -  Google Kubernetes Engine, Google's managed Kubernetes
  service.


#### 30-second version

> Choose from workload requirements and operational cost. Cloud Run
> services fit request-serving applications; Cloud Run also has jobs and
> worker pools, so a background worker does not automatically require
> Kubernetes.

#### M6.2 How do you manage identity and access securely?

**Strong answer:**

IAM binds **principals** to **roles** at an org/folder/project/resource
scope, with inheritance downwards. Each workload gets its own **service
account** with least-privilege roles (avoid `Editor`/`Owner`), and no
downloaded JSON keys: Cloud Run attaches a runtime service account and
GKE uses **Workload Identity Federation** to map a Kubernetes service
account to a Google service account, so the client libraries use
Application Default Credentials automatically. Secrets live in **Secret
Manager** (versioned, IAM-controlled, mounted or fetched at startup),
and Cloud Audit Logs record access. Add organisation policies and VPC
Service Controls for guardrails.

#### How to understand it

Treat this as a decision/problem-solving question: explain the mechanism
or approach first, then the failure modes, trade-offs, and how you would
verify the result.

**Plain-English starting point:** IAM binds **principals** to **roles**
at an org/folder/project/resource scope, with inheritance downwards.
Each workload gets its own **service account** with least-privilege
roles (avoid `Editor`/`Owner`), and no downloaded JSON keys: Cloud Run
attaches a runtime service account and GKE uses **Workload Identity
Federation** to map a Kubernetes service account to a Google service
account, so the client libraries use Application Default Credentials
automatically.

#### Key terms you should know

- **Cloud Run**  -  GCP's managed container execution platform where the
  platform handles servers and scales container instances.
- **GKE**  -  Google Kubernetes Engine, Google's managed Kubernetes
  service.
- **IAM**  -  Identity and Access Management: policies controlling who or
  what can perform which actions on which resources.
- **service account**  -  A non-human Google Cloud identity used by
  workloads or applications.
- **Workload Identity**  -  A mechanism that lets workloads obtain cloud
  identities without embedding long-lived service-account keys.


#### 30-second version

> IAM binds **principals** to **roles** at an
> org/folder/project/resource scope, with inheritance downwards. Each
> workload gets its own **service account** with least-privilege roles
> (avoid `Editor`/`Owner`), and no downloaded JSON keys: Cloud Run
> attaches a runtime service account and GKE uses **Workload Identity
> Federation** to map a Kubernetes service account to a Google service
> account, so the client libraries use Application Default Credentials
> automatically.

#### M6.3 Design a Spring Boot microservice on GCP end to end.

**Strong answer:**

Build with Maven and Jib → image to **Artifact Registry** (vulnerability
scan) → deploy to Cloud Run/GKE across multiple zones behind a global
HTTPS load balancer with **Cloud Armor** and managed TLS. The service
reads config from env/Secret Manager, talks to **Cloud SQL** over
private IP using the Cloud SQL connector, publishes domain events
through the outbox to **Pub/Sub**, and caches in Memorystore (Redis).
Observability: JSON logs correlated with traces, Micrometer metrics to
Cloud Monitoring, SLO-based alerting. Infrastructure is Terraform and
delivery uses Cloud Build + Cloud Deploy with canary rollouts and
automated rollback.

#### How to understand it

Treat this as a decision/problem-solving question: explain the mechanism
or approach first, then the failure modes, trade-offs, and how you would
verify the result.

**Plain-English starting point:** Build with Maven and Jib → image to
**Artifact Registry** (vulnerability scan) → deploy to Cloud Run/GKE
across multiple zones behind a global HTTPS load balancer with **Cloud
Armor** and managed TLS. The service reads config from env/Secret
Manager, talks to **Cloud SQL** over private IP using the Cloud SQL
connector, publishes domain events through the outbox to **Pub/Sub**,
and caches in Memorystore (Redis).

#### Key terms you should know

- **Cloud Run**  -  GCP's managed container execution platform where the
  platform handles servers and scales container instances.
- **GKE**  -  Google Kubernetes Engine, Google's managed Kubernetes
  service.
- **observability**  -  The ability to understand internal system behavior
  from telemetry such as logs, metrics and traces.
- **outbox**  -  A database table used to store events in the same
  transaction as business data so publication can happen reliably
  afterward.
- **Pub/Sub**  -  Google Cloud's asynchronous messaging service for
  publishing messages to topics and delivering them to subscriptions.
- **Service**  -  An application or platform capability exposed through a
  defined interface; a Kubernetes Service is a specific networking resource.
- **SLO**  -  Service Level Objective: a measurable reliability target,
  such as 99.9% successful requests.


#### 30-second version

> Build with Maven and Jib → image to **Artifact Registry**
> (vulnerability scan) → deploy to Cloud Run/GKE across multiple zones
> behind a global HTTPS load balancer with **Cloud Armor** and managed
> TLS. The service reads config from env/Secret Manager, talks to
> **Cloud SQL** over private IP using the Cloud SQL connector, publishes
> domain events through the outbox to **Pub/Sub**, and caches in
> Memorystore (Redis).

#### M6.4 How do you use Pub/Sub from Spring correctly?

**Strong answer:**

Use Spring Cloud GCP (`PubSubTemplate`, `@ServiceActivator`/inbound
adapter with manual ack). Delivery is at-least-once, so handlers must be
idempotent (dedupe by message ID or business key). Tune the ack deadline
to processing time, configure retry with backoff and a **dead-letter
topic**, use ordering keys only when per-key order matters, set flow
control (`maxOutstandingElementCount`) for back-pressure, and monitor
oldest unacked message age and DLQ size. Never ack before the work is
durably done.

#### How to understand it

Treat this as a decision/problem-solving question: explain the mechanism
or approach first, then the failure modes, trade-offs, and how you would
verify the result.

**Plain-English starting point:** Use Spring Cloud GCP
(`PubSubTemplate`, `@ServiceActivator`/inbound adapter with manual ack).
Delivery is at-least-once, so handlers must be idempotent (dedupe by
message ID or business key).

#### Key terms you should know

- **back-pressure**  -  A mechanism that prevents an upstream producer
  from overwhelming a downstream consumer.


#### 30-second version

> Use Spring Cloud GCP (`PubSubTemplate`, `@ServiceActivator`/inbound
> adapter with manual ack). Delivery is at-least-once, so handlers must
> be idempotent (dedupe by message ID or business key).

#### M6.5 How do you choose a data store on GCP?

**Strong answer:**

Cloud SQL (PostgreSQL/MySQL) for regional relational OLTP with HA and
read replicas; AlloyDB for higher PostgreSQL performance and analytics;
**Spanner** for globally consistent, horizontally scalable relational
data; Firestore for document data with real-time sync; Bigtable for very
high-throughput wide-column/time-series; **BigQuery** for serverless
analytics (columnar, partitioned and clustered, never as an OLTP store);
Memorystore for caching; Cloud Storage for objects. Match consistency,
query patterns, scale and cost; don't pick Spanner "because it's
powerful".

#### How to understand it

Treat this as a decision/problem-solving question: explain the mechanism
or approach first, then the failure modes, trade-offs, and how you would
verify the result.

**Plain-English starting point:** Cloud SQL (PostgreSQL/MySQL) for
regional relational OLTP with HA and read replicas; AlloyDB for higher
PostgreSQL performance and analytics; **Spanner** for globally
consistent, horizontally scalable relational data; Firestore for
document data with real-time sync; Bigtable for very high-throughput
wide-column/time-series; **BigQuery** for serverless analytics
(columnar, partitioned and clustered, never as an OLTP store);
Memorystore for caching; Cloud Storage for objects. Match consistency,
query patterns, scale and cost; don't pick Spanner "because it's
powerful".


#### 30-second version

> Cloud SQL (PostgreSQL/MySQL) for regional relational OLTP with HA and
> read replicas; AlloyDB for higher PostgreSQL performance and
> analytics; **Spanner** for globally consistent, horizontally scalable
> relational data; Firestore for document data with real-time sync;
> Bigtable for very high-throughput wide-column/time-series;
> **BigQuery** for serverless analytics (columnar, partitioned and
> clustered, never as an OLTP store); Memorystore for caching; Cloud
> Storage for objects. Match consistency, query patterns, scale and
> cost; don't pick Spanner "because it's powerful".

#### M6.6 How do you design for high availability and disaster recovery?

**Strong answer:**

Define **RTO** (time to recover) and **RPO** (data you can lose) with
the business, then pick the pattern: multi-zone within a region (default
HA: regional GKE, regional Cloud SQL with failover, regional load
balancer), cross-region for DR (read replicas or Spanner multi-region,
multi-region storage, traffic failover with a global load balancer).
Automate backups with point-in-time recovery, test restores and failover
game-days, keep infrastructure as code so a region can be rebuilt, and
make deployments backward compatible so rollbacks are safe.

#### How to understand it

Treat this as a decision/problem-solving question: explain the mechanism
or approach first, then the failure modes, trade-offs, and how you would
verify the result.

**Plain-English starting point:** Define **RTO** (time to recover) and
**RPO** (data you can lose) with the business, then pick the pattern:
multi-zone within a region (default HA: regional GKE, regional Cloud SQL
with failover, regional load balancer), cross-region for DR (read
replicas or Spanner multi-region, multi-region storage, traffic failover
with a global load balancer). Automate backups with point-in-time
recovery, test restores and failover game-days, keep infrastructure as
code so a region can be rebuilt, and make deployments backward
compatible so rollbacks are safe.

#### Key terms you should know

- **RTO**  -  The target duration for restoring service after a disruption.
- **RPO**  -  The acceptable recovery point, often expressed as an amount of time of data loss.
- **HA**  -  Availability maintained through redundancy and failure handling.
- **DR**  -  Recovery of service and data after a major disruption.
- **PITR**  -  Restoring a database to a selected point in time within retained recovery history.


#### 30-second version

> Define **RTO** (time to recover) and **RPO** (data you can lose) with
> the business, then pick the pattern: multi-zone within a region
> (default HA: regional GKE, regional Cloud SQL with failover, regional
> load balancer), cross-region for DR (read replicas or Spanner
> multi-region, multi-region storage, traffic failover with a global
> load balancer). Automate backups with point-in-time recovery, test
> restores and failover game-days, keep infrastructure as code so a
> region can be rebuilt, and make deployments backward compatible so
> rollbacks are safe.

---

### Module 7: System Design Prompts (practice 45 min each)

1.  URL shortener 2. Rate limiter 3. Notification service 4.
    Order/payment platform with saga 5. Ride-hailing/real-time tracking.
    **Framework:** requirements (functional/non-functional) → capacity
    estimates → API → data model → high-level design → deep dive
    (scaling, consistency, failures) → trade-offs.

---

### Module 8: Coding Programs with Solutions

#### 1. LRU Cache (O(1)): classic

**Derive the approach:** the operations require both key lookup and
recency updates. A hash table solves lookup; a doubly linked list allows
removal/reinsertion of a known node without searching. Access-ordered
`LinkedHashMap` supplies both for the concise solution.

**Why this, not the alternatives:** an array/list requires O(n) movement
or search; a timestamp heap adds O(log n) updates and stale-entry
handling. Implement the map plus list yourself when the interviewer
disallows library LRU. Exact global LRU under contention may be more
expensive than an approximate eviction policy.

**What changes:** insertion order evicts an old entry even after a
recent read. An access-order `get` mutates ordering, so concurrent reads
need coordination too. A synchronized wrapper only protects calls
through that wrapper; multi-step operations need one shared lock.

**Trace and checks:** capacity two; put A, put B, read A, put C must
evict B. Test replacement, capacity one, invalid capacity and mutable
keys. Expected O(1) operations, O(capacity) state.

**Strong answer signal:** connect each data structure to a required
operation and explain the recency invariant.

```java
class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;
    LRUCache(int capacity) {
        super(Math.max(1, capacity), 0.75f, true);
        if (capacity < 1) throw new IllegalArgumentException("capacity must be positive");
        this.capacity = capacity;
    }
    @Override protected boolean removeEldestEntry(Map.Entry<K, V> e) { return size() > capacity; }
}
```

*Interviewer follow-up:* implement without LinkedHashMap →
`HashMap<K, Node>` + doubly linked list with head/tail sentinels; move
node to head on access, evict the tail. Make thread-safe with
`synchronized` wrapper or a lock (a coarse shared lock can preserve
exact LRU; specialized caches trade eviction policy against
concurrency).

#### 2. Streams: top 3 earners per department

**Derive the approach:** the ranking is independent per department, so
partition by department, order each group and retain its first three
entries. Define whether “three” means three people or three distinct
salary ranks.

**Why this, not the alternatives:** sorting each group is easy to
inspect and costs O(sum(m_d log m_d)). For large groups and fixed k,
maintain a size-k min-heap per department for O(n log k) processing and
O(departments × k) retained candidates. Sorting the whole dataset is
unnecessary unless its global order is also required.

**What changes:** tied salaries need a stable secondary key for
reproducibility. A top-three-distinct-salaries requirement can return
more than three people. The code uses `BigDecimal` salaries and a unique employee ID to break ties. It assumes non-null employees, departments and salaries, and one comparable currency. If data lives
in SQL, consider a partitioned window ranking query and return only
needed rows.

**Trace and checks:** salaries 90, 100, 100, 80 produce three people but
only two distinct ranks. Test fewer than three employees, missing
departments and ties. The shown grouping retains O(n) data.

**Strong answer signal:** explain the business meaning of ranking before
optimizing the stream.

```java
record Employee(long id, String name, String dept, java.math.BigDecimal salary) {}

// Three people per department; unique employee ID breaks equal-salary ties.
Map<String, List<Employee>> top3 = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.collectingAndThen(Collectors.toList(), group -> group.stream()
            .sorted(Comparator.comparing(Employee::salary).reversed()
                .thenComparingLong(Employee::id))
            .limit(3).toList())));
```

#### 3. Producer-Consumer with BlockingQueue

**Derive the approach:** producers and consumers run at different speeds
and need a safe handoff. A bounded blocking queue combines
synchronization, waiting and a memory bound.

**Why this, not the alternatives:** polling a normal list risks races
and wastes CPU; an unbounded queue hides overload as memory growth. A
custom wait/notify queue is useful as an interview exercise but adds
lifecycle and signaling responsibilities already handled by the library.

**What changes:** the example assumes one producer, one consumer and a
sentinel that cannot be real data. Multiple consumers need an agreed
termination protocol, often one terminal signal per consumer after all
producers finish. Interrupting a producer before it enqueues the
sentinel can strand the consumer; a supervisor must cancel/join both
sides on failure. Durable work needs a broker or persisted queue, not
only memory.

**Trace and checks:** fill ten slots; the next put waits until a take
frees capacity. Test interruption while full/empty, consumer failure and
shutdown. Queue operations are O(1), but waiting time is
workload-dependent; storage is O(capacity).

**Strong answer signal:** distinguish backpressure from a complete
shutdown protocol.

```java
// Complete lifecycle and cancellation handling: see Appendix A.
ProducerConsumerDemo.run(100, System.out::println);
```

*Mention:* `put`/`take` block (back-pressure); poison pill for shutdown;
always restore the interrupt flag.

#### 4. Token-Bucket Rate Limiter (thread-safe)

**Derive the approach:** the requirement permits a short burst but
limits the average rate. Represent available credit as tokens, refill by
elapsed monotonic time and cap credit at capacity.

**Why this, not the alternatives:** a fixed window can admit two bursts
around a boundary; an exact sliding log retains each accepted timestamp.
A leaky-bucket queue controls output pacing and introduces waiting,
which differs from immediate admit/reject behavior.

**What changes:** wall-clock adjustments distort refill, so use an
injectable monotonic ticker. Validate positive capacity/rate. Without
the lock, two requests can spend the same token. Multiple JVMs require
coordinated state or an explicitly approximate per-instance allowance.
Floating-point refill may need a carefully defined rounding policy at
exact boundaries.

**Trace and checks:** capacity two and one token/second: two immediate
successes, one rejection, then one success after one simulated second.
Test idle refill capped at capacity and concurrent callers. Local state
and work are O(1), excluding lock contention.

**Strong answer signal:** distinguish burst capacity, refill rate and
concurrent request count.

```java
class TokenBucket {
    private final int capacity;
    private final double refillPerSec;
    private final java.util.function.LongSupplier ticker;
    private double tokens;
    private long last;

    TokenBucket(int capacity, double refillPerSec) {
        this(capacity, refillPerSec, System::nanoTime);
    }
    TokenBucket(int capacity, double refillPerSec,
                java.util.function.LongSupplier ticker) {
        if (capacity < 1 || !Double.isFinite(refillPerSec) || refillPerSec <= 0)
            throw new IllegalArgumentException("positive finite capacity/rate required");
        this.capacity = capacity;
        this.refillPerSec = refillPerSec;
        this.ticker = java.util.Objects.requireNonNull(ticker);
        this.tokens = capacity;
        this.last = ticker.getAsLong();
    }
    synchronized boolean tryAcquire() {
        long now = ticker.getAsLong();
        long elapsed = now - last;
        if (elapsed < 0) throw new IllegalStateException("ticker moved backward");
        tokens = Math.min(capacity, tokens + elapsed / 1e9 * refillPerSec);
        last = now;
        if (tokens < 1) return false;
        tokens--;
        return true;
    }
}
```

*Follow-up:* distributed version → Redis + Lua script for atomic
refill/consume.

#### 5. Async fan-out with CompletableFuture

**Derive the approach:** user and order reads do not depend on one
another, so start both and combine only after both results are ready.
Sequential latency is roughly the sum; parallel latency approaches the
slower call plus overhead, subject to capacity.

**Why this, not the alternatives:** sequential calls are simpler when
cheap or dependent. Virtual threads make blocking tasks easier to
express; reactive composition fits an already reactive stack. Futures
help express the dependency graph, but are not a reason to fan out
without limits.

**What changes:** if the order call requires the user result, compose it
after the first call instead. A blanket fallback can hide an
authorization or data error. A future timeout does not necessarily stop
network work; define deadlines and ownership of cancellation. Waiting on
subtasks submitted to the same saturated pool can cause starvation.

**Trace and checks:** user completes in 100 ms, orders in 300 ms; the
successful combination waits for orders. Test each branch failing, both
failing, timeout and executor rejection. Two branches mean constant task
count, not constant remote cost.

**Strong answer signal:** identify independent work, result semantics
and failure ownership.

```java
CompletableFuture<User> u = CompletableFuture.supplyAsync(() -> userSvc.get(id), pool);
CompletableFuture<List<Order>> o = CompletableFuture.supplyAsync(() -> orderSvc.get(id), pool);
Profile p = u.thenCombine(o, Profile::new)
             .orTimeout(2, TimeUnit.SECONDS)
             .join();
```

*Mention:* select an executor deliberately, especially for blocking I/O.
`orTimeout` completes a future exceptionally but does not stop the
underlying call; `CompletableFuture.cancel(true)` does not interrupt its
computation. Configure downstream deadlines and explicit cancellation,
and distinguish timeout from business failure before returning a
fallback. [CompletableFuture
API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html).

#### 6. Thread-safe Singleton with enum and holder alternatives

**Derive the approach:** one instance is required within one
class-loader scope, and concurrent callers must not observe partial
construction. Enum initialization or the initialization-on-demand holder
uses JVM initialization guarantees.

**Why this, not the alternatives:** a synchronized accessor is correct
but adds a locking path; double-checked locking is more subtle and
requires correct volatile publication. In application code, an injected
singleton-scoped service often gives better lifecycle control and
testability than a global singleton. Enum is an option, not universally
“best.”

**What changes:** a singleton does not make its mutable fields
thread-safe, and separate class loaders can each have an instance. A
distributed singleton requires coordination beyond this pattern. Lazy
construction shifts initialization failure to first use; eager
construction discovers it sooner.

**Trace and checks:** concurrent holder access returns one reference
after class initialization. Test access from multiple threads and avoid
using static global state as a substitute for dependency injection.
Access is O(1); retained state depends on the singleton's contents.

**Strong answer signal:** state the scope of “one” and separate
construction safety from state safety.

```java
public enum Config { INSTANCE; /* safe against reflection & serialization */ }

class Holder { private Holder() {}
    private static class H { static final Holder I = new Holder(); }
    static Holder get() { return H.I; } }   // lazy, thread-safe via class loading
```

#### 7. Spring Boot: REST + global error handling + N+1 fix

**Derive the approach:** the response needs order fields and items, so
define that read shape explicitly, map it inside the service transaction
and return a DTO with a controlled error contract.

**Why this, not the alternatives:** serializing an entity can trigger
lazy queries, expose fields or recurse through associations. Globally
eager relationships overfetch unrelated use cases. An entity graph fits
this read; a DTO query can be better when only a few columns are needed.

**What changes:** fetching a to-many collection with pagination requires
care; paginate parent IDs or use an appropriate projection. Two
collections can multiply rows. A graph expresses required loading, not a
portable guarantee of one SQL statement. Exposing raw exception messages
is unsafe unless they are intentionally user-facing.

**Trace and checks:** existing order with two items yields one DTO;
missing order gives 404; an empty order yields an empty items list.
Measure queries and rows with realistic cardinality and verify
authorization. Cost depends on fetched rows and query plans, not just
the Java mapper loop.

**Strong answer signal:** tie transaction and fetch boundaries to the
API contract and verify emitted SQL.

```java
@RestController @RequestMapping("/orders") @RequiredArgsConstructor
class OrderController {
    private final OrderService svc;
    @GetMapping("/{id}") OrderDto get(@PathVariable Long id) { return svc.get(id); }
}

@Service @RequiredArgsConstructor
class OrderService {
    private final OrderRepository repo;
    @Transactional(readOnly = true)
    OrderDto get(Long id) {
        return repo.findWithItemsById(id).map(OrderDto::from)
                   .orElseThrow(() -> new OrderNotFoundException(id));
    }
}

interface OrderRepository extends JpaRepository<Order, Long> {
    @EntityGraph(attributePaths = "items")
    Optional<Order> findWithItemsById(Long id);
}

@RestControllerAdvice
class ApiErrors {
    @ExceptionHandler(OrderNotFoundException.class)
    ProblemDetail notFound(OrderNotFoundException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, "Order not found");
    }
}
```

#### 8. Quick algorithm warm-ups

**Longest unique substring  -  derive and choose:** a repeated character
only invalidates windows containing its previous occurrence. Keep the
last index and advance the left boundary to `max(left, previous + 1)`.
This beats enumerating O(n²) substrings; a set-based shrinking window is
equally valid but may perform more removals. On `abba`, moving left
backward at the last `a` gives a wrong answer; the maximum is two. The
code counts UTF-16 units; code-point semantics change representation.
Expected O(n) time, O(distinct characters) state. A strong explanation
proves the window remains duplicate-free.

**First non-repeating character  -  derive and choose:** counts determine
uniqueness; encounter order determines “first.” Count then scan the
original string, or use insertion-ordered counts. Sorting loses
encounter order, while a plain map's iteration order is not the answer.
On `swiss`, return `w`; on `aabb`, report absence. A live stream needs
counts plus a queue of candidates. O(n) time and O(alphabet) space;
define the same character model as above.

**Linked-list cycle  -  derive and choose:** two moving positions inside a
cycle gain one relative step each iteration and eventually meet. Floyd's
method uses O(1) space; a visited identity set is easier to explain and
can expose the first repeated node but costs O(n). Stop when fast or
fast.next is null. Duplicate values are not cycles; compare node
identity. Test self-cycle, two-node cycle, empty and linear lists.
Finding the cycle entry requires the additional reset-and-walk phase.
O(n) time.

**Merge intervals  -  derive and choose:** sorting by start makes only the
last merged interval a possible overlap candidate. Pairwise comparison
is O(n²), and a heap is unnecessary for a static union. The full
implementation and boundary analysis appear under “Merge overlapping
intervals.” Closed `[1,2]` and `[2,3]` merge in that implementation;
half-open intervals require an explicit endpoint policy. O(n log n) time
plus output space.

**Longest substring without repeating characters (sliding window,
O(n)):**

```java
int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> idx = new HashMap<>(); int best = 0, left = 0;
    for (int r = 0; r < s.length(); r++) {
        Integer prev = idx.put(s.charAt(r), r);
        if (prev != null && prev >= left) left = prev + 1;
        best = Math.max(best, r - left + 1);
    }
    return best;
}
```

**First non-repeating character:** `LinkedHashMap<Character,Integer>`
counts, return the first entry with value 1. **Detect cycle in linked
list:** Floyd's slow/fast pointers, O(1) space. **Merge intervals:**
sort by start, then merge in one pass, O(n log n).

---

### Module 9: Behavioral (Senior Level)

Prepare 5 **STAR** stories with metrics (Situation, Task, Action,
**Result**):

1.  Production incident you led (root cause, fix, prevention).
2.  A big architecture decision and its trade-offs.
3.  Performance improvement ("p99 from 2s → 300ms by …").
4.  Disagreement with a peer/manager and how it was resolved.
5.  Mentoring / raising team standards.

**Questions to ask them:** deployment frequency, on-call load, tech-debt
policy, how architecture decisions are made.

### Final Checklist

- Can explain `@Transactional` pitfalls, N+1, HashMap internals, and
  saga/outbox *without notes*
- Can code LRU, a rate limiter, and a stream grouping in 10 minutes each
- Have 5 STAR stories and 2 system designs rehearsed aloud

---

<!-- ===== Part 2: Question Bank Vol. 1 (Core Java, Spring, JPA, Microservices) ===== -->

<a id="senior-java-question-bank-vol-1-detailed-answers"></a>
<a id="part-2"></a>
## Part 02 - Question Bank Vol. 1 - Java, Spring, JPA and microservices

Companion to the refresher course. Each answer follows what senior
interviewers score: **definition → internals → trade-off → pitfall →
real-world example.** Practise saying them aloud in 60-90 seconds.

---

### A. Core Java

#### Q1. Explain the `equals()`/`hashCode()` contract and what breaks if you violate it.

**Strong answer:**

If `a.equals(b)` is true, `a.hashCode() == b.hashCode()` must hold;
equals must be reflexive, symmetric, transitive, consistent and false
for null. The reverse is not required (collisions are legal). If you
override `equals` without `hashCode`, equal objects land in different
buckets, so `HashSet.contains` and `HashMap.get` fail intermittently.
Mutating fields used in `hashCode` after inserting into a hash
collection "loses" the entry. *Production tip:* use immutable keys or
records; for JPA entities use a stable business key.


#### 30-second version

> If `a.equals(b)` is true, `a.hashCode() == b.hashCode()` must hold;
> equals must be reflexive, symmetric, transitive, consistent and false
> for null. The reverse is not required (collisions are legal).

#### Q2. Why is `String` immutable and what is the String pool?

**Strong answer:**

Immutability gives thread-safety, safe use as map keys (hash cached),
security (class names, URLs, credentials cannot be altered after
validation) and enables the pool, where literals are interned and shared
in the heap (since Java 7). `new String("a")` creates a separate object;
`intern()` returns the pooled one. In loops use `StringBuilder` (not
thread-safe, fast) or `StringBuffer` (synchronized, rarely needed).
Store passwords in `char[]` so they can be wiped.


#### Key terms you should know

- **heap**  -  JVM memory where Java objects are allocated.


#### 30-second version

> Immutability gives thread-safety, safe use as map keys (hash cached),
> security (class names, URLs, credentials cannot be altered after
> validation) and enables the pool, where literals are interned and
> shared in the heap (since Java 7). `new String("a")` creates a
> separate object; `intern()` returns the pooled one.

#### Q3. How do fail-fast and fail-safe iterators differ?

**Strong answer:**

“Fail-safe” is an informal label; distinguish the actual iterator
contracts. `ArrayList` and `HashMap` iterators detect many structural
changes made through another path and may throw
`ConcurrentModificationException`, on a best-effort basis.
`CopyOnWriteArrayList` iterators traverse a snapshot and do not throw that
exception due to later list changes; writes copy the backing array and
can cost O(n). `ConcurrentHashMap` iterators are weakly consistent, not
snapshots.

Use `Iterator.remove()` only when that iterator supports it. It is
supported by ordinary `ArrayList`/`HashMap` iterators, but a
`CopyOnWriteArrayList` iterator throws `UnsupportedOperationException`.
For that list, use a supported collection-level operation such as
`removeIf`. Choose copy-on-write collections for read-heavy,
rarely-modified data such as listener registrations.

#### How to understand it

A snapshot iterator continues to show the snapshot it captured even
after the live collection changes. That protects iteration from
concurrent structural changes; it does not imply that iterator mutation
is supported or that contained objects are deeply immutable.

#### Key terms you should know

- **Fail-fast**  -  Best-effort detection of incompatible structural modification.
- **Snapshot iterator**  -  Traversal of a previously captured collection structure.
- **Weak consistency**  -  Concurrent traversal without a fixed snapshot or fail-fast guarantee.

#### SDE-3 interview checkpoints

- Check each iterator type before choosing a removal strategy.
- Test snapshot contents after changing the live list.
- Never use fail-fast exceptions as a synchronization mechanism.

#### 30-second version

> ArrayList and HashMap iterators are best-effort fail-fast;
> CopyOnWriteArrayList uses snapshots; ConcurrentHashMap is weakly consistent.
> Iterator removal is implementation-dependent: it throws for
> CopyOnWriteArrayList, whose supported collection-level removeIf can be used
> instead.

[Java 21 CopyOnWriteArrayList](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CopyOnWriteArrayList.html).

#### Q4. What is PECS in generics?

**Strong answer:** PECS means Producer Extends, Consumer Super. Read Number values from `List<? extends Number>`; you cannot add an arbitrary non-null Number because the actual element subtype is unknown. This is not immutable: supported removal/clear operations and adding null can still be legal. A `List<? super Integer>` accepts Integer values; reads have type Object unless narrowed safely. Use `List<T>` when the same API must both consume and produce T.

`Collections.copy(List<? super T> dest, List<? extends T> src)` is a useful example, but the destination must already have enough elements; capacity alone is insufficient. Type erasure also limits `new T()` and reified parameterized type checks.

[Java wildcard guidelines](https://docs.oracle.com/javase/tutorial/java/generics/wildcardGuidelines.html).

#### Q5. Checked vs unchecked exceptions: what is your strategy?

**Strong answer:** checked exceptions require a catch or throws declaration; RuntimeException and Error subclasses are unchecked. Recovery expectations help API design, but the hierarchy does not prove recoverability: Spring uses unchecked data-access exceptions for failures that may be transient. Choose a contract the caller can act on, preserve causes, and document retryable failures explicitly.

Use try-with-resources for owned AutoCloseable resources and inspect suppressed close failures when diagnosing errors. Propagate InterruptedException or restore the interrupt flag when handling it; do not swallow cancellation. Translate failures once at a suitable boundary without exposing sensitive internal messages or duplicating logs.

[Java exception guidance](https://docs.oracle.com/javase/tutorial/essential/exceptions/runtime.html).

#### Q6. Explain class loading and when you meet `ClassNotFoundException` vs `NoClassDefFoundError`.

**Strong answer:** the standard ClassLoader delegation model is parent-first, but custom loaders and containers can use different policies. Loading, linking (verification, preparation and resolution) and initialization are distinct; resolution may be lazy. Class.forName/loadClass can throw checked ClassNotFoundException when a named class is unavailable. NoClassDefFoundError is a linkage error when the JVM cannot obtain a required definition, or when it later tries to use a class whose initialization previously failed. The first initialization failure may be ExceptionInInitializerError; inspect its cause.

Use the complete cause chain, the resolved dependency graph and `-Xlog:class+load=info` on Java 21. Do not assume that loading alone runs static initializers; see Q152.

#### Q7. How does `ConcurrentHashMap` achieve thread safety and why does it forbid null?

**Strong answer:**

Java 8+: a table of bins; empty-bin inserts use CAS, non-empty bins lock
only the head node (`synchronized`), so contention is per-bucket. Reads
are lock-free via volatile reads. Nulls are banned because
`get(k) == null` would be ambiguous (absent vs mapped to null) in a
concurrent setting where you cannot do a safe `containsKey` follow-up.
Use `compute`, `merge`, `putIfAbsent` for atomic compound operations;
`check-then-put` is a race.


#### Key terms you should know

- **bin**  -  A bucket position in HashMap's internal table; OpenJDK
  source commonly calls the entries at one index a bin.
- **bucket**  -  One position in a hash table's internal array where
  entries can be stored.
- **CAS**  -  Compare-and-set, an atomic CPU/JVM operation that updates a
  value only if it still equals an expected value.


#### 30-second version

> Java 8+: a table of bins; empty-bin inserts use CAS, non-empty bins
> lock only the head node (`synchronized`), so contention is per-bucket.
> Reads are lock-free via volatile reads.

#### Q8. What are ThreadLocals' dangers?

**Strong answer:**

They store per-thread state (user context, MDC, date formatters), but
with pooled threads values outlive the request unless you `remove()` in
a `finally`/filter, causing data leaks between users and classloader
memory leaks. They also don't propagate to child/async threads
automatically (use a `TaskDecorator`, `InheritableThreadLocal`
carefully, or scoped values: preview in Java 21 and final in Java 25).
With virtual threads, large per-thread state gets expensive. Scoped
values support bounded-lifetime context sharing, not arbitrary mutable
thread-local storage. [Java 25
ScopedValue](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/ScopedValue.html).


#### 30-second version

> They store per-thread state (user context, MDC, date formatters), but
> with pooled threads values outlive the request unless you `remove()`
> in a `finally`/filter, causing data leaks between users and
> classloader memory leaks. They also don't propagate to child/async
> threads automatically (use a `TaskDecorator`, `InheritableThreadLocal`
> carefully, or scoped values: preview in Java 21 and final in Java 25).

#### Q9. Are parallel streams a good idea?

**Strong answer:**

Only for CPU-bound, stateless, non-blocking operations on large, easily
splittable sources (arrays, `ArrayList`) with a cheap merge. They use
the shared `ForkJoinPool.commonPool()`, so a blocking call in one stream
can starve the whole JVM; ordering and `LinkedList`/`iterate` sources
hurt. Always measure with JMH. For IO use a dedicated executor or
virtual threads.


#### 30-second version

> Only for CPU-bound, stateless, non-blocking operations on large,
> easily splittable sources (arrays, `ArrayList`) with a cheap merge.
> They use the shared `ForkJoinPool.commonPool()`, so a blocking call in
> one stream can starve the whole JVM; ordering and
> `LinkedList`/`iterate` sources hurt.

#### Q10. Immutability: how do you design an immutable class?

**Strong answer:**

`final` class, private final fields, no setters, defensive copies in
constructor and getters for mutable components (`List.copyOf`, `Date`
clones), no leaking `this` during construction. Benefits: thread-safety
without locks, safe sharing and caching. Java 16+ `record` gives this
for shallow immutability; collections inside still need `List.copyOf` in
the compact constructor.


#### 30-second version

> `final` class, private final fields, no setters, defensive copies in
> constructor and getters for mutable components (`List.copyOf`, `Date`
> clones), no leaking `this` during construction. Benefits:
> thread-safety without locks, safe sharing and caching.

---

### B. Spring & Spring Boot

#### Q11. How does Spring resolve circular dependencies?

**Strong answer:**

For singleton beans with *setter/field* injection, Spring exposes an
early reference via a three-level cache (`singletonObjects`,
`earlySingletonObjects`, `singletonFactories`). Constructor injection
cannot be resolved (`BeanCurrentlyInCreationException`), and Boot 2.6+
prohibits circular references by default. The right answer: treat a
cycle as a design smell and break it by extracting a third service,
publishing events, or injecting `ObjectProvider`/`@Lazy` only as a last
resort.


#### Key terms you should know

- **Application service**  -  A component coordinating a business use case;
  it may be a Spring-managed bean and is not a Kubernetes Service.


#### 30-second version

> For singleton beans with *setter/field* injection, Spring exposes an
> early reference via a three-level cache (`singletonObjects`,
> `earlySingletonObjects`, `singletonFactories`). Constructor injection
> cannot be resolved (`BeanCurrentlyInCreationException`), and Boot 2.6+
> prohibits circular references by default.

#### Q12. Explain Spring AOP and its limitations.

**Strong answer:**

Spring AOP applies cross-cutting concerns such as transactions,
security, logging and caching through runtime proxies. JDK dynamic
proxies expose interfaces; CGLIB creates subclasses. The actual proxy
type depends on configuration; Spring Boot commonly defaults to class
proxies. Know aspect, advice, pointcut and join point.

Advice applies to eligible calls through the proxy. Self-invocation and
private methods bypass ordinary proxy advice. CGLIB cannot subclass a
final class or override a final method. However, a JDK interface proxy
can advise an interface call whose target implementation method is final:
it delegates instead of overriding that method. AspectJ weaving has a
different interception model.

`@Around` controls whether and how the target executes. It may call
`proceed()` zero times (cached result or rejection), once, or multiple
times (a deliberate retry policy). Return-value and exception behavior
must preserve the intended API contract; always rethrowing is not a
universal rule.

#### How to understand it

First identify the reference used by the caller and the proxy type.
Calling an interface proxy can run advice before delegating to a final
implementation method. Calling `this.someMethod()` inside the target
does not re-enter its proxy. A timing aspect should normally proceed once
and preserve failures, whereas caching or retry advice has a different
contract.

#### Key terms you should know

- **AOP**  -  Applying cross-cutting behavior at selected execution points.
- **Proxy**  -  An intermediary that intercepts calls before delegating.
- **Around advice**  -  Advice that controls target invocation and the caller-visible result.

#### SDE-3 interview checkpoints

- Distinguish JDK interface proxies from CGLIB subclasses.
- Test self-invocation and final target methods with the configured proxy type.
- Define retry safety, exception handling and the number of target invocations.

#### 30-second version

> Spring AOP intercepts eligible calls through proxies. Final-method
> restrictions apply to subclass proxies; JDK proxies can advise interface calls
> to final target implementations. Around advice may skip, invoke or repeat the
> target deliberately, while honoring its result and failure contract.

[Proxy mechanisms](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html), [around advice](https://docs.spring.io/spring-framework/reference/core/aop/ataspectj/advice.html).

#### Q13. How do you manage configuration across environments?

**Strong answer:**

Externalised config precedence: command-line args \> env vars \>
`application-{profile}.yml` \> `application.yml`. Use
`@ConfigurationProperties` (type-safe, validated with `@Validated`)
instead of scattered `@Value`. Secrets come from Secret Manager/Vault,
never from Git. In Kubernetes use ConfigMaps/Secrets and, for live
reload, Spring Cloud Config or `@RefreshScope`. Same artifact, different
config (12-factor).


#### 30-second version

> Externalised config precedence: command-line args \> env vars \>
> `application-{profile}.yml` \> `application.yml`. Use
> `@ConfigurationProperties` (type-safe, validated with `@Validated`)
> instead of scattered `@Value`.

#### Q14. How does `@Async` work, and what goes wrong?

**Strong answer:** in proxy mode, @Async dispatches an eligible call to a configured executor; self-invocation bypasses the proxy. Spring Boot's executor depends on beans, configuration and version. With Java 21 and virtual threads enabled, recent Boot versions use a virtual-thread SimpleAsyncTaskExecutor; otherwise auto-configuration normally uses ThreadPoolTaskExecutor. Bound admission, queued work and downstream resources deliberately.

A void method's failure is handled by AsyncUncaughtExceptionHandler (the default logs it). A Future or CompletableFuture exposes failure to the caller. Propagate security/MDC context deliberately and clean it up. A caller's thread-bound transaction does not move with the asynchronous task.

[Spring Boot task execution](https://docs.spring.io/spring-boot/reference/features/task-execution-and-scheduling.html).

#### Q15. Spring caching: how and what are the traps?

**Strong answer:**

`@EnableCaching` + `@Cacheable`/`@CachePut`/`@CacheEvict` through a
proxy, backed by Caffeine (local) or Redis (distributed). Traps:
self-invocation, caching mutable objects, missing TTL/size limits
(memory leak), stale data across instances with local caches, cache
stampede (use `sync=true` or request coalescing), and key design
(`key = "#id"`). Always ask "what is the invalidation strategy?"


#### Key terms you should know

- **proxy**  -  An object that wraps another object and intercepts method
  calls, commonly used by Spring for transactions, security and AOP.


#### 30-second version

> `@EnableCaching` + `@Cacheable`/`@CachePut`/`@CacheEvict` through a
> proxy, backed by Caffeine (local) or Redis (distributed). Traps:
> self-invocation, caching mutable objects, missing TTL/size limits
> (memory leak), stale data across instances with local caches, cache
> stampede (use `sync=true` or request coalescing), and key design
> (`key = "#id"`).

#### Q16. How do you test a Spring Boot application?

**Strong answer:**

Pyramid: plain JUnit 5 + Mockito for domain logic (fast, no Spring);
slice tests (`@WebMvcTest` with `MockMvc`, `@DataJpaTest`) for one
layer; `@SpringBootTest` sparingly for wiring; **Testcontainers** for
real PostgreSQL/Kafka instead of H2 (dialect differences hide bugs);
WireMock for HTTP dependencies; contract tests between services. Keep
the context cache hot by minimising `@MockBean`/`@DirtiesContext`.


#### 30-second version

> Pyramid: plain JUnit 5 + Mockito for domain logic (fast, no Spring);
> slice tests (`@WebMvcTest` with `MockMvc`, `@DataJpaTest`) for one
> layer; `@SpringBootTest` sparingly for wiring; **Testcontainers** for
> real PostgreSQL/Kafka instead of H2 (dialect differences hide bugs);
> WireMock for HTTP dependencies; contract tests between services. Keep
> the context cache hot by minimising `@MockBean`/`@DirtiesContext`.

#### Q17. Design a good REST API. What do you check?

**Strong answer:**

Resource-oriented nouns, correct verbs/status codes (201 + `Location`,
204, 400 vs 422, 409 conflict), idempotent `PUT`/`DELETE`,
`Idempotency-Key` for `POST` payments, pagination (cursor over offset
for large sets), filtering, versioning, consistent error format
(`ProblemDetail`), validation (`@Valid`), HATEOAS only if justified,
OpenAPI docs, rate limiting, and authentication/authorisation on every
endpoint. Never expose entities directly; use DTOs.


#### Key terms you should know

- **idempotency**  -  The property that repeating the same logical request
  produces the same intended outcome rather than creating duplicate
  effects.


#### 30-second version

> Resource-oriented nouns, correct verbs/status codes (201 + `Location`,
> 204, 400 vs 422, 409 conflict), idempotent `PUT`/`DELETE`,
> `Idempotency-Key` for `POST` payments, pagination (cursor over offset
> for large sets), filtering, versioning, consistent error format
> (`ProblemDetail`), validation (`@Valid`), HATEOAS only if justified,
> OpenAPI docs, rate limiting, and authentication/authorisation on every
> endpoint. Never expose entities directly; use DTOs.

#### Q18. What happens when a request hits a Spring MVC app?

**Strong answer:**

Servlet container (Tomcat) → filter chain (Security, etc.) →
`DispatcherServlet` → `HandlerMapping` finds the controller method →
`HandlerInterceptor.preHandle` → argument
resolvers/`HttpMessageConverter` (Jackson) bind the body → controller
runs → return value handler/converter serialises → interceptors
`postHandle`/`afterCompletion` → exceptions go to
`HandlerExceptionResolver` (`@ExceptionHandler`). Knowing filter vs
interceptor distinction is a common probe.


#### 30-second version

> Servlet container (Tomcat) → filter chain (Security, etc.) →
> `DispatcherServlet` → `HandlerMapping` finds the controller method →
> `HandlerInterceptor.preHandle` → argument
> resolvers/`HttpMessageConverter` (Jackson) bind the body → controller
> runs → return value handler/converter serialises → interceptors
> `postHandle`/`afterCompletion` → exceptions go to
> `HandlerExceptionResolver` (`@ExceptionHandler`). Knowing filter vs
> interceptor distinction is a common probe.

#### Q19. How do you handle graceful shutdown and zero-downtime deploys?

**Strong answer:**

`server.shutdown=graceful` with
`spring.lifecycle.timeout-per-shutdown-phase`; readiness probe flips to
"out of service" so the load balancer stops routing; in-flight requests
finish; consumers stop polling and commit offsets; the Kubernetes
`terminationGracePeriodSeconds` exceeds the app timeout and a `preStop`
sleep covers endpoint propagation lag. Pair with rolling updates
(`maxUnavailable: 0`) and backward-compatible DB migrations (expand →
migrate → contract).


#### Key terms you should know

- **Shutdown phase**  -  A stage of Spring lifecycle shutdown with its own
  configured timeout; distinct from a Maven build phase.
- **readiness probe**  -  A Kubernetes health check used to decide whether
  a Pod should receive traffic.
- **Service**  -  An application or platform capability exposed through a
  defined interface; a Kubernetes Service is a specific networking resource.


#### 30-second version

> `server.shutdown=graceful` with
> `spring.lifecycle.timeout-per-shutdown-phase`; readiness probe flips
> to "out of service" so the load balancer stops routing; in-flight
> requests finish; consumers stop polling and commit offsets; the
> Kubernetes `terminationGracePeriodSeconds` exceeds the app timeout and
> a `preStop` sleep covers endpoint propagation lag. Pair with rolling
> updates (`maxUnavailable: 0`) and backward-compatible DB migrations
> (expand → migrate → contract).

---

### C. Hibernate / JPA

#### Q20. Compare JPA inheritance strategies.

**Strong answer:**

`SINGLE_TABLE`: one table + discriminator, fastest queries, but nullable
columns and weak constraints. `JOINED`: normalised table per class,
clean schema, joins on every polymorphic query. `TABLE_PER_CLASS`: no
joins for concrete reads but UNION-heavy polymorphic queries; rarely
recommended. `@MappedSuperclass` shares fields without polymorphism.
Default to SINGLE_TABLE for small hierarchies, JOINED when integrity
matters.


#### 30-second version

> `SINGLE_TABLE`: one table + discriminator, fastest queries, but
> nullable columns and weak constraints. `JOINED`: normalised table per
> class, clean schema, joins on every polymorphic query.

#### Q21. Explain cascade types and `orphanRemoval`.

**Strong answer:**

`CascadeType` propagates operations (PERSIST, MERGE, REMOVE, REFRESH,
DETACH) from parent to child; `ALL` combines them. `orphanRemoval=true`
deletes a child when it is removed from the parent's collection. Use
only on true aggregate ownership (Order → OrderLine); never cascade
REMOVE on shared references like `@ManyToOne` to a lookup. Keep both
sides of bidirectional associations in sync with helper
`addItem/removeItem` methods; the owning side (the one with
`@JoinColumn`) writes the FK.


#### 30-second version

> `CascadeType` propagates operations (PERSIST, MERGE, REMOVE, REFRESH,
> DETACH) from parent to child; `ALL` combines them.
> `orphanRemoval=true` deletes a child when it is removed from the
> parent's collection.

#### Q22. Why does offset pagination degrade and what's the alternative?

**Strong answer:**

`OFFSET n` forces the DB to scan and discard n rows, so deep pages get
slow and unstable under concurrent inserts. **Keyset (seek) pagination**
uses
`WHERE (created_at, id) < (:lastCreatedAt, :lastId) ORDER BY created_at DESC, id DESC LIMIT :size`
with a matching composite index: avoids work proportional to the skipped
offset. With a suitable index, seek plus retrieval is approximately
O(log n + page size); changing sort keys can still move rows between
pages. Spring Data's `Window`/`ScrollPosition` (3.1+) supports it.


#### 30-second version

> `OFFSET n` forces the DB to scan and discard n rows, so deep pages get
> slow and unstable under concurrent inserts. **Keyset (seek)
> pagination** uses
> `WHERE (created_at, id) < (:lastCreatedAt, :lastId) ORDER BY created_at DESC, id DESC LIMIT :size`
> with a matching composite index: avoids work proportional to the
> skipped offset.

#### Q23. `save()` vs `saveAndFlush()` vs `flush()`, and how does `merge` vs `persist` differ?

**Strong answer:**

`persist` makes a *new* transient entity managed (void; ID assigned per
generator). `merge` copies the detached state onto a managed instance
and returns that instance; the argument stays detached. `save()` calls
`persist` if `isNew()` (null ID/version) otherwise `merge`, which may
trigger an extra SELECT for assigned IDs. `flush` only syncs the context
to the DB; it doesn't commit. Dirty checking means managed entities are
updated without calling `save`.


#### Key terms you should know

- **dirty checking**  -  Hibernate/JPA's mechanism for detecting changes
  to managed entities and generating updates during flush.


#### 30-second version

> `persist` makes a *new* transient entity managed (void; ID assigned
> per generator). `merge` copies the detached state onto a managed
> instance and returns that instance; the argument stays detached.

#### Q24. How do you do bulk updates safely?

**Strong answer:**

Bulk JPQL/native updates bypass normal entity dirty checking and can
leave managed entities stale; automatic optimistic-version handling is
not guaranteed. Flush pending changes before executing the bulk
statement where required, then clear or refresh affected state. With
Spring Data, consider both `flushAutomatically=true` and
`clearAutomatically=true`; clearing alone can discard pending in-memory
work. Preserve tenant filters, version predicates and row-count checks
explicitly. For imports, use chunked transactions and bounded
persistence contexts.


#### Key terms you should know

- **dirty checking**  -  Hibernate/JPA's mechanism for detecting changes
  to managed entities and generating updates during flush.


#### 30-second version

> Bulk JPQL/native updates bypass normal entity dirty checking and can
> leave managed entities stale; automatic optimistic-version handling is
> not guaranteed. Flush pending changes before executing the bulk
> statement where required, then clear or refresh affected state.

#### Q25. What isolation levels exist and which anomalies do they prevent?

**Strong answer:**

READ UNCOMMITTED (dirty reads), READ COMMITTED (default in
PostgreSQL/Oracle: prevents dirty reads, allows non-repeatable reads),
REPEATABLE READ (MySQL default; prevents non-repeatable, phantoms
depending on DB), SERIALIZABLE (prevents all, at throughput cost). Pick
the weakest level that keeps invariants correct and use optimistic
locking or `SELECT FOR UPDATE` for specific hot rows; Spring's
`@Transactional(isolation=...)` only requests it from the DB.


#### Key terms you should know

- **Isolation level**  -  A database contract governing which effects concurrent transactions can observe.
- **Optimistic locking**  -  Detecting conflicting updates, often with a version predicate; the eventual database write still acquires locks.
- **Serializable**  -  An isolation guarantee equivalent to some serial ordering of committed transactions.


#### 30-second version

> READ UNCOMMITTED (dirty reads), READ COMMITTED (default in
> PostgreSQL/Oracle: prevents dirty reads, allows non-repeatable reads),
> REPEATABLE READ (MySQL default; prevents non-repeatable, phantoms
> depending on DB), SERIALIZABLE (prevents all, at throughput cost).
> Pick the weakest level that keeps invariants correct and use
> optimistic locking or `SELECT FOR UPDATE` for specific hot rows;
> Spring's `@Transactional(isolation=...)` only requests it from the DB.

---

### D. Microservices & Distributed Systems

#### Q26. API Gateway vs service mesh: what is the difference?

**Strong answer:**

A gateway (Spring Cloud Gateway, Apigee, Cloud Endpoints) sits at the
**edge** for north-south traffic: routing, authentication, rate
limiting, TLS, request aggregation. A mesh (Istio/Anthos Service Mesh)
manages **east-west** service-to-service traffic through sidecars: mTLS,
retries, timeouts, traffic shifting, telemetry, without code changes.
Use both; avoid putting business logic in the gateway.


#### Key terms you should know

- **Service**  -  An application or platform capability exposed through a
  defined interface; a Kubernetes Service is a specific networking resource.


#### 30-second version

> A gateway (Spring Cloud Gateway, Apigee, Cloud Endpoints) sits at the
> **edge** for north-south traffic: routing, authentication, rate
> limiting, TLS, request aggregation. A mesh (Istio/Anthos Service Mesh)
> manages **east-west** service-to-service traffic through sidecars:
> mTLS, retries, timeouts, traffic shifting, telemetry, without code
> changes.

#### Q27. Explain CQRS and Event Sourcing, and when not to use them.

**Strong answer:**

CQRS separates the write model (validates commands, enforces invariants)
from read models (denormalised projections optimised for queries), which can share a transactional store; event-driven projections in separate stores are optional and can be eventually consistent. Event Sourcing
stores the *sequence of events* as the source of truth, enabling audit,
replay and temporal queries, but adds complexity: schema evolution of
events, snapshots, rebuild time, and a steep learning curve. Use for
complex domains with audit/read-scale needs, not CRUD apps.


#### 30-second version

> CQRS separates the write model (validates commands, enforces
> invariants) from read models (denormalised projections optimised for
> queries), which can share a transactional store; event-driven projections in separate stores are optional and can be eventually consistent.
> Event Sourcing stores the *sequence of events* as the source of truth,
> enabling audit, replay and temporal queries, but adds complexity:
> schema evolution of events, snapshots, rebuild time, and a steep
> learning curve.

#### Q28. How do you choose between Kafka and Pub/Sub (or RabbitMQ)?

**Strong answer:**

Kafka: a distributed log with partition-based ordering, consumer groups,
long retention, replay and very high throughput; you manage
partitions/rebalancing (or use managed). Pub/Sub: fully managed, global,
auto-scaling, per-message ack, no partition management, ordering keys
optional, replay via seek/retention; less control. RabbitMQ: smart
broker, routing flexibility, low-latency task queues. Explain
partition-key choice (ordering per key, hot partitions), DLQs, and
idempotent consumers.


#### Key terms you should know

- **Pub/Sub**  -  Google Cloud's asynchronous messaging service for
  publishing messages to topics and delivering them to subscriptions.


#### 30-second version

> Kafka: a distributed log with partition-based ordering, consumer
> groups, long retention, replay and very high throughput; you manage
> partitions/rebalancing (or use managed). Pub/Sub: fully managed,
> global, auto-scaling, per-message ack, no partition management,
> ordering keys optional, replay via seek/retention; less control.

#### Q29. How do you deploy safely: rolling, blue-green, canary?

**Strong answer:**

Rolling replaces instances gradually (cheap, mixed versions coexist, so
API/DB must be backward compatible). Blue-green runs two full
environments and switches traffic instantly (fast rollback, double
cost). Canary routes a small percentage to the new version while
watching SLOs, then ramps up (best risk control; needs good metrics).
Feature flags decouple deploy from release. On GKE use Cloud Deploy/Argo
Rollouts; on Cloud Run use traffic splitting by revision.


#### Key terms you should know

- **Cloud Run**  -  GCP's managed container execution platform where the
  platform handles servers and scales container instances.
- **GKE**  -  Google Kubernetes Engine, Google's managed Kubernetes
  service.


#### 30-second version

> Rolling replaces instances gradually (cheap, mixed versions coexist,
> so API/DB must be backward compatible). Blue-green runs two full
> environments and switches traffic instantly (fast rollback, double
> cost).

#### Q30. A downstream service is slow and your service is falling over. What do you do?

**Strong answer:**

Immediately: check dashboards (RED metrics), identify saturation, apply
a circuit breaker/fallback and shed load. Root causes of cascading
failure: missing timeouts, unbounded threads/queues, retry storms,
shared connection pools. Fixes: tight timeouts (below the caller's),
bulkheads per dependency, bounded pools, retries with backoff + jitter
and a retry budget, caching, async decoupling via queue, autoscaling
with sensible limits, and a post-mortem with action items. This is the
"tell me about an outage" answer; use a real story.


#### 30-second version

> Immediately: check dashboards (RED metrics), identify saturation,
> apply a circuit breaker/fallback and shed load. Root causes of
> cascading failure: missing timeouts, unbounded threads/queues, retry
> storms, shared connection pools.

---

### Self-Assessment

After each answer, ask: *Did I give a trade-off? A pitfall? An example
from my own project?* If not, the answer is junior-level.

---

<!-- ===== Part 3: Question Bank Vol. 2 (Kafka, Security, Maven, GCP, Kubernetes) ===== -->

<a id="senior-java-question-bank-vol-2"></a>
<a id="part-3"></a>
## Part 03 - Question Bank Vol. 2 - Kafka, security, Maven, GCP and Kubernetes

**Kafka · Spring Security · Maven · GCP · Docker/Kubernetes** (Q31-Q58)
Answer shape: **what it is → how it works → trade-off → pitfall → your
experience.**

---

### E. Kafka & Messaging

#### Q31. Explain Kafka's architecture and how consumer groups scale.

**Strong answer:**

A topic is split into partitions, each an append-only, ordered log
replicated across brokers (one leader, N-1 followers). Producers write
to a partition chosen by key hash; consumers in a **group** divide
partitions so each partition is read by exactly one member of the group,
which gives parallelism up to the partition count. Extra consumers sit
idle, so partition count is your scaling ceiling and is hard to reduce
later. Different groups read independently, which enables pub/sub with
replay. Offsets live in `__consumer_offsets`.


#### Key terms you should know

- **Pub/Sub**  -  Google Cloud's asynchronous messaging service for
  publishing messages to topics and delivering them to subscriptions.


#### 30-second version

> A topic is split into partitions, each an append-only, ordered log
> replicated across brokers (one leader, N-1 followers). Producers write
> to a partition chosen by key hash; consumers in a **group** divide
> partitions so each partition is read by exactly one member of the
> group, which gives parallelism up to the partition count.

#### Q32. How do you get "exactly-once" with Kafka?

**Strong answer:**

Say honestly: end-to-end exactly-once needs cooperation. Producer
idempotence prevents duplicate log entries from supported retries;
`acks=all` and the topic/broker `min.insync.replicas` setting define
acknowledgement and availability trade-offs. They do not promise zero
loss under every failure. Kafka transactions (`transactional.id`)
atomically write to multiple partitions and commit consumer offsets
(consume-transform-produce within Kafka, with consumers using
`isolation.level=read_committed`). Once a side effect leaves Kafka (DB,
REST), you need an idempotent consumer: dedupe by event ID in a
unique-constrained table, or the transactional outbox. Default design
target: at-least-once + idempotency.


#### Key terms you should know

- **idempotency**  -  The property that repeating the same logical request
  produces the same intended outcome rather than creating duplicate
  effects.
- **outbox**  -  A database table used to store events in the same
  transaction as business data so publication can happen reliably
  afterward.


#### 30-second version

> Say honestly: end-to-end exactly-once needs cooperation. Producer
> idempotence prevents duplicate log entries from supported retries;
> `acks=all` and the topic/broker `min.insync.replicas` setting define
> acknowledgement and availability trade-offs.

#### Q33. What causes consumer rebalances and how do you reduce their impact?

**Strong answer:**

Triggers: member joins/leaves, crash, missed heartbeat
(`session.timeout.ms`), or processing longer than
`max.poll.interval.ms`, which is the usual culprit. Effects:
stop-the-world pauses and duplicate processing. Mitigation: smaller
`max.poll.records`, move slow work off the poll thread carefully,
cooperative sticky assignor (incremental rebalance), static membership
(`group.instance.id`) for rolling deploys, and graceful shutdown that
commits offsets.


#### 30-second version

> Triggers: member joins/leaves, crash, missed heartbeat
> (`session.timeout.ms`), or processing longer than
> `max.poll.interval.ms`, which is the usual culprit. Effects:
> stop-the-world pauses and duplicate processing.

#### Q34. Auto-commit vs manual commit?

**Strong answer:**

Auto-commit can acknowledge records before they are processed (loss on
crash) or reprocess after a crash (duplicates). With Spring Kafka I use
`AckMode.RECORD`/`MANUAL_IMMEDIATE`, commit only after the DB
transaction succeeds, and make handlers idempotent. Commit after
processing = at-least-once; commit before = at-most-once.


#### Key terms you should know

- **transaction**  -  A unit of database work treated as one logical
  operation with defined commit/rollback behavior.


#### 30-second version

> Auto-commit can acknowledge records before they are processed (loss on
> crash) or reprocess after a crash (duplicates). With Spring Kafka I
> use `AckMode.RECORD`/`MANUAL_IMMEDIATE`, commit only after the DB
> transaction succeeds, and make handlers idempotent.

#### Q35. How do you handle poison messages and retries?

**Strong answer:**

Distinguish transient (retry) from permanent (deserialisation,
validation) failures. Spring Kafka `DefaultErrorHandler` with
`ExponentialBackOff`, non-retryable exception classification, and
`DeadLetterPublishingRecoverer` to a DLT carrying headers (original
topic, exception, offset). For ordering-insensitive flows use
non-blocking retry topics (`@RetryableTopic`) so one bad record doesn't
block a partition. Alert on DLT depth and provide a replay tool. Use
`ErrorHandlingDeserializer` so bad bytes don't crash-loop the consumer.


#### 30-second version

> Distinguish transient (retry) from permanent (deserialisation,
> validation) failures. Spring Kafka `DefaultErrorHandler` with
> `ExponentialBackOff`, non-retryable exception classification, and
> `DeadLetterPublishingRecoverer` to a DLT carrying headers (original
> topic, exception, offset).

#### Q36. How do you guarantee ordering and avoid hot partitions?

**Strong answer:**

Kafka orders only **within a partition**, so choose a key whose events
must be ordered (e.g., `orderId`, `accountId`). A single hot key remains
on one partition after adding partitions. Split/salt keys only if the
ordering contract allows it; partition-count changes also require an
ordering and key-migration plan. With retries, set
`max.in.flight.requests.per.connection ≤ 5` with idempotence to retain
order. Schema evolution via Avro/Protobuf + Schema Registry with
backward-compatible rules.


#### 30-second version

> Kafka orders only **within a partition**, so choose a key whose events
> must be ordered (e.g., `orderId`, `accountId`). A single hot key
> remains on one partition after adding partitions.

---

### F. Spring Security & OAuth2

#### Q37. Walk through the Spring Security filter chain.

**Strong answer:**

`DelegatingFilterProxy` → `FilterChainProxy` → a `SecurityFilterChain`
matched by request. Key filters: `SecurityContextHolderFilter`,
`CorsFilter`, `CsrfFilter`, authentication filters
(`UsernamePasswordAuthenticationFilter`,
`BearerTokenAuthenticationFilter`), `ExceptionTranslationFilter`, and
`AuthorizationFilter` last. An `AuthenticationManager` delegates to
`AuthenticationProvider`s that produce an `Authentication` stored in the
`SecurityContext` (thread-bound, so propagate to async threads
deliberately). Configure with one or more `SecurityFilterChain` beans
using lambda DSL.


#### 30-second version

> `DelegatingFilterProxy` → `FilterChainProxy` → a `SecurityFilterChain`
> matched by request. Key filters: `SecurityContextHolderFilter`,
> `CorsFilter`, `CsrfFilter`, authentication filters
> (`UsernamePasswordAuthenticationFilter`,
> `BearerTokenAuthenticationFilter`), `ExceptionTranslationFilter`, and
> `AuthorizationFilter` last.

#### Q38. Explain OAuth2/OIDC flows and when to use each.

**Strong answer:**

**Authorization Code + PKCE** for user login (web, SPA, mobile); the
PKCE verifier protects the code from interception. **Client
Credentials** for service-to-service. **Refresh token** to renew
short-lived access tokens. Implicit and Password grants are deprecated.
OAuth2 delegates *authorisation*; OIDC adds an ID token (JWT) for
*authentication*. In Spring, services are **resource servers** (validate
tokens) and BFF/web apps are **clients**; the IdP (Keycloak, Okta,
Google Identity Platform) is the authorisation server.


#### Key terms you should know

- **Service**  -  An application or platform capability exposed through a
  defined interface; a Kubernetes Service is a specific networking resource.


#### 30-second version

> **Authorization Code + PKCE** for user login (web, SPA, mobile); the
> PKCE verifier protects the code from interception. **Client
> Credentials** for service-to-service.

#### Q39. JWT vs opaque tokens: how do you revoke a JWT?

**Strong answer:** a signed JWT can be validated locally, but a validator checking only signature and time claims cannot learn about a per-token revocation before expiry. Revocation requires additional state or policy: for example a jti denylist, session/token version check or an introspected opaque token. Key retirement has a broad blast radius and depends on verifier cache/refresh behavior. Short lifetimes limit exposure; they do not themselves revoke a token.

Validate the allowed algorithm, signature, issuer, intended audience and applicable time claims such as exp and nbf. An ordinary signed JWT payload is readable, so omit secrets. Encrypting a JWT is a separate protocol choice. Refresh-token rotation needs reuse detection and server-side invalidation of the relevant token family.

#### Q40. CORS vs CSRF: what are they and how do you configure them?

**Strong answer:**

CORS controls whether browser JavaScript can access cross-origin
responses. Configure allowed origins, methods and headers through a
`CorsConfigurationSource`; do not use a wildcard origin with credentials.
CSRF exploits credentials the browser sends automatically, such as
session cookies or cached HTTP Basic credentials. CORS is not a substitute
for CSRF protection, and stateless authentication alone does not remove
CSRF risk.

Keep CSRF protection for endpoints that accept ambient browser credentials.
Disabling it can be appropriate for an API that accepts only bearer tokens
explicitly attached by the client in the `Authorization` header, with no
cookie, Basic or other ambient-authentication fallback. Check every enabled
authentication mechanism and endpoint; a JWT stored in a cookie still
needs a CSRF strategy.

#### How to understand it

Ask whether another site can cause the browser to attach credentials
without your application's JavaScript choosing to do so. The presence of
an Authorization header does not answer that question: bearer tokens
attached by application code and browser-managed Basic credentials behave
differently.

#### Key terms you should know

- **CORS**  -  Browser-enforced rules for cross-origin response access.
- **CSRF**  -  Forging authenticated requests using ambient credentials.
- **Ambient credentials**  -  Credentials automatically attached by the browser.

#### SDE-3 interview checkpoints

- Inventory cookies, Basic authentication and bearer-token handling.
- Test cross-site state-changing requests and CSRF-token rejection.
- Review mixed browser/API endpoints before disabling protection.

#### 30-second version

> CORS and CSRF solve different problems. Keep CSRF protection when the browser
> sends credentials automatically, including cookies and Basic authentication.
> Disable it only after verifying that the relevant API accepts exclusively
> explicit bearer credentials without an ambient-authentication fallback.

[Spring Security CSRF reference](https://docs.spring.io/spring-security/reference/features/exploits/csrf.html).

#### Q41. How do you store passwords and secure service-to-service calls?

**Strong answer:**

Use adaptive, salted hashes: `DelegatingPasswordEncoder` with
BCrypt/Argon2 (work factor tuned to ~250 ms), never SHA/MD5 alone.
Service-to-service: mTLS (mesh) or OAuth2 client credentials; on GCP use
service-account identity tokens (OIDC) verified by the receiver. Apply
least privilege, rotate secrets, scan dependencies (OWASP
Dependency-Check/Dependabot), and validate input to prevent injection.


#### Key terms you should know

- **OWASP**  -  An organization that publishes widely used
  application-security guidance, including the OWASP Top 10.
- **Service**  -  An application or platform capability exposed through a
  defined interface; a Kubernetes Service is a specific networking resource.


#### 30-second version

> Use adaptive, salted hashes: `DelegatingPasswordEncoder` with
> BCrypt/Argon2 (work factor tuned to ~250 ms), never SHA/MD5 alone.
> Service-to-service: mTLS (mesh) or OAuth2 client credentials; on GCP
> use service-account identity tokens (OIDC) verified by the receiver.

#### Q42. `@PreAuthorize` vs URL-based authorisation?

**Strong answer:**

URL rules (`requestMatchers("/admin/**").hasRole(...)`) give coarse
perimeter control; method security (`@EnableMethodSecurity`,
`@PreAuthorize("hasAuthority('ORDER_READ') and #userId == authentication.name")`)
enforces fine-grained, domain-aware rules close to the business logic
and works for non-HTTP entry points (messaging). Use both (defence in
depth); method security relies on proxies, so self-invocation bypasses
it.


#### 30-second version

> URL rules (`requestMatchers("/admin/**").hasRole(...)`) give coarse
> perimeter control; method security (`@EnableMethodSecurity`,
> `@PreAuthorize("hasAuthority('ORDER_READ') and #userId == authentication.name")`)
> enforces fine-grained, domain-aware rules close to the business logic
> and works for non-HTTP entry points (messaging). Use both (defence in
> depth); method security relies on proxies, so self-invocation bypasses
> it.

---

### G. Maven & Build

#### Q43. How does Maven resolve conflicting dependency versions?

**Strong answer:**

"Nearest definition wins" (shallowest in the tree), ties broken by first
declaration. This can silently select an old, vulnerable version.
Control it with `<dependencyManagement>` or importing a **BOM**
(`spring-boot-dependencies`, `libraries-bom` for GCP), `<exclusions>`,
and the `maven-enforcer-plugin` (`dependencyConvergence`,
`banDuplicatePomDependencyVersions`). Diagnose with
`mvn dependency:tree -Dverbose -Dincludes=group:artifact`.


#### Key terms you should know

- **BOM**  -  Bill of Materials: a dependency-management document that
  centralizes compatible library versions.
- **plugin**  -  A Maven component that provides build functionality such
  as compilation, testing or packaging.


#### 30-second version

> "Nearest definition wins" (shallowest in the tree), ties broken by
> first declaration. This can silently select an old, vulnerable
> version.

#### Q44. How do you structure a multi-module project?

**Strong answer:**

A parent POM (packaging `pom`) holds `dependencyManagement`,
`pluginManagement` and properties; `<modules>` aggregates children
(e.g., `api`, `domain`, `service`, `app`). Keep module dependencies
acyclic and one-directional; use a "bom" or "platform" module for shared
versions. Build selectively with `-pl :service -am`, in parallel with
`-T 1C`. Avoid shared "utils" dumping grounds that couple microservices
(share contracts, not code).


#### Key terms you should know

- **BOM**  -  Bill of Materials: a dependency-management document that
  centralizes compatible library versions.
- **Service**  -  An application or platform capability exposed through a
  defined interface; a Kubernetes Service is a specific networking resource.


#### 30-second version

> A parent POM (packaging `pom`) holds `dependencyManagement`,
> `pluginManagement` and properties; `<modules>` aggregates children
> (e.g., `api`, `domain`, `service`, `app`). Keep module dependencies
> acyclic and one-directional; use a "bom" or "platform" module for
> shared versions.

#### Q45. Profiles, plugins and what belongs where?

**Strong answer:**

Profiles activate per environment/OS/property (`-Pci`) to vary plugins
or dependencies, but avoid using them for runtime configuration (that
belongs to Spring profiles/env vars), because they create
non-reproducible builds. Plugin execution is bound to lifecycle phases
via `<executions>`; know `compiler`, `surefire`, `failsafe`, `jacoco`,
`spring-boot-maven-plugin` (repackage/build-image), `jib`, `versions`,
and `enforcer`.


#### Key terms you should know

- **plugin**  -  A Maven component that provides build functionality such
  as compilation, testing or packaging.


#### 30-second version

> Profiles activate per environment/OS/property (`-Pci`) to vary plugins
> or dependencies, but avoid using them for runtime configuration (that
> belongs to Spring profiles/env vars), because they create
> non-reproducible builds. Plugin execution is bound to lifecycle phases
> via `<executions>`; know `compiler`, `surefire`, `failsafe`, `jacoco`,
> `spring-boot-maven-plugin` (repackage/build-image), `jib`, `versions`,
> and `enforcer`.

#### Q46. How do you make builds fast, reproducible and secure?

**Strong answer:**

Use the Maven wrapper (`mvnw`), pin plugin and dependency versions, set
`project.build.outputTimestamp` for reproducible jars, cache `~/.m2` in
CI, build with `-T`, skip nothing in CI (no `-DskipTests`). Pull
artifacts through an internal repository manager (Artifact
Registry/Nexus) configured in `settings.xml` mirrors with credentials
from CI secrets; sign and scan artifacts, generate an SBOM (CycloneDX),
and fail on critical CVEs.


#### Key terms you should know

- **plugin**  -  A Maven component that provides build functionality such
  as compilation, testing or packaging.


#### 30-second version

> Use the Maven wrapper (`mvnw`), pin plugin and dependency versions,
> set `project.build.outputTimestamp` for reproducible jars, cache
> `~/.m2` in CI, build with `-T`, skip nothing in CI (no `-DskipTests`).
> Pull artifacts through an internal repository manager (Artifact
> Registry/Nexus) configured in `settings.xml` mirrors with credentials
> from CI secrets; sign and scan artifacts, generate an SBOM
> (CycloneDX), and fail on critical CVEs.

---

### H. Google Cloud Platform

#### Q47. Cloud Run vs GKE vs App Engine vs Compute Engine: how do you decide?

**Strong answer:**

Cloud Run offers several execution models, including services, jobs and
worker pools; choose the appropriate model before comparing it with GKE.
Prefer GKE when Kubernetes-level control or an existing platform
justifies its operational cost. Consider Compute Engine for VM
requirements and App Engine when its runtime model fits an existing
application. Avoid deciding solely from labels such as “stateless” or
“background worker.” [Cloud Run
overview](https://docs.cloud.google.com/run/docs/overview/what-is-cloud-run).


#### Key terms you should know

- **Cloud Run**  -  GCP's managed container execution platform where the
  platform handles servers and scales container instances.
- **GKE**  -  Google Kubernetes Engine, Google's managed Kubernetes
  service.


#### 30-second version

> Cloud Run offers several execution models, including services, jobs
> and worker pools; choose the appropriate model before comparing it
> with GKE. Prefer GKE when Kubernetes-level control or an existing
> platform justifies its operational cost.

#### Q48. Explain Pub/Sub delivery, acknowledgements and ordering.

**Strong answer:**

Publishers send to a topic; subscriptions (pull, push or streaming-pull)
get **at-least-once** delivery. If not acked within the ack deadline
(extendable), the message is redelivered, so handlers must be
idempotent. Configure retry policy with backoff and a **dead-letter
topic** (`maxDeliveryAttempts`). Ordering keys give per-key order
(single-region effect). Exactly-once delivery is available on pull
subscriptions in a region but you still need idempotent side effects.
Use Spring Cloud GCP's `PubSubTemplate`/message channel adapters.


#### 30-second version

> Publishers send to a topic; subscriptions (pull, push or
> streaming-pull) get **at-least-once** delivery. If not acked within
> the ack deadline (extendable), the message is redelivered, so handlers
> must be idempotent.

#### Q49. How do you run Cloud SQL reliably from Spring Boot?

**Strong answer:**

Enable **HA** (regional, automatic failover), automated backups + PITR,
read replicas for read scaling (route read-only transactions
explicitly), private IP via VPC, and connect through the **Cloud SQL
Java Connector** or Auth Proxy (IAM auth, TLS). Size HikariCP carefully
(`pool × instances` ≤ DB `max_connections`), set `maxLifetime` below
DB/proxy timeouts, and use PgBouncer/connection pooling for Cloud Run
bursts.


#### Key terms you should know

- **Cloud Run**  -  GCP's managed container execution platform where the
  platform handles servers and scales container instances.
- **IAM**  -  Identity and Access Management: policies controlling who or
  what can perform which actions on which resources.
- **proxy**  -  An object that wraps another object and intercepts method
  calls, commonly used by Spring for transactions, security and AOP.


#### 30-second version

> Enable **HA** (regional, automatic failover), automated backups +
> PITR, read replicas for read scaling (route read-only transactions
> explicitly), private IP via VPC, and connect through the **Cloud SQL
> Java Connector** or Auth Proxy (IAM auth, TLS). Size HikariCP
> carefully (`pool × instances` ≤ DB `max_connections`), set
> `maxLifetime` below DB/proxy timeouts, and use PgBouncer/connection
> pooling for Cloud Run bursts.

#### Q50. When would you choose Spanner or Bigtable over Cloud SQL?

**Strong answer:** use Spanner when relational transactions and horizontal or geographic scale justify its cost and data-model constraints. Design keys and indexes to avoid hot ranges; availability commitments depend on the selected edition and instance configuration. Bigtable fits very large key-oriented workloads with atomicity scoped to a single row, rather than general cross-row relational transactions. Cloud SQL often fits regional relational workloads; there is no universal few-terabyte or QPS cutoff.

Compare required transactions, latency, regional placement, recovery, query shapes and measured cost. Verify current product limits and SLAs for the chosen configuration instead of quoting one number for the whole product.

#### Q51. Explain IAM, service accounts and Workload Identity.

**Strong answer:**

IAM grants **roles** (collections of permissions) to **principals** at
org/folder/project/resource scope with inheritance. Workloads run as
service accounts; avoid exported JSON keys; on GKE, **Workload Identity
Federation** maps a Kubernetes SA to a Google SA, and on Cloud Run
attach a dedicated runtime SA per service. Apply least privilege with
predefined/custom roles, deny policies and org-policy constraints, audit
through Cloud Audit Logs.


#### Key terms you should know

- **Cloud Run**  -  GCP's managed container execution platform where the
  platform handles servers and scales container instances.
- **GKE**  -  Google Kubernetes Engine, Google's managed Kubernetes
  service.
- **IAM**  -  Identity and Access Management: policies controlling who or
  what can perform which actions on which resources.
- **Service**  -  An application or platform capability exposed through a
  defined interface; a Kubernetes Service is a specific networking resource.
- **Workload Identity**  -  A mechanism that lets workloads obtain cloud
  identities without embedding long-lived service-account keys.


#### 30-second version

> IAM grants **roles** (collections of permissions) to **principals** at
> org/folder/project/resource scope with inheritance. Workloads run as
> service accounts; avoid exported JSON keys; on GKE, **Workload
> Identity Federation** maps a Kubernetes SA to a Google SA, and on
> Cloud Run attach a dedicated runtime SA per service.

#### Q52. Describe a secure GCP network and edge design.

**Strong answer:**

Global external Application Load Balancer + **Cloud Armor** (WAF, DDoS,
rate limits) + managed certificates → services in a VPC with **private
IPs**; Private Google Access / Private Service Connect for managed
services; Serverless VPC Access or Direct VPC egress for Cloud Run;
Cloud NAT for outbound; firewall rules by tags/service accounts; VPC
Service Controls for data-exfiltration perimeters; IAP for internal
tools.


#### Key terms you should know

- **Cloud Run**  -  GCP's managed container execution platform where the
  platform handles servers and scales container instances.
- **VPC Service Controls**  -  Google Cloud controls that constrain access
  to supported managed services using service perimeters.


#### 30-second version

> Global external Application Load Balancer + **Cloud Armor** (WAF,
> DDoS, rate limits) + managed certificates → services in a VPC with
> **private IPs**; Private Google Access / Private Service Connect for
> managed services; Serverless VPC Access or Direct VPC egress for Cloud
> Run; Cloud NAT for outbound; firewall rules by tags/service accounts;
> VPC Service Controls for data-exfiltration perimeters; IAP for
> internal tools.

#### Q53. How would you design CI/CD on GCP?

**Strong answer:**

Commit → **Cloud Build** trigger: `mvn verify` (unit + Testcontainers
integration), static analysis/SCA, build image with Jib/Buildpacks, push
to **Artifact Registry** with vulnerability scanning, attestations via
**Binary Authorization** → **Cloud Deploy** promotes dev → staging →
prod with approvals and canary, automated rollback on failed SLO checks.
Infrastructure via Terraform with remote state; GitOps (Config Sync/Argo
CD) is an alternative.


#### Key terms you should know

- **SLO**  -  Service Level Objective: a measurable reliability target,
  such as 99.9% successful requests.


#### 30-second version

> Commit → **Cloud Build** trigger: `mvn verify` (unit + Testcontainers
> integration), static analysis/SCA, build image with Jib/Buildpacks,
> push to **Artifact Registry** with vulnerability scanning,
> attestations via **Binary Authorization** → **Cloud Deploy** promotes
> dev → staging → prod with approvals and canary, automated rollback on
> failed SLO checks. Infrastructure via Terraform with remote state;
> GitOps (Config Sync/Argo CD) is an alternative.

#### Q54. How do you do observability and cost control on GCP?

**Strong answer:**

Structured JSON logs with `trace` fields (Cloud Logging correlates to
Cloud Trace), Micrometer → Managed Service for Prometheus/Cloud
Monitoring, OpenTelemetry tracing, **SLO monitoring** with burn-rate
alerts, error reporting. Cost: right-size requests/limits, committed-use
discounts, Spot VMs for batch, autoscaling, log exclusion/retention
policies, BigQuery partitioning/clustering, budgets + alerts, and labels
for cost attribution.


#### Key terms you should know

- **Service**  -  An application or platform capability exposed through a
  defined interface; a Kubernetes Service is a specific networking resource.
- **SLO**  -  Service Level Objective: a measurable reliability target,
  such as 99.9% successful requests.
- **trace**  -  A representation of one request's path through distributed
  services.


#### 30-second version

> Structured JSON logs with `trace` fields (Cloud Logging correlates to
> Cloud Trace), Micrometer → Managed Service for Prometheus/Cloud
> Monitoring, OpenTelemetry tracing, **SLO monitoring** with burn-rate
> alerts, error reporting. Cost: right-size requests/limits,
> committed-use discounts, Spot VMs for batch, autoscaling, log
> exclusion/retention policies, BigQuery partitioning/clustering,
> budgets + alerts, and labels for cost attribution.

---

### I. Docker & Kubernetes for Java

#### Q55. How do you build a production Docker image for Spring Boot?

**Strong answer:**

Multi-stage or Jib/Buildpacks; **layered jars**
(`java -Djarmode=tools extract --layers`) so dependencies cache
separately from app code; minimal/distroless JRE base, pinned
tags/digests, **non-root user**, read-only filesystem, no secrets in
layers, `.dockerignore`, vulnerability scanning, and exec-form
`ENTRYPOINT` so the JVM receives SIGTERM for graceful shutdown.


#### 30-second version

> Multi-stage or Jib/Buildpacks; **layered jars**
> (`java -Djarmode=tools extract --layers`) so dependencies cache
> separately from app code; minimal/distroless JRE base, pinned
> tags/digests, **non-root user**, read-only filesystem, no secrets in
> layers, `.dockerignore`, vulnerability scanning, and exec-form
> `ENTRYPOINT` so the JVM receives SIGTERM for graceful shutdown.

#### Q56. Why do Java containers get `OOMKilled`, and how do you tune the JVM?

**Strong answer:** container memory includes heap, metaspace, thread stacks, direct buffers, code cache and other native allocations. Setting Xmx equal to the container limit leaves no budget for these and risks an OOM kill; it does not guarantee an immediate kill because the heap may not all be committed or used.

Budget total process memory from measurements. Heap percentages such as 65-75% are starting hypotheses, not safe universal settings. Check cgroup limits, RSS, heap occupancy and native allocations. Heap dumps on Java OutOfMemoryError do not guarantee a dump for an OS/container kill. Size CPU requests and any limits according to workload and platform policy, then verify GC/JIT behavior and throttling under load.

#### Q57. Core Kubernetes objects and probes you must explain.

**Strong answer:**

**Pod** (smallest unit) → **Deployment/ReplicaSet** (rolling updates) →
**Service** (stable virtual IP, load balancing) → **Ingress/Gateway**
(L7 routing); **ConfigMap/Secret**, **HPA** (CPU/custom metrics),
**PDB**, **StatefulSet**, **Job/CronJob**. Probes: **startup** (slow JVM
boot), **readiness** (take out of rotation; Boot
`/actuator/health/readiness`), **liveness** (restart only on
unrecoverable state; never include downstream dependencies or you cause
restart storms).


#### Key terms you should know

- **Deployment**  -  A Kubernetes controller that manages replicated Pods
  and supports controlled rollout of new versions.
- **Pod**  -  Kubernetes' smallest deployable unit, containing one or more
  containers that share networking and storage context.
- **Service**  -  A stable Kubernetes networking abstraction that exposes
  a group of Pods behind a stable endpoint.


#### 30-second version

> **Pod** (smallest unit) → **Deployment/ReplicaSet** (rolling updates)
> → **Service** (stable virtual IP, load balancing) →
> **Ingress/Gateway** (L7 routing); **ConfigMap/Secret**, **HPA**
> (CPU/custom metrics), **PDB**, **StatefulSet**, **Job/CronJob**.
> Probes: **startup** (slow JVM boot), **readiness** (take out of
> rotation; Boot `/actuator/health/readiness`), **liveness** (restart
> only on unrecoverable state; never include downstream dependencies or
> you cause restart storms).

#### Q58. A pod is in `CrashLoopBackOff`. How do you troubleshoot?

**Strong answer:**

`kubectl describe pod` (events, exit code, OOMKilled, probe failures),
`kubectl logs --previous`, check config/secret mounts and env vars,
image pull and tag, resource limits, failing liveness/startup probes
(JVM too slow to start → raise `startupProbe`), dependency connectivity
(DNS, network policy, DB credentials), then `kubectl exec`/ephemeral
debug container. Fix root cause and add alerting on restart count.


#### Key terms you should know

- **OOMKilled**  -  A container termination status indicating the
  operating system killed the process because it exceeded its memory
  limit.
- **Pod**  -  Kubernetes' smallest deployable unit, containing one or more
  containers that share networking and storage context.


#### 30-second version

> `kubectl describe pod` (events, exit code, OOMKilled, probe failures),
> `kubectl logs --previous`, check config/secret mounts and env vars,
> image pull and tag, resource limits, failing liveness/startup probes
> (JVM too slow to start → raise `startupProbe`), dependency
> connectivity (DNS, network policy, DB credentials), then
> `kubectl exec`/ephemeral debug container. Fix root cause and add
> alerting on restart count.

---

### Next: Vol. 3

Scenario-based/behavioral questions, system-design walkthroughs and more
coding programs with solutions.

---

<!-- ===== Part 4: Question Bank Vol. 3 (Scenarios, System Design, Coding) ===== -->

<a id="senior-java-question-bank-vol-3"></a>
<a id="part-4"></a>
## Part 04 - Question Bank Vol. 3 - Scenarios, design and coding

**Scenarios · System Design · Coding Programs** (Q59-Q74 + 3 designs + 6
programs) For scenarios use: **Detect → Mitigate → Root cause → Fix →
Prevent.** Always quote a metric.

---

### J. Production Scenarios

#### Q59. Production CPU is at 95%. What do you do?

**Strong answer:**

First mitigate (scale out, or roll back the latest deploy if
correlated). Then find the hot threads: `top -H -p <pid>`, convert the
thread ID to hex, match it in `jstack`/`jcmd Thread.print`; or use
async-profiler/JFR for a flame graph. Typical causes:
infinite/regex-backtracking loops, excessive GC (check GC logs),
serialization hot spots, N+1 queries, or a busy-spinning consumer. Fix,
add a load test and CPU alert.


#### Key terms you should know

- **GC**  -  Garbage collection: automatic identification and reclamation
  of heap memory that is no longer reachable.
- **N+1**  -  A query pattern where one query loads N parent rows and then
  N additional queries load related data, causing excessive database
  round trips.


#### 30-second version

> First mitigate (scale out, or roll back the latest deploy if
> correlated). Then find the hot threads: `top -H -p <pid>`, convert the
> thread ID to hex, match it in `jstack`/`jcmd Thread.print`; or use
> async-profiler/JFR for a flame graph.

#### Q60. Heap keeps growing and the pod is OOMKilled. How do you investigate?

**Strong answer:**

Confirm the type: heap (Java `OutOfMemoryError`) vs container kill
(native memory/limit). Capture a heap dump
(`-XX:+HeapDumpOnOutOfMemoryError`, `jcmd GC.heap_dump`), open it in
Eclipse MAT, and read the leak suspects/dominator tree. Common roots:
unbounded caches or static maps, ThreadLocals in pools, unclosed
streams/connections, listener registration without removal, large result
sets. For native growth use NMT (`-XX:NativeMemoryTracking`). Fix with
bounded caches (Caffeine max size/TTL) and pagination/streaming.


#### Key terms you should know

- **GC**  -  Garbage collection: automatic identification and reclamation
  of heap memory that is no longer reachable.
- **heap**  -  JVM memory where Java objects are allocated.


#### 30-second version

> Confirm the type: heap (Java `OutOfMemoryError`) vs container kill
> (native memory/limit). Capture a heap dump
> (`-XX:+HeapDumpOnOutOfMemoryError`, `jcmd GC.heap_dump`), open it in
> Eclipse MAT, and read the leak suspects/dominator tree.

#### Q61. An endpoint's p99 jumped from 200 ms to 3 s. Walk me through it.

**Strong answer:**

Start from the symptom: is it all requests or specific ones, and since
when (deploy, traffic, data growth)? Use distributed traces to find the
slow span. Check DB (slow-query log, `EXPLAIN`, missing index, lock
waits), connection-pool wait time (Hikari metrics), GC pauses,
downstream latency, thread-pool saturation and cold caches. Fix the
dominant span, not guesses; then add a latency SLO alert and a
regression performance test.


#### Key terms you should know

- **GC**  -  Garbage collection: automatic identification and reclamation
  of heap memory that is no longer reachable.
- **SLO**  -  Service Level Objective: a measurable reliability target,
  such as 99.9% successful requests.
- **span**  -  One timed operation within a distributed trace, such as an
  HTTP call or database query.


#### 30-second version

> Start from the symptom: is it all requests or specific ones, and since
> when (deploy, traffic, data growth)? Use distributed traces to find
> the slow span.

#### Q62. "Connection is not available, request timed out after 30000ms." Diagnose.

**Strong answer:**

Hikari pool is exhausted: either too few connections for the load, or
connections are held too long. Look for transactions spanning remote
calls, `@Transactional` on large methods, leaked connections
(`leakDetectionThreshold`), long queries or lock waits, and
Open-Session-In-View. Don't simply raise `maximumPoolSize`: total
connections across all pods must stay under the DB limit. Shorten
transaction scope, add timeouts, and tune pool sizing (small pools are
usually faster).


#### Key terms you should know

- **transaction**  -  A unit of database work treated as one logical
  operation with defined commit/rollback behavior.


#### 30-second version

> Hikari pool is exhausted: either too few connections for the load, or
> connections are held too long. Look for transactions spanning remote
> calls, `@Transactional` on large methods, leaked connections
> (`leakDetectionThreshold`), long queries or lock waits, and
> Open-Session-In-View.

#### Q63. Customers were charged twice. How do you prevent it?

**Strong answer:**

Causes: client retries, gateway timeouts, at-least-once messaging.
Defence: an `Idempotency-Key` on the request stored with a unique
constraint and the stored response; state machine for payment (CREATED →
AUTHORISED → CAPTURED) with optimistic locking; idempotent consumers
keyed by event ID; call the PSP with its own idempotency key;
reconciliation job comparing PSP records with ours. Then add detection
alerts for duplicates.


#### Key terms you should know

- **idempotency**  -  The property that repeating the same logical request
  produces the same intended outcome rather than creating duplicate
  effects.
- **optimistic locking**  -  Concurrency control that detects conflicting
  updates, commonly using a version column, instead of holding a
  database lock throughout the transaction.


#### 30-second version

> Causes: client retries, gateway timeouts, at-least-once messaging.
> Defence: an `Idempotency-Key` on the request stored with a unique
> constraint and the stored response; state machine for payment (CREATED
> → AUTHORISED → CAPTURED) with optimistic locking; idempotent consumers
> keyed by event ID; call the PSP with its own idempotency key;
> reconciliation job comparing PSP records with ours.

#### Q64. How do you migrate the database schema with zero downtime?

**Strong answer:**

Expand → migrate → contract. Deploy a backward-compatible schema first
(add nullable column/new table), release code that writes to both (or
reads either), backfill in batches, switch reads, and only later drop
the old column once no running version depends on it. Use
Flyway/Liquibase, avoid long locks (`CREATE INDEX CONCURRENTLY`), and
test on production-sized data. Never couple a destructive migration with
the same release.


#### 30-second version

> Expand → migrate → contract. Deploy a backward-compatible schema first
> (add nullable column/new table), release code that writes to both (or
> reads either), backfill in batches, switch reads, and only later drop
> the old column once no running version depends on it.

#### Q65. Kafka consumer lag keeps growing. What now?

**Strong answer:**

Check whether it is a producer spike (temporary) or a slow consumer
(persistent). Look at per-partition lag, processing time per record,
rebalances, DB/downstream latency, and errors/retries. Options: scale
consumers (limited by partitions), batch processing, parallelise per key
safely, optimise the slow dependency, increase partitions (with ordering
implications), or shed non-critical work. Alert on lag *growth rate* and
time-to-drain.


#### 30-second version

> Check whether it is a producer spike (temporary) or a slow consumer
> (persistent). Look at per-partition lag, processing time per record,
> rebalances, DB/downstream latency, and errors/retries.

#### Q66. REST or gRPC or messaging between services?

**Strong answer:**

REST (JSON) for public/external APIs and simple CRUD: ubiquitous,
cacheable, human-debuggable. gRPC for internal, latency-sensitive,
strongly typed contracts with streaming and code generation (HTTP/2,
Protobuf), but harder through browsers/gateways. Messaging for
asynchronous workflows, fan-out and decoupling in time. Mixed in
practice: REST at the edge, gRPC for hot internal paths, events for
cross-domain state changes.


#### Key terms you should know

- **gRPC**  -  A high-performance RPC framework commonly using HTTP/2 and
  Protocol Buffers for service-to-service communication.


#### 30-second version

> REST (JSON) for public/external APIs and simple CRUD: ubiquitous,
> cacheable, human-debuggable. gRPC for internal, latency-sensitive,
> strongly typed contracts with streaming and code generation (HTTP/2,
> Protobuf), but harder through browsers/gateways.

#### Q67. Describe a major incident you led.

**Strong answer:**

Use STAR with numbers: *Situation* (checkout error rate 18%, revenue
impact), *Task* (incident commander), *Action* (declared severity,
assigned roles, rolled back, communicated every 15 min, preserved
evidence), *Result* (restored in 22 min), then **blameless
post-mortem**: root cause (connection leak after a library upgrade),
five-whys, action items (alerts, canary, load test) and what you
personally changed afterwards.


#### 30-second version

> Use STAR with numbers: *Situation* (checkout error rate 18%, revenue
> impact), *Task* (incident commander), *Action* (declared severity,
> assigned roles, rolled back, communicated every 15 min, preserved
> evidence), *Result* (restored in 22 min), then **blameless
> post-mortem**: root cause (connection leak after a library upgrade),
> five-whys, action items (alerts, canary, load test) and what you
> personally changed afterwards.

#### Q68. How do you upgrade from Java 8/Spring Boot 2 to Java 21/Boot 3?

**Strong answer:**

Separate the JDK, framework, dependency and behavioral changes. For a
legacy Boot 2 application, Boot 2.7 may be an intermediate migration
step, not the final support target. Choose an actively supported
destination and verify its dependency matrix. Boot 3 moves Jakarta EE
APIs such as persistence and servlet packages from `javax` to `jakarta`;
do not globally rename Java SE packages such as `javax.sql` or
`javax.crypto`. Revalidate Hibernate queries, serialization, security
configuration and performance. Boot 4 uses Spring Framework 7 and has
its own migration requirements; “modern Spring” is not synonymous with
Boot 3. [Boot 4
requirements](https://docs.spring.io/spring-boot/4.0/system-requirements.html).


#### 30-second version

> Separate the JDK, framework, dependency and behavioral changes. For a
> legacy Boot 2 application, Boot 2.7 may be an intermediate migration
> step, not the final support target.

#### Q69. How do you design a multi-tenant SaaS service?

**Strong answer:**

Choose isolation by risk and cost: shared schema with `tenant_id`
(cheapest; enforce via Hibernate filters/row-level security),
schema-per-tenant (balanced), or database-per-tenant (strong isolation,
noisy-neighbour control, higher cost). Resolve the tenant from the JWT
claim in a filter, propagate in context (MDC, `TenantContext` cleaned in
`finally`), key caches by tenant, rate-limit per tenant, and test for
cross-tenant leakage.


#### 30-second version

> Choose isolation by risk and cost: shared schema with `tenant_id`
> (cheapest; enforce via Hibernate filters/row-level security),
> schema-per-tenant (balanced), or database-per-tenant (strong
> isolation, noisy-neighbour control, higher cost). Resolve the tenant
> from the JWT claim in a filter, propagate in context (MDC,
> `TenantContext` cleaned in `finally`), key caches by tenant,
> rate-limit per tenant, and test for cross-tenant leakage.

#### Q70. Reports need data from five services. How do you build them?

**Strong answer:**

Avoid cross-service joins at query time. Publish domain events to build
a **read model** (a reporting store, BigQuery or Elasticsearch) via a
streaming pipeline (Dataflow, Kafka Connect/CDC). Accept eventual
consistency, expose freshness, and version event schemas. API
composition is acceptable for small, low-volume cases but couples
availability.


#### Key terms you should know

- **CDC**  -  Change Data Capture: publishing database changes by reading
  the database's change log or transaction log.
- **Service**  -  An application or platform capability exposed through a
  defined interface; a Kubernetes Service is a specific networking resource.


#### 30-second version

> Avoid cross-service joins at query time. Publish domain events to
> build a **read model** (a reporting store, BigQuery or Elasticsearch)
> via a streaming pipeline (Dataflow, Kafka Connect/CDC).

#### Q71. You disagree with your architect's design. What do you do?

**Strong answer:**

Show collaborative maturity: understand their constraints, write down
the options with trade-offs and data (a quick prototype or benchmark),
propose a decision record (ADR) and a reversible experiment, then
**disagree and commit** once a decision is made, and revisit with
evidence if it fails. Never go around people or argue opinions without
data.


#### 30-second version

> Show collaborative maturity: understand their constraints, write down
> the options with trade-offs and data (a quick prototype or benchmark),
> propose a decision record (ADR) and a reversible experiment, then
> **disagree and commit** once a decision is made, and revisit with
> evidence if it fails. Never go around people or argue opinions without
> data.

#### Q72. How do you improve code quality across a team?

**Strong answer:**

Automate first: formatter, Checkstyle/SpotBugs/Sonar quality gates,
coverage on new code, dependency scanning, in CI. Then human practices:
small PRs, review checklist (design, tests, security, observability),
pairing, ADRs, a testing pyramid, runbooks, and tech-debt budget (e.g.,
15-20% per sprint). Mentor through review comments that explain *why*.


#### Key terms you should know

- **observability**  -  The ability to understand internal system behavior
  from telemetry such as logs, metrics and traces.


#### 30-second version

> Automate first: formatter, Checkstyle/SpotBugs/Sonar quality gates,
> coverage on new code, dependency scanning, in CI. Then human
> practices: small PRs, review checklist (design, tests, security,
> observability), pairing, ADRs, a testing pyramid, runbooks, and
> tech-debt budget (e.g., 15-20% per sprint).

#### Q73. Deadline is tight and scope is large. How do you handle it?

**Strong answer:**

Clarify the business goal, slice into a thin end-to-end MVP, rank by
value/risk, surface risks and options early (scope, date, resources:
pick two), use feature flags to ship incrementally, avoid skipping tests
on critical paths, and record deliberate shortcuts as tracked debt.
Communicate proactively rather than surprise stakeholders.


#### Key terms you should know

- **Business goal**  -  The outcome the team is trying to achieve, used to
  prioritize scope and evaluate delivery trade-offs.


#### 30-second version

> Clarify the business goal, slice into a thin end-to-end MVP, rank by
> value/risk, surface risks and options early (scope, date, resources:
> pick two), use feature flags to ship incrementally, avoid skipping
> tests on critical paths, and record deliberate shortcuts as tracked
> debt. Communicate proactively rather than surprise stakeholders.

#### Q74. How do you decide between monolith and microservices for a new product?

**Strong answer:**

Start with a **modular monolith** unless there are clear reasons:
independent scaling, separate team ownership, different
tech/availability needs, regulatory isolation. Microservices add network
failures, distributed data, deployment and observability overhead; a
well-structured monolith with enforced module boundaries (ArchUnit,
Spring Modulith) can be split later when pressure is proven.


#### Key terms you should know

- **Modular monolith**  -  A single deployment with explicit internal module boundaries.
- **Microservice**  -  An independently deployable service with a defined responsibility and data ownership.
- **Distributed monolith**  -  Separate services whose coupling forces coordinated changes or deployment.


#### 30-second version

> Start with a **modular monolith** unless there are clear reasons:
> independent scaling, separate team ownership, different
> tech/availability needs, regulatory isolation. Microservices add
> network failures, distributed data, deployment and observability
> overhead; a well-structured monolith with enforced module boundaries
> (ArchUnit, Spring Modulith) can be split later when pressure is
> proven.

---

### K. System Design Walkthroughs (condensed)

**Design 1: URL Shortener.** Requirements: 100M new URLs/month, 10:1
read:write, low-latency redirect. API: `POST /urls`, `GET /{code}` →
301/302. Code: base62 of a unique ID (a distributed ID generator or
pre-allocated ranges per node; avoid hash-collision retries). Storage:
key-value (Bigtable/DynamoDB-style) `code → longUrl, ttl`; cache hot
codes in Redis (read-heavy, ~95% hit rate); CDN for popular links.
Scale: stateless app tier behind a load balancer, shard by code, async
click analytics via Pub/Sub. Trade-offs: 301 (cacheable, loses
analytics) vs 302; custom aliases need a uniqueness check; abuse
protection with rate limiting and malware checks.

**Design 2: Notification Service.** API accepts event + user + channel.
Flow: validate → persist (outbox) → Pub/Sub/Kafka topic per channel
(email, SMS, push) → channel workers with provider adapters, retry with
backoff, DLQ, per-provider circuit breaker and fallback provider.
Preferences/DND/ templates in a store; deduplicate with an idempotency
key; rate-limit per user; track delivery status via webhooks.
Priorities: separate topics for OTP (high priority) vs marketing.
Observability: delivery latency SLO, failure rate by provider.

**Design 3: Order & Payment (Saga).** Orchestrated saga:
`Order(PENDING)` → reserve inventory → authorise payment → confirm
order; on failure run compensations (release stock, void payment). Each
service uses a local transaction + outbox; events carry the order ID as
the Kafka key to keep order; consumers are idempotent. Timeouts for
stuck sagas, a state machine persisted by the orchestrator, and a
reconciliation job. Expose order status via a read model; clients poll
or receive a push.

---

### L. Coding Programs with Solutions

#### 1. Print odd/even numbers alternately using two threads

**Derive the approach:** the shared counter and whose turn it is form
one invariant. Test the predicate and update the counter under the same
monitor; a thread that cannot proceed waits and releases that monitor.

**Why this, not the alternatives:** sleeping is timing-dependent and
does not establish the required ordering. Busy-waiting wastes CPU. Two
semaphores can encode turns more directly, while a single-thread loop is
the practical choice when parallel work serves no purpose.

**What changes:** replacing the predicate loop with a one-time test
permits spurious wakeups to violate the rule. `notify` can wake an
unsuitable waiter in a generalized version; `notifyAll` plus predicate
checks is easier to reason about. When one worker is interrupted, cancel
and wake its partner; otherwise the survivor can wait forever.

**Trace and checks:** even starts with n=1, waits; odd prints 1 and
notifies; even prints 2. Test either starting order, cancellation and
final termination. O(max) work, O(1) shared state; lock scheduling
affects elapsed time.

**Strong answer signal:** identify the shared predicate and give a
cancellation timeline.

```java
class OddEven {
    private int n = 1; private boolean cancelled;
    private final int max = 10; private final Object lock = new Object();
    void print(boolean odd) {
        synchronized (lock) {
            while (!cancelled && n <= max) {
                if ((n % 2 == 1) == odd) { System.out.println(Thread.currentThread().getName() + ": " + n++); lock.notifyAll(); }
                else { try { lock.wait(); } catch (InterruptedException e) {
                    cancelled = true; lock.notifyAll();
                    Thread.currentThread().interrupt(); return;
                } }
            }
            lock.notifyAll();
        }
    }
    public static void main(String[] a) {
        OddEven o = new OddEven();
        new Thread(() -> o.print(true), "odd").start();
        new Thread(() -> o.print(false), "even").start();
    }
}
```

*Say:* `wait` always in a `while` loop (spurious wakeups); the lock must
be held to call `wait/notify`.

#### 2. Retry utility with exponential backoff + jitter

**Derive the approach:** a transient failure may recover, but immediate
synchronized retries increase pressure. Retry only safe operations, with
a bounded attempt count, capped delay, jitter and an overall deadline.

**Why this, not the alternatives:** fixed delays synchronize clients;
immediate retries amplify overload; indefinite retries consume resources
and hide permanent errors. Fail fast for invalid input or authorization
failure. A library can centralize policy, but cannot decide business
idempotency for you.

**What changes:** the short snippet is a sketch, not a complete retry
policy: `isTransient` is application-specific, arguments need
validation, exponential arithmetic needs saturation, and there is no
overall deadline. `InterruptedException` should propagate rather than
become retryable. A timed-out payment may already have completed, so
reuse a stable idempotency key and reconcile uncertain outcomes.

**Trace and checks:** fail transiently twice then succeed; assert
exactly three invocations. Also test permanent failure, attempt
exhaustion, cancellation and overflow bounds using an injected
sleeper/ticker. Work is bounded by attempts plus task cost; waiting
contributes to the deadline.

**Strong answer signal:** explain when retrying changes correctness, not
merely its delay formula.

```java
static <T> T retry(Callable<T> task, int maxAttempts, long baseMs,
                   long maxDelayMs, java.util.function.Predicate<Exception> transientFailure)
        throws Exception {
    Objects.requireNonNull(task);
    Objects.requireNonNull(transientFailure);
    if (maxAttempts < 1 || baseMs < 1 || maxDelayMs < baseMs
            || maxDelayMs == Long.MAX_VALUE)
        throw new IllegalArgumentException("invalid retry policy");
    long delay = baseMs;
    for (int attempt = 1; ; attempt++) {
        if (Thread.currentThread().isInterrupted()) throw new InterruptedException();
        try { return task.call(); }
        catch (InterruptedException e) { throw e; }
        catch (Exception e) {
            if (attempt >= maxAttempts || !transientFailure.test(e)) throw e;
            Thread.sleep(ThreadLocalRandom.current().nextLong(delay / 2, delay + 1));
            delay = delay > maxDelayMs / 2 ? maxDelayMs : delay * 2;
        }
    }
}
```

*Say:* retry only idempotent operations and transient errors; cap total
time; in Spring use Resilience4j `@Retry`.

#### 3. Top K frequent elements (min-heap, O(n log k))

**Derive the approach:** first count values, then retain only the k
largest frequencies. A min-heap exposes the weakest retained candidate
for eviction.

**Why this, not the alternatives:** sorting d distinct values costs O(d
log d) and is simple when k is large. A heap costs O(d log k), after
expected O(n) counting, and suits small k. Frequency buckets can use
O(n + d) space for expected linear processing. A max-heap holding
everything uses more state than needed.

**What changes:** heap iteration is not sorted; explicitly sort the
final k if ranked output is required. Ties need a declared rule; for
deterministic results include a secondary key in both selection and
output. Exact online counts require updating priorities, not just
mutating heap entries in place.

**Trace and checks:** counts A=4, B=2, C=3, k=2 retain A and C. Test
k=0, k larger than d, all ties and negative values. Total space O(d +
k); counting dominates storage.

**Strong answer signal:** distinguish input size n, distinct count d and
requested count k.

```java
List<Integer> topK(int[] nums, int k) {
    Objects.requireNonNull(nums);
    if (k < 0) throw new IllegalArgumentException("negative k");
    Map<Integer, Integer> freq = new HashMap<>();
    for (int x : nums) freq.merge(x, 1, Integer::sum);
    if (k > freq.size()) throw new IllegalArgumentException("k exceeds distinct count");
    PriorityQueue<Map.Entry<Integer, Integer>> pq = new PriorityQueue<>(Map.Entry.comparingByValue());
    for (var e : freq.entrySet()) { pq.offer(e); if (pq.size() > k) pq.poll(); }
    return pq.stream().map(Map.Entry::getKey).toList();
}
```

*Contract:* validate `0 <= k <= distinctCount` if exactly k results are
required. Heap iteration is not ranked output; define ordering and
tie-breaking. *Alternative:* frequency buckets trade more space for
linear expected processing.

#### 4. Group anagrams

**Derive the approach:** two words belong together when their character
multisets match. Build a canonical representation, then group by that
representation.

**Why this, not the alternatives:** sorting each word works for a broad
declared character alphabet and yields an immutable string key. A fixed
count vector avoids sorting for a known alphabet. Comparing every pair
of words repeats work and is roughly quadratic in word count.

**What changes:** concatenating counts without separators can create
ambiguous keys; using `int[]` directly as a HashMap key compares array
identity unless wrapped correctly. Case folding and Unicode
normalization are business decisions, not automatic anagram rules.
Sorted UTF-16 units are not a complete Unicode grapheme model.

**Trace and checks:** `eat`, `tea`, `bat` form two groups. Test
duplicates, empty strings, mixed case and agreed character boundaries.
For n words of maximum length k, sorting keys costs O(n k log k), plus
retained keys and output.

**Strong answer signal:** prove that equal keys mean exactly the
intended equivalence relation.

```java
Collection<List<String>> groupAnagrams(String[] words) {
    return Arrays.stream(words).collect(Collectors.groupingBy(w -> {
        char[] c = w.toCharArray(); Arrays.sort(c); return new String(c); })).values();
}
```

*Complexity:* O(n · k log k) for n words of length at most k, plus
output storage. A 26-count key gives O(n · k) only under an explicit
lowercase-English alphabet contract; encode the counts without ambiguous
concatenation.

#### 5. Custom `@LogExecutionTime` with Spring AOP

**Derive the approach:** timing is repeated across methods, so intercept
the method boundary and record elapsed monotonic time in `finally` to
cover failure as well as success.

**Why this, not the alternatives:** hand-written timers are transparent
but repetitive. A servlet filter measures an HTTP boundary; it does not
measure arbitrary service methods. For aggregated latency and
percentiles, use a metrics instrument rather than one log line per call.

**What changes:** proxy self-invocation bypasses this advice. A method
returning a future/publisher can finish before its work does; measuring
return time is not completion latency. Do not swallow the exception or
use a return in `finally`. Avoid payload logging and expensive
high-volume logs.

**Trace and checks:** a method that throws must still record a duration
and propagate the same failure. Test proxied external calls,
self-invocation and asynchronous completion separately. Timing adds
constant bookkeeping, while logging and the target method have their own
costs.

**Strong answer signal:** define exactly which interval the measurement
represents.

```java
@Target(METHOD) @Retention(RUNTIME) public @interface LogExecutionTime {}

@Aspect @Component @Slf4j
class TimingAspect {
    @Around("@annotation(LogExecutionTime)")
    Object time(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.nanoTime();
        try { return pjp.proceed(); }
        finally { log.info("{} took {} ms", pjp.getSignature().toShortString(), (System.nanoTime() - start) / 1_000_000); }
    }
}
```

*Say:* needs `spring-boot-starter-aop`; works only through the proxy (no
self-invocation); prefer Micrometer `@Timed` for real metrics.

#### 6. Create and fix a deadlock

**Derive the approach:** opposite lock acquisition orders permit a
cycle. Impose a total order on accounts and acquire both locks in that
order, independent of transfer direction.

**Why this, not the alternatives:** one global lock is simpler but
serializes unrelated transfers. `tryLock` with timeout avoids endless
waiting but introduces retry/livelock policy. Per-account ordering
preserves concurrency between independent accounts.

**What changes:** IDs must be unique and stable and must identify
canonical lock objects. Equal IDs on different objects or different lock
instances for the same account break the assumed order. A process-local
lock does not coordinate other JVMs. Also, two Java mutations are not
automatically transactional: if credit fails after debit, locking alone
does not undo the debit.

**Trace and checks:** A→B and B→A both lock the lower-ID object first.
Test same account, insufficient funds, invalid amount, overflow and
failure between mutations; validate before mutating or use a
transactional persistence boundary. O(1) local work, excluding waiting.

**Strong answer signal:** separate deadlock prevention from atomic
business effects.

```java
// Deadlock: thread A locks a then b; thread B locks b then a.
// Fix: impose a global lock order.
void transfer(Account from, Account to, long amt) {
    Account first = from.id < to.id ? from : to, second = first == from ? to : from;
    synchronized (first) { synchronized (second) { from.debit(amt); to.credit(amt); } }
}
```

*Say:* alternatives are `tryLock(timeout)` with back-off, or a
single-writer design; detect with `jstack` ("Found one Java-level
deadlock").

#### 7. Idempotent event consumer with PostgreSQL and Spring JDBC

**Derive the approach:** redelivery must not apply a business change
twice. A unique event marker and local business update must commit
together; let the database arbitrate concurrent duplicate claims.

**Why this, not the alternatives:** `exists` then `insert` races; an
in-memory set disappears on restart and is not shared across instances.
Committing the marker separately can permanently suppress an event whose
business update failed. An outbox solves reliable publication and
complements, rather than replaces, consumer deduplication.

**What changes:** changing consumer-name scope can make old events
appear new. Expiring dedupe records before the allowed replay horizon
re-enables old effects. The same event ID with different payloads should
be rejected or investigated. External payments require the provider's
own idempotency contract.

**Trace and checks:** two deliveries race; one inserts and updates, the
other observes the conflict. If the winner rolls back, a later delivery
must still apply the event. Test commit-before-ack crash, business
rollback and concurrent duplicates using PostgreSQL. Unique-index and
business-query cost dominate.

**Strong answer signal:** explain the crash windows and identify the
atomic boundary.

```sql
CREATE TABLE processed_event (
    consumer_name text NOT NULL,
    event_id text NOT NULL,
    PRIMARY KEY (consumer_name, event_id)
);
```

```java
@Service
@RequiredArgsConstructor
class PaymentEventHandler {
    private final JdbcTemplate jdbc;
    private final PaymentService payments;

    @Transactional
    public void handle(PaymentEvent event) {
        int inserted = jdbc.update("""
            INSERT INTO processed_event (consumer_name, event_id)
            VALUES (?, ?)
            ON CONFLICT (consumer_name, event_id) DO NOTHING
            """, "payment-handler-v1", event.eventId());
        if (inserted == 0) return;
        payments.applyLocal(event);
    }
}
```

`applyLocal` must participate in the same physical transaction and
datasource; it must not perform an uncoordinated external payment or use
`REQUIRES_NEW`. A business failure must roll back both writes.
Acknowledge the broker only after commit. PostgreSQL's conflict clause
skips the specified duplicate without aborting the transaction;
unrelated errors still fail. [PostgreSQL
INSERT](https://www.postgresql.org/docs/current/sql-insert.html).

Do not catch a JPA constraint violation and assume the surrounding
transaction remains usable: it may be rollback-only and fail on commit.
[Spring
propagation](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html).
Define event-ID scope and payload consistency; keep dedupe records for
the supported replay horizon. Test concurrent duplicates, failure after
dedupe insertion, replay after commit, and unrelated constraint failures
against the real database.

---

### Final Readiness Checklist

- ~100 Q&As covered across the course and Vols. 1-3; explain 20 of them
  aloud without notes
- Code LRU, rate limiter, odd/even, top-K, and the idempotent consumer
  in under 10 minutes each
- Rehearse 5 STAR stories and 3 system designs against a timer

---

<!-- ===== Part 5: Question Bank Vol. 4 (Modern Java, Spring Ecosystem, DB, Security, Quality) ===== -->

<a id="senior-java-question-bank-vol-4"></a>
<a id="part-5"></a>
## Part 05 - Question Bank Vol. 4 - Modern Java and the Spring ecosystem

**Modern Java · Design · Spring Ecosystem · Databases · Security ·
Quality** (Q75-Q98 + 4 programs)

---

### M. Modern Java & Design

#### Q75. Which modern Java features do you use, and why?

**Strong answer:** records (Java 16) provide concise data carriers with final components and generated value methods; their immutability is shallow. Copy or freeze mutable components. Sealed types (17) constrain permitted subtypes, while pattern matching for switch is final in Java 21. Text blocks, local var, Stream.toList and virtual threads can improve clarity when they fit the contract.

Use a sealed result hierarchy to model an explicit finite outcome set; account for null separately. Virtual threads improve scalability of suitable blocking workloads, not CPU execution speed. State the language/runtime baseline and avoid using preview features in a Java 21 exercise unless explicitly enabled.

#### Q76. What are the common Stream pitfalls?

**Strong answer:**

Streams are lazy: nothing runs without a terminal operation, and a
stream can be consumed only once. Pitfalls: side effects in `map/peek`
(breaks with parallelism), `Collectors.toMap` throwing
`IllegalStateException` on duplicate keys (supply a merge function),
boxing overhead (use `IntStream`), unreadable long pipelines (extract
methods), checked exceptions inside lambdas, and using streams for
simple loops where performance or debuggability matters. Know `flatMap`
(flatten nested), `groupingBy` with downstream collectors,
`partitioningBy`, `reduce` and short-circuit ops (`findFirst`,
`anyMatch`).


#### 30-second version

> Streams are lazy: nothing runs without a terminal operation, and a
> stream can be consumed only once. Pitfalls: side effects in `map/peek`
> (breaks with parallelism), `Collectors.toMap` throwing
> `IllegalStateException` on duplicate keys (supply a merge function),
> boxing overhead (use `IntStream`), unreadable long pipelines (extract
> methods), checked exceptions inside lambdas, and using streams for
> simple loops where performance or debuggability matters.

#### Q77. How should `Optional` be used?

**Strong answer:**

As a **return type** that signals "may be absent", chained with `map`,
`flatMap`, `filter`, `orElseGet` (lazy, unlike `orElse` which always
evaluates), and `orElseThrow`. Don't use it for fields, method
parameters, collections (return empty collections instead) or
serialization, and never call `get()` without checking.
`Optional.of(null)` throws; use `ofNullable`. Return `Optional` from
repository finders and handle absence explicitly at the service
boundary.


#### Key terms you should know

- **Application service**  -  A component coordinating a business use case;
  it may be a Spring-managed bean and is not a Kubernetes Service.


#### 30-second version

> As a **return type** that signals "may be absent", chained with `map`,
> `flatMap`, `filter`, `orElseGet` (lazy, unlike `orElse` which always
> evaluates), and `orElseThrow`. Don't use it for fields, method
> parameters, collections (return empty collections instead) or
> serialization, and never call `get()` without checking.

#### Q78. Explain SOLID with real examples.

**Strong answer:**

**S**: a class has one reason to change (separate `OrderService` from
`EmailSender`). **O**: extend behaviour without editing existing code
(new `PaymentStrategy` implementation, not another `if` branch). **L**:
subtypes must be usable wherever the base type is (a
`Square extends Rectangle` that breaks width/height contracts violates
it). **I**: small, role-specific interfaces rather than a fat one.
**D**: depend on abstractions; Spring's DI injects implementations.
Interviewers want a story: "We had a 600-line switch on payment type;
replaced it with strategies registered in a map keyed by type."


#### 30-second version

> **S**: a class has one reason to change (separate `OrderService` from
> `EmailSender`). **O**: extend behaviour without editing existing code
> (new `PaymentStrategy` implementation, not another `if` branch).

#### Q79. Which design patterns does Spring itself use?

**Strong answer:**

*Singleton* (default bean scope), *Factory/BeanFactory*, *Proxy* (AOP,
`@Transactional`, `@Cacheable`), *Template Method* (`JdbcTemplate`,
`RestTemplate`), *Observer* (`ApplicationEvent`/`@EventListener`),
*Dependency Injection*, *Front Controller* (`DispatcherServlet`),
*Decorator*/*Chain of Responsibility* (filter chain), *Builder*
(`ResponseEntity`, `HttpSecurity`), and *Strategy* (`HandlerMapping`,
`PasswordEncoder`). Explain one in depth, e.g., how the proxy intercepts
calls.


#### Key terms you should know

- **AOP**  -  Aspect-oriented programming: applying cross-cutting behavior
  such as transactions, logging or security around method execution.
- **bean**  -  An object managed by the Spring IoC container.
- **proxy**  -  An object that wraps another object and intercepts method
  calls, commonly used by Spring for transactions, security and AOP.


#### 30-second version

> *Singleton* (default bean scope), *Factory/BeanFactory*, *Proxy* (AOP,
> `@Transactional`, `@Cacheable`), *Template Method* (`JdbcTemplate`,
> `RestTemplate`), *Observer* (`ApplicationEvent`/`@EventListener`),
> *Dependency Injection*, *Front Controller* (`DispatcherServlet`),
> *Decorator*/*Chain of Responsibility* (filter chain), *Builder*
> (`ResponseEntity`, `HttpSecurity`), and *Strategy* (`HandlerMapping`,
> `PasswordEncoder`). Explain one in depth, e.g., how the proxy
> intercepts calls.

#### Q80. Describe the JVM architecture and JIT compilation.

**Strong answer:**

Class loaders load bytecode into the runtime data areas: heap (objects),
metaspace (class metadata, native memory), per-thread stacks (frames,
locals), PC registers and the code cache. The interpreter starts
executing immediately; hot methods are compiled by **C1** (fast, lightly
optimised) then **C2** (aggressive: inlining, escape analysis, loop
unrolling) via tiered compilation, with deoptimisation if assumptions
break. Consequences: warm-up matters for benchmarks (use JMH), and
cold-start-sensitive workloads (serverless) benefit from CDS/AppCDS,
CRaC or GraalVM native image.


#### Key terms you should know

- **heap**  -  JVM memory where Java objects are allocated.


#### 30-second version

> Class loaders load bytecode into the runtime data areas: heap
> (objects), metaspace (class metadata, native memory), per-thread
> stacks (frames, locals), PC registers and the code cache. The
> interpreter starts executing immediately; hot methods are compiled by
> **C1** (fast, lightly optimised) then **C2** (aggressive: inlining,
> escape analysis, loop unrolling) via tiered compilation, with
> deoptimisation if assumptions break.

---

### N. Spring Ecosystem

#### Q81. Spring Data JPA: derived queries, `@Query`, Specifications, projections.

**Strong answer:**

Derived queries (`findByStatusAndCreatedAtAfter`) are fine for simple
cases but become unreadable; use `@Query` (JPQL/native) for clarity,
**Specifications** or Querydsl for dynamic filters, and **interface/DTO
projections** to select only needed columns. Prefer `Pageable` with a
stable sort, avoid `findAll()` on big tables, return `Slice` when you
don't need the count query, and don't expose entities through the API.


#### 30-second version

> Derived queries (`findByStatusAndCreatedAtAfter`) are fine for simple
> cases but become unreadable; use `@Query` (JPQL/native) for clarity,
> **Specifications** or Querydsl for dynamic filters, and
> **interface/DTO projections** to select only needed columns. Prefer
> `Pageable` with a stable sort, avoid `findAll()` on big tables, return
> `Slice` when you don't need the count query, and don't expose entities
> through the API.

#### Q82. When do you use Spring Batch?

**Strong answer:**

Use Spring Batch for restartable, high-volume processing such as ETL,
reconciliation and nightly billing. A `Job` contains `Step`s. In a typical
chunk step, an `ItemReader` reads items, an `ItemProcessor` transforms
them, and an `ItemWriter` writes a chunk within a transaction. The job
repository records executions and restart state; configure skip/retry
policies and readers/writers that support the intended restart contract.

A `JobInstance` is identified by the job name and identifying
`JobParameters`. Reuse those parameters when restarting the same logical
run. A new timestamp or random identifying parameter creates a new
instance and can start the work again; it does not provide idempotency.
Protect business writes with stable item/business keys, uniqueness or
deduplication, and use provider idempotency for external side effects.
Scale using partitioning or remote chunking when needed. For simpler
periodic work, scheduling with an appropriate distributed lock may be
sufficient; that lock also does not make side effects idempotent.

#### How to understand it

For daily billing, a business date can identify the logical run. If
that run fails, keep the same identifying date to resume its instance.
A distinct execution attempt is a `JobExecution`, not necessarily a new
`JobInstance`. Restartability and idempotent business effects are separate
properties.

#### Key terms you should know

- **JobInstance**  -  A logical run identified by job name and identifying parameters.
- **JobExecution**  -  One execution attempt for that logical run.
- **ExecutionContext**  -  Persisted state used by restart-aware components.

#### SDE-3 interview checkpoints

- Fail after a committed chunk, then restart with the same identifying parameters.
- Show what changes when an identifying timestamp is added.
- Test duplicate business inputs and external-side-effect replay.

#### 30-second version

> Spring Batch supplies chunk processing and persisted restart metadata. Keep
> identifying JobParameters stable for retries of the same logical run; changing
> them creates a new JobInstance. Business idempotency still requires stable
> keys and deduplication or equivalent safeguards.

[Spring Batch domain model](https://docs.spring.io/spring-batch/reference/domain.html).

#### Q83. Which Spring Cloud components are still relevant?

**Strong answer:** choose Spring Cloud components against the platform and supported release train: Gateway for application routing, Config where centralized configuration is useful, declarative HTTP clients for service calls, and circuit-breaker integrations where failure semantics justify them. Micrometer provides observation/tracing integration.

Do not group Eureka with retired Ribbon as though both have the same status. Kubernetes Services/DNS may remove the need for application-level discovery; Eureka remains an option in other environments. Spring Cloud LoadBalancer replaces the Ribbon role. Verify support and the Boot compatibility matrix for the target release.

#### Q84. `RestTemplate` vs `WebClient` vs `RestClient`, and how do you set timeouts?

**Strong answer:**

`RestClient` is the synchronous fluent client; `WebClient` supports
reactive composition and streaming. `RestTemplate` was in maintenance
mode in Spring 6 and is deprecated in Spring 7 in favor of `RestClient`.
Match the answer to the interview's version. Configure connection
acquisition, connect, response/read and overall deadlines on the actual
underlying client; retries and circuit breakers depend on the failure
contract. [Spring REST
clients](https://docs.spring.io/spring-framework/reference/integration/rest-clients.html).


#### Key terms you should know

- **reactive**  -  A programming model centered on asynchronous streams
  and non-blocking processing with explicit demand/back-pressure.


#### 30-second version

> `RestClient` is the synchronous fluent client; `WebClient` supports
> reactive composition and streaming. `RestTemplate` was in maintenance
> mode in Spring 6 and is deprecated in Spring 7 in favor of
> `RestClient`.

#### Q85. How do you handle validation and errors consistently?

**Strong answer:**

Bean Validation (`@Valid`, `@NotNull`, `@Size`, custom constraint
validators) at the API boundary; domain invariants inside
entities/services. A single `@RestControllerAdvice` maps exceptions to
RFC 9457 problem details (`ProblemDetail`; RFC 9457 supersedes RFC 7807)
with stable error codes (not stack traces), HTTP status by cause (400
validation, 404, 409 conflict, 422, 503), and a correlation ID. Log once
at the boundary with the right level (client errors at `warn`/`info`,
server errors at `error`).


#### Key terms you should know

- **bean**  -  An object managed by the Spring IoC container.


#### 30-second version

> Bean Validation (`@Valid`, `@NotNull`, `@Size`, custom constraint
> validators) at the API boundary; domain invariants inside
> entities/services. A single `@RestControllerAdvice` maps exceptions to
> RFC 9457 problem details (`ProblemDetail`; RFC 9457 supersedes RFC
> 7807) with stable error codes (not stack traces), HTTP status by cause
> (400 validation, 404, 409 conflict, 422, 503), and a correlation ID.

#### Q86. What is `@TransactionalEventListener` and why is it useful?

**Strong answer:**

`@TransactionalEventListener(AFTER_COMMIT)` runs after successful
commit, but is not durable delivery: a process can fail before an email
or message is sent. Original transactional resources may still be
accessible, yet further writes do not become a new committed transaction
automatically. Put required follow-up writes behind a separate
transactional boundary and use an outbox when the event must survive
process failure. Listener failure cannot undo the original commit.
[TransactionalEventListener
API](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/event/TransactionalEventListener.html).


#### Key terms you should know

- **outbox**  -  A database table used to store events in the same
  transaction as business data so publication can happen reliably
  afterward.
- **transaction**  -  A unit of database work treated as one logical
  operation with defined commit/rollback behavior.


#### 30-second version

> `@TransactionalEventListener(AFTER_COMMIT)` runs after successful
> commit, but is not durable delivery: a process can fail before an
> email or message is sent. Original transactional resources may still
> be accessible, yet further writes do not become a new committed
> transaction automatically.

#### Q87. What changed with Boot 3 observability and native images?

**Strong answer:**

Boot 3 integrates Micrometer Observation: an observation can feed
metrics and tracing, but coverage depends on the libraries, bridges and
instrumentation actually configured; JDBC tracing is not universally
automatic. GraalVM native images give millisecond start-up and a lower
memory footprint (great for Cloud Run), but need ahead-of-time
processing, reflection/proxy hints, a longer build, and may have
different steady-state throughput from a warmed-up JIT; benchmark the
real workload. Choose by workload: native for scale-to-zero, JVM for
sustained high throughput.


#### Key terms you should know

- **Cloud Run**  -  GCP's managed container execution platform where the
  platform handles servers and scales container instances.
- **JIT**  -  Just-in-time compilation: runtime compilation of frequently
  executed bytecode into optimized native machine code.
- **proxy**  -  An object that wraps another object and intercepts method
  calls, commonly used by Spring for transactions, security and AOP.


#### 30-second version

> Boot 3 integrates Micrometer Observation: an observation can feed
> metrics and tracing, but coverage depends on the libraries, bridges
> and instrumentation actually configured; JDBC tracing is not
> universally automatic. GraalVM native images give millisecond start-up
> and a lower memory footprint (great for Cloud Run), but need
> ahead-of-time processing, reflection/proxy hints, a longer build, and
> may have different steady-state throughput from a warmed-up JIT;
> benchmark the real workload.

---

### O. Databases & Caching

#### Q88. How do database indexes work and how do you design them?

**Strong answer:**

A B-tree index keeps keys ordered. Seeking a key or range start is
typically O(log n); retrieving k matching entries adds work, commonly
modeled as O(log n + k). An ordered full scan still visits O(n) entries.
Real query cost also includes pages read, table lookups, filtering,
visibility checks and any additional sorting.

A composite B-tree often benefits from equality constraints on leading
columns followed by a range/order requirement. Some engines can exploit
later columns through skip scans or other access paths. A covering index
contains the needed columns and may avoid table reads, but engine-specific
visibility rules still apply. Indexes cost storage and write work, so
design them around actual queries and execution plans. Expressions such
as `lower(email)` may need expression indexes; leading-wildcard searches
may need a specialized index. Low selectivity can make a sequential scan
cheaper; do not assume an index is either always used or always ignored.

#### How to understand it

Finding the first matching entry and reading every result are
different operations. Returning a million matching rows cannot become
logarithmic just because the index finds the range quickly. In PostgreSQL,
MVCC visibility determines whether a row version is visible to the current
transaction snapshot; an index-only scan may still need heap visits.

#### Key terms you should know

- **Selectivity**  -  How much of the data a predicate matches.
- **Covering index**  -  An index containing the columns required by a query.
- **MVCC visibility**  -  Whether a row version is visible to a transaction snapshot.
- **Database heap**  -  Table-row storage; distinct from the JVM object heap.

#### SDE-3 interview checkpoints

- State n (indexed entries) and k (entries returned or examined).
- Compare selective lookup, large range scan and ordered full scan.
- Inspect execution plans, table visits, filtering and write overhead.

#### 30-second version

> A B-tree can find a range start in logarithmic time, but reading k entries
> adds work: typically O(log n + k), plus database-specific costs. Composite and
> covering indexes must match the query. Verify the plan and MVCC visibility
> costs instead of claiming every indexed query is O(log n).

[PostgreSQL index types](https://www.postgresql.org/docs/current/indexes-types.html), [index-only scans](https://www.postgresql.org/docs/current/indexes-index-only-scans.html).

#### Q89. A query is slow. How do you tune it?

**Strong answer:**

For PostgreSQL, `EXPLAIN (ANALYZE, BUFFERS)` executes the statement, so
use a safe environment or a carefully controlled read-only query: look
for sequential scans on large tables, row-estimate mismatches (stale
stats; `ANALYZE`), expensive sorts/hash joins and nested loops over big
sets. Fixes: add or reshape indexes, rewrite (avoid `SELECT *`, replace
correlated subqueries with joins, use keyset pagination), reduce data
returned, partition large tables, cache results, or precompute with
materialised views. Verify with production-sized data and watch lock
contention and long transactions.


#### 30-second version

> For PostgreSQL, `EXPLAIN (ANALYZE, BUFFERS)` executes the statement,
> so use a safe environment or a carefully controlled read-only query:
> look for sequential scans on large tables, row-estimate mismatches
> (stale stats; `ANALYZE`), expensive sorts/hash joins and nested loops
> over big sets. Fixes: add or reshape indexes, rewrite (avoid
> `SELECT *`, replace correlated subqueries with joins, use keyset
> pagination), reduce data returned, partition large tables, cache
> results, or precompute with materialised views.

#### Q90. SQL vs NoSQL: how do you choose?

**Strong answer:**

SQL when data is relational, needs ACID transactions, ad-hoc queries and
joins. NoSQL when you need horizontal scale and a known access pattern:
key-value/document (Firestore, DynamoDB, MongoDB) for flexible schema
and low latency lookups, wide-column (Bigtable, Cassandra) for massive
writes/time-series, graph for relationship traversal, search engines
(Elasticsearch) for text queries. Polyglot persistence is normal, but
each store adds operational cost, so justify it with requirements, not
fashion.


#### 30-second version

> SQL when data is relational, needs ACID transactions, ad-hoc queries
> and joins. NoSQL when you need horizontal scale and a known access
> pattern: key-value/document (Firestore, DynamoDB, MongoDB) for
> flexible schema and low latency lookups, wide-column (Bigtable,
> Cassandra) for massive writes/time-series, graph for relationship
> traversal, search engines (Elasticsearch) for text queries.

#### Q91. Which Redis caching patterns do you know, and what are the failure modes?

**Strong answer:**

*Cache-aside* (read: check cache, miss → DB → populate; write: update DB
then evict), *write-through*, *write-behind*. Always set TTLs (with
jitter) and eviction policy. Failure modes: **stampede** (many requests
rebuild an expired hot key: use locking/single-flight or early refresh),
**penetration** (queries for non-existent keys: cache negatives/Bloom
filter), **avalanche** (mass expiry: jittered TTLs), stale data and
cache/DB inconsistency. For a distributed lock use
`SET key value NX PX ttl` with a unique token and a Lua release script,
and note locks don't give strict safety without fencing tokens.


#### 30-second version

> *Cache-aside* (read: check cache, miss → DB → populate; write: update
> DB then evict), *write-through*, *write-behind*. Always set TTLs (with
> jitter) and eviction policy.

---

### P. Security, Performance & Quality

#### Q92. Which OWASP vulnerabilities matter most in a Java API, and how do you prevent them?

**Strong answer:**

Injection (use prepared statements/JPA parameters, never concatenate
SQL), broken access control (check ownership on every object access, not
just roles: IDOR), cryptographic failures (TLS everywhere, strong
hashing, no hard-coded secrets), insecure deserialization (avoid Java
native deserialization; configure Jackson safely), SSRF (allow-list
outbound URLs), vulnerable components (SCA scanning), security
misconfiguration (disable actuator exposure, verbose errors), XSS
(output encoding, CSP) and insufficient logging/monitoring. Add rate
limiting and input validation.


#### 30-second version

> Injection (use prepared statements/JPA parameters, never concatenate
> SQL), broken access control (check ownership on every object access,
> not just roles: IDOR), cryptographic failures (TLS everywhere, strong
> hashing, no hard-coded secrets), insecure deserialization (avoid Java
> native deserialization; configure Jackson safely), SSRF (allow-list
> outbound URLs), vulnerable components (SCA scanning), security
> misconfiguration (disable actuator exposure, verbose errors), XSS
> (output encoding, CSP) and insufficient logging/monitoring. Add rate
> limiting and input validation.

#### Q93. What are your logging best practices?

**Strong answer:**

Structured JSON logs through SLF4J, with correlation IDs in the MDC (set
in a filter, cleared in `finally`, propagated to async tasks),
appropriate levels, and no sensitive data (PII, tokens, card numbers).
Use parameterised messages (`log.info("order {}", id)`), log once per
failure at the boundary, avoid logging in tight loops, and sample
high-volume debug logs. Logs explain *what happened*; metrics tell *how
much*; traces show *where*.


#### 30-second version

> Structured JSON logs through SLF4J, with correlation IDs in the MDC
> (set in a filter, cleared in `finally`, propagated to async tasks),
> appropriate levels, and no sensitive data (PII, tokens, card numbers).
> Use parameterised messages (`log.info("order {}", id)`), log once per
> failure at the boundary, avoid logging in tight loops, and sample
> high-volume debug logs.

#### Q94. How do you performance-test and benchmark?

**Strong answer:**

Define SLOs, then load-test realistic scenarios (k6, Gatling, JMeter)
against a production-like environment with representative data,
measuring throughput, p50/p95/p99 latency and errors, plus saturation
(CPU, GC, pool waits). Find bottlenecks with profiling (JFR,
async-profiler) before changing code. Use **JMH** for micro-benchmarks
(warm-up, forks, blackhole to avoid dead-code elimination); hand-rolled
`System.nanoTime` loops are misleading. Run soak tests to catch leaks
and put a regression test in CI.


#### Key terms you should know

- **GC**  -  Garbage collection: automatic identification and reclamation
  of heap memory that is no longer reachable.


#### 30-second version

> Define SLOs, then load-test realistic scenarios (k6, Gatling, JMeter)
> against a production-like environment with representative data,
> measuring throughput, p50/p95/p99 latency and errors, plus saturation
> (CPU, GC, pool waits). Find bottlenecks with profiling (JFR,
> async-profiler) before changing code.

#### Q95. How do you deal with flaky tests?

**Strong answer:**

Treat them as defects: find the cause (time/timezone, ordering, shared
state, async waits with `sleep`, random data, external dependencies).
Fixes: inject a `Clock`, use Awaitility instead of sleeps, isolate data
per test (transactions or Testcontainers per class), make tests
independent, mock only external boundaries, and quarantine rather than
ignore with a ticket and deadline. A flaky suite erodes trust in CI.


#### 30-second version

> Treat them as defects: find the cause (time/timezone, ordering, shared
> state, async waits with `sleep`, random data, external dependencies).
> Fixes: inject a `Clock`, use Awaitility instead of sleeps, isolate
> data per test (transactions or Testcontainers per class), make tests
> independent, mock only external boundaries, and quarantine rather than
> ignore with a ticket and deadline.

#### Q96. What are the 12-factor principles that matter most for cloud services?

**Strong answer:**

One codebase, many deploys; explicit dependencies; **config in the
environment**; backing services as attached resources; strict
build/release/run separation; **stateless processes** (state in
DB/Redis); port binding; scale out via processes; **disposability**
(fast start, graceful shutdown); dev/prod parity; logs as event streams
to stdout; admin tasks as one-off jobs. Tie each to a concrete practice
(immutable images, readiness probes, no local file state).


#### 30-second version

> One codebase, many deploys; explicit dependencies; **config in the
> environment**; backing services as attached resources; strict
> build/release/run separation; **stateless processes** (state in
> DB/Redis); port binding; scale out via processes; **disposability**
> (fast start, graceful shutdown); dev/prod parity; logs as event
> streams to stdout; admin tasks as one-off jobs. Tie each to a concrete
> practice (immutable images, readiness probes, no local file state).

#### Q97. How do you design backward-compatible APIs and events?

**Strong answer:** compatibility is a consumer contract, not simply an additive-schema rule. An optional field is often compatible only when old readers tolerate it; adding enum values, changing defaults, tightening validation, changing ordering or altering numeric ranges can still break clients. Use schema compatibility rules plus old/new producer-consumer tests, and reserve removed Protobuf field numbers and names.

Choose tolerant-reader behavior deliberately; do not disable unknown-field validation globally without considering the API. Version intentional breaks and provide a rollout/deprecation path. Check behavior, wire format and persisted data as separate dimensions.

#### Q98. How do you approach technical debt and refactoring safely?

**Strong answer:**

Make it visible (tracked backlog with impact), pay it continuously
(boy-scout rule, a fixed share of each sprint), and refactor behind
tests: write characterisation tests first, use small steps,
branch-by-abstraction or feature flags for large changes, and the
strangler pattern for legacy replacement. Prioritise debt that slows
delivery or causes incidents, and explain value in business terms (lead
time, defect rate).


#### Key terms you should know

- **Technical debt**  -  Design or implementation choices that increase future delivery or operational cost.
- **Characterisation test**  -  A test recording existing behavior before a change.
- **Branch by abstraction**  -  Gradually replacing an implementation behind a stable boundary.
- **Strangler pattern**  -  Incrementally replacing legacy functionality.


#### 30-second version

> Make it visible (tracked backlog with impact), pay it continuously
> (boy-scout rule, a fixed share of each sprint), and refactor behind
> tests: write characterisation tests first, use small steps,
> branch-by-abstraction or feature flags for large changes, and the
> strangler pattern for legacy replacement. Prioritise debt that slows
> delivery or causes incidents, and explain value in business terms
> (lead time, defect rate).

---

### Q. More Coding Programs

#### 1. Sealed types with exhaustive pattern-matching `switch` (Java 21)

**Derive the approach:** the operation has a finite set of meaningful
outcomes. Model each outcome as a type so each consumer must handle the
known alternatives.

**Why this, not the alternatives:** a boolean plus nullable fields
permits inconsistent combinations. Exceptions fit exceptional failures
but can obscure ordinary expected outcomes. An interface with
polymorphic behavior may be better when behavior belongs to each
subtype; switching is useful when operations vary across a closed model.

**What changes:** adding a permitted subtype makes newly compiled
exhaustive consumers require handling it. Independently deployed clients
still need compatibility planning. A `default` can hide a missing case;
`null` is not automatically a modeled variant. Records remain shallowly
immutable.

**Trace and checks:** Success maps to a value message, Failure to an
error message. Test each variant and the declared null policy. Branch
selection is bounded by the small variant set, but rendering a value may
cost more.

**Strong answer signal:** explain which invalid states the type model
prevents and where evolution is constrained.

```java
sealed interface Result<T> permits Success, Failure {}
record Success<T>(T value) implements Result<T> {}
record Failure<T>(String error) implements Result<T> {}

static <T> String describe(Result<T> r) {
    return switch (r) {
        case Success<T> s -> "OK: " + s.value();
        case Failure<T> f -> "ERR: " + f.error();   // no default needed: compiler checks exhaustiveness
    };
}
```

#### 2. Dynamic filtering with Spring Data `Specification`

**Derive the approach:** optional filters compose into a conjunction;
independently add predicates for supplied values and let the database
filter before pagination.

**Why this, not the alternatives:** derived-method names become unwieldy
across many combinations. Fetching all rows and filtering in Java wastes
memory and can paginate incorrectly. A fixed JPQL query may be simpler
when there are only one or two stable combinations.

**What changes:** absent filters currently match all rows, so enforce
authorization/tenant predicates separately and cap page size. Empty text
is different from absent input. Sorting only by creation time is
unstable on ties; append a unique ID. Joins may duplicate roots and
complicate count queries.

**Trace and checks:** no optional filters, status only, date only and
both must produce intended SQL predicates. Check inclusive date
boundaries, null policy and equal timestamps across pages. Complexity
follows the execution plan and result cardinality, not the number of
Java predicates.

**Strong answer signal:** connect composability to query correctness,
security and stable pagination.

```java
interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {}

static Specification<Order> filter(String status, Instant from) {
    return (root, q, cb) -> {
        List<Predicate> p = new ArrayList<>();
        if (status != null) p.add(cb.equal(root.get("status"), status));
        if (from != null)   p.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
        return cb.and(p.toArray(Predicate[]::new));
    };
}
// repo.findAll(filter("PAID", from), PageRequest.of(0, 20, Sort.by("createdAt").descending()));
```

#### 3. Bounded concurrency with virtual threads

**Derive the approach:** blocking requests can be represented as
lightweight threads, but the downstream permits only a fixed number of
concurrent calls. A semaphore represents that separate resource budget.

**Why this, not the alternatives:** a bounded platform-thread pool also
works but limits execution contexts and downstream access together.
Unlimited submission without a downstream limit can overwhelm connection
pools. A semaphore protects active calls; admission limits also control
waiting tasks and retained inputs.

**What changes:** acquiring permits after task creation permits an
unbounded number of waiting virtual threads. Acquire/admit before
submission with failure cleanup, or process bounded batches. Release
only after successful acquisition and in `finally`. Per-JVM limits
multiply across replicas. Waiting in executor close can exceed a request
deadline if tasks do not terminate.

**Trace and checks:** with two permits and five tasks, at most two
fetches run concurrently. Test failures and interruption without leaking
permits; verify admitted count as well as active count. The shown code
retains O(number of IDs) futures.

**Strong answer signal:** distinguish cheap threads from bounded
resource and memory use.

```java
Semaphore limit = new Semaphore(50);                       // protect the downstream service
try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<String>> results = ids.stream().map(id -> exec.submit(() -> {
        limit.acquire();
        try { return client.fetch(id); } finally { limit.release(); }
    })).toList();
    for (var f : results) System.out.println(f.get());
}   // close() waits for all tasks
```

*Say:* this limits active downstream calls but still submits one task
and retains one future per input. Bound admitted work or process batches
for huge inputs; add deadlines and cancellation. `close()` waits for
completion, so a hanging task can delay scope exit.

#### 4. Merge overlapping intervals (O(n log n))

**Derive the approach:** after sorting by start, a new interval either
extends the last union interval or starts a disjoint one. Earlier merged
intervals cannot overlap it without also overlapping the last one.

**Why this, not the alternatives:** pairwise comparisons cost O(n²); an
interval tree is useful for dynamic queries but unnecessary for one
static merge. If the input is already sorted, skip sorting and scan in
O(n).

**What changes:** the code sorts the input and reuses/mutates its inner
arrays. Copy when the caller requires preservation. Closed intervals
that touch merge under the current condition; half-open semantics may
need a different rule. Reject start \> end rather than silently
interpreting it.

**Trace and checks:** `[1,4], [2,3], [6,8]` becomes `[1,4], [6,8]`; the
contained interval must not shrink the right endpoint. Test empty input,
touching endpoints, duplicates and nested intervals. O(n log n) time,
O(n) output, plus sorting workspace.

**Strong answer signal:** state endpoint and mutation contracts before
the sweep.

```java
int[][] merge(int[][] in) {
    Arrays.sort(in, Comparator.comparingInt(a -> a[0]));
    List<int[]> out = new ArrayList<>();
    for (int[] cur : in) {
        if (out.isEmpty() || out.get(out.size() - 1)[1] < cur[0]) out.add(cur);
        else out.get(out.size() - 1)[1] = Math.max(out.get(out.size() - 1)[1], cur[1]);
    }
    return out.toArray(new int[0][]);
}
```

---

<!-- ===== Part 6: Question Bank Vol. 5 (Rapid-Fire, Puzzles, Designs, Coding) ===== -->

<a id="senior-java-question-bank-vol-5"></a>
<a id="part-6"></a>
## Part 06 - Question Bank Vol. 5 - Rapid-fire, puzzles and harder coding

**Rapid-Fire Revision · Output-Prediction Puzzles · More System Designs
· Harder Coding** Use this the night before: say each answer aloud in
one breath, then expand if the interviewer probes.

---

### R. Rapid-Fire (one-breath answers)

### Java

1.  **HashMap vs Hashtable vs ConcurrentHashMap?** Unsynchronized with
    one null key; fully synchronized legacy; per-bin CAS/locks, no
    nulls.
2.  **ArrayList vs LinkedList?** Array-backed O(1) index and
    cache-friendly vs O(n) index; ArrayList wins almost always.
3.  **`final`, `finally`, `finalize`?** Constant/no-override;
    always-runs block; deprecated GC hook (use
    `Cleaner`/try-with-resources).
4.  **Abstract class vs interface?** State and constructors vs multiple
    inheritance of type; interfaces have `default`/`static` methods
    since 8.
5.  **`==` vs `equals`?** Reference identity vs logical equality.
6.  **Stack vs heap?** Per-thread frames and primitives/references vs
    shared objects managed by GC.
7.  **Strong, soft, weak, phantom references?** Never collected while
    reachable; cleared under memory pressure (caches); cleared at next
    GC (`WeakHashMap`); post-mortem cleanup.
8.  **`wait()` vs `sleep()`?** `wait` releases the monitor and needs the
    lock; `sleep` keeps locks.
9.  **Callable vs Runnable?** Returns a value and may throw checked
    exceptions.
10. **Serialization risks?** Version mismatch, security (gadget chains);
    prefer JSON/Protobuf and set `serialVersionUID` if you must.
11. **Shallow vs deep copy?** Copies references vs copies the object
    graph; prefer copy constructors over `clone()`.
12. **Why is `HashMap` capacity a power of two?** Fast index masking
    `(n-1) & hash` and cheap resize splitting.
13. **Fork/Join?** Work-stealing pool for recursive divide-and-conquer
    tasks.
14. **`CountDownLatch` vs `CyclicBarrier` vs `Semaphore`?** One-shot
    countdown; reusable rendezvous; permit-based throttling.

### Spring / Hibernate

15. **`@Component` vs `@Bean`?** Class-level scanned stereotype vs
    method-level explicit factory for third-party classes.
16. **`@Controller` vs `@RestController`?** View resolution vs
    `@Controller` + `@ResponseBody`.
17. **`@Qualifier` vs `@Primary`?** Pick a specific bean by name vs
    default among candidates.
18. **`@Value` vs `@ConfigurationProperties`?** Single property vs
    typed, validated, grouped binding.
19. **`@RequestParam` vs `@PathVariable` vs `@RequestBody`?** Query
    string, URI segment, and JSON body.
20. **Filter vs Interceptor?** Servlet-level, before `DispatcherServlet`
    vs Spring MVC handler-level with access to the handler.
21. **Entity lookup vs reference?** `find`/legacy `get` returns an
    entity or null and may use the persistence context/cache;
    `getReference` can defer loading and absence detection. Legacy
    `load` behavior and availability depend on Hibernate version.
22. **`@OneToMany` owning side?** The `@ManyToOne` side with
    `@JoinColumn`; use `mappedBy` on the other.
23. **`Page` vs `Slice` vs `List`?** Page reports total information and
    may need a count query; Slice reports whether more results exist. A
    List can still be bounded by a Pageable/limit. Pageable is a request
    parameter, not a result type.
24. **JPQL vs native vs Criteria?** Portable object queries vs
    DB-specific SQL vs type-safe dynamic queries.

### Architecture / Cloud

25. **Orchestration vs choreography?** Central coordinator vs
    event-driven reactions.
26. **Idempotency?** Repeating an operation has the same effect as doing
    it once.
27. **Circuit breaker states?** Closed → open → half-open.
28. **Sticky sessions: good?** No; keep services stateless and
    externalise sessions (Redis/JWT).
29. **Blue-green vs canary?** Full parallel switch vs gradual percentage
    rollout.
30. **SLI vs SLO vs SLA?** The measurement, the internal target, the
    contractual promise.
31. **Eventual consistency?** Replicas/read models converge after writes
    if no new updates occur.
32. **Pub/Sub vs queue?** Fan-out to many subscribers vs competing
    consumers on one queue.
33. **Cloud Run vs GKE one-liner?** Simple stateless containers with
    scale-to-zero vs full Kubernetes control.
34. **Liveness vs readiness?** Restart me if broken vs stop sending me
    traffic until ready.
35. **Docker image vs container?** Immutable template vs running
    instance.
36. **Maven `install` vs `deploy`?** Local repo vs remote repository.
37. **`mvn clean install` vs `verify`?** `verify` runs through
    integration tests without copying to `~/.m2`.
38. **IaC benefit?** Reproducible, reviewable, versioned infrastructure
    (Terraform).
39. **PUT vs PATCH vs POST?** Idempotent full replace; partial update;
    create or non-idempotent action.
40. **401 vs 403?** Not authenticated vs authenticated but not allowed.

---

### S. "What Will This Print?" Puzzles

**1.** For `Integer a=127,b=127,c=128,d=128`, `a == b` is `true`;
`c == d` is commonly `false` but is not guaranteed because
implementations may cache more values. Use `equals` for value equality.
**2.** `"a"+"b" == "ab"` → `true` (compile-time constant folding);
`new String("ab") == "ab"` → `false`. **3.**
`try { return 1; } finally { return 2; }` → returns **2**; a `return` in
`finally` overrides and swallows exceptions. Never do it. **4.**
`Arrays.asList(1,2).add(3)` and `List.of(1).add(2)` →
`UnsupportedOperationException` (fixed-size / immutable). **5.**
Mutating equality/hash-relevant state after insertion can make a
`HashSet` lookup fail; the exact output is not guaranteed for every
mutation. The key must remain stable while stored. **6.** Removing
through the list inside an enhanced loop may trigger
`ConcurrentModificationException`; fail-fast behavior is best effort and
some cases end iteration without throwing. Use `Iterator.remove()` where
the iterator supports it, or a supported collection-level `removeIf`.
`CopyOnWriteArrayList` supports the latter but not iterator removal. **7.** `0.1 + 0.2 == 0.3` → `false`; use `BigDecimal`
(constructed from `String`) for money. **8.** Loading and initialization
are different. Static initialization occurs on active use, with
superclass initialization first where required. Constructing an instance
runs superclass construction before subclass instance initializers and
the subclass constructor body.

---

### T. More System Designs (condensed)

**Design 4: Distributed Rate Limiter.** Requirements: per-user/API-key
limits, \<5 ms overhead, works across many instances. Algorithms: *fixed
window* (simple, burst at boundaries), *sliding window log/counter*
(accurate, more memory), *token bucket* (allows bursts, most common),
*leaky bucket* (smooths output). Implementation: enforce at the API
gateway or a sidecar; keep state in Redis with an atomic Lua script
(`INCR` + `EXPIRE`, or token refill math) keyed by `user:route`. Return
`429` with `Retry-After` and `X-RateLimit-*` headers. Trade-offs: Redis
is a single point (use cluster, fail open vs fail closed per endpoint),
clock skew (use Redis time), local pre-limiters to reduce round trips.
Also support tiered limits and rules in config.

**Design 5: Chat / Messaging System.** Clients hold WebSocket
connections to stateless gateway nodes; a presence/session registry
(Redis) maps `userId → gateway`. Sending: gateway → message service
assigns a sequence ID per conversation, persists (wide-column store,
partitioned by `conversationId`, clustered by time) and publishes to
Kafka/Pub/Sub; delivery workers look up the recipient's gateway and
push, or store for offline push notification. Guarantees: at-least-once
with client acks and dedupe by message ID; ordering per conversation via
the partition key. Scale: shard by conversation, fan-out on write for
small groups and on read for large channels, media in object storage +
CDN, end-to-end encryption optional. Discuss read receipts, typing
indicators (ephemeral, not persisted), and retention.

**Design 6: Payments Ledger.** Use **double-entry bookkeeping**: every
transfer writes balanced debit/credit entries in one ACID transaction;
entries are immutable and balances are derived (or a materialised
snapshot). Requests carry an idempotency key with a unique constraint.
Concurrency via optimistic version on accounts or serialised writes per
account (partition by account). Integrate with PSPs asynchronously:
state machine (INITIATED → PENDING → SETTLED/FAILED), webhooks verified
by signature, a **reconciliation job** matching PSP files against the
ledger and alerting on mismatches. Use outbox for events, audit logs,
encryption of PII, PCI scope reduction through tokenisation. Mention
rounding rules (minor units as `long`) and multi-currency.

---

### U. Harder Coding Programs

#### 1. Bounded blocking queue from scratch

**Derive the approach:** represent capacity with a circular array and
protect head, tail and count together. Producers wait for not-full;
consumers wait for not-empty.

**Why this, not the alternatives:** two conditions target the relevant
waiter class. One monitor plus `notifyAll` can also work but wakes more
threads. A linked queue allocates nodes; a circular array gives a fixed
storage bound. Use the standard library outside the learning exercise
unless special behavior is required.

**What changes:** zero capacity is not a rendezvous queue in this
implementation; reject it. Replacing `while` with `if` breaks predicate
rechecking after wakeups. Leaving removed references in the array
retains objects unnecessarily. Fair locks can reduce starvation risk but
may reduce throughput; fairness is not FIFO completion of arbitrary
caller work.

**Trace and checks:** capacity two; put A/B, take A, put C wraps tail,
then take B/C. Test multiple producers/consumers, interruption on both
conditions, null policy and full/empty waits. O(1) operations excluding
waiting, O(capacity) storage.

**Strong answer signal:** state `0 <= count <= capacity` and preserve it
through every transition.

```java
class BoundedQueue<T> {
    private final Object[] items; private int head, tail, count;
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition(), notEmpty = lock.newCondition();
    BoundedQueue(int capacity) {
        if (capacity < 1) throw new IllegalArgumentException("capacity must be positive");
        items = new Object[capacity];
    }

    void put(T t) throws InterruptedException {
        Objects.requireNonNull(t);
        lock.lockInterruptibly();
        try {
            while (count == items.length) notFull.await();     // loop guards spurious wakeups
            items[tail] = t; tail = (tail + 1) % items.length; count++;
            notEmpty.signal();
        } finally { lock.unlock(); }
    }
    @SuppressWarnings("unchecked")
    T take() throws InterruptedException {
        lock.lockInterruptibly();
        try {
            while (count == 0) notEmpty.await();
            T t = (T) items[head]; items[head] = null; head = (head + 1) % items.length; count--;
            notFull.signal(); return t;
        } finally { lock.unlock(); }
    }
}
```

*Say:* two conditions avoid waking the wrong waiters; this is what
`ArrayBlockingQueue` does.

#### 2. Sliding-window rate limiter (per key)

**Derive the approach:** an exact rolling-window contract requires
remembering accepted timestamps still inside the window. A deque makes
chronological expiry cheap; one lock protects purge/check/add as a unit.

**Why this, not the alternatives:** fixed windows permit boundary
bursts; token buckets intentionally allow configured bursts; approximate
counters use less state but relax accuracy. `ConcurrentHashMap` protects
lookup, not the mutable deque stored inside it.

**What changes:** read time inside the lock so timestamps remain
ordered. `>= window` expiry defines the boundary explicitly. Naively
removing an idle key while another caller still holds its deque can
create two independent counters. Multiple instances require coordinated
state or a documented approximation.

**Trace and checks:** limit two, timestamps 0 and 1; at exactly
window-length after 0, its slot expires under this policy. Test
simultaneous callers and an injectable clock. A call may purge O(limit)
entries, but each accepted timestamp is removed once; state is O(active
retained keys × limit), unbounded in the current key-retention sketch.

**Strong answer signal:** explain both per-key atomicity and
key-lifecycle races.

```java
class SlidingWindowLimiter {
    private final int limit; private final long windowNanos;
    private final ConcurrentHashMap<String, Deque<Long>> hits = new ConcurrentHashMap<>();
    SlidingWindowLimiter(int limit, Duration window) {
        if (limit < 1 || window.isZero() || window.isNegative())
            throw new IllegalArgumentException("positive limit and window required");
        this.limit = limit;
        this.windowNanos = window.toNanos();
    }

    boolean allow(String key) {
        Deque<Long> q = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (q) {
            long now = System.nanoTime(); // sample under the lock to preserve timestamp order
            while (!q.isEmpty() && now - q.peekFirst() >= windowNanos) q.pollFirst();
            if (q.size() < limit) { q.addLast(now); return true; }
            return false;
        }
    }
}
```

*Say:* this demonstration retains every key, so total memory is
unbounded as key count grows. Idle-key eviction must coordinate with
active users of the same deque; naïve removal can create two counters
for one key. Use a carefully bounded implementation for production.

#### 3. Build order with cycle detection (Kahn's topological sort)

**Derive the approach:** a module becomes buildable when all
prerequisites have completed. Track remaining prerequisite counts and
reverse edges to dependents; removing a ready node reduces those counts.

**Why this, not the alternatives:** repeatedly scanning for buildable
modules can become quadratic. DFS with visiting/visited colors is
equally valid and can expose a cycle path, but needs careful stack
handling. Kahn's method naturally exposes a set of ready jobs.

**What changes:** map iteration does not promise deterministic ordering
among multiple ready nodes. Use a priority queue if lexicographic order
is part of the contract, accepting O(V log V + E). Count duplicate edges
consistently or normalize them. Dependencies mentioned only as values
are still vertices.

**Trace and checks:** A depends on B and C: emit B/C in either allowed
order, then A. A↔B leaves both with nonzero indegree. Test empty graph,
disconnected graph, self-cycle and missing map keys. O(V + E) time and
space.

**Strong answer signal:** derive why emitting fewer than V vertices
proves a remaining cycle.

Relevant to Maven reactor ordering or task dependencies.

```java
List<String> buildOrder(Map<String, List<String>> deps) {   // module -> modules it depends on
    Map<String, Integer> indeg = new HashMap<>();
    Map<String, List<String>> dependents = new HashMap<>();
    deps.forEach((m, ds) -> { indeg.putIfAbsent(m, 0);
        for (String d : ds) { indeg.putIfAbsent(d, 0); indeg.merge(m, 1, Integer::sum);
                              dependents.computeIfAbsent(d, k -> new ArrayList<>()).add(m); } });
    Deque<String> ready = new ArrayDeque<>();
    indeg.forEach((m, n) -> { if (n == 0) ready.add(m); });
    List<String> order = new ArrayList<>();
    while (!ready.isEmpty()) {
        String m = ready.poll(); order.add(m);
        for (String next : dependents.getOrDefault(m, List.of()))
            if (indeg.merge(next, -1, Integer::sum) == 0) ready.add(next);
    }
    if (order.size() != indeg.size()) throw new IllegalStateException("Cyclic dependency");
    return order;
}
```

*Complexity:* O(V + E). If `order.size() < V` there is a cycle, which is
exactly how Maven reports "The projects in the reactor contain a cyclic
reference".

#### 4. Search in a rotated sorted array (O(log n))

**Derive the approach:** with distinct values, at least one half around
the midpoint is sorted. Decide whether the target lies in that half's
value range, then discard the other half.

**Why this, not the alternatives:** a linear scan is correct but O(n).
Finding the rotation pivot then binary searching is also O(log n), with
extra boundary logic. Sorting would destroy original indices and cost
O(n log n).

**What changes:** duplicates can hide which half is sorted; shrinking
ambiguous equal endpoints can degrade to O(n). If the input is not a
rotation of a sorted sequence, the elimination proof no longer holds.
Return original index, not insertion position.

**Trace and checks:** `[4,5,6,1,2,3]`, target 2: identify the sorted
left half, exclude it, then find 2 on the right. Test no rotation, one
element, absent target and pivot at an endpoint. O(log n) time, O(1)
extra space for distinct values.

**Strong answer signal:** justify the discarded half and name the
distinctness assumption.

```java
int search(int[] a, int target) {
    int lo = 0, hi = a.length - 1;
    while (lo <= hi) {
        int mid = (lo + hi) >>> 1;
        if (a[mid] == target) return mid;
        if (a[lo] <= a[mid]) {                                   // left half sorted
            if (a[lo] <= target && target < a[mid]) hi = mid - 1; else lo = mid + 1;
        } else {                                                 // right half sorted
            if (a[mid] < target && target <= a[hi]) lo = mid + 1; else hi = mid - 1;
        }
    }
    return -1;
}
```

*Say:* this search assumes distinct values. With duplicates, choosing a
sorted half may be ambiguous and worst-case search can become O(n). For
nonnegative array indices, the unsigned-shift midpoint is valid;
`lo + (hi - lo) / 2` is easier to explain.

#### 5. Find the K-th largest element (quickselect idea vs heap)

**Derive the approach:** retain the k greatest values seen so far in a
min-heap. Its smallest retained value is the kth greatest at each
prefix.

**Why this, not the alternatives:** full sorting is simpler for one
small static input or if full order is needed. Quickselect gives
expected O(n) selection with mutation and pivot considerations. A size-k
heap gives O(n log k) work and fits streaming input without retaining
all n values.

**What changes:** duplicates count toward rank unless “distinct kth” is
explicitly requested. A max-heap of all elements needs O(n) state. For k
near n, selecting the smaller complementary rank may save space when n
is known. Invalid k must fail predictably.

**Trace and checks:** stream 7, 2, 9, 5 with k=2 ends with 7 and 9;
return 7. Test ties, k=1, k=n and negative numbers. O(k) retained state.

**Strong answer signal:** choose based on streaming, mutation and output
requirements rather than declaring one universal fastest method.

```java
int kthLargest(int[] nums, int k) {
    if (k < 1 || k > nums.length) throw new IllegalArgumentException("invalid k");
    PriorityQueue<Integer> minHeap = new PriorityQueue<>(k);
    for (int n : nums) { minHeap.offer(n); if (minHeap.size() > k) minHeap.poll(); }
    return minHeap.peek();                                       // O(n log k), O(k) space
}
```

*Say:* quickselect averages O(n) but O(n²) worst case; the heap works
for streams too.

---

### How to Run the Final 48 Hours

- **Day -2:** read Section R aloud, redo 3 coding programs from memory
  on paper.
- **Day -1:** one 45-minute system design against a timer, rehearse 5
  STAR stories, review your resume project by project (be ready to
  defend every line).
- **Interview day:** clarify requirements first, think aloud, state
  trade-offs, test your code with edge cases (null, empty, duplicates,
  large input), and ask thoughtful questions at the end.

---

<!-- ===== Part 7: Question Bank Vol. 6 (Kubernetes, Terraform, APIs, Leadership, Mock Interview) ===== -->

<a id="senior-java-question-bank-vol-6"></a>
<a id="part-7"></a>
## Part 07 - Question Bank Vol. 6 - Kubernetes, Terraform, APIs and leadership

**Kubernetes in Depth · Terraform · gRPC/GraphQL · Architecture &
Leadership · Mock Interview Script** (Q99-Q122)

---

### V. Kubernetes in Depth

#### Q99. What happens when you run `kubectl apply -f deployment.yaml`?

**Strong answer:**

`kubectl` sends the manifest to the **API server**, which authenticates,
authorises (RBAC), runs admission controllers and persists desired state
in **etcd**. The **Deployment controller** (in controller-manager)
creates a ReplicaSet, which creates Pod objects. The **scheduler**
assigns each unscheduled Pod to a node (resources, affinity, taints).
The node's **kubelet** sees the assignment, asks the container runtime
to pull the image and start containers, wires volumes/secrets, runs
probes and reports status. **kube-proxy**/CNI program networking so the
Service routes to ready Pods. Everything works by *reconciling desired
vs actual state*, so the answer shows you understand controllers, not
just commands.


#### Key terms you should know

- **Deployment**  -  A Kubernetes controller that manages replicated Pods
  and supports controlled rollout of new versions.
- **Pod**  -  Kubernetes' smallest deployable unit, containing one or more
  containers that share networking and storage context.
- **proxy**  -  An object that wraps another object and intercepts method
  calls, commonly used by Spring for transactions, security and AOP.
- **Service**  -  A stable Kubernetes networking abstraction that exposes
  a group of Pods behind a stable endpoint.


#### 30-second version

> `kubectl` sends the manifest to the **API server**, which
> authenticates, authorises (RBAC), runs admission controllers and
> persists desired state in **etcd**. The **Deployment controller** (in
> controller-manager) creates a ReplicaSet, which creates Pod objects.

#### Q100. How do requests, limits and QoS classes affect a Java service?

**Strong answer:** requests inform scheduling and CPU shares; limits constrain resources. CPU limits can throttle execution, while memory pressure at the container limit can trigger an OOM kill. In the conventional per-container QoS model, Guaranteed requires nonzero CPU and memory requests and limits, equal for each resource, for every container. Setting only memory request equal to memory limit is insufficient. Burstable and BestEffort have different criteria; eviction also considers usage, priority and node pressure.

Measure heap plus native memory and account for all containers. Choose CPU limits according to platform policy and latency evidence. Verify any pod-level resource or newer feature behavior against the cluster version.

[Kubernetes QoS criteria](https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/).

#### Q101. HPA vs VPA vs Cluster Autoscaler: how do you scale?

**Strong answer:**

**HPA** adds/removes Pod replicas from CPU, memory or custom metrics
(requests per second, Kafka lag via KEDA). **VPA** recommends or applies per-Pod resource requests according to its
update mode. Some modes evict/recreate Pods; newer supported clusters can
apply some changes in place and fall back to recreation. Avoid having VPA
and HPA independently control the same metric without an explicit policy. **Cluster Autoscaler** (or GKE Autopilot) adds nodes when
Pods are unschedulable. Java specifics: scale-up lag from JVM warm-up,
so set sensible stabilisation windows, min replicas, readiness only
after warm-up, and HPA stabilization/minimum replicas to manage replica scale-down. A PDB
constrains voluntary evictions through the Eviction API, such as node drains;
it does not block a Deployment or HPA from reducing desired replicas.


#### Key terms you should know

- **GKE**  -  Google Kubernetes Engine, Google's managed Kubernetes
  service.
- **Pod**  -  Kubernetes' smallest deployable unit, containing one or more
  containers that share networking and storage context.


#### 30-second version

> **HPA** adds/removes Pod replicas from CPU, memory or custom metrics
> (requests per second, Kafka lag via KEDA). **VPA** adjusts requests
> per Pod (restarts them; good for right-sizing, don't combine with HPA
> on the same metric).

#### Q102. How does Kubernetes networking work (Service types, Ingress, NetworkPolicy)?

**Strong answer:**

Every Pod gets its own IP (flat network via the CNI plugin). A
**Service** gives a stable virtual IP/DNS name
(`svc.namespace.svc.cluster.local`) load-balancing across ready Pods:
`ClusterIP` (internal), `NodePort`, `LoadBalancer` (cloud LB),
`Headless` (direct Pod IPs for StatefulSets). **Ingress/Gateway API**
provides L7 routing, TLS and host/path rules. **NetworkPolicy** is
default-allow until you add rules; adopt default-deny plus explicit
allows. Mention DNS caching and `ndots` as a classic source of latency.


#### Key terms you should know

- **plugin**  -  A Maven component that provides build functionality such
  as compilation, testing or packaging.
- **Pod**  -  Kubernetes' smallest deployable unit, containing one or more
  containers that share networking and storage context.
- **Service**  -  A stable Kubernetes networking abstraction that exposes
  a group of Pods behind a stable endpoint.


#### 30-second version

> Every Pod gets its own IP (flat network via the CNI plugin). A
> **Service** gives a stable virtual IP/DNS name
> (`svc.namespace.svc.cluster.local`) load-balancing across ready Pods:
> `ClusterIP` (internal), `NodePort`, `LoadBalancer` (cloud LB),
> `Headless` (direct Pod IPs for StatefulSets).

#### Q103. Deployment vs StatefulSet, and how does storage work?

**Strong answer:**

Deployments suit stateless, interchangeable Pods. **StatefulSets** give
stable identities (`app-0`), ordered rollout, stable network names via a
headless Service and a per-replica **PersistentVolumeClaim**, which
databases, Kafka and Zookeeper need. Storage: a PVC requests capacity
from a StorageClass that dynamically provisions a PV (a persistent
disk). Prefer managed databases (Cloud SQL) over running them in-cluster
unless there is a strong reason.


#### Key terms you should know

- **Service**  -  A stable Kubernetes networking abstraction that exposes
  a group of Pods behind a stable endpoint.


#### 30-second version

> Deployments suit stateless, interchangeable Pods. **StatefulSets**
> give stable identities (`app-0`), ordered rollout, stable network
> names via a headless Service and a per-replica
> **PersistentVolumeClaim**, which databases, Kafka and Zookeeper need.

#### Q104. How do you do safe rollouts and keep availability during node maintenance?

**Strong answer:**

Rolling update with `maxUnavailable: 0, maxSurge: 25%`, accurate
readiness probes, `preStop` sleep plus graceful shutdown,
**PodDisruptionBudget** (e.g., `minAvailable: 2`) so drains don't evict
too many Pods, anti-affinity/topology spread constraints to distribute
replicas across zones, and canary or progressive delivery (Argo
Rollouts, Cloud Deploy) with automated rollback on SLO breach. Rollback
with `kubectl rollout undo`.


#### Key terms you should know

- **SLO**  -  Service Level Objective: a measurable reliability target,
  such as 99.9% successful requests.


#### 30-second version

> Rolling update with `maxUnavailable: 0, maxSurge: 25%`, accurate
> readiness probes, `preStop` sleep plus graceful shutdown,
> **PodDisruptionBudget** (e.g., `minAvailable: 2`) so drains don't
> evict too many Pods, anti-affinity/topology spread constraints to
> distribute replicas across zones, and canary or progressive delivery
> (Argo Rollouts, Cloud Deploy) with automated rollback on SLO breach.
> Rollback with `kubectl rollout undo`.

#### Q105. Helm vs Kustomize, and how do you manage config and secrets?

**Strong answer:**

Helm templates charts with values and versioned releases (good for
packaging and third-party apps; templating can get unreadable).
Kustomize overlays plain YAML per environment with patches (no
templating, built into `kubectl`). Config via ConfigMaps (mounted files
or env), secrets via the cloud secret manager with the CSI driver or
External Secrets Operator rather than committing base64 Secrets to Git.
Use GitOps (Argo CD/Config Sync) so Git is the source of truth and drift
is reverted.


#### Key terms you should know

- **Helm**  -  A tool for packaging, templating and managing Kubernetes application releases.
- **Kustomize**  -  A tool for composing Kubernetes manifests using overlays and patches.
- **GitOps drift**  -  A difference between declared state in Git and the running environment.


#### 30-second version

> Helm templates charts with values and versioned releases (good for
> packaging and third-party apps; templating can get unreadable).
> Kustomize overlays plain YAML per environment with patches (no
> templating, built into `kubectl`).

---

### W. Terraform / Infrastructure as Code

#### Q106. How does Terraform state work and why is the backend important?

**Strong answer:**

Terraform maps your configuration to real resources through a **state
file**. Keep it in a **remote backend** (GCS bucket with versioning)
with **state locking** so concurrent applies don't corrupt it, restrict
access (state may contain secrets), and never edit by hand (use
`terraform state mv/rm`, `import`). Separate state per
environment/component to reduce blast radius.


#### Key terms you should know

- **bucket**  -  One position in a hash table's internal array where
  entries can be stored.
- **Terraform state**  -  Terraform's record of resources it manages and
  the mapping between configuration and real infrastructure.


#### 30-second version

> Terraform maps your configuration to real resources through a **state
> file**. Keep it in a **remote backend** (GCS bucket with versioning)
> with **state locking** so concurrent applies don't corrupt it,
> restrict access (state may contain secrets), and never edit by hand
> (use `terraform state mv/rm`, `import`).

#### Q107. Explain plan/apply, drift, modules and workspaces.

**Strong answer:**

`terraform plan` diffs desired config vs state vs reality, `apply`
executes it; review plans in PRs. **Drift** (manual console changes)
shows up in the plan; fix by reverting or importing. **Modules** package
reusable, parameterised infrastructure (a "cloud-run-service" module)
with versioned sources. Workspaces help with similar environments, but
many teams prefer separate directories/state per environment for clearer
isolation. Use `prevent_destroy` on critical resources and
`lifecycle.ignore_changes` sparingly.


#### Key terms you should know

- **drift**  -  A difference between infrastructure declared in Terraform
  and infrastructure that actually exists.
- **Service**  -  An application or platform capability exposed through a
  defined interface; a Kubernetes Service is a specific networking resource.


#### 30-second version

> `terraform plan` diffs desired config vs state vs reality, `apply`
> executes it; review plans in PRs. **Drift** (manual console changes)
> shows up in the plan; fix by reverting or importing.

#### Q108. How do you run IaC in CI/CD safely?

**Strong answer:**

PR → `fmt`/`validate`/`tflint`/policy checks (OPA/Sentinel, Checkov) →
`plan` posted to the PR → human approval → `apply` from a pipeline using
a least-privilege service account with Workload Identity Federation (no
long-lived keys). Pin provider and module versions, keep secrets in
Secret Manager (not variables files), tag/label resources for cost, and
protect the main branch.


#### Key terms you should know

- **Plan**  -  Terraform output describing proposed infrastructure changes.
- **State locking**  -  Coordination that prevents concurrent writers to the same supported state backend.
- **Workload identity federation**  -  Exchanging trusted workload identity for cloud access without a long-lived service-account key.


#### 30-second version

> PR → `fmt`/`validate`/`tflint`/policy checks (OPA/Sentinel, Checkov) →
> `plan` posted to the PR → human approval → `apply` from a pipeline
> using a least-privilege service account with Workload Identity
> Federation (no long-lived keys). Pin provider and module versions,
> keep secrets in Secret Manager (not variables files), tag/label
> resources for cost, and protect the main branch.

---

### X. gRPC, GraphQL & API Styles

#### Q109. When and how do you use gRPC?

**Strong answer:**

gRPC uses HTTP/2 and Protobuf (compact binary, schema-first, generated
clients) and supports four call types: unary, server streaming, client
streaming and bidirectional streaming. Strengths: low latency, strict
contracts, multiplexing, built-in deadlines/cancellation. Practices:
always set **deadlines**, propagate them downstream, use status codes,
evolve schemas by only adding fields with new numbers (never reuse or
renumber), use client-side load balancing or a mesh because long-lived
HTTP/2 connections defeat L4 load balancers, and add interceptors for
auth, tracing and metrics. Weaknesses: poor browser support (needs
gRPC-Web), harder debugging.


#### Key terms you should know

- **gRPC**  -  A high-performance RPC framework commonly using HTTP/2 and
  Protocol Buffers for service-to-service communication.


#### 30-second version

> gRPC uses HTTP/2 and Protobuf (compact binary, schema-first, generated
> clients) and supports four call types: unary, server streaming, client
> streaming and bidirectional streaming. Strengths: low latency, strict
> contracts, multiplexing, built-in deadlines/cancellation.

#### Q110. GraphQL vs REST: trade-offs and pitfalls?

**Strong answer:**

GraphQL lets clients select fields through a typed schema, useful for
different front-end data needs. It can reduce client round trips while
still causing excessive backend work. Batch resolver loads with
DataLoader; enforce authorization at the relevant object/field boundary,
query complexity/depth limits, timeouts and appropriate pagination.

HTTP POST supports query and mutation operations; servers may also
support GET for queries. GET queries can support HTTP/CDN caching, and
persisted query identifiers can keep URLs manageable. Cache keys must
account for the operation, variables and relevant authorization context.
Mutations must not execute through GET. HTTP status depends on the error
stage and negotiated response format; execution errors may appear in an
HTTP 200 response, but not every failure is a 200.

REST can be simpler for resource-oriented, cache-friendly public APIs.
In Spring for GraphQL, know `@QueryMapping` and `@BatchMapping` and the
server's enabled transports.

#### How to understand it

One GraphQL endpoint does not imply one HTTP method or one cache
entry. A public product query and a user-specific account query need
different caching policies. Selecting fewer response fields also does
not guarantee fewer database queries without resolver design.

#### Key terms you should know

- **Resolver**  -  Code that obtains a requested field value.
- **DataLoader**  -  A facility for batching and caching related loads within its configured scope.
- **Persisted query**  -  A stored query identified by an agreed identifier.

#### SDE-3 interview checkpoints

- Test query GET support and reject mutations over GET.
- Verify resolver query counts and authorization-aware caching.
- Distinguish request/validation failures from field execution errors.

#### 30-second version

> GraphQL offers flexible field selection but needs resolver batching,
> authorization and query-cost controls. It is not POST-only: supported GET
> queries can use HTTP caching, while mutations use POST. Cache keys and error
> handling must follow the actual operation and transport contract.

[GraphQL over HTTP](https://graphql.org/learn/serving-over-http/).

#### Q111. WebSocket vs SSE vs long polling vs webhooks?

**Strong answer:**

Long polling: simple fallback, high overhead. **SSE**: one-way server →
client over HTTP, auto-reconnect, great for notifications/feeds.
**WebSocket**: full-duplex, for chat/collaboration, needs sticky-less
design with a pub/sub backplane and heartbeat handling. **Webhooks**:
server-to-server callbacks; require signature verification, retries,
idempotency and replay protection.


#### Key terms you should know

- **idempotency**  -  The property that repeating the same logical request
  produces the same intended outcome rather than creating duplicate
  effects.
- **Pub/Sub**  -  Google Cloud's asynchronous messaging service for
  publishing messages to topics and delivering them to subscriptions.


#### 30-second version

> Long polling: simple fallback, high overhead. **SSE**: one-way server
> → client over HTTP, auto-reconnect, great for notifications/feeds.

#### Q112. What is contract-first API design?

**Strong answer:**

Write the **OpenAPI** (or Protobuf) spec first, review it with
consumers, then generate server stubs/clients and validate
requests/responses against it, so docs never drift. Add linting
(Spectral), mock servers for parallel front-end work, and
consumer-driven contract tests (Pact/Spring Cloud Contract) in CI to
catch breaking changes before release.


#### Key terms you should know

- **API contract**  -  An agreed description of requests, responses and observable behavior.
- **Contract drift**  -  A mismatch between an API specification and its implementation or consumer expectations.
- **Consumer-driven contract test**  -  A test checking a provider against interactions required by a consumer.


#### 30-second version

> Write the **OpenAPI** (or Protobuf) spec first, review it with
> consumers, then generate server stubs/clients and validate
> requests/responses against it, so docs never drift. Add linting
> (Spectral), mock servers for parallel front-end work, and
> consumer-driven contract tests (Pact/Spring Cloud Contract) in CI to
> catch breaking changes before release.

---

### Y. Architecture & Leadership

#### Q113. What are the pitfalls of event-driven architecture?

**Strong answer:**

Hard-to-follow flows (no single place shows the process: need tracing
and an event catalogue), eventual consistency surprises,
duplicate/out-of-order events, schema evolution, poison messages,
accidental coupling through event contents, and debugging complexity.
Mitigate with clear event ownership, versioned schemas in a registry,
idempotent consumers, DLQs with replay tooling, correlation IDs, and
choosing events for facts ("OrderPlaced") rather than commands.


#### 30-second version

> Hard-to-follow flows (no single place shows the process: need tracing
> and an event catalogue), eventual consistency surprises,
> duplicate/out-of-order events, schema evolution, poison messages,
> accidental coupling through event contents, and debugging complexity.
> Mitigate with clear event ownership, versioned schemas in a registry,
> idempotent consumers, DLQs with replay tooling, correlation IDs, and
> choosing events for facts ("OrderPlaced") rather than commands.

#### Q114. Outbox vs CDC vs dual writes: what is the difference?

**Strong answer:**

**Dual write** (save to DB then publish) can lose or duplicate events if
one fails: avoid. **Transactional outbox**: write the event to an
`outbox` table in the same transaction as the business data; a
poller/relay publishes and marks it sent (at-least-once). **CDC**
(Debezium) tails the DB log and publishes outbox rows (or table changes)
without polling load. Consumers must be idempotent either way; clean the
outbox periodically.


#### Key terms you should know

- **CDC**  -  Change Data Capture: publishing database changes by reading
  the database's change log or transaction log.
- **dual write**  -  Writing related state to two independent systems in
  one application operation, which can become inconsistent if one write
  succeeds and the other fails.
- **outbox**  -  A database table used to store events in the same
  transaction as business data so publication can happen reliably
  afterward.
- **transaction**  -  A unit of database work treated as one logical
  operation with defined commit/rollback behavior.


#### 30-second version

> **Dual write** (save to DB then publish) can lose or duplicate events
> if one fails: avoid. **Transactional outbox**: write the event to an
> `outbox` table in the same transaction as the business data; a
> poller/relay publishes and marks it sent (at-least-once).

#### Q115. Explain DDD essentials you actually apply.

**Strong answer:**

**Ubiquitous language** shared with the business, **bounded contexts**
(each model valid in its own boundary, which become service boundaries),
**aggregates** (consistency boundary with a root that enforces
invariants; one transaction per aggregate; reference other aggregates by
ID), entities vs value objects, domain events, and an anti-corruption
layer when integrating with legacy models. Warn against anemic models
and over-engineering simple CRUD.


#### Key terms you should know

- **Service**  -  An application or platform capability exposed through a
  defined interface; a Kubernetes Service is a specific networking resource.
- **transaction**  -  A unit of database work treated as one logical
  operation with defined commit/rollback behavior.


#### 30-second version

> **Ubiquitous language** shared with the business, **bounded contexts**
> (each model valid in its own boundary, which become service
> boundaries), **aggregates** (consistency boundary with a root that
> enforces invariants; one transaction per aggregate; reference other
> aggregates by ID), entities vs value objects, domain events, and an
> anti-corruption layer when integrating with legacy models. Warn
> against anemic models and over-engineering simple CRUD.

#### Q116. What is hexagonal (ports & adapters) architecture?

**Strong answer:**

The domain core depends on nothing; it exposes **ports** (interfaces)
and the outside world connects via **adapters** (REST controller, JPA
repository, Kafka publisher). Dependencies point inward, so you can test
business logic without frameworks, swap infrastructure, and enforce
rules with ArchUnit. In Spring: `domain` and `application` packages free
of Spring annotations where practical, with adapters in
`infrastructure`.


#### 30-second version

> The domain core depends on nothing; it exposes **ports** (interfaces)
> and the outside world connects via **adapters** (REST controller, JPA
> repository, Kafka publisher). Dependencies point inward, so you can
> test business logic without frameworks, swap infrastructure, and
> enforce rules with ArchUnit.

#### Q117. How do you scale a read-heavy system?

**Strong answer:**

In order of cost: optimise queries and indexes → add caching layers
(CDN, application cache, Redis) → read replicas (account for replication
lag; route read-your-writes to the primary) → CQRS read models →
partition/shard data (choose a key that avoids hotspots; cross-shard
joins and transactions become hard) → precompute. State the trade-off at
each step and measure before moving up.


#### 30-second version

> In order of cost: optimise queries and indexes → add caching layers
> (CDN, application cache, Redis) → read replicas (account for
> replication lag; route read-your-writes to the primary) → CQRS read
> models → partition/shard data (choose a key that avoids hotspots;
> cross-shard joins and transactions become hard) → precompute. State
> the trade-off at each step and measure before moving up.

#### Q118. How do you do back-of-the-envelope capacity estimates?

**Strong answer:**

Example: 10M DAU × 20 requests/day = 200M/day ≈ 2.3k req/s average, ×3-5
for peak ≈ 10k req/s. Storage: 1 KB/record × 100M/day ≈ 100 GB/day ≈ 36
TB/year before replication. Bandwidth: 10k req/s × 10 KB ≈ 100 MB/s. Use
round numbers, state assumptions, and derive node counts from per-node
throughput. Interviewers want structured reasoning, not exact figures.


#### 30-second version

> Example: 10M DAU × 20 requests/day = 200M/day ≈ 2.3k req/s average,
> ×3-5 for peak ≈ 10k req/s. Storage: 1 KB/record × 100M/day ≈ 100
> GB/day ≈ 36 TB/year before replication.

#### Q119. Explain SLOs, error budgets and incident severity.

**Strong answer:**

Define the denominator first. A request-based 99.9% SLO permits 0.1% bad
eligible requests; at ten million requests that is 10,000 bad requests.
A time-based 99.9% availability SLO permits 43.2 minutes in a 30-day
window. These are not interchangeable when traffic varies. Define
success, latency thresholds, exclusions and measurement windows, then
use burn-rate alerts and a documented response policy. Incident severity
follows customer impact, not a single infrastructure metric. [Google SRE
workbook](https://sre.google/workbook/implementing-slos/).


#### Key terms you should know

- **SLO**  -  Service Level Objective: a measurable reliability target,
  such as 99.9% successful requests.


#### 30-second version

> Define the denominator first. A request-based 99.9% SLO permits 0.1%
> bad eligible requests; at ten million requests that is 10,000 bad
> requests.

#### Q120. How do you lead and mentor as a senior engineer?

**Strong answer:**

Set direction through design docs/ADRs, review for learning not
gatekeeping, pair on hard problems, delegate with clear context and
ownership, grow others by giving stretch tasks and feedback, and raise
the bar through shared standards and automation. Measure impact through
team outcomes (lead time, change failure rate, onboarding time) rather
than personal output. Have a concrete mentoring example with a result.


#### 30-second version

> Set direction through design docs/ADRs, review for learning not
> gatekeeping, pair on hard problems, delegate with clear context and
> ownership, grow others by giving stretch tasks and feedback, and raise
> the bar through shared standards and automation. Measure impact
> through team outcomes (lead time, change failure rate, onboarding
> time) rather than personal output.

#### Q121. Tell me about a time you made a wrong technical decision.

**Strong answer:**

Pick a real, moderately significant mistake: what you decided and why it
seemed right, the signal that showed it was wrong (metric/incident), how
you owned it, how you corrected course (rollback, migration plan), and
the **process change** afterward (ADR with revisit date, load test,
spike). Seniors are valued for learning speed and honesty, not
perfection.


#### 30-second version

> Pick a real, moderately significant mistake: what you decided and why
> it seemed right, the signal that showed it was wrong
> (metric/incident), how you owned it, how you corrected course
> (rollback, migration plan), and the **process change** afterward (ADR
> with revisit date, load test, spike). Seniors are valued for learning
> speed and honesty, not perfection.

#### Q122. Why do you want to leave your current company / why this role?

**Strong answer:**

Be positive and forward-looking: what you have achieved there and what
you want next (larger scale, domain, ownership, cloud-native
architecture), tied to something specific about the new company you
researched. Never criticise your employer.


#### Key terms you should know

- **Role fit**  -  How the position matches the responsibilities and growth you seek.
- **Evidence**  -  Specific examples supporting your reasons for the move.


#### 30-second version

> Be positive and forward-looking: what you have achieved there and what
> you want next (larger scale, domain, ownership, cloud-native
> architecture), tied to something specific about the new company you
> researched. Never criticise your employer.

---

### Z. Config "Programs" Interviewers Ask You to Write

#### Kubernetes Deployment with probes and graceful shutdown

**Derive the approach:** startup, routing readiness and unrecoverable
liveness are different states. Give each its own probe, reserve
resources and allow draining before termination.

**Why this, not the alternatives:** one liveness check for slow startup
can cause repeated restarts; restarting on a downstream outage can
amplify that outage. An immediate kill loses in-flight work. A fixed
preStop delay is only a simple allowance for routing propagation, not
proof that traffic has drained.

**What changes:** the preStop delay consumes part of the termination
grace period; keep enough remaining budget for application shutdown. The
sample exec hook requires `sleep` in the image, which a distroless image
may lack. The sample omits CPU limits, so memory request=limit alone
does not imply Guaranteed QoS. Set limits from measured behavior and
platform policy.

**Trace and checks:** simulate a slow startup, readiness failure and
SIGTERM during an active request. Verify actual probe paths/security,
image commands and total shutdown time. This is an operational exercise;
judge capacity and failure behavior rather than Big O.

**Strong answer signal:** connect every setting to an observable
lifecycle transition.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: orders }
spec:
  replicas: 3
  strategy: { rollingUpdate: { maxUnavailable: 0, maxSurge: 25% } }
  selector: { matchLabels: { app: orders } }
  template:
    metadata: { labels: { app: orders } }
    spec:
      terminationGracePeriodSeconds: 40
      containers:
      - name: orders
        image: europe-docker.pkg.dev/proj/repo/orders:1.4.2
        ports: [{ containerPort: 8080 }]
        env: [{ name: JAVA_TOOL_OPTIONS, value: "-XX:MaxRAMPercentage=70" }]
        resources: { requests: { cpu: 500m, memory: 1Gi }, limits: { memory: 1Gi } }
        startupProbe:   { httpGet: { path: /actuator/health/liveness,  port: 8080 }, failureThreshold: 30, periodSeconds: 2 }
        readinessProbe: { httpGet: { path: /actuator/health/readiness, port: 8080 }, periodSeconds: 5 }
        livenessProbe:  { httpGet: { path: /actuator/health/liveness,  port: 8080 }, periodSeconds: 10 }
        lifecycle: { preStop: { exec: { command: ["sleep", "10"] } } }
```

#### Terraform: Cloud Run service with a dedicated service account

**Derive the approach:** declare a reproducible service resource and
bind it to a workload identity with explicitly granted permissions. The
resource definition makes desired deployment state reviewable.

**Why this, not the alternatives:** console changes are quick but harder
to reproduce and audit. A shared broad-privilege identity increases
blast radius. Creating a dedicated service account alone grants no
application permissions; add only required IAM bindings separately.

**What changes:** maximum instances influence cost and downstream
capacity, but do not replace application concurrency controls. Secrets
should be referenced from a secret store. Remote Terraform state needs
access control and locking. The snippet assumes project/provider setup,
deployment permissions and service enablement already exist.

**Trace and checks:** inspect a plan, apply in a nonproduction project,
then check runtime identity and access to one allowed and one denied
resource. Never interpret successful parsing as proof of working IAM.
Consider warm-instance cost and rollout behavior rather than algorithmic
complexity.

**Strong answer signal:** separate resource creation, deployment
identity and runtime permissions.

```hcl
resource "google_service_account" "orders" { account_id = "orders-runtime" }

resource "google_cloud_run_v2_service" "orders" {
  name     = "orders"
  location = "europe-west1"
  template {
    service_account = google_service_account.orders.email
    scaling {
      min_instance_count = 1
      max_instance_count = 20
    }
    containers {
      image = "europe-docker.pkg.dev/proj/repo/orders:1.4.2"
      resources { limits = { cpu = "1", memory = "1Gi" } }
    }
  }
}
```

#### Protobuf contract (additive evolution rules)

**Derive the approach:** messages need a stable wire identity
independent of source field ordering. Assign durable field numbers and
reserve removed numbers before later schema changes.

**Why this, not the alternatives:** JSON is easy to inspect and may be
sufficient; Protobuf gives compact typed contracts and code generation.
It introduces tooling and schema-evolution obligations. Generated types
do not eliminate domain validation.

**What changes:** reusing a field number can make an old payload mean
something different. Adding a field is not automatically behaviorally
safe if old clients require new semantics. Money needs currency and
units; an int64 total alone is incomplete. A scalar default zero may not
distinguish absence unless presence is modeled deliberately.

**Trace and checks:** encode with an old schema and decode with the new,
then reverse direction where supported. Test omitted fields, unknown
values and currency mismatch. Serialization cost scales with payload
size; compatibility is the main concern.

**Strong answer signal:** distinguish wire readability from business
compatibility.

```protobuf
syntax = "proto3";
service OrderService { rpc GetOrder (GetOrderRequest) returns (Order); }
message GetOrderRequest { string order_id = 1; }
message Order { string id = 1; string status = 2; int64 total_minor_units = 3; reserved 4; }
```

*Say:* never reuse field numbers (`reserved`), only add new fields,
money in minor units.

---

### AA. Mock Interview Script (with follow-ups)

**Round 1: Technical deep dive (45 min).**

1.  "Walk me through the architecture of your last project." →
    *Follow-ups:* Why microservices? How did you split data? What broke
    in production? What would you change?
2.  "How do you make a Spring service handle 5× traffic?" → profile
    first, DB/index, caching, pool sizing, horizontal scaling, async
    decoupling, load test.
3.  "A `@Transactional` method isn't rolling back." →
    proxy/self-invocation, checked exception, swallowed exception, wrong
    propagation, non-transactional datasource.
4.  Live coding: LRU cache or rate limiter → *Follow-ups:* thread
    safety, complexity, tests, distributed version.

**Round 2: System design (45 min).** "Design an order & payment platform
on GCP." Clarify requirements and scale → API and data model → services
and events (saga + outbox) → data stores → failure handling and
idempotency → security → observability → deployment on GKE/Cloud Run →
cost and trade-offs. *Probe:* "What if Pub/Sub delivers twice? If the
payment provider times out? If a region fails?"

**Round 3: Managerial/behavioural (30 min).** Production incident,
conflict with a colleague, mentoring a junior, delivering under a
deadline, a mistake you owned, biggest impact. Use STAR with metrics and
a "what I learned" close.

**Closing questions to ask:** "What does success look like in 6 months?"
"How are architecture decisions made?" "What's your on-call and incident
culture like?" "How do you handle tech debt?"

---

### Reminder

Depth beats breadth at 9+ years: for each technology on your resume, be
ready to explain *how it works internally, what went wrong, and what
you'd do differently.*

---

<!-- ===== Part 8: Question Bank Vol. 7 (Kafka Streams, WebFlux, Hardening, LeetCode, Google, Amazon) ===== -->

<a id="senior-java-question-bank-vol-7"></a>
<a id="part-8"></a>
## Part 08 - Question Bank Vol. 7 - Streams, WebFlux and interview practice

**Kafka Streams · WebFlux/Reactive · Security Hardening · LeetCode-Style
Coding · Google-Style Design · Amazon Leadership Principles**
(Q123-Q133)

---

### AB. Kafka Streams

#### Q123. KStream vs KTable vs GlobalKTable?

**Strong answer:**

A **KStream** is an unbounded sequence of independent events (every
record matters: clicks, payments). A **KTable** is a changelog view
where each key holds its *latest* value (updates replace, a null
tombstone deletes), such as the current customer profile. A
**GlobalKTable** is fully replicated to every instance, so you can join
a stream against it without co-partitioning (suitable only for small
reference data). The stream-table duality is the key idea: a table is a
stream of updates, and a stream can be aggregated into a table.


#### 30-second version

> A **KStream** is an unbounded sequence of independent events (every
> record matters: clicks, payments). A **KTable** is a changelog view
> where each key holds its *latest* value (updates replace, a null
> tombstone deletes), such as the current customer profile.

#### Q124. How does Kafka Streams manage state, scaling and fault tolerance?

**Strong answer:**

Stateful operations (aggregations, joins, windows) use local **state
stores** (RocksDB) backed by compacted **changelog topics**, so a
restarted or moved task restores its state. Parallelism equals the
number of input partitions (tasks), and instances in the same
`application.id` share them like a consumer group. Joins require
**co-partitioned** topics (same key and partition count); a key change marks the stream for possible repartitioning; a topic is created when a later key-dependent DSL operation requires records with the new key to be colocated. Processor API paths may need explicit `repartition()`. Use
`processing.guarantee=exactly_once_v2` for transactional
read-process-write inside Kafka, standby replicas for fast failover, and
monitor restore time and lag.


#### 30-second version

> Stateful operations (aggregations, joins, windows) use local **state
> stores** (RocksDB) backed by compacted **changelog topics**, so a
> restarted or moved task restores its state. Parallelism equals the
> number of input partitions (tasks), and instances in the same
> `application.id` share them like a consumer group.

#### Q125. Windowing and late data?

**Strong answer:**

Window types: *tumbling* (fixed, non-overlapping), *hopping* (fixed,
overlapping), *sliding*, and *session* (gaps of inactivity). Processing
uses **event time**; records that arrive after the window end are
handled by the **grace period**, after which they are dropped for window-close semantics. Use `Suppressed.untilWindowCloses(...)` with a strict buffer for final window results; `untilTimeLimit` has different behavior. Closure follows stream-time progress, so an idle input may not emit just because wall-clock time passes. Explain the trade-off: a
a longer grace allows more late events but delays final output and increases state/buffer needs. Test idle streams as well as late events.


#### Key terms you should know

- **Event time**  -  Time assigned to an event, as distinct from when the processor handles it.
- **Grace period**  -  The allowed lateness before a window closes under Kafka Streams stream-time rules.
- **Window**  -  A grouping of records over a defined time interval or session.


#### 30-second version

> Window types: *tumbling* (fixed, non-overlapping), *hopping* (fixed,
> overlapping), *sliding*, and *session* (gaps of inactivity).
> Processing uses **event time**; records that arrive after the window
> end are handled by the **grace period**, after which they are dropped,
> and `suppress()` emits only the final result.

---

### AC. Reactive Programming & Spring WebFlux

#### Q126. Explain Mono, Flux and back-pressure.

**Strong answer:**

`Mono<T>` represents zero or one value; `Flux<T>` represents zero to
many. Both also signal completion or failure. Cold, deferred publishers
start their work on subscription, but this is not a universal property of
all publishers or of the expressions used to construct them. Hot sources
may produce independently of subscribers. `Mono.just(blockingCall())`
evaluates the call immediately; `Mono.fromCallable(() -> blockingCall())`
defers it. Scheduling blocking work safely is a separate decision.

Reactive Streams defines `Publisher`, `Subscriber`, `Subscription` and
`Processor`. A subscriber signals demand with `request(n)`; a compliant
publisher must honor demand for `onNext` signals. This does not remove
the need for bounded buffering and an overflow policy at push-source
boundaries. Operators such as `map`, `flatMap`, `zip`, `concatMap`,
`retryWhen` and `timeout` compose work. `flatMap` can merge concurrent
inner publishers and interleave output; `concatMap` processes them
sequentially while preserving order.

#### How to understand it

Distinguish assembly, subscription, production and delivery. Java
evaluates method arguments before the method call, so putting eager work
inside `just` cannot make it lazy. A hot source and a cold deferred source
also have different behavior for late or repeated subscribers.

#### Key terms you should know

- **Cold publisher**  -  A source that starts its source work for each subscription.
- **Hot publisher**  -  A source that can share production independently of individual subscribers.
- **Back-pressure**  -  Demand signaling that regulates delivery to a subscriber.

#### SDE-3 interview checkpoints

- Compare eager `just(call())` with deferred `fromCallable`.
- Test late subscribers, repeat subscriptions, cancellation and overflow.
- Bound concurrency and keep blocking dependencies off the event loop.

#### 30-second version

> Mono models zero or one value and Flux zero to many. Cold deferred work starts
> on subscription, but hot sources and eager assembly-time calls are exceptions.
> Back-pressure controls delivery demand; buffering, overflow and blocking-call
> scheduling still need deliberate policies.

[Reactor hot versus cold](https://projectreactor.io/docs/core/release/reference/advancedFeatures/reactor-hotCold.html).

#### Q127. What are the biggest WebFlux mistakes?

**Strong answer:**

Blocking the event loop stalls unrelated requests. Wrap a synchronous
dependency as
`Mono.fromCallable(() -> blockingCall()).subscribeOn(Schedulers.boundedElastic())`;
`publishOn` changes downstream execution and is not a general fix for
blocking source work. Return the publisher from a WebFlux handler and
let the framework subscribe. Preserve context, set bounded concurrency
and deadlines, and test error/cancellation paths. Eager work inside
`Mono.just(blockingCall())` already ran before subscription. [Reactor
blocking-call
guidance](https://projectreactor.io/docs/core/release/reference/faq.html).


#### Key terms you should know

- **Mono**  -  A Reactor type representing zero or one asynchronous value.


#### 30-second version

> Blocking the event loop stalls unrelated requests. Wrap a synchronous
> dependency as
> `Mono.fromCallable(() -> blockingCall()).subscribeOn(Schedulers.boundedElastic())`;
> `publishOn` changes downstream execution and is not a general fix for
> blocking source work.

#### Q128. WebFlux or Spring MVC with virtual threads?

**Strong answer:**

Choose WebFlux for end-to-end non-blocking stacks (R2DBC, reactive
Mongo/Redis/Kafka, WebClient), streaming (SSE/WebSocket), or
gateway-style fan-out with heavy back-pressure needs. Choose **MVC +
virtual threads** when you use blocking libraries such as JDBC/JPA: you
get high concurrency with simple, debuggable code. A reactive controller
over a blocking JPA repository gives the complexity of reactive with
none of the benefits.


#### Key terms you should know

- **back-pressure**  -  A mechanism that prevents an upstream producer
  from overwhelming a downstream consumer.
- **reactive**  -  A programming model centered on asynchronous streams
  and non-blocking processing with explicit demand/back-pressure.


#### 30-second version

> Choose WebFlux for end-to-end non-blocking stacks (R2DBC, reactive
> Mongo/Redis/Kafka, WebClient), streaming (SSE/WebSocket), or
> gateway-style fan-out with heavy back-pressure needs. Choose **MVC +
> virtual threads** when you use blocking libraries such as JDBC/JPA:
> you get high concurrency with simple, debuggable code.

#### Q129. How do you test reactive code?

**Strong answer:**

`StepVerifier` asserts emitted items, errors and completion, with
`withVirtualTime` for delays/timeouts; `WebTestClient` tests endpoints;
Testcontainers provide real brokers/DBs. Verify cancellation and error
paths, not only the happy path.


#### 30-second version

> `StepVerifier` asserts emitted items, errors and completion, with
> `withVirtualTime` for delays/timeouts; `WebTestClient` tests
> endpoints; Testcontainers provide real brokers/DBs. Verify
> cancellation and error paths, not only the happy path.

---

### AD. Security Hardening

#### Q130. How do you manage secrets properly?

**Strong answer:**

Never in Git, images, env files committed to repos or logs. Use a secret
manager (GCP Secret Manager, Vault) with IAM-scoped access, versioning
and audit logs; load at startup or mount as a volume (prefer files over
env vars, which leak in dumps and `ps`); **rotate** automatically and
design the app to reload or restart on rotation; use short-lived
credentials (Workload Identity, IAM database authentication) wherever
possible; scan repos for leaked secrets (gitleaks) and revoke
immediately if exposed.


#### Key terms you should know

- **IAM**  -  Identity and Access Management: policies controlling who or
  what can perform which actions on which resources.
- **Workload Identity**  -  A mechanism that lets workloads obtain cloud
  identities without embedding long-lived service-account keys.


#### 30-second version

> Never in Git, images, env files committed to repos or logs. Use a
> secret manager (GCP Secret Manager, Vault) with IAM-scoped access,
> versioning and audit logs; load at startup or mount as a volume
> (prefer files over env vars, which leak in dumps and `ps`); **rotate**
> automatically and design the app to reload or restart on rotation; use
> short-lived credentials (Workload Identity, IAM database
> authentication) wherever possible; scan repos for leaked secrets
> (gitleaks) and revoke immediately if exposed.

#### Q131. What is zero-trust and how do you implement it between services?

**Strong answer:** authenticate each workload and authorize every operation using the caller, target resource and policy. mTLS establishes workload identity; it does not by itself authorize a business action. Use short-lived service credentials, least-privilege permissions, network controls and audit trails.

Do not blindly forward an end user's token to every downstream service. The receiver must be an intended audience and the token must carry appropriate scope; use an explicit delegation/token-exchange design when needed. Treat the gateway as one enforcement point and test service entry points that bypass it.

#### Q132. How do you secure the software supply chain?

**Strong answer:**

Pin and verify dependencies, scan with SCA (Dependabot/OWASP/Snyk),
generate an **SBOM**, sign artifacts/images (cosign) and enforce
signature and vulnerability policy at deploy time (Binary
Authorization), use minimal/distroless base images, build in isolated CI
with ephemeral credentials, require code review and branch protection,
and prevent dependency-confusion by using a private repository with
explicit namespaces. Know the Log4Shell lesson: have an inventory so you
can answer "where do we use library X?" within minutes.


#### Key terms you should know

- **OWASP**  -  An organization that publishes widely used
  application-security guidance, including the OWASP Top 10.


#### 30-second version

> Pin and verify dependencies, scan with SCA (Dependabot/OWASP/Snyk),
> generate an **SBOM**, sign artifacts/images (cosign) and enforce
> signature and vulnerability policy at deploy time (Binary
> Authorization), use minimal/distroless base images, build in isolated
> CI with ephemeral credentials, require code review and branch
> protection, and prevent dependency-confusion by using a private
> repository with explicit namespaces. Know the Log4Shell lesson: have
> an inventory so you can answer "where do we use library X?" within
> minutes.

#### Q133. What is your hardening checklist for a Spring Boot service?

**Strong answer:**

Expose only needed Actuator endpoints (and secure them), disable stack
traces in responses, set security headers (HSTS, CSP,
`X-Content-Type-Options`), enforce HTTPS and TLS 1.2+, validate and
size-limit input (request body size, upload types), rate-limit and add
timeouts, parameterised queries only, strict CORS, disable default
accounts and verbose error pages, run as non-root in a read-only
container, keep dependencies patched, and log security events (auth
failures, access denials) without sensitive data.


#### Key terms you should know

- **Actuator**  -  Spring Boot endpoints for operational information and application management.
- **Least privilege**  -  Granting only the access needed for a responsibility.
- **Hardening**  -  Reducing unnecessary exposure and strengthening deployed defaults.
- **Input limits**  -  Bounds on request sizes and processing cost.


#### 30-second version

> Expose only needed Actuator endpoints (and secure them), disable stack
> traces in responses, set security headers (HSTS, CSP,
> `X-Content-Type-Options`), enforce HTTPS and TLS 1.2+, validate and
> size-limit input (request body size, upload types), rate-limit and add
> timeouts, parameterised queries only, strict CORS, disable default
> accounts and verbose error pages, run as non-root in a read-only
> container, keep dependencies patched, and log security events (auth
> failures, access denials) without sensitive data.

---

### AE. LeetCode-Style Programs

#### 1. Valid parentheses (stack)

**Derive the approach:** the most recently opened bracket must close
first, which is exactly LIFO behavior. Store expected closing characters
so a close is checked against the top in one step.

**Why this, not the alternatives:** a single balance counter works for
one bracket type but cannot detect crossed types such as `([)]`.
Repeated string replacement can be quadratic. A stack makes nesting
order explicit.

**What changes:** the code assumes only bracket characters; other
characters are rejected. If parsing source text, decide how to treat
strings, escapes and comments. Empty input is valid. General wildcard
brackets require a different state representation.

**Trace and checks:** `([])` pushes `)` then `]`, and consumes them in
reverse order. Test `([)]`, leading close, trailing open and empty
input. O(n) time, O(n) stack; `toCharArray` also allocates O(n).

**Strong answer signal:** explain why counts alone cannot represent
nesting.

```java
boolean isValid(String s) {
    Deque<Character> st = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        switch (c) {
            case '(' -> st.push(')');
            case '[' -> st.push(']');
            case '{' -> st.push('}');
            default -> { if (st.isEmpty() || st.pop() != c) return false; }
        }
    }
    return st.isEmpty();
}
```

#### 2. Number of islands (DFS, O(rows × cols))

**Derive the approach:** each island is a connected component. At an
unvisited land cell, count one component and mark every reachable land
cell so none can start another component.

**Why this, not the alternatives:** DFS and BFS have the same O(rows ×
columns) time; iterative traversal avoids recursion-depth failure.
Union-find is useful for incremental additions but is more machinery for
a single static count. Checking only neighbors' counts cannot reliably
merge arbitrarily connected shapes.

**What changes:** four-neighbor versus eight-neighbor adjacency changes
the answer. The snippet mutates land to water and assumes a rectangular
grid. Preserve input with a visited structure when required. Deep
snake-shaped islands can overflow the recursive stack.

**Trace and checks:** two diagonally touching land cells count as two
under four-neighbor rules. Test all water, all land, one row and a deep
component. Worst-case auxiliary traversal space is O(rows × columns),
even with in-place marking.

**Strong answer signal:** distinguish traversal marking, mutation and
stack space.

```java
int numIslands(char[][] g) {
    int count = 0;
    for (int r = 0; r < g.length; r++)
        for (int c = 0; c < g[0].length; c++)
            if (g[r][c] == '1') { sink(g, r, c); count++; }
    return count;
}
void sink(char[][] g, int r, int c) {
    if (r < 0 || c < 0 || r >= g.length || c >= g[0].length || g[r][c] != '1') return;
    g[r][c] = '0';
    sink(g, r + 1, c); sink(g, r - 1, c); sink(g, r, c + 1); sink(g, r, c - 1);
}
```

*Say:* deep recursion can overflow the stack on huge grids; use
BFS/iterative DFS or union-find. Mention that you mutate the input and
how to avoid it with a `visited` array.

#### 3. Coin change: fewest coins (DP, O(amount × coins))

**Derive the approach:** after choosing a final coin c, the remaining
problem is the best solution for amount−c. Let dp\[a\] be the minimum
coin count for exact total a, with dp\[0\]=0 and an unreachable
sentinel.

**Why this, not the alternatives:** greedy fails without special
denomination guarantees: for {1,3,4}, amount 6, 4+1+1 loses to 3+3.
Naive recursion repeats amounts; memoization or bottom-up DP reuses
them. BFS over reachable amounts is valid but adds frontier bookkeeping.

**What changes:** counting combinations is a different recurrence with
order-sensitive loop choices. Limited coin supplies require additional
state or a bounded-knapsack method. Zero/negative denominations break
progress; huge amounts make O(amount) memory impractical even with few
coins.

**Trace and checks:** for {2}, odd totals remain unreachable; zero
amount returns zero. Test {1,3,4}/6, duplicates and invalid input under
the chosen contract. O(amount × denominations) time, O(amount) space.

**Strong answer signal:** define the state and prove the transition
before writing loops.

```java
int coinChange(int[] coins, int amount) {
    Objects.requireNonNull(coins);
    if (amount < 0 || amount == Integer.MAX_VALUE)
        throw new IllegalArgumentException("unsupported amount");
    for (int coin : coins) if (coin <= 0)
        throw new IllegalArgumentException("coins must be positive");
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);                    // "infinity"
    dp[0] = 0;
    for (int a = 1; a <= amount; a++)
        for (int coin : coins)
            if (coin <= a) dp[a] = Math.min(dp[a], dp[a - coin] + 1);
    return dp[amount] > amount ? -1 : dp[amount];
}
```

*Contract:* require nonnegative, allocation-bounded `amount` and
strictly positive denominations; reject invalid input. Greedy fails for
coin sets like {1, 3, 4}, which is why DP is needed. This is O(amount ×
number of coins) time and O(amount) space.

#### 4. Binary tree level-order traversal (BFS)

**Derive the approach:** output groups nodes by distance from the root,
so process a queue breadth-first. Snapshot the queue size before a level
so newly enqueued children stay in the next level.

**Why this, not the alternatives:** DFS can group by depth too, but BFS
directly matches the requested output. Repeatedly traversing from the
root for each depth repeats work. A stack alone changes the visitation
order.

**What changes:** a graph may contain cycles/shared vertices and needs
visited tracking. A very wide tree can make the queue large; a deep tree
makes recursive DFS risky. Zigzag output can reverse each level or
change insertion positions without changing the level boundary.

**Trace and checks:** root 1 with children 2/3 emits `[1]`, then
`[2,3]`. Test null root, one-sided tree, broad tree and duplicate
values. O(n) time, O(maximum width) queue, O(n) output.

**Strong answer signal:** explain why the level-size snapshot is taken
before processing children.

```java
List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> out = new ArrayList<>();
    if (root == null) return out;
    Queue<TreeNode> q = new ArrayDeque<>(List.of(root));
    while (!q.isEmpty()) {
        int n = q.size(); List<Integer> level = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            TreeNode t = q.poll(); level.add(t.val);
            if (t.left != null) q.add(t.left);
            if (t.right != null) q.add(t.right);
        }
        out.add(level);
    }
    return out;
}
```

---

### AF. Google-Style System Design (condensed)

**Design 7: Distributed Job Scheduler.** *Clarify:* one-off and
recurring (cron) jobs, millions per day, at-least-once execution with
idempotent jobs, retries, priorities, delays up to months. *API:*
`POST /jobs {payload, runAt|cron, retryPolicy}`, `GET /jobs/{id}`,
`DELETE`. *Storage:* jobs table partitioned by `runAt` bucket
(Spanner/Cloud SQL/Bigtable) with `status`, `nextRunAt`, `attempt`,
`leaseUntil`. *Dispatch:* a scheduler tier scans each time bucket for
due jobs and enqueues them to Pub/Sub; workers pull, take a **lease**
(visibility timeout), execute and mark complete; expired leases are
re-dispatched. *Reliability:* heartbeats extend leases, exponential
backoff, DLQ after N attempts, deduplication by a stable logical
execution ID (for recurring jobs: job ID plus scheduled occurrence),
reused across retries; keep attempt count as separate metadata. Fence
stale lease holders where external effects require it. *Scaling:*
partition the scheduler by hash(jobId) with leader election (or
lease-based ownership) per partition; avoid hot buckets at "00:00" by
jittering. *Trade-offs:* a scheduler alone cannot guarantee exactly-once
arbitrary external effects; combine retryable delivery with idempotency
or a transactional effect boundary; clock skew (use server time),
long-running jobs need checkpointing.

*Google-style interviews reward:* clear requirements, quantified scale,
trade-offs stated explicitly, and deep dives chosen by the interviewer
(be ready to go deep on any component).

---

### AG. Amazon Leadership Principles Pack

Prepare **one story per principle** (many stories cover several). Use
STAR with the **Result quantified** and speak in **"I"** not "we".

| Principle                                                                         | Story prompt                                                   |
|-----------------------------------------------------------------------------------|----------------------------------------------------------------|
| Customer Obsession                                                                | A decision you made from the customer's pain, not the roadmap  |
| Ownership                                                                         | Something outside your scope you fixed and owned to completion |
| Invent and Simplify                                                               | You replaced a complex process/system with a simpler one       |
| Are Right, A Lot                                                                  | A call made with incomplete data; how you validated it         |
| Learn and Be Curious                                                              | A new technology you learned fast and applied                  |
| Hire and Develop the Best                                                         | Mentoring someone to promotion; a hiring bar you raised        |
| Insist on the Highest Standards                                                   | You refused to ship, or raised quality, at a cost              |
| Think Big                                                                         | A bold proposal that changed direction or scale                |
| Bias for Action                                                                   | A fast reversible decision that unblocked the team             |
| Frugality                                                                         | Doing more with less (cost cut X% by …)                        |
| Earn Trust                                                                        | Admitting a mistake or giving hard feedback                    |
| Dive Deep                                                                         | A root cause found by digging into data/logs/code              |
| Have Backbone; Disagree and Commit                                                | You challenged a senior decision, then committed               |
| Deliver Results                                                                   | Delivered under adversity with measurable impact               |
| Strive to be Earth's Best Employer / Success and Scale Bring Broad Responsibility | Inclusion, team wellbeing, responsible impact of your system   |

**Story template (90 seconds):** *Situation (15 s)* → *Task (10 s)* →
*Action (45 s: what **I** did, why, trade-offs)* → *Result (20 s:
numbers + what I learned)*. Expect 3-4 deep follow-ups ("What would you
do differently?", "What was the pushback?"), so know your stories'
details.

<a id="part-9-coding-interview-practice-track"></a>
<a id="part-9"></a>
## Part 09 - Coding interview practice track

The aim is to solve unfamiliar problems, explain why the solution is
correct, and adapt it when constraints change. Use the forty problems
below as a practice pool over two to four weeks. For a fourteen-day
sprint, choose twenty to twenty-four based on your weakest patterns and
reserve time for mocks and repeat attempts.

### What to prioritize

| Priority       | Work                                                                  | Exit criterion                                                           |
|----------------|-----------------------------------------------------------------------|--------------------------------------------------------------------------|
| First          | Arrays, hashing, binary search, sliding windows, trees, heaps, graphs | Derive a solution without naming a memorized template first              |
| First          | Java implementation, invariants, complexity, boundary tests           | Produce correct code and explain every state variable                    |
| Next           | Dynamic programming, backtracking, union-find, monotonic stacks       | State the recurrence or maintained invariant before coding               |
| Next           | Machine coding and concurrency                                        | Define contracts, bound state, handle cancellation and test interactions |
| Maintain       | System design, databases and project depth                            | Explain one realistic failure timeline and a recovery plan               |
| Role-dependent | Detailed GCP, Kubernetes and Terraform trivia                         | Study when it appears in the job description or your resume              |

This is a suggested allocation, not a claim about any company's
interview process. Read the recruiter-provided format first.

### Forty problems organized by pattern

For each problem, first clarify input contracts, give a correct
baseline, improve it, state an invariant, code, and test. The names
below identify practice prompts; the solutions need not come from a
particular platform.

| Pattern                 | Problems                                                                                     | Recognition cue                                          | Follow-up to rehearse                                                 |
|-------------------------|----------------------------------------------------------------------------------------------|----------------------------------------------------------|-----------------------------------------------------------------------|
| Hashing and prefix sums | 1\. Two Sum; 2. Subarray Sum Equals K; 3. Longest Consecutive Sequence                       | Fast membership or a relationship between prefixes       | Negative numbers, duplicate values, integer overflow                  |
| Two pointers            | 4\. Three Sum; 5. Container With Most Water; 6. Trapping Rain Water                          | Sorted choices or boundaries that move monotonically     | Prove why a discarded choice cannot improve the result                |
| Sliding window          | 7\. Longest Substring Without Repeats; 8. Minimum Window Substring; 9. Permutation in String | Maintain a condition on a contiguous range               | Explain why negative numbers break some sum-window arguments          |
| Binary search           | 10\. Lower Bound; 11. Search Rotated Array; 12. Minimum Feasible Processing Speed            | Ordered search space or a monotone feasibility predicate | Duplicates, no feasible answer, overflow in midpoint/ceil division    |
| Intervals               | 13\. Merge Intervals; 14. Meeting Rooms II; 15. Insert Interval                              | Sorting exposes overlap decisions                        | Closed versus half-open intervals; whether touching endpoints overlap |
| Linked lists            | 16\. Reverse List; 17. Detect Cycle; 18. Merge K Sorted Lists                                | Pointer ownership or ordered heads                       | Empty list, aliasing, cycles, whether input nodes may be reused       |
| Stack                   | 19\. Valid Parentheses; 20. Daily Temperatures; 21. Largest Rectangle in Histogram           | Unresolved elements await a later boundary               | Equal values and why total pushes/pops remain linear                  |
| Trees                   | 22\. Level Order; 23. Lowest Common Ancestor; 24. Serialize and Deserialize a Tree           | Recursive subproblem or breadth levels                   | Missing target nodes, duplicate values, skewed-tree stack depth       |
| Heap                    | 25\. Top K Frequent; 26. Median of a Stream; 27. Kth Largest                                 | Retain an ordered frontier or a small best set           | Tie-breaking, invalid k, exact versus approximate streaming answers   |
| Unweighted graphs       | 28\. Number of Islands; 29. Clone Graph; 30. Course Schedule                                 | Reachability, distance by edges, or dependency order     | Disconnected nodes, repeated edges, cycle detection                   |
| Weighted graphs         | 31\. Network Delay; 32. Minimum-Cost Grid Path                                               | Nonnegative weighted shortest path                       | Why BFS is insufficient; what changes with negative weights           |
| Union-find              | 33\. Redundant Connection; 34. Accounts Merge                                                | Repeated undirected connectivity queries                 | Duplicate edges, self edges, deletions and rollback                   |
| Backtracking            | 35\. Combination Sum; 36. Subsets With Duplicates; 37. Word Search                           | Enumerate choices under constraints                      | Avoid duplicate outputs; explain pruning and output-size cost         |
| Dynamic programming     | 38\. Coin Change; 39. Edit Distance; 40. Longest Increasing Subsequence                      | Repeated subproblems with sufficient state               | Base cases, transitions, iteration order, reconstructing a solution   |

Do not count reading an answer as solving a problem. Mark each attempt
as independent, hinted, or read. Retry hinted/read problems after two
days, then a week, with no solution visible.

### A daily practice session

Allow about 150 minutes: 10 minutes recalling earlier invariants, two
40-minute problem attempts, 25 minutes fixing and testing the weaker
attempt, 20 minutes of Java/backend depth, and 15 minutes recording
mistakes. On mock days, replace new problems with a timed interview and
review.

| Day | Coding focus                                        | Short companion revision                      |
|-----|-----------------------------------------------------|-----------------------------------------------|
| 1   | Arrays and hashing                                  | `equals`, `hashCode`, mutable keys            |
| 2   | Prefix sums and two pointers                        | `long`, comparator overflow, collection costs |
| 3   | Sliding windows                                     | UTF-16 versus code points and input contracts |
| 4   | Binary search                                       | Loop invariants and boundary conventions      |
| 5   | Intervals and linked lists                          | Mutation, aliasing and defensive copies       |
| 6   | Trees and traversal                                 | Recursion stack, queue space, serialization   |
| 7   | One 45-minute coding mock; redo two failures        | Explain trade-offs aloud                      |
| 8   | Heaps and monotonic stacks                          | Amortized complexity and heap ordering        |
| 9   | Graph BFS/DFS and topological ordering              | Disconnected state and cycle detection        |
| 10  | Dijkstra and union-find                             | Preconditions and counterexamples             |
| 11  | Backtracking and one-dimensional DP                 | Search-tree size and pruning                  |
| 12  | Two-dimensional DP; retry weak patterns             | State compression and reconstruction          |
| 13  | One 90-minute machine-coding exercise               | Concurrency, lifecycle and tests              |
| 14  | One 45-minute coding mock and 45-minute design mock | Project stories and final error-log review    |

### The 45-minute coding round

| Minutes | Action                                                        | What the interviewer can assess      |
|---------|---------------------------------------------------------------|--------------------------------------|
| 0-5     | Clarify input size, duplicates, ordering, mutation and output | Whether you solve the actual problem |
| 5-10    | Explain a baseline and the bottleneck                         | Whether optimization has a reason    |
| 10-15   | Choose a representation and state an invariant                | Whether the algorithm is derived     |
| 15-32   | Implement, narrating decisions rather than each keystroke     | Correctness and readable Java        |
| 32-40   | Walk through normal and adversarial tests                     | Ability to find your own bugs        |
| 40-45   | Explain time/space cost and handle one changed constraint     | Depth and adaptability               |

Practice rubric: score each of contract, reasoning, implementation,
verification, and communication from 0 to 2. Zero means
missing/incorrect, one means partial or prompted, and two means
independent and clear. Aim for at least 8/10 twice on unseen problems,
with no zero in correctness or verification. This is a self-assessment
tool, not a hiring prediction.

### Java details that matter during live coding

- Use `ArrayDeque` for ordinary stacks/queues and `PriorityQueue` for an
  ordered frontier. Heap iteration is not sorted iteration.
- Prefer `Integer.compare`, `Long.compare` or comparator factories;
  `a - b` can overflow. A `TreeSet` also uses comparator equality to
  decide whether an element is already present.
- Cast before arithmetic: `(long) a * b`, not `(long) (a * b)`. Use
  `long` for counts of subarrays, accumulated weights and large totals.
- `char` is a UTF-16 code unit. Decide whether text problems mean ASCII,
  code units, Unicode code points, or user-perceived characters; these
  are different contracts.
- State whether a function changes its input. Sorting the caller's array
  or returning references to mutable interval arrays can be observable
  behavior.
- Track recursion depth as auxiliary space. DFS can be O(V + E) time and
  still overflow the Java call stack on a deep input.
- State expected, amortized and worst-case complexity separately.
  “HashMap is O(1)” needs assumptions; “two nested loops means O(n²)” is
  false when both pointers only advance across the input once.
- Do not stream away an algorithm's invariant. A short loop is often
  easier to implement, inspect and debug under a timer.
- Describe the output contract for ties, empty results and impossible
  cases. Reject invalid inputs explicitly when that is the agreed
  contract.

### Eight worked solutions

The companion
[InterviewAlgorithms.java](code/InterviewAlgorithms.java)
contains all eight implementations and executable checks. The blocks
below are members of that class and use `java.util` imports; the file is
the complete runnable artifact.

From the directory containing the file, run
`java InterviewAlgorithms.java`. It was rerun for this edition on Java 21.0.9 and
reported **PASS: 3116 checks across eight algorithms**. Tests include
explicit edge cases and deterministic comparisons against simpler
implementations for prefix sums, binary search, monotonic stacks and
running medians. The separate review suite checks the repaired examples and documented boundaries; see Appendix B.
This does not imply every earlier framework excerpt was compiled or
integration-tested.

#### Solution 1 Lower bound

**Derive and compare:** a linear scan establishes the meaning of the
first acceptable index. Sortedness makes `a[i] >= target` monotone, so
halve the remaining candidate range. A library binary search may return
any equal position, requiring extra handling for the first duplicate;
the half-open formulation encodes that contract directly.

**What if:** changing `< target` to `<= target` searches for the first
strictly larger value. For `[1,2,2,4]` and target 2, lower bound is 1
and upper bound is 3. Returning `-1` for an absent value loses the
insertion-position contract. If ordering is removed, binary search is
invalid.

**Strong answer signal:** state what is known on both sides of the open
search interval and show why every iteration makes progress.

**Contract:** sorted ascending array; return the first index whose value
is at least the target, or array length. Do not add an O(n) sortedness
scan when claiming O(log n) search.

**Reasoning:** all indices before `lo` are too small; all indices at or
after `hi` are known candidates or past the array. A half-open interval
handles an empty array and an insertion after the last element without a
special branch.

```java
// 1. Binary search. Precondition: a is sorted ascending. Returns a.length if absent above all values.
public static int lowerBound(int[] a, int target) {
    Objects.requireNonNull(a);
    int lo = 0, hi = a.length;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] < target) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}
```

**Cost:** O(log n) time, O(1) extra space. **Tests:** empty array,
target before/after the range, repeated target, and a single element.
**Follow-up:** change the comparison to find the first value strictly
greater than the target; use the two boundaries to count occurrences.

#### Solution 2 Subarray sum equals a target

**Derive and compare:** enumerate all start/end pairs as a baseline,
then observe that every segment sum is a difference of two prefixes.
Frequencies matter because multiple earlier prefixes can give distinct
valid starts. Sorting prefixes loses position information; a simple
sliding window fails when values can be negative.

**What if:** store only a set and `[0,0]` with target zero is
undercounted. Insert the current prefix before querying and you count an
empty segment. With target 1 in `[1,-1,1]`, all three valid segments are
counted. For longest length, retain earliest prefix indices; for
shortest length, reason about which index should be retained.

**Strong answer signal:** derive the complement equation and explain
query-before-update.

**Contract:** integer elements may be negative; count nonempty
contiguous subarrays. The answer and prefix sums use `long`.

**Reasoning:** if the current prefix is p, an earlier prefix p − target
completes a valid subarray. Seed the empty prefix once and query before
inserting the current prefix; otherwise target zero incorrectly counts
an empty subarray. A simple shrinking window is not correct for
arbitrary negative values.

```java
// 2. Prefix sums. Counts nonempty subarrays; negative numbers and zero are supported.
public static long countSubarraysWithSum(int[] a, long target) {
    Objects.requireNonNull(a);
    Map<Long, Long> counts = new HashMap<>();
    counts.put(0L, 1L);
    long prefix = 0, result = 0;
    for (int value : a) {
        prefix += value;
        result += counts.getOrDefault(prefix - target, 0L);
        counts.merge(prefix, 1L, Long::sum);
    }
    return result;
}
```

**Cost:** expected O(n) time and O(n) space under ordinary hash
distribution. **Tests:** all zeros, cancellation between
positive/negative values, no match, and totals exceeding `int`.
**Follow-up:** for longest matching subarray, store earliest indices
instead of frequencies.

#### Solution 3 Next warmer day

**Derive and compare:** the quadratic baseline searches right from every
day. The repeated work is asking whether a later value resolves earlier
candidates. Keep only unresolved indices; a new warmer value discharges
a suffix of that stack. A heap could resolve candidates but adds O(log
n) operations without improving the static task.

**What if:** popping on equality incorrectly treats an equal temperature
as warmer. Storing only values loses the index distance. On
`[30,30,31]`, answers are `[2,1,0]`. For a circular input, scan a second
pass with controlled insertion so each original index is resolved once.

**Strong answer signal:** justify linear total work by charging one push
and at most one pop to each index.

**Contract:** for each temperature, return distance to the next strictly
warmer day, or zero.

**Reasoning:** the stack stores unresolved indices with non-increasing
temperatures. A warmer day resolves all smaller values on top. Each
index enters and leaves at most once, so the nested loop is linear in
total.

```java
// 3. Monotonic stack. Equal temperatures do not count as warmer.
public static int[] daysUntilWarmer(int[] temperatures) {
    Objects.requireNonNull(temperatures);
    int[] result = new int[temperatures.length];
    Deque<Integer> unresolved = new ArrayDeque<>();
    for (int i = 0; i < temperatures.length; i++) {
        while (!unresolved.isEmpty()
                && temperatures[i] > temperatures[unresolved.peek()]) {
            int previous = unresolved.pop();
            result[previous] = i - previous;
        }
        unresolved.push(i);
    }
    return result;
}
```

**Cost:** O(n) time, O(n) auxiliary stack and O(n) output. **Tests:**
equal temperatures, decreasing input, one element, empty input.
**Follow-up:** adapt to a circular array while avoiding repeated output
resolution.

#### Solution 4 Dijkstra shortest paths

**Derive and compare:** BFS minimizes edge count, not weight.
Nonnegative weights allow repeatedly choosing the smallest tentative
distance. A heap makes that choice efficient; a dense graph may justify
an O(V²) array selection implementation. Bellman-Ford handles negative
weights but costs more.

**What if:** marking a node final when enqueued freezes an early
expensive route. With edges A→B=10, A→C=1, C→B=1, B must improve to 2.
Negative edges invalidate the greedy proof. Removing the stale-entry
guard repeats work; stopping when the destination is first enqueued can
return 10 instead of 2.

**Strong answer signal:** explain why a popped minimum is safe under the
weight contract and distinguish tentative from final distance.

**Contract:** directed adjacency list, nodes numbered 0 through V − 1,
nonnegative integer weights. `Long.MAX_VALUE` denotes unreachable.
Validate every edge, including edges in unreachable components.

**Reasoning:** the cheapest current tentative distance cannot be
improved through a more expensive frontier when all edge weights are
nonnegative. Because Java's priority queue has no decrease-key
operation, insert updated candidates and ignore stale entries when
popped.

```java
// 4. Weighted graph. Directed adjacency list, nodes 0..V-1, nonnegative int weights.
public record Edge(int to, int weight) {}
private record State(int node, long distance) {}

public static long[] shortestPaths(List<List<Edge>> graph, int source) {
    Objects.requireNonNull(graph);
    Objects.checkIndex(source, graph.size());
    for (List<Edge> edges : graph) {
        Objects.requireNonNull(edges);
        for (Edge edge : edges) {
            Objects.requireNonNull(edge);
            Objects.checkIndex(edge.to(), graph.size());
            if (edge.weight() < 0) throw new IllegalArgumentException("Negative edge weight");
        }
    }
    long[] distance = new long[graph.size()];
    Arrays.fill(distance, Long.MAX_VALUE);
    distance[source] = 0;
    PriorityQueue<State> queue = new PriorityQueue<>(Comparator.comparingLong(State::distance));
    queue.add(new State(source, 0));
    while (!queue.isEmpty()) {
        State current = queue.remove();
        if (current.distance() != distance[current.node()]) continue;
        for (Edge edge : graph.get(current.node())) {
            long candidate = current.distance() + edge.weight();
            if (candidate < distance[edge.to()]) {
                distance[edge.to()] = candidate;
                queue.add(new State(edge.to(), candidate));
            }
        }
    }
    return distance;
}
```

**Cost:** for this lazy-entry implementation, O(V + E log(E + 1)) time
and O(V + E) extra space, excluding the input adjacency list. For simple
graphs, log E is O(log V). Distances use `long` and weights use
nonnegative `int`; a shortest simple path fits this representation.
**Tests:** zero-weight cycle, unreachable vertex, competing routes,
stale entry, invalid edge, and large total weight. **Follow-up:** BFS
for unit weights, 0-1 BFS for weights zero/one, or a negative-edge
algorithm when the contract changes.

#### Solution 5 Disjoint sets

**Derive and compare:** repeated connectivity questions need component
membership, not the path itself. Store representatives and merge sets;
path compression and size-based linking keep representative queries
cheap. BFS is simpler for one traversal and is needed when returning a
path. Maintaining a full reachability matrix uses much more memory.

**What if:** an undirected edge joins already-connected nodes, it closes
a cycle under the chosen graph rules. Directed cycle detection needs
another algorithm. Duplicate edges and self edges require an explicit
contract. Deleting an edge may split a component, which this structure
cannot discover.

**Trace and strong answer:** union 0-1 then 1-2; find(0)=find(2), while
3 remains separate. Explain why roots, rather than arbitrary parent
entries, must be compared.

**Contract:** fixed node set, incremental undirected connectivity,
single-threaded mutation.

**Reasoning:** represent each component as a rooted tree. Union attaches
the smaller component to the larger; path compression shortens future
searches. Decrease the component count only when two different roots
merge.

```java
// 5. Disjoint sets. Mutable and single-threaded; union returns false for an existing connection.
public static final class DisjointSet {
    private final int[] parent, size;
    private int components;

    public DisjointSet(int n) {
        if (n < 0) throw new IllegalArgumentException("Negative size");
        parent = new int[n];
        size = new int[n];
        components = n;
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
    }

    public int find(int node) {
        Objects.checkIndex(node, parent.length);
        while (node != parent[node]) {
            parent[node] = parent[parent[node]];
            node = parent[node];
        }
        return node;
    }

    public boolean union(int a, int b) {
        int rootA = find(a), rootB = find(b);
        if (rootA == rootB) return false;
        if (size[rootA] < size[rootB]) { int tmp = rootA; rootA = rootB; rootB = tmp; }
        parent[rootB] = rootA;
        size[rootA] += size[rootB];
        components--;
        return true;
    }

    public int components() { return components; }
}
```

**Cost:** O(n) initialization and space; amortized O(α(n)) for
find/union over a sequence of operations. **Tests:** duplicate union,
self union, transitive connectivity, zero nodes, invalid node.
**Follow-up:** ordinary union-find does not support arbitrary deletions;
discuss rebuilding, offline reversal or rollback variants instead of
promising an O(1) deletion.

#### Solution 6 Edit distance

**Derive and compare:** brute recursion explores the final
insert/delete/replace choices repeatedly. Prefix lengths identify
repeated subproblems. Bottom-up DP makes dependencies explicit;
memoization is equally valid but uses recursion. Two rows suffice only
because the answer is a distance, not a full edit script.

**What if:** reusing a row without saving the diagonal corrupts the
replacement transition. Different operation costs change the recurrence;
allowing transposition is a different distance definition. For
`cat`→`cut`, replacing one character costs one; empty→`abc` costs three.
Unicode code points need a different input representation from `charAt`.

**Strong answer signal:** define dp\[i\]\[j\] precisely and explain why
current-row left and previous-row entries have different roles.

**Contract:** minimum unit-cost insertions, deletions and replacements
over UTF-16 code units. For code-point semantics, convert input to
code-point sequences first.

**Reasoning:** the distance between two prefixes depends on matching
their last character or paying for one of three operations. Only the
previous and current DP rows are needed when returning the distance
alone.

```java
// 6. Dynamic programming. Unit-cost insert/delete/replace over UTF-16 code units.
public static int editDistance(String a, String b) {
    Objects.requireNonNull(a);
    Objects.requireNonNull(b);
    if (a.length() < b.length()) { String tmp = a; a = b; b = tmp; }
    int[] previous = new int[b.length() + 1], current = new int[b.length() + 1];
    for (int j = 0; j <= b.length(); j++) previous[j] = j;
    for (int i = 1; i <= a.length(); i++) {
        current[0] = i;
        for (int j = 1; j <= b.length(); j++) {
            current[j] = a.charAt(i - 1) == b.charAt(j - 1)
                ? previous[j - 1]
                : 1 + Math.min(previous[j - 1], Math.min(previous[j], current[j - 1]));
        }
        int[] tmp = previous; previous = current; current = tmp;
    }
    return previous[b.length()];
}
```

**Cost:** O(mn) time and O(min(m, n)) extra space. **Tests:** empty
strings, equal strings, repeated letters, and a mixed
insert/delete/replace example. **Follow-up:** reconstructing the actual
edit sequence needs additional state or a divide-and-conquer
reconstruction approach.

#### Solution 7 Combination sum

**Derive and compare:** choose a candidate, reduce the remaining target,
and recurse. Keep a nondecreasing candidate-index order so each multiset
appears once. A DP decision algorithm is better if the question asks
only whether a target is reachable; enumeration must pay for the output.

**What if:** restarting at index zero generates permutations such as
`[2,3]` and `[3,2]`. Advancing to i+1 forbids reuse. A zero candidate
can recurse forever. For {2,3} and target 6, return `[2,2,2]` and
`[3,3]`. Duplicate candidates require normalization or branch-level
skipping.

**Strong answer signal:** explain both termination and uniqueness, and
count output construction in complexity.

**Contract:** positive candidate values, unlimited reuse, nonnegative
target, unique combinations. A zero target has one solution: the empty
combination. Input is not mutated.

**Reasoning:** normalize duplicate candidates, sort, and only choose
indices at or after the current index. This permits reuse while avoiding
permutations of the same combination. Positivity makes the remaining
target decrease; zero or negative candidates would break that
termination argument.

```java
// 7. Backtracking. Unique combinations, unlimited reuse, positive candidates, nonnegative target.
public static List<List<Integer>> combinationSum(int[] candidates, int target) {
    Objects.requireNonNull(candidates);
    if (target < 0) throw new IllegalArgumentException("Negative target");
    for (int value : candidates) {
        if (value <= 0) throw new IllegalArgumentException("Candidates must be positive");
    }
    int[] unique = Arrays.stream(candidates).distinct().sorted().toArray();
    List<List<Integer>> result = new ArrayList<>();
    combinations(unique, 0, target, new ArrayList<>(), result);
    return result;
}

private static void combinations(int[] values, int start, int remaining,
                                 List<Integer> path, List<List<Integer>> result) {
    if (remaining == 0) { result.add(List.copyOf(path)); return; }
    for (int i = start; i < values.length && values[i] <= remaining; i++) {
        path.add(values[i]);
        combinations(values, i, remaining - values[i], path, result);
        path.remove(path.size() - 1);
    }
}
```

**Cost:** output-sensitive and potentially exponential. Let d =
floor(target / minimum candidate) and k be the number of distinct
candidates. A loose search bound is O((k + 1)^(d + 1)), plus
normalization and O(total emitted elements) to copy results; do not
label it O(n). Auxiliary space is O(k + d), excluding output. Large d
can overflow the call stack. **Tests:** duplicate candidates, no result,
empty candidates, target zero, invalid candidate, preserved input.
**Follow-up:** allow each candidate once, then explain how duplicate
skipping changes.

#### Solution 8 Running median

**Derive and compare:** sorting every prefix repeats work; a sorted
array has O(n) insertion. Two heaps retain exactly the two middle
boundaries while allowing O(log n) insertion. A balanced ordered
structure can work too, especially if deletions or other rank queries
are required.

**What if:** balancing sizes without preserving the value partition
produces the wrong median. Integer addition can overflow before division
unless widened first. For 5,1,9, the medians are 5,3,5. Sliding windows
need arbitrary expiry support, while memory-bounded unending streams may
require approximate quantiles.

**Strong answer signal:** state both the size invariant and the
cross-heap ordering invariant; neither alone is sufficient.

**Contract:** exact median after each insertion; no deletions;
single-threaded. Querying an empty stream throws.

**Reasoning:** a max-heap holds the lower half and a min-heap the upper
half. Every lower value is at most every upper value; the lower heap has
either the same size or one extra element. Cast before adding the two
middle values to avoid integer overflow.

```java
// 8. Two heaps. Single-threaded; grows with the stream length.
public static final class RunningMedian {
    private final PriorityQueue<Integer> lower = new PriorityQueue<>(Comparator.reverseOrder());
    private final PriorityQueue<Integer> upper = new PriorityQueue<>();

    public void add(int value) {
        if (lower.isEmpty() || value <= lower.peek()) lower.add(value);
        else upper.add(value);
        if (lower.size() > upper.size() + 1) upper.add(lower.remove());
        else if (upper.size() > lower.size()) lower.add(upper.remove());
    }

    public double median() {
        if (lower.isEmpty()) throw new NoSuchElementException("Empty stream");
        if (lower.size() != upper.size()) return lower.peek();
        return ((long) lower.peek() + upper.peek()) / 2.0;
    }
}
```

**Cost:** O(log n) insertion, O(1) median lookup, O(n) space. **Tests:**
odd/even sizes, duplicate values, mixed signs, integer extremes, sorted
and reverse inputs. **Follow-up:** a sliding median needs deletion
support; an unbounded stream with a memory cap may require approximate
quantiles rather than exact retained history.

### Machine coding beyond algorithms

For these exercises, agree on requirements before designing classes.
Start with one working vertical path, then add the smallest abstractions
justified by a second behavior. Do not introduce a database, framework
or hierarchy merely to demonstrate familiarity.

| Exercise                      | Minimal scope                                               | Senior-level follow-up                                                        | Useful tests                                                                        |
|-------------------------------|-------------------------------------------------------------|-------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| Bounded LRU cache             | Generic get/put, replacement, eviction, positive capacity   | Access-order reads mutate state; define thread safety and null policy         | Update existing entry, access changes eviction, capacity one, concurrent invariants |
| Rate limiter                  | One algorithm, injected monotonic ticker, per-client limits | Admission versus waiting, idle-key eviction races, distributed failure policy | Exact expiry boundary, simultaneous requests, invalid config, large key population  |
| In-memory task scheduler      | One-off jobs, cancellation and bounded execution            | Stable execution ID, retry policy, shutdown and task exceptions               | Cancel before dispatch, duplicate dispatch, failure, no late work after shutdown    |
| Inventory reservation service | Reserve/release, expiry, no negative available stock        | Idempotency, concurrent updates and clock policy                              | Duplicate request, competing reservations, expired reservation, duplicate release   |

**Suggested 90-minute structure:** 10 minutes on contracts, 15 on data
model and operations, 40 implementing the core flow, 15 on tests, 10 on
concurrency/failure trade-offs. Keep real HTTP/database integration out
of the exercise unless requested.

For concurrency tests, coordinate threads with latches/barriers and
bounded completion waits. Avoid tests whose correctness depends on
`Thread.sleep`. Verify invariants such as “accepted reservations never
exceed stock,” not just the absence of thrown exceptions.

### Six deeper backend follow-ups

**A timeout fires. Has the work stopped?** Not necessarily. Separate
stopping the caller's wait, completing a future, interrupting a worker,
canceling I/O and undoing a committed effect. Preserve interruption or
propagate it to an owner; do not retry it as a transient business
failure. Configure actual I/O deadlines and account for work that cannot
be canceled. `CompletableFuture.cancel(true)` does not interrupt its
computation. [CompletableFuture
cancellation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html).

**Can two transactions preserve each row's version and still break a
rule?** Yes. Suppose two doctors are on call and each transaction
removes a different doctor after observing the other. They update
different rows, so per-row versions alone do not preserve “at least one
doctor remains.” Enforce a common guard/locking protocol or use
serializable transactions with retry handling. PostgreSQL repeatable
read can permit serialization anomalies. [PostgreSQL
isolation](https://www.postgresql.org/docs/16/transaction-iso.html).

**The payment provider timed out. Should we mark the payment failed?** A
timeout may mean the outcome is unknown. Persist an operation identity,
reuse the provider's idempotency key, reconcile status, and expose a
pending/unknown state until evidence resolves it. A local transaction
cannot roll back a completed external charge. This is a design scenario;
the exact policy depends on the provider contract.

**How much concurrency does a service need?** Under stable conditions,
Little's Law relates mean in-flight work to mean arrival rate multiplied
by mean time in the system. At 800 requests/second and 250 ms mean
response time, mean in-flight work is about 200. This is not a
thread-pool setting: account separately for queueing, burstiness, time
spent holding each resource and safety margin. Do not substitute p99
latency into a mean-value relationship.

**Why can an additive API change still break clients?** New enum values
can break exhaustive client logic; changed null/default behavior can
alter business outcomes; wider numbers can overflow clients; additional
JSON fields can fail strict readers. Specify producer/consumer
compatibility, test representative older consumers and keep rollback
viable during mixed-version rollout.

**How do you represent money and time?** Agree on currency and rounding
rules before choosing minor-unit integers or `BigDecimal`.
Scale-sensitive `BigDecimal.equals` differs from numeric `compareTo`;
avoid binary-floating constructors for decimal input. [BigDecimal
API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html).
For time, distinguish an instant from a local calendar time and region,
inject `Clock` in business logic, and use elapsed monotonic time for
durations rather than wall-clock subtraction. Test rounding boundaries
and daylight-saving gaps/overlaps when relevant.

### Three mock rounds

1.  **Coding, 45 minutes:** count subarrays with a target sum. Introduce
    negatives after the baseline. Ask for longest matching subarray,
    overflow handling, and a brute-force reference test.
2.  **Coding, 45 minutes:** compute shortest paths in a directed
    weighted graph. Introduce unreachable vertices, zero-weight edges,
    stale heap entries and then a negative edge. Ask which assumptions
    stop holding.
3.  **Machine coding, 90 minutes:** implement a bounded per-client
    limiter with an injected ticker. Add simultaneous requests, a
    maximum client count, and idle eviction. Ask what changes across
    multiple JVMs.

For each mock, record the first incorrect assumption, time to a
compiling solution, the test that exposed the bug, and the explanation
that remained unclear. An example log entry is: “Treated negative-value
sums as a shrinking window; replace with prefix frequencies; retry after
two days.”

### Version reference and important corrections

The stable practice target is Java 21. The Java 25 entries below
describe that release specifically; preview status must be checked again
for a different target release. This table is not a declaration that
Java 25 is the newest JDK.

| Topic                         | Version-aware answer                                                                                           | Source                                                                                                                       |
|-------------------------------|----------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| Virtual threads               | Final in Java 21; monitor-related pinning changes in JDK 24                                                    | [JEP 444](https://openjdk.org/jeps/444), [JDK 24 guide](https://docs.oracle.com/en/java/javase/24/core/virtual-threads.html) |
| Scoped values                 | Final API in Java 25; not final in Java 21                                                                     | [Java 25 API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/ScopedValue.html)                       |
| Structured concurrency        | `StructuredTaskScope` is preview in Java 25; API shapes changed between previews                               | [Java 25 API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/StructuredTaskScope.html)    |
| Transaction method visibility | Spring 6 class proxies can support protected/package-visible methods; interface proxies require public methods | [Spring annotations](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html) |
| HTTP clients                  | `RestTemplate` is deprecated in Spring 7; use the correct framework version when answering                     | [Spring client reference](https://docs.spring.io/spring-framework/reference/integration/rest-clients.html)                   |
| Boot 4                        | Uses Spring Framework 7 and requires at least Java 17; verify the exact release matrix                         | [Boot 4 requirements](https://docs.spring.io/spring-boot/4.0/system-requirements.html)                                       |

The revised earlier chapters also fix the failed-transaction dedupe
example, async transaction wording, optimistic-locking claims, keyset
complexity, reactive blocking guidance, request-based versus time-based
error budgets, and several coding boundary cases. Primary-source links
are placed alongside the affected material. Cloud product capabilities
and framework defaults remain version-dependent; verify the exact target
before using an example in a real application.

<a id="part-10-web-sourced-questions-and-strong-answer-rubrics"></a>
<a id="part-10"></a>
## Part 10 - Web sourced questions and strong answer rubrics

The earlier source edition recorded a source check on **5 October 2026**. Source links are retained; this review rechecked the official references for the corrections in Appendix B. Q134-Q141 adapt public
coding-practice prompts and link to their original pages. Q142-Q153 are
interview-style scenarios derived from official Java documentation;
those pages establish the technical behavior, not that a particular
employer asks the question. All answer outlines and implementations here
are original explanations.

“Strong answer signals” below are coaching judgments based on the
problem contract and published interview guidance. They are not leaked
questions, guaranteed questions, or a company's private scoring key. A
good interview answer explains a decision that fits the constraints; it
need not match this guide word for word.

### What interviewers publicly say they assess

| Source                                                                                                               | Published emphasis                                             | How to demonstrate it                                                        |
|----------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------|------------------------------------------------------------------------------|
| [Amazon SDE II preparation](https://amazon.jobs/content/en/how-we-hire/sde-ii-interview-prep)                        | Executable, robust, scalable code and edge-case testing        | Implement the agreed solution, test it, then explain its bottleneck          |
| [Microsoft technical interviews](https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing.html) | Clarifying ambiguity, planning, coding, testing and complexity | State assumptions and an invariant before coding; check boundaries afterward |
| [Atlassian engineering interviews](https://www.atlassian.com/company/careers/resources/interviewing/engineering)     | Data structures, code design, thought process and trade-offs   | Compare credible options and adapt when the interviewer changes a constraint |

A reusable spoken structure is: **“Given these constraints, the baseline
is … Its bottleneck is … The property I can exploit is … I choose …
because … The invariant is … If this assumption changes, I would … I
will test …”** Use it to organize an explanation you understand, not as
a memorized script.

### Public coding prompts with original Java solutions

The complete runnable companion is
[WebInterviewPractice.java](code/WebInterviewPractice.java).
Run `java WebInterviewPractice.java` from its directory. This review reran it on Java 21.0.9; it passed
**12,417 checks on Java 21**, including fixed-seed comparisons with
brute-force sliding-window and parentheses solutions and a reference
minimum stack. Each code block below is extracted from that file;
imports and the enclosing class are in the companion.

#### Q134 Copy a list whose nodes also have arbitrary references

**Public prompt:** construct independent nodes while preserving both
link relationships. [Copy List with Random
Pointer](https://leetcode.com/problems/copy-list-with-random-pointer/description/).

**Derive it:** copying values is insufficient because edges must lead to
copied nodes. First create one copy per original identity; then
reconnect both edge types through that mapping.

**Choose versus alternatives:** the two-pass identity map is easy to
verify and preserves the input, using O(n) extra mapping space.
Interleaving copies between original nodes saves auxiliary mapping space
but temporarily changes the original list and complicates
restoration/failure handling. A shallow copy leaves links into the
original structure.

**What if:** duplicate node values rule out a value-keyed map. Cycles in
`random` are harmless because copies exist before wiring. A cyclic
`next` chain violates this implementation's precondition; general graph
cloning needs visited traversal.

**Trace/tests:** two nodes with equal values pointing randomly to each
other must become two distinct new objects with reciprocal new links.
Test null, self-random, null-random and input preservation. O(n) time
and mapping space, plus O(n) required output.

**Strong answer signals:** identity versus equality; no copied edge
reaches an original object; honest mutation trade-off.

```java
// Q134. Acyclic next chain; random references must stay inside that chain or be null.
public static final class RandomNode {
    public final int value;
    public RandomNode next, random;
    public RandomNode(int value) { this.value = value; }
}
public static RandomNode copyRandomList(RandomNode head) {
    Map<RandomNode, RandomNode> copies = new IdentityHashMap<>();
    for (RandomNode node = head; node != null; node = node.next)
        copies.put(node, new RandomNode(node.value));
    for (RandomNode node = head; node != null; node = node.next) {
        RandomNode copy = copies.get(node);
        copy.next = copies.get(node.next);
        copy.random = copies.get(node.random);
    }
    return copies.get(head);
}
```

#### Q135 Decide whether a string can be segmented using a dictionary

**Public prompt:** determine whether dictionary words can cover the
input in order, with reuse allowed. [Word
Break](https://leetcode.com/problems/word-break/description/).

**Derive it:** a reachable prefix followed by a matching word makes a
longer prefix reachable. A boolean DP table avoids re-solving the same
prefix.

**Choose versus alternatives:** greedy longest-prefix selection fails:
`cars` with `car`, `ca`, `rs` requires `ca` + `rs`. Plain recursion
revisits suffixes; memoized recursion is valid. This implementation
tests dictionary words with `startsWith`, avoiding repeated substring
allocation; a trie can reduce repeated prefix comparisons for large
shared-prefix dictionaries.

**What if:** requesting every segmentation requires output construction
and can be exponential. Empty words must be handled explicitly; this
implementation rejects them and treats empty input as segmentable.

**Trace/tests:** mark 0 reachable, then 2 via `ca`, then 4 via `rs`.
Test impossible suffix, word reuse and overlapping choices. For n input
length, D distinct words and maximum word length L, O(nDL) matching
time; preprocessing also reads the dictionary. O(n + D) auxiliary
references/state.

**Strong answer signals:** define reachability precisely and give a
counterexample to greedy selection.

```java
// Q135. UTF-16 string matching; empty input is segmentable. Empty dictionary words are rejected.
public static boolean wordBreak(String text, Collection<String> dictionary) {
    Objects.requireNonNull(text);
    List<String> words = List.copyOf(new LinkedHashSet<>(dictionary));
    for (String word : words)
        if (word.isEmpty()) throw new IllegalArgumentException("Empty dictionary word");
    boolean[] reachable = new boolean[text.length() + 1];
    reachable[0] = true;
    for (int start = 0; start < text.length(); start++) {
        if (!reachable[start]) continue;
        for (String word : words)
            if (text.startsWith(word, start)) reachable[start + word.length()] = true;
    }
    return reachable[text.length()];
}
```

#### Q136 Implement exact-word and prefix lookup

**Public prompt:** support insertion, exact search and prefix search.
[Implement
Trie](https://leetcode.com/problems/implement-trie-prefix-tree/description/).

**Derive it:** words sharing prefixes can share the same traversal path.
A terminal marker distinguishes a complete word from an intermediate
prefix.

**Choose versus alternatives:** a hash set handles exact search well but
does not directly index prefixes. Scanning every stored word is
expensive for repeated prefix queries. A trie spends memory on nodes;
sparse maps or compressed edges can reduce waste for larger alphabets.

**What if:** `app` is a valid prefix after inserting `apple`, but not a
stored word until inserted. The array representation assumes lowercase
ASCII. This version explicitly supports an empty word/prefix extension;
deletion needs terminal/path-liveness handling. Thread safety is not
implied.

**Trace/tests:** insert `apple`, check exact `app` false and prefix
`app` true, then insert `app`. Reject invalid letters before partial
mutation. O(L) per operation and O(total stored prefix nodes) space with
fixed alphabet.

**Strong answer signals:** separate prefix existence from word
termination and discuss the memory/alphabet trade-off.

```java
// Q136. Lowercase ASCII only. Empty word/prefix accepted as an explicit extension.
public static final class Trie {
    private static final class Node {
        final Node[] children = new Node[26];
        boolean terminal;
    }
    private final Node root = new Node();
    private static void validate(String text) {
        Objects.requireNonNull(text);
        for (int i = 0; i < text.length(); i++)
            if (text.charAt(i) < 'a' || text.charAt(i) > 'z')
                throw new IllegalArgumentException("Expected lowercase ASCII");
    }
    public void insert(String word) {
        validate(word); // Validate before mutating any nodes.
        Node node = root;
        for (int i = 0; i < word.length(); i++) {
            int index = word.charAt(i) - 'a';
            if (node.children[index] == null) node.children[index] = new Node();
            node = node.children[index];
        }
        node.terminal = true;
    }
    private Node find(String text) {
        validate(text);
        Node node = root;
        for (int i = 0; i < text.length(); i++) {
            node = node.children[text.charAt(i) - 'a'];
            if (node == null) return null;
        }
        return node;
    }
    public boolean search(String word) { Node node = find(word); return node != null && node.terminal; }
    public boolean startsWith(String prefix) { return find(prefix) != null; }
}
```

#### Q137 Return the maximum for every fixed-size sliding window

**Public prompt:** report the maximum as a fixed-width range advances.
[Sliding Window
Maximum](https://leetcode.com/problems/sliding-window-maximum/description/).

**Derive it:** an older smaller value can never win while a newer larger
value remains in the window: the newer one also expires later. Retain
only useful candidate indices in decreasing-value order.

**Choose versus alternatives:** rescanning each window costs O(nk). A
heap requires expiry management and logarithmic work; a deque exploits
the fixed left-to-right expiry order for O(n) total time. Arbitrary
range queries need a different structure, such as a segment tree.

**What if:** storing values alone loses expiry positions. Keeping older
equal values is valid with correct expiry; removing them is simpler
because the newer equal value lasts longer. If k is zero or exceeds n,
reject it.

**Trace/tests:** for `[4,1,3,2]`, k=2, return `[4,3,3]`. Test all equal,
decreasing data, k=1 and k=n. O(n) time, O(k) deque and O(n−k+1) output.

**Strong answer signals:** prove dominance and charge each index one
insertion/removal.

```java
// Q137. Requires 1 <= k <= values.length; preserves the input.
public static int[] slidingWindowMaximum(int[] values, int k) {
    Objects.requireNonNull(values);
    if (k < 1 || k > values.length) throw new IllegalArgumentException("Invalid window size");
    int[] result = new int[values.length - k + 1];
    Deque<Integer> deque = new ArrayDeque<>();
    for (int i = 0; i < values.length; i++) {
        while (!deque.isEmpty() && deque.peekFirst() <= i - k) deque.removeFirst();
        while (!deque.isEmpty() && values[deque.peekLast()] <= values[i]) deque.removeLast();
        deque.addLast(i);
        if (i >= k - 1) result[i - k + 1] = values[deque.peekFirst()];
    }
    return result;
}
```

#### Q138 Select the k points nearest the origin

**Public prompt:** retain the requested number of nearest coordinates.
[K Closest Points to
Origin](https://leetcode.com/problems/k-closest-points-to-origin/description/).

**Derive it:** square root preserves nonnegative ordering, so squared
distance suffices. Maintain a size-k max-heap whose root is the worst
retained candidate.

**Choose versus alternatives:** full sorting is simple but costs O(n log
n). Quickselect gives expected linear selection but often mutates input
and needs pivot handling. The heap fits streaming selection and small k;
this implementation additionally sorts the retained points for
deterministic output.

**What if:** distance ties need a declared rule; this code uses
coordinates. `int` multiplication can overflow before assignment, so
widen first. Even two squared arbitrary int extremes can exceed signed
long; the code bounds coordinates to ±10⁹. Different origins change the
arithmetic bounds.

**Trace/tests:** distances 25, 2, 2 with k=2 keep the latter two. Test
k=0, ties, duplicates and coordinate limits. O(n log(k+2) + k log(k+1))
time, including the linear validation pass when k=0; O(k+1) auxiliary
storage plus O(k) output. Input is preserved.

**Strong answer signals:** relate heap direction to eviction and state
arithmetic assumptions.

```java
// Q138. Coordinates bounded to +/-1e9 so the squared-distance sum fits long.
public record Point(int x, int y) {
    public Point {
        if (Math.abs((long) x) > 1_000_000_000L || Math.abs((long) y) > 1_000_000_000L)
            throw new IllegalArgumentException("Coordinate outside supported range");
    }
    long squaredDistance() { return (long) x * x + (long) y * y; }
}
public static List<Point> kClosest(List<Point> points, int k) {
    Objects.requireNonNull(points);
    if (k < 0 || k > points.size()) throw new IllegalArgumentException("Invalid k");
    Comparator<Point> order = Comparator.comparingLong(Point::squaredDistance)
        .thenComparingInt(Point::x).thenComparingInt(Point::y);
    PriorityQueue<Point> heap = new PriorityQueue<>(order.reversed());
    for (Point point : points) {
        heap.add(Objects.requireNonNull(point));
        if (heap.size() > k) heap.remove();
    }
    List<Point> result = new ArrayList<>(heap);
    result.sort(order); // Deterministic output, including ties.
    return result;
}
```

#### Q139 Build a stack with constant-time minimum lookup

**Public prompt:** support ordinary stack operations plus retrieval of
its current minimum. [Min
Stack](https://leetcode.com/problems/min-stack/description/).

**Derive it:** after a pop, the minimum must revert to the minimum of
the previous prefix. Store the prefix minimum alongside each pushed
value.

**Choose versus alternatives:** scanning on every minimum query costs
O(n); a heap supports a different removal order. A second minimum stack
is valid but needs careful handling of repeated minima. A linked entry
per push avoids backing-array resize and gives O(1) structural work per
operation.

**What if:** storing only one global minimum cannot restore the previous
minimum after popping. Arithmetic encoding tricks require overflow care.
Concurrent use needs synchronization around the whole state transition;
this implementation is single-threaded.

**Trace/tests:** push 2, −1, −1; after one pop the minimum remains −1,
and after the next it becomes 2. Test integer extremes and empty-stack
behavior. O(n) stored entries; output operations are constant-time
structurally.

**Strong answer signals:** explain why each entry stores historical
information, including duplicate minima.

```java
// Q139. Single-threaded linked stack; all four operations have O(1) structural work.
public static final class MinStack {
    private record Entry(int value, int minimum, Entry previous) {}
    private Entry head;
    public void push(int value) {
        head = new Entry(value, head == null ? value : Math.min(value, head.minimum()), head);
    }
    private Entry topEntry() {
        if (head == null) throw new NoSuchElementException("Empty stack");
        return head;
    }
    public int pop() { Entry entry = topEntry(); head = entry.previous(); return entry.value(); }
    public int top() { return topEntry().value(); }
    public int minimum() { return topEntry().minimum(); }
}
```

#### Q140 Decode nested repetition expressions

**Public prompt:** expand nested count-and-bracket expressions. [Decode
String](https://leetcode.com/problems/decode-string/description/).

**Derive it:** entering brackets suspends an outer prefix and repetition
count. A frame stack preserves that context until the matching close
arrives.

**Choose versus alternatives:** recursive descent is equally natural but
consumes call-stack depth. Repeated regex replacement obscures nesting
and repeats scans. An explicit stack exposes parser state and enables
clear validation.

**What if:** multiple digits form one count; unmatched brackets or
missing counts are errors under the extended validated contract.
Expansion can be much larger than input, so cap output before allocation
and use checked count arithmetic. Empty groups should not trigger
billions of empty appends.

**Trace/tests:** `2[a3[b]]z` yields `abbbabbbz`. Test nested groups,
adjacent groups, malformed input, count overflow and output limits. Let
M be decoded length and d nesting depth: this builder implementation can
copy intermediate expansions at multiple levels, giving O(n + dM) time
in a conservative bound and O(n + M) space. Do not claim O(input
length).

**Strong answer signals:** distinguish parsing cost from expansion cost
and bound amplification.

```java
// Q140. Grammar: lowercase literals and positive-int repetitions. Cap expanded output.
private record DecodeFrame(StringBuilder prefix, int repetitions) {}
public static String decode(String encoded, int maxOutputLength) {
    Objects.requireNonNull(encoded);
    if (maxOutputLength < 0) throw new IllegalArgumentException("Negative output limit");
    Deque<DecodeFrame> frames = new ArrayDeque<>();
    StringBuilder current = new StringBuilder();
    int count = 0;
    boolean digits = false;
    for (int i = 0; i < encoded.length(); i++) {
        char c = encoded.charAt(i);
        if (c >= '0' && c <= '9') {
            count = Math.addExact(Math.multiplyExact(count, 10), c - '0');
            digits = true;
        } else if (c == '[') {
            if (!digits || count == 0) throw new IllegalArgumentException("Missing positive count");
            frames.push(new DecodeFrame(current, count));
            current = new StringBuilder(); count = 0; digits = false;
        } else if (c == ']') {
            if (digits || frames.isEmpty()) throw new IllegalArgumentException("Malformed close");
            DecodeFrame frame = frames.pop();
            long size = (long) current.length() * frame.repetitions() + frame.prefix().length();
            if (size > maxOutputLength) throw new IllegalArgumentException("Output limit exceeded");
            StringBuilder expanded = frame.prefix();
            if (!current.isEmpty())
                for (int repeat = 0; repeat < frame.repetitions(); repeat++) expanded.append(current);
            current = expanded;
        } else {
            if (digits || c < 'a' || c > 'z') throw new IllegalArgumentException("Invalid literal");
            if (current.length() >= maxOutputLength) throw new IllegalArgumentException("Output limit exceeded");
            current.append(c);
        }
    }
    if (digits || !frames.isEmpty()) throw new IllegalArgumentException("Incomplete encoding");
    return current.toString();
}
```

#### Q141 Find the longest valid parentheses substring

**Public prompt:** find the longest contiguous balanced region, not
merely whether the whole string is balanced. [Longest Valid
Parentheses](https://leetcode.com/problems/longest-valid-parentheses/description/).

**Derive it:** store unmatched opening indices plus a boundary before
the current candidate region. A matched close exposes the index
immediately before the valid suffix, giving its length by subtraction.

**Choose versus alternatives:** testing all substrings repeats work. DP
ending at each index is also O(n), but its transition is less direct. A
two-direction counter method uses O(1) extra space for this
one-bracket-type problem; the stack makes positional boundaries easy to
explain.

**What if:** using only total counts misses invalid ordering. Without
the initial −1 boundary, a valid substring starting at zero is awkward
to measure. When a close has no matching open, reset the boundary to
that close.

**Trace/tests:** `)()())` has maximum length four. Test empty, all
openings, nested pairs and multiple separated regions. O(n) time and
O(n) stack; preserving the winning end index also returns the substring.

**Strong answer signals:** explain what each stored index means and why
a bad close resets the boundary.

```java
// Q141. Parentheses only; returns length, not the substring.
public static int longestValidParentheses(String text) {
    Objects.requireNonNull(text);
    Deque<Integer> positions = new ArrayDeque<>();
    positions.push(-1); // Boundary immediately before the current candidate region.
    int best = 0;
    for (int i = 0; i < text.length(); i++) {
        char c = text.charAt(i);
        if (c == '(') positions.push(i);
        else if (c == ')') {
            positions.pop();
            if (positions.isEmpty()) positions.push(i);
            else best = Math.max(best, i - positions.peek());
        } else throw new IllegalArgumentException("Expected parentheses only");
    }
    return best;
}
```

### Java scenarios with strong spoken answers

#### Q142 Can a method swap the caller's two object references

**Source basis:** [Java method
arguments](https://docs.oracle.com/javase/tutorial/java/javaOO/arguments.html).

**Strong answer:** Java passes values. For an object argument, that
value is a reference. Reassigning two local parameters changes only
those local copies; mutating a referenced object's state can be visible
to the caller. Return the desired pair or mutate an explicitly owned
container when that is the contract.

**Reasoning and alternatives:** distinguish the variable holding a
reference from the object it identifies. A wrapper does not turn Java
into pass-by-reference; it introduces shared mutable state.

**What if/test:** `a.add(x)` can affect the caller's list, whereas
`a = new ArrayList<>()` cannot replace the caller's variable. Test
aliasing where both arguments refer to the same object. **Signal:** give
a concrete mutation/reassignment distinction, not just a slogan.

#### Q143 Is a record containing a list immutable and safe as a map key

**Source basis:** [Record
API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Record.html),
[List copy
contracts](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html).

**Strong answer:** record components have final references; referenced
objects can still be mutable. Copy the list on construction when the
type owns it, and ensure its elements are also suitably immutable.
Changing equality-relevant contents after insertion can invalidate
hash-collection behavior.

**Reasoning and alternatives:** an unmodifiable view still reflects
changes to its backing collection. A shallow snapshot isolates list
structure but not mutable elements. Deep copying has costs and requires
a domain contract.

**What if/test:** mutate the original list, then an element, and check
which changes affect the record. Test null policy before choosing
`List.copyOf`. **Signal:** distinguish final reference, unmodifiable
collection, snapshot and deep immutability.

#### Q144 Why did a TreeSet keep one of two different objects

**Source basis:** [TreeSet ordering
contract](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeSet.html).

**Strong answer:** a sorted set uses comparison result zero to identify
equivalent entries. Comparing employees only by salary can collapse
distinct employees with equal salaries. If identity matters, add a
stable distinguishing key or choose a collection that permits
duplicates.

**Reasoning and alternatives:** a HashSet uses equals/hashCode, while a
List preserves duplicates. Pick the structure after deciding the
intended uniqueness rule; do not patch the comparator merely to force
every comparison nonzero.

**What if/test:** compare two equal-salary employees with different IDs,
then test comparator transitivity and extreme numbers. Subtraction can
overflow; use comparator factories. **Signal:** connect ordering
equality to collection identity and preserve comparator laws.

#### Q145 Does ConcurrentHashMap make a contained ArrayList thread-safe

**Source basis:** [ConcurrentHashMap
API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html).

**Strong answer:** it protects map operations, not arbitrary later
mutations of its values. Multiple callers modifying the same ArrayList
still race. Choose confinement, a suitable concurrent value, immutable
replacement via an atomic map operation, or one clear lock around the
compound invariant.

**Why not just synchronize put:** the mutation may happen after lookup,
outside that lock. **What if/test:** two writers append to one value;
also test removing/replacing that value while another caller retains its
reference. **Signal:** identify the actual shared state and required
atomic operation.

#### Q146 Should computeIfAbsent perform a slow remote call

**Source basis:** [ConcurrentHashMap
computeIfAbsent](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html#computeIfAbsent(K,java.util.function.Function)).

**Strong answer:** keep its mapping function short and simple; a long
computation can block competing updates. For expensive loading, consider
a bounded cache with explicit load coalescing, timeout and failure
policy.

**Trade-off:** loading outside the map may duplicate work. Caching a
future can coordinate callers but must define failed-future eviction and
cancellation ownership. **What if/test:** the loader throws, returns
null, or recursively updates the map. **Signal:** explain both
contention and failure lifecycle instead of assuming “atomic” means
cheap.

#### Q147 When should thenCompose replace thenApply

**Source basis:** [CompletionStage
API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletionStage.html).

**Strong answer:** use `thenApply` when the function returns an ordinary
value; use `thenCompose` when it returns another stage that should
become part of the dependency chain. Otherwise the result is a nested
future. Use combination when two independent stages are both required.

**Reasoning and alternatives:** blocking with `join` inside the mapping
callback can occupy a limited executor and hide asynchronous
dependencies. Async method names do not by themselves define a
sufficient resource policy.

**What if/test:** let the second stage fail or finish later; verify the
composed result follows it. Check both failure propagation and execution
context. **Signal:** draw the dependency relationship and distinguish
sequencing from parallel fan-out.

#### Q148 Why is a thread pool not growing to its configured maximum

**Source basis:** [ThreadPoolExecutor sizing and
queues](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html).

**Strong answer:** after reaching core size, the executor normally tries
to queue work. An unbounded queue accepts it, so the maximum size does
not create more workers in the usual saturation path. Inspect queue
depth, task wait time and downstream capacity before changing sizes.

**Reasoning and alternatives:** a bounded queue makes overload explicit;
rejection, caller execution and shedding have different contracts.
CallerRuns can slow producers but can also block an event loop and
discards rejected work after shutdown.

**What if/test:** run tasks that wait for subtasks submitted to the same
full pool; spare thread counts alone may not establish progress.
**Signal:** explain the submission decision order and a deliberate
rejection/deadline policy.

#### Q149 Which failure survives when both work and resource closing fail

**Source basis:** [Try-with-resources
tutorial](https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html).

**Strong answer:** if the body throws, that failure remains primary and
close failures are suppressed; inspect `getSuppressed()` when diagnosing
cleanup. Resources close in reverse declaration order. If the body
succeeds, a close failure can be the thrown exception.

**Reasoning and alternatives:** a manual finally block can accidentally
replace the original error or return over it. Use try-with-resources for
resources whose ownership belongs to the method; do not close a borrowed
resource without an ownership contract.

**What if/test:** make both body and close throw distinct messages and
assert primary plus suppressed failures. **Signal:** discuss error
preservation and ownership, not only “it closes automatically.”

#### Q150 Why did adding to Stream.toList fail

**Source basis:** [Stream.toList
API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html#toList()).

**Strong answer:** the result is unmodifiable. If callers need a mutable
collection, collect into an explicit `ArrayList` or copy the result.
`Collectors.toList()` does not promise a particular mutable
implementation either.

**Reasoning and alternatives:** decide whether ownership permits
mutation; avoid relying on a currently observed concrete class.
Unmodifiable structure does not make its elements immutable.

**What if/test:** adding/removing must fail under the unmodifiable
contract, while mutating a mutable element may still succeed.
**Signal:** separate API guarantees from implementation accidents and
document the return contract.

#### Q151 Why can decimal equality disagree with numeric ordering

**Source basis:** [BigDecimal
API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html).

**Strong answer:** `BigDecimal.equals` considers scale, while
`compareTo` compares numeric value. Consequently 1.0 and 1.00 can
compare as zero without being equal. Pick a domain policy for scale,
currency and rounding before normalizing keys or values.

**Reasoning and alternatives:** binary floating point is inappropriate
when exact decimal semantics are required; integer minor units work only
with an agreed unit and range. Do not apply arbitrary rounding merely to
make a test pass.

**What if/test:** compare HashSet and TreeSet behavior, division with a
nonterminating decimal result, and rounding boundaries. **Signal:**
relate representation and equality to the business contract.

#### Q152 Does loading a class always execute its static initializer

**Source basis:** [Java initialization
rules](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.4).

**Strong answer:** loading, linking and initialization are different
stages. Specified active uses trigger initialization; reading a
compile-time constant can be inlined without initializing the declaring
class. Class-loading APIs also expose initialization choices.

**Reasoning and alternatives:** avoid guessing order solely from source
appearance. Determine the exact operation and whether it requires
initialization, then apply superclass rules. Static initialization is
not a suitable place for arbitrary fragile remote work.

**What if/test:** contrast a compile-time constant with a nonconstant
static field and explicit reflective loading with initialization
disabled. **Signal:** reason from the trigger rather than asserting “at
class load.”

#### Q153 Is volatile enough for publishing an object and incrementing a counter

**Source basis:** [Java happens-before
rules](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5).

**Strong answer:** a volatile publication can establish visibility for
preceding initialization writes to a reader observing that publication.
It does not make subsequent mutable operations atomic. `count++` still
combines a read, arithmetic and write, so competing increments can be
lost.

**Reasoning and alternatives:** use an atomic primitive for a single
atomic update, or locking when multiple fields must change together.
Immutability or confinement may remove the need for shared mutation.

**What if/test:** publishing before initialization completes defeats the
intended ordering; changing fields later needs its own synchronization.
Use coordinated concurrency tests to probe invariants, while explaining
that a passing stress run is not a proof of memory-model correctness.
**Signal:** identify the specific happens-before edge and the invariant
it does - and does not - protect.

<a id="part-11-decision-walkthroughs-for-the-full-practice-roadmap"></a>
<a id="part-11"></a>
## Part 11 - Decision walkthroughs for the full practice roadmap

Every roadmap item below has either a worked implementation elsewhere in
the guide or a decision walkthrough here. Walkthrough-only entries
intentionally focus on deriving a solution; they are not additional
tested Java programs. Write the implementation yourself, then use the
stated trace and boundary conditions to review it.

### Roadmap coverage index

| Problem                                | Solution and reasoning                                                             |
|----------------------------------------|------------------------------------------------------------------------------------|
| 1\. Two Sum                            | [Decision walkthrough](#r1-two-sum)                                                |
| 2\. Subarray Sum Equals K              | [Decision walkthrough](#solution-2-subarray-sum-equals-a-target)                   |
| 3\. Longest Consecutive Sequence       | [Decision walkthrough](#r3-longest-consecutive-sequence)                           |
| 4\. Three Sum                          | [Decision walkthrough](#r4-three-sum)                                              |
| 5\. Container With Most Water          | [Decision walkthrough](#r5-container-with-most-water)                              |
| 6\. Trapping Rain Water                | [Decision walkthrough](#r6-trapping-rain-water)                                    |
| 7\. Longest Substring Without Repeats  | [Decision walkthrough](#8-quick-algorithm-warm-ups)                                |
| 8\. Minimum Window Substring           | [Decision walkthrough](#r8-minimum-window-substring)                               |
| 9\. Permutation in String              | [Decision walkthrough](#r9-permutation-in-string)                                  |
| 10\. Lower Bound                       | [Decision walkthrough](#solution-1-lower-bound)                                    |
| 11\. Search Rotated Array              | [Decision walkthrough](#4-search-in-a-rotated-sorted-array-olog-n)                 |
| 12\. Minimum Feasible Processing Speed | [Decision walkthrough](#r12-minimum-feasible-processing-speed)                     |
| 13\. Merge Intervals                   | [Decision walkthrough](#4-merge-overlapping-intervals-on-log-n)                    |
| 14\. Meeting Rooms II                  | [Decision walkthrough](#r14-meeting-rooms-ii)                                      |
| 15\. Insert Interval                   | [Decision walkthrough](#r15-insert-interval)                                       |
| 16\. Reverse List                      | [Decision walkthrough](#r16-reverse-linked-list)                                   |
| 17\. Detect Cycle                      | [Decision walkthrough](#8-quick-algorithm-warm-ups)                                |
| 18\. Merge K Sorted Lists              | [Decision walkthrough](#r18-merge-k-sorted-lists)                                  |
| 19\. Valid Parentheses                 | [Decision walkthrough](#1-valid-parentheses-stack)                                 |
| 20\. Daily Temperatures                | [Decision walkthrough](#solution-3-next-warmer-day)                                |
| 21\. Largest Rectangle in Histogram    | [Decision walkthrough](#r21-largest-rectangle-in-histogram)                        |
| 22\. Level Order                       | [Decision walkthrough](#4-binary-tree-level-order-traversal-bfs)                   |
| 23\. Lowest Common Ancestor            | [Decision walkthrough](#r23-lowest-common-ancestor)                                |
| 24\. Serialize and Deserialize a Tree  | [Decision walkthrough](#r24-serialize-and-deserialize-a-tree)                      |
| 25\. Top K Frequent                    | [Decision walkthrough](#3-top-k-frequent-elements-min-heap-on-log-k)               |
| 26\. Median of a Stream                | [Decision walkthrough](#solution-8-running-median)                                 |
| 27\. Kth Largest                       | [Decision walkthrough](#5-find-the-k-th-largest-element-quickselect-idea-vs-heap)  |
| 28\. Number of Islands                 | [Decision walkthrough](#2-number-of-islands-dfs-orows--cols)                       |
| 29\. Clone Graph                       | [Decision walkthrough](#r29-clone-graph)                                           |
| 30\. Course Schedule                   | [Decision walkthrough](#3-build-order-with-cycle-detection-kahns-topological-sort) |
| 31\. Network Delay                     | [Decision walkthrough](#solution-4-dijkstra-shortest-paths)                        |
| 32\. Minimum-Cost Grid Path            | [Decision walkthrough](#r32-minimum-cost-grid-path)                                |
| 33\. Redundant Connection              | [Decision walkthrough](#r33-redundant-connection)                                  |
| 34\. Accounts Merge                    | [Decision walkthrough](#r34-accounts-merge)                                        |
| 35\. Combination Sum                   | [Decision walkthrough](#solution-7-combination-sum)                                |
| 36\. Subsets With Duplicates           | [Decision walkthrough](#r36-subsets-with-duplicates)                               |
| 37\. Word Search                       | [Decision walkthrough](#r37-word-search)                                           |
| 38\. Coin Change                       | [Decision walkthrough](#3-coin-change-fewest-coins-dp-oamount--coins)              |
| 39\. Edit Distance                     | [Decision walkthrough](#solution-6-edit-distance)                                  |
| 40\. Longest Increasing Subsequence    | [Decision walkthrough](#r40-longest-increasing-subsequence)                        |

### Additional algorithm walkthroughs

#### R1 Two Sum

**Derive and choose:** enumerate pairs as an O(n²) baseline. For each
current value x, the needed partner is target−x; a map of earlier values
answers that lookup in expected O(1). Store indices because the result
requests positions.

**Why not others:** sorting plus two pointers uses O(n log n) time and
needs original indices; it is attractive if sorted input is already
available or memory constraints favor that representation.

**What if:** insert x before lookup and a value can match itself.
Duplicate values can still be a valid pair at different indices. Widen
arithmetic if target−x can overflow. All-pairs output requires a
different duplicate/output policy.

**Trace/test and signal:** `[3,3]`, target 6: first 3 is stored; second
finds index zero. Test absent pair and one-element input. Expected O(n)
time, O(n) space. Explain the “earlier indices only” invariant.

#### R3 Longest Consecutive Sequence

**Derive and choose:** use a set for membership, but grow a run only
from values whose predecessor is absent. Otherwise the same long run is
traversed repeatedly.

**Why not others:** sorting and scanning is a correct O(n log n)
alternative with straightforward duplicate handling. A set gives
expected O(n) work because each distinct element belongs to one expanded
run.

**What if:** iterating duplicate input values as starts can repeat whole
runs; iterate the set. Guard integer minimum/maximum when computing
predecessor/successor, or store widened values. Sorting in place changes
the input.

**Trace/test and signal:** `[100,4,200,1,3,2,2]` has run 1-4. Test
empty, all duplicates and integer extremes. O(distinct values) space.
Prove each distinct value is expanded at most once.

#### R4 Three Sum

**Derive and choose:** sort, fix one value, and use two pointers for the
remaining pair. Sorted order tells which pointer to move when the sum is
too low or too high.

**Why not others:** three nested loops cost O(n³). Repeated hash-based
pair search gives expected O(n²) too, but deduplicating value triplets
is often less direct. Sorting plus pointers gives O(n²) scanning after
sorting.

**What if:** skipping all duplicates before finding a pair can lose
valid repeated-value triplets; skip repeated anchors and skip repeated
pair values after processing a match. Use long for the sum. Clarify
unique value triplets versus all index triples.

**Trace/test and signal:** `[-1,0,1,2,-1,-4]` yields two unique zero-sum
triplets. Test `[0,0,0,0]`, fewer than three elements and extremes.
Count output and sorting workspace. Explain both pointer elimination and
duplicate policy.

#### R5 Container With Most Water

**Derive and choose:** area is width times the shorter boundary. Start
at both ends; moving the taller boundary inward cannot improve area
while the shorter boundary stays fixed, so discard the shorter one.

**Why not others:** testing every pair costs O(n²). A stack can
represent some boundary problems but is unnecessary because the
shorter-boundary argument directly eliminates candidates.

**What if:** moving the taller pointer lacks that proof and can miss the
optimum. Negative heights violate the model. Widen width×height before
multiplication; define fewer than two bars as zero area.

**Trace/test and signal:** heights `[1,8,6,2,5,4,8,3,7]` yield area 49.
Test equal ends, all zeros and two bars. O(n) time, O(1) auxiliary
space. State the elimination argument rather than simply naming two
pointers.

#### R6 Trapping Rain Water

**Derive and choose:** water above a bar is bounded by the smaller of
the greatest heights to its left and right. Prefix/suffix maxima give an
easy O(n)-space solution; two running maxima can reduce space to O(1).

**Why not others:** rescanning both sides for every bar costs O(n²). A
monotonic stack is also O(n) and useful for explaining basin boundaries,
but needs width calculations.

**What if:** in the two-pointer variant, process the side with the
smaller known maximum because the other side already supplies a
sufficient boundary. Confusing this with the container objective
produces a wrong recurrence. Widths other than one require weighting
accumulated water.

**Trace/test and signal:** `[3,0,2,0,4]` holds seven units. Test
monotone input, a plateau and all zeros. O(n) time; use long for large
totals. Explain why the chosen side's water is final before advancing.

#### R8 Minimum Window Substring

**Public practice reference:** [Minimum Window
Substring](https://leetcode.com/problems/minimum-window-substring/description/).

**Derive and choose:** maintain required multiplicities in a moving
window. Expand until all required counts are satisfied; then shrink
while still valid, recording the best range.

**Why not others:** examining every substring repeats character counts.
Sorting destroys contiguity. A set loses repeated requirements, such as
needing two `a` characters.

**What if:** updating the number of satisfied requirements on every
occurrence instead of threshold crossings breaks duplicates. Define an
empty-target policy; distinguish ASCII arrays from Unicode maps. Return
a range first and create the result substring once.

**Trace/test and signal:** `ABAAC` with required `AAC` yields `AAC`.
Test no match and repeated targets. Expected O(source length + target
length) time and O(alphabet) counts. Explain why each pointer moves only
forward and how validity changes at a boundary.

#### R9 Permutation in String

**Derive and choose:** a matching permutation has the same length and
character counts as the pattern. Slide a fixed-width window, removing
the outgoing character and adding the incoming one.

**Why not others:** generating all permutations is factorial work.
Sorting every window repeats O(k log k) work; fixed-alphabet counts
allow linear traversal.

**What if:** duplicates require counts, not membership. A mismatch
counter must change only when a character's equality with the target
count changes. If pattern length exceeds input length, fail immediately.
Declare empty-pattern behavior.

**Trace/test and signal:** pattern `ab` in `eidbaooo` matches at `ba`;
`aa` does not match a window with one a. O(n + k) time for fixed
alphabet and O(alphabet) state. Explain the fixed-window invariant and
test entry/exit of the same character.

#### R12 Minimum Feasible Processing Speed

**Derive and choose:** if speed v meets the deadline, every larger speed
also does. Binary search this monotone feasibility predicate; calculate
work time with ceiling division and stop early if the budget is
exceeded.

**Why not others:** searching every speed is proportional to the numeric
range. A greedy average ignores indivisible work units and per-item
rounding.

**What if:** no speed is feasible when each nonempty work item needs at
least one unit of time and the deadline is too short.
`(pile + speed - 1)` can overflow; use long or division/remainder. An
empty workload needs its own minimum-speed convention.

**Trace/test and signal:** piles `[3,6,7,11]` in eight hours need speed
four. Test deadline equal to item count and one huge pile. O(n log M)
time, O(1) space for maximum pile M. Prove monotonicity and state the
feasible-bound invariant.

#### R14 Meeting Rooms II

**Derive and choose:** when a meeting begins, reuse the room whose
current meeting ends first if it is available; otherwise allocate
another. A min-heap stores active room end times.

**Why not others:** comparing all pairs does not directly produce peak
overlap efficiently. Sorting start/end event arrays and sweeping is
equally valid, often simpler when only the count is needed; a heap can
also retain room assignments.

**What if:** for half-open meetings, end time equal to a new start frees
a room. Closed intervals need different tie handling. Zero-length events
need an explicit policy. Reject reversed endpoints.

**Trace/test and signal:** `[0,30), [5,10), [15,20)` needs two rooms.
Test simultaneous starts and touching meetings. O(n log n) time and O(n)
worst-case state. Explain why the peak active count is a lower bound and
is achievable.

#### R15 Insert Interval

**Derive and choose:** with sorted, nonoverlapping existing intervals,
copy those entirely before the new one, merge the contiguous overlap
block, then copy the rest.

**Why not others:** appending and sorting is correct but spends O(n log
n) on an ordering guarantee already supplied. An interval tree is useful
for many dynamic updates, not necessary for one insertion.

**What if:** unsorted or overlapping input invalidates the three-phase
assumption; normalize first or use general merge. Decide
touching-boundary semantics and whether returned intervals may alias
input arrays.

**Trace/test and signal:** insert `[2,5]` into `[1,3], [6,9]` to get
`[1,5], [6,9]` under closed semantics. Test before all, after all,
containing all and empty input. O(n) time plus O(n) output. State why
overlaps form one contiguous block.

#### R16 Reverse Linked List

**Derive and choose:** maintain a reversed prefix and an untouched
suffix. Save the next node before redirecting the current node's next
pointer; then advance both boundaries.

**Why not others:** recursion is concise but consumes O(n) call-stack
space. An explicit stack also uses O(n) space. In-place iteration uses
O(1) auxiliary state when mutation is permitted.

**What if:** changing next before saving it loses the suffix. Shared
external references observe the reversed links; copy nodes if
preservation is required. A cyclic input violates the ordinary
terminating traversal contract.

**Trace/test and signal:** `1→2→3` becomes `3→2→1`; the former head must
end at null. Test empty, singleton and two nodes. O(n) time. Explain the
prefix/suffix invariant after each pointer update.

#### R18 Merge K Sorted Lists

**Derive and choose:** the next globally smallest value must be among
the current heads of nonempty lists. Keep those heads in a min-heap;
after removal, add that node's successor.

**Why not others:** repeatedly scanning k heads costs O(Nk). Balanced
pairwise merging also gives O(N log k) time and avoids heap bookkeeping;
concatenating and sorting ignores existing order.

**What if:** disjoint acyclic input lists are assumed when reusing
nodes. Shared tails can cause duplicated output or cycles under careless
rewiring. Copy nodes when ownership or aliasing requires it. Equal
values need only stable tie-breaking if the contract requests stability.

**Trace/test and signal:** merge `[1,4]`, `[1,3]`, and empty into
`[1,1,3,4]`. O(N log(k+1)) time, O(k) frontier, plus output if copied.
Test many empty lists and one very long list. Prove why no hidden
non-head can be smaller.

#### R21 Largest Rectangle in Histogram

**Derive and choose:** each bar can define a rectangle extending until a
smaller bar blocks it on either side. An increasing-height stack
discovers the right boundary when a smaller incoming height arrives.

**Why not others:** expanding from every bar costs O(n²). Precomputing
previous/next smaller boundaries is another O(n) stack formulation. A
single-pass stack computes areas as boundaries become known.

**What if:** after popping index p, width is currentIndex minus the new
stack top minus one; if empty, it extends to zero. Equal-height handling
must be consistent. Add a final zero sentinel or drain the stack. Use
long for area.

**Trace/test and signal:** `[2,1,5,6,2,3]` has area ten from heights
5/6. Test increasing, decreasing, all equal and zero bars. O(n) time and
stack space. Explain both boundaries and why the popped bar cannot
extend farther.

#### R23 Lowest Common Ancestor

**Derive and choose:** in a general binary tree, ask each subtree
whether it contains a target. If targets are found on different sides,
the current node is their lowest meeting point; otherwise propagate the
found node upward.

**Why not others:** ancestor sets or parent-pointer paths are simple
when parent links exist. A BST can use ordering to choose one branch,
but that proof is invalid for an arbitrary binary tree.

**What if:** the usual recursion assumes both targets exist; otherwise
it may return the one found as if it were an LCA. Track presence or
validate membership when absence is allowed. Compare node identity, not
only duplicated values.

**Trace/test and signal:** targets in different root branches yield
root; a target that is ancestor of the other yields itself. Test same
node, missing node and skewed tree. O(n) time and O(height) stack. State
the meaning of the recursive return value and membership assumptions.

#### R24 Serialize and Deserialize a Tree

**Derive and choose:** values alone do not describe shape. Preorder
traversal with explicit null markers provides a parseable recursive
description: node, left subtree, right subtree.

**Why not others:** inorder values alone are ambiguous; level order plus
null markers is also valid and avoids recursive traversal. JSON objects
may be simpler for an application, with a defined schema and payload
budget.

**What if:** omitting null markers makes a left-only child and
right-only child indistinguishable. Values containing delimiters need
escaping or a length-prefixed encoding. Deep trees, huge payloads and
malformed input need depth/size/token limits.

**Trace/test and signal:** tree 1 with left child 2 and no right child
can encode as `1,2,#,#,#`. Test `decode(encode(tree))` for shape and
values, null root and negative values. O(n) nodes plus encoded-character
processing; O(height) recursive stack. Explain framing and validate
complete token consumption.

#### R29 Clone Graph

**Derive and choose:** preserve graph topology while creating new
identities. On first seeing a node, allocate and register its clone
before exploring neighbors; then reuse the mapping for every edge.

**Why not others:** recursively copying without a visited map loops on
cycles and duplicates shared neighbors. BFS and DFS are both O(V + E);
iterative BFS avoids deep call-stack limits.

**What if:** duplicate node labels rule out a value-keyed map.
Self-loops must point to the clone itself. A graph reachable from one
root excludes disconnected components unless they are supplied as
additional roots.

**Trace/test and signal:** A↔B clones into new A′↔B′ with no edges to
originals. Test self-loop, repeated edges, shared neighbors and null
root. O(V + E) output and O(V) traversal/mapping state. State the
one-original-to-one-clone invariant.

#### R32 Minimum-Cost Grid Path

**Derive and choose:** define vertices as cells and edges as allowed
moves. If arbitrary moves have nonnegative costs, use Dijkstra from the
start; define whether cost belongs to entering a cell or traversing an
edge.

**Why not others:** BFS only minimizes the number of equal-cost moves.
If movement is restricted to right/down, the graph is acyclic and a
simpler DP gives O(rows × columns) time. For zero/one edge costs, 0-1
BFS is another specialized choice.

**What if:** negative moves break Dijkstra's proof; diagonal moves
change connectivity. A minimum-total-cost path and a path minimizing its
largest edge are different objectives and require different relaxation
functions.

**Trace/test and signal:** in a 2×2 grid with entry costs
`[[0,100],[1,1]]`, right/down total cost is minimized by going down then
right. Test unreachable cells and one-cell grids. For ordinary
four-neighbor nonnegative costs, heap-based work is O(RC log(RC)) with
O(RC) state. Derive the graph and objective before naming an algorithm.

#### R33 Redundant Connection

**Derive and choose:** process undirected edges incrementally; if both
endpoints already have the same representative, adding the edge creates
a cycle. Use the disjoint-set implementation in Part 9.

**Why not others:** DFS reachability before each edge works but repeats
traversal. One DFS is appropriate for finding cycles in a static graph,
whereas union-find matches incremental connectivity.

**What if:** a directed graph requires a different cycle criterion.
Parallel edges and self-edges may themselves be cycles under the chosen
graph definition. “First redundant edge” and “last removable edge” can
require different output handling.

**Trace/test and signal:** edges 1-2, 2-3, 1-3 flag the third edge.
Initialization is O(V); processing is O(E α(V)) amortized and O(V)
space. Explain what union returning false means, and match it to the
exact requested edge.

#### R34 Accounts Merge

**Derive and choose:** shared email identity connects account records
transitively. Map each email to a representative account and union
accounts sharing an email; then group and sort emails by final root.

**Why not others:** a graph of email/account relationships plus DFS
works too. Comparing every pair of accounts repeats expensive
intersections. Equal display names alone are not evidence of shared
identity.

**What if:** duplicate emails in one account must not duplicate output.
Conflicting names within one connected group need a policy rather than
arbitrary selection. Accounts without emails need explicit treatment.
Never perform real identity merging from this toy rule without a domain
contract.

**Trace/test and signal:** one account shares x with a second, which
shares y with a third; all three merge even without direct overlap
between first and third. Expected union work is near-linear in email
occurrences plus output sorting; space is proportional to accounts and
distinct emails. Explain the equivalence relation and transitivity.

#### R36 Subsets With Duplicates

**Derive and choose:** enumerate include/skip choices, but ensure equal
values do not start the same branch twice. Sort and skip an equal
candidate only when it is a duplicate sibling at the current recursion
depth.

**Why not others:** generating every index subset then deduplicating
outputs wastes work and requires canonical keys. Counting multiplicities
and choosing 0..count copies of each value is an equally sound
alternative.

**What if:** skipping every repeated value globally loses valid subsets
containing two copies. Store a copy of the current path, not the mutable
path itself. Sorting mutates input unless copied first.

**Trace/test and signal:** `[1,2,2]` has six unique subsets including
`[2,2]`. Test empty and all-equal input. Worst-case O(n 2ⁿ) output work
and O(n) auxiliary path/recursion space. Explain the difference between
duplicate sibling choices and legitimate repeated selections.

#### R37 Word Search

**Derive and choose:** try each matching start cell; recursively match
the next character through permitted neighbors while marking cells used
on the current path. Undo the mark when that branch returns.

**Why not others:** a global visited set rejects valid later paths; this
constraint is path-specific. BFS that tracks entire used-cell sets can
use large memory. A trie is useful when searching for many words
together, not necessary for one word.

**What if:** reusing a cell is forbidden in the usual contract. If
diagonal moves are allowed, branching and answers change. An in-place
sentinel must not collide with valid input; restore it on every exit
path.

**Trace/test and signal:** board `AB` cannot form `ABA` without reuse.
Test repeated letters, word longer than cell count and failed branches
followed by success. A simple upper bound is O(RC × 4ᴸ), auxiliary O(L)
path depth, excluding an optional visited grid. Explain
choose/explore/unchoose and preservation of input.

#### R40 Longest Increasing Subsequence

**Derive and choose:** an O(n²) DP computes the best subsequence ending
at each index. For length only, maintain the smallest possible tail of
each length; binary-search the first tail at least as large as the
current value and replace it.

**Why not others:** sorting the input loses original order. Enumerating
subsequences is exponential. The tails representation gives O(n log n)
processing and O(n) state but does not by itself store an actual valid
final subsequence.

**What if:** strictly increasing requires lower bound; nondecreasing
uses upper bound. Reconstructing indices needs predecessor/position
tracking. Replacing a tail improves future extension options without
claiming the tails array is the selected subsequence.

**Trace/test and signal:** `[3,1,2]` changes tails `[3]`→`[1]`→`[1,2]`,
length two. Test duplicates, decreasing input and empty input. Explain
why a smaller tail of equal length dominates a larger one.

### Machine coding decision walkthroughs

#### MC1 Bounded LRU cache

Use the LRU implementation and decision walkthrough in Module 8.
**Derive:** combine direct lookup and recency order. **Alternative:**
approximate eviction may improve concurrency when exact global recency
is unnecessary. **What if:** TTL introduces a second expiry rule;
synchronization must cover accesses that move entries. **Test:** access
changes eviction, duplicate put replaces, and simultaneous operations
preserve size/structure. A strong answer states whether nulls, TTL and
loading are in scope before designing the API.

#### MC2 Rate limiter with an injected ticker

Use the token-bucket and sliding-window walkthroughs to select semantics
first. **Derive:** burst credit favors a bucket; exact recent-count
limits favor timestamp state. **Alternative:** a fixed window is cheaper
but has a boundary-burst trade-off. **What if:** replacing real time
with a ticker makes exact expiry tests deterministic; separate idle-key
eviction from active-counter synchronization. **Test:** limits, exact
boundaries, rollover, concurrent admission and key-cap rejection. A
strong answer defines whether the method rejects, waits or reserves
future capacity.

#### MC3 In-memory task scheduler

**Derive and choose:** place due times in a priority queue, wait until
the earliest task is due and dispatch through a bounded executor. For
ordinary production use, first consider `ScheduledExecutorService`;
implementing the mechanism is the interview exercise.

**Why not others:** periodically scanning all tasks wastes O(number of
tasks) work per tick and adds scheduling jitter. A timing wheel may suit
huge numbers of coarse timers but adds complexity.

**What if:** cancellation races with dispatch, so define a state
transition such as scheduled→running or canceled under one
synchronization policy. One coordinator's exception must not stop future
jobs. Wall-clock schedules and elapsed delays need different clock
rules; in-memory work is lost on restart.

**Trace/test and signal:** enqueue a late job, then an earlier job; the
waiter must wake and revise its deadline. Test cancel-before-dispatch,
shutdown and executor rejection. Heap updates are O(log n); waiting
tasks use O(n) state. Explain task ownership and precisely when
cancellation stops being guaranteed.

#### MC4 Inventory reservation service

**Derive and choose:** available stock must never become negative, so
check-and-reserve is one atomic business operation. Model reservation
IDs and states so repeated reserve/release calls have deliberate
semantics.

**Why not others:** a thread-safe map alone does not make a
read-check-write sequence atomic. A global lock is simple; per-product
locks improve unrelated-product concurrency but make multi-product
acquisition ordering necessary. A database conditional update can
enforce an invariant across service instances.

**What if:** expiry and explicit release can race; only one successful
state transition returns stock. A retried reservation with changed
quantity should not silently reuse an old result. Multi-product requests
need all-or-nothing or clearly documented partial behavior.

**Trace/test and signal:** one unit and two simultaneous buyers permits
at most one reservation. Test duplicate release, expired reservation,
clock boundary and rollback. Explain the state machine and atomic
boundary before introducing design patterns.

### Explain the eight output puzzles

| Puzzle                            | How to derive the answer                                                                     | What changes and how to test it                                                                                                                               |
|-----------------------------------|----------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Boxed integer identity            | `==` compares references; small constant boxing has specified identity guarantees            | Values outside the guaranteed range may be cached too; do not infer numeric equality from reference equality. Test `equals` and primitive unboxing separately |
| Literal concatenation             | Constant expressions can be folded and interned; `new String` creates a distinct object      | A runtime expression with nonconstant input does not have the same identity guarantee. Compare values with `equals`                                           |
| Return in finally                 | The abrupt completion of finally replaces an earlier return/throw                            | Remove that return to preserve the original outcome. Test a body exception as well as a return                                                                |
| List modification                 | `Arrays.asList` is fixed-size; `List.of` is unmodifiable                                     | `set` works for the former and changes its backing array, but not for the latter. A new ArrayList gives a mutable copy                                        |
| Mutable hash key                  | Lookup uses equality/hash-relevant state that should remain stable while stored              | A mutation may break lookup; a collision can make a particular experiment still appear to work. Use immutable keys rather than relying on observed output     |
| Removing during iteration         | The iterator and collection can detect inconsistent structural modification                  | Fail-fast detection is not guaranteed on every path. Use iterator removal or a supported bulk operation and test skipped elements, not only exceptions        |
| Floating-point decimal arithmetic | Binary representation approximates many decimal fractions                                    | `BigDecimal` from decimal text gives decimal semantics; specify scale and rounding instead of comparing with an arbitrary epsilon for money                   |
| Initialization order              | Determine whether an operation triggers initialization, then apply superclass/subclass rules | Compile-time constants and reflective loading options change the trigger. Compare loading with initialization explicitly                                      |

For these puzzles, the strong signal is the rule and a counterexample to
an overgeneralization. Memorizing one observed output is weaker than
explaining why another valid program or runtime setting changes it.

### SDE-3 Terminology and Follow-up Audit

The guide should never require you to memorize a term you cannot
explain. Use the following as a **depth map**: if one of these terms
appears in an answer, you should be able to give the one-sentence
explanation first, then go deeper only if the interviewer asks.

### Module 1  -  Core Java, Concurrency and JVM

#### `CAS`  -  Compare-And-Set

**Simple meaning:** an atomic operation that says, “change this value
from A to B only if it is still A.”

Conceptually:

```text
read current value
      ↓
is it still expected?
   yes ↓       no → retry/fail
update value
```

Atomics such as `AtomicInteger` use CAS-based operations. CAS avoids a
traditional mutual-exclusion lock for the individual update, but it does
**not** make an arbitrary multi-variable invariant automatically safe.

**Follow-up:** CAS can suffer from retries under contention. That is one
reason `LongAdder` can outperform a single atomic counter for highly
contended updates when an exact instantaneous value is not required.

---

#### `happens-before`

**Simple meaning:** a Java Memory Model ordering/visibility
relationship. If action A happens-before action B, the effects that are
required to be visible through that relationship are visible to B.

Do not describe it as “A literally executes earlier in wall-clock time.”
It is a **memory-model guarantee**, not simply a timestamp relationship.

Important examples:

```text
unlock(monitor) → later lock(same monitor)
volatile write → later volatile read of same variable
Thread.start() → actions in started thread
actions in thread → successful join() return
```

**Follow-up:** happens-before solves visibility/order guarantees; it
does not make a compound operation such as `count++` atomic.

---

#### `JIT`

**Simple meaning:** the Just-In-Time compiler turns frequently executed
bytecode into optimized native machine code while the application is
running.

A useful mental model:

```text
Java source
   ↓ javac
bytecode
   ↓ JVM
interpret/profile
   ↓
JIT optimization
   ↓
native machine code
```

The JVM can optimize based on runtime observations. Therefore a
microbenchmark that ignores warm-up can be misleading.

---

#### Escape analysis

**Simple meaning:** the JVM analyzes whether an object or value can
escape a method/thread. If it proves useful non-escaping properties, the
JIT may optimize allocation and synchronization.

Do not promise:

> “Escape analysis always puts objects on the stack.”

That is an implementation optimization, not a Java language guarantee.

---

#### Metaspace

**Simple meaning:** JVM native memory used for class metadata. It is
outside the Java heap.

Therefore:

```text
container memory
 ≠
-Xmx
```

A Java process also uses memory for thread stacks, metaspace/class
metadata, direct buffers, code cache, GC structures and native
libraries.

**Production follow-up:** container OOM can happen even when heap usage
appears below `-Xmx`.

---

#### Class loader

**Simple meaning:** a class loader is responsible for locating/loading
class definitions into the JVM.

A useful senior-level point is that class identity is associated with
both the **class name and the defining class loader**. Two classes with
the same fully qualified name loaded by different class loaders can be
different runtime types.

This is why class-loader leaks can matter in application servers, plugin
systems and hot-reload environments.

---

#### Thread pool, queue and back-pressure

A thread pool is not just “N threads.”

The important execution sequence is:

```text
task
 ↓
core threads available?
 ↓ no
queue
 ↓ queue full?
 ↓ yes
create thread up to max
 ↓ max reached?
 ↓ yes
rejection policy
```

**Back-pressure** means slowing/rejecting producers when downstream
capacity is exhausted instead of allowing unlimited work to accumulate.

A bounded queue plus a deliberate rejection policy is therefore a
capacity-protection mechanism.

---

#### Bulkhead

A **bulkhead** isolates resources so one overloaded dependency or
workload cannot consume all capacity.

Example:

```text
Payment calls → pool A
Search calls  → pool B
Email calls   → pool C
```

If email becomes slow, it should not consume every thread needed by
payments.

This is the same principle as watertight compartments in a ship.

---

#### Virtual threads and pinning

A **virtual thread** is a lightweight JVM-managed thread designed to
make high-concurrency blocking-style code practical.

It does **not**:

- make CPU work faster;
- increase database connection capacity;
- remove the need to bound scarce resources.

**Pinning** means a virtual thread can be prevented from unmounting from
its carrier while performing certain operations, historically including
some monitor-based blocking scenarios on older JDKs. Always answer this
with the target JDK in mind; do not blindly apply old JDK 21 guidance to
newer JDKs.

---

### Module 3  -  JPA / Hibernate

#### Persistence context

Think of the JPA persistence context as a managed set of entity
instances associated with a unit of work.

Conceptually:

```text
database row
    ↕
managed entity
    ↕
persistence context
```

Within the same persistence context, Hibernate can track entity identity
and changes.

#### Dirty checking

**Dirty checking** means Hibernate detects changes made to managed
entities and can generate SQL updates when the persistence context is
flushed.

Example:

```java
order.setStatus(PAID);
```

You do not necessarily call an explicit `UPDATE`. Hibernate tracks the
managed entity and can issue the update during flush/commit.

**Follow-up:** dirty checking applies to managed entities; a
detached/transient object is not automatically tracked in the same way.

#### N+1

**N+1** means one query loads N parent records and then additional
queries load related data individually:

```text
1 query for parents
+
N queries for children
=
N+1 database round-trips
```

The fix depends on the access pattern: fetch join, entity graph, batch
fetching, projection, or an explicit query can all be appropriate.
“Always use eager loading” is not a good solution.

#### Optimistic locking

Optimistic locking assumes conflicts are relatively uncommon and detects
them when updating.

Typical JPA form:

```java
@Version
private long version;
```

Two transactions read version 5. One commits and changes it to 6. The
other later tries to update version 5 and can fail rather than silently
overwrite the first change.

#### Pessimistic locking

Pessimistic locking asks the database to lock the relevant rows while
the transaction is working with them.

Use it when the concurrency contract genuinely requires database-level
locking and the expected contention justifies the cost.

**Follow-up:** locks can increase blocking and deadlock risk. Do not
present pessimistic locking as automatically “safer.”

#### Isolation level

An isolation level defines which concurrent transaction effects a
transaction is allowed to observe.

When answering, separate:

```text
database isolation guarantees
vs
application-level locking
vs
optimistic version checks
```

Do not claim that `@Transactional` by itself gives serializable
behavior.

---

### Module 4  -  Microservices and distributed systems

#### Circuit breaker

A **circuit breaker** prevents repeated calls to a failing dependency
from consuming local resources indefinitely.

Typical states:

```text
CLOSED
  ↓ failures
OPEN
  ↓ after recovery delay
HALF_OPEN
  ↓ probe succeeds
CLOSED
```

A circuit breaker is not a substitute for timeouts. A call should have a
bounded deadline before the circuit breaker even has a chance to help.

#### Saga

A **saga** coordinates a distributed business transaction as a sequence
of local transactions.

Example:

```text
Create order
   ↓
Reserve inventory
   ↓
Charge payment
```

If payment fails, the system may execute a compensating action such as
releasing inventory.

A saga is not the same thing as a database transaction. It trades
atomicity for a workflow with explicit compensation and consistency
semantics.

#### Outbox pattern

The **outbox pattern** solves the problem of atomically updating a
database and publishing an event.

Instead of:

```text
DB commit
   ↓
publish Kafka event
```

where the two operations can disagree, write the business change and an
outbox record in the **same database transaction**:

```text
transaction:
  update business data
  insert outbox event
commit
```

A separate publisher then sends the outbox event.

**Follow-up:** this usually gives at-least-once delivery, so consumers
still need idempotency.

#### Idempotency

An operation is **idempotent** when repeating the same logical request
produces the same intended final effect.

For payments, for example:

```text
POST /payments
Idempotency-Key: abc123
```

A retry with the same key should not charge the customer twice.

Idempotency is especially important when timeouts make it unclear
whether the server completed the original request.

#### At-least-once vs exactly-once

**At-least-once:** a message should not be lost, but duplicates can
occur.

**Exactly-once:** the system attempts to make the processing effect
occur exactly once under a defined scope and set of guarantees. Do not
casually equate Kafka's exactly-once processing semantics with “the
external database/business side effect can never happen twice.”

For interviews, state the boundary of the guarantee.

#### Eventual consistency

**Eventual consistency** means replicas or services may temporarily
disagree, but under the model's assumptions they converge if updates
stop.

Do not equate eventual consistency with “random stale data.” The system
still needs a defined convergence and conflict-resolution model.

---

### Kafka  -  terminology you should be able to explain

#### Topic, partition and consumer group

A **topic** is a logical stream of records.

A **partition** is an ordered append-only sequence within that topic.

A **consumer group** is a set of consumers cooperating to process
partitions. Within one consumer group, a partition is normally assigned
to one consumer at a time.

Therefore:

```text
topic
 ├── partition 0 → consumer A
 ├── partition 1 → consumer B
 └── partition 2 → consumer C
```

Partition count is therefore a major scalability constraint for parallel
consumption.

#### Rebalance

A **rebalance** redistributes partition ownership among consumers in a
consumer group.

It can happen when consumers join/leave or when group membership
changes.

A rebalance is not free: it can temporarily affect processing and should
be considered in latency and throughput design.

#### ISR

In Kafka, **ISR** means *in-sync replicas*. These are replicas
considered sufficiently caught up to the leader under Kafka's
replication rules.

When discussing durability, distinguish:

```text
replication factor
vs
ISR
vs
acks
vs
min.insync.replicas
```

Do not collapse all four into “Kafka replication.”

#### Poison message

A **poison message** is a message that repeatedly fails processing.

If the consumer continually retries it without progress, it can block
useful processing.

Typical strategies include:

```text
bounded retries
dead-letter topic/queue
failure classification
alerting
manual replay
```

---

### Security  -  terminology you should be able to explain

#### JWT

A JWT is a signed token containing claims.

Important distinction:

> A JWT is normally **encoded and signed**, not encrypted merely because
> it is a JWT.

Therefore sensitive secrets should not be placed in ordinary JWT claims.

#### JWKS

**JWKS** is a JSON Web Key Set: a published set of public keys that a
resource server can use to validate signed tokens.

Mental model:

```text
Issuer
  ↓ publishes
JWKS public keys
  ↓
Resource server validates JWT signature
```

#### OAuth2 vs OIDC vs PKCE

- **OAuth 2.0**  -  authorization/delegation framework.
- **OIDC**  -  authentication layer built on OAuth 2.0.
- **PKCE**  -  protects authorization-code flows against code interception
  by binding the authorization request to a verifier held by the client.

A common interview mistake is saying:

> “OAuth2 is authentication.”

It is primarily an authorization framework; OIDC adds standardized
authentication semantics.

#### CORS vs CSRF

**CORS** controls whether browser JavaScript from one origin may access
resources from another origin.

**CSRF** tricks a browser into making an authenticated request using
ambient credentials such as cookies.

They solve different problems.

#### mTLS

**Mutual TLS** means both sides authenticate during the TLS handshake
using certificates.

Normal TLS commonly authenticates the server to the client; mTLS adds
client authentication.

#### RBAC

**Role-Based Access Control** assigns permissions through roles:

```text
user → role → permissions
```

It is different from fine-grained attribute/policy-based authorization.

#### SSRF

**Server-Side Request Forgery** occurs when an attacker can influence a
server into making requests to destinations the attacker should not be
able to reach directly.

Mitigations include strict destination allowlists, URL/IP validation,
network egress controls and careful redirect handling.

---

### System design terminology

#### CAP

CAP concerns distributed systems under a network partition:

```text
Consistency
Availability
Partition tolerance
```

When a partition occurs, a distributed system cannot simultaneously
guarantee both the strongest form of consistency and availability for
all operations.

Do not use CAP as “you can only ever choose two.” The interesting
question is what guarantee the system provides **during a partition**.

#### PACELC

PACELC extends the discussion:

```text
If Partition:
    choose Availability or Consistency

Else:
    choose Latency or Consistency
```

It is useful when discussing real-world distributed database trade-offs
beyond CAP.

#### Quorum

A quorum is a sufficient number of replicas participating in an
operation to satisfy a consistency/durability rule.

Do not assume every database uses the same quorum formula or semantics.
Always name the system and its configured behavior.

#### Consistent hashing

Consistent hashing maps both nodes and keys onto a logical hash space.

When nodes change, ideally only a relatively small portion of keys
moves, unlike naive modulo hashing where changing the node count can
remap a large fraction of keys.

#### Rate limiter

A rate limiter controls how much work a caller may perform over time.

Know at least:

```text
Fixed window
Sliding window
Token bucket
Leaky bucket
```

For token bucket:

```text
tokens accumulate at a configured rate
       ↓
request consumes tokens
       ↓
no token → reject/delay
```

It can allow controlled bursts while enforcing an average rate.

#### Keyset pagination

Instead of:

```text
OFFSET 100000 LIMIT 20
```

keyset pagination uses the last seen ordered key:

```sql
WHERE (created_at, id) < (?, ?)
ORDER BY created_at DESC, id DESC
LIMIT 20
```

It can avoid scanning/skipping large numbers of earlier rows and gives
stable continuation when the ordering is properly indexed.

---

### Kubernetes deployment terminology

#### Rolling, blue-green and canary

**Rolling deployment:** gradually replaces old instances with new ones.

**Blue-green:** maintains two environments and switches traffic from the
old environment to the new one.

**Canary:** sends a controlled fraction of traffic to the new version
first, observes behavior, then expands traffic.

The important SDE-3 question is not “define them,” but:

> Which one gives me the safest rollback and smallest blast radius for
> this workload?

#### Readiness vs liveness vs startup

- **Startup probe:** “Has the application finished starting?”
- **Readiness probe:** “Should this instance receive traffic?”
- **Liveness probe:** “Is this process sufficiently unhealthy that it
  should be restarted?”

Do not put downstream dependency health blindly into liveness; a
database outage should not necessarily cause every application pod to
restart.

---

### Live-coding terminology

#### Invariant

An **invariant** is a condition that remains true at important points
during the algorithm.

Example for binary search:

```text
target, if it exists, is still inside [lo, hi)
```

Example for a sliding window:

```text
the current window satisfies the required constraint
```

Stating the invariant makes the solution easier to prove and debug.

#### Amortized complexity

Amortized complexity averages expensive operations over a sequence.

For a dynamic array:

```text
most append operations → O(1)
occasional resize      → O(n)
overall                 → O(1) amortized append
```

This is different from claiming that every append is worst-case O(1).

#### Identity vs equality

Java's `==` on object references asks whether two references point to
the same object.

`equals()` asks whether the objects are logically equal according to the
class contract.

This distinction matters for:

```text
HashMap
IdentityHashMap
graph cloning
entity comparison
caching
```

---

### Interview rule for all remaining sections

Whenever an answer contains a specialized term, use this progression:

```text
1. What is it?
2. Why does it exist?
3. How does it work?
4. Small example
5. Complexity / guarantee
6. Failure mode
7. Trade-off
8. SDE-3 follow-up
```

You do **not** need to say all eight points every time. The point is to
make sure you can go one level deeper whenever the interviewer asks.

A strong senior answer is not the longest answer. It is an answer where
every term you introduce can survive the next “why?”.

<a id="part-12-more-senior-level-questions-q154q173"></a>
<a id="part-12"></a>
## Part 12 - More Senior-Level Questions (Q154-Q173)

Twenty additional questions on topics the guide did not yet cover: consensus and data distribution, database internals, low-level concurrency, JVM performance, Spring operations, and engineering practice. Each follows the same layout as Part 10: **Source basis**, **Strong answer**, **Reasoning and alternatives**, **What if/test**, and **Signal**. Where no specific source is cited, the basis is general engineering practice, so check details against the documentation for your version before quoting numbers.

### Distributed systems and data

#### Q154 How does Raft elect a leader and why do systems use consensus

**Source basis:** [Raft paper](https://raft.github.io/raft.pdf).

**Strong answer:** Raft keeps a replicated log consistent across nodes by electing at most one leader per *term*. A follower that hears no heartbeat before a randomized election timeout becomes a candidate, increments the term and requests votes. A node grants at most one vote per term, and only to a candidate whose log is at least as up to date as its own. A candidate with a majority becomes leader; at most one leader is elected in a term, and some terms have no leader. The leader replicates entries through `AppendEntries`. To advance `commitIndex` by replica count, it must count an entry from its **current term**. Committing that entry also commits its preceding log prefix; a prior-term entry replicated to a majority alone is not sufficient.

**Reasoning and alternatives:** a majority quorum means 3 nodes tolerate 1 failure and 5 tolerate 2, and any two majorities overlap. Raft's election and log-safety rules preserve committed entries across leader changes. Systems such as etcd (Kubernetes' store) and Consul use Raft; others use Paxos variants. Consensus has coordination costs. It can govern metadata or durable application data, depending on the system; replicated databases also use consensus in their data path.

**What if/test:** a minority partition cannot elect a leader or commit, trading availability for consistency. Randomized timeouts reduce split votes. Test with fault injection: kill the leader, partition the network, and verify no committed write is lost.
**Signal:** explain terms, majority overlap and the up-to-date-log rule, not just "a leader is elected".

#### Q155 What is consistent hashing and why use virtual nodes

**Strong answer:** nodes and keys are hashed onto a ring; each key belongs to the first node clockwise. Adding or removing a node moves only the keys in the adjacent range, roughly `K/N` of them, whereas `hash(key) % N` remaps almost every key when `N` changes. **Virtual nodes** give each physical node many ring positions, which evens out load and lets stronger machines take more positions.

**Reasoning and alternatives:** Dynamo-style stores, Cassandra and cache client libraries use it. For replication, copy each key to the next *R* distinct physical nodes. Alternatives: fixed hash slots (Redis Cluster uses 16,384) that are moved between nodes, or a lookup directory.

**What if/test:** hot keys stay hot regardless of the ring; they need caching, splitting or key salting. Test balance by measuring keys per node with realistic keys, and measure data moved when adding a node.
**Signal:** quantify the remapping difference and name the virtual-node benefit.

#### Q156 What is MVCC and why do readers not block writers

**Source basis:** [PostgreSQL MVCC introduction](https://www.postgresql.org/docs/current/mvcc-intro.html).

**Strong answer:** multi-version concurrency control keeps several versions of a row and gives each transaction a snapshot, so a reader sees the data as of its snapshot while writers create new versions. Ordinary snapshot SELECTs do not take conflicting row locks, but SELECT FOR UPDATE, DDL/table locks and other engine-specific paths can still block. Write-write conflicts on the same row still wait or fail.

**Reasoning and alternatives:** PostgreSQL stores old row versions in the table and relies on `VACUUM` to reclaim them; InnoDB keeps old versions in undo logs. The visible-version rules depend on the isolation level (READ COMMITTED takes a fresh snapshot per statement, REPEATABLE READ one per transaction).

**What if/test:** long-running transactions prevent cleanup of old versions, causing table bloat and slower queries. Monitor oldest transaction age and dead tuples, and set statement and idle-in-transaction timeouts.
**Signal:** connect MVCC to isolation levels and to the operational bloat risk.

#### Q157 When do you use SQL window functions

**Source basis:** [PostgreSQL window function tutorial](https://www.postgresql.org/docs/current/tutorial-window.html).

**Strong answer:** a window function computes a value over a set of related rows *without collapsing them*, unlike `GROUP BY`. Typical uses: top-N per group, running totals, ranking, and comparing a row with the previous one (`LAG`).

```sql
SELECT * FROM (
  SELECT e.*, ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC, id) AS rn
  FROM employee e
) t WHERE rn <= 3;            -- top 3 earners per department
```

**Reasoning and alternatives:** use `RANK`/`DENSE_RANK` instead of `ROW_NUMBER` when ties must share a position. A correlated subquery can do the same but is usually slower and harder to read. Portable JPQL has no window-function syntax. Use native SQL mapped to a projection, or a provider extension such as Hibernate HQL window functions; a projection alone does not add the missing syntax.

**What if/test:** an `ORDER BY` inside `OVER` without a frame uses a default frame that can surprise running totals. Check the plan with `EXPLAIN` and add an index matching the partition and order columns.
**Signal:** write the top-N-per-group query from memory and explain tie handling.

#### Q158 What is a Bloom filter and where would you use one

**Strong answer:** a Bloom filter is a bit array plus *k* hash functions that answers "possibly present" or "definitely absent". For successfully inserted entries in a correctly maintained filter, it has **no false negatives** but can produce false positives. Stale population, lost updates or premature removal can break the application-level guarantee. Standard versions cannot delete entries (counting variants can).

**Reasoning and alternatives:** use it to skip expensive lookups for keys that do not exist, for example blocking cache-penetration queries before they hit the database, or checking SSTables in LSM-tree stores. The false-positive rate depends on bit-array size and the number of items; size it from the expected count and target rate. Guava provides `BloomFilter`. Alternatives: a cache of negative results, or a cuckoo filter if deletion matters.

**What if/test:** if the filter fills beyond its design capacity, false positives climb; rebuild it periodically. Test by inserting the expected number of items and measuring the observed false-positive rate.
**Signal:** state the one-sided error guarantee and a concrete use.

#### Q159 How do systems resolve concurrent writes to the same data

**Strong answer:** options, from simplest to most capable: avoid conflicts with a single writer per key; **last-write-wins** using timestamps (simple but silently discards writes and is vulnerable to clock skew); **vector clocks** that detect concurrent updates and keep siblings for the application to merge; **CRDTs** whose state-based merge is associative, commutative and idempotent, or whose operation-based design meets its delivery and commutativity requirements. They can provide convergence without coordinating each update, subject to their model assumptions; or application-specific merge rules.

**Reasoning and alternatives:** pick based on the business meaning: a shopping cart can merge by union, a bank balance cannot be last-write-wins. A linearizable store orders individual operations but does not make a multi-step read-modify-write atomic. Use an atomic update, compare-and-swap/version check or transaction for business invariants; coordination can add latency.

**What if/test:** clock skew makes last-write-wins lose newer data. Test by writing concurrently from two replicas during a partition and checking the converged result against the business rule.
**Signal:** tie the resolution strategy to what the data means.

#### Q160 How do you choose a sharding strategy

**Strong answer:** common strategies are **range** (supports range scans but suffers hotspots with monotonic keys such as timestamps), **hash** (balances load but loses range queries), **directory/lookup** (flexible but the directory is a dependency) and **geo** (data residency and latency). Pick the shard key from the dominant access pattern, with high cardinality and even distribution.

**Reasoning and alternatives:** sharding adds cross-shard joins, transactions and resharding work, so exhaust simpler steps first: indexing, caching, read replicas and table partitioning. Use consistent hashing or many logical shards mapped to fewer physical nodes so resharding moves whole shards.

**What if/test:** a celebrity tenant or hot key overloads one shard; handle it with key salting, dedicated shards or caching. Test with production-like skewed traffic, not uniform random keys.
**Signal:** justify the shard key and name the cost of resharding.

### Low-level concurrency and JVM performance

#### Q161 What is the ABA problem and how do you avoid it

**Source basis:** [AtomicStampedReference](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicStampedReference.html).

**Strong answer:** a compare-and-set succeeds when the current value equals the expected value, but the value may have changed from A to B and back to A in between, so the CAS succeeds although the state is different. It matters in lock-free structures that reuse nodes or recycle identifiers.

**Reasoning and alternatives:** attach a version or stamp so equality also requires the same version: `AtomicStampedReference` (reference plus changing int stamp). `AtomicMarkableReference` has only one boolean bit: it suits protocols such as irreversible logical deletion but does not detect arbitrary A→B→A reuse if the mark returns to its old value. On the JVM, garbage collection prevents many reference-reuse cases because a node cannot be reclaimed while referenced, but pooled objects and numeric values remain exposed. Often the better answer is to avoid hand-written lock-free code and use `ConcurrentLinkedQueue` or a lock.

**What if/test:** State a stamp wraparound assumption. Test A→B→A while retaining the old stamp and assert the stamped CAS fails; restoring both a reference and mark bit can let a marked CAS succeed.
**Signal:** explain why CAS equality is not state equality.

#### Q162 StampedLock optimistic reads versus ReentrantReadWriteLock

**Source basis:** [StampedLock](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/StampedLock.html).

**Strong answer:** `StampedLock.tryOptimisticRead()` returns a stamp without locking; the reader copies the fields it needs and calls `validate(stamp)`. If a writer intervened, the read is retried under a real read lock. For read-heavy data with short critical sections this avoids lock traffic.

**Reasoning and alternatives:** `StampedLock` is not reentrant, has no `Condition` support, and must be used carefully: never act on optimistic data before validating. `ReentrantReadWriteLock` is simpler and reentrant but reads still contend on the lock state. Often a `volatile` immutable snapshot or `ConcurrentHashMap` is simpler than either.

**What if/test:** using unvalidated data or acting on it before validation can expose an inconsistent snapshot. A delay before validation does not bypass the validation check, but it increases retry likelihood and can waste work. Verify under a mixed reader/writer stress test and compare performance with JMH before choosing the complexity.
**Signal:** describe the read-copy-validate pattern and its restrictions.

#### Q163 What is false sharing

**Strong answer:** CPU caches move data in cache lines (commonly 64 bytes). If two threads write different variables that sit on the same line, each write invalidates the other core's copy, so performance collapses even though the threads never share data logically.

**Reasoning and alternatives:** mitigate by separating hot, independently written fields onto different lines through padding, or the JDK-internal `@Contended` annotation. Application use also needs module access (for example `--add-exports java.base/jdk.internal.vm.annotation=ALL-UNNAMED` for an unnamed module) and the VM option `-XX:-RestrictContended`; it is nonportable, not an ordinary application API. `LongAdder` spreads updates across padded cells for this reason. Another approach is per-thread accumulation merged later.

**What if/test:** the effect is hardware and layout dependent, so prove it with a JMH benchmark that pads versus does not pad, rather than assuming.
**Signal:** know the cache-line mechanism and insist on measurement.

#### Q164 Why is object allocation cheap on the JVM, and what is escape analysis

**Strong answer:** allocation in the young generation is typically a pointer bump inside a thread-local allocation buffer (TLAB), so it needs no lock. Short-lived objects die young and are cheap to collect. The JIT's **escape analysis** can find objects that never leave a method and may eliminate the allocation (scalar replacement), keeping fields in registers.

**Reasoning and alternatives:** consequences: do not pool ordinary objects out of habit, because pooling adds synchronization and keeps garbage alive; optimize allocation only when profiling (JFR allocation profiling) shows it matters. Large allocation rates still increase GC frequency, and optimizations are not guaranteed.

**What if/test:** microbenchmarks can mislead because the JIT removes allocations that real code retains; use JMH with a blackhole and check allocation rate in a realistic load test.
**Signal:** avoid cargo-cult object pooling and ground claims in profiling.

### Spring operations and engineering practice

#### Q165 Spring Retry or Resilience4j, and what is the ordering trap with transactions

**Strong answer:** both provide retry with backoff. Spring Retry offers `@Retryable`/`RetryTemplate` through proxies; Resilience4j offers composable decorators (retry, circuit breaker, bulkhead, rate limiter) with metrics. Newer Spring Framework releases also bring retry support into the core framework, so check what your version provides.

**Reasoning and alternatives:** the retry boundary must enclose a **new physical transaction for each attempt**. An outer retry proxy alone does not guarantee that: if the caller already has a transaction and each attempt uses default `REQUIRED`, all attempts join the same transaction. A failure can leave it rollback-only, so a later retry cannot commit. Establish the transaction boundary deliberately, such as by invoking a separate proxied `REQUIRES_NEW` unit per attempt or using `TransactionTemplate` per attempt when independent commits are intended. Account for connection-pool use and the business consequences of separate commits. Retry only transient failures on idempotent operations, with exponential backoff and jitter, and combine with a circuit breaker so retries do not amplify an outage.

**What if/test:** retries around a call that is not idempotent create duplicates (charges, emails). Test failure injection: first two attempts fail and the third succeeds; verify transaction identities, rollback-only behavior and the actual side-effect/idempotency contract.
**Signal:** state the retry-outside-transaction rule and the idempotency requirement.

#### Q166 How do you run scheduled jobs safely across many instances

**Strong answer:** `@Scheduled` runs on every instance, so a job executes N times with N replicas. Options: a distributed lock (ShedLock with a database or Redis lock and an expiry), Quartz with a clustered JDBC job store, or moving scheduling out of the app to a Kubernetes `CronJob` or Cloud Scheduler that calls one endpoint.

**Reasoning and alternatives:** make jobs **idempotent** regardless, because lock expiry, retries and failover can still cause a duplicate run. Set the lock duration longer than the typical run but short enough to recover, and decide what to do about missed runs (misfire policy).

**What if/test:** if a job outlives its lock, a second instance starts concurrently. Test by running two instances and killing one mid-job.
**Signal:** combine a locking choice with idempotent job design.

#### Q167 How do you reduce Spring Boot startup time and memory

**Strong answer:** measure first: use the startup actuator endpoint with `BufferingApplicationStartup` to see which beans and phases are slow. Then trim: remove unused starters and auto-configurations, narrow component scanning, defer expensive initialization, and consider `spring.main.lazy-initialization=true`.

**Reasoning and alternatives:** lazy initialization moves cost to the first request and delays discovery of wiring errors, so use it knowingly. Heavier options: Class Data Sharing archives (AppCDS), Spring AOT with GraalVM native image (fast start and low memory, with build-time and reflection constraints), or checkpoint/restore approaches where supported. On serverless platforms combine with minimum instances and startup CPU boost.

**What if/test:** a faster start can hide slower peak throughput (native image) or first-request latency spikes (lazy beans). Compare cold start, memory and steady-state latency before and after.
**Signal:** diagnose before optimizing and list the trade-off of each lever.

#### Q168 What are the risks of Lombok, and why use MapStruct

**Strong answer:** Lombok removes boilerplate, but `@Data` on JPA entities generates `equals`, `hashCode` and `toString` that can touch lazy collections, trigger extra queries or recurse through bidirectional associations. Builders and annotation-processor ordering can also confuse debugging and tooling. MapStruct generates mapping code at compile time (no reflection) between entities and DTOs.

**Reasoning and alternatives:** use records for immutable DTOs, which reduces the need for Lombok there; for entities write `equals`/`hashCode` deliberately. Configure MapStruct with `unmappedTargetPolicy = ERROR` so a new field cannot be silently unmapped.

**What if/test:** test the mapper with a contract test, and verify `toString` never loads lazy associations.
**Signal:** name the entity-specific Lombok hazards and the compile-time-mapping benefit.

#### Q169 How do you prevent SQL injection beyond "use prepared statements"

**Source basis:** [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html).

**Strong answer:** parameterize all *values*. The gaps are things that cannot be parameters: table or column names and sort direction in dynamic `ORDER BY`. Map user input to an allow-list of known identifiers instead of concatenating it. Also escape wildcard characters in `LIKE` when the input must be literal, avoid string-built JPQL/native queries, and review dynamic SQL inside stored procedures.

**Reasoning and alternatives:** an ORM does not make you immune if you concatenate into queries. Apply least privilege to the database account, validate input shape, and monitor for anomalous queries as defense in depth.

**What if/test:** include injection payloads and unusual sort parameters in automated tests, and run static analysis plus dynamic scanning in CI.
**Signal:** handle the dynamic `ORDER BY` case with an allow-list.

#### Q170 What makes a test suite good beyond coverage, and what are mutation and property-based testing

**Strong answer:** coverage shows which lines ran, not whether tests would detect a bug. **Mutation testing** (for example PIT) changes the code in small ways and checks whether tests fail; surviving mutants reveal weak assertions. **Property-based testing** (for example jqwik) states a rule that must hold for all inputs, generates many cases and shrinks a failing case to a minimal example.

**Reasoning and alternatives:** use them selectively on core logic such as pricing, parsing and state machines, because mutation runs are slow. A healthy suite is fast, deterministic, behavior-focused, and has few mocks of types you own.

**What if/test:** quarantine flaky tests with an owner and deadline. Track defect escape rate and test duration, not just percentage coverage.
**Signal:** argue that assertion quality matters more than line coverage.

#### Q171 Trunk-based development versus GitFlow

**Strong answer:** trunk-based development uses short-lived branches merged to the main branch at least daily, with **feature flags** hiding incomplete work and CI keeping main releasable. GitFlow uses long-lived `develop` and release branches, which suits scheduled, versioned releases but increases merge pain and delays integration.

**Reasoning and alternatives:** for services deployed continuously, trunk-based development shortens lead time and reduces risk because changes are small. Pair it with expand-and-contract database migrations and automated rollback. Flags need ownership and cleanup, or they become debt.

**What if/test:** a flag combination matrix can explode; remove flags after rollout and test both states of any flag that guards risky logic.
**Signal:** connect branching strategy to delivery metrics (lead time, change failure rate).

#### Q172 What goes wrong with multi-region active-active

**Strong answer:** you must handle write conflicts across regions, cross-region replication lag, globally unique IDs, split-brain during partitions, and the latency of any synchronous cross-region coordination. A common design assigns each user or tenant a **home region** for writes, with other regions serving reads or standby, and uses a global load balancer for failover.

**Reasoning and alternatives:** active-passive is simpler and often meets the recovery objective. Truly multi-writer designs need a conflict strategy (see Q159) or a globally consistent database such as Spanner, accepting its cost and latency. Define RTO and RPO first.

**What if/test:** failover drills reveal hidden dependencies (a single-region cache, DNS TTLs, shared secrets). Run regular game days that fail a whole region.
**Signal:** start from RTO/RPO and prefer the simplest topology that meets them.

#### Q173 When do you add a search engine such as Elasticsearch, and how do you keep it in sync

**Strong answer:** a search engine builds an **inverted index** (term to documents), applies analyzers (tokenizing, stemming) and ranks results (BM25 by default in Elasticsearch). It is built for full-text search, faceting and relevance, where an unindexed leading-wildcard `LIKE '%term%'` may require a scan. For simple needs, database full-text search or a PostgreSQL `pg_trgm` GIN/GiST index may be enough. A normal B-tree generally cannot accelerate a leading-wildcard `LIKE`, but trigram indexes support patterns such as `LIKE '%term%'` when useful trigrams can be extracted. Check the plan; patterns without extractable trigrams can still scan.

**Reasoning and alternatives:** treat the search index as a **derived store**, not the system of record. Populate it from change events (outbox or CDC) so it can be rebuilt; reindex into a new index and switch an alias for zero-downtime mapping changes. Search is near-real-time (a refresh interval), so a write is not instantly searchable.

**What if/test:** the index drifts from the database if events are lost. Add a reconciliation job comparing counts and checksums, and test a full rebuild from source.
**Signal:** call the index derived data and explain how you rebuild it.

---

<a id="part-13-spring-boot-internals-coding-style-and-leadership-questions-q174q193"></a>
<a id="part-13"></a>
## Part 13 - Spring Boot Internals, Coding-Style and Leadership Questions (Q174-Q193)

Twenty more questions in the same layout as Parts 10 and 12. Q174-Q182 cover Spring Boot internals, Q183-Q187 are coding-style questions with solutions, and Q188-Q193 cover leadership. Version-specific points (Boot 3.x, Spring Framework 6.2 and later) should be checked against the versions your target company runs.

### Spring Boot internals

#### Q174 What happens inside SpringApplication.run

**Strong answer:** Boot creates `SpringApplicationRunListeners`, prepares the `Environment` (property sources, profiles), creates the `ApplicationContext` type chosen from the deduced web application type, applies initializers, loads bean definitions, then calls `refresh()`. During refresh, configuration classes are processed (component scanning, auto-configuration imports), singleton beans are created, and for web applications the embedded server is created and started. After refresh, `ApplicationRunner` and `CommandLineRunner` beans execute, and `ApplicationReadyEvent` is published, at which point the readiness state becomes accepting traffic.

**Reasoning and alternatives:** knowing the order tells you where to hook in: `EnvironmentPostProcessor` for property changes before the context exists, `ApplicationContextInitializer` for early context customization, `@PostConstruct` for per-bean setup, runners for post-start work, and `ApplicationReadyEvent` for "now safe to serve".

**What if/test:** a slow `CommandLineRunner` delays readiness only if it blocks startup, so long tasks belong in background executors. Test hooks with `ApplicationContextRunner` or a slice test.
**Signal:** place each extension point correctly in the sequence.

#### Q175 How does Boot decide it is a web application and which server to start

**Strong answer:** `WebApplicationType` is deduced from the classpath: if Spring MVC's `DispatcherServlet` and servlet classes are present it is a servlet application; if only WebFlux's `DispatcherHandler` is present it is reactive; otherwise it is a plain application. When both MVC and WebFlux are present, MVC wins. The embedded server comes from the starter on the classpath: `spring-boot-starter-web` brings Tomcat, and you swap it by excluding Tomcat and adding the Jetty or Undertow starter.

**Reasoning and alternatives:** override the deduction with `SpringApplication.setWebApplicationType` or `spring.main.web-application-type`. Auto-configuration then creates a `ServletWebServerFactory` bean and applies `server.*` properties through customizers.

**What if/test:** adding a reactive library to an MVC project can change behavior unexpectedly, so inspect the conditions report (`--debug`) when startup differs from expectation.
**Signal:** explain that classpath contents drive both the app type and the server.

#### Q176 BeanFactoryPostProcessor versus BeanPostProcessor

**Strong answer:** a `BeanFactoryPostProcessor` runs after bean *definitions* are loaded and before any ordinary bean is instantiated, so it can modify definitions (`ConfigurationClassPostProcessor` handles `@Configuration`, `@Bean` and `@ComponentScan` this way; `PropertySourcesPlaceholderConfigurer` resolves `${...}`). A `BeanPostProcessor` runs around the initialization of each bean *instance*, so it can wrap or replace it (autowiring annotations are processed this way, and AOP auto-proxy creation wraps beans in proxies).

**Reasoning and alternatives:** use the first to change configuration metadata and the second to decorate objects. Declare a `BeanFactoryPostProcessor` `@Bean` method as `static` so the configuration class is not instantiated too early.

**What if/test:** beans created before all post-processors are registered are not processed by them; Spring logs an "not eligible for getting processed by all BeanPostProcessors" message. Search the startup log for it when a proxy or annotation seems ignored.
**Signal:** distinguish definition-time from instance-time hooks and cite one real example of each.

#### Q177 What does @Configuration(proxyBeanMethods = false) change

**Strong answer:** by default (`true`, "full" mode) Spring subclasses the configuration class with CGLIB so that calling one `@Bean` method from another returns the container's singleton instead of creating a new object. With `proxyBeanMethods = false` ("lite" mode) there is no subclass, startup is cheaper, and a direct call to another `@Bean` method is an ordinary Java call that creates a fresh instance.

**Reasoning and alternatives:** Boot's own auto-configurations use lite mode for speed and native-image friendliness. In lite mode, inject dependencies as method parameters instead of calling other `@Bean` methods. Keep full mode only if you rely on inter-bean method calls.

**What if/test:** switching a legacy configuration to lite mode can silently duplicate singletons. Add a test asserting the same instance is injected in both places.
**Signal:** state the trade-off between convenience and startup cost.

#### Q178 How do content negotiation and Jackson configuration work in Spring MVC

**Strong answer:** the `Accept` header, the controller's `produces` and `consumes` conditions, and the registered `HttpMessageConverter`s together decide the representation. An unsupported `Accept` gives `406 Not Acceptable`; an unsupported request `Content-Type` gives `415 Unsupported Media Type`. Boot auto-configures one shared `ObjectMapper` via `spring.jackson.*` properties and registers modules found on the classpath (for example Java time); by default Boot disables failing on unknown properties and writing dates as timestamps.

**Reasoning and alternatives:** customize through properties or a `Jackson2ObjectMapperBuilderCustomizer` bean, not by constructing a separate `new ObjectMapper()` that ignores the shared configuration. For API evolution, being tolerant of unknown fields on input helps backward compatibility, while strict validation protects security-sensitive endpoints.

**What if/test:** a hand-built `ObjectMapper` used in tests may differ from production behavior; inject the bean or use `@JsonTest`. Test one request each for 406 and 415.
**Signal:** know the two status codes and why you inject the managed mapper.

#### Q179 How does Spring Data JPA implement a repository interface you only declared

**Strong answer:** at startup, repository scanning registers a factory bean for each interface. The factory creates a **JDK dynamic proxy** that delegates CRUD methods to `SimpleJpaRepository` and routes query methods to query lookups: an `@Query`, a named query, or a query **derived from the method name** by parsing it into parts. Because derivation happens at startup, a misspelled property name fails the application context early.

**Reasoning and alternatives:** Inherited CRUD methods implemented by `SimpleJpaRepository` have transaction defaults (read-only at class level with write methods transactional). User-declared query methods, including default methods, have no transaction configuration by default. Without a service transaction, separate inherited CRUD calls normally run in separate transactions; do not assume a custom query participates or that a multi-call unit is atomic. Annotate declared query methods or, commonly, the service operation. Custom behavior can go in a repository fragment interface plus implementation class.

**What if/test:** assuming two repository calls share a transaction without a service-level `@Transactional` is a common bug. Write a test that fails the second call and asserts whether the first persisted.
**Signal:** explain proxy creation, startup validation and default transaction behavior.

#### Q180 How does the embedded Tomcat threading model affect tuning

**Strong answer:** an embedded Tomcat connector accepts connections and dispatches request work to its configured execution model. Worker-thread, connection and accept-queue settings serve different purposes, and their defaults vary by Tomcat/Boot release. Virtual-thread request execution changes which thread-pool properties apply; it does not remove connection or downstream capacity limits.

Tune the full path: admission, worker execution, database/HTTP pools, deadlines and downstream concurrency. Read the effective configuration for the deployed version, then load-test queue wait, active connections, error rate and p99 latency. Avoid memorizing 200/100/8192 as universal defaults.

#### Q181 How do Actuator health groups, liveness and readiness work

**Strong answer:** the health endpoint aggregates `HealthIndicator` beans. **Liveness** and **readiness** are availability states exposed as health groups and driven by `ApplicationAvailability` and `AvailabilityChangeEvent`; on Kubernetes the probe groups are enabled automatically. Readiness flips to refusing traffic during shutdown, which lets the platform drain the instance.

**Reasoning and alternatives:** keep liveness limited to "the process is irrecoverably broken", because including a database or downstream check there can cause restart storms when the dependency fails. Readiness may include critical dependencies cautiously. Custom indicators must be fast and time-bounded.

**What if/test:** a health check that calls a slow dependency can itself overload it under frequent probing; cache results or use a short timeout. Test by stopping the database and observing the probe states.
**Signal:** explain why liveness must not depend on downstream services.

#### Q182 Why are Spring test suites slow, and what is context caching

**Strong answer:** the test framework caches an application context and reuses it for tests with the **same configuration key** (configuration classes, properties, active profiles, mock-bean definitions and so on). Every distinct combination starts a new context, so scattering different `@MockBean`/`@MockitoBean` sets or `@DirtiesContext` across classes multiplies startup cost.

**Reasoning and alternatives:** prefer plain unit tests for logic, slice tests (`@WebMvcTest`, `@DataJpaTest`) for one layer, and few full `@SpringBootTest` classes sharing a common base configuration. Recent Spring versions replace `@MockBean` with `@MockitoBean`; check the deprecation status for your version.

**What if/test:** measure by counting context startups in the test log. Reduce unique configurations, avoid `@DirtiesContext`, and reuse Testcontainers through a shared static container.
**Signal:** connect suite speed to the number of distinct context configurations.

### Coding-style questions

#### Q183 Implement a thread-safe TTL cache with a loader

**Strong answer:** use a `ConcurrentHashMap` and `compute`, which runs atomically per key, so concurrent callers for the same key trigger one load.

```java
class TtlCache<K, V> {
    private record Entry<V>(V value, long expiresAt) {}
    private final ConcurrentHashMap<K, Entry<V>> map = new ConcurrentHashMap<>();
    private final long ttlNanos;
    TtlCache(Duration ttl) {
        Objects.requireNonNull(ttl, "ttl");
        if (ttl.isZero() || ttl.isNegative()) throw new IllegalArgumentException("ttl must be positive");
        this.ttlNanos = ttl.toNanos();
        if (ttlNanos <= 0) throw new IllegalArgumentException("ttl outside supported range");
    }

    V get(K key, Function<K, V> loader) {
        Objects.requireNonNull(key, "key");
        Objects.requireNonNull(loader, "loader");
        return map.compute(key, (k, old) -> {
            long now = System.nanoTime(); // sampled after acquiring this key's compute lock
            if (old != null && now - old.expiresAt() < 0) return old;
            V value = Objects.requireNonNull(loader.apply(k), "loader returned null");
            long expiresAt = System.nanoTime() + ttlNanos; // expiry starts after loading
            return new Entry<>(value, expiresAt);
        }).value();
    }
}
```

**Reasoning and alternatives:** `System.nanoTime()` is monotonic, and the subtraction form is overflow-safe. This version evicts lazily and never removes entries that are not read again, so for production use Caffeine (size and time bounds, async loading, statistics).

**What if/test:** the loader runs while the map holds a bin lock, so it must be short and must not recursively update the same key. Test a slow loader, contention across an expiry boundary and concurrent callers. This teaching cache still evicts lazily, has no size bound, and may block other keys sharing a bin; use a mature cache for production.
**Signal:** mention single-flight loading, monotonic time and the missing eviction.

#### Q184 Implement a minimal fixed thread pool

```java
class MiniPool implements AutoCloseable {
    private final Object lock = new Object();
    private final java.util.ArrayDeque<java.util.concurrent.FutureTask<?>> queue =
            new java.util.ArrayDeque<>();
    private final java.util.List<Thread> workers = new java.util.ArrayList<>();
    private final int capacity;
    private boolean stopped; // guarded by lock

    MiniPool(int threads) { this(threads, 100); }
    MiniPool(int threads, int capacity) {
        if (threads < 1 || capacity < 1)
            throw new IllegalArgumentException("positive threads and capacity required");
        this.capacity = capacity;
        for (int i = 0; i < threads; i++) {
            Thread worker = new Thread(this::loop, "mini-" + i);
            workers.add(worker);
            worker.start();
        }
    }

    java.util.concurrent.Future<?> submit(Runnable task) {
        var future = new java.util.concurrent.FutureTask<Void>(
                java.util.Objects.requireNonNull(task), null);
        synchronized (lock) {
            if (stopped || queue.size() == capacity)
                throw new java.util.concurrent.RejectedExecutionException("closed or full");
            queue.addLast(future);
            lock.notifyAll();
        }
        return future;
    }

    private void loop() {
        while (true) {
            java.util.concurrent.FutureTask<?> task;
            synchronized (lock) {
                while (queue.isEmpty() && !stopped) {
                    try { lock.wait(); }
                    catch (InterruptedException ignored) {
                        // Workers are private; graceful shutdown is signalled by stopped.
                    }
                }
                if (queue.isEmpty()) return;
                task = queue.removeFirst();
            }
            task.run(); // FutureTask captures task failure for Future.get().
            Thread.interrupted(); // do not leak a task's interrupt status to the next task
        }
    }

    @Override public void close() throws InterruptedException {
        if (workers.contains(Thread.currentThread()))
            throw new IllegalStateException("close must be called by an external owner");
        synchronized (lock) {
            stopped = true; // atomic with the submission decision
            lock.notifyAll();
        }
        // Accepted tasks drain. If this wait is interrupted, shutdown remains in effect.
        for (Thread worker : workers) worker.join();
    }
}
```

**Reasoning and alternatives:** it shows the core of `ThreadPoolExecutor`: worker threads draining a bounded queue, explicit rejection, Future results and graceful shutdown. The exercise omits dynamic sizing and configurable thread factories.

**What if/test:** submission and shutdown share a lock, so an accepted task is queued before shutdown can finish. A full queue rejects immediately; this is an explicit overload policy, not blocking backpressure. Task failures are visible through the returned Future. Call close from an external owner; it drains accepted tasks and can wait indefinitely for a task that never finishes. Interruption of the owner stops its wait but leaves graceful shutdown in progress. For production use ThreadPoolExecutor; the exercise omits forced cancellation, worker replacement and robust thread-start failure handling. Test rejection, task failure and concurrent submit/close with latches.
**Signal:** explain the worker loop and why the queue is bounded.

#### Q185 Write a Spring filter that adds a correlation ID to the logging context

```java
@Component
class CorrelationIdFilter extends OncePerRequestFilter {
    private static final Pattern SAFE = Pattern.compile("[A-Za-z0-9._-]{1,64}");

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String incoming = req.getHeader("X-Correlation-Id");
        String id = (incoming != null && SAFE.matcher(incoming).matches()) ? incoming : UUID.randomUUID().toString();
        MDC.put("correlationId", id);
        res.setHeader("X-Correlation-Id", id);
        try { chain.doFilter(req, res); }
        finally { MDC.remove("correlationId"); }   // pooled threads must not leak context
    }
}
```

**Reasoning and alternatives:** validating the inbound value prevents log injection. Include `%X{correlationId}` in the log pattern or use JSON logging. With Micrometer Tracing, trace and span IDs may already be placed in the MDC, so reuse them rather than inventing a second ID.

**What if/test:** MDC does not propagate to new threads automatically; wrap executors with a `TaskDecorator` that copies it. Test with `MockMvc` asserting the response header and that the MDC is empty afterwards.
**Signal:** clear the context in `finally` and sanitize the header.

#### Q186 Merge K sorted linked lists

```java
ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> pq = new PriorityQueue<>(Comparator.comparingInt(n -> n.val));
    for (ListNode head : lists) if (head != null) pq.add(head);
    ListNode dummy = new ListNode(0), tail = dummy;
    while (!pq.isEmpty()) {
        ListNode node = pq.poll();
        tail.next = node; tail = node;
        if (node.next != null) pq.add(node.next);
    }
    return dummy.next;
}
```

**Reasoning and alternatives:** the heap holds at most one node per list, giving O(N log k) time and O(k) extra space for N total nodes. Alternative: merge pairwise in a divide-and-conquer fashion, also O(N log k) with O(1) extra space for linked lists (excluding recursion).

**What if/test:** test empty input, all-empty lists, one list, and duplicate values across lists.
**Signal:** give both complexities and explain why the heap stays size k.

#### Q187 Build a mini dependency-injection container

```java
class MiniContainer {
    private final Map<Class<?>, Object> singletons = new HashMap<>();
    private final Set<Class<?>> creating = new HashSet<>();

    @SuppressWarnings("unchecked")
    <T> T get(Class<T> type) {
        Object existing = singletons.get(type);
        if (existing != null) return (T) existing;
        if (!creating.add(type)) throw new IllegalStateException("Circular dependency: " + type.getName());
        try {
            Constructor<?> ctor = type.getDeclaredConstructors()[0];      // assume one constructor
            Object[] args = new Object[ctor.getParameterCount()];
            Class<?>[] params = ctor.getParameterTypes();
            for (int i = 0; i < args.length; i++) args[i] = get(params[i]);
            ctor.setAccessible(true);
            Object instance = ctor.newInstance(args);
            singletons.put(type, instance);
            return (T) instance;
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        } finally {
            creating.remove(type);
        }
    }
}
```

**Reasoning and alternatives:** this demonstrates constructor injection, singleton scope, and cycle detection, which is exactly why constructor cycles fail in Spring. Real containers add interface-to-implementation binding, scanning, scopes, lifecycle callbacks and thread safety.

**What if/test:** the sketch is not thread-safe and handles only concrete classes. Test a chain A→B→C and a cycle A→B→A.
**Signal:** relate each simplification to the matching Spring feature.

### Leadership

#### Q188 How do you run a design review and write an RFC or ADR

**Strong answer:** write a short document stating the problem, goals and non-goals, constraints, options considered with trade-offs, the recommendation, risks, a rollout and rollback plan, and open questions. Share it early with the people affected, set a review deadline, and record the decision with the reasoning (an Architecture Decision Record) and a date to revisit.

**Reasoning and alternatives:** the aim is a better decision, not approval of your preferred one: invite objections, use data or a small prototype to settle disputes, and separate reversible decisions (decide fast) from one-way doors (review thoroughly).

**What if:** the review becomes opinion battles; fix this by agreeing criteria first (latency, cost, delivery time, operability) and scoring options against them.
**Signal:** show a written process, decision criteria and a record of the outcome.

#### Q189 How do you handle a team member who is underperforming

**Strong answer:** start with a private, specific conversation about observed outcomes, not personality. Clarify expectations, ask about blockers (skills, context, workload, personal issues), agree on measurable goals and a short timeline, and check in frequently with support such as pairing, smaller tasks or a mentor. Involve your manager or HR early if the pattern continues.

**Reasoning and alternatives:** many cases are unclear expectations or poor fit with the task rather than lack of ability. Document the discussions factually and keep the rest of the team's workload fair in the meantime.

**What if:** performance does not improve despite support; then follow the formal process promptly and respectfully, because delaying harms both the person and the team.
**Signal:** be specific, empathetic and accountable, with a concrete example and outcome.

#### Q190 How do you prioritize technical debt against product features

**Strong answer:** quantify debt in business terms: incident count, time lost per release, onboarding time, lead time, or risk exposure (a vulnerable library). Rank by impact and cost to fix, tie work to roadmap goals ("this refactor removes the migration blocker for feature X"), and agree on a standing allocation (for example 15-20% of capacity) plus targeted projects for large items.

**Reasoning and alternatives:** the strongest framing is a risk and cost-of-delay conversation with product, not "the code is ugly". Pay debt incrementally alongside feature work where possible.

**What if:** product refuses any time for debt; then propose the smallest high-impact fix, measure the improvement and use the result to justify more.
**Signal:** use metrics and negotiate trade-offs instead of demanding rewrites.

#### Q191 How do you drive a change across teams when you have no authority

**Strong answer:** build a case with evidence, find allies and early adopters, make adoption easy (templates, libraries, migration guides, automation), start with a pilot, publish the results, and ask leaders to remove blockers rather than mandate. Keep feedback loops open so the solution adapts to real needs.

**Reasoning and alternatives:** people adopt what saves them effort and what they helped shape. Mandates without support create resentment and shallow compliance.

**What if:** teams still resist; find out their constraints, adjust the approach, and escalate only for genuine risk (security, compliance) with clear data.
**Signal:** describe influence through evidence, enablement and empathy, with a real adoption result.

#### Q192 How do you estimate work and communicate delays

**Strong answer:** estimate in ranges with stated assumptions, break work into small deliverables, separate known from unknown (add spikes for unknowns), and add buffer for integration and testing. Track progress against milestones. When a delay appears, tell stakeholders **early**, explain the cause and impact, and present options: reduce scope, move the date, or add resources, with your recommendation.

**Reasoning and alternatives:** a single-point estimate hides uncertainty; ranges and confidence levels make planning honest. Reduce risk by delivering the riskiest part first.

**What if:** pressure to commit to an unrealistic date; present the trade-off explicitly (scope, time, quality) rather than silently absorbing risk.
**Signal:** early, transparent communication with options, not excuses.

#### Q193 How do you decide between building and buying a solution

**Strong answer:** compare **total cost of ownership** (licenses or usage fees versus engineering, operations and maintenance), time to value, fit to requirements, integration effort, security and compliance, vendor risk and lock-in, and whether the capability is a **differentiator** for the business. Build what differentiates the product; buy or adopt open source for commodity capabilities.

**Reasoning and alternatives:** run a time-boxed proof of concept against the hardest requirements, check exit strategy and data portability, and review support and roadmap. A hybrid (buy the platform, build thin extensions) is common.

**What if:** a vendor's pricing or roadmap changes later; keep an abstraction at the integration boundary and revisit the decision periodically.
**Signal:** structure the decision with criteria and name the differentiator test.

---

<a id="part-14-system-design-data-internals-jvm-and-coding-questions-q194q213"></a>
<a id="part-14"></a>
## Part 14 - System Design, Data Internals, JVM and Coding Questions (Q194-Q213)

Twenty more questions in the same layout as Parts 10, 12 and 13. Q194-Q199 are condensed system designs, Q200-Q202 cover Kafka and database internals, Q203-Q206 cover Java I/O and JVM topics, and Q207-Q213 are coding problems with solutions. Where no source is linked, the basis is general engineering practice, so confirm specifics against the documentation for your version.

### Condensed system designs

#### Q194 Design a distributed cache

**Strong answer:** partition keys across nodes with consistent hashing or fixed hash slots, replicate each partition to a replica for failover, and bound memory with an eviction policy (LRU, LFU or TTL). Clients route requests directly or through a proxy. Use cache-aside with a TTL so the database stays the source of truth.

**Reasoning and alternatives:** asynchronous replication means a failover can lose the most recent writes or serve stale reads; synchronous replication costs latency. Handle **hot keys** with a small local near-cache or by replicating the key, and **stampedes** with single-flight loading, jittered TTLs or early refresh.

**What if/test:** a node failure triggers a cold-cache load spike on the database, so rate-limit refills and test by killing a node under load. Track hit rate, evictions and p99 latency.
**Signal:** cover partitioning, replication trade-offs, hot keys and stampedes, not just "use Redis".

#### Q195 Design a news feed or timeline

**Strong answer:** there are two models. **Fan-out on write** pushes each new post ID into every follower's precomputed timeline (fast reads, expensive writes, bad for accounts with millions of followers). **Fan-out on read** merges followed accounts' posts at request time (cheap writes, slower reads). A hybrid pushes for ordinary accounts and pulls for high-follower accounts, merging at read time.

**Reasoning and alternatives:** store posts in a durable database, and timelines as capped lists of post IDs in a cache, hydrating post content on read. Use cursor-based pagination, and apply ranking as a separate step if the feed is not purely chronological.

**What if/test:** deleting or editing a post must propagate to timelines (lazy filtering on read is simplest). Test a celebrity posting during peak and measure write amplification.
**Signal:** name the celebrity problem and the hybrid solution.

#### Q196 Design a webhook delivery system

**Strong answer:** persist each event, then deliver it with worker processes that POST to the subscriber's URL. Sign the payload (HMAC with a per-endpoint secret plus a timestamp to prevent replay), include a unique event ID so receivers can deduplicate, use short timeouts, and retry with exponential backoff for a bounded period. Deliveries are at-least-once and unordered unless you build per-endpoint ordering.

**Reasoning and alternatives:** isolate endpoints (a queue or rate limit per endpoint) so one slow subscriber cannot starve others. Disable an endpoint after sustained failure, send failed events to a dead-letter store, and provide a replay tool. Protect against SSRF with an outbound egress policy and destination validation: allow only approved schemes/hosts where possible; resolve and reject private, loopback, link-local and metadata addresses; revalidate every redirect and DNS resolution; and account for IPv4/IPv6 and DNS rebinding. A one-time hostname check or redirect following can bypass a denylist.

**What if/test:** a receiver that returns 200 before processing may lose events, so document that they should acknowledge only after durable receipt. Test with a flaky receiver and verify retry timing and deduplication.
**Signal:** mention signatures, idempotency, isolation and SSRF.

#### Q197 Design a file upload and storage service

**Strong answer:** do not proxy file bytes through application servers. The client requests a signed upload URL, then uploads directly to object storage, using resumable or multipart upload for large files. Store metadata (owner, size, content hash, status) in a database with states such as PENDING → READY. An object-finalized event triggers asynchronous processing (virus scan, thumbnails, indexing). Keep the object quarantined and unavailable for download until required validation and scanning finish; only then transition metadata to READY. Serve READY downloads through signed URLs or a CDN.

**Reasoning and alternatives:** deduplicate by content hash if storage cost matters, and apply lifecycle policies for expiry and tiering. Keep the object store and the metadata consistent with a reaper job that cleans abandoned uploads.

**What if/test:** a client may upload but never confirm, or confirm without uploading; validate against the object store before marking READY. Test interrupted and resumed uploads.
**Signal:** keep large data off the app tier and handle the two-system consistency gap.

#### Q198 Design search autocomplete

**Strong answer:** serve suggestions from a precomputed structure: a trie or prefix index where each prefix maps to its top-k completions, built offline or by streaming aggregation from query logs and refreshed periodically. Cache results in memory and at the edge, since latency must be very low.

**Reasoning and alternatives:** store the top-k at each node (more memory, faster lookup) instead of traversing the subtree at query time. Debounce on the client, shard by prefix for scale, add typo tolerance and personalization separately, and filter abusive or sensitive terms.

**What if/test:** trending queries need a fast update path beside the batch rebuild. Test p99 latency with realistic prefix distributions.
**Signal:** precompute top-k per prefix and justify the memory trade-off.

#### Q199 Design a leaderboard

**Strong answer:** use a Redis sorted set: `ZADD`/`ZINCRBY` update a member in O(log n); rank lookup is O(log n), while returning N members is O(log n + N). Modern Redis can use `ZRANGE ... REV`. Equal scores already tie-break lexicographically by member bytes. If packing a tie-breaker into scores, bound and prove the encoding preserves order and exactness: Redis scores are doubles, with exact integer representation only through ±2^53. Keep separate keys with TTLs for daily and weekly windows.

**Reasoning and alternatives:** a single sorted set is bounded by one node's memory and throughput. To scale, shard users and merge each shard's top N (exact for top N), or accept approximate ranks for far-down positions. Treat the sorted set as rebuildable from the event stream.

**What if/test:** concurrent updates are atomic per command, but rank queries during bursts can reflect in-flight changes. Test with simulated score bursts and verify rebuild from events.
**Signal:** name the data structure and the scale-out path.

### Kafka and database internals

#### Q200 Why is Kafka fast, and how do log segments, retention and compaction work

**Source basis:** [Kafka design documentation](https://kafka.apache.org/documentation/#design).

**Strong answer:** each partition is an append-only log stored as segment files. Writes are sequential, which disks handle efficiently, and Kafka relies on the operating system page cache, batching, compression and zero-copy transfer (`sendfile`) to serve consumers. Retention deletes whole old segments by time or size. **Log compaction** instead keeps the latest record per key, and a record with a null value (tombstone) deletes a key after a delay.

**Reasoning and alternatives:** consumers pull by offset, so replay is just resetting the offset. Compaction suits changelogs and current-state topics; time retention suits event streams.

**What if/test:** compaction does not guarantee immediate removal of older values, and consumers can still see superseded records until cleaning runs. Test tombstone behavior and retention settings explicitly.
**Signal:** explain performance through sequential IO and the page cache, not just "it's distributed".

#### Q201 What are ISR, acks and min.insync.replicas, and how can data be lost

**Strong answer:** the in-sync replica set (ISR) contains replicas caught up with the leader. With `acks=all` the leader waits for all current ISR members; `min.insync.replicas` makes the broker reject writes when the ISR is smaller than the threshold. A common setting is replication factor 3 with `min.insync.replicas=2`, tolerating one broker failure without losing acknowledged writes.

**Reasoning and alternatives:** with `acks=1` a leader crash after acknowledging but before replication loses the write. Allowing **unclean leader election** (a non-ISR replica becoming leader) trades data loss for availability, so it is normally disabled. Enable producer idempotence and retries to avoid duplicates and transient loss.

**What if/test:** `acks=all` with `min.insync.replicas=1` gives weaker protection than people assume. Test by stopping brokers and checking producer errors and acknowledged-write survival.
**Signal:** show how the three settings combine, not each in isolation.

#### Q202 Which PostgreSQL index types do you know and when do you use each

**Source basis:** [PostgreSQL index types](https://www.postgresql.org/docs/current/indexes-types.html).

**Strong answer:** B-tree (default) handles equality, ranges and ordering. A **partial index** (`WHERE status = 'ACTIVE'`) indexes only the rows queries need. **GIN** suits `jsonb`, arrays and full-text search. A **covering index** (`INCLUDE`) allows index-only scans. **BRIN** is a tiny index for very large tables whose values correlate with physical order (for example append-only timestamps). Expression indexes support queries on computed values such as `lower(email)`.

**Reasoning and alternatives:** every index slows writes and uses space, so base them on real queries and drop unused ones. Build on live tables with `CREATE INDEX CONCURRENTLY` to avoid blocking writes.

**What if/test:** index-only scans depend on the visibility map, so a table that is not vacuumed enough falls back to heap reads. Confirm with `EXPLAIN (ANALYZE, BUFFERS)`.
**Signal:** match the index type to the access pattern and mention the write cost.

### Java I/O and JVM

#### Q203 How do you process a very large CSV file in Java

**Strong answer:** stream it instead of loading it. Use a streaming CSV parser over a `Reader`; physical lines are not necessarily records because quoted fields may contain line breaks. Parse logical records, validate and process in **batches** (for example 1,000 rows per JDBC batch or a database bulk-load path), keeping memory bounded. Record progress so a failed run can resume.

**Reasoning and alternatives:** `Files.readAllLines` loads everything and fails on large files. For restartable, chunked processing with skip and retry policies use Spring Batch. Use a bounded queue between a reader thread and worker threads for parallelism with back-pressure.

**What if/test:** a single bad row should not abort a run silently; route rejects to an error file. Test with a file larger than the heap, quoted delimiters and multiline fields, malformed rows, and restart points at logical-record boundaries.
**Signal:** bounded memory, batching and restartability.

#### Q204 How do Java NIO and selectors differ from classic blocking I/O

**Strong answer:** classic I/O uses one blocked thread per connection. NIO uses **channels**, **buffers** and a **selector** so a small number of threads can monitor many connections and handle only those that are ready. Netty and Tomcat's NIO connector build event loops on this model. `FileChannel.transferTo` can move file data to a socket without copying through user space (zero-copy).

**Reasoning and alternatives:** NIO scales connection count but code is more complex. On Java 21, virtual threads let you write simple blocking code that scales well for I/O-bound services. Direct `ByteBuffer`s live off-heap, reduce copying, but are costly to allocate and need monitoring.

**What if/test:** blocking work inside an event-loop thread stalls many connections. Test by adding a slow call and observing latency across unrelated requests.
**Signal:** explain readiness multiplexing and the event-loop pitfall.

#### Q205 What are G1 humongous allocations and how do you spot them

**Strong answer:** in G1, an object at least half the size of a heap region is **humongous** and is allocated directly in contiguous old-generation regions, bypassing the young generation. Frequent humongous allocations can cause fragmentation, extra GC work and surprising full collections.

**Reasoning and alternatives:** spot them in GC logs (`-Xlog:gc*`) where humongous allocation is reported. Fixes: avoid very large arrays and buffers (process in chunks or stream), or increase the region size with `-XX:G1HeapRegionSize`. Fixing the allocation pattern is better than only tuning flags.

**What if/test:** a service that reads large payloads fully into a `byte[]` is a typical cause. Reproduce under load, compare GC logs before and after chunking.
**Signal:** connect a symptom in GC logs to a code-level cause.

#### Q206 List.of versus unmodifiableList versus List.copyOf versus Arrays.asList

**Strong answer:** `List.of` creates a structurally unmodifiable list and rejects nulls. `Collections.unmodifiableList` is a read-only **view**: changes to the underlying list remain visible through it. `List.copyOf` makes a shallow, structurally unmodifiable copy; callers must not rely on object identity. `Arrays.asList` is fixed-size and writes through to the backing array. `Stream.toList()` returns an unmodifiable list that allows nulls.

**Reasoning and alternatives:** for safe publication of collection structure, return an unmodifiable snapshot or defensive copy. If the object graph must also be immutable, its elements must be immutable or deep-copied. Mutating methods on all of these except the `Arrays.asList` `set` throw `UnsupportedOperationException`.

**What if/test:** returning `unmodifiableList(internalList)` and later mutating `internalList` surprises callers who iterate concurrently. Test by mutating the source after creating each variant.
**Signal:** distinguish a view from a copy.

### Coding problems

#### Q207 Longest consecutive sequence in O(n)

```java
int longestConsecutive(int[] nums) {
    Set<Integer> set = new HashSet<>();
    for (int n : nums) set.add(n);
    int best = 0;
    for (int n : set) {
        if (n == Integer.MIN_VALUE || !set.contains(n - 1)) { // avoid predecessor wraparound
            int len = 1;
            while ((long) n + len <= Integer.MAX_VALUE
                    && set.contains((int) ((long) n + len))) len++;
            best = Math.max(best, len);
        }
    }
    return best;
}
```

**Reasoning and alternatives:** each element is visited at most twice, so the time is O(n) with O(n) space. Sorting is simpler but O(n log n).

**What if/test:** test empty input, duplicates, negatives, one long run and both integer endpoints together.
**Signal:** explain why starting only at sequence starts keeps it linear.

#### Q208 Product of array except self (no division)

```java
int[] productExceptSelf(int[] a) {
    int n = a.length;
    int[] out = new int[n];
    if (n == 0) return out;
    out[0] = 1;
    for (int i = 1; i < n; i++) out[i] = out[i - 1] * a[i - 1];   // product of everything to the left
    int right = 1;
    for (int i = n - 1; i >= 0; i--) { out[i] *= right; right *= a[i]; }
    return out;
}
```

**Reasoning and alternatives:** O(n) time, O(1) extra space beyond the output. Division fails with zeros and is often disallowed.

**What if/test:** test zeros, negatives and overflow (ask whether to use `long`).
**Signal:** prefix and suffix products, and the zero case.

#### Q209 Rotting oranges (multi-source BFS)

```java
int orangesRotting(int[][] g) {
    Objects.requireNonNull(g, "grid");
    if (g.length == 0) return 0;
    Objects.requireNonNull(g[0], "grid row");
    int R = g.length, C = g[0].length;
    for (int[] row : g) {
        Objects.requireNonNull(row, "grid row");
        if (row.length != C) throw new IllegalArgumentException("grid must be rectangular");
        for (int cell : row) {
            if (cell < 0 || cell > 2) throw new IllegalArgumentException("grid cells must be 0, 1 or 2");
        }
    }
    int fresh = 0;
    Deque<int[]> q = new ArrayDeque<>();
    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++) {
            if (g[r][c] == 2) q.add(new int[]{r, c});
            else if (g[r][c] == 1) fresh++;
        }
    int minutes = 0;
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    while (!q.isEmpty() && fresh > 0) {
        for (int s = q.size(); s > 0; s--) {
            int[] p = q.poll();
            for (int[] d : dirs) {
                int nr = p[0] + d[0], nc = p[1] + d[1];
                if (nr >= 0 && nc >= 0 && nr < R && nc < C && g[nr][nc] == 1) {
                    g[nr][nc] = 2; fresh--; q.add(new int[]{nr, nc});
                }
            }
        }
        minutes++;
    }
    return fresh == 0 ? minutes : -1;
}
```

**Reasoning and alternatives:** start BFS from all rotten cells together so each level equals one minute. O(R × C) time and space.

**What if/test:** test empty and zero-column grids, no fresh oranges (0), unreachable fresh orange (-1), one cell and malformed nonrectangular input.
**Signal:** know why multi-source BFS gives the minimum time.

#### Q210 Trapping rain water (two pointers)

```java
long trap(int[] h) {
    Objects.requireNonNull(h, "heights");
    for (int height : h) {
        if (height < 0) throw new IllegalArgumentException("heights must be nonnegative");
    }
    int l = 0, r = h.length - 1;
    long leftMax = 0, rightMax = 0, water = 0;
    while (l < r) {
        if (h[l] < h[r]) { leftMax = Math.max(leftMax, (long) h[l]); water += leftMax - h[l]; l++; }
        else             { rightMax = Math.max(rightMax, (long) h[r]); water += rightMax - h[r]; r--; }
    }
    return water;
}
```

**Reasoning and alternatives:** water at a position is bounded by the lower of the tallest bars on each side; the pointer with the smaller height is already limited by its own side's maximum. O(n) time, O(1) space. The total is accumulated as `long`; the alternative uses two precomputed max arrays.

**What if/test:** test empty, monotonic and valley shapes, including a valley bounded by `Integer.MAX_VALUE` heights.
**Signal:** justify why the smaller side can be processed safely.

#### Q211 Minimum window substring (sliding window)

```java
String minWindow(String s, String t) {
    if (t.isEmpty() || s.length() < t.length()) return "";
    int[] need = new int[128];                     // assumes ASCII; use a map for full Unicode
    for (char c : t.toCharArray()) need[c]++;
    int missing = t.length(), left = 0, bestStart = 0, bestLen = Integer.MAX_VALUE;
    for (int r = 0; r < s.length(); r++) {
        if (need[s.charAt(r)]-- > 0) missing--;
        while (missing == 0) {
            if (r - left + 1 < bestLen) { bestLen = r - left + 1; bestStart = left; }
            if (++need[s.charAt(left++)] > 0) missing++;
        }
    }
    return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestStart, bestStart + bestLen);
}
```

**Reasoning and alternatives:** expand the right edge until all characters are covered, then shrink the left edge while still valid. Each index moves at most once, so O(n).

**What if/test:** test repeated characters in `t`, no valid window, and `t` longer than `s`.
**Signal:** explain the `missing` counter and the shrink condition.

#### Q212 Lowest common ancestor of a binary tree

```java
TreeNode lca(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;
    TreeNode left = lca(root.left, p, q), right = lca(root.right, p, q);
    return (left != null && right != null) ? root : (left != null ? left : right);
}
```

**Reasoning and alternatives:** if both subtrees return a node, the current node is the split point. O(n) time, O(h) stack. For a binary search tree you can walk down using the ordering in O(h).

**What if/test:** the solution assumes both nodes exist; confirm that or add a verification pass. Test when one node is an ancestor of the other.
**Signal:** state the assumption and give the BST shortcut.

#### Q213 Time-based key-value store

```java
class TimeMap {
    private final Map<String, TreeMap<Integer, String>> store = new HashMap<>();

    void set(String key, String value, int timestamp) {
        store.computeIfAbsent(key, k -> new TreeMap<>()).put(timestamp, value);
    }
    String get(String key, int timestamp) {
        TreeMap<Integer, String> versions = store.get(key);
        if (versions == null) return "";
        Map.Entry<Integer, String> e = versions.floorEntry(timestamp);   // latest version at or before timestamp
        return e == null ? "" : e.getValue();
    }
}
```

**Reasoning and alternatives:** `floorEntry` is O(log n). If timestamps always increase, an `ArrayList` with binary search uses less memory.

**What if/test:** this class is not thread-safe; for concurrency use `ConcurrentHashMap` with `ConcurrentSkipListMap`. Test a get before the first set, equal timestamps and overwriting.
**Signal:** pick a floor lookup structure and discuss thread safety.

<a id="part-15-full-system-design-walkthroughs-and-dpgraph-problems-q214q222"></a>
<a id="part-15"></a>
## Part 15 - Full System Design Walkthroughs and DP/Graph Problems (Q214-Q222)

Q214-Q216 are full walkthroughs you can follow in a 45-minute design round. Each uses the same flow: requirements, estimates, API, data model, architecture, deep dives, failure handling, trade-offs and a timing plan. The numbers are illustrative assumptions to show the method; in an interview, state your own assumptions and adjust. Q217-Q222 are dynamic programming and graph problems with solutions.

### Full system design walkthroughs

#### Q214 Design a flash-sale checkout that never oversells inventory

**Requirements.** Functional: browse a product, add to cart, reserve stock, pay, confirm the order. Non-functional: never sell more units than exist, tolerate a sudden traffic spike (assume 1M users, 100K requests/second on the product page, 10K order attempts/second, 5,000 units), stay available if payment is slow, and stay idempotent on retries.

**API.**
`POST /reservations {sku, qty}` returns a reservation with an expiry, `POST /orders {reservationId, paymentToken}` with an `Idempotency-Key` header returns the order, and `GET /orders/{id}` returns its status.

**Data model.** `stock(sku, available)`, `reservation(id, sku, qty, user, expires_at, status)`, `order(id, reservation_id, status, amount)`, and an idempotency table with a unique key scoped to the caller and operation plus a request fingerprint.

**Architecture.** A CDN serves the static product page. A **waiting room** (a queue that admits users at a controlled rate) protects the backend. The reservation service decrements stock atomically, the order service runs a saga (reserve → charge → confirm), and events flow through a message queue with an outbox.

**Deep dive: preventing oversell.** In one database transaction, validate positive quantity, perform `UPDATE stock SET available = available - :qty WHERE sku = :sku AND available >= :qty`, and create exactly one reservation if one row was updated. Zero updated rows means insufficient stock or a missing SKU; distinguish them if the API needs to. The database remains the inventory authority. A hot row can limit throughput: preallocate the 5,000 units into disjoint stock buckets and atomically decrement only a bucket with enough stock, or use a carefully reconciled reservation service. A Redis counter alone cannot prove the no-oversell guarantee across failover and database commits. Expiry releases a hold only after an atomic `ACTIVE → EXPIRED` transition that loses to a concurrent confirmation; credit stock once in the same transaction.

**Failure handling.** Move a reservation to `PAYMENT_PENDING` before charging so ordinary expiry does not release it mid-payment. A confirmed payment failure may release the reservation. A timeout is ambiguous: first query or reconcile the provider's payment state, using the same provider idempotency key, before refunding or releasing a hold. Bound how long pending holds can remain unresolved and escalate for reconciliation. Make order creation and compensation idempotent, and let a recovery worker finish interrupted state transitions. Reject traffic early with rate limiting and bot protection.

**Trade-offs.** A cache can serve availability hints but must not independently authorize a sale. A single database stock row is simple but limited by contention; disjoint buckets need careful allocation and reconciliation to avoid stranded units. Reserving before payment temporarily holds inventory. A waiting room protects capacity but needs an explicit fairness policy.

**Timing plan.** 5 min requirements and estimates, 5 min API and data, 10 min architecture, 15 min the oversell deep dive, 10 min failures and trade-offs.
**Signal:** a precise oversell mechanism (conditional update, sub-counters, expiring reservations), a saga with compensation and a plan for the traffic spike.

#### Q215 Design a ride-hailing dispatch system

**Requirements.** Functional: drivers send locations, riders request a ride, the system finds and offers the trip to a nearby driver, tracks the trip and shows ETA. Non-functional: matching in a few seconds, high-volume location updates (assume 1M online drivers sending a location every 4 seconds, about 250K updates/second), no driver offered two trips at once.

**API.**
Drivers stream locations over a persistent connection (WebSocket or gRPC) or `POST /drivers/{id}/location`. Riders call `POST /rides {pickup, dropoff}` and receive updates through push or streaming. Drivers respond with `POST /offers/{id}/accept` or `decline`.

**Data model.** The **latest** driver location lives in an in-memory geospatial store (for example Redis geospatial commands or an index keyed by geohash/S2/H3 cell), with driver state `AVAILABLE | OFFERED | ON_TRIP`. Trips, riders and drivers live in a durable database. Location history is written asynchronously to a stream and analytics storage.

**Architecture.** Location gateways (stateless, many instances) update the geo index. A matching service queries nearby available drivers in the pickup cell and neighboring cells, ranks them by ETA (from a routing service) and offers the trip to the best one with a timeout. A trip service owns the trip state machine, and a pricing service computes fares and surge per cell from supply and demand.

**Deep dive: matching without double-booking.** Choose one authoritative store for driver offer state. Atomically change `AVAILABLE → OFFERED` with a unique offer ID, expiry and version/fencing token, and persist the matching trip transition before notifying the driver. Acceptance must atomically verify that the offer is still current before moving to `ON_TRIP`. Decline and timeout may restore `AVAILABLE` only if they still own that offer; a late timeout must not clear a newer offer. Expanding search rings (nearby cells first, then wider) bounds candidate work per request.

**Failure handling.** Stale locations expire by a TTL; do not offer drivers whose location or availability is stale. Recover unexpired offers from the authoritative trip/offer store after a restart, and reconcile the geo index as a derived view. Partitioning by city or region limits the failure radius. Retry notifications without repeating a trip transition.

**Trade-offs.** Location updates need not be durable (the next update replaces them), which allows in-memory storage; trip state must be durable. Larger cells mean fewer lookups but more candidates to rank. Frequent updates improve accuracy but cost bandwidth and battery.

**Timing plan.** 5 min requirements and scale, 10 min geo index and updates, 15 min matching and state machine, 10 min failures and scaling, 5 min trade-offs.
**Signal:** separating ephemeral location data from durable trip data, and the atomic driver-state transition.

#### Q216 Design a real-time clickstream analytics pipeline on GCP

**Requirements.** Functional: collect events from web and mobile clients, make near-real-time aggregates available (page views per minute, funnel counts) and keep raw events for later analysis. Non-functional: handle bursts (assume 200K events/second peak), tolerate duplicates and late events, keep results correct within minutes, control cost.

**API.** `POST /events` accepts a batch of events, each with a client-generated `eventId`, timestamp, user or session ID and payload, validated against a schema.

**Data model.** Raw events in a date-partitioned, clustered BigQuery table (and an archive in Cloud Storage), aggregates in a separate table keyed by window and dimensions, and a dead-letter topic for invalid events.

**Architecture.** Clients send to a stateless collector on Cloud Run, which validates and publishes to **Pub/Sub**. A **Dataflow** (Apache Beam) streaming job reads the subscription, validates, deduplicates stable client `eventId` values within a defined retention period, enriches, computes windowed aggregates and writes raw and aggregated results to **BigQuery**. Route invalid records to a dead-letter destination explicitly in the pipeline. Dashboards query the aggregate tables.

**Deep dive: time, duplicates and late data.** Aggregate by **event time**, not arrival time, using windows with a watermark and allowed lateness. A late event updates an earlier window only while that window remains open under the chosen trigger and accumulation policy. Dataflow's default exactly-once mode covers committed pipeline results, not arbitrary external side effects. Deduplicate client retries by stable `eventId`; Pub/Sub message deduplication alone does not identify separately published copies of one client event. Choose a BigQuery sink mode with the required write guarantee, or reconcile duplicate rows downstream. State the end-to-end guarantee only after checking the source, sink and deduplication window. Partition BigQuery tables by event date and cluster by common filters to cut query cost.

**Failure handling.** The collector acknowledges only a confirmed publish; an ambiguous publish failure may still produce a duplicate when the client retries with the same `eventId`. Route poison records explicitly instead of relying solely on Pub/Sub subscription dead lettering after pipeline acknowledgement. If the pipeline is down, Pub/Sub retains messages within the configured retention period; recovery depends on backlog, quota and capacity. Monitor backlog age, watermark lag and error rates.

**Trade-offs.** A longer allowed lateness improves accuracy but delays final results and increases state. Streaming aggregation gives low latency at higher cost than batch recomputation; a common design keeps both, with batch as the correction layer. Schema evolution needs versioned, backward-compatible event formats.

**Timing plan.** 5 min requirements and scale, 10 min ingestion path, 15 min windows/dedupe/late data, 10 min failures and cost, 5 min trade-offs.
**Signal:** event time versus processing time, idempotent sinks and honest delivery guarantees.

### Dynamic programming and graph problems

#### Q217 Longest increasing subsequence in O(n log n)

```java
int lengthOfLIS(int[] nums) {
    int[] tails = new int[nums.length];          // tails[i] = smallest tail of an increasing subsequence of length i+1
    int size = 0;
    for (int x : nums) {
        int i = Arrays.binarySearch(tails, 0, size, x);
        if (i < 0) i = -(i + 1);                 // insertion point
        tails[i] = x;
        if (i == size) size++;
    }
    return size;
}
```

**Reasoning and alternatives:** each number replaces the first tail that is greater or equal, keeping tails as small as possible, which leaves the most room to extend. O(n log n) time. The simpler O(n²) DP (`dp[i] = 1 + max(dp[j])` for smaller earlier values) is acceptable first, then optimize.

**What if/test:** the array `tails` is not itself a valid subsequence, only its length is meaningful. Test empty input, all equal values (answer 1) and strictly decreasing input.
**Signal:** explain what `tails` means and why equal values replace instead of extend.

#### Q218 Partition equal subset sum (0/1 knapsack)

```java
boolean canPartition(int[] nums) {
    long sum = 0;
    for (int n : nums) {
        if (n < 0) throw new IllegalArgumentException("non-negative values required");
        sum += n;
    }
    if (sum % 2 != 0) return false;
    int target = Math.toIntExact(sum / 2); // array-backed DP requires a feasible target
    if (target == Integer.MAX_VALUE)
        throw new IllegalArgumentException("target too large for an array");
    boolean[] dp = new boolean[target + 1];
    dp[0] = true;
    for (int n : nums)
        for (int s = target; s >= n; s--)        // go downward so each number is used at most once
            dp[s] |= dp[s - n];
    return dp[target];
}
```

**Reasoning and alternatives:** the question reduces to "can some subset sum to half the total". O(n × target) time, O(target) space. Iterating upward would let a number be reused, which solves the unbounded variant instead.

**What if/test:** this array-backed method assumes non-negative integers and a feasible target size; reject negative values and use another representation if the target is too large for memory. Test an odd total, an empty input (two empty subsets are allowed), a single element, and a case that needs several elements.
**Signal:** explain the reverse loop and the reduction.

#### Q219 Longest common subsequence

```java
int longestCommonSubsequence(String a, String b) {
    int[][] dp = new int[a.length() + 1][b.length() + 1];
    for (int i = 1; i <= a.length(); i++)
        for (int j = 1; j <= b.length(); j++)
            dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
                    ? dp[i - 1][j - 1] + 1
                    : Math.max(dp[i - 1][j], dp[i][j - 1]);
    return dp[a.length()][b.length()];
}
```

**Reasoning and alternatives:** `dp[i][j]` is the answer for the first `i` characters of `a` and the first `j` of `b`. O(m × n) time and space; keep only two rows to reduce space to O(n). Walk the table backwards to reconstruct the sequence itself.

**What if/test:** test empty strings, identical strings and no common characters.
**Signal:** define the state precisely and mention the space optimization.

#### Q220 Word ladder (shortest transformation, BFS)

```java
int ladderLength(String begin, String end, List<String> words) {
    if (begin.equals(end)) return 1; // if a zero-transformation ladder is allowed
    Set<String> dict = new HashSet<>(words);
    if (!dict.contains(end)) return 0;
    Deque<String> q = new ArrayDeque<>();
    Set<String> seen = new HashSet<>();
    q.add(begin); seen.add(begin);
    int steps = 1;                                   // counts words in the sequence
    while (!q.isEmpty()) {
        for (int s = q.size(); s > 0; s--) {
            String w = q.poll();
            if (w.equals(end)) return steps;
            char[] c = w.toCharArray();
            for (int i = 0; i < c.length; i++) {
                char old = c[i];
                for (char x = 'a'; x <= 'z'; x++) {
                    if (x == old) continue;
                    c[i] = x;
                    String next = new String(c);
                    if (dict.contains(next) && seen.add(next)) q.add(next);
                }
                c[i] = old;
            }
        }
        steps++;
    }
    return 0;
}
```

**Reasoning and alternatives:** words are nodes and a single-letter change is an edge; BFS finds the shortest path in an unweighted graph. For each visited word of length L, generating 26L candidates costs O(26L²) in Java because constructing and hashing each candidate string costs O(L); memory is O(NL) for N dictionary words. Bidirectional BFS can reduce explored nodes on large dictionaries but must coordinate the two visited frontiers correctly.

**What if/test:** assume non-null, equal-length lowercase words; clarify whether a zero-transformation ladder counts as one word, and whether the end must appear in the dictionary. This implementation returns 1 when begin equals end. Test an unreachable target and a target missing from the dictionary.
**Signal:** model it as a graph, mark visited when enqueuing, and offer bidirectional BFS.

#### Q221 Cheapest flights within K stops (Bellman-Ford style)

```java
int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
    long INF = Long.MAX_VALUE / 4;
    long[] dist = new long[n];
    Arrays.fill(dist, INF);
    dist[src] = 0;
    for (int i = 0; i <= k; i++) {                   // at most k+1 edges
        long[] next = dist.clone();                  // use only last round's values
        for (int[] f : flights)
            if (dist[f[0]] < INF)
                next[f[1]] = Math.min(next[f[1]], dist[f[0]] + f[2]);
        dist = next;
    }
    return dist[dst] >= INF ? -1 : Math.toIntExact(dist[dst]);
}
```

**Reasoning and alternatives:** each round allows one more edge, so after `k + 1` rounds the array holds the cheapest cost using at most `k` intermediate stops. O((k + 1) × (E + V)) time and O(V) space, including each clone. Assume non-negative fares and a final answer in the `int` range; `long` distances avoid ordinary intermediate overflow. Plain Dijkstra using only one best cost per city can discard a path with fewer edges that is needed under the stop limit; a correct priority-queue variant tracks stops in its state.

**What if/test:** cloning the array each round prevents using an edge twice in one round. Test unreachable destinations, `k = 0` and a case where a cheaper path needs too many stops.
**Signal:** explain why the stop limit rules out standard Dijkstra and why the clone matters.

#### Q222 Redundant connection (Union-Find)

```java
int[] findRedundantConnection(int[][] edges) {
    int[] parent = new int[edges.length + 1];
    int[] rank = new int[parent.length];
    for (int i = 0; i < parent.length; i++) parent[i] = i;
    for (int[] e : edges) {
        int a = find(parent, e[0]), b = find(parent, e[1]);
        if (a == b) return e;                        // this edge closes a cycle
        if (rank[a] < rank[b]) parent[a] = b;
        else if (rank[a] > rank[b]) parent[b] = a;
        else { parent[b] = a; rank[a]++; }
    }
    return new int[0];
}

int find(int[] p, int x) {
    while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; } // path halving
    return x;
}
```

**Reasoning and alternatives:** assume n edges over node labels 1 through n and an original tree plus one extra edge. The edge joining two already connected nodes closes the unique cycle. Path compression plus union by rank gives O(E α(n)) total union-find time after initialization; α is the inverse Ackermann function. A fresh DFS reachability check before every edge can take O(n²) overall.

**What if/test:** under the tree-plus-one-edge premise, the first edge that closes a cycle is the last edge of that cycle in input order, matching the usual tie rule. This implementation is not a general solver for arbitrary graphs or sparse labels. Test a simple triangle and a longer cycle.
**Signal:** know when union-find beats DFS and name path compression and union by rank.

### Version and source notes

The system-design figures are illustrative estimates. Delivery guarantees and sink behavior are based on [Google Cloud Dataflow's exactly-once explanation](https://docs.cloud.google.com/dataflow/docs/concepts/exactly-once), [Pub/Sub to Dataflow behavior](https://docs.cloud.google.com/dataflow/docs/concepts/streaming-with-cloud-pubsub), and [Dataflow's BigQuery write modes](https://docs.cloud.google.com/dataflow/docs/guides/write-to-bigquery). These sources do not prove an arbitrary application's end-to-end exactly-once behavior.

<a id="part-16-hibernate-and-sql-questions-q223q244"></a>
<a id="part-16"></a>
## Part 16 - Hibernate and SQL Questions (Q223-Q244)

Hibernate/JPA and SQL practice. SQL examples use `employee(id, name, dept, salary, manager_id)` unless stated. The portable SQL examples were rerun against SQLite for this edition; see Appendix B for the precise coverage. JPA snippets are illustrative; check provider behavior and SQL with the Hibernate 6.6 and Spring Data JPA 3.5 references at the end. PostgreSQL-specific notes are identified explicitly.

### Hibernate and JPA

#### Q223 What goes wrong with @ElementCollection on a List

**Strong answer:** in Hibernate, an unordered `List` element collection can be mapped as a bag, whose duplicate values give rows no stable position or identity. Removing one value may delete all rows for the owner and re-insert the survivors. A `Set` or indexed `List` with `@OrderColumn` can permit more targeted SQL, but list index shifts may still update multiple rows. The exact plan depends on mapping and version; inspect generated SQL.

**Reasoning and alternatives:** for anything that grows, has its own lifecycle or needs queries, model a real entity with `@OneToMany` instead.

**What if/test:** turn on SQL logging, remove one element and count the statements.
**Signal:** you know the delete-all-and-reinsert behavior and when to promote the collection to an entity.

#### Q224 Why is a lazy @OneToOne hard, and what does @MapsId do

**Strong answer:** on the inverse `mappedBy` parent side, Hibernate may need a secondary query to learn whether a child exists, so `LAZY` alone may not defer loading. Lazy-state bytecode enhancement can help when a bidirectional association is required. On the owning side the foreign key is available to form a proxy. With `@MapsId`, the child's primary key also serves as its foreign key to the parent; this avoids a separate child identifier column, but it does not eliminate the need for a foreign-key constraint or guarantee no index.

**Reasoning and alternatives:** put the foreign key on the side you load more often, or model the child as a separate lookup by the parent's id.

**What if/test:** log SQL when loading the parent and count extra selects.
**Signal:** explain why null-ability forces the extra query.

#### Q225 How should you map @ManyToMany

**Strong answer:** when links are unique and order is unimportant, use a `Set` with stable entity equality and helper methods that keep both sides of a bidirectional mapping in sync. Avoid cascading `REMOVE` to the other entity: it can be shared by other owners. An unordered bag-style `List` can trigger delete-and-reinsert work on the join table; verify the mapping's SQL instead of assuming all lists behave alike.

**Reasoning and alternatives:** when the relationship has its own data (a role granted on a date) or you need to query it, use an explicit join entity with two `@ManyToOne` associations.

**What if/test:** remove one link and inspect the SQL for bulk deletes.
**Signal:** prefer an explicit join entity once the relationship has attributes.

#### Q226 IDENTITY, SEQUENCE or UUID for primary keys

**Strong answer:** with Hibernate 6.6, `IDENTITY` prevents JDBC insert batching for those entities because the database must generate each identifier during insert. A database `SEQUENCE` can support batching; when using a pooled optimizer, align its allocation/increment configuration with the actual database sequence and verify schema validation. Random UUIDs can reduce B-tree locality and enlarge keys; time-ordered identifiers may improve locality, subject to storage byte order and database index behavior.

**Reasoning and alternatives:** use UUIDs when ids must be generated client-side or across systems, accepting larger keys and the index cost.

**What if/test:** insert 10,000 rows with each strategy and compare the statement count and time.
**Signal:** connect id strategy to batching and index locality.

#### Q227 How do you implement soft delete safely

**Strong answer:** Hibernate 6.4+ provides `@SoftDelete` for entities and supported collection tables; prefer it when its semantics fit. On older versions, custom delete SQL plus a restriction/filter can implement soft delete, but verify entity loads, associations, bulk operations and caches. `@Where` was deprecated in favor of `@SQLRestriction` in newer Hibernate 6 releases; neither turns arbitrary native SQL into a filtered query.

**Reasoning and alternatives:** unique constraints still see deleted rows, so use a partial unique index covering only live rows. Native queries and bulk updates bypass the filter, and cascades need thought. If you need history rather than hiding, use an audit table.

**What if/test:** delete a row, then insert the same unique value again and query natively.
**Signal:** mention the unique-constraint trap and the native-query gap.

#### Q228 What does @Transactional(readOnly = true) really do

**Strong answer:** Spring's `readOnly = true` is a transaction hint, not a write prohibition. With Hibernate integration, Spring Data JPA documents a manual flush mode, which avoids normal dirty checking/flush work. A JDBC read-only hint may also be propagated depending on transaction manager and driver. Replica routing requires an explicitly configured router; the annotation does not move reads to a replica by itself.

**Reasoning and alternatives:** it is a hint, not a security boundary. Keep the same transaction rules and do not rely on it to block writes.

**What if/test:** modify an entity inside a read-only transaction and check whether anything persists on your stack.
**Signal:** call it an optimization hint and verify behavior for your versions.

#### Q229 Batch fetching versus subselect fetching

**Strong answer:** batch fetching (`@BatchSize`, `default_batch_fetch_size`) groups lazy loads for several parents into bounded `IN` queries. `@Fetch(FetchMode.SUBSELECT)` uses a subselect tied to the parent load to initialize the matching collection roles for parents held in the persistence context; it can fetch far more children than the one collection you touched.

**Reasoning and alternatives:** batching bounds each query's parent IDs and works with paging. Subselect fetching can reduce query count for a known, modest parent result, but inspect generated SQL, pagination behavior and total rows fetched before choosing it.

**What if/test:** load 100 parents and count statements under each setting.
**Signal:** choose by result size and paging needs, not by habit.

#### Q230 Which projection type should you use for read endpoints

**Strong answer:** project to the fields the API returns. In Spring Data JPA, a closed interface projection exposes known top-level properties and can let the query select fewer columns. Open projections with expression-based accessors limit this optimization; nested properties can require joins and materialize more data. Explicit DTO constructor expressions and tuples can also select narrow columns when the query names them.

**Reasoning and alternatives:** returning entities for list screens loads unused columns and risks lazy-loading surprises. Keep entities for writes.

**What if/test:** compare the generated SQL and memory for an entity query versus a projection.
**Signal:** separate read models from write models.

#### Q231 How do second-level cache concurrency strategies differ

**Strong answer:** `READ_ONLY` suits immutable data. `NONSTRICT_READ_WRITE` can allow stale reads around updates. `READ_WRITE` coordinates updates to a single cached entity more strictly, but it does not provide serializable transaction isolation. `TRANSACTIONAL` requires a provider that supports its stronger transactional semantics. Verify cache-provider support and cross-node behavior.

**Reasoning and alternatives:** cache only read-mostly entities with clear invalidation, and never cache what must be strongly consistent across instances unless the provider guarantees it.

**What if/test:** run two application instances, update through one, and read through the other.
**Signal:** name the strategy and the staleness it allows.

#### Q232 How do you stop lost updates across HTTP requests

**Strong answer:** return the entity version in a strong ETag, require `If-Match` on update, and enforce the precondition atomically with the write (for example using an `@Version` update or conditional SQL). For an HTTP `If-Match` failure, return `412 Precondition Failed`; an application-level version field may use `409 Conflict` by contract.

**Reasoning and alternatives:** `@Version` detects concurrent writers to the entity loaded in the update transaction, but it does not know the version the client saw unless that value travels through the API. A read-only comparison followed by an unguarded update is racy; the final write must check the version.

**What if/test:** two clients fetch the same resource, both update, and the second must fail.
**Signal:** know that the version must round-trip through the API.

#### Q233 How do you add auditing

**Strong answer:** Spring Data auditing (`@CreatedDate`, `@LastModifiedDate`, `@CreatedBy` with an `AuditorAware` bean) records who and when on the current row. Hibernate Envers stores revisions for audited entities when changes pass through it.

**Reasoning and alternatives:** Envers costs storage and write time and does not automatically cover native SQL or every external writer. Compliance-grade trails need a threat model, restricted mutation rights, retention policy and tamper-evident storage; triggers or change-data-capture can be part of that design.

**What if/test:** update an entity twice and confirm both who and when, and the history rows.
**Signal:** choose between column-level auditing and full history by need.

#### Q234 How do you manage schema migrations with Flyway or Liquibase

**Strong answer:** Flyway versioned migrations and Liquibase changesets record what ran and their checksums. Treat an applied migration as immutable; fix forward with a new migration rather than silently changing history. Flyway repeatable migrations suit replaceable views or procedures. Baseline an existing database deliberately, and keep Hibernate schema generation at `validate` or `none` in production when migrations own the schema.

**Reasoning and alternatives:** make migrations backward compatible (expand, migrate, contract) so rolling deploys work. Use the migration tool's locking/coordination or a single deployment step; do not assume every application replica can safely run arbitrary DDL concurrently.

**What if/test:** run the migration against a copy of production-sized data and time lock duration.
**Signal:** immutable history plus backward-compatible changes.

### SQL

#### Q235 NOT IN versus NOT EXISTS

```sql
-- customers with no orders (orders.customer_id may contain NULL)
SELECT c.id FROM customer c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
```

**Strong answer:** if the subquery contains a `NULL`, `NOT IN` cannot return a row whose value matches none of the non-null entries: the remaining comparison is unknown, not true. `NOT EXISTS` avoids that specific null trap. A `LEFT JOIN ... IS NULL` anti-join also works when the tested right-hand column is non-nullable for matched rows.

**Reasoning and alternatives:** `NOT EXISTS` also expresses intent clearly and usually plans as an anti-join.

**What if/test:** insert an order with a null customer and compare both forms.
**Signal:** explain three-valued logic.

#### Q236 Find the N-th highest salary

```sql
SELECT DISTINCT salary FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS r
  FROM employee WHERE salary IS NOT NULL
) t WHERE r = :n;
```

**Strong answer:** bind a positive `:n`. `DENSE_RANK` treats equal non-null salaries as one rank, so ties do not skip a position. The query returns one row for the N-th distinct salary, or no row when it does not exist.

**Reasoning and alternatives:** `ORDER BY salary DESC LIMIT 1 OFFSET n-1` over distinct salaries also works, but returns nothing, not null, when n is too large, depending on how it is written.

**What if/test:** include tied top salaries and a table with fewer than N distinct values.
**Signal:** choose `DENSE_RANK` over `RANK` or `ROW_NUMBER` for this.

#### Q237 Walk an org hierarchy with a recursive CTE

```sql
WITH RECURSIVE chain(id, name, depth, path) AS (
  SELECT id, name, 0, ',' || id || ',' FROM employee WHERE id = 1
  UNION ALL
  SELECT e.id, e.name, c.depth + 1, c.path || e.id || ','
  FROM employee e JOIN chain c ON e.manager_id = c.id
  WHERE instr(c.path, ',' || e.id || ',') = 0
)
SELECT id, name, depth FROM chain ORDER BY depth, id;
```

**Strong answer:** an anchor query seeds the result and the recursive part joins to the previous iteration until no rows are added. This SQLite example records visited IDs in a delimiter-guarded path, so a cycle on one branch is not expanded forever. Use a database-native cycle clause or array/path expression where available.

**Reasoning and alternatives:** a depth limit is a resource bound, not a proof that a hierarchy is acyclic; it can truncate legitimate data. Add an index on `manager_id` and validate ownership or tenant scope before traversing a production hierarchy.

**What if/test:** add a cycle in the data and confirm your guard stops it.
**Signal:** mention termination and cycle protection.

#### Q238 WHERE versus HAVING, and conditional aggregation

```sql
SELECT dept,
       COUNT(*) AS headcount,
       SUM(CASE WHEN salary > 100 THEN 1 ELSE 0 END) AS high_earners
FROM employee
GROUP BY dept
HAVING COUNT(*) >= 2;
```

**Strong answer:** `WHERE` filters rows before grouping; `HAVING` filters groups after aggregation. `CASE` inside an aggregate counts or sums by condition portably (PostgreSQL also has `FILTER`).

**Reasoning and alternatives:** push filters into `WHERE` when possible so fewer rows are grouped.

**What if/test:** compare plans when a filter sits in `WHERE` versus `HAVING`.
**Signal:** know the order of evaluation.

#### Q239 What causes database deadlocks and how do you handle them

**Strong answer:** two transactions each hold a lock the other needs, typically by touching the same rows in opposite order. The database detects the cycle and aborts one transaction. Retry the whole transaction from a fresh read when the operation is safe to repeat; never retry only the failed SQL statement against stale assumptions.

**Reasoning and alternatives:** lock rows in a consistent order, keep transactions short, add indexes so fewer rows are locked, and retry on the deadlock error code (for example `40P01` in PostgreSQL).

**What if/test:** reproduce with two sessions updating two rows in opposite order.
**Signal:** prevention plus an idempotent retry path.

#### Q240 What is write skew and how do you prevent it

**Strong answer:** two transactions read overlapping data, each updates a different row, and together they break an invariant (two doctors both go off call). PostgreSQL's `REPEATABLE READ` uses snapshot isolation and can allow this write skew because the writes do not conflict on one row.

**Reasoning and alternatives:** use `SERIALIZABLE` and retry aborted transactions, enforce the invariant with a database constraint where possible, or coordinate through a shared guard row/lock in every writer. Locking only the rows currently returned by a predicate may miss future rows or other access paths.

**What if/test:** run both transactions concurrently under the default isolation level.
**Signal:** explain the guarantee for the named database and isolation level rather than treating every vendor's `REPEATABLE READ` as identical.

#### Q241 How do you write an idempotent upsert

```sql
INSERT INTO account(id, balance) VALUES (1, 100)
ON CONFLICT(id) DO UPDATE SET balance = excluded.balance;
```

**Strong answer:** an upsert relies on a unique key and performs insert-or-update as one database statement (`ON CONFLICT` in PostgreSQL and SQLite; vendor alternatives differ). This example sets the same balance on repeat, so the stored balance is unchanged on an identical retry. It does not make audit triggers or other side effects automatically idempotent.

**Reasoning and alternatives:** select-then-insert races under concurrency. With JPA, use a database-specific native upsert or recover from a duplicate-key conflict in a fresh transaction after the failed transaction has rolled back; do not continue blindly in a transaction marked failed.

**What if/test:** run the statement twice and from two connections at once.
**Signal:** rely on a unique constraint, not application checks.

#### Q242 Partitioning versus sharding

**Strong answer:** partitioning splits a logical table into partitions in one database (range, list or hash). When the planner can use the partition key, partition pruning skips irrelevant partitions; time-range retention can become dropping a partition. Sharding distributes data across separate database instances or servers.

**Reasoning and alternatives:** choose partitioning for table management or query pruning when one database can still meet capacity needs; sharding is a separate operational step when data or write load must be distributed. PostgreSQL requires a unique or primary-key constraint declared on a partitioned table to include all partition-key columns, with additional restrictions on expressions.

**What if/test:** check `EXPLAIN` shows partition pruning for your common query.
**Signal:** keep the two terms distinct and start with partitioning.

#### Q243 Why can COUNT(*) and offset pagination be slow, and what is the alternative

**Strong answer:** an exact `COUNT(*)` over a filtered MVCC snapshot must establish which rows are visible; it is not generally a constant-time metadata lookup, though an index-only scan or selective plan can reduce cost. Deep offset pagination still processes or skips many earlier rows, so latency often grows with the offset.

**Reasoning and alternatives:** with a stable total ordering and matching index, use keyset pagination and fetch `limit + 1` rows to know whether another page exists. Use approximate counts or a maintained counter only when the UI accepts their freshness and precision limits.

**What if/test:** time page 1 versus page 10,000 under each approach.
**Signal:** question whether the UI really needs a total.

#### Q244 Remove duplicate rows but keep one

```sql
DELETE FROM person WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn
    FROM person WHERE email IS NOT NULL
  ) t WHERE rn > 1
);
```

**Strong answer:** number rows within each non-null email group and delete everything after the first, then add a matching unique constraint so duplicates cannot return. Define normalization (for example case folding) and the survivor rule before running it. The query intentionally leaves null emails untouched; SQL unique constraints often permit multiple nulls.

**Reasoning and alternatives:** preview affected rows, back up the data, run the delete in a transaction, and coordinate concurrent writers while establishing the unique constraint. If the survivor needs related rows or richer fields, migrate their references and data before deleting.

**What if/test:** verify counts before and after, and that the constraint now rejects a duplicate.
**Signal:** fix the data and add the constraint that prevents recurrence.

### Version and source notes

Hibernate mapping, identifier, cache, association and soft-delete behavior above is calibrated to the [Hibernate ORM 6.6 user guide](https://docs.hibernate.org/orm/6.6/userguide/html_single/). The transaction and projection points use the [Spring Data JPA transaction reference](https://docs.spring.io/spring-data/jpa/reference/jpa/transactions.html) and [Spring Data JPA 3.5 projection reference](https://docs.spring.io/spring-data/data-jpa/reference/3.5/repositories/projections.html). PostgreSQL-specific isolation and partitioning details should be checked against the deployed version's [transaction-isolation](https://www.postgresql.org/docs/current/transaction-iso.html) and [partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html) documentation. SQL query syntax and plans remain database-specific.

---

<a id="part-17-more-hibernate-and-sql-questions-q245-q272"></a>
<a id="part-17"></a>
## Part 17 - More Hibernate and SQL Questions (Q245-Q272)

Baseline: Hibernate 6.x / Jakarta Persistence 3.1 and PostgreSQL where named. Framework and PostgreSQL examples require integration testing on the target stack.

#### Q245 When does Hibernate flush, and what surprises people
**Strong answer:**  with the default auto mode it flushes at commit and before queries that could be affected by pending changes, so a query can see unsaved changes made in the same transaction.

**Reasoning and alternatives:**  native SQL behaves differently between the native Session API and the JPA EntityManager, so do not assume.

**What if/test:**  persist an entity, run a native query that should see it, and check the result on your stack.

**Signal:**  you can explain why a flush can fire mid-method and trigger constraint errors early.

#### Q246 Enums and attribute converters
**Strong answer:**  ORDINAL breaks when someone reorders the enum; STRING is safer and readable. An AttributeConverter maps a stable code, such as a one-letter status, to the enum.

**Reasoning and alternatives:**  back it with a database check constraint so bad values cannot be stored by other writers.

**What if/test:**  reorder the enum constants and confirm stored data still reads correctly.

**Signal:**  persistence format is a contract, independent of code order.

#### Q247 Large objects and BLOB columns
**Strong answer:**  large binary fields load with the entity unless lazily fetched, which usually needs bytecode enhancement. Prefer storing files in object storage and keeping a reference and metadata in the row.

**Reasoning and alternatives:**  if you must keep them in the database, put them in a separate table or entity so list queries never touch them.

**What if/test:**  log SQL for a list query and check whether the blob column is selected.

**Signal:**  keep wide, rarely used columns out of hot queries.

#### Q248 What is @NaturalId for

**Strong answer:** Hibernate @NaturalId identifies a business key and enables natural-ID lookup and optional caching in addition to a surrogate primary key. It is immutable by default, but `@NaturalId(mutable = true)` explicitly supports changes and requires synchronization of lookup state. ISBN may be a stable key; email often changes and should not be called inherently immutable.

Enforce uniqueness in the database. Test lookup before and after an allowed change, and understand session/cache effects. The annotation does not replace the entity's primary-key identity or a database constraint.

[Hibernate 6.6 natural IDs](https://docs.hibernate.org/orm/6.6/userguide/html_single/#naturalid)

#### Q249 Why not return entities from REST controllers
**Strong answer:**  bidirectional associations cause infinite recursion in JSON, lazy proxies break serialization, and exposing entities leaks fields and invites mass assignment on input.

**Reasoning and alternatives:**  map to DTOs or records for each use case; this also stabilizes your API against schema changes.

**What if/test:**  add a new column and verify the API response does not change.

**Signal:**  separate the persistence model from the API contract.

#### Q250 Composite keys: @EmbeddedId or @IdClass
**Strong answer:**  both model multi-column keys. @EmbeddedId uses an embeddable key class, which needs equals, hashCode and serializability. @IdClass repeats the fields on the entity.

**Reasoning and alternatives:**  composite keys complicate repositories, joins and foreign keys, so a surrogate key plus a unique constraint is often simpler.

**What if/test:**  load the same row twice in one session and confirm identity behaves.

**Signal:**  prefer surrogate keys unless the natural composite is truly the identity.

#### Q251 Native queries with paging and sorting in Spring Data
**Strong answer:**  Spring cannot always derive the count query for a native query, so supply countQuery when using Pageable. Sort fields from user input must be validated against an allow-list.

**Reasoning and alternatives:**  map public sort names to known column names instead of passing them straight to the query.

**What if/test:**  send a malicious sort parameter and confirm it is rejected.

**Signal:**  treat sorting as an injection surface.

#### Q252 equals and hashCode when proxies are involved
**Strong answer:**  a lazy proxy is a subclass, so getClass() == other.getClass() can be false for the same entity. Compare by business key or id, use instanceof carefully, and access state through getters, not fields.

**Reasoning and alternatives:**  if you must reach the real class, unproxy it explicitly.

**What if/test:**  compare a loaded entity with a reference obtained by getReference for the same id.

**Signal:**  you know proxies break naive class checks.

#### Q253 Configuring multiple data sources with JPA

**Strong answer:** for separate local JPA transactions, configure each DataSource, entity manager factory, entity package scan and transaction manager, and bind each repository group to the correct factory/manager. Select the manager explicitly where ambiguous. Auto-configuration back-off is conditional on the beans and release, so inspect the effective configuration.

A local transaction manager does not make changes in two databases atomic. JTA/XA can coordinate supported resources when configured; alternatively use explicit distributed-workflow semantics such as an outbox/saga. Test failure after the first database write and state the actual guarantee.

#### Q254 Routing reads to replicas
**Strong answer:**  a routing data source can pick the primary or a replica by checking whether the current transaction is read-only. Wrap it in a lazy connection proxy so the choice happens after the transaction attributes are known.

**Reasoning and alternatives:**  replication lag breaks read-your-writes, so send reads that must see recent writes to the primary.

**What if/test:**  write then immediately read through a replica under artificial lag.

**Signal:**  mention lag and the lazy proxy.

#### Q255 What bites teams migrating to Hibernate 6
**Strong answer:**  the move to the Jakarta namespace, stricter query parsing, changes to default sequence naming and allocation, replaced annotations (for example @Where and @Type), and different JSON and type mapping.

**Reasoning and alternatives:**  upgrade stepwise, run the full test suite with SQL logging, and compare generated statements.

**What if/test:**  diff the DDL and the SQL log before and after the upgrade.

**Signal:**  a migration plan driven by evidence, not hope.

#### Q256 Batch insert pattern
**Strong answer:**  enable JDBC batching, persist in a loop, and every batch size call flush() then clear() so the persistence context does not grow. Use sequence-based ids, because IDENTITY blocks batching.

**Reasoning and alternatives:**  chunk the work into several transactions so one failure does not roll back millions of rows.

**What if/test:**  insert 100,000 rows and compare statement count and heap use with and without clear().

**Signal:**  you control memory, statements and transaction size together.

#### Q257 How do databases execute joins
**Strong answer:**  nested loop (good when the outer side is small and the inner side is indexed), hash join (equi-joins on large unsorted inputs) and merge join (inputs already sorted on the join key). The optimizer chooses from statistics.

**Reasoning and alternatives:**  a missing index or a bad estimate can flip the plan to a slow choice.

**What if/test:**  read the join type in EXPLAIN and check estimated versus actual rows.

**Signal:**  connect the join algorithm to the data shape.

#### Q258 Why do query plans change or regress
**Strong answer:**  the planner relies on statistics. Stale or skewed statistics, data growth, or correlated columns make row estimates wrong and produce a worse plan.

**Reasoning and alternatives:**  refresh statistics, add extended statistics for correlated columns, and watch for parameter-dependent plans with prepared statements.

**What if/test:**  compare estimated and actual rows after a large data load.

**Signal:**  diagnose estimates before touching the query.

#### Q259 Why did the optimizer ignore my index
**Strong answer:**  common causes are a function on the indexed column, an implicit type conversion (a text column compared with a numeric parameter), a leading wildcard, low selectivity, an OR across columns, stale statistics, or a table small enough that a scan is cheaper.

**Reasoning and alternatives:**  fix the predicate (match types, use an expression index) before forcing hints.

**What if/test:**  compare plans with the correctly typed parameter.

**Signal:**  list several causes, not just "functions on columns".

#### Q260 Using the database as a work queue with SKIP LOCKED

**Strong answer:** PostgreSQL `SELECT ... FOR UPDATE SKIP LOCKED` lets workers skip rows locked by peers. Locks belong to the transaction and disappear on commit or rollback. Holding the transaction through short database work can serialize claims; if you commit a claim before a long external task, persist claim state with a lease and define expiry/recovery.

A worker crash or lost acknowledgement can repeat an external effect. Use idempotency and, where required, fencing; a database row lock alone does not protect work after its transaction ends. Test crash-before-commit, crash-after-effect and lease expiry. A broker may be preferable when queue volume or delivery features justify it.

#### Q261 What are advisory locks for
**Strong answer:**  PostgreSQL advisory locks are application-defined locks on a numeric key, useful for singleton jobs or migrations. Prefer the transaction-scoped form, because session-level locks can leak through pooled connections.

**Reasoning and alternatives:**  a leader-election library or a lock table also works if you need portability.

**What if/test:**  start two instances and confirm only one runs the job.

**Signal:**  mention the pooling pitfall.

#### Q262 Savepoints and aborted transactions

**Strong answer:** a PostgreSQL statement error leaves the transaction unable to execute ordinary statements until rollback. A savepoint created before the failure allows rollback to that savepoint. Catching a Java exception alone does not repair database or persistence-context state.

Spring NESTED propagation requires transaction-manager savepoint support. A JDBC manager can support it; JpaTransactionManager does not provide true nested JPA entity-state transactions, and its optional savepoints apply to JDBC work. JPA exceptions may mark the transaction rollback-only. Prefer a fresh appropriate transaction when retrying a failed JPA operation; test the actual manager and driver.

[Spring JpaTransactionManager](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/orm/jpa/JpaTransactionManager.html)

#### Q263 Storing money correctly
**Strong answer:**  use NUMERIC/DECIMAL or integer minor units, never floating point. In Java use BigDecimal built from strings, with an explicit scale and rounding mode.

**Reasoning and alternatives:**  store the currency with the amount, and allocate rounding remainders deliberately when splitting.

**What if/test:**  sum 0.1 ten times in double versus decimal.

**Signal:**  explain the representation error, not just "use BigDecimal".

#### Q264 timestamp versus timestamptz and time zones
**Strong answer:**  in PostgreSQL timestamptz represents an instant, normalized to UTC, while timestamp has no zone. Map to Instant or OffsetDateTime, store UTC, and keep the user's zone separately for scheduling.

**Reasoning and alternatives:**  daylight saving makes recurring local times tricky, so store the zone ID and local time for those.

**What if/test:**  run the app and database in different time zones and compare stored values.

**Signal:**  separate instants from local calendar times.

#### Q265 JSONB column or relational columns
**Strong answer:**  JSONB suits flexible, sparse or evolving attributes and can be indexed with GIN. Core, frequently filtered and joined fields belong in real columns with constraints and statistics.

**Reasoning and alternatives:**  a hybrid model is common: stable columns plus a JSONB column for extras.

**What if/test:**  query on a JSONB field with and without the index and compare plans.

**Signal:**  justify the schema flexibility against lost constraints.

#### Q266 Views versus materialized views

**Strong answer:** a view stores a query; a materialized view stores query results that become stale between refreshes. In PostgreSQL, REFRESH MATERIALIZED VIEW CONCURRENTLY requires an already-populated view and a qualifying UNIQUE index using plain column names, covering all rows (no partial predicate or expression-only index). A generic unique index is not sufficient.

Measure refresh cost and the staleness budget. Summary tables maintained by jobs or events are alternatives with their own consistency and failure semantics.

[PostgreSQL materialized-view refresh requirements](https://www.postgresql.org/docs/current/sql-refreshmaterializedview.html)

#### Q267 Gaps and islands: longest login streak

```sql
-- Integer day numbers; duplicate activity on the same day counts once.
WITH days AS (
    SELECT DISTINCT user_id, day_no FROM logins
    WHERE day_no IS NOT NULL
), numbered AS (
    SELECT user_id, day_no,
           day_no - ROW_NUMBER() OVER (
               PARTITION BY user_id ORDER BY day_no
           ) AS grp
    FROM days
)
SELECT user_id, MIN(day_no) AS start_day, MAX(day_no) AS end_day,
       COUNT(*) AS days
FROM numbered
GROUP BY user_id, grp
ORDER BY days DESC, user_id, start_day;
```

**Strong answer:** consecutive day numbers minus row numbers share a constant difference. Grouping that difference produces streaks. The query returns every streak longest first; use a per-user ranking if the requirement is exactly one longest streak per user. DISTINCT prevents duplicate days from splitting a streak. Test gaps, ties, duplicates, null dates and single-day runs.

#### Q268 Why constraints belong in the database
**Strong answer:**  primary keys, foreign keys, unique, check and not-null constraints enforce integrity for every writer and under concurrency, where application checks race. Deferrable foreign keys help with circular inserts.

**Reasoning and alternatives:**  index foreign key columns yourself in PostgreSQL, since it does not do so automatically, to speed joins and deletes.

**What if/test:**  try to insert an orphan and a duplicate from two sessions.

**Signal:**  the database is the last line of defense.

#### Q269 Row-level security for multi-tenancy in PostgreSQL

**Strong answer:** enable PostgreSQL row-level security and define both visibility and permitted-write policies. For a UUID tenant column, an example predicate is `tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid`. Set a verified tenant with a transaction-local setting before any tenant data access. A missing value should deny access, and pooled connections must not retain the preceding request's tenant.

Use an application role that neither owns the table nor has superuser/BYPASSRLS privileges. FORCE ROW LEVEL SECURITY subjects an owner to policies, but does not constrain superusers or BYPASSRLS roles. An application-set tenant variable assumes trusted application code; it is not protection from a database client able to change that variable. Test SELECT and writes, missing tenant context, connection reuse and privileged paths.

[PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

#### Q270 How do you find what is blocking a query
**Strong answer:**  in PostgreSQL inspect pg_stat_activity for state, wait events and transaction start time, use pg_blocking_pids, and look for sessions that are idle in transaction. Protect the system with lock_timeout, statement_timeout and an idle-in-transaction timeout.

**Reasoning and alternatives:**  cancel the query first, and terminate the session only if needed.

**What if/test:**  hold a lock in one session and watch the blocker in another.

**Signal:**  diagnose, then add timeouts to prevent recurrence.

#### Q271 NULL traps in SQL

```sql
SELECT COUNT(*) AS all_rows, COUNT(score) AS non_null_scores,
       AVG(score) AS avg_score
FROM exam;
SELECT id FROM exam WHERE score = NULL; -- UNKNOWN, not TRUE: no matches
SELECT id FROM exam WHERE score IS NULL;
```

**Strong answer:** SQL uses three-valued logic. Ordinary comparison with NULL evaluates to UNKNOWN, so WHERE rejects it. COUNT(*) counts rows; COUNT(column), AVG and SUM ignore null inputs, while an all-null SUM/AVG is NULL. Aggregates have individual contracts, so do not generalize this to every aggregate.

Also test NOT IN with a null in its input; NOT EXISTS with the intended correlation is often the clearer anti-join. Unique-constraint treatment of nulls and default null ordering depend on the database and options.

#### Q272 Backup and restore strategy
**Strong answer:**  combine periodic physical base backups with continuous log archiving for point-in-time recovery, plus logical dumps for portability. Define RPO and RTO first, encrypt backups and store a copy in another region.

**Reasoning and alternatives:**  replication is not a backup, since it replicates mistakes such as accidental deletes.

**What if/test:**  restore to a new instance on a schedule and time it against the RTO.

**Signal:**  an untested backup is not a backup.

### Daily SDE-3 Java interview practice sets

The following three sets were created on 7 October 2026 and add 36 scenario questions with spoken answers, examples, trade-offs, and follow-ups.

**Day 1 · 7 October 2026  -  Foundations under production pressure**

Twelve new questions, using your [Senior Java Interview Master Guide](#part-1) as the baseline. Assume **Java 21, without preview features**. Framework assumptions are stated where relevant. All scenarios are illustrative.

Practise each spoken answer in 45-90 seconds, then use the follow-ups to test your understanding.

---

**1. A customer object is used as a `HashMap` key. After changing its region, lookup with that same object fails. Why?**

**Say aloud:**  
“A hash map uses a key’s hash code to locate a bucket, which is a group of candidate entries, and equality to identify the matching key. Equal keys must have equal hash codes. If region participates in those calculations, changing it after insertion breaks the lookup assumptions. The entry remains stored according to its original hash, while the next lookup uses the new hash.

I would define the key using stable identity, such as an immutable customer ID, and keep changing attributes in the value. Synchronizing the map would not solve this identity problem. If mutation is unavoidable, remove the entry before changing the key and then reinsert it. Once mutation has already happened, rebuilding the map from its entries may be needed.”

- **Example:** Insert a key representing `(customerId=42, region="east")`; change region to `"west"`; `get(key)` may return `null` even though iteration still shows the entry.
- **Cost and guarantee:** Expected O(1) lookup with well-distributed hashes and constant-cost equality; occasional resizing costs O(n). Stable keys preserve the lookup contract.
- **Trade-off and failure:** Immutable keys may require separate key objects. Accidentally including changing fields in generated equality recreates the bug.
- **Follow-ups:**  
  “Does `ConcurrentHashMap` fix it?” → No; concurrency protection does not repair mutable identity.  
  “Can unequal objects share a hash?” → Yes; equality resolves collisions.

---

**2. Does `record DeliveryPlan(List<String> stops)` give you an immutable delivery plan?**

**Say aloud:**  
“A record is a concise Java data carrier with generated accessors and value-oriented methods. Its fields are final, meaning the references cannot be reassigned after construction. That does not freeze objects those references point to.

If I store the caller’s mutable list directly, the caller can change the plan later. I would make a defensive copy in the constructor: a copy that prevents the caller’s subsequent structural changes from affecting my object. `List.copyOf` provides an unmodifiable list and rejects null elements.

For strings, this is sufficient because strings themselves are immutable. For mutable stop objects, copying the list still shares those objects, so I would also need immutable stop values or appropriate element copies. Immutability has to cover the reachable state that matters to the contract.”

```java
record DeliveryPlan(List<String> stops) {
    DeliveryPlan {
        stops = List.copyOf(stops);
    }
}
```

- **Cost and guarantee:** Copying n references is O(n) time and space when a copy is needed. Existing suitable immutable lists may be reused.
- **Trade-off and failure:** Copying costs memory; shallow copying fails when elements remain mutable.
- **Follow-ups:** “Copy on every accessor call?” → Unnecessary here. “Allow null stops?” → Define another explicit representation or validation policy.

Java’s exact list guarantees: [Java 21 `List` documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html).

---

**3. A background thread replaces routing configuration while request threads read it. When is `volatile` enough?**

**Say aloud:**  
“`volatile` gives a field visibility and ordering guarantees across threads. It exists because an ordinary shared field does not reliably communicate updates without synchronization. A write to a volatile field happens-before subsequent reads of that field: earlier writes become visible through that publication.

For configuration, I would construct a complete immutable snapshot and assign it to a volatile reference. Each request would read that reference once into a local variable, then use that snapshot throughout its decision. This prevents mixing fields from different configuration versions.

Volatile does not make compound operations atomic. Atomic means an operation acts as one indivisible step relative to competing operations. Two writers that both read, modify, and replace configuration can still overwrite one another’s changes. That requires additional coordination.”

```java
private volatile RoutingConfig current;

// Reader: one snapshot per decision
RoutingConfig snapshot = current;
return routeUsing(snapshot);

// Writer: build fully before publication
current = validatedReplacement;
```

- **Guarantee:** Readers see a safely published snapshot; this does not freeze mutable objects inside it.
- **Cost:** Reference access is constant work; constructing the snapshot depends on its size.
- **Trade-off and failure:** Immutable snapshots simplify reads but allocate on updates. Reading `current` repeatedly can mix versions.
- **Follow-ups:** “Two writers?” → Serialize updates with a lock or use an atomic conditional update. “Does volatile guarantee fairness?” → No.

---

**4. An executor has eight core threads and a maximum of 64, yet its queue grows while only eight threads work. What happened?**

**Say aloud:**  
“An executor manages worker threads and pending tasks. In `ThreadPoolExecutor`, the queue policy determines when the pool grows. Once the core workers exist, it normally tries to queue new tasks before creating additional workers. With an unbounded queue, queuing keeps succeeding, so the configured maximum does not normally help.

I would first measure task duration and the downstream service’s capacity. Then I would choose bounded workers and a bounded queue, plus an explicit rejection policy. Backpressure means slowing or refusing incoming work when capacity is exhausted; it exists to stop overload becoming unlimited memory growth.

A queue absorbs a short burst, but it cannot fix sustained excess demand. I would also enforce deadlines so requests do not wait until their results are already useless.”

- **Example:** Eight workers, maximum 64, bounded queue of 100: growth beyond eight becomes possible when the queue fills.
- **Guarantee/cost:** Pending queue occupancy is bounded; completion time is not. More workers consume resources and may overload dependencies.
- **Failure/trade-off:** Running rejected work on the submitting thread slows submissions but can block a latency-sensitive caller.
- **Follow-ups:** “Larger queue?” → More burst absorption, more waiting. “More threads?” → Only if dependencies can sustain them.

Verified behavior: [Java 21 `ThreadPoolExecutor`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html).

---

**5. JVM heap usage keeps rising. How do you distinguish a memory leak from normal allocation?**

**Say aloud:**  
“The heap holds Java objects. Garbage collection reclaims objects that are no longer reachable from live application state. A memory leak in Java usually means objects remain reachable even though the application no longer needs them.

I would compare memory behavior under equivalent workloads and examine the amount still retained after relevant collection cycles. A sawtooth pattern can be normal: allocation raises usage, collection lowers it. A rising retained baseline is stronger evidence of retention, but it can also reflect a growing legitimate workload.

Next, I would identify which object types are accumulating and inspect their retaining paths - the references keeping them alive. For example, a static map storing every completed request is a concrete explanation. I would fix its ownership or retention policy before attempting garbage-collector tuning.”

- **Example:** A completed-request map grows by 10,000 entries per hour because nothing removes entries.
- **Cost/guarantee:** Retaining n request objects requires space proportional to their combined reachable size. Collection cannot reclaim strongly reachable entries.
- **Trade-off and failure:** Bounded retention reduces memory but may remove useful history. Heap inspection can be expensive; reproduce with representative load where possible.
- **Follow-ups:**  
  “High allocation but stable retained heap?” → Investigate temporary-object creation and collection overhead.  
  “Process memory grows while heap stays stable?” → Investigate non-heap memory and other process resources.

---

**6. In a Spring Boot service, `importAll()` calls its own `@Transactional importOne()`. A checked exception leaves partial data. Explain both risks.**

**Say aloud:**  
“A transaction groups database changes so they commit or roll back together. In Spring’s default proxy mode, a proxy is a wrapper around a managed service that applies transaction behavior when calls pass through it.

A method calling another method on the same object bypasses that wrapper. Therefore, the inner annotation does not establish its requested transaction boundary. An existing outer transaction may still apply.

The second issue is rollback policy. Under Spring’s traditional defaults, unchecked exceptions and errors trigger rollback, while checked exceptions do not automatically do so. Configuration can change that.

I would put the intended database operation behind a managed service boundary, choose whether each item or the whole import is atomic, and configure rollback for the relevant checked exception explicitly.”

- **Example:** Another service calls `importService.importOne(...)`, annotated with `@Transactional(rollbackFor = ImportException.class)`.
- **Guarantee:** Atomicity covers participating transactional database changes, not an already-sent email.
- **Trade-off/failure:** Whole-import transactions hold resources longer; per-item transactions permit partial completion.
- **Follow-ups:** “Exception swallowed?” → Normal return may allow commit. “Spring 6.2+?” → Global all-exception rollback configuration is available; inspect actual settings.

Source: [Spring transaction annotations](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html).

---

**7. A page of 50 orders executes 51 database queries when order lines are accessed. How would you fix it without breaking pagination?**

**Say aloud:**  
“This is the N-plus-one query problem: one query loads the parent records, then one additional query per parent loads related data. Lazy loading means delaying related-data retrieval until access; it can avoid unnecessary work, but here it creates many database round trips.

I would verify the actual queries, then design retrieval around the response. One option is first paging ordered order IDs, then fetching those orders and their lines in a second query. I would restore the first query’s ordering explicitly.

A fetch join retrieves an association alongside its parent. However, fetching a collection multiplies result rows, so combining that with pagination can produce costly in-memory limiting in Hibernate. I would avoid treating a collection fetch join as a universal one-query fix.”

- **Example:** Fetch 50 IDs ordered by creation time and ID; fetch associated lines using those IDs.
- **Cost:** Usually two data queries, plus a count query if requested; materialization still scales with returned orders and lines.
- **Trade-off/failure:** Two reads can observe intervening changes; define required consistency.
- **Follow-ups:** “Set everything eager?” → May still cause extra queries. “Huge line collections?” → Bound or separately page them.

Reference: [Hibernate 7.0 query guide](https://docs.hibernate.org/orm/7.0/querylanguage/html_single/).

---

**8. A client times out while creating a booking and retries. How do you prevent a second booking?**

**Say aloud:**  
“A timeout means the client did not receive a result; it does not prove the server failed. Idempotency means repeating the same logical operation does not repeat its intended effect.

I would accept a client-generated operation key, scoped to the authenticated customer and operation type. In the same database transaction, I would record that key, create the booking, and save the outcome. A uniqueness constraint - a database rule rejecting duplicate key values - arbitrates concurrent requests.

I would also store a request fingerprint, a stable representation or digest of the meaningful request fields. Reusing a key with different input should fail rather than return an unrelated result. Once the original transaction commits, a retry can return the saved outcome. This design’s guarantee applies to the local transactional work; remote side effects need their own coordination.”

- **Example:** Customer 17 sends key `book-8f2` twice with identical room and dates; both receive booking 901.
- **Guarantee/cost:** One committed local effect per retained scoped key. Storage grows with retained operations; database lookup cost depends on the index.
- **Trade-off and failure:** Expiring keys saves space but limits the retry window. A separate “check then insert” without database uniqueness races.
- **Follow-ups:**  
  “Two requests arrive together?” → Let the database arbitrate; return/retry according to the winning transaction’s outcome.  
  “Response lost after commit?” → Return the stored result.

---

**9. A Kafka consumer updates a database and crashes before committing its offset. What happens, and what would you design?**

**Say aloud:**  
“A Kafka partition is an ordered portion of a topic, and an offset identifies a record’s position within it. A committed consumer offset records where that consumer group should resume.

If the database commit succeeds but the offset commit does not, the record can be processed again. That is the duplicate-processing window associated with at-least-once handling.

For a local database update, I would insert a unique processed-event ID and apply the business change in the same database transaction. A repeated event then produces no second business change. Only after successful database processing would I advance the Kafka offset.

Kafka transactions can coordinate Kafka records and offsets, but do not automatically include an arbitrary external database. I would state the exact system boundary before claiming exactly-once behavior.”

- **Example:** Event `inventory-adjustment-72` is recorded with its stock update; replay encounters the existing event ID.
- **Guarantee:** Duplicate database effects are prevented within the retained-ID scope; handler execution may repeat.
- **Trade-off/failure:** Deduplication costs storage. Committing offsets first risks skipping unfinished work.
- **Follow-ups:** “Parallel processing?” → Advance only past completed earlier records. “Dedup insert fails?” → Roll back appropriately before handling the duplicate.

Reference: [Kafka 4.0 delivery semantics](https://kafka.apache.org/40/design/design/).

---

**10. A service completes 200 requests per second with average response time of 150 ms. How many requests are in progress, and what does that tell you?**

**Say aloud:**  
“Little’s Law relates average work in a system to throughput multiplied by average time in that system. It helps connect observed traffic to concurrency rather than guessing from thread counts.

Here, 200 requests per second multiplied by 0.15 seconds gives 30 requests in the system on average. The measurement boundary matters: if response time includes queue waiting, those 30 include queued requests.

That does not mean 30 worker threads or 30 database connections is the correct configuration. Requests may wait without occupying those particular resources, and averages hide bursts. I would measure how long each scarce resource is actually held, test under representative load, and leave measured headroom. The relationship assumes a stable flow; it is not a promise that an overloaded system’s queue will stop growing.”

- **Example:** If every request holds one database connection for 40 ms, average connection occupancy is approximately `200 × 0.04 = 8`.
- **Guarantee:** An average relationship under consistent boundaries and stable conditions; no worst-case latency guarantee.
- **Trade-off and failure:** Extra capacity costs money; excessive parallelism can slow the database. Underprovisioning causes queuing.
- **Follow-ups:**  
  “Latency doubles at the same throughput?” → Average in-progress work doubles.  
  “Can this size the pool alone?” → No; validate variability and saturation experimentally.

---

**11. A user is logged in and has the `USER` role. Why is `GET /invoices/123` still potentially unsafe?**

**Say aloud:**  
“Authentication establishes who the caller is. Authorization decides what that caller may do. A role can grant access to an invoice endpoint without granting access to every invoice.

I would enforce object-level authorization, meaning a permission decision about the specific requested invoice. In a system serving multiple customer organizations, called tenants, the query should be scoped using the authenticated caller’s permitted tenant and any required ownership rules.

The server must verify that scope; a tenant ID supplied by the client is not proof of membership. For an unauthorized invoice, I would return a policy-consistent response that does not unnecessarily reveal whether it exists. I would test access between users and tenants. Unpredictable invoice IDs can reduce guessing, but they do not replace permission checks.”

- **Example:** Look up invoice 123 within the caller’s verified tenant, then apply any finer permission rule.
- **Guarantee/cost:** Enforces the chosen access policy when applied on every relevant path; query cost depends on indexing.
- **Trade-off/failure:** Central rules improve consistency but must express domain exceptions. Unscoped caches can leak results despite correct queries.
- **Follow-ups:** “Administrator?” → Explicit broader permission. “Update operation?” → Enforce scope in the mutation too.

Reference: [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

---

**12. Count contiguous subarrays whose sum equals `k`. Values may be negative. Explain and implement the solution.**

**Say aloud:**  
“A subarray is a contiguous section of an array. I would use prefix sums: running totals from the beginning. They let me calculate a section’s sum by subtracting the total before it from the total at its end.

If the current total is `s`, I need to know how many earlier totals equal `s minus k`. Each occurrence identifies a different valid starting position, so I store frequencies rather than just remembering whether a total occurred.

I seed total zero with frequency one to represent the position before the array starts. For each value, I update the total, count matching earlier totals, and only then record the current total. That ordering avoids counting an empty subarray when `k` is zero. Unlike a usual shrinking-window approach, this works with negative numbers.”

```java
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

static long countSubarrays(int[] values, int k) {
    Objects.requireNonNull(values, "values");

    Map<Long, Long> frequencies = new HashMap<>();
    frequencies.put(0L, 1L);

    long prefix = 0;
    long count = 0;

    for (int value : values) {
        prefix += value;
        count += frequencies.getOrDefault(prefix - k, 0L);
        frequencies.merge(prefix, 1L, Long::sum);
    }
    return count;
}
```

- **Example:** `[1, -1, 1]`, `k = 1` → **3**: the first element, the last element, and the entire array.
- **Complexity:** Expected O(n) time with well-distributed hashing; O(n) additional space.
- **Guarantee/failure:** Handles negatives, repeated totals, and an empty array. Using `int` for totals or the answer risks overflow; `long` handles the bounds of an `int[]`.
- **Trade-off:** Extra memory buys a single-pass solution; enumerating all start/end pairs costs O(n²) time.
- **Follow-ups:**  
  “Why not a set?” → Repeated totals represent different valid starts.  
  “All zeros, length n?” → `n × (n + 1) / 2` valid subarrays when `k = 0`.  
  “Why not sliding window?” → Negative values destroy the monotonic relationship between expanding the window and increasing its sum.

Framework fragments are illustrative. The runnable Java subset and exact checks for this edition are listed in Appendix B.

---

**Today’s coverage:** Core Java identity and immutability; concurrency visibility and executor overload; JVM retention; Spring transactions; JPA/Hibernate query design; microservice idempotency; Kafka replay; capacity estimation; authorization; prefix-sum coding.

**Tomorrow’s progression:** Move from individual guarantees to interacting operations: multi-field concurrency, cancellation, concurrent database updates, pagination during writes, retry budgets, and event ordering, with more coding practice.

---

**Set 2 · 7 October 2026  -  Coordinating concurrent work and failures**

This is today’s second run: **12 new questions**, checked against the earlier set and cumulative ledger. Baseline: your [Senior Java Interview Master Guide](#part-1), using **Java 21 without preview features**.

Practise the “Say aloud” paragraphs in 45-90 seconds, then tackle the follow-ups. All examples are illustrative.

---

**1. Writing a report throws an exception, and closing its output stream also throws. Which exception should the caller receive?**

**Say aloud:**  
“I would use try-with-resources, Java’s language construct for closing resources automatically. A resource is something such as a file or socket whose lifetime needs explicit management; garbage collection does not provide timely closure.

If the body throws and closing also throws, try-with-resources preserves the body’s exception as the primary failure. The closing failure becomes a suppressed exception - additional diagnostic information attached to the primary exception. This prevents cleanup from hiding the original problem.

Resources close in reverse declaration order. If acquiring a later resource fails, already acquired resources still close. I would also establish ownership: a method should normally close resources it creates and owns, while a borrowed stream may belong to its caller. Automatic cleanup is useful only when the lifetime boundary is correct.”

```java
try (var out = Files.newOutputStream(path)) {
    writeReport(out); // Application-specific operation
}
```

- **Example:** Writing throws `IOException("disk full")`; closing also fails. The write exception escapes, with the close exception available through `getSuppressed()`.
- **Guarantee/cost:** Each successfully initialized, non-null resource gets a closing attempt during normal language-level exit. For r resources, there are r attempts; their duration depends on the resource.
- **Trade-off/failure:** A manual `finally` that throws can replace the original failure. Closing a caller-owned stream can break subsequent work. Process termination can prevent cleanup entirely.
- **Follow-ups:** “Only closing fails?” → That closing exception escapes. “Does closing guarantee durable storage?” → No; closure and durability are separate contracts.

Reference: [Java 21 try-with-resources rules](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20.3).

---

**2. An in-memory seat allocator uses separate atomic counters for available and reserved seats. Can its totals still become inconsistent?**

**Say aloud:**  
“Yes. An atomic counter makes an individual operation indivisible, but it does not combine operations on different counters. Our invariant - the condition that must always remain true - is that available plus reserved equals capacity, with neither count negative.

A reservation contains several steps: check availability, decrease available, and increase reserved. Two callers can both pass the check, or a reader can observe the state between updates.

I would protect validation, both updates, and any combined read using the same lock. A lock allows one participating thread at a time into that protected operation. For a small in-memory allocator, this makes the business rule easy to verify. All access must follow that discipline. The guarantee stops at this Java process; multiple service instances need coordination around shared authoritative state.”

```java
synchronized boolean reserve(int seats) {
    if (seats <= 0) throw new IllegalArgumentException("seats");
    if (seats > available) return false;

    available -= seats;
    reserved += seats;
    return true;
}
```

- **Example:** Available is 1; two callers each request 1. The lock permits one success and one rejection.
- **Guarantee/cost:** O(1) state work per request; lock waiting has no fixed upper bound. Combined snapshots must acquire the same lock.
- **Trade-off/failure:** Serialization limits concurrency. Exposing either field through an unsynchronized reader breaks the observation guarantee.
- **Follow-ups:** “Could one count be derived?” → Yes; storing capacity and reserved removes redundant state. “What about many independent shows?” → Separate locks by show can reduce contention, with careful lifecycle management.

---

**3. A `CompletableFuture` times out after 200 ms, but the remote operation continues for five seconds. Is that a Java bug?**

**Say aloud:**  
“No. A future represents a computation’s eventual result; it is not necessarily the owner of the running computation. `orTimeout` completes the future exceptionally if it has not completed in time. It does not automatically stop the underlying network request.

I would distinguish the response deadline, which limits how long the caller waits, from cancellation, which asks the actual operation to stop. The network client needs appropriate time limits and, where supported, an operation-specific cancellation handle.

Even cancellation cannot prove that a remote side effect did not happen. The server may have completed it before receiving the cancellation. Also, `orTimeout` changes the future it is called on. If several callers share that future, I would apply an individual caller’s timeout to a copy rather than unexpectedly timing out everyone.”

```java
CompletableFuture<Quote> callerView =
        sharedWork.copy().orTimeout(200, TimeUnit.MILLISECONDS);
```

- **Example:** The caller receives a timeout while the original quote request continues. Cancelling it requires coordination with the client performing that request.
- **Guarantee/cost:** Bounds the caller’s intended waiting policy, subject to scheduling delays; it does not guarantee termination or rollback. Algorithmic complexity is not the useful measure here.
- **Trade-off/failure:** Continued work wastes resources; cancelling shared work may harm other callers.
- **Follow-ups:** “Does `cancel(true)` interrupt `CompletableFuture` work?” → Its interrupt flag has no effect on processing. “Should capacity be released on timeout?” → Only when the underlying operation actually releases the resource.

Reference: [Java 21 `CompletableFuture`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html).

---

**4. A request occasionally runs under the previous customer’s tenant context. How could a thread pool cause this?**

**Say aloud:**  
“`ThreadLocal` stores a separate value for each thread. It can make request context available without passing it through every method, but its lifetime follows the thread, not the request.

A thread pool reuses worker threads. If request A stores tenant A and fails before removing it, request B may run on that worker and observe tenant A. This can become an authorization defect, not just incorrect logging. The stored value can also retain objects for longer than intended.

At the outer request boundary, I would set trusted context and remove it in a finally block. For nested temporary context, I would restore the previous value instead. Work submitted to another executor needs deliberate context transfer and cleanup; ordinary thread-local values do not automatically follow the task.”

```java
tenantContext.set(verifiedTenant);
try {
    handleRequest();
} finally {
    tenantContext.remove();
}
```

- **Example:** A worker handles tenant A, then a request with no tenant context. Without cleanup, the second request may inherit A accidentally.
- **Guarantee/cost:** Cleanup removes this thread’s stored association. Retained memory otherwise scales with live worker associations and their reachable objects.
- **Trade-off/failure:** Thread-local access simplifies signatures but hides dependencies. Copying mutable context into asynchronous tasks creates additional sharing risks.
- **Follow-ups:** “Why not inheritance between threads?” → Pool workers may predate the request; thread creation is not task submission. “Simpler alternative?” → Pass an immutable context explicitly.

Reference: [Java 21 `ThreadLocal`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ThreadLocal.html).

---

**5. Two buyers read stock quantity 1 and both attempt a purchase. How does a JPA version field help, and where does it stop helping?**

**Say aloud:**  
“Optimistic locking detects conflicting updates instead of reserving exclusive access when data is read. It exists to prevent one writer silently overwriting another writer’s changes.

With a JPA version field, each buyer reads both quantity and version. A typical update succeeds only if the stored version still matches the version originally read, and then advances it. If both buyers read version seven, one update can win; the other encounters a conflict.

The losing operation must roll back. If retry is appropriate, it needs a fresh transaction, fresh data, and a new availability check. It must not blindly repeat the old decision.

This protects the versioned entity. It does not automatically enforce a business rule spread across independently updated rows, and direct bulk updates need explicit attention to version handling.”

```sql
-- Illustrative version-check mechanism:
UPDATE stock
SET remaining = 0, version = 8
WHERE id = 42 AND version = 7;
```

- **Example:** Buyer A changes version 7 to 8. Buyer B’s version-7 update affects no row; a fresh read reveals no stock.
- **Guarantee/cost:** Detects stale updates to participating versioned entities. Indexed row access is efficient, but contention may cause repeated failed attempts.
- **Trade-off/failure:** Good when conflicts are uncommon; frequent conflicts waste work. Detection may occur when changes are sent to the database or when the transaction commits.
- **Follow-ups:** “Can two different rows violate a shared limit?” → Yes; coordinate around the shared rule. “Does versioning replace quantity validation?” → No.

Reference: [Jakarta Persistence 3.2 locking specification](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html#locking).

---

**6. A Spring Boot service has 20 database connections. Twenty requests each start a transaction, then call an audit service using `REQUIRES_NEW`. Why might everything stall?**

**Say aloud:**  
“Transaction propagation defines how a called operation participates in an existing transaction. `REQUIRES_NEW` starts an independent transaction, suspending the outer one.

With a typical local database transaction manager, the outer transaction keeps its connection while the inner transaction needs another. If all twenty requests already hold the twenty connections, none can acquire a connection for auditing. They wait until a timeout or some other intervention releases resources.

I would first decide whether the audit must commit independently. If it should commit only with the business change, a shared transaction is a better fit. If independent persistence is required, I would bound concurrent outer work and provide capacity for the inner work. I would also inspect database lock dependencies: more connections cannot fix an inner operation waiting on a row locked by its suspended outer transaction.”

- **Example:** Twenty outer connections remain occupied; twenty inner audit calls queue for a connection.
- **Guarantee/cost:** Independent transactions can commit separately. With one inner level, a request can simultaneously hold two connections.
- **Trade-off/failure:** An audit record may survive a business rollback. More pool capacity consumes database resources and does not remove lock conflicts.
- **Follow-ups:** “Would one extra connection help?” → It can permit progress under simple assumptions, but is not a universal sizing rule. “Does the outer rollback undo the audit?” → No.

Reference: [Spring Framework transaction propagation](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html).

---

**7. A descending activity feed duplicates entries between pages when new rows arrive. How would you redesign pagination?**

**Say aloud:**  
“Offset pagination skips a number of rows before returning a page. Inserts near the beginning shift those positions, so the next offset can revisit rows already shown.

I would use keyset pagination: continue after the last ordering key seen, rather than after a row count. A cursor carries that boundary. For descending creation time, I would also include a unique ID so rows with identical timestamps have a deterministic order.

The next query requests rows older than the timestamp boundary, or rows with the same timestamp and a smaller ID. An index matching the filters and ordering helps it seek directly to that boundary.

This improves traversal through changing data, but it does not create a frozen dataset. Updated ordering fields, deletions, and changing filters still require an explicit consistency policy.”

```sql
WHERE tenant_id = :tenant
  AND (
       created_at < :lastTime
       OR (created_at = :lastTime AND id < :lastId)
  )
ORDER BY created_at DESC, id DESC
LIMIT :pageSize;
```

- **Example:** After `(10:00, 105)`, request keys below that pair. A new `(10:01, 120)` does not shift the continuation boundary.
- **Guarantee/cost:** With a suitable index and filters, approximately O(log N + page size) retrieval; verify the query plan. Stable ordering keys prevent position-shift duplicates.
- **Trade-off/failure:** Efficient sequential navigation, but arbitrary “jump to page 500” becomes harder. Mutable ordering keys can still cause skips or repeats.
- **Follow-ups:** “Need an exact export?” → Use a consistent database snapshot or materialized result. “Is an encoded cursor authorization?” → No; independently enforce tenant and filter scope.

---

**8. Three layers each allow three total attempts. How can one request produce 27 calls to the deepest dependency?**

**Say aloud:**  
“Retries multiply when each layer repeats the work of the layers below it. If three layers each allow three total attempts, one original request can produce three cubed, or twenty-seven, attempts at the deepest dependency.

I would assign retry ownership to the layer that understands whether the operation can safely repeat. An end-to-end deadline limits the total time, including waiting and retries. A retry budget limits additional attempts across traffic, so a struggling dependency does not receive unlimited extra load.

Between eligible attempts, backoff increases the delay, while jitter randomizes it so many clients do not retry together. Neither creates capacity; both only shape demand. I would stop when the deadline or budget is exhausted and avoid retrying permanent validation failures or side effects whose outcome cannot safely be repeated.”

- **Example:** A 900 ms budget allows a 250 ms first attempt, 100 ms delay, and another attempt capped by the remaining time, with response overhead reserved.
- **Guarantee/cost:** With a attempts at d independently retrying layers, worst-case downstream attempts can reach aᵈ. One owner with limit a avoids that multiplication for a single call chain.
- **Trade-off/failure:** Retries can recover transient failures but increase load and latency. Random delay alone does not cap retries.
- **Follow-ups:** “What does a 10% budget mean?” → At most one extra attempt per ten original requests over a defined window. “Retry a timeout?” → Only when repeating the operation is safe and time remains.

---

**9. Kafka events for an order use the same key. Event 12 goes to a retry topic, while event 13 succeeds. Why is the order still wrong?**

**Say aloud:**  
“A Kafka partition is an ordered log, but log order is not automatically the order in which business effects complete. Routing related events to one partition helps only if processing preserves that order.

A retry topic is a separate log used to delay failed processing. Moving event twelve there and continuing with thirteen allows thirteen’s effect to happen first. Kafka has not reordered the original partition; the application has changed the processing path.

For strict order, I would prevent later events for that order from taking effect until the failed event is resolved. I could also store the expected business sequence with the order and accept only the next sequence. A gap then triggers bounded waiting or recovery. That choice sacrifices availability for the affected order, so the business must decide whether strict sequencing is necessary.”

- **Example:** `12 = approve order`, `13 = dispatch order`. Applying dispatch first violates the workflow.
- **Guarantee/cost:** Sequential processing preserves effects only within its coordinated scope. Sequence validation can be constant application work plus a database operation; buffering gaps needs bounded storage.
- **Trade-off/failure:** Pausing a whole partition also delays unrelated keys. Per-key coordination permits more concurrency but requires more state and recovery logic.
- **Follow-ups:** “Skip old sequence numbers?” → Only when known to be already applied or safely obsolete. “Increase partition count?” → Key routing may change; plan migration if historical per-key order matters.

Kafka’s log guarantees: [Kafka 4.0 design documentation](https://kafka.apache.org/40/design/design/). The retry scenario illustrates an application-level consequence.

---

**10. A refresh token is stolen. Why does issuing a replacement token on every refresh help, and what race does it introduce?**

**Say aloud:**  
“An access token authorizes API calls. A refresh token obtains replacement access tokens, allowing access tokens to expire quickly without requiring frequent sign-in.

Refresh-token rotation replaces the refresh token after each successful use and invalidates its predecessor. The server retains the relationship between replacements, often called a token family. If an invalidated predecessor appears again, that reuse can reveal theft. The server can revoke the active replacement, forcing fresh authorization.

The transition must be atomic so two simultaneous uses cannot independently create valid successor branches. However, legitimate requests can also race - for example, two browser tabs refreshing together, or a retry after a lost response. I would coordinate refreshes in the client and define recovery explicitly. A broad grace period reduces accidental sign-outs but gives a stolen token more opportunity for reuse.”

- **Example:** `R1 → R2`; later reuse of R1 causes the active family to be revoked.
- **Guarantee/cost:** Rotation detects reuse of an invalidated token; it does not prevent the thief’s first successful use. It requires server-side state and coordinated updates.
- **Trade-off/failure:** Strong replay detection can force legitimate users to sign in again after races.
- **Follow-ups:** “Are existing access tokens immediately invalid?” → Not necessarily; local validation may accept them until expiration. “Can rotation identify which caller is the attacker?” → No.

Reference: [RFC 9700, refresh-token protection](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14).

---

**11. Merge overlapping maintenance intervals without changing the caller’s input. What invariant makes the algorithm correct?**

**Say aloud:**  
“I would first clarify the endpoint convention. For this problem, intervals are closed: both endpoints belong to the interval, so intervals touching at an endpoint overlap.

I would copy the input and sort by start time. Then I maintain one current merged interval. Because starts are sorted, the next interval either overlaps the current interval or begins after it ends. On overlap, I extend the current end to the larger end. Otherwise, I emit the current interval and start another.

The invariant is that everything already emitted is complete and cannot overlap any future interval. Future starts cannot move backward. This explains why comparing with the current interval is sufficient. Sorting dominates the runtime. Copying the list and using immutable interval values avoids changing the caller’s data.”

```java
// Uses java.util.ArrayList, Comparator, List, and Objects.
record Interval(int start, int end) {
    Interval {
        if (start > end) {
            throw new IllegalArgumentException("start > end");
        }
    }
}

static List<Interval> merge(List<Interval> input) {
    Objects.requireNonNull(input, "input");
    var sorted = new ArrayList<>(input);
    sorted.forEach(x -> Objects.requireNonNull(x, "interval"));
    sorted.sort(Comparator.comparingInt(Interval::start));

    var result = new ArrayList<Interval>();
    if (sorted.isEmpty()) return result;

    Interval current = sorted.get(0);
    for (int i = 1; i < sorted.size(); i++) {
        Interval next = sorted.get(i);
        if (next.start() <= current.end()) {
            current = new Interval(
                    current.start(),
                    Math.max(current.end(), next.end()));
        } else {
            result.add(current);
            current = next;
        }
    }
    result.add(current);
    return result;
}
```

- **Example:** `[1,4], [4,7], [2,3], [10,12]` → `[1,7], [10,12]`.
- **Complexity/guarantee:** O(n log n) time; O(n) additional space including copy and output. Handles empty input, nesting, duplicates, and negative endpoints.
- **Trade-off/failure:** Sorting a caller-owned list saves a copy but mutates input. Comparing integers by subtraction can overflow; `comparingInt` avoids that.
- **Follow-ups:** “Half-open intervals `[start,end)`?” → Touching endpoints do not overlap; use `<` if merging only overlaps, and define empty-interval handling. “Input already sorted?” → O(n) scan.

---

**12. Given build tasks and prerequisites, return a valid execution order or report a dependency cycle. How would you implement it?**

**Say aloud:**  
“I would model this as a directed graph: each task is a vertex, and an edge from prerequisite to dependent means the prerequisite must come first. A topological order is an ordering that respects every such edge.

I would use Kahn’s algorithm. For each task, count its unmet prerequisites; that count is called its indegree. Initially, tasks with zero indegree can run. I put them in a queue, remove one, append it to the result, and reduce the counts of its dependents. A dependent enters the queue when its count reaches zero.

If I process every task, the result is valid. Otherwise, some tasks remain blocked by a cycle. I must initialize every task, including isolated tasks, and be explicit about edge direction. Multiple valid orders are possible.”

```java
// Uses java.util.ArrayDeque, ArrayList, List, and Objects.
// Each edge is [prerequisite, dependent]; task IDs are 0..n-1.
static List<Integer> buildOrder(int n, int[][] edges) {
    if (n < 0) throw new IllegalArgumentException("negative n");
    Objects.requireNonNull(edges, "edges");

    List<List<Integer>> dependents = new ArrayList<>(n);
    for (int i = 0; i < n; i++) {
        dependents.add(new ArrayList<>());
    }
    int[] remaining = new int[n];

    for (int[] edge : edges) {
        if (edge == null || edge.length != 2
                || edge[0] < 0 || edge[0] >= n
                || edge[1] < 0 || edge[1] >= n) {
            throw new IllegalArgumentException("invalid edge");
        }
        dependents.get(edge[0]).add(edge[1]);
        remaining[edge[1]]++;
    }

    var ready = new ArrayDeque<Integer>();
    for (int task = 0; task < n; task++) {
        if (remaining[task] == 0) ready.addLast(task);
    }

    var order = new ArrayList<Integer>(n);
    while (!ready.isEmpty()) {
        int task = ready.removeFirst();
        order.add(task);
        for (int next : dependents.get(task)) {
            if (--remaining[next] == 0) ready.addLast(next);
        }
    }

    if (order.size() != n) {
        throw new IllegalArgumentException("dependency cycle");
    }
    return order;
}
```

- **Example:** Tasks 0-3, edges `0→2`, `1→2`, `2→3` → valid order `[0,1,2,3]`. Adding `3→1` creates a cycle.
- **Complexity/guarantee:** O(V + E) time and space, where V is tasks and E is dependency entries. Duplicate edges are counted and removed consistently.
- **Trade-off/failure:** Detects a cycle but does not identify its exact path. Reversing the edge direction produces the wrong build semantics.
- **Follow-ups:** “Always choose the smallest ready task?” → Use a minimum-priority queue, costing O(E + V log V). “Execute tasks concurrently?” → Release dependents only after prerequisites successfully finish, not when they are merely scheduled.

The runnable Java subset was checked as described in Appendix B; framework integration remains untested.

---

**Today’s coverage:** Resource ownership and exception preservation; multi-field concurrency; cancellation; thread-local lifecycle; JPA optimistic locking; Spring transaction resource use; pagination under writes; retry amplification; Kafka processing order; refresh-token security; interval merging; dependency ordering.


The cumulative ledger now tracks **24 distinct questions across two sets**.

---

**Set 3 · 7 October 2026 · 12 new questions**

Checked against the previous **24 questions**. Baseline: your [Senior Java Interview Master Guide](#part-1), using **Java 21 without preview features**, with explicit version differences below.

Practise each **Say aloud** answer in 45-90 seconds, then attempt its follow-ups. All scenarios are illustrative.

---

**1. You switch to virtual threads, but 10,000 requests still overwhelm a database with 40 connections. Why?**

**Say aloud:**  
“A virtual thread is a lightweight Java thread scheduled by the JVM onto an operating-system thread. It makes waiting for supported blocking operations cheaper, which helps applications handle many concurrent requests.

It does not create database capacity. With forty connections, thousands of requests can still wait while retaining request data and consuming memory.

I would limit database concurrency and bound how much work the service admits. A semaphore - a counter of available permits - can limit entry to a scarce operation, but unlimited callers waiting for permits still create a backlog.

I would also inspect the Java version. Pinning means a virtual thread cannot release its carrier, the operating-system thread executing it. Java 21 can pin during blocking work inside synchronized code. Java 25 has removed that particular limitation, although other pinning situations remain.”

- **Example:** Permit at most 30 concurrent reporting queries, preserving capacity for other work; reject or time-limit excess demand.
- **Guarantee/cost:** At most 30 participating operations hold permits. Waiting requests still consume memory; release permits in `finally`.
- **Trade-off/failure:** Lower concurrency protects the database but may reject traffic. Virtual threads do not accelerate CPU-intensive computation.
- **Follow-ups:** “Pool virtual threads?” → Generally create one per task; limit the scarce resource. “Replace every `synchronized`?” → No; inspect runtime version and measured blocking.

References: [Java 21 virtual threads](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html), [Java 25 virtual threads](https://docs.oracle.com/en/java/javase/25/core/virtual-threads.html).

---

**2. Splitting 10.00 into three independently rounded shares produces 9.99. How should Java code preserve the total?**

**Say aloud:**  
“`BigDecimal` represents decimal values with configurable precision and rounding. I would construct amounts from decimal text, because constructing from a double can preserve an earlier binary approximation.

Rounding means choosing a representable amount when the exact result needs more digits. It needs a business rule: how many decimal places are allowed, when rounding occurs, and who receives any remainder.

For ten units divided three ways, independently rounding every share to 3.33 loses one cent. I would calculate the base shares, calculate the remainder against the original total, and distribute it deterministically.

For this two-decimal example, the result could be 3.34, 3.33, and 3.33. The invariant is that allocated amounts sum exactly to the original. Currency and allocation rules belong in the contract; two decimal places are not universal.”

```java
BigDecimal total = new BigDecimal("10.00");
BigDecimal base = total.divide(
        BigDecimal.valueOf(3), 2, RoundingMode.DOWN);
BigDecimal remainder =
        total.subtract(base.multiply(BigDecimal.valueOf(3)));
// base = 3.33; remainder = 0.01
```

- **Guarantee/cost:** O(n) allocation steps for n recipients; arithmetic cost also depends on digit count.
- **Trade-off/failure:** Deterministic remainder allocation preserves totals but needs a fairness rule. Negative amounts need separately defined rounding behavior.
- **Follow-ups:** “Exact division by three?” → Can throw without rounding. “Round each intermediate result?” → Only if required; repeated rounding changes totals.

Reference: [Java 21 `BigDecimal`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html).

---

**3. After `entityManager.merge(detachedOrder)`, you modify `detachedOrder`. Why might the update disappear?**

**Say aloud:**  
“A persistence context is the set of entity objects a JPA entity manager currently tracks. A managed entity belongs to that context; a detached entity represents persisted data but is no longer tracked there.

Merge copies state into a managed instance and returns that instance. It does not generally turn the detached argument into the managed object.

If I modify the original afterward, those later changes are not automatically tracked. I should use the returned object within the transaction.

For API updates, I often prefer loading the managed entity and applying an explicit command containing only allowed changes. Merging a partially populated object is dangerous because ordinary null fields may represent actual replacement state, rather than ‘the caller did not provide this field.’ That distinction belongs in the update contract.”

```java
Order managed = entityManager.merge(detachedOrder);
managed.setDeliveryNote("Leave at reception");
// Run within an appropriate transaction.
```

- **Guarantee/cost:** Dirty checking - detecting managed-object changes - can persist updates at flush or commit. Database work depends on mappings and loaded state.
- **Trade-off/failure:** Merge supports detached workflows but can copy unintended state across a large object graph.
- **Follow-ups:** “Does merge commit?” → No. “What about unfetched lazy fields?” → JPA requires ignoring those during merge; they differ from explicitly populated nulls.

Reference: [Jakarta Persistence 3.2 merge semantics](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2#merging-detached-entity-state).

---

**4. A Spring Boot service starts successfully with a negative timeout and an impossible retry configuration. Where should validation happen?**

**Say aloud:**  
“I would validate configuration during startup, before accepting requests. External configuration is deployment-supplied input, so parsing it successfully does not prove it is meaningful.

Configuration binding converts properties into a typed object. In Spring Boot, I would register a configuration-properties class and enable validation using `@Validated`, with a compatible validation implementation available.

Individual constraints handle required values and simple bounds. Cross-field validation checks relationships - for example, whether the intended attempt durations and waiting periods fit within the operation’s total budget.

I would distinguish missing values from deliberate defaults. A required timeout should not silently become zero. I would also report the invalid property clearly without exposing credentials. Failing startup makes a bad deployment visible instead of allowing intermittent request failures.”

- **Example:** `attemptTimeout=800 ms`, `attempts=3`, `totalBudget=1 s` conflicts with a policy promising three full attempts.
- **Guarantee/cost:** Checks configuration at initialization; it does not prove a remote dependency is available. Cost scales with validated properties.
- **Trade-off/failure:** Strict validation prevents unsafe operation but can block rollout. Refreshed configuration needs validation again.
- **Follow-ups:** “Nested settings?” → Apply cascading validation with `@Valid`. “Validate a duration?” → Check required presence and positive/range semantics explicitly.

Reference: [Spring Boot configuration validation](https://docs.spring.io/spring-boot/reference/features/external-config.html#features.external-config.typesafe-configuration-properties.validation).

---

**5. You invalidate a cache after every database update. How can an old value still reappear?**

**Say aloud:**  
“In cache-aside, the application checks the cache first, reads the database on a miss, and stores the result. It reduces database reads, but reading and filling the cache are separate operations.

A reader can fetch the old database value, pause, and then resume after a writer commits a new value and invalidates the cache. That reader now installs the old value after invalidation.

Expiration limits how long that installed value remains, but does not remove the race. For stronger protection, I could maintain a generation number, meaning a version of the cache’s validity. A reader records the generation before loading and installs its result only if that generation is still current.

The comparison and installation must be atomic. The writer must advance the generation reliably, and the generation must survive deletion of the cached value.”

- **Example:** Reader loads price 80 → writer commits 90 and invalidates → reader caches 80.
- **Guarantee/cost:** Generation checks reject fills crossing a completed generation change. They do not make database commit and invalidation atomic.
- **Trade-off/failure:** Expiration is simpler but permits stale reads. Stronger coordination adds metadata, operations, and recovery requirements.
- **Follow-ups:** “Delete twice?” → Reduces some races but is not a proof. “Strict current price required?” → Validate against authoritative data at purchase time.

---

**6. An order commits to the database, but publishing its Kafka event fails. How do you avoid losing the event?**

**Say aloud:**  
“I would use a transactional outbox: a database table containing events that must be published. It exists to close the failure gap between changing database state and notifying another system.

The order and its outbox event are inserted in the same database transaction. Either both commit or neither does. A separate relay reads committed events and publishes them to Kafka.

The relay must tolerate retries. If publication succeeds and the relay crashes before recording completion, it may publish the same event again. Each event therefore needs a stable identifier, and consumers must handle duplicates.

This guarantees a durable publication obligation alongside the order, not instantaneous delivery. I would monitor the oldest unpublished event and backlog size, and define recovery for events that repeatedly fail.”

```text
Database transaction: insert order + insert outbox event → commit
Relay: read committed event → publish → record completion
```

- **Guarantee/cost:** One additional durable record per event. Eventual publication requires a recovering relay, available infrastructure, and retained events.
- **Trade-off/failure:** Adds storage and operational work; duplicate delivery remains possible.
- **Follow-ups:** “Publish first?” → Could publish an order that later rolls back. “Relay options?” → Poll the table or use change-data capture, which reads committed database changes.

Reference: [Debezium outbox documentation](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html).

---

**7. A Kafka event changes `amount_cents` into `amount_micros` while keeping the same Protobuf field number. Why is that dangerous?**

**Say aloud:**  
“A schema defines a message’s fields and meaning. Protocol Buffers encode fields using numeric identifiers, so keeping the same field number and integer type can allow old software to parse new bytes successfully.

That is binary compatibility, but it is not semantic compatibility: the receiver may interpret the number using the wrong unit. A consumer expecting cents could calculate an amount ten thousand times too large.

I would introduce a new field number, retain the old meaning, and deploy consumers that understand both representations before changing producers. During transition, precedence and consistency rules must be explicit.

I would also test historical events, because Kafka consumers may replay data written before the deployment. Once a field is removed, its number should be reserved so it cannot later acquire a different meaning.”

```proto
int64 amount_cents = 1;          // Existing meaning retained
optional int64 amount_micros = 2; // New representation
```

- **Guarantee/cost:** Additive binary evolution helps mixed versions parse messages; business compatibility still requires agreement.
- **Trade-off/failure:** Dual representations increase payload and validation complexity. Conflicting values need a defined response.
- **Follow-ups:** “Absent versus zero?” → Explicit presence distinguishes them. “Convert through JSON?” → Unknown-field preservation differs; test that path separately.

Reference: [Official Protobuf evolution guidance](https://protobuf.dev/programming-guides/proto3/#updating).

---

**8. How would you rotate an outbound API credential across 100 service instances without an outage?**

**Say aloud:**  
“Credential rotation replaces a secret used to authenticate a service. It limits the lifetime of exposed credentials, but distributed instances do not all change at exactly the same moment.

For routine rotation, I would create a second credential while the provider still accepts the first. I would distribute the new secret through controlled secret storage, update clients, and verify that every instance is using the new version.

Some clients capture credentials when constructed, so updating a file or environment source may not update existing clients. Those clients need safe replacement, with old work allowed to finish where appropriate.

After confirming adoption and accounting for in-flight requests, I would revoke the old credential. I would track credential version identifiers, never secret values. A confirmed compromise may require immediate revocation even if that causes temporary failures.”

- **Example:** Provider accepts K1 and K2 → instances adopt K2 → old requests drain → revoke K1.
- **Guarantee/cost:** Overlap supports a gradual transition only if the provider permits concurrent credentials. Work scales with clients and instances.
- **Trade-off/failure:** Longer overlap improves availability but extends exposure. A forgotten instance fails after revocation.
- **Follow-ups:** “Provider allows one key?” → Coordinate cutover or use a supported intermediary. “Rollback after compromise?” → Do not restore the compromised secret.

Reference: [OWASP secrets lifecycle guidance](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html).

---

**9. Transfers from account A to B and B to A occasionally freeze. CPU usage is low. How do you investigate and prevent this?**

**Say aloud:**  
“A deadlock occurs when operations form a waiting cycle with no path to progress. Here, one transfer may hold A’s lock while waiting for B, while another holds B’s lock while waiting for A.

I would inspect thread stacks and lock ownership to confirm the cycle. Low CPU supports a waiting hypothesis, but is not enough to establish deadlock.

To prevent this two-lock cycle, every transfer should acquire account locks in the same global order, such as ascending immutable account ID. The ordering must be total: distinct accounts cannot tie without another ordering rule. Lock objects must also be shared consistently.

For Java 21, traditional management APIs detect certain platform-thread deadlocks but do not cover virtual threads. A negative detector result therefore cannot rule out every application waiting cycle.”

```text
A → B: lock smaller ID → lock larger ID → transfer
B → A: lock smaller ID → lock larger ID → transfer
```

- **Guarantee/cost:** Consistent ordering prevents cycles among locks following that order. Waiting time remains unbounded.
- **Trade-off/failure:** Ordering simplifies reasoning but requires discipline across all paths. Other locks can reintroduce cycles.
- **Follow-ups:** “Same account?” → Treat as a defined no-op or validation error. “Does locking make transfer rollback automatic?” → No; validate before mutation and define failure handling.

Reference: [Java 21 thread-management coverage](https://docs.oracle.com/en/java/javase/21/docs/api/java.management/java/lang/management/ThreadMXBean.html).

---

**10. An endpoint waits for 20 downstream calls. Each finishes within 200 ms 99% of the time. Will the endpoint meet that threshold 99% of the time?**

**Say aloud:**  
“No. Fan-out means one request launches several downstream operations. When every result is required, completion depends on the slowest operation, so slow-tail behavior becomes more visible.

Assuming the calls are independent and start together, the probability that all twenty finish within two hundred milliseconds is 0.99 raised to the twentieth power, about 81.8 percent. Roughly 18.2 percent of requests would wait longer, even before local overhead.

Independence is only a simplifying assumption. Shared infrastructure creates correlated delays, so I would measure the combined endpoint directly.

I would question whether all twenty results are necessary, combine calls where possible, and define which results may be omitted or served from older data. A deadline bounds waiting policy, but returning partial data requires an explicit product contract.”

- **Example:** A dashboard can omit optional recommendations; a financial total may require every component.
- **Guarantee/cost:** Twenty calls create twenty units of downstream work. Parallelism reduces elapsed time relative to serial execution, not total work.
- **Trade-off/failure:** Partial responses improve availability but may mislead users unless clearly represented.
- **Follow-ups:** “Perfectly correlated calls?” → The independence calculation no longer applies. “Duplicate slow calls?” → May reduce latency but increases load and requires safe repeatability.

---

**11. Find the longest contiguous sequence containing at most `k` distinct integers. Explain why your solution is linear.**

**Say aloud:**  
“I would use a sliding window: a contiguous range whose left and right boundaries move through the array. A frequency map records how many times each value occurs inside that range.

For each new right-hand element, I increment its frequency. If the number of distinct values exceeds k, I advance the left boundary, decrementing frequencies and removing values whose frequency reaches zero.

Once the window is valid, I update the best length. Shrinking cannot introduce a new distinct value, so moving left eventually restores the constraint.

Although the code contains a loop inside a loop, each element enters once and leaves at most once. The total number of boundary movements is linear. With expected constant-time map operations, total runtime is expected O(n). I would define zero, negative k, and empty-input behavior explicitly.”

```java
// Imports: java.util.HashMap, java.util.Objects
static int longestAtMostKDistinct(int[] values, int k) {
    Objects.requireNonNull(values, "values");
    if (k < 0) throw new IllegalArgumentException("negative k");
    if (k == 0) return 0;

    var counts = new HashMap<Integer, Integer>();
    int left = 0;
    int best = 0;

    for (int right = 0; right < values.length; right++) {
        counts.merge(values[right], 1, Integer::sum);

        while (counts.size() > k) {
            int removed = values[left++];
            int remaining = counts.get(removed) - 1;
            if (remaining == 0) counts.remove(removed);
            else counts.put(removed, remaining);
        }

        best = Math.max(best, right - left + 1);
    }
    return best;
}
```

- **Example:** `[4, 4, 7, 9, 7, 7]`, `k=2` → **4**, from `[7, 9, 7, 7]`.
- **Complexity/guarantee:** Expected O(n) time; O(min(n, k+1)) map entries, including temporary expansion.
- **Trade-off/failure:** Frequencies require extra memory. A set alone cannot tell whether removing one occurrence eliminates a value.
- **Follow-ups:** “Exactly k distinct?” → Update the answer only when the valid window contains k. “Return the range?” → Save its boundaries when improving the best length.

---

**12. You receive integer readings continuously. How can you maintain the kth-largest reading without storing everything?**

**Say aloud:**  
“I would maintain a minimum heap containing at most k readings. A heap is a data structure that keeps its smallest element readily accessible while supporting efficient insertion and removal.

The invariant is that it contains the largest k readings seen so far, counting duplicates. Until it reaches size k, I insert everything. After that, a new reading replaces the smallest retained reading only if it is larger.

The heap’s smallest value is then the kth-largest overall: exactly k retained readings are at least that large, and discarded readings cannot improve the retained group.

This uses memory proportional to k rather than the stream length. Before k readings arrive, the answer is unavailable. I would also clarify whether duplicates count, because kth-largest distinct value is a different requirement.”

```java
// Imports: java.util.Objects, java.util.PriorityQueue
// Batch wrapper around the same streaming update rule.
static int kthLargest(int[] values, int k) {
    Objects.requireNonNull(values, "values");
    if (k < 1 || k > values.length) {
        throw new IllegalArgumentException("invalid rank");
    }

    var largest = new PriorityQueue<Integer>();

    for (int value : values) {
        if (largest.size() < k) {
            largest.offer(value);
        } else if (value > largest.peek()) {
            largest.poll();
            largest.offer(value);
        }
    }
    return largest.peek();
}
```

- **Example:** `[8, 3, 8, 2, 10]`, `k=3` → **8**; duplicates occupy separate ranks.
- **Complexity/guarantee:** O(n log(k+1)) total time, O(k) space, O(1) answer lookup after enough readings.
- **Trade-off/failure:** Excellent for insertion-only streams. If old readings expire, discarded values may become relevant again.
- **Follow-ups:** “Need all readings sorted?” → This heap does not retain enough information. “Increase k later?” → Cannot recover discarded readings without another data source.

Java operation costs: [Java 21 `PriorityQueue`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/PriorityQueue.html).

---

**Today’s coverage:** Virtual-thread capacity; decimal allocation; JPA managed versus detached state; Spring configuration validation; stale cache fills; transactional outbox; Kafka message evolution; credential rotation; deadlock diagnosis; fan-out latency; sliding windows; heap-based selection.


The three practice sets contain **36 scenario questions**. See the validation notes for the checks actually executed for this edition.


<a id="part-18-sde-3-interview-simulation-lab"></a>
<a id="part-18"></a>
## Part 18 - SDE-3 Interview Simulation Lab

 This section converts the guide from a reference book into an interviewer-led drill. The simulations are derived from topics and question areas already covered in this guide. They are intentionally structured as interviewer escalation, not as memorization cards. How to run a simulation For each scenario: 1 Answer Stage 1 aloud in 60-90 seconds. 2 Continue only when the answer is internally consistent. 3 Treat each Stage 2-5 question as a real interviewer interruption. 4 Give a concrete decision, not a list of technologies. 5 If you do not have production evidence, say so and explain how you would verify the decision. 6 Score yourself after the simulation using the rubric below. Simulation scoring 1  -  Mechanism Technical correctness Explain the mechanism clearly 2  -  Why Design reasoning Explain why the design exists and alternatives 3  -  Failure Failure-mode thinking Explain what breaks and how it appears 4  -  Trade-off Senior judgment State what you gain, what you sacrifice, and when you would change the choice 5  -  Production Operational maturity Name evidence, metrics/logs/traces/tests, rollback or recovery where relevant Target: 4/5 or better consistently. A 5/5 answer is not the longest answer; it is the answer that makes a defensible engineering decision and explains how you would prove it. 

#### Simulation 1  -  HashMap internals and the red-black tree follow-up

 Source areas: HashMap internals, red-black tree deep dive, hashCode()/equals(), collision behavior, treeification. Interviewer: “Explain how HashMap works internally.” 

**Stage 1  -  Mechanism:** Explain hash spreading, bucket/bin selection, linked-list bins, tree bins, lookup, and resize at the level appropriate to the JDK version being discussed. 

**Stage 2  -  Why:** 1 Why is capacity kept as a power of two? 1 Why is the load factor around 0.75 in the common implementation? 1 Why does a collision-heavy bin eventually use a red-black tree rather than an AVL tree? 

**Stage 3  -  Failure:** 1 Two different keys have the same hash. What happens? 1 What if hashCode() is poor but equals() is correct? 1 Why can a treeified bin still have lookup behavior that is not simply “always O(log n)”? 

**Stage 4  -  Trade-off:** 1 What do you gain from treeification and what complexity does it add? 1 Why not treeify every bucket immediately? 

**Stage 5  -  Production:** 1 If a service suddenly shows CPU growth and slower map-heavy code, what evidence would distinguish ordinary load from pathological hashing or oversized maps? 1 What would you inspect before changing the code? 

**SDE-3 target:** Do not stop at “HashMap is O(1).” Explain average behavior, collision handling, resize cost, equality semantics, and implementation/version boundaries. Red flag: Claiming that the whole HashMap becomes a tree, or that every lookup in a treeified bin is guaranteed O(log n) regardless of key comparison behavior. 

#### Simulation 2  -  Thread pools, queues and back-pressure

 Source areas: thread pool, queue and back-pressure; concurrency/JVM sections. Interviewer: “A Spring service is receiving more work than downstream systems can process. How would you design the executor?” 

**Stage 1  -  Mechanism:** Explain worker threads, queueing, task submission, execution, and rejection. 

**Stage 2  -  Why:** 1 Why not simply create more threads? 1 Why does queue size matter? 1 How does the workload type change your sizing decision? 

**Stage 3  -  Failure:** 1 What happens when downstream latency increases while request rate stays constant? 1 How can an unbounded queue hide an overload problem? 1 What happens when the executor saturates? 

**Stage 4  -  Trade-off:** 1 Bounded queue vs unbounded queue? 1 Caller-runs/rejection vs dropping work? 1 More concurrency vs protecting the dependency? 

**Stage 5  -  Production:** 1 Which metrics would you watch: active threads, queue depth, task wait time, execution time, rejection count, dependency latency, request latency? 1 What evidence would tell you the bottleneck is downstream rather than the executor itself? 

**SDE-3 target:** Treat the executor as part of the service's capacity-control system, not merely a place to configure poolSize. 

#### Simulation 3  -  ConcurrentHashMap and shared mutable state

 Source areas: ConcurrentHashMap and concurrency questions. Interviewer: “Is putting an ArrayList inside a ConcurrentHashMap enough to make the data thread-safe?” 

**Stage 1  -  Mechanism:** Separate thread safety of the map from thread safety of the object stored as its value. 

**Stage 2  -  Why:** Explain why concurrent access to the container does not automatically serialize mutations inside a mutable value. 

**Stage 3  -  Failure:** Give a concrete race involving read-modify-write on the contained list. 

**Stage 4  -  Trade-off:** Compare synchronized access, concurrent collections, immutable replacement, and redesigning the state ownership. 

**Stage 5  -  Production:** Explain how you would reproduce or detect the race with concurrency tests, invariants, logging/metrics, or a focused stress test. 

**SDE-3 target:** Identify the actual shared mutable state and synchronization boundary rather than naming a “thread-safe collection” and stopping. 

#### Simulation 4  -  Spring @Transactional and ordering traps

 Source areas: Spring Retry/Resilience, transactions, Spring internals. Interviewer: “You have a transactional service method that calls a retryable operation. What can go wrong?” 

**Stage 1  -  Mechanism:** Explain that Spring behavior such as transactions/retry is commonly applied through proxies/interceptors and that ordering affects the effective behavior. 

**Stage 2  -  Why:** Why does the transaction boundary matter when retries occur? 

**Stage 3  -  Failure:** 1 What if the operation partially changes state before failing? 1 What if the retry happens inside one transaction versus across transaction boundaries? 1 What if the call bypasses the proxy? 

**Stage 4  -  Trade-off:** Compare retrying the whole transaction with isolating the retryable operation. Discuss idempotency and side effects. 

**Stage 5  -  Production:** What logs/traces/transaction metrics would prove how many attempts occurred and which transaction boundaries were actually used? 

**SDE-3 target:** Talk about proxy boundaries, transaction scope, idempotency, and failure semantics - not just annotations. 

#### Simulation 5  -  Spring Boot startup and dependency wiring

 Source areas: SpringApplication.run, dependency injection, repository implementation, startup performance. Interviewer: “The service startup time doubled after a release. How do you investigate?” 

**Stage 1  -  Mechanism:** Describe the broad startup phases: environment/configuration, application context creation, bean discovery/creation, auto-configuration and embedded server startup. 

**Stage 2  -  Why:** Why can adding a dependency or auto-configuration materially affect startup? 

**Stage 3  -  Failure:** Distinguish slow classpath scanning, bean initialization, external calls during startup, database initialization, and configuration problems. 

**Stage 4  -  Trade-off:** Lazy initialization can improve startup but move work to first request. Explain when that is useful and what it risks. 

**Stage 5  -  Production:** Explain how you would use startup timing, application metrics/logs, profiling or framework-supported diagnostics to identify the slow phase before changing configuration. 

**SDE-3 target:** Diagnose the startup phase before applying blanket lazy initialization or removing auto-configuration. 

#### Simulation 6  -  Hibernate N+1 and fetch strategy

 Source areas: Hibernate/JPA, N+1, fetching, SQL visibility. Interviewer: “An endpoint returns 100 orders and suddenly executes hundreds of SQL statements. Explain.” 

**Stage 1  -  Mechanism:** Explain how loading a parent collection and then lazily accessing associated entities can produce repeated SQL. 

**Stage 2  -  Why:** Why does lazy loading exist, and why can it be useful despite the N+1 risk? 

**Stage 3  -  Failure:** Explain how the problem appears in production: query count, DB latency, connection pressure, endpoint latency. 

**Stage 4  -  Trade-off:** Compare fetch join, entity graphs, batch fetching, DTO projections, and changing the default fetch strategy. Explain why “make everything eager” is not a universal fix. 

**Stage 5  -  Production:** How would you prove the fix? Query count, SQL logs/profiling, DB metrics, endpoint latency, and representative data volume. 

**SDE-3 target:** Optimize the access pattern rather than changing every association to eager loading. 

#### Simulation 7  -  @Transactional(readOnly = true)

 Source areas: Q228 and transaction-related Hibernate/JPA material. Interviewer: “What does @Transactional(readOnly = true) really do?” 

**Stage 1  -  Mechanism:** Explain that it communicates a read-only transaction intent to the transaction/data-access stack; exact behavior depends on the framework, transaction manager, database and ORM configuration. 

**Stage 2  -  Why:** Why can the hint help, and why is it not a magic “make this query faster” switch? 

**Stage 3  -  Failure:** What assumptions become dangerous if a developer believes it prevents all writes under every configuration? 

**Stage 4  -  Trade-off:** Discuss consistency, transaction scope, flush behavior, connection usage, and the difference between application intent and database-enforced read-only semantics. 

**Stage 5  -  Production:** How would you verify the actual behavior in your deployed stack rather than relying on a generic claim? 

**SDE-3 target:** State the version/configuration boundary explicitly and verify actual SQL/transaction behavior. 

#### Simulation 8  -  Hibernate flush surprises

 Source areas: Q245 and Hibernate flush behavior. Interviewer: “Why did an apparently read-only query cause an INSERT/UPDATE to be flushed first?” 

**Stage 1  -  Mechanism:** Explain the relationship between the persistence context, pending changes and flush timing. 

**Stage 2  -  Why:** Why does an ORM sometimes flush before query execution? 

**Stage 3  -  Failure:** How can unexpected flushes affect latency, constraint errors, locks, or transaction behavior? 

**Stage 4  -  Trade-off:** Discuss explicit flush boundaries versus allowing ORM-managed flush behavior. 

**Stage 5  -  Production:** Prove the sequence with SQL logging/profiling and transaction traces; do not infer it solely from Java source order. 

**SDE-3 target:** Think in terms of persistence-context state and actual SQL order. 

#### Simulation 9  -  Kafka consumer lag and scaling

 Source areas: Kafka terminology, Kafka internals, messaging and distributed systems. Interviewer: “Consumer lag keeps increasing. Add more consumers?” 

**Stage 1  -  Mechanism:** Explain partitions, consumer groups and the relationship between partition parallelism and consumers. 

**Stage 2  -  Why:** Why can adding consumers stop helping once partition parallelism is exhausted? 

**Stage 3  -  Failure:** Distinguish slow processing, downstream latency, insufficient partitions, rebalances, errors/retries and producer-side bursts. 

**Stage 4  -  Trade-off:** More partitions can increase parallelism but affect ordering/operational characteristics. Explain the decision rather than treating partition count as free. 

**Stage 5  -  Production:** Which evidence would you inspect: lag by partition, processing latency, consumer assignment/rebalance behavior, downstream latency, error rate and throughput? 

**SDE-3 target:** Diagnose why lag exists before scaling consumers blindly. 

#### Simulation 10  -  Kafka delivery semantics and idempotency

 Source areas: Kafka/messaging, idempotent consumers. Interviewer: “How do you make an event consumer safe when the same event can be delivered more than once?” 

**Stage 1  -  Mechanism:** Explain idempotent processing and the difference between delivery semantics and business-effect semantics. 

**Stage 2  -  Why:** Why is consumer-side idempotency often necessary even when the messaging system offers stronger delivery features? 

**Stage 3  -  Failure:** Describe a crash between applying the business change and recording the processing result. 

**Stage 4  -  Trade-off:** Compare idempotency keys, unique constraints, transactional state changes and deduplication stores. 

**Stage 5  -  Production:** Explain how you would verify duplicate delivery behavior and recovery after consumer crashes. 

**SDE-3 target:** Design around the business side effect, not only the broker's delivery guarantee. 

#### Simulation 11  -  Circuit breaker and retry interaction

 Source areas: circuit breaker, retry, resilience and microservices. Interviewer: “A downstream service is failing. We already have retries and a circuit breaker. Why is the system still melting down?” 

**Stage 1  -  Mechanism:** Explain retries, failure counting, open/closed/half-open behavior at a conceptual level. 

**Stage 2  -  Why:** Why can retries amplify load during a dependency failure? 

**Stage 3  -  Failure:** Explain retry storms, increased latency, thread/connection exhaustion and cascading failure. 

**Stage 4  -  Trade-off:** Discuss retry count, backoff, jitter, timeout, circuit-breaker threshold, fallback and which failures should not be retried. 

**Stage 5  -  Production:** Identify the evidence needed: dependency latency/error rate, retry count, circuit state, request concurrency, queue depth and saturation signals. 

**SDE-3 target:** Treat timeout + retry + circuit breaker + concurrency as one control system. 

#### Simulation 12  -  API idempotency

 Source areas: REST/API design, microservices and idempotent operations. Interviewer: “A client times out after creating an order. It retries. How do you prevent duplicate orders?” 

**Stage 1  -  Mechanism:** Explain an idempotency key and durable association between the key and the resulting operation. 

**Stage 2  -  Why:** Why does a client timeout create ambiguity even when the server may have completed the operation? 

**Stage 3  -  Failure:** Consider concurrent duplicate requests, partial failure and key reuse. 

**Stage 4  -  Trade-off:** Discuss key retention, storage, conflict handling, response replay and scope of uniqueness. 

**Stage 5  -  Production:** Explain how you would measure duplicate attempts, idempotency conflicts and recovery behavior. 

**SDE-3 target:** Recognize the fundamental “unknown outcome after timeout” problem. 

#### Simulation 13  -  Database indexing and query diagnosis

 Source areas: SQL, PostgreSQL indexes, query performance. Interviewer: “This query is slow. Add an index.” 

**Stage 1  -  Mechanism:** Explain what an index changes and why it can reduce data access for suitable predicates. 

**Stage 2  -  Why:** Why is an index not automatically beneficial for every column or query? 

**Stage 3  -  Failure:** Discuss write overhead, storage, poor selectivity and a query plan that still chooses a scan. 

**Stage 4  -  Trade-off:** Explain composite-index column order and matching the access pattern rather than creating indexes indiscriminately. 

**Stage 5  -  Production:** Use the execution plan plus representative production-like data and query latency to validate the change. 

**SDE-3 target:** Start with the query and execution plan, not the index definition. 

#### Simulation 14  -  SQL NULL semantics

 Source areas: Q271 and SQL material. Interviewer: “Why did WHERE column != 'X' fail to return rows where column is NULL?” 

**Stage 1  -  Mechanism:** Explain SQL three-valued logic and that NULL represents an unknown/missing value rather than an ordinary comparable value. 

**Stage 2  -  Why:** Why do ordinary equality/inequality predicates not behave like Java null comparisons? 

**Stage 3  -  Failure:** Identify filters, joins, aggregates and uniqueness assumptions that can be affected. 

**Stage 4  -  Trade-off:** Explain explicit IS NULL/IS NOT NULL logic and the business meaning of missing data. 

**Stage 5  -  Production:** Validate with targeted test cases containing NULL and non-NULL values before shipping the query change. 

**SDE-3 target:** Connect SQL semantics to the business meaning of missing data. 

#### Simulation 15  -  JVM allocation and escape analysis

 Source areas: JVM performance and allocation questions. Interviewer: “Object allocation is cheap on the JVM. Then why is this service generating GC pressure?” 

**Stage 1  -  Mechanism:** Explain allocation paths at a high level and the role of garbage collection. 

**Stage 2  -  Why:** Why can short-lived allocations still matter at very high allocation rates? 

**Stage 3  -  Failure:** Explain allocation rate, object lifetime, retained objects and GC overhead as different possible causes. 

**Stage 4  -  Trade-off:** Discuss whether reducing allocations is worth code complexity; avoid optimizing without evidence. 

**Stage 5  -  Production:** Use allocation profiling, GC logs/metrics, heap information and latency evidence to identify the dominant source. 

**SDE-3 target:** Do not equate “allocation is cheap” with “allocation is free.” 

#### Simulation 16  -  Kubernetes probes and graceful shutdown

 Source areas: Kubernetes deployment, probes and graceful shutdown. Interviewer: “Pods are healthy, but deployments occasionally drop requests. Where do you look?” 

**Stage 1  -  Mechanism:** Explain readiness, liveness and shutdown behavior separately. 

**Stage 2  -  Why:** Why should readiness and liveness represent different questions? 

**Stage 3  -  Failure:** Consider terminating pods still receiving traffic, probes that are too aggressive, slow startup, and application shutdown that does not drain work. 

**Stage 4  -  Trade-off:** Probe frequency/timeouts versus false positives and slow detection. 

**Stage 5  -  Production:** Correlate deployment events, pod lifecycle, readiness transitions, request errors, termination timing and application shutdown logs. 

**SDE-3 target:** Think about the entire pod lifecycle, not only the probe endpoint. 

#### Simulation 17  -  Spring MVC content negotiation and Jackson

 Source areas: Spring MVC, content negotiation and Jackson configuration. Interviewer: “The same controller returns different representations depending on the request. Explain.” 

**Stage 1  -  Mechanism:** Explain content negotiation and serialization/deserialization at a framework level. 

**Stage 2  -  Why:** Why is the Accept/content-type contract important? 

**Stage 3  -  Failure:** Discuss incompatible media types, serialization configuration, unexpected field exposure and client/server contract mismatch. 

**Stage 4  -  Trade-off:** Global Jackson configuration versus endpoint-specific behavior. 

**Stage 5  -  Production:** Verify request headers, negotiated media type, serialized payload, server configuration and contract tests. 

**SDE-3 target:** Trace the request from HTTP headers through handler selection to serialization. 

#### Simulation 18  -  Spring Data JPA repository abstraction

 Source areas: Spring Data repository implementation. Interviewer: “I only declared an interface. Where does the implementation come from?” 

**Stage 1  -  Mechanism:** Explain runtime proxy/repository infrastructure at a conceptual level. 

**Stage 2  -  Why:** What does the abstraction buy the team, and what does it hide? 

**Stage 3  -  Failure:** What happens when the generated query does not match the actual access pattern or causes excessive SQL? 

**Stage 4  -  Trade-off:** Repository abstraction versus explicit queries/DTOs/native SQL for complex workloads. 

**Stage 5  -  Production:** Validate generated SQL, query count, execution plans and transaction boundaries. 

**SDE-3 target:** Know when abstraction improves productivity and when the hidden behavior needs to become explicit. 

#### Simulation 19  -  Designing a real-time clickstream pipeline

 Source areas: full system-design walkthroughs, GCP clickstream analytics pipeline. Interviewer: “Design a real-time clickstream analytics pipeline.” 

**Stage 1  -  Mechanism:** Define producers, ingestion, durable messaging/storage, stream processing, serving/analytics and consumers. 

**Stage 2  -  Why:** Explain why each boundary exists and where buffering/decoupling is useful. 

**Stage 3  -  Failure:** Walk through duplicate events, consumer lag, malformed events, processor failure and downstream unavailability. 

**Stage 4  -  Trade-off:** Discuss latency versus cost, delivery semantics, retention, partitioning and replayability. 

**Stage 5  -  Production:** Define SLOs and evidence: ingestion rate, processing lag, end-to-end latency, error/dead-letter rate and data-quality signals. 

**SDE-3 target:** Start with requirements and guarantees before drawing boxes. 

#### Simulation 20  -  Multi-tenant data isolation

 Source areas: PostgreSQL row-level security and database/system-design material. Interviewer: “How do you guarantee tenant A cannot read tenant B data?” 

**Stage 1  -  Mechanism:** Define the tenant boundary and where enforcement occurs. 

**Stage 2  -  Why:** Why is application-only filtering potentially weaker than defense in depth? 

**Stage 3  -  Failure:** Consider missing predicates, incorrect tenant context, privileged paths, background jobs and SQL written outside the normal repository path. 

**Stage 4  -  Trade-off:** Compare application filtering, row-level security, separate schemas/databases and operational complexity. 

**Stage 5  -  Production:** Explain authorization tests, negative cross-tenant tests, audit evidence and monitoring for tenant-boundary violations. 

**SDE-3 target:** Treat tenant isolation as a security invariant that should be enforced and tested at multiple layers where appropriate. 

#### Simulation 21  -  System-design interviewer changes the scale

 Interviewer: “Your design works for 10,000 requests per second. Now make it work for 100,000.” 

**Stage 1  -  Mechanism:** Identify which components scale horizontally and which have hard limits. 

**Stage 2  -  Why:** Explain the bottleneck rather than multiplying every component by ten. 

**Stage 3  -  Failure:** Find the first saturation point: database, partition count, connection pool, queue, downstream dependency, hot key or single coordinator. 

**Stage 4  -  Trade-off:** Explain caching, partitioning, batching, asynchronous processing, replication or data-model changes and the consistency/cost consequences. 

**Stage 5  -  Production:** Define the capacity metric and load-test evidence needed to validate the new design. 

**SDE-3 target:** Scaling is a bottleneck-identification exercise, not a shopping list of infrastructure. 

#### Simulation 22  -  Production incident: latency spike

 Interviewer: “p99 latency went from 300 ms to 3 seconds after a release. What do you do?” 

**Stage 1  -  Mechanism:** Establish the request path and distinguish application, dependency and queueing latency. 

**Stage 2  -  Why:** Explain why p99 can move dramatically even when average latency looks acceptable. 

**Stage 3  -  Failure:** Consider downstream latency, thread/connection pool saturation, GC, lock contention, DB query regression and retries. 

**Stage 4  -  Trade-off:** Decide between rollback, mitigation, capacity increase or code/configuration change based on evidence. 

**Stage 5  -  Production:** Use traces, latency percentiles, saturation metrics, error/retry rates and deployment correlation. State what you would check first and why. 

**SDE-3 target:** Show a hypothesis-driven incident loop: observe → narrow → mitigate → verify → prevent recurrence. 

#### Simulation 23  -  Coding escalation: from correct to production-quality

 Interviewer: “Implement the coding problem.” 

**Stage 1  -  Mechanism:** Produce a correct solution and state time/space complexity. 

**Stage 2  -  Why:** Explain the data structure/algorithm choice and the invariant that makes it correct. 

**Stage 3  -  Failure:** Identify edge cases, invalid inputs if relevant, integer overflow risks, duplicate values, empty inputs and boundary conditions. 

**Stage 4  -  Trade-off:** Compare the chosen solution with a simpler/brute-force solution and explain when the simpler one could be acceptable. 

**Stage 5  -  Production:** Discuss readability, test strategy, observability if this were production code, and how you would benchmark or load-test it when performance matters. 

**SDE-3 target:** The interviewer should hear the reasoning before the code becomes a typing exercise. 

#### Simulation 24  -  Final architecture challenge: defend your decision

 Interviewer: “You proposed solution A. I think B is better. Convince me.” 

**Stage 1  -  Mechanism:** Restate the requirement and the mechanism of A. 

**Stage 2  -  Why:** State the assumptions under which A is preferable. 

**Stage 3  -  Failure:** Acknowledge where B is stronger and where A fails. 

**Stage 4  -  Trade-off:** Compare latency, consistency, availability, complexity, cost, operational burden and migration risk as relevant to the design. 

**Stage 5  -  Production:** Define the measurement that would make you reverse the decision. 

**SDE-3 target:** Do not defend a technology emotionally. Defend a decision with requirements, assumptions, trade-offs and measurable evidence. 

<a id="part-19-30-minute-sde-3-mock-interview-protocol"></a>
<a id="part-19"></a>
## Part 19 - 30-Minute SDE-3 Mock Interview Protocol

Use this for a daily timed drill. Keep expected answers hidden until the candidate has reasoned through the problem.

| Minutes | Exercise |
|---|---|
| 0-3 | Warm-up: answer one core Java question. Allow interruption after 30-60 seconds. |
| 3-10 | Technical escalation: choose Simulation 1-18 and work through all five stages. |
| 10-20 | System design: choose Simulation 19-21; clarify requirements before proposing an architecture. |
| 20-26 | Incident/debugging: use Simulation 22; prioritize hypotheses and the evidence needed to reject each. |
| 26-30 | Coding explanation: use Simulation 23; state the invariant, complexity and boundaries before coding. |

Score technical correctness, reasoning, failure-mode thinking, trade-offs, production verification and communication from 1 to 5 each. A practice target is 24/30, with focused revision where a dimension repeatedly scores below 4. This is a study rubric, not a hiring guarantee.

The spoken pattern is: how it works, why it exists, what breaks, the trade-off and how to verify the behavior.

<a id="part-20-interviewer-follow-up-rules"></a>
<a id="part-20"></a>
## Part 20 - Interviewer Follow-Up Rules

1. Let the candidate reason before revealing the expected answer.
2. Challenge assumptions and ask why; do not only test vocabulary.
3. Change one constraint at a time: traffic, failure, ordering, latency or dependencies.
4. Ask for evidence: how would the candidate verify the claim?
5. Ask about a credible alternative and when it would be better.
6. Reward explicit uncertainty about version/configuration-dependent behavior.
7. Stop when the candidate reaches a defensible decision; judgment matters more than endless trivia.

### What interview-ready should sound like

Start with a concise mechanism and design reason, then deepen the answer when challenged. A strong answer can explain failure modes, trade-offs and production evidence without inventing personal experience.

<a id="appendix-a"></a>
## Appendix A Complete producer-consumer implementation

One producer sends a separate end marker after all data. The owner observes task completion and cancels both tasks when either fails or the owner is interrupted. The data value 20 is no longer overloaded as a termination signal. Executor shutdown waits for cooperative tasks; a callback that ignores interruption can still prevent termination. This in-memory example provides no durability.

```java
import java.util.Objects;
import java.util.concurrent.*;
import java.util.function.IntConsumer;

/** One producer and one consumer; callbacks must cooperate with interruption. */
public final class ProducerConsumerDemo {
    private record Item(int value, boolean end) {}
    private static final Item END = new Item(0, true);

    public static void run(int count, IntConsumer consume)
            throws InterruptedException, ExecutionException {
        if (count < 0) throw new IllegalArgumentException("negative count");
        Objects.requireNonNull(consume, "consume");
        BlockingQueue<Item> queue = new ArrayBlockingQueue<>(10);
        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            CompletionService<Void> completion = new ExecutorCompletionService<>(executor);
            Future<Void> producer = completion.submit(() -> {
                for (int i = 0; i < count; i++) queue.put(new Item(i + 1, false));
                queue.put(END);
                return null;
            });
            Future<Void> consumer = completion.submit(() -> {
                while (true) {
                    Item item = queue.take();
                    if (item.end()) return null;
                    consume.accept(item.value());
                }
            });
            try {
                // Observe whichever task completes first, including early failure.
                completion.take().get();
                completion.take().get();
            } finally {
                // A failed or interrupted side must not strand its peer.
                producer.cancel(true);
                consumer.cancel(true);
            }
        }
    }

    public static void main(String[] args) throws Exception {
        run(20, value -> System.out.println("Consumed: " + value));
    }
}
```

[Java 21 BlockingQueue](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/BlockingQueue.html) and [ExecutorService lifecycle](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html).

<a id="validation"></a>
## Appendix B Review and validation notes

Reviewed 7 October 2026. Java baseline: Temurin/OpenJDK 21.0.9, without preview features.

- Recovered formatted text, tables, code fences and source links from the matching editable guide. Retained Q1-Q272, all 36 daily scenarios and all 24 simulations from v22. Rebuilt one consistent 20-part navigation and removed extraction-only overlays, duplicated generic coaching and stale cover metadata.
- Corrected the incomplete top-earners collector and TTL-cache extraction, made ranking deterministic with decimal salaries, repaired producer/consumer cancellation and pool shutdown, and added rate-limiter, retry, coin-change and partition-boundary validation.
- Corrected overstatements about PECS, exceptions, class loading, async execution, JWT revocation, records, API evolution, JVM memory and Kubernetes QoS. Qualified natural-ID mutability, local versus distributed transactions, savepoints, queue claims, materialized-view refresh and row-security bypass.
- `java code/InterviewAlgorithms.java`: **PASS - 3,116 checks**.
- `java code/WebInterviewPractice.java`: **PASS - 12,417 checks**.
- `javac --release 21`: **PASS - 58 extracted standalone snippet groups**, using imports, enclosing classes and simple node fixtures; the complete producer/consumer program and regression harness also compiled.
- `GuideRegressionTests`: **PASS - 3,288 checks**, including deterministic random algorithm comparisons, invalid inputs, monetary ranking ties, limiter clock boundaries, consumer failure/caller interruption, pool rejection and 100 submission/shutdown races. This samples concurrency behavior; it is not a proof of every possible interleaving.
- SQLite: **PASS - 17 assertions** for the exact excerpts in Q157, Q235-Q238, Q241, Q244, Q267 and Q271, including ties, duplicate days, NULLs, cycle protection, repeat upserts and duplicate cleanup. SQLite execution does not validate PostgreSQL-specific semantics.

The PDF is generated from this Markdown. Framework/JPA mappings, PostgreSQL locking/RLS, cloud deployments, Kubernetes and external integrations were not executed end to end. Source links support the explanations; product limits, defaults and support matrices still require verification for the deployed version. There is no zero-defect guarantee or claim that every fragment is a standalone program.

The `code` folder includes the two algorithm companions, the producer/consumer program, the extracted snippet harness, regression tests, portable SQL tests and a snippet index. From that folder, compile `GuideExamples.java`, `ProducerConsumerDemo.java` and `GuideRegressionTests.java` with `javac --release 21`, then run `java GuideRegressionTests`.

Run `python3 code/SqlRegressionTests.py` from the document folder to rerun the portable SQL checks.
