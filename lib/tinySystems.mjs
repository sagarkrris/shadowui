// Small, single-threaded teaching systems. Tests execute only trusted reference code locally.
export const TINY_SYSTEMS = [
  {
    slug: 'retry-scheduler', title: 'Build a retry scheduler', minutes: 35,
    article: '/tech-blogs/request-timed-out-did-payment-happen',
    description: 'Schedule due work, bound retries, and distinguish redelivery from a second effect.',
    scope: 'Virtual time, one process, no threads or network. The queue and deduplication set are in memory; a restart loses them. This is not durable delivery or atomic coordination with an external effect.',
    related: '/detective/the-service-that-drowned-in-retries',
    source: 'https://docs.oracle.com/javase/8/docs/api/java/util/PriorityQueue.html',
    fields: `static final class Task {
        final String id; final long due; final int attempt;
        Task(String id, long due, int attempt) { this.id = id; this.due = due; this.attempt = attempt; }
    }
    final PriorityQueue<Task> queue = new PriorityQueue<>(Comparator.comparingLong(t -> t.due));
    final Set<String> effects = new HashSet<>();
    void submit(String id, long due) { queue.add(new Task(Objects.requireNonNull(id), due, 1)); }`,
    chapters: [
      { title: 'Run only due work', requirement: 'Return and remove the earliest task only when its due time is at most now. Empty or future-only queues return null; ties have no guaranteed order.', limitation: 'A transient failure currently loses its task after polling.', signature: 'Task pollDue(long now)', solution: 'return queue.isEmpty() || queue.peek().due > now ? null : queue.poll();', test: `Main scheduler = new Main();
        check(scheduler.pollDue(0) == null, "empty queue");
        scheduler.submit("late", 20); scheduler.submit("early", 10);
        check(scheduler.pollDue(9) == null, "future work stays queued");
        check(scheduler.pollDue(10).id.equals("early"), "earliest due first");
        check(scheduler.pollDue(20).id.equals("late"), "remaining task");` },
      { title: 'Bound the retries', requirement: 'Retry at most three total attempts. After attempt 1 delay by 10 ticks; after attempt 2 delay by 20 ticks. Return false after attempt 3. Reject arithmetic overflow instead of scheduling in the past.', limitation: 'A task may execute its effect and then lose the acknowledgement. Retrying can repeat the effect.', signature: 'boolean retry(Task task, long now)', solution: `if (task.attempt >= 3) return false;
        long due = Math.addExact(now, 10L * task.attempt);
        queue.add(new Task(task.id, due, task.attempt + 1));
        return true;`, test: `Main retrying = new Main(); retrying.submit("job", 0);
        Task first = retrying.pollDue(0);
        check(retrying.retry(first, 0), "first retry accepted");
        check(retrying.pollDue(9) == null, "backoff respected");
        Task second = retrying.pollDue(10);
        check(second.attempt == 2 && retrying.retry(second, 10), "second retry");
        check(retrying.pollDue(29) == null, "second backoff respected");
        Task third = retrying.pollDue(30);
        check(third.attempt == 3 && !retrying.retry(third, 30), "attempt cap");
        check(retrying.queue.isEmpty(), "no infinite retries");
        try { retrying.retry(first, Long.MAX_VALUE); throw new AssertionError("overflow"); }
        catch (ArithmeticException expected) { }` },
      { title: 'Recognize a repeated effect', requirement: 'Model an effect by adding its stable task ID to a set. Return true once per ID and false for duplicates. Explain why this in-memory operation cannot protect a real remote payment.', limitation: 'No persistent idempotency ledger, jitter, admission limit, cancellation, or atomic external-effect boundary. The queue and ID set need bounded retention in production.', signature: 'boolean applyEffect(Task task)', solution: 'return effects.add(task.id);', test: `Main worker = new Main();
        check(worker.applyEffect(new Task("same", 0, 1)), "first effect");
        check(!worker.applyEffect(new Task("same", 10, 2)), "duplicate suppressed");
        check(worker.applyEffect(new Task("different", 0, 1)), "different identity");
        check(new Main().applyEffect(new Task("same", 0, 1)), "restart loses deduplication");` },
    ],
  },
  {
    slug: 'inverted-index', title: 'Build an inverted index', minutes: 30,
    description: 'Turn documents into postings, intersect queries, and repair stale search results.',
    scope: 'In-memory, single-threaded, ASCII word tokenizer. No ranking, phrases, language analysis, persistence, or concurrent updates.',
    related: '/java/hashmap-internals', source: 'https://docs.oracle.com/javase/8/docs/api/java/util/Set.html',
    fields: `final Map<String, Set<Integer>> postings = new HashMap<>();
    static Set<String> terms(String text) {
        Set<String> result = new HashSet<>();
        for (String term : Objects.requireNonNull(text).toLowerCase(Locale.ROOT).split("[^a-z0-9]+"))
            if (!term.isEmpty()) result.add(term);
        return result;
    }`,
    chapters: [
      { title: 'Index document terms', requirement: 'Add the document ID to a posting set for every normalized term. Repeated words must not duplicate the ID. This first operation only adds terms; replacement comes later.', limitation: 'A single-term lookup cannot express a query requiring multiple words.', signature: 'void add(int id, String text)', solution: 'for (String term : terms(text)) postings.computeIfAbsent(term, key -> new HashSet<>()).add(id);', test: `Main index = new Main(); index.add(1, "Java JAVA maps"); index.add(2, "Java threads");
        check(index.postings.get("java").size() == 2, "deduplicated document IDs");
        check(index.postings.get("maps").contains(1), "term posting");
        index.add(3, "   "); check(index.postings.size() == 3, "no empty tokens");` },
      { title: 'Intersect a query', requirement: 'Return IDs containing every query term. An empty query returns an empty set. Return a copy so callers cannot mutate the index.', limitation: 'Editing a document leaves its old terms searchable.', signature: 'Set<Integer> search(String query)', solution: `Set<Integer> result = null;
        for (String term : terms(query)) {
            Set<Integer> ids = postings.getOrDefault(term, Collections.emptySet());
            if (result == null) result = new HashSet<>(ids); else result.retainAll(ids);
        }
        return result == null ? new HashSet<>() : result;`, test: `Main search = new Main(); search.add(1, "java maps"); search.add(2, "java threads");
        check(search.search("JAVA maps").equals(Collections.singleton(1)), "AND query");
        check(search.search("java absent").isEmpty(), "unknown term");
        check(search.search("").isEmpty(), "empty query");
        search.search("java").clear(); check(search.search("java").size() == 2, "defensive result");` },
      { title: 'Replace a document', requirement: 'Remove the ID from all old postings, remove empty posting sets, then index the replacement. Reject null before mutating existing postings.', limitation: 'Replacement scans every vocabulary term. A reverse document-to-terms map could narrow the removal work, at the cost of another index to maintain.', signature: 'void replace(int id, String text)', solution: `Objects.requireNonNull(text);
        Iterator<Set<Integer>> iterator = postings.values().iterator();
        while (iterator.hasNext()) {
            Set<Integer> ids = iterator.next(); ids.remove(id);
            if (ids.isEmpty()) iterator.remove();
        }
        add(id, text);`, test: `Main editing = new Main(); editing.add(1, "old shared"); editing.add(2, "shared");
        editing.replace(1, "new");
        check(editing.search("old").isEmpty(), "stale term removed");
        check(editing.search("shared").equals(Collections.singleton(2)), "other document preserved");
        check(editing.search("new").contains(1), "new term searchable");
        try { editing.replace(1, null); throw new AssertionError("null accepted"); }
        catch (NullPointerException expected) { }
        check(editing.search("new").contains(1), "invalid update preserved old document");` },
    ],
  },
  {
    slug: 'connection-pool', title: 'Build a connection pool model', minutes: 35,
    article: '/tech-blogs/connection-pool-full-is-database-slow',
    description: 'Bound resource ownership, reject invalid returns, and release a lease when work fails.',
    scope: 'Integer resource IDs model connections. Single-threaded and non-blocking; no JDBC, real sockets, wait queue, fairness, health checking, or concurrent safety.',
    related: '/symptoms/low-cpu-slow-requests', source: 'https://docs.oracle.com/javase/8/docs/api/java/lang/AutoCloseable.html',
    fields: `static final class Lease {
        final Main owner; final int resource;
        Lease(Main owner, int resource) { this.owner = owner; this.resource = resource; }
    }
    final Deque<Integer> available = new ArrayDeque<>(Arrays.asList(1, 2));
    final Set<Lease> borrowed = new HashSet<>();`,
    chapters: [
      { title: 'Enforce capacity', requirement: 'Acquire one of two resources and record its lease identity. Exhaustion throws IllegalStateException immediately.', limitation: 'Resources are exhausted permanently until a return operation exists.', signature: 'Lease acquire()', solution: `if (available.isEmpty()) throw new IllegalStateException("Pool exhausted");
        Lease lease = new Lease(this, available.removeFirst()); borrowed.add(lease); return lease;`, test: `Main pool = new Main(); Lease a = pool.acquire(); Lease b = pool.acquire();
        check(a.resource != b.resource, "exclusive resource ownership");
        try { pool.acquire(); throw new AssertionError("unbounded capacity"); }
        catch (IllegalStateException expected) { }
        check(pool.borrowed.size() == 2, "two outstanding leases");` },
      { title: 'Validate returns', requirement: 'Return only a lease issued by this pool that is still borrowed. Reject null, a foreign lease, and a second return without changing capacity.', limitation: 'A caller can throw before returning its resource, leaking capacity.', signature: 'void release(Lease lease)', solution: `if (lease == null || lease.owner != this || !borrowed.remove(lease))
            throw new IllegalArgumentException("Unknown or already returned lease");
        available.addLast(lease.resource);`, test: `Main returning = new Main(); Lease lease = returning.acquire(); returning.release(lease);
        check(returning.available.size() == 2, "capacity restored");
        try { returning.release(lease); throw new AssertionError("double return"); }
        catch (IllegalArgumentException expected) { }
        Main other = new Main(); Lease foreign = other.acquire();
        try { returning.release(foreign); throw new AssertionError("foreign lease"); }
        catch (IllegalArgumentException expected) { }
        check(returning.available.size() == 2 && other.borrowed.size() == 1, "ownership preserved");` },
      { title: 'Release after failure', requirement: 'Acquire, invoke a Consumer with the resource ID, and release in finally. Preserve the work exception. Validate a null callback before borrowing.', limitation: 'This models ownership only. A real pool needs an explicit lease API (often AutoCloseable), broken-connection disposal, timeouts, cancellation, and synchronized state.', signature: 'void withResource(java.util.function.Consumer<Integer> work)', solution: `Objects.requireNonNull(work);
        Lease lease = acquire();
        try { work.accept(lease.resource); } finally { release(lease); }`, test: `Main guarded = new Main();
        try { guarded.withResource(id -> { throw new IllegalStateException("work failed"); }); throw new AssertionError("exception lost"); }
        catch (IllegalStateException expected) { check(expected.getMessage().equals("work failed"), "original failure"); }
        check(guarded.available.size() == 2 && guarded.borrowed.isEmpty(), "released after failure");
        guarded.withResource(id -> check(id > 0, "usable resource"));
        check(guarded.available.size() == 2, "released after success");` },
    ],
  },
  {
    slug: 'write-ahead-log', title: 'Build a write-ahead log model', minutes: 35,
    article: '/tech-blogs/database-committed-what-survives-crash',
    description: 'Record changes before applying them, recover committed work, and make replay repeatable.',
    scope: 'An in-memory log models ordering and recovery only. It does not survive a real process or machine crash. No disk flush, checksums, torn-record detection, concurrent transactions, or production durability.',
    related: '/time-machine/database-decisions', source: 'https://www.postgresql.org/docs/current/wal-intro.html',
    fields: `static final class Entry {
        final String key; final int value; boolean committed;
        Entry(String key, int value) { this.key = key; this.value = value; }
    }
    final List<Entry> log = new ArrayList<>();
    final Map<String, Integer> state = new HashMap<>();`,
    chapters: [
      { title: 'Record before applying', requirement: 'Append a key/value assignment to the log without updating state. Return its position. Reject a null key before appending.', limitation: 'The log cannot yet distinguish an intended write from an acknowledged commit.', signature: 'int append(String key, int value)', solution: 'log.add(new Entry(Objects.requireNonNull(key), value)); return log.size() - 1;', test: `Main database = new Main();
        check(database.append("balance", 10) == 0, "first log position");
        check(database.log.size() == 1 && database.state.isEmpty(), "log precedes state");
        try { database.append(null, 2); throw new AssertionError("null key"); }
        catch (NullPointerException expected) { }
        check(database.log.size() == 1, "invalid append is not recorded");` },
      { title: 'Commit an assignment', requirement: 'Mark the selected entry committed before applying its assignment to state. A second commit of the same entry is a no-op. Commits must follow append order; reject a commit behind a newer committed entry.', limitation: 'A crash after the commit marker but before state application leaves acknowledged work missing from the materialized view.', signature: 'void commit(int position)', solution: `Entry entry = log.get(position);
        if (entry.committed) return;
        for (int i = position + 1; i < log.size(); i++)
            if (log.get(i).committed) throw new IllegalStateException("Out-of-order commit");
        entry.committed = true; state.put(entry.key, entry.value);`, test: `Main committing = new Main(); int position = committing.append("balance", 10);
        committing.commit(position); committing.commit(position);
        check(committing.state.get("balance") == 10 && committing.log.get(position).committed, "committed assignment");
        Main order = new Main(); order.append("x", 1); order.append("x", 2); order.commit(1);
        try { order.commit(0); throw new AssertionError("out of order"); } catch (IllegalStateException expected) { }
        check(order.state.get("x") == 2, "newer assignment preserved");` },
      { title: 'Recover committed work', requirement: 'Rebuild state from committed entries in log order. Ignore uncommitted entries. Repeated recovery must produce the same result because entries assign values rather than increment them.', limitation: 'The committed flag is an object field, not a durable commit record. Real WAL requires persistent ordering, flush semantics, record validation, and a recovery protocol appropriate to its storage design.', signature: 'void recover()', solution: 'state.clear(); for (Entry entry : log) if (entry.committed) state.put(entry.key, entry.value);', test: `Main recovery = new Main(); recovery.append("x", 1); recovery.commit(0);
        recovery.append("x", 2); recovery.log.get(1).committed = true; // crash before applying
        recovery.append("abandoned", 9);
        recovery.state.clear(); recovery.recover();
        check(recovery.state.get("x") == 2 && !recovery.state.containsKey("abandoned"), "committed prefix replay");
        Map<String, Integer> firstRecovery = new HashMap<>(recovery.state); recovery.recover();
        check(recovery.state.equals(firstRecovery), "repeatable replay");` },
    ],
  },
];

