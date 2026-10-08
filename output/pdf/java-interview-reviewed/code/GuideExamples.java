import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.locks.*;
import java.util.concurrent.atomic.*;
import java.util.function.*;
import java.util.stream.*;
import java.time.*;
import java.math.*;
import java.lang.reflect.*;

public final class GuideExamples {
static class TreeNode { int val; TreeNode left, right; TreeNode(int val) { this.val=val; } }
static class ListNode { int val; ListNode next; ListNode(int val) { this.val=val; } }

static class S0 {
static class Singleton {
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
}

static class S1 {
static class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;
    LRUCache(int capacity) {
        super(Math.max(1, capacity), 0.75f, true);
        if (capacity < 1) throw new IllegalArgumentException("capacity must be positive");
        this.capacity = capacity;
    }
    @Override protected boolean removeEldestEntry(Map.Entry<K, V> e) { return size() > capacity; }
}
}

static class S2 {
static class TokenBucket {
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
}

static class S3 {
int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> idx = new HashMap<>(); int best = 0, left = 0;
    for (int r = 0; r < s.length(); r++) {
        Integer prev = idx.put(s.charAt(r), r);
        if (prev != null && prev >= left) left = prev + 1;
        best = Math.max(best, r - left + 1);
    }
    return best;
}
}

static class S4 {
static class OddEven {
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
}

static class S5 {
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
}

static class S6 {
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
}

static class S7 {
Collection<List<String>> groupAnagrams(String[] words) {
    return Arrays.stream(words).collect(Collectors.groupingBy(w -> {
        char[] c = w.toCharArray(); Arrays.sort(c); return new String(c); })).values();
}
}

static class S8 {
sealed interface Result<T> permits Success, Failure {}
record Success<T>(T value) implements Result<T> {}
record Failure<T>(String error) implements Result<T> {}

static <T> String describe(Result<T> r) {
    return switch (r) {
        case Success<T> s -> "OK: " + s.value();
        case Failure<T> f -> "ERR: " + f.error();   // no default needed: compiler checks exhaustiveness
    };
}
}

static class S9 {
int[][] merge(int[][] in) {
    Arrays.sort(in, Comparator.comparingInt(a -> a[0]));
    List<int[]> out = new ArrayList<>();
    for (int[] cur : in) {
        if (out.isEmpty() || out.get(out.size() - 1)[1] < cur[0]) out.add(cur);
        else out.get(out.size() - 1)[1] = Math.max(out.get(out.size() - 1)[1], cur[1]);
    }
    return out.toArray(new int[0][]);
}
}

static class S10 {
static class BoundedQueue<T> {
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
}

static class S11 {
static class SlidingWindowLimiter {
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
}

static class S12 {
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
}

static class S13 {
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
}

static class S14 {
int kthLargest(int[] nums, int k) {
    if (k < 1 || k > nums.length) throw new IllegalArgumentException("invalid k");
    PriorityQueue<Integer> minHeap = new PriorityQueue<>(k);
    for (int n : nums) { minHeap.offer(n); if (minHeap.size() > k) minHeap.poll(); }
    return minHeap.peek();                                       // O(n log k), O(k) space
}
}

static class S15 {
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
}

static class S16 {
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
}

static class S17 {
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
}

static class S18 {
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
}

static class S19 {
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
}

static class S20 {
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
}

static class S21 {
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
}

static class S22 {
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
}

static class S23 {
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
}

static class S24 {
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
}

static class S25 {
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
}

static class S26 {
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
}

static class S27 {
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
}

static class S28 {
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
}

static class S29 {
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
}

static class S30 {
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
}

static class S31 {
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
}

static class S32 {
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
}

static class S33 {
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
}

static class S34 {
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
}

static class S35 {
static class TtlCache<K, V> {
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
}

static class S36 {
static class MiniPool implements AutoCloseable {
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
}

static class S37 {
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
}

static class S38 {
static class MiniContainer {
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
}

static class S39 {
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
}

static class S40 {
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
}

static class S41 {
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
}

static class S42 {
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
}

static class S43 {
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
}

static class S44 {
TreeNode lca(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;
    TreeNode left = lca(root.left, p, q), right = lca(root.right, p, q);
    return (left != null && right != null) ? root : (left != null ? left : right);
}
}

static class S45 {
static class TimeMap {
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
}

static class S46 {
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
}

static class S47 {
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
}

static class S48 {
int longestCommonSubsequence(String a, String b) {
    int[][] dp = new int[a.length() + 1][b.length() + 1];
    for (int i = 1; i <= a.length(); i++)
        for (int j = 1; j <= b.length(); j++)
            dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
                    ? dp[i - 1][j - 1] + 1
                    : Math.max(dp[i - 1][j], dp[i][j - 1]);
    return dp[a.length()][b.length()];
}
}

static class S49 {
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
}

static class S50 {
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
}

static class S51 {
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
}

static class S52 {
record DeliveryPlan(List<String> stops) {
    DeliveryPlan {
        stops = List.copyOf(stops);
    }
}
}

static class S53 {
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
}

static class S54 {
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
}

static class S55 {
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
}

static class S56 {
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
}

static class Ranking {
record Employee(long id, String name, String dept, java.math.BigDecimal salary) {}
static Map<String,List<Employee>> top3(List<Employee> employees) {

// Three people per department; unique employee ID breaks equal-salary ties.
Map<String, List<Employee>> top3 = employees.stream()
    .collect(Collectors.groupingBy(Employee::dept,
        Collectors.collectingAndThen(Collectors.toList(), group -> group.stream()
            .sorted(Comparator.comparing(Employee::salary).reversed()
                .thenComparingLong(Employee::id))
            .limit(3).toList())));
return top3;
}
}
}