export function systemExercise(project, stage, solution = false) {
  if (!project || !Number.isInteger(stage) || !project.chapters[stage]) throw new Error('Unknown chapter');
  const methods = project.chapters.map((chapter, index) => `    ${chapter.signature} {\n        ${index < stage || (index === stage && solution) ? chapter.solution : 'throw new UnsupportedOperationException("Implement chapter ' + (index + 1) + '");'}\n    }`).join('\n');
  return `// ${project.title}. Java 8+. Teaching model, not a production implementation.\nimport java.util.*;\npublic class Main {\n    ${project.fields}\n${methods}\n    static void check(boolean condition, String message) { if (!condition) throw new AssertionError(message); }\n    public static void main(String[] args) {\n        ${project.chapters.slice(0, stage + 1).map(chapter => chapter.test).join('\n        ')}\n        System.out.println("Chapter ${stage + 1}: all checks passed");\n    }\n}\n`;
}

export function normalizeSystemDrafts(value) {
  const result = {};
  for (let stage = 0; stage < 3; stage++) {
    const item = value?.[stage];
    if (item && typeof item.code === 'string') result[stage] = {
      code: item.code.slice(0, 30000),
      testedSource: typeof item.testedSource === 'string' && item.code.length <= 30000 && item.testedSource === item.code ? item.testedSource : null,
    };
  }
  return result;
}
